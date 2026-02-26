import L from "leaflet";
import proj4 from "proj4";
import { log } from "@/lib/utils";

const BNG = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs";

function bngToLatLng(easting: number, northing: number): L.LatLng {
  const [lng, lat] = proj4(BNG, "EPSG:4326", [easting, northing]);
  return new L.LatLng(lat, lng);
}

export function gridKeyToCenter(gridKey: string): L.LatLng {
  const [easting, northing] = gridKey.split("-").map(Number);
  return bngToLatLng(easting + 500, northing + 500);
}

export function gridKeyToLatLngs(_map: L.Map, gridKey: string): L.LatLng[] {
  const [easting, northing] = gridKey.split("-").map(Number);
  return [
    bngToLatLng(easting, northing + 1000),
    bngToLatLng(easting + 1000, northing + 1000),
    bngToLatLng(easting + 1000, northing),
    bngToLatLng(easting, northing),
  ];
}

export function createGridPolygon(
  map: L.Map,
  gridKey: string,
  color: string,
  fillOpacity: number,
  weight: number = 2,
  className?: string
): L.Polygon | null {
  try {
    const latLngs = gridKeyToLatLngs(map, gridKey);
    return new L.Polygon(latLngs, {
      color,
      weight,
      fillOpacity,
      className,
      interactive: false,
    });
  } catch (e) {
    log.error("Failed to create grid polygon:", e);
    return null;
  }
}
