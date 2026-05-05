-- CreateTable
CREATE TABLE "poi_validation_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poi_validation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "poi_validation_cache_cacheKey_key" ON "poi_validation_cache"("cacheKey");
