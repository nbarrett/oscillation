import { createTRPCRouter, publicProcedure } from "../trpc"

export const healthRouter = createTRPCRouter({
  check: publicProcedure.query(async ({ ctx }) => {
    const dbCheck = await ctx.db.$queryRaw`SELECT 1 as ok`

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: Array.isArray(dbCheck) && dbCheck.length > 0 ? "connected" : "error",
    }
  }),
})
