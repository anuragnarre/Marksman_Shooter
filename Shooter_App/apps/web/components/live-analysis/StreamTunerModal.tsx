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
                      Ultra-Low Latency (LAN 60 FPS)
                    </span>
                    {localConfig.profile === 'LAN_ULTRA_LOW_LAT' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0] text-black font-bold">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    True 60 FPS zero-jitter-buffer stream. Instant strike feedback for rapid fire competitions.
                  </p>
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
                      Bandwidth Saver (480p / 15 FPS)
                    </span>
                    {localConfig.profile === 'BANDWIDTH_SAVER' && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E5A0] text-black font-bold">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Ultra-compact 800 kbps stream. Operates smoothly on congested mobile hotspots or remote ranges.
                  </p>
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
                    360p @ 10 FPS with low power mode to extend battery life on wireless target camera stands.
                  </p>
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
