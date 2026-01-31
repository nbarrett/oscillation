-- CreateTable
CREATE TABLE "named_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "named_locations_pkey" PRIMARY KEY ("id")
);
