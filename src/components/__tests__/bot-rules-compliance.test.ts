import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const BOT_TURN_PLAYER_PATH = resolve(__dirname, "../BotTurnPlayer.tsx")
const DICE_ROLLER_PATH = resolve(__dirname, "../DiceRoller.tsx")

const botCode = readFileSync(BOT_TURN_PLAYER_PATH, "utf-8")
const humanCode = readFileSync(DICE_ROLLER_PATH, "utf-8")

describe("Bot Rule Compliance - Deck Card Triggers", () => {
  it("human player checks isNearBoundaryEdge trigger", () => {
    expect(humanCode).toContain("isNearBoundaryEdge")
  })

  it("bot player checks isNearBoundaryEdge trigger", () => {
    expect(botCode).toContain("isNearBoundaryEdge")
  })

  it("human player checks isOnMotorwayOrRailway trigger", () => {
    expect(humanCode).toContain("isOnMotorwayOrRailway")
  })

  it("bot player checks isOnMotorwayOrRailway trigger", () => {
    expect(botCode).toContain("isOnMotorwayOrRailway")
  })

  it("both import deck trigger functions", () => {
    expect(humanCode).toContain("deck-triggers")
    expect(botCode).toContain("deck-triggers")
  })
})

describe("Bot Rule Compliance - Card Drawing", () => {
  it("human player uses queueDraw to queue deck draws", () => {
    expect(humanCode).toContain("queueDraw")
  })

  it("bot player uses queueDraw to queue deck draws", () => {
    expect(botCode).toContain("queueDraw")
  })

  it("human player uses processNextDraw to draw cards", () => {
    expect(humanCode).toContain("processNextDraw")
  })

  it("bot player uses processNextDraw to draw cards", () => {
    expect(botCode).toContain("processNextDraw")
  })
})

describe("Bot Rule Compliance - Chance Card Effects", () => {
  it("human player handles extra throw from chance cards", () => {
    expect(humanCode).toContain("extraThrow")
  })

  it("bot player handles extra throw from chance cards", () => {
    expect(botCode).toContain("extraThrow")
  })

  it("human player applies chance effects via applyChanceEffectMutation", () => {
    expect(humanCode).toContain("applyChanceEffectMutation")
  })

  it("bot player applies chance effects via applyChanceEffectMutation", () => {
    expect(botCode).toContain("applyChanceEffectMutation")
  })

  it("bot player handles miss_turn effect", () => {
    expect(botCode).toContain("miss_turn")
  })

  it("bot player handles return_to_start effect", () => {
    expect(botCode).toContain("return_to_start")
  })

  it("bot player handles place_obstruction effect", () => {
    expect(botCode).toContain("place_obstruction")
    expect(botCode).toContain("placeObstructionMutation")
  })

  it("bot player handles remove_obstruction effect", () => {
    expect(botCode).toContain("remove_obstruction")
    expect(botCode).toContain("removeObstructionMutation")
  })
})

describe("Bot Rule Compliance - POI Visits", () => {
  it("human player detects POI visits with detectPoiVisits", () => {
    expect(humanCode).toContain("detectPoiVisits")
  })

  it("bot player detects POI visits with detectPoiVisits", () => {
    expect(botCode).toContain("detectPoiVisits")
  })

  it("human player draws POI cards on visit via drawCardMutation", () => {
    expect(humanCode).toContain("drawCardMutation")
  })

  it("bot player draws POI cards on visit via drawCardMutation", () => {
    expect(botCode).toContain("drawCardMutation")
  })
})

describe("Bot Rule Compliance - Missed Turns", () => {
  it("bot player checks for missed turns", () => {
    expect(botCode).toContain("missedTurns")
  })

  it("bot player decrements missed turns", () => {
    expect(botCode).toContain("decrementMissedTurns")
  })

  it("bot player calls skipMissedTurnMutation", () => {
    expect(botCode).toContain("skipMissedTurnMutation")
  })

  it("bot player skips turn when missed turns > 0", () => {
    expect(botCode).toContain("botMissed > 0")
  })
})

describe("Bot Rule Compliance - Obstructions", () => {
  it("bot player reads obstructions from deck store", () => {
    expect(botCode).toContain("obstructions")
  })

  it("bot player builds excluded set from obstructions", () => {
    expect(botCode).toContain("excluded")
  })

  it("bot player passes excluded grids to reachableRoadGrids", () => {
    expect(botCode).toContain("reachableRoadGrids(startGridKey, total, excluded)")
  })
})

describe("Bot Rule Compliance - Movement Rules", () => {
  it("bot player uses exact step matching", () => {
    expect(botCode).toContain("steps === total")
  })

  it("bot player snaps to nearest road position", () => {
    expect(botCode).toContain("nearestRoadPosition")
  })

  it("bot player converts position to grid key", () => {
    expect(botCode).toContain("latLngToGridKey")
  })
})

describe("Bot Rule Compliance - Extra Throw", () => {
  it("bot player checks extraThrow after processing cards", () => {
    expect(botCode).toContain("extraThrow")
  })

  it("bot player re-triggers playBotTurn on extra throw", () => {
    expect(botCode).toContain("playBotTurn()")
  })

  it("bot player resets extraThrow flag after using it", () => {
    expect(botCode).toContain("setExtraThrow(false)")
  })
})

describe("Feature Parity Summary", () => {
  const humanFeatures = [
    { name: "isNearBoundaryEdge", pattern: "isNearBoundaryEdge" },
    { name: "isOnMotorwayOrRailway", pattern: "isOnMotorwayOrRailway" },
    { name: "queueDraw", pattern: "queueDraw" },
    { name: "processNextDraw", pattern: "processNextDraw" },
    { name: "extraThrow", pattern: "extraThrow" },
    { name: "applyChanceEffectMutation", pattern: "applyChanceEffectMutation" },
    { name: "detectPoiVisits", pattern: "detectPoiVisits" },
    { name: "drawCardMutation", pattern: "drawCardMutation" },
    { name: "missedTurns", pattern: "missedTurns" },
    { name: "obstructions", pattern: "obstructions" },
  ]

  it("bot has full feature parity with human player", () => {
    const missingFeatures = humanFeatures
      .filter(f => !botCode.includes(f.pattern))
      .map(f => f.name)

    expect(missingFeatures).toEqual([])
  })
})
