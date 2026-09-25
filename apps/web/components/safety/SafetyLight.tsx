import React, { useState, useEffect } from 'react';

export function SafetyLight({ incidents = [], auditLogs = [], isLoading = false, resolveIncident }: { incidents?: any[], auditLogs?: any[], isLoading?: boolean, resolveIncident?: (id: string) => Promise<void> }) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'REVIEW' | 'RESOLVED' | 'OSHA'>('ALL');

  useEffect(() => {
    if (incidents.length > 0 && !selectedIncidentId) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents, selectedIncidentId]);

  const selectedIncident = incidents.find(inc => inc.id === selectedIncidentId) || incidents[0];
  
  const filteredIncidents = incidents.filter(inc => {
    if (filterMode === 'REVIEW') return inc.status === 'UNDER_REVIEW';
    if (filterMode === 'RESOLVED') return inc.status === 'RESOLVED';
    return true; // 'ALL' or 'OSHA' (OSHA will be handled by rendering a different table)
  });

  const reviewCount = incidents.filter(i => i.status === 'UNDER_REVIEW').length;

  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-10">
      <div className="flex flex-col w-full pb-16" id="safety-main-content">{/* Operational Sub-Header Bar & Filter Palette */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-5 bg-surface-container-lowest px-4 rounded shadow-sm my-6">
<div className="flex flex-wrap items-center gap-3">
<div className="flex items-center gap-2 bg-surface-container-low px-3.5 py-2 rounded">
<span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-bold">LIVE TELEMETRY ACTIVE</span>
</div>
<div className="h-6 w-[1px] bg-outline-variant hidden sm:block" />
<div>
<h1 className="font-headline-sm text-headline-sm text-on-surface uppercase font-bold tracking-tight inline-block mr-2">Safety &amp; Compliance Register</h1>
<span className="font-label-sm text-label-sm text-on-surface-variant font-mono">REV 4.2.8 // SYS_LOG://RSO-AUTH-0994</span>
</div>
{/* Segmented Filter Pills */}
<div className="flex items-center bg-surface-container-low p-1 rounded ml-auto lg:ml-4 gap-1">
<button onClick={() => setFilterMode('ALL')} className={`px-3 py-1.5 rounded font-label-md text-label-md transition-all ${filterMode === 'ALL' ? 'bg-primary text-on-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>ALL INCIDENTS</button>
<button onClick={() => setFilterMode('REVIEW')} className={`px-3 py-1.5 rounded font-label-md text-label-md transition-all flex items-center gap-1.5 ${filterMode === 'REVIEW' ? 'bg-secondary-container text-on-secondary-container font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
<span>UNDER RSO REVIEW</span>
{reviewCount > 0 && <span className="px-1.5 py-0.2 bg-error text-on-error rounded-full font-label-sm text-label-sm font-bold">{reviewCount}</span>}
</button>
<button onClick={() => setFilterMode('RESOLVED')} className={`px-3 py-1.5 rounded font-label-md text-label-md transition-all ${filterMode === 'RESOLVED' ? 'bg-surface-container-high text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>RESOLVED</button>
<button onClick={() => setFilterMode('OSHA')} className={`px-3 py-1.5 rounded font-label-md text-label-md transition-all ${filterMode === 'OSHA' ? 'bg-tertiary-container text-on-tertiary-container font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>OSHA AUDITS</button>
</div>
</div>
{/* Action CTA */}
<div className="flex items-center gap-3 shrink-0">
<button className="flex items-center gap-2 bg-error hover:bg-on-error-container text-on-error px-4 py-2 rounded font-label-md text-label-md uppercase tracking-wider font-bold transition-colors shadow-sm">
<span className="material-symbols-outlined text-[18px]">add_alert</span>
      + Report Incident
    </button>
</div>
</div>
{/* Telemetry KPI Summary Cards (3 Cards styled identically to SCREEN_64 cards) */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
{/* Card 1: Open Corrective Actions */}
<div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm border border-outline-variant/30">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Open Corrective Actions</span>
<span className="p-1.5 rounded bg-error-container text-on-error-container">
<span className="material-symbols-outlined text-[18px]">pending_actions</span>
</span>
</div>
<div className="flex items-baseline gap-3 my-3">
<span className="font-telemetry-xl text-telemetry-xl text-error font-bold">02</span>
<span className="font-label-md text-label-md text-on-surface-variant font-semibold">/ 14 TOTAL YTD</span>
</div>
<div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded">
<div className="flex items-center gap-1.5 text-error">
<span className="w-1.5 h-1.5 rounded-full bg-error animate-ping" />
<span className="font-label-sm text-label-sm font-bold">Priority 1:</span>
<span className="font-body-sm text-body-sm text-on-surface font-medium truncate">Pending Lane L-07</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">42m ago</span>
</div>
</div>
{/* Card 2: Incident-Free Range Streak */}
<div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm border border-outline-variant/30">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Incident-Free Range Streak</span>
<span className="p-1.5 rounded bg-surface-container-low text-on-tertiary-container">
<span className="material-symbols-outlined text-[18px]">verified_user</span>
</span>
</div>
<div className="flex items-baseline gap-2 my-3">
<span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">41</span>
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded">Consecutive Days</span>
</div>
<div className="flex items-center justify-between bg-surface-container-low px-2.5 py-1.5 rounded">
<div className="flex items-center gap-1.5 text-on-tertiary-container">
<span className="material-symbols-outlined text-[16px]">trending_up</span>
<span className="font-label-sm text-label-sm font-bold">+18.4% improvement</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Record: 38 Days</span>
</div>
</div>
{/* Card 3: Regulatory Compliance Audit Score */}
<div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm border border-outline-variant/30">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Regulatory Range Audit Score</span>
<span className="p-1.5 rounded bg-surface-container-low text-on-surface">
<span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
</span>
</div>
<div className="flex items-center justify-between my-2">
<div className="flex items-baseline gap-3">
<span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">99.4%</span>
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded">Pass Verified</span>
</div>
<div className="relative w-12 h-12 flex items-center justify-center shrink-0">
<svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
<path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
<path className="text-on-tertiary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="99.4, 100" strokeLinecap="butt" strokeWidth="3.5" />
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
{/* Main Split Workspace Layout (65% / 35%) */}
<div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
{/* LEFT 65% (8/12 Col): Incident & Compliance Log Matrix Table */}
<div className="xl:col-span-8 flex flex-col bg-surface-container-lowest rounded p-6 shadow-sm border border-outline-variant/20">
<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 gap-4">
<div>
<h2 className="font-headline-md text-headline-md text-on-surface font-bold uppercase tracking-tight">
  {filterMode === 'OSHA' ? 'Compliance Audit Records' : 'Range Incident Log Matrix'}
</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">
  {filterMode === 'OSHA' ? 'Regulatory checks, OSHA metrics, and certifications' : 'Real-time safety events, muzzle sweeps, mechanical stops, and optical trip logs'}
</p>
</div>
<div className="flex items-center gap-2">
<div className="relative flex items-center">
<span className="material-symbols-outlined absolute left-2.5 text-[16px] text-on-surface-variant">search</span>
<input className="h-9 pl-8 pr-3 bg-surface-container-low rounded font-label-sm text-label-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container uppercase w-56 sm:w-64" placeholder="Filter logs..." type="text"/>
</div>
<button className="h-9 px-3 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors">
<span className="material-symbols-outlined text-[16px]">file_download</span>
<span>CSV</span>
</button>
</div>
</div>
{/* Incident Table */}
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
      <th className="py-3 px-2">TIME (EST)</th>
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
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-caps text-label-caps uppercase font-bold ${incident.severity === 'CRITICAL' ? 'bg-error-container text-error' : incident.severity === 'WARNING' ? 'bg-secondary-container text-secondary' : 'bg-primary-container text-primary'}`}>
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
                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-label-caps uppercase font-bold ${incident.status === 'OPEN' ? 'bg-primary-container text-primary' : incident.status === 'UNDER_REVIEW' ? 'bg-secondary-container text-secondary' : 'bg-surface-container text-outline'}`}>
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
{/* Bottom table footer bar */}
<div className="mt-6 p-4 rounded bg-surface-container-low flex flex-col sm:flex-row items-center justify-between font-label-sm text-label-sm text-on-surface-variant gap-3">
<div className="flex items-center gap-6">
<div className="flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
<span className="font-semibold text-on-surface">CAMERA NETWORK SYNCED [60 FPS]</span>
</div>
<div className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-primary">sensors</span>
<span>24 LANES ARMED &amp; MONITORED</span>
</div>
</div>
<div className="flex items-center gap-4">
<span>DATA INTEGRITY: SHA-256 VERIFIED</span>
<span className="text-outline">STORAGE: 180 DAYS</span>
</div>
</div>
</div>
{/* RIGHT 35% (4/12 Col): Active Dossier & Remediation Panel + Environmental OSHA Card */}
<div className="xl:col-span-4 flex flex-col gap-6">
{/* Panel 1: Incident Dossier */}
<div className="bg-surface-container-lowest rounded p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-4">
<div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[20px] text-error">report</span>
<h3 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">DOSSIER: {selectedIncident ? `#${selectedIncident.id}` : 'NONE SELECTED'}</h3>
</div>
{selectedIncident?.status !== 'RESOLVED' && (
<span className="font-label-sm text-label-sm bg-error-container text-on-error-container px-2 py-1 rounded font-bold uppercase">
          ACTION REQUIRED
        </span>
)}
</div>
{/* Identified Shooter details */}
<div className="p-3.5 bg-surface-container-low rounded flex flex-col gap-2">
<div className="flex items-start justify-between">
<div>
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Shooter Identified</span>
<div className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">{selectedIncident?.memberName || 'Unknown Shooter'}</div>
<div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 font-mono">MEM-ID: {selectedIncident ? `#${selectedIncident.id.slice(0, 5)}` : ''} • Practical Permit</div>
</div>
<div className="text-right">
<span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-label-sm text-label-sm font-bold uppercase">{selectedIncident?.laneId || 'N/A'}</span>
<div className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-mono">Cal: 9x19mm</div>
</div>
</div>
<p className="mt-2 pt-2 border-t border-outline-variant/30 font-body-sm text-body-sm text-on-surface leading-normal">
          {selectedIncident?.narrative || 'No narrative provided for this incident.'}
        </p>
</div>
{/* Optical Telemetry Stills */}
<div className="flex flex-col gap-1.5">
<div className="flex items-center justify-between font-label-sm text-label-sm uppercase font-semibold text-on-surface-variant">
<span>Attached Optical Telemetry [2 STILLS]</span>
<span className="text-error font-bold font-mono">MUT-TRIGGER 14:28:09</span>
</div>
<div className="grid grid-cols-2 gap-2">
<div className="relative rounded overflow-hidden bg-surface-container border border-outline-variant/40 group">
<img className="w-full h-24 object-cover filter contrast-125" data-alt="Tactical weapon pointed towards concrete divider with infrared overlay" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAefXoTH7XTTpcBqG7tCujhz6EI9CVnn8V8IFkYkLLMyEMovpY6zSpMmYWA1jYMFJtCAnKhC_QcZe8Z6skpodUaWh6dMKaQB-0Dn18IC1geMrQuxZ2AEGwBrxMuG5no1Kudvp2F2nxiOnggDEWq8gdXMRy5spQzkoJwkzw6Aes1QFn3hJnh71rPIqgK-cnKZKqq24LHkd9rcFCW3RU0f6TH6Qz_xLfFO0gr87q5apBc_k3L9Uw0_CL3"/>
<div className="absolute bottom-0 left-0 right-0 bg-primary/80 px-2 py-0.5 flex justify-between font-label-sm text-[9px] text-on-primary font-mono">
<span>CAM-07B [OVERHEAD]</span>
<span className="text-error">DEV: 45.2°</span>
</div>
</div>
<div className="relative rounded overflow-hidden bg-surface-container border border-outline-variant/40 group">
<img className="w-full h-24 object-cover filter contrast-125" data-alt="Macro optical surveillance still of handgun receiver violating horizontal safety boundary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDBrnvDZEFVfBDnb_FJxVz9a5Vwu8qsGdcc3h5vOae0PIztdygzLb-IpilgU3xOqI6l262NHH7YxJvO29byRZptq6i70OmeqtO8bEs8eBeBPeCkr717jSq04lITlmkUf5gFg8QQVuxke9j2_u3WsewXk8DF3FJn4of-X60pjo9jizEbzRKTlJbF9y5RV4iQzm5tvjTG8vguaD0-oj_bFDkNfvkKrVM87-afhXuoAf7hPcKC4SaVar2"/>
<div className="absolute bottom-0 left-0 right-0 bg-primary/80 px-2 py-0.5 flex justify-between font-label-sm text-[9px] text-on-primary font-mono">
<span>EVID-MACRO_01</span>
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
<select className="w-full h-9 px-3 bg-surface-container-low rounded font-label-md text-label-md text-on-surface appearance-none focus:outline-none focus:bg-surface-container">
<option>Issue Formal Verbal Range Safety Warning</option>
<option>Mandatory 30-Min Safe Handling Re-Qualification</option>
<option>Temporary 30-Day Lane Access Suspension</option>
<option>Permanent Range Revocation &amp; Transfer to Board</option>
</select>
<span className="pointer-events-none absolute right-2.5 top-2.5 material-symbols-outlined text-[18px] text-on-surface-variant">arrow_drop_down</span>
</div>
</div>
{/* Action Buttons */}
<div className="grid grid-cols-2 gap-3 pt-2">
<button 
  disabled={!selectedIncident || selectedIncident.status === 'RESOLVED'}
  onClick={() => {
    if (selectedIncident && resolveIncident) {
      resolveIncident(selectedIncident.id);
    }
  }}
  className={`h-10 rounded font-label-md text-label-md uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors ${selectedIncident?.status === 'RESOLVED' ? 'bg-surface-container-low text-outline cursor-not-allowed' : 'bg-primary hover:bg-primary-container text-on-primary'}`}>
<span className="material-symbols-outlined text-[18px]">verified</span>
<span>{selectedIncident?.status === 'RESOLVED' ? 'RESOLVED' : 'Sign Off Protocol'}</span>
</button>
<button className="h-10 bg-surface-container-low hover:bg-surface-container text-on-surface rounded font-label-md text-label-md uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors">
<span className="material-symbols-outlined text-[18px]">print</span>
<span>Print Dossier</span>
</button>
</div>
</div>
{/* Panel 2: OSHA & Ventilation Health */}
<div className="bg-surface-container-lowest rounded p-6 shadow-sm border border-outline-variant/20 flex flex-col gap-4">
<div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[20px] text-on-tertiary-container">cyclone</span>
<h4 className="font-headline-sm text-headline-sm uppercase tracking-wide text-on-surface font-bold">OSHA &amp; Airflow Health</h4>
</div>
<span className="font-label-sm text-label-sm text-on-tertiary-container bg-surface-container-low px-2 py-0.5 rounded font-semibold flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
          OPTIMAL
        </span>
</div>
<div className="grid grid-cols-2 gap-3">
<div className="p-3 bg-surface-container-low rounded flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Laminar Flow (FPM)</span>
<div className="flex items-baseline gap-1 my-1">
<span className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface">76.4</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">FPM</span>
</div>
<div className="font-label-sm text-label-sm text-on-tertiary-container font-semibold flex items-center gap-1 mt-auto">
<span className="material-symbols-outlined text-[14px]">check_circle</span>Target: 75 ± 5
          </div>
</div>
<div className="p-3 bg-surface-container-low rounded flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Airborne Lead Filter</span>
<div className="flex items-baseline gap-1 my-1">
<span className="font-telemetry-lg text-telemetry-lg font-bold text-on-surface">0.012</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">mg/m³</span>
</div>
<div className="font-label-sm text-label-sm text-on-tertiary-container font-semibold flex items-center gap-1 mt-auto">
<span className="material-symbols-outlined text-[14px]">check_circle</span>PEL &lt; 0.050 Limit
          </div>
</div>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-2 border-t border-surface-container-low">
<span>Daily Auto-Purge: 04:00 EST</span>
<button className="text-secondary hover:text-on-secondary-container font-bold uppercase flex items-center gap-1 transition-colors">
<span>Audit Cert (.PDF)</span>
<span className="material-symbols-outlined text-[14px]">arrow_outward</span>
</button>
</div>
</div>
</div>
</div></div>
    </div>
  );
}
