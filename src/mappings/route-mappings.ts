import { RouteDirectionsRequest, SerializableRouteDirectionsRequest } from "../models/route-models";

export function createSerializableRouteDirectionsRequest(request: RouteDirectionsRequest): SerializableRouteDirectionsRequest {
    return {...request, toJSON: () => JSON.stringify(request)};
}
