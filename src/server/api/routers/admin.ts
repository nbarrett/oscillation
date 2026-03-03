import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"

export const adminRouter = createTRPCRouter({
  getAllSessions: publicProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db.gameSession.findMany({
      include: {
        _count: {
          select: { players: true },
        },
        players: {
          select: {
            id: true,
            name: true,
            joinedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return sessions.map((session) => ({
      id: session.id,
      code: session.code,
      phase: session.phase,
      currentTurn: session.currentTurn,
      playerCount: session._count.players,
      players: session.players,
      creatorPlayerId: session.creatorPlayerId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }))
  }),

  getAllUsers: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      include: {
        _count: {
          select: { players: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return users.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      isAdmin: user.isAdmin,
      gamesPlayed: user._count.players,
      createdAt: user.createdAt,
    }))
  }),

  deleteSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.gameSession.delete({
        where: { id: input.sessionId },
      })
      return { success: true }
    }),

  clearOldSessions: publicProcedure
    .input(
      z.object({
        olderThanDays: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {}

      if (input.olderThanDays) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - input.olderThanDays)
        where.createdAt = { lt: cutoffDate }
      }

      const result = await ctx.db.gameSession.deleteMany({ where })
      return { deletedCount: result.count }
    }),

  clearStaleLobbyGames: publicProcedure.mutation(async ({ ctx }) => {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const result = await ctx.db.gameSession.deleteMany({
      where: {
        phase: "lobby",
        updatedAt: { lt: oneHourAgo },
      },
    })
    return { deletedCount: result.count }
  }),

  deleteUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.delete({
        where: { id: input.userId },
      })
      return { success: true }
    }),

  toggleAdmin: publicProcedure
    .input(z.object({ userId: z.string(), isAdmin: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: input.userId },
        data: { isAdmin: input.isAdmin },
      })
      return { success: true }
    }),

  getSettings: publicProcedure.query(async () => {
    return {
      maxPlayersPerGame: 8,
      sessionTimeoutMinutes: 60,
      allowGuestPlayers: true,
    }
  }),

  updateSettings: publicProcedure
    .input(
      z.object({
        maxPlayersPerGame: z.number().min(2).max(20).optional(),
        sessionTimeoutMinutes: z.number().min(5).max(1440).optional(),
        allowGuestPlayers: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      void input
      return { success: true, settings: input }
    }),
})
