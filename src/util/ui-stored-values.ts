import { log } from "./logging-config";
import { booleanOf } from "./strings";

export enum StoredValue {
  ACCESS_TOKEN = "access-token",
  CURRENT_PLAYER = "current-player",
  DRIVING_PROFILE = "driving-profile",
  STARTING_POSITION = "starting-position",
  NAMED_LOCATIONS = "named-locations",
  GAME = "game",
  MAPPING_PROVIDER = "mapping-provider",
  CUSTOM_TILE_SELECTION = "custom-tile-selection",
  MAP_CENTRE_POSITION = "map-centre-position",
  MAP_CLICK_POSITION = "map-click-position",
  MAP_LAYER = "map-layer",
  MAP_ZOOM = "map-zoom",
  MAP_OPTIONS = "map-options",
  CRS = "crs",
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

export function initialObjectValueFor<T>(parameter: string, defaultValue?: T): T {
  try {
    const text = initialValueFor(parameter, defaultValue);
    return text ? JSON.parse(text) : defaultValue;
  } catch (e) {
    log.error("initialObjectValueFor:failed to parse value for:", parameter, "error:", e);
    return defaultValue;
  }
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
