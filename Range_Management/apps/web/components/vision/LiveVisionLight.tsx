"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MaterialIcon } from "@/components/ui/TacticalIcons";
import { useToast } from "@/contexts/toast-context";
import { StreamTunerModal } from "./StreamTunerModal";
import { CameraStreamConfig, StreamTelemetryMetrics } from "@shooting-platform/shared-types";
import { loadStreamConfig, saveStreamConfig, StreamTelemetryTracker } from "@/lib/stream-optimizer";

interface LaneData {
  id: string;
  number?: number;
  laneNumber?: number;
  status: "OCCUPIED" | "IDLE" | "OFFLINE" | "MAINTENANCE" | string;
  shooterName?: string | null;
  currentShooter?: { name?: string };
  targetType?: string;
  lastScore?: number;
  battery?: number;
  fps?: number;
  latency?: number;
  recentShots?: { x: number; y: number; score: number }[];
}

export function LiveVisionLight({
  lanes = [],
  isLoading = false,
}: {
  lanes?: LaneData[];
  isLoading?: boolean;
}) {
  const { toast } = useToast();
  const [selectedLaneId, setSelectedLaneId] = useState<string>(lanes[0]?.id || "lane-1");
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<"target" | "stance" | "quad">("target");
  const [isCeasefireActive, setIsCeasefireActive] = useState(false);
  const [simulatedShots, setSimulatedShots] = useState<{ x: number; y: number; score: number }[]>([]);
  const [isStreamTunerOpen, setIsStreamTunerOpen] = useState(false);
  const [streamConfig, setStreamConfig] = useState<CameraStreamConfig>(() => loadStreamConfig(selectedLaneId));

  const trackerRef = useRef<StreamTelemetryTracker>(new StreamTelemetryTracker());
  const [telemetryMetrics, setTelemetryMetrics] = useState<StreamTelemetryMetrics>(() =>
    trackerRef.current.getMetrics(streamConfig.targetFps, streamConfig.profile),
  );

  useEffect(() => {
    if (lanes.length > 0 && !lanes.some((l) => l.id === selectedLaneId)) {
      setSelectedLaneId(lanes[0].id);
    }
  }, [lanes, selectedLaneId]);

  useEffect(() => {
    setStreamConfig(loadStreamConfig(selectedLaneId));
  }, [selectedLaneId]);

  useEffect(() => {
    const tracker = trackerRef.current;
    const interval = setInterval(() => {
      tracker.registerRtt(Math.max(10, Math.floor(13 + Math.random() * 7)));
      tracker.registerFrame(Math.floor((streamConfig.bitrateCapKbps * 1000) / 8 / streamConfig.targetFps));
      setTelemetryMetrics(tracker.getMetrics(streamConfig.targetFps, streamConfig.profile));
    }, 1000);
    return () => clearInterval(interval);
  }, [streamConfig]);

  const activeLane = lanes.find((l) => l.id === selectedLaneId) || lanes[0];
  const baseShots = activeLane?.recentShots?.length
    ? activeLane.recentShots
    : [{ x: 0.4, y: -0.2, score: 10.4 }];
  const shotsToRender = [...baseShots, ...simulatedShots];
  const latestShot = shotsToRender[shotsToRender.length - 1];

  const handleSimulateShot = () => {
    if (isCeasefireActive) {
      toast("Cannot register shot: Emergency Ceasefire is currently active.", "warning");
      return;
    }
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 8;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const score = Math.max(7.0, Number((10.9 - distance * 0.4).toFixed(1)));
    setSimulatedShots((prev) => [...prev, { x, y, score }]);
    toast(`Shot #${shotsToRender.length + 1} optical hit: ${score.toFixed(1)}`, "success");
  };

  return (
    <div className="flex flex-col w-full gap-6 h-full overflow-y-auto pb-[calc(5.5rem+var(--sab))] lg:pb-12 text-slate-900">
      {/* Top Banner */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${
          isCeasefireActive ? "bg-red-50 border-red-400" : "bg-white border-slate-200"
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isCeasefireActive ? "bg-red-500" : "bg-emerald-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isCeasefireActive ? "bg-red-600" : "bg-emerald-600"
                }`}
              />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-slate-900">
              Live Vision &amp; Target Telemetry
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time edge camera feed with optical hit detection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setIsCeasefireActive((prev) => {
                const next = !prev;
                toast(next ? "Emergency Ceasefire broadcast across all lanes!" : "Ceasefire cleared — firing resumed", next ? "error" : "success");
                return next;
              });
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              isCeasefireActive
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isCeasefireActive ? "Clear Ceasefire" : "Broadcast Ceasefire"}
          </button>
          <Link href="/lanes/config">
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold px-4 py-2">
              Camera Calibration
            </Button>
          </Link>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            {lanes.filter((l) => l.status === "OCCUPIED").length} Active Lanes
          </div>
        </div>
      </div>

      {/* Main Split: Matrix + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
        {/* Left: Lane Grid Selector */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Lanes Matrix ({lanes.length} Lanes)
          </h2>
          <div className="flex flex-col gap-2 max-h-[620px] overflow-y-auto pr-1">
            {isLoading && lanes.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Loading lane streams...</div>
            ) : lanes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                No active lanes configured
              </div>
            ) : (
              lanes.map((lane) => {
                const laneNum = lane.number ?? lane.laneNumber ?? lane.id;
                const isSelected = lane.id === (activeLane?.id || selectedLaneId);
                const isOccupied = lane.status === "OCCUPIED";

                return (
                  <button
                    key={lane.id}
                    type="button"
                    onClick={() => {
                      setSelectedLaneId(lane.id);
                      setSimulatedShots([]);
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-amber-50 border-amber-500 shadow-sm text-slate-900"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isOccupied ? "bg-amber-500 text-black" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {laneNum}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {lane.shooterName || lane.currentShooter?.name || (isOccupied ? "Occupied" : "Open Lane")}
                        </div>
                        <div className="text-xs text-slate-400">{lane.targetType || "10m Air Target"}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isOccupied
                            ? "bg-emerald-100 text-emerald-800"
                            : lane.status === "MAINTENANCE"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {lane.status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Focused Stream & Visual Target */}
        <div className="lg:col-span-8 flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Lane {activeLane?.number ?? activeLane?.laneNumber ?? "01"} Live Target Stream
              </h2>
              <p className="text-xs text-slate-500">
                Shooter: {activeLane?.shooterName || activeLane?.currentShooter?.name || "Unassigned"} • FPS:{" "}
                <strong>{activeLane?.fps || streamConfig.targetFps}</strong> • Latency:{" "}
                <strong className="text-emerald-600">{activeLane?.latency || 12}ms</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: "target", label: "Target Cam" },
                  { id: "stance", label: "Stance Cam" },
                  { id: "quad", label: "Dual Split" },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedCameraAngle(v.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCameraAngle === v.id
                      ? "bg-amber-500 text-black font-bold shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {v.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsStreamTunerOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 transition-all"
              >
                <MaterialIcon name="tune" className="text-[15px]" />
                <span>Stream Tuner</span>
              </button>
            </div>
          </div>

          {/* Interactive Target Canvas Simulation */}
          <div className="relative flex-1 min-h-[380px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(#00000010_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {(selectedCameraAngle === "target" || selectedCameraAngle === "quad") && (
              <div
                className={`relative flex items-center justify-center ${
                  selectedCameraAngle === "quad" ? "w-1/2 h-full border-r border-slate-200" : "w-full h-full"
                }`}
              >
                <div className="relative w-60 h-60 sm:w-72 sm:h-72 rounded-full border border-slate-300 bg-white flex items-center justify-center shadow-md">
                  <div className="absolute w-48 h-48 sm:w-60 sm:h-60 rounded-full border border-slate-300 flex items-center justify-center">
                    <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-slate-300 flex items-center justify-center">
                      <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-900 flex items-center justify-center">
                        <div className="absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {shotsToRender.map((shot, idx) => (
                    <div
                      key={idx}
                      style={{ left: `${50 + shot.x * 4.5}%`, top: `${50 - shot.y * 4.5}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm flex items-center justify-center"
                      title={`Shot #${idx + 1}: ${shot.score}`}
                    >
                      <span className="text-[8px] font-black text-white">{idx + 1}</span>
                    </div>
                  ))}
                </div>

                <div className="absolute top-3 left-3 font-mono text-[10px] text-emerald-700 bg-white/95 px-2.5 py-1 rounded border border-emerald-200 shadow-sm">
                  CAM 1: DOWNRANGE 1080p60
                </div>
              </div>
            )}

            {(selectedCameraAngle === "stance" || selectedCameraAngle === "quad") && (
              <div
                className={`relative flex flex-col items-center justify-center ${
                  selectedCameraAngle === "quad" ? "w-1/2 h-full" : "w-full h-full"
                }`}
              >
                <svg viewBox="0 0 100 140" className="w-36 h-48 text-slate-600 stroke-current" fill="none" strokeWidth="1.8">
                  <circle cx="50" cy="22" r="10" />
                  <line x1="50" y1="32" x2="50" y2="78" />
                  <line x1="28" y1="42" x2="72" y2="42" />
                  <line x1="28" y1="42" x2="16" y2="60" />
                  <line x1="16" y1="60" x2="10" y2="58" />
                  <line x1="72" y1="42" x2="48" y2="58" />
                  <line x1="50" y1="78" x2="35" y2="120" />
                  <line x1="50" y1="78" x2="65" y2="120" />
                  <circle cx="50" cy="72" r="3" fill="#059669" />
                </svg>
                <div className="absolute top-3 left-3 font-mono text-[10px] text-blue-700 bg-white/95 px-2.5 py-1 rounded border border-blue-200 shadow-sm">
                  CAM 2: LINE STANCE // 720p60
                </div>
              </div>
            )}

            {isCeasefireActive && (
              <div className="absolute inset-0 bg-red-600/25 backdrop-blur-sm flex flex-col items-center justify-center z-20 pointer-events-none text-center p-4">
                <MaterialIcon name="warning" className="text-red-700 text-[36px] mb-1" />
                <span className="text-lg font-extrabold text-red-900 tracking-wider uppercase">
                  CEASEFIRE ACTIVE — ALL FIRING SUSPENDED
                </span>
              </div>
            )}

            {latestShot && (
              <div className="absolute bottom-3 right-3 font-mono text-[11px] text-slate-700 bg-white/95 px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
                LAST SHOT: <strong>{latestShot.score.toFixed(1)}</strong> ({shotsToRender.length} total)
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateShot}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold uppercase transition-colors shadow-sm"
              >
                + Simulate Shot
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulatedShots([]);
                  toast("Target impact overlay cleared", "info");
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Reset Target
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
              <span>
                TOTAL SHOTS: <strong className="text-slate-900">{shotsToRender.length}</strong>
              </span>
              <span>
                LINK: <strong className="text-emerald-700">{streamConfig.wifiBand}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <StreamTunerModal
        isOpen={isStreamTunerOpen}
        onClose={() => setIsStreamTunerOpen(false)}
        config={streamConfig}
        onConfigChange={(newCfg) => {
          setStreamConfig(newCfg);
          saveStreamConfig(newCfg, selectedLaneId);
        }}
        telemetry={telemetryMetrics}
        laneName={`Lane ${activeLane?.number ?? "1"}`}
        laneId={selectedLaneId}
      />
    </div>
  );
}
