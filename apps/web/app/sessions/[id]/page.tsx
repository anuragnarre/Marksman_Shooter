// apps/web/app/sessions/[id]/page.tsx
'use client';

// DESIGN NOTE: Flagship page. Left 7-col canvas + right 5-col analytics panel.
// "Add Shots" panel has 4 tabs: File Import | Click Target | Manual Entry | Photo / Camera.
// Interactive tab lets the shooter click the live target to place shots.
// Photo tab supports both file upload and live camera capture.

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useIsMobile } from '../../../lib/use-mobile';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { apiFetch } from '../../../lib/api';
import { AppShell } from '../../../components/AppShell';
import { TargetCanvas } from '../../../components/TargetCanvas';
import { ScoreOverTimeChart, ScoreDistributionChart } from '../../../components/AnalyticsCharts';
import { ShotTable } from '../../../components/ui/ShotTable';
import { SuggestionItem } from '../../../components/ui/SuggestionItem';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { MetricCard } from '../../../components/ui/MetricCard';
import { ProgressStep } from '../../../components/ui/ProgressStep';
import { SkeletonCard } from '../../../components/ui/SkeletonCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type {
  AnalyticsResult,
  Session,
  Shot,
  SuggestionResult,
  DeepAnalysis,
  SessionContextInput,
} from '@shooting-platform/shared-types';
import { TRAINING_MODE_COLORS } from '@shooting-platform/shared-types';

type AddShotsTab = 'import' | 'interactive' | 'manual' | 'photo';
type PageTab = 'session' | 'performance';

// ── Score from target coordinates — matches vision service ring thresholds ────
const RING_RADII  = [0.05, 0.10, 0.18, 0.27, 0.37, 0.48, 0.60, 0.73, 0.86, 1.00];
const RING_SCORES = [10.9, 10.0, 9.0,  8.0,  7.0,  6.0,  5.0,  4.0,  3.0,  2.0];

function scoreFromCoords(x: number, y: number): number {
  const dist = Math.sqrt(x * x + y * y);
  const norm = dist / 10; // target coords ±10; normalise to 0–1
  for (let i = 0; i < RING_RADII.length; i++) {
    if (norm <= RING_RADII[i]) return RING_SCORES[i];
  }
  return 1.0;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session,     setSession]     = useState<Session | null>(null);
  const [analytics,   setAnalytics]   = useState<AnalyticsResult | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [isLive,      setIsLive]      = useState(false);
  const [pageTab,     setPageTab]     = useState<PageTab>('session');
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [s, a, sug] = await Promise.all([
        apiFetch<Session>(`/sessions/${id}`),
        apiFetch<AnalyticsResult>(`/analytics/session/${id}`),
        apiFetch<SuggestionResult>(`/suggestions/session/${id}`),
      ]);
      setSession(s);
      setAnalytics(a);
      setSuggestions(sug.suggestions);
      // Load deep analysis non-blocking
      apiFetch<DeepAnalysis>(`/performance/deep-analysis/${id}`)
        .then(setDeepAnalysis)
        .catch(() => {});
    } catch {
      // session 404 handled via empty state
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadAll();

    const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001');
    socketRef.current = socket;
    socket.emit('joinSession', id);

    socket.on('session.updated', () => {
      setIsLive(true);
      void loadAll();
    });
    socket.on('feedback.added', () => void loadAll());

    return () => {
      socket.emit('leaveSession', id);
      socket.disconnect();
    };
  }, [id, loadAll]);

  const isMobile = useIsMobile();
  const shots = ((session?.shots ?? []) as Shot[]);

  const title = session
    ? `${session.discipline} — ${new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'Session';

  return (
    <AppShell title={title} isLive={isLive}>
      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-start flex-wrap gap-4 animate-slide-up">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display font-bold text-2xl text-[#F0F4FF]">
                  {session?.discipline}
                </h1>
                {isLive && <StatusBadge variant="live" size="sm" />}
              </div>
              <div className="flex flex-wrap gap-2">
                {session && (
                  <>
                    <span className="chip">
                      <ChipCalendarIcon />
                      {new Date(session.sessionDate).toLocaleDateString()}
                    </span>
                    <span className="chip"><ChipTargetIcon /> {session.distance}m</span>
                    <span className="chip"><ChipWeaponIcon /> {session.weaponType}</span>
                    <span className="chip"><ChipShotIcon /> {shots.length}/{session.numberOfShots} shots</span>
                    {session.trainingMode && (
                      <span
                        className="chip text-[11px] font-display uppercase tracking-wide"
                        style={{
                          color: TRAINING_MODE_COLORS[session.trainingMode] ?? '#8892A4',
                          borderColor: `${TRAINING_MODE_COLORS[session.trainingMode] ?? '#8892A4'}40`,
                        }}
                      >
                        {session.trainingMode}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/sessions" className="btn btn-ghost text-xs py-2">← Sessions</Link>
              <button
                onClick={() => router.push(`/sessions/zen?id=${id}`)}
                className="btn text-xs py-2 px-3"
                style={{
                  background: 'rgba(245,166,35,0.1)',
                  borderColor: 'rgba(245,166,35,0.25)',
                  color: '#F5A623',
                }}
              >
                Zen Mode
              </button>
            </div>
          </div>

          {/* ── Page Tabs ───────────────────────────────────────────────── */}
          <div className="flex gap-1 animate-slide-up" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {([['session', 'Session'], ['performance', 'Performance']] as [PageTab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setPageTab(t)}
                className="px-4 py-2.5 text-xs font-display font-semibold uppercase tracking-wide transition-all duration-200"
                style={{
                  color: pageTab === t ? '#F5A623' : '#4A5568',
                  borderBottom: pageTab === t ? '2px solid #F5A623' : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {pageTab === 'performance' ? (
            <PerformanceTab
              sessionId={id}
              analytics={analytics}
              shots={shots}
              deepAnalysis={deepAnalysis}
            />
          ) : (
            <>
              {/* ── Add Shots Panel ────────────────────────────────────────── */}
              {session && (
                <AddShotsPanel
                  sessionId={id}
                  nextShotNumber={shots.length + 1}
                  onShotsAdded={loadAll}
                />
              )}

          {/* ── Analytics Metrics ────────────────────────────────────────── */}
          {analytics && shots.length > 0 && (
            <div className="animate-slide-up stagger-3">
              <p className="label mb-3">Performance Metrics</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard label="Avg Score"    value={analytics.averageScore} decimals={2} color="accent"  animationDelay={0}   />
                <MetricCard label="Best Shot"    value={analytics.maxScore}     decimals={1} color="emerald" animationDelay={60}  />
                <MetricCard label="Std Dev"      value={analytics.stdDev}       decimals={3} color="blue"    animationDelay={120} />
                <MetricCard label="Group Radius" value={analytics.groupRadius}  decimals={2} color="blue"    animationDelay={180} />
                <MetricCard label="MPI X"        value={analytics.mpi.x}        decimals={2} color="accent"  animationDelay={240} />
                <MetricCard label="MPI Y"        value={analytics.mpi.y}        decimals={2} color="accent"  animationDelay={300} />
              </div>
            </div>
          )}

          {/* ── Canvas + Analytics side by side ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Target canvas — 7 cols */}
            <div className="lg:col-span-7 card p-5 animate-slide-up stagger-4">
              <h3 className="font-display font-semibold text-base text-[#F0F4FF] mb-4">
                Target View
              </h3>
              <TargetCanvas shots={shots} mpi={analytics?.mpi} size={isMobile ? 320 : 420} />
            </div>

            {/* Right column — 5 cols */}
            <div className="lg:col-span-5 space-y-4">

              {shots.length > 0 && (
                <>
                  <div className="card p-4 animate-slide-up stagger-5">
                    <h3 className="font-display font-semibold text-sm text-[#F0F4FF] mb-3">Score Trend</h3>
                    <ScoreOverTimeChart shots={shots} average={analytics?.averageScore} />
                  </div>
                  <div className="card p-4 animate-slide-up stagger-6">
                    <h3 className="font-display font-semibold text-sm text-[#F0F4FF] mb-3">Distribution</h3>
                    <ScoreDistributionChart shots={shots} />
                  </div>
                </>
              )}

              {suggestions.length > 0 && (
                <div className="card p-4 animate-slide-up stagger-7">
                  <h3 className="font-display font-semibold text-sm text-[#F0F4FF] mb-3 flex items-center gap-2">
                    <span className="text-accent"><ChipTargetIcon /></span>
                    AI Suggestions
                  </h3>
                  <div className="space-y-2" role="list" aria-label="Coaching suggestions">
                    {suggestions.map((s, i) => (
                      <SuggestionItem
                        key={i}
                        type={getSuggestionType(s)}
                        title={s}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length === 0 && shots.length > 0 && (
                <div className="card p-4">
                  <SuggestionItem
                    type="success"
                    title="Great session — no issues detected."
                    detail="Keep up the consistent technique."
                    index={0}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Shot Table ───────────────────────────────────────────────── */}
          <div className="card animate-slide-up stagger-8">
            <div className="flex items-center justify-between p-5 pb-0">
              <h3 className="font-display font-semibold text-base text-[#F0F4FF]">
                Shots {shots.length > 0 && <span className="text-[#4A5568] font-data text-sm ml-1">({shots.length})</span>}
              </h3>
            </div>
            <div className="mt-2">
              <ShotTable shots={shots} />
            </div>
          </div>

          {/* Coach feedback */}
          {session?.feedback && session.feedback.length > 0 && (
            <div className="card p-5 animate-slide-up stagger-9">
              <h3 className="font-display font-semibold text-base text-[#F0F4FF] mb-4">
                Coach Feedback
              </h3>
              <div className="space-y-3">
                {session.feedback.map((fb) => (
                  <div key={fb.id}
                    className="border-l-2 border-[#4FC3F7] bg-[rgba(79,195,247,0.06)] rounded-r-lg px-4 py-3">
                    <p className="text-[#F0F4FF] text-sm">{fb.feedback}</p>
                    <p className="text-[#4A5568] text-xs mt-2 font-display uppercase tracking-wide">
                      {fb.coach?.name ?? 'Coach'} · {new Date(fb.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}

// ── Performance Tab ──────────────────────────────────────────────────────────

function PerformanceTab({
  sessionId,
  analytics,
  shots,
  deepAnalysis,
}: {
  sessionId: string;
  analytics: AnalyticsResult | null;
  shots: Shot[];
  deepAnalysis: DeepAnalysis | null;
}) {
  const [ctx,         setCtx]         = useState<SessionContextInput>({});
  const [saving,      setSaving]       = useState(false);
  const [saved,       setSaved]        = useState(false);
  const [hasMotion,   setHasMotion]    = useState(false);
  const [capturing,   setCapturing]    = useState(false);
  const [stability,   setStability]    = useState<number | null>(null);
  const [motionBars,  setMotionBars]   = useState<[number, number, number]>([0, 0, 0]);
  const samplesRef    = useRef<number[]>([]);
  const captureTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      setHasMotion(true);
    }
  }, []);

  async function handleSaveContext() {
    setSaving(true);
    try {
      await apiFetch(`/performance/session-context/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify(ctx),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function startCapture() {
    samplesRef.current = [];
    setCapturing(true);
    setStability(null);

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.acceleration;
      if (!acc) return;
      const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
      samplesRef.current.push(mag);
      setMotionBars([Math.min(1, (acc.x ?? 0) / 5), Math.min(1, (acc.y ?? 0) / 5), Math.min(1, (acc.z ?? 0) / 5)]);
    };

    window.addEventListener('devicemotion', handler);

    captureTimer.current = setTimeout(() => {
      window.removeEventListener('devicemotion', handler);
      const s = samplesRef.current;
      if (s.length > 0) {
        const mean = s.reduce((a, b) => a + b, 0) / s.length;
        const variance = s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length;
        const score = Math.max(0, Math.round(100 - Math.min(100, variance * 100)));
        setStability(score);
      }
      setCapturing(false);
    }, 10000);
  }

  // Series averages chart data
  const seriesData = (analytics?.seriesAverages ?? []).map((avg, i) => ({
    series: `S${i + 1}`,
    avg: Math.round(avg * 100) / 100,
  }));

  // Outlier shot set
  const outlierSet = new Set(deepAnalysis?.outlierShots ?? []);

  return (
    <div className="space-y-5">

      {/* Fatigue area chart */}
      {seriesData.length >= 2 && (
        <div className="card p-5 animate-slide-up">
          <h3 className="font-display font-semibold text-sm text-[#F0F4FF] mb-4">Series Fatigue Chart</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={seriesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="fatigueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="series" tick={{ fill: '#4A5568', fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#4A5568', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(14,17,24,0.95)',
                  border: '1px solid rgba(245,166,35,0.2)',
                  borderRadius: 8,
                  color: '#F0F4FF',
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="avg" stroke="#F5A623" fill="url(#fatigueGrad)" strokeWidth={2} name="Avg Score" />
            </AreaChart>
          </ResponsiveContainer>
          {deepAnalysis && (
            <div className="flex gap-4 mt-3 text-xs font-display">
              <span style={{ color: '#4A5568' }}>
                Fatigue Index: <span style={{ color: deepAnalysis.fatigueIndex >= 0 ? '#00E5A0' : '#FF4D6D' }}>
                  {deepAnalysis.fatigueIndex > 0 ? '+' : ''}{deepAnalysis.fatigueIndex.toFixed(3)}
                </span>
              </span>
              <span style={{ color: '#4A5568' }}>
                Focus Score: <span style={{ color: '#4FC3F7' }}>{deepAnalysis.focusScore}/100</span>
              </span>
              {deepAnalysis.peakSeriesAvg > 0 && (
                <span style={{ color: '#4A5568' }}>
                  Peak: <span style={{ color: '#F5A623' }}>S{deepAnalysis.peakSeriesIndex + 1} ({deepAnalysis.peakSeriesAvg})</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Outlier-highlighted shot table */}
      {shots.length > 0 && (
        <div className="card animate-slide-up stagger-1">
          <div className="flex items-center justify-between p-5 pb-0">
            <h3 className="font-display font-semibold text-sm text-[#F0F4FF]">
              Shots
              {deepAnalysis && deepAnalysis.outlierShots.length > 0 && (
                <span className="ml-2 text-xs font-normal text-[#FF4D6D]">
                  {deepAnalysis.outlierShots.length} outlier{deepAnalysis.outlierShots.length !== 1 ? 's' : ''} highlighted
                </span>
              )}
            </h3>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {['#', 'Score', 'X', 'Y'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-display uppercase tracking-wide text-[#4A5568]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shots.map((s) => {
                  const isOutlier = outlierSet.has(s.shotNumber);
                  return (
                    <tr
                      key={s.id}
                      className="border-b transition-colors"
                      style={{
                        borderColor: 'rgba(255,255,255,0.03)',
                        background: isOutlier ? 'rgba(255,77,109,0.06)' : 'transparent',
                      }}
                    >
                      <td className="px-5 py-2 font-data text-[#4A5568]">{s.shotNumber}</td>
                      <td className="px-5 py-2 font-data font-bold" style={{
                        color: s.score >= 10.5 ? '#F5A623' : s.score >= 10 ? '#4FC3F7' : s.score >= 9 ? '#00E5A0' : '#FF4D6D',
                      }}>
                        {s.score}
                        {isOutlier && <span className="ml-2 text-[10px] text-[#FF4D6D] font-display">OUTLIER</span>}
                      </td>
                      <td className="px-5 py-2 font-data text-[#8892A4]">{s.x.toFixed(2)}</td>
                      <td className="px-5 py-2 font-data text-[#8892A4]">{s.y.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Session Context form */}
      <div className="card p-5 animate-slide-up stagger-2">
        <h3 className="font-display font-semibold text-sm text-[#F0F4FF] mb-4">Session Context</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label block mb-1">Heart Rate (bpm)</label>
            <input
              type="number"
              min={30}
              max={250}
              value={ctx.heartRate ?? ''}
              onChange={(e) => setCtx((c) => ({ ...c, heartRate: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="field w-full"
              placeholder="e.g. 72"
            />
          </div>
          <div>
            <label className="label block mb-1">Perceived Effort (RPE 1–10)</label>
            <input
              type="range"
              min={1}
              max={10}
              value={ctx.perceivedEffort ?? 5}
              onChange={(e) => setCtx((c) => ({ ...c, perceivedEffort: parseInt(e.target.value) }))}
              className="w-full accent-[#F5A623]"
            />
            <div className="flex justify-between text-xs text-[#4A5568] font-display mt-1">
              <span>1 Easy</span>
              <span className="font-bold" style={{ color: '#F5A623' }}>{ctx.perceivedEffort ?? 5}</span>
              <span>10 Max</span>
            </div>
          </div>
          <div>
            <label className="label block mb-1">Wind Condition</label>
            <select
              value={ctx.windCondition ?? ''}
              onChange={(e) => setCtx((c) => ({ ...c, windCondition: e.target.value || undefined }))}
              className="field w-full"
            >
              <option value="">Select</option>
              <option>None</option>
              <option>Light</option>
              <option>Moderate</option>
              <option>Strong</option>
            </select>
          </div>
          <div>
            <label className="label block mb-1">Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              value={ctx.temperature ?? ''}
              onChange={(e) => setCtx((c) => ({ ...c, temperature: e.target.value ? parseFloat(e.target.value) : undefined }))}
              className="field w-full"
              placeholder="e.g. 22"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label block mb-1">Notes</label>
            <textarea
              rows={2}
              value={ctx.notes ?? ''}
              onChange={(e) => setCtx((c) => ({ ...c, notes: e.target.value || undefined }))}
              className="field w-full resize-none"
              placeholder="Any additional context…"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSaveContext}
            disabled={saving}
            className="btn btn-primary text-xs py-2 px-4"
          >
            {saving ? 'Saving…' : 'Save Context'}
          </button>
          {saved && <span className="text-[#00E5A0] text-xs font-display">Saved!</span>}
        </div>
      </div>

      {/* Device Motion stability capture */}
      {hasMotion && (
        <div className="card p-5 animate-slide-up stagger-3">
          <h3 className="font-display font-semibold text-sm text-[#F0F4FF] mb-1">Capture Stability</h3>
          <p className="text-[#4A5568] text-xs mb-4">10-second hold to measure device steadiness (gyroscope)</p>

          {!capturing && stability === null && (
            <button
              onClick={startCapture}
              className="btn text-xs py-2 px-4"
            >
              Start 10s Capture
            </button>
          )}

          {capturing && (
            <div className="space-y-3">
              <p className="text-[#F5A623] text-sm font-display animate-pulse">Capturing… hold still</p>
              <div className="flex gap-2 items-end h-10">
                {motionBars.map((v, i) => (
                  <div
                    key={i}
                    className="w-8 rounded-t transition-all duration-100"
                    style={{
                      height: `${Math.abs(v) * 40}px`,
                      background: ['#F5A623', '#4FC3F7', '#00E5A0'][i],
                      opacity: 0.7,
                    }}
                  />
                ))}
                <span className="text-[#4A5568] text-xs ml-2">X · Y · Z</span>
              </div>
            </div>
          )}

          {stability !== null && (
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center font-data font-bold text-xl"
                style={{
                  background: stability >= 70 ? 'rgba(0,229,160,0.1)' : stability >= 40 ? 'rgba(245,166,35,0.1)' : 'rgba(255,77,109,0.1)',
                  border: `1.5px solid ${stability >= 70 ? '#00E5A0' : stability >= 40 ? '#F5A623' : '#FF4D6D'}40`,
                  color: stability >= 70 ? '#00E5A0' : stability >= 40 ? '#F5A623' : '#FF4D6D',
                }}
              >
                {stability}
              </div>
              <div>
                <p className="font-display font-semibold text-sm text-[#F0F4FF]">
                  Stability Score: {stability}/100
                </p>
                <p className="text-[#4A5568] text-xs mt-0.5">
                  {stability >= 70 ? 'Excellent steadiness' : stability >= 40 ? 'Moderate movement — work on hold' : 'High movement — check stance & breathing'}
                </p>
              </div>
              <button onClick={() => { setStability(null); setCapturing(false); }} className="btn btn-ghost text-xs py-1.5 ml-auto">
                Retry
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ── Add Shots Panel (4 tabs) ──────────────────────────────────────────────────

function AddShotsPanel({
  sessionId,
  nextShotNumber,
  onShotsAdded,
}: {
  sessionId: string;
  nextShotNumber: number;
  onShotsAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab,  setTab]  = useState<AddShotsTab>('interactive');

  const TABS: { id: AddShotsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'interactive', label: 'Click Target',   icon: <TabTargetIcon /> },
    { id: 'manual',      label: 'Manual Entry',   icon: <TabEditIcon /> },
    { id: 'photo',       label: 'Photo / Camera', icon: <TabCameraIcon /> },
    { id: 'import',      label: 'File Import',    icon: <TabImportIcon /> },
  ];

  return (
    <div className="card animate-slide-up stagger-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left
                   hover:bg-[rgba(245,166,35,0.03)] transition-colors group"
        aria-expanded={open}
      >
        <span className="font-display font-bold text-sm text-[#F0F4FF] tracking-wide uppercase">
          + Add Shots
        </span>
        <span className={`text-[#4A5568] transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-[#1E2433] animate-slide-down">
          {/* Tab bar */}
          <div className="flex border-b border-[#1E2433] overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-max flex items-center justify-center gap-1.5 py-3 px-4
                            text-xs font-display font-semibold uppercase tracking-widest
                            transition-colors duration-150 border-b-2 -mb-px
                            ${tab === t.id
                              ? 'text-accent border-accent'
                              : 'text-[#4A5568] hover:text-[#8892A4] border-transparent'
                            }`}
                aria-selected={tab === t.id}
                role="tab"
              >
                <span aria-hidden>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {tab === 'interactive' && (
              <InteractiveTab sessionId={sessionId} nextShotNumber={nextShotNumber} onSuccess={onShotsAdded} />
            )}
            {tab === 'manual' && (
              <ManualTab sessionId={sessionId} nextShotNumber={nextShotNumber} onSuccess={onShotsAdded} />
            )}
            {tab === 'photo' && (
              <PhotoTab sessionId={sessionId} onSuccess={onShotsAdded} />
            )}
            {tab === 'import' && (
              <ImportTab sessionId={sessionId} onSuccess={onShotsAdded} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Interactive Target ───────────────────────────────────────────────────

type PlacedShot = { x: number; y: number; score: number; shotNumber: number };

const TARGET_EXTENT  = 10;
const CANVAS_SIZE    = 360;
const TARGET_CX      = CANVAS_SIZE / 2;
const TARGET_CY      = CANVAS_SIZE / 2;
const TARGET_DRAW_R  = (CANVAS_SIZE / 2) * 0.92;
const HIT_RADIUS_PX  = 12;   // canvas-pixel hit area for shot selection
const DRAG_THRESHOLD = 5;    // pixels moved before a press becomes a drag

function shotDotColor(score: number): string {
  if (score >= 10.5) return '#F5A623';
  if (score >= 10.0) return '#4FC3F7';
  if (score >= 9.0)  return '#00E5A0';
  return '#FF4D6D';
}

function ringFill(n: number): string {
  if (n <= 3) return '#1a1a2e';
  if (n <= 6) return '#16213e';
  if (n <= 8) return '#0f3460';
  return '#f8f8f8';
}

function ringRadius(n: number, maxR: number): number {
  return maxR * Math.pow((11 - n) / 10, 1.7);
}

function InteractiveTab({
  sessionId,
  nextShotNumber,
  onSuccess,
}: {
  sessionId: string;
  nextShotNumber: number;
  onSuccess: () => void;
}) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [shots, setShots]             = useState<PlacedShot[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState<string | null>(null);
  const [tooltip, setTooltip]         = useState<{ x: number; y: number; text: string } | null>(null);
  const [draggingIndex, setDragging]  = useState<number | null>(null);
  const [hoverIndex, setHover]        = useState<number | null>(null);
  const [cursor, setCursor]           = useState<'crosshair' | 'grab' | 'grabbing'>('crosshair');

  // Track pointer-down position to distinguish click vs drag
  const pointerDownRef = useRef<{ x: number; y: number; onShot: boolean } | null>(null);

  const cx    = TARGET_CX;
  const cy    = TARGET_CY;
  const drawR = TARGET_DRAW_R;

  // Convert client pointer coords → target coordinate space (±10)
  function pixelToTarget(clientX: number, clientY: number): [number, number] {
    const canvas = canvasRef.current!;
    const rect   = canvas.getBoundingClientRect();
    const sx = CANVAS_SIZE / rect.width;
    const sy = CANVAS_SIZE / rect.height;
    const tx = ((clientX - rect.left) * sx - cx) / drawR * TARGET_EXTENT;
    const ty = -(((clientY - rect.top) * sy - cy) / drawR * TARGET_EXTENT);
    return [tx, ty];
  }

  // Clamp target coords to stay inside the target disc
  function clampToTarget(tx: number, ty: number): [number, number] {
    const d = Math.sqrt(tx * tx + ty * ty);
    if (d > TARGET_EXTENT) {
      const s = TARGET_EXTENT / d;
      return [tx * s, ty * s];
    }
    return [tx, ty];
  }

  // Return index (last-placed wins) of the shot under the pointer, or -1
  function findShotAt(clientX: number, clientY: number): number {
    const canvas = canvasRef.current;
    if (!canvas) return -1;
    const rect = canvas.getBoundingClientRect();
    const sx = CANVAS_SIZE / rect.width;
    const sy = CANVAS_SIZE / rect.height;
    const mx = (clientX - rect.left) * sx;
    const my = (clientY - rect.top) * sy;
    for (let i = shots.length - 1; i >= 0; i--) {
      const px = cx + (shots[i].x / TARGET_EXTENT) * drawR;
      const py = cy - (shots[i].y / TARGET_EXTENT) * drawR;
      if (Math.hypot(mx - px, my - py) <= HIT_RADIUS_PX) return i;
    }
    return -1;
  }

  // ── Canvas rendering ────────────────────────────────────────────────────────
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background radial gradient
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, CANVAS_SIZE * 0.7);
    bg.addColorStop(0, '#0d1117');
    bg.addColorStop(1, '#080A0F');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Scoring rings (1=outermost → 10=innermost)
    for (let n = 1; n <= 10; n++) {
      const r = ringRadius(n, drawR);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = ringFill(n);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth   = n === 10 ? 1.5 : 0.8;
      ctx.stroke();
    }

    // X-ring amber tint
    const xR = ringRadius(10, drawR) * 0.35;
    ctx.beginPath();
    ctx.arc(cx, cy, xR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245,166,35,0.35)';
    ctx.fill();

    // Dashed crosshair
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = '#1E2D3D';
    ctx.lineWidth   = 0.8;
    ctx.beginPath(); ctx.moveTo(cx - drawR, cy); ctx.lineTo(cx + drawR, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - drawR); ctx.lineTo(cx, cy + drawR); ctx.stroke();
    ctx.setLineDash([]);

    // ── Shot markers ──────────────────────────────────────────────────────────
    shots.forEach((shot, i) => {
      const px      = cx + (shot.x / TARGET_EXTENT) * drawR;
      const py      = cy - (shot.y / TARGET_EXTENT) * drawR;
      const color   = shotDotColor(shot.score);
      const isDrag  = draggingIndex === i;
      const isHover = hoverIndex === i && draggingIndex === null;
      const dotR    = isDrag ? 9 : isHover ? 7.5 : 6;

      // Outer selection ring — dashed for hover, solid for drag
      if (isDrag || isHover) {
        const ringR = isDrag ? 17 : 13;
        ctx.beginPath();
        ctx.arc(px, py, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = isDrag ? `${color}aa` : `${color}55`;
        ctx.lineWidth   = isDrag ? 2 : 1;
        if (isHover) ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Glow shadow
      ctx.shadowColor = color;
      ctx.shadowBlur  = isDrag ? 22 : isHover ? 14 : 8;
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // White outline
      ctx.beginPath();
      ctx.arc(px, py, dotR + 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = isDrag
        ? 'rgba(255,255,255,0.95)'
        : isHover
        ? 'rgba(255,255,255,0.75)'
        : 'rgba(255,255,255,0.5)';
      ctx.lineWidth = isDrag ? 2 : 1.5;
      ctx.stroke();

      // Shot number label
      ctx.fillStyle    = '#080A0F';
      ctx.font         = `bold ${dotR >= 9 ? 9 : 8}px monospace`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(shot.shotNumber), px, py);
    });

    // Placement hint when canvas is empty
    if (shots.length === 0) {
      ctx.fillStyle    = 'rgba(245,166,35,0.25)';
      ctx.font         = '13px "Rajdhani", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Click anywhere to place a shot', cx, CANVAS_SIZE - 18);
    }
  }, [shots, draggingIndex, hoverIndex, cx, cy, drawR]);

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  // ── Pointer event handlers ─────────────────────────────────────────────────

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const hitIdx = findShotAt(e.clientX, e.clientY);
    pointerDownRef.current = { x: e.clientX, y: e.clientY, onShot: hitIdx !== -1 };

    if (hitIdx !== -1) {
      // Start dragging this shot
      setDragging(hitIdx);
      setHover(null);
      setCursor('grabbing');
      // Capture pointer so move events keep firing even outside the canvas
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();  // prevent scroll / tap-highlight on mobile
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (draggingIndex !== null) {
      // ── Drag: reposition the grabbed shot in real time ──────────────────
      let [tx, ty] = pixelToTarget(e.clientX, e.clientY);
      [tx, ty]     = clampToTarget(tx, ty);
      const score  = scoreFromCoords(tx, ty);

      setShots((prev) =>
        prev.map((s, i) => (i === draggingIndex ? { ...s, x: tx, y: ty, score } : s)),
      );

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          text: `#${shots[draggingIndex]?.shotNumber ?? '?'} · ${score.toFixed(1)}`,
        });
      }
    } else {
      // ── Hover: highlight nearest shot ───────────────────────────────────
      const hitIdx = findShotAt(e.clientX, e.clientY);
      if (hitIdx !== hoverIndex) {
        setHover(hitIdx !== -1 ? hitIdx : null);
        setCursor(hitIdx !== -1 ? 'grab' : 'crosshair');
      }
      if (hitIdx !== -1) {
        const shot = shots[hitIdx];
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            text: `#${shot.shotNumber} · ${shot.score.toFixed(1)} — drag to adjust`,
          });
        }
      } else {
        setTooltip(null);
      }
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const down = pointerDownRef.current;

    if (draggingIndex !== null) {
      // Finalize drag — just release
      setDragging(null);
      const postHit = findShotAt(e.clientX, e.clientY);
      setCursor(postHit !== -1 ? 'grab' : 'crosshair');
      setTooltip(null);
    } else if (down && !down.onShot) {
      // Place new shot only if the pointer barely moved (click, not pan/scroll)
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      if (moved < DRAG_THRESHOLD) {
        let [tx, ty] = pixelToTarget(e.clientX, e.clientY);
        [tx, ty]     = clampToTarget(tx, ty);
        const score  = scoreFromCoords(tx, ty);
        setShots((prev) => [
          ...prev,
          { x: tx, y: ty, score, shotNumber: nextShotNumber + prev.length },
        ]);
        setSuccess(null);
        setError(null);
      }
    }

    pointerDownRef.current = null;
  }

  function handlePointerLeave() {
    // Only reset hover/cursor if not mid-drag (drag uses pointer capture)
    if (draggingIndex === null) {
      setHover(null);
      setCursor('crosshair');
      setTooltip(null);
    }
  }

  function undoLast() { setShots((prev) => prev.slice(0, -1)); }
  function clearAll()  { setShots([]); }

  async function submitShots() {
    if (shots.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/shots/manual', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          shots: shots.map((s) => ({
            shotNumber: s.shotNumber,
            score: s.score,
            x: parseFloat(s.x.toFixed(3)),
            y: parseFloat(s.y.toFixed(3)),
          })),
        }),
      });
      setSuccess(`${shots.length} shot${shots.length !== 1 ? 's' : ''} saved`);
      setShots([]);
      setTimeout(() => { setSuccess(null); onSuccess(); }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save shots');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[#8892A4] text-xs">
        Click to place a shot · Drag any marker to fine-tune its position · Score updates in real time
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* ── Interactive canvas ─────────────────────────────────────────── */}
        <div
          className="relative rounded-xl overflow-hidden border border-[#1E2433] shrink-0"
          style={{ width: CANVAS_SIZE, maxWidth: '100%' }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className="w-full block select-none"
            style={{ cursor, touchAction: 'none' }}
            aria-label="Interactive shooting target — click to place shots, drag markers to adjust position"
            role="button"
          />
          {tooltip && (
            <div
              className="tooltip-glass absolute z-tooltip px-3 py-1.5 pointer-events-none"
              style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}
            >
              <span className="score-value text-accent text-sm">{tooltip.text}</span>
            </div>
          )}
        </div>

        {/* ── Shot list ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {shots.length === 0 ? (
            <div className="flex-1 flex items-center justify-center border border-dashed border-[#1E2433]
                            rounded-xl py-8 text-center">
              <div>
                <p className="text-[#4A5568] text-sm">No shots placed yet</p>
                <p className="text-[#4A5568]/50 text-xs mt-1">Click the target to begin</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto max-h-72 pr-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1E2433]">
                    <th className="label py-2 text-left w-8">#</th>
                    <th className="label py-2 text-left">Score</th>
                    <th className="label py-2 text-left hidden sm:table-cell">X</th>
                    <th className="label py-2 text-left hidden sm:table-cell">Y</th>
                  </tr>
                </thead>
                <tbody>
                  {shots.map((shot, i) => {
                    const isDrag  = draggingIndex === i;
                    const isHover = hoverIndex === i && !isDrag;
                    return (
                      <tr
                        key={shot.shotNumber}
                        className={`border-b border-[#1E2433]/40 transition-colors duration-100 ${
                          isDrag  ? 'bg-accent/8'
                          : isHover ? 'bg-white/[0.02]'
                          : ''
                        }`}
                      >
                        <td className="py-1.5 score-value text-[#4A5568]">{shot.shotNumber}</td>
                        <td className="py-1.5">
                          <span
                            className="score-value font-bold tabular-nums"
                            style={{ color: shotDotColor(shot.score) }}
                          >
                            {shot.score.toFixed(1)}
                          </span>
                          {isDrag && (
                            <span className="ml-1.5 text-[#4A5568] text-[10px] font-display uppercase tracking-wide">
                              adjusting
                            </span>
                          )}
                        </td>
                        <td className={`py-1.5 score-value hidden sm:table-cell tabular-nums ${isDrag ? 'text-accent' : 'text-[#8892A4]'}`}>
                          {shot.x.toFixed(2)}
                        </td>
                        <td className={`py-1.5 score-value hidden sm:table-cell tabular-nums ${isDrag ? 'text-accent' : 'text-[#8892A4]'}`}>
                          {shot.y.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-2 mt-auto pt-2">
            <button
              type="button"
              onClick={undoLast}
              disabled={shots.length === 0}
              className="btn btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
            >
              ↩ Undo
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={shots.length === 0}
              className="btn btn-ghost text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => void submitShots()}
              disabled={loading || shots.length === 0}
              className="btn btn-primary text-xs py-1.5 px-4 ml-auto disabled:opacity-40"
            >
              {loading ? 'Saving…' : `Save ${shots.length > 0 ? `${shots.length} ` : ''}Shot${shots.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="px-4 py-2 rounded-lg text-sm bg-[rgba(0,229,160,0.1)] border border-[rgba(0,229,160,0.3)] text-[#00E5A0]">
          {success}
        </div>
      )}
      {error && (
        <div className="px-4 py-2 rounded-lg text-sm bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.3)] text-[#FF4D6D]">
          {error}
        </div>
      )}
    </div>
  );
}

// ── Tab: Manual Entry ─────────────────────────────────────────────────────────

function ManualTab({
  sessionId,
  nextShotNumber,
  onSuccess,
}: {
  sessionId: string;
  nextShotNumber: number;
  onSuccess: () => void;
}) {
  const initialRows = () =>
    Array.from({ length: 10 }, (_, i) => ({
      shotNumber: nextShotNumber + i, score: '', x: '0', y: '0',
    }));

  const [rows, setRows]       = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function updateRow(i: number, field: string, value: string) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const shots = rows
        .filter((r) => r.score !== '')
        .map((r) => ({
          shotNumber: r.shotNumber,
          score: parseFloat(r.score),
          x: parseFloat(r.x) || 0,
          y: parseFloat(r.y) || 0,
        }));

      await apiFetch('/shots/manual', {
        method: 'POST',
        body: JSON.stringify({ sessionId, shots }),
      });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save shots');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1E2433]">
              <th className="label py-2 text-left w-10">#</th>
              <th className="label py-2 text-left">Score</th>
              <th className="label py-2 text-left hidden sm:table-cell">X</th>
              <th className="label py-2 text-left hidden sm:table-cell">Y</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[#1E2433]/40">
                <td className="py-1 pr-3 score-value text-[#4A5568]">{row.shotNumber}</td>
                <td className="py-1 pr-2">
                  <input
                    type="number" min="0" max="10.9" step="0.1"
                    value={row.score}
                    onChange={(e) => updateRow(i, 'score', e.target.value)}
                    className="field py-1 px-2 text-xs w-20"
                    placeholder="9.8"
                    aria-label={`Shot ${row.shotNumber} score`}
                  />
                </td>
                <td className="py-1 pr-2 hidden sm:table-cell">
                  <input type="number" step="0.01" value={row.x}
                    onChange={(e) => updateRow(i, 'x', e.target.value)}
                    className="field py-1 px-2 text-xs w-20" aria-label={`Shot ${row.shotNumber} X`} />
                </td>
                <td className="py-1 hidden sm:table-cell">
                  <input type="number" step="0.01" value={row.y}
                    onChange={(e) => updateRow(i, 'y', e.target.value)}
                    className="field py-1 px-2 text-xs w-20" aria-label={`Shot ${row.shotNumber} Y`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRows((r) => [...r, { shotNumber: nextShotNumber + r.length, score: '', x: '0', y: '0' }])}
          className="btn btn-ghost text-xs py-2"
        >
          + Add row
        </button>
        <button
          type="button" onClick={() => void handleSubmit()} disabled={loading}
          className="btn btn-primary text-xs py-2 ml-auto"
        >
          {loading ? 'Saving…' : 'Save Shots'}
        </button>
      </div>
      {error && <p className="text-[#FF4D6D] text-xs">{error}</p>}
    </div>
  );
}

// ── Tab: Photo / Camera ───────────────────────────────────────────────────────

type PhotoState  = 'idle' | 'uploading' | 'done' | 'error';
type PhotoMode   = 'upload' | 'camera';

/** Translate a getUserMedia DOMException into a human-readable message with fix hint. */
function cameraErrorMessage(err: unknown): string {
  const name = (err instanceof Error ? err.name : '') as string;
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera permission denied. Click the camera icon in your browser\'s address bar, set it to "Allow", then click Retry.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera detected. Connect a camera and click Retry.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Camera is already in use by another application. Close it and click Retry.';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'Camera does not support the required resolution. Click Retry to try with lower settings.';
    case 'NotSupportedError':
      return 'Camera API is not supported on this page. Make sure the site is served over HTTPS (or localhost).';
    case 'TypeError':
      return 'Camera is not available. Make sure the site is opened over HTTPS or on localhost.';
    default:
      return `Camera error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

function PhotoTab({ sessionId, onSuccess }: { sessionId: string; onSuccess: () => void }) {
  const [mode, setMode]             = useState<PhotoMode>('upload');
  const [state, setState]           = useState<PhotoState>('idle');
  const [result, setResult]         = useState<{ shots: number } | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing]   = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);

  const steps = [
    { label: 'Detecting target rings', status: state === 'uploading' ? 'active' : state === 'done' ? 'done' : 'pending' },
    { label: 'Locating bullet holes',  status: state === 'done' ? 'done' : 'pending' },
    { label: 'Calculating scores',     status: state === 'done' ? 'done' : 'pending' },
  ] as { label: string; status: 'pending' | 'active' | 'done' }[];

  // Start camera when mode switches to 'camera'; stop on teardown
  useEffect(() => {
    if (mode === 'camera' && state === 'idle') {
      void startCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function startCamera() {
    setCameraError(null);
    setCameraReady(false);

    // Unavailable on plain HTTP (except localhost)
    if (
      typeof window !== 'undefined' &&
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setCameraError('Camera requires HTTPS. Please open this page over a secure connection.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported by this browser. Try Chrome, Firefox, or Safari over HTTPS.');
      return;
    }

    let stream: MediaStream | null = null;

    // Try back/environment camera first (phones), fall back to any camera (laptops)
    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
      { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: true },
    ];

    let lastErr: unknown = null;
    for (const c of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(c);
        break;
      } catch (e) {
        lastErr = e;
        // Only abort early on permission denial — for everything else (no back camera,
        // overconstrained resolution, device busy) keep trying the next looser constraint.
        const name = (e instanceof Error ? e.name : '') as string;
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          break;
        }
      }
    }

    if (!stream) {
      setCameraError(cameraErrorMessage(lastErr));
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
        setCameraReady(true);
      } catch {
        // autoPlay likely blocked; camera will still show once user interacts
        setCameraReady(true);
      }
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }

  function switchMode(m: PhotoMode) {
    stopCamera();
    setMode(m);
    setState('idle');
    setError(null);
    setCameraError(null);
    // camera start handled by the useEffect above
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    setCapturing(true);

    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        setCapturing(false);
        if (blob) {
          stopCamera();
          void handleFile(new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' }));
        }
      },
      'image/jpeg',
      0.93,
    );
  }

  async function handleFile(file: File) {
    setState('uploading');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const shots = await apiFetch<Shot[]>(
        `/shots/photo?sessionId=${sessionId}`,
        { method: 'POST', body: formData, headers: {} },
      );
      setResult({ shots: shots.length });
      setState('done');
      setTimeout(() => { setResult(null); setState('idle'); onSuccess(); }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Photo analysis failed');
      setState('error');
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      {state === 'idle' && (
        <div className="flex gap-1 p-1 rounded-lg bg-[#0E1118] border border-[#1E2433] w-fit">
          {(['upload', 'camera'] as PhotoMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-1.5 rounded text-xs font-display uppercase tracking-widest transition-all
                          ${mode === m
                            ? 'bg-accent text-[#080A0F] font-bold shadow'
                            : 'text-[#4A5568] hover:text-[#8892A4]'
                          }`}
            >
              {m === 'upload' ? 'Upload' : 'Camera'}
            </button>
          ))}
        </div>
      )}

      {/* ── Upload mode ─────────────────────────────────────────────────── */}
      {mode === 'upload' && state === 'idle' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl
                     border-2 border-dashed border-[#2A3040] hover:border-accent/50
                     hover:bg-[rgba(245,166,35,0.03)] cursor-pointer transition-all"
        >
          <span className="text-accent opacity-50"><LargeUploadIcon /></span>
          <div className="text-center">
            <p className="text-[#F0F4FF] text-sm font-medium">Upload target photo</p>
            <p className="text-[#4A5568] text-xs mt-1">JPEG · PNG · TIFF · BMP</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
            aria-hidden tabIndex={-1}
          />
        </div>
      )}

      {/* ── Camera mode ─────────────────────────────────────────────────── */}
      {mode === 'camera' && state === 'idle' && (
        <div className="space-y-3">
          {cameraError ? (
            /* ── Error state ─────────────────────────────────────────────── */
            <div className="rounded-xl border border-[rgba(255,77,109,0.3)] bg-[rgba(255,77,109,0.07)] p-4 space-y-3">
              {/* Error icon + message */}
              <div className="flex gap-3">
                <span className="shrink-0 mt-0.5 text-[#FF4D6D]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M8 1L15 13H1z"/>
                    <line x1="8" y1="6" x2="8" y2="9"/>
                    <circle cx="8" cy="11.5" r="0.7" fill="currentColor" stroke="none"/>
                  </svg>
                </span>
                <p className="text-[#FF4D6D] text-sm leading-relaxed">{cameraError}</p>
              </div>

              {/* Browser-specific quick-fix hint */}
              <div className="text-[#4A5568] text-xs space-y-1 pl-7">
                <p className="font-display uppercase tracking-widest text-[10px] text-[#4A5568] mb-1">Quick fix</p>
                <p>Chrome / Edge: click the <strong className="text-[#8892A4]">lock icon</strong> in the address bar → Camera → Allow.</p>
                <p>Firefox: click the <strong className="text-[#8892A4]">camera icon</strong> in the address bar → Allow.</p>
                <p>Safari: Settings → Websites → Camera → Allow for this site.</p>
              </div>

              {/* Retry + fallback to upload */}
              <div className="flex gap-2 pl-7">
                <button
                  className="btn btn-primary text-xs py-2 px-4"
                  onClick={() => void startCamera()}
                >
                  Retry camera access
                </button>
                <button
                  className="btn btn-ghost text-xs py-2 px-4"
                  onClick={() => switchMode('upload')}
                >
                  Upload instead
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Video preview ──────────────────────────────────────── */}
              <div
                className="relative rounded-xl overflow-hidden border border-[#1E2433] bg-[#080A0F]"
                style={{ aspectRatio: '16/9' }}
              >
                {/* Loading spinner shown until stream is ready */}
                {!cameraReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                    <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-[#4A5568] text-xs font-display uppercase tracking-widest">
                      Starting camera…
                    </span>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ opacity: cameraReady ? 1 : 0, transition: 'opacity 300ms' }}
                  aria-label="Live camera preview"
                  onCanPlay={() => setCameraReady(true)}
                />

                {/* Targeting reticle overlay */}
                {cameraReady && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true" className="opacity-40">
                      <circle cx="40" cy="40" r="36" stroke="#F5A623" strokeWidth="1" fill="none" />
                      <circle cx="40" cy="40" r="4"  stroke="#F5A623" strokeWidth="1" fill="none" />
                      <line x1="40" y1="4"  x2="40" y2="20"  stroke="#F5A623" strokeWidth="1" />
                      <line x1="40" y1="60" x2="40" y2="76" stroke="#F5A623" strokeWidth="1" />
                      <line x1="4"  y1="40" x2="20" y2="40" stroke="#F5A623" strokeWidth="1" />
                      <line x1="60" y1="40" x2="76" y2="40" stroke="#F5A623" strokeWidth="1" />
                    </svg>
                  </div>
                )}
              </div>

              <p className="text-[#4A5568] text-xs text-center">
                Point the camera at the target. Hold steady, then capture.
              </p>

              <button
                onClick={captureFrame}
                disabled={capturing || !cameraReady}
                className="btn btn-primary w-full py-3 text-sm"
              >
                {capturing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#080A0F] border-t-transparent rounded-full animate-spin" />
                    Capturing…
                  </span>
                ) : (
                  'Capture & Analyse'
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Shared: Analysing ───────────────────────────────────────────── */}
      {state === 'uploading' && (
        <div className="space-y-4">
          <p className="text-[#8892A4] text-xs font-display uppercase tracking-widest">Analysing image…</p>
          <ProgressStep steps={steps} />
        </div>
      )}

      {state === 'done' && result && (
        <div className="px-4 py-3 rounded-lg bg-[rgba(0,229,160,0.1)] border border-[rgba(0,229,160,0.3)] text-[#00E5A0] text-sm">
          ✓ Detected and imported {result.shots} shot{result.shots !== 1 ? 's' : ''}
        </div>
      )}

      {state === 'error' && (
        <div className="space-y-3">
          <div className="px-4 py-3 rounded-lg bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.3)] text-[#FF4D6D] text-sm">
            {error}
          </div>
          <button
            type="button"
            onClick={() => { setState('idle'); setError(null); if (mode === 'camera') void startCamera(); }}
            className="btn btn-ghost text-xs py-2"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab: File Import ──────────────────────────────────────────────────────────

function ImportTab({ sessionId, onSuccess }: { sessionId: string; onSuccess: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus]     = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setStatus(`Reading ${file.name}…`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const shots = await apiFetch<Shot[]>(
        `/shots/import?sessionId=${sessionId}`,
        { method: 'POST', body: formData, headers: {} },
      );
      setStatus(`✓ ${shots.length} shots imported successfully`);
      setTimeout(() => { setStatus(null); onSuccess(); }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
      setStatus(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[#8892A4] text-xs">
        Import shot data from an electronic target system or scoring software.
        Supported formats: PDF, CSV (columns: shotNumber, score, x, y), JSON.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) void handleFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-3 py-10
          rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-300
          ${dragging
            ? 'border-accent bg-accent/10 scale-[1.01]'
            : 'border-[#2A3040] hover:border-accent/50 hover:bg-[rgba(245,166,35,0.03)]'
          }
        `}
        role="button"
        aria-label="Upload shot data file"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <span className="text-accent opacity-40"><LargeImportIcon /></span>
        <div className="text-center">
          <p className="text-[#F0F4FF] text-sm font-medium">Drop your target file here</p>
          <p className="text-[#4A5568] text-xs mt-1">PDF · CSV · JSON — up to 10 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.csv,.json"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
          aria-hidden={true}
          tabIndex={-1}
        />
      </div>

      {status && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          status.startsWith('✓')
            ? 'bg-[rgba(0,229,160,0.1)] border border-[rgba(0,229,160,0.3)] text-[#00E5A0]'
            : 'bg-accent/10 border border-accent/30 text-accent'
        }`}>
          {status}
        </div>
      )}
      {error && (
        <div className="px-4 py-2 rounded-lg text-sm bg-[rgba(255,77,109,0.1)] border border-[rgba(255,77,109,0.3)] text-[#FF4D6D]">
          {error}
        </div>
      )}

      {/* CSV format hint */}
      <details className="group">
        <summary className="text-[#4A5568] text-xs cursor-pointer hover:text-[#8892A4] transition-colors font-display uppercase tracking-wide">
          CSV format reference
        </summary>
        <div className="mt-2 p-3 bg-[#080A0F] rounded-lg border border-[#1E2433]">
          <pre className="text-[#8892A4] text-[10px] font-mono leading-relaxed">{`shotNumber,score,x,y
1,9.8,1.23,-0.45
2,10.0,0.12,0.34
3,9.5,-2.10,1.88`}</pre>
        </div>
      </details>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSuggestionType(s: string): 'warning' | 'success' | 'info' | 'critical' {
  if (s.toLowerCase().includes('drops') || s.toLowerCase().includes('endurance')) return 'critical';
  if (s.toLowerCase().includes('adjust') || s.toLowerCase().includes('grouping')) return 'warning';
  if (s.toLowerCase().includes('variance') || s.toLowerCase().includes('radius')) return 'info';
  return 'info';
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} animationDelay={i * 60} />
        ))}
      </div>
    </div>
  );
}

// ── Chip icons (14×14) ────────────────────────────────────────────────────────

function ChipCalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <rect x="1" y="2" width="10" height="9" rx="1.5" />
      <line x1="1" y1="5" x2="11" y2="5" />
      <line x1="4" y1="1" x2="4" y2="3.5" />
      <line x1="8" y1="1" x2="8" y2="3.5" />
    </svg>
  );
}

function ChipTargetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" />
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="6" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChipWeaponIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 5h6l1-2h2v4H8L7 5" />
      <line x1="9" y1="7" x2="9" y2="8.5" />
      <line x1="3" y1="7" x2="3" y2="9" />
    </svg>
  );
}

function ChipShotIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6" cy="6" r="4" />
    </svg>
  );
}

// ── Tab icons (14×14) ─────────────────────────────────────────────────────────

function TabTargetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="6.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TabEditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9.5l1.5-1.5 5-5L10 4.5l-5 5L2 11z" />
      <line x1="7.5" y1="3" x2="10" y2="5.5" />
    </svg>
  );
}

function TabCameraIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="1" y="4" width="11" height="8" rx="1.5" />
      <circle cx="6.5" cy="8" r="2" />
      <path d="M4.5 4L5.5 2h2l1 2" />
    </svg>
  );
}

function TabImportIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor"
      strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="7" height="9" rx="1" />
      <path d="M7 1l4 4" />
      <path d="M7 1v4h4" />
      <line x1="4" y1="6" x2="8" y2="6" />
      <line x1="4" y1="8" x2="7" y2="8" />
    </svg>
  );
}

// ── Drop zone icons (24×24) ───────────────────────────────────────────────────

function LargeUploadIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="6" width="26" height="24" rx="3" />
      <circle cx="18" cy="18" r="5" />
      <circle cx="18" cy="18" r="2" />
      <line x1="18" y1="6" x2="18" y2="10" />
      <line x1="18" y1="26" x2="18" y2="30" />
      <line x1="5" y1="18" x2="9" y2="18" />
      <line x1="27" y1="18" x2="31" y2="18" />
    </svg>
  );
}

function LargeImportIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="4" width="18" height="28" rx="2" />
      <path d="M18 4l12 10" />
      <path d="M18 4v10h12" />
      <line x1="10" y1="18" x2="20" y2="18" />
      <line x1="10" y1="22" x2="18" y2="22" />
      <line x1="10" y1="26" x2="16" y2="26" />
    </svg>
  );
}
