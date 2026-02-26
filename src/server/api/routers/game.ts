import { z } from "zod"
import { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, publicProcedure } from "../trpc"
import { CAR_STYLES } from "@/stores/car-store"
import { AREA_SIZES, DEFAULT_AREA_SIZE, areaSizeBounds, isWithinBounds, type AreaSize } from "@/lib/area-size"
import { snapToGridCenter } from "@/lib/road-data"
import { validatePoiCoverage, fetchPoiCandidates } from "@/server/overpass"
import { POI_CATEGORIES } from "@/lib/poi-categories"
import { EDGE_DECK, MOTORWAY_DECK, CHANCE_DECK, shuffleDeck, cardById, type ObstructionToken } from "@/lib/card-decks"
import { log } from "@/lib/utils"

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const gameRouter = createTRPCRouter({
  list: publicProcedure
    .query(async ({ ctx }) => {
      const sessions = await ctx.db.gameSession.findMany({
        where: {
          players: {
            some: {},
          },
        },
        include: {
          players: {
            orderBy: { turnOrder: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      })

      return sessions.map(session => ({
        id: session.id,
        code: session.code,
        phase: session.phase,
        playerCount: session.players.length,
        playerNames: session.players.map(p => p.name),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }))
    }),

  validateArea: publicProcedure
    .input(z.object({
      lat: z.number(),
      lng: z.number(),
      areaSize: z.enum(AREA_SIZES as [string, ...string[]]).default(DEFAULT_AREA_SIZE),
    }))
    .query(async ({ input }) => {
      const bounds = areaSizeBounds(input.lat, input.lng, input.areaSize as AreaSize)
      return validatePoiCoverage(bounds.south, bounds.west, bounds.north, bounds.east)
    }),

  validLocationIds: publicProcedure
    .input(z.object({
      areaSize: z.enum(AREA_SIZES as [string, ...string[]]).default(DEFAULT_AREA_SIZE),
    }))
    .query(async ({ ctx, input }) => {
      const locations = await ctx.db.namedLocation.findMany()
      const results = await Promise.allSettled(
        locations.map(async (loc) => {
          const bounds = areaSizeBounds(loc.lat, loc.lng, input.areaSize as AreaSize)
          const result = await validatePoiCoverage(bounds.south, bounds.west, bounds.north, bounds.east)
          return { id: loc.id, valid: result.valid }
        })
      )
      const validIds: string[] = []
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.valid) {
          validIds.push(r.value.id)
        } else if (r.status === "rejected") {
          log.warn("Failed to validate location:", r.reason)
        }
      }
      return validIds
    }),

  create: publicProcedure
    .input(z.object({
      playerName: z.string().min(1),
      startLat: z.number(),
      startLng: z.number(),
      iconType: z.string().optional(),
      areaSize: z.enum(AREA_SIZES as [string, ...string[]]).default(DEFAULT_AREA_SIZE),
    }))
    .mutation(async ({ ctx, input }) => {
      let code = generateSessionCode()
      let attempts = 0
      while (attempts < 10) {
        const existing = await ctx.db.gameSession.findUnique({ where: { code } })
        if (!existing) break
        code = generateSessionCode()
        attempts++
      }

      const snapped = snapToGridCenter(input.startLat, input.startLng)

      const session = await ctx.db.gameSession.create({
        data: {
          code,
          startLat: snapped.lat,
          startLng: snapped.lng,
          areaSize: input.areaSize,
          players: {
            create: {
              name: input.playerName,
              iconType: input.iconType ?? CAR_STYLES[0],
              positionLat: snapped.lat,
              positionLng: snapped.lng,
              turnOrder: 0,
            },
          },
        },
        include: { players: true },
      })

      const creatorId = session.players[0].id
      await ctx.db.gameSession.update({
        where: { id: session.id },
        data: { creatorPlayerId: creatorId },
      })

      return {
        sessionId: session.id,
        code: session.code,
        playerId: creatorId,
        creatorPlayerId: creatorId,
      }
    }),

  join: publicProcedure
    .input(z.object({
      code: z.string().length(6),
      playerName: z.string().min(1),
      iconType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { code: input.code.toUpperCase() },
        include: { players: true },
      })

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Game not found. Check the code and try again.",
        })
      }

      if (session.phase !== "lobby") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game has already started.",
        })
      }

      if (session.players.length >= 4) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game is full (maximum 4 players).",
        })
      }

      const existingPlayer = session.players.find(
        p => p.name.toLowerCase() === input.playerName.toLowerCase()
      )
      if (existingPlayer) {
        return {
          sessionId: session.id,
          code: session.code,
          playerId: existingPlayer.id,
        }
      }

      const turnOrder = session.players.length
      const iconType = input.iconType ?? CAR_STYLES[turnOrder % CAR_STYLES.length]

      const offsetLat = (session.startLat || 0) + 0.00014 * turnOrder
      const offsetLng = (session.startLng || 0) - 0.00025 * turnOrder

      const player = await ctx.db.gamePlayer.create({
        data: {
          name: input.playerName,
          iconType,
          positionLat: offsetLat,
          positionLng: offsetLng,
          turnOrder,
          sessionId: session.id,
        },
      })

      return {
        sessionId: session.id,
        code: session.code,
        playerId: player.id,
      }
    }),

  startGame: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: { players: true },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      if (session.phase !== "lobby") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Game has already started." })
      }

      if (session.creatorPlayerId !== input.playerId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the game creator can start the game." })
      }

      if (session.players.length < 1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Need at least 1 player to start." })
      }

      if (session.players.length === 1) {
        const botNames = ["Bot Alice", "Bot Bob", "Bot Charlie"]
        for (let i = 0; i < 3; i++) {
          const turnOrder = session.players.length + i
          const iconType = CAR_STYLES[turnOrder % CAR_STYLES.length]
          const offsetLat = (session.startLat || 0) + 0.00014 * turnOrder
          const offsetLng = (session.startLng || 0) - 0.00025 * turnOrder
          await ctx.db.gamePlayer.create({
            data: {
              name: botNames[i],
              iconType,
              positionLat: offsetLat,
              positionLng: offsetLng,
              turnOrder,
              sessionId: session.id,
            },
          })
        }
      }

      const bounds = areaSizeBounds(session.startLat!, session.startLng!, session.areaSize as AreaSize)
      const allCandidates = await fetchPoiCandidates(bounds.south, bounds.west, bounds.north, bounds.east)

      const startLat = session.startLat!
      const startLng = session.startLng!
      const filteredCandidates = allCandidates.filter(
        (poi) => haversineKm(poi.lat, poi.lng, startLat, startLng) >= 10
      )

      const deckState = {
        edgeDeck: shuffleDeck(EDGE_DECK.map((c) => c.id)),
        motorwayDeck: shuffleDeck(MOTORWAY_DECK.map((c) => c.id)),
        chanceDeck: shuffleDeck(CHANCE_DECK.map((c) => c.id)),
        edgeDrawIndex: 0,
        motorwayDrawIndex: 0,
        chanceDrawIndex: 0,
      }

      await ctx.db.gameSession.update({
        where: { id: input.sessionId },
        data: {
          phase: "picking",
          selectedPois: JSON.parse(JSON.stringify([])),
          poiCandidates: JSON.parse(JSON.stringify(filteredCandidates)),
          deckState: JSON.parse(JSON.stringify(deckState)),
          obstructions: JSON.parse(JSON.stringify([])),
        },
      })

      return { success: true }
    }),

  pickPoi: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
      osmId: z.number(),
      category: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      if (session.phase !== "picking") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Game is not in picking phase." })
      }

      if (session.creatorPlayerId !== input.playerId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the game creator can pick POIs." })
      }

      const candidates = (session.poiCandidates as Array<{ category: string; osmId: number; name: string | null; lat: number; lng: number }>) ?? []
      const candidate = candidates.find(c => c.osmId === input.osmId && c.category === input.category)
      if (!candidate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "POI not found in candidates." })
      }

      const selectedPois = (session.selectedPois as Array<{ category: string; osmId: number; name: string | null; lat: number; lng: number }>) ?? []
      const alreadyPicked = selectedPois.some(p => p.category === input.category)
      if (alreadyPicked) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Category already picked." })
      }

      const updatedPois = [...selectedPois, candidate]
      const allPicked = POI_CATEGORIES.every(cat => updatedPois.some(p => p.category === cat))

      await ctx.db.gameSession.update({
        where: { id: input.sessionId },
        data: {
          selectedPois: JSON.parse(JSON.stringify(updatedPois)),
          ...(allPicked ? { phase: "playing", poiCandidates: Prisma.DbNull } : {}),
        },
      })

      return { success: true, allPicked }
    }),

  state: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: {
          players: {
            orderBy: { turnOrder: "asc" },
          },
        },
      })

      if (!session) {
        return null
      }

      return {
        id: session.id,
        code: session.code,
        currentTurn: session.currentTurn,
        dice1: session.dice1,
        dice2: session.dice2,
        startLat: session.startLat,
        startLng: session.startLng,
        areaSize: ((session as Record<string, unknown>).areaSize as AreaSize) ?? DEFAULT_AREA_SIZE,
        phase: session.phase,
        creatorPlayerId: session.creatorPlayerId,
        selectedPois: session.selectedPois as Array<{ category: string; osmId: number; name: string | null; lat: number; lng: number }> | null,
        poiCandidates: session.poiCandidates as Array<{ category: string; osmId: number; name: string | null; lat: number; lng: number }> | null,
        deckState: session.deckState as { edgeDeck: string[]; motorwayDeck: string[]; chanceDeck: string[]; edgeDrawIndex: number; motorwayDrawIndex: number; chanceDrawIndex: number } | null,
        obstructions: (session.obstructions as unknown as ObstructionToken[]) ?? [],
        players: session.players.map(p => ({
          id: p.id,
          name: p.name,
          iconType: p.iconType,
          position: [p.positionLat, p.positionLng] as [number, number],
          turnOrder: p.turnOrder,
          visitedPois: (p.visitedPois as string[]) ?? [],
          hasReturnedToStart: p.hasReturnedToStart,
          missedTurns: p.missedTurns,
        })),
        updatedAt: session.updatedAt,
      }
    }),

  rollDice: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
      dice1: z.number().min(1).max(6),
      dice2: z.number().min(1).max(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: { players: { orderBy: { turnOrder: "asc" } } },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      if (session.phase !== "playing") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Game is not in progress." })
      }

      const currentPlayer = session.players[session.currentTurn]
      const isBot = currentPlayer?.name.startsWith("Bot ")
      if (!isBot && currentPlayer?.id !== input.playerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "It's not your turn!" })
      }

      await ctx.db.gameSession.update({
        where: { id: input.sessionId },
        data: {
          dice1: input.dice1,
          dice2: input.dice2,
        },
      })

      return { success: true, total: input.dice1 + input.dice2 }
    }),

  endTurn: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
      newLat: z.number().optional(),
      newLng: z.number().optional(),
      visitedPoiIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: { players: { orderBy: { turnOrder: "asc" } } },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      if (session.phase !== "playing") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Game is not in progress." })
      }

      const currentPlayer = session.players[session.currentTurn]
      const isBotTurn = currentPlayer?.name.startsWith("Bot ")
      if (!isBotTurn && currentPlayer?.id !== input.playerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "It's not your turn!" })
      }

      const turnPlayerId = isBotTurn ? currentPlayer!.id : input.playerId

      if (input.newLat != null && input.newLng != null) {
        if (session.startLat != null && session.startLng != null) {
          const bounds = areaSizeBounds(session.startLat, session.startLng, (session as Record<string, unknown>).areaSize as AreaSize ?? DEFAULT_AREA_SIZE);
          if (!isWithinBounds(input.newLat, input.newLng, bounds)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Move is outside the game boundary." })
          }
        }

        await ctx.db.gamePlayer.update({
          where: { id: turnPlayerId },
          data: {
            positionLat: input.newLat,
            positionLng: input.newLng,
          },
        })
      }

      let updatedVisitedPois = (currentPlayer.visitedPois as string[]) ?? []
      if (input.visitedPoiIds && input.visitedPoiIds.length > 0) {
        const deduped = new Set([...updatedVisitedPois, ...input.visitedPoiIds])
        updatedVisitedPois = [...deduped]
        await ctx.db.gamePlayer.update({
          where: { id: turnPlayerId },
          data: { visitedPois: updatedVisitedPois },
        })
      }

      const selectedPois = (session.selectedPois as Array<{ category: string; osmId: number }>) ?? []
      const allVisited = selectedPois.length > 0 && selectedPois.every(
        poi => updatedVisitedPois.includes(`${poi.category}:${poi.osmId}`)
      )

      let winner: string | null = null
      if (allVisited && session.startLat != null && session.startLng != null) {
        const playerLat = input.newLat ?? currentPlayer.positionLat
        const playerLng = input.newLng ?? currentPlayer.positionLng
        const distKm = haversineKm(playerLat, playerLng, session.startLat, session.startLng)
        if (distKm < 1.5) {
          await ctx.db.gamePlayer.update({
            where: { id: turnPlayerId },
            data: { hasReturnedToStart: true },
          })
          await ctx.db.gameSession.update({
            where: { id: input.sessionId },
            data: { phase: "ended" },
          })
          winner = currentPlayer.name
        }
      }

      if (!winner) {
        const nextTurn = (session.currentTurn + 1) % session.players.length
        await ctx.db.gameSession.update({
          where: { id: input.sessionId },
          data: {
            currentTurn: nextTurn,
            dice1: null,
            dice2: null,
          },
        })
      }

      return { success: true, winner }
    }),

  drawCard: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
      poiCategory: z.string(),
      gridKey: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const cards = await ctx.db.card.findMany({
        where: { type: input.poiCategory },
      })

      if (cards.length === 0) {
        return null
      }

      const card = cards[Math.floor(Math.random() * cards.length)]

      await ctx.db.cardDraw.create({
        data: {
          cardId: card.id,
          playerId: input.playerId,
          sessionId: input.sessionId,
          gridKey: input.gridKey,
        },
      })

      return { title: card.title, body: card.body, type: card.type }
    }),

  drawDeckCard: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
      deckType: z.enum(["edge", "motorway", "chance"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      const deckState = session.deckState as {
        edgeDeck: string[]
        motorwayDeck: string[]
        chanceDeck: string[]
        edgeDrawIndex: number
        motorwayDrawIndex: number
        chanceDrawIndex: number
      } | null

      if (!deckState) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Deck state not initialised." })
      }

      let deck: string[]
      let drawIndex: number
      let deckKey: string
      let indexKey: string

      switch (input.deckType) {
        case "edge":
          deck = deckState.edgeDeck
          drawIndex = deckState.edgeDrawIndex
          deckKey = "edgeDeck"
          indexKey = "edgeDrawIndex"
          break
        case "motorway":
          deck = deckState.motorwayDeck
          drawIndex = deckState.motorwayDrawIndex
          deckKey = "motorwayDeck"
          indexKey = "motorwayDrawIndex"
          break
        case "chance":
          deck = deckState.chanceDeck
          drawIndex = deckState.chanceDrawIndex
          deckKey = "chanceDeck"
          indexKey = "chanceDrawIndex"
          break
      }

      let cardId: string
      if (drawIndex >= deck.length) {
        const sourceCards = input.deckType === "edge"
          ? EDGE_DECK
          : input.deckType === "motorway"
            ? MOTORWAY_DECK
            : CHANCE_DECK
        const reshuffled = shuffleDeck(sourceCards.map((c) => c.id))
        cardId = reshuffled[0]
        deckState[deckKey as keyof typeof deckState] = reshuffled as never
        deckState[indexKey as keyof typeof deckState] = 1 as never
      } else {
        cardId = deck[drawIndex]
        deckState[indexKey as keyof typeof deckState] = (drawIndex + 1) as never
      }

      await ctx.db.gameSession.update({
        where: { id: input.sessionId },
        data: { deckState: JSON.parse(JSON.stringify(deckState)) },
      })

      const card = cardById(cardId)
      return card ? { cardId, card } : null
    }),

  placeObstruction: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
      gridKey: z.string(),
      color: z.enum(["blue", "yellow", "green"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      const obstructions = (session.obstructions as unknown as ObstructionToken[]) ?? []

      const playerColorCount = obstructions.filter(
        (o) => o.placedByPlayerId === input.playerId && o.color === input.color
      ).length
      if (playerColorCount >= 3) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum 3 obstructions per color per player." })
      }

      const token: ObstructionToken = {
        gridKey: input.gridKey,
        color: input.color,
        placedByPlayerId: input.playerId,
      }

      await ctx.db.gameSession.update({
        where: { id: input.sessionId },
        data: {
          obstructions: JSON.parse(JSON.stringify([...obstructions, token])),
        },
      })

      return { success: true }
    }),

  removeObstruction: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      gridKey: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      const obstructions = (session.obstructions as unknown as ObstructionToken[]) ?? []
      const filtered = obstructions.filter((o) => o.gridKey !== input.gridKey)

      await ctx.db.gameSession.update({
        where: { id: input.sessionId },
        data: {
          obstructions: JSON.parse(JSON.stringify(filtered)),
        },
      })

      return { success: true }
    }),

  applyChanceEffect: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
      effectType: z.enum(["miss_turn", "return_to_start", "extra_throw"]),
      missedTurns: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: { players: { orderBy: { turnOrder: "asc" } } },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      if (input.effectType === "miss_turn" && input.missedTurns) {
        const currentPlayer = session.players[session.currentTurn]
        if (currentPlayer) {
          await ctx.db.gamePlayer.update({
            where: { id: currentPlayer.id },
            data: { missedTurns: input.missedTurns },
          })
        }
      }

      if (input.effectType === "return_to_start" && session.startLat != null && session.startLng != null) {
        const currentPlayer = session.players[session.currentTurn]
        if (currentPlayer) {
          await ctx.db.gamePlayer.update({
            where: { id: currentPlayer.id },
            data: {
              positionLat: session.startLat,
              positionLng: session.startLng,
            },
          })
        }
      }

      return { success: true }
    }),

  skipMissedTurn: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: { players: { orderBy: { turnOrder: "asc" } } },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      const currentPlayer = session.players[session.currentTurn]
      if (!currentPlayer || currentPlayer.missedTurns <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No missed turns to skip." })
      }

      await ctx.db.gamePlayer.update({
        where: { id: currentPlayer.id },
        data: { missedTurns: currentPlayer.missedTurns - 1 },
      })

      const nextTurn = (session.currentTurn + 1) % session.players.length
      await ctx.db.gameSession.update({
        where: { id: input.sessionId },
        data: {
          currentTurn: nextTurn,
          dice1: null,
          dice2: null,
        },
      })

      return { success: true, skippedPlayer: currentPlayer.name }
    }),

  updatePosition: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
      lat: z.number(),
      lng: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.gamePlayer.update({
        where: { id: input.playerId },
        data: {
          positionLat: input.lat,
          positionLng: input.lng,
        },
      })

      return { success: true }
    }),

  leave: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.gamePlayer.findUnique({
        where: { id: input.playerId },
      })

      if (player) {
        await ctx.db.gamePlayer.delete({
          where: { id: input.playerId },
        })

        const remainingPlayers = await ctx.db.gamePlayer.count({
          where: { sessionId: input.sessionId },
        })

        if (remainingPlayers === 0) {
          await ctx.db.gameSession.delete({
            where: { id: input.sessionId },
          }).catch(() => {})
        }
      }

      return { success: true }
    }),
})

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
