"use client"

import { useState } from "react"
import { Users, Copy, Check, Play, LogOut, Loader2, Crown } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { useGameStore } from "@/stores/game-store"
import { useNotificationStore } from "@/stores/notification-store"
import { carImageForStyle } from "@/stores/car-store"
import { AREA_SIZE_PRESETS, type AreaSize } from "@/lib/area-size"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function GameLobby() {
  const { sessionId, playerId, sessionCode, players, areaSize, leaveSession } = useGameStore()
  const isCreator = useGameStore(s => s.isCreator())
  const { addNotification } = useNotificationStore()
  const [copied, setCopied] = useState(false)

  const utils = trpc.useUtils()

  const startGameMutation = trpc.game.startGame.useMutation({
    onSuccess: () => {
      addNotification("Game started!", "success")
      utils.game.state.invalidate()
    },
    onError: (err) => {
      addNotification(err.message, "info")
    },
  })

  const leaveMutation = trpc.game.leave.useMutation({
    onSuccess: () => {
      leaveSession()
      utils.game.state.invalidate()
    },
  })

  function copyCode() {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleStartGame() {
    if (!sessionId || !playerId) return
    startGameMutation.mutate({ sessionId, playerId })
  }

  function handleLeave() {
    if (sessionId && playerId) {
      leaveMutation.mutate({ sessionId, playerId })
    }
  }

  const preset = AREA_SIZE_PRESETS[areaSize as AreaSize]

  return (
    <div className="flex-1 flex items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Users className="h-6 w-6" />
              Game Lobby
            </h2>
            <p className="text-sm text-muted-foreground">
              Share the code below to invite players
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="text-4xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-lg">
              {sessionCode}
            </div>
            <Button variant="outline" size="icon" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {preset && (
            <div className="text-center text-sm text-muted-foreground">
              {preset.label} area ({preset.widthKm}x{preset.heightKm} km)
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Players ({players.length}/4)
            </h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.name}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <img
                    src={carImageForStyle(player.iconType)}
                    alt="car"
                    className="h-6 w-10 object-contain"
                  />
                  <span className="font-medium flex-1">{player.name}</span>
                  {index === 0 && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleLeave}
              disabled={leaveMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              Leave
            </Button>
            {isCreator && (
              <Button
                className="flex-1 gap-2"
                onClick={handleStartGame}
                disabled={startGameMutation.isPending || players.length < 1}
              >
                {startGameMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start Game
              </Button>
            )}
            {!isCreator && (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Waiting for host to start...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
