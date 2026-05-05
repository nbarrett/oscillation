import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { db } from '@/server/db';
import { log } from '@/lib/utils';

export const createTRPCContext = async () => {
  return {
    db,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

const TRANSIENT_DB_ERROR_PATTERN = /can.?t reach database server|connection refused|connection reset|connection terminated|server has closed the connection|timed out fetching a new connection|too many connections/i;

function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; name?: string; message?: string; cause?: unknown };
  if (e.name === "PrismaClientInitializationError") return true;
  if (typeof e.code === "string" && e.code.startsWith("P10")) return true;
  if (typeof e.message === "string" && TRANSIENT_DB_ERROR_PATTERN.test(e.message)) return true;
  if (e.cause) return isTransientDbError(e.cause);
  return false;
}

const DB_RETRY_DELAY_MS = 500;
const DB_RETRY_MAX_ATTEMPTS = 2;

const dbRetryMiddleware = t.middleware(async ({ next, path }) => {
  for (let attempt = 1; attempt <= DB_RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      const result = await next();
      if (result.ok) return result;
      if (attempt === DB_RETRY_MAX_ATTEMPTS) return result;
      if (!isTransientDbError(result.error) && !isTransientDbError(result.error.cause)) return result;
      log.warn(`trpc[${path}]: transient DB error on attempt ${attempt}, retrying in ${DB_RETRY_DELAY_MS}ms — ${result.error.message}`);
      await new Promise((r) => setTimeout(r, DB_RETRY_DELAY_MS));
    } catch (err) {
      if (attempt === DB_RETRY_MAX_ATTEMPTS || !isTransientDbError(err)) throw err;
      log.warn(`trpc[${path}]: transient DB error on attempt ${attempt}, retrying in ${DB_RETRY_DELAY_MS}ms — ${err instanceof Error ? err.message : String(err)}`);
      await new Promise((r) => setTimeout(r, DB_RETRY_DELAY_MS));
    }
  }
  throw new Error(`dbRetryMiddleware: exhausted retries on ${path}`);
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(dbRetryMiddleware);
