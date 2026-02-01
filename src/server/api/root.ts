import { createTRPCRouter } from "./trpc"
import { locationsRouter } from "./routers/locations"
import { directionsRouter } from "./routers/directions"
import { tokenRouter } from "./routers/token"
import { gameRouter } from "./routers/game"

export const appRouter = createTRPCRouter({
  locations: locationsRouter,
  directions: directionsRouter,
  token: tokenRouter,
  game: gameRouter,
})

export type AppRouter = typeof appRouter;
