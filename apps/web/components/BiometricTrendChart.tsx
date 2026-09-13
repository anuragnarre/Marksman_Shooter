// apps/web/components/BiometricTrendChart.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line,
  ComposedChart, ReferenceLine,
} from 'recharts';
import { io, Socket } from 'socket.io-client';
import { apiFetch } from '../lib/api';
import { useAuth } from '../contexts/auth-context';
import type { BiometricTrendPoint, BiometricReading, BiometricUpdateEvent } from '@shooting-platform/shared-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type TrendMode = 'live' | '1h' | '1d' | '7d' | '30d' | '90d';

interface Props {
  mode?: TrendMode;
  height?: number;
}

interface ReadingPoint {
  time: string;
  heartRate: number | null;
  spo2: number | null;
  timestamp: number;
}

export function BiometricTrendChart({ mode = '30d', height = 280 }: Props) {
  const isRealtime = mode === 'live' || mode === '1h' || mode === '1d';

  if (isRealtime) {
    return <RealtimeChart mode={mode} height={height} />;
  }

  return <AggregateChart days={mode === '7d' ? 7 : mode === '90d' ? 90 : 30} height={height} />;
}

// ── Aggregate chart (7d / 30d / 90d) ─────────────────────────────────────────

function AggregateChart({ days, height }: { days: number; height: number }) {
  const [data, setData] = useState<BiometricTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<BiometricTrendPoint[]>(`/biometrics/trends?days=${days}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return <ChartPlaceholder height={height} text="Loading trends..." />;
  }

  if (data.length === 0) {
    return <ChartPlaceholder height={200} text="No trend data available" />;
  }

  const chartData = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="hrBandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF4D6D" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#FF4D6D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fill: '#4A5568', fontSize: 10 }} stroke="rgba(255,255,255,0.06)" />
        <YAxis yAxisId="hr" tick={{ fill: '#FF4D6D', fontSize: 10 }} stroke="rgba(255,255,255,0.06)" domain={[40, 'auto']} />
        <YAxis yAxisId="spo2" orientation="right" tick={{ fill: '#4FC3F7', fontSize: 10 }} stroke="rgba(255,255,255,0.06)" domain={[90, 100]} />
        <Tooltip
          contentStyle={{ background: 'rgba(14,17,24,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: 'var(--text-secondary)' }}
        />
        <Area yAxisId="hr" type="monotone" dataKey="maxHeartRate" stroke="none" fill="url(#hrBandGrad)" name="Max HR" />
        <Area yAxisId="hr" type="monotone" dataKey="minHeartRate" stroke="none" fill="rgba(14,17,24,1)" name="Min HR" />
        <Line yAxisId="hr" type="monotone" dataKey="avgHeartRate" stroke="#FF4D6D" strokeWidth={2} dot={{ fill: '#FF4D6D', r: 3 }} name="Avg HR" />
        <Line yAxisId="spo2" type="monotone" dataKey="avgSpo2" stroke="#4FC3F7" strokeWidth={2} dot={{ fill: '#4FC3F7', r: 3 }} name="Avg SpO2" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Realtime / recent chart (live / 1h / 1d) ─────────────────────────────────

function RealtimeChart({ mode, height }: { mode: 'live' | '1h' | '1d'; height: number }) {
  const { user } = useAuth();
  const [data, setData] = useState<ReadingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // Fetch initial data
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const now = new Date();
    let from: Date;
    let limit: number;

    if (mode === 'live') {
      from = new Date(now.getTime() - 10 * 60 * 1000); // last 10 min
      limit = 300;
    } else if (mode === '1h') {
      from = new Date(now.getTime() - 60 * 60 * 1000);
      limit = 500;
    } else {
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      limit = 500;
    }

    apiFetch<BiometricReading[]>(
      `/biometrics/readings?from=${from.toISOString()}&to=${now.toISOString()}&limit=${limit}`,
    )
      .then(readings => {
        const points = readings
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .map(r => toPoint(r));
        setData(points);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mode, user]);

  // WebSocket for live mode
  useEffect(() => {
    if (mode !== 'live' || !user) return;

    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinUserRoom', user.id);
    });

    socket.on('biometric.update', (event: BiometricUpdateEvent) => {
      if (event.userId === user.id) {
        setData(prev => {
          const point = toPoint(event.reading);
          const cutoff = Date.now() - 10 * 60 * 1000;
          const filtered = [...prev, point].filter(p => p.timestamp > cutoff);
          return filtered.slice(-300);
        });
      }
    });

    return () => { socket.disconnect(); };
  }, [mode, user]);

  if (loading) {
    return <ChartPlaceholder height={height} text={mode === 'live' ? 'Connecting to live feed...' : 'Loading readings...'} />;
  }

  if (data.length === 0) {
    return (
      <ChartPlaceholder height={200} text={
        mode === 'live'
          ? 'No live data — make sure your sensor is active'
          : `No readings in the last ${mode === '1h' ? 'hour' : '24 hours'}`
      } />
    );
  }

  const formatTime = (time: string) => {
    if (mode === '1d') {
      return time; // already HH:MM
    }
    return time; // HH:MM:SS for live/1h
  };

  return (
    <div>
      {mode === 'live' && (
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full" style={{ background: '#00E5A0', boxShadow: '0 0 6px rgba(0,229,160,0.7)' }} />
          <span className="text-[10px] font-display font-bold uppercase tracking-wider" style={{ color: '#00E5A0' }}>
            Live — {data.length} readings
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="hrLiveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF4D6D" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF4D6D" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="spo2LiveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4FC3F7" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="time"
            tickFormatter={formatTime}
            tick={{ fill: '#4A5568', fontSize: 9 }}
            stroke="rgba(255,255,255,0.06)"
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="hr"
            tick={{ fill: '#FF4D6D', fontSize: 10 }}
            stroke="rgba(255,255,255,0.06)"
            domain={[40, 'auto']}
          />
          <YAxis
            yAxisId="spo2"
            orientation="right"
            tick={{ fill: '#4FC3F7', fontSize: 10 }}
            stroke="rgba(255,255,255,0.06)"
            domain={[88, 100]}
          />
          <Tooltip
            contentStyle={{ background: 'rgba(14,17,24,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: 'var(--text-secondary)' }}
          />
          {/* Optimal HR zone */}
          <ReferenceLine yAxisId="hr" y={60} stroke="rgba(0,229,160,0.15)" strokeDasharray="4 4" />
          <ReferenceLine yAxisId="hr" y={80} stroke="rgba(0,229,160,0.15)" strokeDasharray="4 4" />

          <Area
            yAxisId="hr"
            type="monotone"
            dataKey="heartRate"
            stroke="#FF4D6D"
            strokeWidth={mode === 'live' ? 2 : 1.5}
            fill="url(#hrLiveGrad)"
            dot={mode !== 'live' && data.length < 60 ? { fill: '#FF4D6D', r: 2 } : false}
            name="Heart Rate"
            isAnimationActive={mode !== 'live'}
            connectNulls
          />
          <Area
            yAxisId="spo2"
            type="monotone"
            dataKey="spo2"
            stroke="#4FC3F7"
            strokeWidth={mode === 'live' ? 2 : 1.5}
            fill="url(#spo2LiveGrad)"
            dot={mode !== 'live' && data.length < 60 ? { fill: '#4FC3F7', r: 2 } : false}
            name="SpO2"
            isAnimationActive={mode !== 'live'}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toPoint(r: BiometricReading): ReadingPoint {
  const ts = new Date(r.timestamp);
  return {
    time: ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    heartRate: r.heartRate ?? null,
    spo2: r.spo2 ?? null,
    timestamp: ts.getTime(),
  };
}

function ChartPlaceholder({ height, text }: { height: number; text: string }) {
  return (
    <div className="flex items-center justify-center" style={{ height, color: 'var(--text-muted)' }}>
      <span className="text-sm font-display">{text}</span>
    </div>
  );
}
