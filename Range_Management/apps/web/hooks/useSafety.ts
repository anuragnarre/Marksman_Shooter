'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export function useSafety() {
  const [incidents, setIncidents] = useState<any[]>([
    {
      id: 'inc-1',
      laneNumber: 3,
      severity: 'HIGH',
      type: 'Muzzle Sweep',
      description: 'Firearm pointed outside safe downrange arc during reload',
      status: 'UNDER_REVIEW',
      timestamp: new Date().toISOString()
    },
    {
      id: 'inc-2',
      laneNumber: 7,
      severity: 'MEDIUM',
      type: 'PPE Compliance',
      description: 'Shooter removed eye protection while hot line active',
      status: 'RESOLVED',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ]);
  const [auditLogs, setAuditLogs] = useState<any[]>([
    {
      id: 'log-1',
      action: 'Emergency Ceasefire Initiated',
      officer: 'RSO Miller',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: 'Lane 4 clearance verification completed'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadSafety() {
      try {
        const data = await apiFetch<any[]>('/safety/incidents');
        if (data && data.length > 0) setIncidents(data);
      } catch {}
    }
    loadSafety();
  }, []);

  const resolveIncident = async (id: string) => {
    try {
      await apiFetch(`/safety/incidents/${id}/resolve`, { method: 'POST' });
    } catch {}
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'RESOLVED' } : i));
  };

  return { incidents, auditLogs, isLoading, resolveIncident };
}
