import { log } from "@/lib/utils";
import { POI_CATEGORIES, MIN_POIS_PER_CATEGORY, classifyChurch, type PoiCategory, type PoiValidationResult } from "@/lib/poi-categories";
import { MOTORWAY_PROXIMITY_METRES, motorwayOverpassClause } from "@/server/motorway-filter";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

const MAX_RETRIES = 4;
const RETRY_BASE_MS = 1000;
const FETCH_TIMEOUT_MS = 45000;

const poiCache = new Map<string, { result: PoiValidationResult; expiresAt: number }>();
const POI_CACHE_TTL_MS = 10 * 60 * 1000;

export interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  geometry?: { lat: number; lon: number }[];
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

export async function queryOverpass(query: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<OverpassResponse> {
  let lastError: Error | null = null;

  const queryPreview = query.slice(0, 120).replace(/\s+/g, " ");
  log.debug(`Overpass: starting request (timeout=${timeoutMs}ms, maxRetries=${MAX_RETRIES}, query=${queryPreview}...)`);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length]!;

    if (attempt > 0) {
      const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      log.debug(`Overpass: retry ${attempt}/${MAX_RETRIES - 1} after ${delay}ms (using ${endpoint})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } else {
      log.debug(`Overpass: attempt ${attempt + 1}/${MAX_RETRIES} → ${endpoint}`);
    }

    const startTime = Date.now();
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(timeoutMs),
      });

      const elapsed = Date.now() - startTime;

      if (response.status === 429 || response.status === 504) {
        lastError = new Error(`Overpass API ${response.status}: ${response.statusText}`);
        log.warn(`Overpass: attempt ${attempt + 1} failed — HTTP ${response.status} after ${elapsed}ms (${endpoint})`);
        continue;
      }

      if (!response.ok) {
        log.warn(`Overpass: attempt ${attempt + 1} failed — HTTP ${response.status} after ${elapsed}ms (${endpoint})`);
        throw new Error(`Overpass API error: ${response.statusText}`);
      }

      const text = await response.text();
      if (text.trimStart().startsWith("<")) {
        lastError = new Error("Overpass API returned XML instead of JSON");
        log.warn(`Overpass: attempt ${attempt + 1} failed — got XML response after ${elapsed}ms (${endpoint})`);
        continue;
      }

      const parsed = JSON.parse(text) as OverpassResponse;
      log.debug(`Overpass: success after ${elapsed}ms — ${parsed.elements.length} elements (${endpoint})`);
      return parsed;
    } catch (err) {
      const elapsed = Date.now() - startTime;
      lastError = err instanceof Error ? err : new Error(String(err));
      log.warn(`Overpass: attempt ${attempt + 1} failed — ${lastError.message} after ${elapsed}ms (${endpoint})`);
      if (err instanceof TypeError || (err as { code?: string }).code === "ECONNREFUSED" || err instanceof DOMException) {
        continue;
      }
      if (attempt < MAX_RETRIES - 1 && lastError.message.includes("Overpass API")) {
        continue;
      }
      throw lastError;
    }
  }

  log.error(`Overpass: all ${MAX_RETRIES} attempts exhausted — ${lastError?.message}`);
  throw lastError ?? new Error("Overpass API: all retries exhausted");
}

function classifyElement(tags: Record<string, string>, elementId: number): PoiCategory | null {
  if (tags["amenity"] === "pub") return "pub";
  if (tags["amenity"] === "place_of_worship" && tags["religion"] === "christian") {
    return classifyChurch(tags, elementId);
  }
  if (tags["building"] === "cathedral") return "spire";
  if (tags["amenity"] === "telephone" || tags["emergency"] === "phone") return "phone";
  if (tags["amenity"] === "school" || tags["amenity"] === "college") return "school";
  return null;
}

export interface PoiCandidate {
  category: PoiCategory;
  osmId: number;
  name: string | null;
  lat: number;
  lng: number;
}

function buildCombinedQuery(bbox: string): string {
  return [
    "[out:json][timeout:30];",
    `(${motorwayOverpassClause(bbox)})->.motorways;`,
    "(",
    `node["amenity"="pub"](${bbox});`,
    `node["amenity"="place_of_worship"]["religion"="christian"](${bbox});`,
    `way["amenity"="place_of_worship"]["religion"="christian"](${bbox});`,
    `way["building"="cathedral"](${bbox});`,
    `node["amenity"="telephone"](${bbox});`,
    `node["emergency"="phone"](${bbox});`,
    `node["amenity"="school"](${bbox});`,
    `way["amenity"="school"](${bbox});`,
    `node["amenity"="college"](${bbox});`,
    `way["amenity"="college"](${bbox});`,
    ")->.allpois;",
    `node.allpois(around.motorways:${MOTORWAY_PROXIMITY_METRES})->.nearmw;`,
    `way.allpois(around.motorways:${MOTORWAY_PROXIMITY_METRES})->.nearmw_w;`,
    "(.allpois; - .nearmw; - .nearmw_w;);",
    "out center tags;",
  ].join("");
}

/**
 * Count-only validation query using named sets.
 * Returns 6 count elements (pubs, churches, phones, schools, motorways, railways)
 * instead of hundreds of full elements — dramatically faster.
 */
function buildValidationQuery(bbox: string): string {
  return [
    `[out:json][timeout:10];`,
    `node["amenity"="pub"](${bbox})->.pubs;`,
    `.pubs out count;`,
    `(`,
    `node["amenity"="place_of_worship"]["religion"="christian"](${bbox});`,
    `way["amenity"="place_of_worship"]["religion"="christian"](${bbox});`,
    `way["building"="cathedral"](${bbox});`,
    `)->.churches;`,
    `.churches out count;`,
    `(`,
    `node["amenity"="telephone"](${bbox});`,
    `node["emergency"="phone"](${bbox});`,
    `)->.phones;`,
    `.phones out count;`,
    `(`,
    `node["amenity"="school"](${bbox});`,
    `way["amenity"="school"](${bbox});`,
    `node["amenity"="college"](${bbox});`,
    `way["amenity"="college"](${bbox});`,
    `)->.schools;`,
    `.schools out count;`,
    `${motorwayOverpassClause(bbox).replace(/;$/, "")}->.motors;`,
    `.motors out count;`,
    `way["railway"="rail"](${bbox})->.rails;`,
    `.rails out count;`,
  ].join("");
}

interface ClassifyResult {
  counts: Record<PoiCategory, number>;
  candidates: PoiCandidate[];
  hasMotorway: boolean;
  hasRailway: boolean;
}

function classifyElements(data: OverpassResponse): ClassifyResult {
  const counts: Record<PoiCategory, number> = { pub: 0, spire: 0, tower: 0, phone: 0, school: 0 };
  const candidates: PoiCandidate[] = [];

  for (const el of data.elements) {
    const category = classifyElement(el.tags ?? {}, el.id);
    if (!category) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;
    counts[category]++;
    candidates.push({
      category,
      osmId: el.id,
      name: el.tags?.["name"] ?? null,
      lat,
      lng,
    });
  }

  return { counts, candidates, hasMotorway: false, hasRailway: false };
}

export async function validatePoiCoverage(
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<PoiValidationResult> {
  const bbox = `${south},${west},${north},${east}`;

  const cached = poiCache.get(bbox);
  if (cached && cached.expiresAt > Date.now()) {
    log.debug("POI validation (cached):", cached.result.counts);
    return cached.result;
  }

  // Count-only query: returns 6 count elements (pubs, churches, phones, schools, motorways, railways)
  const data = await queryOverpass(buildValidationQuery(bbox), 25_000);
  const countElements = data.elements.filter((el) => el.type === "count");
  const getCount = (idx: number) => parseInt(countElements[idx]?.tags?.["total"] ?? "0", 10);

  const pubCount = getCount(0);
  const churchCount = getCount(1);
  const phoneCount = getCount(2);
  const schoolCount = getCount(3);
  const motorwayCount = getCount(4);
  const railwayCount = getCount(5);

  // Split churches ~50/50 into spire/tower (matches classifyChurch fallback behaviour)
  const counts: Record<PoiCategory, number> = {
    pub: pubCount,
    spire: Math.ceil(churchCount / 2),
    tower: Math.floor(churchCount / 2),
    phone: phoneCount,
    school: schoolCount,
  };
  const hasMotorway = motorwayCount > 0;
  const hasRailway = railwayCount > 0;

  const missing = POI_CATEGORIES.filter((cat) => counts[cat] === 0);
  const insufficient = POI_CATEGORIES.filter((cat) => counts[cat] > 0 && counts[cat] < MIN_POIS_PER_CATEGORY);

  log.debug("POI validation:", counts, "missing:", missing, "insufficient:", insufficient, "motorway:", hasMotorway, "railway:", hasRailway);

  const result: PoiValidationResult = {
    valid: missing.length === 0 && insufficient.length === 0 && hasMotorway && hasRailway,
    counts,
    missing,
    insufficient,
    hasMotorway,
    hasRailway,
  };
  poiCache.set(bbox, { result, expiresAt: Date.now() + POI_CACHE_TTL_MS });

  return result;
}

const poiCandidateCache = new Map<string, { candidates: PoiCandidate[]; expiresAt: number }>();

export async function fetchPoiCandidates(
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<PoiCandidate[]> {
  const bbox = `${south},${west},${north},${east}`;

  const cached = poiCandidateCache.get(bbox);
  if (cached && cached.expiresAt > Date.now()) {
    log.debug("POI candidates (cached):", cached.candidates.length);
    return cached.candidates;
  }

  const data = await queryOverpass(buildCombinedQuery(bbox));
  const { candidates } = classifyElements(data);

  log.debug("POI candidates fetched:", candidates.length);
  poiCandidateCache.set(bbox, { candidates, expiresAt: Date.now() + POI_CACHE_TTL_MS });

  return candidates;
}
