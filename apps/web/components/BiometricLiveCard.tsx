// apps/web/components/BiometricLiveCard.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { apiFetch } from '../lib/api';
import { syncToBackend, isAvailable as isHcAvailable } from '../lib/health-connect';
import { useAuth } from '../contexts/auth-context';
import type { BiometricReading, BiometricUpdateEvent } from '@shooting-platform/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function BiometricLiveCard({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [reading, setReading]     = useState<BiometricReading | null>(null);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [lastSync, setLastSync]   = useState<Date | null>(null);
  const [hcAvail, setHcAvail]     = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    isHcAvailable().then(setHcAvail);
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await syncToBackend({ hoursBack: 24 });
      setLastSync(new Date());
      if (user) {
        const r = await apiFetch<BiometricReading | null>(`/biometrics/live/${user.id}`).catch(() => null);
        if (r) setReading(r);
      }
    } catch {}
    setSyncing(false);
  }

  useEffect(() => {
    if (!user) return;

    // Fetch latest reading
    apiFetch<BiometricReading | null>(`/biometrics/live/${user.id}`)
      .then(r => { if (r) setReading(r); })
      .catch(() => {});

    // Connect WebSocket
    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('joinUserRoom', user.id);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('biometric.update', (event: BiometricUpdateEvent) => {
      if (event.userId === user.id) {
        setReading(event.reading);
      }
    });

    return () => { socket.disconnect(); };
  }, [user]);

  const hr       = reading?.heartRate ?? null;
  const spo2     = reading?.spo2 ?? null;
  const rr       = reading?.respiratoryRate ?? null;
  const hrv      = (reading as any)?.hrv ?? null;
  const lastSeen = reading?.timestamp ? new Date(reading.timestamp) : null;
  const isRecent = lastSeen && (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000;

  function fmtAgo(d: Date) {
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  if (compact) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <HeartIcon animate={!!isRecent} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-display font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}>
              Live Vitals
            </p>
            {hr !== null ? (
              <div className="flex items-baseline gap-3 mt-0.5">
                <span className="font-mono text-lg font-bold" style={{ color: '#FF4D6D' }}>
                  {hr} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>bpm</span>
                </span>
                {spo2 !== null && (
                  <span className="font-mono text-lg font-bold" style={{ color: '#4FC3F7' }}>
                    {spo2}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>%</span>
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No device connected</p>
                <Link
                  href="/settings"
                  className="text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded transition-all"
                  style={{ color: '#F5A623', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.15)' }}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
          <StatusDot active={!!isRecent} />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-base text-text-primary">Live Monitor</h3>
        <StatusDot active={!!isRecent} />
      </div>

      {/* Primary metrics: HR + SpO2 + RR */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Heart Rate */}
        <div className="flex flex-col items-center">
          <HeartIcon animate={!!isRecent} large />
          <span className="font-mono text-3xl font-bold mt-1" style={{ color: '#FF4D6D' }}>
            {hr ?? '--'}
          </span>
          <span className="text-[10px] font-display font-bold uppercase tracking-wider mt-0.5"
            style={{ color: 'var(--text-secondary)' }}>
            BPM
          </span>
        </div>

        {/* SpO2 */}
        <div className="flex flex-col items-center">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(79,195,247,0.12)" strokeWidth="4" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke="#4FC3F7" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${((spo2 ?? 0) / 100) * 175.9} 175.9`}
                transform="rotate(-90 32 32)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold"
              style={{ color: '#4FC3F7' }}>
              {spo2 ?? '--'}
            </span>
          </div>
          <span className="text-[10px] font-display font-bold uppercase tracking-wider mt-0.5"
            style={{ color: 'var(--text-secondary)' }}>
            SpO₂ %
          </span>
        </div>

        {/* Respiratory Rate */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00E5A0" strokeWidth="1.75" strokeLinecap="round">
              <path d="M3 12h3l3-8 4 16 3-8h5" />
            </svg>
          </div>
          <span className="font-mono text-2xl font-bold mt-1" style={{ color: '#00E5A0' }}>
            {rr ?? '--'}
          </span>
          <span className="text-[10px] font-display font-bold uppercase tracking-wider mt-0.5"
            style={{ color: 'var(--text-secondary)' }}>
            /min
          </span>
        </div>
      </div>

      {/* Secondary: HRV + Stress indicator */}
      {(hrv !== null || reading) && (
        <div className="flex items-center gap-6 px-4 py-3 rounded-xl mb-4"
          style={{ background: 'rgba(255,255,255,0.025)' }}>
          {hrv !== null && (
            <div>
              <span className="font-mono text-lg font-bold" style={{ color: '#F5A623' }}>{hrv}</span>
              <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>ms HRV</span>
            </div>
          )}
          {hrv !== null && (
            <div>
              <span className="text-xs font-display font-semibold" style={{ color: hrv > 50 ? '#00E5A0' : hrv > 30 ? '#F5A623' : '#FF4D6D' }}>
                {hrv > 50 ? 'Low Stress' : hrv > 30 ? 'Moderate' : 'High Stress'}
              </span>
              <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>readiness</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {lastSync
            ? `Synced ${fmtAgo(lastSync)}`
            : lastSeen
              ? `Marksman Pulse · ${fmtAgo(lastSeen)}`
              : 'No device connected'}
          {!lastSeen && !lastSync && (
            <Link
              href="/settings"
              className="ml-2 font-display font-semibold text-[10px] px-2 py-0.5 rounded transition-all"
              style={{ color: '#F5A623', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}
            >
              Register Device
            </Link>
          )}
        </p>
        {hcAvail && (
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
              'Sync Now'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function HeartIcon({ animate, large }: { animate: boolean; large?: boolean }) {
  const size = large ? 40 : 20;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {animate && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'rgba(255,77,109,0.2)',
            animation: 'pulseRing 1.5s ease-out infinite',
          }}
        />
      )}
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="#FF4D6D">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{
          background: active ? '#00E5A0' : '#4A5568',
          boxShadow: active ? '0 0 6px rgba(0,229,160,0.7)' : 'none',
        }}
      />
      <span className="text-[10px] font-display font-bold uppercase tracking-wider"
        style={{ color: active ? '#00E5A0' : '#4A5568' }}>
        {active ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}
