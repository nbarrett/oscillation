import queryString from "query-string";
import { handleJSONResponseForParameters } from "./common-data.services";
import { DirectionsResponse, RouteDirectionsRequest } from "../models/route-models";

export function postDirections(routeDirectionsRequest: RouteDirectionsRequest): Promise<DirectionsResponse> {
    return handleJSONResponseForParameters(`/api/directions`, {
        method: "POST",
        body: JSON.stringify(routeDirectionsRequest)
    });
}

export function queryDirections(routeDirectionsRequest: RouteDirectionsRequest): Promise<DirectionsResponse> {
    return handleJSONResponseForParameters(`/api/directions?${queryString.stringify(routeDirectionsRequest)}`);
}
