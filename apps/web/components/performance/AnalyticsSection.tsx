// apps/web/components/performance/AnalyticsSection.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, ComposedChart, Line,
  ScatterChart, Scatter, ZAxis, Legend,
} from 'recharts';
import { apiFetch } from '../../lib/api';
import { shotColor, RING_RADII } from '../../lib/draw-target';
import { SkeletonCard } from '../ui/SkeletonCard';
import { useIsMobile } from '../../lib/use-mobile';
import { useCoachShooter } from '../../lib/use-coach-shooter';
import type {
  OverviewAnalytics,
  SessionTrendPoint,
  Session,
  Shot,
} from '@shooting-platform/shared-types';

// ── Constants ────────────────────────────────────────────────────────────────

const C = {
  void:    'var(--bg-void)',
  surface: 'var(--bg-surface)',
  elevated:'var(--bg-elevated)',
  border:  'var(--bg-subtle)',
  amber:   '#F5A623',
  blue:    '#4FC3F7',
  red:     '#FF4D6D',
  green:   '#00E5A0',
  muted:   'var(--text-muted)',
  dim:     'var(--text-secondary)',
  text:    'var(--text-primary)',
} as const;

const AXIS = {
  tick:     { fill: C.muted, fontSize: 10, fontFamily: 'var(--font-jetbrains)' },
  axisLine: { stroke: C.border },
  tickLine: { stroke: C.border },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function avgScoreColor(score: number): string {
  if (score >= 9.5) return C.amber;
  if (score >= 9.0) return C.blue;
  if (score >= 8.0) return C.green;
  return C.red;
}

function radiusColor(r: number): string {
  if (r < 2) return C.green;
  if (r < 4) return C.blue;
  if (r < 6) return C.amber;
  return C.red;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateShort(iso: string): string {
  return iso.slice(5); // MM-DD
}

function computeMpi(shots: Shot[]): { x: number; y: number } {
  if (!shots.length) return { x: 0, y: 0 };
  const x = shots.reduce((s, sh) => s + sh.x, 0) / shots.length;
  const y = shots.reduce((s, sh) => s + sh.y, 0) / shots.length;
  return { x, y };
}

// ── Score Distribution Bins ────────────────────────────────────────────────

interface ScoreBin {
  label: string;
  min: number;
  max: number;
  color: string;
}

const SCORE_BINS: ScoreBin[] = [
  { label: '< 8',       min: 0,    max: 8.0,  color: C.red   },
  { label: '8.0–8.4',   min: 8.0,  max: 8.5,  color: C.red   },
  { label: '8.5–8.9',   min: 8.5,  max: 9.0,  color: C.amber },
  { label: '9.0–9.4',   min: 9.0,  max: 9.5,  color: C.green },
  { label: '9.5–9.9',   min: 9.5,  max: 10.0, color: C.green },
  { label: '10.0–10.4', min: 10.0, max: 10.5, color: C.blue  },
  { label: '10.5+',     min: 10.5, max: 11,   color: C.amber },
];

// ── GlassTooltip ──────────────────────────────────────────────────────────────

interface TooltipEntry {
  value: number | string;
  name?: string;
  color?: string;
  unit?: string;
}

function GlassTooltip({
  active,
  payload,
  label,
  extra,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  extra?: string;
  formatter?: (val: number | string, name?: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-glass px-3 py-2 min-w-[120px]">
      {label !== undefined && (
        <p className="text-[10px] font-display uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>
          {label}
        </p>
      )}
      {payload.map((p, i) => {
        const val = typeof p.value === 'number' ? p.value : Number(p.value);
        const display = formatter
          ? formatter(p.value, p.name)
          : typeof val === 'number'
          ? val.toFixed(2)
          : String(p.value);
        return (
          <div key={i} className="flex items-center gap-2 mt-0.5">
            {p.name && <span className="text-[9px] font-display uppercase tracking-wide" style={{ color: C.dim }}>{p.name}</span>}
            <span className="score-value text-sm font-bold tabular-nums" style={{ color: p.color ?? C.amber }}>
              {display}
              {extra && <span className="text-[9px] ml-1" style={{ color: C.muted }}>{extra}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Target Scatter Plot (Custom SVG) ──────────────────────────────────────────

interface TargetScatterProps {
  shots: Shot[];
  mpi: { x: number; y: number };
  size: number;
}

function TargetScatterPlot({ shots, mpi, size }: TargetScatterProps) {
  const center = size / 2;
  const maxRange = 10;
  const scale = (center * 0.92) / maxRange;

  function toSvg(worldX: number, worldY: number): [number, number] {
    return [center + worldX * scale, center - worldY * scale];
  }

  // Ring fill colors (lighter toward center)
  const ringFills = [
    'rgba(245,166,35,0.55)',  // 10.X innermost
    'rgba(245,166,35,0.28)',  // 10
    'rgba(79,195,247,0.20)',  // 9+
    'rgba(79,195,247,0.14)',
    'rgba(0,229,160,0.12)',
    'rgba(0,229,160,0.09)',
    'rgba(0,229,160,0.07)',
    'color-mix(in srgb, var(--bg-subtle) 50%, transparent)',
    'color-mix(in srgb, var(--bg-subtle) 40%, transparent)',
    'color-mix(in srgb, var(--bg-subtle) 30%, transparent)',
  ];

  return (
    <svg
      width={size}
      height={size}
      style={{ borderRadius: '50%', background: C.void, display: 'block' }}
    >
      {/* Rings */}
      {[...RING_RADII].reverse().map((r, idx) => (
        <circle
          key={idx}
          cx={center}
          cy={center}
          r={r * center * 0.92}
          fill={ringFills[RING_RADII.length - 1 - idx] ?? 'none'}
          stroke={C.border}
          strokeWidth={0.5}
        />
      ))}

      {/* Center crosshair guides */}
      <line x1={center} y1={0} x2={center} y2={size} stroke={C.border} strokeWidth={0.5} strokeDasharray="3 3" />
      <line x1={0} y1={center} x2={size} y2={center} stroke={C.border} strokeWidth={0.5} strokeDasharray="3 3" />

      {/* Shot dots */}
      {shots.map((sh) => {
        const [sx, sy] = toSvg(sh.x, sh.y);
        return (
          <circle
            key={sh.id}
            cx={sx}
            cy={sy}
            r={3}
            fill={shotColor(sh.score)}
            fillOpacity={0.85}
            stroke={C.void}
            strokeWidth={0.8}
          />
        );
      })}

      {/* MPI crosshair */}
      {shots.length > 0 && (() => {
        const [mx, my] = toSvg(mpi.x, mpi.y);
        return (
          <g>
            <line x1={mx - 8} y1={my} x2={mx + 8} y2={my} stroke={C.amber} strokeWidth={1.5} />
            <line x1={mx} y1={my - 8} x2={mx} y2={my + 8} stroke={C.amber} strokeWidth={1.5} />
            <circle cx={mx} cy={my} r={3} fill="none" stroke={C.amber} strokeWidth={1.5} />
          </g>
        );
      })()}
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  format,
  color,
  delay,
  badge,
  context,
}: {
  label: string;
  value: number;
  format: 'int' | 'float';
  color: string;
  delay: number;
  badge?: string;
  context?: string;
}) {
  return (
    <div className="card p-4 flex flex-col animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <p className="label text-[10px] mb-2">{label}</p>
      <p className="font-data font-bold text-2xl tabular-nums leading-none" style={{ color }}>
        {format === 'int' ? value.toLocaleString() : value.toFixed(2)}
      </p>
      {badge && (
        <span
          className="mt-2 self-start inline-block px-1.5 py-0.5 rounded text-[9px] font-display uppercase tracking-widest"
          style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
        >
          {badge}
        </span>
      )}
      {context && !badge && (
        <span className="mt-1.5 text-[10px] font-data" style={{ color: C.muted }}>{context}</span>
      )}
    </div>
  );
}

// ── Session Row ───────────────────────────────────────────────────────────────

function SessionRow({
  session,
  shooterIdQuery,
}: {
  session: SessionTrendPoint;
  shooterIdQuery?: string;
}) {
  return (
    <tr className="border-b hover:bg-elevated transition-colors group" style={{ borderColor: `${C.border}66` }}>
      <td className="py-2.5 px-5 font-data tabular-nums text-[11px]" style={{ color: C.dim }}>
        {fmtDate(session.date)}
      </td>
      <td className="py-2.5 px-4 text-xs hidden sm:table-cell" style={{ color: C.text }}>
        {session.discipline}
      </td>
      <td className="py-2.5 px-4 text-xs hidden md:table-cell" style={{ color: C.dim }}>
        {session.weaponType}
      </td>
      <td className="py-2.5 px-4 text-right font-data tabular-nums text-[11px]" style={{ color: C.dim }}>
        {session.totalShots}
      </td>
      <td className="py-2.5 px-4 text-right font-data font-bold tabular-nums text-[11px]"
        style={{ color: avgScoreColor(session.avgScore) }}>
        {session.avgScore.toFixed(2)}
      </td>
      <td className="py-2.5 px-4 text-right font-data tabular-nums text-[11px] hidden sm:table-cell"
        style={{ color: radiusColor(session.groupRadius) }}>
        {session.groupRadius.toFixed(2)}
      </td>
      <td className="py-2.5 px-4 text-right font-data tabular-nums text-[11px] hidden md:table-cell"
        style={{ color: C.amber }}>
        {session.xRingCount}
      </td>
      <td className="py-2.5 px-4 text-right font-data tabular-nums text-[11px] hidden lg:table-cell"
        style={{ color: C.muted }}>
        ±{session.stdDev.toFixed(3)}
      </td>
      <td className="py-2.5 px-5">
        <Link
          href={shooterIdQuery
            ? `/sessions/${session.sessionId}?shooterId=${encodeURIComponent(shooterIdQuery)}`
            : `/sessions/${session.sessionId}`}
          className="opacity-60 group-hover:opacity-100 transition-opacity text-[10px] font-display uppercase tracking-widest hover:underline"
          style={{ color: C.amber }}
        >
          View →
        </Link>
      </td>
    </tr>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="card p-16 text-center animate-slide-up">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: C.elevated }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={C.muted} strokeWidth="1.5">
          <path d="M14 3v4M14 21v4M3 14h4M21 14h4" strokeLinecap="round" />
          <circle cx="14" cy="14" r="8" />
          <circle cx="14" cy="14" r="3" />
        </svg>
      </div>
      <p className="font-display font-bold text-lg mb-2" style={{ color: C.text }}>No data yet</p>
      <p className="text-sm mb-6" style={{ color: C.muted }}>Record some sessions to see your performance analytics.</p>
      <Link href="/sessions/new" className="btn btn-primary text-sm">Start a Session</Link>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

interface SessionWithShots extends Session {
  shots?: Shot[];
}

export default function AnalyticsSection() {
  const isMobile = useIsMobile();
  const {
    isCoach,
    shooters,
    selectedShooterId,
    setSelectedShooterId,
  } = useCoachShooter();
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null);
  const [sessions, setSessions] = useState<SessionWithShots[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeapon, setSelectedWeapon] = useState<string | null>(null);

  const chartH = isMobile ? 200 : 260;
  const scatterSize = isMobile ? 300 : 360;

  useEffect(() => {
    if (isCoach && !selectedShooterId) {
      setOverview(null);
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const query = isCoach ? `?shooterId=${encodeURIComponent(selectedShooterId ?? '')}` : '';
    Promise.all([
      apiFetch<OverviewAnalytics>(`/analytics/overview${query}`),
      apiFetch<SessionWithShots[]>(`/sessions${query}`),
    ])
      .then(([ov, sess]) => {
        setOverview(ov);
        setSessions(sess);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isCoach, selectedShooterId]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const trend = overview?.sessionTrend ?? [];

  const weapons = useMemo(
    () => [...new Set(trend.map((s) => s.weaponType))],
    [trend],
  );

  const filtered = useMemo(
    () => (selectedWeapon ? trend.filter((s) => s.weaponType === selectedWeapon) : trend),
    [trend, selectedWeapon],
  );

  // All shots from all sessions (flattened)
  const allShots = useMemo(
    () => sessions.flatMap((s) => s.shots ?? []),
    [sessions],
  );

  const globalMpi = useMemo(() => computeMpi(allShots), [allShots]);

  // Per-session MPI drift data
  const mpiDriftData = useMemo(
    () =>
      sessions
        .filter((s) => s.shots && s.shots.length > 0)
        .map((s) => {
          const mpi = computeMpi(s.shots ?? []);
          const tp = trend.find((t) => t.sessionId === s.id);
          return {
            sessionId: s.id,
            date: s.sessionDate ? String(s.sessionDate).slice(0, 10) : '',
            x: mpi.x,
            y: mpi.y,
            avgScore: tp?.avgScore ?? 0,
          };
        }),
    [sessions, trend],
  );

  // Score distribution bins
  const scoreDistribution = useMemo(() => {
    return SCORE_BINS.map((bin) => ({
      label: bin.label,
      color: bin.color,
      count: allShots.filter((s) => s.score >= bin.min && s.score < bin.max).length,
      pct:
        allShots.length > 0
          ? (allShots.filter((s) => s.score >= bin.min && s.score < bin.max).length /
              allShots.length) *
            100
          : 0,
    }));
  }, [allShots]);

  // Radar data (normalize 0–100)
  const radarData = useMemo(() => {
    if (!overview) return [];
    const xRingPct = overview.ringDistribution.find((r) => r.ring === '10.X')?.pct ?? 0;
    const tenPlusPct = overview.ringDistribution
      .filter((r) => r.ring === '10' || r.ring === '10.X')
      .reduce((sum, r) => sum + r.pct, 0);
    const ninePlusPct = overview.ringDistribution
      .filter((r) => ['9', '10', '10.X'].includes(r.ring))
      .reduce((sum, r) => sum + r.pct, 0);
    return [
      { metric: 'Avg Score',   value: (overview.overallAverage / 10.9) * 100 },
      { metric: 'Best Avg',    value: (overview.bestSessionAvg / 10.9) * 100 },
      { metric: 'X-Ring %',   value: xRingPct },
      { metric: '10+ %',      value: tenPlusPct },
      { metric: 'Consistency',value: (overview.consistency / 10) * 100 },
      { metric: '9+ %',       value: ninePlusPct },
    ];
  }, [overview]);

  // Last 8 sessions for comparison
  const last8 = useMemo(() => {
    return [...trend]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-8)
      .map((s) => ({
        ...s,
        dateLabel: fmtDateShort(s.date),
        bestScore: allShots
          .filter((sh) => sh.sessionId === s.sessionId)
          .reduce((max, sh) => Math.max(max, sh.score), 0),
      }));
  }, [trend, allShots]);

  // Consistency trend per session
  const consistencyTrend = useMemo(
    () =>
      [...trend]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((s) => ({
          dateLabel: fmtDateShort(s.date),
          stdDev: s.stdDev,
          xRingPct: s.totalShots > 0 ? (s.xRingCount / s.totalShots) * 100 : 0,
        })),
    [trend],
  );

  // ── Loading / empty states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-[1400px] space-y-6">
        <div className="animate-slide-up h-8 w-48 rounded skeleton" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} animationDelay={i * 50} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard height={300} className="lg:col-span-2" />
          <SkeletonCard height={300} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonCard height={360} />
          <SkeletonCard height={360} />
        </div>
      </div>
    );
  }

  if (!overview || overview.totalSessions === 0) {
    return (
      <div className="max-w-[1400px]">
        <EmptyState />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1400px] space-y-6">

      {/* ── 1. Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-slide-up">
        <div className="flex items-center gap-2">
          <h1 className="font-display font-bold text-2xl" style={{ color: C.text }}>Analytics</h1>
          <span className="text-sm font-display uppercase tracking-widest" style={{ color: C.muted }}>
            / Performance Overview
          </span>
        </div>

        {/* Weapon filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedWeapon(null)}
            className="px-2.5 py-1 rounded text-[10px] font-display uppercase tracking-wide transition-all"
            style={{
              background: !selectedWeapon ? `${C.amber}20` : 'transparent',
              color: !selectedWeapon ? C.amber : C.muted,
            }}
          >
            All
          </button>
          {weapons.map((w) => (
            <button
              key={w}
              onClick={() => setSelectedWeapon(w === selectedWeapon ? null : w)}
              className="px-2.5 py-1 rounded text-[10px] font-display uppercase tracking-wide transition-all"
              style={{
                background: selectedWeapon === w ? `${C.blue}20` : 'transparent',
                color: selectedWeapon === w ? C.blue : C.muted,
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {isCoach && (
        <div className="card p-4 animate-slide-up">
          <label className="label block mb-2">Shooter</label>
          <select
            className="field w-full sm:max-w-sm"
            value={selectedShooterId ?? ''}
            onChange={(e) => setSelectedShooterId(e.target.value || null)}
          >
            {shooters.length === 0 && <option value="">No connected shooters</option>}
            {shooters.map((shooter) => (
              <option key={shooter.id} value={shooter.id}>
                {shooter.name}
                {shooter.shooterProfile?.isManaged ? ` (ID: ${shooter.shooterProfile.shooterCode})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── 2. KPI Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Sessions" value={overview.totalSessions} format="int"
          color={C.dim} delay={0} context={trend[0]?.discipline ?? ''}
        />
        <KpiCard
          label="Total Shots" value={overview.totalShots} format="int"
          color={C.dim} delay={50}
          context={`${overview.totalSessions > 0 ? (overview.totalShots / overview.totalSessions).toFixed(0) : 0} avg/session`}
        />
        <KpiCard
          label="Overall Avg" value={overview.overallAverage} format="float"
          color={overview.overallAverage >= 9.5 ? C.amber : C.blue} delay={100}
          context={overview.overallAverage >= 9.5 ? 'Elite tier' : 'Competitive'}
        />
        <KpiCard
          label="Best Shot" value={overview.bestScore} format="float"
          color={C.amber} delay={150}
          context={overview.bestScore >= 10.5 ? 'X-Ring hit' : '10-ring hit'}
        />
        <KpiCard
          label="Best Session" value={overview.bestSessionAvg} format="float"
          color={C.blue} delay={200}
          context="Session avg"
        />
        <KpiCard
          label="Consistency" value={overview.consistency} format="float"
          color={C.green} delay={250}
          badge={overview.consistency >= 8 ? 'Elite' : overview.consistency >= 6 ? 'Good' : 'Developing'}
        />
      </div>

      {/* ── 2b. Personal Bests Banner ──────────────────────────────────── */}
      {trend.length > 0 && (() => {
        const bestAvg    = Math.max(...trend.map(t => t.avgScore));
        const bestXRings = Math.max(...trend.map(t => t.xRingCount));
        const bestRadius = trend.filter(t => t.groupRadius > 0).length > 0
          ? Math.min(...trend.filter(t => t.groupRadius > 0).map(t => t.groupRadius))
          : null;
        const bestStdDev = trend.filter(t => t.stdDev > 0).length > 0
          ? Math.min(...trend.filter(t => t.stdDev > 0).map(t => t.stdDev))
          : null;
        return (
          <div className="animate-slide-up stagger-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-semibold text-xs uppercase tracking-widest" style={{ color: C.muted }}>
                Personal Bests
              </h2>
              <a href="/planning?tab=goals" className="text-[10px] font-display uppercase tracking-wide transition-colors hover:opacity-80"
                style={{ color: C.amber }}>
                Goals & Records →
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Best Session Avg', value: bestAvg.toFixed(2),   color: C.amber, icon: '⊕' },
                { label: 'Most X-Rings',     value: String(bestXRings),   color: C.blue,  icon: '✦' },
                { label: 'Tightest Group',   value: bestRadius ? bestRadius.toFixed(2) : '—', color: C.green, icon: '◎' },
                { label: 'Best Consistency', value: bestStdDev ? `σ ${bestStdDev.toFixed(3)}` : '—', color: C.green, icon: '≈' },
              ].map(pb => (
                <div key={pb.label} className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: `${pb.color}08`, border: `1px solid ${pb.color}20` }}>
                  <span className="text-lg shrink-0" style={{ color: pb.color }}>{pb.icon}</span>
                  <div className="min-w-0">
                    <p className="font-data font-bold text-lg leading-tight" style={{ color: pb.color }}>{pb.value}</p>
                    <p className="text-[9px] font-display uppercase tracking-wide truncate" style={{ color: C.muted }}>{pb.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── 3. Score Trend + Performance Radar ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-slide-up stagger-2">

        {/* Score Trend with ±stdDev band */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-4" style={{ color: C.text }}>
            Score Trend
          </h2>
          <ResponsiveContainer width="100%" height={chartH}>
            <AreaChart
              data={filtered.map((s) => ({
                ...s,
                bandHigh: s.avgScore + s.stdDev,
                bandLow: Math.max(0, s.avgScore - s.stdDev),
              }))}
              margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
            >
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.amber} stopOpacity={0.30} />
                  <stop offset="100%" stopColor={C.amber} stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.amber} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={C.amber} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" {...AXIS} tickFormatter={fmtDateShort}
                label={{ value: 'Session date', position: 'insideBottom', dy: 14, fontSize: 9, fill: C.muted }} />
              <YAxis domain={[
                (v: number) => Math.max(0, Math.floor(v - 0.5)),
                (v: number) => Math.min(10.9, Math.ceil(v + 0.3)),
              ]} {...AXIS} tickCount={5} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload as (SessionTrendPoint & { bandHigh: number; bandLow: number }) | undefined;
                  if (!d) return null;
                  return (
                    <div className="tooltip-glass px-3 py-2 min-w-[140px]">
                      <p className="text-[10px] font-display uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>
                        {fmtDate(String(label ?? d.date))}
                      </p>
                      <div className="flex justify-between gap-3 items-center">
                        <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>Avg</span>
                        <span className="font-data font-bold text-sm tabular-nums" style={{ color: C.amber }}>{d.avgScore.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-3 items-center">
                        <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>Std Dev</span>
                        <span className="font-data text-xs tabular-nums" style={{ color: C.dim }}>±{d.stdDev.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between gap-3 items-center">
                        <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>Shots</span>
                        <span className="font-data text-xs tabular-nums" style={{ color: C.dim }}>{d.totalShots}</span>
                      </div>
                    </div>
                  );
                }}
                cursor={{ stroke: C.amber, strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              {overview.overallAverage > 0 && (
                <ReferenceLine y={overview.overallAverage} stroke={`${C.amber}55`} strokeDasharray="6 4"
                  label={{ value: `AVG ${overview.overallAverage.toFixed(2)}`, position: 'right',
                    fontSize: 9, fill: C.amber, fontFamily: 'var(--font-rajdhani)', fontWeight: 700 }} />
              )}
              {/* stdDev band – high, rendered without stroke */}
              <Area type="monotone" dataKey="bandHigh" stroke="none" fill="url(#bandGrad)"
                fillOpacity={1} isAnimationActive={false} legendType="none" />
              {/* stdDev band – low, closes the band */}
              <Area type="monotone" dataKey="bandLow" stroke="none" fill={C.void}
                fillOpacity={1} isAnimationActive={false} legendType="none" />
              {/* Main score line */}
              <Area type="monotone" dataKey="avgScore" stroke={C.amber} strokeWidth={2}
                fill="url(#trendGrad)"
                dot={{ r: 3, fill: C.amber, stroke: C.surface, strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: C.amber, stroke: C.surface, strokeWidth: 2 }}
                isAnimationActive animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Radar */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-4" style={{ color: C.text }}>
            Performance Profile
          </h2>
          <ResponsiveContainer width="100%" height={chartH}>
            <RadarChart data={radarData} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
              <PolarGrid stroke={C.border} />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: C.muted, fontSize: 9, fontFamily: 'var(--font-rajdhani)' }}
              />
              <Radar dataKey="value" stroke={C.amber} fill={C.amber} fillOpacity={0.15}
                dot={{ r: 3, fill: C.amber }}
                isAnimationActive animationDuration={1000} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="tooltip-glass px-2 py-1.5">
                      <p className="text-[10px] font-display uppercase tracking-wide" style={{ color: C.muted }}>{label}</p>
                      <p className="score-value text-sm font-bold tabular-nums" style={{ color: C.amber }}>
                        {Number(payload[0]?.value ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  ) : null
                }
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 4. Shot Grouping + MPI Drift ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up stagger-3">

        {/* Custom SVG Shot Scatter */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-4" style={{ color: C.text }}>
            Shot Grouping — All Sessions
          </h2>
          <div className="flex flex-col items-center gap-4">
            {allShots.length === 0 ? (
              <p className="text-sm py-12" style={{ color: C.muted }}>No shot coordinate data available.</p>
            ) : (
              <TargetScatterPlot shots={allShots} mpi={globalMpi} size={scatterSize} />
            )}
            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center pt-2">
              {[
                { label: '10.5+ (X)', color: C.amber },
                { label: '10.0+',     color: C.blue  },
                { label: '9.0+',      color: C.green },
                { label: '< 9.0',     color: C.red   },
                { label: 'MPI',       color: C.amber, crosshair: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  {item.crosshair ? (
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <line x1="7" y1="0" x2="7" y2="14" stroke={item.color} strokeWidth="1.5" />
                      <line x1="0" y1="7" x2="14" y2="7" stroke={item.color} strokeWidth="1.5" />
                      <circle cx="7" cy="7" r="3" fill="none" stroke={item.color} strokeWidth="1.5" />
                    </svg>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  )}
                  <span className="text-[9px] font-display uppercase tracking-wide" style={{ color: C.muted }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-data" style={{ color: C.muted }}>
              {allShots.length} shots plotted · MPI ({globalMpi.x.toFixed(2)}, {globalMpi.y.toFixed(2)})
            </p>
          </div>
        </div>

        {/* MPI Drift Chart */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-4" style={{ color: C.text }}>
            MPI Drift by Session
          </h2>
          {mpiDriftData.length < 2 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm" style={{ color: C.muted }}>At least 2 sessions with shots needed.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={chartH}>
              <ScatterChart margin={{ top: 16, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
                <XAxis
                  type="number" dataKey="x" name="Horizontal (X)"
                  domain={[-2, 2]} {...AXIS}
                  label={{ value: 'Horizontal (X)', position: 'insideBottom', dy: 14, fontSize: 9, fill: C.muted }}
                />
                <YAxis
                  type="number" dataKey="y" name="Vertical (Y)"
                  domain={[-2, 2]} {...AXIS}
                  label={{ value: 'Vertical (Y)', angle: -90, position: 'insideLeft', dx: 10, fontSize: 9, fill: C.muted }}
                />
                <ZAxis range={[40, 40]} />
                <ReferenceLine x={0} stroke={C.border} strokeDasharray="4 4" />
                <ReferenceLine y={0} stroke={C.border} strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: C.border }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload as typeof mpiDriftData[0] | undefined;
                    if (!d) return null;
                    return (
                      <div className="tooltip-glass px-3 py-2">
                        <p className="text-[10px] font-display uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>
                          {d.date ? fmtDate(d.date) : 'Session'}
                        </p>
                        <div className="flex justify-between gap-3">
                          <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>X</span>
                          <span className="font-data text-sm tabular-nums" style={{ color: C.blue }}>{d.x.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>Y</span>
                          <span className="font-data text-sm tabular-nums" style={{ color: C.blue }}>{d.y.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>Avg</span>
                          <span className="font-data text-sm font-bold tabular-nums" style={{ color: avgScoreColor(d.avgScore) }}>{d.avgScore.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={mpiDriftData}
                  line={{ stroke: `${C.blue}50`, strokeWidth: 1.5 }}
                  lineType="joint"
                  fill={C.blue}
                  fillOpacity={0.85}
                  shape={(props: unknown) => {
                    const p = props as { cx?: number; cy?: number; payload?: typeof mpiDriftData[0] };
                    const cx = p.cx ?? 0;
                    const cy = p.cy ?? 0;
                    const clr = p.payload ? avgScoreColor(p.payload.avgScore) : C.blue;
                    return (
                      <circle
                        cx={cx} cy={cy} r={5}
                        fill={clr} stroke={C.surface} strokeWidth={1.5}
                      />
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
          <p className="text-[10px] font-display uppercase tracking-wide mt-2" style={{ color: C.muted }}>
            Each point = session MPI. Dot color = avg score tier.
          </p>
        </div>
      </div>

      {/* ── 5. Score Distribution + Consistency Trend ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up stagger-4">

        {/* Score Distribution Histogram */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-4" style={{ color: C.text }}>
            Score Distribution
          </h2>
          <ResponsiveContainer width="100%" height={chartH}>
            <BarChart data={scoreDistribution} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
              barCategoryGap="20%">
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" {...AXIS} />
              <YAxis allowDecimals={false} {...AXIS} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload as { count: number; pct: number; color: string } | undefined;
                  return (
                    <div className="tooltip-glass px-3 py-2">
                      <p className="text-[10px] font-display uppercase tracking-widest mb-1" style={{ color: C.muted }}>{label}</p>
                      <p className="font-data font-bold text-sm tabular-nums" style={{ color: d?.color ?? C.amber }}>
                        {d?.count} shots
                      </p>
                      <p className="font-data text-xs tabular-nums" style={{ color: C.dim }}>
                        {d?.pct.toFixed(1)}%
                      </p>
                    </div>
                  );
                }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={900}>
                {scoreDistribution.map((bin) => (
                  <Cell key={bin.label} fill={bin.color} fillOpacity={0.85}
                    style={{ filter: `drop-shadow(0 0 3px ${bin.color}50)` }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Consistency Trend */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-4" style={{ color: C.text }}>
            Consistency Trend
          </h2>
          <ResponsiveContainer width="100%" height={chartH}>
            <ComposedChart data={consistencyTrend} margin={{ top: 8, right: 40, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dateLabel" {...AXIS} />
              <YAxis yAxisId="left" {...AXIS} tickCount={5}
                label={{ value: 'Std Dev', angle: -90, position: 'insideLeft', dx: 16, fontSize: 9, fill: C.muted }} />
              <YAxis yAxisId="right" orientation="right" {...AXIS} tickCount={5} unit="%"
                label={{ value: 'X-Ring %', angle: 90, position: 'insideRight', dx: -10, fontSize: 9, fill: C.muted }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const stdDev = (payload.find((p) => p.name === 'stdDev')?.value as number) ?? 0;
                  const xPct  = (payload.find((p) => p.name === 'xRingPct')?.value as number) ?? 0;
                  return (
                    <div className="tooltip-glass px-3 py-2">
                      <p className="text-[10px] font-display uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>{label}</p>
                      <div className="flex justify-between gap-3">
                        <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>Std Dev</span>
                        <span className="font-data text-sm tabular-nums" style={{ color: stdDev > 1 ? C.red : C.green }}>{stdDev.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>X-Ring %</span>
                        <span className="font-data text-sm tabular-nums" style={{ color: C.amber }}>{xPct.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                }}
                cursor={{ stroke: C.border, strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <ReferenceLine yAxisId="left" y={1.0} stroke={`${C.red}60`} strokeDasharray="6 4"
                label={{ value: 'Threshold', position: 'right', fontSize: 8, fill: C.red }} />
              <Bar yAxisId="right" dataKey="xRingPct" name="xRingPct" fill={C.amber} fillOpacity={0.5}
                radius={[2, 2, 0, 0]} barSize={isMobile ? 6 : 10} isAnimationActive animationDuration={900} />
              <Line yAxisId="left" type="monotone" dataKey="stdDev" name="stdDev"
                stroke={C.red} strokeWidth={2}
                dot={(props: Record<string, unknown>) => {
                  const cx = Number(props.cx ?? 0);
                  const cy = Number(props.cy ?? 0);
                  const val = Number(props.value ?? 0);
                  return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3}
                    fill={val > 1 ? C.red : C.green} stroke={C.surface} strokeWidth={1.5} />;
                }}
                isAnimationActive animationDuration={1200} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 6. Session Comparison — Last 8 ───────────────────────────────── */}
      <div className="card p-5 animate-slide-up stagger-5">
        <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-4" style={{ color: C.text }}>
          Session Comparison — Last 8 Sessions
        </h2>
        {last8.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: C.muted }}>Not enough sessions.</p>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
            <ComposedChart data={last8} margin={{ top: 8, right: 40, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dateLabel" {...AXIS} />
              <YAxis yAxisId="score" domain={[
                (v: number) => Math.max(0, Math.floor(v - 0.5)),
                (v: number) => Math.min(10.9, Math.ceil(v + 0.3)),
              ]} {...AXIS} tickCount={5} />
              <YAxis yAxisId="radius" orientation="right" {...AXIS} tickCount={5}
                label={{ value: 'Group Radius', angle: 90, position: 'insideRight', dx: -8, fontSize: 9, fill: C.muted }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload as typeof last8[0] | undefined;
                  return (
                    <div className="tooltip-glass px-3 py-2 min-w-[150px]">
                      <p className="text-[10px] font-display uppercase tracking-widest mb-1.5" style={{ color: C.muted }}>{label}</p>
                      <div className="flex justify-between gap-4">
                        <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>Avg Score</span>
                        <span className="font-data font-bold text-sm tabular-nums" style={{ color: C.amber }}>{d?.avgScore.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>Best Shot</span>
                        <span className="font-data text-sm tabular-nums" style={{ color: C.blue }}>{d?.bestScore.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>Group Radius</span>
                        <span className="font-data text-sm tabular-nums" style={{ color: radiusColor(d?.groupRadius ?? 0) }}>{d?.groupRadius.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[9px] font-display uppercase" style={{ color: C.dim }}>Shots</span>
                        <span className="font-data text-sm tabular-nums" style={{ color: C.dim }}>{d?.totalShots}</span>
                      </div>
                    </div>
                  );
                }}
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, fontFamily: 'var(--font-rajdhani)', color: C.dim, paddingTop: 8 }}
                formatter={(value: string) => {
                  const map: Record<string, string> = {
                    avgScore:    'Avg Score',
                    bestScore:   'Best Shot',
                    groupRadius: 'Group Radius',
                  };
                  return map[value] ?? value;
                }}
              />
              <Bar yAxisId="score" dataKey="avgScore" name="avgScore"
                fill={C.amber} fillOpacity={0.75} radius={[3, 3, 0, 0]}
                barSize={isMobile ? 10 : 16} isAnimationActive animationDuration={900} />
              <Bar yAxisId="score" dataKey="bestScore" name="bestScore"
                fill={C.blue} fillOpacity={0.65} radius={[3, 3, 0, 0]}
                barSize={isMobile ? 10 : 16} isAnimationActive animationDuration={900} />
              <Line yAxisId="radius" type="monotone" dataKey="groupRadius" name="groupRadius"
                stroke={C.red} strokeWidth={2}
                dot={{ r: 3, fill: C.red, stroke: C.surface, strokeWidth: 1.5 }}
                activeDot={{ r: 5 }}
                isAnimationActive animationDuration={1200} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 7. Ring Distribution + Group Radius Trend ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-slide-up stagger-6">

        {/* Ring Distribution */}
        <div className="card p-5">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide mb-4" style={{ color: C.text }}>
            All-Time Ring Distribution
          </h2>
          <div className="space-y-2.5 mb-4">
            {[...overview.ringDistribution].reverse().map((bucket) => (
              <div key={bucket.ring} className="flex items-center gap-3">
                <span className="w-10 text-[11px] font-display font-bold text-right shrink-0"
                  style={{ color: bucket.color }}>
                  {bucket.ring}
                </span>
                <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: C.border }}>
                  <div
                    className="h-full rounded flex items-center pl-2 transition-all duration-700"
                    style={{
                      width: `${bucket.pct}%`,
                      background: `${bucket.color}28`,
                      borderLeft: `2px solid ${bucket.color}`,
                      minWidth: bucket.count > 0 ? '20px' : '0',
                    }}
                  >
                    {bucket.pct > 8 && (
                      <span className="text-[10px] font-data font-bold tabular-nums"
                        style={{ color: bucket.color }}>
                        {bucket.pct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-data w-14 text-right tabular-nums shrink-0"
                  style={{ color: C.muted }}>
                  {bucket.count} shots
                </span>
              </div>
            ))}
          </div>

          {/* Mini bar chart */}
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={overview.ringDistribution} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
              barCategoryGap="25%">
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="ring" {...AXIS} />
              <YAxis allowDecimals={false} {...AXIS} />
              <Tooltip content={<GlassTooltip extra="shots" />}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={900}>
                {overview.ringDistribution.map((b) => (
                  <Cell key={b.ring} fill={b.color} fillOpacity={0.85}
                    style={{ filter: `drop-shadow(0 0 3px ${b.color}50)` }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Group Radius Trend */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-4">
            <h2 className="font-display font-bold text-sm uppercase tracking-wide" style={{ color: C.text }}>
              Group Radius per Session
            </h2>
            <span className="text-[9px] font-display uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{ color: C.muted, background: C.elevated }}>
              lower = better
            </span>
          </div>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
            <AreaChart data={filtered} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="grGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.blue} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" {...AXIS} tickFormatter={fmtDateShort} />
              <YAxis {...AXIS} />
              <Tooltip content={<GlassTooltip extra="radius" />}
                cursor={{ stroke: C.blue, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <ReferenceLine y={4} stroke={`${C.red}40`} strokeDasharray="6 4"
                label={{ value: 'Developing (4)', position: 'right', fontSize: 8, fill: C.red }} />
              <ReferenceLine y={2} stroke={`${C.green}40`} strokeDasharray="6 4"
                label={{ value: 'Elite (2)', position: 'right', fontSize: 8, fill: C.green }} />
              <Area type="monotone" dataKey="groupRadius" stroke={C.blue} strokeWidth={2}
                fill="url(#grGrad)"
                dot={{ r: 3, fill: C.blue, stroke: C.surface, strokeWidth: 1.5 }}
                isAnimationActive animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legend row */}
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t" style={{ borderColor: C.border }}>
            {[
              { label: '< 2 Elite',        color: C.green },
              { label: '2–4 Competitive',  color: C.blue  },
              { label: '4–6 Developing',   color: C.amber },
              { label: '> 6 Needs Work',   color: C.red   },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-[9px] font-display uppercase tracking-wide" style={{ color: C.muted }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 8. Session History Table ─────────────────────────────────────── */}
      <div className="card animate-slide-up stagger-7">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b" style={{ borderColor: C.border }}>
          <h2 className="font-display font-bold text-sm uppercase tracking-wide" style={{ color: C.text }}>
            Session History
            <span className="ml-2 font-data text-xs normal-case tracking-normal" style={{ color: C.muted }}>
              ({overview.totalSessions} sessions)
            </span>
          </h2>
          <Link
            href={isCoach && selectedShooterId
              ? `/sessions?shooterId=${encodeURIComponent(selectedShooterId)}`
              : '/sessions'}
            className="btn btn-ghost text-xs py-1.5"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: C.border }}>
                <th className="label py-2.5 px-5 text-left text-[10px]">Date</th>
                <th className="label py-2.5 px-4 text-left text-[10px] hidden sm:table-cell">Discipline</th>
                <th className="label py-2.5 px-4 text-left text-[10px] hidden md:table-cell">Weapon</th>
                <th className="label py-2.5 px-4 text-right text-[10px]">Shots</th>
                <th className="label py-2.5 px-4 text-right text-[10px]">Avg Score</th>
                <th className="label py-2.5 px-4 text-right text-[10px] hidden sm:table-cell">Group Radius</th>
                <th className="label py-2.5 px-4 text-right text-[10px] hidden md:table-cell">X-Ring</th>
                <th className="label py-2.5 px-4 text-right text-[10px] hidden lg:table-cell">Std Dev</th>
                <th className="py-2.5 px-5 text-[10px]" />
              </tr>
            </thead>
            <tbody>
              {[...overview.sessionTrend]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 20)
                .map((s) => (
                  <SessionRow key={s.sessionId} session={s} shooterIdQuery={isCoach ? selectedShooterId ?? undefined : undefined} />
                ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
