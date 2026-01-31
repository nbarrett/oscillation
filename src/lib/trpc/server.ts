import 'server-only';

import { createTRPCContext } from '@/server/api/trpc';
import { appRouter } from '@/server/api/root';

export const serverClient = appRouter.createCaller(await createTRPCContext());
