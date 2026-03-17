import proj4 from "proj4";
import { log } from "@/lib/utils";
import { type GameBounds } from "@/lib/area-size";

const BNG = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs";

function isGridOutsideBounds(gridKey: string, gameBounds: GameBounds | null): boolean {
  if (!gameBounds) return false;
  const [eRaw, nRaw] = gridKey.split("-").map(Number);
  const e = eRaw + 500;
  const n = nRaw + 500;
  const corners = gameBounds.corners.map((c) => {
    const [easting, northing] = proj4("EPSG:4326", BNG, [c.lng, c.lat]);
    return [easting, northing] as [number, number];
  });
  const minE = Math.floor(Math.min(...corners.map(([ce]) => ce)) / 1000) * 1000 + 500;
  const maxE = Math.floor(Math.max(...corners.map(([ce]) => ce)) / 1000) * 1000 + 500;
  const minN = Math.floor(Math.min(...corners.map(([, cn]) => cn)) / 1000) * 1000 + 500;
  const maxN = Math.floor(Math.max(...corners.map(([, cn]) => cn)) / 1000) * 1000 + 500;
  return e < minE || e > maxE || n < minN || n > maxN;
}

export interface RoadSegment {
  id: number;
  type: 'A' | 'B' | 'M';
  highway: string;
  ref?: string;
  coordinates: [number, number][];
}

export interface MotorwayJunction {
  id: number;
  lat: number;
  lng: number;
  ref?: string;
}

export interface RailwayStation {
  id: number;
  lat: number;
  lng: number;
  name?: string;
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
  gridSquaresWithARoads: Set<string>;
  gridSquaresWithBRoads: Set<string>;
  gridAdjacency: Map<string, Set<string>>;
  motorwayJunctions: MotorwayJunction[];
  railwayStations: RailwayStation[];
  timestamp: number;
}

const STORAGE_KEY = "oscillation-road-data-v5";
const STORAGE_MAX_AGE = 24 * 60 * 60 * 1000;

let roadDataCache: RoadDataCache | null = null;
const roadDataListeners: Array<() => void> = [];
let gridRoadIndex: Map<string, Array<{roadIdx: number, coordIdx: number}>> | null = null;
let roadDataStatusCallback: ((status: "loading" | "loaded" | "error") => void) | null = null;

export function setRoadDataStatusCallback(cb: (status: "loading" | "loaded" | "error") => void): void {
  roadDataStatusCallback = cb;
}

export function setPathfindingBounds(_bounds: GameBounds | null): void {
}

export function onRoadDataReady(callback: () => void): () => void {
  if (roadDataCache) {
    callback();
    return () => {};
  }
  roadDataListeners.push(callback);
  return () => {
    const idx = roadDataListeners.indexOf(callback);
    if (idx >= 0) roadDataListeners.splice(idx, 1);
  };
}

function notifyRoadDataListeners() {
  for (const cb of roadDataListeners.splice(0)) {
    cb();
  }
}

function serializeAdjacency(adj: Map<string, Set<string>>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  adj.forEach((neighbors, key) => {
    result[key] = Array.from(neighbors);
  });
  return result;
}

function isCardinalNeighbor(keyA: string, keyB: string): boolean {
  const [eA, nA] = keyA.split("-").map(Number);
  const [eB, nB] = keyB.split("-").map(Number);
  const de = Math.abs(eA - eB);
  const dn = Math.abs(nA - nB);
  return de + dn === 1000;
}

function deserializeAdjacency(obj: Record<string, string[]> | undefined): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  if (!obj) return result;
  for (const [key, neighbors] of Object.entries(obj)) {
    const cardinal = neighbors.filter(n => isCardinalNeighbor(key, n));
    if (cardinal.length > 0) {
      result.set(key, new Set(cardinal));
    }
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
      gridSquaresWithARoads: Array.from(cache.gridSquaresWithARoads),
      gridSquaresWithBRoads: Array.from(cache.gridSquaresWithBRoads),
      gridAdjacency: serializeAdjacency(cache.gridAdjacency),
      motorwayJunctions: cache.motorwayJunctions,
      railwayStations: cache.railwayStations,
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
    if (!parsed.gridSquaresWithARoads || !parsed.gridSquaresWithBRoads || !parsed.motorwayJunctions || !parsed.railwayStations) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const gridSquaresWithRoads = new Set<string>(parsed.gridSquaresWithRoads);
    const cache: RoadDataCache = {
      bounds: parsed.bounds,
      roads: parsed.roads ?? [],
      motorways: parsed.motorways ?? [],
      gridSquaresWithRoads: gridSquaresWithRoads,
      gridSquaresWithABRoads: gridSquaresWithRoads,
      gridSquaresWithARoads: new Set(parsed.gridSquaresWithARoads),
      gridSquaresWithBRoads: new Set(parsed.gridSquaresWithBRoads),
      gridAdjacency: deserializeAdjacency(parsed.gridAdjacency),
      motorwayJunctions: parsed.motorwayJunctions,
      railwayStations: parsed.railwayStations,
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
  motorwayJunctions: MotorwayJunction[];
  railwayStations: RailwayStation[];
}

async function queryOverpassForRoads(
  south: number,
  west: number,
  north: number,
  east: number
): Promise<RoadQueryResult> {
  const query = `
    [out:json][timeout:30];
    (
      way["highway"="motorway"](${south},${west},${north},${east});
      way["highway"="motorway_link"](${south},${west},${north},${east});
      way["highway"="trunk"](${south},${west},${north},${east});
      way["highway"="trunk_link"](${south},${west},${north},${east});
      way["highway"="primary"](${south},${west},${north},${east});
      way["highway"="primary_link"](${south},${west},${north},${east});
      way["highway"="secondary"](${south},${west},${north},${east});
      way["highway"="secondary_link"](${south},${west},${north},${east});
      way["highway"="tertiary"](${south},${west},${north},${east});
      way["highway"="tertiary_link"](${south},${west},${north},${east});
      way["highway"="unclassified"](${south},${west},${north},${east});
      node["highway"="motorway_junction"](${south},${west},${north},${east});
      node["railway"="station"](${south},${west},${north},${east});
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
  const motorwayJunctions: MotorwayJunction[] = [];
  const railwayStations: RailwayStation[] = [];

  for (const element of data.elements) {
    if (element.type === 'node' && element.tags) {
      if (element.tags.highway === 'motorway_junction') {
        motorwayJunctions.push({
          id: element.id,
          lat: element.lat,
          lng: element.lon,
          ref: element.tags.ref,
        });
      } else if (element.tags.railway === 'station') {
        railwayStations.push({
          id: element.id,
          lat: element.lat,
          lng: element.lon,
          name: element.tags.name,
        });
      }
    }

    if (element.type === 'way' && element.tags?.highway) {
      const highway = element.tags.highway;
      let roadType: 'A' | 'B' | 'M' | null = null;

      if (highway === 'motorway' || highway === 'motorway_link') {
        roadType = 'M';
      } else if (highway === 'trunk' || highway === 'trunk_link' || highway === 'primary' || highway === 'primary_link') {
        roadType = 'A';
      } else if (highway === 'secondary' || highway === 'secondary_link' || highway === 'tertiary' || highway === 'tertiary_link' || highway === 'unclassified') {
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

  return { roads, motorways, motorwayJunctions, railwayStations };
}

export function gridKeyToLatLng(gridKey: string): [number, number] {
  const [e, n] = gridKey.split("-").map(Number);
  const [lng, lat] = proj4(BNG, "EPSG:4326", [e + 500, n + 500]);
  const snapped = nearestRoadPosition(lat, lng);
  return snapped ?? [lat, lng];
}

const MAX_SNAP_DIST_SQ = 0.0002;

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

  if (bestDist > MAX_SNAP_DIST_SQ) return null;

  return bestCoord;
}

function ensureGridRoadIndex(): Map<string, Array<{roadIdx: number, coordIdx: number}>> {
  if (gridRoadIndex) return gridRoadIndex;
  gridRoadIndex = new Map();
  if (!roadDataCache) return gridRoadIndex;

  for (let r = 0; r < roadDataCache.roads.length; r++) {
    const road = roadDataCache.roads[r];
    for (let c = 0; c < road.coordinates.length; c++) {
      const [lat, lng] = road.coordinates[c];
      const key = latLngToGridKey(lat, lng);
      if (!gridRoadIndex.has(key)) gridRoadIndex.set(key, []);
      gridRoadIndex.get(key)!.push({ roadIdx: r, coordIdx: c });
    }
  }

  return gridRoadIndex;
}

export function roadPathBetweenGrids(
  gridKeyA: string,
  gridKeyB: string
): [number, number][] {
  if (!roadDataCache) return [];

  const index = ensureGridRoadIndex();
  const entriesA = index.get(gridKeyA);
  const entriesB = index.get(gridKeyB);
  if (!entriesA || !entriesB) return [];

  const roadsInA = new Map<number, number[]>();
  for (const { roadIdx, coordIdx } of entriesA) {
    if (!roadsInA.has(roadIdx)) roadsInA.set(roadIdx, []);
    roadsInA.get(roadIdx)!.push(coordIdx);
  }

  let bestRoad: RoadSegment | null = null;
  let bestIdxA = 0;
  let bestIdxB = 0;
  let bestSpan = Infinity;

  for (const { roadIdx, coordIdx: idxB } of entriesB) {
    const aIndices = roadsInA.get(roadIdx);
    if (!aIndices) continue;

    for (const idxA of aIndices) {
      const span = Math.abs(idxA - idxB);
      if (span < bestSpan) {
        bestSpan = span;
        bestRoad = roadDataCache.roads[roadIdx];
        bestIdxA = idxA;
        bestIdxB = idxB;
      }
    }
  }

  if (!bestRoad) return [];

  const from = Math.min(bestIdxA, bestIdxB);
  const to = Math.max(bestIdxA, bestIdxB);
  const segment = bestRoad.coordinates.slice(from, to + 1);

  if (bestIdxA > bestIdxB) {
    segment.reverse();
  }

  return segment;
}

function crossGridRoadPath(
  startLat: number,
  startLng: number,
  gridA: string,
  endLat: number,
  endLng: number,
  gridB: string
): [number, number][] {
  if (!roadDataCache) return [];

  const index = ensureGridRoadIndex();
  const entriesA = index.get(gridA);
  const entriesB = index.get(gridB);
  if (!entriesA?.length || !entriesB?.length) return [];

  let bestDistA = Infinity;
  let bestRoadIdxA = -1;
  for (const { roadIdx, coordIdx } of entriesA) {
    const [rLat, rLng] = roadDataCache.roads[roadIdx].coordinates[coordIdx];
    const d = (rLat - startLat) ** 2 + (rLng - startLng) ** 2;
    if (d < bestDistA) {
      bestDistA = d;
      bestRoadIdxA = roadIdx;
    }
  }

  let bestDistB = Infinity;
  let bestRoadIdxB = -1;
  for (const { roadIdx, coordIdx } of entriesB) {
    const [rLat, rLng] = roadDataCache.roads[roadIdx].coordinates[coordIdx];
    const d = (rLat - endLat) ** 2 + (rLng - endLng) ** 2;
    if (d < bestDistB) {
      bestDistB = d;
      bestRoadIdxB = roadIdx;
    }
  }

  if (bestRoadIdxA < 0 || bestRoadIdxB < 0) return [];

  const coordsA: [number, number][] = entriesA
    .filter(e => e.roadIdx === bestRoadIdxA)
    .sort((a, b) => a.coordIdx - b.coordIdx)
    .map(e => roadDataCache!.roads[bestRoadIdxA].coordinates[e.coordIdx]);

  const coordsB: [number, number][] = entriesB
    .filter(e => e.roadIdx === bestRoadIdxB)
    .sort((a, b) => a.coordIdx - b.coordIdx)
    .map(e => roadDataCache!.roads[bestRoadIdxB].coordinates[e.coordIdx]);

  if (coordsA.length === 0 || coordsB.length === 0) return [];

  if (coordsA.length > 1) {
    const dFirst = (coordsA[0][0] - startLat) ** 2 + (coordsA[0][1] - startLng) ** 2;
    const dLast = (coordsA[coordsA.length - 1][0] - startLat) ** 2 + (coordsA[coordsA.length - 1][1] - startLng) ** 2;
    if (dLast < dFirst) coordsA.reverse();
  }

  if (coordsB.length > 1) {
    const dFirst = (coordsB[0][0] - endLat) ** 2 + (coordsB[0][1] - endLng) ** 2;
    const dLast = (coordsB[coordsB.length - 1][0] - endLat) ** 2 + (coordsB[coordsB.length - 1][1] - endLng) ** 2;
    if (dFirst < dLast) coordsB.reverse();
  }

  return [...coordsA, ...coordsB];
}

export function roadPathThroughGrids(
  startPos: [number, number],
  gridKeys: string[]
): [number, number][] {
  if (!roadDataCache || gridKeys.length === 0) return [];

  const startGrid = latLngToGridKey(startPos[0], startPos[1]);
  const allGrids = [startGrid, ...gridKeys].filter((g, i, arr) => i === 0 || g !== arr[i - 1]);

  if (allGrids.length < 2) {
    const dest = gridKeyToLatLng(gridKeys[gridKeys.length - 1]);
    return [startPos, ...roadPathBetween(startPos[0], startPos[1], dest[0], dest[1])];
  }

  const pairsNeeded = new Set<string>();
  for (let i = 0; i < allGrids.length - 1; i++) {
    pairsNeeded.add(`${allGrids[i]}|${allGrids[i + 1]}`);
  }

  interface Crossing {
    exitPos: [number, number];
    entryPos: [number, number];
  }
  const found = new Map<string, Crossing>();

  for (const road of roadDataCache.roads) {
    if (found.size === pairsNeeded.size) break;

    for (let c = 0; c < road.coordinates.length - 1; c++) {
      const [lat1, lng1] = road.coordinates[c];
      const [lat2, lng2] = road.coordinates[c + 1];
      const key1 = latLngToGridKey(lat1, lng1);
      const key2 = latLngToGridKey(lat2, lng2);

      if (key1 !== key2) {
        const fwd = `${key1}|${key2}`;
        if (pairsNeeded.has(fwd) && !found.has(fwd)) {
          found.set(fwd, { exitPos: road.coordinates[c], entryPos: road.coordinates[c + 1] });
        }
        const rev = `${key2}|${key1}`;
        if (pairsNeeded.has(rev) && !found.has(rev)) {
          found.set(rev, { exitPos: road.coordinates[c + 1], entryPos: road.coordinates[c] });
        }
      }

      const dLat = lat2 - lat1;
      const dLng = lng2 - lng1;
      const steps = Math.ceil(Math.sqrt(dLat * dLat + dLng * dLng) * 1000);
      if (steps <= 1) continue;

      let prevKey = key1;
      let prevT = 0;
      for (let j = 1; j <= steps; j++) {
        const t = j / steps;
        const curKey = j < steps
          ? latLngToGridKey(lat1 + t * dLat, lng1 + t * dLng)
          : key2;

        if (curKey !== prevKey) {
          const exitT = (prevT + t) * 0.5;
          const exitPos: [number, number] = [lat1 + exitT * dLat, lng1 + exitT * dLng];
          const fwd = `${prevKey}|${curKey}`;
          if (pairsNeeded.has(fwd) && !found.has(fwd)) {
            found.set(fwd, { exitPos, entryPos: exitPos });
          }
          const rev = `${curKey}|${prevKey}`;
          if (pairsNeeded.has(rev) && !found.has(rev)) {
            found.set(rev, { exitPos, entryPos: exitPos });
          }
          prevKey = curKey;
        }
        prevT = t;
      }
    }
  }

  const result: [number, number][] = [startPos];

  for (let i = 0; i < allGrids.length - 1; i++) {
    const crossing = found.get(`${allGrids[i]}|${allGrids[i + 1]}`);
    if (!crossing) {
      const fallback = roadPathBetweenGrids(allGrids[i], allGrids[i + 1]);
      if (fallback.length >= 2) {
        for (const pt of fallback.slice(1)) result.push(pt);
      } else {
        result.push(gridKeyToLatLng(allGrids[i + 1]));
      }
      continue;
    }

    const lastPoint = result[result.length - 1];
    const withinGrid = roadPathBetween(lastPoint[0], lastPoint[1], crossing.exitPos[0], crossing.exitPos[1]);
    for (let j = 1; j < withinGrid.length; j++) {
      result.push(withinGrid[j]);
    }

    if (crossing.exitPos[0] !== crossing.entryPos[0] || crossing.exitPos[1] !== crossing.entryPos[1]) {
      result.push(crossing.entryPos);
    }
  }

  const lastPoint = result[result.length - 1];
  const finalDest = gridKeyToLatLng(gridKeys[gridKeys.length - 1]);
  const lastSeg = roadPathBetween(lastPoint[0], lastPoint[1], finalDest[0], finalDest[1]);
  for (let j = 1; j < lastSeg.length; j++) {
    result.push(lastSeg[j]);
  }

  return result.length >= 2 ? result : [startPos, finalDest];
}

export function roadPathBetween(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): [number, number][] {
  if (!roadDataCache) return [[startLat, startLng], [endLat, endLng]];

  const gridA = latLngToGridKey(startLat, startLng);
  const gridB = latLngToGridKey(endLat, endLng);

  if (gridA !== gridB) {
    const gridSegment = roadPathBetweenGrids(gridA, gridB);
    if (gridSegment.length >= 2) return gridSegment;

    const crossPath = crossGridRoadPath(startLat, startLng, gridA, endLat, endLng, gridB);
    if (crossPath.length >= 2) return crossPath;

    return [[startLat, startLng], [endLat, endLng]];
  }

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

export function snapToGridCenter(lat: number, lng: number): { lat: number; lng: number } {
  const [easting, northing] = proj4("EPSG:4326", BNG, [lng, lat]);
  const e = Math.floor(easting / 1000) * 1000 + 500;
  const n = Math.floor(northing / 1000) * 1000 + 500;
  const [snappedLng, snappedLat] = proj4(BNG, "EPSG:4326", [e, n]);
  return { lat: snappedLat, lng: snappedLng };
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
  if (de + dn === 1000) {
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
      roadDataStatusCallback?.("loaded");
      notifyRoadDataListeners();
      return;
    }
  }

  log.info("Loading road data for area:", { south, west, north, east });
  roadDataStatusCallback?.("loading");

  try {
    const result = await queryOverpassForRoads(south, west, north, east);
    const { roads, motorways, motorwayJunctions, railwayStations } = result;
    const gridSquaresWithRoads = calculateGridSquaresWithRoads(roads);
    const abRoads = roads.filter((r) => r.type === "A" || r.type === "B");
    const gridSquaresWithABRoads = calculateGridSquaresWithRoads(abRoads);
    const aRoads = roads.filter((r) => r.type === "A");
    const gridSquaresWithARoads = calculateGridSquaresWithRoads(aRoads);
    const bRoads = roads.filter((r) => r.type === "B");
    const gridSquaresWithBRoads = calculateGridSquaresWithRoads(bRoads);
    const gridAdjacency = calculateGridAdjacency(abRoads);

    gridRoadIndex = null;
    roadDataCache = {
      bounds: { south, west, north, east },
      roads,
      motorways,
      gridSquaresWithRoads,
      gridSquaresWithABRoads,
      gridSquaresWithARoads,
      gridSquaresWithBRoads,
      gridAdjacency,
      motorwayJunctions,
      railwayStations,
      timestamp: Date.now(),
    };

    saveToStorage(roadDataCache);
    notifyRoadDataListeners();

    log.info(
      `Loaded ${roads.length} road segments, ${motorways.length} motorway segments, ${motorwayJunctions.length} junctions, ${railwayStations.length} stations, ${gridSquaresWithRoads.size} grid squares with roads, ${gridSquaresWithABRoads.size} with A/B roads, ${gridAdjacency.size} connected grids`
    );
    roadDataStatusCallback?.("loaded");
  } catch (error) {
    log.error("Failed to load road data:", error);
    roadDataStatusCallback?.("error");
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
  if (!roadDataCache) {
    return allAdjacentGrids(gridKey);
  }
  if (roadDataCache.gridAdjacency.has(gridKey)) {
    return Array.from(roadDataCache.gridAdjacency.get(gridKey)!);
  }
  const candidates = allAdjacentGrids(gridKey);
  const withAdjacency = candidates.filter(g => roadDataCache!.gridAdjacency.has(g));
  if (withAdjacency.length > 0) return withAdjacency;
  return candidates.filter(g => roadDataCache!.gridSquaresWithRoads.has(g));
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
  excludeKeys: Set<string> = new Set(),
  gameBounds: GameBounds | null = null
): Map<string, number> {
  const visited = new Map<string, number>();
  const hasCache = roadDataCache !== null;
  const startHasRoad = hasCache ? roadDataCache!.gridSquaresWithABRoads.has(startGridKey) : false;
  const abRoadCount = hasCache ? roadDataCache!.gridSquaresWithABRoads.size : 0;
  const adjCount = hasCache ? roadDataCache!.gridAdjacency.size : 0;
  const startNeighbors = getAdjacentRoadGrids(startGridKey);
  log.info(`reachableRoadGrids: start=${startGridKey} maxSteps=${maxSteps} excludeKeys=${excludeKeys.size} roadDataLoaded=${hasCache} abRoads=${abRoadCount} adjEntries=${adjCount} startHasRoad=${startHasRoad} startNeighbors=${startNeighbors.length} [${startNeighbors.slice(0, 4).join(", ")}]`);

  const queue: Array<{ key: string; depth: number }> = [{ key: startGridKey, depth: 0 }];
  visited.set(startGridKey, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth >= maxSteps) continue;

    const neighbors = getAdjacentRoadGrids(current.key);

    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || excludeKeys.has(neighbor)) continue;
      if (isGridOutsideBounds(neighbor, gameBounds)) continue;
      visited.set(neighbor, current.depth + 1);
      queue.push({ key: neighbor, depth: current.depth + 1 });
    }
  }

  visited.delete(startGridKey);
  log.info(`reachableRoadGrids: found ${visited.size} reachable grids from ${startGridKey} in ${maxSteps} steps`);
  return visited;
}

export function shortestPath(
  startGridKey: string,
  targetGridKey: string,
  maxSteps: number,
  excludeKeys: Set<string> = new Set(),
  gameBounds: GameBounds | null = null
): string[] | null {
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
        const prev = cameFrom.get(step);
        if (!prev) break;
        step = prev;
      }
      return path;
    }
    if (current.depth >= maxSteps) continue;

    const neighbors = getAdjacentRoadGrids(current.key);

    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || excludeKeys.has(neighbor)) continue;
      if (isGridOutsideBounds(neighbor, gameBounds)) continue;
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

export function allPathsToEndpoints(
  startGridKey: string,
  exactSteps: number,
  excludeKeys: Set<string> = new Set(),
  maxPaths = 200
): string[][] {
  const paths: string[][] = [];
  const hasRoads = isRoadDataLoaded();
  const visited = new Set<string>([startGridKey]);
  const currentPath: string[] = [];

  function dfs(key: string, depth: number): boolean {
    if (paths.length >= maxPaths) return true;
    if (depth === exactSteps) {
      paths.push([...currentPath]);
      return false;
    }

    const neighbors = hasRoads
      ? getAdjacentRoadGrids(key)
      : allAdjacentGrids(key);

    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || excludeKeys.has(neighbor)) continue;
      visited.add(neighbor);
      currentPath.push(neighbor);
      if (dfs(neighbor, depth + 1)) return true;
      currentPath.pop();
      visited.delete(neighbor);
    }
    return false;
  }

  dfs(startGridKey, 0);
  return paths;
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

export function gridHasARoad(gridKey: string): boolean {
  if (!roadDataCache) return true;
  return roadDataCache.gridSquaresWithARoads.has(gridKey);
}

export function gridHasBRoad(gridKey: string): boolean {
  if (!roadDataCache) return true;
  return roadDataCache.gridSquaresWithBRoads.has(gridKey);
}

export function motorwayJunctions(): MotorwayJunction[] {
  return roadDataCache?.motorwayJunctions ?? [];
}

export function railwayStations(): RailwayStation[] {
  return roadDataCache?.railwayStations ?? [];
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

