import { log } from "@/lib/utils";
import { POI_CATEGORIES, MIN_POIS_PER_CATEGORY, classifyChurch, type PoiCategory, type PoiValidationResult } from "@/lib/poi-categories";
import { motorwayOverpassClause } from "@/server/motorway-filter";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

const FETCH_TIMEOUT_MS = 30000;
const HEDGE_DELAY_MS = 2500;

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

async function readBodyExcerpt(response: Response): Promise<string> {
  try {
    const body = await response.text();
    return body.slice(0, 300).replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

async function queryOneEndpoint(
  endpoint: string,
  query: string,
  timeoutMs: number,
  signal: AbortSignal,
): Promise<OverpassResponse> {
  const startTime = Date.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "oscillation-game/1.0 (https://github.com/nbarrett/oscillation)",
      "Accept": "application/json",
    },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
  });

  const elapsed = Date.now() - startTime;

  if (!response.ok) {
    const bodyExcerpt = await readBodyExcerpt(response);
    const server = response.headers.get("server");
    const retryAfter = response.headers.get("retry-after");
    const msg = `HTTP ${response.status} ${response.statusText}${server ? ` (server=${server})` : ""}${retryAfter ? ` retry-after=${retryAfter}` : ""}${bodyExcerpt ? ` — ${bodyExcerpt}` : ""}`;
    log.warn(`Overpass: ${endpoint} failed after ${elapsed}ms — ${msg}`);
    throw new Error(msg);
  }

  const text = await response.text();
  if (text.trimStart().startsWith("<")) {
    const xmlExcerpt = text.slice(0, 300).replace(/\s+/g, " ").trim();
    log.warn(`Overpass: ${endpoint} returned XML after ${elapsed}ms — ${xmlExcerpt}`);
    throw new Error(`XML response: ${xmlExcerpt}`);
  }

  const parsed = JSON.parse(text) as OverpassResponse;
  log.debug(`Overpass: ${endpoint} success after ${elapsed}ms — ${parsed.elements.length} elements`);
  return parsed;
}

export async function queryOverpass(query: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<OverpassResponse> {
  const queryPreview = query.slice(0, 120).replace(/\s+/g, " ");
  log.debug(`Overpass: hedged race across ${OVERPASS_ENDPOINTS.length} endpoints (timeout=${timeoutMs}ms, hedgeDelay=${HEDGE_DELAY_MS}ms, query=${queryPreview}...)`);

  const sharedController = new AbortController();
  const startedAt = Date.now();

  const attempts = OVERPASS_ENDPOINTS.map(async (endpoint, idx) => {
    if (idx > 0) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, idx * HEDGE_DELAY_MS);
        sharedController.signal.addEventListener("abort", () => {
          clearTimeout(timer);
          resolve();
        }, { once: true });
      });
      if (sharedController.signal.aborted) throw new Error("aborted (winner already found)");
      log.debug(`Overpass: hedge fire +${idx * HEDGE_DELAY_MS}ms → ${endpoint}`);
    } else {
      log.debug(`Overpass: hedge fire +0ms → ${endpoint}`);
    }
    return queryOneEndpoint(endpoint, query, timeoutMs, sharedController.signal);
  });

  try {
    const result = await Promise.any(attempts);
    const totalElapsed = Date.now() - startedAt;
    log.debug(`Overpass: race won in ${totalElapsed}ms — cancelling remaining attempts`);
    sharedController.abort();
    return result;
  } catch (err) {
    sharedController.abort();
    const errors = err instanceof AggregateError
      ? err.errors.map((e, i) => `${OVERPASS_ENDPOINTS[i]}: ${e instanceof Error ? e.message : String(e)}`)
      : [err instanceof Error ? err.message : String(err)];
    const summary = errors.join(" | ");
    log.error(`Overpass: all ${OVERPASS_ENDPOINTS.length} endpoints failed — ${summary}`);
    throw new Error(summary);
  }
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
    "[out:json][timeout:45];",
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
    ");",
    "out center tags;",
  ].join("");
}

function buildValidationQuery(bbox: string): string {
  return [
    `[out:json][timeout:25];`,
    `(`,
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
    `way["highway"~"^(motorway|motorway_link)$"](${bbox});`,
    `way["railway"="rail"](${bbox});`,
    `);`,
    `out tags;`,
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

  const data = await queryOverpass(buildValidationQuery(bbox), 35_000);

  const counts: Record<PoiCategory, number> = { pub: 0, spire: 0, tower: 0, phone: 0, school: 0 };
  let hasMotorway = false;
  let hasRailway = false;

  for (const el of data.elements) {
    const tags = el.tags ?? {};
    if (tags["highway"] === "motorway" || tags["highway"] === "motorway_link") {
      hasMotorway = true;
      continue;
    }
    if (tags["railway"] === "rail") {
      hasRailway = true;
      continue;
    }
    const category = classifyElement(tags, el.id);
    if (category) counts[category]++;
  }

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

export function prewarmPoiCandidates(
  south: number,
  west: number,
  north: number,
  east: number,
): void {
  const bbox = `${south},${west},${north},${east}`;
  const cached = poiCandidateCache.get(bbox);
  if (cached && cached.expiresAt > Date.now()) {
    log.debug("POI prewarm: cache already warm for", bbox);
    return;
  }
  log.info("POI prewarm: fetching candidates in background for", bbox);
  fetchPoiCandidates(south, west, north, east).catch((err) => {
    log.warn("POI prewarm: background fetch failed —", err instanceof Error ? err.message : String(err));
  });
}
