"use client"

import { useEffect, useRef } from "react"
import { useGameStore, GameTurnState } from "@/stores/game-store"
import { useNotificationStore } from "@/stores/notification-store"
import { trpc } from "@/lib/trpc/client"
import { latLngToGridKey, nearestRoadPosition, reachableRoadGrids, gridKeyToLatLng } from "@/lib/road-data"

export default function BotTurnPlayer() {
  const {
    currentPlayerName,
    players,
    sessionId,
    playerId,
    phase,
    gameTurnState,
    setDiceResult,
    setGameTurnState,
    setCurrentPlayer,
    clearGridSelections,
    setPlayerStartGridKey,
    setPendingServerUpdate,
    updatePlayerPosition,
  } = useGameStore()
  const { addNotification } = useNotificationStore()
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const rollDiceMutation = trpc.game.rollDice.useMutation()
  const endTurnMutation = trpc.game.endTurn.useMutation()

  const isBotTurn = phase === "playing"
    && currentPlayerName?.startsWith("Bot ")
    && gameTurnState === GameTurnState.ROLL_DICE

  useEffect(() => {
    if (!isBotTurn || !sessionId || !playerId) return

    if (botTimerRef.current) clearTimeout(botTimerRef.current)

    botTimerRef.current = setTimeout(() => {
      playBotTurn()
    }, 1500)

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
    }
  }, [isBotTurn, currentPlayerName, sessionId, playerId])

  function playBotTurn() {
    if (!sessionId || !playerId || !currentPlayerName) return

    const botPlayer = players.find(p => p.name === currentPlayerName)
    if (!botPlayer) return

    const dice1 = Math.floor(Math.random() * 6) + 1
    const dice2 = Math.floor(Math.random() * 6) + 1
    const total = dice1 + dice2

    addNotification(`${currentPlayerName} rolled ${total}`, "info")

    const snapped = nearestRoadPosition(botPlayer.position[0], botPlayer.position[1])
    const pos = snapped ?? botPlayer.position
    const startGridKey = latLngToGridKey(pos[0], pos[1])
    const reachable = reachableRoadGrids(startGridKey, total, new Set())

    let destination: [number, number] | null = null
    if (reachable && reachable.size > 0) {
      const exactStepGrids = [...reachable.entries()]
        .filter(([, steps]) => steps === total)
        .map(([key]) => key)

      if (exactStepGrids.length > 0) {
        const picked = exactStepGrids[Math.floor(Math.random() * exactStepGrids.length)]
        destination = gridKeyToLatLng(picked)
      }
    }

    setPendingServerUpdate(true)

    rollDiceMutation.mutate({
      sessionId,
      playerId,
      dice1,
      dice2,
    }, {
      onSuccess: () => {
        setTimeout(() => {
          if (destination) {
            updatePlayerPosition(currentPlayerName!, destination)
          }

          endTurnMutation.mutate({
            sessionId: sessionId!,
            playerId: playerId!,
            newLat: destination?.[0],
            newLng: destination?.[1],
          }, {
            onSettled: () => {
              setPendingServerUpdate(false)
            },
          })

          const state = useGameStore.getState()
          const currentIndex = state.players.findIndex(p => p.name === currentPlayerName)
          const nextIndex = (currentIndex + 1) % state.players.length
          const nextPlayer = state.players[nextIndex]

          clearGridSelections()
          setPlayerStartGridKey(null)
          setDiceResult(null)
          setGameTurnState(GameTurnState.ROLL_DICE)
          if (nextPlayer) {
            setCurrentPlayer(nextPlayer.name)
          }
        }, 1000)
      },
      onError: () => {
        setPendingServerUpdate(false)
      },
    })
  }

  return null
}
