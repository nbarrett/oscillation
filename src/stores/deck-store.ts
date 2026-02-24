import { create } from "zustand"
import {
  type DeckType,
  type GameCard,
  type ObstructionToken,
  type ChanceCard,
  EDGE_DECK,
  MOTORWAY_DECK,
  CHANCE_DECK,
  cardById,
  shuffleDeck,
} from "@/lib/card-decks"

export interface DeckState {
  edgeDeck: string[]
  motorwayDeck: string[]
  chanceDeck: string[]
  edgeDrawIndex: number
  motorwayDrawIndex: number
  chanceDrawIndex: number
  drawnDeckCard: GameCard | null
  pendingDraws: DeckType[]
  activeEdgeCard: GameCard | null
  activeMotorwayCard: GameCard | null
  missedTurns: Record<string, number>
  obstructions: ObstructionToken[]
  isPlacingObstruction: string | null
  isRemovingObstruction: string | null
  extraThrow: boolean
}

interface DeckActions {
  initDecks: (state?: SerializedDeckState | null) => void
  drawFromDeck: (deckType: DeckType) => GameCard | null
  queueDraw: (deckType: DeckType) => void
  processNextDraw: () => GameCard | null
  clearDrawnCard: () => void
  setObstructions: (obstructions: ObstructionToken[]) => void
  addObstruction: (token: ObstructionToken) => void
  removeObstruction: (gridKey: string) => void
  setMissedTurns: (playerName: string, turns: number) => void
  decrementMissedTurns: (playerName: string) => void
  setPlacingObstruction: (color: string | null) => void
  setRemovingObstruction: (color: string | null) => void
  setExtraThrow: (value: boolean) => void
  resetDecks: () => void
}

export interface SerializedDeckState {
  edgeDeck: string[]
  motorwayDeck: string[]
  chanceDeck: string[]
  edgeDrawIndex: number
  motorwayDrawIndex: number
  chanceDrawIndex: number
}

function initialDeckIds(deck: DeckType): string[] {
  switch (deck) {
    case "edge":
      return EDGE_DECK.map((c) => c.id)
    case "motorway":
      return MOTORWAY_DECK.map((c) => c.id)
    case "chance":
      return CHANCE_DECK.map((c) => c.id)
  }
}

export const useDeckStore = create<DeckState & DeckActions>()((set, get) => ({
  edgeDeck: [],
  motorwayDeck: [],
  chanceDeck: [],
  edgeDrawIndex: 0,
  motorwayDrawIndex: 0,
  chanceDrawIndex: 0,
  drawnDeckCard: null,
  pendingDraws: [],
  activeEdgeCard: null,
  activeMotorwayCard: null,
  missedTurns: {},
  obstructions: [],
  isPlacingObstruction: null,
  isRemovingObstruction: null,
  extraThrow: false,

  initDecks: (state) => {
    if (state) {
      set({
        edgeDeck: state.edgeDeck,
        motorwayDeck: state.motorwayDeck,
        chanceDeck: state.chanceDeck,
        edgeDrawIndex: state.edgeDrawIndex,
        motorwayDrawIndex: state.motorwayDrawIndex,
        chanceDrawIndex: state.chanceDrawIndex,
      })
    } else {
      set({
        edgeDeck: shuffleDeck(initialDeckIds("edge")),
        motorwayDeck: shuffleDeck(initialDeckIds("motorway")),
        chanceDeck: shuffleDeck(initialDeckIds("chance")),
        edgeDrawIndex: 0,
        motorwayDrawIndex: 0,
        chanceDrawIndex: 0,
      })
    }
  },

  drawFromDeck: (deckType) => {
    const state = get()
    let deck: string[]
    let drawIndex: number
    let deckKey: "edgeDeck" | "motorwayDeck" | "chanceDeck"
    let indexKey: "edgeDrawIndex" | "motorwayDrawIndex" | "chanceDrawIndex"

    switch (deckType) {
      case "edge":
        deck = state.edgeDeck
        drawIndex = state.edgeDrawIndex
        deckKey = "edgeDeck"
        indexKey = "edgeDrawIndex"
        break
      case "motorway":
        deck = state.motorwayDeck
        drawIndex = state.motorwayDrawIndex
        deckKey = "motorwayDeck"
        indexKey = "motorwayDrawIndex"
        break
      case "chance":
        deck = state.chanceDeck
        drawIndex = state.chanceDrawIndex
        deckKey = "chanceDeck"
        indexKey = "chanceDrawIndex"
        break
    }

    if (deck.length === 0) return null

    if (drawIndex >= deck.length) {
      const reshuffled = shuffleDeck(initialDeckIds(deckType))
      const cardId = reshuffled[0]
      const card = cardById(cardId)
      set({
        [deckKey]: reshuffled,
        [indexKey]: 1,
        drawnDeckCard: card,
      } as Partial<DeckState>)
      return card
    }

    const cardId = deck[drawIndex]
    const card = cardById(cardId)
    set({
      [indexKey]: drawIndex + 1,
      drawnDeckCard: card,
    } as Partial<DeckState>)
    return card
  },

  queueDraw: (deckType) => {
    set((state) => ({
      pendingDraws: [...state.pendingDraws, deckType],
    }))
  },

  processNextDraw: () => {
    const state = get()
    if (state.pendingDraws.length === 0) return null
    const [nextDeck, ...remaining] = state.pendingDraws
    set({ pendingDraws: remaining })
    return state.drawFromDeck(nextDeck)
  },

  clearDrawnCard: () => set({ drawnDeckCard: null }),

  setObstructions: (obstructions) => set({ obstructions }),

  addObstruction: (token) =>
    set((state) => ({
      obstructions: [...state.obstructions, token],
      isPlacingObstruction: null,
    })),

  removeObstruction: (gridKey) =>
    set((state) => ({
      obstructions: state.obstructions.filter((o) => o.gridKey !== gridKey),
      isRemovingObstruction: null,
    })),

  setMissedTurns: (playerName, turns) =>
    set((state) => ({
      missedTurns: { ...state.missedTurns, [playerName]: turns },
    })),

  decrementMissedTurns: (playerName) =>
    set((state) => {
      const current = state.missedTurns[playerName] ?? 0
      if (current <= 1) {
        const { [playerName]: _, ...rest } = state.missedTurns
        return { missedTurns: rest }
      }
      return { missedTurns: { ...state.missedTurns, [playerName]: current - 1 } }
    }),

  setPlacingObstruction: (color) => set({ isPlacingObstruction: color }),

  setRemovingObstruction: (color) => set({ isRemovingObstruction: color }),

  setExtraThrow: (value) => set({ extraThrow: value }),

  resetDecks: () =>
    set({
      edgeDeck: [],
      motorwayDeck: [],
      chanceDeck: [],
      edgeDrawIndex: 0,
      motorwayDrawIndex: 0,
      chanceDrawIndex: 0,
      drawnDeckCard: null,
      pendingDraws: [],
      activeEdgeCard: null,
      activeMotorwayCard: null,
      missedTurns: {},
      obstructions: [],
      isPlacingObstruction: null,
      isRemovingObstruction: null,
      extraThrow: false,
    }),
}))
