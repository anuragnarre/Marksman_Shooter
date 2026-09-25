import React, { useState, useEffect } from "react";

export function MembersLight({
  filteredMembers = [],
  tiers = [],
  isLoading = false,
  searchQuery = "",
  setSearchQuery = () => {},
  selectedTier = null,
  setSelectedTier = () => {},
}: {
  filteredMembers?: any[];
  tiers?: any[];
  isLoading?: boolean;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  selectedTier?: string | null;
  setSelectedTier?: (t: string | null) => void;
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
      <div className="flex flex-col w-full pb-16">
        {/* Operational Header Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 py-5 bg-surface-container-lowest px-6 rounded-lg shadow-sm mt-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold uppercase tracking-widest">
                FACILITY SYS // REV 4.2
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
              <span className="font-label-md text-label-md text-on-tertiary-container uppercase font-semibold tracking-wider">
                ACTIVE ROSTER VERIFIED
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
              Memberships &amp; Shooter Directory
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Manage certified members, active tier authorizations, ATF
              background clearances, and live lane assignments.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="flex items-center gap-2 bg-surface-container-low hover:bg-surface-container text-on-surface px-4 py-2.5 rounded font-label-md text-label-md uppercase tracking-wider font-semibold transition-colors">
              <span className="material-symbols-outlined text-[18px]">
                file_download
              </span>
              <span>Roster Export</span>
            </button>
            <button className="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-5 py-2.5 rounded font-label-md text-label-md uppercase tracking-wider font-bold transition-colors">
              <span className="material-symbols-outlined text-[18px]">
                person_add
              </span>
              <span>+ Add Member</span>
            </button>
          </div>
        </div>
        {/* Filter and Search Bar */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 py-3 px-6 bg-surface-container-lowest rounded-lg shadow-sm mt-4">
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            <div className="relative min-w-[280px] flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                className="w-full h-10 pl-9 pr-3 bg-surface-container-low rounded font-label-md text-label-md text-on-surface focus:outline-none focus:bg-surface-container transition-colors"
                placeholder="Search callsign, ID, or caliber..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center bg-surface-container-low p-1 rounded">
              <button 
                onClick={() => setSelectedTier(null)}
                className={`px-3 py-1.5 rounded font-label-md text-label-md transition-all ${selectedTier === null ? 'bg-primary text-on-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
                ALL
              </button>
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.name)}
                  className={`px-3 py-1.5 rounded font-label-md text-label-md transition-all ${selectedTier === tier.name ? 'bg-primary text-on-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  {tier.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                {filteredMembers.length} REGULARIZED
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-container rounded p-0.5 mr-2">
              <button 
                onClick={() => setViewMode('roster')}
                className={`px-3 py-1 rounded text-label-sm font-label-sm uppercase tracking-wider font-semibold transition-colors ${viewMode === 'roster' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Roster
              </button>
              <button 
                onClick={() => setViewMode('squad')}
                className={`px-3 py-1 rounded text-label-sm font-label-sm uppercase tracking-wider font-semibold transition-colors ${viewMode === 'squad' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Squad Perf
              </button>
            </div>
            <button className="px-3 py-1.5 rounded font-label-sm text-label-sm uppercase tracking-wide bg-surface-container-high text-on-surface font-semibold">
              ALL
            </button>
            <button className="px-3 py-1.5 rounded font-label-sm text-label-sm uppercase tracking-wide bg-tertiary-container text-on-tertiary-container font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
              ACTIVE
            </button>
            <button className="px-3 py-1.5 rounded font-label-sm text-label-sm uppercase tracking-wide bg-surface-container-low text-on-surface-variant hover:text-on-surface">
              PENDING WAIVER
            </button>
          </div>
        </div>
        {/* Telemetry KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 my-6">
          {/* Card 1: Active Shooters */}
          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Active Shooters
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-surface">
                <span className="material-symbols-outlined text-[18px]">
                  groups
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">
                1,248
              </span>
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded">
                CAP: 82%
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-full bg-surface-container-low h-2 rounded overflow-hidden">
                <div
                  className="bg-on-tertiary-container h-full rounded"
                  style={{ width: "82%" }}
                />
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
                <span>Active Roster</span>
                <span className="text-on-tertiary-container font-semibold">
                  +4.2% MoM
                </span>
              </div>
            </div>
          </div>
          {/* Card 2: Renewals Due */}
          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Renewals Due &lt;14D
              </span>
              <span className="p-1.5 rounded bg-secondary-fixed text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[18px]">
                  event_repeat
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-secondary font-bold">
                19
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold bg-secondary-fixed/40 px-2 py-0.5 rounded">
                CRITICAL
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-full bg-surface-container-low h-2 rounded overflow-hidden">
                <div
                  className="bg-secondary-container h-full rounded"
                  style={{ width: "73%" }}
                />
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
                <span>Expiring Soon</span>
                <span className="text-secondary font-semibold">
                  14 Pending Notice
                </span>
              </div>
            </div>
          </div>
          {/* Card 3: Clearance & Waivers */}
          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Clearance &amp; Waivers
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-tertiary-container">
                <span className="material-symbols-outlined text-[18px]">
                  verified_user
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">
                99.8%
              </span>
              <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold bg-surface-container-low px-2 py-0.5 rounded">
                ATF T-1
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-full bg-surface-container-low h-2 rounded overflow-hidden">
                <div
                  className="bg-on-tertiary-container h-full rounded"
                  style={{ width: "99.8%" }}
                />
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
                <span>Background Verified</span>
                <span className="text-on-tertiary-container font-semibold">
                  Compliant
                </span>
              </div>
            </div>
          </div>
          {/* Card 4: Pass Revenue */}
          <div className="bg-surface-container-lowest p-5 rounded flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Pass Revenue (MTD)
              </span>
              <span className="p-1.5 rounded bg-surface-container-low text-on-surface">
                <span className="material-symbols-outlined text-[18px]">
                  payments
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-3 my-3">
              <span className="font-telemetry-xl text-telemetry-xl text-on-surface font-bold">
                $38,420
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold bg-surface-container-low px-2 py-0.5 rounded">
                GOAL: $42K
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-full bg-surface-container-low h-2 rounded overflow-hidden">
                <div
                  className="bg-primary h-full rounded"
                  style={{ width: "91.5%" }}
                />
              </div>
              <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
                <span>91.5% of Monthly Target</span>
                <span>Avg: $164.20/ea</span>
              </div>
            </div>
          </div>
        </div>
        {/* Main Two-Column Layout (65% Roster / 35% Dossier) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT 65% (8/12 Col): Live Range Roster */}
          <div className="xl:col-span-8 flex flex-col bg-surface-container-lowest rounded p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 gap-4">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold uppercase tracking-tight">
                  {viewMode === 'roster' ? 'Live Range Roster' : 'Squad Comparative Performance'}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {viewMode === 'roster' 
                    ? 'Registered shooters, access tiers, authorized calibers, and status'
                    : 'Analyze squad performance metrics side-by-side for coaching'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  <span className="font-bold text-on-surface">18/24</span> LANES
                  HOT
                </div>
                <button className="text-on-surface-variant hover:text-on-surface p-1.5 rounded bg-surface-container-low">
                  <span className="material-symbols-outlined text-[20px]">
                    filter_list
                  </span>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold rounded-l">
                      Shooter &amp; ID
                    </th>
                    {viewMode === 'roster' ? (
                      <>
                        <th className="py-3 px-3 font-semibold">Tier</th>
                        <th className="py-3 px-3 font-semibold">Calibers</th>
                        <th className="py-3 px-3 font-semibold text-center">Waiver / ATF</th>
                        <th className="py-3 px-3 font-semibold">Expires</th>
                        <th className="py-3 px-3 font-semibold text-right">Hours</th>
                        <th className="py-3 px-4 font-semibold text-right rounded-r">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-3 font-semibold text-center">Avg (30d)</th>
                        <th className="py-3 px-3 font-semibold text-center">Best</th>
                        <th className="py-3 px-3 font-semibold text-center">Grp Radius</th>
                        <th className="py-3 px-3 font-semibold text-center">Consistency</th>
                        <th className="py-3 px-3 font-semibold text-center">Sessions</th>
                        <th className="py-3 px-4 font-semibold text-right rounded-r">Last Active</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        Loading members...
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-8 text-on-surface-variant font-label-caps"
                      >
                        No members found.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member: any) => (
                      <tr
                        key={member.id}
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`transition-colors cursor-pointer border-l-2 ${selectedMemberId === member.id ? 'bg-surface-container-high border-primary' : 'hover:bg-surface-container border-transparent hover:border-primary/50'}`}
                      >
                        <td className="px-space-md py-3 font-telemetry-sm text-telemetry-sm font-semibold text-on-surface">
                          #{member.shooterCode || member.id.slice(0, 8)}
                        </td>
                        <td className="px-space-md py-3 text-on-surface">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold">
                              {(member.user?.name || "U")[0]}
                            </div>
                            <span className="font-semibold">{member.user?.name || "Unknown"}</span>
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
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-label-caps text-label-caps font-bold">
                                PASS
                              </span>
                            </td>
                            <td className="px-space-md py-3 font-telemetry-sm text-telemetry-sm text-on-surface">
                              {member.expirationDate || 'N/A'}
                            </td>
                            <td className="px-space-md py-3 font-telemetry-sm text-telemetry-sm text-on-surface text-right">
                              {member.totalHours || 0}h
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
            <div className="p-4 bg-surface-container-low rounded flex items-center justify-between mt-4">
              <div className="font-label-sm text-label-sm text-on-surface-variant">
                Showing <span className="font-bold text-on-surface">1 - 5</span>{" "}
                of 1,248 entries
              </div>
              <div className="flex items-center gap-3">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  PAGE 1 / 208
                </span>
                <div className="flex items-center gap-1.5">
                  <button className="w-8 h-8 rounded flex items-center justify-center bg-surface-container-lowest text-on-surface-variant opacity-50 cursor-not-allowed">
                    <span className="material-symbols-outlined text-[16px]">
                      chevron_left
                    </span>
                  </button>
                  <button className="w-8 h-8 rounded flex items-center justify-center bg-surface-container-lowest text-on-surface hover:bg-surface-container-high">
                    <span className="material-symbols-outlined text-[16px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* RIGHT 35% (4/12 Col): Active Shooter Dossier Drawer */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Defense Pass Card */}
            <div className="bg-primary text-on-primary p-6 rounded-lg shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-surface-container-highest/10 pointer-events-none" />
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline-variant font-bold">
                    MARKSMAN DEFENSE PASS
                  </span>
                  <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-primary">
                    {selectedMember?.user?.name || 'Unknown'}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary-fixed-dim font-mono">
                    CALLSIGN: {selectedMember?.callsign || 'NONE'}
                  </span>
                </div>
                <div className="px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold uppercase tracking-wider">
                  {selectedMember?.tier || 'UNKNOWN'}
                </div>
              </div>
              <div className="my-4 grid grid-cols-2 gap-3 bg-inverse-surface/40 p-3.5 rounded">
                <div>
                  <span className="block font-label-sm text-label-sm text-outline-variant uppercase">
                    AUTH LEVEL
                  </span>
                  <span className="font-label-md text-label-md font-bold text-on-primary font-mono">
                    {selectedMember?.status || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="block font-label-sm text-label-sm text-outline-variant uppercase">
                    CALIBER RESTRICTION
                  </span>
                  <span className="font-label-md text-label-md font-bold text-on-tertiary-container font-mono">
                    {selectedMember?.primaryWeapon || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-inverse-surface/60">
                <div className="flex items-center gap-2">
                  <div className="flex items-end gap-[2px] h-6">
                    <div className="w-[2px] h-full bg-on-primary" />
                    <div className="w-[1px] h-full bg-on-primary" />
                    <div className="w-[3px] h-full bg-on-primary" />
                    <div className="w-[1px] h-full bg-on-primary" />
                    <div className="w-[2px] h-4 bg-on-primary" />
                    <div className="w-[4px] h-full bg-on-primary" />
                    <div className="w-[1px] h-full bg-on-primary" />
                    <div className="w-[2px] h-5 bg-on-primary" />
                    <div className="w-[3px] h-full bg-on-primary" />
                    <div className="w-[1px] h-full bg-on-primary" />
                    <div className="w-[2px] h-full bg-on-primary" />
                  </div>
                  <span className="font-label-sm text-label-sm text-outline-variant font-mono">
                    {selectedMember?.shooterCode || 'N/A'}
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-outline-variant">
                  EXP: {selectedMember?.expirationDate || 'N/A'}
                </span>
              </div>
            </div>
            {/* Dossier Details Card */}
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-container-low p-3.5 text-center rounded">
                  <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                    Total Hours
                  </span>
                  <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">
                    {selectedMember?.totalHours || 0}
                  </span>
                </div>
                <div className="bg-surface-container-low p-3.5 text-center rounded">
                  <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                    Safety Score
                  </span>
                  <span className="font-telemetry-lg text-telemetry-lg text-on-tertiary-container font-bold">
                    {selectedMember?.safetyScore || 100}
                  </span>
                </div>
                <div className="bg-surface-container-low p-3.5 text-center rounded">
                  <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold mb-1">
                    Incidents
                  </span>
                  <span className="font-telemetry-lg text-telemetry-lg text-on-surface font-bold">
                    {selectedMember?.incidents || 0}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1">
                  <span className="font-label-md text-label-md font-bold uppercase text-on-surface tracking-wider">
                    Active Clearances
                  </span>
                  <span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">
                    3 Active
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between p-3 bg-surface-container-low rounded">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                        verified
                      </span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">
                        NICS Federal Background
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-bold">
                      PASS
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-container-low rounded">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                        verified
                      </span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">
                        Tactical Draw &amp; Holster Movement
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-bold">
                      CERTIFIED
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-container-low rounded">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                        verified
                      </span>
                      <span className="font-body-md text-body-md font-semibold text-on-surface">
                        Class III NFA Automatic Suppressed
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold">
                      AUTH
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 pt-1">
                <button className="col-span-3 h-12 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md uppercase font-bold flex items-center justify-center gap-2 transition-colors rounded">
                  <span className="material-symbols-outlined text-[20px]">
                    sports_score
                  </span>
                  <span>Check-In to Bay</span>
                </button>
                <button
                  className="col-span-1 h-12 bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors rounded"
                  title="Print Physical Badge"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    print
                  </span>
                </button>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant tracking-wider">
                  Recent Sessions
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-3 bg-surface-container-low rounded">
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md font-semibold text-on-surface">
                        Bay 04 - Tactical Precision
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono mt-0.5">
                        Yesterday, 14:20 // 120 rds
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm font-mono text-on-surface font-semibold">
                      1.5 hrs
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-container-low rounded">
                    <div className="flex flex-col">
                      <span className="font-body-md text-body-md font-semibold text-on-surface">
                        Bay 01 - 25m Standard
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-mono mt-0.5">
                        Mar 22, 10:05 // 250 rds
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm font-mono text-on-surface font-semibold">
                      2.0 hrs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
