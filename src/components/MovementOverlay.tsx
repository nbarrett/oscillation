"use client"

import { useRef, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Minus, X } from "lucide-react"
import { useGameStore, GameTurnState } from "@/stores/game-store"
import { useDeckStore } from "@/stores/deck-store"
import { cn } from "@/lib/cn"

const OBSTRUCTION_COLOURS = [
  { id: "blue", label: "Blue", className: "bg-blue-600" },
  { id: "yellow", label: "Yellow", className: "bg-yellow-500" },
  { id: "green", label: "Green", className: "bg-green-600" },
] as const

export default function MovementOverlay() {
  const gameTurnState = useGameStore((s) => s.gameTurnState)
  const diceResult = useGameStore((s) => s.diceResult)
  const movementPath = useGameStore((s) => s.movementPath)
  const currentPlayerName = useGameStore((s) => s.currentPlayerName)
  const previewPaths = useGameStore((s) => s.previewPaths)
  const previewPathIndex = useGameStore((s) => s.previewPathIndex)
  const cyclePreviewPath = useGameStore((s) => s.cyclePreviewPath)
  const confirmPreviewPath = useGameStore((s) => s.confirmPreviewPath)
  const setPendingEndTurn = useGameStore((s) => s.setPendingEndTurn)
  const pathDiagnostics = useGameStore((s) => s.pathDiagnostics)
  const diceRolling = useGameStore((s) => s.diceRolling)
  const diceValues = useGameStore((s) => s.diceValues)
  const localPlayerName = useGameStore((s) => s.localPlayerName)
  const roadDataStatus = useGameStore((s) => s.roadDataStatus)

  const isPlacingObstruction = useDeckStore((s) => s.isPlacingObstruction)
  const isRemovingObstruction = useDeckStore((s) => s.isRemovingObstruction)
  const setPlacingObstruction = useDeckStore((s) => s.setPlacingObstruction)
  const setRemovingObstruction = useDeckStore((s) => s.setRemovingObstruction)

  const [diagOpen, setDiagOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null)

  function beginDrag(clientX: number, clientY: number) {
    dragStart.current = { mx: clientX, my: clientY, ox: dragOffset?.x ?? 0, oy: dragOffset?.y ?? 0 }
  }

  function moveDrag(clientX: number, clientY: number) {
    if (!dragStart.current) return
    setDragOffset({
      x: dragStart.current.ox + clientX - dragStart.current.mx,
      y: dragStart.current.oy + clientY - dragStart.current.my,
    })
  }

  function endDrag() {
    dragStart.current = null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    beginDrag(e.clientX, e.clientY)
    const onMove = (ev: MouseEvent) => moveDrag(ev.clientX, ev.clientY)
    const onUp = () => {
      endDrag()
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    const touch = e.touches[0]
    beginDrag(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart.current) return
    const touch = e.touches[0]
    moveDrag(touch.clientX, touch.clientY)
  }

  const isMyTurn = localPlayerName !== null && localPlayerName === currentPlayerName
  const isBotTurn = currentPlayerName?.startsWith("Bot ") ?? false
  const showPreviews = isMyTurn && gameTurnState === GameTurnState.DICE_ROLLED && diceResult && movementPath.length === 0 && previewPaths.length > 0
  const showRollDice = isMyTurn && gameTurnState === GameTurnState.ROLL_DICE
  const showFreeSelection = isMyTurn && gameTurnState === GameTurnState.DICE_ROLLED && diceResult && previewPaths.length === 0
  const showBotRolling = isBotTurn && diceRolling
  const showBotResult = isBotTurn && !diceRolling && diceValues && gameTurnState === GameTurnState.DICE_ROLLED
  const showObstruction = isMyTurn && (!!isPlacingObstruction || !!isRemovingObstruction)

  if (!showPreviews && !showRollDice && !showFreeSelection && !showBotRolling && !showBotResult && !showObstruction) return null

  return (
    <div
      className="absolute z-[1000] left-1/2 bottom-3 md:bottom-auto md:top-3 w-[min(100%-1.5rem,28rem)] md:w-auto"
      style={dragOffset ? { transform: `translate(calc(-50% + ${dragOffset.x}px), ${dragOffset.y}px)` } : { transform: "translateX(-50%)" }}
    >
      <div
        className="bg-primary/95 text-primary-foreground px-3 py-2 md:px-4 md:py-2.5 rounded-xl shadow-2xl text-center cursor-grab active:cursor-grabbing select-none touch-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={endDrag}
      >
        <div className="flex items-center justify-end gap-1 -mt-0.5 mb-1">
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="p-1 rounded-md hover:bg-primary-foreground/20"
            aria-label={collapsed ? "Expand overlay" : "Collapse overlay"}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          </button>
          {showPreviews && (
            <button
              onClick={() => useGameStore.getState().setPreviewPaths([])}
              className="p-1 rounded-md hover:bg-primary-foreground/20"
              aria-label="Hide routes"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed ? (
          <div className="text-sm font-semibold pointer-events-none pb-0.5">
            {showObstruction
              ? "Tap the map"
              : showPreviews
                ? `Move ${previewPathIndex + 1}/${previewPaths.length}`
                : showRollDice
                  ? "Roll the dice"
                  : showBotRolling
                    ? `${currentPlayerName} rolling`
                    : showBotResult && diceValues
                      ? `${currentPlayerName}: ${diceValues[0] + diceValues[1]}`
                      : `Move ${diceResult}`}
          </div>
        ) : (
          <>
            {showObstruction && (
              <div className="flex flex-col gap-2 text-left">
                <div className="text-sm font-bold">
                  {isPlacingObstruction
                    ? isPlacingObstruction === "pick"
                      ? "Pick an obstruction colour, then tap an A or B road"
                      : `Tap an A or B road to place a ${isPlacingObstruction} obstruction`
                    : "Tap an obstruction to remove it"}
                </div>
                {isPlacingObstruction === "pick" && (
                  <div className="flex gap-2">
                    {OBSTRUCTION_COLOURS.map((colour) => (
                      <button
                        key={colour.id}
                        onClick={() => setPlacingObstruction(colour.id)}
                        className={cn("flex-1 px-2 py-1.5 rounded-lg text-xs font-bold text-white", colour.className)}
                      >
                        {colour.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    setPlacingObstruction(null)
                    setRemovingObstruction(null)
                  }}
                  className="px-3 py-1.5 rounded-lg bg-primary-foreground text-primary text-sm font-bold"
                >
                  Skip
                </button>
              </div>
            )}
            {showBotRolling && (
              <div className="text-base md:text-lg font-bold pointer-events-none">
                {currentPlayerName} is rolling the dice...
              </div>
            )}
            {showBotResult && (
              <div className="text-base md:text-lg font-bold pointer-events-none">
                {currentPlayerName} threw {diceValues[0] + diceValues[1]}!
              </div>
            )}
            {showRollDice && (
              <div className="text-base md:text-lg font-bold pointer-events-none">
                {isMyTurn ? "Your" : `${currentPlayerName}\u2019s`} turn — Roll the dice!
              </div>
            )}
            {showFreeSelection && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-sm md:text-lg font-bold">
                    {roadDataStatus === "loading"
                      ? "Loading road data..."
                      : roadDataStatus === "error"
                        ? "Road data failed to load"
                        : movementPath.length > 0
                          ? `Moves: ${movementPath.length}/${diceResult} — tap to extend`
                          : `Move ${diceResult} squares — tap a road square`}
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
                      onClick={() => {
                        useGameStore.getState().setShowPreviewPaths(true)
                        useGameStore.getState().triggerPreviewRecompute()
                      }}
                      className="px-3 py-1.5 rounded-lg bg-primary-foreground text-primary text-sm font-bold hover:bg-primary-foreground/90 transition-colors shrink-0"
                    >
                      Show Routes
                    </button>
                  )}
                </div>
                {pathDiagnostics && (
                  <div className="text-xs">
                    <button
                      onClick={() => setDiagOpen((o) => !o)}
                      className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <ChevronDown className={cn("h-3 w-3 transition-transform", diagOpen && "rotate-180")} />
                      Why no routes?
                    </button>
                    {diagOpen && (
                      <div className="mt-1.5 bg-black/20 rounded-lg px-3 py-2 text-left space-y-0.5 font-mono">
                        <div>Dice: {pathDiagnostics.dice}</div>
                        <div>Reachable grids (BFS): {pathDiagnostics.reachable}</div>
                        <div>At exact {pathDiagnostics.dice} steps: {pathDiagnostics.atExactSteps}</div>
                        <div>↳ with A/B road: {pathDiagnostics.atExactStepsABRoad}</div>
                        <div>↳ with any road: {pathDiagnostics.atExactStepsAnyRoad}</div>
                        <div>Occupied grids: {pathDiagnostics.occupied}</div>
                        <div>Start has road: {pathDiagnostics.startHasRoad ? "yes" : "no"}</div>
                        <div>Paths found: {pathDiagnostics.pathsFound}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {showPreviews && (
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => cyclePreviewPath(-1)}
                  className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="min-w-[7rem]">
                  <div className="text-sm md:text-lg font-bold">
                    Move {previewPathIndex + 1} of {previewPaths.length}
                  </div>
                  <div className="text-xs opacity-80">
                    or tap a green square
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
                  className="ml-1 px-2.5 py-1.5 rounded-lg bg-primary-foreground text-primary text-sm font-bold hover:bg-primary-foreground/90 transition-colors"
                >
                  Select
                </button>
                <button
                  onClick={() => {
                    confirmPreviewPath()
                    setPendingEndTurn(true)
                  }}
                  className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg bg-primary-foreground text-primary text-sm font-bold hover:bg-primary-foreground/90 transition-colors"
                >
                  Select & End
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
