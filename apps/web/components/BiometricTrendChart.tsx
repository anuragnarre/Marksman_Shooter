// apps/web/components/BiometricTrendChart.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line,
  ComposedChart,
} from 'recharts';
import { apiFetch } from '../lib/api';
import type { BiometricTrendPoint } from '@shooting-platform/shared-types';

interface Props {
  days?: number;
  height?: number;
}

export function BiometricTrendChart({ days = 30, height = 280 }: Props) {
  const [data, setData] = useState<BiometricTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<BiometricTrendPoint[]>(`/biometrics/trends?days=${days}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="h-[280px] flex items-center justify-center" style={{ color: '#4A5568' }}>
        <span className="text-sm font-display">Loading trends...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center" style={{ color: '#4A5568' }}>
        <span className="text-sm font-display">No trend data available</span>
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <defs>
          <linearGradient id="hrBandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF4D6D" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#FF4D6D" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4FC3F7" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#4A5568', fontSize: 10 }}
          stroke="rgba(255,255,255,0.06)"
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
          domain={[90, 100]}
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

        {/* HR band (min to max) */}
        <Area
          yAxisId="hr"
          type="monotone"
          dataKey="maxHeartRate"
          stroke="none"
          fill="url(#hrBandGrad)"
          name="Max HR"
        />
        <Area
          yAxisId="hr"
          type="monotone"
          dataKey="minHeartRate"
          stroke="none"
          fill="rgba(14,17,24,1)"
          name="Min HR"
        />

        {/* Avg HR line */}
        <Line
          yAxisId="hr"
          type="monotone"
          dataKey="avgHeartRate"
          stroke="#FF4D6D"
          strokeWidth={2}
          dot={{ fill: '#FF4D6D', r: 3 }}
          name="Avg HR"
        />

        {/* SpO2 line */}
        <Line
          yAxisId="spo2"
          type="monotone"
          dataKey="avgSpo2"
          stroke="#4FC3F7"
          strokeWidth={2}
          dot={{ fill: '#4FC3F7', r: 3 }}
          name="Avg SpO2"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
