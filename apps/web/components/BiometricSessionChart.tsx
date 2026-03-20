// apps/web/components/BiometricSessionChart.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  ComposedChart, Area, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { apiFetch } from '../lib/api';
import type { BiometricReading, Shot } from '@shooting-platform/shared-types';

interface Props {
  sessionId: string;
  shots?: Shot[];
  height?: number;
}

interface ChartPoint {
  index: number;
  time: string;
  heartRate?: number;
  spo2?: number;
  shotScore?: number;
}

export function BiometricSessionChart({ sessionId, shots = [], height = 280 }: Props) {
  const [readings, setReadings] = useState<BiometricReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<BiometricReading[]>(`/biometrics/readings?sessionId=${sessionId}&limit=500`)
      .then(setReadings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="h-[280px] flex items-center justify-center" style={{ color: '#4A5568' }}>
        <span className="text-sm font-display">Loading biometric data...</span>
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center" style={{ color: '#4A5568' }}>
        <span className="text-sm font-display">No biometric readings for this session</span>
      </div>
    );
  }

  // Build time-aligned chart data
  const data: ChartPoint[] = readings.map((r, i) => {
    const time = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Find closest shot by timestamp
    let shotScore: number | undefined;
    if (shots.length > 0) {
      const rTime = new Date(r.timestamp).getTime();
      const closest = shots.reduce((prev, curr) => {
        const prevDiff = Math.abs(new Date(prev.timestamp).getTime() - rTime);
        const currDiff = Math.abs(new Date(curr.timestamp).getTime() - rTime);
        return currDiff < prevDiff ? curr : prev;
      });
      if (Math.abs(new Date(closest.timestamp).getTime() - rTime) < 60000) {
        shotScore = closest.score;
      }
    }

    return {
      index: i,
      time,
      heartRate: r.heartRate ?? undefined,
      spo2: r.spo2 ?? undefined,
      shotScore,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <defs>
          <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF4D6D" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#FF4D6D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#4A5568', fontSize: 10 }}
          stroke="rgba(255,255,255,0.06)"
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="hr"
          tick={{ fill: '#FF4D6D', fontSize: 10 }}
          stroke="rgba(255,255,255,0.06)"
          domain={[40, 'auto']}
          label={{ value: 'HR', angle: -90, position: 'insideLeft', fill: '#FF4D6D', fontSize: 10 }}
        />
        <YAxis
          yAxisId="score"
          orientation="right"
          tick={{ fill: '#F5A623', fontSize: 10 }}
          stroke="rgba(255,255,255,0.06)"
          domain={[7, 11]}
          label={{ value: 'Score', angle: 90, position: 'insideRight', fill: '#F5A623', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(14,17,24,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: '#8892A4' }}
        />

        {/* Optimal zone */}
        <ReferenceLine yAxisId="hr" y={80} stroke="rgba(0,229,160,0.2)" strokeDasharray="4 4" />
        <ReferenceLine yAxisId="hr" y={60} stroke="rgba(0,229,160,0.2)" strokeDasharray="4 4" />

        {/* HR area */}
        <Area
          yAxisId="hr"
          type="monotone"
          dataKey="heartRate"
          stroke="#FF4D6D"
          fill="url(#hrGradient)"
          strokeWidth={2}
          dot={false}
          name="Heart Rate"
        />

        {/* Shot scores as dots */}
        <Scatter
          yAxisId="score"
          dataKey="shotScore"
          fill="#F5A623"
          name="Shot Score"
          shape="circle"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
