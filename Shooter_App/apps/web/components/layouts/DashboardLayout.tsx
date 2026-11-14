"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  Activity,
  Target,
  Crosshair,
  User,
  Settings,
  Menu,
  X,
  Calendar,
  LogOut,
  MapPin,
  ShieldCheck,
  Users
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "SHOOTER" | "COACH";
}

const SHOOTER_NAV: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: Activity },
  { name: "My Sessions", href: "/sessions", icon: Target },
  { name: "Armory", href: "/armory", icon: ShieldCheck },
  { name: "Shooter Profile", href: "/profile", icon: User },
  { name: "Digital Pass", href: "/pass", icon: ShieldCheck },
  { name: "Book Range", href: "/ranges", icon: MapPin },
  { name: "Live Analysis", href: "/live-analysis", icon: Crosshair },
  { name: "Performance", href: "/performance", icon: Activity },
  { name: "Training Plan", href: "/planning", icon: Calendar },
  { name: "Ballistics", href: "/ballistics", icon: Crosshair },
  { name: "Settings", href: "/settings", icon: Settings },
];

const COACH_NAV: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: Activity },
  { name: "Shooter Connect", href: "/connect", icon: Users },
  { name: "Live Analysis", href: "/live-analysis", icon: Crosshair },
  { name: "Performance Radar", href: "/performance", icon: Activity },
  { name: "Calendar & Drills", href: "/planning", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardLayout({ children, role = "SHOOTER" }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const effectiveRole = user?.role === "COACH" ? "COACH" : role;
  const navigation = effectiveRole === "COACH" ? COACH_NAV : SHOOTER_NAV;

  const handleSignOut = () => {
    logout();
    setSidebarOpen(false);
    router.replace("/auth/login");
  };

  return (
    <div className="flex h-screen w-full overflow-x-hidden bg-[var(--bg-void)] text-[var(--text-primary)]">
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
          "fixed inset-y-0 left-0 z-50 w-72 transform flex-col justify-between border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-transform duration-300 lg:static lg:flex lg:translate-x-0",
          isSidebarOpen ? "translate-x-0 flex" : "-translate-x-full hidden"
        )}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex flex-col flex-grow overflow-y-auto">
          <div className="flex h-20 items-center justify-between px-6 border-b border-[var(--border-subtle)]">
            <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-[var(--accent-primary)] shadow-glow" />
              <span className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">MARKSMAN</span>
            </Link>
            <button
              className="lg:hidden text-[var(--text-secondary)] p-1.5 rounded-lg hover:bg-[var(--btn-ghost-bg)]"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="flex-1 space-y-1.5 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-[var(--btn-ghost-hover-bg)] text-[var(--accent-primary)] shadow-inner-glow"
                      : "text-[var(--text-secondary)] hover:bg-[var(--btn-ghost-bg)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <item.icon size={20} className={isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--btn-ghost-bg)] hover:text-signal-red"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <div className="absolute inset-0 noise-overlay pointer-events-none" />
        
        {/* Top Header */}
        <header
          className="flex min-h-[4.5rem] items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-void)]/85 px-4 sm:px-6 pb-3 backdrop-blur-xl z-30"
          style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 1.25rem)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 -ml-1 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--btn-ghost-bg)]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h2 className="font-display text-xl font-semibold capitalize truncate text-[var(--text-primary)]">
              {pathname.split("/").filter(Boolean).pop()?.replace("-", " ") || "Dashboard"}
            </h2>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--btn-ghost-bg)] text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              <ShieldCheck size={16} className="text-[#00E5A0]" />
              Connected
            </div>
            <Link
              href="/profile"
              className="h-9 w-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-accent)] flex items-center justify-center"
              aria-label="Open profile"
            >
              <User size={18} className="text-[var(--accent-primary)]" />
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div
          className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 z-20"
          style={{ paddingBottom: "max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))" }}
        >
          <div className="mx-auto max-w-7xl animate-fade-up">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
