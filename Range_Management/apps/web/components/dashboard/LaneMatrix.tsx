"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useToast } from "../../contexts/toast-context";
import { IconVolumeUp, IconWarning, IconPersonAdd, IconMyLocation, IconVideocam, IconArrowDown } from "../ui/TacticalIcons";

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

  const router = useRouter();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const updateLaneState = (laneId: string, updater: (l: Lane) => Lane) => {
    setLiveLanes((prev) => prev.map((l) => (l.id === laneId ? updater(l) : l)));
  };

  const handleRecallAll = () => {
    setLiveLanes((prev) =>
      prev.map((l) => ({
        ...l,
        activeSession: l.activeSession ? { ...l.activeSession, distance: "0 YDS" } : l.activeSession,
      }))
    );
    toast("All bay target carriers recalled to 0 YDS home position", "info");
  };

  // Aggregate stats
  const activeCount = liveLanes.filter((l) => l.status === "OCCUPIED").length;
  const ceaseFireCount = liveLanes.filter((l) => l.status === "CEASE_FIRE").length;
  const readyCount = liveLanes.filter(
    (l) => !["OCCUPIED", "MAINTENANCE", "CEASE_FIRE"].includes(l.status)
  ).length;
  const maintCount = liveLanes.filter((l) => l.status === "MAINTENANCE").length;

  const displayLanes = liveLanes.filter((l) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "OCCUPIED") return l.status === "OCCUPIED";
    if (statusFilter === "CEASE_FIRE") return l.status === "CEASE_FIRE";
    if (statusFilter === "READY") return !["OCCUPIED", "MAINTENANCE", "CEASE_FIRE"].includes(l.status);
    if (statusFilter === "MAINTENANCE") return l.status === "MAINTENANCE";
    return true;
  });

  return (
    <div className="col-span-12 lg:col-span-8 flex flex-col gap-3 bg-surface-container-low rounded-xl p-2.5 sm:p-4 shadow-md border border-outline-variant/15 w-full">
      {/* Matrix Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline-variant/10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <IconMyLocation className="w-4 h-4 text-primary" />
            <h2 className="font-headline-md text-[14px] sm:text-[16px] text-on-surface font-bold">
              Firing Line Overview &amp; Telemetry
            </h2>
          </div>
          <span className="font-telemetry-sm text-[11px] text-outline hidden lg:inline">
            Range Alpha // 12-Bay Automation
          </span>
        </div>

        {/* Interactive Filter Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full font-label-caps text-[9px] sm:text-[10px]">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === "ALL"
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
            }`}
          >
            All ({liveLanes.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("OCCUPIED")}
            className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === "OCCUPIED"
                ? "bg-tertiary text-on-tertiary font-bold shadow-xs"
                : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("CEASE_FIRE")}
            className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === "CEASE_FIRE"
                ? "bg-secondary text-on-secondary font-bold shadow-xs"
                : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Cease ({ceaseFireCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("READY")}
            className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === "READY"
                ? "bg-outline text-surface font-bold shadow-xs"
                : "bg-surface-container-high text-outline hover:bg-surface-container-highest"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Ready ({readyCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("MAINTENANCE")}
            className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 shrink-0 ${
              statusFilter === "MAINTENANCE"
                ? "bg-primary text-on-primary font-bold shadow-xs"
                : "bg-surface-container-high text-primary hover:bg-surface-container-highest"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Maint ({maintCount})
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-3 w-full lg:max-h-[640px] lg:overflow-y-auto pr-0 lg:pr-1">
        {displayLanes.map((lane) => (
          <LaneCard
            key={lane.id}
            lane={lane}
            onRecall={() => {
              const label = `L${String(lane.laneNumber).padStart(2, "0")}`;
              updateLaneState(lane.id, (l) => ({
                ...l,
                activeSession: l.activeSession ? { ...l.activeSession, distance: "0 YDS" } : l.activeSession,
              }));
              toast(`Lane ${label} target carrier recalled to 0 YDS`, "info");
            }}
            onStop={() => {
              const label = `L${String(lane.laneNumber).padStart(2, "0")}`;
              updateLaneState(lane.id, (l) => ({
                ...l,
                status: "CEASE_FIRE",
                activeSession: l.activeSession ? { ...l.activeSession, db: "STAGED" } : l.activeSession,
              }));
              toast(`Lane ${label} placed in CEASE-FIRE HOLD`, "warning");
            }}
            onExtend={() => {
              const label = `L${String(lane.laneNumber).padStart(2, "0")}`;
              updateLaneState(lane.id, (l) => ({
                ...l,
                activeSession: l.activeSession
                  ? {
                      ...l.activeSession,
                      distance: l.activeSession.distance === "0 YDS" ? "15 YDS" : l.activeSession.distance,
                    }
                  : l.activeSession,
              }));
              toast(`Extended Bay ${label} session by +15 mins`, "success");
            }}
            onTestCycle={() => {
              const label = `L${String(lane.laneNumber).padStart(2, "0")}`;
              updateLaneState(lane.id, (l) => ({
                ...l,
                activeSession: {
                  ...l.activeSession,
                  shooter: l.activeSession?.shooter || { name: "Pulley Check" },
                  distance: l.activeSession?.distance === "CALIBRATING" ? "TESTED OK" : "CALIBRATING",
                },
              }));
              toast(`Lane ${label} pulley servo test cycle completed`, "info");
            }}
            onClearMaint={() => {
              const label = `L${String(lane.laneNumber).padStart(2, "0")}`;
              updateLaneState(lane.id, (l) => ({
                ...l,
                status: "READY",
                activeSession: { shooter: { name: "Unoccupied" }, weapon: "CLEARED", distance: "PARKED", rounds: 0, db: "00 dB" },
              }));
              toast(`Lane ${label} cleared from maintenance → READY`, "success");
            }}
            onVerifyClear={() => {
              const label = `L${String(lane.laneNumber).padStart(2, "0")}`;
              updateLaneState(lane.id, (l) => ({
                ...l,
                status: "READY",
                activeSession: {
                  ...l.activeSession,
                  db: "68 dB",
                },
              }));
              toast(`Lane ${label} chamber verified clear → READY`, "success");
            }}
            onLockBay={() => {
              const label = `L${String(lane.laneNumber).padStart(2, "0")}`;
              updateLaneState(lane.id, (l) => ({
                ...l,
                status: "MAINTENANCE",
              }));
              toast(`Lane ${label} locked out for inspection`, "warning");
            }}
            onAssignParty={() => {
              router.push(`/checkin?lane=${lane.laneNumber}`);
            }}
          />
        ))}
      </div>

      {/* Quick Range Firing Bay Visual Preview Overlay Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/20 shadow-xs shrink-0 mt-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/30 shrink-0">
            <IconVideocam className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-label-caps text-[10px] uppercase text-outline font-bold truncate">
              Optical Range Visualiser // Bay Line West
            </span>
            <span className="font-body-md text-[10px] sm:text-[11px] text-on-surface truncate">
              Motor Bus: 48V DC nominal • Trap Air 880 fpm
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleRecallAll}
            className="w-full sm:w-auto justify-center px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-md text-[11px] font-semibold rounded flex items-center gap-1.5 transition-colors border border-outline-variant/30 active:scale-95 min-h-[36px]"
          >
            <IconArrowDown className="w-3.5 h-3.5 text-on-surface" /> Recall All Targets
          </button>
        </div>
      </div>
    </div>
  );
}

interface LaneCardProps {
  lane: Lane;
  onRecall: () => void;
  onStop: () => void;
  onExtend: () => void;
  onTestCycle: () => void;
  onClearMaint: () => void;
  onVerifyClear: () => void;
  onLockBay: () => void;
  onAssignParty: () => void;
}

function LaneCard({
  lane,
  onRecall,
  onStop,
  onExtend,
  onTestCycle,
  onClearMaint,
  onVerifyClear,
  onLockBay,
  onAssignParty,
}: LaneCardProps) {
  const laneStr = `L${String(lane.laneNumber).padStart(2, "0")}`;
  const isActive = lane.status === "OCCUPIED";
  const isOffline = lane.status === "MAINTENANCE";
  const isCeaseFire = lane.status === "CEASE_FIRE";

  if (isActive) {
    return (
      <div className="group relative bg-surface-container rounded-xl p-3.5 flex flex-col justify-between hover:bg-surface-container-high transition-colors shadow-sm border border-outline-variant/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="font-telemetry-lg text-base text-on-surface font-black tracking-wide">{laneStr}</span>
            <span className="px-2 py-0.5 bg-tertiary/15 text-tertiary font-label-caps text-[10px] rounded-md font-bold">
              MEM
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded-full border border-tertiary/30">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
            <span className="font-label-caps text-[10px] text-tertiary font-bold tracking-wider">HOT</span>
          </div>
        </div>
        <div className="my-2.5 flex items-baseline justify-between font-telemetry-sm gap-2">
          <div className="text-on-surface font-bold text-sm truncate flex-1 min-w-0">
            {lane.activeSession?.shooter?.name || "K. Vance"}
          </div>
          <div className="text-outline text-xs shrink-0">
            <span className="text-on-surface font-bold">{lane.activeSession?.rounds || 184}</span> rds
          </div>
        </div>
        <div className="flex items-center justify-between text-outline text-xs font-telemetry-sm mb-3">
          <span>{lane.activeSession?.distance || "25 yd"}</span>
          <span className="text-secondary font-bold flex items-center gap-1">
            <IconVolumeUp className="w-3.5 h-3.5 text-secondary" />
            {lane.activeSession?.db || "141 dB"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-outline-variant/15 mt-auto">
          <button type="button" onClick={onRecall} className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded-lg h-9 flex items-center justify-center text-xs font-bold active:scale-95 transition-transform" title="Recall Target">
            ↓ Recall
          </button>
          <button type="button" onClick={onStop} className="bg-secondary-container hover:opacity-90 text-white rounded-lg h-9 flex items-center justify-center font-black text-xs tracking-wider active:scale-95 transition-transform shadow-xs">
            STOP
          </button>
          <button type="button" onClick={onExtend} className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded-lg h-9 flex items-center justify-center font-telemetry-sm text-xs font-semibold active:scale-95 transition-transform">
            +15m
          </button>
        </div>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="group relative bg-surface-container-low/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs border border-outline-variant/20 opacity-90">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="font-telemetry-lg text-base text-outline font-bold tracking-wide">{laneStr}</span>
            <span className="px-2 py-0.5 bg-primary-container/20 text-primary font-label-caps text-[10px] rounded-md font-bold">
              MAINT
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded-full border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="font-label-caps text-[10px] text-primary font-bold">OFFLINE</span>
          </div>
        </div>
        <div className="my-2.5 flex items-baseline justify-between font-telemetry-sm">
          <div className="text-outline font-medium text-sm">Carrier Serv.</div>
          <div className="text-outline text-xs">0 rds</div>
        </div>
        <div className="flex items-center justify-between text-primary font-telemetry-sm text-xs mb-3">
          <span>Cable Inspect</span>
          <span>{lane.activeSession?.distance === "TESTED OK" ? "TESTED OK" : "Tech: #4"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/15 mt-auto">
          <button type="button" onClick={onTestCycle} className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded-lg h-9 font-telemetry-sm text-xs font-semibold flex items-center justify-center active:scale-95 transition-transform">
            Test Cycle
          </button>
          <button type="button" onClick={onClearMaint} className="bg-primary/20 hover:bg-primary/30 text-primary rounded-lg h-9 font-telemetry-sm text-xs font-bold flex items-center justify-center active:scale-95 transition-transform">
            Clear
          </button>
        </div>
      </div>
    );
  }

  if (isCeaseFire) {
    return (
      <div className="group relative bg-secondary-container/20 rounded-xl p-3.5 flex flex-col justify-between shadow-md border-2 border-secondary">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="font-telemetry-lg text-base text-secondary font-black tracking-wide">{laneStr}</span>
            <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container font-label-caps text-[10px] rounded-md font-bold">
              HOLD
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-0.5 rounded-full border border-secondary/40">
            <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
            <span className="font-label-caps text-[10px] text-secondary font-bold tracking-wider">CEASE</span>
          </div>
        </div>
        <div className="my-2.5 flex items-baseline justify-between font-telemetry-sm">
          <div className="text-secondary font-bold text-sm">Breech Flg?</div>
          <div className="text-outline text-xs"><span className="text-on-surface font-bold">{lane.activeSession?.rounds ?? 92}</span> rds</div>
        </div>
        <div className="flex items-center justify-between text-secondary font-telemetry-sm text-xs mb-3 font-semibold">
          <span>RSO Inspecting</span>
          <IconWarning className="w-4 h-4 text-secondary" />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/15 mt-auto">
          <button type="button" onClick={onVerifyClear} className="bg-secondary text-white font-bold rounded-lg h-9 font-telemetry-sm text-xs flex items-center justify-center active:scale-95 transition-transform shadow-xs">
            Verify Clear
          </button>
          <button type="button" onClick={onLockBay} className="bg-surface-container-highest hover:bg-surface-bright text-on-surface rounded-lg h-9 font-telemetry-sm text-xs font-semibold flex items-center justify-center active:scale-95 transition-transform">
            Lock Bay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-surface-container-lowest rounded-xl p-3.5 flex flex-col justify-between hover:bg-surface-container transition-colors shadow-sm border border-outline-variant/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="font-telemetry-lg text-base text-on-surface-variant font-bold tracking-wide">{laneStr}</span>
          <span className="px-2 py-0.5 bg-surface-container-high text-outline font-label-caps text-[10px] rounded-md font-semibold">
            READY
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container px-2 py-0.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-outline"></span>
          <span className="font-label-caps text-[10px] text-outline font-semibold">COLD</span>
        </div>
      </div>
      <div className="my-2.5 flex items-baseline justify-between font-telemetry-sm">
        <div className="text-outline font-medium text-sm">Staged: 0 yd</div>
        <div className="text-outline text-xs">Ready</div>
      </div>
      <div className="flex items-center justify-between text-outline text-xs font-telemetry-sm mb-3">
        <span>Cleaned 13:50</span>
        <span className="truncate ml-1">TGT #1</span>
      </div>
      <button type="button" onClick={onAssignParty} className="mt-auto w-full bg-primary text-on-primary hover:opacity-90 font-body-md font-bold text-xs h-9 rounded-lg transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-sm">
        <IconPersonAdd className="w-4 h-4 text-on-primary" /> Assign Party
      </button>
    </div>
  );
}
