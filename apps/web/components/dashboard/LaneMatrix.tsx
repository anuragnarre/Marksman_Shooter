"use client";

import React from "react";

interface Lane {
  id: string;
  laneNumber: number;
  status: string; // e.g., 'OCCUPIED', 'MAINTENANCE', 'CEASE_FIRE', 'READY'
  activeSession?: {
    shooter?: {
      name: string;
    }
  }
}

interface LaneMatrixProps {
  lanes: Lane[];
  isLoading: boolean;
}

export function LaneMatrix({ lanes, isLoading }: LaneMatrixProps) {
  // Aggregate stats
  const activeCount = lanes.filter(l => l.status === 'OCCUPIED').length;
  const ceaseFireCount = lanes.filter(l => l.status === 'CEASE_FIRE').length;
  const readyCount = lanes.filter(l => !['OCCUPIED', 'MAINTENANCE', 'CEASE_FIRE'].includes(l.status)).length;
  const maintCount = lanes.filter(l => l.status === 'MAINTENANCE').length;

  return (
    <div className="col-span-8 flex flex-col gap-space-sm bg-surface-container-low rounded-xl p-space-md shadow-md">
      {/* Matrix Header Controls */}
      <div className="flex items-center justify-between pb-space-xs">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[18px]">token</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Live Firing Line Overview &amp; Telemetry Matrix</h2>
          </div>
          <span className="font-telemetry-sm text-body-sm text-outline hidden xl:inline">Range Alpha // 12-Bay Automation</span>
        </div>
        <div className="hidden md:flex items-center gap-space-xs font-label-caps text-[10px]">
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Active ({activeCount})
          </span>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Cease Fire ({ceaseFireCount})
          </span>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-outline flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Safe / Ready ({readyCount})
          </span>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Maint ({maintCount})
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-space-sm w-full h-[500px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-[11px] text-outline">Loading telemetry data...</div>
        ) : lanes.length === 0 ? (
          <div className="col-span-full py-8 text-center text-[11px] text-outline">No lanes configured.</div>
        ) : (
          lanes.map((lane) => (
            <LaneCard key={lane.id} lane={lane} />
          ))
        )}
      </div>

      {/* Quick Range Firing Bay Visual Preview Overlay Card */}
      <div className="flex items-center justify-between p-space-sm bg-surface-container-lowest rounded-lg mt-space-xs border border-outline-variant/30 shadow-sm shrink-0">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center overflow-hidden">
            <img className="object-cover w-full h-full" alt="Tactical indoor shooting range" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCY29bzK3flRkCVcMrS9xm8W_cSASyD2iq3hSl-jBkuuXuhrEh1sfABT2AHMpfWE6Q0YqEvjKuCbPAPjr78I6VBr1UDp0DEy6CY3OfWkUTh4Wvmf3GzE47bPVYlVbMY_MJTHX0QAJ2As6QkI43I1ri80Rt9hFtDfZ9_Ppkigy4dZUK6Dc-ZWqwARs82ldo0CIJTLPBjMzU0AbrKuLFjJ0bm6Yn0muhJkhzpNAR6tduaKAbQqYJ5aTZZ" />
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="font-label-caps text-[10px] uppercase text-outline">Optical Range Visualiser // Bay Line West</span>
            <span className="font-body-md text-body-sm text-on-surface">Target Retrieval Carrier Motor Bus: 48V DC nominal • Trap Air Vane 880 fpm</span>
          </div>
        </div>
        <div className="flex items-center gap-space-sm">
          <button className="px-space-md py-1 bg-surface-container-high hover:bg-surface-bright text-on-surface font-body-md text-body-sm rounded flex items-center gap-1 transition-colors border border-outline-variant">
            <span className="material-symbols-outlined text-[15px]">vertical_align_bottom</span> Recall All Targets
          </button>
        </div>
      </div>
    </div>
  );
}

function LaneCard({ lane }: { lane: Lane }) {
  const laneStr = `L${String(lane.laneNumber).padStart(2, '0')}`;
  const isActive = lane.status === 'OCCUPIED';
  const isOffline = lane.status === 'MAINTENANCE';
  const isCeaseFire = lane.status === 'CEASE_FIRE';

  if (isActive) {
    return (
      <div className="group relative bg-surface-container rounded-lg p-space-sm flex flex-col justify-between hover:bg-surface-container-high transition-colors shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="font-telemetry-lg text-headline-md text-on-surface font-bold">{laneStr}</span>
            <span className="px-1.5 py-[1px] bg-tertiary/10 text-tertiary font-label-caps text-[9px] rounded">MEM</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-lowest px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
            <span className="font-label-caps text-[9px] text-tertiary">HOT</span>
          </div>
        </div>
        <div className="my-space-xs flex items-baseline justify-between font-telemetry-sm">
          <div className="text-on-surface font-semibold text-[13px] truncate max-w-[80px]">{lane.activeSession?.shooter?.name || 'Walk-In'}</div>
          <div className="text-outline text-[11px]"><span className="text-on-surface font-bold">184</span> rds</div>
        </div>
        <div className="flex items-center justify-between text-outline text-[10px] font-telemetry-sm mb-space-xs">
          <span>Rem: 28m</span>
          <span className="truncate ml-1">TGT: B-27</span>
        </div>
        <div className="grid grid-cols-3 gap-1 pt-1 border-none mt-auto">
          <button className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded py-1 flex items-center justify-center">
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
          </button>
          <button className="bg-secondary-container hover:opacity-90 text-on-secondary-container rounded py-1 flex items-center justify-center font-bold text-[9px]">STOP</button>
          <button className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded py-1 flex items-center justify-center font-telemetry-sm text-[9px]">+15m</button>
        </div>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="group relative bg-surface-container-low/70 rounded-lg p-space-sm flex flex-col justify-between shadow-sm opacity-90">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="font-telemetry-lg text-headline-md text-outline font-bold">{laneStr}</span>
            <span className="px-1.5 py-[1px] bg-primary-container text-on-primary-container font-label-caps text-[9px] rounded font-bold">MAINT</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-lowest px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="font-label-caps text-[9px] text-primary">OFFLINE</span>
          </div>
        </div>
        <div className="my-space-xs flex items-baseline justify-between font-telemetry-sm">
          <div className="text-outline font-medium text-[13px]">Carrier Serv.</div>
          <div className="text-outline text-[11px]">0 rds</div>
        </div>
        <div className="flex items-center justify-between text-primary font-telemetry-sm text-[10px] mb-space-xs">
          <span>Cable Inspection</span>
          <span>Tech: #4</span>
        </div>
        <div className="grid grid-cols-2 gap-1 pt-1 mt-auto">
          <button className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded py-1 font-telemetry-sm text-[10px]">Test Cycle</button>
          <button className="bg-primary/20 hover:bg-primary/30 text-primary rounded py-1 font-telemetry-sm text-[10px]">Clear</button>
        </div>
      </div>
    );
  }

  if (isCeaseFire) {
    return (
      <div className="group relative bg-secondary-container/30 rounded-lg p-space-sm flex flex-col justify-between shadow-md border border-secondary">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="font-telemetry-lg text-headline-md text-secondary font-bold">{laneStr}</span>
            <span className="px-1.5 py-[1px] bg-secondary-container text-on-secondary-container font-label-caps text-[9px] rounded font-bold">HOLD</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-lowest px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
            <span className="font-label-caps text-[9px] text-secondary font-bold">CEASE</span>
          </div>
        </div>
        <div className="my-space-xs flex items-baseline justify-between font-telemetry-sm">
          <div className="text-secondary font-bold text-[13px]">Breech Flg?</div>
          <div className="text-outline text-[11px]"><span className="text-on-surface font-bold">92</span> rds</div>
        </div>
        <div className="flex items-center justify-between text-secondary font-telemetry-sm text-[10px] mb-space-xs font-semibold">
          <span>RSO Inspecting</span>
          <span className="material-symbols-outlined text-[13px]">priority_high</span>
        </div>
        <div className="grid grid-cols-2 gap-1 pt-1 mt-auto">
          <button className="bg-secondary text-on-secondary font-bold rounded py-1 font-telemetry-sm text-[10px]">Verify Clear</button>
          <button className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded py-1 font-telemetry-sm text-[10px]">Lock Bay</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-surface-container-lowest rounded-lg p-space-sm flex flex-col justify-between hover:bg-surface-container transition-colors shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="font-telemetry-lg text-headline-md text-on-surface-variant font-bold">{laneStr}</span>
          <span className="px-1.5 py-[1px] bg-surface-container-high text-outline font-label-caps text-[9px] rounded">READY</span>
        </div>
        <div className="flex items-center gap-1 bg-surface-container px-1.5 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
          <span className="font-label-caps text-[9px] text-outline">COLD</span>
        </div>
      </div>
      <div className="my-space-xs flex items-baseline justify-between font-telemetry-sm">
        <div className="text-outline font-medium text-[13px]">Staged: 0 yd</div>
        <div className="text-outline text-[11px]">Ready</div>
      </div>
      <div className="flex items-center justify-between text-outline text-[10px] font-telemetry-sm mb-space-xs">
        <span>Cleaned 13:50</span>
        <span className="truncate ml-1">TGT #1</span>
      </div>
      <button className="mt-auto w-full bg-primary-container text-on-primary-container hover:bg-primary font-body-md font-semibold text-body-sm py-1 rounded transition-colors flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-[14px]">person_add</span> Assign Party
      </button>
    </div>
  );
}
