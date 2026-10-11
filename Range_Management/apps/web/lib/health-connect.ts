// apps/web/lib/health-connect.ts
// Health Connect integration wrapper using @capgo/capacitor-health.
// On non-Android platforms (web, iOS) all functions return gracefully.
// "Marksman Pulse" is the branded virtual device that proxies Health Connect data
// into the biometrics backend — its deviceId is persisted in localStorage.

import { apiFetch } from './api';

const PLUGIN_PACKAGE = '@capgo/capacitor-health';
const STORAGE_KEY_DEVICE_ID = 'mp_hc_device_id';
const STORAGE_KEY_API_KEY   = 'mp_hc_api_key';

let _available: boolean | null = null;

// ── Plugin loader ──────────────────────────────────────────────────────────────

async function loadPlugin(): Promise<{ Health: any } | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return await (new Function('id', 'return import(id)')(PLUGIN_PACKAGE));
  } catch {
    return null;
  }
}

// ── Availability ───────────────────────────────────────────────────────────────

export async function isAvailable(): Promise<boolean> {
  if (_available !== null) return _available;
  if (typeof window === 'undefined') return (_available = false);
  try {
    const mod = await loadPlugin();
    if (!mod) return (_available = false);
    const result = await mod.Health.isAvailable();
    _available = result?.available === true;
  } catch {
    _available = false;
  }
  return _available ?? false;
}

// ── Permissions ────────────────────────────────────────────────────────────────

const READ_TYPES = [
  'heartRate',
  'oxygenSaturation',
  'respiratoryRate',
  'heartRateVariability',
  'steps',
  'calories',
];

export async function requestPermissions(): Promise<boolean> {
  try {
    const mod = await loadPlugin();
    if (!mod) return false;
    await mod.Health.requestAuthorization({ read: READ_TYPES });
    const check = await mod.Health.checkAuthorization({ read: READ_TYPES.slice(0, 3) });
    return check?.authorized === true;
  } catch {
    return false;
  }
}

export async function checkPermissions(): Promise<string[]> {
  try {
    const mod = await loadPlugin();
    if (!mod) return [];
    const result = await mod.Health.checkAuthorization({ read: READ_TYPES });
    // Returns { authorized: boolean } or per-type; treat true as all granted
    if (result?.authorized) return READ_TYPES;
    return [];
  } catch {
    return [];
  }
}

// ── Data readers ───────────────────────────────────────────────────────────────

async function readSamples(
  dataType: string, start: Date, end: Date, limit = 500,
): Promise<any[]> {
  try {
    const mod = await loadPlugin();
    if (!mod) return [];
    const result = await mod.Health.readSamples({
      dataType,
      startDate: start.toISOString(),
      endDate:   end.toISOString(),
      limit,
    });
    return result?.samples ?? [];
  } catch {
    return [];
  }
}

export async function readHeartRate(
  start: Date, end: Date,
): Promise<Array<{ timestamp: string; heartRate: number }>> {
  const samples = await readSamples('heartRate', start, end);
  return samples.map((s: any) => ({
    timestamp: s.startDate ?? s.date ?? new Date().toISOString(),
    heartRate: Math.round(s.value ?? 0),
  }));
}

export async function readBloodOxygen(
  start: Date, end: Date,
): Promise<Array<{ timestamp: string; spo2: number }>> {
  const samples = await readSamples('oxygenSaturation', start, end);
  return samples.map((s: any) => ({
    timestamp: s.startDate ?? s.date ?? new Date().toISOString(),
    spo2: Math.round((s.value ?? 0) * (s.value <= 1 ? 100 : 1)), // normalize 0-1 or 0-100
  }));
}

export async function readRespiratoryRate(
  start: Date, end: Date,
): Promise<Array<{ timestamp: string; respiratoryRate: number }>> {
  const samples = await readSamples('respiratoryRate', start, end);
  return samples.map((s: any) => ({
    timestamp: s.startDate ?? s.date ?? new Date().toISOString(),
    respiratoryRate: Math.round(s.value ?? 0),
  }));
}

export async function readHrv(
  start: Date, end: Date,
): Promise<Array<{ timestamp: string; hrv: number }>> {
  const samples = await readSamples('heartRateVariability', start, end);
  return samples.map((s: any) => ({
    timestamp: s.startDate ?? s.date ?? new Date().toISOString(),
    hrv: Math.round(s.value ?? 0),
  }));
}

export async function readSteps(
  start: Date, end: Date,
): Promise<Array<{ timestamp: string; steps: number }>> {
  const samples = await readSamples('steps', start, end);
  return samples.map((s: any) => ({
    timestamp: s.startDate ?? s.date ?? new Date().toISOString(),
    steps: Math.round(s.value ?? 0),
  }));
}

export async function readCalories(
  start: Date, end: Date,
): Promise<Array<{ timestamp: string; calories: number }>> {
  const samples = await readSamples('calories', start, end);
  return samples.map((s: any) => ({
    timestamp: s.startDate ?? s.date ?? new Date().toISOString(),
    calories: Math.round(s.value ?? 0),
  }));
}

// ── Device registration ────────────────────────────────────────────────────────

interface MarksmanPulseDevice {
  deviceId: string;
  apiKey: string;
}

export async function getOrRegisterMarksmanPulse(): Promise<MarksmanPulseDevice> {
  const storedId  = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
  const storedKey = localStorage.getItem(STORAGE_KEY_API_KEY);
  if (storedId && storedKey) return { deviceId: storedId, apiKey: storedKey };

  const result = await apiFetch<{ id: string; apiKey: string }>('/biometrics/devices', {
    method: 'POST',
    body: JSON.stringify({ deviceName: 'Marksman Pulse', deviceType: 'HEALTH_CONNECT' }),
  });

  localStorage.setItem(STORAGE_KEY_DEVICE_ID, result.id);
  localStorage.setItem(STORAGE_KEY_API_KEY,   result.apiKey ?? '');
  return { deviceId: result.id, apiKey: result.apiKey ?? '' };
}

export function clearMarksmanPulseDevice(): void {
  localStorage.removeItem(STORAGE_KEY_DEVICE_ID);
  localStorage.removeItem(STORAGE_KEY_API_KEY);
}

// ── Sync to backend ────────────────────────────────────────────────────────────

interface SyncOptions {
  sessionId?: string;
  hoursBack?: number;
}

interface SyncResult {
  synced: number;
  total: number;
  deviceId?: string;
  counts: {
    heartRate: number;
    spo2: number;
    respiratoryRate: number;
    hrv: number;
    steps: number;
    calories: number;
  };
}

export async function syncToBackend(opts: SyncOptions = {}): Promise<SyncResult> {
  const available = await isAvailable();
  const empty: SyncResult = { synced: 0, total: 0, counts: { heartRate: 0, spo2: 0, respiratoryRate: 0, hrv: 0, steps: 0, calories: 0 } };
  if (!available) return empty;

  const { sessionId, hoursBack = 24 } = opts;
  const end   = new Date();
  const start = new Date(end.getTime() - hoursBack * 60 * 60 * 1000);

  const [hrData, spo2Data, rrData, hrvData, stepsData, calData] = await Promise.all([
    readHeartRate(start, end),
    readBloodOxygen(start, end),
    readRespiratoryRate(start, end),
    readHrv(start, end),
    readSteps(start, end),
    readCalories(start, end),
  ]);

  // Merge all readings by timestamp proximity (< 30s window)
  const readings: Array<{
    timestamp: string;
    heartRate?: number;
    spo2?: number;
    respiratoryRate?: number;
    hrv?: number;
    steps?: number;
    calories?: number;
  }> = [];

  function mergeInto(arr: Array<{ timestamp: string; [k: string]: any }>, key: string) {
    for (const item of arr) {
      const ts = new Date(item.timestamp).getTime();
      const existing = readings.find(
        r => Math.abs(new Date(r.timestamp).getTime() - ts) < 30_000,
      );
      if (existing) {
        (existing as any)[key] = item[key];
      } else {
        readings.push({ timestamp: item.timestamp, [key]: item[key] });
      }
    }
  }

  mergeInto(hrData,    'heartRate');
  mergeInto(spo2Data,  'spo2');
  mergeInto(rrData,    'respiratoryRate');
  mergeInto(hrvData,   'hrv');
  mergeInto(stepsData, 'steps');
  mergeInto(calData,   'calories');

  const counts = {
    heartRate:       hrData.length,
    spo2:            spo2Data.length,
    respiratoryRate: rrData.length,
    hrv:             hrvData.length,
    steps:           stepsData.length,
    calories:        calData.length,
  };

  if (readings.length === 0) return { ...empty, counts };

  // Get or register Marksman Pulse device
  const { deviceId } = await getOrRegisterMarksmanPulse();

  const result = await apiFetch<{ synced: number; total: number }>(
    '/biometrics/health-connect/sync',
    { method: 'POST', body: JSON.stringify({ readings, sessionId, deviceId }) },
  );

  return { synced: result.synced, total: result.total, deviceId, counts };
}

// ── Auto-sync scheduling ───────────────────────────────────────────────────────

export function startAutoSync(intervalMs = 15 * 60 * 1000): () => void {
  void syncToBackend();
  const id = setInterval(() => void syncToBackend(), intervalMs);
  return () => clearInterval(id);
}
