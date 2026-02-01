"use client"

import { useEffect, useRef } from "react"
import { trpc } from "@/lib/trpc/client"
import { useGameStore, GameTurnState, Player } from "@/stores/game-store"

export default function GameSync() {
  const { sessionId, players: localPlayers, setPlayers, setCurrentPlayer, setDiceResult, setGameTurnState, leaveSession } = useGameStore()
  const hasCheckedSession = useRef(false)

  const { data: gameState, isFetched } = trpc.game.state.useQuery(
    { sessionId: sessionId! },
    {
      enabled: !!sessionId,
      refetchInterval: 2000,
    }
  )

  useEffect(() => {
    if (isFetched && !gameState && sessionId && !hasCheckedSession.current) {
      hasCheckedSession.current = true
      leaveSession()
    }
  }, [isFetched, gameState, sessionId, leaveSession])

  useEffect(() => {
    if (gameState) {
      const players: Player[] = gameState.players.map(p => {
        const localPlayer = localPlayers.find(lp => lp.name === p.name)
        if (localPlayer?.previousPosition) {
          return {
            name: p.name,
            iconType: p.iconType as "white" | "blue" | "red",
            position: localPlayer.position,
            previousPosition: localPlayer.previousPosition,
          }
        }
        return {
          name: p.name,
          iconType: p.iconType as "white" | "blue" | "red",
          position: localPlayer?.position ?? p.position,
        }
      })

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
