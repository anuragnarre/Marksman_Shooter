"use client";

import React from "react";
import { useTheme } from "../../contexts/theme-context";
import { useAuth } from "../../contexts/auth-context";
import { IconMenu, IconBuilding, IconSun, IconMoon, IconPerson, MaterialIcon } from "../ui/TacticalIcons";

interface RangeConsoleHeaderProps {
  rangeStatus: "HOT" | "COLD";
  onToggleStatus: () => void;
  onToggleSidebar?: () => void;
  className?: string;
}

export function RangeConsoleHeader({
  rangeStatus,
  onToggleStatus,
  onToggleSidebar,
  className = "",
}: RangeConsoleHeaderProps) {
  const { resolvedTheme, toggleTheme, dashboardTheme, setDashboardTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header
      className={`fixed top-0 left-0 lg:left-64 right-0 pt-[var(--sat)] h-[calc(3.5rem+var(--sat))] bg-surface border-b border-outline-variant/30 shadow-md z-40 flex items-center justify-between px-2.5 sm:px-4 lg:px-6 select-none ${className}`}
    >
      {/* Left: Mobile Menu Toggle + Range Selector & Environmental Telemetry */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            type="button"
            className="lg:hidden p-1.5 -ml-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors flex items-center justify-center shrink-0"
            title="Toggle Navigation Menu"
          >
            <IconMenu className="w-5 h-5 text-on-surface" />
          </button>
        )}

        <div className="flex items-center gap-1.5 bg-surface-container-low px-2 sm:px-3 py-1.5 rounded-lg border border-outline-variant/20 min-w-0">
          <IconBuilding className="w-3.5 h-3.5 text-outline shrink-0" />
          <span className="font-telemetry-sm text-[11px] sm:text-[12px] text-on-surface font-semibold truncate max-w-[85px] sm:max-w-none">
            Main Indoor
          </span>
        </div>

        <div className="hidden xl:flex items-center gap-3 bg-surface-container-low px-3 py-1.5 rounded-lg text-on-surface-variant border border-outline-variant/15 text-[12px]">
          <div className="flex items-center gap-1 font-telemetry-sm text-on-surface">
            <MaterialIcon name="thermostat" className="text-primary w-[15px] h-[15px]" />
            <span>21.4°C</span>
          </div>
          <span className="text-outline">|</span>
          <div className="flex items-center gap-1 font-telemetry-sm text-on-surface">
            <MaterialIcon name="air" className="text-tertiary w-[15px] h-[15px]" />
            <span>1.2 m/s NW</span>
          </div>
          <span className="text-outline">|</span>
          <div className="flex items-center gap-1 font-telemetry-sm text-on-surface">
            <MaterialIcon name="speed" className="text-outline w-[15px] h-[15px]" />
            <span>42% RH</span>
          </div>
          <span className="text-outline">|</span>
          <div className="flex items-center gap-1 font-telemetry-sm text-tertiary font-semibold">
            <MaterialIcon name="videocam" className="w-[15px] h-[15px]" />
            <span>18/18 CAMERAS</span>
          </div>
        </div>
      </div>

      {/* Right: Master Status Pill, Theme Switcher, Optics Mode Toggle, User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Master Range Status Badge */}
        <button
          onClick={onToggleStatus}
          title="Click to toggle Range Master Status"
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-label-caps uppercase tracking-wider font-bold transition-all shadow-sm ${
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
          <span className="hidden sm:inline">{rangeStatus === "HOT" ? "● RANGE HOT / LIVE FIRE" : "○ RANGE COLD / CEASE FIRE"}</span>
          <span className="sm:hidden">{rangeStatus === "HOT" ? "HOT" : "COLD"}</span>
        </button>

        {/* Dashboard Interface Theme Switcher Pill */}
        <div className="hidden sm:flex items-center bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/20 text-[11px] font-label-caps">
          <button
            onClick={() => setDashboardTheme("compact-tactical")}
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md transition-all ${
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
            className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md transition-all ${
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
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface flex items-center justify-center transition-all border border-outline-variant/20 shadow-xs shrink-0"
        >
          {resolvedTheme === "dark" ? (
            <IconSun className="w-4 h-4 text-primary" />
          ) : (
            <IconMoon className="w-4 h-4 text-on-surface" />
          )}
        </button>

        {/* User / RSO Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2 rounded-lg bg-surface-container-low border border-outline-variant/15 shrink-0">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="font-body-md text-[12px] text-on-surface leading-tight font-semibold">
              {user?.name || "Sgt. Miller"}
            </span>
            <span className="font-label-caps text-[9px] uppercase text-primary font-bold">
              {user?.role === "RANGE_OPERATOR" ? "Lead RSO" : user?.role || "Operator"}
            </span>
          </div>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0">
            <IconPerson className="w-3.5 h-3.5 text-on-primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
