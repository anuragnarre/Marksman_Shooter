// apps/web/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, ResponsiveContainer,
} from 'recharts';
import { apiFetch } from '../../lib/api';
import { shotColor } from '../../lib/draw-target';
import { formatSessionStart } from '../../lib/session-time';
import { useAuth } from '../../contexts/auth-context';
import { AppShell } from '../../components/AppShell';
import { MetricCard } from '../../components/ui/MetricCard';
import { TargetCanvas } from '../../components/TargetCanvas';
import { BiometricPulseWidget } from '../../components/BiometricPulseWidget';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { StaggerGrid, StaggerItem } from '../../components/StaggerGrid';
import type {
  Session, Shot,
  OverviewAnalytics, SessionTrendPoint,
} from '@shooting-platform/shared-types';

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <AppShell title="Dashboard">
      <ShooterView />
    </AppShell>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function computeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function useGreeting() {
  const [g, setG] = useState(computeGreeting);
  useEffect(() => {
    const id = setInterval(() => setG(computeGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);
  return g;
}

function fmtShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Simple tooltip ─────────────────────────────────────────────────────────────

function SimpleTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {label && <p className="text-text-muted mb-1.5 font-display uppercase tracking-widest text-[10px]">{label}</p>}
      {payload.map((e) => (
        <div key={e.name} className="flex items-center justify-between gap-4">
          <span className="text-text-secondary">{e.name}</span>
          <span className="font-data font-bold" style={{ color: e.color }}>{e.value.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Empty states ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" className="opacity-25 mb-4">
        {[22, 16, 10].map((r, i) => (
          <circle key={r} cx="26" cy="26" r={r} fill="none" stroke="#F5A623" strokeWidth="1"
            style={{ animation: `fadeIn 400ms ${i * 150}ms both` }} />
        ))}
        <circle cx="26" cy="26" r="2.5" fill="#F5A623" />
      </svg>
      <p className="text-text-primary font-display font-semibold text-lg">No sessions yet</p>
      <p className="text-text-muted text-sm mt-1 mb-5">Start your first session to see stats here.</p>
      <Link href="/sessions/new" className="btn btn-primary">Start first session</Link>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconChart() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="1,11 5,6.5 9,8.5 13,3.5" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M4.5 2h6v4.5a3 3 0 01-6 0V2z" />
      <path d="M2 3h2.5M10.5 3H13M7.5 8.5v3M6 13h3" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7.5" cy="7.5" r="6" />
      <circle cx="7.5" cy="7.5" r="3.5" />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconFire() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 13C5 13 3 11.2 3 8.8c0-2.1 1.7-3.4 1.7-3.4s-.4 2.5 1.7 2.5c0 0-.8-3.4 1.7-5.4 0 2.5 2.4 2.5 2.4 5a2.7 2.7 0 01-3 5z" />
    </svg>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

function ShooterView() {
  const { user } = useAuth();
  const greeting = useGreeting();
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [latestSessionDetail, setLatestSessionDetail] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<OverviewAnalytics>('/analytics/overview').catch(() => null),
      apiFetch<Session[]>('/sessions').catch(() => [] as Session[]),
    ]).then(([ov, sess]) => {
      setOverview(ov);
      setSessions(sess);
      if (sess.length > 0) {
        setLoadingDetail(true);
        apiFetch<Session>(`/sessions/${sess[0].id}`)
          .then(setLatestSessionDetail)
          .catch(() => null)
          .finally(() => setLoadingDetail(false));
      }
    }).finally(() => setLoading(false));
  }, []);

  const {
    trend, ringDist, recent5Avg, avgDelta,
    xRingPct, streak, trendChartData,
    latestShots, lastTrendPoint, trendMin,
    trendBySessionId,
  } = useMemo(() => {
    const trend = overview?.sessionTrend ?? [];
    const ringDist = overview?.ringDistribution ?? [];

    const recent5 = trend.slice(-5);
    const prior5  = trend.slice(-10, -5);
    const recent5Avg = recent5.length
      ? recent5.reduce((s, t) => s + t.avgScore, 0) / recent5.length : 0;
    const prior5Avg  = prior5.length
      ? prior5.reduce((s, t) => s + t.avgScore, 0) / prior5.length  : 0;
    const avgDelta = prior5.length ? recent5Avg - prior5Avg : undefined;

    const xRingTotal = trend.reduce((s, t) => s + t.xRingCount, 0);
    const xRingPct = overview?.totalShots
      ? (xRingTotal / overview.totalShots) * 100 : 0;

    let streak = 0;
    for (let i = trend.length - 1; i >= 0; i--) {
      if (trend[i].avgScore >= (overview?.overallAverage ?? 0)) streak++;
      else break;
    }

    const trendChartData = trend.map((t, i) => ({
      session: i + 1,
      date: fmtShort(t.date),
      avgScore: t.avgScore,
      bandHigh: Math.min(10.9, t.avgScore + t.stdDev),
      bandLow: Math.max(0, t.avgScore - t.stdDev),
    }));

    const latestShots = (latestSessionDetail?.shots ?? []) as Shot[];
    const lastTrendPoint = trend[trend.length - 1] as SessionTrendPoint | undefined;

    const scores = trendChartData.map(d => d.avgScore).filter(Boolean);
    const trendMin = scores.length ? Math.max(0, Math.min(...scores) - 0.5) : 0;

    const trendBySessionId = new Map<string, SessionTrendPoint>();
    for (const t of trend) trendBySessionId.set(t.sessionId, t);

    return {
      trend, ringDist, recent5Avg, avgDelta,
      xRingPct, streak, trendChartData,
      latestShots, lastTrendPoint, trendMin,
      trendBySessionId,
    };
  }, [overview, sessions, latestSessionDetail]);

  const last7Avgs = trend.slice(-7).map(t => t.avgScore);

  // Form status label
  const formStatus = useMemo(() => {
    if (!recent5Avg) return null;
    const diff = recent5Avg - (overview?.overallAverage ?? 0);
    if (diff > 0.1)  return { label: 'On form',   color: '#00E5A0' };
    if (diff < -0.1) return { label: 'Below avg',  color: '#FF4D6D' };
    return               { label: 'On track',   color: '#F5A623' };
  }, [recent5Avg, overview]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} animationDelay={i * 60} />)}
        </div>
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-text-primary leading-tight">
            {greeting}, {user?.name?.split(' ')[0]}.
          </h2>
          <div className="flex items-center gap-2.5 mt-1">
            <p className="text-text-secondary text-sm">
              {sessions.length > 0
                ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''} recorded`
                : 'No sessions yet'}
            </p>
            {formStatus && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px]
                           font-display font-bold uppercase tracking-wide"
                style={{
                  color: formStatus.color,
                  background: `${formStatus.color}18`,
                  border: `1px solid ${formStatus.color}35`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: formStatus.color }} />
                {formStatus.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/performance" className="btn btn-ghost text-sm hidden sm:inline-flex">
            Analytics
          </Link>
          <Link href="/sessions/new" className="btn btn-primary">
            + New Session
          </Link>
        </div>
      </div>

      {/* ── 4 KPI Cards ──────────────────────────────────────────────────── */}
      <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StaggerItem>
          <MetricCard
            label="Season Avg"
            value={overview?.overallAverage ?? 0}
            decimals={2}
            color="blue"
            delta={avgDelta}
            sparklineData={last7Avgs}
            icon={<IconChart />}
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
            icon={<IconTrophy />}
            animationDelay={60}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Total Shots"
            value={overview?.totalShots ?? 0}
            decimals={0}
            color="accent"
            unit={overview?.totalSessions ? `across ${overview.totalSessions} sessions` : undefined}
            icon={<IconTarget />}
            animationDelay={120}
          />
        </StaggerItem>
        <StaggerItem>
          <MetricCard
            label="Streak"
            value={streak}
            decimals={0}
            color="emerald"
            unit="above avg"
            icon={<IconFire />}
            animationDelay={180}
          />
        </StaggerItem>
      </StaggerGrid>

      {/* ── Marksman Pulse biometric widget ──────────────────────────────── */}
      <BiometricPulseWidget />

      {/* ── Sessions empty state ──────────────────────────────────────────── */}
      {sessions.length === 0 && <EmptyState />}

      {/* ── Score Trend chart ─────────────────────────────────────────────── */}
      {trend.length > 1 && (
        <div className="card p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-display font-semibold text-base text-text-primary tracking-wide">
                Score Trend
              </h3>
              <p className="text-text-muted text-xs mt-0.5">Average score per session</p>
            </div>
            {overview?.overallAverage != null && (
              <div className="text-right shrink-0">
                <p className="text-[10px] text-text-muted font-display uppercase tracking-widest">Overall avg</p>
                <p className="font-data font-bold text-[#F5A623] text-sm mt-0.5">
                  {overview.overallAverage.toFixed(2)}
                </p>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#F5A623" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[trendMin, 10.9]}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                axisLine={false}
                tickLine={false}
                tickCount={5}
              />
              <Tooltip content={<SimpleTooltip />} />
              {/* Confidence band */}
              <Area
                type="monotone" dataKey="bandHigh"
                fill="#F5A623" fillOpacity={0.07} stroke="none"
                animationDuration={800}
              />
              <Area
                type="monotone" dataKey="bandLow"
                fill="var(--bg-void)" fillOpacity={1} stroke="none"
                animationDuration={800}
              />
              {/* Score line */}
              <Area
                type="monotone" dataKey="avgScore"
                stroke="#F5A623" strokeWidth={2.5}
                fill="url(#scoreGrad)"
                dot={(props: { cx: number; cy: number; index: number; payload: { avgScore: number } }) => {
                  const above = props.payload.avgScore >= (overview?.overallAverage ?? 0);
                  return (
                    <circle
                      cx={props.cx} cy={props.cy}
                      r={above ? 3.5 : 2.5}
                      fill="#F5A623"
                      stroke="var(--bg-void)"
                      strokeWidth={1.5}
                    />
                  );
                }}
                activeDot={{ r: 5, fill: '#F5A623', stroke: 'var(--bg-void)', strokeWidth: 2 }}
                name="Avg Score"
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Target canvas + Score distribution ───────────────────────────── */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Last session target */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-base text-text-primary tracking-wide">
                  Last Session
                </h3>
                {sessions[0] && (
                  <p className="text-text-muted text-xs mt-0.5">{fmtShort(sessions[0].sessionDate.toString())}</p>
                )}
              </div>
              {sessions[0] && (
                <Link
                  href={`/sessions/${sessions[0].id}`}
                  className="text-accent text-xs font-display font-semibold uppercase tracking-wide
                             hover:text-amber-300 transition-colors"
                >
                  View →
                </Link>
              )}
            </div>

            {loadingDetail ? (
              <div className="flex justify-center items-center py-4">
                <div className="w-[260px] h-[260px] skeleton rounded-full" />
              </div>
            ) : latestShots.length > 0 ? (
              <>
                <div className="flex justify-center">
                  <TargetCanvas shots={latestShots} size={260} />
                </div>
                {lastTrendPoint && (
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border-subtle">
                    {[
                      { label: 'Avg Score', value: lastTrendPoint.avgScore.toFixed(2), color: shotColor(lastTrendPoint.avgScore) },
                      { label: 'Shots',     value: String(lastTrendPoint.totalShots),   color: 'var(--text-primary)' },
                      { label: 'X-Rings',   value: String(lastTrendPoint.xRingCount),   color: '#F5A623' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center">
                        <p className="label text-[9px]">{label}</p>
                        <p className="font-data font-bold text-lg mt-0.5" style={{ color }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-text-muted text-xs">
                No shots in this session
              </div>
            )}
          </div>

          {/* Score distribution */}
          <div className="card p-5">
            <div className="mb-4">
              <h3 className="font-display font-semibold text-base text-text-primary tracking-wide">
                Shot Distribution
              </h3>
              <p className="text-text-muted text-xs mt-0.5">Shots per scoring ring — all sessions</p>
            </div>

            {ringDist.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={ringDist} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                    <XAxis
                      dataKey="ring"
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload as { ring: string; count: number; pct: number; color: string };
                        return (
                          <div className="px-3 py-2 rounded-xl text-xs"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
                            <p className="font-data font-bold mb-1" style={{ color: d.color }}>{d.ring}</p>
                            <p className="text-text-secondary">{d.count} shots · <span style={{ color: d.color }}>{d.pct.toFixed(1)}%</span></p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out">
                      {ringDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Ring legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-border-subtle">
                  {ringDist.map((b) => (
                    <div key={b.ring} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.color }} />
                      <span className="text-[10px] font-display uppercase tracking-wide text-text-muted">{b.ring}</span>
                      <span className="font-data text-[10px] font-bold" style={{ color: b.color }}>{b.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-text-muted text-xs">
                No shot data yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Recent sessions list ──────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-display font-semibold text-base text-text-primary tracking-wide">
              Recent Sessions
            </h3>
            <Link
              href="/sessions"
              className="text-accent text-xs font-display font-semibold uppercase tracking-wide
                         hover:text-amber-300 transition-colors"
            >
              All →
            </Link>
          </div>

          <div>
            {sessions.slice(0, 6).map((s, i) => {
              const tp = trendBySessionId.get(s.id);
              const avg = tp?.avgScore;
              const avgCol = avg !== undefined ? shotColor(avg) : 'var(--text-muted)';
              return (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between px-5 py-3.5 gap-3
                             hover:bg-subtle transition-colors duration-150 active:bg-elevated"
                  style={{ borderBottom: '1px solid var(--border-subtle)', animationDelay: `${i * 30}ms` }}
                >
                  {/* Date + discipline */}
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">
                      {formatSessionStart(s.sessionDate)}
                    </p>
                    <div className="mt-0.5">
                      <StatusBadge variant="discipline" label={s.discipline} size="sm" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    {avg !== undefined && (
                      <div className="text-right">
                        <p className="text-[10px] text-text-muted font-display uppercase tracking-widest">Avg</p>
                        <p className="font-data font-bold text-sm" style={{ color: avgCol }}>{avg.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-text-muted font-display uppercase tracking-widest">Shots</p>
                      <p className="font-data font-bold text-sm text-text-primary">{tp?.totalShots ?? s.numberOfShots}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" className="text-text-muted shrink-0">
                      <polyline points="4,2 10,7 4,12" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── X-Ring stat footer ────────────────────────────────────────────── */}
      {trend.length > 0 && overview && (
        <div
          className="rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap"
          style={{
            background: 'linear-gradient(135deg, rgba(245,166,35,0.07) 0%, rgba(245,166,35,0.03) 100%)',
            border: '1px solid rgba(245,166,35,0.15)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.25)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#F5A623" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round">
                <polygon points="8,2 9.8,5.8 14,6.3 11,9.3 11.7,13.5 8,11.5 4.3,13.5 5,9.3 2,6.3 6.2,5.8" />
              </svg>
            </div>
            <div>
              <p className="text-text-primary font-display font-semibold text-sm">X-Ring performance</p>
              <p className="text-text-muted text-xs mt-0.5">
                {xRingPct.toFixed(1)}% of all shots in the X-ring
              </p>
            </div>
          </div>
          <Link href="/performance" className="btn btn-ghost text-xs shrink-0">
            Full analytics →
          </Link>
        </div>
      )}

    </div>
  );
}
