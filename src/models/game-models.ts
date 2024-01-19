import { defaultZoom } from "./route-models";
import { Player } from "./player-models";
import { LatLngTuple } from "leaflet";

export interface DiceRollerProps {
    onRoll: (result: number) => void;
}

export interface GameData {
    mapCentre: LatLngTuple;
    mapClickPosition: LatLngTuple;
    gameTurnState: GameTurnState;
    currentPlayerName: string;
    players: Player[];
    diceResult: number;
    mapZoom: number;
}

export enum GameTurnState {
    ROLL_DICE = "ROLL_DICE",
    DICE_ROLLED = "DICE_ROLLED",
    MOVE_PLAYER = "MOVE_PLAYER",
    END_TURN = "END_TURN",
}

export const GAME_DEFAULTS: GameData = {
    players: [],
    gameTurnState: GameTurnState.ROLL_DICE,
    currentPlayerName: null,
    mapCentre: null,
    mapClickPosition: null,
    mapZoom: defaultZoom,
    diceResult: null
};
