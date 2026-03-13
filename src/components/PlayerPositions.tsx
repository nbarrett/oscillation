"use client"

import { useGameStore, useCurrentPlayer } from "@/stores/game-store"
import { carImageForStyle } from "@/stores/car-store"
import { cn } from "@/lib/cn"

const TOKEN_COLOURS = ["blue", "black", "pink", "yellow", "green"] as const

const TOKEN_HEX: Record<string, string> = {
  blue: "#2563eb",
  black: "#374151",
  pink: "#ec4899",
  yellow: "#ca8a04",
  green: "#16a34a",
}

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
        const tokens = player.tokens ?? {}
        const totalTokens = TOKEN_COLOURS.reduce((sum, c) => sum + (tokens[c] ?? 0), 0)

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
            <div className="flex items-center gap-0.5">
              {TOKEN_COLOURS.map((colour) => {
                const count = tokens[colour] ?? 0
                if (count === 0) return null
                return (
                  <span
                    key={colour}
                    className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: TOKEN_HEX[colour] }}
                    title={`${count} ${colour} token${count === 1 ? "" : "s"}`}
                  >
                    {count}
                  </span>
                )
              })}
              {totalTokens === 0 && (
                <span className="text-[10px] text-muted-foreground">0</span>
              )}
            </div>
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
