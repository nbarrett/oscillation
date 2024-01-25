import first from "lodash-es/first";
import last from "lodash-es/last";

import { blueCarIcon, GameData, GameTurnState, redCarIcon, whiteCarIcon } from '../models/game-models';
import { SetterOrUpdater, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { currentPlayerState, gameState, gridClearRequestState, playerZoomRequestState } from "../atoms/game-atoms";
import { Player } from "../models/player-models";
import { useEffect } from "react";
import { log } from "../util/logging-config";
import { Icon, LatLngTuple } from "leaflet";
import { startingPositionState } from "../atoms/route-atoms";

export function useGameState() {

    const [gameData, setGameData] = useRecoilState<GameData>(gameState);
    const currentPlayer: Player = useRecoilValue<Player>(currentPlayerState);
    const startingPosition = useRecoilValue(startingPositionState);
    const setPlayerZoomRequest: SetterOrUpdater<string> = useSetRecoilState<string>(playerZoomRequestState);
    const setGridClearRequest: SetterOrUpdater<number> = useSetRecoilState<number>(gridClearRequestState);


    function clearSelections() {
        setGridClearRequest(existing => existing + 1);
    }

    useEffect(() => {
        log.debug("gameData:", gameData);
    }, [gameData]);


    function startingPositionFor(index: number): LatLngTuple {
        return [first(startingPosition?.location) + 0.00014023745552549371 * index, last(startingPosition?.location) + -0.0002467632293701172 * index];
    }

    function generatePlayers(icons: Icon[]): Player[] {
        return icons.map((icon, index) => ({name: `Player ${index + 1}`, icon, position: startingPositionFor(index)}));
    }

    function initialisePlayers() {
        if (startingPosition) {
            const players = generatePlayers([whiteCarIcon, blueCarIcon, redCarIcon]);
            log.debug("initialising players to:", players);
            setGameData(existing => ({...existing, players}));
            setPlayerZoomRequest(players[0].name);
        } else {
            log.debug("cant initialise players as startingPosition not set");
        }
    }

    function setCurrentPlayer(currentPlayerName: string) {
        setGameData(existing => ({...existing, currentPlayerName}));
    }

    function setPlayerData(field: keyof Player, value: any) {
        if (currentPlayer) {
            log.debug("setPlayerData:setting", currentPlayer.name, "field:", field, "to value:", value);
            setGameData(existing => ({
                ...existing, players: existing.players.map(player => player?.name === gameData?.currentPlayerName ? ({
                    ...player, [field]: value
                }) : player)
            }));
        } else {
            log.error("Can't set field:", field, "to value:", value, "as current player not set");
        }
    }

    function handleDiceRoll(result: number) {
        setGameData(existing => ({...existing, diceResult: result, gameTurnState: GameTurnState.DICE_ROLLED}));
    }

    function handleGameTurnStateChange(gameTurnState: GameTurnState) {
        setGameData(existing => ({...existing, gameTurnState}));
        if (gameTurnState === GameTurnState.END_TURN) {
            clearSelections();
        }
    }

    function playerRouteReceived() {
        const nextPosition: LatLngTuple = currentPlayer?.nextPosition;
        setPlayerData("position", nextPosition);
        setPlayerData("nextPosition", null);
    }

    return {
        startingPosition,
        gameData,
        handleDiceRoll,
        handleGameTurnStateChange,
        initialisePlayers,
        playerRouteReceived,
        setCurrentPlayer,
        setPlayerData,
    };
}
