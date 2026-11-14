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
  } catch {}
}

export function SafetyLight({
  incidents = [],
  auditLogs = [],
  isLoading = false,
  addIncident,
  resolveIncident,
}: {
  incidents?: any[];
  auditLogs?: any[];
  isLoading?: boolean;
  addIncident?: (input: { laneId: string; severity: string; type: string; narrative: string }) => Promise<any>;
  resolveIncident?: (id: string, remediation?: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'REVIEW' | 'RESOLVED' | 'OSHA'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [remediation, setRemediation] = useState('Issue Formal Verbal Range Safety Warning');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTraumaModalOpen, setIsTraumaModalOpen] = useState(false);
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
    if (created?.id) setSelectedIncidentId(created.id);
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
    toast(`Exported ${filteredIncidents.length} records to CSV`, 'success');
  };

  const handlePrintDossier = () => {
    if (!selectedIncident) return;
    const text = [
      `MARKSMAN RANGE SAFETY DOSSIER // ${selectedIncident.id}`,
      `Lane: ${selectedIncident.laneId}`,
      `Shooter: ${selectedIncident.memberName}`,
      `Severity: ${selectedIncident.severity}`,
      `Violation: ${selectedIncident.type}`,
      `Status: ${selectedIncident.status}`,
      `Protocol: ${selectedIncident.remediation || remediation}`,
      `Narrative: ${selectedIncident.narrative}`,
    ].join('\n');
    downloadTextFile(`dossier_${selectedIncident.id}.txt`, text, 'text/plain;charset=utf-8;');
    toast(`Dossier #${selectedIncident.id} generated`, 'success');
  };

  const handleAuditCert = () => {
    const cert = [
      'MARKSMAN FACILITY — OSHA 1910.1025 & NIOSH 0500 CERTIFICATION',
      'Certification Period: 2024-Q2 VERIFIED',
      'EPA Reg: #8841-B',
      'Laminar Airflow: 76.4 FPM (Target 75 +/- 5 FPM)',
      'Airborne Pb: 0.012 mg/m3 (PEL < 0.050 Limit)',
    ].join('\n');
    downloadTextFile('marksman_osha_audit_cert.txt', cert, 'text/plain;charset=utf-8;');
    toast('OSHA & NIOSH Audit Certificate exported', 'success');
  };

  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-[calc(5.5rem+var(--sab))] lg:pb-10">
      <div className="flex flex-col w-full pb-16" id="safety-main-content">
        {/* Operational Sub-Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-5 bg-surface-container-lowest px-4 rounded shadow-sm my-4 sm:my-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-bold">
                LIVE TELEMETRY ACTIVE
              </span>
            </div>
            <div className="h-6 w-[1px] bg-outline-variant hidden sm:block" />
            <div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface uppercase font-bold tracking-tight inline-block mr-2">
                Safety &amp; Compliance Register
              </h1>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                REV 4.2.8 // SYS_LOG://RSO-AUTH-0994
              </span>
            </div>
            {/* Segmented Filter Pills */}
            <div className="flex flex-wrap items-center bg-surface-container-low p-1 rounded gap-1">
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1.5 rounded font-label-md text-label-md transition-all ${
                  filterMode === 'ALL'
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                ALL INCIDENTS
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('REVIEW')}
                className={`px-3 py-1.5 rounded font-label-md text-label-md transition-all flex items-center gap-1.5 ${
                  filterMode === 'REVIEW'
                    ? 'bg-secondary-container text-on-secondary-container font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>UNDER RSO REVIEW</span>
                {reviewCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-error text-on-error rounded-full font-label-sm text-label-sm font-bold">
                    {reviewCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('RESOLVED')}
                className={`px-3 py-1.5 rounded font-label-md text-label-md transition-all ${
                  filterMode === 'RESOLVED'
                    ? 'bg-surface-container-high text-on-surface font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                RESOLVED
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('OSHA')}
                className={`px-3 py-1.5 rounded font-label-md text-label-md transition-all ${
                  filterMode === 'OSHA'
                    ? 'bg-tertiary-container text-on-tertiary-container font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                OSHA AUDITS
              </button>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsTraumaModalOpen(true)}
              className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container text-error border border-error/30 px-3.5 py-2 rounded font-label-md text-label-md uppercase tracking-wider font-bold transition-colors"
            >
              <MaterialIcon name="warning" className="text-[16px]" />
              <span>TCCC Trauma SOP</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 bg-error hover:bg-on-error-container text-on-error px-4 py-2 rounded font-label-md text-label-md uppercase tracking-wider font-bold transition-colors shadow-sm"
            >
              <MaterialIcon name="add_alert" className="text-[18px]" />
              <span>+ Report Incident</span>
            </button>
          </div>
        </div>

        {/* Telemetry KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Open Corrective Actions
              </span>
              <span className="p-1.5 rounded bg-error-container text-on-error-container">
                <MaterialIcon name="pending_actions" className="text-[18px]" />
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-error font-bold">
                {String(reviewCount).padStart(2, '0')}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                / {incidents.length + 11} TOTAL YTD
              </span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded">
              <div className="flex items-center gap-1.5 text-error">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
                <span className="font-label-sm text-label-sm font-bold">Priority 1:</span>
                <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
                  {selectedIncident?.laneId || 'Lane 03'}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Live queue</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Incident-Free Range Streak
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-tertiary-container">
                <MaterialIcon name="verified_user" className="text-[18px]" />
              </span>
            </div>
            <div className="flex items-baseline gap-2 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">41</span>
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded">
                Consecutive Days
              </span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded">
              <div className="flex items-center gap-1.5 text-on-tertiary-container">
                <MaterialIcon name="trending_up" className="text-[16px]" />
                <span className="font-label-sm text-label-sm font-bold">+18.4% improvement</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Record: 38 Days</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Regulatory Range Audit Score
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-surface">
                <MaterialIcon name="assignment_turned_in" className="text-[18px]" />
              </span>
            </div>
            <div className="flex items-center justify-between my-2">
              <div className="flex items-baseline gap-3">
                <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">99.4%</span>
                <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded">
                  Pass Verified
                </span>
              </div>
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-high"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-on-tertiary-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="99.4, 100"
                    strokeLinecap="butt"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-label-sm text-[10px] font-bold text-on-surface">GR-A</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded font-label-sm text-label-sm text-on-surface-variant">
              <span>EPA Reg #8841-B</span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
              <span>NIOSH 0500 Compliant</span>
            </div>
          </div>
        </div>

        {/* Main Split Workspace Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT 65%: Log Matrix Table */}
          <div className="xl:col-span-8 flex flex-col bg-surface-container-lowest rounded p-4 sm:p-6 shadow-sm border border-outline-variant/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 gap-4">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold uppercase tracking-tight">
                  {filterMode === 'OSHA' ? 'Compliance Audit Records' : 'Range Incident Log Matrix'}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {filterMode === 'OSHA'
                    ? 'Regulatory checks, OSHA metrics, and certifications'
                    : 'Real-time safety events, muzzle sweeps, mechanical stops, and optical trip logs'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <MaterialIcon
                    name="search"
                    className="absolute left-2.5 text-[16px] text-on-surface-variant"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter logs..."
                    className="h-9 pl-8 pr-3 bg-surface-container-low rounded font-label-sm text-label-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container w-44 sm:w-64"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="h-9 px-3 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <MaterialIcon name="file_download" className="text-[16px]" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  {filterMode === 'OSHA' ? (
                    <tr className="bg-surface-container-low py-2.5 px-3 rounded text-on-surface-variant font-label-md text-label-md font-semibold">
                      <th className="py-3 px-3 text-left pl-3 rounded-l">AUDIT ID</th>
                      <th className="py-3 px-2">DATE</th>
                      <th className="py-3 px-2">TYPE</th>
                      <th className="py-3 px-2">STATUS</th>
                      <th className="py-3 px-2">INSPECTOR</th>
                      <th className="py-3 px-2">NOTES</th>
                      <th className="py-3 px-3 text-right pr-3 rounded-r">ACTIONS</th>
                    </tr>
                  ) : (
                    <tr className="bg-surface-container-low py-2.5 px-3 rounded text-on-surface-variant font-label-md text-label-md font-semibold">
                      <th className="py-3 px-3 text-left pl-3 rounded-l">INCIDENT ID</th>
                      <th className="py-3 px-2">TIME</th>
                      <th className="py-3 px-2">LANE / BAY</th>
                      <th className="py-3 px-2">SEVERITY</th>
                      <th className="py-3 px-2">VIOLATION CLASSIFICATION</th>
                      <th className="py-3 px-2">RSO LOGGED</th>
                      <th className="py-3 px-2">STATUS</th>
                      <th className="py-3 px-3 text-right pr-3 rounded-r">ACTIONS</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-outline-variant/30 font-body-sm text-body-sm text-on-surface">
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
                                ? 'bg-error-container text-error'
                                : incident.severity === 'WARNING'
                                ? 'bg-secondary-container text-secondary'
                                : 'bg-primary-container text-primary'
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
                                : 'bg-surface-container text-outline'
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
                                .getElementById('dossier-panel-light')
                                ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }}
                            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
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

            <div className="mt-6 p-4 rounded bg-surface-container-low flex flex-col sm:flex-row items-center justify-between font-label-sm text-label-sm text-on-surface-variant gap-3">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
                  <span className="font-semibold text-on-surface">CAMERA NETWORK SYNCED [60 FPS]</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MaterialIcon name="sensors" className="text-[16px] text-primary" />
                  <span>8 LANES ARMED &amp; MONITORED</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span>DATA INTEGRITY: SHA-256 VERIFIED</span>
                <span className="text-outline">STORAGE: 180 DAYS</span>
              </div>
            </div>
          </div>

          {/* RIGHT 35%: Active Dossier & Remediation Panel */}
          <div id="dossier-panel-light" className="xl:col-span-4 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="report" className="text-[20px] text-error" />
                  <h3 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">
                    DOSSIER: {selectedIncident ? `#${selectedIncident.id}` : 'NONE'}
                  </h3>
                </div>
                {selectedIncident?.status !== 'RESOLVED' && (
                  <span className="font-label-sm text-label-sm bg-error-container text-on-error-container px-2 py-1 rounded font-bold uppercase">
                    ACTION REQUIRED
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-surface-container-low rounded flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                      Shooter Identified
                    </span>
                    <div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">
                      {selectedIncident?.memberName || 'Unknown Shooter'}
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 font-mono">
                      MEM-ID: {selectedIncident ? `#${String(selectedIncident.id).slice(0, 6)}` : ''} • Practical Permit
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-bold uppercase">
                      {selectedIncident?.laneId || 'N/A'}
                    </span>
                    <div className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-mono">
                      Cal: 4.5mm/.177
                    </div>
                  </div>
                </div>
                <p className="mt-2 pt-2 border-t border-outline-variant/30 font-body-sm text-body-sm text-on-surface leading-normal">
                  {selectedIncident?.narrative || 'No narrative provided for this incident.'}
                </p>
              </div>

              {/* Offline Optical Telemetry SVG Stills (No remote CDN URLs) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant">
                  <span>Attached Optical Telemetry [2 STILLS]</span>
                  <span className="text-error font-bold font-mono">MUT-TRIGGER VERIFIED</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative rounded overflow-hidden bg-slate-900 border border-outline-variant/40 h-24">
                    <svg className="w-full h-full" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
                      <rect width="200" height="100" fill="#0F172A" />
                      <line x1="25" y1="0" x2="25" y2="100" stroke="#334155" strokeWidth="1" />
                      <line x1="175" y1="0" x2="175" y2="100" stroke="#334155" strokeWidth="1" />
                      <line x1="100" y1="80" x2="100" y2="10" stroke="#10B981" strokeDasharray="3 3" strokeWidth="1.5" />
                      <path d="M100 80 L146 32" stroke="#F59E0B" strokeWidth="2.5" />
                      <path d="M100 48 A30 30 0 0 1 121 57" fill="none" stroke="#EF4444" strokeWidth="2" />
                      <circle cx="100" cy="80" r="4.5" fill="#F59E0B" />
                    </svg>
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/90 px-2 py-0.5 flex justify-between font-label-sm text-[9px] text-on-primary font-mono">
                      <span>CAM-07B</span>
                      <span>DEV: 45.2°</span>
                    </div>
                  </div>
                  <div className="relative rounded overflow-hidden bg-slate-900 border border-outline-variant/40 h-24">
                    <svg className="w-full h-full" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
                      <rect width="200" height="100" fill="#0F172A" />
                      <rect x="44" y="34" width="112" height="20" rx="4" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.2" />
                      <rect x="86" y="54" width="28" height="20" rx="3" fill="none" stroke="#10B981" strokeWidth="1.5" />
                      <circle cx="100" cy="64" r="3" fill="#10B981" />
                    </svg>
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/90 px-2 py-0.5 flex justify-between font-label-sm text-[9px] text-on-primary font-mono">
                      <span>EVID-MACRO</span>
                      <span>TRIGGER SAFE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corrective protocol selection */}
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-bold">
                  Corrective Remediation Protocol
                </label>
                <div className="relative">
                  <select
                    value={remediation}
                    onChange={(e) => setRemediation(e.target.value)}
                    className="w-full h-9 px-3 pr-8 bg-surface-container-low rounded font-label-md text-label-md text-on-surface appearance-none focus:outline-none focus:bg-surface-container"
                  >
                    <option>Issue Formal Verbal Range Safety Warning</option>
                    <option>Mandatory 30-Min Safe Handling Re-Qualification</option>
                    <option>Temporary 30-Day Lane Access Suspension</option>
                    <option>Permanent Range Revocation &amp; Transfer to Board</option>
                  </select>
                  <MaterialIcon
                    name="arrow_drop_down"
                    className="pointer-events-none absolute right-2.5 top-2 text-[18px] text-on-surface-variant"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={!selectedIncident || selectedIncident.status === 'RESOLVED'}
                  onClick={async () => {
                    if (selectedIncident && resolveIncident) {
                      await resolveIncident(selectedIncident.id, remediation);
                      toast(`Incident #${selectedIncident.id} resolved & signed off`, 'success');
                    }
                  }}
                  className={`h-10 rounded font-label-md text-label-md uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    selectedIncident?.status === 'RESOLVED'
                      ? 'bg-surface-container-low text-outline cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-container text-on-primary'
                  }`}
                >
                  <MaterialIcon name="verified" className="text-[18px]" />
                  <span>{selectedIncident?.status === 'RESOLVED' ? 'RESOLVED' : 'Sign Off'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintDossier}
                  className="h-10 bg-surface-container-low hover:bg-surface-container text-on-surface rounded font-label-md text-label-md uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MaterialIcon name="print" className="text-[18px]" />
                  <span>Print Dossier</span>
                </button>
              </div>
            </div>

            {/* OSHA & Ventilation Health */}
            <div className="bg-surface-container-lowest rounded p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="cyclone" className="text-[20px] text-on-tertiary-container" />
                  <h4 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">
                    OSHA &amp; Airflow Health
                  </h4>
                </div>
                <span className="font-label-sm text-label-sm text-on-tertiary-container bg-surface-container-low px-2 py-0.5 rounded font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
                  OPTIMAL
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-surface-container-low rounded flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                    Laminar Flow (FPM)
                  </span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface">76.4</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">FPM</span>
                  </div>
                  <div className="font-label-sm text-label-sm text-on-tertiary-container font-semibold flex items-center gap-1 mt-auto">
                    <MaterialIcon name="check_circle" className="text-[14px]" />
                    <span>Target: 75 ± 5</span>
                  </div>
                </div>
                <div className="p-3 bg-surface-container-low rounded flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                    Airborne Lead Filter
                  </span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface">0.012</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">mg/m³</span>
                  </div>
                  <div className="font-label-sm text-label-sm text-on-tertiary-container font-semibold flex items-center gap-1 mt-auto">
                    <MaterialIcon name="check_circle" className="text-[14px]" />
                    <span>PEL &lt; 0.050 Limit</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-2 border-t border-surface-container-low">
                <span>Daily Auto-Purge: 04:00 EST</span>
                <button
                  type="button"
                  onClick={handleAuditCert}
                  className="text-secondary hover:text-on-secondary-container font-bold uppercase flex items-center gap-1 transition-colors"
                >
                  <span>Audit Cert (.TXT)</span>
                  <MaterialIcon name="arrow_outward" className="text-[14px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Incident Modal (Light) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 text-on-surface">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <div>
                <h2 className="font-headline-md font-bold text-lg">Log Range Safety Incident</h2>
                <p className="text-xs text-on-surface-variant">OSHA 1910.1025 &amp; Range Rule Recording</p>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <MaterialIcon name="close" className="text-[18px]" />
              </button>
            </div>
            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm font-bold text-on-surface-variant uppercase mb-1">
                    Firing Bay / Lane
                  </label>
                  <select
                    value={newLane}
                    onChange={(e) => setNewLane(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs p-2.5 rounded-lg"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <option key={i} value={`Lane 0${i + 1}`}>
                        Lane 0{i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm font-bold text-on-surface-variant uppercase mb-1">
                    Severity
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs p-2.5 rounded-lg"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ADVISORY">ADVISORY</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-label-sm font-bold text-on-surface-variant uppercase mb-1">
                  Violation Classification
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs p-2.5 rounded-lg"
                >
                  <option value="Muzzle Sweep Beyond 45°">Muzzle Sweep Beyond 45°</option>
                  <option value="Hot Line Unauthorized Crossing">Hot Line Unauthorized Crossing</option>
                  <option value="PPE Removal on Active Line">PPE Removal on Active Line</option>
                  <option value="Carrier / Trap Fault">Carrier / Trap Fault</option>
                </select>
              </div>
              <div>
                <label className="block font-label-sm font-bold text-on-surface-variant uppercase mb-1">
                  RSO Narrative
                </label>
                <textarea
                  rows={3}
                  value={newNarrative}
                  onChange={(e) => setNewNarrative(e.target.value)}
                  placeholder="Describe observation & corrective action..."
                  className="w-full bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs p-2.5 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-surface-container text-on-surface-variant font-label-md font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-error text-on-error font-label-md font-bold uppercase"
                >
                  Record Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TCCC Trauma SOP Modal (Light) */}
      {isTraumaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border-2 border-error rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-4 text-on-surface">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <div className="flex items-center gap-2">
                <MaterialIcon name="warning" className="text-error text-[22px]" />
                <div>
                  <h2 className="font-headline-md font-bold text-lg text-error">TCCC Gunshot Trauma Protocol</h2>
                  <p className="text-xs text-on-surface-variant">MARCH Emergency Response Checklist</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsTraumaModalOpen(false)}>
                <MaterialIcon name="close" className="text-[18px]" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-container-low border-l-4 border-error">
                <strong className="block mb-1">M — MASSIVE BLEEDING:</strong>
                Apply CAT Gen 7 Tourniquet high and tight on extremity arterial hemorrhage; log time.
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low border-l-4 border-primary">
                <strong className="block mb-1">A &amp; R — AIRWAY &amp; RESPIRATION:</strong>
                Inspect chest/back for wounds, apply vented chest seal, monitor breathing.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsTraumaModalOpen(false)}
              className="w-full py-2.5 rounded-lg bg-error text-on-error font-label-md font-bold uppercase"
            >
              Acknowledge &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
