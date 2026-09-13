-- CreateTable
CREATE TABLE "ShooterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shooterCode" TEXT NOT NULL,
    "primaryWeapon" TEXT,
    "managedByCoachId" TEXT,
    "isManaged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShooterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShooterProfile_userId_key" ON "ShooterProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ShooterProfile_shooterCode_key" ON "ShooterProfile"("shooterCode");

-- CreateIndex
CREATE INDEX "ShooterProfile_managedByCoachId_idx" ON "ShooterProfile"("managedByCoachId");

-- AddForeignKey
ALTER TABLE "ShooterProfile" ADD CONSTRAINT "ShooterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShooterProfile" ADD CONSTRAINT "ShooterProfile_managedByCoachId_fkey" FOREIGN KEY ("managedByCoachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
