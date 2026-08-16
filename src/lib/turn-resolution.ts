import { firstPathTrigger } from "@/lib/deck-triggers"
import { type ChanceCard, type ChanceEffect } from "@/lib/card-decks"
import { type GameBounds } from "@/lib/area-size"

export function cardTriggerForPath(
  path: string[],
  gameBounds: GameBounds | null,
  stations?: Array<{ lat: number; lng: number }>,
) {
  if (path.length === 0) return null
  return firstPathTrigger(path, gameBounds, stations)
}

export function shouldGrantExtraThrow(
  extraThrowFlag: boolean,
  effect: ChanceEffect | null,
): boolean {
  return extraThrowFlag || effect?.type === "extra_throw"
}

export function chanceEffectOf(card: { deck: string } | null): ChanceEffect | null {
  if (!card || card.deck !== "chance") return null
  return (card as ChanceCard).effect
}

export function doublesObstructionMode(dice1: number, dice2: number): "place" | "remove" | null {
  if (dice1 !== dice2) return null
  return dice1 <= 4 ? "place" : "remove"
}
