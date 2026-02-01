import { z } from "zod"
import bcrypt from "bcryptjs"
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc"
import { TRPCError } from "@trpc/server"

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        nickname: z
          .string()
          .min(2, "Nickname must be at least 2 characters")
          .max(20, "Nickname must be at most 20 characters")
          .regex(/^[a-zA-Z0-9_]+$/, "Nickname can only contain letters, numbers, and underscores"),
        pin: z
          .string()
          .length(4, "PIN must be exactly 4 digits")
          .regex(/^\d{4}$/, "PIN must be 4 digits"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { nickname: input.nickname },
      })

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This nickname is already taken",
        })
      }

      const pinHash = await bcrypt.hash(input.pin, 10)

      const user = await ctx.db.user.create({
        data: {
          nickname: input.nickname,
          pinHash,
        },
      })

      return {
        id: user.id,
        nickname: user.nickname,
      }
    }),

  checkNickname: publicProcedure
    .input(z.object({ nickname: z.string() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { nickname: input.nickname },
      })
      return { available: !existing }
    }),
})
