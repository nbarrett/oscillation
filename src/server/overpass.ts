import { log } from "@/lib/utils";
import { POI_CATEGORIES, MIN_POIS_PER_CATEGORY, classifyChurch, type PoiCategory, type PoiValidationResult } from "@/lib/poi-categories";
import { isNearMotorway, motorwayOverpassClause } from "@/server/motorway-filter";

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;
const FETCH_TIMEOUT_MS = 10000;

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

export async function queryOverpass(query: string): Promise<OverpassResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length]!;

    if (attempt > 0) {
      const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
      log.debug(`Overpass: retry ${attempt} after ${delay}ms (using ${endpoint})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (response.status === 429 || response.status === 504) {
        lastError = new Error(`Overpass API ${response.status}: ${response.statusText}`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.statusText}`);
      }

      const text = await response.text();
      if (text.trimStart().startsWith("<")) {
        lastError = new Error("Overpass API returned XML instead of JSON");
        continue;
      }

      return JSON.parse(text) as OverpassResponse;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (err instanceof TypeError || (err as { code?: string }).code === "ECONNREFUSED" || err instanceof DOMException) {
        continue;
      }
      if (attempt < MAX_RETRIES - 1 && lastError.message.includes("Overpass API")) {
        continue;
      }
      throw lastError;
    }
  }

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

function buildPoiQuery(bbox: string): string {
  return [
    "[out:json][timeout:25];",
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
    motorwayOverpassClause(bbox),
    `way["railway"="rail"](${bbox});`,
    ");",
    "out center tags geom;",
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
  let hasMotorway = false;
  let hasRailway = false;

  const motorways: OverpassElement[] = [];
  for (const el of data.elements) {
    if (el.type !== "way") continue;
    const hw = el.tags?.highway;
    if (hw === "motorway" || hw === "motorway_link") {
      motorways.push(el);
      hasMotorway = true;
    }
    if (el.tags?.railway === "rail") {
      hasRailway = true;
    }
  }

  for (const el of data.elements) {
    const category = classifyElement(el.tags ?? {}, el.id);
    if (!category) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;
    if (isNearMotorway(lat, lng, motorways)) continue;
    counts[category]++;
    candidates.push({
      category,
      osmId: el.id,
      name: el.tags?.["name"] ?? null,
      lat,
      lng,
    });
  }

  return { counts, candidates, hasMotorway, hasRailway };
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

  const data = await queryOverpass(buildPoiQuery(bbox));
  const { counts, hasMotorway, hasRailway } = classifyElements(data);
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

  const data = await queryOverpass(buildPoiQuery(bbox));
  const { candidates } = classifyElements(data);

  log.debug("POI candidates fetched:", candidates.length);
  poiCandidateCache.set(bbox, { candidates, expiresAt: Date.now() + POI_CACHE_TTL_MS });

  return candidates;
}
