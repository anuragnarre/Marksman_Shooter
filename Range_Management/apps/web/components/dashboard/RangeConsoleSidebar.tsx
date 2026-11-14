"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "../../contexts/theme-context";
import { useAuth } from "../../contexts/auth-context";
import { MaterialIcon } from "../ui/TacticalIcons";

interface RangeConsoleSidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function RangeConsoleSidebar({
  className = "",
  isOpen = false,
  onClose,
}: RangeConsoleSidebarProps) {
  const pathname = (usePathname() || "/").replace(/\/$/, "") || "/";
  const router = useRouter();
  const { dashboardTheme, setDashboardTheme } = useTheme();
  const { logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Command Center", icon: "dashboard" },
    { href: "/lanes", label: "Lanes & Live Firing", icon: "my_location" },
    { href: "/lanes/config", label: "Camera Calibration", icon: "center_focus_strong" },
    { href: "/bookings", label: "Bookings & Schedule", icon: "calendar_month" },
    { href: "/checkin", label: "Memberships & Kiosk", icon: "badge" },
    { href: "/safety", label: "Safety & Incident Logs", icon: "report" },
    { href: "/settings", label: "Range Settings", icon: "tune" },
  ];

  const portalItems = [
    { href: "/rso/dashboard", label: "RSO Firing Line", icon: "shield_with_heart" },
    { href: "/range-admin/dashboard", label: "Facility Admin", icon: "analytics" },
    { href: "/staff/dashboard", label: "Staff Portal", icon: "assignment_ind" },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 pt-[var(--sat)] pb-[var(--sab)] bg-surface-container-low border-r border-outline-variant/20 shadow-2xl lg:shadow-md z-50 flex flex-col justify-between select-none transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${className}`}
      >
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-surface-container-lowest border-b border-outline-variant/15">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="font-headline-md font-bold text-primary text-[16px]">M</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-[11px] uppercase text-on-surface font-bold tracking-wider">
                  MARKSMAN
                </span>
                <span className="font-telemetry-sm text-[9px] uppercase text-outline tracking-wider leading-none">
                  Range Console
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="lg:hidden p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
              title="Close Navigation Menu"
            >
              <MaterialIcon name="close" className="w-5 h-5" />
            </button>
          </div>

          {/* Facility Operations Nav */}
          <div className="px-3 py-3">
            <div className="px-2 py-1 font-label-caps text-[10px] uppercase text-outline tracking-wider font-semibold">
              Facility Operations
            </div>
            <nav className="flex flex-col gap-1 mt-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                      isActive
                        ? "bg-surface-container-high text-primary font-semibold shadow-sm border-l-2 border-primary"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`}
                  >
                    <MaterialIcon
                      name={item.icon}
                      className={`w-[18px] h-[18px] ${
                        isActive ? "text-primary" : "text-outline"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Role Portals */}
            <div className="px-2 pt-4 pb-1 font-label-caps text-[10px] uppercase text-outline tracking-wider font-semibold">
              Role Portals
            </div>
            <nav className="flex flex-col gap-1 mt-1">
              {portalItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                      isActive
                        ? "bg-surface-container-high text-primary font-semibold shadow-sm border-l-2 border-primary"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`}
                  >
                    <MaterialIcon
                      name={item.icon}
                      className={`w-[18px] h-[18px] ${
                        isActive ? "text-primary" : "text-outline"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Layout Switcher */}
            <div className="sm:hidden px-2 pt-4 pb-1">
              <div className="font-label-caps text-[10px] uppercase text-outline tracking-wider font-semibold mb-1.5">
                Console Mode
              </div>
              <div className="grid grid-cols-2 gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/20 text-[11px] font-label-caps">
                <button
                  type="button"
                  onClick={() => setDashboardTheme("compact-tactical")}
                  className={`py-1.5 rounded-md font-bold transition-colors ${
                    dashboardTheme === "compact-tactical"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  Tactical
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardTheme("harmonized-precision")}
                  className={`py-1.5 rounded-md font-bold transition-colors ${
                    dashboardTheme === "harmonized-precision"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  Facility
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Optical Sensors & E-STOP Status Card + Sign Out */}
        <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/15 space-y-2 shrink-0">
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[10px] uppercase text-outline font-semibold">
                Optical Sensors
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface font-semibold">
              <span className="font-telemetry-sm text-telemetry-sm">18/18 Cameras</span>
              <span className="font-telemetry-sm text-telemetry-sm text-tertiary font-bold">Online</span>
            </div>
            <div className="font-telemetry-sm text-[10px] text-outline truncate flex items-center gap-1">
              <MaterialIcon name="verified_user" className="w-[13px] h-[13px] text-primary" />
              <span>E-STOP Interlock Armed</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose?.();
              logout();
              router.push("/auth/login");
            }}
            className="w-full py-2 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 text-[11px] font-label-caps uppercase tracking-wider font-semibold text-on-surface-variant hover:text-error flex items-center justify-center gap-1.5 transition-colors"
          >
            <MaterialIcon name="meeting_room" className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
