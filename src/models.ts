import { Icon, LatLngExpression, LatLngTuple } from "leaflet";

export interface Player {
    position: LatLngTuple;
    name: string;
    icon: Icon;
}
