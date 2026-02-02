"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { Users, Plus, LogIn, Copy, Check, Loader2, UserPlus, ChevronLeft } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { useGameStore } from "@/stores/game-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPreviewHeader } from "@/components/ui/map-preview"

export enum AuthTab {
  PLAY = "play",
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AddStartingPointDialog from "./AddStartingPointDialog"
import { asTitle } from "@/lib/utils"

interface JoinGameProps {
  startingPosition: [number, number] | null
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}

function PinMismatchWarning() {
  return (
    <p className="text-xs text-destructive">PINs do not match</p>
  )
}

function PinInput({ id, name, value, onChange, placeholder, disabled, error }: {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled: boolean
  error?: boolean
}) {
  return (
    <Input
      id={id}
      name={name}
      type="password"
      inputMode="numeric"
      maxLength={4}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      disabled={disabled}
      autoComplete="new-password"
      data-form-type="other"
      className={error ? "border-destructive focus-visible:ring-destructive" : ""}
    />
  )
}

export default function JoinGame({ startingPosition }: JoinGameProps) {
  const { data: session } = useSession()

  const [mode, setMode] = useState<"welcome" | "create" | "join">("welcome")
  const [playerName, setPlayerName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [loginNickname, setLoginNickname] = useState("")
  const [loginPin, setLoginPin] = useState("")
  const [registerNickname, setRegisterNickname] = useState("")
  const [registerPin, setRegisterPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")

  const { setSessionId, setPlayerId, setSessionCode } = useGameStore()
  const { data: locations, refetch: refetchLocations } = trpc.locations.getAll.useQuery()
  const { data: availableGames } = trpc.game.list.useQuery()

  const [authTab, setAuthTabState] = useState<AuthTab>(AuthTab.PLAY)

  const pinMismatch = confirmPin.length > 0 && registerPin !== confirmPin
  const selectedLocation = locations?.find(l => l.id === selectedLocationId)

  function setAuthTab(tab: AuthTab) {
    setAuthTabState(tab)
    setError(null)
  }

  // Pre-fill login nickname from localStorage
  useEffect(() => {
    const savedNickname = localStorage.getItem("oscillation-last-nickname")
    if (savedNickname && !loginNickname) {
      setLoginNickname(savedNickname)
    }
  }, [])

  // Set default location when locations load
  useEffect(() => {
    if (locations?.length && !selectedLocationId) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId])

  useEffect(() => {
    if (session?.user?.nickname && !playerName) {
      setPlayerName(session.user.nickname)
    }
  }, [session?.user?.nickname, playerName])

  const register = trpc.auth.register.useMutation({
    onSuccess: async (_, variables) => {
      const result = await signIn("credentials", {
        nickname: variables.nickname,
        pin: variables.pin,
        redirect: false,
      })
      if (result?.ok) {
        setPlayerName(variables.nickname)
        setAuthTab(AuthTab.PLAY)
        setError(null)
      } else {
        setError("Registration successful but login failed")
      }
      setIsAuthLoading(false)
    },
    onError: (err) => {
      setError(err.message)
      setIsAuthLoading(false)
    },
  })

  const createGame = trpc.game.create.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setPlayerId(data.playerId)
      setSessionCode(data.code)
      setCreatedCode(data.code)
    },
    onError: (err) => setError(err.message),
  })

  const joinGame = trpc.game.join.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setPlayerId(data.playerId)
      setSessionCode(data.code)
    },
    onError: (err) => setError(err.message),
  })

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsAuthLoading(true)
    setError(null)

    if (!loginNickname.trim()) {
      setError("Please enter your nickname")
      setIsAuthLoading(false)
      return
    }

    if (!loginPin || !/^\d{4}$/.test(loginPin)) {
      setError("Please enter a valid 4-digit PIN")
      setIsAuthLoading(false)
      return
    }

    const result = await signIn("credentials", {
      nickname: loginNickname,
      pin: loginPin,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid nickname or PIN")
      setIsAuthLoading(false)
      return
    }

    if (result?.ok) {
      localStorage.setItem("oscillation-last-nickname", loginNickname)
      setPlayerName(loginNickname)
      setAuthTab(AuthTab.PLAY)
      setLoginPin("")
    }
    setIsAuthLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setIsAuthLoading(true)
    setError(null)

    if (!registerNickname.trim()) {
      setError("Please enter a nickname")
      setIsAuthLoading(false)
      return
    }

    if (!registerPin || !/^\d{4}$/.test(registerPin)) {
      setError("Please enter a valid 4-digit PIN")
      setIsAuthLoading(false)
      return
    }

    if (registerPin !== confirmPin) {
      setError("PINs do not match")
      setIsAuthLoading(false)
      return
    }

    register.mutate({ nickname: registerNickname, pin: registerPin })
  }

  function handleCreate() {
    if (!playerName.trim()) {
      setError("Please enter your name")
      return
    }
    if (!selectedLocation) {
      setError("Please select a starting point")
      return
    }
    setError(null)
    createGame.mutate({
      playerName: playerName.trim(),
      startLat: selectedLocation.lat,
      startLng: selectedLocation.lng,
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

  function goBack() {
    setMode("welcome")
    setError(null)
  }

  if (createdCode) {
    return (
      <div className="w-full max-w-2xl mx-auto overflow-hidden rounded-lg border bg-card">
        <MapPreviewHeader height="h-80" />
        <div className="p-6 text-center space-y-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
              <Users className="h-5 w-5" />
              Game Created!
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Share this code with other players to join</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="text-4xl font-mono font-bold tracking-widest bg-muted px-4 py-2 rounded-lg">
              {createdCode}
            </div>
            <Button variant="outline" size="icon" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Waiting for other players to join...</p>
        </div>
      </div>
    )
  }

  if (mode === "create" || mode === "join") {
    return (
      <div className="w-full max-w-2xl mx-auto overflow-hidden rounded-lg border bg-card">
        <MapPreviewHeader height="h-80" />
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
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
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "create" ? "Start a new game and invite others" : "Enter the code shared by the game host"}
            </p>
          </div>

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

          {mode === "create" && (
            <div className="space-y-2">
              <Label>Starting Point</Label>
              <p className="text-xs text-muted-foreground">Must be on an A road (pink roads on the map)</p>
              <div className="flex items-center gap-2">
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select starting point" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {asTitle(location.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AddStartingPointDialog onSuccess={refetchLocations} />
              </div>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-4">
              {availableGames && availableGames.length > 0 && (
                <div className="space-y-2">
                  <Label>Available Games</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableGames.map((game) => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => setJoinCode(game.code)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          joinCode === game.code
                            ? "border-primary bg-primary/5"
                            : "border-input hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold tracking-wider">{game.code}</span>
                          <span className="text-sm text-muted-foreground">
                            {game.playerCount}/4 players
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {game.playerNames.join(", ")}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="game-code">
                  {availableGames && availableGames.length > 0 ? "Or enter code manually" : "Game Code"}
                </Label>
                <Input
                  id="game-code"
                  placeholder="e.g. ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  className="font-mono text-lg tracking-widest uppercase"
                />
              </div>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          <div className="flex gap-2">
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={mode === "create" ? handleCreate : handleJoin}
              disabled={createGame.isPending || joinGame.isPending}
            >
              {(createGame.isPending || joinGame.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Game" : "Join Game"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="w-full max-w-2xl mx-auto overflow-hidden rounded-lg border bg-card">
        <MapPreviewHeader height="h-80" />
        <div className="p-6">
          <Tabs value={authTab === AuthTab.PLAY ? AuthTab.SIGN_IN : authTab} onValueChange={(v) => setAuthTab(v as AuthTab)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value={AuthTab.SIGN_IN} className="gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value={AuthTab.REGISTER} className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value={AuthTab.SIGN_IN} className="mt-0">
              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-nickname">Nickname</Label>
                  <Input
                    id="login-nickname"
                    placeholder="Enter your nickname"
                    value={loginNickname}
                    onChange={(e) => setLoginNickname(e.target.value)}
                    disabled={isAuthLoading}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-pin">PIN</Label>
                  <PinInput
                    id="login-pin"
                    name="login-pin"
                    placeholder="4-digit PIN"
                    value={loginPin}
                    onChange={setLoginPin}
                    disabled={isAuthLoading}
                  />
                </div>
                {error && <ErrorMessage message={error} />}
                <Button type="submit" className="w-full" disabled={isAuthLoading}>
                  {isAuthLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isAuthLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value={AuthTab.REGISTER} className="mt-0">
              <form onSubmit={handleRegister} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-nickname">Nickname</Label>
                  <Input
                    id="register-nickname"
                    placeholder="Choose a nickname"
                    value={registerNickname}
                    onChange={(e) => setRegisterNickname(e.target.value)}
                    disabled={isAuthLoading}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-pin">PIN</Label>
                  <PinInput
                    id="register-pin"
                    name="register-pin"
                    placeholder="4-digit PIN"
                    value={registerPin}
                    onChange={setRegisterPin}
                    disabled={isAuthLoading}
                    error={pinMismatch}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pin">Confirm PIN</Label>
                  <PinInput
                    id="confirm-pin"
                    name="confirm-pin"
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChange={setConfirmPin}
                    disabled={isAuthLoading}
                    error={pinMismatch}
                  />
                </div>
                {pinMismatch && <ErrorMessage message="PINs do not match" />}
                {error && !pinMismatch && <ErrorMessage message={error} />}
                <Button type="submit" className="w-full" disabled={isAuthLoading || pinMismatch}>
                  {isAuthLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isAuthLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto overflow-hidden rounded-lg border bg-card">
      <MapPreviewHeader height="h-80" />
      <div className="p-6">
        <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as AuthTab)}>
          <TabsList className="grid w-full grid-cols-1 mb-4">
            <TabsTrigger value={AuthTab.PLAY} className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Play
            </TabsTrigger>
          </TabsList>

          <TabsContent value={AuthTab.PLAY} className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="play-name">Your Name</Label>
              <Input
                id="play-name"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              {session?.user && (
                <p className="text-xs text-muted-foreground">Signed in as {session.user.nickname}</p>
              )}
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" className="gap-2" onClick={() => setMode("create")}>
                <Plus className="h-4 w-4" />
                Create Game
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => setMode("join")}>
                <LogIn className="h-4 w-4" />
                Join Game
              </Button>
            </div>

          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
