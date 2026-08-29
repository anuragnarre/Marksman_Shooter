-- CreateEnum
CREATE TYPE "CompetitionEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMING_SOON');

-- CreateTable
CREATE TABLE "CompetitionEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "registrationFee" DOUBLE PRECISION,
    "rules" TEXT,
    "guidelines" TEXT,
    "images" TEXT[],
    "videos" TEXT[],
    "status" "CompetitionEventStatus" NOT NULL DEFAULT 'DRAFT',
    "maxParticipants" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionEventCategory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fee" DOUBLE PRECISION,
    "maxParticipants" INTEGER,

    CONSTRAINT "CompetitionEventCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionEventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'COMING_SOON',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionEventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetitionEvent_status_idx" ON "CompetitionEvent"("status");

-- CreateIndex
CREATE INDEX "CompetitionEvent_date_idx" ON "CompetitionEvent"("date");

-- CreateIndex
CREATE INDEX "CompetitionEventRegistration_eventId_idx" ON "CompetitionEventRegistration"("eventId");

-- CreateIndex
CREATE INDEX "CompetitionEventRegistration_userId_idx" ON "CompetitionEventRegistration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionEventRegistration_eventId_userId_key" ON "CompetitionEventRegistration"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "CompetitionEvent" ADD CONSTRAINT "CompetitionEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEventCategory" ADD CONSTRAINT "CompetitionEventCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CompetitionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEventRegistration" ADD CONSTRAINT "CompetitionEventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CompetitionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEventRegistration" ADD CONSTRAINT "CompetitionEventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEventRegistration" ADD CONSTRAINT "CompetitionEventRegistration_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CompetitionEventCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
