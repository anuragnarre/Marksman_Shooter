-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SOLDIER';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN "trainingMode" TEXT;
