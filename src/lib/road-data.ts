import proj4 from "proj4";
import { log } from "@/lib/utils";

const BNG = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs";

export interface RoadSegment {
  id: number;
  type: 'A' | 'B';
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
  gridSquaresWithRoads: Set<string>;
  timestamp: number;
}

let roadDataCache: RoadDataCache | null = null;

async function queryOverpassForRoads(
  south: number,
  west: number,
  north: number,
  east: number
): Promise<RoadSegment[]> {
  const query = `
    [out:json][timeout:25];
    (
      way["highway"="trunk"](${south},${west},${north},${east});
      way["highway"="primary"](${south},${west},${north},${east});
      way["highway"="secondary"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();

  const nodes: Map<number, [number, number]> = new Map();
  for (const element of data.elements) {
    if (element.type === 'node') {
      nodes.set(element.id, [element.lat, element.lon]);
    }
  }

  const roads: RoadSegment[] = [];
  for (const element of data.elements) {
    if (element.type === 'way' && element.tags?.highway) {
      const highway = element.tags.highway;
      let roadType: 'A' | 'B' | null = null;

      if (highway === 'trunk' || highway === 'primary') {
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
          roads.push({
            id: element.id,
            type: roadType,
            ref: element.tags.ref,
            coordinates,
          });
        }
      }
    }
  }

  return roads;
}

function latLngToGridKey(lat: number, lng: number): string {
  const [easting, northing] = proj4("EPSG:4326", BNG, [lng, lat]);
  const e = Math.floor(easting / 100) * 100;
  const n = Math.floor(northing / 100) * 100;
  return `${e}-${n}`;
}

function lineIntersectsGrid(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  gridKey: string
): boolean {
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = lat1 + t * (lat2 - lat1);
    const lng = lng1 + t * (lng2 - lng1);
    const key = latLngToGridKey(lat, lng);
    if (key === gridKey) {
      return true;
    }
  }
  return false;
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

  if (roadDataCache) {
    const { bounds } = roadDataCache;
    if (
      south >= bounds.south &&
      north <= bounds.north &&
      west >= bounds.west &&
      east <= bounds.east &&
      Date.now() - roadDataCache.timestamp < 30 * 60 * 1000
    ) {
      return;
    }
  }

  log.info("Loading road data for area:", { south, west, north, east });

  try {
    const roads = await queryOverpassForRoads(south, west, north, east);
    const gridSquaresWithRoads = calculateGridSquaresWithRoads(roads);

    roadDataCache = {
      bounds: { south, west, north, east },
      roads,
      gridSquaresWithRoads,
      timestamp: Date.now(),
    };

    log.info(
      `Loaded ${roads.length} road segments, ${gridSquaresWithRoads.size} grid squares with roads`
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

export function getAdjacentRoadGrids(gridKey: string): string[] {
  const [e, n] = gridKey.split('-').map(Number);
  const adjacent = [
    `${e}-${n + 100}`,
    `${e}-${n - 100}`,
    `${e + 100}-${n}`,
    `${e - 100}-${n}`,
  ];

  return adjacent.filter((key) => gridHasRoad(key));
}

export function reachableRoadGrids(
  startGridKey: string,
  maxSteps: number,
  excludeKeys: Set<string> = new Set()
): Map<string, number> {
  const visited = new Map<string, number>();
  if (!isRoadDataLoaded() || !gridHasRoad(startGridKey)) return visited;

  const queue: Array<{ key: string; depth: number }> = [{ key: startGridKey, depth: 0 }];
  visited.set(startGridKey, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.depth >= maxSteps) continue;

    const neighbors = getAdjacentRoadGrids(current.key);
    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || excludeKeys.has(neighbor)) continue;
      visited.set(neighbor, current.depth + 1);
      queue.push({ key: neighbor, depth: current.depth + 1 });
    }
  }

  visited.delete(startGridKey);
  return visited;
}

export function isRoadDataLoaded(): boolean {
  return roadDataCache !== null;
}

export function getRoadDataCache(): RoadDataCache | null {
  return roadDataCache;
}
