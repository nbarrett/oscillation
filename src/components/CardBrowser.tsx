"use client"

import { useMemo } from "react"
import { Signpost, TrainTrack, Shuffle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EDGE_DECK, MOTORWAY_DECK, CHANCE_DECK, type EdgeCard, type MotorwayCard, type ChanceCard, type GameCard, type DeckType } from "@/lib/card-decks"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/cn"

interface CardBrowserProps {
  open: boolean
  onClose: () => void
  sessionId: string
}

interface DrawRecord {
  cardId: string
  playerName: string
  drawnAt: string
}

const DECK_CONFIG: Record<DeckType, {
  label: string
  icon: React.ReactNode
  headerGradient: string
  bgGradient: string
  borderColor: string
  textColor: string
  badgeColor: string
}> = {
  edge: {
    label: "Edge Deck",
    icon: <Signpost className="h-4 w-4" />,
    headerGradient: "from-orange-700 to-orange-900",
    bgGradient: "from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40",
    borderColor: "border-orange-300 dark:border-orange-700",
    textColor: "text-orange-900 dark:text-orange-100",
    badgeColor: "bg-orange-600",
  },
  motorway: {
    label: "Motorway Deck",
    icon: <TrainTrack className="h-4 w-4" />,
    headerGradient: "from-indigo-700 to-indigo-900",
    bgGradient: "from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40",
    borderColor: "border-indigo-300 dark:border-indigo-700",
    textColor: "text-indigo-900 dark:text-indigo-100",
    badgeColor: "bg-indigo-600",
  },
  chance: {
    label: "Chance Deck",
    icon: <Shuffle className="h-4 w-4" />,
    headerGradient: "from-red-700 to-rose-900",
    bgGradient: "from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40",
    borderColor: "border-red-300 dark:border-red-700",
    textColor: "text-red-900 dark:text-red-100",
    badgeColor: "bg-red-600",
  },
}

function cardBodyText(card: GameCard): string {
  if (card.deck === "chance") return (card as ChanceCard).body
  if (card.deck === "edge") {
    const c = card as EdgeCard
    return `Take the ${c.ordinal} ${c.roadType}-road ${c.direction}`
  }
  const c = card as MotorwayCard
  return `Head to the ${c.ordinal} ${c.infrastructure} to the ${c.compass}`
}

const CARD_TILTS = [-2, 1, -1, 2, 0, -2, 1, 0, -1, 2, 1, -2]

function GameCardTile({ card, draws }: { card: GameCard; draws: DrawRecord[] }) {
  const config = DECK_CONFIG[card.deck]
  const tilt = CARD_TILTS[card.id.length % CARD_TILTS.length]
  const isDrawn = draws.length > 0
  const latestDraw = draws[draws.length - 1]

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        transform: `rotate(${tilt}deg)`,
        transformOrigin: "center bottom",
      }}
    >
      <div
        className={cn(
          "relative w-32 rounded-lg border overflow-hidden select-none",
          "transition-all duration-200 hover:scale-105 hover:rotate-0",
          config.borderColor,
          isDrawn && "opacity-70",
        )}
        style={{
          boxShadow: isDrawn
            ? "0 4px 12px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)"
            : "0 8px 24px rgba(0,0,0,0.25), 0 3px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        <div
          className={cn(
            "px-2 py-1.5 flex items-center gap-1.5",
            `bg-gradient-to-br ${config.headerGradient}`,
          )}
          style={{
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)",
          }}
        >
          <span className="text-white/90">{config.icon}</span>
          <span className="text-white text-[9px] font-bold uppercase tracking-wider truncate">
            {config.label}
          </span>
        </div>

        <div
          className={cn(
            "px-2 py-2 min-h-[80px] flex flex-col gap-1",
            `bg-gradient-to-br ${config.bgGradient}`,
          )}
        >
          <p className={cn("text-[10px] font-semibold leading-tight", config.textColor)}>
            {card.title}
          </p>
          <p className="text-[9px] text-muted-foreground leading-tight">
            {cardBodyText(card)}
          </p>
        </div>

        {isDrawn && (
          <div
            className={cn(
              "absolute inset-0 flex items-end justify-start p-1.5",
            )}
          >
            <div className={cn(
              "px-1.5 py-0.5 rounded text-white text-[8px] font-bold leading-none",
              config.badgeColor,
            )}>
              {draws.length > 1 ? `×${draws.length} ` : ""}{latestDraw?.playerName}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DeckSection({ deck, deckType, drawsByCard }: {
  deck: GameCard[]
  deckType: DeckType
  drawsByCard: Map<string, DrawRecord[]>
}) {
  const config = DECK_CONFIG[deckType]
  const drawnCount = deck.filter(c => (drawsByCard.get(c.id)?.length ?? 0) > 0).length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={cn("flex items-center gap-1.5 font-semibold text-sm", config.textColor)}>
          {config.icon}
          {config.label}
        </span>
        <span className="text-xs text-muted-foreground">
          {deck.length} cards · {drawnCount} drawn
        </span>
      </div>
      <div className="flex flex-wrap gap-3 pb-2">
        {deck.map(card => (
          <GameCardTile
            key={card.id}
            card={card}
            draws={drawsByCard.get(card.id) ?? []}
          />
        ))}
      </div>
    </div>
  )
}

export default function CardBrowser({ open, onClose, sessionId }: CardBrowserProps) {
  const { data: drawHistory = [] } = trpc.game.deckDrawHistory.useQuery(
    { sessionId },
    { enabled: open, refetchInterval: open ? 5000 : false },
  )

  const drawsByCard = useMemo(() => {
    const map = new Map<string, DrawRecord[]>()
    for (const draw of drawHistory) {
      const existing = map.get(draw.cardId) ?? []
      existing.push(draw)
      map.set(draw.cardId, existing)
    }
    return map
  }, [drawHistory])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-5xl w-full max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shuffle className="h-5 w-5 text-primary" />
            Card Decks
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {drawHistory.length} card{drawHistory.length !== 1 ? "s" : ""} drawn this game
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <DeckSection
            deck={EDGE_DECK}
            deckType="edge"
            drawsByCard={drawsByCard}
          />
          <DeckSection
            deck={CHANCE_DECK}
            deckType="chance"
            drawsByCard={drawsByCard}
          />
          <DeckSection
            deck={MOTORWAY_DECK}
            deckType="motorway"
            drawsByCard={drawsByCard}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
