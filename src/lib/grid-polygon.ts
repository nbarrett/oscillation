import L from "leaflet";
import { log } from "@/lib/utils";

export function gridKeyToLatLngs(map: L.Map, gridKey: string): L.LatLng[] {
  const [easting, northing] = gridKey.split("-").map(Number);
  const corners = [
    new L.Point(easting, northing + 1000),
    new L.Point(easting + 1000, northing + 1000),
    new L.Point(easting + 1000, northing),
    new L.Point(easting, northing),
  ];
  return corners.map((point) => map.options.crs!.unproject(point));
}

export function createGridPolygon(
  map: L.Map,
  gridKey: string,
  color: string,
  fillOpacity: number,
  className?: string
): L.Polygon | null {
  try {
    const latLngs = gridKeyToLatLngs(map, gridKey);
    return new L.Polygon(latLngs, {
      color,
      weight: 2,
      fillOpacity,
      className,
      interactive: false,
    });
  } catch (e) {
    log.error("Failed to create grid polygon:", e);
    return null;
  }
}
