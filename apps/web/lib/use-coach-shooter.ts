'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@shooting-platform/shared-types';
import { apiFetch } from './api';
import { useAuth } from '../contexts/auth-context';

const STORAGE_KEY = 'coach:selected-shooter-id';

export function useCoachShooter() {
  const { user, isLoading: authLoading } = useAuth();
  const isCoach = user?.role === 'COACH';

  const [shooters, setShooters] = useState<User[]>([]);
  const [selectedShooterId, setSelectedShooterIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSelectedShooterId = useCallback((id: string | null) => {
    setSelectedShooterIdState(id);
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshShooters = useCallback(async () => {
    if (!isCoach) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<User[]>('/coach/shooters');
      setShooters(data);

      const stored =
        typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const preferredId = selectedShooterId ?? stored;
      const validPreferred = preferredId && data.some((s) => s.id === preferredId)
        ? preferredId
        : data[0]?.id ?? null;

      setSelectedShooterId(validPreferred);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load shooters');
      setShooters([]);
      setSelectedShooterId(null);
    } finally {
      setLoading(false);
    }
  }, [isCoach, selectedShooterId, setSelectedShooterId]);

  useEffect(() => {
    if (!isCoach) {
      setShooters([]);
      setSelectedShooterId(null);
      return;
    }
    void refreshShooters();
  }, [isCoach, refreshShooters, setSelectedShooterId]);

  const selectedShooter = useMemo(
    () => shooters.find((s) => s.id === selectedShooterId) ?? null,
    [shooters, selectedShooterId],
  );

  return {
    isCoach,
    authLoading,
    shooters,
    selectedShooter,
    selectedShooterId,
    setSelectedShooterId,
    refreshShooters,
    loading,
    error,
  };
}
