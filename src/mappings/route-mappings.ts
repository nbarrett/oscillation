import first from "lodash-es/first";
import last from "lodash-es/last";

import { RouteDirectionsRequest, SerializableRouteDirectionsRequest } from "../models/route-models";
import { Player } from "../models/player-models";
import { LatLng, LatLngTuple } from "leaflet";

export function createSerializableRouteDirectionsRequest(request: RouteDirectionsRequest): SerializableRouteDirectionsRequest {
    return {...request, toJSON: () => JSON.stringify(request)};
}

export function toApiTupleFromPlayer(player: Player): LatLngTuple {
    const position: LatLngTuple = player.position;
    return toApiTuple(position);
}

export function toApiTuple(position: LatLngTuple | number[]): LatLngTuple {
    return position?.length > 1 ? [position[1], position[0]] : null;
}

export function toLatLngFromLatLngTuple(mapClickPosition: LatLngTuple): LatLng {
    return mapClickPosition ? new LatLng(first(mapClickPosition), last(mapClickPosition)) : null;
}

export function formatLatLong(latLong: LatLng): string {
    if (latLong) {
        const {lat, lng} = latLong;
        return `lat: ${lat.toFixed(5)}, long: ${lng.toFixed(5)}`;
    } else {
        return "";
    }
}
