import { atom, atomFamily, RecoilState } from "recoil";
import { StoredValue } from "../util/ui-stored-values";
import { log } from "../util/logging-config";
import { removeToJSONFrom } from "../mappings/atom-mappings";
import { queryDirections } from "../data-services/route-data-services";
import {
  defaultZoom,
  DirectionsResponse, Profile,
  RouteDirectionsRequest,
  SerializableRouteDirectionsRequest
} from "../models/route-models";
import { Player } from "../models/player-models";
import { LatLngTuple } from "leaflet";
import { MapLayer } from "../models/os-maps-models";

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

export const playersState: RecoilState<Player[]> = atom({
  key: StoredValue.PLAYERS,
  default: [],
});

export const currentPlayerState: RecoilState<Player> = atom({
  key: StoredValue.CURRENT_PLAYER,
  default: null,
});

export const profileState: RecoilState<Profile> = atom({
  key: StoredValue.DRIVING_PROFILE,
  default: null,
});

export const mapCentreState: RecoilState<LatLngTuple> = atom({
  key: StoredValue.MAP_CENTRE_POSITION,
  default: null,
});

export const mapClickPositionState: RecoilState<LatLngTuple> = atom({
  key: StoredValue.MAP_CLICK_POSITION,
  default: null,
});

export const mapZoomState: RecoilState<number> = atom({
  key: StoredValue.MAP_ZOOM,
  default: defaultZoom,
});


