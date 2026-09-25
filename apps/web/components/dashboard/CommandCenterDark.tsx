"use client";

import React from "react";
import { KpiGrid } from "./KpiGrid";
import { LaneMatrix } from "./LaneMatrix";
import { RightPanel } from "./RightPanel";

interface CommandCenterDarkProps {
  rangeStatus: "HOT" | "COLD";
  lanes: any[];
  isLoading: boolean;
  onToggleStatus: () => void;
}

export function CommandCenterDark({ rangeStatus, lanes, isLoading, onToggleStatus }: CommandCenterDarkProps) {
  return (
    <div className="flex flex-col w-full p-space-md gap-space-md select-none h-full overflow-y-auto">
      {/* Global Range Status Banner */}
      {rangeStatus === "COLD" && (
        <div className="w-full bg-secondary-container/90 border border-secondary rounded p-space-sm flex items-center justify-between shadow-sm animate-pulse shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white text-[20px]">campaign</span>
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">Master All-Range Cease-Fire Engaged</h3>
              <p className="text-[11px] text-white/90">All firing has ceased. Siren sounding. Awaiting RSO clearance.</p>
            </div>
          </div>
        </div>
      )}

      <KpiGrid />

      <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter w-full items-start flex-1 min-h-0 pb-space-lg">
        <LaneMatrix lanes={lanes} isLoading={isLoading} />
        <RightPanel rangeStatus={rangeStatus} onToggleStatus={onToggleStatus} isLoading={isLoading} />
      </section>
    </div>
  );
}
