-- CreateTable
CREATE TABLE "game_sessions" (
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

-- CreateTable
CREATE TABLE "game_players" (
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

-- CreateIndex
CREATE UNIQUE INDEX "game_sessions_code_key" ON "game_sessions"("code");

-- AddForeignKey
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
