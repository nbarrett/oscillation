"use client"

import { useEffect, useRef } from "react"
import { useGameStore, GameTurnState, occupiedGridKeys, type SelectedPoi } from "@/stores/game-store"
import { useNotificationStore } from "@/stores/notification-store"
import { useDeckStore } from "@/stores/deck-store"
import { usePubStore } from "@/stores/pub-store"
import { useSpireStore, useTowerStore } from "@/stores/church-store"
import { usePhoneStore } from "@/stores/phone-store"
import { useSchoolStore } from "@/stores/school-store"
import { useRouteStore } from "@/stores/route-store"
import { trpc } from "@/lib/trpc/client"
import { latLngToGridKey, nearestRoadPosition, reachableRoadGrids, gridKeyToLatLng, shortestPath } from "@/lib/road-data"
import { detectPoiVisits } from "@/lib/poi-detection"
import { POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"
import { isOnBoardEdge, isOnMotorwayOrRailway } from "@/lib/deck-triggers"
import { resolveEdgeCard, resolveMotorwayCard } from "@/lib/card-resolution"
import { type GameBounds } from "@/lib/area-size"
import { type DeckType, type ChanceCard, type EdgeCard, type MotorwayCard } from "@/lib/card-decks"

function distanceSq(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat2 - lat1
  const dLng = lng2 - lng1
  return dLat * dLat + dLng * dLng
}

function chooseTarget(
  visitedPois: string[],
  selectedPois: SelectedPoi[] | null,
  startLat: number | null,
  startLng: number | null,
  botLat: number,
  botLng: number,
): { lat: number; lng: number } | null {
  if (selectedPois && selectedPois.length > 0) {
    const visitedSet = new Set(visitedPois)
    const unvisited = selectedPois.filter(
      (poi) => !visitedSet.has(`${poi.category}:${poi.osmId}`)
    )

    if (unvisited.length > 0) {
      let nearest = unvisited[0]
      let nearestDist = distanceSq(botLat, botLng, nearest.lat, nearest.lng)
      for (let i = 1; i < unvisited.length; i++) {
        const d = distanceSq(botLat, botLng, unvisited[i].lat, unvisited[i].lng)
        if (d < nearestDist) {
          nearestDist = d
          nearest = unvisited[i]
        }
      }
      return { lat: nearest.lat, lng: nearest.lng }
    }
  }

  if (startLat != null && startLng != null) {
    return { lat: startLat, lng: startLng }
  }

  return null
}

function pickBestEndpoint(
  candidates: string[],
  target: { lat: number; lng: number },
): string {
  let best = candidates[0]
  let bestDist = Infinity
  for (const gridKey of candidates) {
    const [lat, lng] = gridKeyToLatLng(gridKey)
    const d = distanceSq(lat, lng, target.lat, target.lng)
    if (d < bestDist) {
      bestDist = d
      best = gridKey
    }
  }
  return best
}

export default function BotTurnPlayer() {
  const {
    currentPlayerName,
    players,
    sessionId,
    playerId,
    phase,
    gameTurnState,
    selectedPois,
    poiCandidates,
    pickingPlayerIndex,
    setDiceResult,
    setDiceValues,
    setDiceRolling,
    setGameTurnState,
    setCurrentPlayer,
    clearGridSelections,
    setPlayerStartGridKey,
    setMovementPath,
    setPendingServerUpdate,
    gameBounds,
  } = useGameStore()
  const { addNotification } = useNotificationStore()
  const { missedTurns, decrementMissedTurns, obstructions } = useDeckStore()
  const { startingPosition } = useRouteStore()
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
  const pickPoiMutation = trpc.game.pickPoi.useMutation()

  const currentPicker = players[pickingPlayerIndex % players.length]
  const isBotNeedingPick = phase === "picking"
    && currentPicker?.name.startsWith("Bot ")

  const isBotNeedingRoll = phase === "playing"
    && currentPlayerName?.startsWith("Bot ")
    && gameTurnState === GameTurnState.ROLL_DICE

  const isBotNeedingMove = phase === "playing"
    && currentPlayerName?.startsWith("Bot ")
    && gameTurnState === GameTurnState.DICE_ROLLED

  useEffect(() => {
    if (!isBotNeedingPick || !sessionId || !playerId) return

    if (botTimerRef.current) clearTimeout(botTimerRef.current)

    botTimerRef.current = setTimeout(() => {
      playBotPick()
    }, 1200)

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
    }
  }, [isBotNeedingPick, pickingPlayerIndex, sessionId, playerId])

  useEffect(() => {
    if ((!isBotNeedingRoll && !isBotNeedingMove) || !sessionId || !playerId) return

    if (botTimerRef.current) clearTimeout(botTimerRef.current)

    botTimerRef.current = setTimeout(() => {
      if (isBotNeedingMove) {
        resumeBotMove()
      } else {
        playBotTurn()
      }
    }, 1500)

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current)
    }
  }, [isBotNeedingRoll, isBotNeedingMove, currentPlayerName, sessionId, playerId])

  function playBotPick() {
    if (!sessionId || !playerId) return
    const state = useGameStore.getState()
    const candidates = state.poiCandidates ?? []
    const picked = new Set((state.selectedPois ?? []).map(p => p.category))
    const categories = ["pub", "spire", "tower", "phone", "school"]
    const activeCategory = categories.find(c => !picked.has(c))
    if (!activeCategory) return
    const eligible = candidates.filter(c => c.category === activeCategory)
    if (eligible.length === 0) return
    const chosen = eligible[Math.floor(Math.random() * eligible.length)]
    pickPoiMutation.mutate({ sessionId, playerId, osmId: chosen.osmId, category: chosen.category })
  }

  function advanceToNextPlayer() {
    const state = useGameStore.getState()
    const currentIndex = state.players.findIndex(p => p.name === currentPlayerName)
    const nextIndex = (currentIndex + 1) % state.players.length
    const nextPlayer = state.players[nextIndex]

    clearGridSelections()
    setPlayerStartGridKey(null)
    setDiceResult(null)
    setDiceValues(null)
    setDiceRolling(false)
    setMovementPath([])
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
        break

      case "return_to_start":
        applyChanceEffectMutation.mutate({
          sessionId,
          playerId,
          effectType: "return_to_start",
        })
        break

      case "extra_throw":
        deckStore.setExtraThrow(true)
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
        }
        break
      }
    }
  }

  function findBotMidMovementTrigger(
    path: string[],
    gameBounds: GameBounds | null
  ): { type: "edge" | "motorway"; gridKey: string; stepsUsed: number } | null {
    for (let i = 0; i < path.length; i++) {
      const gridKey = path[i]
      if (isOnBoardEdge(gridKey, gameBounds)) {
        return { type: "edge", gridKey, stepsUsed: i + 1 }
      }
      const mwResult = isOnMotorwayOrRailway(gridKey)
      if (mwResult.triggered) {
        return { type: "motorway", gridKey, stepsUsed: i + 1 }
      }
    }
    return null
  }

  function computeBotPath(botName: string, total: number) {
    const botPlayer = players.find(p => p.name === botName)
    if (!botPlayer) return null

    const snapped = nearestRoadPosition(botPlayer.position[0], botPlayer.position[1])
    const pos = snapped ?? botPlayer.position
    const startGridKey = latLngToGridKey(pos[0], pos[1])

    const excluded = new Set<string>()
    for (const o of obstructions) {
      excluded.add(o.gridKey)
    }

    const reachable = reachableRoadGrids(startGridKey, total, excluded)
    const occupied = occupiedGridKeys(players, botName)
    let destinationGridKey: string | null = null
    let destination: [number, number] | null = null

    if (reachable && reachable.size > 0) {
      const exactStepGrids = [...reachable.entries()]
        .filter(([key, steps]) => steps === total && !occupied.has(key))
        .map(([key]) => key)

      if (exactStepGrids.length > 0) {
        const target = chooseTarget(
          botPlayer.visitedPois,
          selectedPois,
          startingPosition?.lat ?? null,
          startingPosition?.lng ?? null,
          pos[0],
          pos[1],
        )

        if (target) {
          destinationGridKey = pickBestEndpoint(exactStepGrids, target)
        } else {
          destinationGridKey = exactStepGrids[Math.floor(Math.random() * exactStepGrids.length)]
        }
        destination = gridKeyToLatLng(destinationGridKey)
      }
    }

    let finalDestination = destination
    let finalDestinationGridKey = destinationGridKey

    if (destinationGridKey) {
      const path = shortestPath(startGridKey, destinationGridKey, total, excluded)
      if (path) {
        const midResult = findBotMidMovementTrigger(path, gameBounds)
        if (midResult) {
          const deckStore = useDeckStore.getState()
          deckStore.queueDraw(midResult.type)
          const card = deckStore.processNextDraw()
          if (card) {
            let resolvedGridKey: string | null = null
            if (card.deck === "edge" && gameBounds) {
              resolvedGridKey = resolveEdgeCard(card as EdgeCard, midResult.gridKey, gameBounds)
            } else if (card.deck === "motorway") {
              resolvedGridKey = resolveMotorwayCard(card as MotorwayCard, midResult.gridKey)
            }

            if (resolvedGridKey) {
              const remaining = total - midResult.stepsUsed

              if (remaining > 0) {
                const newReachable = reachableRoadGrids(resolvedGridKey, remaining, excluded)
                const newExact = [...newReachable.entries()]
                  .filter(([, steps]) => steps === remaining)
                  .map(([key]) => key)

                if (newExact.length > 0) {
                  const newPicked = newExact[Math.floor(Math.random() * newExact.length)]
                  finalDestination = gridKeyToLatLng(newPicked)
                  finalDestinationGridKey = newPicked
                } else {
                  finalDestination = gridKeyToLatLng(resolvedGridKey)
                  finalDestinationGridKey = resolvedGridKey
                }
              } else {
                finalDestination = gridKeyToLatLng(resolvedGridKey)
                finalDestinationGridKey = resolvedGridKey
              }
            }
            deckStore.clearDrawnCard()
          }
        }
      }
    }

    const movePath = finalDestinationGridKey
      ? shortestPath(startGridKey, finalDestinationGridKey, total, excluded) ?? undefined
      : undefined

    return { finalDestination, finalDestinationGridKey, movePath, startGridKey, excluded }
  }

  function botMoveAndEndTurn(botName: string, total: number, dice1: number, dice2: number) {
    if (!sessionId || !playerId) return

    const botPlayer = players.find(p => p.name === botName)
    if (!botPlayer) return

    const result = computeBotPath(botName, total)
    if (!result) return
    const { finalDestination, finalDestinationGridKey, movePath } = result

    if (movePath && movePath.length > 0) {
      setMovementPath(movePath)
    }

    botTimerRef.current = setTimeout(() => {
      botExecuteMove(botName, dice1, dice2, finalDestination, finalDestinationGridKey, movePath)
    }, 2500)
  }

  function botExecuteMove(
    botName: string,
    dice1: number,
    dice2: number,
    finalDestination: [number, number] | null,
    finalDestinationGridKey: string | null,
    movePath: string[] | undefined,
  ) {
    if (!sessionId || !playerId) return

    const botPlayer = players.find(p => p.name === botName)
    if (!botPlayer) return

    if (finalDestination) {
      const routeWaypoints: [number, number][] = [botPlayer.position]
      if (movePath) {
        for (const key of movePath) {
          routeWaypoints.push(gridKeyToLatLng(key))
        }
      } else {
        routeWaypoints.push(finalDestination)
      }
      useGameStore.getState().setPlayers(
        players.map(p =>
          p.name === botName
            ? { ...p, previousPosition: p.position, position: finalDestination!, completedRoute: routeWaypoints }
            : p
        )
      )
    }

    let visitedPoiIds: string[] = []
    if (finalDestinationGridKey) {
      const visits = detectPoiVisits(finalDestinationGridKey, pubs, spires, towers, phones, schools, selectedPois)
      visitedPoiIds = visits.map(v => v.id)

      if (visits.length > 0) {
        const categoryLabel = POI_CATEGORY_LABELS[visits[0].category as PoiCategory] ?? visits[0].category
        addNotification(`${botName} visited ${categoryLabel}`, "success")
        drawCardMutation.mutate({
          sessionId,
          playerId,
          poiCategory: visits[0].category,
          gridKey: finalDestinationGridKey,
        })
      }
    }

    if (dice1 === dice2) {
      const deckStore = useDeckStore.getState()
      deckStore.queueDraw("chance")
      let drawnCard = deckStore.processNextDraw()
      while (drawnCard) {
        if (drawnCard.deck === "chance") {
          processBotCardEffect(drawnCard as ChanceCard)
        }
        drawnCard = useDeckStore.getState().processNextDraw()
      }
    }

    endTurnMutation.mutate({
      sessionId,
      playerId,
      newLat: finalDestination?.[0],
      newLng: finalDestination?.[1],
      visitedPoiIds: visitedPoiIds.length > 0 ? visitedPoiIds : undefined,
      movePath,
    }, {
      onSettled: () => {
        setPendingServerUpdate(false)
      },
    })

    if (useDeckStore.getState().extraThrow) {
      useDeckStore.getState().setExtraThrow(false)
      clearGridSelections()
      setPlayerStartGridKey(null)
      setDiceResult(null)
      setDiceValues(null)
      setGameTurnState(GameTurnState.ROLL_DICE)
      botTimerRef.current = setTimeout(() => playBotTurn(), 1500)
    } else {
      advanceToNextPlayer()
    }
  }

  function resumeBotMove() {
    if (!sessionId || !playerId || !currentPlayerName) return

    const state = useGameStore.getState()
    const storedDiceValues = state.diceValues
    const total = state.diceResult
    if (!total || !storedDiceValues) {
      advanceToNextPlayer()
      return
    }

    setPendingServerUpdate(true)
    botMoveAndEndTurn(currentPlayerName, total, storedDiceValues[0], storedDiceValues[1])
  }

  function playBotTurn() {
    if (!sessionId || !playerId || !currentPlayerName) return

    const botMissed = missedTurns[currentPlayerName] ?? 0
    if (botMissed > 0) {
      decrementMissedTurns(currentPlayerName)
      skipMissedTurnMutation.mutate({ sessionId, playerId })
      advanceToNextPlayer()
      return
    }

    const dice1 = Math.floor(Math.random() * 6) + 1
    const dice2 = Math.floor(Math.random() * 6) + 1
    const total = dice1 + dice2

    setPendingServerUpdate(true)
    setDiceRolling(true)

    rollDiceMutation.mutate({
      sessionId,
      playerId,
      dice1,
      dice2,
    }, {
      onError: () => {
        setDiceRolling(false)
        setPendingServerUpdate(false)
        advanceToNextPlayer()
      },
    })

    botTimerRef.current = setTimeout(() => {
      setDiceRolling(false)
      setDiceValues([dice1, dice2])
      useGameStore.getState().handleDiceRoll(total)

      botTimerRef.current = setTimeout(() => {
        botMoveAndEndTurn(currentPlayerName!, total, dice1, dice2)
      }, 3000)
    }, 2000)
  }

  return null
}
