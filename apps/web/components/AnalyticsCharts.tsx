// apps/web/components/AnalyticsCharts.tsx
'use client';

// DESIGN NOTE: All charts use a dark theme matching the rest of the dashboard.
// The score trend chart has an amber gradient fill below the line (like a racing
// telemetry readout). Custom frosted-glass tooltips. Recharts built-in animation
// draws lines left-to-right on mount for a satisfying data-reveal effect.

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import type { Shot } from '@shooting-platform/shared-types';

// ── Shared chart theme ────────────────────────────────────────────────────────

const CHART_MARGIN = { top: 8, right: 8, bottom: 4, left: -20 };

const AXIS_STYLE = {
  tick: { fill: '#4A5568', fontSize: 11, fontFamily: 'var(--font-jetbrains)' },
  axisLine: { stroke: '#1E2433' },
  tickLine: { stroke: '#1E2433' },
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  labelPrefix = 'Shot',
  valueLabel = 'Score',
  valueColor = '#F5A623',
  decimals = 2,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string | number;
  labelPrefix?: string;
  valueLabel?: string;
  valueColor?: string;
  decimals?: number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="tooltip-glass px-3 py-2 min-w-[100px]">
      <p className="text-[10px] font-display uppercase tracking-widest text-[#4A5568] mb-1">
        {labelPrefix} {label}
      </p>
      <p
        className="score-value text-base font-semibold"
        style={{ color: valueColor }}
      >
        {Number(payload[0].value).toFixed(decimals)}
      </p>
      <p className="text-[10px] text-[#8892A4] mt-0.5">{valueLabel}</p>
    </div>
  );
}

// ── 1. Score Over Time ────────────────────────────────────────────────────────

interface ScoreOverTimeProps {
  shots: Shot[];
  average?: number;
}

export function ScoreOverTimeChart({ shots, average }: ScoreOverTimeProps) {
  const data = shots.map((s) => ({ shot: s.shotNumber, score: s.score }));
  const scores = shots.map((s) => s.score);
  const minY = Math.max(0,   Math.min(...scores) - 0.5);
  const maxY = Math.min(10.9, Math.max(...scores) + 0.3);

  const gradientId = 'scoreAreaGrad';

  return (
    <div aria-label="Score over time chart" role="figure">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            {/* Amber gradient fill below the line */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#F5A623" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#F5A623" stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#1E2433" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="shot"
            {...AXIS_STYLE}
            label={{ value: 'Shot', position: 'insideBottom', dy: 14, fontSize: 10, fill: '#4A5568', fontFamily: 'var(--font-rajdhani)' }}
          />
          <YAxis domain={[minY, maxY]} {...AXIS_STYLE} tickCount={5} />

          <Tooltip
            content={<ChartTooltip labelPrefix="Shot" valueLabel="Score" valueColor="#F5A623" />}
            cursor={{ stroke: '#F5A623', strokeWidth: 1, strokeDasharray: '4 4' }}
          />

          {/* Reference line at session average */}
          {average !== undefined && (
            <ReferenceLine
              y={average}
              stroke="rgba(245,166,35,0.4)"
              strokeDasharray="6 4"
              label={{
                value: `AVG ${average.toFixed(2)}`,
                position: 'right',
                fontSize: 9,
                fill: '#F5A623',
                fontFamily: 'var(--font-rajdhani)',
                fontWeight: 700,
              }}
            />
          )}

          {/* Perfect score reference */}
          <ReferenceLine
            y={10}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="8 4"
            label={{ value: 'Perfect', position: 'right', fontSize: 9, fill: '#4A5568', fontFamily: 'var(--font-rajdhani)' }}
          />

          {/* Animated area + line — draws left-to-right on mount */}
          <Area
            type="monotone"
            dataKey="score"
            stroke="#F5A623"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 2.5, fill: '#F5A623', stroke: 'none' }}
            activeDot={{ r: 5, fill: '#F5A623', stroke: '#0E1118', strokeWidth: 2 }}
            isAnimationActive
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 2. Score Distribution ─────────────────────────────────────────────────────

interface ScoreDistributionProps {
  shots: Shot[];
}

export function ScoreDistributionChart({ shots }: ScoreDistributionProps) {
  // Bucket by ring — aligned with shot color semantics
  const buckets = [
    { ring: '≤7',   min: 0,    max: 7.99,  color: '#FF4D6D', count: 0 },
    { ring: '8',    min: 8,    max: 8.99,  color: '#FF4D6D', count: 0 },
    { ring: '9',    min: 9,    max: 9.99,  color: '#00E5A0', count: 0 },
    { ring: '10',   min: 10,   max: 10.49, color: '#4FC3F7', count: 0 },
    { ring: '10.X', min: 10.5, max: 10.9,  color: '#F5A623', count: 0 },
  ];

  shots.forEach((s) => {
    for (const b of buckets) {
      if (s.score >= b.min && s.score <= b.max) { b.count++; break; }
    }
  });

  return (
    <div aria-label="Score distribution chart" role="figure">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={buckets} margin={CHART_MARGIN} barCategoryGap="30%">
          <CartesianGrid stroke="#1E2433" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="ring" {...AXIS_STYLE} />
          <YAxis
            allowDecimals={false}
            {...AXIS_STYLE}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', dx: 20, fontSize: 10, fill: '#4A5568', fontFamily: 'var(--font-rajdhani)' }}
          />
          <Tooltip
            content={<ChartTooltip labelPrefix="Ring" valueLabel="Shots" valueColor="#F5A623" decimals={0} />}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900}>
            {buckets.map((b) => (
              <Cell
                key={b.ring}
                fill={b.color}
                fillOpacity={0.85}
                style={{ filter: `drop-shadow(0 0 4px ${b.color}60)` }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── 3. Series Comparison ──────────────────────────────────────────────────────

interface SeriesData {
  label: string;
  seriesAverages: number[];
}

interface SeriesComparisonProps {
  sessions: SeriesData[];
}

const SERIES_COLORS = ['#F5A623', '#4FC3F7', '#00E5A0', '#FF4D6D', '#7C3AED'];

export function SeriesComparisonChart({ sessions }: SeriesComparisonProps) {
  const maxSeries = Math.max(...sessions.map((s) => s.seriesAverages.length), 0);

  const data = Array.from({ length: maxSeries }, (_, i) => {
    const row: Record<string, number | string> = { series: `S${i + 1}` };
    sessions.forEach((s) => { row[s.label] = s.seriesAverages[i] ?? 0; });
    return row;
  });

  return (
    <div aria-label="Series comparison chart" role="figure">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={CHART_MARGIN} barCategoryGap="25%" barGap={3}>
          <CartesianGrid stroke="#1E2433" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="series" {...AXIS_STYLE} />
          <YAxis domain={[0, 10.9]} {...AXIS_STYLE} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="tooltip-glass px-3 py-2">
                  <p className="text-[10px] font-display uppercase tracking-widest text-[#4A5568] mb-2">{label}</p>
                  {payload.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-xs text-[#8892A4] font-display">{p.name}</span>
                      <span className="score-value text-sm ml-auto" style={{ color: p.color }}>
                        {Number(p.value).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 8 }}
          />
          {sessions.map((s, i) => (
            <Bar
              key={s.label}
              dataKey={s.label}
              fill={SERIES_COLORS[i % SERIES_COLORS.length]}
              radius={[3, 3, 0, 0]}
              isAnimationActive
              animationDuration={900 + i * 150}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
