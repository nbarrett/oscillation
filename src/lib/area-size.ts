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
  tutorial: { label: "Tutorial", widthKm: 16, heightKm: 16, roadRadiusKm: 12, recommendedPlayers: "1 player" },
  small: { label: "Small", widthKm: 20, heightKm: 20, roadRadiusKm: 16, recommendedPlayers: "2-4 players" },
  standard: { label: "Standard", widthKm: 34, heightKm: 28, roadRadiusKm: 30, recommendedPlayers: "2-4 players" },
  large: { label: "Large", widthKm: 50, heightKm: 40, roadRadiusKm: 40, recommendedPlayers: "4+ players" },
};

export const DEFAULT_AREA_SIZE: AreaSize = "standard";

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface GameBounds {
  south: number;
  north: number;
  west: number;
  east: number;
  corners: [LatLngPoint, LatLngPoint, LatLngPoint, LatLngPoint];
}

export function areaSizeBounds(startLat: number, startLng: number, areaSize: AreaSize): GameBounds {
  const preset = AREA_SIZE_PRESETS[areaSize];
  const [easting, northing] = proj4("EPSG:4326", BNG, [startLng, startLat]);

  const gridE = Math.floor(easting / 1000) * 1000;
  const gridN = Math.floor(northing / 1000) * 1000;

  const halfW = Math.floor(preset.widthKm / 2) * 1000;
  const halfH = Math.floor(preset.heightKm / 2) * 1000;

  const westE = gridE - halfW;
  const eastE = gridE + halfW + 1000;
  const southN = gridN - halfH;
  const northN = gridN + halfH + 1000;

  const [swLng, swLat] = proj4(BNG, "EPSG:4326", [westE, southN]);
  const [seLng, seLat] = proj4(BNG, "EPSG:4326", [eastE, southN]);
  const [neLng, neLat] = proj4(BNG, "EPSG:4326", [eastE, northN]);
  const [nwLng, nwLat] = proj4(BNG, "EPSG:4326", [westE, northN]);

  return {
    south: swLat,
    north: neLat,
    west: swLng,
    east: neLng,
    corners: [
      { lat: swLat, lng: swLng },
      { lat: seLat, lng: seLng },
      { lat: neLat, lng: neLng },
      { lat: nwLat, lng: nwLng },
    ],
  };
}

export function isWithinBounds(lat: number, lng: number, bounds: GameBounds): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

