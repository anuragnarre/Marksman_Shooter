-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ScheduleRequest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "shooterId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "suggestedStart" TIMESTAMP(3),
    "suggestedEnd" TIMESTAMP(3),
    "suggestedTitle" TEXT,
    "notes" TEXT,
    "coachNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleRequest_eventId_idx" ON "ScheduleRequest"("eventId");

-- CreateIndex
CREATE INDEX "ScheduleRequest_shooterId_idx" ON "ScheduleRequest"("shooterId");

-- CreateIndex
CREATE INDEX "ScheduleRequest_coachId_idx" ON "ScheduleRequest"("coachId");

-- CreateIndex
CREATE INDEX "ScheduleRequest_status_idx" ON "ScheduleRequest"("status");

-- AddForeignKey
ALTER TABLE "ScheduleRequest" ADD CONSTRAINT "ScheduleRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TrainingEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRequest" ADD CONSTRAINT "ScheduleRequest_shooterId_fkey" FOREIGN KEY ("shooterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRequest" ADD CONSTRAINT "ScheduleRequest_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
