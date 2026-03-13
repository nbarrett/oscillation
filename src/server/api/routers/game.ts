import { z } from "zod"
import { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, publicProcedure } from "../trpc"
import { CAR_STYLES } from "@/stores/car-store"
import { AREA_SIZES, DEFAULT_AREA_SIZE, areaSizeBounds, isWithinBounds, type AreaSize, type GameBounds } from "@/lib/area-size"
import { snapToGridCenter } from "@/lib/road-data"
import { validatePoiCoverage, fetchPoiCandidates, prewarmPoiCandidates } from "@/server/overpass"
import { POI_CATEGORIES } from "@/lib/poi-categories"
import { EDGE_DECK, MOTORWAY_DECK, CHANCE_DECK, shuffleDeck, cardById, type ObstructionToken } from "@/lib/card-decks"
import { log } from "@/lib/utils"

const CATEGORY_TO_COLOUR: Record<string, string> = {
  pub: "blue",
  spire: "black",
  tower: "pink",
  phone: "yellow",
  school: "green",
}

interface ActivityEntry {
  type: "token_collected" | "player_joined"
  playerName: string
  tokenColour: string | null
  poiName: string | null
  poiCategory: string | null
  timestamp: string
  message: string
}

function capitalizeName(name: string): string {
  return name.trim().replace(/\b\w/g, (c) => c.toUpperCase())
}

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
        takenCars: session.players.map(p => p.iconType),
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
      const result = await validatePoiCoverage(bounds.south, bounds.west, bounds.north, bounds.east)
      if (result.valid) {
        prewarmPoiCandidates(bounds.south, bounds.west, bounds.north, bounds.east)
      }
      return result
    }),

  validLocationIds: publicProcedure
    .input(z.object({
      areaSize: z.enum(AREA_SIZES as [string, ...string[]]).default(DEFAULT_AREA_SIZE),
    }))
    .query(async ({ ctx }) => {
      const locations = await ctx.db.namedLocation.findMany()
      return locations.map((loc) => loc.id)
    }),

  create: publicProcedure
    .input(z.object({
      playerName: z.string().min(1),
      startLat: z.number(),
      startLng: z.number(),
      iconType: z.string().optional(),
      areaSize: z.enum(AREA_SIZES as [string, ...string[]]).default(DEFAULT_AREA_SIZE),
      botCount: z.number().int().min(0).max(4).default(3),
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
          botCount: input.botCount,
          players: {
            create: {
              name: capitalizeName(input.playerName),
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

      if (session.phase === "ended") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game has ended.",
        })
      }

      if (session.players.length >= 8) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Game is full (maximum 8 players).",
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
      const playerName = capitalizeName(input.playerName)

      const isInProgress = session.phase === "playing"
      const posLat = isInProgress ? (session.startLat ?? 0) : ((session.startLat || 0) + 0.00014 * turnOrder)
      const posLng = isInProgress ? (session.startLng ?? 0) : ((session.startLng || 0) - 0.00025 * turnOrder)

      const player = await ctx.db.gamePlayer.create({
        data: {
          name: playerName,
          iconType,
          positionLat: posLat,
          positionLng: posLng,
          turnOrder,
          sessionId: session.id,
        },
      })

      if (isInProgress) {
        const tokenInventory = (session.tokenInventory as Record<string, number>) ?? {}
        const activityLog = (session.activityLog as unknown as ActivityEntry[]) ?? []

        const rebalanced: Record<string, number> = {}
        for (const [poiId, count] of Object.entries(tokenInventory)) {
          rebalanced[poiId] = count > 0 ? count + 1 : 0
        }

        const remainingThisRound = session.players.length - 1 - session.currentTurn
        const turnsUntilFirst = remainingThisRound >= 0 ? remainingThisRound + 1 : 1
        const roundNote = turnsUntilFirst <= 1
          ? "plays at the end of this round"
          : `plays after ${remainingThisRound} more player${remainingThisRound === 1 ? "" : "s"} this round`

        const joinEntry: ActivityEntry = {
          type: "player_joined",
          playerName,
          tokenColour: null,
          poiName: null,
          poiCategory: null,
          timestamp: new Date().toISOString(),
          message: `${playerName} joined the game — ${roundNote}. Token counts updated`,
        }
        const updatedLog = [...activityLog, joinEntry].slice(-50)
        await ctx.db.gameSession.update({
          where: { id: session.id },
          data: {
            tokenInventory: JSON.parse(JSON.stringify(rebalanced)),
            activityLog: JSON.parse(JSON.stringify(updatedLog)),
          },
        })
      }

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

      if (session.botCount > 0) {
        const botNames = ["Bot Alice", "Bot Bob", "Bot Charlie", "Bot Dave"]
        const takenStyles = new Set(session.players.map(p => p.iconType))
        const availableStyles = CAR_STYLES.filter(s => !takenStyles.has(s))
        for (let i = 0; i < session.botCount; i++) {
          const turnOrder = session.players.length + i
          const iconType = availableStyles[i] ?? CAR_STYLES[(turnOrder + 1) % CAR_STYLES.length]
          const offsetLat = (session.startLat || 0) + 0.00014 * turnOrder
          const offsetLng = (session.startLng || 0) - 0.00025 * turnOrder
          await ctx.db.gamePlayer.create({
            data: {
              name: botNames[i]!,
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
      let allCandidates: Awaited<ReturnType<typeof fetchPoiCandidates>>
      try {
        allCandidates = await fetchPoiCandidates(bounds.south, bounds.west, bounds.north, bounds.east)
      } catch (err) {
        log.error("Failed to fetch POI candidates from Overpass API", err)
        throw new TRPCError({
          code: "TIMEOUT",
          message: "Could not fetch points of interest — the map data service is slow or unavailable. Please try again.",
        })
      }

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
        include: { players: { orderBy: { turnOrder: "asc" } } },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      if (session.phase !== "picking") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Game is not in picking phase." })
      }

      const currentPicker = session.players[session.pickingPlayerIndex % session.players.length]
      const isBotPicker = currentPicker?.name.startsWith("Bot ")
      if (!currentPicker || (!isBotPicker && currentPicker.id !== input.playerId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "It's not your turn to pick." })
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
      const nextPickerIndex = (session.pickingPlayerIndex + 1) % session.players.length

      const tokenInventoryInit: Record<string, number> = {}
      if (allPicked) {
        for (const poi of updatedPois) {
          tokenInventoryInit[`${poi.category}:${poi.osmId}`] = session.players.length
        }
      }

      await ctx.db.gameSession.update({
        where: { id: input.sessionId },
        data: {
          selectedPois: JSON.parse(JSON.stringify(updatedPois)),
          pickingPlayerIndex: nextPickerIndex,
          ...(allPicked ? {
            phase: "playing",
            poiCandidates: Prisma.DbNull,
            tokenInventory: JSON.parse(JSON.stringify(tokenInventoryInit)),
          } : {}),
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
        pickingPlayerIndex: session.pickingPlayerIndex,
        obstructions: (session.obstructions as unknown as ObstructionToken[]) ?? [],
        lastMovePath: (session.lastMovePath as string[] | null) ?? null,
        lastMovePlayer: session.lastMovePlayer ?? null,
        tokenInventory: (session.tokenInventory as Record<string, number>) ?? {},
        activityLog: (session.activityLog as unknown as ActivityEntry[]) ?? [],
        players: session.players.map(p => ({
          id: p.id,
          name: p.name,
          iconType: p.iconType,
          position: [p.positionLat, p.positionLng] as [number, number],
          turnOrder: p.turnOrder,
          visitedPois: (p.visitedPois as string[]) ?? [],
          tokens: (p.tokens as Record<string, number>) ?? {},
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
      movePath: z.array(z.string()).optional(),
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
          const bounds = areaSizeBounds(session.startLat, session.startLng, (session as Record<string, unknown>).areaSize as AreaSize ?? DEFAULT_AREA_SIZE)
          const relaxed: GameBounds = {
            south: bounds.south - (bounds.north - bounds.south) * 0.5,
            north: bounds.north + (bounds.north - bounds.south) * 0.5,
            west: bounds.west - (bounds.east - bounds.west) * 0.5,
            east: bounds.east + (bounds.east - bounds.west) * 0.5,
            corners: bounds.corners,
          }
          if (!isWithinBounds(input.newLat, input.newLng, relaxed)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Move is too far from the game area." })
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

      const existingVisited = new Set((currentPlayer.visitedPois as string[]) ?? [])
      let updatedVisitedPois = [...existingVisited]
      const tokenInventory = (session.tokenInventory as Record<string, number>) ?? {}
      const playerTokens = (currentPlayer.tokens as Record<string, number>) ?? {}
      const activityLog = (session.activityLog as unknown as ActivityEntry[]) ?? []
      const newActivityEntries: ActivityEntry[] = []

      if (input.visitedPoiIds && input.visitedPoiIds.length > 0) {
        const deduped = new Set([...existingVisited, ...input.visitedPoiIds])
        updatedVisitedPois = [...deduped]

        const selectedPoisList = (session.selectedPois as Array<{ category: string; osmId: number; name: string | null; lat: number; lng: number }>) ?? []
        const newlyVisited = input.visitedPoiIds.filter(id => !existingVisited.has(id))
        for (const poiId of newlyVisited) {
          const currentCount = tokenInventory[poiId] ?? 0
          if (currentCount > 0) {
            tokenInventory[poiId] = currentCount - 1
            const [category] = poiId.split(":")
            const colour = CATEGORY_TO_COLOUR[category ?? ""] ?? null
            if (colour) {
              playerTokens[colour] = (playerTokens[colour] ?? 0) + 1
            }
            const poi = selectedPoisList.find(p => `${p.category}:${p.osmId}` === poiId)
            newActivityEntries.push({
              type: "token_collected",
              playerName: currentPlayer.name,
              tokenColour: colour,
              poiName: poi?.name ?? null,
              poiCategory: category ?? null,
              timestamp: new Date().toISOString(),
              message: `${currentPlayer.name} collected a ${colour ?? "?"} token from ${poi?.name ?? "a staging post"}`,
            })
          }
        }

        await ctx.db.gamePlayer.update({
          where: { id: turnPlayerId },
          data: {
            visitedPois: updatedVisitedPois,
            tokens: JSON.parse(JSON.stringify(playerTokens)),
          },
        })

        if (newActivityEntries.length > 0 || Object.keys(tokenInventory).length > 0) {
          const updatedLog = [...activityLog, ...newActivityEntries].slice(-50)
          await ctx.db.gameSession.update({
            where: { id: input.sessionId },
            data: {
              tokenInventory: JSON.parse(JSON.stringify(tokenInventory)),
              activityLog: JSON.parse(JSON.stringify(updatedLog)),
            },
          })
        }
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
            lastMovePath: input.movePath ? JSON.parse(JSON.stringify(input.movePath)) : Prisma.DbNull,
            lastMovePlayer: currentPlayer.name,
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

  deckDrawHistory: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        select: { deckState: true },
      })
      if (!session?.deckState) return []
      const state = session.deckState as { drawHistory?: Array<{ cardId: string; playerName: string; drawnAt: string }> }
      return state.drawHistory ?? []
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
        include: { players: { where: { id: input.playerId } } },
      })

      if (!session) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Game not found." })
      }

      const playerName = session.players[0]?.name ?? "Unknown"

      const deckState = session.deckState as {
        edgeDeck: string[]
        motorwayDeck: string[]
        chanceDeck: string[]
        edgeDrawIndex: number
        motorwayDrawIndex: number
        chanceDrawIndex: number
        drawHistory: Array<{ cardId: string; playerName: string; drawnAt: string }>
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

      const drawHistory = deckState.drawHistory ?? []
      drawHistory.push({ cardId, playerName, drawnAt: new Date().toISOString() })
      deckState.drawHistory = drawHistory

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
