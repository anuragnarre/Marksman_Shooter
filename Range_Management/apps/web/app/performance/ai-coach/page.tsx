// apps/web/app/ai-coach/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../../components/AppShell';
import { apiFetch } from '../../../lib/api';
import { formatSessionStart } from '../../../lib/session-time';
import { SkeletonCard } from '../../../components/ui/SkeletonCard';
import { useCoachShooter } from '../../../lib/use-coach-shooter';
import type {
  Session,
  AiCoachAnalysis,
  AiCoachFinding,
  AiCoachCategory,
  AiCoachSeverity,
} from '@shooting-platform/shared-types';
import { PerformanceSectionNav } from '../../../components/performance/PerformanceSectionNav';

// ── Category metadata ─────────────────────────────────────────────────────────

const CATEGORY_META: Record<AiCoachCategory, { label: string; color: string; bg: string; icon: string }> = {
  positioning:  { label: 'Positioning',  color: '#4FC3F7', bg: 'rgba(79,195,247,0.08)',  icon: '⊕' },
  trigger:      { label: 'Trigger',      color: '#F5A623', bg: 'rgba(245,166,35,0.08)',  icon: '◎' },
  breathing:    { label: 'Breathing',    color: '#00E5A0', bg: 'rgba(0,229,160,0.08)',   icon: '〜' },
  consistency:  { label: 'Consistency',  color: '#F5A623', bg: 'rgba(245,166,35,0.08)',  icon: '≈' },
  endurance:    { label: 'Endurance',    color: '#FF4D6D', bg: 'rgba(255,77,109,0.08)',  icon: '⟳' },
  sight:        { label: 'Sight',        color: '#4FC3F7', bg: 'rgba(79,195,247,0.08)',  icon: '⊙' },
  general:      { label: 'General',      color: 'var(--text-secondary)', bg: 'rgba(136,146,164,0.08)', icon: '◆' },
};

const SEVERITY_META: Record<AiCoachSeverity, { label: string; color: string; border: string; bg: string }> = {
  critical: { label: 'Critical', color: '#FF4D6D', border: 'rgba(255,77,109,0.3)', bg: 'rgba(255,77,109,0.06)' },
  moderate: { label: 'Moderate', color: '#F5A623', border: 'rgba(245,166,35,0.3)',  bg: 'rgba(245,166,35,0.06)' },
  positive: { label: 'Positive', color: '#00E5A0', border: 'rgba(0,229,160,0.3)',   bg: 'rgba(0,229,160,0.06)'  },
};

// ── Analysis history (localStorage) ──────────────────────────────────────────

const HISTORY_KEY = 'marksman_ai_history_v1';

interface HistoryEntry {
  sessionId:   string;
  sessionLabel: string;
  analysis:    AiCoachAnalysis;
  savedAt:     string;
}

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); }
  catch { return []; }
}

function saveToHistory(entry: HistoryEntry) {
  const existing = loadHistory();
  // Replace if same session already saved
  const filtered = existing.filter(e => e.sessionId !== entry.sessionId);
  const next = [entry, ...filtered].slice(0, 20); // keep last 20
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function deleteFromHistory(sessionId: string) {
  const existing = loadHistory();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.filter(e => e.sessionId !== sessionId)));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiCoachPage() {
  const {
    isCoach,
    authLoading,
    shooters,
    selectedShooter,
    selectedShooterId,
    setSelectedShooterId,
  } = useCoachShooter();
  const [sessions,  setSessions]  = useState<Session[]>([]);
  const [selected,  setSelected]  = useState<string>('');
  const [analysis,  setAnalysis]  = useState<AiCoachAnalysis | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [history,   setHistory]   = useState<HistoryEntry[]>([]);
  const [historyTab, setHistoryTab] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isCoach && !selectedShooterId) {
      setSessions([]);
      setSelected('');
      setAnalysis(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setAnalysis(null);
    const query = isCoach && selectedShooterId
      ? `?shooterId=${encodeURIComponent(selectedShooterId)}`
      : '';
    apiFetch<Session[]>(`/sessions${query}`)
      .then((s) => {
        setSessions(s);
        if (s.length > 0) setSelected(s[0].id);
        else setSelected('');
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authLoading, isCoach, selectedShooterId]);

  async function runAnalysis() {
    if (!selected) return;
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await apiFetch<AiCoachAnalysis>('/ai-coach/analyze', {
        method: 'POST',
        body: JSON.stringify({ sessionId: selected }),
      });
      setAnalysis(result);
      // Save to history
      const sess = sessions.find(s => s.id === selected);
      const label = sess
        ? `${sess.discipline} ${sess.distance}m · ${new Date(sess.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        : selected;
      const entry: HistoryEntry = { sessionId: selected, sessionLabel: label, analysis: result, savedAt: new Date().toISOString() };
      saveToHistory(entry);
      setHistory(loadHistory());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleDeleteHistory(sessionId: string) {
    deleteFromHistory(sessionId);
    setHistory(loadHistory());
  }

  const selectedSession = sessions.find((s) => s.id === selected);

  return (
    <AppShell title="AI Coach">
      <div className="space-y-8 max-w-4xl">

        <div className="animate-slide-up">
          <h1 className="font-display font-bold text-2xl text-text-primary">Performance</h1>
          <p className="text-text-muted text-sm mt-1">
            Session-level coaching insights powered by AI
          </p>
        </div>

        <PerformanceSectionNav />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="animate-slide-up">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.25)]
                              flex items-center justify-center">
                <SparkleIcon />
              </div>
              <h2 className="font-display font-bold text-2xl text-text-primary">AI Coach</h2>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setHistoryTab(!historyTab)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all duration-200"
                style={{
                  background: historyTab ? 'rgba(245,166,35,0.12)' : 'var(--chip-bg)',
                  color: historyTab ? '#F5A623' : 'var(--text-secondary)',
                  border: historyTab ? '1px solid rgba(245,166,35,0.25)' : '1px solid var(--glass-border)',
                }}
              >
                History ({history.length})
              </button>
            )}
          </div>
          <p className="text-text-secondary text-sm">
            Powered by Claude Opus 4.6. Select a session and get expert coaching feedback based on
            your shot placement, scoring patterns, and technical fundamentals.
          </p>
          {isCoach && (
            <p className="text-text-muted text-xs mt-2">
              Viewing shooter: <span className="text-text-primary">{selectedShooter?.name ?? 'None selected'}</span>
            </p>
          )}
        </div>

        {/* ── History panel ────────────────────────────────────────────────── */}
        {historyTab && history.length > 0 && (
          <div className="rounded-xl border border-border-subtle bg-surface overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <p className="font-display font-semibold text-sm text-text-primary">Analysis History</p>
              <p className="text-[10px] text-text-muted font-display">Stored locally · last 20</p>
            </div>
            <div>
              {history.map(entry => {
                const rColor = entry.analysis.performanceRating >= 8 ? '#00E5A0'
                  : entry.analysis.performanceRating >= 6 ? '#F5A623' : '#FF4D6D';
                return (
                  <div key={entry.sessionId} className="px-5 py-4 transition-colors group hover:bg-subtle"
                       style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-sm text-text-primary truncate">{entry.sessionLabel}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          Analysed {new Date(entry.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {entry.analysis.findings.filter(f => f.severity === 'critical').length > 0 && (
                            <span className="text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.25)] text-[#FF4D6D]">
                              {entry.analysis.findings.filter(f => f.severity === 'critical').length} critical
                            </span>
                          )}
                          {entry.analysis.findings.filter(f => f.severity === 'positive').length > 0 && (
                            <span className="text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.2)] text-[#00E5A0]">
                              {entry.analysis.findings.filter(f => f.severity === 'positive').length} positive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-data font-bold text-lg" style={{ color: rColor }}>{entry.analysis.performanceRating.toFixed(1)}</p>
                          <p className="text-[9px] text-text-muted font-display">/10</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => { setAnalysis(entry.analysis); setHistoryTab(false); }}
                            className="text-[10px] font-display font-semibold text-[#F5A623] hover:text-amber-300 transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteHistory(entry.sessionId)}
                            className="text-[10px] font-display text-text-muted hover:text-[#FF4D6D] transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCoach && (
          <div className="card p-4 animate-slide-up">
            <label className="label mb-2 block">Shooter</label>
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

        {/* ── Session selector ────────────────────────────────────────────── */}
        <div className="animate-slide-up relative rounded-xl border border-border-subtle bg-surface p-6 overflow-hidden">
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(245,166,35,0.45),transparent)' }}
          />
          <p className="label mb-4">Select Session to Analyse</p>

          {loading ? (
            <SkeletonCard height={44} animationDelay={0} />
          ) : sessions.length === 0 ? (
            <p className="text-text-muted text-sm">No sessions found. Record a session first.</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selected}
                onChange={(e) => { setSelected(e.target.value); setAnalysis(null); }}
                className="field flex-1"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSessionStart(s.sessionDate, { includeYear: true })} — {s.discipline} {s.distance}m · {s.numberOfShots} shots
                  </option>
                ))}
              </select>

              <button
                onClick={() => void runAnalysis()}
                disabled={analyzing || !selected}
                className="btn btn-primary px-8 shrink-0 disabled:opacity-50"
              >
                {analyzing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#F5A623]/30 border-t-[#F5A623]
                                     rounded-full animate-spin" />
                    Analysing…
                  </span>
                ) : (
                  'Analyse Session'
                )}
              </button>
            </div>
          )}

          {/* Selected session quick stats */}
          {selectedSession && !analyzing && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border-subtle">
              {[
                { label: 'Discipline', value: selectedSession.discipline },
                { label: 'Distance',   value: `${selectedSession.distance}m` },
                { label: 'Weapon',     value: selectedSession.weaponType },
                { label: 'Shots',      value: String(selectedSession.numberOfShots) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="label text-[9px]">{label}</p>
                  <p className="text-text-primary text-sm font-display font-semibold">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div role="alert"
            className="flex items-center gap-3 px-4 py-3 rounded-xl
                       bg-[rgba(255,77,109,0.08)] border border-[rgba(255,77,109,0.25)]
                       text-[#FF4D6D] text-sm animate-slide-down">
            <AlertIcon /> {error}
          </div>
        )}

        {/* ── Analyzing state ──────────────────────────────────────────────── */}
        {analyzing && <AnalyzingState />}

        {/* ── Analysis results ────────────────────────────────────────────── */}
        {analysis && !analyzing && <AnalysisResults analysis={analysis} />}

      </div>
    </AppShell>
  );
}

/* ── Analyzing animation ─────────────────────────────────────────────────── */

function AnalyzingState() {
  const stages = [
    'Loading shot data…',
    'Computing analytics…',
    'Analysing MPI and group patterns…',
    'Evaluating technique fundamentals…',
    'Generating coaching feedback…',
  ];
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStage((s) => Math.min(s + 1, stages.length - 1)), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-[rgba(245,166,35,0.2)] bg-surface p-12
                    flex flex-col items-center text-center animate-fade-in">
      {/* Pulsing crosshair */}
      <div className="relative mb-8">
        <svg width="80" height="80" viewBox="0 0 80 80" className="animate-spin" style={{ animationDuration: '8s' }}>
          {[32, 24, 16, 8].map((r, i) => (
            <circle key={r} cx="40" cy="40" r={r} fill="none" stroke="#F5A623"
              strokeWidth="0.8" opacity={0.15 + i * 0.15} />
          ))}
          <line x1="40" y1="4"  x2="40" y2="20" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="40" y1="60" x2="40" y2="76" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4"  y1="40" x2="20" y2="40" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="60" y1="40" x2="76" y2="40" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#F5A623] animate-pulse" />
        </div>
      </div>

      <p className="font-display font-bold text-text-primary text-lg mb-2">
        Claude Opus 4.6 is analysing your session
      </p>
      <p className="text-[#F5A623] text-sm font-display animate-pulse">
        {stages[stage]}
      </p>
      <p className="text-text-muted text-xs mt-4">
        Expert coaching feedback takes 10–20 seconds
      </p>
    </div>
  );
}

/* ── Analysis Results ────────────────────────────────────────────────────── */

function AnalysisResults({ analysis }: { analysis: AiCoachAnalysis }) {
  const ratingColor =
    analysis.performanceRating >= 8 ? '#00E5A0' :
    analysis.performanceRating >= 6 ? '#F5A623' : '#FF4D6D';

  const critical = analysis.findings.filter((f) => f.severity === 'critical');
  const moderate = analysis.findings.filter((f) => f.severity === 'moderate');
  const positive = analysis.findings.filter((f) => f.severity === 'positive');

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Overall card ─────────────────────────────────────────── */}
      <div className="relative rounded-xl border border-[rgba(245,166,35,0.25)] bg-surface p-6 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px"
             style={{ background: 'linear-gradient(90deg,transparent,#F5A623,transparent)' }} />
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at 90% 50%,rgba(245,166,35,0.05) 0%,transparent 60%)' }} />

        <div className="relative flex items-start gap-6">
          {/* Rating dial */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <RatingDial rating={analysis.performanceRating} color={ratingColor} />
            <p className="label text-[9px] text-center">Performance</p>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <SparkleIcon />
              <p className="font-display font-bold text-text-primary text-base tracking-wide">
                Coach Assessment
              </p>
              <span className="ml-auto text-[10px] text-text-muted font-display uppercase tracking-widest">
                {analysis.model}
              </span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed">
              {analysis.overallAssessment}
            </p>

            {/* Findings summary chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {critical.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]
                                 font-display font-bold uppercase tracking-widest
                                 bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.3)] text-[#FF4D6D]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D]" />
                  {critical.length} critical
                </span>
              )}
              {moderate.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]
                                 font-display font-bold uppercase tracking-widest
                                 bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.3)] text-[#F5A623]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
                  {moderate.length} moderate
                </span>
              )}
              {positive.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]
                                 font-display font-bold uppercase tracking-widest
                                 bg-[rgba(0,229,160,0.1)] border border-[rgba(0,229,160,0.3)] text-[#00E5A0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" />
                  {positive.length} positive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Prioritized actions ───────────────────────────────────── */}
      {analysis.prioritizedActions.length > 0 && (
        <div className="rounded-xl border border-border-subtle bg-surface p-6">
          <p className="label mb-4">Top Priority Actions</p>
          <ol className="space-y-3">
            {analysis.prioritizedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full border border-[rgba(245,166,35,0.4)]
                                 bg-[rgba(245,166,35,0.08)] flex items-center justify-center
                                 text-[#F5A623] font-display font-bold text-[11px] shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-text-secondary text-sm leading-relaxed">{action}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Findings ─────────────────────────────────────────────── */}
      <div>
        <p className="label mb-4">Detailed Findings ({analysis.findings.length})</p>
        <div className="space-y-4">
          {analysis.findings.map((finding, i) => (
            <FindingCard key={i} finding={finding} index={i} />
          ))}
        </div>
      </div>

      {/* ── Next session focus ────────────────────────────────────── */}
      <div className="rounded-xl border border-[rgba(0,229,160,0.2)] bg-[rgba(0,229,160,0.04)] p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-pulse" />
          <p className="text-[#00E5A0] font-display text-xs uppercase tracking-widest font-semibold">
            Next Session Focus
          </p>
        </div>
        <p className="text-text-primary text-sm leading-relaxed">{analysis.nextSessionFocus}</p>
      </div>

      {/* Footer */}
      <p className="text-text-muted text-[11px] text-center font-display">
        Generated {new Date(analysis.generatedAt).toLocaleString()} · {analysis.model}
      </p>

    </div>
  );
}

/* ── FindingCard ─────────────────────────────────────────────────────────── */

function FindingCard({ finding, index }: { finding: AiCoachFinding; index: number }) {
  const [open, setOpen] = useState(true);
  const cat = CATEGORY_META[finding.category] ?? CATEGORY_META.general;
  const sev = SEVERITY_META[finding.severity] ?? SEVERITY_META.moderate;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
      style={{
        border: `1px solid ${sev.border}`,
        background: sev.bg,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        {/* Category icon */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
             style={{ background: cat.bg, color: cat.color }}>
          <span className="font-display font-bold text-base leading-none">{cat.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold text-text-primary text-sm">{finding.title}</p>
            <span className="text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color: cat.color, background: cat.bg }}>
              {cat.label}
            </span>
            <span className="text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color: sev.color, border: `1px solid ${sev.border}`, background: sev.bg }}>
              {sev.label}
            </span>
          </div>
          <p className="text-text-muted text-[11px] mt-0.5 truncate">{finding.observation}</p>
        </div>

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" className="text-text-muted"
             strokeWidth="1.5" strokeLinecap="round"
             style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }}>
          <polyline points="5,3 9,7 5,11" />
        </svg>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border-subtle/60">
          <div className="pt-4 space-y-3">
            <div>
              <p className="label text-[9px] mb-1">Observation</p>
              <p className="text-text-secondary text-sm leading-relaxed">{finding.observation}</p>
            </div>
            <div>
              <p className="label text-[9px] mb-1" style={{ color: cat.color }}>Suggestion</p>
              <p className="text-text-primary text-sm leading-relaxed">{finding.suggestion}</p>
            </div>
            {finding.drill && (
              <div className="rounded-lg border border-[rgba(245,166,35,0.2)] bg-[rgba(245,166,35,0.04)] p-3">
                <p className="label text-[9px] mb-1 text-[#F5A623]">Drill</p>
                <p className="text-text-secondary text-sm leading-relaxed">{finding.drill}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Rating Dial ─────────────────────────────────────────────────────────── */

function RatingDial({ rating, color }: { rating: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const filled = (rating / 10) * circ;

  return (
    <div className="relative w-20 h-20">
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="5" style={{ stroke: 'var(--border-subtle)' }} />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}70)`, transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-jetbrains font-bold text-xl leading-none" style={{ color }}>
          {rating.toFixed(1)}
        </p>
        <p className="text-text-muted text-[9px] font-display">/10</p>
      </div>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────────────────────────── */

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" />
      <circle cx="9" cy="9" r="2.5" fill="#F5A623" stroke="none" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M7 1.5L13 12H1z" />
      <line x1="7" y1="6" x2="7" y2="8.5" />
      <circle cx="7" cy="10.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
