"use client";

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

interface Lane {
  id: string;
  laneNumber: number;
  status: string; // 'OCCUPIED' | 'MAINTENANCE' | 'CEASE_FIRE' | 'READY'
  activeSession?: {
    shooter?: {
      name: string;
    };
    weapon?: string;
    distance?: string;
    rounds?: number;
    db?: string;
  };
}

interface LaneMatrixProps {
  lanes: Lane[];
  isLoading: boolean;
}

const DEFAULT_LANES: Lane[] = [
  { id: "l1", laneNumber: 1, status: "OCCUPIED", activeSession: { shooter: { name: "K. Vance" }, weapon: "9mm SIG P320", distance: "15 YDS", rounds: 184, db: "141 dB" } },
  { id: "l2", laneNumber: 2, status: "READY", activeSession: { shooter: { name: "M. Rodriguez" }, weapon: ".45 ACP 1911", distance: "25 YDS", rounds: 42, db: "71 dB" } },
  { id: "l3", laneNumber: 3, status: "CEASE_FIRE", activeSession: { shooter: { name: "D. Chen" }, weapon: "5.56 NATO AR-15", distance: "25 YDS", rounds: 92, db: "STAGED" } },
  { id: "l4", laneNumber: 4, status: "OCCUPIED", activeSession: { shooter: { name: "R. Henderson" }, weapon: ".308 WIN Bolt", distance: "25 YDS", rounds: 210, db: "152 dB" } },
  { id: "l5", laneNumber: 5, status: "READY", activeSession: { shooter: { name: "J. Kowalski" }, weapon: "9mm Glock 19", distance: "7 YDS", rounds: 65, db: "68 dB" } },
  { id: "l6", laneNumber: 6, status: "OCCUPIED", activeSession: { shooter: { name: "T. Alvarez" }, weapon: ".357 MAG Rev", distance: "15 YDS", rounds: 148, db: "148 dB" } },
  { id: "l7", laneNumber: 7, status: "READY", activeSession: { shooter: { name: "Unoccupied" }, weapon: "CLEARED", distance: "PARKED", rounds: 0, db: "00 dB" } },
  { id: "l8", laneNumber: 8, status: "OCCUPIED", activeSession: { shooter: { name: "E. Becker" }, weapon: ".223 Wylde", distance: "25 YDS", rounds: 175, db: "144 dB" } },
  { id: "l9", laneNumber: 9, status: "READY", activeSession: { shooter: { name: "H. Thorne" }, weapon: ".40 S&W Glock", distance: "15 YDS", rounds: 80, db: "65 dB" } },
  { id: "l10", laneNumber: 10, status: "OCCUPIED", activeSession: { shooter: { name: "G. Larson" }, weapon: "10mm Auto 1911", distance: "15 YDS", rounds: 195, db: "149 dB" } },
  { id: "l11", laneNumber: 11, status: "MAINTENANCE", activeSession: { shooter: { name: "Pulley Check" }, weapon: "SERVICING", distance: "CALIBRATING", rounds: 0, db: "00 dB" } },
  { id: "l12", laneNumber: 12, status: "OCCUPIED", activeSession: { shooter: { name: "S. O'Connor" }, weapon: "9mm CZ Shadow", distance: "7 YDS", rounds: 130, db: "139 dB" } },
];

export function LaneMatrix({ lanes, isLoading }: LaneMatrixProps) {
  const [liveLanes, setLiveLanes] = useState<Lane[]>(lanes.length > 0 ? lanes : DEFAULT_LANES);

  useEffect(() => {
    if (lanes.length > 0) {
      setLiveLanes(lanes);
    }
  }, [lanes]);

  // Connect to WebSocket gateway for live shot detections and lane status updates
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3003";
    const socket = io(wsUrl, { transports: ["websocket"], reconnectionAttempts: 5 });

    socket.emit("joinRangeMonitor", "main-range-1");
    socket.emit("joinLiveRange", "main-range-1");

    socket.on("shot_detected", (payload: any) => {
      if (!payload?.laneId) return;
      const laneNum = parseInt(String(payload.laneId), 10);
      setLiveLanes((prev) =>
        prev.map((l) => {
          if (l.laneNumber === laneNum || l.id === `l${laneNum}`) {
            const currentRounds = l.activeSession?.rounds || 0;
            return {
              ...l,
              status: "OCCUPIED",
              activeSession: {
                ...l.activeSession,
                rounds: currentRounds + 1,
                db: `${Math.floor(138 + Math.random() * 12)} dB`,
              },
            };
          }
          return l;
        })
      );
    });

    socket.on("lane_status_updated", (payload: any) => {
      if (!payload?.laneId) return;
      const laneNum = parseInt(String(payload.laneId), 10);
      setLiveLanes((prev) =>
        prev.map((l) => {
          if (l.laneNumber === laneNum || l.id === `l${laneNum}`) {
            return {
              ...l,
              status: payload.status || l.status,
              activeSession: {
                ...l.activeSession,
                ...payload.activeSession,
              },
            };
          }
          return l;
        })
      );
    });

    socket.on("range_ceasefire", (data: any) => {
      if (data?.active) {
        setLiveLanes((prev) =>
          prev.map((l) => (l.status === "OCCUPIED" ? { ...l, status: "CEASE_FIRE" } : l))
        );
      } else {
        setLiveLanes((prev) =>
          prev.map((l) => (l.status === "CEASE_FIRE" ? { ...l, status: "OCCUPIED" } : l))
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const displayLanes = liveLanes;

  // Aggregate stats
  const activeCount = displayLanes.filter((l) => l.status === "OCCUPIED").length;
  const ceaseFireCount = displayLanes.filter((l) => l.status === "CEASE_FIRE").length;
  const readyCount = displayLanes.filter(
    (l) => !["OCCUPIED", "MAINTENANCE", "CEASE_FIRE"].includes(l.status)
  ).length;
  const maintCount = displayLanes.filter((l) => l.status === "MAINTENANCE").length;

  return (
    <div className="col-span-12 xl:col-span-8 flex flex-col gap-3 bg-surface-container-low rounded-xl p-4 shadow-md border border-outline-variant/15">
      {/* Matrix Header Controls */}
      <div className="flex items-center justify-between pb-1 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">token</span>
            <h2 className="font-headline-md text-[16px] text-on-surface font-bold">
              Live Firing Line Overview &amp; Telemetry Matrix
            </h2>
          </div>
          <span className="font-telemetry-sm text-[11px] text-outline hidden lg:inline">
            Range Alpha // 12-Bay Automation
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-label-caps text-[10px]">
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Active ({activeCount})
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Cease Fire ({ceaseFireCount})
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-outline flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Safe / Ready ({readyCount})
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Maint ({maintCount})
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 w-full max-h-[580px] overflow-y-auto pr-1">
        {displayLanes.map((lane) => (
          <LaneCard key={lane.id} lane={lane} />
        ))}
      </div>

      {/* Quick Range Firing Bay Visual Preview Overlay Card */}
      <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/20 shadow-xs shrink-0 mt-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[20px]">videocam</span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-caps text-[10px] uppercase text-outline font-bold">
              Optical Range Visualiser // Bay Line West
            </span>
            <span className="font-body-md text-[11px] text-on-surface">
              Target Retrieval Carrier Motor Bus: 48V DC nominal • Trap Air Vane 880 fpm
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-md text-[11px] font-semibold rounded flex items-center gap-1 transition-colors border border-outline-variant/30">
            <span className="material-symbols-outlined text-[14px]">vertical_align_bottom</span> Recall All Targets
          </button>
        </div>
      </div>
    </div>
  );
}

function LaneCard({ lane }: { lane: Lane }) {
  const laneStr = `L${String(lane.laneNumber).padStart(2, "0")}`;
  const isActive = lane.status === "OCCUPIED";
  const isOffline = lane.status === "MAINTENANCE";
  const isCeaseFire = lane.status === "CEASE_FIRE";

  if (isActive) {
    return (
      <div className="group relative bg-surface-container rounded-lg p-3 flex flex-col justify-between hover:bg-surface-container-high transition-colors shadow-xs border border-outline-variant/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-telemetry-lg text-[16px] text-on-surface font-bold">{laneStr}</span>
            <span className="px-1.5 py-[1px] bg-tertiary/10 text-tertiary font-label-caps text-[9px] rounded font-bold">
              MEM
            </span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-lowest px-1.5 py-0.5 rounded border border-tertiary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>
            <span className="font-label-caps text-[9px] text-tertiary font-bold">HOT</span>
          </div>
        </div>
        <div className="my-2 flex items-baseline justify-between font-telemetry-sm">
          <div className="text-on-surface font-semibold text-[13px] truncate max-w-[90px]">
            {lane.activeSession?.shooter?.name || "K. Vance"}
          </div>
          <div className="text-outline text-[11px]">
            <span className="text-on-surface font-bold">{lane.activeSession?.rounds || 184}</span> rds
          </div>
        </div>
        <div className="flex items-center justify-between text-outline text-[10px] font-telemetry-sm mb-2">
          <span>{lane.activeSession?.distance || "25 yd"}</span>
          <span className="text-secondary font-bold flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px]">volume_up</span>
            {lane.activeSession?.db || "141 dB"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-outline-variant/15 mt-auto">
          <button className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded py-1 flex items-center justify-center text-[10px]" title="Recall Target">
            <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
          </button>
          <button className="bg-secondary-container hover:opacity-90 text-on-secondary-container rounded py-1 flex items-center justify-center font-bold text-[9px]">
            STOP
          </button>
          <button className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded py-1 flex items-center justify-center font-telemetry-sm text-[9px]">
            +15m
          </button>
        </div>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="group relative bg-surface-container-low/80 rounded-lg p-3 flex flex-col justify-between shadow-xs border border-outline-variant/20 opacity-90">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-telemetry-lg text-[16px] text-outline font-bold">{laneStr}</span>
            <span className="px-1.5 py-[1px] bg-primary-container/20 text-primary font-label-caps text-[9px] rounded font-bold">
              MAINT
            </span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-lowest px-1.5 py-0.5 rounded border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span className="font-label-caps text-[9px] text-primary font-bold">OFFLINE</span>
          </div>
        </div>
        <div className="my-2 flex items-baseline justify-between font-telemetry-sm">
          <div className="text-outline font-medium text-[13px]">Carrier Serv.</div>
          <div className="text-outline text-[11px]">0 rds</div>
        </div>
        <div className="flex items-center justify-between text-primary font-telemetry-sm text-[10px] mb-2">
          <span>Cable Inspect</span>
          <span>Tech: #4</span>
        </div>
        <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-outline-variant/15 mt-auto">
          <button className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded py-1 font-telemetry-sm text-[10px]">
            Test Cycle
          </button>
          <button className="bg-primary/20 hover:bg-primary/30 text-primary rounded py-1 font-telemetry-sm text-[10px] font-bold">
            Clear
          </button>
        </div>
      </div>
    );
  }

  if (isCeaseFire) {
    return (
      <div className="group relative bg-secondary-container/20 rounded-lg p-3 flex flex-col justify-between shadow-md border border-secondary">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-telemetry-lg text-[16px] text-secondary font-bold">{laneStr}</span>
            <span className="px-1.5 py-[1px] bg-secondary-container text-on-secondary-container font-label-caps text-[9px] rounded font-bold">
              HOLD
            </span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-lowest px-1.5 py-0.5 rounded border border-secondary/30">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
            <span className="font-label-caps text-[9px] text-secondary font-bold">CEASE</span>
          </div>
        </div>
        <div className="my-2 flex items-baseline justify-between font-telemetry-sm">
          <div className="text-secondary font-bold text-[13px]">Breech Flg?</div>
          <div className="text-outline text-[11px]"><span className="text-on-surface font-bold">92</span> rds</div>
        </div>
        <div className="flex items-center justify-between text-secondary font-telemetry-sm text-[10px] mb-2 font-semibold">
          <span>RSO Inspecting</span>
          <span className="material-symbols-outlined text-[13px]">priority_high</span>
        </div>
        <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-outline-variant/15 mt-auto">
          <button className="bg-secondary text-on-secondary font-bold rounded py-1 font-telemetry-sm text-[10px]">
            Verify Clear
          </button>
          <button className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded py-1 font-telemetry-sm text-[10px]">
            Lock Bay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-surface-container-lowest rounded-lg p-3 flex flex-col justify-between hover:bg-surface-container transition-colors shadow-xs border border-outline-variant/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-telemetry-lg text-[16px] text-on-surface-variant font-bold">{laneStr}</span>
          <span className="px-1.5 py-[1px] bg-surface-container-high text-outline font-label-caps text-[9px] rounded font-semibold">
            READY
          </span>
        </div>
        <div className="flex items-center gap-1 bg-surface-container px-1.5 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
          <span className="font-label-caps text-[9px] text-outline font-semibold">COLD</span>
        </div>
      </div>
      <div className="my-2 flex items-baseline justify-between font-telemetry-sm">
        <div className="text-outline font-medium text-[13px]">Staged: 0 yd</div>
        <div className="text-outline text-[11px]">Ready</div>
      </div>
      <div className="flex items-center justify-between text-outline text-[10px] font-telemetry-sm mb-2">
        <span>Cleaned 13:50</span>
        <span className="truncate ml-1">TGT #1</span>
      </div>
      <button className="mt-auto w-full bg-primary text-on-primary hover:opacity-90 font-body-md font-semibold text-[11px] py-1 rounded transition-colors flex items-center justify-center gap-1">
        <span className="material-symbols-outlined text-[13px]">person_add</span> Assign Party
      </button>
    </div>
  );
}
