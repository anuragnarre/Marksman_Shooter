"use client";

import React from "react";
import { MaterialIcon } from "../ui/TacticalIcons";

export function KpiGrid() {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full shrink-0">
      {/* Tile 1: Lane Utilization */}
      <div className="bg-surface-container-low rounded-xl p-2.5 sm:p-space-md flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary"></div>
        <div className="flex items-center justify-between gap-1">
          <span className="font-label-caps text-[9px] sm:text-[11px] text-on-surface-variant uppercase tracking-wider truncate">Lane Utilization</span>
          <MaterialIcon name="grid_view" className="text-primary w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
        </div>
        <div className="flex items-baseline justify-between mt-1 sm:mt-space-xs gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-telemetry-lg text-base sm:text-lg lg:text-xl text-on-surface font-bold">78%</span>
            <span className="font-telemetry-sm text-[9px] sm:text-[11px] text-outline">14/18 bays</span>
          </div>
          <span className="font-telemetry-sm text-[9px] sm:text-[10px] text-primary px-1.5 py-[1px] bg-surface-container-high rounded font-medium shrink-0">Optimal</span>
        </div>
        <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-1.5 sm:mt-space-sm flex gap-[1px]">
          <div className="bg-primary h-full rounded-l-full" style={{ width: '78%' }}></div>
          <div className="bg-tertiary h-full" style={{ width: '11%' }}></div>
          <div className="bg-surface-bright h-full rounded-r-full" style={{ width: '11%' }}></div>
        </div>
      </div>
      
      {/* Tile 2: Waitlist Depth */}
      <div className="bg-surface-container-low rounded-xl p-2.5 sm:p-space-md flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-tertiary"></div>
        <div className="flex items-center justify-between gap-1">
          <span className="font-label-caps text-[9px] sm:text-[11px] text-on-surface-variant uppercase tracking-wider truncate">Waitlist Depth</span>
          <MaterialIcon name="group_add" className="text-tertiary w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
        </div>
        <div className="flex items-baseline justify-between mt-1 sm:mt-space-xs gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-telemetry-lg text-base sm:text-lg lg:text-xl text-on-surface font-bold">4</span>
            <span className="font-telemetry-sm text-[9px] sm:text-[11px] text-outline">queued</span>
          </div>
          <span className="font-telemetry-sm text-[9px] sm:text-[10px] text-tertiary shrink-0">~12m</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 sm:mt-space-sm text-outline font-telemetry-sm text-[8px] sm:text-[10px] truncate">
          <MaterialIcon name="schedule" className="w-3 h-3 sm:w-[13px] sm:h-[13px] text-tertiary shrink-0" />
          <span className="truncate">Roll est. 14:20</span>
        </div>
      </div>
      
      {/* Tile 3: Daily Check-ins */}
      <div className="bg-surface-container-low rounded-xl p-2.5 sm:p-space-md flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary-fixed"></div>
        <div className="flex items-center justify-between gap-1">
          <span className="font-label-caps text-[9px] sm:text-[11px] text-on-surface-variant uppercase tracking-wider truncate">Daily Check-Ins</span>
          <MaterialIcon name="how_to_reg" className="text-primary-fixed w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
        </div>
        <div className="flex items-baseline justify-between mt-1 sm:mt-space-xs gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-telemetry-lg text-base sm:text-lg lg:text-xl text-on-surface font-bold">142</span>
            <span className="font-telemetry-sm text-[9px] sm:text-[11px] text-outline">shooters</span>
          </div>
          <div className="flex items-center gap-[2px] font-telemetry-sm text-[9px] sm:text-[10px] text-tertiary font-medium shrink-0">
            <MaterialIcon name="trending_up" className="w-3 h-3 sm:w-[13px] sm:h-[13px]" />
            <span>+18%</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-space-sm font-telemetry-sm text-[8px] sm:text-[9px] text-outline overflow-hidden">
          <span className="px-1 py-[1px] rounded bg-surface-container-high text-on-surface shrink-0">VIP: 44</span>
          <span className="px-1 py-[1px] rounded bg-surface-container-high text-on-surface shrink-0">Mem: 68</span>
          <span className="px-1 py-[1px] rounded bg-surface-container-high text-on-surface truncate">Walk: 30</span>
        </div>
      </div>
      
      {/* Tile 4: RSO On-Duty */}
      <div className="bg-surface-container-low rounded-xl p-2.5 sm:p-space-md flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-secondary"></div>
        <div className="flex items-center justify-between gap-1">
          <span className="font-label-caps text-[9px] sm:text-[11px] text-on-surface-variant uppercase tracking-wider truncate">RSO Coverage</span>
          <MaterialIcon name="verified_user" className="text-secondary w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
        </div>
        <div className="flex items-baseline justify-between mt-1 sm:mt-space-xs gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-telemetry-lg text-base sm:text-lg lg:text-xl text-on-surface font-bold">3/3</span>
            <span className="font-telemetry-sm text-[9px] sm:text-[11px] text-outline">active</span>
          </div>
          <span className="px-1.5 py-[1px] rounded font-label-caps text-[8px] uppercase bg-secondary-container text-on-secondary-container font-bold shrink-0">HOT SHIFT</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 sm:mt-space-sm font-telemetry-sm text-[8px] sm:text-[10px] text-on-surface truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
          <span className="truncate">Miller (Lead) • Vance</span>
        </div>
      </div>
    </section>
  );
}

