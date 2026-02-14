import { log } from "@/lib/utils";

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

      return (await response.json()) as OverpassResponse;
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
