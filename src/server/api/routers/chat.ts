import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

export const chatRouter = createTRPCRouter({
  send: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
      text: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const player = await ctx.db.gamePlayer.findFirst({
        where: { id: input.playerId, sessionId: input.sessionId },
      })

      if (!player) {
        return { success: false }
      }

      await ctx.db.chatMessage.create({
        data: {
          text: input.text.trim(),
          playerId: input.playerId,
          sessionId: input.sessionId,
        },
      })

      return { success: true }
    }),

  messages: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      afterId: z.string().nullable().optional(),
    }))
    .query(async ({ ctx, input }) => {
      let cursor: Date | null = null
      if (input.afterId) {
        const cursorMsg = await ctx.db.chatMessage.findUnique({
          where: { id: input.afterId },
          select: { sentAt: true },
        })
        cursor = cursorMsg?.sentAt ?? null
      }

      const messages = await ctx.db.chatMessage.findMany({
        where: {
          sessionId: input.sessionId,
          ...(cursor ? { sentAt: { gt: cursor } } : {}),
        },
        include: {
          player: {
            select: { name: true, iconType: true },
          },
        },
        orderBy: { sentAt: "asc" },
        take: cursor ? 100 : 50,
      })

      return messages.map((m) => ({
        id: m.id,
        text: m.text,
        playerName: m.player.name,
        playerIconType: m.player.iconType,
        sentAt: m.sentAt.toISOString(),
      }))
    }),
})
