import { Icon, LatLngTuple } from "leaflet";

export interface Player {
    position: LatLngTuple;
    nextPosition?: LatLngTuple;
    name: string;
    icon: Icon;
}
