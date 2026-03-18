// apps/web/app/soldier/analytics/page.tsx — Military Field Analytics
'use client';

// Full military-grade analytics: qualification tiers, readiness score,
// combat readiness breakdown, weapon performance radar, training tempo.

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  AreaChart, Area, LineChart, Line,
} from 'recharts';
import { apiFetch } from '../../../lib/api';
import { formatSessionStart } from '../../../lib/session-time';
import { AppShell } from '../../../components/AppShell';
import { SkeletonCard, SkeletonRow } from '../../../components/ui/SkeletonCard';
import type { Session, WeaponPerformance, OverviewAnalytics } from '@shooting-platform/shared-types';
import { TRAINING_MODES, TRAINING_MODE_COLORS } from '@shooting-platform/shared-types';

// ── Military qualification standards ─────────────────────────────────────────
// Based on ISSF / Indian Army classification levels

const QUAL_TIERS = [
  { label: 'Grand Master',  minAvg: 10.5,  color: '#F5A623', bg: 'rgba(245,166,35,0.12)',  border: 'rgba(245,166,35,0.35)' },
  { label: 'Master',        minAvg: 10.0,  color: '#4FC3F7', bg: 'rgba(79,195,247,0.10)',  border: 'rgba(79,195,247,0.3)'  },
  { label: 'Expert',        minAvg: 9.5,   color: '#00E5A0', bg: 'rgba(0,229,160,0.08)',   border: 'rgba(0,229,160,0.25)'  },
  { label: 'Sharpshooter',  minAvg: 9.0,   color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)'},
  { label: 'Marksman',      minAvg: 8.0,   color: '#8892A4', bg: 'rgba(136,146,164,0.06)', border: 'rgba(136,146,164,0.2)' },
  { label: 'Qualified',     minAvg: 0,     color: '#4A5568', bg: 'rgba(74,85,104,0.04)',   border: 'rgba(74,85,104,0.15)'  },
] as const;

function getQualTier(avg: number) {
  return QUAL_TIERS.find(t => avg >= t.minAvg) ?? QUAL_TIERS[QUAL_TIERS.length - 1];
}

// ── Training mode colours ─────────────────────────────────────────────────────

const MODE_ICONS: Record<string, string> = {
  'Marksmanship':         '◎',
  'Rapid Fire':           '◈',
  'Field Exercise':       '◉',
  'Combat Simulation':    '⊕',
  'Qualification':        '✦',
};

// ── Axis/chart style constants ────────────────────────────────────────────────

const AXIS = {
  tick:     { fill: '#4A5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' },
  axisLine: { stroke: '#1E2433' },
  tickLine: { stroke: '#1E2433' },
};

// ── Readiness score calculator ─────────────────────────────────────────────────
// 0–100 score from: recent avg, consistency, training frequency, session count

function calcReadiness(
  overview: OverviewAnalytics | null,
  sessions: Session[],
): { score: number; breakdown: { label: string; value: number; max: number; color: string }[] } {
  if (!overview || sessions.length === 0) {
    return { score: 0, breakdown: [] };
  }

  const trend = overview.sessionTrend ?? [];

  // 1. Scoring component (0–40): based on recent avg vs max possible
  const recentAvg = trend.slice(-5).reduce((s, t) => s + t.avgScore, 0) / Math.max(trend.slice(-5).length, 1);
  const scoringPts = Math.round((recentAvg / 10.9) * 40);

  // 2. Consistency component (0–25): lower stdDev = higher score
  const avgStdDev = trend.reduce((s, t) => s + t.stdDev, 0) / Math.max(trend.length, 1);
  const consistencyPts = Math.round(Math.max(0, 25 - avgStdDev * 12));

  // 3. Frequency component (0–20): sessions in last 30 days
  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() - 30);
  const recentCount = sessions.filter(s => new Date(s.sessionDate) >= cutoff30).length;
  const frequencyPts = Math.min(20, Math.round(recentCount * 4));

  // 4. Volume component (0–15): total shots
  const volumePts = Math.min(15, Math.round((overview.totalShots / 200) * 15));

  const score = Math.min(100, scoringPts + consistencyPts + frequencyPts + volumePts);

  return {
    score,
    breakdown: [
      { label: 'Accuracy',    value: scoringPts,     max: 40, color: '#F5A623' },
      { label: 'Consistency', value: consistencyPts, max: 25, color: '#4FC3F7' },
      { label: 'Frequency',   value: frequencyPts,   max: 20, color: '#00E5A0' },
      { label: 'Volume',      value: volumePts,      max: 15, color: '#A78BFA' },
    ],
  };
}

function readinessLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Combat Ready',    color: '#00E5A0' };
  if (score >= 70) return { label: 'Mission Ready',   color: '#F5A623' };
  if (score >= 50) return { label: 'Training Ready',  color: '#4FC3F7' };
  if (score >= 30) return { label: 'Developing',      color: '#A78BFA' };
  return              { label: 'Basic Level',        color: '#4A5568' };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SoldierAnalyticsPage() {
  const [sessions,  setSessions]  = useState<Session[]>([]);
  const [weapons,   setWeapons]   = useState<WeaponPerformance[]>([]);
  const [overview,  setOverview]  = useState<OverviewAnalytics | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [filterWeapon, setFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'overview' | 'weapons' | 'history'>('overview');

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

  const trend = overview?.sessionTrend ?? [];
  const { score: readiness, breakdown: readinessBD } = useMemo(
    () => calcReadiness(overview, sessions), [overview, sessions],
  );
  const readinessStatus = readinessLabel(readiness);

  const qualTier = useMemo(
    () => getQualTier(overview?.overallAverage ?? 0), [overview],
  );

  // Training mode breakdown
  const modeBreakdown = useMemo(() => {
    return TRAINING_MODES.map(m => ({
      mode:  m,
      icon:  MODE_ICONS[m] ?? '◆',
      count: sessions.filter(s => s.trainingMode === m).length,
      color: TRAINING_MODE_COLORS[m] ?? '#8892A4',
    })).sort((a, b) => b.count - a.count);
  }, [sessions]);

  // Weapon radar data
  const radarData = useMemo(() => {
    if (!weapons.length) return [];
    return weapons.slice(0, 6).map(w => ({
      weapon: w.weaponType.length > 12 ? w.weaponType.slice(0, 12) + '…' : w.weaponType,
      score:  parseFloat(w.averageScore.toFixed(2)),
      best:   parseFloat(w.bestScore.toFixed(2)),
    }));
  }, [weapons]);

  // Score trend for last 12 sessions
  const scoreTrend = useMemo(() =>
    trend.slice(-12).map((t, i) => ({
      n:     i + 1,
      date:  new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avg:   parseFloat(t.avgScore.toFixed(2)),
      xRings: t.xRingCount,
    })),
    [trend],
  );

  const weaponOptions = ['All', ...weapons.map(w => w.weaponType)];
  const filtered = filterWeapon === 'All' ? sessions : sessions.filter(s => s.weaponType === filterWeapon);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'weapons',  label: 'Weapons' },
    { id: 'history',  label: 'History' },
  ] as const;

  return (
    <AppShell title="Field Analytics">
      <div className="space-y-6">

        {/* Header */}
        <div className="animate-slide-up flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-[#F0F4FF]">Field Analytics</h1>
            <p className="text-[#4A5568] text-sm mt-1">
              Combat readiness, qualification status, and weapon performance.
            </p>
          </div>
          <Link href="/sessions/new" className="btn btn-primary shrink-0">
            + Log Session
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0,1,2].map(i => <SkeletonCard key={i} height={120} animationDelay={i * 60} />)}
          </div>
        ) : (
          <>
            {/* ── Top row: Readiness + Qualification ──────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">

              {/* Readiness score */}
              <div
                className="relative rounded-xl p-5 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 80% 20%, ${readinessStatus.color}10 0%, transparent 60%)`,
                  }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: readinessStatus.color, boxShadow: `0 0 8px ${readinessStatus.color}` }}
                    />
                    <p className="font-display font-semibold text-sm text-[#F0F4FF]">Combat Readiness</p>
                  </div>

                  <div className="flex items-end gap-4 mb-4">
                    <ReadinessDial score={readiness} color={readinessStatus.color} />
                    <div>
                      <p className="font-data font-black text-4xl leading-none" style={{ color: readinessStatus.color }}>
                        {readiness}
                      </p>
                      <p className="text-[10px] font-display uppercase tracking-widest mt-1" style={{ color: readinessStatus.color }}>
                        {readinessStatus.label}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {readinessBD.map(bd => (
                      <ReadinessRow key={bd.label} {...bd} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Qualification tier */}
              <div
                className="relative rounded-xl p-5 overflow-hidden"
                style={{ background: qualTier.bg, border: `1px solid ${qualTier.border}` }}
              >
                <div className="absolute top-0 inset-x-0 h-px"
                  style={{ background: `linear-gradient(90deg,transparent,${qualTier.color}70,transparent)` }}
                />
                <p className="font-display font-semibold text-sm text-[#F0F4FF] mb-3">Qualification Status</p>

                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: `${qualTier.color}12`, border: `1px solid ${qualTier.color}30` }}
                  >
                    ✦
                  </div>
                  <div>
                    <p className="font-display font-black text-2xl" style={{ color: qualTier.color }}>
                      {qualTier.label}
                    </p>
                    <p className="text-[#8892A4] text-xs mt-0.5">
                      {overview?.overallAverage ? `${overview.overallAverage.toFixed(2)} overall avg` : 'No data'}
                    </p>
                  </div>
                </div>

                {/* Tier ladder */}
                <div className="space-y-1">
                  {[...QUAL_TIERS].reverse().map(t => {
                    const reached = (overview?.overallAverage ?? 0) >= t.minAvg;
                    const current = t.label === qualTier.label;
                    return (
                      <div key={t.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: reached ? t.color : '#1E2433',
                              boxShadow: current ? `0 0 6px ${t.color}` : 'none',
                            }}
                          />
                          <span
                            className="text-[10px] font-display"
                            style={{ color: current ? t.color : reached ? '#8892A4' : '#4A5568', fontWeight: current ? 700 : 400 }}
                          >
                            {t.label}
                          </span>
                          {current && (
                            <span className="text-[8px] font-display uppercase tracking-widest px-1.5 py-0.5 rounded"
                              style={{ color: t.color, background: `${t.color}15` }}>Current</span>
                          )}
                        </div>
                        <span className="text-[9px] font-data" style={{ color: '#4A5568' }}>
                          {t.minAvg > 0 ? `≥ ${t.minAvg.toFixed(1)}` : 'Any'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Quick stats row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up stagger-2">
              {[
                { label: 'Total Sessions',   value: String(overview?.totalSessions ?? 0),    color: '#F5A623' },
                { label: 'Total Shots',      value: String(overview?.totalShots ?? 0),        color: '#4FC3F7' },
                { label: 'Best Session Avg', value: overview?.bestSessionAvg.toFixed(2) ?? '—', color: '#00E5A0' },
                { label: 'Weapons Used',     value: String(weapons.length),                  color: '#A78BFA' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card p-4">
                  <p className="text-[10px] font-display uppercase tracking-widest" style={{ color: '#4A5568' }}>{label}</p>
                  <p className="font-data font-bold text-2xl mt-1" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────── */}
            <div className="flex gap-1 p-1 rounded-xl animate-slide-up" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-display font-semibold transition-all duration-200"
                  style={{
                    background: activeTab === t.id ? 'rgba(0,229,160,0.1)' : 'transparent',
                    color:      activeTab === t.id ? '#00E5A0' : '#8892A4',
                    border:     activeTab === t.id ? '1px solid rgba(0,229,160,0.2)' : '1px solid transparent',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Overview ───────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-4 animate-slide-up">

                {/* Score trend */}
                {scoreTrend.length >= 2 && (
                  <div className="card p-5">
                    <h3 className="font-display font-semibold text-sm text-[#F0F4FF] mb-4">Score Trend</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={scoreTrend}>
                        <defs>
                          <linearGradient id="soldierGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"   stopColor="#00E5A0" stopOpacity={0.25} />
                            <stop offset="95%"  stopColor="#00E5A0" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" {...AXIS} />
                        <YAxis domain={['auto', 'auto']} {...AXIS} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(14,17,24,0.96)',
                            border: '1px solid rgba(0,229,160,0.2)',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: '#F0F4FF',
                          }}
                          formatter={(v: number) => [v.toFixed(2), 'Avg Score']}
                        />
                        <Area
                          type="monotone" dataKey="avg" stroke="#00E5A0" strokeWidth={2}
                          fill="url(#soldierGrad)" dot={{ fill: '#00E5A0', r: 3 }} activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Training mode breakdown */}
                <div className="card p-5">
                  <h3 className="font-display font-semibold text-sm text-[#F0F4FF] mb-4">Training Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {modeBreakdown.map(m => (
                      <div key={m.mode} className="rounded-xl p-4 text-center"
                        style={{ background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
                        <p className="text-2xl mb-1" style={{ color: m.color }}>{m.icon}</p>
                        <p className="font-data font-bold text-2xl" style={{ color: m.color }}>{m.count}</p>
                        <p className="text-[9px] font-display uppercase tracking-wide mt-1"
                          style={{ color: m.color }}>{m.mode}</p>
                        <p className="text-[#4A5568] text-[9px] mt-0.5">sessions</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Weapons ────────────────────────────────────────────── */}
            {activeTab === 'weapons' && (
              <div className="space-y-4 animate-slide-up">
                {weapons.length === 0 ? (
                  <div className="card p-12 text-center">
                    <p className="text-[#4A5568] text-sm">No weapon data yet. Log sessions to see weapon analytics.</p>
                  </div>
                ) : (
                  <>
                    {/* Radar chart */}
                    {radarData.length >= 3 && (
                      <div className="card p-5">
                        <h3 className="font-display font-semibold text-sm text-[#F0F4FF] mb-4">Weapon Performance Radar</h3>
                        <ResponsiveContainer width="100%" height={260}>
                          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                            <PolarGrid stroke="rgba(255,255,255,0.06)" />
                            <PolarAngleAxis
                              dataKey="weapon"
                              tick={{ fill: '#8892A4', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                            />
                            <Radar name="Avg" dataKey="score" stroke="#00E5A0" fill="#00E5A0" fillOpacity={0.12} strokeWidth={2} />
                            <Radar name="Best" dataKey="best"  stroke="#F5A623" fill="#F5A623"  fillOpacity={0.06}  strokeWidth={1.5} />
                            <Tooltip
                              contentStyle={{ background: 'rgba(14,17,24,0.96)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: '8px', fontSize: '11px', color: '#F0F4FF' }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Weapon list */}
                    <div className="space-y-3">
                      {weapons.map((w, i) => {
                        const tier = getQualTier(w.averageScore);
                        return (
                          <div key={w.weaponType} className="card p-4 animate-slide-up"
                            style={{ animationDelay: `${i * 40}ms` }}>
                            <div className="flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-display font-semibold text-sm text-[#F0F4FF] truncate">{w.weaponType}</p>
                                  <span className="text-[9px] font-display uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
                                    style={{ color: tier.color, background: tier.bg }}>
                                    {tier.label}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-[#1E2433] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700"
                                    style={{
                                      width: `${(w.averageScore / 10.9) * 100}%`,
                                      background: `linear-gradient(90deg, ${tier.color}80, ${tier.color})`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-center shrink-0">
                                <div>
                                  <p className="font-data font-bold text-sm" style={{ color: tier.color }}>{w.averageScore.toFixed(2)}</p>
                                  <p className="text-[9px] text-[#4A5568] font-display">Avg</p>
                                </div>
                                <div>
                                  <p className="font-data font-bold text-sm text-[#F5A623]">{w.bestScore.toFixed(1)}</p>
                                  <p className="text-[9px] text-[#4A5568] font-display">Best</p>
                                </div>
                                <div>
                                  <p className="font-data font-bold text-sm text-[#8892A4]">{w.sessions}</p>
                                  <p className="text-[9px] text-[#4A5568] font-display">Sessions</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Tab: History ─────────────────────────────────────────────── */}
            {activeTab === 'history' && (
              <div className="animate-slide-up">
                <div className="card overflow-hidden">
                  <div className="flex items-center justify-between p-5 pb-4">
                    <h3 className="font-display font-semibold text-sm text-[#F0F4FF]">Session Log</h3>
                    <select
                      value={filterWeapon}
                      onChange={e => setFilter(e.target.value)}
                      className="field text-xs py-1.5 px-3 max-w-[180px]"
                    >
                      {weaponOptions.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  {filtered.length === 0 ? (
                    <p className="text-[#4A5568] text-sm text-center py-12">No sessions.</p>
                  ) : (
                    <div className="overflow-x-auto overscroll-x-contain">
                      <table className="w-full min-w-[600px] text-sm">
                        <thead>
                          <tr className="border-b border-[#1E2433]">
                            <th className="text-left py-3 px-5 label">Date</th>
                            <th className="text-left py-3 px-5 label hidden sm:table-cell">Weapon</th>
                            <th className="text-left py-3 px-5 label hidden md:table-cell">Mode</th>
                            <th className="text-right py-3 px-5 label">Dist</th>
                            <th className="text-right py-3 px-5 label">Shots</th>
                            <th className="py-3 px-5" />
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((s, i) => (
                            <tr key={s.id}
                              className="table-row-hover border-b border-[#1E2433]/50 animate-fade-in"
                              style={{ animationDelay: `${i * 20}ms` }}>
                              <td className="py-3 px-5">
                                <span className="font-data text-xs text-[#8892A4]">
                                  {formatSessionStart(s.sessionDate, { includeYear: true })}
                                </span>
                              </td>
                              <td className="py-3 px-5 text-[#8892A4] text-xs hidden sm:table-cell truncate max-w-[140px]">
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
                              <td className="py-3 px-5 text-right text-[#8892A4] font-data text-xs">{s.distance}m</td>
                              <td className="py-3 px-5 text-right font-data text-[#F0F4FF]">{s.numberOfShots}</td>
                              <td className="py-3 px-5 text-right">
                                <Link href={`/sessions/${s.id}`}
                                  className="text-[#00E5A0] hover:text-green-300 text-xs font-display font-semibold uppercase tracking-wide transition-colors">
                                  View →
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </AppShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReadinessDial({ score, color }: { score: number; color: string }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const size = 72;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E2433" strokeWidth="5" />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-data font-black text-base" style={{ color }}>{score}</p>
      </div>
    </div>
  );
}

function ReadinessRow({
  label, value, max, color,
}: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <p className="text-[10px] font-display w-20 shrink-0" style={{ color: '#4A5568' }}>{label}</p>
      <div className="flex-1 h-1 bg-[#1E2433] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color}60,${color})` }}
        />
      </div>
      <p className="text-[10px] font-data w-8 text-right" style={{ color }}>{value}/{max}</p>
    </div>
  );
}
