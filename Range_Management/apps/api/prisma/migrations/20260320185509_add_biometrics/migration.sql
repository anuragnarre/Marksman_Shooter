-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('CUSTOM_SENSOR', 'HEALTH_CONNECT', 'MANUAL');

-- CreateTable
CREATE TABLE "DeviceRegistration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL,
    "apiKey" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heartRate" INTEGER,
    "spo2" INTEGER,
    "respiratoryRate" DOUBLE PRECISION,
    "stressLevel" DOUBLE PRECISION,
    "steps" INTEGER,
    "calories" DOUBLE PRECISION,
    "activeMinutes" DOUBLE PRECISION,
    "readingType" TEXT NOT NULL DEFAULT 'continuous',
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "BiometricReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceRegistration_apiKey_key" ON "DeviceRegistration"("apiKey");

-- CreateIndex
CREATE INDEX "DeviceRegistration_userId_idx" ON "DeviceRegistration"("userId");

-- CreateIndex
CREATE INDEX "DeviceRegistration_apiKey_idx" ON "DeviceRegistration"("apiKey");

-- CreateIndex
CREATE INDEX "BiometricReading_userId_timestamp_idx" ON "BiometricReading"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "BiometricReading_sessionId_timestamp_idx" ON "BiometricReading"("sessionId", "timestamp");

-- CreateIndex
CREATE INDEX "BiometricReading_deviceId_timestamp_idx" ON "BiometricReading"("deviceId", "timestamp");

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiometricReading" ADD CONSTRAINT "BiometricReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "DeviceRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiometricReading" ADD CONSTRAINT "BiometricReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiometricReading" ADD CONSTRAINT "BiometricReading_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
