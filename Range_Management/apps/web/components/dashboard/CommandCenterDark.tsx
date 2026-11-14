"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KpiGrid } from "./KpiGrid";
import { LaneMatrix } from "./LaneMatrix";
import { RightPanel } from "./RightPanel";
import {
  IconWarning,
  IconLockOpen,
  IconPersonAdd,
  IconGridView,
  IconAnalytics,
  IconListAlt,
  IconCampaign,
} from "../ui/TacticalIcons";

interface CommandCenterDarkProps {
  rangeStatus: "HOT" | "COLD";
  lanes: any[];
  isLoading: boolean;
  onToggleStatus: () => void;
}

export function CommandCenterDark({ rangeStatus, lanes, isLoading, onToggleStatus }: CommandCenterDarkProps) {
  const router = useRouter();
  const [mobileTab, setMobileTab] = useState<"lanes" | "kpis" | "logs">("lanes");

  return (
    <div className="flex flex-col w-full p-1 sm:p-2 lg:p-space-md gap-2 sm:gap-space-md select-none">
      {/* Global Range Status Banner */}
      {rangeStatus === "COLD" && (
        <div className="w-full bg-secondary-container/95 border-2 border-secondary rounded-xl p-3 sm:p-space-sm flex items-center justify-between shadow-lg animate-pulse shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <IconCampaign className="w-6 h-6 text-white shrink-0" />
            <div>
              <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wider">Master All-Range Cease-Fire Engaged</h3>
              <p className="text-[10px] sm:text-[11px] text-white/90">All firing has ceased. Siren sounding. Awaiting RSO clearance.</p>
            </div>
          </div>
          <button
            onClick={onToggleStatus}
            className="px-3 py-1.5 bg-white text-secondary font-bold text-xs uppercase rounded-lg hover:bg-neutral-100 transition-colors shadow-sm shrink-0"
          >
            Clear &amp; Resume
          </button>
        </div>
      )}

      {/* Mobile Sticky Tactical Quick Action Strip */}
      <div className="lg:hidden w-full bg-surface-container-low rounded-xl p-2.5 border border-outline-variant/20 shadow-md flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${rangeStatus === 'HOT' ? 'bg-primary animate-pulse' : 'bg-secondary'}`} />
            <span className="font-label-caps text-[11px] uppercase text-on-surface font-bold tracking-wider">
              {rangeStatus === 'HOT' ? 'RANGE HOT // LIVE FIRE' : 'RANGE COLD // CEASE-FIRE'}
            </span>
          </div>
          <span className="font-telemetry-sm text-[10px] text-tertiary">SCADA Interlock Active</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Emergency Safety Interlock Button */}
          <button
            disabled={isLoading}
            onClick={onToggleStatus}
            className={`rounded-lg p-2.5 flex items-center justify-center gap-2 text-center transition-all active:scale-95 shadow-md min-h-[46px] ${
              rangeStatus === 'HOT'
                ? 'bg-secondary-container text-white border-2 border-secondary shadow-secondary/30'
                : 'bg-surface-container-highest text-on-surface border border-outline-variant'
            }`}
          >
            {rangeStatus === 'HOT' ? (
              <IconWarning className="w-5 h-5 text-secondary animate-bounce" />
            ) : (
              <IconLockOpen className="w-5 h-5 text-primary" />
            )}
            <span className="font-headline-md text-xs font-black uppercase tracking-tight">
              {rangeStatus === 'HOT' ? 'CALL CEASEFIRE' : 'RESUME HOT'}
            </span>
          </button>

          {/* Quick Intake Kiosk Button */}
          <button
            type="button"
            onClick={() => router.push("/checkin")}
            className="bg-primary hover:bg-primary-container text-on-primary-container rounded-lg p-2.5 flex items-center justify-center gap-1.5 text-center transition-all active:scale-95 shadow-md min-h-[46px]"
          >
            <IconPersonAdd className="w-4 h-4 text-on-primary" />
            <span className="font-headline-md text-xs font-bold tracking-tight text-on-primary">+ Intake Kiosk</span>
          </button>
        </div>

        {/* Mobile View Segmented Control Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container-lowest rounded-lg border border-outline-variant/15 mt-1">
          <button
            onClick={() => setMobileTab("lanes")}
            className={`py-1.5 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "lanes"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <IconGridView className="w-3.5 h-3.5" />
            Lanes (12)
          </button>
          <button
            onClick={() => setMobileTab("kpis")}
            className={`py-1.5 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "kpis"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <IconAnalytics className="w-3.5 h-3.5" />
            Metrics
          </button>
          <button
            onClick={() => setMobileTab("logs")}
            className={`py-1.5 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "logs"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <IconListAlt className="w-3.5 h-3.5" />
            Audit Log
          </button>
        </div>
      </div>

      {/* Desktop KPI Strip (Always visible on lg+) */}
      <div className="hidden lg:block">
        <KpiGrid />
      </div>

      {/* Mobile Tab-based Views */}
      <div className="lg:hidden w-full">
        {mobileTab === "lanes" && (
          <LaneMatrix lanes={lanes} isLoading={isLoading} />
        )}
        {mobileTab === "kpis" && (
          <div className="flex flex-col gap-2.5">
            <KpiGrid />
          </div>
        )}
        {mobileTab === "logs" && (
          <RightPanel rangeStatus={rangeStatus} onToggleStatus={onToggleStatus} isLoading={isLoading} />
        )}
      </div>

      {/* Desktop Side-by-Side View (lg+) */}
      <section className="hidden lg:grid grid-cols-12 gap-gutter w-full items-start flex-1 min-h-0 pb-space-lg">
        <LaneMatrix lanes={lanes} isLoading={isLoading} />
        <RightPanel rangeStatus={rangeStatus} onToggleStatus={onToggleStatus} isLoading={isLoading} />
      </section>
    </div>
  );
}
