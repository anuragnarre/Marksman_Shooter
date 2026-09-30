-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SHOOTER', 'COACH');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'APPROVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shooterId" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "distance" INTEGER NOT NULL,
    "weaponType" TEXT NOT NULL,
    "numberOfShots" INTEGER NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "shotNumber" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachConnection" (
    "id" TEXT NOT NULL,
    "shooterId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "CoachConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachFeedback" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_shooterId_idx" ON "Session"("shooterId");

-- CreateIndex
CREATE INDEX "Shot_sessionId_idx" ON "Shot"("sessionId");

-- CreateIndex
CREATE INDEX "CoachConnection_shooterId_idx" ON "CoachConnection"("shooterId");

-- CreateIndex
CREATE INDEX "CoachConnection_coachId_idx" ON "CoachConnection"("coachId");

-- CreateIndex
CREATE INDEX "CoachFeedback_coachId_idx" ON "CoachFeedback"("coachId");

-- CreateIndex
CREATE INDEX "CoachFeedback_sessionId_idx" ON "CoachFeedback"("sessionId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_shooterId_fkey" FOREIGN KEY ("shooterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachConnection" ADD CONSTRAINT "CoachConnection_shooterId_fkey" FOREIGN KEY ("shooterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachConnection" ADD CONSTRAINT "CoachConnection_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachFeedback" ADD CONSTRAINT "CoachFeedback_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachFeedback" ADD CONSTRAINT "CoachFeedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
