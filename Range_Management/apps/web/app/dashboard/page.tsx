// apps/web/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../contexts/auth-context';
import { useTheme } from '../../contexts/theme-context';
import { RangeConsoleSidebar } from '../../components/dashboard/RangeConsoleSidebar';
import { RangeConsoleHeader } from '../../components/dashboard/RangeConsoleHeader';
import { CommandCenterDark } from '../../components/dashboard/CommandCenterDark';
import { CommandCenterLight } from '../../components/dashboard/CommandCenterLight';

export default function DashboardPage() {
  const { user, isLoading: authLoading, setUser } = useAuth();
  const { dashboardTheme } = useTheme();

  const [rangeStatus, setRangeStatus] = useState<"HOT" | "COLD">("HOT");
  const [rangeId, setRangeId] = useState<string | null>(null);
  const [lanes, setLanes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans select-none overflow-x-hidden">
      {/* Stitch Facility Operations Left Sidebar */}
      <RangeConsoleSidebar />

      {/* Stitch Fixed Top Command Header */}
      <RangeConsoleHeader
        rangeStatus={rangeStatus}
        onToggleStatus={handleToggleStatus}
      />

      {/* Main Command Center Body */}
      <main className="pl-56 md:pl-64 pt-14 min-h-screen bg-surface w-full p-4 md:p-6 overflow-y-auto">
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
    </div>
  );
}
