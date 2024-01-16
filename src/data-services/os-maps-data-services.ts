import queryString from "query-string";
import { handleJSONResponseForParameters } from "./common-data.services";
import { DirectionsResponse, RouteDirectionsRequest } from "../models/route-models";
import { AccessTokenResponse } from "../models/os-maps-models";

export function postDirections(routeDirectionsRequest: RouteDirectionsRequest): Promise<DirectionsResponse> {
    return handleJSONResponseForParameters(`/api/directions`, {
        method: "POST",
        body: JSON.stringify(routeDirectionsRequest)
    });
}

export function refreshAccessToken(): Promise<AccessTokenResponse> {
    return handleJSONResponseForParameters(`/api/token`);
}

export function refreshAccessTokenRaw(): Promise<AccessTokenResponse> {
    return handleJSONResponseForParameters(`/api/token-raw`);
}
