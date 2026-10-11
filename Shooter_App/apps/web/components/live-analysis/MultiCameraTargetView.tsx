// apps/web/components/live-analysis/MultiCameraTargetView.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TargetSpec, ShotCoordinates, ShotResult } from '../../lib/target-specs';
import { TargetCanvas } from './TargetCanvas';
import { StreamTunerModal } from './StreamTunerModal';
import { CameraStreamConfig, StreamTelemetryMetrics } from '@shooting-platform/shared-types';
import { loadStreamConfig, saveStreamConfig, STREAM_PRESETS, StreamTelemetryTracker } from '@/lib/stream-optimizer';

export type CameraAngle = 'target' | 'stance' | 'trigger' | 'bay';
export type ViewLayout = 'pip' | 'split' | 'quad';
export type OpticalFilter = 'optical' | 'monochrome' | 'thermal';

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

interface MultiCameraTargetViewProps {
  spec: TargetSpec;
  shots: (ShotCoordinates & ShotResult)[];
  isCeasefireActive?: boolean;
  latestImpactSnapshot?: ShotImpactSnapshot | null;
}

export function MultiCameraTargetView({
  spec,
  shots,
  isCeasefireActive = false,
  latestImpactSnapshot = null,
}: MultiCameraTargetViewProps) {
  const [layout, setLayout] = useState<ViewLayout>('pip');
  const [primaryAngle, setPrimaryAngle] = useState<CameraAngle>('target');
  const [pipAngle, setPipAngle] = useState<CameraAngle>('stance');
  const [filter, setFilter] = useState<OpticalFilter>('optical');
  const [zoom, setZoom] = useState<number>(1.0);
  const [showReticle, setShowReticle] = useState(true);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [heartRate, setHeartRate] = useState(72);
  const [holdStability, setHoldStability] = useState(94);
  const [impactSnapshot, setImpactSnapshot] = useState<ShotImpactSnapshot | null>(latestImpactSnapshot);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);

  useEffect(() => {
    if (latestImpactSnapshot) {
      setImpactSnapshot(latestImpactSnapshot);
    }
  }, [latestImpactSnapshot]);

  // High-Speed Wireless Video & Hardware Stream Optimization
  const [isStreamTunerOpen, setIsStreamTunerOpen] = useState(false);
  const [streamConfig, setStreamConfig] = useState<CameraStreamConfig>(() => loadStreamConfig('shooter-main'));
  const trackerRef = useRef<StreamTelemetryTracker>(new StreamTelemetryTracker());
  const [telemetryMetrics, setTelemetryMetrics] = useState<StreamTelemetryMetrics>(() =>
    trackerRef.current.getMetrics(streamConfig.targetFps, streamConfig.profile)
  );

  useEffect(() => {
    const tracker = trackerRef.current;
    const interval = setInterval(() => {
      const simulatedRtt = Math.max(8, Math.floor(12 + Math.random() * 6));
      tracker.registerRtt(simulatedRtt);
      tracker.registerFrame(Math.floor((streamConfig.bitrateCapKbps * 1000) / 8 / streamConfig.targetFps));
      setTelemetryMetrics(tracker.getMetrics(streamConfig.targetFps, streamConfig.profile));
    }, 1000);
    return () => clearInterval(interval);
  }, [streamConfig]);


  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Live heart rate and hold stability subtle fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      setHeartRate((prev) => 68 + Math.floor(Math.random() * 8));
      setHoldStability((prev) => 91 + Math.floor(Math.random() * 7));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // WebRTC UserMedia webcam toggle for Stance camera
  const toggleWebcam = async () => {
    if (isWebcamActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setIsWebcamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsWebcamActive(true);
      } catch (err) {
        console.warn('Unable to access webcam:', err);
        alert('Webcam access was denied or not available. Using tactical synthetic camera feed.');
      }
    }
  };

  useEffect(() => {
    if (isWebcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isWebcamActive, layout, primaryAngle]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Filter CSS classes
  const filterClass = {
    optical: '',
    monochrome: 'grayscale contrast-125 brightness-95',
    thermal: 'sepia contrast-150 hue-rotate-180 saturate-200',
  }[filter];

  // Render individual camera feed box
  const renderCameraFeed = (angle: CameraAngle, isThumbnail: boolean = false) => {
    const isTarget = angle === 'target';

    return (
      <div
        className={`relative w-full h-full rounded-2xl overflow-hidden border border-border-subtle bg-[#080B12] flex items-center justify-center select-none ${filterClass}`}
      >
        {/* Reticle / Scanning Grid */}
        {showReticle && (
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px]" />
            {/* Center Crosshairs */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/15 -translate-y-1/2" />
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/15 -translate-x-1/2" />
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#F5A623]/60" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#F5A623]/60" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#F5A623]/60" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#F5A623]/60" />
          </div>
        )}

        {/* FEED CONTENT */}
        {isTarget ? (
          <div
            className="w-full h-full flex items-center justify-center p-3 transition-transform duration-200 relative"
            style={{ transform: `scale(${zoom})` }}
          >
            <TargetCanvas spec={spec} shots={shots} />
            {impactSnapshot && !isThumbnail && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSnapshotModal(true);
                }}
                className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00E5A0]/20 hover:bg-[#00E5A0]/30 border border-[#00E5A0] text-[#00E5A0] text-[11px] font-mono font-bold transition shadow-lg"
              >
                <span>📸</span>
                <span>Proof #{impactSnapshot.shotNumber} ({impactSnapshot.score.toFixed(1)})</span>
              </button>
            )}
          </div>
        ) : angle === 'stance' ? (
          <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#050811]">
            {isWebcamActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              /* High-tech posture simulation feed */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                {/* Silhouette Wireframe */}
                <svg viewBox="0 0 100 140" className="w-32 h-44 text-[#38BDF8]/40 stroke-current" fill="none" strokeWidth="1.5">
                  {/* Head */}
                  <circle cx="50" cy="22" r="10" />
                  {/* Spine & Torso */}
                  <line x1="50" y1="32" x2="50" y2="78" />
                  {/* Shoulders */}
                  <line x1="28" y1="42" x2="72" y2="42" />
                  {/* Left Arm extended with firearm */}
                  <line x1="28" y1="42" x2="16" y2="60" />
                  <line x1="16" y1="60" x2="10" y2="58" />
                  {/* Right Arm supporting */}
                  <line x1="72" y1="42" x2="48" y2="58" />
                  {/* Pelvis & Legs */}
                  <line x1="50" y1="78" x2="35" y2="120" />
                  <line x1="50" y1="78" x2="65" y2="120" />
                  {/* Center of Gravity Marker */}
                  <circle cx="50" cy="72" r="3" fill="#10B981" />
                </svg>

                <div className="absolute bottom-6 flex items-center gap-3 text-[10px] font-mono text-text-muted bg-black/60 px-3 py-1 rounded-full border border-white/10">
                  <span className="text-[#10B981]">● BALANCE: 51/49%</span>
                  <span className="text-[#38BDF8]">SPINE: 89.2°</span>
                </div>
              </div>
            )}
          </div>
        ) : angle === 'trigger' ? (
          /* Trigger Finger & Grip Macro Cam */
          <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-b from-[#111827] to-[#04060C] p-4">
            <svg viewBox="0 0 120 100" className="w-40 h-32 text-[#F5A623]/50 stroke-current" fill="none" strokeWidth="1.5">
              {/* Grip frame */}
              <rect x="20" y="20" width="35" height="65" rx="6" />
              {/* Trigger guard */}
              <path d="M 55 35 Q 75 35 75 55 L 55 55" />
              {/* Trigger blade */}
              <line x1="62" y1="37" x2="60" y2="50" strokeWidth="2.5" stroke="#F5A623" />
              {/* Finger Placement Guideline */}
              <circle cx="61" cy="44" r="5" fill="#EF4444" opacity="0.6" />
            </svg>
            <div className="absolute bottom-6 flex items-center gap-3 text-[10px] font-mono text-text-muted bg-black/60 px-3 py-1 rounded-full border border-white/10">
              <span className="text-[#F5A623]">PRE-TRAVEL: 1.8mm</span>
              <span className="text-[#10B981]">FREEZE INDEX: 0.12s</span>
            </div>
          </div>
        ) : (
          /* Wide-Bay Safety Overview Cam */
          <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#020617] p-4">
            <div className="w-full h-32 border border-dashed border-[#10B981]/30 rounded-xl flex items-center justify-center relative">
              <span className="text-[11px] font-mono text-[#10B981]/70">
                MUZZLE SAFETY ENVELOPE: 45° BOUNDARY [CLEAR]
              </span>
              <div className="absolute bottom-2 left-3 text-[9px] font-mono text-text-muted">
                RSO OVERVIEW // SECTOR 1-A
              </div>
            </div>
          </div>
        )}

        {/* HUD TELEMETRY BADGES */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            {angle === 'target' && 'CAM 1: DOWNRANGE TARGET'}
            {angle === 'stance' && 'CAM 2: ATHLETE STANCE'}
            {angle === 'trigger' && 'CAM 3: TRIGGER GRIP MACRO'}
            {angle === 'bay' && 'CAM 4: WIDE BAY SAFETY'}
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-mono text-text-muted">
            {angle === 'target' && streamConfig.computationMode === 'ON_DEVICE_EDGE'
              ? '📱 EDGE CALC'
              : `${streamConfig.resolution.toUpperCase()} @ ${streamConfig.targetFps} FPS`}
          </span>
          {angle === 'target' && (
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded bg-[#00E5A0]/10 text-[9px] font-mono text-[#00E5A0] font-bold">
              {streamConfig.wifiBand}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#10B981]">
            {angle === 'target' && streamConfig.computationMode === 'ON_DEVICE_EDGE'
              ? '⚡ 4ms (SUB-5MS EDGE)'
              : `${telemetryMetrics.rttMs}ms LATENCY`}
          </span>
        </div>

        {/* Corner Watermark */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <span className="text-[9px] font-mono text-white/40 tracking-wider">
            MARKSMAN VISION ENGINE // EST-2026
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Camera Controls Bar */}
      <div className="p-4 rounded-2xl bg-[#0F172A] border border-border-subtle flex flex-wrap items-center justify-between gap-4">
        {/* Layout Mode Toggles */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-text-muted uppercase mr-1">VIEW MODE:</span>
          {[
            { id: 'pip', label: 'Picture-in-Picture', icon: '🔲' },
            { id: 'split', label: 'Dual Split', icon: '🌗' },
            { id: 'quad', label: 'Tactical Quad', icon: '⊞' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setLayout(m.id as ViewLayout)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                layout === m.id
                  ? 'bg-[#F5A623] text-black shadow-md'
                  : 'bg-black/40 text-text-secondary hover:text-white border border-white/5'
              }`}
            >
              <span>{m.icon}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Optical Filter Modes */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-text-muted uppercase mr-1">OPTICS:</span>
          {[
            { id: 'optical', label: 'Optical', color: '#10B981' },
            { id: 'monochrome', label: 'High Contrast', color: '#38BDF8' },
            { id: 'thermal', label: 'Thermal', color: '#EF4444' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as OpticalFilter)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                filter === f.id
                  ? 'bg-white/15 text-white border border-white/30 font-bold'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Zoom & Webcam Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleWebcam}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
              isWebcamActive
                ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                : 'bg-black/30 border-white/10 text-text-secondary hover:text-white'
            }`}
            title="Toggle Live Stance Webcam"
          >
            📷 {isWebcamActive ? 'Webcam Active' : 'Enable Webcam'}
          </button>

          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-2 py-1">
            <span className="text-[11px] font-mono text-text-muted mr-2">ZOOM</span>
            {[1.0, 1.5, 2.0].map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-1.5 py-0.5 text-[11px] font-mono rounded ${
                  zoom === z ? 'bg-[#F5A623] text-black font-bold' : 'text-text-muted hover:text-white'
                }`}
              >
                {z}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowReticle((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs font-mono ${
              showReticle ? 'bg-white/10 border-white/20 text-[#38BDF8]' : 'text-text-muted border-transparent'
            }`}
            title="Toggle Reticle & Scanning Grid"
          >
            🎯 Reticle
          </button>

          {/* Performance & Stream Tuner Trigger Button */}
          <button
            onClick={() => setIsStreamTunerOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] hover:bg-[#00E5A0]/20 flex items-center gap-1.5 transition-all shadow-sm"
            title="Configure Video Stream Bitrate, Latency & Sensor GPU Acceleration"
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span className="hidden sm:inline">Stream Tuner</span>
            <span className="text-[10px] text-text-muted">({telemetryMetrics.currentFps} FPS)</span>
          </button>
        </div>
      </div>


      {/* Synchronized Biometrics & Sensor Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0F172A] border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">HEART RATE</p>
            <p className="text-lg font-mono font-bold text-[#EF4444]">{heartRate} BPM</p>
          </div>
          <span className="text-xl animate-pulse">💓</span>
        </div>

        <div className="p-3 rounded-xl bg-[#0F172A] border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">HOLD STABILITY</p>
            <p className="text-lg font-mono font-bold text-[#10B981]">{holdStability}%</p>
          </div>
          <span className="text-xl">🎯</span>
        </div>

        <div className="p-3 rounded-xl bg-[#0F172A] border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">WIND DEFLECTION</p>
            <p className="text-lg font-mono font-bold text-[#38BDF8]">3.4 mph <span className="text-xs">NW</span></p>
          </div>
          <span className="text-xl">💨</span>
        </div>

        <div className="p-3 rounded-xl bg-[#0F172A] border border-border-subtle flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-text-muted uppercase">TOTAL DETECTED</p>
            <p className="text-lg font-mono font-bold text-[#F5A623]">{shots.length} SHOTS</p>
          </div>
          <span className="text-xl">💥</span>
        </div>
      </div>

      {/* MAIN VIEWPORT LAYOUTS */}
      <div className="relative min-h-[550px] w-full">
        {/* Ceasefire Alert Overlay */}
        {isCeasefireActive && (
          <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md rounded-2xl border-2 border-[#EF4444] flex flex-col items-center justify-center p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.5)]">
            <div className="w-16 h-16 rounded-full bg-[#EF4444]/20 border border-[#EF4444] flex items-center justify-center text-[#EF4444] mb-4 text-3xl font-bold animate-bounce">
              🚨
            </div>
            <h2 className="text-2xl font-bold text-[#EF4444] font-display uppercase tracking-widest mb-2">
              EMERGENCY CEASEFIRE IN EFFECT
            </h2>
            <p className="text-white text-base max-w-md font-medium mb-3">
              Range Safety Officer has suspended all firing. Ground weapons and step back behind the line.
            </p>
            <div className="px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-xs font-mono uppercase tracking-wider">
              AWAIT RSO AUDIBLE CLEARANCE SIGNAL
            </div>
          </div>
        )}

        {/* LAYOUT 1: PICTURE-IN-PICTURE (PIP) */}
        {layout === 'pip' && (
          <div className="relative w-full h-[580px]">
            {/* Primary Feed */}
            <div className="w-full h-full">
              {renderCameraFeed(primaryAngle)}
            </div>

            {/* Floating PiP Window */}
            <div className="absolute bottom-4 right-4 z-30 w-72 h-48 rounded-xl shadow-2xl border-2 border-[#F5A623]/80 overflow-hidden bg-black group transition-transform duration-200 hover:scale-105">
              {renderCameraFeed(pipAngle, true)}

              {/* PiP Angle Selector Overlay */}
              <div className="absolute top-2 right-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/80 p-1 rounded-md">
                <button
                  onClick={() => {
                    const temp = primaryAngle;
                    setPrimaryAngle(pipAngle);
                    setPipAngle(temp);
                  }}
                  className="px-2 py-0.5 rounded bg-[#F5A623] text-black text-[10px] font-mono font-bold"
                  title="Swap Primary & PiP"
                >
                  ⇄ Swap
                </button>
                <select
                  value={pipAngle}
                  onChange={(e) => setPipAngle(e.target.value as CameraAngle)}
                  className="bg-black text-white text-[10px] font-mono p-0.5 rounded border border-white/20"
                >
                  <option value="stance">Cam 2: Stance</option>
                  <option value="trigger">Cam 3: Trigger</option>
                  <option value="bay">Cam 4: Bay</option>
                  <option value="target">Cam 1: Target</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT 2: DUAL SPLIT SCREEN */}
        {layout === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[580px]">
            <div className="w-full h-full">
              {renderCameraFeed('target')}
            </div>
            <div className="w-full h-full">
              {renderCameraFeed('stance')}
            </div>
          </div>
        )}

        {/* LAYOUT 3: TACTICAL QUAD MULTIVIEW (4 CAMERAS) */}
        {layout === 'quad' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[640px]">
            <div className="w-full h-[320px]">
              {renderCameraFeed('target')}
            </div>
            <div className="w-full h-[320px]">
              {renderCameraFeed('stance')}
            </div>
            <div className="w-full h-[320px]">
              {renderCameraFeed('trigger')}
            </div>
            <div className="w-full h-[320px]">
              {renderCameraFeed('bay')}
            </div>
          </div>
        )}
      </div>

      {/* Optical Impact Proof Verification Modal */}
      {showSnapshotModal && impactSnapshot && (
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
                    Lane #{impactSnapshot.laneId} • High-Res Bullet Hole Optical Proof
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
              {impactSnapshot.image ? (
                <img
                  src={impactSnapshot.image}
                  alt={`Shot ${impactSnapshot.shotNumber} impact`}
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
                <div className="text-base font-mono font-bold text-white">#{impactSnapshot.shotNumber}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/5 text-center">
                <div className="text-[10px] font-mono text-text-muted uppercase">SCORE</div>
                <div className="text-base font-mono font-bold text-[#00E5A0]">{impactSnapshot.score.toFixed(1)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/5 text-center">
                <div className="text-[10px] font-mono text-text-muted uppercase">OFFSET X</div>
                <div className="text-base font-mono font-bold text-[#38BDF8]">{impactSnapshot.xMm.toFixed(2)} mm</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F172A] border border-white/5 text-center">
                <div className="text-[10px] font-mono text-text-muted uppercase">OFFSET Y</div>
                <div className="text-base font-mono font-bold text-[#F5A623]">{impactSnapshot.yMm.toFixed(2)} mm</div>
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

      {/* High-Speed Wireless Stream Optimizer & Hardware Tuner Modal */}
      <StreamTunerModal
        isOpen={isStreamTunerOpen}
        onClose={() => setIsStreamTunerOpen(false)}
        config={streamConfig}
        onConfigChange={(newCfg) => {
          setStreamConfig(newCfg);
          saveStreamConfig(newCfg, 'shooter-main');
        }}
        telemetry={telemetryMetrics}
        laneName="Downrange Optical Cam"
        laneId="shooter-main"
      />
    </div>
  );
}

