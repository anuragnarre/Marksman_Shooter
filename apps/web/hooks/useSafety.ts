import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export interface IncidentRecord {
  id: string;
  createdAt: string;
  laneId?: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  type: string;
  reporterId: string;
  status: 'OPEN' | 'RESOLVED' | 'UNDER_REVIEW';
  memberName?: string;
  narrative?: string;
}

export interface AuditLog {
  id: string;
  date: string;
  type: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  inspector: string;
  notes?: string;
}

export interface SafetyState {
  incidents: IncidentRecord[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  resolveIncident: (id: string) => Promise<void>;
  refetch: () => void;
}

const MOCK_INCIDENTS: IncidentRecord[] = [
  {
    id: 'INC-2024-884',
    createdAt: new Date().toISOString(),
    laneId: 'Lane 07',
    severity: 'CRITICAL',
    type: 'Sweep Angle Exceeded',
    reporterId: 'RSO-1 (Miller)',
    status: 'OPEN',
    memberName: 'Tyler Vance',
    narrative: 'During reload sequence at target carrier 15yd mark, shooter swept left shooting stall partition at ~45° horizontal angle with slide forward. Automated optical beam trip fired safety trigger. Lane 07 halted by RSO-1.',
  },
  {
    id: 'INC-2024-885',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    laneId: 'Lane 02',
    severity: 'WARNING',
    type: 'Eye Protection Missing',
    reporterId: 'System',
    status: 'UNDER_REVIEW',
    memberName: 'J. Smith',
  },
  {
    id: 'INC-2024-886',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    laneId: 'Bay-B',
    severity: 'INFO',
    type: 'Rapid Fire Limit',
    reporterId: 'RSO-2 (Davis)',
    status: 'RESOLVED',
    memberName: 'A. Johnson',
  },
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    date: new Date().toISOString(),
    type: 'OSHA Airflow Compliance',
    status: 'PASS',
    inspector: 'Sys-Auto',
    notes: '76.4 FPM. Delta-P 0.8" w.g.',
  },
  {
    id: 'AUD-002',
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    type: 'EPA Lead Abatement',
    status: 'PASS',
    inspector: 'Gov-Inspector',
  }
];

export function useSafety(): SafetyState {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [incidentsRes, logsRes] = await Promise.allSettled([
        apiFetch<IncidentRecord[]>('/safety/incidents'),
        apiFetch<AuditLog[]>('/safety/audit-logs'),
      ]);

      if (incidentsRes.status === 'fulfilled' && incidentsRes.value?.length) {
        setIncidents(incidentsRes.value);
      } else {
        setIncidents(MOCK_INCIDENTS);
      }

      if (logsRes.status === 'fulfilled' && logsRes.value?.length) {
        setAuditLogs(logsRes.value);
      } else {
        setAuditLogs(MOCK_AUDIT_LOGS);
      }
    } catch (err) {
      setError('Failed to load safety data');
      setIncidents(MOCK_INCIDENTS);
      setAuditLogs(MOCK_AUDIT_LOGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resolveIncident = async (id: string) => {
    try {
      // Optimistic update
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'RESOLVED' } : inc));
      
      // Attempt API call (will fail if no backend, but state remains updated for demo)
      await apiFetch(`/safety/incidents/${id}/resolve`, { method: 'POST' });
    } catch (error) {
      console.warn("API not available, mock resolution applied.");
    }
  };

  return {
    incidents,
    auditLogs,
    isLoading,
    error,
    resolveIncident,
    refetch: fetchData,
  };
}
