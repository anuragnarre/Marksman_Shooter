'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export interface SafetyIncident {
  id: string;
  laneId: string;
  laneNumber: number;
  severity: 'CRITICAL' | 'WARNING' | 'ADVISORY' | string;
  type: string;
  narrative: string;
  description: string;
  reporterId: string;
  memberName: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | string;
  createdAt: string;
  timestamp: string;
  remediation?: string;
}

export interface SafetyAuditLog {
  id: string;
  date: string;
  type: string;
  status: string;
  inspector: string;
  notes: string;
}

function normalizeIncident(raw: any): SafetyIncident {
  const iso = raw?.createdAt || raw?.timestamp || new Date().toISOString();
  const rawLane = raw?.laneId || (raw?.laneNumber ? `Lane 0${raw.laneNumber}` : 'Lane 01');
  const laneNum = Number(raw?.laneNumber ?? String(rawLane).replace(/\D/g, '')) || 1;
  const rawSev = String(raw?.severity || 'WARNING').toUpperCase();
  const severity =
    rawSev === 'HIGH' ? 'CRITICAL' : rawSev === 'MEDIUM' ? 'WARNING' : rawSev === 'LOW' ? 'ADVISORY' : rawSev;
  const narrative = String(raw?.narrative || raw?.description || 'Observed range boundary deviation.');

  return {
    id: String(raw?.id ?? `INC-${Date.now().toString().slice(-4)}`),
    laneId: String(rawLane),
    laneNumber: laneNum,
    severity,
    type: String(raw?.type || 'Range Safety Infraction'),
    narrative,
    description: narrative,
    reporterId: String(raw?.reporterId || 'RSO-Miller'),
    memberName: String(raw?.memberName || (laneNum === 3 ? 'Marcus Vance' : 'D. Kowalski')),
    status: String(raw?.status || 'UNDER_REVIEW'),
    createdAt: iso,
    timestamp: iso,
    remediation: raw?.remediation,
  };
}

function normalizeAuditLog(raw: any): SafetyAuditLog {
  const iso = raw?.date || raw?.timestamp || new Date().toISOString();
  return {
    id: String(raw?.id ?? `AUD-${Date.now().toString().slice(-4)}`),
    date: iso,
    type: String(raw?.type || raw?.action || 'OSHA Ventilation & Trap Check'),
    status: String(raw?.status || 'PASS'),
    inspector: String(raw?.inspector || raw?.officer || 'RSO Miller'),
    notes: String(raw?.notes || raw?.details || 'NIOSH 0500 particulate check within limit.'),
  };
}

const DEFAULT_INCIDENTS: SafetyIncident[] = [
  normalizeIncident({
    id: 'INC-4091',
    laneId: 'Lane 03',
    laneNumber: 3,
    severity: 'CRITICAL',
    type: 'Muzzle Sweep Beyond 45°',
    narrative: 'Firearm pointed outside safe downrange arc during magazine reload transition. Instant ceasefire called by RSO.',
    reporterId: 'RSO-Miller',
    memberName: 'Marcus Vance',
    status: 'UNDER_REVIEW',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  }),
  normalizeIncident({
    id: 'INC-4088',
    laneId: 'Lane 07',
    laneNumber: 7,
    severity: 'WARNING',
    type: 'PPE Compliance — Eye Pro Removed',
    narrative: 'Shooter briefly removed ballistic eyewear behind bench while bay was still hot. Verbal safety correction issued.',
    reporterId: 'RSO-Vance',
    memberName: 'J. Morales',
    status: 'UNDER_REVIEW',
    createdAt: new Date(Date.now() - 4200000).toISOString(),
  }),
  normalizeIncident({
    id: 'INC-4082',
    laneId: 'Lane 02',
    laneNumber: 2,
    severity: 'ADVISORY',
    type: 'Carrier Travel Jam',
    narrative: 'Target retriever pulley tripped optical stall sensor at 10m marker. Carrier re-tensioned and cleared.',
    reporterId: 'Tech-Ops-01',
    memberName: 'Elena Rostova',
    status: 'RESOLVED',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  }),
];

const DEFAULT_AUDIT_LOGS: SafetyAuditLog[] = [
  normalizeAuditLog({
    id: 'AUD-8841',
    date: new Date(Date.now() - 7200000).toISOString(),
    type: 'Laminar Airflow & PEL Check',
    status: 'PASS',
    inspector: 'RSO Miller',
    notes: '76.4 FPM laminar flow • Airborne Pb 0.012 mg/m3 (PEL < 0.050).',
  }),
  normalizeAuditLog({
    id: 'AUD-8839',
    date: new Date(Date.now() - 86400000).toISOString(),
    type: 'HEPA Bank & Purge Verification',
    status: 'PASS',
    inspector: 'C. Vance (RSO-1)',
    notes: 'NIOSH 0500 filter Delta-P 0.8 in. w.g. Auto-purge cycle verified.',
  }),
];

export function useSafety() {
  const [incidents, setIncidents] = useState<SafetyIncident[]>(DEFAULT_INCIDENTS);
  const [auditLogs, setAuditLogs] = useState<SafetyAuditLog[]>(DEFAULT_AUDIT_LOGS);
  const [isLoading, setIsLoading] = useState(false);

  const loadSafety = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any[]>('/safety/incidents');
      if (Array.isArray(data) && data.length > 0) {
        setIncidents(data.map(normalizeIncident));
      }
    } catch {
      // Retain normalized demo records when offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSafety();
  }, [loadSafety]);

  const addIncident = useCallback(async (input: {
    laneId: string;
    severity: string;
    type: string;
    narrative: string;
    memberName?: string;
  }) => {
    const newInc = normalizeIncident({
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      laneId: input.laneId,
      severity: input.severity,
      type: input.type,
      narrative:
        input.narrative.trim() ||
        'Observed deviation from safe downrange envelope. RSO commanded ceasefire.',
      reporterId: 'RSO-Field-Station',
      status: 'UNDER_REVIEW',
      memberName: input.memberName || 'Lane Occupant',
    });

    try {
      await apiFetch('/safety/incidents', {
        method: 'POST',
        body: JSON.stringify(newInc),
      });
    } catch {}

    setIncidents((prev) => [newInc, ...prev]);
    return newInc;
  }, []);

  const resolveIncident = useCallback(async (id: string, remediation?: string) => {
    try {
      await apiFetch(`/safety/incidents/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ remediation }),
      });
    } catch {}
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: 'RESOLVED', remediation: remediation || i.remediation } : i,
      ),
    );
  }, []);

  return {
    incidents,
    auditLogs,
    isLoading,
    addIncident,
    resolveIncident,
    refresh: loadSafety,
  };
}
