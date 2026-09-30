'use client';

// hooks/useSyncStatus.ts
// Exposes real-time sync queue state to React components.
// Subscribes to the 'sync-state-changed' CustomEvent dispatched by sync-engine.

import { useState, useEffect, useCallback } from 'react';
import { getSyncState, retryFailedItems } from '../lib/sync-engine';

export interface SyncStatus {
  pending: number;
  inflight: number;
  hasFailures: boolean;
  lastSyncAt: Date | null;
  retryFailed: () => Promise<void>;
}

export function useSyncStatus(): SyncStatus {
  const [pending, setPending] = useState(0);
  const [inflight, setInflight] = useState(0);
  const [hasFailures, setHasFailures] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      const state = await getSyncState();
      setPending(state.pending);
      setInflight(state.inflight);
      setLastSyncAt(state.lastSyncAt ? new Date(state.lastSyncAt) : null);

      // Check for failures
      const { getDb } = await import('../lib/db');
      const db = getDb();
      const failCount = await db.syncQueue.where('status').equals('failed').count();
      setHasFailures(failCount > 0);
    } catch {
      // IndexedDB unavailable — default to empty state
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handler = () => { void refresh(); };
    window.addEventListener('sync-state-changed', handler);
    return () => window.removeEventListener('sync-state-changed', handler);
  }, [refresh]);

  const retryFailed = useCallback(async () => {
    await retryFailedItems();
    await refresh();
  }, [refresh]);

  return { pending, inflight, hasFailures, lastSyncAt, retryFailed };
}
