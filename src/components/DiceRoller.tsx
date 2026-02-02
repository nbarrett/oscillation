"use client"

import { useEffect, useState } from "react"
import { Dices, CheckCircle2 } from "lucide-react"
import { GameTurnState, useCurrentPlayer, useGameStore } from "@/stores/game-store"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"
import { DiceDisplay } from "@/components/ui/dice"
import GridSelectionButton from "./GridSelectionButton"
import { cn } from "@/lib/cn"

export default function DiceRoller() {
  const player = useCurrentPlayer()
  const {
    gameTurnState,
    handleDiceRoll,
    handleEndTurn,
    sessionId,
    playerId,
    players,
    currentPlayerName,
    diceResult,
    movementPath,
  } = useGameStore()

  const [isRolling, setRolling] = useState(false)
  const [hasSettled, setHasSettled] = useState(false)
  const [hasRolled, setHasRolled] = useState(false)
  const [dice1Value, setDice1Value] = useState(1)
  const [dice2Value, setDice2Value] = useState(1)
  const total = dice1Value + dice2Value
  const playerName = player?.name || ""

  const rollDiceMutation = trpc.game.rollDice.useMutation()
  const endTurnMutation = trpc.game.endTurn.useMutation()

  useEffect(() => {
    if (hasSettled && !isRolling) {
      if (sessionId && playerId) {
        rollDiceMutation.mutate({
          sessionId,
          playerId,
          dice1: dice1Value,
          dice2: dice2Value,
        })
      } else {
        handleDiceRoll(total)
      }
      setHasSettled(false)
    }
  }, [hasSettled, isRolling, total, handleDiceRoll, sessionId, playerId, dice1Value, dice2Value, rollDiceMutation])

  function rollDice() {
    if (!isRolling) {
      setRolling(true)
      setHasSettled(false)
      setHasRolled(true)

      setTimeout(() => {
        setDice1Value(Math.floor(Math.random() * 6) + 1)
        setDice2Value(Math.floor(Math.random() * 6) + 1)
        setRolling(false)
        setHasSettled(true)
      }, 2000)
    }
  }

  function handleEndTurnClick() {
    if (sessionId && playerId) {
      endTurnMutation.mutate({ sessionId, playerId })
    } else {
      handleEndTurn()
    }
  }

  const showResult = !isRolling && gameTurnState === GameTurnState.DICE_ROLLED

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {hasRolled && (
        <div className="flex items-center gap-3">
          <div className={cn(!isRolling && showResult && "animate-dice-settle")}>
            <DiceDisplay
              dice1={dice1Value}
              dice2={dice2Value}
              isRolling={isRolling}
            />
          </div>

          {showResult && (
            <div className="flex flex-col">
              <div className="text-lg font-bold text-primary whitespace-nowrap">
                You rolled {total}!
              </div>
              {diceResult && (
                <div className="text-sm text-muted-foreground">
                  <div>Moves: {movementPath.length}/{diceResult}</div>
                  <div className="text-xs">Click green squares (A/B roads only)</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showResult && (
        <p className="text-sm text-muted-foreground sm:hidden">
          {playerName} rolled {total}
        </p>
      )}

      <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
        <Button
          className="flex-1 sm:flex-none gap-2"
          onClick={rollDice}
          disabled={isRolling || gameTurnState !== GameTurnState.ROLL_DICE}
        >
          <Dices className="h-4 w-4" />
          {isRolling ? "Rolling..." : "Roll Dice"}
        </Button>
        <Button
          className="flex-1 sm:flex-none gap-2"
          variant="secondary"
          onClick={handleEndTurnClick}
          disabled={gameTurnState !== GameTurnState.DICE_ROLLED}
        >
          <CheckCircle2 className="h-4 w-4" />
          End Turn
        </Button>
        <GridSelectionButton />
      </div>
    </div>
  )
}
