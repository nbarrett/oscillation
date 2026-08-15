import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const BOT_TURN_PLAYER_PATH = resolve(__dirname, "../BotTurnPlayer.tsx")
const DICE_ROLLER_PATH = resolve(__dirname, "../DiceRoller.tsx")
const SELECT_GRID_SQUARES_PATH = resolve(__dirname, "../SelectGridSquares.tsx")
const GAME_STORE_PATH = resolve(__dirname, "../../stores/game-store.ts")
const GAME_SYNC_PATH = resolve(__dirname, "../GameSync.tsx")

const botCode = readFileSync(BOT_TURN_PLAYER_PATH, "utf-8")
const humanCode = readFileSync(DICE_ROLLER_PATH, "utf-8")
const gridSquaresCode = readFileSync(SELECT_GRID_SQUARES_PATH, "utf-8")
const gameStoreCode = readFileSync(GAME_STORE_PATH, "utf-8")
const gameSyncCode = readFileSync(GAME_SYNC_PATH, "utf-8")

describe("Bot Rule Compliance - Deck Card Triggers", () => {
  it("human player checks isOnBoardEdge trigger via SelectGridSquares", () => {
    expect(gridSquaresCode).toContain("firstPathTrigger")
  })

  it("bot player checks isOnBoardEdge trigger", () => {
    expect(botCode).toContain("firstPathTrigger")
  })

  it("human player checks isOnMotorwayOrRailway trigger via SelectGridSquares", () => {
    expect(gridSquaresCode).toContain("firstPathTrigger")
  })

  it("bot player checks isOnMotorwayOrRailway trigger", () => {
    expect(botCode).toContain("firstPathTrigger")
  })

  it("both import deck trigger functions", () => {
    expect(gridSquaresCode).toContain("deck-triggers")
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
    expect(humanCode).toContain("shouldGrantExtraThrow")
    expect(humanCode).toContain("getState().extraThrow")
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

  it("human player draws a chance card on POI visit", () => {
    expect(humanCode).toContain("requestDeckDraw(\"chance\")")
  })

  it("bot player draws a chance card on POI visit", () => {
    expect(botCode).toContain("deckType: \"chance\"")
    expect(botCode).toContain("processBotCardEffect")
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
    expect(botCode).toContain("reachableRoadGrids(startGridKey, total, excluded")
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

describe("Turn loop safety", () => {
  it("confirming a preview path records any edge or motorway trigger", () => {
    expect(gameStoreCode).toContain("cardTriggerForPath")
  })

  it("GameSync keeps the local car put during the current player's move", () => {
    expect(gameSyncCode).toContain("midTurnName")
  })

  it("card relocation does not pretend a server update is in flight", () => {
    const relocation = gameStoreCode.slice(
      gameStoreCode.indexOf("handleCardRelocation"),
      gameStoreCode.indexOf("setReachableGrids"),
    )
    expect(relocation).not.toContain("pendingServerUpdate: true")
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
    { name: "isOnBoardEdge", pattern: "firstPathTrigger", source: "gridSquares" },
    { name: "isOnMotorwayOrRailway", pattern: "firstPathTrigger", source: "gridSquares" },
    { name: "queueDraw", pattern: "queueDraw", source: "human" },
    { name: "processNextDraw", pattern: "processNextDraw", source: "human" },
    { name: "extraThrow", pattern: "extraThrow", source: "human" },
    { name: "applyChanceEffectMutation", pattern: "applyChanceEffectMutation", source: "human" },
    { name: "detectPoiVisits", pattern: "detectPoiVisits", source: "human" },
    { name: "missedTurns", pattern: "missedTurns", source: "human" },
    { name: "obstructions", pattern: "obstructions", source: "gridSquares" },
  ]

  it("bot has full feature parity with human player", () => {
    const humanCodeSources: Record<string, string> = {
      human: humanCode,
      gridSquares: gridSquaresCode,
    }

    const missingFromHuman = humanFeatures
      .filter(f => !humanCodeSources[f.source]?.includes(f.pattern))
      .map(f => f.name)
    expect(missingFromHuman).toEqual([])

    const missingFromBot = humanFeatures
      .filter(f => !botCode.includes(f.pattern))
      .map(f => f.name)
    expect(missingFromBot).toEqual([])
  })
})
