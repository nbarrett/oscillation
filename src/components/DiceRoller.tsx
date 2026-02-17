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
import { detectPoiVisits } from "@/lib/poi-detection"
import { POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"
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
  } = useGameStore()

  const pubs = usePubStore(s => s.pubs)
  const spires = useSpireStore(s => s.spires)
  const towers = useTowerStore(s => s.towers)
  const phones = usePhoneStore(s => s.phones)
  const schools = useSchoolStore(s => s.schools)
  const { addNotification } = useNotificationStore()

  const [isRolling, setRolling] = useState(false)
  const [hasSettled, setHasSettled] = useState(false)
  const [hasRolled, setHasRolled] = useState(false)
  const [dice1Value, setDice1Value] = useState(1)
  const [dice2Value, setDice2Value] = useState(1)
  const [drawnCard, setDrawnCard] = useState<{ title: string; body: string; type: string } | null>(null)
  const total = dice1Value + dice2Value
  const playerName = player?.name || ""
  const isMyTurn = localPlayerName !== null && localPlayerName === currentPlayerName
  const isPlaying = phase === "playing"

  const rollDiceMutation = trpc.game.rollDice.useMutation()
  const endTurnMutation = trpc.game.endTurn.useMutation()
  const drawCardMutation = trpc.game.drawCard.useMutation()

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

      <CardDrawDialog card={drawnCard} onClose={() => setDrawnCard(null)} />
    </>
  )
}
