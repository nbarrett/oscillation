import { createTRPCRouter } from "./trpc"
import { locationsRouter } from "./routers/locations"
import { directionsRouter } from "./routers/directions"
import { tokenRouter } from "./routers/token"
import { gameRouter } from "./routers/game"
import { healthRouter } from "./routers/health"
import { authRouter } from "./routers/auth"
import { adminRouter } from "./routers/admin"
import { pubsRouter } from "./routers/pubs"

export const appRouter = createTRPCRouter({
  locations: locationsRouter,
  directions: directionsRouter,
  token: tokenRouter,
  game: gameRouter,
  health: healthRouter,
  auth: authRouter,
  admin: adminRouter,
  pubs: pubsRouter,
})

export type AppRouter = typeof appRouter;
