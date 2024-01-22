import { defaultZoom } from "./route-models";
import { Player } from "./player-models";
import { Icon, LatLngTuple } from "leaflet";
import blueCar from "../images/blue-car.png";
import whiteCar from "../images/white-car.png";
import markerIconImage from "leaflet/dist/images/marker-icon.png";
import redCar from "../images/red-car.png";
import { NamedLocation } from "../shared/NamedLocation";

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

export const startingPositionLondon: LatLngTuple = [51.505, -0.09];

export const startingPositionChallock: LatLngTuple = [51.21861, 0.88011];

export const referenceStartingPoints: NamedLocation[] = [
    Object.assign(new NamedLocation(), {name: "London", location: startingPositionLondon}),
    Object.assign(new NamedLocation(), {name: "Challock", location: startingPositionChallock}),
    Object.assign(new NamedLocation(), {name: "Cambridge", location: [52.17487, 0.12830]})
];

export const whiteCarIcon: Icon<{ iconSize: [number, number]; iconUrl: any }> = new Icon({
    iconUrl: whiteCar,
    iconSize: [172, 62]
});

export const blueCarIcon = new Icon({
    iconUrl: blueCar,
    iconSize: [172, 62]
});

export const redCarIcon = new Icon({
    iconUrl: redCar,
    iconSize: [172, 62]
});

export const markerIcon = new Icon({
    iconUrl: markerIconImage,
    iconSize: [72, 52]
});
