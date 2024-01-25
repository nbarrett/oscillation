import React, { useEffect, useState } from 'react';
import { Button, Grid, Stack } from "@mui/material";
import CasinoIcon from '@mui/icons-material/Casino';
import { colours, GameTurnState } from '../models/game-models';
import { Player } from "../models/player-models";
import { useRecoilValue } from "recoil";
import { log } from "../util/logging-config";
import { useGameState } from "../hooks/use-game-state";
import Typography from "@mui/material/Typography";
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { currentPlayerState } from "../atoms/game-atoms";
import { GridSelectionButton } from "./GridSelectionButton";

export function DiceRoller() {

    const player: Player = useRecoilValue<Player>(currentPlayerState);
    const [isRolling, setRolling] = useState(false);
    const [dice1Value, setDice1Value] = useState(0);
    const [dice2Value, setDice2Value] = useState(0);
    const total = dice1Value + dice2Value;
    const playerName = player?.name || "";
    const gameState = useGameState();

    useEffect(() => {
        log.debug("isRolling:", isRolling, "total changed to:", total);
        if (total && !isRolling) {
            gameState.handleDiceRoll(total);
        }
    }, [total, isRolling]);

    function rollDice() {
        if (!isRolling) {
            setRolling(true);

            const rollInterval = setInterval(() => {
                setDice1Value(Math.floor(Math.random() * 6) + 1);
                setDice2Value(Math.floor(Math.random() * 6) + 1);
            }, 100);

            setTimeout(() => {
                clearInterval(rollInterval);
                setRolling(false);
            }, 800);
        }
    }



    return (
        <Grid pt={2} container alignItems={"center"} spacing={2} mb={2}>
            <Grid item xs={12} xl={6}>
                <Stack direction={"row"} alignItems={"center"} spacing={1}>
                    <Button fullWidth variant="contained"
                            color="primary"
                            onClick={rollDice}
                            disabled={isRolling || gameState.gameData.gameTurnState !== GameTurnState.ROLL_DICE}
                            sx={{
                                '&': {
                                    backgroundColor: colours.osMapsPurple,
                                },
                                '&:hover': {
                                    backgroundColor: colours.osMapsPink,
                                },
                            }}>{isRolling ? `${playerName} Rolling...` : `${playerName} Roll Dice`}</Button>
                    <Button fullWidth variant="contained"
                            color="primary"
                            onClick={() => gameState.handleGameTurnStateChange(GameTurnState.END_TURN)}
                            disabled={gameState.gameData.gameTurnState !== GameTurnState.DICE_ROLLED}
                            sx={{
                                '&': {
                                    backgroundColor: colours.osMapsPurple,
                                },
                                '&:hover': {
                                    backgroundColor: colours.osMapsPink,
                                },
                            }}>{`${playerName} Turn Complete`}</Button>
                </Stack>
            </Grid>
            <Grid item xs={12} xl={6}>
                <Stack direction={"row"} alignItems={"center"} textAlign={"center"} spacing={1}>
                    <CasinoIcon color={"error"}
                                sx={{
                                    animation: isRolling ? 'spin 2s infinite linear' : 'none',
                                }}
                    />
                    {dice1Value ? <Typography variant="h6">{dice1Value}</Typography> : null}
                    <CasinoIcon color={"error"} sx={{animation: isRolling ? 'spin 2s infinite linear' : 'none'}}/>
                    {dice1Value ? <Typography variant="h6">{dice2Value}</Typography> : null}
                    {isRolling ? null : gameState.gameData.gameTurnState === GameTurnState.DICE_ROLLED && dice1Value ? <>
                        <TrendingFlatIcon/><Typography variant="h6">
                        {playerName} threw {total}
                    </Typography></> : null}
                    <GridSelectionButton/>
                </Stack>
            </Grid>
        </Grid>);
}
