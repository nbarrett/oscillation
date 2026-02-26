import proj4 from "proj4";
import { log } from "@/lib/utils";

const BNG = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs";

export interface RoadSegment {
  id: number;
  type: 'A' | 'B' | 'M';
  highway: string;
  ref?: string;
  coordinates: [number, number][];
}

export interface RoadDataCache {
  bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  roads: RoadSegment[];
  motorways: RoadSegment[];
  gridSquaresWithRoads: Set<string>;
  gridSquaresWithABRoads: Set<string>;
  gridAdjacency: Map<string, Set<string>>;
  timestamp: number;
}

const STORAGE_KEY = "oscillation-road-data";
const STORAGE_MAX_AGE = 24 * 60 * 60 * 1000;

let roadDataCache: RoadDataCache | null = null;

function serializeAdjacency(adj: Map<string, Set<string>>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  adj.forEach((neighbors, key) => {
    result[key] = Array.from(neighbors);
  });
  return result;
}

function deserializeAdjacency(obj: Record<string, string[]> | undefined): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  if (!obj) return result;
  for (const [key, neighbors] of Object.entries(obj)) {
    result.set(key, new Set(neighbors));
  }
  return result;
}

function saveToStorage(cache: RoadDataCache): void {
  try {
    const serializable = {
      bounds: cache.bounds,
      roads: cache.roads,
      motorways: cache.motorways,
      gridSquaresWithRoads: Array.from(cache.gridSquaresWithRoads),
      gridSquaresWithABRoads: Array.from(cache.gridSquaresWithABRoads),
      gridAdjacency: serializeAdjacency(cache.gridAdjacency),
      timestamp: cache.timestamp,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (e) {
    log.error("Failed to save road data to storage:", e);
  }
}

function loadFromStorage(): RoadDataCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > STORAGE_MAX_AGE || !parsed.gridAdjacency) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const cache: RoadDataCache = {
      bounds: parsed.bounds,
      roads: parsed.roads,
      motorways: parsed.motorways ?? [],
      gridSquaresWithRoads: new Set(parsed.gridSquaresWithRoads),
      gridSquaresWithABRoads: new Set(parsed.gridSquaresWithABRoads ?? []),
      gridAdjacency: deserializeAdjacency(parsed.gridAdjacency),
      timestamp: parsed.timestamp,
    };
    if (cache.gridSquaresWithABRoads.size === 0 && cache.roads.length > 0) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (cache.motorways.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return cache;
  } catch (e) {
    log.error("Failed to load road data from storage:", e);
    return null;
  }
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function queryOverpassWithRetry(
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const url = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length]!;
    try {
      const response = await fetch(url, options);
      if ((response.status === 429 || response.status === 504) && attempt < maxRetries) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        log.info(`Overpass API rate limited, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        log.info(`Overpass API fetch failed, retrying in ${delay / 1000}s`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Overpass API: max retries exceeded");
}

interface RoadQueryResult {
  roads: RoadSegment[];
  motorways: RoadSegment[];
}

async function queryOverpassForRoads(
  south: number,
  west: number,
  north: number,
  east: number
): Promise<RoadQueryResult> {
  const query = `
    [out:json][timeout:25];
    (
      way["highway"="motorway"](${south},${west},${north},${east});
      way["highway"="motorway_link"](${south},${west},${north},${east});
      way["highway"="trunk"](${south},${west},${north},${east});
      way["highway"="primary"](${south},${west},${north},${east});
      way["highway"="secondary"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await queryOverpassWithRetry({
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const text = await response.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error("Overpass API returned XML instead of JSON");
  }

  const data = JSON.parse(text);

  const nodes: Map<number, [number, number]> = new Map();
  for (const element of data.elements) {
    if (element.type === 'node') {
      nodes.set(element.id, [element.lat, element.lon]);
    }
  }

  const roads: RoadSegment[] = [];
  const motorways: RoadSegment[] = [];
  for (const element of data.elements) {
    if (element.type === 'way' && element.tags?.highway) {
      const highway = element.tags.highway;
      let roadType: 'A' | 'B' | 'M' | null = null;

      if (highway === 'motorway' || highway === 'motorway_link') {
        roadType = 'M';
      } else if (highway === 'trunk' || highway === 'primary') {
        roadType = 'A';
      } else if (highway === 'secondary') {
        roadType = 'B';
      }

      if (roadType && element.nodes) {
        const coordinates: [number, number][] = [];
        for (const nodeId of element.nodes) {
          const coord = nodes.get(nodeId);
          if (coord) {
            coordinates.push(coord);
          }
        }

        if (coordinates.length > 0) {
          const segment: RoadSegment = {
            id: element.id,
            type: roadType,
            highway,
            ref: element.tags.ref,
            coordinates,
          };
          if (roadType === 'M') {
            motorways.push(segment);
          } else {
            roads.push(segment);
          }
        }
      }
    }
  }

  return { roads, motorways };
}

export function gridKeyToLatLng(gridKey: string): [number, number] {
  const [e, n] = gridKey.split("-").map(Number);
  const [lng, lat] = proj4(BNG, "EPSG:4326", [e + 500, n + 500]);
  const snapped = nearestRoadPosition(lat, lng);
  return snapped ?? [lat, lng];
}

export function nearestRoadPosition(lat: number, lng: number): [number, number] | null {
  if (!roadDataCache) return null;

  let bestDist = Infinity;
  let bestCoord: [number, number] | null = null;

  for (const road of roadDataCache.roads) {
    for (const [rLat, rLng] of road.coordinates) {
      const dLat = rLat - lat;
      const dLng = rLng - lng;
      const dist = dLat * dLat + dLng * dLng;
      if (dist < bestDist) {
        bestDist = dist;
        bestCoord = [rLat, rLng];
      }
    }
  }

  return bestCoord;
}

export function roadPathBetween(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): [number, number][] {
  if (!roadDataCache) return [[startLat, startLng], [endLat, endLng]];

  let bestRoad: RoadSegment | null = null;
  let bestStartIdx = 0;
  let bestEndIdx = 0;
  let bestScore = Infinity;

  for (const road of roadDataCache.roads) {
    let closestStartIdx = 0;
    let closestStartDist = Infinity;
    let closestEndIdx = 0;
    let closestEndDist = Infinity;

    for (let i = 0; i < road.coordinates.length; i++) {
      const [rLat, rLng] = road.coordinates[i];
      const dStart = (rLat - startLat) ** 2 + (rLng - startLng) ** 2;
      const dEnd = (rLat - endLat) ** 2 + (rLng - endLng) ** 2;
      if (dStart < closestStartDist) {
        closestStartDist = dStart;
        closestStartIdx = i;
      }
      if (dEnd < closestEndDist) {
        closestEndDist = dEnd;
        closestEndIdx = i;
      }
    }

    const score = closestStartDist + closestEndDist;
    if (score < bestScore) {
      bestScore = score;
      bestRoad = road;
      bestStartIdx = closestStartIdx;
      bestEndIdx = closestEndIdx;
    }
  }

  if (!bestRoad) return [[startLat, startLng], [endLat, endLng]];

  const from = Math.min(bestStartIdx, bestEndIdx);
  const to = Math.max(bestStartIdx, bestEndIdx);
  const segment = bestRoad.coordinates.slice(from, to + 1);

  if (bestStartIdx > bestEndIdx) {
    segment.reverse();
  }

  return segment.length > 0 ? segment : [[startLat, startLng], [endLat, endLng]];
}

export function latLngToGridKey(lat: number, lng: number): string {
  const [easting, northing] = proj4("EPSG:4326", BNG, [lng, lat]);
  const e = Math.floor(easting / 1000) * 1000;
  const n = Math.floor(northing / 1000) * 1000;
  return `${e}-${n}`;
}

function calculateGridSquaresWithRoads(roads: RoadSegment[]): Set<string> {
  const gridSquares = new Set<string>();

  for (const road of roads) {
    for (const [lat, lng] of road.coordinates) {
      const gridKey = latLngToGridKey(lat, lng);
      gridSquares.add(gridKey);
    }

    for (let i = 0; i < road.coordinates.length - 1; i++) {
      const [lat1, lng1] = road.coordinates[i];
      const [lat2, lng2] = road.coordinates[i + 1];

      const steps = Math.ceil(
        Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)) * 1000
      );
      for (let j = 1; j < steps; j++) {
        const t = j / steps;
        const lat = lat1 + t * (lat2 - lat1);
        const lng = lng1 + t * (lng2 - lng1);
        const gridKey = latLngToGridKey(lat, lng);
        gridSquares.add(gridKey);
      }
    }
  }

  return gridSquares;
}

function addAdjacency(adj: Map<string, Set<string>>, gridA: string, gridB: string) {
  if (gridA === gridB) return;
  const [eA, nA] = gridA.split("-").map(Number);
  const [eB, nB] = gridB.split("-").map(Number);
  const de = Math.abs(eA - eB);
  const dn = Math.abs(nA - nB);
  if ((de === 1000 && dn === 0) || (de === 0 && dn === 1000)) {
    if (!adj.has(gridA)) adj.set(gridA, new Set());
    if (!adj.has(gridB)) adj.set(gridB, new Set());
    adj.get(gridA)!.add(gridB);
    adj.get(gridB)!.add(gridA);
  }
}

function calculateGridAdjacency(roads: RoadSegment[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();

  for (const road of roads) {
    for (let i = 0; i < road.coordinates.length - 1; i++) {
      const [lat1, lng1] = road.coordinates[i];
      const [lat2, lng2] = road.coordinates[i + 1];
      const gridA = latLngToGridKey(lat1, lng1);
      const gridB = latLngToGridKey(lat2, lng2);

      addAdjacency(adj, gridA, gridB);

      const steps = Math.ceil(
        Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)) * 1000
      );
      let prevGrid = gridA;
      for (let j = 1; j < steps; j++) {
        const t = j / steps;
        const lat = lat1 + t * (lat2 - lat1);
        const lng = lng1 + t * (lng2 - lng1);
        const curGrid = latLngToGridKey(lat, lng);
        addAdjacency(adj, prevGrid, curGrid);
        prevGrid = curGrid;
      }
    }
  }

  return adj;
}

export async function loadRoadData(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 5
): Promise<void> {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));

  const south = centerLat - latDelta;
  const north = centerLat + latDelta;
  const west = centerLng - lngDelta;
  const east = centerLng + lngDelta;

  if (!roadDataCache) {
    roadDataCache = loadFromStorage();
  }

  if (roadDataCache) {
    const { bounds } = roadDataCache;
    if (
      south >= bounds.south &&
      north <= bounds.north &&
      west >= bounds.west &&
      east <= bounds.east &&
      Date.now() - roadDataCache.timestamp < STORAGE_MAX_AGE
    ) {
      return;
    }
  }

  log.info("Loading road data for area:", { south, west, north, east });

  try {
    const { roads, motorways } = await queryOverpassForRoads(south, west, north, east);
    const gridSquaresWithRoads = calculateGridSquaresWithRoads(roads);
    const abRoads = roads.filter((r) => r.highway === "primary" || r.highway === "secondary");
    const gridSquaresWithABRoads = calculateGridSquaresWithRoads(abRoads);
    const gridAdjacency = calculateGridAdjacency(roads);

    roadDataCache = {
      bounds: { south, west, north, east },
      roads,
      motorways,
      gridSquaresWithRoads,
      gridSquaresWithABRoads,
      gridAdjacency,
      timestamp: Date.now(),
    };

    saveToStorage(roadDataCache);

    log.info(
      `Loaded ${roads.length} road segments, ${motorways.length} motorway segments, ${gridSquaresWithRoads.size} grid squares with roads, ${gridSquaresWithABRoads.size} with A/B roads, ${gridAdjacency.size} connected grids`
    );
  } catch (error) {
    log.error("Failed to load road data:", error);
  }
}

export function gridHasRoad(gridKey: string): boolean {
  if (!roadDataCache) {
    return true;
  }
  return roadDataCache.gridSquaresWithRoads.has(gridKey);
}

export function gridHasABRoad(gridKey: string): boolean {
  if (!roadDataCache) {
    return true;
  }
  return roadDataCache.gridSquaresWithABRoads.has(gridKey);
}

export function getAdjacentRoadGrids(gridKey: string): string[] {
  if (roadDataCache?.gridAdjacency.has(gridKey)) {
    return Array.from(roadDataCache.gridAdjacency.get(gridKey)!);
  }
  if (roadDataCache) {
    return allAdjacentGrids(gridKey).filter((g) => roadDataCache!.gridSquaresWithRoads.has(g));
  }
  return allAdjacentGrids(gridKey);
}

function allAdjacentGrids(gridKey: string): string[] {
  const [e, n] = gridKey.split("-").map(Number);
  return [
    `${e}-${n + 1000}`,
    `${e}-${n - 1000}`,
    `${e + 1000}-${n}`,
    `${e - 1000}-${n}`,
  ];
}

export function reachableRoadGrids(
  startGridKey: string,
  maxSteps: number,
  excludeKeys: Set<string> = new Set()
): Map<string, number> {
  const visited = new Map<string, number>();
  const hasRoads = isRoadDataLoaded();

  const queue: Array<{ key: string; depth: number }> = [{ key: startGridKey, depth: 0 }];
  visited.set(startGridKey, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth >= maxSteps) continue;

    const neighbors = hasRoads
      ? getAdjacentRoadGrids(current.key)
      : allAdjacentGrids(current.key);

    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || excludeKeys.has(neighbor)) continue;
      visited.set(neighbor, current.depth + 1);
      queue.push({ key: neighbor, depth: current.depth + 1 });
    }
  }

  visited.delete(startGridKey);
  return visited;
}

export function shortestPath(
  startGridKey: string,
  targetGridKey: string,
  maxSteps: number,
  excludeKeys: Set<string> = new Set()
): string[] | null {
  const hasRoads = isRoadDataLoaded();
  const cameFrom = new Map<string, string>();
  const queue: Array<{ key: string; depth: number }> = [{ key: startGridKey, depth: 0 }];
  const visited = new Set<string>([startGridKey]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.key === targetGridKey && current.depth > 0) {
      const path: string[] = [];
      let step = targetGridKey;
      while (step !== startGridKey) {
        path.unshift(step);
        step = cameFrom.get(step)!;
      }
      return path;
    }
    if (current.depth >= maxSteps) continue;

    const neighbors = hasRoads
      ? getAdjacentRoadGrids(current.key)
      : allAdjacentGrids(current.key);

    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || excludeKeys.has(neighbor)) continue;
      visited.add(neighbor);
      cameFrom.set(neighbor, current.key);
      queue.push({ key: neighbor, depth: current.depth + 1 });
    }
  }

  return null;
}

export function exactStepEndpoints(
  startGridKey: string,
  exactSteps: number,
  excludeKeys: Set<string> = new Set()
): Set<string> {
  const endpoints = new Set<string>();
  const hasRoads = isRoadDataLoaded();
  const visited = new Set<string>([startGridKey]);

  function dfs(key: string, depth: number) {
    if (depth === exactSteps) {
      endpoints.add(key);
      return;
    }

    const neighbors = hasRoads
      ? getAdjacentRoadGrids(key)
      : allAdjacentGrids(key);

    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || excludeKeys.has(neighbor)) continue;
      visited.add(neighbor);
      dfs(neighbor, depth + 1);
      visited.delete(neighbor);
    }
  }

  dfs(startGridKey, 0);
  return endpoints;
}

export function findExactPath(
  startGridKey: string,
  targetGridKey: string,
  exactSteps: number,
  excludeKeys: Set<string> = new Set()
): string[] | null {
  const hasRoads = isRoadDataLoaded();
  const visited = new Set<string>([startGridKey]);
  const path: string[] = [];

  function dfs(key: string, depth: number): boolean {
    if (depth === exactSteps) {
      return key === targetGridKey;
    }

    const neighbors = hasRoads
      ? getAdjacentRoadGrids(key)
      : allAdjacentGrids(key);

    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || excludeKeys.has(neighbor)) continue;
      visited.add(neighbor);
      path.push(neighbor);
      if (dfs(neighbor, depth + 1)) return true;
      path.pop();
      visited.delete(neighbor);
    }
    return false;
  }

  if (dfs(startGridKey, 0)) {
    return [...path];
  }
  return null;
}

export function isRoadDataLoaded(): boolean {
  return roadDataCache !== null;
}

const MOTORWAY_PROXIMITY_METRES = 150;

function haversineMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineMetres(px, py, ax, ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return haversineMetres(px, py, ax + t * dx, ay + t * dy);
}

export function isNearMotorway(lat: number, lng: number): boolean {
  if (!roadDataCache || roadDataCache.motorways.length === 0) return false;
  for (const mw of roadDataCache.motorways) {
    for (let i = 0; i < mw.coordinates.length - 1; i++) {
      const [aLat, aLng] = mw.coordinates[i];
      const [bLat, bLng] = mw.coordinates[i + 1];
      if (distToSegment(lat, lng, aLat, aLng, bLat, bLng) <= MOTORWAY_PROXIMITY_METRES) {
        return true;
      }
    }
  }
  return false;
}

