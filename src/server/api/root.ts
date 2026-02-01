import { createTRPCRouter } from "./trpc"
import { locationsRouter } from "./routers/locations"
import { directionsRouter } from "./routers/directions"
import { tokenRouter } from "./routers/token"
import { gameRouter } from "./routers/game"
import { healthRouter } from "./routers/health"

export const appRouter = createTRPCRouter({
  locations: locationsRouter,
  directions: directionsRouter,
  token: tokenRouter,
  game: gameRouter,
  health: healthRouter,
})

export type AppRouter = typeof appRouter;
