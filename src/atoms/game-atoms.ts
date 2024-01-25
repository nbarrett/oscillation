import { atom, GetCallback, GetRecoilValue, RecoilState, RecoilValueReadOnly, selector, selectorFamily } from "recoil";
import { initialValueFor, saveValueFor, StoredValue } from "../util/ui-stored-values";
import { GAME_DEFAULTS, GameData } from "../models/game-models";
import { Player } from "../models/player-models";
import { defaultZoom } from "../models/route-models";
import { LatLngTuple } from "leaflet";
import { log } from "../util/logging-config";
import { SelectedGrid } from "../components/SelectGridSquares";


export const gameState: RecoilState<GameData> = atom({
    key: StoredValue.GAME,
    default: GAME_DEFAULTS,
});

export const selectablePlayerState: (playerName: string) => RecoilValueReadOnly<Player> = selectorFamily({
    key: StoredValue.SELECTED_PLAYER,
    get: (playerName) => ({get}) => {
        return get(gameState).players.find(player => player.name === playerName);
    }
});

export const currentPlayerState: RecoilValueReadOnly<Player> = selector<Player>({
    key: StoredValue.CURRENT_PLAYER,
    get(opts: { get: GetRecoilValue, getCallback: GetCallback }): Player {
        const gameData: GameData = opts.get(gameState);
        return gameData.players.find(player => player.name === gameData?.currentPlayerName);
    }
});

export const playerZoomRequestState: RecoilState<string> = atom({
    key: StoredValue.PLAYER_ZOOM_REQUEST,
    default: null,
});

export const gridClearRequestState: RecoilState<number> = atom({
    key: StoredValue.GRID_CLEAR_REQUEST,
    default: 0,
});

export const mapCentreState: RecoilState<LatLngTuple> = atom({
    key: StoredValue.MAP_CENTRE_POSITION,
    default: null,
});

export const mapClickPositionState: RecoilState<LatLngTuple> = atom({
    key: StoredValue.MAP_CLICK_POSITION,
    default: null,
});

export const selectedGridSquaresState: RecoilState<SelectedGrid[]> = atom({
    key: StoredValue.SELECTED_GRID_SQUARES,
    default: [],
});

export const mapZoomState: RecoilState<number> = atom({
    key: StoredValue.MAP_ZOOM,
    default: +initialValueFor(StoredValue.MAP_ZOOM, defaultZoom),
    effects: [
        ({onSet}) => {
            onSet(mapZoom => {
                log.debug(StoredValue.MAP_ZOOM, "set to:", mapZoom);
                saveValueFor(StoredValue.MAP_ZOOM, mapZoom);
            });
        },
    ],
});
