export type DeckType = "edge" | "motorway" | "chance"

export type RoadType = "A" | "B"
export type Ordinal = "1st" | "2nd" | "3rd"
export type RotationDirection = "clockwise" | "anti-clockwise"
export type CompassDirection = "N" | "S" | "E" | "W" | "NE" | "NW" | "SE" | "SW"
export type InfrastructureType = "motorway junction" | "railway station"
export type ObstructionColor = "blue" | "yellow" | "green"

export type ChanceEffect =
  | { type: "miss_turn"; turns: number }
  | { type: "return_to_start" }
  | { type: "extra_throw" }
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
    { id: "chance-miss-1a", deck: "chance", title: "Flat Tyre", body: "You've got a flat tyre! Miss a turn while you change it.", effect: { type: "miss_turn", turns: 1 } },
    { id: "chance-miss-1b", deck: "chance", title: "Road Works", body: "The road ahead is closed for repairs. Miss a turn.", effect: { type: "miss_turn", turns: 1 } },
    { id: "chance-miss-1c", deck: "chance", title: "Traffic Jam", body: "You're stuck in a traffic jam. Miss a turn.", effect: { type: "miss_turn", turns: 1 } },
    { id: "chance-miss-2a", deck: "chance", title: "Engine Trouble", body: "Your engine has overheated! Miss 2 turns while it cools down.", effect: { type: "miss_turn", turns: 2 } },
    { id: "chance-miss-2b", deck: "chance", title: "Out of Fuel", body: "You've run out of fuel and need a tow. Miss 2 turns.", effect: { type: "miss_turn", turns: 2 } },
    { id: "chance-return", deck: "chance", title: "Wrong Turn!", body: "You've taken a completely wrong turn. Return to start!", effect: { type: "return_to_start" } },
    { id: "chance-extra-1", deck: "chance", title: "Tailwind", body: "A strong tailwind pushes you forward. Take an extra throw!", effect: { type: "extra_throw" } },
    { id: "chance-extra-2", deck: "chance", title: "Shortcut Found", body: "You've found a shortcut! Take an extra throw!", effect: { type: "extra_throw" } },
    { id: "chance-extra-3", deck: "chance", title: "Clear Roads", body: "The roads are empty — put your foot down! Take an extra throw!", effect: { type: "extra_throw" } },
    { id: "chance-obs-blue", deck: "chance", title: "Blue Obstruction", body: "Place a blue obstruction on any grid square to block opponents.", effect: { type: "place_obstruction", color: "blue" } },
    { id: "chance-obs-yellow", deck: "chance", title: "Yellow Obstruction", body: "Place a yellow obstruction on any grid square to block opponents.", effect: { type: "place_obstruction", color: "yellow" } },
    { id: "chance-obs-green", deck: "chance", title: "Green Obstruction", body: "Place a green obstruction on any grid square to block opponents.", effect: { type: "place_obstruction", color: "green" } },
    { id: "chance-rm-blue", deck: "chance", title: "Road Cleared", body: "Remove a blue obstruction from the map.", effect: { type: "remove_obstruction", color: "blue" } },
    { id: "chance-rm-yellow", deck: "chance", title: "Detour Found", body: "Remove a yellow obstruction from the map.", effect: { type: "remove_obstruction", color: "yellow" } },
    { id: "chance-rm-green", deck: "chance", title: "Path Cleared", body: "Remove a green obstruction from the map.", effect: { type: "remove_obstruction", color: "green" } },
    { id: "chance-miss-1d", deck: "chance", title: "Speed Camera", body: "Caught by a speed camera! Pull over and miss a turn.", effect: { type: "miss_turn", turns: 1 } },
    { id: "chance-extra-4", deck: "chance", title: "Downhill Coast", body: "A long downhill stretch — coast ahead! Take an extra throw!", effect: { type: "extra_throw" } },
    { id: "chance-obs-blue-2", deck: "chance", title: "Flooded Road", body: "Place a blue obstruction to block a flooded road.", effect: { type: "place_obstruction", color: "blue" } },
  ]
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
