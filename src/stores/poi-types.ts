export interface PoiItem {
  id: number;
  lat: number;
  lng: number;
  name: string | null;
}

export interface PoiIconOption<T extends string> {
  style: T;
  label: string;
  svg: string;
  simpleSvg: string;
}

export interface FetchedBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export function boundsContained(bounds: FetchedBounds, fetched: FetchedBounds | null): boolean {
  if (!fetched) return false;
  return (
    bounds.south >= fetched.south &&
    bounds.west >= fetched.west &&
    bounds.north <= fetched.north &&
    bounds.east <= fetched.east
  );
}
