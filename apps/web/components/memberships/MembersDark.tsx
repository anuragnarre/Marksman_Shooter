import React, { useState, useEffect } from 'react';

export function MembersDark({ 
  filteredMembers = [], 
  tiers = [], 
  isLoading = false,
  searchQuery = '',
  setSearchQuery = () => {},
  selectedTier = null,
  setSelectedTier = () => {}
}: { 
  filteredMembers?: any[], 
  tiers?: any[], 
  isLoading?: boolean,
  searchQuery?: string,
  setSearchQuery?: (q: string) => void,
  selectedTier?: string | null,
  setSelectedTier?: (t: string | null) => void
}) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'roster' | 'squad'>('roster');

  useEffect(() => {
    if (filteredMembers.length > 0 && !selectedMemberId) {
      setSelectedMemberId(filteredMembers[0].id);
    }
  }, [filteredMembers, selectedMemberId]);

  const selectedMember = filteredMembers.find(m => m.id === selectedMemberId) || filteredMembers[0];
  return (
    <div className="flex flex-col w-full gap-space-lg h-full overflow-y-auto pb-10">
      <div className="flex flex-col w-full">
{/* Top Header Sub-bar */}
<div className="flex flex-col md:flex-row md:items-center justify-between px-space-xl py-space-lg bg-surface-container-low/70 gap-space-md">
<div className="flex flex-col">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-primary text-[20px]">badge</span>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight uppercase">Memberships &amp; Shooter Directory</h1>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
        Manage certified members, active tier authorizations, ATF background clearances, and live lane assignments.
      </p>
</div>
<div className="flex items-center gap-space-sm self-start md:self-auto">
<button className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-caps text-label-caps uppercase tracking-wider" type="button">
<span className="material-symbols-outlined text-[16px] text-tertiary">file_download</span>
        Roster Export (CSV)
      </button>
<button className="flex items-center gap-space-xs px-space-lg py-space-xs rounded bg-primary-container text-on-primary-container hover:bg-primary transition-colors font-label-caps text-label-caps uppercase tracking-wider font-bold shadow-md" type="button">
<span className="material-symbols-outlined text-[16px]">person_add</span>
        + Add Member
      </button>
</div>
</div>
{/* KPI Metrics Strip (4 Cards) */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter px-space-xl py-space-md">
{/* KPI 1 */}
<div className="relative bg-surface-container-low p-space-md rounded flex flex-col justify-between overflow-hidden shadow-sm">
<div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-container" />
<div className="flex items-start justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Active Shooters</span>
<span className="material-symbols-outlined text-primary text-[18px]">group</span>
</div>
<div className="flex items-baseline gap-space-sm mt-space-xs">
<span className="font-telemetry-lg text-telemetry-lg text-on-surface">1,248</span>
<span className="font-label-caps text-label-caps text-tertiary flex items-center">
<span className="material-symbols-outlined text-[12px] mr-0.5">arrow_drop_up</span>+4.2% MoM
        </span>
</div>
<div className="mt-space-xs">
<div className="flex justify-between items-center mb-1">
<span className="font-body-sm text-body-sm text-on-surface-variant">Cap: 82%</span>
<span className="font-telemetry-sm text-telemetry-sm text-primary">1,500 Max</span>
</div>
<div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
<div className="bg-primary-container h-full rounded-full" style={{ width: '82%' }} />
</div>
</div>
</div>
{/* KPI 2 */}
<div className="relative bg-surface-container-low p-space-md rounded flex flex-col justify-between overflow-hidden shadow-sm">
<div className="absolute top-0 left-0 right-0 h-0.5 bg-secondary-container" />
<div className="flex items-start justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Renewals Due (&lt;14D)</span>
<span className="material-symbols-outlined text-secondary text-[18px]">notification_important</span>
</div>
<div className="flex items-baseline gap-space-sm mt-space-xs">
<span className="font-telemetry-lg text-telemetry-lg text-secondary">19</span>
<span className="font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-secondary-container/30 text-secondary uppercase font-bold">Critical</span>
</div>
<div className="flex items-center justify-between mt-space-xs">
<span className="font-body-sm text-body-sm text-on-surface-variant">14 Pending Notice Sent</span>
<span className="material-symbols-outlined text-on-surface-variant text-[14px]">send</span>
</div>
</div>
{/* KPI 3 */}
<div className="relative bg-surface-container-low p-space-md rounded flex flex-col justify-between overflow-hidden shadow-sm">
<div className="absolute top-0 left-0 right-0 h-0.5 bg-tertiary" />
<div className="flex items-start justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Clearance &amp; Waivers</span>
<span className="material-symbols-outlined text-tertiary text-[18px]">verified_user</span>
</div>
<div className="flex items-baseline gap-space-sm mt-space-xs">
<span className="font-telemetry-lg text-telemetry-lg text-on-surface">99.8%</span>
<span className="font-label-caps text-label-caps text-tertiary">ATF T-1</span>
</div>
<div className="flex items-center justify-between mt-space-xs">
<span className="font-body-sm text-body-sm text-on-surface-variant">Background Verified</span>
<span className="font-label-caps text-label-caps text-tertiary uppercase flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary" />Compliant
        </span>
</div>
</div>
{/* KPI 4 */}
<div className="relative bg-surface-container-low p-space-md rounded flex flex-col justify-between overflow-hidden shadow-sm">
<div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
<div className="flex items-start justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Pass Revenue (MTD)</span>
<span className="material-symbols-outlined text-primary text-[18px]">payments</span>
</div>
<div className="flex items-baseline gap-space-sm mt-space-xs">
<span className="font-telemetry-lg text-telemetry-lg text-primary">$38,420</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">/ $42k</span>
</div>
<div className="flex items-center justify-between mt-space-xs">
<span className="font-body-sm text-body-sm text-on-surface-variant">91.5% Target Achieved</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface">Avg $164.20/ea</span>
</div>
</div>
</div>
{/* Main Operational Workspace: 65% / 35% Split */}
<div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter px-space-xl pb-space-xl">
{/* LEFT PANEL: ROSTER & SEARCH (65% -> 8 cols on xl) */}
<div className="xl:col-span-8 flex flex-col gap-space-md">
{/* Search and Filter Strip */}
<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-space-sm bg-surface-container-low p-space-sm rounded">
{/* Search Input */}
<div className="relative flex-1">
<span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
<input 
  className="w-full pl-9 pr-space-md py-space-xs bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 font-body-sm text-body-sm rounded outline-none focus:bg-surface-container" 
  placeholder="Search callsign, ID, or name (Cmd+K)" 
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
</div>
{/* Filter Tabs */}
<div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs sm:pb-0">
<div className="flex bg-surface-container-highest rounded p-0.5 mr-2">
  <button 
    onClick={() => setViewMode('roster')}
    className={`px-3 py-1 rounded text-label-sm font-label-caps whitespace-nowrap transition-colors ${viewMode === 'roster' ? 'bg-primary text-on-primary font-bold shadow' : 'text-on-surface hover:text-primary'}`} type="button">
    Roster
  </button>
  <button 
    onClick={() => setViewMode('squad')}
    className={`px-3 py-1 rounded text-label-sm font-label-caps whitespace-nowrap transition-colors ${viewMode === 'squad' ? 'bg-primary text-on-primary font-bold shadow' : 'text-on-surface hover:text-primary'}`} type="button">
    Squad Perf
  </button>
</div>
<button 
  onClick={() => setSelectedTier(null)}
  className={`px-space-md py-space-xs rounded font-label-caps text-label-caps whitespace-nowrap transition-colors ${selectedTier === null ? 'bg-primary-container text-on-primary-container font-semibold' : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'}`} type="button">
            ALL
          </button>
{tiers.map(tier => (
  <button 
    key={tier.id}
    onClick={() => setSelectedTier(tier.name)}
    className={`px-space-md py-space-xs rounded font-label-caps text-label-caps whitespace-nowrap transition-colors ${selectedTier === tier.name ? 'bg-primary-container text-on-primary-container font-semibold' : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'}`} type="button">
              {tier.name}
            </button>
))}
<span className="hidden 2xl:flex items-center gap-1 font-label-caps text-label-caps text-tertiary pl-space-xs">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary" />{filteredMembers.length} Results
          </span>
</div>
</div>
{/* Live Range Roster Data Table Container */}
<div className="bg-surface-container-low rounded overflow-hidden shadow-sm flex flex-col">
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead>
<tr className="bg-surface-container-lowest text-on-surface-variant font-label-caps text-label-caps uppercase">
<th className="py-space-sm px-space-md">Shooter &amp; ID</th>
{viewMode === 'roster' ? (
  <>
    <th className="py-space-sm px-space-md">Tier</th>
    <th className="py-space-sm px-space-md">Calibers</th>
    <th className="py-space-sm px-space-md">Waiver / ATF</th>
    <th className="py-space-sm px-space-md">Expiration</th>
    <th className="py-space-sm px-space-md text-right">Actions</th>
  </>
) : (
  <>
    <th className="py-space-sm px-space-md text-center">Avg (30d)</th>
    <th className="py-space-sm px-space-md text-center">Best</th>
    <th className="py-space-sm px-space-md text-center">Grp Radius</th>
    <th className="py-space-sm px-space-md text-center">Consistency</th>
    <th className="py-space-sm px-space-md text-center">Sessions</th>
    <th className="py-space-sm px-space-md text-right">Last Active</th>
  </>
)}
</tr>
</thead>
<tbody className="font-body-md text-body-md">
          {isLoading ? (
            <tr><td colSpan={7} className="text-center py-8">Loading members...</td></tr>
          ) : filteredMembers.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-8 text-on-surface-variant font-label-caps">No members found.</td></tr>
          ) : (
            filteredMembers.map((member: any) => (
              <tr 
                key={member.id} 
                onClick={() => setSelectedMemberId(member.id)}
                className={`transition-colors cursor-pointer border-l-2 ${selectedMemberId === member.id ? 'bg-surface-container-high border-primary' : 'hover:bg-surface-container border-transparent hover:border-primary/50'}`}>
                <td className="px-space-md py-3 font-telemetry-sm text-telemetry-sm font-semibold text-on-surface">
                  #{member.shooterCode || member.id.slice(0,8)}
                </td>
                <td className="px-space-md py-3 text-on-surface">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold">
                      {(member.user?.name || 'U')[0]}
                    </div>
                    <span className="font-bold">{member.user?.name || 'Unknown'}</span>
                  </div>
                </td>
                {viewMode === 'roster' ? (
                  <>
                    <td className="px-space-md py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-label-caps font-bold ${member.tier === 'OBSIDIAN VIP' ? 'bg-primary-container/20 text-primary' : 'bg-surface-container-highest text-on-surface'}`}>
                        {member.tier}
                      </span>
                    </td>
                    <td className="px-space-md py-3 text-on-surface-variant font-body-sm text-body-sm">
                      {member.primaryWeapon || 'UNKNOWN'}
                    </td>
                    <td className="px-space-md py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-tertiary/20 text-tertiary font-label-caps text-label-caps font-bold">
                        PASS
                      </span>
                    </td>
                    <td className="px-space-md py-3 font-telemetry-sm text-telemetry-sm text-on-surface">
                      {member.expirationDate || 'N/A'}
                    </td>
                    <td className="px-space-md py-3 text-right">
                      <button className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-space-md py-3 text-center">
                      <span className="font-telemetry-md text-telemetry-md font-bold text-primary">{member.avgScore30d?.toFixed(1) || '-'}</span>
                    </td>
                    <td className="px-space-md py-3 text-center">
                      <span className="font-telemetry-sm text-telemetry-sm font-semibold text-on-surface">{member.bestScore?.toFixed(1) || '-'}</span>
                    </td>
                    <td className="px-space-md py-3 text-center">
                      <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">{member.groupRadius?.toFixed(1) || '-'} mm</span>
                    </td>
                    <td className="px-space-md py-3 text-center">
                      <span className={`font-telemetry-sm text-telemetry-sm font-bold ${member.consistency && member.consistency > 90 ? 'text-tertiary' : 'text-on-surface'}`}>{member.consistency || '-'}%</span>
                    </td>
                    <td className="px-space-md py-3 text-center">
                      <span className="font-telemetry-sm text-telemetry-sm text-on-surface">{member.sessionsLogged || 0}</span>
                    </td>
                    <td className="px-space-md py-3 text-right">
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {member.lastActiveDate ? new Date(member.lastActiveDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))
          )}
</tbody>
</table>
</div>
{/* Pagination Strip */}
<div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container-lowest text-on-surface-variant text-body-sm font-body-sm">
<span className="font-label-caps text-label-caps">Showing 1-5 of 1,248 entries</span>
<div className="flex items-center gap-space-md">
<span className="font-telemetry-sm text-telemetry-sm text-on-surface">Page 1 / 208</span>
<div className="flex items-center gap-space-xs">
<button className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-30" disabled="" type="button">
<span className="material-symbols-outlined text-[14px]">chevron_left</span>
</button>
<button className="w-6 h-6 rounded bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface" type="button">
<span className="material-symbols-outlined text-[14px]">chevron_right</span>
</button>
</div>
</div>
</div>
</div>
{/* Quick Roster Telemetry Banner */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<div className="bg-surface-container-low p-space-md rounded flex items-center gap-space-md">
<div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
</div>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">TODAY'S WAIVERS</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface">48 Signed / 0 Pending</span>
</div>
</div>
<div className="bg-surface-container-low p-space-md rounded flex items-center gap-space-md">
<div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-[20px]">verified</span>
</div>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">ATF NICS SYNC</span>
<span className="font-telemetry-sm text-telemetry-sm text-tertiary">REALTIME CONNECTED</span>
</div>
</div>
<div className="bg-surface-container-low p-space-md rounded flex items-center gap-space-md">
<div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[20px]">alarm_on</span>
</div>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">EXPIRING &lt; 30D</span>
<span className="font-telemetry-sm text-telemetry-sm text-secondary">37 Members</span>
</div>
</div>
</div>
</div>
{/* RIGHT PANEL: INSPECTOR / DIGITAL ID (35% -> 4 cols on xl) */}
<div className="xl:col-span-4 flex flex-col gap-space-md">
{/* MARKSMAN DEFENSE PASS (Digital Card) */}
<div className="relative bg-surface-container-low rounded p-space-md overflow-hidden shadow-lg">
{/* Top accent glowing strip */}
<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-container to-tertiary" />
<div className="flex items-center justify-between pb-space-xs">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-[18px]">security</span>
<span className="font-label-caps text-label-caps text-on-surface tracking-wider uppercase font-bold">MARKSMAN DEFENSE PASS</span>
</div>
<span className="px-space-xs py-0.5 rounded bg-surface-container-highest text-primary font-label-caps text-label-caps uppercase font-bold" id="card-tier-badge">
            {selectedMember?.tier || 'UNKNOWN'}
          </span>
</div>
{/* Tactical Profile Block */}
<div className="mt-space-sm bg-surface-container-lowest p-space-md rounded flex flex-col gap-space-sm">
<div className="flex items-start gap-space-md">
<div className="relative">
<div className="w-16 h-16 rounded bg-surface-container flex items-center justify-center text-primary font-bold text-xl">
  {(selectedMember?.user?.name || 'U')[0]}
</div>
<span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary border-2 border-surface-container-lowest" />
</div>
<div className="flex flex-col flex-1 min-w-0">
<span className="font-headline-md text-headline-md text-on-surface truncate" id="card-name">{selectedMember?.user?.name || 'Unknown'}</span>
<span className="font-label-caps text-label-caps text-primary truncate tracking-wider" id="card-callsign">CALLSIGN: {selectedMember?.callsign || 'NONE'}</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant truncate" id="card-id">ID: {selectedMember?.id || 'N/A'}</span>
</div>
</div>
{/* Auth Matrix */}
<div className="grid grid-cols-2 gap-space-xs pt-space-xs text-body-sm">
<div className="bg-surface-container p-space-xs rounded">
<span className="font-label-caps text-label-caps text-on-surface-variant block uppercase">Auth Level</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold" id="card-auth-level">{selectedMember?.status || 'N/A'}</span>
</div>
<div className="bg-surface-container p-space-xs rounded">
<span className="font-label-caps text-label-caps text-on-surface-variant block uppercase">Caliber Scope</span>
<span className="font-telemetry-sm text-telemetry-sm text-primary font-semibold" id="card-caliber-scope">{selectedMember?.primaryWeapon || 'N/A'}</span>
</div>
</div>
{/* Barcode Emulation Strip */}
<div className="mt-space-xs p-space-xs bg-surface-container flex flex-col items-center justify-center rounded gap-1">
{/* Simulated Barcode Lines */}
<div className="flex items-center justify-center gap-0.5 h-6 w-full opacity-80 px-space-sm">
<span className="w-1 h-full bg-on-surface" />
<span className="w-0.5 h-full bg-on-surface" />
<span className="w-1.5 h-full bg-on-surface" />
<span className="w-0.5 h-full bg-on-surface" />
<span className="w-2 h-full bg-on-surface" />
<span className="w-0.5 h-full bg-on-surface" />
<span className="w-1 h-full bg-on-surface" />
<span className="w-2 h-full bg-on-surface" />
<span className="w-0.5 h-full bg-on-surface" />
<span className="w-1.5 h-full bg-on-surface" />
<span className="w-1 h-full bg-on-surface" />
<span className="w-0.5 h-full bg-on-surface" />
<span className="w-2.5 h-full bg-on-surface" />
<span className="w-0.5 h-full bg-on-surface" />
<span className="w-1 h-full bg-on-surface" />
<span className="w-2 h-full bg-on-surface" />
</div>
<div className="flex items-center justify-between w-full px-space-xs font-label-caps text-label-caps text-on-surface-variant">
<span id="card-barcode-text">{selectedMember?.shooterCode || 'N/A'}</span>
<span id="card-exp">EXP: {selectedMember?.expirationDate || 'N/A'}</span>
</div>
</div>
</div>
{/* Performance & Safety Stats */}
<div className="grid grid-cols-3 gap-space-xs mt-space-sm text-center">
<div className="bg-surface-container-lowest p-space-xs rounded">
<span className="font-label-caps text-label-caps text-on-surface-variant block uppercase">Total Hours</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface font-bold" id="stat-hours">{selectedMember?.totalHours || 0} hrs</span>
</div>
<div className="bg-surface-container-lowest p-space-xs rounded">
<span className="font-label-caps text-label-caps text-on-surface-variant block uppercase">Safety Score</span>
<span className="font-telemetry-sm text-telemetry-sm text-tertiary font-bold" id="stat-safety">{selectedMember?.safetyScore || 100}/100</span>
</div>
<div className="bg-surface-container-lowest p-space-xs rounded">
<span className="font-label-caps text-label-caps text-on-surface-variant block uppercase">Incidents</span>
<span className="font-telemetry-sm text-telemetry-sm text-primary font-bold" id="stat-incidents">{selectedMember?.incidents || 0}</span>
</div>
</div>
{/* ACTIVE CLEARANCES LIST */}
<div className="mt-space-md flex flex-col gap-space-xs">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Active Clearances &amp; Endorsements</span>
<div className="flex items-center justify-between p-space-xs bg-surface-container-lowest rounded">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-tertiary text-[16px]">verified</span>
<span className="font-body-sm text-body-sm text-on-surface">NICS Federal Background</span>
</div>
<span className="font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-tertiary/10 text-tertiary font-bold">PASS</span>
</div>
<div className="flex items-center justify-between p-space-xs bg-surface-container-lowest rounded">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-[16px]">gavel</span>
<span className="font-body-sm text-body-sm text-on-surface">Tactical Draw &amp; Holster Movement</span>
</div>
<span className="font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-primary/10 text-primary font-bold">CERTIFIED</span>
</div>
<div className="flex items-center justify-between p-space-xs bg-surface-container-lowest rounded">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-tertiary text-[16px]">military_tech</span>
<span className="font-body-sm text-body-sm text-on-surface">Class III NFA Automatic Suppressed</span>
</div>
<span className="font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-tertiary/10 text-tertiary font-bold">AUTH</span>
</div>
</div>
{/* Action CTAs */}
<div className="flex items-center gap-space-sm mt-space-md">
<button className="flex-1 py-space-sm px-space-md rounded bg-primary-container text-on-primary-container hover:bg-primary font-label-caps text-label-caps uppercase tracking-wider font-bold shadow-md transition-colors flex items-center justify-center gap-space-xs" type="button">
<span className="material-symbols-outlined text-[16px]">meeting_room</span>
            Check-in to Bay
          </button>
<button className="p-space-sm rounded bg-surface-container text-on-surface hover:bg-surface-variant transition-colors flex items-center justify-center" type="button">
<span className="material-symbols-outlined text-[18px]">print</span>
</button>
</div>
</div>
{/* RECENT RANGE SESSIONS */}
<div className="bg-surface-container-low rounded p-space-md shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Recent Range Sessions</span>
<span className="font-label-caps text-label-caps text-primary cursor-pointer hover:underline">VIEW LOG</span>
</div>
{/* Session Item 1 */}
<div className="p-space-xs bg-surface-container-lowest rounded flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[14px]">track_changes</span>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-semibold">Bay 04 - Tactical Precision</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">Yesterday, 14:20 // 120 rds</span>
</div>
</div>
<span className="font-label-caps text-label-caps text-on-surface-variant">1.5 hrs</span>
</div>
{/* Session Item 2 */}
<div className="p-space-xs bg-surface-container-lowest rounded flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined text-[14px]">adjust</span>
</div>
<div className="flex flex-col">
<span className="font-body-sm text-body-sm text-on-surface font-semibold">Bay 01 - 25m Standard</span>
<span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">Mar 22, 10:05 // 250 rds</span>
</div>
</div>
<span className="font-label-caps text-label-caps text-on-surface-variant">2.0 hrs</span>
</div>
</div>
</div>
</div>
</div>

    </div>
  );
}
