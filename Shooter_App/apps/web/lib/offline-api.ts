// lib/offline-api.ts
// Offline read/write/cache handlers for apiFetch.
// offlineRead   — serves data from IndexedDB when network is unavailable.
// offlineWrite  — writes mutations to IndexedDB + sync queue optimistically.
// cacheResponse — mirrors successful API responses into IndexedDB.

import { v4 as uuidv4 } from 'uuid';
import { getDb, getCurrentUserId } from './db';
import type { Session, Shot } from '@shooting-platform/shared-types';

// ── Path matchers ─────────────────────────────────────────────────────────────

function matchPath(pattern: RegExp, path: string): RegExpMatchArray | null {
  return path.match(pattern);
}

// ── offlineRead ───────────────────────────────────────────────────────────────

/**
 * Serve a GET response from IndexedDB when the device is offline.
 * Returns null when there is no cached data for the path.
 */
export async function offlineRead<T>(path: string): Promise<T | null> {
  const db = getDb();
  const userId = getCurrentUserId();
  if (!userId) return null;

  // /auth/me
  if (path === '/auth/me') {
    const record = await db.users.get(userId);
    return record ? (record.data as unknown as T) : null;
  }

  // /sessions — list
  if (path === '/sessions' || path.startsWith('/sessions?')) {
    const all = await db.sessions
      .where('userId').equals(userId)
      .filter(s => !s.isDeleted)
      .toArray();
    const sessions = all.map(r => r.data);
    return sessions as unknown as T;
  }

  // /sessions/:id — detail (includes shots)
  const sessionDetail = matchPath(/^\/sessions\/([^/?]+)$/, path);
  if (sessionDetail) {
    const id = sessionDetail[1];
    const record = await db.sessions.get(id);
    if (!record || record.isDeleted) return null;
    // Attach cached shots
    const shotRecords = await db.shots.where('sessionId').equals(id).toArray();
    const session: Session = {
      ...record.data,
      shots: shotRecords.map(r => r.data),
    };
    return session as unknown as T;
  }

  // /analytics/overview
  if (path === '/analytics/overview') {
    const record = await db.analytics.get(`overview_${userId}`);
    return record ? (record.data as T) : null;
  }

  // /analytics/session/:id
  const sessionAnalytics = matchPath(/^\/analytics\/session\/([^/?]+)$/, path);
  if (sessionAnalytics) {
    const record = await db.analytics.get(`session_${sessionAnalytics[1]}`);
    return record ? (record.data as T) : null;
  }

  return null;
}

// ── offlineWrite ──────────────────────────────────────────────────────────────

/**
 * Handle a mutation while offline. Writes to IndexedDB immediately and enqueues
 * a sync operation. Returns an optimistic result matching the expected API shape.
 */
export async function offlineWrite<T>(
  path: string,
  options: { method?: string; body?: unknown },
): Promise<T> {
  const db = getDb();
  const userId = getCurrentUserId();
  if (!userId) throw new Error('offline:not-authenticated');

  const method = (options.method ?? 'POST').toUpperCase();
  const now = Date.now();

  // POST /sessions — create new session
  if (method === 'POST' && path === '/sessions') {
    const body = options.body as Partial<Session> & Record<string, unknown>;
    const tempId = `offline_${uuidv4()}`;
    const operationId = uuidv4();

    const optimisticSession: Session = {
      id: tempId,
      shooterId: userId,
      discipline: (body.discipline as string) ?? '',
      distance: (body.distance as number) ?? 0,
      weaponType: (body.weaponType as string) ?? '',
      numberOfShots: (body.numberOfShots as number) ?? 0,
      sessionDate: new Date((body.sessionDate as unknown as string) ?? now),
      createdAt: new Date(now),
      trainingMode: (body.trainingMode as string) ?? null,
      shots: [],
    };

    await db.sessions.put({
      id: tempId,
      userId,
      shooterId: null,
      data: optimisticSession,
      cachedAt: now,
      isDirty: true,
      isDeleted: false,
    });

    await db.syncQueue.add({
      operationId,
      type: 'CREATE_SESSION',
      endpoint: '/sessions',
      method: 'POST',
      body: options.body,
      tempId,
      retryCount: 0,
      nextRetryAt: now,
      createdAt: now,
      status: 'pending',
    });

    window.dispatchEvent(new CustomEvent('sync-state-changed'));
    return optimisticSession as unknown as T;
  }

  // DELETE /sessions/:id
  const deleteSession = matchPath(/^\/sessions\/([^/?]+)$/, path);
  if (method === 'DELETE' && deleteSession) {
    const id = deleteSession[1];
    const operationId = uuidv4();

    await db.sessions.where('id').equals(id).modify({ isDeleted: true, isDirty: true });

    await db.syncQueue.add({
      operationId,
      type: 'DELETE_SESSION',
      endpoint: path,
      method: 'DELETE',
      body: null,
      tempId: undefined,
      retryCount: 0,
      nextRetryAt: now,
      createdAt: now,
      status: 'pending',
    });

    window.dispatchEvent(new CustomEvent('sync-state-changed'));
    return undefined as unknown as T;
  }

  // POST shots manually (e.g. /shots/manual or /sessions/:id/shots)
  if (method === 'POST' && (path === '/shots/manual' || path.includes('/shots'))) {
    const operationId = uuidv4();
    const body = options.body as { sessionId?: string; shots?: Partial<Shot>[] } & Record<string, unknown>;
    const sessionId = body.sessionId as string;

    if (sessionId && Array.isArray(body.shots)) {
      const shotsToStore = body.shots.map((s, i) => {
        const shotId = `offline_${uuidv4()}`;
        const shot: Shot = {
          id: shotId,
          sessionId,
          shotNumber: (s.shotNumber as number) ?? i + 1,
          score: (s.score as number) ?? 0,
          x: (s.x as number) ?? 0,
          y: (s.y as number) ?? 0,
          timestamp: new Date((s.timestamp as unknown as string) ?? now),
        };
        return { id: shotId, sessionId, userId, data: shot, cachedAt: now, isDirty: true };
      });

      await db.shots.bulkPut(shotsToStore);

      await db.syncQueue.add({
        operationId,
        type: 'ADD_SHOTS',
        endpoint: path,
        method: 'POST',
        body: options.body,
        tempId: undefined,
        retryCount: 0,
        nextRetryAt: now,
        createdAt: now,
        status: 'pending',
      });

      window.dispatchEvent(new CustomEvent('sync-state-changed'));
    }

    return (body.shots ?? []) as unknown as T;
  }

  throw Object.assign(new Error('offline:unsupported-mutation'), { status: 0 });
}

// ── cacheResponse ─────────────────────────────────────────────────────────────

/**
 * Mirror a successful API GET response into IndexedDB.
 * Called fire-and-forget after every successful apiFetch GET.
 */
export async function cacheResponse(path: string, data: unknown): Promise<void> {
  try {
    const db = getDb();
    const userId = getCurrentUserId();
    if (!userId) return;

    const now = Date.now();

    // /auth/me
    if (path === '/auth/me') {
      const u = data as { id: string };
      await db.users.put({ id: u.id, data: u as never, cachedAt: now });
      return;
    }

    // /sessions — list
    if (path === '/sessions' || path.startsWith('/sessions?')) {
      const sessions = data as Session[];
      // Only overwrite records that aren't dirty (i.e. not offline-created)
      const existing = await db.sessions.where('userId').equals(userId).toArray();
      const dirtyIds = new Set(existing.filter(r => r.isDirty).map(r => r.id));

      const toUpsert = sessions
        .filter(s => !dirtyIds.has(s.id))
        .map(s => ({
          id: s.id,
          userId,
          shooterId: null,
          data: s,
          cachedAt: now,
          isDirty: false,
          isDeleted: false,
        }));

      if (toUpsert.length) await db.sessions.bulkPut(toUpsert);
      return;
    }

    // /sessions/:id — detail
    const sessionDetail = matchPath(/^\/sessions\/([^/?]+)$/, path);
    if (sessionDetail) {
      const session = data as Session;
      const existing = await db.sessions.get(session.id);
      if (existing?.isDirty) return; // don't overwrite dirty local record

      await db.sessions.put({
        id: session.id,
        userId,
        shooterId: null,
        data: session,
        cachedAt: now,
        isDirty: false,
        isDeleted: false,
      });

      if (session.shots?.length) {
        const shots = session.shots.map(s => ({
          id: s.id,
          sessionId: session.id,
          userId,
          data: s,
          cachedAt: now,
          isDirty: false,
        }));
        await db.shots.bulkPut(shots);
      }
      return;
    }

    // /analytics/overview
    if (path === '/analytics/overview') {
      await db.analytics.put({ key: `overview_${userId}`, userId, data, cachedAt: now });
      return;
    }

    // /analytics/session/:id
    const sessionAnalytics = matchPath(/^\/analytics\/session\/([^/?]+)$/, path);
    if (sessionAnalytics) {
      await db.analytics.put({
        key: `session_${sessionAnalytics[1]}`,
        userId,
        data,
        cachedAt: now,
      });
      return;
    }
  } catch {
    // cacheResponse is fire-and-forget — never throw
  }
}
