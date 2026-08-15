"use client"

import { useEffect, useRef, useState } from "react"
import { Dices, CheckCircle2, LocateFixed, ChevronLeft, ChevronRight } from "lucide-react"
import { GameTurnState, useCurrentPlayer, useGameStore } from "@/stores/game-store"
import { gridKeyToLatLng, latLngToGridKey } from "@/lib/road-data"
import { trpc } from "@/lib/trpc/client"
import { usePubStore } from "@/stores/pub-store"
import { useSpireStore, useTowerStore } from "@/stores/church-store"
import { usePhoneStore } from "@/stores/phone-store"
import { useSchoolStore } from "@/stores/school-store"
import { useNotificationStore } from "@/stores/notification-store"
import { useDeckStore } from "@/stores/deck-store"
import { detectPoiVisits } from "@/lib/poi-detection"
import { POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"
import { type ChanceCard, type DeckType, type EdgeCard, type MotorwayCard } from "@/lib/card-decks"
import { listEdgeCardMatches, listMotorwayCardMatches, resolveEdgeCard, resolveMotorwayCard } from "@/lib/card-resolution"
import { cardTriggerForPath, chanceEffectOf, doublesObstructionMode, shouldGrantExtraThrow } from "@/lib/turn-resolution"
import { Button } from "@/components/ui/button"
import { DiceDisplay } from "@/components/ui/dice"
import GridSelectionButton from "./GridSelectionButton"
import CardDrawDialog from "./CardDrawDialog"
import TokenCollectedDialog, { type TokenCollection } from "./TokenCollectedDialog"
import { cn } from "@/lib/cn"

const CATEGORY_TO_COLOUR: Record<string, string> = {
  pub: "blue",
  spire: "black",
  tower: "pink",
  phone: "yellow",
  school: "green",
}

export default function DiceRoller() {
  const player = useCurrentPlayer()
  const {
    gameTurnState,
    handleEndTurn,
    setPlayerZoomRequest,
    sessionId,
    playerId,
    currentPlayerName,
    diceResult,
    movementPath,
    localPlayerName,
    setPendingServerUpdate,
    phase,
    selectedPois,
    gameBounds,
    cardTrigger,
    setCardTrigger,
    handleCardRelocation,
    previewPaths,
    previewPathIndex,
    cyclePreviewPath,
    confirmPreviewPath,
    diceValues,
    setDiceValues,
    diceRolling: storeDiceRolling,
  } = useGameStore()

  const pubs = usePubStore(s => s.pubs)
  const spires = useSpireStore(s => s.spires)
  const towers = useTowerStore(s => s.towers)
  const phones = usePhoneStore(s => s.phones)
  const schools = useSchoolStore(s => s.schools)
  const { addNotification } = useNotificationStore()
  const {
    missedTurns,
    decrementMissedTurns,
    drawnDeckCard,
    queueDraw,
    processNextDraw,
    clearDrawnCard,
    setExtraThrow,
    setDrawnDeckCard,
    setPlacingObstruction,
    setRemovingObstruction,
    setMissedTurns,
    isPlacingObstruction,
    isRemovingObstruction,
  } = useDeckStore()

  const [localRolling, setRolling] = useState(false)
  const isRolling = localRolling || storeDiceRolling
  const [hasRolled, setHasRolled] = useState(diceValues !== null)
  const [dice1Value, setDice1Value] = useState(diceValues?.[0] ?? 1)
  const [dice2Value, setDice2Value] = useState(diceValues?.[1] ?? 1)

  useEffect(() => {
    if (diceValues) {
      setDice1Value(diceValues[0])
      setDice2Value(diceValues[1])
      setHasRolled(true)
    } else if (storeDiceRolling) {
      setHasRolled(true)
    } else {
      setHasRolled(false)
    }
  }, [diceValues, storeDiceRolling])
  const [drawnCard, setDrawnCard] = useState<{ title: string; body: string; type: string } | null>(null)
  const [pendingTokenCollection, setPendingTokenCollection] = useState<TokenCollection | null>(null)
  const [processingDeckDraws, setProcessingDeckDraws] = useState(false)
  const total = dice1Value + dice2Value
  const playerName = player?.name || ""
  const isMyTurn = localPlayerName !== null && localPlayerName === currentPlayerName
  const isPlaying = phase === "playing"

  const pendingEndTurn = useGameStore((s) => s.pendingEndTurn)
  const setPendingEndTurn = useGameStore((s) => s.setPendingEndTurn)
  const utils = trpc.useUtils()
  const pendingFinishRef = useRef<{
    destination: [number, number] | null
    visitedPoiIds: string[]
    currentPath: string[]
  } | null>(null)
  const finishingRef = useRef(false)
  const chanceDrawnRef = useRef(false)
  const doublesResolvedRef = useRef(false)
  const collectedPoiRef = useRef<string[]>([])

  function requestDeckDraw(deckType: DeckType) {
    if (sessionId && playerId) {
      drawDeckCardMutation.mutate(
        { sessionId, playerId, deckType },
        {
          onSuccess: (result) => {
            if (result?.card) {
              setDrawnDeckCard(result.card)
            } else {
              queueDraw(deckType)
              processNextDraw()
            }
          },
          onError: () => {
            queueDraw(deckType)
            processNextDraw()
          },
        },
      )
      return
    }
    queueDraw(deckType)
    processNextDraw()
  }

  const rollDiceMutation = trpc.game.rollDice.useMutation()
  const endTurnMutation = trpc.game.endTurn.useMutation()
  const applyChanceEffectMutation = trpc.game.applyChanceEffect.useMutation()
  const skipMissedTurnMutation = trpc.game.skipMissedTurn.useMutation()
  const drawDeckCardMutation = trpc.game.drawDeckCard.useMutation()
  const updatePositionMutation = trpc.game.updatePosition.useMutation()

  useEffect(() => {
    if (pendingEndTurn && isMyTurn && gameTurnState === GameTurnState.DICE_ROLLED) {
      setPendingEndTurn(false)
      handleEndTurnClick()
    }
  }, [pendingEndTurn])

  useEffect(() => {
    if (!isMyTurn) {
      if (drawnCard) setDrawnCard(null)
      if (processingDeckDraws) setProcessingDeckDraws(false)
      if (drawnDeckCard) clearDrawnCard()
      if (cardTrigger) setCardTrigger(null)
      finishingRef.current = false
      chanceDrawnRef.current = false
      doublesResolvedRef.current = false
      collectedPoiRef.current = []
      return
    }
    if (cardTrigger && !processingDeckDraws && !drawnDeckCard) {
      setProcessingDeckDraws(true)
      requestDeckDraw(cardTrigger.type)
    }
  }, [isMyTurn, cardTrigger, processingDeckDraws, drawnDeckCard])

  useEffect(() => {
    if (!isMyTurn) return
    if (isPlacingObstruction || isRemovingObstruction) return
    const pending = pendingFinishRef.current
    if (!pending) return
    pendingFinishRef.current = null
    resolveAfterMove(pending.destination, pending.visitedPoiIds, pending.currentPath)
  }, [isMyTurn, isPlacingObstruction, isRemovingObstruction])

  useEffect(() => {
    if (!drawnDeckCard || !cardTrigger) {
      useGameStore.getState().setCardDestinationKeys([])
      return
    }
    if (drawnDeckCard.deck === "edge" && gameBounds) {
      useGameStore.getState().setCardDestinationKeys(
        listEdgeCardMatches(drawnDeckCard as EdgeCard, cardTrigger.gridKey, gameBounds),
      )
    } else if (drawnDeckCard.deck === "motorway") {
      useGameStore.getState().setCardDestinationKeys(
        listMotorwayCardMatches(drawnDeckCard as MotorwayCard, cardTrigger.gridKey),
      )
    }
  }, [drawnDeckCard, cardTrigger, gameBounds])

  function rollDice() {
    if (isRolling) return

    if (currentPlayerName && (missedTurns[currentPlayerName] ?? 0) > 0) {
      addNotification(isMyTurn ? "You must miss this turn!" : `${currentPlayerName} must miss this turn!`, "info")
      decrementMissedTurns(currentPlayerName)
      setPendingServerUpdate(true)
      handleEndTurn()
      if (sessionId && playerId) {
        skipMissedTurnMutation.mutate({ sessionId, playerId }, {
          onSuccess: () => {
            void utils.game.state.invalidate()
          },
          onError: () => {
            useGameStore.getState().setPendingServerUpdate(false)
          },
        })
      } else {
        setPendingServerUpdate(false)
      }
      return
    }

    finishingRef.current = false
    chanceDrawnRef.current = false
    doublesResolvedRef.current = false
    collectedPoiRef.current = []
    setRolling(true)
    setHasRolled(true)
    setPendingServerUpdate(true)

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1
      const d2 = Math.floor(Math.random() * 6) + 1
      setDice1Value(d1)
      setDice2Value(d2)
      setDiceValues([d1, d2])
      setRolling(false)

      const store = useGameStore.getState()
      store.handleDiceRoll(d1 + d2)

      const sid = store.sessionId
      const pid = store.playerId
      if (sid && pid) {
        rollDiceMutation.mutate({
          sessionId: sid,
          playerId: pid,
          dice1: d1,
          dice2: d2,
        }, {
          onSuccess: () => {
            void utils.game.state.invalidate()
          },
          onError: () => {
            useGameStore.getState().setPendingServerUpdate(false)
          },
        })
      } else {
        store.setPendingServerUpdate(false)
      }
    }, 700)
  }

  function notifyPoiVisits(visitedPoiIds: string[], visits: ReturnType<typeof detectPoiVisits>) {
    const existingVisited = new Set(useGameStore.getState().players.find(p => p.name === useGameStore.getState().localPlayerName)?.visitedPois ?? [])
    const newVisits = visits.filter(v => !existingVisited.has(v.id))

    newVisits.forEach(v => {
      const categoryLabel = POI_CATEGORY_LABELS[v.category as PoiCategory] ?? v.category
      addNotification(`Collected ${categoryLabel} token: ${v.name ?? "Unknown"}`, "success")
    })

    if (newVisits.length > 0) {
      const first = newVisits[0]
      setPendingTokenCollection({
        poiId: first.id,
        poiName: first.name ?? null,
        category: first.category,
        colour: CATEGORY_TO_COLOUR[first.category] ?? "blue",
      })
    }
  }

  function visitsForPath(currentPath: string[]) {
    const store = useGameStore.getState()
    const lastGridKey = currentPath.length > 0
      ? currentPath[currentPath.length - 1]
      : null
    const destination = lastGridKey
      ? gridKeyToLatLng(lastGridKey)
      : null
    const destinationGridKey = destination
      ? latLngToGridKey(destination[0], destination[1])
      : null
    const currentPlayer = store.players.find(p => p.name === store.localPlayerName)
    const effectiveGridKey = destinationGridKey
      ?? (currentPlayer ? latLngToGridKey(currentPlayer.position[0], currentPlayer.position[1]) : null)

    if (!effectiveGridKey) {
      return { destination, visitedPoiIds: [] as string[], visits: [] as ReturnType<typeof detectPoiVisits> }
    }

    const visits = detectPoiVisits(effectiveGridKey, pubs, spires, towers, phones, schools, selectedPois, currentPath)
    return { destination, visitedPoiIds: visits.map(v => v.id), visits }
  }

  function resolveAfterMove(
    destination: [number, number] | null,
    visitedPoiIds: string[],
    currentPath: string[],
  ) {
    if (visitedPoiIds.length > 0) {
      collectedPoiRef.current = [...new Set([...collectedPoiRef.current, ...visitedPoiIds])]
    }
    const store = useGameStore.getState()
    const values = store.diceValues
    const obstructionMode = values
      ? doublesObstructionMode(values[0], values[1])
      : null

    if (obstructionMode && !doublesResolvedRef.current) {
      doublesResolvedRef.current = true
      pendingFinishRef.current = { destination, visitedPoiIds, currentPath }
      if (obstructionMode === "place") {
        setPlacingObstruction("pick")
        addNotification("Doubles 1-4: place an obstruction on an A or B road", "info")
      } else {
        setRemovingObstruction("any")
        addNotification("Doubles 5-6: tap an obstruction to remove it, or skip", "info")
      }
      return
    }

    if (visitedPoiIds.length > 0 && !chanceDrawnRef.current) {
      chanceDrawnRef.current = true
      pendingFinishRef.current = { destination, visitedPoiIds, currentPath }
      requestDeckDraw("chance")
      return
    }

    finishEndTurn(destination, visitedPoiIds, currentPath)
  }

  function handleEndTurnClick() {
    const preStore = useGameStore.getState()
    if (preStore.movementPath.length === 0 && preStore.previewPaths.length > 0) {
      preStore.confirmPreviewPath()
    }
    const store = useGameStore.getState()
    if (!store.cardTrigger) {
      const trigger = cardTriggerForPath(store.movementPath, store.gameBounds)
      if (trigger) {
        store.setCardTrigger(trigger)
      }
    }
    if (useGameStore.getState().cardTrigger) {
      return
    }
    const currentPath = useGameStore.getState().movementPath
    const { destination, visitedPoiIds, visits } = visitsForPath(currentPath)
    notifyPoiVisits(visitedPoiIds, visits)
    resolveAfterMove(destination, visitedPoiIds, currentPath)
  }

  function beginExtraThrow() {
    const pending = pendingFinishRef.current
    const store = useGameStore.getState()
    const dest = pending?.destination
    const name = store.currentPlayerName
    if (dest && name) {
      store.updatePlayerPosition(name, dest)
      if (sessionId && playerId) {
        updatePositionMutation.mutate({
          sessionId,
          playerId,
          lat: dest[0],
          lng: dest[1],
        })
      }
    }
    setExtraThrow(false)
    finishingRef.current = false
    chanceDrawnRef.current = false
    doublesResolvedRef.current = false
    pendingFinishRef.current = null
    addNotification("Extra throw! Roll again!", "success")
    store.clearGridSelections()
    store.setPlayerStartGridKey(null)
    store.setGameTurnState(GameTurnState.ROLL_DICE)
    store.setDiceResult(null)
    store.setDiceValues(null)
    setHasRolled(false)
  }

  function handleDeckCardClose() {
    const deckState = useDeckStore.getState()
    const card = deckState.drawnDeckCard
    const trigger = useGameStore.getState().cardTrigger
    const effect = chanceEffectOf(card)
    clearDrawnCard()

    if (card && card.deck === "chance" && sessionId && playerId) {
      const chance = card as ChanceCard
      if (chance.effect.type === "miss_turn") {
        applyChanceEffectMutation.mutate({
          sessionId,
          playerId,
          effectType: "miss_turn",
          missedTurns: chance.effect.turns,
        })
        const name = useGameStore.getState().currentPlayerName
        if (name) setMissedTurns(name, chance.effect.turns)
      } else if (chance.effect.type === "return_to_start") {
        applyChanceEffectMutation.mutate({
          sessionId,
          playerId,
          effectType: "return_to_start",
        })
        const start = useGameStore.getState().startPosition
        const name = useGameStore.getState().currentPlayerName
        if (start && name) {
          useGameStore.getState().updatePlayerPosition(name, start)
        }
      } else if (chance.effect.type === "shortcut_token") {
        applyChanceEffectMutation.mutate({
          sessionId,
          playerId,
          effectType: "shortcut_token",
          shortcutColor: chance.effect.color,
        })
      } else if (chance.effect.type === "extra_throw") {
        applyChanceEffectMutation.mutate({
          sessionId,
          playerId,
          effectType: "extra_throw",
        })
      }
    }

    if (trigger && card && (card.deck === "edge" || card.deck === "motorway")) {
      let destination: string | null = null
      let matches: string[] = []
      if (card.deck === "edge" && gameBounds) {
        destination = resolveEdgeCard(card as EdgeCard, trigger.gridKey, gameBounds)
        matches = listEdgeCardMatches(card as EdgeCard, trigger.gridKey, gameBounds)
      } else if (card.deck === "motorway") {
        destination = resolveMotorwayCard(card as MotorwayCard, trigger.gridKey)
        matches = listMotorwayCardMatches(card as MotorwayCard, trigger.gridKey)
      }

      useGameStore.getState().setCardDestinationKeys(matches)
      setProcessingDeckDraws(false)

      if (destination) {
        const remaining = (diceResult ?? 0) - trigger.stepsUsed
        const destLatLng = gridKeyToLatLng(destination)
        addNotification(`Relocated! ${remaining > 0 ? `${remaining} moves remaining` : "Turn ending"}`, "info")
        handleCardRelocation(destination, remaining)
        useGameStore.getState().setCardDestinationKeys([])
        if (sessionId && playerId) {
          updatePositionMutation.mutate({
            sessionId,
            playerId,
            lat: destLatLng[0],
            lng: destLatLng[1],
          })
        }
        if (remaining > 0) {
          pendingFinishRef.current = null
          return
        }
        const { visitedPoiIds, visits } = visitsForPath([destination])
        notifyPoiVisits(visitedPoiIds, visits)
        resolveAfterMove(destLatLng, visitedPoiIds, [destination])
      } else {
        addNotification("No valid destination found - continuing normally", "info")
        setCardTrigger(null)
        useGameStore.getState().setCardDestinationKeys([])
      }
      return
    }

    const nextCard = processNextDraw()
    if (nextCard) return

    setProcessingDeckDraws(false)

    if (deckState.isPlacingObstruction || deckState.isRemovingObstruction) {
      return
    }

    if (shouldGrantExtraThrow(useDeckStore.getState().extraThrow, effect)) {
      beginExtraThrow()
      return
    }

    const pending = pendingFinishRef.current
    if (pending) {
      pendingFinishRef.current = null
      if (effect?.type === "return_to_start") {
        const start = useGameStore.getState().startPosition
        finishEndTurn(start, pending.visitedPoiIds, start ? [latLngToGridKey(start[0], start[1])] : pending.currentPath)
        return
      }
      resolveAfterMove(pending.destination, pending.visitedPoiIds, pending.currentPath)
      return
    }

    if (effect?.type === "return_to_start") {
      const start = useGameStore.getState().startPosition
      finishEndTurn(start, [], start ? [latLngToGridKey(start[0], start[1])] : [])
      return
    }

    const currentPath = useGameStore.getState().movementPath
    const lastGridKey = currentPath.length > 0
      ? currentPath[currentPath.length - 1]
      : null
    const destination = lastGridKey
      ? gridKeyToLatLng(lastGridKey)
      : null
    finishEndTurn(destination, [], currentPath)
  }

  function finishEndTurn(destination: [number, number] | null, visitedPoiIds: string[], movePath: string[]) {
    if (finishingRef.current) return
    finishingRef.current = true
    chanceDrawnRef.current = false
    doublesResolvedRef.current = false
    pendingFinishRef.current = null
    const allVisited = [...new Set([...collectedPoiRef.current, ...visitedPoiIds])]
    collectedPoiRef.current = []
    setPendingServerUpdate(true)
    handleEndTurn()
    if (sessionId && playerId) {
      endTurnMutation.mutate({
        sessionId,
        playerId,
        newLat: destination?.[0],
        newLng: destination?.[1],
        visitedPoiIds: allVisited.length > 0 ? allVisited : undefined,
        movePath: movePath.length > 0 ? movePath : undefined,
      }, {
        onSuccess: () => {
          void utils.game.state.invalidate()
        },
        onError: () => {
          finishingRef.current = false
          setPendingServerUpdate(false)
        },
      })
    } else {
      finishingRef.current = false
      setPendingServerUpdate(false)
    }
  }

  const showResult = !isRolling && gameTurnState === GameTurnState.DICE_ROLLED

  return (
    <>
      <div className="flex flex-row items-center gap-2 md:gap-4 flex-wrap">
        {hasRolled && (
          <div className="flex items-center gap-2 md:gap-3">
            <div className={cn(!isRolling && showResult && "animate-dice-settle")}>
              <DiceDisplay
                dice1={dice1Value}
                dice2={dice2Value}
                isRolling={isRolling}
              />
            </div>

            {showResult && (
              <div className="flex flex-col">
                <div className="text-sm md:text-lg font-bold text-primary whitespace-nowrap">
                  {isMyTurn ? `You threw ${total}!` : `${playerName} threw ${total}!`}
                </div>
                {diceResult && movementPath.length === 0 && previewPaths.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <button
                      className="p-0.5 rounded hover:bg-muted"
                      onClick={() => cyclePreviewPath(-1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="whitespace-nowrap">
                      Move {previewPathIndex + 1}/{previewPaths.length}
                    </span>
                    <button
                      className="p-0.5 rounded hover:bg-muted"
                      onClick={() => cyclePreviewPath(1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {diceResult && movementPath.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <div>Moves: {movementPath.length}/{diceResult}</div>
                  </div>
                )}
                {diceResult && movementPath.length === 0 && previewPaths.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    <div>Click a square on the map to move</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <Button
            className="gap-1.5 md:gap-2 h-8 md:h-9 px-2.5 md:px-4 text-xs md:text-sm"
            onClick={rollDice}
            disabled={isRolling || !isMyTurn || !isPlaying || gameTurnState !== GameTurnState.ROLL_DICE}
          >
            <Dices className="h-3.5 w-3.5 md:h-4 md:w-4" />
            {isRolling ? "Rolling..." : isMyTurn ? "Roll Dice" : `${playerName}'s Turn`}
          </Button>
          <Button
            className="gap-1.5 md:gap-2 h-8 md:h-9 px-2.5 md:px-4 text-xs md:text-sm"
            onClick={handleEndTurnClick}
            disabled={!isMyTurn || !isPlaying || gameTurnState !== GameTurnState.DICE_ROLLED || !!cardTrigger}
          >
            <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            End Turn
          </Button>
          <Button
            className="gap-1.5 md:gap-2 h-8 md:h-9 px-2.5 md:px-4 text-xs md:text-sm"
            variant="outline"
            onClick={() => setPlayerZoomRequest(playerName)}
            disabled={!playerName}
          >
            <LocateFixed className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="hidden md:inline">Find My Car</span>
            <span className="md:hidden">Find</span>
          </Button>
          <GridSelectionButton />
        </div>
      </div>

      {isMyTurn && (
        <TokenCollectedDialog
          collection={pendingTokenCollection}
          onClose={() => setPendingTokenCollection(null)}
        />
      )}
      {isMyTurn && !pendingTokenCollection && (
        <CardDrawDialog
          card={drawnCard}
          deckCard={drawnDeckCard}
          onClose={() => setDrawnCard(null)}
          onDeckCardClose={handleDeckCardClose}
        />
      )}
    </>
  )
}
