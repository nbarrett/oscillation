"use client"

import { useState } from "react"
import { Users, Plus, LogIn, Copy, Check, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { useGameStore } from "@/stores/game-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface JoinGameProps {
  startingPosition: [number, number]
}

export default function JoinGame({ startingPosition }: JoinGameProps) {
  const [mode, setMode] = useState<"choice" | "create" | "join">("choice")
  const [playerName, setPlayerName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { setSessionId, setPlayerId, setSessionCode } = useGameStore()

  const createGame = trpc.game.create.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setPlayerId(data.playerId)
      setSessionCode(data.code)
      setCreatedCode(data.code)
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const joinGame = trpc.game.join.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setPlayerId(data.playerId)
      setSessionCode(data.code)
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  function handleCreate() {
    if (!playerName.trim()) {
      setError("Please enter your name")
      return
    }
    setError(null)
    createGame.mutate({
      playerName: playerName.trim(),
      startLat: startingPosition[0],
      startLng: startingPosition[1],
    })
  }

  function handleJoin() {
    if (!playerName.trim()) {
      setError("Please enter your name")
      return
    }
    if (joinCode.length !== 6) {
      setError("Please enter a 6-character game code")
      return
    }
    setError(null)
    joinGame.mutate({
      code: joinCode.toUpperCase(),
      playerName: playerName.trim(),
    })
  }

  function copyCode() {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (createdCode) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Users className="h-5 w-5" />
            Game Created!
          </CardTitle>
          <CardDescription>
            Share this code with other players to join
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="text-4xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-lg">
              {createdCode}
            </div>
            <Button variant="outline" size="icon" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Waiting for other players to join...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (mode === "choice") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Users className="h-5 w-5" />
            Multiplayer Mode
          </CardTitle>
          <CardDescription>
            Play with friends on different devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={() => setMode("create")}
          >
            <Plus className="h-4 w-4" />
            Create New Game
          </Button>
          <Button
            className="w-full gap-2"
            size="lg"
            variant="outline"
            onClick={() => setMode("join")}
          >
            <LogIn className="h-4 w-4" />
            Join Existing Game
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === "create" ? (
            <>
              <Plus className="h-5 w-5" />
              Create New Game
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Join Game
            </>
          )}
        </CardTitle>
        <CardDescription>
          {mode === "create"
            ? "Start a new game and invite others"
            : "Enter the code shared by the game host"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="player-name">Your Name</Label>
          <Input
            id="player-name"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            autoFocus
          />
        </div>

        {mode === "join" && (
          <div className="space-y-2">
            <Label htmlFor="game-code">Game Code</Label>
            <Input
              id="game-code"
              placeholder="e.g. ABC123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              className="font-mono text-lg tracking-widest uppercase"
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setMode("choice")
              setError(null)
            }}
          >
            Back
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={mode === "create" ? handleCreate : handleJoin}
            disabled={createGame.isPending || joinGame.isPending}
          >
            {(createGame.isPending || joinGame.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {mode === "create" ? "Create Game" : "Join Game"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
