// apps/web/components/vision/LiveVisionDark.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { StreamTunerModal } from './StreamTunerModal';
import { CameraStreamConfig, StreamTelemetryMetrics } from '@shooting-platform/shared-types';
import { loadStreamConfig, saveStreamConfig, STREAM_PRESETS, StreamTelemetryTracker } from '@/lib/stream-optimizer';


export interface LaneCameraData {
  id: string;
  number?: number;
  laneNumber?: number;
  status: 'OCCUPIED' | 'IDLE' | 'OFFLINE' | 'MAINTENANCE' | string;
  shooterName?: string | null;
  currentShooter?: { name?: string };
  targetType?: string;
  lastScore?: number;
  battery?: number;
  fps?: number;
  latency?: number;
  cams?: {
    targetConnected: boolean;
    stanceConnected: boolean;
    wideBayConnected: boolean;
  };
  recentShots?: { x: number; y: number; score: number }[];
}

export interface ShotImpactSnapshot {
  rangeId?: string;
  laneId: string;
  shotNumber: number;
  score: number;
  xMm: number;
  yMm: number;
  image: string;
  timestamp: number;
}

export function LiveVisionDark({
  lanes = [],
  isLoading = false,
}: {
  lanes?: LaneCameraData[];
  isLoading?: boolean;
}) {
  // Default mock lanes if none provided
  const activeLanes: LaneCameraData[] = lanes.length > 0 ? lanes : [
    {
      id: 'lane-1',
      number: 1,
      status: 'OCCUPIED',
      shooterName: 'Alex Marksman',
      targetType: '10m Air Rifle (ISSF)',
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
      id: 'lane-2',
      number: 2,
      status: 'OCCUPIED',
      shooterName: 'Jordan Coach',
      targetType: '25m Rapid Fire Pistol',
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
      id: 'lane-3',
      number: 3,
      status: 'IDLE',
      shooterName: null,
      targetType: '10m Air Rifle',
      fps: 60,
      latency: 9,
      cams: { targetConnected: true, stanceConnected: false, wideBayConnected: true },
      recentShots: [],
    },
    {
      id: 'lane-4',
      number: 4,
      status: 'MAINTENANCE',
      shooterName: null,
      targetType: 'Calibration Stand',
      fps: 0,
      latency: 0,
      cams: { targetConnected: false, stanceConnected: false, wideBayConnected: false },
      recentShots: [],
    },
  ];

  const [selectedLaneId, setSelectedLaneId] = useState<string>('lane-1');
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<'target' | 'stance' | 'quad'>('target');
  const [opticalFilter, setOpticalFilter] = useState<'standard' | 'high_contrast' | 'thermal'>('standard');
  const [isCeasefireActive, setIsCeasefireActive] = useState<boolean>(false);
  const [simulatedShots, setSimulatedShots] = useState<{ x: number; y: number; score: number }[]>([]);
  const [latestImpactSnapshot, setLatestImpactSnapshot] = useState<ShotImpactSnapshot | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState<boolean>(false);

  // High-Speed Stream Optimization & Hardware Tuning State
  const [isStreamTunerOpen, setIsStreamTunerOpen] = useState(false);
  const [streamConfig, setStreamConfig] = useState<CameraStreamConfig>(() => loadStreamConfig(selectedLaneId));
  const trackerRef = useRef<StreamTelemetryTracker>(new StreamTelemetryTracker());
  const [telemetryMetrics, setTelemetryMetrics] = useState<StreamTelemetryMetrics>(() =>
    trackerRef.current.getMetrics(streamConfig.targetFps, streamConfig.profile)
  );

  // Sync config when lane changes
  useEffect(() => {
    setStreamConfig(loadStreamConfig(selectedLaneId));
  }, [selectedLaneId]);

  // Live telemetry pulse loop
  useEffect(() => {
    const tracker = trackerRef.current;
    // Simulate slight natural RTT and frame rate variations
    const interval = setInterval(() => {
      const simulatedRtt = Math.max(10, Math.floor(14 + Math.random() * 8));
      tracker.registerRtt(simulatedRtt);
      tracker.registerFrame(Math.floor((streamConfig.bitrateCapKbps * 1000) / 8 / streamConfig.targetFps));
      setTelemetryMetrics(tracker.getMetrics(streamConfig.targetFps, streamConfig.profile));
    }, 1000);
    return () => clearInterval(interval);
  }, [streamConfig]);

  const activeLane = activeLanes.find((l) => l.id === selectedLaneId) || activeLanes[0];


  const shotsToRender = [...(activeLane.recentShots || []), ...simulatedShots];

  const triggerLaneShot = () => {
    if (isCeasefireActive) {
      alert('CANNOT REGISTER SHOT: Emergency Ceasefire is currently ACTIVE across all bays.');
      return;
    }
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 8; // mm from center
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const score = Math.max(7.0, Number((10.9 - distance * 0.4).toFixed(1)));
    setSimulatedShots((prev) => [...prev, { x, y, score }]);

    setLatestImpactSnapshot({
      laneId: selectedLaneId,
      shotNumber: (activeLane.recentShots?.length || 0) + simulatedShots.length + 1,
      score,
      xMm: x * 2.5,
      yMm: y * 2.5,
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect width="400" height="225" fill="%23060913"/><circle cx="200" cy="112" r="80" stroke="%23334155" stroke-width="1.5" fill="none"/><circle cx="200" cy="112" r="50" stroke="%23334155" stroke-width="1.5" fill="none"/><circle cx="200" cy="112" r="25" stroke="%23334155" stroke-width="1.5" fill="%230F172A"/><circle cx="200" cy="112" r="6" fill="%23EF4444"/><text x="14" y="24" fill="%2300E5A0" font-family="monospace" font-size="11" font-weight="bold">DOWNRANGE HIGH-RES OPTICAL CAPTURE</text><text x="14" y="42" fill="%2394A3B8" font-family="monospace" font-size="10">TRIGGERED BY EDGE YOLOv8 BULLET-DETECTION</text></svg>',
      timestamp: Date.now(),
    });
  };

  const toggleEmergencyCeasefire = () => {
    setIsCeasefireActive((prev) => !prev);
  };

  return (
    <div className="flex flex-col w-full gap-6 h-full pb-16 text-text-primary">
      {/* Top Banner & Multi-Camera Health */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0F172A] border border-border-subtle shadow-xl relative overflow-hidden">
        {isCeasefireActive && (
          <div className="absolute inset-0 bg-[#EF4444]/20 border-2 border-[#EF4444] animate-pulse pointer-events-none" />
        )}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCeasefireActive ? 'bg-[#EF4444]' : 'bg-[#10B981]'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isCeasefireActive ? 'bg-[#EF4444]' : 'bg-[#10B981]'}`} />
            </span>
            <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2">
              Multi-Camera Live Vision & Target Telemetry
            </h1>
            <span className="px-2.5 py-0.5 rounded bg-white/10 text-xs font-mono font-bold text-[#F5A623]">
              RSO CONSOLE
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1 font-mono">
            Synchronized Downrange Optical Arrays (Cam 1) • Firing Line Muzzle Guard (Cam 2) • 60 FPS YOLOv8 Sub-mm Detection
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={toggleEmergencyCeasefire}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg ${
              isCeasefireActive
                ? 'bg-[#10B981] text-black hover:bg-[#10B981]/90 shadow-[#10B981]/20'
                : 'bg-[#EF4444] text-white hover:bg-[#EF4444]/90 shadow-[#EF4444]/30 animate-pulse'
            }`}
          >
            {isCeasefireActive ? 'CLEAR CEASEFIRE (RESUME)' : '🚨 BROADCAST CEASEFIRE'}
          </button>
          <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
            <span className="text-text-muted">ACTIVE LANES: </span>
            <span className="text-[#10B981] font-bold">
              {activeLanes.filter((l) => l.status === 'OCCUPIED').length} / {activeLanes.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Lane Matrix, Right Multi-Angle Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        {/* Left: 4 Columns - Lane Matrix */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted">
              RANGE BAY MATRIX (4 LANES)
            </h2>
            <span className="text-[10px] font-mono text-[#38BDF8]">LAN SYNC: 100%</span>
          </div>

          <div className="flex flex-col gap-3 max-h-[680px] overflow-y-auto pr-1">
            {activeLanes.map((lane) => {
              const laneNum = lane.number ?? lane.laneNumber ?? lane.id;
              const isSelected = lane.id === activeLane.id;
              const isOccupied = lane.status === 'OCCUPIED';

              return (
                <button
                  key={lane.id}
                  onClick={() => {
                    setSelectedLaneId(lane.id);
                    setSimulatedShots([]);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#1E293B] border-[#F5A623] shadow-lg shadow-[#F5A623]/10 ring-1 ring-[#F5A623]'
                      : 'bg-[#0F172A] border-border-subtle hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                          isOccupied ? 'bg-[#F5A623] text-black' : 'bg-white/10 text-text-muted'
                        }`}
                      >
                        {laneNum}
                      </div>
                      <div>
                        <div className="font-display font-bold text-sm text-white">
                          {lane.shooterName || (isOccupied ? 'Occupied Lane' : 'Available')}
                        </div>
                        <div className="text-[11px] text-text-muted font-mono">{lane.targetType}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        isOccupied
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                          : lane.status === 'MAINTENANCE'
                          ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                          : 'bg-white/5 text-text-muted'
                      }`}
                    >
                      {lane.status}
                    </span>
                  </div>

                  {/* Camera Status Mini Indicators */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono text-text-muted">
                    <div className="flex items-center gap-2">
                      <span className={lane.cams?.targetConnected ? 'text-[#10B981]' : 'text-text-muted'}>
                        ● Target Cam
                      </span>
                      <span className={lane.cams?.stanceConnected ? 'text-[#38BDF8]' : 'text-text-muted'}>
                        ● Stance Cam
                      </span>
                    </div>
                    {lane.lastScore && (
                      <span className="text-[#F5A623] font-bold">LAST: {lane.lastScore.toFixed(1)}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: 8 Columns - Multi-Camera Live Display */}
        <div className="lg:col-span-8 flex flex-col gap-4 bg-[#0F172A] p-6 rounded-2xl border border-border-subtle shadow-xl">
          {/* Top Camera Toolbar */}
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                <h2 className="text-lg font-display font-bold text-white">
                  LANE {activeLane.number ?? '01'} — {activeLane.shooterName || 'Active Session'}
                </h2>
              </div>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                Target: {activeLane.targetType} • Latency: {activeLane.latency}ms • FPS: {activeLane.fps}
              </p>
            </div>

            {/* Camera View Switcher Buttons & Optimizer Trigger */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Active Stream Profile Pill */}
              <button
                onClick={() => setIsStreamTunerOpen(true)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] hover:bg-[#00E5A0]/20 flex items-center gap-1.5 transition-all shadow-sm"
                title="Click to open Advanced Stream & Hardware Optimizer"
              >
                <span className="material-symbols-outlined text-[15px]">tune</span>
                <span>{streamConfig.computationMode === 'ON_DEVICE_EDGE' ? '📱 EDGE CALC' : streamConfig.profile.replace('_', ' ')}</span>
                <span className="text-[10px] text-text-muted">
                  ({streamConfig.wifiBand} • {streamConfig.computationMode === 'ON_DEVICE_EDGE' ? 'Sub-5ms' : `${streamConfig.targetFps} FPS`})
                </span>
              </button>

              {/* View Switchers */}
              {[
                { id: 'target', label: 'Cam 1: Target', icon: '🎯' },
                { id: 'stance', label: 'Cam 2: Stance', icon: '🥋' },
                { id: 'quad', label: 'Dual Split', icon: '⊞' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCameraAngle(c.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    selectedCameraAngle === c.id
                      ? 'bg-[#F5A623] text-black shadow-md'
                      : 'bg-black/40 text-text-secondary hover:text-white border border-white/5'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}

              {/* Speed & Stream Tuner Config Button */}
              <button
                onClick={() => setIsStreamTunerOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#0F172A] hover:bg-white/10 text-white border border-white/20 flex items-center gap-1.5 transition-all"
                title="Configure Video Stream Bitrate, Latency & Sensors"
              >
                <span className="material-symbols-outlined text-[16px] text-[#00E5A0]">tune</span>
                <span>Stream Tuner</span>
              </button>
            </div>
          </div>


          {/* Interactive Multi-Feed Viewport */}
          <div className="relative flex-1 min-h-[440px] bg-[#070A12] rounded-xl overflow-hidden border border-white/10 flex items-center justify-center p-4">
            {/* Background Reticle Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

            {/* VIEW 1: TARGET CAMERA */}
            {(selectedCameraAngle === 'target' || selectedCameraAngle === 'quad') && (
              <div className={`relative flex items-center justify-center ${selectedCameraAngle === 'quad' ? 'w-1/2 h-full border-r border-white/10' : 'w-full h-full'}`}>
                {/* Simulated Target Rings */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border border-white/20 flex items-center justify-center shadow-2xl bg-[#090D18]">
                  <div className="absolute w-52 h-52 md:w-64 md:h-64 rounded-full border border-white/20 flex items-center justify-center">
                    <div className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full border border-white/20 flex items-center justify-center">
                      <div className="absolute w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#020408] border border-white/30 flex items-center justify-center">
                        <div className="absolute w-10 h-10 rounded-full bg-[#F5A623]/20 border border-[#F5A623] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Crosshairs */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10 -translate-x-1/2" />
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10 -translate-y-1/2" />

                  {/* Render Detected Shots */}
                  {shotsToRender.map((shot, idx) => {
                    const posX = 50 + shot.x * 4.5;
                    const posY = 50 - shot.y * 4.5;
                    return (
                      <div
                        key={idx}
                        style={{ left: `${posX}%`, top: `${posY}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#10B981] border-2 border-white shadow-glow flex items-center justify-center animate-fade-in"
                        title={`Shot ${idx + 1}: ${shot.score} (${shot.x.toFixed(1)}mm, ${shot.y.toFixed(1)}mm)`}
                      >
                        <span className="text-[8px] font-black text-black">{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Target Camera HUD Tag */}
                <div className="absolute top-3 left-3 font-mono text-[10px] text-[#10B981] bg-black/70 px-2.5 py-1 rounded border border-[#10B981]/30">
                  CAM 1: DOWNRANGE 1080p60 // SUB-MM OPTICAL
                </div>

                {/* Optical Proof Quick Trigger */}
                {latestImpactSnapshot && (
                  <button
                    onClick={() => setShowSnapshotModal(true)}
                    className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00E5A0]/20 hover:bg-[#00E5A0]/30 border border-[#00E5A0] text-[#00E5A0] text-xs font-mono font-bold transition shadow-lg animate-pulse"
                  >
                    <span>📸</span>
                    <span>Proof #{latestImpactSnapshot.shotNumber} ({latestImpactSnapshot.score.toFixed(1)})</span>
                  </button>
                )}
              </div>
            )}

            {/* VIEW 2: STANCE CAMERA */}
            {(selectedCameraAngle === 'stance' || selectedCameraAngle === 'quad') && (
              <div className={`relative flex flex-col items-center justify-center ${selectedCameraAngle === 'quad' ? 'w-1/2 h-full' : 'w-full h-full'}`}>
                {/* Simulated Wireframe Posture Analysis */}
                <svg viewBox="0 0 100 140" className="w-36 h-48 text-[#38BDF8]/50 stroke-current" fill="none" strokeWidth="1.5">
                  <circle cx="50" cy="22" r="10" />
                  <line x1="50" y1="32" x2="50" y2="78" />
                  <line x1="28" y1="42" x2="72" y2="42" />
                  <line x1="28" y1="42" x2="16" y2="60" />
                  <line x1="16" y1="60" x2="10" y2="58" />
                  <line x1="72" y1="42" x2="48" y2="58" />
                  <line x1="50" y1="78" x2="35" y2="120" />
                  <line x1="50" y1="78" x2="65" y2="120" />
                  <circle cx="50" cy="72" r="3" fill="#10B981" />
                </svg>

                <div className="absolute top-3 left-3 font-mono text-[10px] text-[#38BDF8] bg-black/70 px-2.5 py-1 rounded border border-[#38BDF8]/30">
                  CAM 2: LINE STANCE // BIOMECHANICS 720p60
                </div>

                <div className="absolute bottom-3 flex items-center gap-3 text-[10px] font-mono text-text-muted bg-black/60 px-3 py-1 rounded-full border border-white/10">
                  <span className="text-[#10B981]">STABILITY: 94%</span>
                  <span className="text-[#F5A623]">RECOIL RECOVERY: 0.28s</span>
                </div>
              </div>
            )}

            {/* Ceasefire Alert Center Watermark */}
            {isCeasefireActive && (
              <div className="absolute inset-0 bg-[#EF4444]/30 backdrop-blur-sm flex flex-col items-center justify-center z-30 pointer-events-none">
                <span className="text-4xl mb-2">🚨</span>
                <span className="text-xl font-display font-extrabold text-white tracking-widest uppercase">
                  CEASEFIRE ACTIVE — ALL FIRING SUSPENDED
                </span>
                <span className="text-xs font-mono text-white/80 mt-1">
                  LINE TURNSTILES LOCKED // SOUND ALARM ENABLED
                </span>
              </div>
            )}
          </div>

          {/* Bottom RSO Action Bar */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-white/10 gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={triggerLaneShot}
                className="px-3 py-1.5 rounded-lg bg-[#F5A623] hover:bg-[#F5A623]/90 text-black text-xs font-mono font-bold transition-all shadow-md"
              >
                + Simulate Lane Shot Impact
              </button>
              <button
                onClick={() => setSimulatedShots([])}
                className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-white/10 text-text-secondary text-xs font-mono border border-white/10"
              >
                Reset Target
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
              <span>TOTAL SHOTS: <strong className="text-white">{shotsToRender.length}</strong></span>
              {shotsToRender.length > 0 && (
                <span>
                  LAST SHOT: <strong className="text-[#10B981]">{shotsToRender[shotsToRender.length - 1].score}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Optical Impact Proof Verification Modal */}
      {showSnapshotModal && latestImpactSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#0B0F19] border border-[#00E5A0]/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00E5A0]/20 flex items-center justify-center text-[#00E5A0] text-lg font-bold">
                  🎯
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                    Downrange Optical Impact Verification
                  </h3>
                  <p className="text-xs text-text-muted font-mono">
                    Lane #{latestImpactSnapshot.laneId} • High-Res Bullet Hole Optical Proof
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="text-text-muted hover:text-white p-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {/* Snapshot Preview with Reticle */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
              {latestImpactSnapshot.image ? (
                <img
                  src={latestImpactSnapshot.image}
                  alt={`Shot ${latestImpactSnapshot.shotNumber} impact`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs font-mono text-text-muted">No high-res image attached</div>
              )}
              {/* Reticle Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-[#00E5A0] rounded-full animate-ping opacity-75" />
                <div className="w-2 h-2 bg-[#00E5A0] rounded-full" />
              </div>
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-[#00E5A0] border border-[#00E5A0]/30">
                EDGE ON-DEVICE RECOGNITION
              </div>
            </div>

            {/* Shot Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/5 text-center">
                <div className="text-[10px] font-mono text-text-muted uppercase">SHOT #</div>
                <div className="text-base font-mono font-bold text-white">#{latestImpactSnapshot.shotNumber}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/5 text-center">
                <div className="text-[10px] font-mono text-text-muted uppercase">SCORE</div>
                <div className="text-base font-mono font-bold text-[#00E5A0]">{latestImpactSnapshot.score.toFixed(1)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/5 text-center">
                <div className="text-[10px] font-mono text-text-muted uppercase">OFFSET X</div>
                <div className="text-base font-mono font-bold text-[#38BDF8]">{latestImpactSnapshot.xMm.toFixed(2)} mm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/5 text-center">
                <div className="text-[10px] font-mono text-text-muted uppercase">OFFSET Y</div>
                <div className="text-base font-mono font-bold text-[#F5A623]">{latestImpactSnapshot.yMm.toFixed(2)} mm</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-text-muted pt-2 border-t border-white/10">
              <span>Transmitted via Wi-Fi {streamConfig.wifiBand} Low-Bandwidth Edge Protocol</span>
              <button
                onClick={() => setShowSnapshotModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#00E5A0]/20 hover:bg-[#00E5A0]/30 text-[#00E5A0] border border-[#00E5A0] text-xs font-bold transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced High-Speed Wireless & Hardware Stream Tuner Modal */}
      <StreamTunerModal
        isOpen={isStreamTunerOpen}
        onClose={() => setIsStreamTunerOpen(false)}
        config={streamConfig}
        onConfigChange={(newCfg) => {
          setStreamConfig(newCfg);
          saveStreamConfig(newCfg, selectedLaneId);
        }}
        telemetry={telemetryMetrics}
        laneName={`Lane ${activeLane.number ?? '1'}`}
        laneId={selectedLaneId}
      />
    </div>
  );
}

