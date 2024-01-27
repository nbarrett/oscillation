import isNaN from "lodash-es/isNaN";
import first from "lodash-es/first";
import last from "lodash-es/last";

import { RouteDirectionsRequest, SerializableRouteDirectionsRequest } from "../models/route-models";
import { Player } from "../models/player-models";
import { LatLng, LatLngTuple } from "leaflet";
import { log } from "../util/logging-config";

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

function validLatLong(latlngTuple: LatLng | LatLngTuple): boolean {
    const valid = !!(latlngTuple && !isNaN(latlngTuple[0])) && !isNaN(latlngTuple[1]);
    log.debug("validLatLong:latlngTuple:", latlngTuple, "!isNaN first:", !isNaN(latlngTuple[0]), "!isNaN last:", !isNaN(latlngTuple[1]), "valid:", valid);
    if (!valid) new Error("blah");
    return valid;
}

export function toLatLngFromLatLngTuple(latlngTuple: LatLngTuple): LatLng {
    const valid = validLatLong(latlngTuple);
    log.debug("toLatLngFromLatLngTuple:latlngTuple:", latlngTuple, "valid:", valid);
    return valid ? new LatLng(first(latlngTuple), last(latlngTuple)) : null;
}

export function formatLatLong(latLong: LatLng | LatLngTuple): string {
    if (validLatLong(latLong)) {
        const usedLatLong = isLatLng(latLong) ? latLong : toLatLngFromLatLngTuple(latLong);
        const {lat, lng} = usedLatLong;
        return `lat: ${lat.toFixed(5)}, long: ${lng.toFixed(5)}`;
    } else {
        return "";
    }
}

export function isLatLng(document: any): document is LatLng {
    return (document as LatLng).distanceTo !== undefined;
}
