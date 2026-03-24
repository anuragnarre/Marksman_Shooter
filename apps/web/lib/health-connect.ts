// apps/web/lib/health-connect.ts
// Health Connect integration wrapper with graceful web fallback.
// Health Connect is Android-only (Android 14+ native, or Health Connect app on Android 9+).
// On non-Android platforms (including web/Vercel), all functions return empty/false gracefully.

import { apiFetch } from './api';

const PLUGIN_ID = '@anthropic-ai/capacitor-health-connect';

let _available: boolean | null = null;

async function loadPlugin(): Promise<{ HealthConnect: any } | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return await (new Function('id', 'return import(id)')(PLUGIN_ID));
  } catch {
    return null;
  }
}

export async function isAvailable(): Promise<boolean> {
  if (_available !== null) return _available;
  if (typeof window === 'undefined') return (_available = false);

  try {
    const mod = await loadPlugin();
    const result = await mod?.HealthConnect.isAvailable();
    _available = result?.available ?? false;
  } catch {
    _available = false;
  }
  return _available ?? false;
}

export async function requestPermissions(): Promise<boolean> {
  try {
    const mod = await loadPlugin();
    const result = await mod?.HealthConnect.requestPermissions({
      permissions: ['HEART_RATE', 'BLOOD_OXYGEN', 'RESPIRATORY_RATE'],
    });
    return result?.granted ?? false;
  } catch {
    return false;
  }
}

export async function readHeartRate(
  start: Date,
  end: Date,
): Promise<Array<{ timestamp: string; heartRate: number }>> {
  try {
    const mod = await loadPlugin();
    const result = await mod?.HealthConnect.readHeartRate({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    return result?.records ?? [];
  } catch {
    return [];
  }
}

export async function readBloodOxygen(
  start: Date,
  end: Date,
): Promise<Array<{ timestamp: string; spo2: number }>> {
  try {
    const mod = await loadPlugin();
    const result = await mod?.HealthConnect.readBloodOxygen({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    return result?.records ?? [];
  } catch {
    return [];
  }
}

export async function readRespiratoryRate(
  start: Date,
  end: Date,
): Promise<Array<{ timestamp: string; respiratoryRate: number }>> {
  try {
    const mod = await loadPlugin();
    const result = await mod?.HealthConnect.readRespiratoryRate({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    return result?.records ?? [];
  } catch {
    return [];
  }
}

export async function syncToBackend(
  sessionId?: string,
): Promise<{ synced: number; total: number }> {
  const available = await isAvailable();
  if (!available) return { synced: 0, total: 0 };

  const end = new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000); // last hour

  const [hrData, spo2Data, rrData] = await Promise.all([
    readHeartRate(start, end),
    readBloodOxygen(start, end),
    readRespiratoryRate(start, end),
  ]);

  const readings: Array<{
    timestamp: string;
    heartRate?: number;
    spo2?: number;
    respiratoryRate?: number;
  }> = [];

  for (const hr of hrData) {
    readings.push({ timestamp: hr.timestamp, heartRate: hr.heartRate });
  }

  for (const s of spo2Data) {
    const existing = readings.find(
      r => Math.abs(new Date(r.timestamp).getTime() - new Date(s.timestamp).getTime()) < 30000,
    );
    if (existing) {
      existing.spo2 = s.spo2;
    } else {
      readings.push({ timestamp: s.timestamp, spo2: s.spo2 });
    }
  }

  for (const rr of rrData) {
    const existing = readings.find(
      r => Math.abs(new Date(r.timestamp).getTime() - new Date(rr.timestamp).getTime()) < 30000,
    );
    if (existing) {
      existing.respiratoryRate = rr.respiratoryRate;
    } else {
      readings.push({ timestamp: rr.timestamp, respiratoryRate: rr.respiratoryRate });
    }
  }

  if (readings.length === 0) return { synced: 0, total: 0 };

  return apiFetch<{ synced: number; total: number }>('/biometrics/health-connect/sync', {
    method: 'POST',
    body: JSON.stringify({ readings, sessionId }),
  });
}
