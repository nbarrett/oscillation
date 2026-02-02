/**
 * Road data utilities for determining which grid squares contain A or B roads.
 * Uses OpenStreetMap Overpass API to query road classifications.
 *
 * UK Road Classifications in OSM:
 * - A roads: highway=trunk, highway=primary (pink on OS maps)
 * - B roads: highway=secondary (brown on OS maps)
 */

export interface RoadSegment {
  id: number;
  type: 'A' | 'B';
  ref?: string; // Road number like "A252" or "B2068"
  coordinates: [number, number][]; // [lat, lng] pairs
}

export interface RoadDataCache {
  bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  roads: RoadSegment[];
  gridSquaresWithRoads: Set<string>; // Grid keys that contain A/B roads
  timestamp: number;
}

let roadDataCache: RoadDataCache | null = null;

/**
 * Query Overpass API for A and B roads in a bounding box
 */
async function queryOverpassForRoads(
  south: number,
  west: number,
  north: number,
  east: number
): Promise<RoadSegment[]> {
  // Overpass QL query for A roads (trunk, primary) and B roads (secondary)
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

  // Build node lookup
  const nodes: Map<number, [number, number]> = new Map();
  for (const element of data.elements) {
    if (element.type === 'node') {
      nodes.set(element.id, [element.lat, element.lon]);
    }
  }

  // Extract road segments
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

/**
 * Convert lat/lng to OS grid key (100m grid)
 * This is a simplified conversion - for accuracy we'd need proj4
 */
function latLngToGridKey(lat: number, lng: number): string {
  // Approximate conversion from WGS84 to British National Grid
  // This is a simplified formula - good enough for 100m grid squares
  const lat0 = 49.0;
  const lng0 = -2.0;
  const k0 = 0.9996012717;
  const e0 = 400000;
  const n0 = -100000;

  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const lng0Rad = (lng0 * Math.PI) / 180;

  // Simplified transverse mercator (good for UK)
  const a = 6377563.396; // Airy 1830 semi-major axis
  const n = (a - 6356256.909) / (a + 6356256.909);

  const latDiff = lat - lat0;
  const lngDiff = lng - lng0;

  // Very simplified approximation for UK
  const easting = e0 + lngDiff * 111320 * Math.cos(latRad) * k0;
  const northing = n0 + latDiff * 110540 * k0;

  // Round to 100m grid
  const e = Math.floor(easting / 100) * 100;
  const n2 = Math.floor(northing / 100) * 100;

  return `${e}-${n2}`;
}

/**
 * Check if a line segment intersects with a grid square
 */
function lineIntersectsGrid(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  gridKey: string
): boolean {
  // Get all grid keys along the line segment
  const steps = 10; // Check 10 points along the segment
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

/**
 * Determine which grid squares contain A/B roads
 */
function calculateGridSquaresWithRoads(roads: RoadSegment[]): Set<string> {
  const gridSquares = new Set<string>();

  for (const road of roads) {
    // Add grid key for each coordinate
    for (const [lat, lng] of road.coordinates) {
      const gridKey = latLngToGridKey(lat, lng);
      gridSquares.add(gridKey);
    }

    // Also check points along road segments
    for (let i = 0; i < road.coordinates.length - 1; i++) {
      const [lat1, lng1] = road.coordinates[i];
      const [lat2, lng2] = road.coordinates[i + 1];

      // Sample points along the segment
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

/**
 * Load road data for an area around a position
 */
export async function loadRoadData(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 5
): Promise<void> {
  // Calculate bounding box
  const latDelta = radiusKm / 111; // ~111km per degree latitude
  const lngDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));

  const south = centerLat - latDelta;
  const north = centerLat + latDelta;
  const west = centerLng - lngDelta;
  const east = centerLng + lngDelta;

  // Check if we already have data for this area
  if (roadDataCache) {
    const { bounds } = roadDataCache;
    if (
      south >= bounds.south &&
      north <= bounds.north &&
      west >= bounds.west &&
      east <= bounds.east &&
      Date.now() - roadDataCache.timestamp < 30 * 60 * 1000 // 30 min cache
    ) {
      return; // Already have data
    }
  }

  console.log('Loading road data for area:', { south, west, north, east });

  try {
    const roads = await queryOverpassForRoads(south, west, north, east);
    const gridSquaresWithRoads = calculateGridSquaresWithRoads(roads);

    roadDataCache = {
      bounds: { south, west, north, east },
      roads,
      gridSquaresWithRoads,
      timestamp: Date.now(),
    };

    console.log(
      `Loaded ${roads.length} road segments, ${gridSquaresWithRoads.size} grid squares with roads`
    );
  } catch (error) {
    console.error('Failed to load road data:', error);
  }
}

/**
 * Check if a grid square contains an A or B road
 */
export function gridHasRoad(gridKey: string): boolean {
  if (!roadDataCache) {
    // No data loaded yet - allow all moves
    return true;
  }
  return roadDataCache.gridSquaresWithRoads.has(gridKey);
}

/**
 * Get all grid keys that have roads and are adjacent to the given key
 */
export function getAdjacentRoadGrids(gridKey: string): string[] {
  const [e, n] = gridKey.split('-').map(Number);
  const adjacent = [
    `${e}-${n + 100}`, // North
    `${e}-${n - 100}`, // South
    `${e + 100}-${n}`, // East
    `${e - 100}-${n}`, // West
  ];

  return adjacent.filter((key) => gridHasRoad(key));
}

/**
 * Check if road data is loaded
 */
export function isRoadDataLoaded(): boolean {
  return roadDataCache !== null;
}

/**
 * Get road data cache for debugging
 */
export function getRoadDataCache(): RoadDataCache | null {
  return roadDataCache;
}
