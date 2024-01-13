// components/Dice.tsx
import React from 'react';
import { useRecoilState } from 'recoil';
import DiceRoller from './DiceRoller';
import { gameStateAtom } from "../atoms/game-atoms";

const Dice: React.FC = () => {

    const [gameState, setGameState] = useRecoilState(gameStateAtom);

    function handleDiceRoll(result: number) {
        setGameState({...gameState, diceResult: result});
    }

    return (
        <DiceRoller onRoll={handleDiceRoll}/>
    );
};

export default Dice;
