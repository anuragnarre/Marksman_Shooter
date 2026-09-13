"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  ShieldAlert,
  Users
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "SHOOTER" | "COACH" | "RANGE_OPERATOR";
}

const SHOOTER_NAV: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: Activity },
  { name: "My Sessions", href: "/sessions", icon: Target },
  { name: "Armory", href: "/armory", icon: Crosshair },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Profile", href: "/profile", icon: User },
];

const RANGE_OPERATOR_NAV: NavItem[] = [
  { name: "Command Center", href: "/operator/dashboard", icon: Activity },
  { name: "Lanes & Live", href: "/operator/lanes", icon: Target },
  { name: "Memberships", href: "/operator/memberships", icon: Users },
  { name: "Safety & Logs", href: "/operator/safety", icon: ShieldAlert },
  { name: "Range Settings", href: "/operator/settings", icon: Settings },
];

export function DashboardLayout({ children, role = "SHOOTER" }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navigation = role === "RANGE_OPERATOR" ? RANGE_OPERATOR_NAV : SHOOTER_NAV;

  return (
    <div className="flex h-screen w-full bg-[var(--bg-void)] text-[var(--text-primary)]">
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
      >
        <div className="flex flex-col flex-grow overflow-y-auto">
          <div className="flex h-20 items-center justify-between px-6 border-b border-[var(--border-subtle)]">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-[var(--accent-primary)] shadow-glow" />
              <span className="font-display text-2xl font-bold tracking-tight text-white">MARKSMAN</span>
            </Link>
            <button className="lg:hidden text-[var(--text-secondary)]" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
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
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--btn-ghost-bg)] hover:text-white">
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute inset-0 noise-overlay" />
        
        {/* Top Header */}
        <header className="flex h-20 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-void)]/80 px-6 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-[var(--text-secondary)]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="font-display text-xl font-semibold capitalize">
              {pathname.split("/").filter(Boolean).pop()?.replace("-", " ") || "Dashboard"}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--btn-ghost-bg)] text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              <ShieldCheck size={16} className="text-[var(--emerald-signal)]" />
              Connected
            </div>
            <div className="h-10 w-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-accent)] flex items-center justify-center">
              <User size={20} className="text-[var(--accent-primary)]" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 z-20">
          <div className="mx-auto max-w-7xl animate-fade-up">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
