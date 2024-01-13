import { atom } from "recoil";
import { StoredValue } from "../util/ui-stored-values";
import { defaultZoom } from "../models/route-models";


export const gameStateAtom = atom({
  key: StoredValue.GAME,
  default: {
    players: [],
    currentPlayer: null,
    profile: null,
    mapCentre: null,
    mapClickPosition: null,
    mapZoom: defaultZoom,
    routeDirectionsRequest: null,
    routeDirectionsResponse: null,
    diceResult: undefined
  },
});
