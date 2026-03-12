"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Loader2, Gamepad2, ChevronDown, ChevronLeft, ChevronRight, Settings, Users, LogOut, Copy, Check, Trophy, MessageCircle } from "lucide-react"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { UserMenu } from "@/components/auth/user-menu"
import { useMapStore } from "@/stores/map-store"
import { useGameStore, GameTurnState } from "@/stores/game-store"
import { useChatStore } from "@/stores/chat-store"
import { carImageForStyle } from "@/stores/car-store"
import { trpc } from "@/lib/trpc/client"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/cn"

const DiceRoller = dynamic(() => import("@/components/DiceRoller"), { ssr: false })
const PlayerPositions = dynamic(() => import("@/components/PlayerPositions"), { ssr: false })
const GameObjectives = dynamic(() => import("@/components/GameObjectives"), { ssr: false })
const MapWithCars = dynamic(
  () => import("@/components/MapWithCars"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[75vh] w-full flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
)
const ProfileSelector = dynamic(() => import("@/components/ProfileSelector"), { ssr: false })
const MapLayerSelector = dynamic(() => import("@/components/MapLayerSelector"), { ssr: false })
const MappingProviderSelector = dynamic(() => import("@/components/MappingProviderSelector"), { ssr: false })
const StartingPositionSelector = dynamic(() => import("@/components/StartingPositionSelector"), { ssr: false })
const CarIconSelector = dynamic(() => import("@/components/CarIconSelector"), { ssr: false })
const PubIconSelector = dynamic(() => import("@/components/PubIconSelector"), { ssr: false })
const SpireIconSelector = dynamic(() => import("@/components/ChurchIconSelector"), { ssr: false })
const TowerIconSelector = dynamic(() => import("@/components/TowerIconSelector"), { ssr: false })
const PhoneIconSelector = dynamic(() => import("@/components/PhoneIconSelector"), { ssr: false })
const SchoolIconSelector = dynamic(() => import("@/components/SchoolIconSelector"), { ssr: false })
const ObstructionIconSelector = dynamic(() => import("@/components/ObstructionIconSelector"), { ssr: false })
const IconDetailToggle = dynamic(() => import("@/components/IconDetailToggle"), { ssr: false })
const MapPositions = dynamic(() => import("@/components/MapPositions"), { ssr: false })
const JoinGame = dynamic(() => import("@/components/JoinGame"), { ssr: false })
const GameSync = dynamic(() => import("@/components/GameSync"), { ssr: false })
const GameLobby = dynamic(() => import("@/components/GameLobby"), { ssr: false })
const BotTurnPlayer = dynamic(() => import("@/components/BotTurnPlayer"), { ssr: false })
const ChatPanel = dynamic(() => import("@/components/ChatPanel"), { ssr: false })
const PoiPicker = dynamic(() => import("@/components/PoiPicker"), { ssr: false })


function RoadDataIndicator() {
  const roadDataStatus = useGameStore((s) => s.roadDataStatus)
  const phase = useGameStore((s) => s.phase)

  if (phase !== "playing" || roadDataStatus === "loaded") return null

  return (
    <div className="absolute bottom-3 left-3 z-[1000]">
      <div className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg",
        roadDataStatus === "loading" && "bg-amber-500/90 text-white animate-pulse",
        roadDataStatus === "error" && "bg-red-500/90 text-white",
        roadDataStatus === "idle" && "bg-muted/90 text-muted-foreground",
      )}>
        {roadDataStatus === "loading" && "Loading roads..."}
        {roadDataStatus === "error" && "Road data failed"}
        {roadDataStatus === "idle" && "Roads not loaded"}
      </div>
    </div>
  )
}

function MovementOverlay() {
  const gameTurnState = useGameStore((s) => s.gameTurnState)
  const diceResult = useGameStore((s) => s.diceResult)
  const movementPath = useGameStore((s) => s.movementPath)
  const currentPlayerName = useGameStore((s) => s.currentPlayerName)
  const previewPaths = useGameStore((s) => s.previewPaths)
  const previewPathIndex = useGameStore((s) => s.previewPathIndex)
  const cyclePreviewPath = useGameStore((s) => s.cyclePreviewPath)
  const confirmPreviewPath = useGameStore((s) => s.confirmPreviewPath)
  const setPendingEndTurn = useGameStore((s) => s.setPendingEndTurn)

  const diceRolling = useGameStore((s) => s.diceRolling)
  const diceValues = useGameStore((s) => s.diceValues)
  const localPlayerName = useGameStore((s) => s.localPlayerName)
  const roadDataStatus = useGameStore((s) => s.roadDataStatus)
  const isMyTurn = localPlayerName !== null && localPlayerName === currentPlayerName
  const isBotTurn = currentPlayerName?.startsWith("Bot ") ?? false
  const showPreviews = isMyTurn && gameTurnState === GameTurnState.DICE_ROLLED && diceResult && movementPath.length === 0 && previewPaths.length > 0
  const showRollDice = isMyTurn && gameTurnState === GameTurnState.ROLL_DICE
  const showFreeSelection = isMyTurn && gameTurnState === GameTurnState.DICE_ROLLED && diceResult && previewPaths.length === 0
  const showBotRolling = isBotTurn && diceRolling
  const showBotResult = isBotTurn && !diceRolling && diceValues && gameTurnState === GameTurnState.DICE_ROLLED

  if (!showPreviews && !showRollDice && !showFreeSelection && !showBotRolling && !showBotResult) return null

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] animate-bounce-in">
      <div className="bg-primary/95 text-primary-foreground px-6 py-3 rounded-xl shadow-2xl text-center">
        {showBotRolling && (
          <div className="text-lg font-bold pointer-events-none">
            {currentPlayerName} is rolling the dice...
          </div>
        )}
        {showBotResult && (
          <div className="text-lg font-bold pointer-events-none">
            {currentPlayerName} threw {diceValues[0] + diceValues[1]}!
          </div>
        )}
        {showRollDice && (
          <div className="text-lg font-bold pointer-events-none">
            {isMyTurn ? "Your" : `${currentPlayerName}\u2019s`} turn — Roll the dice!
          </div>
        )}
        {showFreeSelection && (
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold">
              {roadDataStatus === "loading"
                ? "Loading road data..."
                : roadDataStatus === "error"
                  ? "Road data failed to load"
                  : movementPath.length > 0
                    ? `Moves: ${movementPath.length}/${diceResult} — click to extend`
                    : `Move ${diceResult} squares — click a square on the road`}
            </div>
            {roadDataStatus === "error" ? (
              <button
                onClick={() => {
                  useGameStore.getState().setRoadDataStatus("idle")
                  useGameStore.getState().triggerPreviewRecompute()
                }}
                className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-bold hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            ) : (
              <button
                onClick={() => useGameStore.getState().triggerPreviewRecompute()}
                className="px-3 py-1.5 rounded-lg bg-primary-foreground text-primary text-sm font-bold hover:bg-primary-foreground/90 transition-colors"
              >
                Show Routes
              </button>
            )}
          </div>
        )}
        {showPreviews && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => cyclePreviewPath(-1)}
              className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-[120px]">
              <div className="text-lg font-bold">
                Possible Move {previewPathIndex + 1} of {previewPaths.length}
              </div>
              <div className="text-xs opacity-80">
                or click a green square
              </div>
            </div>
            <button
              onClick={() => cyclePreviewPath(1)}
              className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => confirmPreviewPath()}
              className="ml-2 px-3 py-1.5 rounded-lg bg-primary-foreground text-primary text-sm font-bold hover:bg-primary-foreground/90 transition-colors"
            >
              Select
            </button>
            <button
              onClick={() => {
                confirmPreviewPath()
                setPendingEndTurn(true)
              }}
              className="px-3 py-1.5 rounded-lg bg-primary-foreground text-primary text-sm font-bold hover:bg-primary-foreground/90 transition-colors"
            >
              Select &amp; End Turn
            </button>
            <button
              onClick={() => useGameStore.getState().setPreviewPaths([])}
              className="px-3 py-1.5 rounded-lg bg-primary-foreground text-primary text-sm font-bold hover:bg-primary-foreground/90 transition-colors"
            >
              Free Selection
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ChatToggleButton({ onClick }: { onClick: () => void }) {
  const unreadCount = useChatStore((s) => s.unreadCount)
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 right-4 z-[1000] p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
    >
      <MessageCircle className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}

export default function GamePage() {
  const setAccessToken = useMapStore((state) => state.setAccessToken)
  const { sessionId, sessionCode, playerId, phase, winnerName, leaveSession } = useGameStore()
  const { data: tokenData } = trpc.token.getRawToken.useQuery()
  const { data: locations } = trpc.locations.getAll.useQuery()
  const [settingsExpanded, setSettingsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showVictory, setShowVictory] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatWidth, setChatWidth] = useState(320)

  const sessionCheck = trpc.game.state.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId, retry: false },
  )

  useEffect(() => {
    if (sessionId && sessionCheck.isFetched && !sessionCheck.data) {
      leaveSession()
    }
  }, [sessionId, sessionCheck.isFetched, sessionCheck.data, leaveSession])

  const utils = trpc.useUtils()
  const leaveMutation = trpc.game.leave.useMutation({
    onSuccess: () => {
      leaveSession()
      utils.game.state.invalidate()
    },
  })

  const startingPosition: [number, number] | null = locations?.[0]
    ? [locations[0].lat, locations[0].lng]
    : null

  useEffect(() => {
    if (tokenData) {
      setAccessToken(tokenData)
    }
  }, [tokenData, setAccessToken])

  useEffect(() => {
    if (phase === "ended" && winnerName) {
      setShowVictory(true)
    }
  }, [phase, winnerName])

  function handleLeaveGame() {
    if (sessionId && playerId) {
      leaveMutation.mutate({ sessionId, playerId })
    }
  }

  function copyCode() {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleVictoryClose() {
    setShowVictory(false)
    handleLeaveGame()
  }

  const validatingSession = !!sessionId && !sessionCheck.isFetched
  const inSession = !!sessionId && sessionCheck.isFetched && !!sessionCheck.data
  const winningPlayer = useGameStore.getState().players.find(p => p.name === winnerName)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <a
              href="https://labs.os.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
            >
              <div className="relative h-8 w-[80px] bg-white rounded p-0.5">
                <img
                  src="https://labs.os.uk/static/media/os-logo.svg"
                  alt="Ordnance Survey"
                  className="h-full w-full object-contain"
                />
              </div>
            </a>
            <div className="flex items-center gap-1.5">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-primary">Oscillation</h1>
            </div>
            <span className="hidden sm:inline-block text-xs text-muted-foreground">
              v0.5.1
            </span>
          </div>
          <div className="flex items-center gap-2">
            {inSession && sessionCode && (phase === "playing" || phase === "picking") && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-medium">{sessionCode}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Game code - share with friends to join</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyCode}>
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{copied ? "Copied!" : "Copy game code"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleLeaveGame}>
                      <LogOut className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Leave game</TooltipContent>
                </Tooltip>
              </div>
            )}
            {inSession && <AuthDialog />}
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {inSession && <GameSync />}
      {inSession && phase === "playing" && <BotTurnPlayer />}

      <main className="w-full px-4 py-3 flex-1 flex flex-col gap-3">
        {validatingSession ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !inSession ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <JoinGame startingPosition={startingPosition} />
          </div>
        ) : phase === "lobby" ? (
          <GameLobby />
        ) : phase === "picking" ? (
          <PoiPicker />
        ) : (
          <>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <PlayerPositions />
                  <div className="hidden md:block h-8 w-px bg-border" />
                  <DiceRoller />
                  <div className="ml-auto">
                    <button
                      onClick={() => setSettingsExpanded(!settingsExpanded)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        "hover:bg-muted border",
                        settingsExpanded && "bg-muted"
                      )}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          settingsExpanded && "rotate-180"
                        )}
                      />
                    </button>
                  </div>
                </div>
                <GameObjectives />

            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                settingsExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="pt-4 pb-1 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <ProfileSelector />
                    <MappingProviderSelector />
                    <MapLayerSelector />
                    <StartingPositionSelector />
                    <CarIconSelector />
                    <IconDetailToggle />
                    <PubIconSelector />
                    <SpireIconSelector />
                    <TowerIconSelector />
                    <PhoneIconSelector />
                    <SchoolIconSelector />
                    <ObstructionIconSelector />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[calc(100vh-280px)] min-h-[400px] flex">
                  <div className="flex-1 relative min-w-0">
                    <MapWithCars />
                    <MapPositions />
                    <RoadDataIndicator />
                    <MovementOverlay />
                    {!chatOpen && <ChatToggleButton onClick={() => setChatOpen(true)} />}
                  </div>
                  <ChatPanel
                    isOpen={chatOpen}
                    onClose={() => {
                      setChatOpen(false)
                      setTimeout(() => window.dispatchEvent(new Event("resize")), 50)
                    }}
                    width={chatWidth}
                    onWidthChange={setChatWidth}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Dialog open={showVictory} onOpenChange={setShowVictory}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-7 w-7 text-yellow-500" />
                Game Over!
              </DialogTitle>
              <DialogDescription>
                The game has ended
              </DialogDescription>
            </DialogHeader>
            <div className="text-center space-y-4 py-4">
              {winningPlayer && (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={carImageForStyle(winningPlayer.iconType)}
                    alt="winner car"
                    className="h-16 w-28 object-contain"
                  />
                  <div className="text-xl font-bold text-primary">
                    {winnerName} wins!
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                All objectives completed and returned to start
              </p>
            </div>
            <Button className="w-full" onClick={handleVictoryClose}>
              Back to Menu
            </Button>
          </DialogContent>
        </Dialog>

        <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 py-3 text-xs text-muted-foreground">
          <p>
            Built with{" "}
            <a href="https://create.t3.gg" className="font-medium underline underline-offset-4 hover:text-primary">
              T3 Stack
            </a>
            {" "}&bull;{" "}
            <a href="https://osdatahub.os.uk" className="font-medium underline underline-offset-4 hover:text-primary">
              OS Maps API
            </a>
            {" "}&bull;{" "}
            <a href="/codebase-evolution-stats.html" className="font-medium underline underline-offset-4 hover:text-primary">
              Codebase Evolution
            </a>
          </p>
          <p>&copy; {new Date().getFullYear()} Oscillation. In memory of Kerry Barrett.</p>
        </footer>
      </main>
    </div>
  )
}
