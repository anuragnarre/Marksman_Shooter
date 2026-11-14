"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { LiveVisionDark, type LaneCameraData } from "@/components/vision/LiveVisionDark";
import { LiveVisionLight } from "@/components/vision/LiveVisionLight";
import { useTheme } from "@/contexts/theme-context";
import { apiFetch } from "@/lib/api";
import io from "socket.io-client";

const FALLBACK_LANES: LaneCameraData[] = [
  {
    id: "lane-1",
    number: 1,
    status: "OCCUPIED",
    shooterName: "Alex Marksman",
    targetType: "10m Air Rifle (ISSF)",
    lastScore: 10.6,
    fps: 60,
    latency: 12,
    cams: { targetConnected: true, stanceConnected: true, wideBayConnected: true },
    recentShots: [
      { x: 0.1, y: -0.2, score: 10.6 },
      { x: -0.4, y: 0.3, score: 10.3 },
      { x: 0.8, y: -0.1, score: 9.9 },
    ],
  },
  {
    id: "lane-2",
    number: 2,
    status: "OCCUPIED",
    shooterName: "Elena Rostova",
    targetType: "25m Rapid Fire Pistol",
    lastScore: 10.2,
    fps: 60,
    latency: 14,
    cams: { targetConnected: true, stanceConnected: true, wideBayConnected: false },
    recentShots: [
      { x: 0.3, y: 0.1, score: 10.2 },
      { x: -0.2, y: -0.5, score: 10.1 },
    ],
  },
  {
    id: "lane-3",
    number: 3,
    status: "IDLE",
    shooterName: null,
    targetType: "10m Air Rifle",
    fps: 60,
    latency: 9,
    cams: { targetConnected: true, stanceConnected: false, wideBayConnected: true },
    recentShots: [],
  },
  {
    id: "lane-4",
    number: 4,
    status: "MAINTENANCE",
    shooterName: null,
    targetType: "Calibration Stand",
    fps: 0,
    latency: 0,
    cams: { targetConnected: false, stanceConnected: false, wideBayConnected: false },
    recentShots: [],
  },
];

export default function LanesPage() {
  const { resolvedTheme } = useTheme();
  const [lanes, setLanes] = useState<LaneCameraData[]>(FALLBACK_LANES);
  const [isLoading, setIsLoading] = useState(true);
  const [rangeId, setRangeId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ranges = (await apiFetch("/ranges")) as any[];
        if (ranges && ranges.length > 0) {
          const id = ranges[0].id;
          setRangeId(id);
          const data = await apiFetch<any[]>(`/range-operations/${id}/lanes`);
          if (Array.isArray(data) && data.length > 0) {
            setLanes(data);
          }
        }
      } catch {
        // Keep demo fallback lanes when API/PostgreSQL is offline
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!rangeId) return;

    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003",
      {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
      },
    );

    socket.on("connect", () => {
      socket.emit("joinRangeMonitor", rangeId);
      socket.emit("joinLiveRange", rangeId);
    });

    socket.on("shot_detected", (payload: any) => {
      setLanes((current) =>
        current.map((lane) => {
          if (lane.status === "OCCUPIED" && lane.id === payload.laneId) {
            return {
              ...lane,
              lastScore: payload.score || 10.0,
            };
          }
          return lane;
        }),
      );
    });

    socket.on("lane_status_updated", (payload: any) => {
      setLanes((current) =>
        current.map((lane) => (lane.id === payload.laneId ? { ...lane, ...payload } : lane)),
      );
    });

    return () => {
      socket.emit("leaveRangeMonitor", rangeId);
      socket.emit("leaveLiveRange", rangeId);
      socket.disconnect();
    };
  }, [rangeId]);

  return (
    <DashboardLayout role="RANGE_OPERATOR">
      {resolvedTheme === "light" ? (
        <LiveVisionLight lanes={lanes} isLoading={isLoading} />
      ) : (
        <LiveVisionDark lanes={lanes} isLoading={isLoading} />
      )}
    </DashboardLayout>
  );
}
