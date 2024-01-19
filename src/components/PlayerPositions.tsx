import { SetterOrUpdater, useRecoilValue, useSetRecoilState } from "recoil";
import { Player } from "../models/player-models";
import React, { useEffect } from "react";
import { LatLng } from "leaflet";
import { Box, Grid } from "@mui/material";
import Link from "@mui/material/Link";
import { formatLatLong } from "../mappings/route-mappings";
import { GameTurnState } from "../models/game-models";
import { log } from "../util/logging-config";
import { useGameState } from "../hooks/use-game-state";
import { currentPlayerState, playerZoomRequestState } from "../atoms/game-atoms";

export function PlayerPositions() {

    const setPlayerZoomRequest: SetterOrUpdater<string> = useSetRecoilState<string>(playerZoomRequestState);
    const currentPlayer: Player = useRecoilValue<Player>(currentPlayerState);
    const gameState = useGameState();
    const players = gameState.gameData.players;

    useEffect(() => {
        if (players?.length > 0 && !currentPlayer) {
            log.info("initialising current player to :", players[0]);
            gameState.setCurrentPlayer(players[0].name);
        }
    }, [currentPlayer, players]);

    useEffect(() => {
        log.info("gameTurnState received:", gameState.gameData.gameTurnState);
        if (gameState.gameData?.gameTurnState === GameTurnState.END_TURN) {
            selectNextPlayer();
        }
    }, [gameState.gameData]);

    function selectNextPlayer() {
        const currentPlayerIndex = players.findIndex(player => player.name === currentPlayer.name);
        const newIndex: number = currentPlayerIndex < players.length - 1 ? currentPlayerIndex + 1 : 0;
        log.info("gameTurnState received:", gameState.gameData.gameTurnState, 'currentPlayerIndex:', currentPlayerIndex, "newIndex:", newIndex);
        const newPlayer: Player = players[newIndex];
        if (newPlayer) {
            log.info("setting current player to:", newPlayer);
            gameState.setCurrentPlayer(newPlayer.name);
            setPlayerZoomRequest(newPlayer.name)
            gameState.handleGameTurnStateChange(GameTurnState.ROLL_DICE);
        } else {
            log.error("unable to find next player");
        }
    }


    return <Grid container direction={"row"} spacing={1}>
        {players.map(player => <Grid item xs key={player.name}>
            <Link onClick={() => setPlayerZoomRequest(player.name)} sx={{cursor: "pointer"}}
                  key={player.name}>{player.name}</Link>
            <Box>lat-long: {formatLatLong(new LatLng(player.position[0], player.position[1]))}</Box>
        </Grid>)}
    </Grid>;
}
