// apps/web/components/BiometricPulseWidget.tsx
'use client';

// Compact dashboard widget showing shooter readiness at a glance.
// Polls /biometrics/live/:userId every 60s when tab is active.
// Falls back gracefully when no device is registered.

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '../lib/api';
import { syncToBackend, isAvailable } from '../lib/health-connect';
import { useAuth } from '../contexts/auth-context';
import type { BiometricReading, AdvancedBiometricInsights } from '@shooting-platform/shared-types';

function formatTimeAgo(date: Date): string {
  const ms = Date.now() - date.getTime();
  const s  = Math.floor(ms / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function readinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#00E5A0' };
  if (score >= 65) return { label: 'Good',      color: '#F5A623' };
  if (score >= 50) return { label: 'Fair',       color: '#4FC3F7' };
  return               { label: 'Rest',       color: '#FF4D6D' };
}

export function BiometricPulseWidget() {
  const { user } = useAuth();
  const [reading, setReading]         = useState<BiometricReading | null>(null);
  const [readiness, setReadiness]     = useState<number | null>(null);
  const [syncing, setSyncing]         = useState(false);
  const [lastSync, setLastSync]       = useState<Date | null>(null);
  const [hcAvailable, setHcAvailable] = useState(false);
  const [loadError, setLoadError]     = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [live, insights] = await Promise.allSettled([
        apiFetch<BiometricReading | null>(`/biometrics/live/${user.id}`),
        apiFetch<AdvancedBiometricInsights>(`/biometrics/advanced-insights?days=7`),
      ]);

      if (live.status === 'fulfilled' && live.value) setReading(live.value);
      if (insights.status === 'fulfilled' && insights.value) {
        setReadiness((insights.value as any).overallReadiness ?? null);
      }
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, [user]);

  useEffect(() => {
    isAvailable().then(setHcAvailable);
    loadData();

    // Poll every 60s when tab is visible
    const interval = setInterval(() => {
      if (!document.hidden) loadData();
    }, 60_000);

    const onVisibility = () => { if (!document.hidden) loadData(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadData]);

  async function handleSync() {
    setSyncing(true);
    try {
      await syncToBackend({ hoursBack: 24 });
      setLastSync(new Date());
      await loadData();
    } catch {}
    setSyncing(false);
  }

  const hr   = reading?.heartRate ?? null;
  const spo2 = reading?.spo2 ?? null;
  const hrv  = (reading as any)?.hrv ?? null;
  const rr   = reading?.respiratoryRate ?? null;
  const ts   = reading?.timestamp ? new Date(reading.timestamp) : null;
  const isRecent = ts && (Date.now() - ts.getTime()) < 10 * 60 * 1000;

  // No data at all — show CTA
  if (!reading && !loadError) {
    return (
      <div
        className="card p-5"
        style={{ border: '1px solid rgba(245,166,35,0.15)', background: 'rgba(245,166,35,0.03)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <PulseIcon />
            <p className="font-display font-bold text-sm tracking-wide" style={{ color: '#F5A623' }}>
              MARKSMAN PULSE
            </p>
          </div>
          <span
            className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ background: 'rgba(74,85,104,0.2)', color: 'var(--text-muted)' }}
          >
            No Data
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          {hcAvailable
            ? 'Sync your Health Connect data to see readiness and vitals here.'
            : 'Connect a device in Settings to track your biometrics.'}
        </p>
        <div className="flex items-center gap-2">
          {hcAvailable ? (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-primary text-xs px-3 py-1.5"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          ) : null}
          <Link
            href="/settings"
            className="text-xs px-3 py-1.5 rounded-lg font-display font-semibold transition-all"
            style={{
              color: '#F5A623',
              background: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.2)',
            }}
          >
            {hcAvailable ? 'Manage Devices' : 'Connect Device'}
          </Link>
        </div>
      </div>
    );
  }

  const rScore = readiness ?? 0;
  const { label: rLabel, color: rColor } = readinessLabel(rScore);

  return (
    <div
      className="card p-5"
      style={{ border: '1px solid rgba(245,166,35,0.15)', background: 'rgba(245,166,35,0.02)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <PulseIcon />
          <p className="font-display font-bold text-sm tracking-wide" style={{ color: '#F5A623' }}>
            MARKSMAN PULSE
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: isRecent ? '#00E5A0' : '#4A5568',
              boxShadow: isRecent ? '0 0 5px rgba(0,229,160,0.7)' : 'none',
            }}
          />
          <span
            className="text-[10px] font-display font-bold uppercase tracking-wider"
            style={{ color: isRecent ? '#00E5A0' : '#4A5568' }}
          >
            {isRecent ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Three primary metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricTile
          value={readiness != null ? String(rScore) : '--'}
          unit=""
          label="Readiness"
          color={rColor}
          badge={readiness != null ? rLabel : undefined}
        />
        <MetricTile
          value={hr != null ? String(hr) : '--'}
          unit="bpm"
          label="Heart Rate"
          color="#FF4D6D"
        />
        <MetricTile
          value={hrv != null ? String(hrv) : '--'}
          unit="ms"
          label="HRV"
          color="#F5A623"
        />
      </div>

      {/* Readiness bar */}
      {readiness != null && (
        <div className="mb-4">
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${rScore}%`,
                background: `linear-gradient(90deg, ${rColor}88 0%, ${rColor} 100%)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Secondary metrics row */}
      <div className="flex items-center gap-4 mb-4">
        {spo2 != null && (
          <div className="flex items-baseline gap-1">
            <span className="font-data text-sm font-bold" style={{ color: '#4FC3F7' }}>{spo2}%</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>SpO₂</span>
          </div>
        )}
        {rr != null && (
          <div className="flex items-baseline gap-1">
            <span className="font-data text-sm font-bold" style={{ color: '#00E5A0' }}>{rr}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/min Resp</span>
          </div>
        )}
      </div>

      {/* Footer: sync info + button */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {lastSync
            ? `Synced ${formatTimeAgo(lastSync)}`
            : ts
              ? `Last reading ${formatTimeAgo(ts)}`
              : 'No reading yet'}
        </p>
        {hcAvailable && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-display font-semibold transition-all"
            style={{
              background: syncing ? 'rgba(245,166,35,0.06)' : 'rgba(245,166,35,0.1)',
              color: '#F5A623',
              border: '1px solid rgba(245,166,35,0.2)',
            }}
          >
            {syncing ? (
              <>
                <span className="w-3 h-3 border border-t-[#F5A623] border-[rgba(245,166,35,0.2)] rounded-full animate-spin" />
                Syncing
              </>
            ) : (
              <>
                <SyncIcon />
                Sync
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricTile({
  value, unit, label, color, badge,
}: {
  value: string;
  unit: string;
  label: string;
  color: string;
  badge?: string;
}) {
  return (
    <div
      className="flex flex-col items-center py-3 px-2 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.025)' }}
    >
      <div className="flex items-baseline gap-0.5 mb-0.5">
        <span className="font-data font-bold text-xl leading-none" style={{ color }}>
          {value}
        </span>
        {unit && (
          <span className="text-[10px] font-display" style={{ color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>
      {badge ? (
        <span
          className="text-[9px] font-display font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
          style={{ background: `${color}18`, color }}
        >
          {badge}
        </span>
      ) : (
        <span className="text-[10px] font-display uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      )}
      <span className="text-[9px] font-display uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        {badge ? label : ''}
      </span>
    </div>
  );
}

function PulseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,12 6,12 8,5 10,19 12,10 14,14 16,12 22,12" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,4 1,10 7,10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  );
}
