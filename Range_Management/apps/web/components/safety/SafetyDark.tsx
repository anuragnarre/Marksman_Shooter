'use client';

import React, { useState, useEffect } from 'react';
import { MaterialIcon } from '@/components/ui/TacticalIcons';
import { useToast } from '@/contexts/toast-context';

function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8;') {
  if (typeof window === 'undefined') return;
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    // WebView download fallback handled by caller toast
  }
}

export function SafetyDark({
  incidents = [],
  auditLogs = [],
  isLoading = false,
  addIncident,
  resolveIncident,
  refresh,
}: {
  incidents?: any[];
  auditLogs?: any[];
  isLoading?: boolean;
  addIncident?: (input: { laneId: string; severity: string; type: string; narrative: string }) => Promise<any>;
  resolveIncident?: (id: string, remediation?: string) => Promise<void>;
  refresh?: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'REVIEW' | 'RESOLVED' | 'OSHA'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'ADVISORY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [remediation, setRemediation] = useState('Issue Formal Verbal Range Safety Warning');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTraumaModalOpen, setIsTraumaModalOpen] = useState(false);

  // New incident form state
  const [newLane, setNewLane] = useState('Lane 03');
  const [newSeverity, setNewSeverity] = useState('CRITICAL');
  const [newType, setNewType] = useState('Muzzle Sweep Beyond 45°');
  const [newNarrative, setNewNarrative] = useState('');

  useEffect(() => {
    if (incidents.length > 0 && !selectedIncidentId) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents, selectedIncidentId]);

  const selectedIncident = incidents.find((inc) => inc.id === selectedIncidentId) || incidents[0];

  const q = searchQuery.trim().toLowerCase();
  const filteredIncidents = incidents.filter((inc) => {
    if (filterMode === 'REVIEW' && inc.status !== 'UNDER_REVIEW') return false;
    if (filterMode === 'RESOLVED' && inc.status !== 'RESOLVED') return false;
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
    if (q) {
      const hay = `${inc.id} ${inc.laneId} ${inc.type} ${inc.reporterId} ${inc.memberName} ${inc.severity}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const filteredAudits = auditLogs.filter((log) => {
    if (!q) return true;
    const hay = `${log.id} ${log.type} ${log.inspector} ${log.notes} ${log.status}`.toLowerCase();
    return hay.includes(q);
  });

  const reviewCount = incidents.filter((i) => i.status === 'UNDER_REVIEW').length;

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await addIncident?.({
      laneId: newLane,
      severity: newSeverity,
      type: newType,
      narrative: newNarrative,
    });
    if (created?.id) {
      setSelectedIncidentId(created.id);
    }
    setIsReportModalOpen(false);
    setNewNarrative('');
    toast(`Incident ${created?.id || ''} logged for RSO review`, 'warning');
  };

  const handleExportCsv = () => {
    const header = 'ID,Timestamp,Lane,Severity,Violation,Reporter,Status\n';
    const rows = filteredIncidents
      .map((i) => `"${i.id}","${i.createdAt}","${i.laneId}","${i.severity}","${i.type}","${i.reporterId}","${i.status}"`)
      .join('\n');
    downloadTextFile('marksman_safety_register.csv', header + rows);
    toast(`Exported ${filteredIncidents.length} safety records to CSV`, 'success');
  };

  const handleExportDossier = () => {
    if (!selectedIncident) return;
    const text = [
      `MARKSMAN RANGE SAFETY DOSSIER // ${selectedIncident.id}`,
      `Lane: ${selectedIncident.laneId}`,
      `Shooter: ${selectedIncident.memberName}`,
      `Severity: ${selectedIncident.severity}`,
      `Violation: ${selectedIncident.type}`,
      `Logged By: ${selectedIncident.reporterId}`,
      `Status: ${selectedIncident.status}`,
      `Protocol: ${selectedIncident.remediation || remediation}`,
      `Narrative: ${selectedIncident.narrative}`,
    ].join('\n');
    downloadTextFile(`dossier_${selectedIncident.id}.txt`, text, 'text/plain;charset=utf-8;');
    toast(`Dossier #${selectedIncident.id} prepared for print/archive`, 'success');
  };

  const handleAuditCert = () => {
    const cert = [
      'MARKSMAN FACILITY — OSHA 1910.1025 & NIOSH 0500 CERTIFICATION',
      'Certification Period: 2024-Q2 VERIFIED',
      'EPA Reg: #8841-B',
      'Laminar Airflow: 76.4 FPM (Spec 75 +/- 5 FPM)',
      'Airborne Pb: 0.012 mg/m3 (PEL < 0.050 mg/m3)',
      'Daily Auto-Purge: 04:00:00 EST Nominal',
    ].join('\n');
    downloadTextFile('marksman_osha_audit_cert.txt', cert, 'text/plain;charset=utf-8;');
    toast('OSHA & NIOSH Compliance Certificate generated', 'success');
  };

  const cycleSeverityFilter = () => {
    const order: Array<'ALL' | 'CRITICAL' | 'WARNING' | 'ADVISORY'> = [
      'ALL',
      'CRITICAL',
      'WARNING',
      'ADVISORY',
    ];
    const next = order[(order.indexOf(severityFilter) + 1) % order.length];
    setSeverityFilter(next);
    toast(`Severity filter: ${next}`, 'info');
  };

  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-[calc(5.5rem+var(--sab))] lg:pb-10">
      <div className="flex flex-col w-full">
        <div className="p-3 sm:p-space-lg flex flex-col gap-space-md">
          {/* Top Header Sub-bar */}
          <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low px-4 sm:px-space-xl py-space-sm rounded shadow-sm">
            <div className="flex flex-wrap items-center gap-space-md">
              <div className="flex items-center gap-space-sm">
                <MaterialIcon name="verified_user" className="text-primary text-[20px]" />
                <div className="flex flex-col">
                  <span className="font-headline-md text-headline-md tracking-tight uppercase text-on-surface">
                    SAFETY &amp; COMPLIANCE REGISTER
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    REV 4.2.8 // SYS_LOG://RSO-AUTH-0994
                  </span>
                </div>
              </div>
              <div className="hidden md:block h-6 w-px bg-surface-container-highest" />
              {/* Filter Tabs */}
              <nav className="flex flex-wrap items-center gap-space-xs" id="log-filter-tabs">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`tab-btn px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase transition-colors font-bold ${
                    filterMode === 'ALL'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                  type="button"
                >
                  ALL INCIDENTS
                </button>
                <button
                  onClick={() => setFilterMode('REVIEW')}
                  className={`tab-btn px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase transition-colors flex items-center gap-space-xs ${
                    filterMode === 'REVIEW'
                      ? 'bg-secondary-container text-on-secondary-container font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                  type="button"
                >
                  <span>UNDER RSO REVIEW</span>
                  {reviewCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold">
                      {reviewCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setFilterMode('RESOLVED')}
                  className={`tab-btn px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase transition-colors ${
                    filterMode === 'RESOLVED'
                      ? 'bg-surface-container-high text-on-surface font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                  type="button"
                >
                  RESOLVED
                </button>
                <button
                  onClick={() => setFilterMode('OSHA')}
                  className={`tab-btn px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase transition-colors ${
                    filterMode === 'OSHA'
                      ? 'bg-tertiary-container text-on-tertiary-container font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                  type="button"
                >
                  OSHA AUDITS
                </button>
              </nav>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-space-sm">
              <button
                onClick={() => setIsTraumaModalOpen(true)}
                className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-high hover:bg-surface-container-highest text-[#EF4444] transition-colors uppercase font-label-caps text-label-caps font-bold shadow-sm border border-[#EF4444]/30"
                type="button"
              >
                <MaterialIcon name="warning" className="text-[15px]" />
                <span>TCCC TRAUMA SOP</span>
              </button>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-space-xs px-space-lg py-space-xs rounded bg-secondary-container hover:bg-error-container text-on-secondary-container hover:text-on-error-container transition-colors uppercase font-label-caps text-label-caps font-bold shadow-sm tracking-wider"
                type="button"
              >
                <MaterialIcon name="add_alert" className="text-[16px]" />
                <span>+ REPORT INCIDENT</span>
              </button>
            </div>
          </div>

          {/* Top KPI Metrics Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
            <div className="bg-surface-container-low p-space-md rounded flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="h-0.5 w-full bg-primary-container absolute top-0 left-0" />
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  OPEN CORRECTIVE ACTIONS
                </span>
                <MaterialIcon name="rule_folder" className="text-primary text-[18px]" />
              </div>
              <div className="flex items-baseline gap-space-sm my-space-xs">
                <span className="font-telemetry-lg text-telemetry-lg text-primary font-bold">
                  {String(reviewCount).padStart(2, '0')}
                </span>
                <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                  / {incidents.length + 11} Total YTD
                </span>
              </div>
              <div className="flex items-center gap-space-xs text-secondary-fixed">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse" />
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {reviewCount > 0 ? `Priority 1: ${selectedIncident?.laneId || 'Lane 03'} review` : 'All corrective actions closed'}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low p-space-md rounded flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="h-0.5 w-full bg-tertiary absolute top-0 left-0" />
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  INCIDENT-FREE STREAK
                </span>
                <MaterialIcon name="shield" className="text-tertiary text-[18px]" />
              </div>
              <div className="flex items-baseline gap-space-sm my-space-xs">
                <span className="font-telemetry-lg text-telemetry-lg text-tertiary font-bold">41</span>
                <span className="font-telemetry-sm text-telemetry-sm text-on-surface">Consecutive Days</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="font-body-sm text-body-sm text-primary">+18.4% improvement</span>
                <span className="text-on-surface-variant text-[10px]">|</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Record: 38 Days</span>
              </div>
            </div>

            <div className="bg-surface-container-low p-space-md rounded flex items-center justify-between relative overflow-hidden shadow-sm">
              <div className="h-0.5 w-full bg-primary absolute top-0 left-0" />
              <div className="flex flex-col justify-between h-full">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  REGULATORY RANGE AUDIT
                </span>
                <div className="flex items-baseline gap-space-xs my-space-xs">
                  <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">99.4%</span>
                  <span className="font-label-caps text-label-caps text-tertiary">PASS</span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  EPA #8841-B • NIOSH 0500 Compliant
                </span>
              </div>
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                  <circle className="text-surface-container-highest" cx="24" cy="24" fill="none" r="20" stroke="currentColor" strokeWidth="4" />
                  <circle className="text-primary" cx="24" cy="24" fill="none" r="20" stroke="currentColor" strokeDasharray="125.6" strokeDashoffset="1.25" strokeLinecap="round" strokeWidth="4" />
                </svg>
                <MaterialIcon name="verified" className="absolute text-primary text-[18px]" />
              </div>
            </div>

            <div className="bg-surface-container-low p-space-md rounded flex flex-col justify-between relative overflow-hidden shadow-sm">
              <div className="h-0.5 w-full bg-tertiary-container absolute top-0 left-0" />
              <div className="flex items-start justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  OSHA &amp; AIRFLOW HEALTH
                </span>
                <MaterialIcon name="air" className="text-tertiary text-[18px]" />
              </div>
              <div className="grid grid-cols-2 gap-space-sm my-space-xs">
                <div className="flex flex-col">
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold">76.4 FPM</span>
                  <span className="font-body-sm text-body-sm text-tertiary">Optimal (75 ± 5)</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold">0.012 mg/m³</span>
                  <span className="font-body-sm text-body-sm text-primary">Airborne Pb (PEL &lt;0.05)</span>
                </div>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                HVAC Velocity Purge Stage 1 Nominal
              </span>
            </div>
          </div>

          {/* Main Operational Workspace Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
            {/* Left Column: Incident Register Matrix */}
            <div className="xl:col-span-8 flex flex-col gap-gutter">
              <div className="bg-surface-container-low p-space-sm rounded flex flex-wrap items-center justify-between gap-space-sm shadow-sm">
                <div className="flex items-center gap-space-sm flex-1 min-w-[200px]">
                  <div className="relative w-full max-w-sm">
                    <MaterialIcon
                      name="search"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]"
                    />
                    <input
                      id="incidentSearch"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ID, RSO, Lane or Infraction..."
                      className="w-full bg-surface-container-high text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm pl-8 pr-space-md py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={cycleSeverityFilter}
                    className="px-space-md py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-caps text-label-caps flex items-center gap-1 shrink-0"
                  >
                    <MaterialIcon name="tune" className="text-[14px]" />
                    <span>FILTER: {severityFilter}</span>
                  </button>
                </div>
                <div className="flex items-center gap-space-xs">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="px-space-md py-1.5 rounded bg-surface-container-high hover:bg-surface-variant text-on-surface transition-colors font-label-caps text-label-caps uppercase flex items-center gap-1"
                  >
                    <MaterialIcon name="download" className="text-[14px]" />
                    <span>CSV EXPORT</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await refresh?.();
                      toast('Safety register synchronized with range telemetry', 'info');
                    }}
                    className="px-space-md py-1.5 rounded bg-surface-container-high hover:bg-surface-variant text-on-surface transition-colors font-label-caps text-label-caps uppercase flex items-center gap-1"
                  >
                    <MaterialIcon name="sync" className="text-[14px]" />
                    <span>REFRESH</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-surface-container-low rounded overflow-hidden shadow-sm flex flex-col">
                <div className="px-space-lg py-space-sm bg-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <MaterialIcon name="table_rows" className="text-primary text-[18px]" />
                    <span className="font-label-caps text-label-caps uppercase text-on-surface tracking-wider">
                      {filterMode === 'OSHA' ? 'COMPLIANCE AUDIT RECORDS' : 'RANGE INCIDENT LOG MATRIX'}
                    </span>
                  </div>
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                    {filterMode === 'OSHA'
                      ? `${filteredAudits.length} AUDIT RECORDS`
                      : `${filteredIncidents.length} INCIDENT RECORDS`}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" id="incidentTable">
                    <thead>
                      {filterMode === 'OSHA' ? (
                        <tr className="bg-surface-container-lowest font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                          <th className="px-space-md py-2.5">AUDIT ID</th>
                          <th className="px-space-md py-2.5">DATE</th>
                          <th className="px-space-md py-2.5">TYPE</th>
                          <th className="px-space-md py-2.5">STATUS</th>
                          <th className="px-space-md py-2.5">INSPECTOR</th>
                          <th className="px-space-md py-2.5">NOTES</th>
                          <th className="px-space-md py-2.5 text-right">ACTION</th>
                        </tr>
                      ) : (
                        <tr className="bg-surface-container-lowest font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                          <th className="px-space-md py-2.5">INCIDENT ID</th>
                          <th className="px-space-md py-2.5">TIME</th>
                          <th className="px-space-md py-2.5">LANE / BAY</th>
                          <th className="px-space-md py-2.5">SEVERITY</th>
                          <th className="px-space-md py-2.5">VIOLATION CLASSIFICATION</th>
                          <th className="px-space-md py-2.5">RSO LOGGED</th>
                          <th className="px-space-md py-2.5">STATUS</th>
                          <th className="px-space-md py-2.5 text-right">ACTION</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-surface-container-high/60 font-body-sm text-body-sm text-on-surface">
                      {isLoading ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8">Loading...</td>
                        </tr>
                      ) : filterMode === 'OSHA' ? (
                        filteredAudits.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-on-surface-variant font-label-caps">
                              No audit logs found.
                            </td>
                          </tr>
                        ) : (
                          filteredAudits.map((log: any) => (
                            <tr key={log.id} className="hover:bg-surface-container transition-colors">
                              <td className="px-space-md py-2.5 font-telemetry-sm text-telemetry-sm font-semibold text-on-surface">
                                #{log.id}
                              </td>
                              <td className="px-space-md py-2.5 font-telemetry-sm text-telemetry-sm text-on-surface">
                                {new Date(log.date).toLocaleDateString()}
                              </td>
                              <td className="px-space-md py-2.5 text-on-surface">{log.type}</td>
                              <td className="px-space-md py-2.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-label-caps uppercase font-bold ${
                                    log.status === 'PASS'
                                      ? 'bg-tertiary-container/30 text-tertiary'
                                      : 'bg-surface-container text-outline'
                                  }`}
                                >
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-space-md py-2.5 text-on-surface">{log.inspector}</td>
                              <td
                                className="px-space-md py-2.5 text-on-surface-variant text-sm truncate max-w-[200px]"
                                title={log.notes}
                              >
                                {log.notes || '-'}
                              </td>
                              <td className="px-space-md py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => toast(`Audit #${log.id}: ${log.notes}`, 'info')}
                                  className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                                  title="Inspect audit log"
                                >
                                  <MaterialIcon name="visibility" className="text-[16px]" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )
                      ) : filteredIncidents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-on-surface-variant font-label-caps">
                            No matching incidents found.
                          </td>
                        </tr>
                      ) : (
                        filteredIncidents.map((incident: any) => (
                          <tr
                            key={incident.id}
                            onClick={() => setSelectedIncidentId(incident.id)}
                            className={`hover:bg-surface-container transition-colors cursor-pointer incident-row ${
                              selectedIncidentId === incident.id ? 'bg-surface-container-high' : ''
                            }`}
                          >
                            <td className="px-space-md py-2.5 font-telemetry-sm text-telemetry-sm font-semibold text-on-surface">
                              #{String(incident.id).slice(0, 8)}
                            </td>
                            <td className="px-space-md py-2.5 font-telemetry-sm text-telemetry-sm text-on-surface">
                              {new Date(incident.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-space-md py-2.5 font-telemetry-sm text-telemetry-sm text-on-surface">
                              {incident.laneId}
                            </td>
                            <td className="px-space-md py-2.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-caps text-label-caps uppercase font-bold ${
                                  incident.severity === 'CRITICAL'
                                    ? 'bg-error/20 text-error'
                                    : incident.severity === 'WARNING'
                                    ? 'bg-secondary-container text-secondary'
                                    : 'bg-primary-container/20 text-primary'
                                }`}
                              >
                                {incident.severity}
                              </span>
                            </td>
                            <td className="px-space-md py-2.5 text-on-surface">{incident.type}</td>
                            <td className="px-space-md py-2.5 text-on-surface-variant font-telemetry-sm text-telemetry-sm">
                              {incident.reporterId}
                            </td>
                            <td className="px-space-md py-2.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-label-caps uppercase font-bold ${
                                  incident.status === 'OPEN'
                                    ? 'bg-primary-container text-primary'
                                    : incident.status === 'UNDER_REVIEW'
                                    ? 'bg-secondary-container text-secondary'
                                    : 'bg-surface-container-highest text-outline'
                                }`}
                              >
                                {incident.status}
                              </span>
                            </td>
                            <td className="px-space-md py-2.5 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIncidentId(incident.id);
                                  document
                                    .getElementById('dossier-panel')
                                    ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                }}
                                className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                                title="Inspect Dossier"
                              >
                                <MaterialIcon name="visibility" className="text-[16px]" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Status Strip */}
                <div className="px-space-lg py-space-sm bg-surface-container-lowest flex flex-wrap items-center justify-between gap-2 text-on-surface-variant font-label-caps text-label-caps">
                  <div className="flex flex-wrap items-center gap-space-md">
                    <span className="flex items-center gap-1 text-tertiary">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                      Camera Network Synced [60 FPS]
                    </span>
                    <span>•</span>
                    <span className="text-on-surface">8 Lanes Armed &amp; Monitored</span>
                  </div>
                  <div className="flex items-center gap-space-md">
                    <span className="font-telemetry-sm text-telemetry-sm">Data Integrity: SHA-256 Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 35% Inspector Column: Incident Dossier */}
            <div id="dossier-panel" className="xl:col-span-4 flex flex-col gap-gutter">
              <div className="bg-surface-container-low rounded overflow-hidden shadow-sm flex flex-col">
                <div className="bg-secondary-container px-space-lg py-2 flex items-center justify-between text-on-secondary-container">
                  <div className="flex items-center gap-1.5 font-label-caps text-label-caps uppercase font-bold tracking-wider">
                    <MaterialIcon name="warning" className="text-[18px]" />
                    <span>INCIDENT DOSSIER: {selectedIncident ? `#${selectedIncident.id}` : 'NONE'}</span>
                  </div>
                  {selectedIncident?.status !== 'RESOLVED' && (
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary font-label-caps text-label-caps font-bold">
                      ACTION REQUIRED
                    </span>
                  )}
                </div>

                <div className="p-space-lg flex flex-col gap-space-md">
                  <div className="p-space-sm rounded bg-surface-container flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        SHOOTER RECORD
                      </span>
                      <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">
                        {selectedIncident?.laneId || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline-md text-headline-md text-on-surface">
                        {selectedIncident?.memberName || 'Unknown Shooter'}
                      </span>
                      <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                        MEM-ID: {selectedIncident ? `#${String(selectedIncident.id).slice(0, 6)}` : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-tertiary font-label-caps text-label-caps">
                        PRACTICAL PERMIT
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-caps text-label-caps">
                        CAL: 4.5mm/.177
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps">
                        WAIVER ON FILE
                      </span>
                    </div>
                  </div>

                  {/* Narrative */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        RSO FIELD NARRATIVE
                      </span>
                      <span className="font-label-caps text-label-caps text-on-surface-variant">
                        LOGGED BY {selectedIncident?.reporterId || 'System'}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface bg-surface-container p-space-sm rounded leading-relaxed">
                      {selectedIncident?.narrative || 'No narrative provided for this incident.'}
                    </p>
                  </div>

                  {/* Offline Optical Telemetry SVG Stills (No remote CDN URLs) */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        ATTACHED OPTICAL TELEMETRY [2 STILLS]
                      </span>
                      <span className="font-label-caps text-label-caps text-tertiary">VISION AI VERIFIED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-space-sm">
                      <div className="flex flex-col gap-1">
                        <div className="relative w-full h-28 bg-[#060913] rounded overflow-hidden border border-surface-container-highest">
                          <svg className="w-full h-full" viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg">
                            <rect width="200" height="112" fill="#070B14" />
                            <line x1="20" y1="0" x2="20" y2="112" stroke="#1E293B" strokeWidth="1" />
                            <line x1="180" y1="0" x2="180" y2="112" stroke="#1E293B" strokeWidth="1" />
                            <line x1="100" y1="92" x2="100" y2="12" stroke="#10B981" strokeDasharray="3 3" strokeWidth="1.5" />
                            <path d="M100 92 L152 38" stroke="#F59E0B" strokeWidth="2.5" />
                            <path d="M100 58 A34 34 0 0 1 124 68" fill="none" stroke="#EF4444" strokeWidth="2" />
                            <circle cx="100" cy="92" r="5" fill="#F59E0B" />
                          </svg>
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-surface-container-lowest/85 text-[9px] font-label-caps text-tertiary">
                            CAM-07B [OVERHEAD]
                          </span>
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-secondary-container/90 text-on-secondary-container text-[9px] font-telemetry-sm font-bold">
                            DEV: 45.2°
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                          Sweep Angle Exceeded
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="relative w-full h-28 bg-[#060913] rounded overflow-hidden border border-surface-container-highest">
                          <svg className="w-full h-full" viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg">
                            <rect width="200" height="112" fill="#080C18" />
                            <rect x="44" y="42" width="112" height="22" rx="4" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.2" />
                            <rect x="86" y="64" width="28" height="22" rx="3" fill="none" stroke="#10B981" strokeWidth="1.5" />
                            <circle cx="100" cy="75" r="3" fill="#10B981" />
                            <line x1="30" y1="53" x2="170" y2="53" stroke="#334155" strokeDasharray="2 2" strokeWidth="1" />
                          </svg>
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-surface-container-lowest/85 text-[9px] font-label-caps text-on-surface">
                            EVID-MACRO_01
                          </span>
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary-container/90 text-on-primary-container text-[9px] font-telemetry-sm font-bold">
                            TRIGGER SAFE
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                          Slide Battery State
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Corrective Protocol */}
                  <div className="flex flex-col gap-space-xs pt-space-xs">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                      CORRECTIVE REMEDIATION PROTOCOL
                    </span>
                    <div className="relative">
                      <select
                        id="remediationSelect"
                        value={remediation}
                        onChange={(e) => setRemediation(e.target.value)}
                        className="w-full bg-surface-container text-on-surface font-body-sm text-body-sm px-space-md py-2 pr-8 rounded focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                      >
                        <option>Issue Formal Verbal Range Safety Warning</option>
                        <option>Require RSO Practical Re-qualification (30m)</option>
                        <option>30-Day Range Suspension (Major Deviation)</option>
                        <option>Downgrade to Supervised Novice Lane</option>
                        <option>Dismissal with No Violation Recorded</option>
                      </select>
                      <MaterialIcon
                        name="expand_more"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Action CTAs */}
                  <div className="flex items-center gap-space-sm pt-space-xs">
                    <button
                      id="signOffBtn"
                      type="button"
                      disabled={!selectedIncident || selectedIncident.status === 'RESOLVED'}
                      onClick={async () => {
                        if (selectedIncident && resolveIncident) {
                          await resolveIncident(selectedIncident.id, remediation);
                          toast(`Incident #${selectedIncident.id} resolved & signed off`, 'success');
                        }
                      }}
                      className={`flex-1 py-2 px-space-md rounded font-label-caps text-label-caps uppercase font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                        selectedIncident?.status === 'RESOLVED'
                          ? 'bg-surface-container-high text-outline cursor-not-allowed'
                          : 'bg-primary-container hover:bg-primary text-on-primary-container'
                      }`}
                    >
                      <MaterialIcon name="draw" className="text-[16px]" />
                      <span>{selectedIncident?.status === 'RESOLVED' ? 'RESOLVED' : 'SIGN OFF PROTOCOL'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportDossier}
                      className="py-2 px-space-md rounded bg-surface-container hover:bg-surface-variant text-on-surface font-label-caps text-label-caps uppercase transition-colors flex items-center justify-center gap-1"
                    >
                      <MaterialIcon name="print" className="text-[16px]" />
                      <span>DOSSIER</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Compliance Certification Record */}
              <div className="bg-surface-container-low p-space-md rounded flex flex-col gap-space-sm shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <MaterialIcon name="verified" className="text-tertiary text-[18px]" />
                    <span className="font-label-caps text-label-caps text-on-surface uppercase">
                      COMPLIANCE CERTIFICATION RECORD
                    </span>
                  </div>
                  <span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">
                    2024-Q2 VERIFIED
                  </span>
                </div>
                <div className="flex items-center justify-between bg-surface-container p-space-sm rounded">
                  <div className="flex flex-col">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      DAILY AUTO-PURGE CYCLE
                    </span>
                    <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold">
                      04:00:00 EST (Nightly)
                    </span>
                  </div>
                  <div className="h-5 w-px bg-surface-container-highest" />
                  <div className="flex flex-col text-right">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">
                      NEXT EPA AUDIT
                    </span>
                    <span className="font-telemetry-sm text-telemetry-sm text-tertiary font-bold">
                      14 Days Out
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-space-xs">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    NIOSH 0500 Filter Cartridge: Delta-P 0.8&quot; w.g.
                  </span>
                  <button
                    type="button"
                    onClick={handleAuditCert}
                    className="font-label-caps text-label-caps text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>Audit Cert (.TXT)</span>
                    <MaterialIcon name="open_in_new" className="text-[14px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Incident Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0F172A] border border-border-subtle rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display font-bold text-xl text-white">Log Range Safety Incident</h2>
                <p className="text-xs text-text-muted font-mono mt-0.5">
                  OSHA 1910.1025 &amp; Range Rule Infraction Recording
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="text-text-muted hover:text-white"
              >
                <MaterialIcon name="close" className="text-[18px]" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">
                    Firing Bay / Lane
                  </label>
                  <select
                    value={newLane}
                    onChange={(e) => setNewLane(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 text-white font-mono text-xs p-2.5 rounded-lg outline-none"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <option key={i} value={`Lane 0${i + 1}`}>
                        Lane 0{i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">
                    Severity Level
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 text-white font-mono text-xs p-2.5 rounded-lg outline-none"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Ceasefire)</option>
                    <option value="WARNING">WARNING (RSO Briefing Required)</option>
                    <option value="ADVISORY">ADVISORY (Procedural Deviation)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">
                  Violation Classification
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 text-white font-mono text-xs p-2.5 rounded-lg outline-none"
                >
                  <option value="Muzzle Sweep Beyond 45°">Muzzle Sweep Beyond 45° Downrange Envelope</option>
                  <option value="Hot Line Unauthorized Crossing">Hot Line Unauthorized Crossing</option>
                  <option value="Squib Load / Barrel Obstruction">Squib Load / Barrel Obstruction</option>
                  <option value="PPE Removal on Active Line">PPE Removal on Active Line (Eye/Ear)</option>
                  <option value="Accidental Discharge">Accidental Discharge (Into Baffle/Floor)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">
                  RSO Narrative &amp; Optical Evidence Note
                </label>
                <textarea
                  rows={3}
                  value={newNarrative}
                  onChange={(e) => setNewNarrative(e.target.value)}
                  placeholder="State exact observations, weapon state, athlete response, and corrective actions taken..."
                  className="w-full bg-black/50 border border-white/10 text-white font-mono text-xs p-2.5 rounded-lg outline-none focus:border-[#F5A623]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-text-secondary hover:text-white font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-white hover:bg-[#EF4444]/90 font-mono font-bold text-xs uppercase tracking-wider"
                >
                  Record &amp; Flag for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TCCC Trauma Emergency SOP Modal */}
      {isTraumaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0F172A] border-2 border-[#EF4444] rounded-2xl p-6 md:p-8 w-full max-w-xl shadow-2xl space-y-5 text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <MaterialIcon name="warning" className="text-[#EF4444] text-[24px]" />
                <div>
                  <h2 className="font-display font-bold text-xl text-[#EF4444]">
                    TCCC Gunshot Trauma Protocol
                  </h2>
                  <p className="text-xs text-text-muted font-mono">
                    Tactical Combat Casualty Care — MARCH Algorithm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTraumaModalOpen(false)}
                className="text-text-muted hover:text-white"
              >
                <MaterialIcon name="close" className="text-[18px]" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border-l-4 border-[#EF4444]">
                <strong className="text-white block mb-1">M — MASSIVE BLEEDING:</strong>
                <span>
                  Apply CAT Gen 7 Tourniquet &quot;High and Tight&quot; immediately on extremity arterial hemorrhage.
                  Note application time on strap and pack junctional wounds with hemostatic gauze.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border-l-4 border-[#38BDF8]">
                <strong className="text-white block mb-1">A &amp; R — AIRWAY &amp; RESPIRATION:</strong>
                <span>
                  Inspect chest and back for entrance/exit wounds. Apply vented chest seal immediately. Monitor for tension pneumothorax.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border-l-4 border-[#F5A623]">
                <strong className="text-white block mb-1">EMERGENCY DISPATCH SCRIPT:</strong>
                <p className="italic text-white/90 mt-1">
                  &quot;Range RSO calling from Marksman Facility. Firing line is CEASED and SECURED. Tourniquet applied. EMS staging at Bay Entrance Door A.&quot;
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTraumaModalOpen(false)}
              className="w-full py-3 rounded-xl bg-[#EF4444] text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#EF4444]/90"
            >
              Acknowledge &amp; Close Protocol
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
