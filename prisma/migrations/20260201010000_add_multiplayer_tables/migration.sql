-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "game_sessions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "currentTurn" INTEGER NOT NULL DEFAULT 0,
    "dice1" INTEGER,
    "dice2" INTEGER,
    "startLat" DOUBLE PRECISION,
    "startLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "game_players" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconType" TEXT NOT NULL,
    "positionLat" DOUBLE PRECISION NOT NULL,
    "positionLng" DOUBLE PRECISION NOT NULL,
    "turnOrder" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "game_sessions_code_key" ON "game_sessions"("code");

-- AddForeignKey (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'game_players_sessionId_fkey'
    ) THEN
        ALTER TABLE "game_players" ADD CONSTRAINT "game_players_sessionId_fkey"
        FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
