-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'RANGE_OPERATOR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isGuest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "managedByRangeId" TEXT;

-- CreateTable
CREATE TABLE "ShootingRange" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShootingRange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RangeLane" (
    "id" TEXT NOT NULL,
    "rangeId" TEXT NOT NULL,
    "laneNumber" INTEGER NOT NULL,
    "name" TEXT,
    "deviceId" TEXT,
    "activeSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RangeLane_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaneBooking" (
    "id" TEXT NOT NULL,
    "rangeId" TEXT NOT NULL,
    "laneId" TEXT,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaneBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShootingRange_code_key" ON "ShootingRange"("code");

-- CreateIndex
CREATE INDEX "ShootingRange_ownerId_idx" ON "ShootingRange"("ownerId");

-- CreateIndex
CREATE INDEX "ShootingRange_code_idx" ON "ShootingRange"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RangeLane_deviceId_key" ON "RangeLane"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "RangeLane_activeSessionId_key" ON "RangeLane"("activeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RangeLane_rangeId_laneNumber_key" ON "RangeLane"("rangeId", "laneNumber");

-- CreateIndex
CREATE INDEX "LaneBooking_rangeId_startTime_idx" ON "LaneBooking"("rangeId", "startTime");

-- CreateIndex
CREATE INDEX "LaneBooking_userId_idx" ON "LaneBooking"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managedByRangeId_fkey" FOREIGN KEY ("managedByRangeId") REFERENCES "ShootingRange"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShootingRange" ADD CONSTRAINT "ShootingRange_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RangeLane" ADD CONSTRAINT "RangeLane_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "ShootingRange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RangeLane" ADD CONSTRAINT "RangeLane_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "DeviceRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RangeLane" ADD CONSTRAINT "RangeLane_activeSessionId_fkey" FOREIGN KEY ("activeSessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaneBooking" ADD CONSTRAINT "LaneBooking_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "ShootingRange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaneBooking" ADD CONSTRAINT "LaneBooking_laneId_fkey" FOREIGN KEY ("laneId") REFERENCES "RangeLane"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaneBooking" ADD CONSTRAINT "LaneBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
