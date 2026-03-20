// apps/web/components/BiometricLiveCard.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/auth-context';
import type { BiometricReading, BiometricUpdateEvent } from '@shooting-platform/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function BiometricLiveCard({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [reading, setReading] = useState<BiometricReading | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

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

  const hr = reading?.heartRate ?? null;
  const spo2 = reading?.spo2 ?? null;
  const lastSeen = reading?.timestamp
    ? new Date(reading.timestamp)
    : null;
  const isRecent = lastSeen && (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000;

  if (compact) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <HeartIcon animate={!!isRecent} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-display font-bold uppercase tracking-wider"
              style={{ color: '#8892A4' }}>
              Live Vitals
            </p>
            {hr !== null ? (
              <div className="flex items-baseline gap-3 mt-0.5">
                <span className="font-mono text-lg font-bold" style={{ color: '#FF4D6D' }}>
                  {hr} <span className="text-xs font-normal" style={{ color: '#4A5568' }}>bpm</span>
                </span>
                {spo2 !== null && (
                  <span className="font-mono text-lg font-bold" style={{ color: '#4FC3F7' }}>
                    {spo2}<span className="text-xs font-normal" style={{ color: '#4A5568' }}>%</span>
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs" style={{ color: '#4A5568' }}>No device connected</p>
                <Link
                  href="/settings/devices"
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-base text-[#F0F4FF]">Live Monitor</h3>
        <StatusDot active={!!isRecent} />
      </div>

      <div className="flex items-center gap-8">
        {/* Heart Rate */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <HeartIcon animate={!!isRecent} large />
          </div>
          <span className="font-mono text-3xl font-bold" style={{ color: '#FF4D6D' }}>
            {hr ?? '--'}
          </span>
          <span className="text-[10px] font-display font-bold uppercase tracking-wider mt-1"
            style={{ color: '#8892A4' }}>
            BPM
          </span>
        </div>

        {/* SpO2 */}
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-2">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(79,195,247,0.15)" strokeWidth="4" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke="#4FC3F7" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${((spo2 ?? 0) / 100) * 175.9} 175.9`}
                transform="rotate(-90 32 32)"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold"
              style={{ color: '#4FC3F7' }}>
              {spo2 ?? '--'}
            </span>
          </div>
          <span className="text-[10px] font-display font-bold uppercase tracking-wider"
            style={{ color: '#8892A4' }}>
            SpO2 %
          </span>
        </div>
      </div>

      {lastSeen ? (
        <p className="text-[10px] mt-4" style={{ color: '#4A5568' }}>
          Last reading: {lastSeen.toLocaleTimeString()}
        </p>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <p className="text-xs" style={{ color: '#4A5568' }}>No device connected.</p>
          <Link
            href="/settings/devices"
            className="text-xs font-display font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ color: '#F5A623', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}
          >
            Register Device
          </Link>
        </div>
      )}
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
