-- AlterTable: allow passwordHash to be NULL (required for Google-only accounts)
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
