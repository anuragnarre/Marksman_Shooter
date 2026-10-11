import React, { useState, useEffect } from 'react';

export function SafetyDark({ incidents = [], auditLogs = [], isLoading = false, resolveIncident }: { incidents?: any[], auditLogs?: any[], isLoading?: boolean, resolveIncident?: (id: string) => Promise<void> }) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'REVIEW' | 'RESOLVED' | 'OSHA'>('ALL');
  const [localIncidents, setLocalIncidents] = useState<any[]>(incidents);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTraumaModalOpen, setIsTraumaModalOpen] = useState(false);
  const [isPurgeActive, setIsPurgeActive] = useState(false);

  // New incident form state
  const [newLane, setNewLane] = useState('Lane 03');
  const [newSeverity, setNewSeverity] = useState('CRITICAL');
  const [newType, setNewType] = useState('Muzzle Sweep Beyond 45°');
  const [newNarrative, setNewNarrative] = useState('');

  useEffect(() => {
    if (incidents.length > 0) {
      setLocalIncidents(incidents);
      if (!selectedIncidentId) setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents]);

  const activeIncidents = localIncidents.length > 0 ? localIncidents : incidents;
  const selectedIncident = activeIncidents.find(inc => inc.id === selectedIncidentId) || activeIncidents[0];
  
  const filteredIncidents = activeIncidents.filter(inc => {
    if (filterMode === 'REVIEW') return inc.status === 'UNDER_REVIEW';
    if (filterMode === 'RESOLVED') return inc.status === 'RESOLVED';
    return true;
  });

  const reviewCount = activeIncidents.filter(i => i.status === 'UNDER_REVIEW').length;

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const newInc = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      laneId: newLane,
      severity: newSeverity,
      type: newType,
      narrative: newNarrative || 'Observed deviation from safe downrange envelope. RSO commanded ceasefire.',
      reporterId: 'RSO-Field-Station',
      status: 'UNDER_REVIEW',
      memberName: 'Lane Occupant',
    };
    setLocalIncidents(prev => [newInc, ...prev]);
    setSelectedIncidentId(newInc.id);
    setIsReportModalOpen(false);
    setNewNarrative('');
  };

  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-10">
      <div className="flex flex-col w-full">
<div className="p-space-lg flex flex-col gap-space-md">
{/* Top Header Sub-bar */}
<div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-low px-space-xl py-space-sm rounded shadow-sm">
<div className="flex items-center gap-space-lg">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
<div className="flex flex-col">
<span className="font-headline-md text-headline-md tracking-tight uppercase text-on-surface">SAFETY &amp; COMPLIANCE REGISTER</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">REV 4.2.8 // SYS_LOG://RSO-AUTH-0994</span>
</div>
</div>
<div className="h-6 w-px bg-surface-container-highest" />
{/* Filter Tabs */}
<nav className="flex items-center gap-space-xs" id="log-filter-tabs">
<button onClick={() => setFilterMode('ALL')} className={`tab-btn px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase transition-colors font-bold ${filterMode === 'ALL' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`} type="button">ALL INCIDENTS</button>
<button onClick={() => setFilterMode('REVIEW')} className={`tab-btn px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase transition-colors flex items-center gap-space-xs ${filterMode === 'REVIEW' ? 'bg-secondary-container text-on-secondary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`} type="button">
<span>UNDER RSO REVIEW</span>
{reviewCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-error text-on-error text-[10px] font-bold">{reviewCount}</span>}
</button>
<button onClick={() => setFilterMode('RESOLVED')} className={`tab-btn px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase transition-colors ${filterMode === 'RESOLVED' ? 'bg-surface-container-high text-on-surface font-bold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`} type="button">RESOLVED</button>
<button onClick={() => setFilterMode('OSHA')} className={`tab-btn px-space-md py-space-xs rounded font-label-caps text-label-caps uppercase transition-colors ${filterMode === 'OSHA' ? 'bg-tertiary-container text-on-tertiary-container font-bold' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`} type="button">OSHA AUDITS</button>
</nav>
</div>
{/* Action Buttons */}
<div className="flex items-center gap-space-sm">
<button onClick={() => setIsTraumaModalOpen(true)} className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-high hover:bg-surface-container-highest text-[#EF4444] transition-colors uppercase font-label-caps text-label-caps font-bold shadow-sm border border-[#EF4444]/30" type="button">
  <span>🚑 TCCC TRAUMA SOP</span>
</button>
<button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-space-xs px-space-lg py-space-xs rounded bg-secondary-container hover:bg-error-container text-on-secondary-container hover:text-on-error-container transition-colors uppercase font-label-caps text-label-caps font-bold shadow-sm tracking-wider" type="button">
<span className="material-symbols-outlined text-[16px]">add_alert</span>
          + REPORT INCIDENT
</button>
</div>
</div>
{/* Top KPI Metrics Strip (4 cards) */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
{/* Card 1 */}
<div className="bg-surface-container-low p-space-md rounded flex flex-col justify-between relative overflow-hidden shadow-sm">
<div className="h-0.5 w-full bg-primary-container absolute top-0 left-0" />
<div className="flex items-start justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">OPEN CORRECTIVE ACTIONS</span>
<span className="material-symbols-outlined text-primary text-[18px]">rule_folder</span>
</div>
<div className="flex items-baseline gap-space-sm my-space-xs">
<span className="font-telemetry-lg text-telemetry-lg text-primary font-bold">02</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">/ 14 Total YTD</span>
</div>
<div className="flex items-center gap-space-xs text-secondary-fixed">
<span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse" />
<span className="font-body-sm text-body-sm text-on-surface-variant truncate">Priority 1: Pending Lane L-07 review</span>
</div>
</div>
{/* Card 2 */}
<div className="bg-surface-container-low p-space-md rounded flex flex-col justify-between relative overflow-hidden shadow-sm">
<div className="h-0.5 w-full bg-tertiary absolute top-0 left-0" />
<div className="flex items-start justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">INCIDENT-FREE STREAK</span>
<span className="material-symbols-outlined text-tertiary text-[18px]">shield</span>
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
{/* Card 3 */}
<div className="bg-surface-container-low p-space-md rounded flex items-center justify-between relative overflow-hidden shadow-sm">
<div className="h-0.5 w-full bg-primary absolute top-0 left-0" />
<div className="flex flex-col justify-between h-full">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">REGULATORY RANGE AUDIT</span>
<div className="flex items-baseline gap-space-xs my-space-xs">
<span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">99.4%</span>
<span className="font-label-caps text-label-caps text-tertiary">PASS</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">EPA #8841-B • NIOSH 0500 Compliant</span>
</div>
{/* Progress Ring SVG */}
<div className="relative w-14 h-14 flex items-center justify-center">
<svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
<circle className="text-surface-container-highest" cx="24" cy="24" fill="none" r="20" stroke="currentColor" strokeWidth="4" />
<circle className="text-primary" cx="24" cy="24" fill="none" r="20" stroke="currentColor" strokeDasharray="125.6" strokeDashoffset="1.25" strokeLinecap="round" strokeWidth="4" />
</svg>
<span className="absolute material-symbols-outlined text-primary text-[18px]">verified</span>
</div>
</div>
{/* Card 4 */}
<div className="bg-surface-container-low p-space-md rounded flex flex-col justify-between relative overflow-hidden shadow-sm">
<div className="h-0.5 w-full bg-tertiary-container absolute top-0 left-0" />
<div className="flex items-start justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">OSHA &amp; AIRFLOW HEALTH</span>
<span className="material-symbols-outlined text-tertiary text-[18px]">air</span>
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
<span className="font-body-sm text-body-sm text-on-surface-variant truncate">HVAC Velocity Purge Stage 1 Nominal</span>
</div>
</div>
{/* Main Operational Workspace Grid (65% / 35%) */}
<div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
{/* Left 65% Column: Incident Register Matrix */}
<div className="xl:col-span-8 flex flex-col gap-gutter">
{/* Controls & Search */}
<div className="bg-surface-container-low p-space-sm rounded flex flex-wrap items-center justify-between gap-space-sm shadow-sm">
<div className="flex items-center gap-space-sm flex-1 min-w-[240px]">
<div className="relative w-full max-w-sm">
<span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
<input className="w-full bg-surface-container-high text-on-surface placeholder:text-on-surface-variant font-body-sm text-body-sm pl-8 pr-space-md py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-primary" id="incidentSearch" placeholder="Search ID, RSO, Lane or Infraction..." type="text"/>
</div>
<div className="flex items-center gap-space-xs">
<button className="px-space-md py-1.5 rounded bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-caps text-label-caps flex items-center gap-1" type="button">
<span className="material-symbols-outlined text-[14px]">tune</span>
                FILTER
              </button>
</div>
</div>
<div className="flex items-center gap-space-xs">
<button className="px-space-md py-1.5 rounded bg-surface-container-high hover:bg-surface-variant text-on-surface transition-colors font-label-caps text-label-caps uppercase flex items-center gap-1" type="button">
<span className="material-symbols-outlined text-[14px]">download</span>
              CSV EXPORT
            </button>
<button className="px-space-md py-1.5 rounded bg-surface-container-high hover:bg-surface-variant text-on-surface transition-colors font-label-caps text-label-caps uppercase flex items-center gap-1" type="button">
<span className="material-symbols-outlined text-[14px]">sync</span>
              REFRESH
            </button>
</div>
</div>
{/* Table Container */}
<div className="bg-surface-container-low rounded overflow-hidden shadow-sm flex flex-col">
<div className="px-space-lg py-space-sm bg-surface-container flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-primary text-[18px]">table_rows</span>
<span className="font-label-caps text-label-caps uppercase text-on-surface tracking-wider">
  {filterMode === 'OSHA' ? 'COMPLIANCE AUDIT RECORDS' : 'RANGE INCIDENT LOG MATRIX'}
</span>
</div>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">
  {filterMode === 'OSHA' ? `${auditLogs.length} AUDIT RECORDS` : `${filteredIncidents.length} INCIDENT RECORDS`}
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
      <th className="px-space-md py-2.5">TIME (EST)</th>
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
            <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
          ) : filterMode === 'OSHA' ? (
            auditLogs.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-on-surface-variant font-label-caps">No audit logs found.</td></tr>
            ) : auditLogs.map((log: any) => (
              <tr key={log.id} className="hover:bg-surface-container transition-colors">
                <td className="px-space-md py-2.5 font-telemetry-sm text-telemetry-sm font-semibold text-on-surface">
                  #{log.id}
                </td>
                <td className="px-space-md py-2.5 font-telemetry-sm text-telemetry-sm text-on-surface">
                  {new Date(log.date).toLocaleDateString()}
                </td>
                <td className="px-space-md py-2.5 text-on-surface">
                  {log.type}
                </td>
                <td className="px-space-md py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-label-caps uppercase font-bold ${log.status === 'PASS' ? 'bg-tertiary-container/30 text-tertiary' : 'bg-surface-container text-outline'}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-space-md py-2.5 text-on-surface">
                  {log.inspector}
                </td>
                <td className="px-space-md py-2.5 text-on-surface-variant text-sm truncate max-w-[200px]" title={log.notes}>
                  {log.notes || '-'}
                </td>
                <td className="px-space-md py-2.5 text-right">
                  <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface" type="button">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                  </button>
                </td>
              </tr>
            ))
          ) : filteredIncidents.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-8 text-on-surface-variant font-label-caps">No active incidents found.</td></tr>
          ) : (
            filteredIncidents.map((incident: any) => (
              <tr key={incident.id} onClick={() => setSelectedIncidentId(incident.id)} className={`hover:bg-surface-container transition-colors cursor-pointer incident-row ${selectedIncidentId === incident.id ? 'bg-surface-container-high' : ''}`}>
                <td className="px-space-md py-2.5 font-telemetry-sm text-telemetry-sm font-semibold text-on-surface">
                  #{incident.id.slice(0,8)}
                </td>
                <td className="px-space-md py-2.5 font-telemetry-sm text-telemetry-sm text-on-surface">
                  {new Date(incident.createdAt).toLocaleTimeString()}
                </td>
                <td className="px-space-md py-2.5 font-telemetry-sm text-telemetry-sm text-on-surface">
                  {incident.laneId || 'N/A'}
                </td>
                <td className="px-space-md py-2.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-caps text-label-caps uppercase font-bold ${incident.severity === 'CRITICAL' ? 'bg-error/20 text-error' : incident.severity === 'WARNING' ? 'bg-secondary-container text-secondary' : 'bg-primary-container/20 text-primary'}`}>
                    {incident.severity || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-space-md py-2.5 text-on-surface">
                  {incident.type || 'Infraction'}
                </td>
                <td className="px-space-md py-2.5 text-on-surface-variant font-telemetry-sm text-telemetry-sm">
                  {incident.reporterId || 'System'}
                </td>
                <td className="px-space-md py-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-label-caps uppercase font-bold ${incident.status === 'OPEN' ? 'bg-primary-container text-primary' : incident.status === 'UNDER_REVIEW' ? 'bg-secondary-container text-secondary' : 'bg-surface-container-highest text-outline'}`}>
                    {incident.status || 'OPEN'}
                  </span>
                </td>
                <td className="px-space-md py-2.5 text-right">
                  <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface" type="button">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                  </button>
                </td>
              </tr>
            ))
          )}
</tbody>
</table>
</div>
{/* Bottom Status Strip */}
<div className="px-space-lg py-space-sm bg-surface-container-lowest flex flex-wrap items-center justify-between text-on-surface-variant font-label-caps text-label-caps">
<div className="flex items-center gap-space-md">
<span className="flex items-center gap-1 text-tertiary">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                Camera Network Synced [60 FPS]
              </span>
<span>•</span>
<span className="text-on-surface">24 Lanes Armed &amp; Monitored</span>
</div>
<div className="flex items-center gap-space-md">
<span className="font-telemetry-sm text-telemetry-sm">Data Integrity: SHA-256 Verified</span>
<span>•</span>
<span>Storage: 180 Days Retained</span>
</div>
</div>
</div>
</div>
{/* Right 35% Inspector Column: Incident Dossier */}
<div className="xl:col-span-4 flex flex-col gap-gutter">
{/* Incident Dossier Card */}
<div className="bg-surface-container-low rounded overflow-hidden shadow-sm flex flex-col">
{/* Action Required Banner */}
<div className="bg-secondary-container px-space-lg py-2 flex items-center justify-between text-on-secondary-container">
<div className="flex items-center gap-1.5 font-label-caps text-label-caps uppercase font-bold tracking-wider">
<span className="material-symbols-outlined text-[18px]">warning</span>
<span>INCIDENT DOSSIER: {selectedIncident ? `#${selectedIncident.id}` : 'NONE SELECTED'}</span>
</div>
{selectedIncident?.status !== 'RESOLVED' && (
<span className="px-1.5 py-0.5 rounded bg-surface-container-lowest text-primary font-label-caps text-label-caps font-bold">ACTION REQUIRED</span>
)}
</div>
<div className="p-space-lg flex flex-col gap-space-md">
{/* Shooter Identified Summary */}
<div className="p-space-sm rounded bg-surface-container flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">SHOOTER RECORD</span>
<span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">{selectedIncident?.laneId || 'N/A'}</span>
</div>
<div className="flex items-center justify-between">
<span className="font-headline-md text-headline-md text-on-surface">{selectedIncident?.memberName || 'Unknown Shooter'}</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">MEM-ID: {selectedIncident ? `#${selectedIncident.id.slice(0, 5)}` : ''}</span>
</div>
<div className="flex items-center gap-space-sm pt-space-xs">
<span className="px-2 py-0.5 rounded bg-surface-container-high text-tertiary font-label-caps text-label-caps">PRACTICAL PERMIT</span>
<span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-caps text-label-caps">CAL: 9x19mm</span>
<span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps">WAIVER ON FILE (2024)</span>
</div>
</div>
{/* Incident Narrative */}
<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">RSO FIELD NARRATIVE</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">LOGGED BY {selectedIncident?.reporterId || 'System'}</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface bg-surface-container p-space-sm rounded leading-relaxed">
                {selectedIncident?.narrative || 'No narrative provided for this incident.'}
              </p>
</div>
{/* Attached Optical Telemetry [2 Stills] */}
<div className="flex flex-col gap-space-xs">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">ATTACHED OPTICAL TELEMETRY [2 STILLS]</span>
<span className="font-label-caps text-label-caps text-tertiary">VISION AI VERIFIED</span>
</div>
<div className="grid grid-cols-2 gap-space-sm">
{/* Frame 1 */}
<div className="flex flex-col gap-1">
<div className="relative w-full h-28 bg-surface-container-highest rounded overflow-hidden">
<img className="w-full h-full object-cover opacity-80" data-alt="High-contrast surveillance camera view from overhead an indoor shooting range lane looking down at shooter at firing line. Amber target grid lines and laser safety warning trajectory angle overlay showing 45 degree weapon deflection angle toward stall divider." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmbLWOHzOH5Chza5xj0n_RqgGaUm_MK0NlmNAbwx3aXH9ddr59hwDLnXBLsswmLKMscGBAVm4XT25_WXfLapZ6CkgY4ZoQ5106avvLFqpFdERMI1YJaWozbjnB_pdL-XWIk8LlJ4cCLKACXRshB1yB0Iv9gr5e9YNDhP0F0lLHufJ9qFDlupbsuzxgJqfKUiUwoRU4rhSv_1MvyVljyBMl5oqe5Ko8zrSHVW6UtJhHq8y-dlWl7MHg"/>
<span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-surface-container-lowest/80 text-[10px] font-label-caps text-tertiary">CAM-07B [Overhead]</span>
<span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-secondary-container/90 text-on-secondary-container text-[10px] font-telemetry-sm font-bold">DEV: 45.2°</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant truncate">Sweep Angle Exceeded</span>
</div>
{/* Frame 2 */}
<div className="flex flex-col gap-1">
<div className="relative w-full h-28 bg-surface-container-highest rounded overflow-hidden">
<img className="w-full h-full object-cover opacity-80" data-alt="Macro close-up optical camera capture of pistol slide and trigger assembly in tactical firing stall. High resolution safety visual frame showing weapon slide forward and finger outside trigger guard in dark indoor range lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuiQDlHxRxCwIzk_AvT4ekjDkdwPK_GFVJvUQJkYbkZv08mrW39YT_akJvu5Ygx4CVgYtRdSbqQod0njM2wgIIB-rdMVtqql1VFcWSzFkZcZj607Dp4y-iP84ChnPJG9WslEjJp1-jo4HhNx_GNpmUegyR-iawld3txYTPaXTx5v85ovc2njqeNtEWe2iNB0ncTjXb6YyNpUxrzQGH71-Jx1Ixaxg1PjY5Cs_QWT-qumxAoVeMy-qv"/>
<span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-surface-container-lowest/80 text-[10px] font-label-caps text-on-surface">EVID-MACRO_01</span>
<span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-primary-container/90 text-on-primary-container text-[10px] font-telemetry-sm font-bold">TRIGGER SAFE</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant truncate">Slide Battery State</span>
</div>
</div>
</div>
{/* Corrective Remediation Protocol */}
<div className="flex flex-col gap-space-xs pt-space-xs">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">CORRECTIVE REMEDIATION PROTOCOL</span>
<div className="relative">
<select className="w-full bg-surface-container text-on-surface font-body-sm text-body-sm px-space-md py-2 rounded focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer" id="remediationSelect">
<option>Issue Formal Verbal Range Safety Warning</option>
<option>Require RSO Practical Re-qualification (30m)</option>
<option>30-Day Range Suspension (Major Deviation)</option>
<option>Downgrade to Supervised Novice Lane</option>
<option>Dismissal with No Violation Recorded</option>
</select>
<span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">expand_more</span>
</div>
</div>
{/* Action CTAs */}
<div className="flex items-center gap-space-sm pt-space-xs">
<button 
  disabled={!selectedIncident || selectedIncident.status === 'RESOLVED'}
  onClick={() => {
    if (selectedIncident && resolveIncident) {
      resolveIncident(selectedIncident.id);
    }
  }}
  className={`flex-1 py-2 px-space-md rounded font-label-caps text-label-caps uppercase font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm ${selectedIncident?.status === 'RESOLVED' ? 'bg-surface-container-high text-outline cursor-not-allowed' : 'bg-primary-container hover:bg-primary text-on-primary-container'}`} id="signOffBtn" type="button">
<span className="material-symbols-outlined text-[16px]">draw</span>
<span>{selectedIncident?.status === 'RESOLVED' ? 'RESOLVED' : 'SIGN OFF PROTOCOL'}</span>
</button>
<button className="py-2 px-space-md rounded bg-surface-container hover:bg-surface-variant text-on-surface font-label-caps text-label-caps uppercase transition-colors flex items-center justify-center gap-1" type="button">
<span className="material-symbols-outlined text-[16px]">print</span>
<span>DOSSIER</span>
</button>
</div>
</div>
</div>
{/* OSHA & Airflow Compliance Summary Card */}
<div className="bg-surface-container-low p-space-md rounded flex flex-col gap-space-sm shadow-sm">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
<span className="font-label-caps text-label-caps text-on-surface uppercase">COMPLIANCE CERTIFICATION RECORD</span>
</div>
<span className="font-telemetry-sm text-telemetry-sm text-primary font-bold">2024-Q2 VERIFIED</span>
</div>
<div className="flex items-center justify-between bg-surface-container p-space-sm rounded">
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant">DAILY AUTO-PURGE CYCLE</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold">04:00:00 EST (Nightly)</span>
</div>
<div className="h-5 w-px bg-surface-container-highest" />
<div className="flex flex-col text-right">
<span className="font-label-caps text-label-caps text-on-surface-variant">NEXT EPA AUDIT</span>
<span className="font-telemetry-sm text-telemetry-sm text-tertiary font-bold">14 Days Out</span>
</div>
</div>
<div className="flex items-center justify-between pt-space-xs">
<span className="font-body-sm text-body-sm text-on-surface-variant">NIOSH 0500 Filter Cartridge: Delta-P 0.8" w.g.</span>
<button className="font-label-caps text-label-caps text-primary hover:underline flex items-center gap-0.5" type="button">
<span>Audit Cert (.PDF)</span>
<span className="material-symbols-outlined text-[14px]">open_in_new</span>
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
                <p className="text-xs text-text-muted font-mono mt-0.5">OSHA 1910.1025 & Range Rule Infraction Recording</p>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="text-text-muted hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">Firing Bay / Lane</label>
                  <select
                    value={newLane}
                    onChange={(e) => setNewLane(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 text-white font-mono text-xs p-2.5 rounded-lg outline-none"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <option key={i} value={`Lane 0${i + 1}`}>Lane 0{i + 1}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">Severity Level</label>
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
                <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">Violation Classification</label>
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
                <label className="block text-[11px] font-mono text-text-muted uppercase mb-1">RSO Narrative & Optical Evidence Note</label>
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
                  Record & Flag for Review
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
                <span className="text-2xl">🚑</span>
                <div>
                  <h2 className="font-display font-bold text-xl text-[#EF4444]">TCCC Gunshot Trauma Protocol</h2>
                  <p className="text-xs text-text-muted font-mono">Tactical Combat Casualty Care — MARCH Algorithm</p>
                </div>
              </div>
              <button onClick={() => setIsTraumaModalOpen(false)} className="text-text-muted hover:text-white">✕</button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border-l-4 border-[#EF4444]">
                <strong className="text-white block mb-1">M — MASSIVE BLEEDING:</strong>
                <span>Apply CAT Gen 7 Tourniquet "High and Tight" immediately on extremity arterial hemorrhage. Wind windlass until bleeding halts. Note application time on forehead/strap (e.g. T-14:32). Pack junctional wounds with QuikClot hemostatic gauze.</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border-l-4 border-[#38BDF8]">
                <strong className="text-white block mb-1">A & R — AIRWAY & RESPIRATION:</strong>
                <span>Inspect chest and back for entrance/exit wounds. Apply vented chest seal immediately. Monitor for tension pneumothorax. Position casualty in recovery position.</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border-l-4 border-[#F5A623]">
                <strong className="text-white block mb-1">911 DISPATCH SCRIPT:</strong>
                <p className="italic text-white/90 mt-1">
                  "This is RSO at Marksman Range, [Address]. We have an accidental gunshot wound to [extremity/torso]. Firing line is CEASED and SECURED. Tourniquet applied at [Time]. EMS staging at Bay Entrance Door A."
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsTraumaModalOpen(false)}
              className="w-full py-3 rounded-xl bg-[#EF4444] text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#EF4444]/90"
            >
              Acknowledge & Close Protocol
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
