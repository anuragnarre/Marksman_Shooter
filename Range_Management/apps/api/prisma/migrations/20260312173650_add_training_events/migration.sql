-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SESSION', 'TASK', 'PLAN', 'REMINDER', 'COMPETITION');

-- CreateTable
CREATE TABLE "TrainingEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "EventType" NOT NULL DEFAULT 'SESSION',
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "recurringGroupId" TEXT,
    "coachId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAssignee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "shooterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "EventAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingEvent_coachId_idx" ON "TrainingEvent"("coachId");

-- CreateIndex
CREATE INDEX "TrainingEvent_recurringGroupId_idx" ON "TrainingEvent"("recurringGroupId");

-- CreateIndex
CREATE INDEX "EventAssignee_eventId_idx" ON "EventAssignee"("eventId");

-- CreateIndex
CREATE INDEX "EventAssignee_shooterId_idx" ON "EventAssignee"("shooterId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAssignee_eventId_shooterId_key" ON "EventAssignee"("eventId", "shooterId");

-- AddForeignKey
ALTER TABLE "TrainingEvent" ADD CONSTRAINT "TrainingEvent_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssignee" ADD CONSTRAINT "EventAssignee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "TrainingEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssignee" ADD CONSTRAINT "EventAssignee_shooterId_fkey" FOREIGN KEY ("shooterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
