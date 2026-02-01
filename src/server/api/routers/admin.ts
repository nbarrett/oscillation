import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"

// TODO: Add proper admin authentication
// For now, this is a placeholder - should check for admin role

export const adminRouter = createTRPCRouter({
  // Get all game sessions with player counts
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
      currentTurn: session.currentTurn,
      playerCount: session._count.players,
      players: session.players,
      createdAt: session.createdAt,
    }))
  }),

  // Get all registered users
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
      gamesPlayed: user._count.players,
      createdAt: user.createdAt,
    }))
  }),

  // Delete a game session
  deleteSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.gameSession.delete({
        where: { id: input.sessionId },
      })
      return { success: true }
    }),

  // Delete old sessions
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

  // Delete a user (and their game associations)
  deleteUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.delete({
        where: { id: input.userId },
      })
      return { success: true }
    }),

  // Placeholder for future admin settings
  getSettings: publicProcedure.query(async () => {
    // TODO: Implement admin settings storage
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
      // TODO: Persist settings to database
      console.log("Admin settings update (not persisted):", input)
      return { success: true, settings: input }
    }),
})
