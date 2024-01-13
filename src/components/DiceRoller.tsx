import React, { useState } from 'react';
import { Button, Stack } from "@mui/material";
import CasinoIcon from '@mui/icons-material/Casino';
import { DiceRollerProps } from '../models/game-piece-models';
import { Player } from "../models/player-models";
import { useRecoilValue } from "recoil";
import { currentPlayerState } from "../atoms/route-atoms";

const DiceRoller: React.FC<DiceRollerProps> = ({onRoll}) => {
    const player: Player = useRecoilValue<Player>(currentPlayerState);
    const [isRolling, setRolling] = useState(false);
    const [dice1Value, setDice1Value] = useState(1);
    const [dice2Value, setDice2Value] = useState(1);
    const total = dice1Value + dice2Value;
    const playerName = player?.name || "";

    const rollDice = () => {
        if (!isRolling) {
            setRolling(true);

            const rollInterval = setInterval(() => {
                setDice1Value(Math.floor(Math.random() * 6) + 1);
                setDice2Value(Math.floor(Math.random() * 6) + 1);
            }, 100);

            setTimeout(() => {
                clearInterval(rollInterval);
                onRoll(total);
                setRolling(false);
            }, 800);
        }
    };


    return (
        <Stack direction={"row"} alignItems={"center"} spacing={1} mb={2}>
            <Button variant="contained"
                    color="primary"
                    onClick={rollDice}
                    disabled={isRolling}
                    sx={{
                        '&:hover': {
                            backgroundColor: '#1976D2', // Change the color on hover if needed
                        },
                    }}>{isRolling ? `${playerName} rolling...` : `${playerName} roll Dice`}</Button>
            <CasinoIcon color={"error"}
                sx={{
                    mr: 1,
                    animation: isRolling ? 'spin 2s infinite linear' : 'none',
                }}
            />
            <p>{dice1Value}</p>
            <CasinoIcon color={"error"} sx={{animation: isRolling ? 'spin 2s infinite linear' : 'none',}}/>
            <p>{dice2Value}</p>
            {isRolling ? null : <p>{playerName} threw: {total} - note that nothing is being done with this yet!</p>}
        </Stack>
    );
};

export default DiceRoller;
