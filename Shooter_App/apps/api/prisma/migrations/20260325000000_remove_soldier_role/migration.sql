-- Migration: Remove SOLDIER from Role enum
-- PostgreSQL does not support DROP VALUE on enums directly.
-- We reassign any SOLDIER users to SHOOTER, then recreate the enum.

-- Step 1: Reassign any existing SOLDIER users (safety net)
UPDATE "User" SET role = 'SHOOTER' WHERE role = 'SOLDIER';

-- Step 2: Recreate the enum without SOLDIER
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('SHOOTER', 'COACH');

-- Step 3: Migrate the column to the new enum
ALTER TABLE "User" ALTER COLUMN role TYPE "Role" USING role::text::"Role";

-- Step 4: Drop the old enum
DROP TYPE "Role_old";
