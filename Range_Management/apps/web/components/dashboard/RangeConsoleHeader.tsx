"use client";

import React from "react";
import { useTheme } from "../../contexts/theme-context";
import { useAuth } from "../../contexts/auth-context";

interface RangeConsoleHeaderProps {
  rangeStatus: "HOT" | "COLD";
  onToggleStatus: () => void;
  className?: string;
}

export function RangeConsoleHeader({
  rangeStatus,
  onToggleStatus,
  className = "",
}: RangeConsoleHeaderProps) {
  const { resolvedTheme, toggleTheme, dashboardTheme, setDashboardTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header
      className={`fixed top-0 left-56 md:left-64 right-0 h-14 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 shadow-sm z-40 flex items-center justify-between px-4 lg:px-6 select-none ${className}`}
    >
      {/* Left: Range Selector & Environmental Telemetry */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
          <span className="material-symbols-outlined text-outline text-[16px]">corporate_fare</span>
          <span className="font-telemetry-sm text-[12px] text-on-surface font-semibold">
            Main Indoor Range - 25yd
          </span>
          <span className="material-symbols-outlined text-outline text-[16px]">arrow_drop_down</span>
        </div>

        <div className="hidden xl:flex items-center gap-3 bg-surface-container-low px-3 py-1.5 rounded-lg text-on-surface-variant border border-outline-variant/15 text-[12px]">
          <div className="flex items-center gap-1 font-telemetry-sm text-on-surface">
            <span className="material-symbols-outlined text-primary text-[15px]">thermostat</span>
            <span>21.4°C</span>
          </div>
          <span className="text-outline">|</span>
          <div className="flex items-center gap-1 font-telemetry-sm text-on-surface">
            <span className="material-symbols-outlined text-tertiary text-[15px]">air</span>
            <span>1.2 m/s NW</span>
          </div>
          <span className="text-outline">|</span>
          <div className="flex items-center gap-1 font-telemetry-sm text-on-surface">
            <span className="material-symbols-outlined text-outline text-[15px]">speed</span>
            <span>42% RH</span>
          </div>
          <span className="text-outline">|</span>
          <div className="flex items-center gap-1 font-telemetry-sm text-tertiary font-semibold">
            <span className="material-symbols-outlined text-[15px]">videocam</span>
            <span>18/18 CAMERAS</span>
          </div>
        </div>
      </div>

      {/* Right: Master Status Pill, Theme Switcher, Optics Mode Toggle, User Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Master Range Status Badge */}
        <button
          onClick={onToggleStatus}
          title="Click to toggle Range Master Status"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-label-caps uppercase tracking-wider font-bold transition-all shadow-sm ${
            rangeStatus === "HOT"
              ? "bg-secondary-container text-on-secondary-container hover:opacity-90 animate-pulse border border-secondary"
              : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              rangeStatus === "HOT" ? "bg-secondary" : "bg-outline"
            }`}
          />
          <span>{rangeStatus === "HOT" ? "● RANGE HOT / LIVE FIRE" : "○ RANGE COLD / CEASE FIRE"}</span>
        </button>

        {/* Dashboard Interface Theme Switcher Pill */}
        <div className="hidden sm:flex items-center bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/20 text-[11px] font-label-caps">
          <button
            onClick={() => setDashboardTheme("compact-tactical")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              dashboardTheme === "compact-tactical"
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
            title="Compact Desktop Tactical Console"
          >
            Tactical
          </button>
          <button
            onClick={() => setDashboardTheme("harmonized-precision")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              dashboardTheme === "harmonized-precision"
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
            title="Harmonized Precision Facility Console"
          >
            Facility
          </button>
        </div>

        {/* Optics Mode Toggle (Light / Dark Mode) */}
        <button
          onClick={toggleTheme}
          type="button"
          title={`Switch to ${resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}`}
          className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface flex items-center justify-center transition-all border border-outline-variant/20 shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">
            {resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* User / RSO Profile */}
        <div className="flex items-center gap-2 pl-1 bg-surface-container-low py-1 px-2.5 rounded-lg border border-outline-variant/15">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="font-body-md text-[12px] text-on-surface leading-tight font-semibold">
              {user?.name || "Sgt. Miller"}
            </span>
            <span className="font-label-caps text-[9px] uppercase text-primary font-bold">
              {user?.role === "RANGE_OPERATOR" ? "Lead RSO" : user?.role || "Operator"}
            </span>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[16px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
