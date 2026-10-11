"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

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
}

export function LiveVisionLight({
  lanes = [],
  isLoading = false,
}: {
  lanes?: LaneData[];
  isLoading?: boolean;
}) {
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(lanes[0]?.id || "1");

  const activeLane = lanes.find((l) => l.id === selectedLaneId) || lanes[0];

  return (
    <div className="flex flex-col w-full gap-6 h-full overflow-y-auto pb-12 text-slate-900">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">Live Vision & Target Telemetry</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Real-time edge camera feed with optical hit detection.</p>
        </div>

        <div className="flex items-center gap-3">
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
        {/* Left: Lane Grid Selector (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Lanes Matrix</h2>
          <div className="flex flex-col gap-2 max-h-[620px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">Loading lane streams...</div>
            ) : lanes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">No active lanes configured</div>
            ) : (
              lanes.map((lane) => {
                const laneNum = lane.number ?? lane.laneNumber ?? lane.id;
                const isSelected = lane.id === (activeLane?.id || selectedLaneId);
                const isOccupied = lane.status === "OCCUPIED";

                return (
                  <button
                    key={lane.id}
                    onClick={() => setSelectedLaneId(lane.id)}
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

        {/* Right: Focused Stream & Visual Target (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Lane {activeLane?.number ?? activeLane?.laneNumber ?? "01"} Live Target Stream
              </h2>
              <p className="text-xs text-slate-500">
                Shooter: {activeLane?.shooterName || activeLane?.currentShooter?.name || "Unassigned"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">FPS: <strong className="text-slate-800">60</strong></span>
              <span className="text-xs text-slate-500 ml-3">Latency: <strong className="text-emerald-600">12ms</strong></span>
            </div>
          </div>

          {/* Interactive Target Canvas Simulation */}
          <div className="relative flex-1 min-h-[400px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#00000010_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Target Face */}
            <div className="relative w-72 h-72 rounded-full border border-slate-300 bg-white flex items-center justify-center shadow-md">
              <div className="absolute w-60 h-60 rounded-full border border-slate-300 flex items-center justify-center">
                <div className="absolute w-44 h-44 rounded-full border border-slate-300 flex items-center justify-center">
                  <div className="absolute w-28 h-28 rounded-full bg-slate-900 flex items-center justify-center">
                    <div className="absolute w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated Detected Shot */}
              <div className="absolute top-[44%] left-[52%] w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-sm flex items-center justify-center">
                <span className="text-[8px] font-black text-black">1</span>
              </div>
            </div>

            {/* Live Camera HUD Telemetry */}
            <div className="absolute top-4 left-4 font-mono text-[11px] text-emerald-700 bg-white/90 px-3 py-1.5 rounded-md border border-emerald-200 shadow-sm">
              REC // 1080p60 H.265 :: OPTICAL TRACKING ACTIVE
            </div>

            <div className="absolute bottom-4 right-4 font-mono text-[11px] text-slate-700 bg-white/90 px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">
              LAST SHOT: 10.4 (x: +0.12mm, y: -0.04mm)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
