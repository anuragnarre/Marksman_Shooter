-- AlterTable: add googleId column to User (nullable, unique)
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_googleId_key" UNIQUE ("googleId");
