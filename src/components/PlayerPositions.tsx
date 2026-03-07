"use client"

import { useGameStore, useCurrentPlayer } from "@/stores/game-store"
import { carImageForStyle } from "@/stores/car-store"
import { cn } from "@/lib/cn"

export default function PlayerPositions() {
  const {
    players,
    localPlayerName,
    setPlayerZoomRequest,
  } = useGameStore()
  const currentPlayer = useCurrentPlayer()

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
        const isLocalPlayer = localPlayerName === player.name
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
            {isLocalPlayer && !isCurrentPlayer && (
              <span className="text-[10px] bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded-full">
                You
              </span>
            )}
            {isCurrentPlayer && (
              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                {isLocalPlayer ? "Your Turn" : "Turn"}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
