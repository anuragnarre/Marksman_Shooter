// lib/sync-engine.ts
// Processes the offline sync queue — drains pending mutations to the API,
// replaces temp IDs with server IDs, and handles retries with backoff.

import { getDb, type DbSyncQueueItem } from './db';
import { apiFetch } from './api';
import { ApiError } from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SyncState {
  pending: number;
  inflight: number;
  lastSyncAt: number | null;
  lastError: string | null;
}

const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 300_000;

let _processing = false;
let _lastSyncAt: number | null = null;
let _lastError: string | null = null;

// ── Core processor ────────────────────────────────────────────────────────────

export async function processSyncQueue(): Promise<void> {
  if (_processing) return; // prevent concurrent runs
  if (typeof window === 'undefined') return;

  let db;
  try {
    db = getDb();
  } catch {
    return;
  }

  _processing = true;

  try {
    const now = Date.now();
    const items = await db.syncQueue
      .where('status').equals('pending')
      .filter(item => item.nextRetryAt <= now)
      .sortBy('createdAt');

    for (const item of items) {
      await processItem(item);
    }

    _lastSyncAt = Date.now();
    _lastError = null;
  } catch (err) {
    _lastError = err instanceof Error ? err.message : String(err);
  } finally {
    _processing = false;
    emitSyncState();
  }
}

async function processItem(item: DbSyncQueueItem): Promise<void> {
  const db = getDb();

  // Mark inflight
  await db.syncQueue.update(item.id!, { status: 'inflight' });
  emitSyncState();

  try {
    const bodyStr = item.body !== null && item.body !== undefined
      ? JSON.stringify(item.body)
      : undefined;

    const result = await apiFetch<Record<string, unknown>>(item.endpoint, {
      method: item.method,
      body: bodyStr,
      skipOffline: true,
      operationId: item.operationId,
    });

    // Replace temp ID with real server ID
    if (item.tempId && result?.id) {
      await replaceTempId(item.tempId, result.id as string);
    }

    // Mark dirty records as clean
    if (item.type === 'CREATE_SESSION' && result?.id) {
      const serverId = result.id as string;
      await db.sessions.where('id').equals(serverId).modify({ isDirty: false });
    }
    if (item.type === 'ADD_SHOTS') {
      // shots were individually stored — mark them clean by sessionId
      const body = item.body as { sessionId?: string } | null;
      if (body?.sessionId) {
        await db.shots.where('sessionId').equals(body.sessionId).modify({ isDirty: false });
      }
    }

    // Remove from queue on success
    await db.syncQueue.delete(item.id!);

  } catch (err) {
    const apiErr = err instanceof ApiError ? err : null;

    if (apiErr?.status === 401) {
      // Auth expired — abort entire queue, trigger logout
      window.dispatchEvent(new Event('auth:unauthorized'));
      await db.syncQueue.update(item.id!, { status: 'pending' });
      throw err; // stop processing
    }

    if (apiErr?.status === 409) {
      // Conflict — attempt shot re-numbering resolution once
      const resolved = await resolveConflict(item);
      if (resolved) {
        await db.syncQueue.delete(item.id!);
        return;
      }
    }

    if (apiErr && apiErr.status >= 400 && apiErr.status < 500) {
      // Permanent client error — do not retry
      await db.syncQueue.update(item.id!, {
        status: 'failed',
        errorMessage: apiErr.message,
      });
      return;
    }

    // Transient error — backoff and retry
    const newCount = item.retryCount + 1;
    if (newCount >= MAX_RETRIES) {
      await db.syncQueue.update(item.id!, {
        status: 'failed',
        retryCount: newCount,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    const backoff = Math.min(BASE_BACKOFF_MS * 2 ** item.retryCount, MAX_BACKOFF_MS);
    await db.syncQueue.update(item.id!, {
      status: 'pending',
      retryCount: newCount,
      nextRetryAt: Date.now() + backoff,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
  }
}

// ── Conflict resolution ───────────────────────────────────────────────────────

async function resolveConflict(item: DbSyncQueueItem): Promise<boolean> {
  if (item.type !== 'ADD_SHOTS') return false;

  const body = item.body as {
    sessionId?: string;
    shots?: Array<{ shotNumber: number; [k: string]: unknown }>;
  };
  if (!body?.sessionId || !Array.isArray(body.shots)) return false;

  try {
    // Fetch current shots from server to find max shot number
    const serverShots = await apiFetch<Array<{ shotNumber: number }>>(
      `/sessions/${body.sessionId}`,
      { skipOffline: true },
    );
    const maxNum = Array.isArray(serverShots)
      ? Math.max(0, ...serverShots.map(s => s.shotNumber))
      : 0;

    // Re-number offline shots
    const renumbered = body.shots.map((s, i) => ({
      ...s,
      shotNumber: maxNum + i + 1,
    }));

    await apiFetch(item.endpoint, {
      method: 'POST',
      body: JSON.stringify({ ...body, shots: renumbered }),
      skipOffline: true,
      operationId: item.operationId,
    });

    return true;
  } catch {
    return false;
  }
}

// ── tempId replacement ────────────────────────────────────────────────────────

export async function replaceTempId(tempId: string, serverId: string): Promise<void> {
  const db = getDb();

  // Update the session record
  const session = await db.sessions.get(tempId);
  if (session) {
    const updated = { ...session, id: serverId, data: { ...session.data, id: serverId }, isDirty: false };
    await db.sessions.delete(tempId);
    await db.sessions.put(updated);
  }

  // Update all shots that belong to this session
  const shots = await db.shots.where('sessionId').equals(tempId).toArray();
  for (const shot of shots) {
    await db.shots.update(shot.id, { sessionId: serverId });
  }

  // Update pending sync queue items that reference the temp ID in their body
  const pending = await db.syncQueue.where('status').equals('pending').toArray();
  for (const queued of pending) {
    if (!queued.body) continue;
    const bodyStr = JSON.stringify(queued.body);
    if (bodyStr.includes(tempId)) {
      const newBody = JSON.parse(bodyStr.replace(new RegExp(tempId, 'g'), serverId));
      await db.syncQueue.update(queued.id!, { body: newBody });
    }
  }

  // Notify any open session detail pages
  window.dispatchEvent(new CustomEvent('offline:id-replaced', {
    detail: { tempId, serverId },
  }));
}

// ── Sync triggers ─────────────────────────────────────────────────────────────

let _triggersRegistered = false;

export function registerSyncTriggers(): void {
  if (typeof window === 'undefined' || _triggersRegistered) return;
  _triggersRegistered = true;

  // Reconnect — give the connection 1.5s to stabilise
  window.addEventListener('online', () => {
    setTimeout(() => { void processSyncQueue(); }, 1500);
  });

  // App foregrounded
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void processSyncQueue();
  });

  // SW Background Sync message
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_TRIGGER_SYNC') void processSyncQueue();
      if (event.data?.type === 'SW_REFRESH_ANALYTICS') void refreshAnalyticsCache();
    });
  }

  // Register SW Background Sync tag if supported
  void registerBackgroundSync();
}

async function registerBackgroundSync(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await (reg as ServiceWorkerRegistration & {
      sync: { register(tag: string): Promise<void> };
    }).sync.register('marksman-sync');
  } catch {
    // Not supported or permission denied — foreground sync handles it
  }
}

export async function refreshAnalyticsCache(): Promise<void> {
  try {
    const { cacheResponse } = await import('./offline-api');
    const data = await apiFetch<unknown>('/analytics/overview', { skipOffline: true });
    await cacheResponse('/analytics/overview', data);
  } catch {
    // Silently skip — analytics cache refresh is best-effort
  }
}

// ── State helpers ─────────────────────────────────────────────────────────────

function emitSyncState(): void {
  window.dispatchEvent(new CustomEvent('sync-state-changed'));
}

export async function getSyncState(): Promise<SyncState> {
  try {
    const db = getDb();
    const [pending, inflight] = await Promise.all([
      db.syncQueue.where('status').equals('pending').count(),
      db.syncQueue.where('status').equals('inflight').count(),
    ]);
    return { pending, inflight, lastSyncAt: _lastSyncAt, lastError: _lastError };
  } catch {
    return { pending: 0, inflight: 0, lastSyncAt: null, lastError: null };
  }
}

export async function retryFailedItems(): Promise<void> {
  const db = getDb();
  const now = Date.now();
  await db.syncQueue.where('status').equals('failed').modify({
    status: 'pending',
    retryCount: 0,
    nextRetryAt: now,
    errorMessage: undefined,
  });
  void processSyncQueue();
}
