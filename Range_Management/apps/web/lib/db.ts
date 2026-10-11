// lib/db.ts
// Dexie IndexedDB schema for offline-first caching and sync queue.
// All tables are keyed by user-scoped IDs to prevent data bleed between accounts.

import Dexie, { type Table } from 'dexie';
import type { Session, Shot, User } from '@shooting-platform/shared-types';

// ── Table interfaces ──────────────────────────────────────────────────────────

export interface DbSession {
  id: string;                // real server UUID or 'offline_<uuid>'
  userId: string;            // owner — used for scoped queries
  shooterId?: string | null; // set when a coach is viewing a specific shooter
  data: Session;
  cachedAt: number;          // Date.now() — used for TTL checks
  isDirty: boolean;          // true = created/modified offline, not yet synced
  isDeleted: boolean;        // true = soft-delete pending sync
}

export interface DbShot {
  id: string;               // server UUID or 'offline_<uuid>'
  sessionId: string;
  userId: string;
  data: Shot;
  cachedAt: number;
  isDirty: boolean;
}

export type SyncOpType =
  | 'CREATE_SESSION'
  | 'ADD_SHOTS'
  | 'UPDATE_SESSION'
  | 'DELETE_SESSION';

export interface DbSyncQueueItem {
  id?: number;              // Dexie autoincrement PK
  operationId: string;      // uuid — idempotency key sent to server
  type: SyncOpType;
  endpoint: string;         // e.g. '/sessions', '/shots/manual'
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: unknown;
  tempId?: string;          // local ID to replace with server ID on success
  retryCount: number;
  nextRetryAt: number;      // Date.now() + backoff
  createdAt: number;
  status: 'pending' | 'inflight' | 'failed';
  errorMessage?: string;
}

export interface DbImage {
  id: string;               // 'session_<sessionId>_<filename>'
  sessionId: string;
  userId: string;
  blob: Blob;               // full JPEG
  thumbnail: Blob | null;   // 200×200 JPEG thumbnail
  uploadStatus: 'pending' | 'uploaded' | 'failed';
  uploadedSessionId?: string;
  cachedAt: number;
}

export interface DbAnalytics {
  key: string;              // 'overview_<userId>' | 'session_<id>'
  userId: string;
  data: unknown;
  cachedAt: number;
}

export interface DbUser {
  id: string;
  data: User;
  cachedAt: number;
}

// ── Dexie database class ──────────────────────────────────────────────────────

class MarksmanDb extends Dexie {
  sessions!: Table<DbSession>;
  shots!: Table<DbShot>;
  syncQueue!: Table<DbSyncQueueItem>;
  images!: Table<DbImage>;
  analytics!: Table<DbAnalytics>;
  users!: Table<DbUser>;

  constructor() {
    super('MarksmanDB');
    this.version(1).stores({
      sessions:  'id, userId, shooterId, isDirty, isDeleted',
      shots:     'id, sessionId, userId, isDirty',
      syncQueue: '++id, operationId, status, nextRetryAt, createdAt',
      images:    'id, sessionId, userId, uploadStatus',
      analytics: 'key, userId, cachedAt',
      users:     'id',
    });
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let _db: MarksmanDb | null = null;

export function getDb(): MarksmanDb {
  if (typeof window === 'undefined') {
    throw new Error('getDb() must be called in a browser context');
  }
  if (!_db) _db = new MarksmanDb();
  return _db;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the current user ID from localStorage (null if not authenticated). */
export function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem('current_user');
    if (!raw) return null;
    const u = JSON.parse(raw) as { id?: string };
    return u?.id ?? null;
  } catch {
    return null;
  }
}
