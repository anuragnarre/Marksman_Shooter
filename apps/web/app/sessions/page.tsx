// apps/web/app/sessions/page.tsx
'use client';

// Sessions list page — groups by month, shows discipline colour bar,
// inline delete-confirm, and a sticky stats summary at the top.

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { AppShell } from '../../components/AppShell';
import { formatSessionStart } from '../../lib/session-time';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useCoachShooter } from '../../lib/use-coach-shooter';
import type { Session } from '@shooting-platform/shared-types';
import { TRAINING_MODE_COLORS } from '@shooting-platform/shared-types';

// ── Discipline colour map ─────────────────────────────────────────────────────

const DISC_COLOR: Record<string, string> = {
  '10m Air Rifle':           '#4FC3F7',
  '10m Air Pistol':          '#F5A623',
  '25m Rapid Fire Pistol':   '#F5A623',
  '50m Rifle 3 Positions':   '#00E5A0',
  '50m Rifle Prone':         '#00E5A0',
  '50m Pistol':              '#F5A623',
  'Skeet':                   '#FF4D6D',
  'Trap':                    '#FF4D6D',
  'Double Trap':             '#FF4D6D',
};

function discColor(d: string) {
  return DISC_COLOR[d] ?? '#8892A4';
}

// ── Group by month label ──────────────────────────────────────────────────────

function monthKey(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function groupByMonth(sessions: Session[]): Record<string, Session[]> {
  const result: Record<string, Session[]> = {};
  for (const s of sessions) {
    const key = monthKey(new Date(s.sessionDate));
    if (!result[key]) result[key] = [];
    result[key].push(s);
  }
  return result;
}

// ── Quick stats ───────────────────────────────────────────────────────────────

function computeStats(sessions: Session[]) {
  const now   = new Date();
  const month = sessions.filter((s) => {
    const d = new Date(s.sessionDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalShots = sessions.reduce((a, s) => a + s.numberOfShots, 0);
  const weapons    = new Set(sessions.map((s) => s.weaponType)).size;
  return { total: sessions.length, thisMonth: month.length, totalShots, weapons };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const {
    isCoach,
    authLoading,
    shooters,
    selectedShooter,
    selectedShooterId,
    setSelectedShooterId,
  } = useCoachShooter();

  const [sessions,  setSessions]  = useState<Session[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filterDisc, setFilterDisc] = useState<string>('All');
  const [filterMode, setFilterMode] = useState<string>('All');
  const [search,     setSearch]     = useState('');

  function load() {
    if (authLoading) return;
    if (isCoach && !selectedShooterId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = isCoach
      ? `/sessions?shooterId=${encodeURIComponent(selectedShooterId ?? '')}`
      : '/sessions';

    apiFetch<Session[]>(path)
      .then(setSessions)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [authLoading, isCoach, selectedShooterId]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const path = isCoach
        ? `/sessions/${id}?shooterId=${encodeURIComponent(selectedShooterId ?? '')}`
        : `/sessions/${id}`;
      await apiFetch(path, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete session');
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  }

  const disciplines = useMemo(() => ['All', ...new Set(sessions.map(s => s.discipline))], [sessions]);
  const modes       = useMemo(() => ['All', ...new Set(sessions.map(s => s.trainingMode).filter(Boolean) as string[])], [sessions]);
  const filteredSessions = useMemo(() => {
    let list = sessions;
    if (filterDisc !== 'All') list = list.filter(s => s.discipline === filterDisc);
    if (filterMode !== 'All') list = list.filter(s => s.trainingMode === filterMode);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s =>
        s.discipline.toLowerCase().includes(q) ||
        s.weaponType.toLowerCase().includes(q) ||
        new Date(s.sessionDate).toLocaleDateString().includes(q)
      );
    }
    return list;
  }, [sessions, filterDisc, filterMode, search]);

  const grouped = groupByMonth(filteredSessions);
  const months  = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const stats   = computeStats(sessions);

  return (
    <AppShell title="Sessions">
      <div className="space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">Training Sessions</h1>
            <p className="text-text-muted text-sm mt-1">
              {isCoach
                ? `Sessions for ${selectedShooter?.name ?? 'selected shooter'}`
                : 'All your recorded training sessions'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/sessions/compare"
              className="btn btn-ghost text-sm py-2.5 px-4"
            >
              Compare
            </Link>
            <Link
              href={isCoach && selectedShooterId
                ? `/sessions/new?shooterId=${encodeURIComponent(selectedShooterId)}`
                : '/sessions/new'}
              className="btn btn-primary text-sm py-2.5 px-4 sm:px-5"
            >
              <span className="hidden xs:inline">+ New Session</span>
              <span className="xs:hidden">+ New</span>
            </Link>
          </div>
        </div>

        {isCoach && (
          <div className="card p-4 animate-slide-up">
            <label className="label block mb-2">Shooter</label>
            <select
              value={selectedShooterId ?? ''}
              onChange={(e) => setSelectedShooterId(e.target.value || null)}
              className="field w-full sm:max-w-sm"
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

        {/* ── Quick stats ─────────────────────────────────────────────────── */}
        {!loading && sessions.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up stagger-1">
            {[
              { label: 'Total Sessions', value: stats.total,      sub: 'all time' },
              { label: 'This Month',     value: stats.thisMonth,  sub: 'sessions logged' },
              { label: 'Total Shots',    value: stats.totalShots, sub: 'across all sessions' },
              { label: 'Weapons',        value: stats.weapons,    sub: 'unique weapons used' },
            ].map((stat) => (
              <div key={stat.label} className="card px-4 py-3.5">
                <p className="label">{stat.label}</p>
                <p className="score-value text-accent text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-text-muted text-[10px] font-display uppercase tracking-widest mt-0.5">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters ────────────────────────────────────────────────────── */}
        {!loading && sessions.length > 1 && (
          <div className="flex flex-wrap gap-2 animate-slide-up">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sessions..."
              className="field text-xs py-1.5 px-3 w-full sm:w-48"
            />
            <select
              value={filterDisc}
              onChange={e => setFilterDisc(e.target.value)}
              className="field text-xs py-1.5 px-3 max-w-[200px]"
            >
              {disciplines.map(d => <option key={d} value={d}>{d === 'All' ? 'All Disciplines' : d}</option>)}
            </select>
            {modes.length > 2 && (
              <select
                value={filterMode}
                onChange={e => setFilterMode(e.target.value)}
                className="field text-xs py-1.5 px-3 max-w-[200px]"
              >
                {modes.map(m => <option key={m} value={m}>{m === 'All' ? 'All Modes' : m}</option>)}
              </select>
            )}
            {(filterDisc !== 'All' || filterMode !== 'All' || search) && (
              <button
                onClick={() => { setFilterDisc('All'); setFilterMode('All'); setSearch(''); }}
                className="text-xs font-display px-3 py-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                style={{ background: 'var(--chip-bg)', border: '1px solid var(--glass-border)' }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div role="alert"
            className="px-4 py-3 bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.3)]
                       rounded-lg text-[#FF4D6D] text-sm animate-slide-down">
            {error}
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} height={64} animationDelay={i * 60} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          /* ── Session groups ──────────────────────────────────────────── */
          <div className="space-y-6">
            {months.map((month, gi) => (
              <div key={month} className="animate-slide-up" style={{ animationDelay: `${gi * 80}ms` }}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="label">{month}</p>
                  <span className="text-text-muted text-xs font-display">
                    {grouped[month].length} session{grouped[month].length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="card overflow-hidden">
                  {grouped[month].map((session, i) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      isLast={i === grouped[month].length - 1}
                      deleting={deleting === session.id}
                      confirming={confirmId === session.id}
                      onConfirm={() => setConfirmId(session.id)}
                      onCancel={() => setConfirmId(null)}
                      onDelete={() => void handleDelete(session.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── Session Row ───────────────────────────────────────────────────────────────

function SessionRow({
  session,
  isLast,
  deleting,
  confirming,
  onConfirm,
  onCancel,
  onDelete,
}: {
  session: Session;
  isLast: boolean;
  deleting: boolean;
  confirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const color = discColor(session.discipline);
  const date  = new Date(session.sessionDate);

  return (
    <div
      className={`relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 sm:py-4 table-row-hover min-h-[64px]
                  ${!isLast ? 'border-b border-border-subtle/60' : ''}`}
    >
      {/* Discipline colour accent bar */}
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r"
        style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
        aria-hidden="true"
      />

      {/* Date badge */}
      <div className="shrink-0 w-14 text-center">
        <p className="text-text-primary font-display font-bold text-xl leading-none">
          {date.getDate()}
        </p>
        <p className="text-text-muted text-[10px] font-display uppercase tracking-wide">
          {date.toLocaleDateString('en-US', { month: 'short' })}
        </p>
        <p className="text-text-muted text-[10px] font-data mt-0.5 leading-none">
          {new Date(session.sessionDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </p>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-text-primary font-semibold text-sm truncate">{session.discipline}</p>
          <StatusBadge variant="discipline" label={session.weaponType} size="sm" />
          {session.trainingMode && (
            <span
              className="text-[10px] font-display uppercase tracking-wide px-2 py-0.5 rounded"
              style={{
                color: TRAINING_MODE_COLORS[session.trainingMode] ?? '#8892A4',
                backgroundColor: `${TRAINING_MODE_COLORS[session.trainingMode] ?? '#8892A4'}18`,
              }}
            >
              {session.trainingMode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-text-muted text-[11px] font-display uppercase tracking-wide">
          <span className="text-text-secondary normal-case tracking-normal font-data">
            Started {formatSessionStart(session.sessionDate)}
          </span>
          <span className="opacity-30">·</span>
          <span>{session.distance}m</span>
          <span className="opacity-30">·</span>
          <span>{session.numberOfShots} shots</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {confirming ? (
          /* Inline delete confirm */
          <div className="flex items-center gap-2 animate-slide-down">
            <span className="text-[#FF4D6D] text-xs font-display">Delete?</span>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-xs px-2.5 py-1 rounded bg-[rgba(255,77,109,0.15)]
                         border border-[rgba(255,77,109,0.4)] text-[#FF4D6D]
                         hover:bg-[rgba(255,77,109,0.25)] transition-colors font-display uppercase tracking-wide"
            >
              {deleting ? '…' : 'Yes'}
            </button>
            <button
              onClick={onCancel}
              className="text-xs px-2.5 py-1 rounded border border-border-subtle
                         text-text-secondary hover:text-text-primary transition-colors font-display uppercase tracking-wide"
            >
              No
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onConfirm}
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                         text-text-muted hover:text-[#FF4D6D] hover:bg-[rgba(255,77,109,0.08)]
                         transition-all duration-150"
              aria-label="Delete session"
            >
              <TrashIcon />
            </button>

            <Link
              href={`/sessions/${session.id}`}
              className="btn btn-ghost text-xs py-2 px-3 min-h-[36px] flex items-center"
            >
              View →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="card p-16 flex flex-col items-center text-center animate-fade-in">
      {/* Animated target SVG */}
      <div className="relative w-20 h-20 mb-6 opacity-30">
        <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden="true">
          <circle cx="40" cy="40" r="38" stroke="#F5A623" strokeWidth="1.5" fill="none" />
          <circle cx="40" cy="40" r="26" stroke="#F5A623" strokeWidth="1.5" fill="none" />
          <circle cx="40" cy="40" r="14" stroke="#F5A623" strokeWidth="1.5" fill="none" />
          <circle cx="40" cy="40" r="4"  fill="#F5A623" />
          <line x1="40" y1="2" x2="40" y2="18" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="62" x2="40" y2="78" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="40" x2="18" y2="40" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="62" y1="40" x2="78" y2="40" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-text-primary font-display font-bold text-xl">No sessions yet</p>
      <p className="text-text-muted text-sm mt-2 max-w-xs">
        Start your first training session to begin tracking your performance and scores.
      </p>
      <Link href="/sessions/new" className="btn btn-primary text-sm py-2.5 px-6 mt-6">
        Create First Session
      </Link>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <polyline points="1,3 13,3" />
      <path d="M4 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M11 3l-1 9H4L3 3" />
    </svg>
  );
}
