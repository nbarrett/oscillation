-- Add map state columns to game_sessions (idempotent)
ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "mapZoom" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "mapCentreLat" DOUBLE PRECISION;
ALTER TABLE "game_sessions" ADD COLUMN IF NOT EXISTS "mapCentreLng" DOUBLE PRECISION;
