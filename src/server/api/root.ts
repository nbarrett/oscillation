import { createTRPCRouter } from './trpc';
import { locationsRouter } from './routers/locations';
import { directionsRouter } from './routers/directions';
import { tokenRouter } from './routers/token';

export const appRouter = createTRPCRouter({
  locations: locationsRouter,
  directions: directionsRouter,
  token: tokenRouter,
});

export type AppRouter = typeof appRouter;
