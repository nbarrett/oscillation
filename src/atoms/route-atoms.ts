import { atomFamily, RecoilState } from "recoil";
import { StoredValue } from "../util/ui-stored-values";
import { log } from "../util/logging-config";
import { removeToJSONFrom } from "../mappings/atom-mappings";
import { queryDirections } from "../data-services/route-data-services";
import { DirectionsResponse, RouteDirectionsRequest, SerializableRouteDirectionsRequest } from "../models/route-models";

export const routeDirectionsState: (routeDirectionsRequest: SerializableRouteDirectionsRequest) => RecoilState<DirectionsResponse> = atomFamily({
  key: StoredValue.ROUTE_DIRECTIONS,
  default: null,
  effects: (routeDirectionsRequest: SerializableRouteDirectionsRequest) => [
    ({setSelf}) => {
      const request: RouteDirectionsRequest = removeToJSONFrom<RouteDirectionsRequest>(routeDirectionsRequest);
      if (request?.start && request?.end) {
        log.info("routeDirectionsState:querying build with request:", request);
        queryDirections(request).then(directionsResponse => {
          log.info("routeDirectionsState:queried directionsResponse with routeDirectionsRequest", request, "returned:", directionsResponse);
          setSelf(directionsResponse);
        }).catch(log.error);
      } else {
        log.info("routeDirectionsState:not querying build as request:", request);
      }
    },
  ]
});


