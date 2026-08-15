"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import packageJson from "../../package.json"
import { Loader2, Gamepad2, ChevronDown, Settings, Users, LogOut, Copy, Check, Trophy, MessageCircle, ScrollText, Shuffle } from "lucide-react"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { UserMenu } from "@/components/auth/user-menu"
import { useMapStore } from "@/stores/map-store"
import { useGameStore } from "@/stores/game-store"
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
const ActivityLog = dynamic(() => import("@/components/ActivityLog"), { ssr: false })
const CardBrowser = dynamic(() => import("@/components/CardBrowser"), { ssr: false })
const MovementOverlay = dynamic(() => import("@/components/MovementOverlay"), { ssr: false })
const SplashScreen = dynamic(() => import("@/components/SplashScreen"), { ssr: false })


function ShowAllRoutesToggle() {
  const showAllRoutes = useGameStore((s) => s.showAllRoutes)
  const setShowAllRoutes = useGameStore((s) => s.setShowAllRoutes)
  return (
    <button
      onClick={() => setShowAllRoutes(!showAllRoutes)}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors border",
        showAllRoutes ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      )}
    >
      <span>Show all routes</span>
    </button>
  )
}

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
  const [activityExpanded, setActivityExpanded] = useState(false)
  const [cardsOpen, setCardsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showVictory, setShowVictory] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatWidth, setChatWidth] = useState(320)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(true)

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

  if (showSplash && !inSession && !validatingSession) {
    return <SplashScreen onStart={() => setShowSplash(false)} />
  }

  return (
    <div className={cn(
      "min-h-dvh bg-background flex flex-col",
      inSession && (phase === "playing" || phase === "picking") && "h-dvh overflow-hidden",
    )}>
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
              v{packageJson.version}
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
      {inSession && (phase === "playing" || phase === "picking") && <BotTurnPlayer />}

      <main className={cn(
        "w-full max-w-[100vw] overflow-x-hidden flex-1 flex flex-col min-h-0",
        inSession && phase === "playing"
          ? "px-0 py-0 md:px-4 md:py-3 gap-0 md:gap-3 pb-[7.5rem] md:pb-3"
          : "px-2 md:px-4 py-2 md:py-3 gap-2 md:gap-3",
      )}>
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
        ) : (phase === "picking" || phase === "playing") ? (
          <>
            {phase === "picking" && <PoiPicker />}
            {phase === "playing" && (
            <Card className="hidden md:block">
              <CardContent className="p-3 lg:p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                  <PlayerPositions />
                  <div className="hidden lg:block h-8 w-px bg-border" />
                  <DiceRoller />
                  <button
                    onClick={() => setActivityExpanded(!activityExpanded)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-muted border",
                      activityExpanded && "bg-muted"
                    )}
                  >
                    <ScrollText className="h-4 w-4" />
                    <span className="hidden lg:inline">Activity</span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform duration-200",
                        activityExpanded && "rotate-180"
                      )}
                    />
                  </button>
                  <button
                    onClick={() => setCardsOpen(true)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-muted border",
                    )}
                  >
                    <Shuffle className="h-4 w-4" />
                    <span className="hidden lg:inline">Cards</span>
                  </button>
                  <div className="ml-auto">
                    <button
                      onClick={() => setSettingsExpanded(!settingsExpanded)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                        "hover:bg-muted border",
                        settingsExpanded && "bg-muted"
                      )}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden lg:inline">Settings</span>
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
                    <ShowAllRoutesToggle />
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                activityExpanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t">
                  <ActivityLog maxRows={8} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
            )}

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[calc(100dvh-3.5rem-7.5rem)] md:h-[calc(100vh-280px)] min-h-[280px] flex">
                  <div className="flex-1 relative min-w-0">
                    <MapWithCars />
                    {phase === "playing" && <MapPositions />}
                    {phase === "playing" && <RoadDataIndicator />}
                    {phase === "playing" && <MovementOverlay />}
                    {phase === "playing" && !chatOpen && <ChatToggleButton onClick={() => setChatOpen(true)} />}
                  </div>
                  {phase === "playing" && (
                    <ChatPanel
                      isOpen={chatOpen}
                      onClose={() => {
                        setChatOpen(false)
                        setTimeout(() => window.dispatchEvent(new Event("resize")), 50)
                      }}
                      width={chatWidth}
                      onWidthChange={setChatWidth}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {phase === "playing" && (
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur border-t px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2 overflow-x-auto">
                <GameObjectives />
              </div>
              <div className="flex items-center gap-2 mt-1 overflow-x-auto">
                <DiceRoller />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    "hover:bg-muted border",
                    mobileDrawerOpen && "bg-muted"
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  <ChevronDown className={cn("h-3 w-3 transition-transform", mobileDrawerOpen && "rotate-180")} />
                </button>
                <button
                  onClick={() => setActivityExpanded(!activityExpanded)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    "hover:bg-muted border",
                    activityExpanded && "bg-muted"
                  )}
                >
                  <ScrollText className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCardsOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-muted border"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setSettingsExpanded(!settingsExpanded)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    "hover:bg-muted border",
                    settingsExpanded && "bg-muted"
                  )}
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </div>
              {mobileDrawerOpen && (
                <div className="mt-2 pt-2 border-t">
                  <PlayerPositions />
                </div>
              )}
              {settingsExpanded && (
                <div className="mt-2 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-2">
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
                    <ShowAllRoutesToggle />
                  </div>
                </div>
              )}
              {activityExpanded && (
                <div className="mt-2 pt-2 border-t max-h-40 overflow-y-auto">
                  <ActivityLog maxRows={4} />
                </div>
              )}
            </div>
            )}
          </>
        ) : null}

        {inSession && sessionId && (
          <CardBrowser
            open={cardsOpen}
            onClose={() => setCardsOpen(false)}
            sessionId={sessionId}
          />
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

        <footer className={cn(
          "flex flex-col sm:flex-row items-center justify-between gap-2 py-3 text-xs text-muted-foreground",
          inSession && (phase === "playing" || phase === "picking") && "hidden md:flex",
        )}>
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
