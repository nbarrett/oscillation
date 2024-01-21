import { atom, atomFamily, RecoilState } from "recoil";
import { initialValueFor, saveValueFor, StoredValue } from "../util/ui-stored-values";
import { log } from "../util/logging-config";
import { removeToJSONFrom } from "../mappings/atom-mappings";
import { queryDirections } from "../data-services/route-data-services";
import {
    DirectionsResponse,
    Profile,
    RouteDirectionsRequest,
    SerializableRouteDirectionsRequest
} from "../models/route-models";
import { enumForKey } from "../util/enums";

export const routeDirectionsState: (routeDirectionsRequest: SerializableRouteDirectionsRequest) => RecoilState<DirectionsResponse> = atomFamily({
  key: StoredValue.ROUTE_DIRECTIONS,
  default: null,
  effects: (routeDirectionsRequest: SerializableRouteDirectionsRequest) => [
    ({setSelf}) => {
      const request: RouteDirectionsRequest = removeToJSONFrom<RouteDirectionsRequest>(routeDirectionsRequest);
      if (request?.start && request?.end && request?.profile) {
        log.info("routeDirectionsState:querying api with request:", request);
        queryDirections(request).then(directionsResponse => {
          log.info("routeDirectionsState:queried directionsResponse with routeDirectionsRequest", request, "returned:", directionsResponse);
          setSelf(directionsResponse);
        }).catch(log.error);
      } else {
        log.info("routeDirectionsState:not querying api as request:", request);
      }
    },
  ]
});

export const profileState: RecoilState<Profile> = atom({
  key: StoredValue.DRIVING_PROFILE,
  default: enumForKey(Profile, initialValueFor(StoredValue.DRIVING_PROFILE, Profile.DRIVING_CAR)),
  effects: [
    ({onSet}) => {
      onSet(mapZoom => {
        log.info(StoredValue.DRIVING_PROFILE, "set to:", mapZoom);
        saveValueFor(StoredValue.DRIVING_PROFILE, mapZoom);
      });
    },
  ],
});


