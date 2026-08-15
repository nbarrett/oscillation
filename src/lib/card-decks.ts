export type DeckType = "edge" | "motorway" | "chance"

export type RoadType = "A" | "B"
export type Ordinal = "1st" | "2nd" | "3rd"
export type RotationDirection = "clockwise" | "anti-clockwise"
export type CompassDirection = "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW"
export type InfrastructureType = "motorway junction" | "railway station"
export type ObstructionColor = "blue" | "yellow" | "green"

export type ShortcutColor = "red" | "magenta" | "black" | "green" | "yellow"

export const SHORTCUT_COLOURS: ShortcutColor[] = ["red", "magenta", "black", "green", "yellow"]

export type ChanceEffect =
  | { type: "miss_turn"; turns: number }
  | { type: "return_to_start" }
  | { type: "extra_throw" }
  | { type: "shortcut_token"; color: ShortcutColor }
  | { type: "place_obstruction"; color: ObstructionColor }
  | { type: "remove_obstruction"; color: ObstructionColor }

export interface EdgeCard {
  id: string
  deck: "edge"
  title: string
  roadType: RoadType
  ordinal: Ordinal
  direction: RotationDirection
}

export interface MotorwayCard {
  id: string
  deck: "motorway"
  title: string
  compass: CompassDirection
  ordinal: Ordinal
  infrastructure: InfrastructureType
}

export interface ChanceCard {
  id: string
  deck: "chance"
  title: string
  body: string
  effect: ChanceEffect
}

export type GameCard = EdgeCard | MotorwayCard | ChanceCard

export interface ObstructionToken {
  gridKey: string
  color: ObstructionColor
  placedByPlayerId: string
}

const ROAD_TYPES: RoadType[] = ["A", "B"]
const ORDINALS: Ordinal[] = ["1st", "2nd", "3rd"]
const ROTATION_DIRECTIONS: RotationDirection[] = ["clockwise", "anti-clockwise"]
const COMPASS_DIRECTIONS: CompassDirection[] = ["N", "S", "E", "W", "NE", "NW", "SE", "SW"]
const INFRASTRUCTURE_TYPES: InfrastructureType[] = ["motorway junction", "railway station"]

function buildEdgeDeck(): EdgeCard[] {
  const cards: EdgeCard[] = []
  for (const roadType of ROAD_TYPES) {
    for (const ordinal of ORDINALS) {
      for (const direction of ROTATION_DIRECTIONS) {
        cards.push({
          id: `edge-${roadType}-${ordinal}-${direction}`,
          deck: "edge",
          title: `Take the ${ordinal} ${roadType}-road ${direction}`,
          roadType,
          ordinal,
          direction,
        })
      }
    }
  }
  return cards
}

function buildMotorwayDeck(): MotorwayCard[] {
  const cards: MotorwayCard[] = []
  for (const compass of COMPASS_DIRECTIONS) {
    for (const ordinal of ORDINALS) {
      for (const infrastructure of INFRASTRUCTURE_TYPES) {
        const infraShort = infrastructure === "motorway junction" ? "motorway" : "railway"
        cards.push({
          id: `mw-${compass}-${ordinal}-${infraShort}`,
          deck: "motorway",
          title: `Head to the ${ordinal} ${infrastructure} to the ${compass}`,
          compass,
          ordinal,
          infrastructure,
        })
      }
    }
  }
  return cards
}

function buildChanceDeck(): ChanceCard[] {
  return [
    { id: "chance-engine-overheated", deck: "chance", title: "Engine overheated", body: "Miss a go", effect: { type: "miss_turn", turns: 1 } },
    { id: "chance-traffic-accident", deck: "chance", title: "Traffic accident", body: "Miss a go", effect: { type: "miss_turn", turns: 1 } },
    { id: "chance-fails-orientate", deck: "chance", title: "Fails to orientate map", body: "Miss a go", effect: { type: "miss_turn", turns: 1 } },
    { id: "chance-old-map", deck: "chance", title: "Using old map", body: "Miss a go", effect: { type: "miss_turn", turns: 1 } },
    { id: "chance-missed-turning", deck: "chance", title: "Missed a turning", body: "Miss a go to consult map", effect: { type: "miss_turn", turns: 1 } },
    { id: "chance-car-crash", deck: "chance", title: "Car crash", body: "Go back to start", effect: { type: "return_to_start" } },
    { id: "chance-tyre-punctured", deck: "chance", title: "Tyre punctured", body: "Go back to start square", effect: { type: "return_to_start" } },
    { id: "chance-up-to-date-map", deck: "chance", title: "Using up-to-date map", body: "Have another throw", effect: { type: "extra_throw" } },
    { id: "chance-by-pass", deck: "chance", title: "Uses by-pass", body: "Take another throw", effect: { type: "extra_throw" } },
    { id: "chance-shortcut-red", deck: "chance", title: "Take a chance on a short cut", body: "Take OR REPLACE Red token", effect: { type: "shortcut_token", color: "red" } },
    { id: "chance-shortcut-magenta", deck: "chance", title: "Take a chance on a short cut", body: "Take OR REPLACE Magenta token", effect: { type: "shortcut_token", color: "magenta" } },
    { id: "chance-shortcut-black", deck: "chance", title: "Take a chance on a short cut", body: "Take OR REPLACE Black token", effect: { type: "shortcut_token", color: "black" } },
    { id: "chance-shortcut-green", deck: "chance", title: "Take a chance on a short cut", body: "Take OR REPLACE Green token", effect: { type: "shortcut_token", color: "green" } },
    { id: "chance-shortcut-yellow", deck: "chance", title: "Take a chance on a short cut", body: "Take OR REPLACE Yellow token", effect: { type: "shortcut_token", color: "yellow" } },
  ]
}

export function shortcutTokenKey(color: ShortcutColor): string {
  return `shortcut:${color}`
}

export const EDGE_DECK: EdgeCard[] = buildEdgeDeck()
export const MOTORWAY_DECK: MotorwayCard[] = buildMotorwayDeck()
export const CHANCE_DECK: ChanceCard[] = buildChanceDeck()

export const ALL_CARDS: Map<string, GameCard> = new Map([
  ...EDGE_DECK.map((c) => [c.id, c] as [string, GameCard]),
  ...MOTORWAY_DECK.map((c) => [c.id, c] as [string, GameCard]),
  ...CHANCE_DECK.map((c) => [c.id, c] as [string, GameCard]),
])

export function cardById(id: string): GameCard | null {
  return ALL_CARDS.get(id) ?? null
}

export function shuffleDeck(cardIds: string[]): string[] {
  const arr = [...cardIds]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}
