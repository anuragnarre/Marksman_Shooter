// components/planning/GoalsSection.tsx
'use client';

// Goals & Personal Records — target-based goal tracking, PB vault, milestone feed.
// Frontend-only: PBs derived from analytics data; goals persisted in localStorage.

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '../../lib/api';
import { SkeletonCard } from '../ui/SkeletonCard';
import { formatSessionStart } from '../../lib/session-time';
import type { OverviewAnalytics, SessionTrendPoint } from '@shooting-platform/shared-types';

// ── Constants ─────────────────────────────────────────────────────────────────

const C = {
  void:     'var(--bg-void)',
  surface:  'var(--bg-surface)',
  elevated: 'var(--bg-elevated)',
  border:   'var(--border-subtle)',
  amber:    '#F5A623',
  blue:     '#4FC3F7',
  red:      '#FF4D6D',
  green:    '#00E5A0',
  muted:    'var(--text-muted)',
  dim:      'var(--text-secondary)',
  text:     'var(--text-primary)',
} as const;

const DISCIPLINES = [
  '10m Air Rifle',
  '10m Air Pistol',
  '25m Rapid Fire Pistol',
  '50m Rifle 3 Positions',
  '50m Rifle Prone',
  '50m Pistol',
  'Skeet',
  'Trap',
  'Double Trap',
  'Custom',
];

const MILESTONES = [
  { id: 'first_session',    label: 'First Shot',         desc: 'Complete your first training session',         icon: '◎', check: (t: SessionTrendPoint[]) => t.length >= 1 },
  { id: 'ten_sessions',     label: 'Dedicated',          desc: 'Complete 10 training sessions',                icon: '◈', check: (t: SessionTrendPoint[]) => t.length >= 10 },
  { id: 'fifty_sessions',   label: 'Veteran',            desc: 'Complete 50 training sessions',                icon: '◉', check: (t: SessionTrendPoint[]) => t.length >= 50 },
  { id: 'avg_nine',         label: 'Ring 9',             desc: 'Achieve a session average of 9.0+',            icon: '⊕', check: (t: SessionTrendPoint[]) => t.some(s => s.avgScore >= 9.0) },
  { id: 'avg_nine_five',    label: 'Ring 9.5',           desc: 'Achieve a session average of 9.5+',            icon: '⊕', check: (t: SessionTrendPoint[]) => t.some(s => s.avgScore >= 9.5) },
  { id: 'avg_ten',          label: 'Ring 10',            desc: 'Achieve a session average of 10.0+',           icon: '⊕', check: (t: SessionTrendPoint[]) => t.some(s => s.avgScore >= 10.0) },
  { id: 'five_xrings',      label: 'X-Ring Burst',       desc: 'Score 5 X-rings in a single session',          icon: '✦', check: (t: SessionTrendPoint[]) => t.some(s => s.xRingCount >= 5) },
  { id: 'twenty_xrings',    label: 'Marksman',           desc: 'Score 20 X-rings in a single session',         icon: '✦', check: (t: SessionTrendPoint[]) => t.some(s => s.xRingCount >= 20) },
  { id: 'streak_3',         label: 'On Form',            desc: '3 consecutive above-average sessions',         icon: '⟳', check: (t: SessionTrendPoint[]) => maxStreak(t) >= 3 },
  { id: 'streak_5',         label: 'Hot Streak',         desc: '5 consecutive above-average sessions',         icon: '⟳', check: (t: SessionTrendPoint[]) => maxStreak(t) >= 5 },
  { id: 'consistency_low',  label: 'Steady Hand',        desc: 'Achieve std deviation below 0.5 in a session', icon: '≈', check: (t: SessionTrendPoint[]) => t.some(s => s.stdDev < 0.5) },
  { id: 'tight_group',      label: 'Tight Group',        desc: 'Group radius below 2.0 in a session',          icon: '◎', check: (t: SessionTrendPoint[]) => t.some(s => s.groupRadius > 0 && s.groupRadius < 2.0) },
];

function maxStreak(trend: SessionTrendPoint[]): number {
  if (!trend.length) return 0;
  const avg = trend.reduce((s, t) => s + t.avgScore, 0) / trend.length;
  let max = 0, cur = 0;
  for (const t of trend) {
    if (t.avgScore >= avg) { cur++; if (cur > max) max = cur; }
    else cur = 0;
  }
  return max;
}

// ── Goal storage (localStorage) ───────────────────────────────────────────────

interface GoalEntry {
  id: string;
  discipline: string;
  targetAvg: number;
  targetXRings: number;
  createdAt: string;
}

const GOALS_KEY = 'marksman_goals_v1';

function loadGoals(): GoalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(GOALS_KEY) ?? '[]');
  } catch { return []; }
}

function saveGoals(goals: GoalEntry[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function progressColor(pct: number): string {
  if (pct >= 100) return C.green;
  if (pct >= 70)  return C.amber;
  if (pct >= 40)  return C.blue;
  return C.muted;
}

// ── Section ──────────────────────────────────────────────────────────────────

export default function GoalsSection() {
  const [overview,  setOverview]  = useState<OverviewAnalytics | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [goals,     setGoals]     = useState<GoalEntry[]>([]);
  const [showForm,  setShowForm]  = useState(false);
  const [tab,       setTab]       = useState<'records' | 'goals' | 'milestones'>('records');

  useEffect(() => {
    setGoals(loadGoals());
    apiFetch<OverviewAnalytics>('/analytics/overview')
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, []);

  const trend = overview?.sessionTrend ?? [];

  // Personal Bests
  const pbs = useMemo(() => {
    if (!trend.length) return null;

    const bestAvg   = [...trend].sort((a, b) => b.avgScore - a.avgScore)[0];
    const bestGroup = [...trend].filter(t => t.groupRadius > 0).sort((a, b) => a.groupRadius - b.groupRadius)[0];
    const bestStdDev= [...trend].filter(t => t.stdDev > 0).sort((a, b) => a.stdDev - b.stdDev)[0];
    const bestXRing = [...trend].sort((a, b) => b.xRingCount - a.xRingCount)[0];
    const byDisc: Record<string, { avg: number; date: string | Date; sessionId: string }> = {};
    for (const t of trend) {
      if (!byDisc[t.discipline] || t.avgScore > byDisc[t.discipline].avg) {
        byDisc[t.discipline] = { avg: t.avgScore, date: t.date, sessionId: t.sessionId };
      }
    }
    const totalXRings = trend.reduce((s, t) => s + t.xRingCount, 0);
    const currentStreak = (() => {
      const overallAvg = trend.reduce((s, t) => s + t.avgScore, 0) / trend.length;
      let n = 0;
      for (let i = trend.length - 1; i >= 0; i--) {
        if (trend[i].avgScore >= overallAvg) n++; else break;
      }
      return n;
    })();

    return { bestAvg, bestGroup, bestStdDev, bestXRing, byDisc, totalXRings, currentStreak };
  }, [trend]);

  // Milestone states
  const earned = useMemo(() =>
    MILESTONES.filter(m => m.check(trend)),
    [trend]
  );

  function handleAddGoal(g: Omit<GoalEntry, 'id' | 'createdAt'>) {
    const entry: GoalEntry = { ...g, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const next = [...goals, entry];
    setGoals(next);
    saveGoals(next);
    setShowForm(false);
  }

  function handleDeleteGoal(id: string) {
    const next = goals.filter(g => g.id !== id);
    setGoals(next);
    saveGoals(next);
  }

  // Compute progress for each goal against PB
  function goalProgress(goal: GoalEntry): { avgPct: number; xRingPct: number; bestAvg: number; bestXRings: number } {
    const discSessions = trend.filter(t => goal.discipline === 'Custom' || t.discipline === goal.discipline);
    const bestAvg    = discSessions.length ? Math.max(...discSessions.map(t => t.avgScore)) : 0;
    const bestXRings = discSessions.length ? Math.max(...discSessions.map(t => t.xRingCount)) : 0;
    return {
      avgPct:    goal.targetAvg    > 0 ? Math.min(100, (bestAvg    / goal.targetAvg)    * 100) : 0,
      xRingPct:  goal.targetXRings > 0 ? Math.min(100, (bestXRings / goal.targetXRings) * 100) : 0,
      bestAvg,
      bestXRings,
    };
  }

  const TABS = [
    { id: 'records',    label: 'Personal Bests' },
    { id: 'goals',      label: `Goals (${goals.length})` },
    { id: 'milestones', label: `Milestones (${earned.length}/${MILESTONES.length})` },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="animate-slide-up flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Goals & Records</h1>
          <p className="text-text-muted text-sm mt-1">
            Personal bests, training targets, and achievement milestones.
          </p>
        </div>
        {tab === 'goals' && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary shrink-0"
          >
            + Set Goal
          </button>
        )}
      </div>

      {/* ── Summary banner ──────────────────────────────────────────────── */}
      {!loading && overview && (
        <div
          className="relative rounded-xl overflow-hidden p-5 animate-slide-up"
          style={{
            background: 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(79,195,247,0.04) 100%)',
            border: '1px solid rgba(245,166,35,0.2)',
          }}
        >
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(245,166,35,0.6),transparent)' }}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <BannerStat label="Sessions" value={String(overview.totalSessions)} color={C.amber} />
            <BannerStat label="Overall Avg" value={overview.overallAverage.toFixed(2)} color={C.blue} />
            <BannerStat label="Best Session" value={overview.bestSessionAvg.toFixed(2)} color={C.green} />
            <BannerStat label="Consistency" value={`${overview.consistency.toFixed(1)}/10`} color={C.amber} />
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-xl animate-slide-up" style={{ background: 'var(--chip-bg)', border: '1px solid var(--glass-border)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-display font-semibold transition-all duration-200"
            style={{
              background: tab === t.id ? 'rgba(245,166,35,0.12)' : 'transparent',
              color:      tab === t.id ? C.amber : C.dim,
              border:     tab === t.id ? '1px solid rgba(245,166,35,0.25)' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0,1,2].map(i => <SkeletonCard key={i} height={100} animationDelay={i * 60} />)}
        </div>
      ) : (
        <>
          {/* ── Personal Bests ──────────────────────────────────────────── */}
          {tab === 'records' && (
            <div className="space-y-5 animate-slide-up">
              {!pbs ? (
                <EmptyState text="Record your first session to see personal bests." />
              ) : (
                <>
                  {/* Top 4 PB cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <PbCard
                      icon="⊕"
                      label="Best Session Avg"
                      value={pbs.bestAvg.avgScore.toFixed(2)}
                      sub={`${pbs.bestAvg.discipline} · ${fmtDate(pbs.bestAvg.date)}`}
                      color={C.amber}
                      glow
                      href={`/sessions/${pbs.bestAvg.sessionId}`}
                    />
                    <PbCard
                      icon="✦"
                      label="Most X-Rings"
                      value={String(pbs.bestXRing.xRingCount)}
                      sub={`in one session · ${fmtDate(pbs.bestXRing.date)}`}
                      color={C.blue}
                      href={`/sessions/${pbs.bestXRing.sessionId}`}
                    />
                    <PbCard
                      icon="◎"
                      label="Tightest Group"
                      value={pbs.bestGroup ? pbs.bestGroup.groupRadius.toFixed(2) : '—'}
                      sub={pbs.bestGroup ? fmtDate(pbs.bestGroup.date) : 'No data yet'}
                      color={C.green}
                      href={pbs.bestGroup ? `/sessions/${pbs.bestGroup.sessionId}` : undefined}
                    />
                    <PbCard
                      icon="≈"
                      label="Best Consistency"
                      value={pbs.bestStdDev ? pbs.bestStdDev.stdDev.toFixed(3) : '—'}
                      sub={pbs.bestStdDev ? `σ · ${fmtDate(pbs.bestStdDev.date)}` : 'No data yet'}
                      color={C.green}
                      href={pbs.bestStdDev ? `/sessions/${pbs.bestStdDev.sessionId}` : undefined}
                    />
                  </div>

                  {/* Lifetime totals */}
                  <div className="card p-5">
                    <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Lifetime Stats</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <LifetimeStat label="Total Shots" value={String(overview?.totalShots ?? 0)} />
                      <LifetimeStat label="Total X-Rings" value={String(pbs.totalXRings)} />
                      <LifetimeStat label="Current Streak" value={`${pbs.currentStreak} sessions`} />
                      <LifetimeStat label="Best Overall Avg" value={overview?.bestSessionAvg.toFixed(2) ?? '—'} />
                    </div>
                  </div>

                  {/* Per-discipline PBs */}
                  {Object.keys(pbs.byDisc).length > 0 && (
                    <div className="card p-5">
                      <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Best by Discipline</h3>
                      <div className="space-y-3">
                        {Object.entries(pbs.byDisc)
                          .sort((a, b) => b[1].avg - a[1].avg)
                          .map(([disc, pb]) => (
                            <DiscPbRow
                              key={disc}
                              discipline={disc}
                              avg={pb.avg}
                              date={pb.date}
                              sessionId={pb.sessionId}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Goals ───────────────────────────────────────────────────── */}
          {tab === 'goals' && (
            <div className="space-y-4 animate-slide-up">
              {showForm && (
                <GoalForm
                  onSave={handleAddGoal}
                  onCancel={() => setShowForm(false)}
                />
              )}
              {goals.length === 0 && !showForm && (
                <EmptyState text="No goals set. Click '+ Set Goal' to create your first target." />
              )}
              {goals.map(goal => {
                const prog = goalProgress(goal);
                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    progress={prog}
                    onDelete={() => handleDeleteGoal(goal.id)}
                  />
                );
              })}
            </div>
          )}

          {/* ── Milestones ──────────────────────────────────────────────── */}
          {tab === 'milestones' && (
            <div className="space-y-4 animate-slide-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {MILESTONES.map(m => {
                  const done = earned.some(e => e.id === m.id);
                  return (
                    <MilestoneCard
                      key={m.id}
                      icon={m.icon}
                      label={m.label}
                      desc={m.desc}
                      earned={done}
                    />
                  );
                })}
              </div>
              {earned.length > 0 && (
                <p className="text-center text-text-muted text-xs font-display pt-2">
                  {earned.length} of {MILESTONES.length} milestones achieved
                </p>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BannerStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-[10px] font-display uppercase tracking-widest" style={{ color: C.muted }}>{label}</p>
      <p className="font-data font-bold text-2xl mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}

function PbCard({
  icon, label, value, sub, color, glow, href,
}: {
  icon: string; label: string; value: string; sub: string;
  color: string; glow?: boolean; href?: string;
}) {
  const inner = (
    <div
      className="relative rounded-xl p-4 h-full transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: glow
          ? `linear-gradient(135deg, ${color}10 0%, rgba(255,255,255,0.02) 100%)`
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${glow ? color + '35' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: glow ? `0 4px 24px ${color}18` : 'none',
      }}
    >
      {glow && (
        <div className="absolute top-0 inset-x-0 h-px rounded-t-xl"
          style={{ background: `linear-gradient(90deg,transparent,${color}60,transparent)` }} />
      )}
      <div className="flex items-start justify-between mb-2">
        <span className="text-lg" style={{ color }}>{icon}</span>
        {href && (
          <span className="text-[10px] font-display text-text-muted hover:text-[#F5A623] transition-colors">
            View →
          </span>
        )}
      </div>
      <p className="font-data font-bold text-2xl" style={{ color }}>{value}</p>
      <p className="text-[10px] font-display uppercase tracking-wide mt-1" style={{ color: C.muted }}>{label}</p>
      <p className="text-[10px] mt-1" style={{ color: C.dim }}>{sub}</p>
    </div>
  );

  if (href) {
    return <a href={href} className="block">{inner}</a>;
  }
  return inner;
}

function LifetimeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--chip-bg)' }}>
      <p className="text-[10px] font-display uppercase tracking-wide" style={{ color: C.muted }}>{label}</p>
      <p className="font-data font-bold text-lg mt-0.5" style={{ color: C.text }}>{value}</p>
    </div>
  );
}

function DiscPbRow({
  discipline, avg, date, sessionId,
}: { discipline: string; avg: number; date: string | Date; sessionId: string }) {
  const color = avg >= 10 ? C.amber : avg >= 9.5 ? C.blue : avg >= 9.0 ? C.green : C.dim;
  return (
    <a
      href={`/sessions/${sessionId}`}
      className="flex items-center gap-4 py-2.5 px-3 rounded-lg transition-all duration-150 hover:bg-white/[0.03] group"
    >
      <div
        className="w-1 h-8 rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display font-semibold text-text-primary truncate">{discipline}</p>
        <p className="text-[10px] font-display mt-0.5" style={{ color: C.muted }}>
          Best recorded · {fmtDate(date)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-data font-bold text-lg" style={{ color }}>{avg.toFixed(2)}</p>
        <p className="text-[10px] group-hover:text-[#F5A623] transition-colors" style={{ color: C.muted }}>
          View →
        </p>
      </div>
    </a>
  );
}

function MilestoneCard({
  icon, label, desc, earned,
}: { icon: string; label: string; desc: string; earned: boolean }) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-200"
      style={{
        background: earned
          ? 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.03) 100%)'
          : 'rgba(255,255,255,0.02)',
        border: earned ? '1px solid rgba(245,166,35,0.25)' : '1px solid rgba(255,255,255,0.06)',
        opacity: earned ? 1 : 0.45,
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span
          className="text-xl font-display"
          style={{ color: earned ? C.amber : C.muted, filter: earned ? `drop-shadow(0 0 6px ${C.amber}80)` : 'none' }}
        >
          {icon}
        </span>
        <p className="font-display font-bold text-sm" style={{ color: earned ? C.text : C.dim }}>
          {label}
        </p>
        {earned && (
          <span
            className="ml-auto text-[9px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ color: C.green, background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)' }}
          >
            Earned
          </span>
        )}
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>{desc}</p>
    </div>
  );
}

// ── Goal Form ─────────────────────────────────────────────────────────────────

function GoalForm({
  onSave, onCancel,
}: {
  onSave: (g: Omit<GoalEntry, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [discipline,   setDiscipline]   = useState(DISCIPLINES[0]);
  const [targetAvg,    setTargetAvg]    = useState('');
  const [targetXRings, setTargetXRings] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      discipline,
      targetAvg:    parseFloat(targetAvg)    || 0,
      targetXRings: parseInt(targetXRings)   || 0,
    });
  }

  return (
    <div
      className="rounded-xl p-5 animate-slide-up"
      style={{
        background: 'rgba(245,166,35,0.04)',
        border: '1px solid rgba(245,166,35,0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-px h-4 rounded-full" style={{ background: C.amber }} />
        <p className="font-display font-bold text-sm text-text-primary">New Goal</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label block mb-1.5">Discipline</label>
            <select
              value={discipline}
              onChange={e => setDiscipline(e.target.value)}
              className="field w-full"
            >
              {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label block mb-1.5">Target Avg Score</label>
            <input
              type="number" step="0.1" min="1" max="10.9"
              value={targetAvg}
              onChange={e = /> setTargetAvg(e.target.value)}
              placeholder="e.g. 9.5"
              className="field w-full"
            />
          </div>
          <div>
            <label className="label block mb-1.5">Target X-Rings / Session</label>
            <input
              type="number" min="0" max="200"
              value={targetXRings}
              onChange={e = /> setTargetXRings(e.target.value)}
              placeholder="e.g. 10"
              className="field w-full"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary">Save Goal</button>
          <button type="button" onClick={onCancel} className="btn btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

function GoalCard({
  goal, progress, onDelete,
}: {
  goal: GoalEntry;
  progress: { avgPct: number; xRingPct: number; bestAvg: number; bestXRings: number };
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const avgDone   = goal.targetAvg    > 0 && progress.avgPct   >= 100;
  const xRingDone = goal.targetXRings > 0 && progress.xRingPct >= 100;
  const allDone   = (goal.targetAvg === 0 || avgDone) && (goal.targetXRings === 0 || xRingDone);

  return (
    <div
      className="rounded-xl p-5 transition-all duration-200"
      style={{
        background: allDone ? 'rgba(0,229,160,0.04)' : 'rgba(255,255,255,0.025)',
        border: allDone ? '1px solid rgba(0,229,160,0.25)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display font-bold text-sm text-text-primary">{goal.discipline}</p>
            {allDone && (
              <span className="text-[9px] font-display font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ color: C.green, background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.25)' }}>
                Achieved
              </span>
            )}
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>
            Set {fmtDate(goal.createdAt)}
          </p>
        </div>
        <div>
          {confirming ? (
            <div className="flex gap-2 items-center">
              <span className="text-[10px] text-text-muted">Remove?</span>
              <button onClick={onDelete}
                className="text-[10px] font-display font-bold px-2 py-1 rounded text-[#FF4D6D] hover:bg-[rgba(255,77,109,0.1)] transition-colors">
                Yes
              </button>
              <button onClick={() => setConfirming(false)}
                className="text-[10px] font-display font-bold px-2 py-1 rounded text-text-muted hover:text-text-primary transition-colors">
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-text-muted hover:text-[#FF4D6D] transition-colors text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {goal.targetAvg > 0 && (
          <GoalBar
            label="Avg Score"
            current={progress.bestAvg}
            target={goal.targetAvg}
            pct={progress.avgPct}
            formatter={v => v.toFixed(2)}
          />
        )}
        {goal.targetXRings > 0 && (
          <GoalBar
            label="X-Rings / Session"
            current={progress.bestXRings}
            target={goal.targetXRings}
            pct={progress.xRingPct}
            formatter={v => String(Math.round(v))}
          />
        )}
      </div>
    </div>
  );
}

function GoalBar({
  label, current, target, pct, formatter,
}: {
  label: string; current: number; target: number; pct: number;
  formatter: (v: number) => string;
}) {
  const color = progressColor(pct);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-display uppercase tracking-wide" style={{ color: C.muted }}>{label}</p>
        <p className="text-[10px] font-data font-bold" style={{ color }}>
          {formatter(current)} / {formatter(target)}
        </p>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--chip-bg)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: pct >= 100 ? `0 0 8px ${color}80` : 'none',
          }}
        />
      </div>
      <p className="text-[9px] mt-1 text-right" style={{ color: C.muted }}>
        {pct >= 100 ? 'Goal reached!' : `${pct.toFixed(0)}% there`}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card p-12 flex flex-col items-center text-center">
      <div className="mb-4 opacity-30">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          {[20, 14, 8].map((r, i) => (
            <circle key={r} cx="24" cy="24" r={r} fill="none" stroke="#F5A623" strokeWidth="1"
              style={{ opacity: 0.3 + i * 0.25 }} />
          ))}
          <circle cx="24" cy="24" r="2" fill="#F5A623" />
        </svg>
      </div>
      <p className="text-text-secondary text-sm">{text}</p>
    </div>
  );
}
