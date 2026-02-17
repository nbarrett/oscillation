"use client"

import { useEffect } from "react"
import { useGameStore, useCurrentPlayer, GameTurnState } from "@/stores/game-store"
import { carImageForStyle } from "@/stores/car-store"
import { log } from "@/lib/utils"
import { cn } from "@/lib/cn"

export default function PlayerPositions() {
  const {
    players,
    gameTurnState,
    setCurrentPlayer,
    setPlayerZoomRequest,
    setGameTurnState,
  } = useGameStore()
  const currentPlayer = useCurrentPlayer()

  useEffect(() => {
    if (players.length > 0 && !currentPlayer) {
      log.debug("initialising current player to:", players[0])
      setCurrentPlayer(players[0].name)
    }
  }, [currentPlayer, players, setCurrentPlayer])

  useEffect(() => {
    log.debug("gameTurnState received:", gameTurnState)
    if (gameTurnState === GameTurnState.END_TURN) {
      selectNextPlayer()
    }
  }, [gameTurnState])

  function selectNextPlayer() {
    if (!currentPlayer) return

    const currentPlayerIndex = players.findIndex(
      (player) => player.name === currentPlayer.name
    )
    const newIndex =
      currentPlayerIndex < players.length - 1 ? currentPlayerIndex + 1 : 0
    const newPlayer = players[newIndex]

    if (newPlayer) {
      log.debug("setting current player to:", newPlayer)
      setCurrentPlayer(newPlayer.name)
      setPlayerZoomRequest(newPlayer.name)
      setGameTurnState(GameTurnState.ROLL_DICE)
    } else {
      log.error("unable to find next player")
    }
  }

  function handlePlayerClick(playerName: string) {
    setPlayerZoomRequest(playerName)
  }

  if (players.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mr-1">
        Players:
      </span>
      {players.map((player) => {
        const isCurrentPlayer = currentPlayer?.name === player.name
        const isBot = player.name.startsWith("Bot ")

        return (
          <button
            key={player.name}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
              "border bg-card hover:bg-muted/50",
              isCurrentPlayer && "ring-2 ring-primary ring-offset-1 ring-offset-background bg-primary/5"
            )}
            onClick={() => handlePlayerClick(player.name)}
          >
            <img
              src={carImageForStyle(player.iconType)}
              alt="car"
              className="h-5 w-8 object-contain"
            />
            <span className={cn(
              "font-medium",
              isCurrentPlayer && "text-primary"
            )}>
              {player.name}
            </span>
            {isBot && (
              <span className="text-[10px] bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded-full">
                Bot
              </span>
            )}
            {isCurrentPlayer && (
              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                Turn
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
