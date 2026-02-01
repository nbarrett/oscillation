"use client"

import { useEffect } from "react"
import { trpc } from "@/lib/trpc/client"
import { useGameStore, GameTurnState } from "@/stores/game-store"

export default function GameSync() {
  const { sessionId, setPlayers, setCurrentPlayer, setDiceResult, setGameTurnState } = useGameStore()

  const { data: gameState } = trpc.game.state.useQuery(
    { sessionId: sessionId! },
    {
      enabled: !!sessionId,
      refetchInterval: 2000,
    }
  )

  useEffect(() => {
    if (gameState) {
      const players = gameState.players.map(p => ({
        name: p.name,
        iconType: p.iconType as "white" | "blue" | "red",
        position: p.position,
      }))

      setPlayers(players)

      const currentPlayer = gameState.players[gameState.currentTurn]
      if (currentPlayer) {
        setCurrentPlayer(currentPlayer.name)
      }

      if (gameState.dice1 !== null && gameState.dice2 !== null) {
        setDiceResult(gameState.dice1 + gameState.dice2)
        setGameTurnState(GameTurnState.DICE_ROLLED)
      } else {
        setGameTurnState(GameTurnState.ROLL_DICE)
      }
    }
  }, [gameState, setPlayers, setCurrentPlayer, setDiceResult, setGameTurnState])

  return null
}
