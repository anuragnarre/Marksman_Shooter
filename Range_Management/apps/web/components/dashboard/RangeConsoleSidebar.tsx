"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface RangeConsoleSidebarProps {
  className?: string;
}

export function RangeConsoleSidebar({ className = "" }: RangeConsoleSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Command Center", icon: "dashboard" },
    { href: "/lanes", label: "Lanes & Live Firing", icon: "my_location" },
    { href: "/checkin", label: "Memberships & Kiosk", icon: "badge" },
    { href: "/safety", label: "Safety & Incident Logs", icon: "report" },
    { href: "/settings", label: "Range Settings", icon: "tune" },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-56 md:w-64 bg-surface-container-low border-r border-outline-variant/20 shadow-xl z-50 flex flex-col justify-between select-none ${className}`}
    >
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-14 flex items-center gap-3 px-4 bg-surface-container-lowest border-b border-outline-variant/15">
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
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-surface-container-high text-primary font-semibold shadow-sm border-l-2 border-primary"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isActive ? "text-primary" : "text-outline"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Optical Sensors & E-STOP Status Card */}
      <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/15">
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
            <span className="material-symbols-outlined text-[13px] text-primary">verified_user</span>
            <span>E-STOP Interlock Armed</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
