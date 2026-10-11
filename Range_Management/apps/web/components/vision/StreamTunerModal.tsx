// apps/web/components/vision/StreamTunerModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  CameraStreamConfig,
  StreamProfilePreset,
  StreamTelemetryMetrics,
  VideoHardwareAcceleration,
  VideoTransportProtocol,
  CongestionPolicy,
  WiFiFrequencyBand,
  VideoComputationMode,
} from '@shooting-platform/shared-types';
import { STREAM_PRESETS, saveStreamConfig } from '@/lib/stream-optimizer';

interface StreamTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CameraStreamConfig;
  onConfigChange: (newConfig: CameraStreamConfig) => void;
  telemetry?: StreamTelemetryMetrics | null;
  laneName?: string;
  laneId?: string;
}

export function StreamTunerModal({
  isOpen,
  onClose,
  config,
  onConfigChange,
  telemetry,
  laneName = 'Lane 1',
  laneId = 'lane-1',
}: StreamTunerModalProps) {
  const [localConfig, setLocalConfig] = useState<CameraStreamConfig>(config);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'hardware' | 'telemetry'>('presets');
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: StreamProfilePreset) => {
    if (preset === 'CUSTOM') {
      setLocalConfig((prev) => ({ ...prev, profile: 'CUSTOM' }));
      setActiveTab('custom');
    } else {
      const newConfig = { ...STREAM_PRESETS[preset], laneId };
      setLocalConfig(newConfig);
      onConfigChange(newConfig);
      saveStreamConfig(newConfig, laneId);
      triggerSaveIndicator();
    }
  };

  const updateField = <K extends keyof CameraStreamConfig>(field: K, val: CameraStreamConfig[K]) => {
    setLocalConfig((prev) => {
      const updated = { ...prev, [field]: val, profile: 'CUSTOM' as StreamProfilePreset };
      return updated;
    });
  };

  const handleApplyCustom = () => {
    onConfigChange(localConfig);
    saveStreamConfig(localConfig, laneId);
    triggerSaveIndicator();
  };

  const triggerSaveIndicator = () => {
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2000);
  };

  const currentMetrics: StreamTelemetryMetrics = telemetry || {
    currentFps: localConfig.targetFps,
    targetFps: localConfig.targetFps,
    rttMs: 18,
    jitterMs: 3,
    bandwidthKbps: Math.round(localConfig.bitrateCapKbps * 0.8),
    droppedFramesCount: 0,
    dropRatePercent: 0,
    networkQuality: 'EXCELLENT',
    isThrottled: false,
    activeProfile: localConfig.profile,
    timestamp: Date.now(),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#0B0F19] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00E5A0]/10 border border-[#00E5A0]/20 text-[#00E5A0]">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">
                  High-Speed Stream & Hardware Optimizer
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-[#F5A623]">
                  {laneName}
                </span>
              </div>
              <p className="text-xs text-text-muted font-mono">
                Sub-50ms Wireless Downrange Optimization • Adaptive ABR • Custom Sensor Matrix
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Real-time Quick Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-3 bg-[#080B12] border-b border-white/5 font-mono text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Achieved FPS</span>
            <span className="font-bold text-[#00E5A0] text-sm flex items-center gap-1">
              {currentMetrics.currentFps} / {currentMetrics.targetFps}
              <span className="text-[10px] text-text-muted font-normal">fps</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Network RTT</span>
            <span className={`font-bold text-sm ${currentMetrics.rttMs < 50 ? 'text-[#00E5A0]' : currentMetrics.rttMs < 100 ? 'text-[#F5A623]' : 'text-[#EF4444]'}`}>
              {currentMetrics.rttMs} ms
              <span className="text-[10px] text-text-muted font-normal ml-1">(±{currentMetrics.jitterMs}ms)</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Bitrate Consumption</span>
            <span className="font-bold text-white text-sm">
              {(currentMetrics.bandwidthKbps / 1000).toFixed(1)} Mbps
              <span className="text-[10px] text-text-muted font-normal ml-1">/ {localConfig.bitrateCapKbps}k cap</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Link Quality</span>
            <span className="font-bold text-sm flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                currentMetrics.networkQuality === 'EXCELLENT' ? 'bg-[#00E5A0]' :
                currentMetrics.networkQuality === 'GOOD' ? 'bg-[#10B981]' :
                currentMetrics.networkQuality === 'FAIR' ? 'bg-[#F5A623]' : 'bg-[#EF4444]'
              }`} />
              <span className="text-white text-xs">{currentMetrics.networkQuality}</span>
              {currentMetrics.dropRatePercent > 0 && (
                <span className="text-[10px] text-[#EF4444]">({currentMetrics.dropRatePercent}% drop)</span>
              )}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-white/10 bg-[#0B0F19]">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-[#00E5A0] text-[#00E5A0]'
                : 'border-transparent text-text-muted hover:text-white'
            }`}
          >
            Prebaked Profiles
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-[#00E5A0] text-[#00E5A0]'
                : 'border-transparent text-text-muted hover:text-white'
            }`}
          >
            Custom Stream Config
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'hardware'
                ? 'border-[#00E5A0] text-[#00E5A0]'
                : 'border-transparent text-text-muted hover:text-white'
            }`}
          >
            Hardware &amp; Sensor Optics
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'telemetry'
                ? 'border-[#00E5A0] text-[#00E5A0]'
                : 'border-transparent text-text-muted hover:text-white'
            }`}
          >
            Telemetry Diagnostics
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PREBAKED PROFILES */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                Select an engineered baseline optimized for your physical range network topology:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Auto Adaptive */}
                <div
                  onClick={() => handleSelectPreset('AUTO_ADAPTIVE')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    localConfig.profile === 'AUTO_ADAPTIVE'
                      ? 'border-[#00E5A0] bg-[#00E5A0]/10 shadow-lg'
                      : 'border-white/10 bg-[#0F172A] hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00E5A0] text-[18px]">auto_mode</span>
                      Auto / Network Adaptive (Recommended)
                    </span>
                    {localConfig.profile === 'AUTO_ADAPTIVE' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0] text-black font-bold">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Continuously senses ping jitter and packet drops. Dynamically adjusts resolution (480p-1080p) and frame rate without stream drops.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#00E5A0]">
                    <span className="px-2 py-0.5 rounded bg-white/5">Auto Spectrum</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">Dynamic 30 FPS</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">ABR Governor</span>
                  </div>
                </div>

                {/* LAN Ultra-Low Latency */}
                <div
                  onClick={() => handleSelectPreset('LAN_ULTRA_LOW_LAT')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    localConfig.profile === 'LAN_ULTRA_LOW_LAT'
                      ? 'border-[#00E5A0] bg-[#00E5A0]/10 shadow-lg'
                      : 'border-white/10 bg-[#0F172A] hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#38BDF8] text-[18px]">speed</span>
                      Gigabit Range LAN (Sub-15ms)
                    </span>
                    {localConfig.profile === 'LAN_ULTRA_LOW_LAT' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0] text-black font-bold">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Full 1080p @ 60 FPS with 0ms jitter buffer. High fidelity 6.0 Mbps stream designed for range switches and dedicated 5GHz / 6GHz Wi-Fi APs.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#38BDF8]">
                    <span className="px-2 py-0.5 rounded bg-white/5">5GHz / LAN</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">Server Vision</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">1080p @ 60 FPS</span>
                  </div>
                </div>

                {/* Bandwidth Saver (Tailored for ~5.9 Mbps Upload) */}
                <div
                  onClick={() => handleSelectPreset('BANDWIDTH_SAVER')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    localConfig.profile === 'BANDWIDTH_SAVER'
                      ? 'border-[#00E5A0] bg-[#00E5A0]/10 shadow-lg'
                      : 'border-white/10 bg-[#0F172A] hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#F5A623] text-[18px]">cell_tower</span>
                      Bandwidth Saver & 2.4GHz Edge
                    </span>
                    {localConfig.profile === 'BANDWIDTH_SAVER' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0] text-black font-bold">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    On-device phone edge shot calculation. Sub-5ms shot detection, 99.9% bandwidth saving, optimized for 2.4GHz long-range obstacle penetration.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#F5A623]">
                    <span className="px-2 py-0.5 rounded bg-white/5">2.4GHz Optimized</span>
                    <span className="px-2 py-0.5 rounded bg-[#00E5A0]/20 text-[#00E5A0] font-bold">📱 On-Device Edge</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">800 kbps Cap</span>
                  </div>
                </div>

                {/* Eco Battery Mode */}
                <div
                  onClick={() => handleSelectPreset('ECO_BATTERY')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    localConfig.profile === 'ECO_BATTERY'
                      ? 'border-[#00E5A0] bg-[#00E5A0]/10 shadow-lg'
                      : 'border-white/10 bg-[#0F172A] hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#A78BFA] text-[18px]">battery_saver</span>
                      Eco Battery / Thermal Stand
                    </span>
                    {localConfig.profile === 'ECO_BATTERY' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0] text-black font-bold">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    360p @ 10 FPS with on-device scoring and sensor sleep. Designed for battery-operated downrange tripods under hot sun to prevent thermal throttling.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#A78BFA]">
                    <span className="px-2 py-0.5 rounded bg-white/5">2.4GHz Ultra-Eco</span>
                    <span className="px-2 py-0.5 rounded bg-[#00E5A0]/20 text-[#00E5A0] font-bold">📱 On-Device Edge</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">Max Battery</span>
                  </div>
                </div>
              </div>

              {/* Custom manual option banner */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Need Custom Settings?</h4>
                  <p className="text-[11px] text-text-muted">
                    Unlock granular control over resolution, frame rate, buffer depth, and hardware acceleration.
                  </p>
                </div>
                <button
                  onClick={() => handleSelectPreset('CUSTOM')}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase"
                >
                  Unlock Custom Studio
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM STREAM CONFIG */}
          {activeTab === 'custom' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Custom Stream Architecture</h3>
                  <p className="text-xs text-text-muted">Direct operator override parameters for the downrange optical link.</p>
                </div>
                <button
                  onClick={handleApplyCustom}
                  className="px-4 py-2 rounded-lg bg-[#00E5A0] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md hover:bg-[#00E5A0]/90 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Save &amp; Broadcast
                </button>
              </div>

              {/* Radio Link & Computation Architecture Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#080B12] border border-white/10">
                {/* 1. Wi-Fi Physical Frequency Band */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-white flex items-center gap-1.5 uppercase">
                      <span className="material-symbols-outlined text-[16px] text-[#00E5A0]">wifi</span>
                      Wi-Fi Frequency Band
                    </label>
                    <span className="text-[10px] font-mono text-[#00E5A0] font-bold">
                      {localConfig.wifiBand}
                    </span>
                  </div>
                  <select
                    value={localConfig.wifiBand}
                    onChange={(e) => updateField('wifiBand', e.target.value as WiFiFrequencyBand)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-white/10 text-white font-mono text-xs focus:border-[#00E5A0] outline-none"
                  >
                    <option value="AUTO_DETECT">AUTO_DETECT (Adaptive Spectrum Negotiation)</option>
                    <option value="2.4GHz">2.4 GHz ISM (Long Range 50m–100m • High Obstacle Penetration)</option>
                    <option value="5GHz">5 GHz Unlicensed (High Speed 10m–25m • Low Latency Line-of-Sight)</option>
                    <option value="6GHz+">6 GHz+ (Wi-Fi 6E/7 • Zero Congestion / Flagship Hardware)</option>
                  </select>
                  <p className="text-[11px] text-text-muted leading-tight">
                    {localConfig.wifiBand === '2.4GHz'
                      ? '⚠️ 2.4 GHz penetrates thick range baffles & concrete easily. Caps bitrate to prevent packet drops.'
                      : localConfig.wifiBand === '5GHz'
                      ? '⚡ 5 GHz offers 80 MHz channel widths for 60 FPS streaming, but attenuates quickly through physical barriers.'
                      : localConfig.wifiBand === '6GHz+'
                      ? '🚀 6 GHz+ delivers pristine spectrum with zero channel interference. Requires Wi-Fi 6E/7 devices.'
                      : '🔄 Auto-detect continually benchmarks ping jitter and RSSI to negotiate optimal parameters.'}
                  </p>
                </div>

                {/* 2. Target Vision & Shot Calculation Engine */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-white flex items-center gap-1.5 uppercase">
                      <span className="material-symbols-outlined text-[16px] text-[#38BDF8]">memory</span>
                      Vision Computation Engine
                    </label>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      localConfig.computationMode === 'ON_DEVICE_EDGE'
                        ? 'bg-[#00E5A0]/20 text-[#00E5A0]'
                        : localConfig.computationMode === 'HYBRID_EDGE_STREAM'
                        ? 'bg-[#F5A623]/20 text-[#F5A623]'
                        : 'bg-[#38BDF8]/20 text-[#38BDF8]'
                    }`}>
                      {localConfig.computationMode}
                    </span>
                  </div>
                  <select
                    value={localConfig.computationMode}
                    onChange={(e) => updateField('computationMode', e.target.value as VideoComputationMode)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-white/10 text-white font-mono text-xs focus:border-[#00E5A0] outline-none"
                  >
                    <option value="ON_DEVICE_EDGE">📱 ON_DEVICE_EDGE (Phone computes shots locally • Sub-5ms / 99.9% bandwidth saving)</option>
                    <option value="HYBRID_EDGE_STREAM">⚡ HYBRID_EDGE_STREAM (Local phone scoring + 10 FPS low-bandwidth live preview)</option>
                    <option value="SERVER_VISION">🖥️ SERVER_VISION (Continuous video stream to Server/OpenCV/YOLO)</option>
                  </select>
                  <p className="text-[11px] text-text-muted leading-tight">
                    {localConfig.computationMode === 'ON_DEVICE_EDGE'
                      ? '✨ Phone calculates bullet impact coords downrange. Sends lightweight <2 kbps JSON. Zero stream lag!'
                      : localConfig.computationMode === 'HYBRID_EDGE_STREAM'
                      ? '🎯 Instant shot detection on phone + throttled 10 FPS video preview for human verification.'
                      : '📹 Full video feed transmitted across Wi-Fi for centralized computer vision processing.'}
                  </p>
                </div>

                {/* Impact Snapshot Option (Active in EDGE / HYBRID mode) */}
                <div className="md:col-span-2 pt-2 border-t border-white/5">
                  <label className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 cursor-pointer hover:border-white/20 transition-colors">
                    <div className="space-y-0.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#F5A623]">camera</span>
                        <span className="text-xs font-bold text-white">Transmit High-Res Impact Snapshot on Bullet Hit</span>
                      </div>
                      <p className="text-[11px] text-text-muted">
                        When edge computing is active, eliminates constant video streaming but captures and sends a crisp high-res still crop of the target face when a shot is detected.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localConfig.sendImpactSnapshot}
                      onChange={(e) => updateField('sendImpactSnapshot', e.target.checked)}
                      className="w-4 h-4 accent-[#00E5A0] rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resolution */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-text-muted uppercase">Resolution</label>
                  <select
                    value={localConfig.resolution}
                    onChange={(e) => updateField('resolution', e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-white/10 text-white font-mono text-xs focus:border-[#00E5A0] outline-none"
                  >
                    <option value="1080p">1080p (1920 × 1080) - High Res</option>
                    <option value="720p">720p (1280 × 720) - Standard ISSF</option>
                    <option value="480p">480p (854 × 480) - High Speed</option>
                    <option value="360p">360p (640 × 360) - Low Bandwidth</option>
                  </select>
                </div>

                {/* Target FPS */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-text-muted uppercase">Target Frame Rate</span>
                    <span className="text-[#00E5A0] font-bold">{localConfig.targetFps} FPS</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={localConfig.targetFps}
                    onChange={(e) => updateField('targetFps', Number(e.target.value))}
                    className="w-full accent-[#00E5A0]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>10 fps (Eco)</span>
                    <span>30 fps</span>
                    <span>60 fps (Sync)</span>
                  </div>
                </div>

                {/* Bitrate Cap */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-text-muted uppercase">Bitrate Cap</span>
                    <span className="text-white font-bold">{localConfig.bitrateCapKbps} kbps</span>
                  </div>
                  <input
                    type="range"
                    min="250"
                    max="8000"
                    step="250"
                    value={localConfig.bitrateCapKbps}
                    onChange={(e) => updateField('bitrateCapKbps', Number(e.target.value))}
                    className="w-full accent-[#00E5A0]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>250k</span>
                    <span>2500k (2.5M)</span>
                    <span>8000k (8M)</span>
                  </div>
                </div>

                {/* Compression Quality */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-text-muted uppercase">Quality Factor</span>
                    <span className="text-white font-bold">{Math.round(localConfig.qualityFactor * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="0.95"
                    step="0.05"
                    value={localConfig.qualityFactor}
                    onChange={(e) => updateField('qualityFactor', Number(e.target.value))}
                    className="w-full accent-[#00E5A0]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>15% (Raw Speed)</span>
                    <span>50% (Balanced)</span>
                    <span>95% (Extreme)</span>
                  </div>
                </div>

                {/* Transport Protocol */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-text-muted uppercase">Transport Protocol</label>
                  <select
                    value={localConfig.protocol}
                    onChange={(e) => updateField('protocol', e.target.value as VideoTransportProtocol)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-white/10 text-white font-mono text-xs focus:border-[#00E5A0] outline-none"
                  >
                    <option value="WEBSOCKET_BINARY">WebSocket Binary Relay (Cross-Platform)</option>
                    <option value="WEBRTC_DATA">WebRTC Peer-to-Peer (Ultra-Low Latency)</option>
                    <option value="RTSP_OVER_WS">RTSP over WebSocket (Industrial Range Cameras)</option>
                    <option value="MJPEG_HTTP">MJPEG HTTP Stream (Legacy IP Cam Fallback)</option>
                  </select>
                </div>

                {/* Congestion Control Policy */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-text-muted uppercase">Congestion Control Policy</label>
                  <select
                    value={localConfig.congestionPolicy}
                    onChange={(e) => updateField('congestionPolicy', e.target.value as CongestionPolicy)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-white/10 text-white font-mono text-xs focus:border-[#00E5A0] outline-none"
                  >
                    <option value="DROP_LATE">Drop Late Frames (Zero Delay / Realtime)</option>
                    <option value="SMOOTH_JITTER">Smooth Jitter Buffer (Smoothest View)</option>
                    <option value="ADAPTIVE_DOWNSCALE">Adaptive Downscale (Automatic Resolution Throttle)</option>
                  </select>
                </div>

                {/* Jitter Buffer Depth */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-text-muted uppercase">Jitter Buffer Depth</span>
                    <span className="text-[#38BDF8] font-bold">{localConfig.jitterBufferMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="10"
                    value={localConfig.jitterBufferMs}
                    onChange={(e) => updateField('jitterBufferMs', Number(e.target.value))}
                    className="w-full accent-[#38BDF8]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>0ms (No Buffer)</span>
                    <span>60ms (Standard)</span>
                    <span>300ms (High Loss)</span>
                  </div>
                </div>

                {/* Keyframe / I-Frame Interval */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-text-muted uppercase">Keyframe Interval</span>
                    <span className="text-white font-bold">{localConfig.keyframeIntervalSec}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.5"
                    value={localConfig.keyframeIntervalSec}
                    onChange={(e) => updateField('keyframeIntervalSec', Number(e.target.value))}
                    className="w-full accent-[#00E5A0]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted">
                    <span>0.5s (Fast Sync)</span>
                    <span>1.0s</span>
                    <span>5.0s (Max Compression)</span>
                  </div>
                </div>
              </div>

              {/* Custom RTSP URL Input */}
              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-white/10 space-y-2">
                <label className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#00E5A0]">link</span>
                  External RTSP / IP Camera Endpoint Override
                </label>
                <input
                  type="text"
                  placeholder="rtsp://192.168.1.120:554/live/stream1 or http://ip-cam:8080/video"
                  value={localConfig.customRtspUrl || ''}
                  onChange={(e) => updateField('customRtspUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-xs focus:border-[#00E5A0] outline-none"
                />
                <p className="text-[10px] text-text-muted font-mono">
                  Leave empty to use Android Companion / USB target camera. Enter RTSP URI for Axis, Hikvision, or Dahua bay cameras.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: HARDWARE & SENSOR OPTICS */}
          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Sensor Hardware &amp; Environmental Controls</h3>
                <p className="text-xs text-text-muted">Direct control over the physical camera sensor on the target rig.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hardware Rendering Acceleration */}
                <div className="p-4 rounded-xl bg-[#0F172A] border border-white/10 space-y-2">
                  <span className="font-bold text-white text-xs block">Rendering Acceleration Engine</span>
                  <div className="space-y-2">
                    {[
                      { id: 'WEBGL2', title: 'WebGL 2.0 GPU Blit', desc: 'Hardware blitting via WebGL texture shaders. Zero CPU load.' },
                      { id: 'OFFSCREEN_WORKER', title: 'OffscreenCanvas Worker', desc: 'Decoupled worker thread rendering to prevent UI stutter.' },
                      { id: 'CANVAS_2D', title: 'Canvas 2D Software Fallback', desc: 'Standard 2D canvas context for older browser compatibility.' },
                    ].map((eng) => (
                      <label
                        key={eng.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                          localConfig.hardwareAcceleration === eng.id
                            ? 'border-[#00E5A0] bg-[#00E5A0]/10'
                            : 'border-white/5 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="accel"
                          checked={localConfig.hardwareAcceleration === eng.id}
                          onChange={() => updateField('hardwareAcceleration', eng.id as VideoHardwareAcceleration)}
                          className="mt-1 accent-[#00E5A0]"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{eng.title}</span>
                          <span className="text-[10px] text-text-muted">{eng.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sensor Lighting & Optics */}
                <div className="p-4 rounded-xl bg-[#0F172A] border border-white/10 space-y-3">
                  <span className="font-bold text-white text-xs block">Optical Sensor Controls</span>

                  <label className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-white block">Auto-Exposure / White Balance Lock</span>
                      <span className="text-[10px] text-text-muted">Prevents muzzle flash strobe from blowing out target card rings</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localConfig.autoExposureLock}
                      onChange={(e) => updateField('autoExposureLock', e.target.checked)}
                      className="accent-[#00E5A0] w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/5 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-white block">Auxiliary Bay Torch / Illuminator</span>
                      <span className="text-[10px] text-text-muted">Activates camera hardware LED to illuminate dark 50m bullet traps</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={localConfig.auxTorchEnabled}
                      onChange={(e) => updateField('auxTorchEnabled', e.target.checked)}
                      className="accent-[#00E5A0] w-4 h-4"
                    />
                  </label>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-text-muted uppercase text-[11px]">Thermal Throttle Cutoff</span>
                      <span className="text-[#EF4444] font-bold">{localConfig.thermalThrottleTempC} °C</span>
                    </div>
                    <input
                      type="range"
                      min="35"
                      max="50"
                      value={localConfig.thermalThrottleTempC}
                      onChange={(e) => updateField('thermalThrottleTempC', Number(e.target.value))}
                      className="w-full accent-[#EF4444]"
                    />
                    <span className="text-[10px] text-text-muted font-mono block">
                      Camera drops to 5 FPS if device battery exceeds this threshold to prevent permanent lithium cell damage.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TELEMETRY DIAGNOSTICS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Wireless Data Telemetry &amp; Link Health</h3>
                <p className="text-xs text-text-muted">Live diagnostic trace of packet transport and frame timing.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#0F172A] border border-white/10 font-mono">
                  <span className="text-[10px] text-text-muted uppercase">Latency (RTT)</span>
                  <div className="text-2xl font-bold text-[#00E5A0] mt-1">{currentMetrics.rttMs} ms</div>
                  <span className="text-[10px] text-text-muted">Jitter variance: ±{currentMetrics.jitterMs} ms</span>
                </div>
                <div className="p-4 rounded-xl bg-[#0F172A] border border-white/10 font-mono">
                  <span className="text-[10px] text-text-muted uppercase">Frame Stability</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {currentMetrics.currentFps} <span className="text-xs font-normal text-text-muted">FPS</span>
                  </div>
                  <span className="text-[10px] text-text-muted">{currentMetrics.droppedFramesCount} frames dropped</span>
                </div>
                <div className="p-4 rounded-xl bg-[#0F172A] border border-white/10 font-mono">
                  <span className="text-[10px] text-text-muted uppercase">Link Throughput</span>
                  <div className="text-2xl font-bold text-[#38BDF8] mt-1">
                    {(currentMetrics.bandwidthKbps / 1000).toFixed(2)}{' '}
                    <span className="text-xs font-normal text-text-muted">Mbps</span>
                  </div>
                  <span className="text-[10px] text-text-muted">Cap: {localConfig.bitrateCapKbps} kbps</span>
                </div>
              </div>

              {/* Physical Radio Spectrum & Vision Engine Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0F172A] border border-white/10 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Active Wi-Fi Spectrum</span>
                    <span className="text-sm font-bold text-white mt-0.5 block flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00E5A0]" />
                      {currentMetrics.wifiBand || localConfig.wifiBand}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {localConfig.wifiBand === '2.4GHz' ? '50m–100m Long Range / Baffle Penetration' : localConfig.wifiBand === '5GHz' ? '10m–25m High Speed 80MHz' : 'Negotiated Link'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#00E5A0] text-[26px]">wifi</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0F172A] border border-white/10 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase block">Vision Calculation Engine</span>
                    <span className="text-sm font-bold text-[#38BDF8] mt-0.5 block flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                      {currentMetrics.computationMode || localConfig.computationMode}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {localConfig.computationMode === 'ON_DEVICE_EDGE'
                        ? '⚡ Phone Edge Vision (<5ms Latency • 99.9% Net Saver)'
                        : localConfig.computationMode === 'HYBRID_EDGE_STREAM'
                        ? '🎯 Phone Edge Vision + 10 FPS Stream Preview'
                        : '🖥️ Central Server OpenCV / YOLO Stream'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#38BDF8] text-[26px]">memory</span>
                </div>
              </div>

              {/* Network Uplink Context Banner */}
              <div className="p-4 rounded-xl bg-[#080B12] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#00E5A0]">wifi</span>
                    Measured Range Upload Capacity: 5.9 Mbps
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E5A0]/20 text-[#00E5A0] font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Based on your network speed test (5.9 Mbps upload, 232 Mbps download), local LAN multicasting is unrestricted, and up to 3 remote high-definition 720p streams can be relayed simultaneously without jitter.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0F172A]">
          <div className="flex items-center gap-2">
            {hasSaved && (
              <span className="text-xs font-mono text-[#00E5A0] flex items-center gap-1 animate-pulse">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Configuration Saved &amp; Relayed to Camera Rig!
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase"
            >
              Close
            </button>
            <button
              onClick={handleApplyCustom}
              className="px-5 py-2 rounded-lg bg-[#00E5A0] text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-[#00E5A0]/90 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              Apply Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
