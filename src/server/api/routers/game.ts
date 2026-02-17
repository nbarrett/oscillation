import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, publicProcedure } from "../trpc"
import { CAR_STYLES } from "@/stores/car-store"
import { AREA_SIZES, DEFAULT_AREA_SIZE, areaSizeBounds, isWithinBounds, type AreaSize } from "@/lib/area-size"
import { validatePoiCoverage } from "@/server/overpass"
import { POI_CATEGORY_LABELS, POI_CATEGORIES } from "@/lib/poi-categories"

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const selectedPoiSchema = z.object({
  category: z.string(),
  osmId: z.number(),
  name: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
})

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

  create: publicProcedure
    .input(z.object({
      playerName: z.string().min(1),
      startLat: z.number(),
      startLng: z.number(),
      iconType: z.string().optional(),
      areaSize: z.enum(AREA_SIZES as [string, ...string[]]).default(DEFAULT_AREA_SIZE),
    }))
    .mutation(async ({ ctx, input }) => {
      const bounds = areaSizeBounds(input.startLat, input.startLng, input.areaSize as AreaSize)
      const validation = await validatePoiCoverage(bounds.south, bounds.west, bounds.north, bounds.east)
      if (!validation.valid) {
        const missingNames = validation.missing.map((cat) => POI_CATEGORY_LABELS[cat]).join(", ")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Area is missing required POI types: ${missingNames}. Choose a different location or larger area.`,
        })
      }

      let code = generateSessionCode()
      let attempts = 0
      while (attempts < 10) {
        const existing = await ctx.db.gameSession.findUnique({ where: { code } })
        if (!existing) break
        code = generateSessionCode()
        attempts++
      }

      const session = await ctx.db.gameSession.create({
        data: {
          code,
          startLat: input.startLat,
          startLng: input.startLng,
          areaSize: input.areaSize,
          players: {
            create: {
              name: input.playerName,
              iconType: input.iconType ?? CAR_STYLES[0],
              positionLat: input.startLat,
              positionLng: input.startLng,
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
      poiCandidates: z.array(selectedPoiSchema),
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

      const selectedPois: z.infer<typeof selectedPoiSchema>[] = []
      for (const category of POI_CATEGORIES) {
        const candidates = input.poiCandidates.filter(p => p.category === category)
        if (candidates.length > 0) {
          const picked = candidates[Math.floor(Math.random() * candidates.length)]
          selectedPois.push(picked)
        }
      }

      await ctx.db.gameSession.update({
        where: { id: input.sessionId },
        data: {
          phase: "playing",
          selectedPois: JSON.parse(JSON.stringify(selectedPois)),
        },
      })

      return { success: true, selectedPois }
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
        areaSize: session.areaSize as AreaSize,
        phase: session.phase,
        creatorPlayerId: session.creatorPlayerId,
        selectedPois: session.selectedPois as Array<{ category: string; osmId: number; name: string | null; lat: number; lng: number }> | null,
        players: session.players.map(p => ({
          id: p.id,
          name: p.name,
          iconType: p.iconType,
          position: [p.positionLat, p.positionLng] as [number, number],
          turnOrder: p.turnOrder,
          visitedPois: (p.visitedPois as string[]) ?? [],
          hasReturnedToStart: p.hasReturnedToStart,
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
      if (currentPlayer?.id !== input.playerId) {
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
      if (currentPlayer?.id !== input.playerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "It's not your turn!" })
      }

      if (input.newLat != null && input.newLng != null) {
        if (session.startLat != null && session.startLng != null) {
          const bounds = areaSizeBounds(session.startLat, session.startLng, session.areaSize as AreaSize);
          if (!isWithinBounds(input.newLat, input.newLng, bounds)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Move is outside the game boundary." })
          }
        }

        await ctx.db.gamePlayer.update({
          where: { id: input.playerId },
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
          where: { id: input.playerId },
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
            where: { id: input.playerId },
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
