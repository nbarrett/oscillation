import { type OverpassElement } from "./overpass";

const MOTORWAY_PROXIMITY_METRES = 150;

export function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceToSegment(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distanceMetres(px, py, ax, ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return distanceMetres(px, py, ax + t * dx, ay + t * dy);
}

export function isNearMotorway(lat: number, lon: number, motorways: OverpassElement[]): boolean {
  for (const road of motorways) {
    if (!road.geometry) continue;
    for (let i = 0; i < road.geometry.length - 1; i++) {
      const a = road.geometry[i]!;
      const b = road.geometry[i + 1]!;
      if (distanceToSegment(lat, lon, a.lat, a.lon, b.lat, b.lon) <= MOTORWAY_PROXIMITY_METRES) {
        return true;
      }
    }
  }
  return false;
}

export function motorwayOverpassClause(bbox: string): string {
  return `way["highway"~"^(motorway|motorway_link)$"](${bbox});`;
}
