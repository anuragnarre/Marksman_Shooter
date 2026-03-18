// apps/web/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ComposedChart, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
  Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { apiFetch } from '../../lib/api';
import { formatSessionStart } from '../../lib/session-time';
import { useAuth } from '../../contexts/auth-context';
import { AppShell } from '../../components/AppShell';
import { MetricCard } from '../../components/ui/MetricCard';
import { TargetCanvas } from '../../components/TargetCanvas';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonCard, SkeletonRow } from '../../components/ui/SkeletonCard';
import { StaggerGrid, StaggerItem } from '../../components/StaggerGrid';
import type {
  CoachDashboardData,
  CreateManagedShooterProfileRequest,
  Session, Shot, User, WeaponPerformance,
  OverviewAnalytics, SessionTrendPoint,
} from '@shooting-platform/shared-types';
import { TRAINING_MODE_COLORS, TRAINING_MODES } from '@shooting-platform/shared-types';

// ── Default export ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <AppShell title="Dashboard">
      {user.role === 'SHOOTER' ? <ShooterView /> : user.role === 'SOLDIER' ? <SoldierView /> : <CoachView />}
    </AppShell>
  );
}

// ── Helper utilities ───────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function fmtDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function shotColor(score: number): string {
  if (score >= 10.5) return '#F5A623';
  if (score >= 10.0) return '#4FC3F7';
  if (score >= 9.0)  return '#00E5A0';
  return '#FF4D6D';
}

function getFormStatus(recent5Avg: number, overallAvg: number): { label: string; color: string } {
  const diff = recent5Avg - overallAvg;
  if (diff > 0.1)  return { label: 'HOT',    color: '#00E5A0' };
  if (diff < -0.1) return { label: 'COLD',   color: '#FF4D6D' };
  return              { label: 'STEADY', color: '#F5A623' };
}

// ── Icon components ────────────────────────────────────────────────────────────

function TargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6"/>
      <circle cx="8" cy="8" r="3"/>
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="2,12 6,7 10,9 14,4"/>
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 2h6v5a3 3 0 01-6 0V2z"/>
      <path d="M2 3h3M11 3h3M8 9v3M6 14h4"/>
    </svg>
  );
}

function BulletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="2"/>
      <line x1="8" y1="2" x2="8" y2="4"/>
      <line x1="8" y1="12" x2="8" y2="14"/>
      <line x1="2" y1="8" x2="4" y2="8"/>
      <line x1="12" y1="8" x2="14" y2="8"/>
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="8,2 10,6 14,6.5 11,9.5 11.8,14 8,12 4.2,14 5,9.5 2,6.5 6,6"/>
    </svg>
  );
}

function FireIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14c-3 0-5-2-5-5 0-2.5 2-4 2-4s-.5 3 2 3c0 0-1-4 2-6 0 3 3 3 3 6a3 3 0 01-4 6z"/>
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,2 5,9 8,9 7,14 11,7 8,7"/>
    </svg>
  );
}

// ── Custom Recharts tooltip ────────────────────────────────────────────────────

function GlassTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="tooltip-glass p-3 min-w-[140px]">
      {label && (
        <p className="score-value text-[10px] text-[#4A5568] uppercase tracking-widest mb-2">{label}</p>
      )}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <span className="text-[#8892A4] text-xs">{entry.name}</span>
          <span className="score-value text-xs font-semibold" style={{ color: entry.color }}>
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function TrendTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string; payload: Record<string, unknown> }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload as {
    date: string; avgScore: number; stdDev: number; groupRadius: number; xRingCount: number;
  } | undefined;
  if (!data) return null;
  return (
    <div className="tooltip-glass p-3 min-w-[160px]">
      <p className="score-value text-[10px] text-[#4A5568] uppercase tracking-widest mb-2">{data.date}</p>
      <div className="flex items-center justify-between gap-4 mb-1">
        <span className="text-[#8892A4] text-xs">Avg Score</span>
        <span className="score-value text-xs font-semibold text-[#F5A623]">{data.avgScore.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <span className="text-[#8892A4] text-xs">Std Dev</span>
        <span className="score-value text-xs font-semibold text-[#FF4D6D]">{data.stdDev.toFixed(3)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 mb-1">
        <span className="text-[#8892A4] text-xs">Group Radius</span>
        <span className="score-value text-xs font-semibold text-[#4FC3F7]">{data.groupRadius.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[#8892A4] text-xs">X-Ring</span>
        <span className="score-value text-xs font-semibold text-[#F5A623]">{data.xRingCount}</span>
      </div>
    </div>
  );
}

// ── Empty states ───────────────────────────────────────────────────────────────

function AnimatedTarget() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-30" aria-hidden="true">
      {[24, 18, 12, 6].map((r, i) => (
        <circle
          key={r} cx="30" cy="30" r={r}
          fill="none" stroke="#F5A623" strokeWidth="1"
          style={{ animation: `fadeIn 400ms ${i * 150}ms both` }}
        />
      ))}
      <circle cx="30" cy="30" r="2.5" fill="#F5A623" className="animate-pulse" />
    </svg>
  );
}

function EmptyCanvas() {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-[#4A5568] text-xs text-center gap-3">
      <div className="opacity-40">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          {[20, 14, 8].map((r, i) => (
            <circle key={r} cx="24" cy="24" r={r} fill="none" stroke="#F5A623" strokeWidth="1"
              className="animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
          ))}
          <circle cx="24" cy="24" r="2" fill="#F5A623" />
        </svg>
      </div>
      <span className="font-display uppercase tracking-widest text-[10px]">No shots yet</span>
    </div>
  );
}

function EmptySessionsState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <AnimatedTarget />
      <p className="text-[#F0F4FF] font-display font-semibold text-lg mt-5">No sessions yet</p>
      <p className="text-[#4A5568] text-sm mt-1 mb-5">Start tracking your training today.</p>
      <Link href="/sessions/new" className="btn btn-primary">Start first session</Link>
    </div>
  );
}

function EmptyShootersState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <p className="text-[#F0F4FF] font-display font-semibold text-lg">No shooters yet</p>
      <p className="text-[#4A5568] text-sm mt-1">Shooters can request to connect from their dashboard.</p>
    </div>
  );
}

// ── ShooterView ────────────────────────────────────────────────────────────────

function ShooterView() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<OverviewAnalytics>('/analytics/overview').catch(() => null),
      apiFetch<Session[]>('/sessions').catch(() => [] as Session[]),
    ]).then(([ov, sess]) => {
      setOverview(ov);
      setSessions(sess);
    }).finally(() => setLoading(false));
  }, []);

  const {
    trend, ringDist, recent5Avg, prior5Avg, avgDelta,
    xRingTotal, xRingPct, streak, trendChartData,
    latestShots, bestTrendPoint, formStatus,
    trendMin, trendChartDataLast8,
  } = useMemo(() => {
    const trend = overview?.sessionTrend ?? [];
    const ringDist = overview?.ringDistribution ?? [];

    const recent5 = trend.slice(-5);
    const prior5  = trend.slice(-10, -5);
    const recent5Avg = recent5.length
      ? recent5.reduce((s, t) => s + t.avgScore, 0) / recent5.length
      : 0;
    const prior5Avg = prior5.length
      ? prior5.reduce((s, t) => s + t.avgScore, 0) / prior5.length
      : 0;
    const avgDelta = prior5.length ? recent5Avg - prior5Avg : undefined;

    const xRingTotal = trend.reduce((s, t) => s + t.xRingCount, 0);
    const xRingPct = overview?.totalShots
      ? (xRingTotal / overview.totalShots) * 100
      : 0;

    let streak = 0;
    for (let i = trend.length - 1; i >= 0; i--) {
      if (trend[i].avgScore >= (overview?.overallAverage ?? 0)) streak++;
      else break;
    }

    const trendChartData = trend.map((t, i) => ({
      session: i + 1,
      date: fmtDateShort(t.date),
      avgScore: t.avgScore,
      bandHigh: Math.min(10.9, t.avgScore + t.stdDev),
      bandLow: Math.max(0, t.avgScore - t.stdDev),
      groupRadius: t.groupRadius,
      stdDev: t.stdDev,
      xRingCount: t.xRingCount,
    }));

    const latestShots = (sessions[0]?.shots ?? []) as Shot[];

    const bestTrendPoint = trend.length
      ? [...trend].sort((a, b) => b.avgScore - a.avgScore)[0]
      : undefined;

    const formStatus = recent5Avg > 0
      ? getFormStatus(recent5Avg, overview?.overallAverage ?? 0)
      : { label: 'STEADY', color: '#F5A623' };

    const scores = trendChartData.map(d => d.avgScore).filter(Boolean);
    const trendMin = scores.length ? Math.max(0, Math.min(...scores) - 0.3) : 0;

    const trendChartDataLast8 = trendChartData.slice(-8);

    return {
      trend, ringDist, recent5Avg, prior5Avg, avgDelta,
      xRingTotal, xRingPct, streak, trendChartData,
      latestShots, bestTrendPoint, formStatus,
      trendMin, trendChartDataLast8,
    };
  }, [overview, sessions]);

  const last7Avgs = trend.slice(-7).map(t => t.avgScore);

  // Compute max consecutive above-avg streak for personal bests
  let maxStreak = 0;
  let currentStreak = 0;
  for (const t of trend) {
    if (t.avgScore >= (overview?.overallAverage ?? 0)) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  const maxXRingSession = trend.length
    ? Math.max(...trend.map(t => t.xRingCount))
    : 0;

  const lastTrendPoint = trend[trend.length - 1];

  const trendBySessionId = useMemo(() => {
    const map = new Map<string, SessionTrendPoint>();
    for (const t of trend) map.set(t.sessionId, t);
    return map;
  }, [trend]);

  return (
    <div className="space-y-6">

      {/* ── Section 1: Header row ─────────────────────────────────────────── */}
      <div className="animate-slide-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl text-[#F0F4FF] leading-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]}.
          </h2>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-[#8892A4] text-sm">
              {sessions.length > 0
                ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''} recorded this season.`
                : 'Start your first session to begin tracking.'}
            </p>
            {recent5Avg > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-widest border"
                style={{
                  color: formStatus.color,
                  borderColor: `${formStatus.color}40`,
                  backgroundColor: `${formStatus.color}18`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: formStatus.color }}
                />
                {formStatus.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/analytics" className="btn btn-ghost text-sm">
            Full Analytics →
          </Link>
          <Link href="/sessions/new" className="btn btn-primary stagger-3">
            + New Session
          </Link>
        </div>
      </div>

      {/* ── Section 2: 6 KPI Cards ────────────────────────────────────────── */}
      <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <StaggerItem key={i}>
              <SkeletonCard animationDelay={i * 60} />
            </StaggerItem>
          ))
        ) : (
          <>
            <StaggerItem>
              <MetricCard
                label="Season Average"
                value={overview?.overallAverage ?? 0}
                decimals={2}
                color="blue"
                delta={avgDelta}
                sparklineData={last7Avgs}
                icon={<ChartIcon />}
                animationDelay={0}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="Best Session"
                value={overview?.bestSessionAvg ?? 0}
                decimals={2}
                color="emerald"
                isPB={(overview?.bestSessionAvg ?? 0) >= 9.5}
                unit={bestTrendPoint ? fmtDateShort(bestTrendPoint.date) : undefined}
                icon={<TrophyIcon />}
                animationDelay={60}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="X-Ring Count"
                value={xRingTotal}
                decimals={0}
                color="accent"
                unit={`${xRingPct.toFixed(1)}% of shots`}
                icon={<StarIcon />}
                animationDelay={120}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="Consistency"
                value={overview?.consistency ?? 0}
                decimals={1}
                color="blue"
                unit="out of 10"
                icon={<ZapIcon />}
                animationDelay={180}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="Total Sessions"
                value={overview?.totalSessions ?? 0}
                decimals={0}
                color="accent"
                icon={<TargetIcon />}
                animationDelay={240}
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                label="Streak"
                value={streak}
                decimals={0}
                color="emerald"
                unit="sessions above avg"
                icon={<FireIcon />}
                animationDelay={300}
              />
            </StaggerItem>
          </>
        )}
      </StaggerGrid>

      {/* ── Section 3: Session Trend Chart ───────────────────────────────── */}
      {!loading && trend.length > 0 && (
        <div className="card p-5 animate-slide-up stagger-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
            <div>
              <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
                Session Performance Trend
              </h3>
              <p className="text-[#4A5568] text-xs mt-0.5">
                Average score per session with ±1σ consistency band
              </p>
            </div>
            {overview?.topDiscipline && (
              <div className="shrink-0">
                <StatusBadge variant="discipline" label={overview.topDiscipline} size="sm" />
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={trendChartData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
              <CartesianGrid stroke="#1E2433" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[trendMin, 10.9]}
                tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<TrendTooltip />} />
              <ReferenceLine
                y={overview?.overallAverage ?? 0}
                stroke="#F5A623"
                strokeDasharray="4 2"
                strokeOpacity={0.6}
                label={{
                  value: `AVG ${(overview?.overallAverage ?? 0).toFixed(2)}`,
                  fill: '#F5A623',
                  fontSize: 9,
                  fontFamily: 'var(--font-jetbrains)',
                }}
              />
              <ReferenceLine
                y={10}
                stroke="#FFFFFF"
                strokeOpacity={0.05}
              />
              <Area
                type="monotone"
                dataKey="bandHigh"
                fill="#F5A623"
                fillOpacity={0.08}
                stroke="none"
                isAnimationActive
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="bandLow"
                fill="#080A0F"
                fillOpacity={1}
                stroke="none"
                isAnimationActive
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="avgScore"
                stroke="#F5A623"
                strokeWidth={2.5}
                dot={(props: { cx: number; cy: number; payload: { avgScore: number } }) => {
                  const isAbove = props.payload.avgScore >= (overview?.overallAverage ?? 0);
                  return (
                    <circle
                      key={`dot-${props.cx}-${props.cy}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={isAbove ? 4 : 2}
                      fill="#F5A623"
                      stroke="#080A0F"
                      strokeWidth={1}
                    />
                  );
                }}
                activeDot={{ r: 6, fill: '#F5A623', stroke: '#080A0F', strokeWidth: 2 }}
                name="Avg Score"
                isAnimationActive
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="groupRadius"
                yAxisId="right"
                stroke="#4FC3F7"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                dot={false}
                name="Group Radius"
                isAnimationActive
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Legend
                wrapperStyle={{ paddingTop: 12 }}
                formatter={(value: string) => (
                  <span style={{ color: '#8892A4', fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}>
                    {value}
                  </span>
                )}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Section 4: Score distribution + Ring breakdown ────────────────── */}
      {!loading && overview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Left: Score Distribution Bar Chart */}
          <div className="card p-5 animate-slide-up stagger-5">
            <div className="mb-4">
              <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
                Score Distribution
              </h3>
              <p className="text-[#4A5568] text-xs mt-0.5">Shot count by scoring ring</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ringDist} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                <CartesianGrid stroke="#1E2433" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="ring"
                  tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload as { ring: string; count: number; pct: number; color: string } | undefined;
                    if (!d) return null;
                    return (
                      <div className="tooltip-glass p-3 min-w-[120px]">
                        <p className="score-value text-[10px] text-[#4A5568] uppercase tracking-widest mb-2">{d.ring}</p>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-[#8892A4] text-xs">Shots</span>
                          <span className="score-value text-xs font-semibold" style={{ color: d.color }}>{d.count}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[#8892A4] text-xs">Share</span>
                          <span className="score-value text-xs font-semibold" style={{ color: d.color }}>{d.pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {ringDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {ringDist.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-[#1E2433]">
                {ringDist.map((bucket) => (
                  <div key={bucket.ring} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <span className="text-[10px] text-[#4A5568] font-display uppercase tracking-wide">
                      {bucket.ring}
                    </span>
                    <span className="score-value text-[10px]" style={{ color: bucket.color }}>
                      {bucket.pct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Ring Breakdown Visual */}
          <div className="card p-5 animate-slide-up stagger-6">
            <div className="mb-4">
              <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
                Ring Breakdown
              </h3>
              <p className="text-[#4A5568] text-xs mt-0.5">Share of shots by ring</p>
            </div>
            <div className="space-y-3">
              {ringDist.map((bucket) => (
                <div key={bucket.ring} className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-display uppercase tracking-wide w-12 shrink-0 text-right"
                    style={{ color: bucket.color }}
                  >
                    {bucket.ring}
                  </span>
                  <div className="flex-1 h-5 bg-[#161B26] rounded overflow-hidden relative">
                    <div
                      className="h-full rounded transition-all duration-700 ease-out"
                      style={{
                        width: `${bucket.pct}%`,
                        backgroundColor: bucket.color,
                        opacity: 0.75,
                      }}
                    />
                    <span
                      className="absolute inset-y-0 right-2 flex items-center score-value text-[10px]"
                      style={{ color: bucket.color }}
                    >
                      {bucket.count}
                    </span>
                  </div>
                  <span
                    className="score-value text-[10px] w-10 shrink-0"
                    style={{ color: bucket.color }}
                  >
                    {bucket.pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            {ringDist.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#1E2433]">
                <div className="flex items-center gap-3">
                  <span className="text-[#4A5568] text-xs">Top ring:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#F5A623' }}
                    />
                    <span className="text-[#F0F4FF] font-display font-semibold text-sm">
                      X-Ring (10.5+)
                    </span>
                    <span className="score-value text-[#F5A623] text-sm font-bold">
                      {ringDist.find(b => b.ring.toLowerCase().includes('x') || b.ring.includes('10.5'))?.count ?? xRingTotal}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Section 5: Consistency & Precision ───────────────────────────── */}
      {!loading && trend.length > 2 && (
        <div className="card p-5 animate-slide-up stagger-5">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
              Consistency &amp; Precision Over Time
            </h3>
            <p className="text-[#4A5568] text-xs mt-0.5">
              Standard deviation (lower=better) and group radius per session
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={trendChartData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
              <CartesianGrid stroke="#1E2433" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="tooltip-glass p-3 min-w-[140px]">
                      <p className="score-value text-[10px] text-[#4A5568] uppercase tracking-widest mb-2">{label}</p>
                      {payload.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-[#8892A4] text-xs">{entry.name}</span>
                          <span
                            className="score-value text-xs font-semibold"
                            style={{ color: entry.color }}
                          >
                            {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={0.3}
                stroke="#F5A623"
                strokeDasharray="4 2"
                strokeOpacity={0.6}
                label={{
                  value: 'Target σ',
                  fill: '#F5A623',
                  fontSize: 9,
                  fontFamily: 'var(--font-jetbrains)',
                }}
              />
              <Bar
                dataKey="stdDev"
                fill="#FF4D6D"
                fillOpacity={0.3}
                radius={[2, 2, 0, 0]}
                name="Std Dev"
                isAnimationActive
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="groupRadius"
                yAxisId="right"
                stroke="#4FC3F7"
                strokeWidth={2}
                dot={false}
                name="Group Radius"
                isAnimationActive
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Section 6: Target canvas + Recent sessions ────────────────────── */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Left: Last session target canvas */}
          <div className="card p-5 lg:col-span-2 animate-slide-up stagger-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
                Last Session Target
              </h3>
              {sessions[0] && (
                <Link
                  href={`/sessions/${sessions[0].id}`}
                  className="text-accent hover:text-amber-300 text-xs font-display font-semibold uppercase tracking-wide transition-colors"
                >
                  View session →
                </Link>
              )}
            </div>

            {latestShots.length > 0 ? (
              <>
                <div className="flex justify-center">
                  <TargetCanvas shots={latestShots} size={300} />
                </div>
                {lastTrendPoint && (
                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1E2433]">
                    <div className="text-center">
                      <p className="label text-[9px]">Avg Score</p>
                      <p
                        className="score-value text-xl font-semibold mt-0.5"
                        style={{ color: shotColor(lastTrendPoint.avgScore) }}
                      >
                        {lastTrendPoint.avgScore.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="label text-[9px]">Shots</p>
                      <p className="score-value text-xl font-semibold text-[#F0F4FF] mt-0.5">
                        {lastTrendPoint.totalShots}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="label text-[9px]">Group Radius</p>
                      <p className="score-value text-xl font-semibold text-[#4FC3F7] mt-0.5">
                        {lastTrendPoint.groupRadius.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EmptyCanvas />
            )}
          </div>

          {/* Right: Recent sessions table */}
          <div className="card lg:col-span-3 animate-slide-up stagger-7">
            <div className="flex items-center justify-between p-5 pb-0">
              <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
                Recent Sessions
              </h3>
              <Link
                href="/sessions"
                className="text-accent hover:text-amber-300 text-xs font-display font-semibold uppercase tracking-wide transition-colors"
              >
                All sessions →
              </Link>
            </div>
            <div className="mt-3 overflow-x-auto overscroll-x-contain">
              {sessions.length === 0 ? (
                <EmptySessionsState />
              ) : (
                <div className="min-w-[860px]">
                  <div
                    className="grid border-y border-[#1E2433] bg-[rgba(10,13,18,0.92)]"
                    style={{ gridTemplateColumns: '200px 220px 120px 100px 120px 100px' }}
                  >
                    {['Session Start', 'Discipline', 'Avg Score', 'Shots', 'Group R.', ''].map((header, idx) => (
                      <div
                        key={`${header}-${idx}`}
                        className={`py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap ${idx >= 2 && idx <= 4 ? 'text-right' : 'text-left'} ${idx === 5 ? 'text-right' : ''}`}
                      >
                        {header}
                      </div>
                    ))}
                  </div>
                  {sessions.slice(0, 8).map((s, i) => {
                    const tp = trendBySessionId.get(s.id);
                    const avg = tp?.avgScore;
                    const avgCol = avg !== undefined ? shotColor(avg) : '#8892A4';
                    return (
                      <div
                        key={s.id}
                        className="table-row-hover border-b border-[#1E2433]/50 animate-fade-in grid items-center"
                        style={{
                          animationDelay: `${i * 30}ms`,
                          gridTemplateColumns: '200px 220px 120px 100px 120px 100px',
                        }}
                      >
                        <div className="py-3 px-5 whitespace-nowrap">
                          <span className="score-value text-xs text-[#8892A4] whitespace-nowrap">{formatSessionStart(s.sessionDate)}</span>
                        </div>
                        <div className="py-3 px-5 whitespace-nowrap">
                          <StatusBadge variant="discipline" label={s.discipline} size="sm" />
                        </div>
                        <div className="py-3 px-5 text-right whitespace-nowrap">
                          {avg !== undefined ? (
                            <span className="score-value text-sm font-semibold" style={{ color: avgCol }}>
                              {avg.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[#4A5568] text-xs">—</span>
                          )}
                        </div>
                        <div className="py-3 px-5 text-right score-value text-[#F0F4FF] text-xs whitespace-nowrap">
                          {tp?.totalShots ?? s.numberOfShots}
                        </div>
                        <div className="py-3 px-5 text-right score-value text-[#4FC3F7] text-xs whitespace-nowrap">
                          {tp ? tp.groupRadius.toFixed(2) : '—'}
                        </div>
                        <div className="py-3 px-5 text-right whitespace-nowrap">
                          <Link
                            href={`/sessions/${s.id}`}
                            className="text-accent hover:text-amber-300 text-xs font-display font-semibold uppercase tracking-wide transition-colors"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 7: Personal Bests ─────────────────────────────────────── */}
      {!loading && trend.length > 0 && (
        <div className="animate-slide-up">
          <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide mb-4">
            Personal Bests
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[
              {
                label: 'Highest Single Shot',
                value: overview?.bestScore?.toFixed(1) ?? '—',
                icon: <StarIcon />,
              },
              {
                label: 'Best Session Avg',
                value: overview?.bestSessionAvg?.toFixed(2) ?? '—',
                icon: <TrophyIcon />,
              },
              {
                label: 'Most X-Rings (Session)',
                value: String(maxXRingSession),
                icon: <TargetIcon />,
              },
              {
                label: 'Longest Streak',
                value: `${maxStreak}`,
                unit: 'sessions',
                icon: <FireIcon />,
              },
            ].map((milestone) => (
              <div
                key={milestone.label}
                className="shrink-0 w-44 rounded-xl p-4 border border-[#F5A623]/20 bg-[#161B26]"
                style={{ boxShadow: '0 0 12px rgba(245,166,35,0.06)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[#F5A623] opacity-70">{milestone.icon}</span>
                  <span className="text-[#4A5568] text-[10px] font-display uppercase tracking-widest leading-tight">
                    {milestone.label}
                  </span>
                </div>
                <p className="score-value text-3xl font-bold text-[#F5A623] leading-none">
                  {milestone.value}
                </p>
                {milestone.unit && (
                  <p className="text-[#4A5568] text-[10px] font-display uppercase tracking-widest mt-1">
                    {milestone.unit}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ── SoldierView ────────────────────────────────────────────────────────────────

function WeaponBarChart({ weapons }: { weapons: WeaponPerformance[] }) {
  const data = weapons.map(w => ({
    name: w.weaponType.length > 12 ? w.weaponType.slice(0, 12) + '…' : w.weaponType,
    avg: w.averageScore,
    best: w.bestScore,
    shots: w.totalShots,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
        <CartesianGrid stroke="#1E2433" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 11]}
          tick={{ fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="tooltip-glass p-3 min-w-[140px]">
                <p className="score-value text-[10px] text-[#4A5568] uppercase tracking-widest mb-2">{label}</p>
                {payload.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
                    <span className="text-[#8892A4] text-xs">{entry.name}</span>
                    <span
                      className="score-value text-xs font-semibold"
                      style={{ color: String(entry.color) }}
                    >
                      {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                    </span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <Bar
          dataKey="avg"
          name="Avg Score"
          fill="#F5A623"
          fillOpacity={0.75}
          radius={[3, 3, 0, 0]}
          isAnimationActive
          animationDuration={1000}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="best"
          name="Best Score"
          fill="#00E5A0"
          fillOpacity={0.5}
          radius={[3, 3, 0, 0]}
          isAnimationActive
          animationDuration={1000}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SoldierView() {
  const { user } = useAuth();
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [weapons, setWeapons]     = useState<WeaponPerformance[]>([]);
  const [overview, setOverview]   = useState<OverviewAnalytics | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Session[]>('/sessions').catch(() => [] as Session[]),
      apiFetch<WeaponPerformance[]>('/analytics/weapons/summary').catch(() => [] as WeaponPerformance[]),
      apiFetch<OverviewAnalytics>('/analytics/overview').catch(() => null),
    ]).then(([s, w, ov]) => {
      setSessions(s);
      setWeapons(w);
      setOverview(ov);
    }).finally(() => setLoading(false));
  }, []);

  const allShots: Shot[] = sessions.flatMap((s) => (s.shots ?? []) as Shot[]);
  const scores = allShots.map((s) => s.score);
  const seasonAvg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const uniqueWeapons = new Set(sessions.map((s) => s.weaponType)).size;

  // Training mode breakdown
  const modeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const mode of TRAINING_MODES) counts[mode] = 0;
    for (const s of sessions) {
      if (s.trainingMode && counts[s.trainingMode] !== undefined) {
        counts[s.trainingMode]++;
      }
    }
    return Object.entries(counts).map(([mode, count]) => ({ mode, count }));
  }, [sessions]);

  // Mini trend area chart data
  const miniTrend = useMemo(() => {
    const trend = overview?.sessionTrend ?? [];
    return trend.slice(-8).map((t, i) => ({
      session: i + 1,
      date: fmtDateShort(t.date),
      avgScore: t.avgScore,
    }));
  }, [overview]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-3xl text-[#F0F4FF] leading-tight">
            {getGreeting()}, {user?.name?.split(' ')[0]}.
          </h2>
          <p className="text-[#8892A4] text-sm mt-1">
            {sessions.length > 0
              ? `${sessions.length} training sessions recorded.`
              : 'Begin your first training session.'}
          </p>
        </div>
        <Link href="/sessions/new" className="btn btn-primary shrink-0">
          + New Session
        </Link>
      </div>

      {/* Readiness + Qualification Row */}
      {!loading && overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up stagger-1">
          {/* Readiness Score */}
          <div
            className="relative rounded-xl p-4 overflow-hidden"
            style={{
              background: 'rgba(0,229,160,0.04)',
              border: '1px solid rgba(0,229,160,0.18)',
            }}
          >
            <div className="absolute top-0 inset-x-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(0,229,160,0.5),transparent)' }}
            />
            <div className="flex items-center gap-3">
              <div>
                {(() => {
                  const trend = overview?.sessionTrend ?? [];
                  const recentAvg = trend.slice(-5).reduce((s, t) => s + t.avgScore, 0) / Math.max(trend.slice(-5).length, 1);
                  const avgStdDev = trend.reduce((s, t) => s + t.stdDev, 0) / Math.max(trend.length, 1);
                  const cutoff30 = new Date(); cutoff30.setDate(cutoff30.getDate() - 30);
                  const recentCount = sessions.filter(s => new Date(s.sessionDate) >= cutoff30).length;
                  const score = Math.min(100,
                    Math.round((recentAvg / 10.9) * 40) +
                    Math.round(Math.max(0, 25 - avgStdDev * 12)) +
                    Math.min(20, recentCount * 4) +
                    Math.min(15, Math.round((overview.totalShots / 200) * 15))
                  );
                  const status = score >= 85 ? { label: 'Combat Ready', color: '#00E5A0' }
                    : score >= 70 ? { label: 'Mission Ready', color: '#F5A623' }
                    : score >= 50 ? { label: 'Training Ready', color: '#4FC3F7' }
                    : { label: 'Developing', color: '#A78BFA' };
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: status.color }} />
                        <p className="text-[10px] font-display uppercase tracking-widest" style={{ color: status.color }}>
                          Readiness
                        </p>
                      </div>
                      <p className="font-data font-black text-4xl leading-none" style={{ color: status.color }}>{score}</p>
                      <p className="text-[10px] font-display mt-1" style={{ color: status.color }}>{status.label}</p>
                    </>
                  );
                })()}
              </div>
              <div className="ml-auto">
                <Link href="/soldier/analytics" className="text-[10px] font-display text-[#4A5568] hover:text-[#00E5A0] transition-colors uppercase tracking-widest">
                  Full Report →
                </Link>
              </div>
            </div>
          </div>

          {/* Qualification Tier */}
          <div
            className="relative rounded-xl p-4 overflow-hidden"
            style={{
              background: 'rgba(245,166,35,0.04)',
              border: '1px solid rgba(245,166,35,0.18)',
            }}
          >
            <div className="absolute top-0 inset-x-0 h-px"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(245,166,35,0.5),transparent)' }}
            />
            {(() => {
              const avg = overview.overallAverage;
              const tier = avg >= 10.5 ? { label: 'Grand Master', color: '#F5A623' }
                : avg >= 10.0 ? { label: 'Master', color: '#4FC3F7' }
                : avg >= 9.5  ? { label: 'Expert', color: '#00E5A0' }
                : avg >= 9.0  ? { label: 'Sharpshooter', color: '#A78BFA' }
                : avg >= 8.0  ? { label: 'Marksman', color: '#8892A4' }
                : { label: 'Qualified', color: '#4A5568' };
              return (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#4A5568] text-[10px] font-display uppercase tracking-widest">Classification</span>
                  </div>
                  <p className="font-display font-black text-2xl leading-tight" style={{ color: tier.color }}>
                    {tier.label}
                  </p>
                  <p className="text-[#8892A4] text-xs mt-1">
                    {avg.toFixed(2)} overall avg
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} animationDelay={i * 60} />)
        ) : (
          <>
            <MetricCard
              label="Weapons Trained"
              value={uniqueWeapons}
              decimals={0}
              color="accent"
              animationDelay={0}
              icon={<TargetIcon />}
            />
            <MetricCard
              label="Total Sessions"
              value={sessions.length}
              decimals={0}
              color="blue"
              animationDelay={60}
              icon={<ChartIcon />}
            />
            <MetricCard
              label="Season Average"
              value={seasonAvg}
              decimals={2}
              color="emerald"
              animationDelay={120}
              icon={<TrophyIcon />}
            />
            <MetricCard
              label="Best Score"
              value={bestScore}
              decimals={1}
              color="accent"
              animationDelay={180}
              icon={<BulletIcon />}
              isPB={bestScore >= 10.5}
            />
          </>
        )}
      </div>

      {/* Training mode breakdown */}
      {!loading && sessions.length > 0 && (
        <div className="card p-5 animate-slide-up stagger-3">
          <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide mb-4">
            Training Mode Breakdown
          </h3>
          <div className="flex flex-wrap gap-3">
            {modeBreakdown.map(({ mode, count }) => (
              <div
                key={mode}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{
                  borderColor: `${TRAINING_MODE_COLORS[mode] ?? '#4A5568'}30`,
                  backgroundColor: `${TRAINING_MODE_COLORS[mode] ?? '#4A5568'}10`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: TRAINING_MODE_COLORS[mode] ?? '#4A5568' }}
                />
                <span
                  className="text-[10px] font-display uppercase tracking-wide"
                  style={{ color: TRAINING_MODE_COLORS[mode] ?? '#4A5568' }}
                >
                  {mode}
                </span>
                <span
                  className="score-value text-sm font-bold"
                  style={{ color: TRAINING_MODE_COLORS[mode] ?? '#8892A4' }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weapon performance chart */}
      {!loading && weapons.length > 0 && (
        <div className="card p-5 animate-slide-up stagger-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
                Weapon Performance
              </h3>
              <p className="text-[#4A5568] text-xs mt-0.5">Average and best score per weapon system</p>
            </div>
            <Link
              href="/soldier/weapons"
              className="text-xs text-accent hover:text-amber-300 font-display uppercase tracking-widest transition-colors"
            >
              All weapons →
            </Link>
          </div>
          <WeaponBarChart weapons={weapons} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {weapons.slice(0, 3).map((w) => (
              <div key={w.weaponType} className="bg-[#161B26] rounded-xl p-4 border border-[#1E2433]">
                <p className="text-[#F0F4FF] font-semibold text-sm truncate">{w.weaponType}</p>
                <p className="text-accent font-display font-bold text-2xl mt-1">{w.averageScore.toFixed(2)}</p>
                <div className="flex gap-3 mt-1 text-[#4A5568] text-[10px] font-display uppercase tracking-wide">
                  <span>{w.sessions} sess.</span>
                  <span>{w.totalShots} shots</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mini session trend */}
      {!loading && miniTrend.length > 1 && (
        <div className="card p-5 animate-slide-up stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
              Recent Session Trend
            </h3>
            <span className="score-value text-xs text-[#4A5568]">Last 8 sessions</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={miniTrend} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
              <defs>
                <linearGradient id="soldierTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5A623" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E2433" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#4A5568', fontSize: 9, fontFamily: 'var(--font-jetbrains)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#4A5568', fontSize: 9, fontFamily: 'var(--font-jetbrains)' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<GlassTooltip />} />
              <Area
                type="monotone"
                dataKey="avgScore"
                stroke="#F5A623"
                strokeWidth={2}
                fill="url(#soldierTrendGrad)"
                name="Avg Score"
                isAnimationActive
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sessions */}
      <div className="card animate-slide-up stagger-6">
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">Recent Sessions</h3>
        </div>
        <div className="mt-3 overflow-x-auto overscroll-x-contain">
          {loading ? (
            <div className="px-5 pb-4 space-y-0">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} animationDelay={i * 40} />)}
            </div>
          ) : sessions.length === 0 ? (
            <EmptySessionsState />
          ) : (
            <table className="w-full min-w-[860px] table-fixed text-sm" role="table">
              <colgroup>
                <col className="w-[200px]" />
                <col className="w-[220px]" />
                <col className="w-[160px]" />
                <col className="w-[100px]" />
                <col className="w-[100px]" />
              </colgroup>
              <thead className="bg-[rgba(10,13,18,0.92)]">
                <tr className="border-y border-[#1E2433]">
                  <th className="text-left py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap">Session Start</th>
                  <th className="text-left py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap hidden sm:table-cell">Weapon</th>
                  <th className="text-left py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap hidden md:table-cell">Mode</th>
                  <th className="text-right py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap">Shots</th>
                  <th className="py-3 px-5" />
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 8).map((s, i) => (
                  <tr
                    key={s.id}
                    className="table-row-hover border-b border-[#1E2433]/50 animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="py-3 px-5 whitespace-nowrap align-middle">
                      <span className="score-value text-xs text-[#8892A4] whitespace-nowrap">{formatSessionStart(s.sessionDate, { includeYear: true })}</span>
                    </td>
                    <td className="py-3 px-5 text-[#8892A4] text-xs hidden sm:table-cell whitespace-nowrap align-middle truncate">
                      {s.weaponType}
                    </td>
                    <td className="py-3 px-5 hidden md:table-cell">
                      {s.trainingMode && (
                        <span
                          className="text-[10px] font-display uppercase tracking-wide px-2 py-0.5 rounded"
                          style={{
                            color: TRAINING_MODE_COLORS[s.trainingMode] ?? '#8892A4',
                            backgroundColor: `${TRAINING_MODE_COLORS[s.trainingMode] ?? '#8892A4'}18`,
                          }}
                        >
                          {s.trainingMode}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right score-value text-[#F0F4FF]">
                      {s.numberOfShots}
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap align-middle">
                      <Link
                        href={`/sessions/${s.id}`}
                        className="text-accent hover:text-amber-300 text-xs font-display font-semibold uppercase tracking-wide transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CoachView ──────────────────────────────────────────────────────────────────

function CoachView() {
  const { user } = useAuth();
  const [dashboard, setDashboard]   = useState<CoachDashboardData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [creatingManaged, setCreatingManaged] = useState(false);
  const [managedSuccess, setManagedSuccess] = useState<string | null>(null);
  const [managedError, setManagedError] = useState<string | null>(null);
  const [managedForm, setManagedForm] = useState<CreateManagedShooterProfileRequest>({
    name: '',
    shooterCode: '',
    primaryWeapon: '',
  });

  const shooterSummaries = dashboard?.shooterSummaries ?? [];
  const analytics = dashboard?.analytics;
  const recentSessions = dashboard?.recentSessions ?? [];
  const schedule = dashboard?.schedule ?? [];
  const managedCount = shooterSummaries.filter((shooter) => shooter.isManaged).length;
  const trendData = [...recentSessions]
    .slice(0, 10)
    .reverse()
    .map((session) => ({
      date: fmtDateShort(session.sessionDate),
      avgScore: session.averageScore,
      shots: session.totalShots,
    }));

  function loadCoachData() {
    setLoading(true);
    apiFetch<CoachDashboardData>('/coach/dashboard')
      .then(setDashboard)
      .catch((e: Error) => setManagedError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCoachData();
  }, []);

  async function handleCreateManagedShooter() {
    if (!managedForm.name.trim() || !managedForm.shooterCode.trim()) return;

    setManagedError(null);
    setManagedSuccess(null);
    setCreatingManaged(true);

    try {
      const created = await apiFetch<User>('/coach/managed-shooters', {
        method: 'POST',
        body: JSON.stringify({
          name: managedForm.name.trim(),
          shooterCode: managedForm.shooterCode.trim().toUpperCase(),
          primaryWeapon: managedForm.primaryWeapon?.trim() || undefined,
        }),
      });

      setManagedForm({ name: '', shooterCode: '', primaryWeapon: '' });
      setManagedSuccess(`Created managed shooter profile for ${created.name}.`);
      loadCoachData();
    } catch (e) {
      setManagedError(e instanceof Error ? e.message : 'Failed to create managed shooter');
    } finally {
      setCreatingManaged(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <h2 className="font-display font-bold text-3xl text-[#F0F4FF]">
          {getGreeting()}, Coach {user?.name?.split(' ')[0]}.
        </h2>
        <p className="text-[#8892A4] text-sm mt-1">
          Professional overview for your entire training roster.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Active Shooters"
          value={analytics?.totalShooters ?? 0}
          decimals={0}
          color="accent"
          animationDelay={0}
          icon={<TargetIcon />}
        />
        <MetricCard
          label="Active (30d)"
          value={analytics?.activeShooters30d ?? 0}
          decimals={0}
          color="blue"
          animationDelay={60}
          icon={<ZapIcon />}
        />
        <MetricCard
          label="Roster Sessions"
          value={analytics?.totalSessions ?? 0}
          decimals={0}
          color="emerald"
          animationDelay={120}
          icon={<ChartIcon />}
        />
        <MetricCard
          label="Roster Shots"
          value={analytics?.totalShots ?? 0}
          decimals={0}
          color="blue"
          animationDelay={180}
          icon={<BulletIcon />}
        />
        <MetricCard
          label="Team Avg Score"
          value={analytics?.averageScore ?? 0}
          decimals={2}
          color="accent"
          animationDelay={240}
          icon={<TrophyIcon />}
        />
        <MetricCard
          label="X-Ring Rate"
          value={analytics?.xRingRate ?? 0}
          decimals={1}
          color="emerald"
          unit="%"
          animationDelay={300}
          icon={<StarIcon />}
        />
        <MetricCard
          label="Pending Requests"
          value={analytics?.pendingRequests ?? 0}
          decimals={0}
          color="blue"
          animationDelay={360}
          icon={<ZapIcon />}
        />
        <MetricCard
          label="Upcoming 7 Days"
          value={analytics?.upcomingItems7d ?? 0}
          decimals={0}
          color="accent"
          animationDelay={420}
          icon={<FireIcon />}
        />
      </div>

      {/* Managed shooter creation */}
      <div className="card p-5 animate-slide-up stagger-2">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#00E5A0]/10 border border-[#00E5A0]/20 flex items-center justify-center shrink-0">
            <span className="text-[#00E5A0]"><TargetIcon /></span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
              Create Managed Shooter Profile
            </h3>
            <p className="text-[#4A5568] text-xs mt-0.5 mb-4">
              Use this for students without their own device/account. You can manage all training records for them.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Shooter name"
                value={managedForm.name}
                onChange={(e) => setManagedForm((prev) => ({ ...prev, name: e.target.value }))}
                className="field text-sm"
              />
              <input
                type="text"
                placeholder="Shooter ID"
                value={managedForm.shooterCode}
                onChange={(e) => setManagedForm((prev) => ({ ...prev, shooterCode: e.target.value }))}
                className="field text-sm uppercase"
              />
              <input
                type="text"
                placeholder="Primary weapon (optional)"
                value={managedForm.primaryWeapon ?? ''}
                onChange={(e) => setManagedForm((prev) => ({ ...prev, primaryWeapon: e.target.value }))}
                className="field text-sm"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => void handleCreateManagedShooter()}
                disabled={creatingManaged || !managedForm.name.trim() || !managedForm.shooterCode.trim()}
                className="btn btn-primary text-sm px-4 py-2 disabled:opacity-40"
              >
                {creatingManaged ? 'Creating…' : 'Create Managed Profile'}
              </button>
              {managedSuccess && <span className="text-[#00E5A0] text-xs">{managedSuccess}</span>}
              {managedError && <span className="text-[#FF4D6D] text-xs">{managedError}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card p-5 animate-slide-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
              Shooter Performance Summaries
            </h3>
            <Link
              href="/coach/shooters"
              className="text-xs text-accent hover:text-amber-300 font-display uppercase tracking-widest transition-colors"
            >
              Manage Shooters →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} animationDelay={i * 40} />)}
            </div>
          ) : shooterSummaries.length === 0 ? (
            <EmptyShootersState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-[#1E2433]">
                    <th className="text-left py-2.5 px-2 label">Shooter</th>
                    <th className="text-right py-2.5 px-2 label">Avg</th>
                    <th className="text-right py-2.5 px-2 label">Best</th>
                    <th className="text-right py-2.5 px-2 label">Sessions</th>
                    <th className="text-right py-2.5 px-2 label">Shots</th>
                    <th className="text-right py-2.5 px-2 label">Consistency</th>
                    <th className="text-right py-2.5 px-2 label">Last Session</th>
                  </tr>
                </thead>
                <tbody>
                  {shooterSummaries.slice(0, 12).map((summary) => {
                    const avg = summary.averageScore;
                    const tier = avg >= 9.5
                      ? { label: 'Gold', color: '#F5A623' }
                      : avg >= 9.0
                      ? { label: 'Silver', color: '#8892A4' }
                      : avg >= 8.0
                      ? { label: 'Bronze', color: '#CD7F32' }
                      : null;
                    return (
                      <tr key={summary.shooterId} className="border-b border-[#1E2433]/40 hover:bg-white/[0.015] transition-colors group">
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            {tier && (
                              <span className="text-[9px] font-display font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
                                style={{ color: tier.color, background: `${tier.color}15` }}>
                                {tier.label}
                              </span>
                            )}
                            <div>
                              <p className="text-[#F0F4FF] font-semibold text-sm">{summary.shooterName}</p>
                              <p className="text-[#4A5568] text-[10px]">
                                {summary.shooterCode ? `ID ${summary.shooterCode}` : 'Connected shooter'}
                                {summary.primaryWeapon ? ` · ${summary.primaryWeapon}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-data font-bold"
                          style={{ color: avg >= 9.5 ? '#F5A623' : avg >= 9.0 ? '#4FC3F7' : avg >= 8.0 ? '#00E5A0' : '#FF4D6D' }}>
                          {summary.averageScore.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-data text-[#F5A623]">{summary.bestScore.toFixed(1)}</td>
                        <td className="py-2.5 px-2 text-right font-data text-[#F0F4FF]">{summary.totalSessions}</td>
                        <td className="py-2.5 px-2 text-right font-data text-[#F0F4FF]">{summary.totalShots}</td>
                        <td className="py-2.5 px-2 text-right font-data text-[#4FC3F7]">{summary.consistency.toFixed(1)}</td>
                        <td className="py-2.5 px-2 text-right text-[#8892A4] text-xs">
                          {summary.lastSessionDate
                            ? formatSessionStart(summary.lastSessionDate, { includeYear: true })
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5 animate-slide-up stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
              Training Schedule & Tasks
            </h3>
            <Link
              href="/calendar"
              className="text-xs text-accent hover:text-amber-300 font-display uppercase tracking-widest transition-colors"
            >
              Open Calendar →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} animationDelay={i * 40} />)}
            </div>
          ) : schedule.length === 0 ? (
            <p className="text-[#4A5568] text-sm">No upcoming scheduled tasks.</p>
          ) : (
            <div className="space-y-3">
              {schedule.map((item) => (
                <div key={item.eventId} className="rounded-lg border border-[#1E2433] bg-[#161B26]/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[#F0F4FF] text-sm font-semibold truncate">{item.title}</p>
                    <span className="text-[10px] font-display uppercase tracking-wide text-[#4FC3F7]">
                      {item.eventType}
                    </span>
                  </div>
                  <p className="text-[#8892A4] text-xs mt-1">
                    {formatSessionStart(item.start, { includeYear: true })}
                  </p>
                  <p className="text-[#4A5568] text-[11px] mt-1">
                    {item.assigneeCount} assignee{item.assigneeCount !== 1 ? 's' : ''}{item.shooterNames.length > 0 ? ` · ${item.shooterNames.slice(0, 2).join(', ')}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {trendData.length > 1 && (
        <div className="card p-5 animate-slide-up stagger-5">
          <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide mb-4">
            Team Momentum (Recent Sessions)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={trendData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#1E2433" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#4A5568', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="score" tick={{ fill: '#4A5568', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="shots" orientation="right" tick={{ fill: '#4A5568', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip />} />
              <Bar yAxisId="shots" dataKey="shots" fill="#4FC3F7" fillOpacity={0.35} radius={[3, 3, 0, 0]} />
              <Line yAxisId="score" type="monotone" dataKey="avgScore" stroke="#F5A623" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card animate-slide-up stagger-6">
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">Recent Shooting Sessions</h3>
          <Link
            href="/sessions"
            className="text-xs text-accent hover:text-amber-300 font-display uppercase tracking-widest transition-colors"
          >
            All Sessions →
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto overscroll-x-contain">
          {loading ? (
            <div className="px-5 pb-4 space-y-0">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} animationDelay={i * 40} />)}
            </div>
          ) : recentSessions.length === 0 ? (
            <EmptySessionsState />
          ) : (
            <table className="w-full min-w-[880px] table-fixed text-sm" role="table">
              <thead className="bg-[rgba(10,13,18,0.92)]">
                <tr className="border-y border-[#1E2433]">
                  <th className="text-left py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap">Session Start</th>
                  <th className="text-left py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap">Shooter</th>
                  <th className="text-left py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap hidden md:table-cell">Discipline</th>
                  <th className="text-right py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap">Avg</th>
                  <th className="text-right py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap">Shots</th>
                  <th className="text-right py-3 px-5 text-[11px] font-display font-semibold uppercase tracking-[0.12em] text-[#64708C] whitespace-nowrap hidden lg:table-cell">Group R.</th>
                  <th className="py-3 px-5" />
                </tr>
              </thead>
              <tbody>
                {recentSessions.slice(0, 10).map((session, i) => (
                  <tr
                    key={session.sessionId}
                    className="table-row-hover border-b border-[#1E2433]/50 animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td className="py-3 px-5 whitespace-nowrap align-middle text-[#8892A4] text-xs">
                      {formatSessionStart(session.sessionDate, { includeYear: true })}
                    </td>
                    <td className="py-3 px-5 text-[#F0F4FF] font-semibold text-sm">{session.shooterName}</td>
                    <td className="py-3 px-5 text-[#8892A4] text-xs hidden md:table-cell">{session.discipline}</td>
                    <td className="py-3 px-5 text-right font-data font-bold text-[#00E5A0]">{session.averageScore.toFixed(2)}</td>
                    <td className="py-3 px-5 text-right score-value text-[#F0F4FF]">{session.totalShots}</td>
                    <td className="py-3 px-5 text-right score-value text-[#4FC3F7] hidden lg:table-cell">{session.groupRadius.toFixed(2)}</td>
                    <td className="py-3 px-5 text-right whitespace-nowrap align-middle">
                      <Link
                        href={`/sessions/${session.sessionId}?shooterId=${encodeURIComponent(session.shooterId)}`}
                        className="text-accent hover:text-amber-300 text-xs font-display font-semibold uppercase tracking-wide transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card p-5 animate-slide-up stagger-7">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#4FC3F7]/10 border border-[#4FC3F7]/20 flex items-center justify-center shrink-0">
            <span className="text-[#4FC3F7]"><ZapIcon /></span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
              Coach Operations Hub
            </h3>
            <p className="text-[#4A5568] text-xs mt-0.5 mb-4">
              Manage connections, invites, roster profiles, and detailed shooter records from one place.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/coach/shooters" className="btn btn-primary text-sm px-4">Open Shooter Manager</Link>
              <Link href="/calendar" className="btn btn-ghost text-sm px-4">Open Calendar</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
