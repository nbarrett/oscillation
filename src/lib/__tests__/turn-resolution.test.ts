import { describe, expect, it } from "vitest"
import {
  cardTriggerForPath,
  chanceEffectOf,
  doublesObstructionMode,
  shouldGrantExtraThrow,
} from "@/lib/turn-resolution"
import { CHANCE_DECK } from "@/lib/card-decks"

describe("turn resolution", () => {
  it("does not invent a card trigger for an empty path", () => {
    expect(cardTriggerForPath([], null)).toBeNull()
  })

  it("grants an extra throw from the flag or the chance effect", () => {
    expect(shouldGrantExtraThrow(true, null)).toBe(true)
    expect(shouldGrantExtraThrow(false, { type: "extra_throw" })).toBe(true)
    expect(shouldGrantExtraThrow(false, { type: "miss_turn", turns: 1 })).toBe(false)
    expect(shouldGrantExtraThrow(false, null)).toBe(false)
  })

  it("reads chance effects only from chance cards", () => {
    const extra = CHANCE_DECK.find((card) => card.effect.type === "extra_throw") ?? null
    expect(chanceEffectOf(extra)?.type).toBe("extra_throw")
    expect(chanceEffectOf({ deck: "edge" })).toBeNull()
    expect(chanceEffectOf(null)).toBeNull()
  })

  it("maps doubles onto place or remove obstruction", () => {
    expect(doublesObstructionMode(3, 3)).toBe("place")
    expect(doublesObstructionMode(5, 5)).toBe("remove")
    expect(doublesObstructionMode(2, 5)).toBeNull()
  })
})
