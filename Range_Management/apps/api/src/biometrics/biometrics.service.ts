// apps/api/src/biometrics/biometrics.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../gateway/events.gateway';
import type { BiometricSummary, BiometricTrendPoint } from '@shooting-platform/shared-types';

@Injectable()
export class BiometricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: EventsGateway,
  ) {}

  // ── Device Management ─────────────────────────────────────────────────────

  async registerDevice(userId: string, deviceName: string, deviceType: string) {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const device = await this.prisma.deviceRegistration.create({
      data: { userId, deviceName, deviceType: deviceType as any, apiKey },
    });
    return { ...device, apiKey }; // apiKey shown once
  }

  async listDevices(userId: string) {
    return this.prisma.deviceRegistration.findMany({
      where: { userId },
      select: {
        id: true, deviceName: true, deviceType: true, lastSeenAt: true,
        isActive: true, metadata: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleDevice(userId: string, deviceId: string, isActive: boolean) {
    const device = await this.prisma.deviceRegistration.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) throw new NotFoundException('Device not found');
    return this.prisma.deviceRegistration.update({
      where: { id: deviceId },
      data: { isActive },
    });
  }

  async deleteDevice(userId: string, deviceId: string) {
    const device = await this.prisma.deviceRegistration.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) throw new NotFoundException('Device not found');
    // Delete related readings first, then the device
    await this.prisma.biometricReading.deleteMany({ where: { deviceId } });
    return this.prisma.deviceRegistration.delete({ where: { id: deviceId } });
  }

  // ── Vitals Ingestion (Arduino) ────────────────────────────────────────────

  async ingestVitals(
    deviceId: string,
    userId: string,
    type: string,
    heartRate: number,
    spo2: number,
  ) {
    // Auto-link to most recent active session (created <4hrs ago)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const recentSession = await this.prisma.session.findFirst({
      where: {
        shooterId: userId,
        deletedAt: null,
        createdAt: { gte: fourHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const reading = await this.prisma.biometricReading.create({
      data: {
        deviceId,
        userId,
        sessionId: recentSession?.id ?? null,
        heartRate,
        spo2,
        readingType: type,
        confidence: type === 'optimal_read' ? 0.95 : 0.7,
        timestamp: new Date(),
        receivedAt: new Date(),
      },
    });

    // Emit WebSocket events
    this.gateway.emitBiometricUpdate(userId, recentSession?.id ?? null, reading);

    return reading;
  }

  // ── Health Connect Sync ───────────────────────────────────────────────────

  async syncHealthConnect(
    userId: string,
    readings: Array<{
      timestamp: string;
      heartRate?: number;
      spo2?: number;
      respiratoryRate?: number;
      steps?: number;
      calories?: number;
      activeMinutes?: number;
    }>,
    sessionId?: string,
  ) {
    // Find or create Health Connect device for this user
    let device = await this.prisma.deviceRegistration.findFirst({
      where: { userId, deviceType: 'HEALTH_CONNECT', isActive: true },
    });

    if (!device) {
      const apiKey = crypto.randomBytes(32).toString('hex');
      device = await this.prisma.deviceRegistration.create({
        data: {
          userId,
          deviceName: 'Health Connect',
          deviceType: 'HEALTH_CONNECT',
          apiKey,
          isActive: true,
        },
      });
    }

    // Batch insert, skip duplicates by timestamp+deviceId
    const created: any[] = [];
    for (const r of readings) {
      const existing = await this.prisma.biometricReading.findFirst({
        where: {
          deviceId: device.id,
          timestamp: new Date(r.timestamp),
        },
      });
      if (existing) continue;

      const reading = await this.prisma.biometricReading.create({
        data: {
          deviceId: device.id,
          userId,
          sessionId: sessionId ?? null,
          timestamp: new Date(r.timestamp),
          receivedAt: new Date(),
          heartRate: r.heartRate ?? null,
          spo2: r.spo2 ?? null,
          respiratoryRate: r.respiratoryRate ?? null,
          steps: r.steps ?? null,
          calories: r.calories ?? null,
          activeMinutes: r.activeMinutes ?? null,
          readingType: 'health_connect_sync',
        },
      });
      created.push(reading);
    }

    return { synced: created.length, total: readings.length };
  }

  // ── Readings Query ────────────────────────────────────────────────────────

  async getReadings(
    userId: string,
    filters: { sessionId?: string; deviceId?: string; from?: string; to?: string; limit?: number },
  ) {
    const where: any = { userId };
    if (filters.sessionId) where.sessionId = filters.sessionId;
    if (filters.deviceId) where.deviceId = filters.deviceId;
    if (filters.from || filters.to) {
      where.timestamp = {};
      if (filters.from) where.timestamp.gte = new Date(filters.from);
      if (filters.to) where.timestamp.lte = new Date(filters.to);
    }

    return this.prisma.biometricReading.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters.limit ?? 200,
    });
  }

  // ── Session Summary ───────────────────────────────────────────────────────

  async getSessionSummary(sessionId: string, userId: string): Promise<BiometricSummary> {
    const readings = await this.prisma.biometricReading.findMany({
      where: { sessionId, userId },
      orderBy: { timestamp: 'asc' },
    });

    if (readings.length === 0) {
      return {
        sessionId,
        avgHeartRate: 0,
        minHeartRate: 0,
        maxHeartRate: 0,
        hrv: 0,
        avgSpo2: 0,
        avgRespiratoryRate: null,
        readingCount: 0,
      };
    }

    const hrs = readings.map(r => r.heartRate).filter((v): v is number => v !== null);
    const spo2s = readings.map(r => r.spo2).filter((v): v is number => v !== null);
    const rrs = readings.map(r => r.respiratoryRate).filter((v): v is number => v !== null);

    const avgHr = hrs.length > 0 ? hrs.reduce((a, b) => a + b, 0) / hrs.length : 0;
    const minHr = hrs.length > 0 ? Math.min(...hrs) : 0;
    const maxHr = hrs.length > 0 ? Math.max(...hrs) : 0;
    const avgSpo2 = spo2s.length > 0 ? spo2s.reduce((a, b) => a + b, 0) / spo2s.length : 0;
    const avgRr = rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : null;

    // HRV as standard deviation of HR readings
    const hrv = hrs.length > 1
      ? Math.sqrt(hrs.reduce((sum, v) => sum + (v - avgHr) ** 2, 0) / (hrs.length - 1))
      : 0;

    return {
      sessionId,
      avgHeartRate: Math.round(avgHr * 10) / 10,
      minHeartRate: minHr,
      maxHeartRate: maxHr,
      hrv: Math.round(hrv * 10) / 10,
      avgSpo2: Math.round(avgSpo2 * 10) / 10,
      avgRespiratoryRate: avgRr !== null ? Math.round(avgRr * 10) / 10 : null,
      readingCount: readings.length,
    };
  }

  // ── Trends ────────────────────────────────────────────────────────────────

  async getTrends(userId: string, days: number): Promise<BiometricTrendPoint[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const readings = await this.prisma.biometricReading.findMany({
      where: { userId, timestamp: { gte: since }, heartRate: { not: null } },
      orderBy: { timestamp: 'asc' },
    });

    // Group by date
    const groups = new Map<string, { hrs: number[]; spo2s: number[] }>();
    for (const r of readings) {
      const date = new Date(r.timestamp).toISOString().slice(0, 10);
      if (!groups.has(date)) groups.set(date, { hrs: [], spo2s: [] });
      const g = groups.get(date)!;
      if (r.heartRate !== null) g.hrs.push(r.heartRate);
      if (r.spo2 !== null) g.spo2s.push(r.spo2);
    }

    const result: BiometricTrendPoint[] = [];
    for (const [date, g] of groups) {
      const avgHr = g.hrs.reduce((a, b) => a + b, 0) / g.hrs.length;
      result.push({
        date,
        avgHeartRate: Math.round(avgHr * 10) / 10,
        minHeartRate: Math.min(...g.hrs),
        maxHeartRate: Math.max(...g.hrs),
        avgSpo2: g.spo2s.length > 0
          ? Math.round((g.spo2s.reduce((a, b) => a + b, 0) / g.spo2s.length) * 10) / 10
          : 0,
        readingCount: g.hrs.length,
      });
    }

    return result;
  }

  // ── Latest Reading ────────────────────────────────────────────────────────

  async getLatestReading(userId: string) {
    return this.prisma.biometricReading.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }

  // ── Device Detail ──────────────────────────────────────────────────────

  async getDeviceDetail(userId: string, deviceId: string) {
    const device = await this.prisma.deviceRegistration.findFirst({
      where: { id: deviceId, userId },
    });
    if (!device) throw new NotFoundException('Device not found');

    const totalReadings = await this.prisma.biometricReading.count({
      where: { deviceId },
    });

    const recentReadings = await this.prisma.biometricReading.findMany({
      where: { deviceId },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    const lastReading = recentReadings[0] ?? null;

    // Readings in last 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const readingsLast24h = await this.prisma.biometricReading.count({
      where: { deviceId, timestamp: { gte: dayAgo } },
    });

    // Sessions linked
    const linkedSessions = await this.prisma.biometricReading.findMany({
      where: { deviceId, sessionId: { not: null } },
      distinct: ['sessionId'],
      select: { sessionId: true },
    });

    return {
      ...device,
      apiKey: undefined, // never expose
      totalReadings,
      readingsLast24h,
      linkedSessionCount: linkedSessions.length,
      lastReading,
      recentReadings,
    };
  }
}
