"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "../../contexts/theme-context";
import { useAuth } from "../../contexts/auth-context";
import {
  IconMenu,
  IconBuilding,
  IconDashboard,
  IconMyLocation,
  IconBadge,
  IconReport,
  MaterialIcon,
} from "../ui/TacticalIcons";

interface NavItem {
  name: string;
  href: string;
  icon: string; // Icon name for MaterialIcon
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "SHOOTER" | "COACH" | "RANGE_OPERATOR" | "RANGE_ADMIN" | "RSO" | "STAFF";
  /** Page title shown in mobile header (next to back button) */
  pageTitle?: string;
  /** If true, show a back-chevron in the mobile header instead of hamburger */
  showBack?: boolean;
}

const RANGE_OPERATOR_NAV: NavItem[] = [
  { name: "Command Center", href: "/dashboard", icon: "dashboard" },
  { name: "Lanes & Live Firing", href: "/lanes", icon: "my_location" },
  { name: "Camera Calibration", href: "/lanes/config", icon: "center_focus_strong" },
  { name: "Booking & Schedule", href: "/bookings", icon: "event" },
  { name: "Memberships & Kiosk", href: "/checkin", icon: "badge" },
  { name: "Safety & Audit", href: "/safety", icon: "report" },
  { name: "Range Settings", href: "/settings", icon: "tune" },
];

const PORTAL_NAV: NavItem[] = [
  { name: "RSO Firing Line", href: "/rso/dashboard", icon: "shield_with_heart" },
  { name: "Facility Admin", href: "/range-admin/dashboard", icon: "analytics" },
  { name: "Staff Portal", href: "/staff/dashboard", icon: "assignment_ind" },
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

// Bottom nav items for mobile (4 primary tabs + More drawer trigger) - Range Operator focused
const BOTTOM_NAV = [
  { label: "Console", href: "/dashboard",  Icon: IconDashboard },
  { label: "Lanes",   href: "/lanes",      Icon: IconMyLocation },
  { label: "Kiosk",   href: "/checkin",    Icon: IconBadge },
  { label: "Safety",  href: "/safety",     Icon: IconReport },
];

export function DashboardLayout({ children, role = "RANGE_OPERATOR", pageTitle, showBack }: DashboardLayoutProps) {
  const rawPathname = usePathname() || "/";
  const pathname = rawPathname.replace(/\/$/, "") || "/";
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(2);
  const { resolvedTheme, setTheme, dashboardTheme, setDashboardTheme } = useTheme();
  const { user, logout } = useAuth();

  const navigation = role === "SHOOTER" ? SHOOTER_NAV :
                     role === "COACH" ? COACH_NAV :
                     role === "RANGE_ADMIN" && pathname.startsWith("/competitions") ? COMPETITION_ADMIN_NAV :
                     RANGE_OPERATOR_NAV;

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // ── Android Hardware Back Button Handler ──────────────────────────────────
  // Intercept Capacitor's backButton event so the hardware back button
  // navigates within the SPA instead of killing the activity.
  useEffect(() => {
    let listener: (() => void) | null = null;

    const setupBackHandler = async () => {
      try {
        // Dynamically import to avoid SSR crash / non-Capacitor environments
        const { App } = await import("@capacitor/app");

        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          // If the webview history has a previous page, go back
          if (canGoBack) {
            router.back();
          } else if (pathname !== "/dashboard") {
            // Safety net: if history is empty but we're not on the root, go home
            router.push("/dashboard");
          }
          // If we're already on /dashboard and can't go back → do nothing (don't quit)
        });

        // App.addListener returns a { remove } handle in newer Capacitor versions
        if (handle && typeof (handle as any).remove === "function") {
          listener = () => (handle as any).remove();
        }
      } catch {
        // Not running in Capacitor (web dev mode) — no-op
      }
    };

    setupBackHandler();
    return () => { listener?.(); };
  }, [pathname, router]);

  // Derive display title from nav if not provided explicitly
  const derivedTitle = pageTitle ?? navigation.find(n => pathname === n.href || pathname.startsWith(`${n.href}/`))?.name ?? "Range Console";

  // Is the current path one of the main bottom-nav roots?
  const isRootPage = BOTTOM_NAV.some(n => pathname === n.href);
  // Show back chevron when: showBack prop set, OR we're on a deep sub-page (not a root tab)
  const showBackBtn = showBack || !isRootPage;

  return (
    <div className="flex h-[100dvh] w-full bg-surface text-on-surface font-body-md antialiased overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Desktop / Slide-in Sidebar ───────────────────────────────────── */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-56 pt-[var(--sat)] pb-[var(--sab)] bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.3)] z-50 flex-col justify-between select-none transition-transform duration-300 lg:translate-x-0",
          isSidebarOpen ? "translate-x-0 flex" : "-translate-x-full hidden lg:flex"
        )}
      >
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto">
          <div className="h-14 shrink-0 flex items-center gap-space-sm px-space-md bg-surface-container-lowest border-none relative">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border-none flex items-center justify-center">
              <span className="font-headline-md font-bold text-primary text-[16px]">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-caps text-[11px] uppercase text-on-surface font-bold tracking-wider">MARKSMAN</span>
              <span className="font-telemetry-sm text-[9px] uppercase text-outline tracking-wider leading-none mt-[2px]">Range Console</span>
            </div>
            <button
              type="button"
              className="ml-auto lg:hidden text-on-surface-variant absolute right-4 p-1 rounded-lg hover:bg-surface-container-high"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <MaterialIcon name="close" className="w-5 h-5" />
            </button>
          </div>

          <div className="px-space-md py-space-sm">
            <div className="px-space-xs py-space-xs font-label-caps text-[10px] uppercase text-outline tracking-wider font-semibold">Facility Operations</div>
            <nav className="flex flex-col gap-1 mt-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/lanes" && pathname.startsWith(`${item.href}/`));
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
                    <MaterialIcon name={item.icon} className={cn("w-[18px] h-[18px]", isActive ? "text-primary" : "")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="px-space-xs pt-4 pb-1 font-label-caps text-[10px] uppercase text-outline tracking-wider font-semibold">Role Portals</div>
            <nav className="flex flex-col gap-1 mt-1">
              {PORTAL_NAV.map((item) => {
                const isActive = pathname === item.href;
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
                    <MaterialIcon name={item.icon} className={cn("w-[18px] h-[18px]", isActive ? "text-primary" : "")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="sm:hidden pt-3 px-1">
              <div className="font-label-caps text-[10px] uppercase text-outline tracking-wider font-semibold mb-1.5">Console Mode</div>
              <div className="grid grid-cols-2 gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/20 text-[11px] font-label-caps">
                <button
                  type="button"
                  onClick={() => setDashboardTheme("compact-tactical")}
                  className={cn("py-1.5 rounded-md font-bold", dashboardTheme === "compact-tactical" ? "bg-primary text-on-primary" : "text-on-surface-variant")}
                >
                  Tactical
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardTheme("harmonized-precision")}
                  className={cn("py-1.5 rounded-md font-bold", dashboardTheme === "harmonized-precision" ? "bg-primary text-on-primary" : "text-on-surface-variant")}
                >
                  Facility
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-space-md bg-surface-container-lowest space-y-2 shrink-0">
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

          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
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

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-56 flex flex-col w-full h-full relative">

        {/* Fixed Top Header */}
        <header className="fixed top-0 left-0 lg:left-56 right-0 pt-[var(--sat)] h-[calc(3.5rem+var(--sat))] bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.3)] z-40 flex items-center justify-between px-space-md lg:px-space-xl select-none">
          <div className="flex items-center gap-space-sm min-w-0">

            {/* Mobile: back chevron OR hamburger */}
            {showBackBtn ? (
              <button
                type="button"
                className="lg:hidden text-on-surface-variant flex items-center justify-center p-1 -ml-1 mr-1 active:bg-surface-container-high rounded-lg transition-colors"
                onClick={() => {
                  if (window.history.length > 1) router.back();
                  else router.push("/dashboard");
                }}
                aria-label="Go back"
              >
                <MaterialIcon name="arrow_back" className="w-[22px] h-[22px]" />
              </button>
            ) : (
              <button
                type="button"
                className="lg:hidden text-on-surface-variant mr-2 flex items-center justify-center p-1"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                <IconMenu className="w-5 h-5 text-on-surface" />
              </button>
            )}

            {/* Page title chip */}
            {role !== "SHOOTER" && role !== "COACH" && !pathname.startsWith("/competitions") ? (
              <>
                <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-xs rounded-lg min-w-0">
                  {showBackBtn ? (
                    <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold truncate">{derivedTitle}</span>
                  ) : (
                    <>
                      <IconBuilding className="w-4 h-4 text-outline shrink-0" />
                      <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold hidden sm:inline">Main Indoor Range - 25yd</span>
                      <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold sm:hidden truncate">Main - 25yd</span>
                    </>
                  )}
                </div>

                <div className="hidden xl:flex items-center gap-space-md bg-surface-container-low px-space-md py-space-xs rounded-lg text-on-surface-variant">
                  <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-on-surface">
                    <MaterialIcon name="thermostat" className="text-primary w-[15px] h-[15px]" />
                    <span>72°F</span>
                  </div>
                  <span className="text-outline text-body-sm">|</span>
                  <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-on-surface">
                    <MaterialIcon name="air" className="text-tertiary w-[15px] h-[15px]" />
                    <span>3mph NNW</span>
                  </div>
                  <span className="text-outline text-body-sm">|</span>
                  <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-on-surface">
                    <MaterialIcon name="speed" className="text-outline w-[15px] h-[15px]" />
                    <span>29.92 inHg</span>
                  </div>
                  <span className="text-outline text-body-sm">|</span>
                  <div className="flex items-center gap-space-xs font-telemetry-sm text-telemetry-sm text-tertiary">
                    <MaterialIcon name="videocam" className="w-[15px] h-[15px]" />
                    <span>18/18 CAMERAS ONLINE</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-space-xs bg-surface-container-low px-space-md py-space-xs rounded-lg">
                <MaterialIcon
                  name={role === "COACH" ? "sports" : pathname.startsWith("/competitions") ? "emoji_events" : "person"}
                  className="text-outline w-4 h-4"
                />
                <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold hidden sm:inline">
                  {role === "COACH" ? "Coach Portal" : pathname.startsWith("/competitions") ? "Tournament Manager" : "Athlete Profile"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-space-sm lg:gap-space-md shrink-0 relative">
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
              <MaterialIcon name="contrast" className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => {
                setShowNotifications((prev) => !prev);
                setUnreadAlerts(0);
              }}
              className="relative w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
              type="button"
              title="Notifications"
            >
              <MaterialIcon name="notifications" className="w-[18px] h-[18px]" />
              {unreadAlerts > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"></span>}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-10 w-64 rounded-xl bg-surface-container-high border border-outline-variant/30 shadow-2xl p-3 z-50 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                  <span className="font-label-caps text-[10px] uppercase font-bold text-primary">Range Alerts</span>
                  <button type="button" onClick={() => setShowNotifications(false)} className="text-outline hover:text-on-surface">
                    <MaterialIcon name="close" className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low">
                  <p className="font-semibold text-on-surface">Bay 1-12 E-STOP Armed</p>
                  <p className="text-[11px] text-on-surface-variant">All target carriers synchronized.</p>
                </div>
                <div className="p-2 rounded-lg bg-surface-container-low">
                  <p className="font-semibold text-on-surface">Walk-in Queue Active</p>
                  <p className="text-[11px] text-on-surface-variant">Open Express Kiosk to assign bay.</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-space-sm pl-space-xs bg-surface-container-low py-1 px-space-sm rounded-lg">
              <div className="flex-col text-right hidden sm:flex">
                <span className="font-body-md text-body-sm text-on-surface leading-tight font-semibold">
                  {user?.name || (role === "SHOOTER" ? "Shooter 1" : role === "COACH" ? "Coach Sarah" : "Sgt. Miller")}
                </span>
                <span className="font-label-caps text-[9px] uppercase text-primary font-bold">
                  {role === "SHOOTER" ? "ATHLETE" : role === "COACH" ? "HEAD COACH" : pathname.startsWith("/competitions") ? "ORGANIZER" : "Lead RSO"}
                </span>
              </div>
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <MaterialIcon name="person" className="text-on-primary w-4 h-4" />
              </div>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="relative pt-[calc(3.5rem+var(--sat))] pb-[calc(4.75rem+var(--sab))] lg:pb-4 w-full flex-1 bg-surface overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </main>

        {/* ── Mobile Bottom Navigation Bar ───────────────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 h-[calc(3.5rem+var(--sab))] pb-[var(--sab)] bg-surface-container-lowest border-t border-outline-variant/30 z-40 flex items-center justify-around lg:hidden select-none px-2 shadow-2xl">
          {BOTTOM_NAV.map(({ label, href, Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 min-w-[52px] rounded-xl transition-colors active:bg-surface-container-high",
                  active ? "text-primary" : "text-on-surface-variant hover:text-primary"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-on-surface-variant")} />
                <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>{label}</span>
              </Link>
            );
          })}
          {/* More → opens sidebar */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 min-w-[52px] text-on-surface-variant hover:text-primary rounded-xl transition-colors active:bg-surface-container-high"
          >
            <IconMenu className="w-5 h-5 text-on-surface-variant" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
