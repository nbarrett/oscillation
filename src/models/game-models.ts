import { defaultZoom } from "./route-models";
import { Player } from "./player-models";
import { LatLngTuple } from "leaflet";

export const colours = {
    blueCar: 'rgb(34 93 173)',
    greyCar: 'rgb(204 205 207)',
    redCar: 'rgb(238 25 29)',
    osMapsPurple: '#453c90',
    osMapsPink: '#d40058'
};

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
