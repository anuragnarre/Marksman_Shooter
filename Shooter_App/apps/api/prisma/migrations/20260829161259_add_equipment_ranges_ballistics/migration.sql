-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "caliber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "roundCount" INTEGER NOT NULL DEFAULT 0,
    "regPressure" TEXT,
    "lastCleaned" TIMESTAMP(3),
    "nextService" INTEGER,
    "barrelLifePct" INTEGER DEFAULT 100,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RangeLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "maxDistance" INTEGER,
    "altitude" INTEGER,
    "gpsCoordinates" TEXT,
    "typicalWindDir" TEXT,
    "maxCaliber" TEXT,
    "environmentalLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RangeLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BallisticProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "muzzleVelocityFps" INTEGER NOT NULL,
    "pelletWeightGrains" DOUBLE PRECISION NOT NULL,
    "ballisticCoef" DOUBLE PRECISION NOT NULL,
    "sightHeightInches" DOUBLE PRECISION NOT NULL,
    "zeroRangeYards" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BallisticProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Equipment_userId_idx" ON "Equipment"("userId");

-- CreateIndex
CREATE INDEX "RangeLocation_userId_idx" ON "RangeLocation"("userId");

-- CreateIndex
CREATE INDEX "BallisticProfile_userId_idx" ON "BallisticProfile"("userId");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RangeLocation" ADD CONSTRAINT "RangeLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallisticProfile" ADD CONSTRAINT "BallisticProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
