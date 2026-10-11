'use client';

// hooks/useOfflineData.ts
// Generic offline-aware data hook.
// Renders from IndexedDB immediately, then refreshes from the API concurrently.

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, ApiError } from '../lib/api';

export interface UseOfflineDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
  refetch: () => void;
}

export function useOfflineData<T>(
  path: string,
  /** Dexie fetch — runs immediately before the network call */
  dbFetch: () => Promise<T | null>,
  deps: unknown[] = [],
): UseOfflineDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);

    // 1. Render cached data immediately for instant perceived performance
    try {
      const cached = await dbFetch();
      if (cached !== null && mountedRef.current) {
        setData(cached);
        setIsFromCache(true);
        setLoading(false);
      }
    } catch {
      // IndexedDB read failed — continue to network
    }

    // 2. Fetch fresh from API
    try {
      const fresh = await apiFetch<T>(path);
      if (mountedRef.current) {
        setData(fresh);
        setIsFromCache(false);
        setLoading(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;

      if (err instanceof ApiError && err.message === 'offline:no-cache') {
        // Offline and no cached data
        setError('You are offline and no cached data is available.');
      } else if (err instanceof ApiError && err.status === 0) {
        // Other offline error — keep showing cached data
        if (data === null) setError('Unable to load data while offline.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load data.');
      }
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, isFromCache, refetch: load };
}
