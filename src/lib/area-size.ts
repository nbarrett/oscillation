import proj4 from "proj4";

const BNG = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs";

export type AreaSize = "tutorial" | "small" | "standard" | "large";

export const AREA_SIZES: AreaSize[] = ["tutorial", "small", "standard", "large"];

export interface AreaSizePreset {
  label: string;
  widthKm: number;
  heightKm: number;
  roadRadiusKm: number;
  recommendedPlayers: string;
}

export const AREA_SIZE_PRESETS: Record<AreaSize, AreaSizePreset> = {
  tutorial: { label: "Tutorial", widthKm: 8, heightKm: 8, roadRadiusKm: 6, recommendedPlayers: "1 player" },
  small: { label: "Small", widthKm: 10, heightKm: 10, roadRadiusKm: 8, recommendedPlayers: "2-4 players" },
  standard: { label: "Standard", widthKm: 17, heightKm: 14, roadRadiusKm: 15, recommendedPlayers: "2-4 players" },
  large: { label: "Large", widthKm: 25, heightKm: 20, roadRadiusKm: 20, recommendedPlayers: "4+ players" },
};

export const DEFAULT_AREA_SIZE: AreaSize = "standard";

export interface GameBounds {
  south: number;
  north: number;
  west: number;
  east: number;
}

export function areaSizeBounds(startLat: number, startLng: number, areaSize: AreaSize): GameBounds {
  const preset = AREA_SIZE_PRESETS[areaSize];
  const latDelta = preset.heightKm / 2 / 111;
  const lngDelta = preset.widthKm / 2 / (111 * Math.cos((startLat * Math.PI) / 180));

  return {
    south: startLat - latDelta,
    north: startLat + latDelta,
    west: startLng - lngDelta,
    east: startLng + lngDelta,
  };
}

export function isWithinBounds(lat: number, lng: number, bounds: GameBounds): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

export function gridKeyWithinBounds(gridKey: string, bounds: GameBounds): boolean {
  const [e, n] = gridKey.split("-").map(Number);
  const [lng, lat] = proj4(BNG, "EPSG:4326", [e + 500, n + 500]);
  return isWithinBounds(lat, lng, bounds);
}
