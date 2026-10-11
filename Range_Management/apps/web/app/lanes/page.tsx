"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { LiveVisionDark } from "@/components/vision/LiveVisionDark";
import { LiveVisionLight } from "@/components/vision/LiveVisionLight";
import { useTheme } from "@/contexts/theme-context";
import { apiFetch } from "@/lib/api";
import io from 'socket.io-client';

export default function LanesPage() {
  const { resolvedTheme } = useTheme();
  const [lanes, setLanes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rangeId, setRangeId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const ranges = await apiFetch('/ranges') as any[];
        if (ranges && ranges.length > 0) {
          const id = ranges[0].id;
          setRangeId(id);
          const data = await apiFetch<any[]>(`/range-operations/${id}/lanes`);
          setLanes(data || []);
        }
      } catch (err) {
        console.error("Failed to load lanes", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!rangeId) return;

    // Connect to WebSocket gateway
    // PERF-03: Configure explicit reconnection so live view recovers after API restarts
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      socket.emit('joinRangeMonitor', rangeId);
      socket.emit('joinLiveRange', rangeId);
    });

    socket.on('shot_detected', (payload: any) => {
      setLanes(current => current.map(lane => {
        if (lane.status === 'OCCUPIED' && lane.id === payload.laneId) {
          return {
            ...lane,
            isLive: true,
            lastShot: { score: payload.score || 10.0, time: new Date() }
          };
        }
        return lane;
      }));
    });

    socket.on('lane_status_updated', (payload: any) => {
      setLanes(current => current.map(lane => 
        lane.id === payload.laneId ? { ...lane, ...payload } : lane
      ));
    });

    return () => {
      socket.emit('leaveRangeMonitor', rangeId);
      socket.emit('leaveLiveRange', rangeId);
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
