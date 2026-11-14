// apps/web/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { useToast } from '../../contexts/toast-context';
import { RangeConsoleSidebar } from '../../components/dashboard/RangeConsoleSidebar';
import { RangeConsoleHeader } from '../../components/dashboard/RangeConsoleHeader';
import { CommandCenterDark } from '../../components/dashboard/CommandCenterDark';
import { CommandCenterLight } from '../../components/dashboard/CommandCenterLight';
import {
  IconDashboard,
  IconMyLocation,
  IconBadge,
  IconReport,
  IconMenu,
} from '../../components/ui/TacticalIcons';

export default function DashboardPage() {
  const { user, isLoading: authLoading, setUser } = useAuth();
  const { dashboardTheme } = useTheme();
  const { toast } = useToast();

  const [rangeStatus, setRangeStatus] = useState<"HOT" | "COLD">("HOT");
  const [rangeId, setRangeId] = useState<string | null>(null);
  const [lanes, setLanes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    }
  }, []);

  // Auto-fill demo operator user if unauthenticated during inspection
  useEffect(() => {
    if (!authLoading && !user) {
      setUser({
        id: 'rso-demo-01',
        name: 'Sgt. Miller (Lead RSO)',
        email: 'rso@marksmanspro.com',
        role: 'RANGE_OPERATOR',
        createdAt: new Date(),
      });
    }
  }, [authLoading, user, setUser]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ranges = await apiFetch('/ranges').catch(() => []) as any[];
        if (ranges && ranges.length > 0) {
          const id = ranges[0].id;
          setRangeId(id);

          const dashboardStats = await apiFetch<any>(`/range-operations/${id}/dashboard-stats`).catch(() => null);
          if (dashboardStats?.rangeStatus) {
            setRangeStatus(dashboardStats.rangeStatus);
          }

          const fetchedLanes = await apiFetch<any[]>(`/range-operations/${id}/lanes`).catch(() => []);
          if (fetchedLanes && fetchedLanes.length > 0) {
            setLanes(fetchedLanes);
          }
        }
      } catch (err) {
        console.error("Failed to load range stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleToggleStatus = async () => {
    const newStatus = rangeStatus === "HOT" ? "COLD" : "HOT";
    setRangeStatus(newStatus); // Optimistic update
    toast(
      newStatus === "COLD"
        ? "RANGE COLD — All-Range Cease-Fire Engaged"
        : "RANGE HOT — Live Fire Cleared by RSO",
      newStatus === "COLD" ? "warning" : "success",
    );

    // Broadcast instantaneously over WebSocket to all range monitors, cameras, and shooter apps
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3003";
      const socket = io(wsUrl, { transports: ["websocket"] });
      if (newStatus === "COLD") {
        socket.emit("broadcastCeasefire", {
          rangeId: rangeId || "main-range-1",
          reason: "Master All-Range Cease-Fire Engaged by Lead RSO",
          initiatedBy: user?.name || "Sgt. Miller (Lead RSO)",
          active: true,
        });
      } else {
        socket.emit("clearCeasefire", { rangeId: rangeId || "main-range-1" });
      }
      setTimeout(() => socket.disconnect(), 1500);
    } catch (wsErr) {
      console.warn("WebSocket ceasefire broadcast error:", wsErr);
    }

    try {
      if (rangeId) {
        await apiFetch(`/range-operations/${rangeId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        });
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="font-telemetry-sm text-xs text-outline tracking-wider uppercase">Loading Tactical Console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-surface text-on-surface flex flex-col font-sans select-none overflow-hidden">
      {/* Stitch Facility Operations Left Sidebar */}
      <RangeConsoleSidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Stitch Fixed Top Command Header */}
      <RangeConsoleHeader
        rangeStatus={rangeStatus}
        onToggleStatus={handleToggleStatus}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Main Command Center Body - Dedicated scrolling viewport between fixed header & footer */}
      <main className="flex-1 w-full pl-0 lg:pl-64 pt-[calc(3.5rem+var(--sat))] pb-[calc(4.75rem+var(--sab))] lg:pb-6 overflow-y-auto overflow-x-hidden bg-surface p-2 sm:p-4 md:p-6 overscroll-contain">
        {dashboardTheme === "harmonized-precision" ? (
          <CommandCenterLight
            rangeStatus={rangeStatus}
            lanes={lanes}
            isLoading={isLoading}
            onToggleStatus={handleToggleStatus}
          />
        ) : (
          <CommandCenterDark
            rangeStatus={rangeStatus}
            lanes={lanes}
            isLoading={isLoading}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </main>

      {/* Mobile Ergonomic Bottom Navigation Bar (Hidden on lg+ / Desktop / Fold Unfolded) */}
      <nav className="fixed bottom-0 left-0 right-0 h-[calc(3.5rem+var(--sab))] pb-[var(--sab)] bg-surface-container-lowest border-t border-outline-variant/30 z-40 flex items-center justify-around lg:hidden select-none px-2 shadow-2xl">
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-primary py-1">
          <IconDashboard className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-bold">Console</span>
        </Link>
        <Link href="/lanes" className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary py-1">
          <IconMyLocation className="w-5 h-5 text-on-surface-variant" />
          <span className="text-[10px] font-medium">Lanes</span>
        </Link>
        <Link href="/checkin" className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary py-1">
          <IconBadge className="w-5 h-5 text-on-surface-variant" />
          <span className="text-[10px] font-medium">Kiosk</span>
        </Link>
        <Link href="/safety" className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary py-1">
          <IconReport className="w-5 h-5 text-on-surface-variant" />
          <span className="text-[10px] font-medium">Safety</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary py-1"
        >
          <IconMenu className="w-5 h-5 text-on-surface-variant" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </div>
  );
}
