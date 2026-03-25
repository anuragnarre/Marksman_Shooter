// apps/web/app/sessions/compare/page.tsx — Side-by-side session comparison
'use client';

// Pick any two sessions and compare analytics, shot distribution, and target plots side-by-side.

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { AppShell } from '../../../components/AppShell';
import { TargetCanvas } from '../../../components/TargetCanvas';
import { SkeletonCard } from '../../../components/ui/SkeletonCard';
import { formatSessionStart } from '../../../lib/session-time';
import { useCoachShooter } from '../../../lib/use-coach-shooter';
import type { Session, AnalyticsResult } from '@shooting-platform/shared-types';

const C = {
  amber: '#F5A623',
  blue:  '#4FC3F7',
  green: '#00E5A0',
  red:   '#FF4D6D',
  muted: 'var(--text-muted)',
  dim:   'var(--text-secondary)',
  text:  'var(--text-primary)',
  border:'var(--border-subtle)',
} as const;

function avgScoreColor(s: number) {
  if (s >= 9.5) return C.amber;
  if (s >= 9.0) return C.blue;
  if (s >= 8.0) return C.green;
  return C.red;
}

function deltaColor(d: number) {
  if (d > 0.1)  return C.green;
  if (d < -0.1) return C.red;
  return C.dim;
}

interface SessionMeta {
  id: string;
  discipline: string;
  distance: number;
  weaponType: string;
  numberOfShots: number;
  sessionDate: string | Date;
}

export default function ComparePage() {
  const { isCoach, authLoading, selectedShooterId } = useCoachShooter();
  const [allSessions, setAllSessions] = useState<SessionMeta[]>([]);
  const [leftId,  setLeftId]  = useState('');
  const [rightId, setRightId] = useState('');
  const [listError, setListError] = useState<string | null>(null);
  const [leftData,  setLeftData]  = useState<{ session: Session; analytics: AnalyticsResult } | null>(null);
  const [rightData, setRightData] = useState<{ session: Session; analytics: AnalyticsResult } | null>(null);
  const [loadingList,  setLoadingList]  = useState(true);
  const [loadingLeft,  setLoadingLeft]  = useState(false);
  const [loadingRight, setLoadingRight] = useState(false);
  const [leftError,  setLeftError]  = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (isCoach && !selectedShooterId) { setLoadingList(false); return; }
    const query = isCoach && selectedShooterId
      ? `?shooterId=${encodeURIComponent(selectedShooterId)}`
      : '';
    apiFetch<SessionMeta[]>(`/sessions${query}`)
      .then(s => {
        setAllSessions(s);
        if (s.length >= 2) { setLeftId(s[0].id); setRightId(s[1].id); }
        else if (s.length === 1) setLeftId(s[0].id);
      })
      .catch((e: Error) => setListError(e.message))
      .finally(() => setLoadingList(false));
  }, [authLoading, isCoach, selectedShooterId]);

  async function loadSide(id: string, side: 'left' | 'right') {
    if (!id) return;
    if (side === 'left') { setLoadingLeft(true);  setLeftError(null);  }
    else                  { setLoadingRight(true); setRightError(null); }
    try {
      const [session, analytics] = await Promise.all([
        apiFetch<Session>(`/sessions/${id}`),
        apiFetch<AnalyticsResult>(`/analytics/session/${id}`),
      ]);
      if (side === 'left') setLeftData({ session, analytics });
      else setRightData({ session, analytics });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load session';
      if (side === 'left') setLeftError(msg);
      else setRightError(msg);
    } finally {
      if (side === 'left') setLoadingLeft(false); else setLoadingRight(false);
    }
  }

  useEffect(() => { if (leftId)  void loadSide(leftId,  'left');  }, [leftId]);
  useEffect(() => { if (rightId) void loadSide(rightId, 'right'); }, [rightId]);

  const metrics = useMemo(() => {
    if (!leftData || !rightData) return null;
    const l = leftData.analytics;
    const r = rightData.analytics;
    return [
      { label: 'Avg Score',     lv: l.averageScore,  rv: r.averageScore,  fmt: (v: number) => v.toFixed(2), higher: true },
      { label: 'Std Deviation', lv: l.stdDev,         rv: r.stdDev,        fmt: (v: number) => v.toFixed(3), higher: false },
      { label: 'Group Radius',  lv: l.groupRadius,    rv: r.groupRadius,   fmt: (v: number) => v.toFixed(2), higher: false },
      { label: 'Min Score',     lv: l.minScore,       rv: r.minScore,      fmt: (v: number) => v.toFixed(1), higher: true },
      { label: 'Max Score',     lv: l.maxScore,       rv: r.maxScore,      fmt: (v: number) => v.toFixed(1), higher: true },
      { label: 'Total Shots',   lv: l.totalShots,     rv: r.totalShots,    fmt: (v: number) => String(Math.round(v)), higher: true },
      { label: 'MPI X',         lv: l.mpi?.x ?? 0,   rv: r.mpi?.x ?? 0,   fmt: (v: number) => v.toFixed(2), higher: null },
      { label: 'MPI Y',         lv: l.mpi?.y ?? 0,   rv: r.mpi?.y ?? 0,   fmt: (v: number) => v.toFixed(2), higher: null },
    ];
  }, [leftData, rightData]);

  const sessionOptions = allSessions.map(s => ({
    id: s.id,
    label: `${s.discipline} ${s.distance}m · ${formatSessionStart(s.sessionDate, { includeYear: true })}`,
  }));

  return (
    <AppShell title="Compare Sessions">
      <div className="space-y-6 max-w-6xl">

        {/* Header */}
        <div className="animate-slide-up flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">Session Comparison</h1>
            <p className="text-text-muted text-sm mt-1">Compare two training sessions side-by-side.</p>
          </div>
          <Link href="/sessions" className="btn btn-ghost text-sm">← Sessions</Link>
        </div>

        {/* Session selectors */}
        {loadingList ? (
          <SkeletonCard height={56} animationDelay={0} />
        ) : allSessions.length < 2 ? (
          <div className="card p-8 text-center">
            <p className="text-text-muted text-sm">You need at least 2 sessions to compare.</p>
            <Link href="/sessions/new" className="btn btn-primary mt-4 inline-block">Create Session</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-slide-up">
              {/* Left selector */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#F5A623]" />
                  <p className="text-[10px] font-display uppercase tracking-widest text-[#F5A623]">Session A</p>
                </div>
                <select
                  value={leftId}
                  onChange={e => setLeftId(e.target.value)}
                  className="field w-full text-sm"
                >
                  {sessionOptions.map(s => (
                    <option key={s.id} value={s.id} disabled={s.id === rightId}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Right selector */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(79,195,247,0.05)', border: '1px solid rgba(79,195,247,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#4FC3F7]" />
                  <p className="text-[10px] font-display uppercase tracking-widest text-[#4FC3F7]">Session B</p>
                </div>
                <select
                  value={rightId}
                  onChange={e => setRightId(e.target.value)}
                  className="field w-full text-sm"
                >
                  {sessionOptions.map(s => (
                    <option key={s.id} value={s.id} disabled={s.id === leftId}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison content */}
            {(loadingLeft || loadingRight) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SkeletonCard height={200} animationDelay={0} />
                <SkeletonCard height={200} animationDelay={60} />
              </div>
            )}

            {/* Per-side errors */}
            {(leftError || rightError) && !loadingLeft && !loadingRight && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  {leftError && (
                    <div className="rounded-lg px-4 py-3 text-sm text-[#FF4D6D]"
                      style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)' }}>
                      Session A: {leftError}
                    </div>
                  )}
                </div>
                <div>
                  {rightError && (
                    <div className="rounded-lg px-4 py-3 text-sm text-[#FF4D6D]"
                      style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)' }}>
                      Session B: {rightError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {leftData && rightData && !loadingLeft && !loadingRight && (
              <div className="space-y-6 animate-slide-up">

                {/* Session info headers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SessionInfoCard session={leftData.session} color={C.amber} label="A" />
                  <SessionInfoCard session={rightData.session} color={C.blue} label="B" />
                </div>

                {/* Target canvases */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#F5A623]" />
                      <p className="text-[10px] font-display uppercase tracking-widest text-[#F5A623]">Session A</p>
                    </div>
                    <TargetCanvas
                      shots={leftData.session.shots ?? []}
                      size={280}
                      mpi={leftData.analytics.mpi}
                    />
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-[#4FC3F7]" />
                      <p className="text-[10px] font-display uppercase tracking-widest text-[#4FC3F7]">Session B</p>
                    </div>
                    <TargetCanvas
                      shots={rightData.session.shots ?? []}
                      size={280}
                      mpi={rightData.analytics.mpi}
                    />
                  </div>
                </div>

                {/* Metrics comparison table */}
                {metrics && (
                  <div className="card p-5">
                    <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Analytics Comparison</h3>
                    <div className="space-y-2">
                      {metrics.map(m => {
                        const delta = m.lv - m.rv;
                        const lWins = m.higher === true  ? m.lv > m.rv
                                    : m.higher === false ? m.lv < m.rv
                                    : false;
                        const rWins = m.higher === true  ? m.rv > m.lv
                                    : m.higher === false ? m.rv < m.lv
                                    : false;
                        return (
                          <div key={m.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2"
                            style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <div className="text-right">
                              <p
                                className="font-data font-bold text-sm"
                                style={{ color: lWins ? C.amber : C.dim }}
                              >
                                {m.fmt(m.lv)}
                                {lWins && <span className="ml-1 text-[9px] font-display uppercase tracking-wide text-[#F5A623]">▲</span>}
                              </p>
                            </div>
                            <div className="text-center w-28">
                              <p className="text-[9px] font-display uppercase tracking-widest text-text-muted">{m.label}</p>
                              {m.higher !== null && (
                                <p className="text-[9px] mt-0.5 font-data" style={{ color: deltaColor(delta) }}>
                                  {delta > 0 ? '+' : ''}{m.fmt(delta)}
                                </p>
                              )}
                            </div>
                            <div className="text-left">
                              <p
                                className="font-data font-bold text-sm"
                                style={{ color: rWins ? C.blue : C.dim }}
                              >
                                {rWins && <span className="mr-1 text-[9px] font-display uppercase tracking-wide text-[#4FC3F7]">▲</span>}
                                {m.fmt(m.rv)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Series averages comparison */}
                {leftData.analytics.seriesAverages?.length > 0 && rightData.analytics.seriesAverages?.length > 0 && (
                  <div className="card p-5">
                    <h3 className="font-display font-semibold text-sm text-text-primary mb-4">Series Averages</h3>
                    <div className="space-y-2">
                      {Array.from({ length: Math.max(leftData.analytics.seriesAverages.length, rightData.analytics.seriesAverages.length) }).map((_, i) => {
                        const lv = leftData.analytics.seriesAverages[i] ?? null;
                        const rv = rightData.analytics.seriesAverages[i] ?? null;
                        return (
                          <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <div className="flex items-center justify-end gap-2">
                              {lv !== null && (
                                <div className="h-2 rounded-full transition-all" style={{
                                  width: `${(lv / 11) * 100}%`,
                                  maxWidth: '100%',
                                  background: C.amber,
                                  opacity: 0.7,
                                }} />
                              )}
                              <p className="font-data text-sm shrink-0" style={{ color: C.amber }}>{lv?.toFixed(2) ?? '—'}</p>
                            </div>
                            <p className="text-[9px] font-display uppercase tracking-widest text-text-muted w-14 text-center">
                              Series {i + 1}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="font-data text-sm shrink-0" style={{ color: C.blue }}>{rv?.toFixed(2) ?? '—'}</p>
                              {rv !== null && (
                                <div className="h-2 rounded-full transition-all" style={{
                                  width: `${(rv / 11) * 100}%`,
                                  maxWidth: '100%',
                                  background: C.blue,
                                  opacity: 0.7,
                                }} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function SessionInfoCard({
  session, color, label,
}: { session: Session; color: string; label: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: `${color}05`, border: `1px solid ${color}25` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <p className="text-[9px] font-display uppercase tracking-widest" style={{ color }}>Session {label}</p>
      </div>
      <p className="font-display font-bold text-sm text-text-primary">{session.discipline}</p>
      <p className="text-text-secondary text-xs mt-1">
        {session.distance}m · {session.weaponType} · {session.numberOfShots} shots
      </p>
      <p className="text-text-muted text-[10px] mt-0.5 font-data">
        {formatSessionStart(session.sessionDate, { includeYear: true })}
      </p>
      <Link
        href={`/sessions/${session.id}`}
        className="text-[10px] font-display uppercase tracking-wide mt-2 inline-block transition-colors hover:opacity-80"
        style={{ color }}
      >
        Open Session →
      </Link>
    </div>
  );
}
