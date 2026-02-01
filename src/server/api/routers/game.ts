import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

function generateSessionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const iconTypes = ["white", "blue", "red", "green"] as const

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
        playerCount: session.players.length,
        playerNames: session.players.map(p => p.name),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }))
    }),

  create: publicProcedure
    .input(z.object({
      playerName: z.string().min(1),
      startLat: z.number(),
      startLng: z.number(),
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

      const session = await ctx.db.gameSession.create({
        data: {
          code,
          startLat: input.startLat,
          startLng: input.startLng,
          players: {
            create: {
              name: input.playerName,
              iconType: iconTypes[0],
              positionLat: input.startLat,
              positionLng: input.startLng,
              turnOrder: 0,
            },
          },
        },
        include: { players: true },
      })

      return {
        sessionId: session.id,
        code: session.code,
        playerId: session.players[0].id,
      }
    }),

  join: publicProcedure
    .input(z.object({
      code: z.string().length(6),
      playerName: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { code: input.code.toUpperCase() },
        include: { players: true },
      })

      if (!session) {
        throw new Error("Game not found. Check the code and try again.")
      }

      if (session.players.length >= 4) {
        throw new Error("Game is full (maximum 4 players).")
      }

      const existingName = session.players.find(
        p => p.name.toLowerCase() === input.playerName.toLowerCase()
      )
      if (existingName) {
        throw new Error("Someone with that name is already in the game.")
      }

      const turnOrder = session.players.length
      const iconType = iconTypes[turnOrder] || "white"

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
        players: session.players.map(p => ({
          id: p.id,
          name: p.name,
          iconType: p.iconType as "white" | "blue" | "red",
          position: [p.positionLat, p.positionLng] as [number, number],
          turnOrder: p.turnOrder,
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
        throw new Error("Game not found.")
      }

      const currentPlayer = session.players[session.currentTurn]
      if (currentPlayer?.id !== input.playerId) {
        throw new Error("It's not your turn!")
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
    }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: { players: { orderBy: { turnOrder: "asc" } } },
      })

      if (!session) {
        throw new Error("Game not found.")
      }

      const currentPlayer = session.players[session.currentTurn]
      if (currentPlayer?.id !== input.playerId) {
        throw new Error("It's not your turn!")
      }

      const nextTurn = (session.currentTurn + 1) % session.players.length

      await ctx.db.gameSession.update({
        where: { id: input.sessionId },
        data: {
          currentTurn: nextTurn,
          dice1: null,
          dice2: null,
        },
      })

      return { success: true, nextTurn }
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
      await ctx.db.gamePlayer.delete({
        where: { id: input.playerId },
      })

      const remainingPlayers = await ctx.db.gamePlayer.count({
        where: { sessionId: input.sessionId },
      })

      if (remainingPlayers === 0) {
        await ctx.db.gameSession.delete({
          where: { id: input.sessionId },
        })
      }

      return { success: true }
    }),
})
