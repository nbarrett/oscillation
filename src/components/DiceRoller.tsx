"use client"

import { useEffect, useState } from "react"
import { Dices, CheckCircle2, LocateFixed } from "lucide-react"
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
import { isNearBoundaryEdge, isOnMotorwayOrRailway, shouldTriggerChance } from "@/lib/deck-triggers"
import { type DeckType, type GameCard, type ChanceCard } from "@/lib/card-decks"
import { Button } from "@/components/ui/button"
import { DiceDisplay } from "@/components/ui/dice"
import GridSelectionButton from "./GridSelectionButton"
import CardDrawDialog from "./CardDrawDialog"
import { cn } from "@/lib/cn"

export default function DiceRoller() {
  const player = useCurrentPlayer()
  const {
    gameTurnState,
    handleDiceRoll,
    handleEndTurn,
    setPlayerZoomRequest,
    sessionId,
    playerId,
    players,
    currentPlayerName,
    diceResult,
    movementPath,
    localPlayerName,
    setPendingServerUpdate,
    phase,
    selectedPois,
    gameBounds,
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
    pendingDraws,
    drawnDeckCard,
    drawFromDeck,
    queueDraw,
    processNextDraw,
    clearDrawnCard,
    extraThrow,
    setExtraThrow,
  } = useDeckStore()

  const [isRolling, setRolling] = useState(false)
  const [hasSettled, setHasSettled] = useState(false)
  const [hasRolled, setHasRolled] = useState(false)
  const [dice1Value, setDice1Value] = useState(1)
  const [dice2Value, setDice2Value] = useState(1)
  const [drawnCard, setDrawnCard] = useState<{ title: string; body: string; type: string } | null>(null)
  const [processingDeckDraws, setProcessingDeckDraws] = useState(false)
  const total = dice1Value + dice2Value
  const playerName = player?.name || ""
  const isMyTurn = localPlayerName !== null && localPlayerName === currentPlayerName
  const isPlaying = phase === "playing"

  const rollDiceMutation = trpc.game.rollDice.useMutation()
  const endTurnMutation = trpc.game.endTurn.useMutation()
  const drawCardMutation = trpc.game.drawCard.useMutation()
  const drawDeckCardMutation = trpc.game.drawDeckCard.useMutation()
  const applyChanceEffectMutation = trpc.game.applyChanceEffect.useMutation()
  const skipMissedTurnMutation = trpc.game.skipMissedTurn.useMutation()

  useEffect(() => {
    if (hasSettled && !isRolling) {
      setPendingServerUpdate(true)
      handleDiceRoll(total)
      if (sessionId && playerId) {
        rollDiceMutation.mutate({
          sessionId,
          playerId,
          dice1: dice1Value,
          dice2: dice2Value,
        }, {
          onSettled: () => setPendingServerUpdate(false),
        })
      } else {
        setPendingServerUpdate(false)
      }
      setHasSettled(false)
    }
  }, [hasSettled, isRolling, total, handleDiceRoll, sessionId, playerId, dice1Value, dice2Value, rollDiceMutation, setPendingServerUpdate])

  function rollDice() {
    if (isRolling) return

    if (currentPlayerName && (missedTurns[currentPlayerName] ?? 0) > 0) {
      addNotification(`${currentPlayerName} must miss this turn!`, "info")
      decrementMissedTurns(currentPlayerName)
      if (sessionId && playerId) {
        skipMissedTurnMutation.mutate({ sessionId, playerId })
      }
      setPendingServerUpdate(true)
      handleEndTurn()
      setPendingServerUpdate(false)
      return
    }

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

  function handleEndTurnClick() {
    const lastGridKey = movementPath.length > 0
      ? movementPath[movementPath.length - 1]
      : null
    const destination = lastGridKey
      ? gridKeyToLatLng(lastGridKey)
      : null
    const destinationGridKey = destination
      ? latLngToGridKey(destination[0], destination[1])
      : null

    let visitedPoiIds: string[] = []
    if (destinationGridKey) {
      const visits = detectPoiVisits(destinationGridKey, pubs, spires, towers, phones, schools, selectedPois)
      visitedPoiIds = visits.map(v => v.id)
      visits.forEach(v => {
        const categoryLabel = POI_CATEGORY_LABELS[v.category as PoiCategory] ?? v.category
        addNotification(`Visited ${categoryLabel}: ${v.name ?? "Unknown"}`, "success")
      })

      if (visits.length > 0 && sessionId && playerId && lastGridKey) {
        const firstVisit = visits[0]
        drawCardMutation.mutate({
          sessionId,
          playerId,
          poiCategory: firstVisit.category,
          gridKey: lastGridKey,
        }, {
          onSuccess: (card) => {
            if (card) {
              setDrawnCard(card)
            }
          },
        })
      }
    }

    const triggeredDecks: DeckType[] = []

    if (isNearBoundaryEdge(movementPath, gameBounds)) {
      triggeredDecks.push("edge")
    }

    if (lastGridKey) {
      const mwResult = isOnMotorwayOrRailway(lastGridKey)
      if (mwResult.triggered) {
        triggeredDecks.push("motorway")
      }
    }

    if (shouldTriggerChance(dice1Value, dice2Value)) {
      triggeredDecks.push("chance")
    }

    if (triggeredDecks.length > 0) {
      triggeredDecks.forEach((deck) => queueDraw(deck))
      setProcessingDeckDraws(true)
      processNextDraw()
      return
    }

    finishEndTurn(destination, visitedPoiIds)
  }

  function handleDeckCardClose() {
    const card = drawnDeckCard
    clearDrawnCard()

    if (card && card.deck === "chance") {
      const chance = card as ChanceCard
      if (sessionId && playerId) {
        if (chance.effect.type === "miss_turn") {
          applyChanceEffectMutation.mutate({
            sessionId,
            playerId,
            effectType: "miss_turn",
            missedTurns: chance.effect.turns,
          })
        } else if (chance.effect.type === "return_to_start") {
          applyChanceEffectMutation.mutate({
            sessionId,
            playerId,
            effectType: "return_to_start",
          })
        }
      }
    }

    const nextCard = processNextDraw()
    if (!nextCard) {
      setProcessingDeckDraws(false)
      if (extraThrow) {
        setExtraThrow(false)
        addNotification("Extra throw! Roll again!", "success")
        useGameStore.getState().setGameTurnState(GameTurnState.ROLL_DICE)
        useGameStore.getState().setDiceResult(null)
        setHasRolled(false)
        return
      }
      const lastGridKey = movementPath.length > 0
        ? movementPath[movementPath.length - 1]
        : null
      const destination = lastGridKey
        ? gridKeyToLatLng(lastGridKey)
        : null
      finishEndTurn(destination, [])
    }
  }

  function finishEndTurn(destination: [number, number] | null, visitedPoiIds: string[]) {
    setPendingServerUpdate(true)
    handleEndTurn()
    if (sessionId && playerId) {
      endTurnMutation.mutate({
        sessionId,
        playerId,
        newLat: destination?.[0],
        newLng: destination?.[1],
        visitedPoiIds: visitedPoiIds.length > 0 ? visitedPoiIds : undefined,
      }, {
        onSettled: () => setPendingServerUpdate(false),
      })
    } else {
      setPendingServerUpdate(false)
    }
  }

  const showResult = !isRolling && gameTurnState === GameTurnState.DICE_ROLLED

  return (
    <>
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
            disabled={isRolling || !isMyTurn || !isPlaying || gameTurnState !== GameTurnState.ROLL_DICE}
          >
            <Dices className="h-4 w-4" />
            {isRolling ? "Rolling..." : "Roll Dice"}
          </Button>
          <Button
            className="flex-1 sm:flex-none gap-2"
            variant="secondary"
            onClick={handleEndTurnClick}
            disabled={!isMyTurn || !isPlaying || gameTurnState !== GameTurnState.DICE_ROLLED}
          >
            <CheckCircle2 className="h-4 w-4" />
            End Turn
          </Button>
          <Button
            className="flex-1 sm:flex-none gap-2"
            variant="outline"
            onClick={() => setPlayerZoomRequest(playerName)}
            disabled={!playerName}
          >
            <LocateFixed className="h-4 w-4" />
            Find My Car
          </Button>
          <GridSelectionButton />
        </div>
      </div>

      <CardDrawDialog
        card={drawnCard}
        deckCard={drawnDeckCard}
        onClose={() => setDrawnCard(null)}
        onDeckCardClose={handleDeckCardClose}
      />
    </>
  )
}
