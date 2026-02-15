import { log } from "@/lib/utils";
import { POI_CATEGORIES, classifyChurch, type PoiCategory, type PoiValidationResult } from "@/lib/poi-categories";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1000;

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
      if (err instanceof TypeError || (err as { code?: string }).code === "ECONNREFUSED") {
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

export async function validatePoiCoverage(
  south: number,
  west: number,
  north: number,
  east: number,
): Promise<PoiValidationResult> {
  const bbox = `${south},${west},${north},${east}`;

  const query = [
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
    ");",
    "out center tags;",
  ].join("");

  const data = await queryOverpass(query);

  const counts: Record<PoiCategory, number> = { pub: 0, spire: 0, tower: 0, phone: 0, school: 0 };

  for (const el of data.elements) {
    const category = classifyElement(el.tags ?? {}, el.id);
    if (category) counts[category]++;
  }

  const missing = POI_CATEGORIES.filter((cat) => counts[cat] === 0);

  log.debug("POI validation:", counts, "missing:", missing);

  return { valid: missing.length === 0, counts, missing };
}
