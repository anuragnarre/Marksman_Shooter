"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "../../contexts/theme-context";

interface NavItem {
  name: string;
  href: string;
  icon: string; // Material symbol name
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "SHOOTER" | "COACH" | "RANGE_OPERATOR" | "RANGE_ADMIN";
}

const RANGE_OPERATOR_NAV: NavItem[] = [
  { name: "Command Center", href: "/dashboard", icon: "dashboard" },
  { name: "Lane & Live Vision", href: "/lanes/vision", icon: "my_location" },
  { name: "Lane & Camera Config", href: "/lanes/config", icon: "videocam" },
  { name: "Booking & Schedule", href: "/bookings", icon: "event" },
  { name: "Members & Shooters", href: "/memberships", icon: "badge" },
  { name: "Payments & Billing", href: "/payments", icon: "receipt_long" },
  { name: "Safety & Audit", href: "/safety", icon: "report" },
];

const SHOOTER_NAV: NavItem[] = [
  { name: "My Dashboard", href: "/shooter/dashboard", icon: "dashboard" },
  { name: "My Profile", href: "/shooter/profile", icon: "person" },
  { name: "Sessions & History", href: "/shooter/sessions", icon: "history" },
  { name: "Leaderboard", href: "/shooter/leaderboard", icon: "leaderboard" },
  { name: "Goals & Streaks", href: "/shooter/goals", icon: "track_changes" },
];

const COACH_NAV: NavItem[] = [
  { name: "Coach Dashboard", href: "/coach/dashboard", icon: "dashboard" },
  { name: "My Squads", href: "/coach/squads", icon: "groups" },
  { name: "Live Monitoring", href: "/coach/live", icon: "query_stats" },
  { name: "Drill Library", href: "/coach/drills", icon: "sports_score" },
  { name: "Reports", href: "/coach/reports", icon: "analytics" },
];

const COMPETITION_ADMIN_NAV: NavItem[] = [
  { name: "Competitions", href: "/competitions/dashboard", icon: "emoji_events" },
  { name: "Live Scoreboard", href: "/competitions/scoreboard", icon: "scoreboard" },
];

export function DashboardLayout({ children, role = "RANGE_OPERATOR" }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const navigation = role === "SHOOTER" ? SHOOTER_NAV : 
                     role === "COACH" ? COACH_NAV :
                     role === "RANGE_ADMIN" && pathname.startsWith("/competitions") ? COMPETITION_ADMIN_NAV :
                     RANGE_OPERATOR_NAV;

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen w-full bg-surface text-on-surface font-body-md antialiased overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-56 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.3)] z-50 flex-col justify-between select-none transition-transform duration-300 lg:translate-x-0",
          isSidebarOpen ? "translate-x-0 flex" : "-translate-x-full hidden lg:flex"
        )}
      >
        <div className="flex flex-col">
          <div className="h-14 flex items-center gap-space-sm px-space-md bg-surface-container-lowest border-none relative">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border-none flex items-center justify-center">
              <span className="font-headline-md font-bold text-primary text-[16px]">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-[11px] uppercase text-on-surface font-bold tracking-wider">MARKSMAN</span>
              <span className="font-telemetry-sm text-[9px] uppercase text-outline tracking-wider leading-none mt-[2px]">Range Console</span>
            </div>
            <button className="ml-auto lg:hidden text-on-surface-variant absolute right-4" onClick={() => setSidebarOpen(false)}>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="px-space-md py-space-sm">
            <div className="px-space-xs py-space-xs font-label-caps text-[10px] uppercase text-outline tracking-wider font-semibold">Facility Operations</div>
            <nav className="flex flex-col gap-1 mt-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-space-sm px-space-sm py-2 rounded-lg text-[13px] transition-colors border-none",
                      isActive
                        ? "bg-surface-container-high text-primary font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className={cn("material-symbols-outlined text-[18px]", isActive ? "text-primary" : "")}>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest">
          <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[10px] uppercase text-outline font-semibold">Optical Sensors</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
              </span>
            </div>
            <div className="flex items-center justify-between text-on-surface">
              <span className="font-telemetry-sm text-telemetry-sm">18/18 Cameras</span>
              <span className="font-telemetry-sm text-telemetry-sm text-tertiary">Online</span>
            </div>
            <div className="font-telemetry-sm text-[10px] text-outline truncate">E-STOP Interlock Armed</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-56 flex flex-col w-full h-full relative">
        <header className="fixed top-0 left-0 lg:left-56 right-0 h-14 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.3)] z-40 flex items-center justify-between px-space-md lg:px-space-xl select-none">
          <div className="flex items-center gap-space-md">
            <button
              className="lg:hidden text-on-surface-variant mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            {role !== "SHOOTER" && role !== "COACH" && !pathname.startsWith("/competitions") ? (
              <>
                <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-xs rounded-lg">
                  <span className="material-symbols-outlined text-outline text-[16px]">corporate_fare</span>
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold hidden sm:inline">Main Indoor Range - 25yd</span>
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold sm:hidden">Main - 25yd</span>
                  <span className="material-symbols-outlined text-outline text-[16px]">arrow_drop_down</span>
                </div>
                
                <div className="hidden xl:flex items-center gap-space-md bg-surface-container-low px-space-md py-space-xs rounded-lg text-on-surface-variant">
                  <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[15px]">thermostat</span>
                    <span>72°F</span>
                  </div>
                  <span className="text-outline text-body-sm">|</span>
                  <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-on-surface">
                    <span className="material-symbols-outlined text-tertiary text-[15px]">air</span>
                    <span>3mph NNW</span>
                  </div>
                  <span className="text-outline text-body-sm">|</span>
                  <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-on-surface">
                    <span className="material-symbols-outlined text-outline text-[15px]">speed</span>
                    <span>29.92 inHg</span>
                  </div>
                  <span className="text-outline text-body-sm">|</span>
                  <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-tertiary">
                    <span className="material-symbols-outlined text-[15px]">videocam</span>
                    <span>18/18 CAMERAS ONLINE</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-xs rounded-lg">
                <span className="material-symbols-outlined text-outline text-[16px]">
                  {role === "COACH" ? "sports" : pathname.startsWith("/competitions") ? "emoji_events" : "person"}
                </span>
                <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold hidden sm:inline">
                  {role === "COACH" ? "Coach Portal" : pathname.startsWith("/competitions") ? "Tournament Manager" : "Athlete Profile"}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-space-sm lg:gap-space-md">
            {role !== "SHOOTER" && role !== "COACH" && !pathname.startsWith("/competitions") && (
              <div className="hidden md:flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-secondary-container text-on-secondary-container">
                <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider font-bold text-[10px]">● RANGE HOT / LIVE FIRE</span>
              </div>
            )}
            
            <button 
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
              title="Toggle Optics Mode"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                contrast
              </span>
            </button>
            <button className="relative w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors" type="button">
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"></span>
            </button>
            
            <div className="flex items-center gap-space-sm pl-space-xs bg-surface-container-low py-1 px-space-sm rounded-lg">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="font-body-md text-body-sm text-on-surface leading-tight font-semibold">
                  {role === "SHOOTER" ? "Shooter 1" : role === "COACH" ? "Coach Sarah" : "Sgt. Miller"}
                </span>
                <span className="font-label-caps text-[9px] uppercase text-primary font-bold">
                  {role === "SHOOTER" ? "ATHLETE" : role === "COACH" ? "HEAD COACH" : pathname.startsWith("/competitions") ? "ORGANIZER" : "Lead RSO"}
                </span>
              </div>
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[16px]">person</span>
              </div>
            </div>
          </div>
        </header>

        <main className="relative pt-14 w-full h-full bg-surface overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
