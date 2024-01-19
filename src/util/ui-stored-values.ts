import { log } from "./logging-config";
import { booleanOf } from "./strings";

export enum StoredValue {
  ACCESS_TOKEN = "access-token",
  CURRENT_PLAYER = "current-player",
  DRIVING_PROFILE = "driving-profile",
  GAME = "game",
  MAPPING_PROVIDER = "mapping-provider",
  MAP_CENTRE_POSITION = "map-centre-position",
  MAP_CLICK_POSITION = "map-click-position",
  MAP_LAYER = "map-layer",
  MAP_ZOOM = "map-zoom",
  MAR = "map",
  PLAYER_ZOOM_REQUEST     = "player-zoom-request",
  ROUTE_DIRECTIONS = "route-directions",
  SELECTED_PLAYER = "selected-player",
}

export function initialValueFor(parameter: string, defaultValue?: any): string {
  const localStorageValue = localStorage.getItem(parameter);
  const value = localStorageValue || defaultValue;
  log.debug("initial value for:", parameter, "localStorage:", localStorageValue, "default:", defaultValue, "is:", value);
  return value;
}

export function initialBooleanValueFor(parameter: string, defaultValue?: any): boolean {
  return booleanOf(initialValueFor(parameter, defaultValue));
}

export function itemExistsFor(parameter: string): boolean {
  return !!localStorage.getItem(parameter);
}

export function saveValueFor(parameter: string, value?: any) {
  if (parameter) {
    const storedValue: string = typeof value === "object" ? JSON.stringify(value) : value.toString();
    log.debug("saving value for:", parameter, "as:", storedValue);
    localStorage.setItem(parameter, storedValue);
  } else {
    log.error("saveValueFor:no parameter value supplied for value:", value);
  }
}

export function removeItemFor(parameter: string) {
  log.debug("removing value for:", parameter);
  localStorage.removeItem(parameter);
}
