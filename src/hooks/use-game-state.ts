import { GameData, GameTurnState } from '../models/game-models';
import { useRecoilState, useRecoilValue } from "recoil";
import { currentPlayerState, gameState } from "../atoms/game-atoms";
import { Player } from "../models/player-models";
import { useEffect } from "react";
import { log } from "../util/logging-config";
import { LatLngTuple } from "leaflet";

export function useGameState() {

    const [gameData, setGameData] = useRecoilState<GameData>(gameState);
    const currentPlayer: Player = useRecoilValue<Player>(currentPlayerState);

    useEffect(() => {
        log.info("gameData:", gameData);
    }, [gameData]);

    function initialisePlayers(players: Player[]) {
        setGameData(existing => ({...existing, players}));
    }

    function setCurrentPlayer(currentPlayerName: string) {
        setGameData(existing => ({...existing, currentPlayerName}));
    }

    function setPlayerData(field: keyof Player, value: any) {
        if (currentPlayer) {
            log.info("setPlayerData:setting", currentPlayer.name, "field:", field, "to value:", value);
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
    }

    function playerRouteReceived() {
        const nextPosition: LatLngTuple = currentPlayer?.nextPosition;
        setPlayerData("position", nextPosition);
        setPlayerData("nextPosition", null);
    }

    return {
        gameData,
        handleDiceRoll,
        handleGameTurnStateChange,
        initialisePlayers,
        playerRouteReceived,
        setCurrentPlayer,
        setPlayerData,
    };
}
