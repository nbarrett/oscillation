import { describe, expect, it } from "vitest"
import { CHANCE_DECK, SHORTCUT_COLOURS, shortcutTokenKey } from "@/lib/card-decks"

describe("physical Chance & Obstructions deck", () => {
  it("has the 14 physical cards and no invented extras", () => {
    expect(CHANCE_DECK).toHaveLength(14)
  })

  it("uses the physical penalty and bonus titles", () => {
    const titles = CHANCE_DECK.map((card) => card.title)
    expect(titles).toContain("Engine overheated")
    expect(titles).toContain("Traffic accident")
    expect(titles).toContain("Fails to orientate map")
    expect(titles).toContain("Using old map")
    expect(titles).toContain("Missed a turning")
    expect(titles).toContain("Car crash")
    expect(titles).toContain("Tyre punctured")
    expect(titles).toContain("Using up-to-date map")
    expect(titles).toContain("Uses by-pass")
    expect(titles.filter((title) => title === "Take a chance on a short cut")).toHaveLength(5)
    expect(titles).not.toContain("Engine Trouble")
    expect(titles).not.toContain("Flooded Road")
    expect(titles).not.toContain("Speed Camera")
  })

  it("miss-a-go cards miss one turn, not two", () => {
    const missCards = CHANCE_DECK.filter((card) => card.effect.type === "miss_turn")
    expect(missCards).toHaveLength(5)
    expect(missCards.every((card) => card.effect.type === "miss_turn" && card.effect.turns === 1)).toBe(true)
  })

  it("has two return-to-start cards", () => {
    const returns = CHANCE_DECK.filter((card) => card.effect.type === "return_to_start")
    expect(returns.map((card) => card.title).sort()).toEqual(["Car crash", "Tyre punctured"])
  })

  it("uses the physical shortcut token colours", () => {
    const shortcutCards = CHANCE_DECK.filter((card) => card.effect.type === "shortcut_token")
    expect(shortcutCards.map((card) => card.effect.type === "shortcut_token" ? card.effect.color : null)).toEqual(SHORTCUT_COLOURS)
    expect(shortcutTokenKey("magenta")).toBe("shortcut:magenta")
  })
})
