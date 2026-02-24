"use client"

import { Beer, Church, Castle, Phone, GraduationCap, Signpost, TrainTrack, Shuffle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { POI_CATEGORY_LABELS, type PoiCategory } from "@/lib/poi-categories"
import { type GameCard, type ChanceCard, type DeckType } from "@/lib/card-decks"
import { useDeckStore } from "@/stores/deck-store"

interface PoiCardData {
  title: string
  body: string
  type: string
}

interface CardDrawDialogProps {
  card: PoiCardData | null
  deckCard: GameCard | null
  onClose: () => void
  onDeckCardClose: () => void
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  pub: <Beer className="h-8 w-8 text-blue-600" />,
  spire: <Church className="h-8 w-8 text-purple-700" />,
  tower: <Castle className="h-8 w-8 text-pink-500" />,
  phone: <Phone className="h-8 w-8 text-yellow-600" />,
  school: <GraduationCap className="h-8 w-8 text-green-600" />,
}

const DECK_ICONS: Record<DeckType, React.ReactNode> = {
  edge: <Signpost className="h-8 w-8 text-orange-600" />,
  motorway: <TrainTrack className="h-8 w-8 text-indigo-600" />,
  chance: <Shuffle className="h-8 w-8 text-red-500" />,
}

const DECK_LABELS: Record<DeckType, string> = {
  edge: "Edge Card",
  motorway: "Motorway / Railway Card",
  chance: "Chance Card",
}

function deckCardBody(card: GameCard): string {
  if (card.deck === "chance") return (card as ChanceCard).body
  return card.title
}

function chanceActionLabel(card: ChanceCard): string {
  switch (card.effect.type) {
    case "place_obstruction":
      return "Place Obstruction"
    case "remove_obstruction":
      return "Remove Obstruction"
    default:
      return "Continue"
  }
}

export default function CardDrawDialog({ card, deckCard, onClose, onDeckCardClose }: CardDrawDialogProps) {
  const { setPlacingObstruction, setRemovingObstruction, setExtraThrow, setMissedTurns } = useDeckStore()

  if (deckCard) {
    const icon = DECK_ICONS[deckCard.deck]
    const label = DECK_LABELS[deckCard.deck]
    const body = deckCardBody(deckCard)

    const handleDeckAction = () => {
      if (deckCard.deck === "chance") {
        const chance = deckCard as ChanceCard
        switch (chance.effect.type) {
          case "place_obstruction":
            setPlacingObstruction(chance.effect.color)
            break
          case "remove_obstruction":
            setRemovingObstruction(chance.effect.color)
            break
          case "extra_throw":
            setExtraThrow(true)
            break
        }
      }
      onDeckCardClose()
    }

    const buttonLabel = deckCard.deck === "chance"
      ? chanceActionLabel(deckCard as ChanceCard)
      : "Continue"

    return (
      <Dialog open={true} onOpenChange={(open) => { if (!open) handleDeckAction() }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {icon}
              {deckCard.title}
            </DialogTitle>
            <DialogDescription>
              {label}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm leading-relaxed">{body}</p>
          </div>
          <Button className="w-full" onClick={handleDeckAction}>
            {buttonLabel}
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  if (!card) return null

  const poiIcon = CATEGORY_ICONS[card.type]
  const categoryLabel = POI_CATEGORY_LABELS[card.type as PoiCategory] ?? card.type

  return (
    <Dialog open={!!card} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {poiIcon}
            {card.title}
          </DialogTitle>
          <DialogDescription>
            {categoryLabel} card
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm leading-relaxed">{card.body}</p>
        </div>
        <Button className="w-full" onClick={onClose}>
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  )
}
