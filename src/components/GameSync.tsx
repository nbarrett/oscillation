"use client"

import { useEffect, useRef } from "react"
import { trpc } from "@/lib/trpc/client"
import { useGameStore, GameTurnState, type Player, type GamePhase } from "@/stores/game-store"
import { useNotificationStore } from "@/stores/notification-store"
import { useDeckStore } from "@/stores/deck-store"
import { areaSizeBounds, isWithinBounds, type AreaSize } from "@/lib/area-size"

export default function GameSync() {
  const { sessionId, playerId, players: localPlayers, setPlayers, setCurrentPlayer, setDiceResult, setGameTurnState, setLocalPlayerName, setAreaSize, setGameBounds, setPhase, setCreatorPlayerId, setSelectedPois, setPoiCandidates, setWinnerName, leaveSession } = useGameStore()
  const { addNotification } = useNotificationStore()
  const { initDecks, setObstructions, setMissedTurns } = useDeckStore()
  const hasCheckedSession = useRef(false)
  const previousPlayerNamesRef = useRef<string[]>([])
  const previousPhaseRef = useRef<string | null>(null)

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
      const currentPlayerNames = gameState.players.map(p => p.name)
      const previousNames = previousPlayerNamesRef.current

      if (previousNames.length > 0) {
        const myPlayer = gameState.players.find(p => p.id === playerId)
        const newPlayers = currentPlayerNames.filter(
          name => !previousNames.includes(name) && name !== myPlayer?.name
        )
        newPlayers.forEach(name => {
          addNotification(`${name} joined the game`, "success")
        })
      }
      previousPlayerNamesRef.current = currentPlayerNames

      const serverPhase = gameState.phase as GamePhase
      const prevPhase = previousPhaseRef.current
      if (prevPhase && prevPhase !== serverPhase) {
        if (serverPhase === "picking") {
          addNotification("Select objectives on the map!", "info")
        } else if (serverPhase === "playing") {
          addNotification("Game started!", "success")
        } else if (serverPhase === "ended") {
          addNotification("Game over!", "info")
        }
      }
      previousPhaseRef.current = serverPhase

      setPhase(serverPhase)
      setCreatorPlayerId(gameState.creatorPlayerId ?? null)
      setSelectedPois(gameState.selectedPois ?? null)
      setPoiCandidates(gameState.poiCandidates ?? null)

      const startPos: [number, number] | null =
        gameState.startLat != null && gameState.startLng != null
          ? [gameState.startLat, gameState.startLng]
          : null
      const bounds = startPos && gameState.areaSize
        ? areaSizeBounds(startPos[0], startPos[1], gameState.areaSize)
        : null

      const players: Player[] = gameState.players.map(p => {
        const localPlayer = localPlayers.find(lp => lp.name === p.name)
        if (localPlayer?.previousPosition) {
          return {
            name: p.name,
            iconType: p.iconType,
            position: localPlayer.position,
            previousPosition: localPlayer.previousPosition,
            completedRoute: localPlayer.completedRoute,
            visitedPois: p.visitedPois,
            hasReturnedToStart: p.hasReturnedToStart,
          }
        }
        const position: [number, number] = bounds && startPos && !isWithinBounds(p.position[0], p.position[1], bounds)
          ? startPos
          : p.position
        return {
          name: p.name,
          iconType: p.iconType,
          position,
          previousPosition: null,
          completedRoute: null,
          visitedPois: p.visitedPois,
          hasReturnedToStart: p.hasReturnedToStart,
        }
      })

      setPlayers(players)

      if (gameState.deckState) {
        initDecks(gameState.deckState)
      }
      if (gameState.obstructions) {
        setObstructions(gameState.obstructions)
      }
      for (const p of gameState.players) {
        if (p.missedTurns > 0) {
          setMissedTurns(p.name, p.missedTurns)
        }
      }

      const myPlayer = gameState.players.find(p => p.id === playerId)
      if (myPlayer) {
        setLocalPlayerName(myPlayer.name)
      }

      if (gameState.areaSize) {
        setAreaSize(gameState.areaSize)
        if (gameState.startLat != null && gameState.startLng != null) {
          setGameBounds(areaSizeBounds(gameState.startLat, gameState.startLng, gameState.areaSize))
        }
      }

      const { pendingServerUpdate } = useGameStore.getState()
      if (!pendingServerUpdate) {
        const serverCurrentPlayer = gameState.players[gameState.currentTurn]
        const localState = useGameStore.getState()
        const turnChanged = serverCurrentPlayer && serverCurrentPlayer.name !== localState.currentPlayerName

        if (turnChanged) {
          localState.clearGridSelections()
          localState.setPlayerStartGridKey(null)
        }

        if (serverCurrentPlayer) {
          setCurrentPlayer(serverCurrentPlayer.name)
        }

        if (gameState.dice1 !== null && gameState.dice2 !== null) {
          setDiceResult(gameState.dice1 + gameState.dice2)
          setGameTurnState(GameTurnState.DICE_ROLLED)
        } else if (turnChanged || !localState.diceResult) {
          setDiceResult(null)
          setGameTurnState(GameTurnState.ROLL_DICE)
        }
      }

      if (serverPhase === "ended") {
        const winningPlayer = gameState.players.find(p => p.hasReturnedToStart)
        setWinnerName(winningPlayer?.name ?? null)
      }
    }
  }, [gameState, playerId, addNotification, setPlayers, setCurrentPlayer, setDiceResult, setGameTurnState, setLocalPlayerName, setAreaSize, setGameBounds, setPhase, setCreatorPlayerId, setSelectedPois, setPoiCandidates, setWinnerName, initDecks, setObstructions, setMissedTurns])

  return null
}
