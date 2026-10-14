"use client";

import React from "react";

export function KpiGrid() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 w-full shrink-0">
      {/* Tile 1: Lane Utilization */}
      <div className="bg-surface-container-low rounded-xl p-3 sm:p-space-md flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary"></div>
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant uppercase tracking-wider truncate">Lane Utilization</span>
          <span className="material-symbols-outlined text-primary text-[16px] sm:text-[18px]">grid_view</span>
        </div>
        <div className="flex items-baseline justify-between mt-1 sm:mt-space-xs">
          <div className="flex items-baseline gap-1 sm:gap-space-xs">
            <span className="font-telemetry-lg text-lg sm:text-telemetry-lg text-on-surface font-bold">78%</span>
            <span className="font-telemetry-sm text-[10px] sm:text-telemetry-sm text-outline hidden xs:inline">14/18 bays</span>
          </div>
          <span className="font-telemetry-sm text-[10px] sm:text-[11px] text-primary px-1.5 sm:px-space-xs py-[2px] bg-surface-container-high rounded font-medium">Optimal</span>
        </div>
        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-2 sm:mt-space-sm flex gap-[1px]">
          <div className="bg-primary h-full rounded-l-full" style={{ width: '78%' }}></div>
          <div className="bg-tertiary h-full" style={{ width: '11%' }}></div>
          <div className="bg-surface-bright h-full rounded-r-full" style={{ width: '11%' }}></div>
        </div>
      </div>
      
      {/* Tile 2: Waitlist Depth */}
      <div className="bg-surface-container-low rounded-xl p-3 sm:p-space-md flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-tertiary"></div>
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant uppercase tracking-wider truncate">Waitlist Depth</span>
          <span className="material-symbols-outlined text-tertiary text-[16px] sm:text-[18px]">group_add</span>
        </div>
        <div className="flex items-baseline justify-between mt-1 sm:mt-space-xs">
          <div className="flex items-baseline gap-1 sm:gap-space-xs">
            <span className="font-telemetry-lg text-lg sm:text-telemetry-lg text-on-surface font-bold">4</span>
            <span className="font-telemetry-sm text-[10px] sm:text-telemetry-sm text-outline">queued</span>
          </div>
          <span className="font-telemetry-sm text-[10px] sm:text-telemetry-sm text-tertiary">~12m</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-space-xs mt-2 sm:mt-space-sm text-outline font-telemetry-sm text-[9px] sm:text-[10px] truncate">
          <span className="material-symbols-outlined text-[13px] text-tertiary">schedule</span>
          <span>Roll est. 14:20</span>
        </div>
      </div>
      
      {/* Tile 3: Daily Check-ins */}
      <div className="bg-surface-container-low rounded-xl p-3 sm:p-space-md flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary-fixed"></div>
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant uppercase tracking-wider truncate">Daily Check-Ins</span>
          <span className="material-symbols-outlined text-primary-fixed text-[16px] sm:text-[18px]">how_to_reg</span>
        </div>
        <div className="flex items-baseline justify-between mt-1 sm:mt-space-xs">
          <div className="flex items-baseline gap-1 sm:gap-space-xs">
            <span className="font-telemetry-lg text-lg sm:text-telemetry-lg text-on-surface font-bold">142</span>
            <span className="font-telemetry-sm text-[10px] sm:text-telemetry-sm text-outline">shooters</span>
          </div>
          <div className="flex items-center gap-[2px] font-telemetry-sm text-[10px] sm:text-[11px] text-tertiary font-medium">
            <span className="material-symbols-outlined text-[13px] sm:text-[14px]">trending_up</span>
            <span>+18%</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 sm:mt-space-sm font-telemetry-sm text-[9px] sm:text-[10px] text-outline">
          <span>VIP: 44</span>
          <span>•</span>
          <span>Mem: 68</span>
          <span>•</span>
          <span>Walk: 30</span>
        </div>
      </div>
      
      {/* Tile 4: RSO On-Duty */}
      <div className="bg-surface-container-low rounded-xl p-3 sm:p-space-md flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary"></div>
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-[10px] sm:text-label-caps text-on-surface-variant uppercase tracking-wider truncate">RSO Coverage</span>
          <span className="material-symbols-outlined text-secondary text-[16px] sm:text-[18px]">verified_user</span>
        </div>
        <div className="flex items-baseline justify-between mt-1 sm:mt-space-xs">
          <div className="flex items-baseline gap-1 sm:gap-space-xs">
            <span className="font-telemetry-lg text-lg sm:text-telemetry-lg text-on-surface font-bold">3/3</span>
            <span className="font-telemetry-sm text-[10px] sm:text-telemetry-sm text-outline">green</span>
          </div>
          <span className="px-1.5 sm:px-space-xs py-[2px] rounded font-label-caps text-[8px] sm:text-[9px] uppercase bg-secondary-container text-on-secondary-container font-bold">HOT SHIFT</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-space-xs mt-2 sm:mt-space-sm font-telemetry-sm text-[9px] sm:text-[10px] text-on-surface truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
          <span className="truncate">Lead: Miller | West: Vance</span>
        </div>
      </div>
    </section>
  );
}
