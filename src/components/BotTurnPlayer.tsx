"use client"

import { useEffect, useRef } from "react"
import { useGameStore, GameTurnState } from "@/stores/game-store"
import { useNotificationStore } from "@/stores/notification-store"
import { useDeckStore } from "@/stores/deck-store"
import { usePubStore } from "@/stores/pub-store"
import { useSpireStore, useTowerStore } from "@/stores/church-store"
import { usePhoneStore } from "@/stores/phone-store"
import { useSchoolStore } from "@/stores/school-store"
import { trpc } from "@/lib/trpc/client"
import { latLngToGridKey, nearestRoadPosition, reachableRoadGrids, gridKeyToLatLng } from "@/lib/road-data"
import { detectPoiVisits } from "@/lib/poi-detection"
import { POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"
import { isNearBoundaryEdge, isOnMotorwayOrRailway } from "@/lib/deck-triggers"
import { type DeckType, type ChanceCard } from "@/lib/card-decks"

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
    selectedPois,
    gameBounds,
  } = useGameStore()
  const { addNotification } = useNotificationStore()
  const { missedTurns, decrementMissedTurns, obstructions } = useDeckStore()
  const pubs = usePubStore(s => s.pubs)
  const spires = useSpireStore(s => s.spires)
  const towers = useTowerStore(s => s.towers)
  const phones = usePhoneStore(s => s.phones)
  const schools = useSchoolStore(s => s.schools)
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const rollDiceMutation = trpc.game.rollDice.useMutation()
  const endTurnMutation = trpc.game.endTurn.useMutation()
  const skipMissedTurnMutation = trpc.game.skipMissedTurn.useMutation()
  const drawCardMutation = trpc.game.drawCard.useMutation()
  const applyChanceEffectMutation = trpc.game.applyChanceEffect.useMutation()
  const placeObstructionMutation = trpc.game.placeObstruction.useMutation()
  const removeObstructionMutation = trpc.game.removeObstruction.useMutation()

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

  function advanceToNextPlayer() {
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
  }

  function processBotCardEffect(card: ChanceCard) {
    if (!sessionId || !playerId || !currentPlayerName) return

    const deckStore = useDeckStore.getState()
    const effect = card.effect

    switch (effect.type) {
      case "miss_turn":
        applyChanceEffectMutation.mutate({
          sessionId,
          playerId,
          effectType: "miss_turn",
          missedTurns: effect.turns,
        })
        addNotification(`${currentPlayerName} must miss ${effect.turns} turn(s)!`, "info")
        break

      case "return_to_start":
        applyChanceEffectMutation.mutate({
          sessionId,
          playerId,
          effectType: "return_to_start",
        })
        addNotification(`${currentPlayerName} returns to start!`, "info")
        break

      case "extra_throw":
        deckStore.setExtraThrow(true)
        addNotification(`${currentPlayerName} gets an extra throw!`, "success")
        break

      case "place_obstruction": {
        const botPlayer = players.find(p => p.name === currentPlayerName)
        if (botPlayer) {
          const snapped = nearestRoadPosition(botPlayer.position[0], botPlayer.position[1])
          const pos = snapped ?? botPlayer.position
          const nearGridKey = latLngToGridKey(pos[0], pos[1])
          const nearby = reachableRoadGrids(nearGridKey, 3, new Set())
          if (nearby && nearby.size > 0) {
            const keys = [...nearby.keys()]
            const gridKey = keys[Math.floor(Math.random() * keys.length)]
            deckStore.addObstruction({ gridKey, color: effect.color, placedByPlayerId: playerId })
            placeObstructionMutation.mutate({ sessionId, playerId, gridKey, color: effect.color })
            addNotification(`${currentPlayerName} placed a ${effect.color} obstruction`, "info")
          }
        }
        break
      }

      case "remove_obstruction": {
        const matching = deckStore.obstructions.filter(o => o.color === effect.color)
        if (matching.length > 0) {
          const target = matching[Math.floor(Math.random() * matching.length)]
          deckStore.removeObstruction(target.gridKey)
          removeObstructionMutation.mutate({ sessionId, gridKey: target.gridKey })
          addNotification(`${currentPlayerName} removed a ${effect.color} obstruction`, "info")
        } else {
          addNotification(`No ${effect.color} obstructions to remove`, "info")
        }
        break
      }
    }
  }

  function playBotTurn() {
    if (!sessionId || !playerId || !currentPlayerName) return

    const botMissed = missedTurns[currentPlayerName] ?? 0
    if (botMissed > 0) {
      addNotification(`${currentPlayerName} misses this turn!`, "info")
      decrementMissedTurns(currentPlayerName)
      skipMissedTurnMutation.mutate({ sessionId, playerId })
      advanceToNextPlayer()
      return
    }

    const botPlayer = players.find(p => p.name === currentPlayerName)
    if (!botPlayer) return

    const dice1 = Math.floor(Math.random() * 6) + 1
    const dice2 = Math.floor(Math.random() * 6) + 1
    const total = dice1 + dice2

    addNotification(`${currentPlayerName} rolled ${total}`, "info")

    const snapped = nearestRoadPosition(botPlayer.position[0], botPlayer.position[1])
    const pos = snapped ?? botPlayer.position
    const startGridKey = latLngToGridKey(pos[0], pos[1])

    const excluded = new Set<string>()
    for (const o of obstructions) {
      excluded.add(o.gridKey)
    }

    const reachable = reachableRoadGrids(startGridKey, total, excluded)

    let destination: [number, number] | null = null
    let destinationGridKey: string | null = null
    if (reachable && reachable.size > 0) {
      const exactStepGrids = [...reachable.entries()]
        .filter(([, steps]) => steps === total)
        .map(([key]) => key)

      if (exactStepGrids.length > 0) {
        const picked = exactStepGrids[Math.floor(Math.random() * exactStepGrids.length)]
        destination = gridKeyToLatLng(picked)
        destinationGridKey = picked
      }
    }

    const botMovementPath = destinationGridKey
      ? [startGridKey, destinationGridKey]
      : [startGridKey]

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

          let visitedPoiIds: string[] = []
          if (destinationGridKey) {
            const visits = detectPoiVisits(destinationGridKey, pubs, spires, towers, phones, schools, selectedPois)
            visitedPoiIds = visits.map(v => v.id)
            visits.forEach(v => {
              const categoryLabel = POI_CATEGORY_LABELS[v.category as PoiCategory] ?? v.category
              addNotification(`${currentPlayerName} visited ${categoryLabel}: ${v.name ?? "Unknown"}`, "info")
            })

            if (visits.length > 0) {
              drawCardMutation.mutate({
                sessionId: sessionId!,
                playerId: playerId!,
                poiCategory: visits[0].category,
                gridKey: destinationGridKey,
              })
            }
          }

          const triggeredDecks: DeckType[] = []

          if (isNearBoundaryEdge(destinationGridKey, gameBounds)) {
            triggeredDecks.push("edge")
          }

          if (destinationGridKey) {
            const mwResult = isOnMotorwayOrRailway(destinationGridKey)
            if (mwResult.triggered) {
              triggeredDecks.push("motorway")
            }
          }

          const deckStore = useDeckStore.getState()
          triggeredDecks.forEach(deck => deckStore.queueDraw(deck))

          let drawnCard = deckStore.processNextDraw()
          while (drawnCard) {
            addNotification(`${currentPlayerName} drew: ${drawnCard.title}`, "info")
            if (drawnCard.deck === "chance") {
              processBotCardEffect(drawnCard as ChanceCard)
            }
            drawnCard = useDeckStore.getState().processNextDraw()
          }

          endTurnMutation.mutate({
            sessionId: sessionId!,
            playerId: playerId!,
            newLat: destination?.[0],
            newLng: destination?.[1],
            visitedPoiIds: visitedPoiIds.length > 0 ? visitedPoiIds : undefined,
          }, {
            onSettled: () => {
              setPendingServerUpdate(false)
            },
          })

          if (useDeckStore.getState().extraThrow) {
            useDeckStore.getState().setExtraThrow(false)
            addNotification(`${currentPlayerName} takes an extra throw!`, "success")
            clearGridSelections()
            setPlayerStartGridKey(null)
            setDiceResult(null)
            setGameTurnState(GameTurnState.ROLL_DICE)
            botTimerRef.current = setTimeout(() => playBotTurn(), 1500)
          } else {
            advanceToNextPlayer()
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
