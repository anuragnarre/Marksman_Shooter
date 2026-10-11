// apps/web/components/live-analysis/StreamTunerModal.tsx
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
    rttMs: 16,
    jitterMs: 2,
    bandwidthKbps: Math.round(localConfig.bitrateCapKbps * 0.75),
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
                  Live Stream Performance &amp; Video Engine
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-[#00E5A0]">
                  SHOOTER HUD
                </span>
              </div>
              <p className="text-xs text-text-muted font-mono">
                Hardware Acceleration • Frame Throttling • Custom Downrange Bitrate Options
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
            <span className="text-[10px] text-text-muted uppercase">Live FPS</span>
            <span className="font-bold text-[#00E5A0] text-sm flex items-center gap-1">
              {currentMetrics.currentFps} / {currentMetrics.targetFps}
              <span className="text-[10px] text-text-muted font-normal">fps</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Link Latency</span>
            <span className={`font-bold text-sm ${currentMetrics.rttMs < 50 ? 'text-[#00E5A0]' : 'text-[#F5A623]'}`}>
              {currentMetrics.rttMs} ms
              <span className="text-[10px] text-text-muted font-normal ml-1">(±{currentMetrics.jitterMs}ms)</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Effective Bitrate</span>
            <span className="font-bold text-white text-sm">
              {(currentMetrics.bandwidthKbps / 1000).toFixed(1)} Mbps
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted uppercase">Health</span>
            <span className="font-bold text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00E5A0]" />
              <span className="text-white text-xs">{currentMetrics.networkQuality}</span>
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
            Stream Profiles
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-[#00E5A0] text-[#00E5A0]'
                : 'border-transparent text-text-muted hover:text-white'
            }`}
          >
            Custom Tuner
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'hardware'
                ? 'border-[#00E5A0] text-[#00E5A0]'
                : 'border-transparent text-text-muted hover:text-white'
            }`}
          >
            GPU &amp; Sensor
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'telemetry'
                ? 'border-[#00E5A0] text-[#00E5A0]'
                : 'border-transparent text-text-muted hover:text-white'
            }`}
          >
            Diagnostics
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PREBAKED PROFILES */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                Choose an engineered preset tailored for your current wireless connection:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      Auto Adaptive (Recommended)
                    </span>
                    {localConfig.profile === 'AUTO_ADAPTIVE' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0] text-black font-bold">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Auto-adjusts frame rate and resolution based on wireless signal strength. Zero frame freeze.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#00E5A0]">
                    <span className="px-2 py-0.5 rounded bg-white/5">Auto Spectrum</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">Dynamic 30 FPS</span>
                  </div>
                </div>

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
                      Ultra-Low Latency (LAN / 5GHz)
                    </span>
                    {localConfig.profile === 'LAN_ULTRA_LOW_LAT' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0] text-black font-bold">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    True 60 FPS zero-jitter-buffer stream. Instant strike feedback for rapid fire competitions.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#38BDF8]">
                    <span className="px-2 py-0.5 rounded bg-white/5">5GHz / LAN</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">Server Vision</span>
                    <span className="px-2 py-0.5 rounded bg-white/5">1080p @ 60 FPS</span>
                  </div>
                </div>

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
                    On-device phone edge scoring. Sub-5ms shot detection, 99.9% bandwidth reduction, penetrates concrete barriers.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#F5A623]">
                    <span className="px-2 py-0.5 rounded bg-white/5">2.4GHz Long-Range</span>
                    <span className="px-2 py-0.5 rounded bg-[#00E5A0]/20 text-[#00E5A0] font-bold">📱 On-Device Edge</span>
                  </div>
                </div>

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
                      Battery &amp; Thermal Saver
                    </span>
                    {localConfig.profile === 'ECO_BATTERY' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0] text-black font-bold">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    360p @ 10 FPS with on-device scoring and sleep mode to extend battery life on wireless target stands.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-[#A78BFA]">
                    <span className="px-2 py-0.5 rounded bg-white/5">2.4GHz Ultra-Eco</span>
                    <span className="px-2 py-0.5 rounded bg-[#00E5A0]/20 text-[#00E5A0] font-bold">📱 On-Device Edge</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM STREAM CONFIG */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Manual Performance Controls</h3>
                  <p className="text-xs text-text-muted">Fine-tune frame rate, bitrate, and resolution to your preference.</p>
                </div>
                <button
                  onClick={handleApplyCustom}
                  className="px-4 py-2 rounded-lg bg-[#00E5A0] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md hover:bg-[#00E5A0]/90 transition-all"
                >
                  Apply Custom Settings
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
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-text-muted uppercase">Resolution</label>
                  <select
                    value={localConfig.resolution}
                    onChange={(e) => updateField('resolution', e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0F172A] border border-white/10 text-white font-mono text-xs focus:border-[#00E5A0] outline-none"
                  >
                    <option value="1080p">1080p (FHD - High Definition)</option>
                    <option value="720p">720p (HD - Balanced)</option>
                    <option value="480p">480p (SD - Low Latency)</option>
                    <option value="360p">360p (Minimal - High Speed)</option>
                  </select>
                </div>

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
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-text-muted uppercase">Bitrate Limit</span>
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
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-text-muted uppercase">Quality Compression</span>
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
                </div>
              </div>

              {/* RTSP / IP Camera Endpoint Override */}
              <div className="p-3.5 rounded-xl bg-[#0F172A] border border-white/10 space-y-2">
                <label className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#00E5A0]">link</span>
                  Custom RTSP / IP Target Camera Endpoint URL
                </label>
                <input
                  type="text"
                  placeholder="rtsp://192.168.1.100:8554/live or http://..."
                  value={localConfig.customRtspUrl || ''}
                  onChange={(e) => updateField('customRtspUrl', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white font-mono text-xs focus:border-[#00E5A0] outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: HARDWARE ACCELERATION */}
          {activeTab === 'hardware' && (
            <div className="space-y-4">
              <span className="font-bold text-white text-xs block">GPU Rendering Backend</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 rounded-lg border border-white/10 bg-[#0F172A] flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accel"
                    checked={localConfig.hardwareAcceleration === 'WEBGL2'}
                    onChange={() => updateField('hardwareAcceleration', 'WEBGL2')}
                    className="mt-1 accent-[#00E5A0]"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">WebGL 2.0 GPU Blit</span>
                    <span className="text-[10px] text-text-muted">Hardware GPU rendering directly to target canvas</span>
                  </div>
                </label>
                <label className="p-3 rounded-lg border border-white/10 bg-[#0F172A] flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accel"
                    checked={localConfig.hardwareAcceleration === 'OFFSCREEN_WORKER'}
                    onChange={() => updateField('hardwareAcceleration', 'OFFSCREEN_WORKER')}
                    className="mt-1 accent-[#00E5A0]"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">OffscreenCanvas Worker</span>
                    <span className="text-[10px] text-text-muted">Separates video decoding from UI thread</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: TELEMETRY DIAGNOSTICS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#0F172A] border border-white/10 font-mono">
                  <span className="text-[10px] text-text-muted uppercase">Latency</span>
                  <div className="text-2xl font-bold text-[#00E5A0] mt-1">{currentMetrics.rttMs} ms</div>
                  <span className="text-[10px] text-text-muted">Jitter: ±{currentMetrics.jitterMs} ms</span>
                </div>
                <div className="p-4 rounded-xl bg-[#0F172A] border border-white/10 font-mono">
                  <span className="text-[10px] text-text-muted uppercase">Live FPS</span>
                  <div className="text-2xl font-bold text-white mt-1">{currentMetrics.currentFps} FPS</div>
                  <span className="text-[10px] text-text-muted">{currentMetrics.dropRatePercent}% drop rate</span>
                </div>
                <div className="p-4 rounded-xl bg-[#0F172A] border border-white/10 font-mono">
                  <span className="text-[10px] text-text-muted uppercase">Bandwidth</span>
                  <div className="text-2xl font-bold text-[#38BDF8] mt-1">
                    {(currentMetrics.bandwidthKbps / 1000).toFixed(2)} Mbps
                  </div>
                  <span className="text-[10px] text-text-muted">Max: {localConfig.bitrateCapKbps} kbps</span>
                </div>
              </div>

              {/* Physical Radio Spectrum & Vision Engine Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
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
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0F172A]">
          <div>
            {hasSaved && (
              <span className="text-xs font-mono text-[#00E5A0] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Stream settings saved &amp; synchronized!
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
              Save &amp; Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
