'use client';

// Performance Dashboard — shot density heatmap, fatigue/focus trends, deep analysis cards

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { AppShell } from '../../components/AppShell';
import { apiFetch } from '../../lib/api';
import type { Session, AnalyticsResult, DeepAnalysis } from '@shooting-platform/shared-types';

type DateRange = '7d' | '30d' | '90d';

// Session list entry (no shots); used for date filter + deep analysis
interface SessionMeta {
  id: string;
  discipline: string;
  sessionDate: string | Date;
  weaponType: string;
}

export default function PerformancePage() {
  const [sessions,  setSessions]  = useState<Session[]>([]);    // full session+shots (for heatmap)
  const [metas,     setMetas]     = useState<SessionMeta[]>([]);
  const [analytics, setAnalytics] = useState<Map<string, AnalyticsResult>>(new Map());
  const [analyses,  setAnalyses]  = useState<Map<string, DeepAnalysis>>(new Map());
  const [range,     setRange]     = useState<DateRange>('30d');
  const [loading,   setLoading]   = useState(true);
  const heatmapRef  = useRef<HTMLCanvasElement>(null);

  const rangeDays: Record<DateRange, number> = { '7d': 7, '30d': 30, '90d': 90 };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - rangeDays[range]);

      // Step 1: session list (fast, no shots)
      const allMeta = await apiFetch<SessionMeta[]>('/sessions');
      const filtered = allMeta.filter((s) => new Date(s.sessionDate) >= cutoff);
      setMetas(filtered);

      // Step 2: parallel fetch — individual session (with shots), analytics, deep analysis
      const [sessionArr, analyticsArr, analysesArr] = await Promise.all([
        Promise.all(
          filtered.map((s) =>
            apiFetch<Session>(`/sessions/${s.id}`).catch(() => null),
          ),
        ),
        Promise.all(
          filtered.map((s) =>
            apiFetch<AnalyticsResult>(`/analytics/session/${s.id}`).catch(() => null),
          ),
        ),
        Promise.all(
          filtered.map((s) =>
            apiFetch<DeepAnalysis>(`/performance/deep-analysis/${s.id}`).catch(() => null),
          ),
        ),
      ]);

      setSessions(sessionArr.filter((s): s is Session => s !== null));

      const aMap = new Map<string, AnalyticsResult>();
      const dMap = new Map<string, DeepAnalysis>();
      filtered.forEach((s, i) => {
        if (analyticsArr[i]) aMap.set(s.id, analyticsArr[i]!);
        if (analysesArr[i]) dMap.set(s.id, analysesArr[i]!);
      });
      setAnalytics(aMap);
      setAnalyses(dMap);
    } catch {
      // leave empty state
    } finally {
      setLoading(false);
    }
  }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load(); }, [load]);

  // ── Draw heatmap ──────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = heatmapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W  = canvas.width;
    const H  = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Target rings
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, (r * Math.min(W, H)) / 2, 0, Math.PI * 2);
      ctx.stroke();
    });

    // All shots from fully-loaded sessions
    const allShots = sessions.flatMap((s) => s.shots ?? []);
    if (allShots.length === 0) return;

    allShots.forEach((shot) => {
      const px     = cx + (shot.x / 10) * (W / 2) * 0.9;
      const py     = cy - (shot.y / 10) * (H / 2) * 0.9;
      const radius = Math.max(8, W * 0.045);

      const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
      grad.addColorStop(0,   'rgba(245,166,35,0.38)');
      grad.addColorStop(0.5, 'rgba(245,166,35,0.13)');
      grad.addColorStop(1,   'rgba(245,166,35,0)');

      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });
  }, [sessions]);

  // ── Trend data ────────────────────────────────────────────────────────────

  const trendData = [...metas]
    .filter((s) => analyses.has(s.id))
    .reverse()
    .map((s) => ({
      date: new Date(s.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      focusScore:    analyses.get(s.id)!.focusScore,
      fatigueIndex:  Math.round(analyses.get(s.id)!.fatigueIndex * 1000) / 10, // ×100 for display
      sessionId:     s.id,
    }));

  const recent5 = metas.slice(0, 5);
  const totalShots = sessions.reduce((acc, s) => acc + (s.shots?.length ?? 0), 0);

  return (
    <AppShell title="Performance">
      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 animate-slide-up">
            <div>
              <h1 className="font-display font-bold text-2xl text-[#F0F4FF]">Performance</h1>
              <p className="text-[#4A5568] text-sm mt-1">Heatmaps, fatigue trends, and deep analysis</p>
            </div>
            <div className="flex gap-2">
              <Link href="/performance/training-plan" className="btn text-xs py-2 px-3">
                Training Plan
              </Link>
              <Link href="/performance/pose" className="btn btn-ghost text-xs py-2 px-3">
                Stance Analysis
              </Link>
            </div>
          </div>

          {/* Date range selector */}
          <div className="flex gap-2 flex-wrap animate-slide-up">
            {(['7d', '30d', '90d'] as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold uppercase tracking-wide transition-all duration-200"
                style={{
                  background: range === r ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.04)',
                  color: range === r ? '#F5A623' : '#8892A4',
                  border: range === r ? '1px solid rgba(245,166,35,0.3)' : '1px solid transparent',
                }}
              >
                {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </button>
            ))}
          </div>

          {/* Section A: Shot Density Heatmap */}
          <div className="card p-5 animate-slide-up stagger-2">
            <h2 className="font-display font-semibold text-base text-[#F0F4FF] mb-1">Shot Density Heatmap</h2>
            <p className="text-[#4A5568] text-xs mb-4">
              {totalShots} shots across {metas.length} session{metas.length !== 1 ? 's' : ''}
            </p>

            {metas.length === 0 ? (
              <p className="text-[#4A5568] text-sm">No sessions in this period.</p>
            ) : (
              <div className="flex justify-center">
                <canvas
                  ref={heatmapRef}
                  width={260}
                  height={260}
                  className="rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(22,27,38,0.9) 0%, rgba(8,10,15,1) 100%)',
                    border: '1px solid rgba(245,166,35,0.12)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Section B: Fatigue & Focus Trends */}
          {trendData.length >= 2 && (
            <div className="card p-5 animate-slide-up stagger-3">
              <h2 className="font-display font-semibold text-base text-[#F0F4FF] mb-4">Fatigue & Focus Trends</h2>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={trendData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fill: '#4A5568', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="focus"   domain={[0, 100]}    tick={{ fill: '#00E5A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="fatigue" orientation="right"  tick={{ fill: '#F5A623', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(14,17,24,0.96)',
                      border: '1px solid rgba(245,166,35,0.2)',
                      borderRadius: '8px',
                      color: '#F0F4FF',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'Focus Score' ? `${value}/100` : `${value > 0 ? '+' : ''}${value}`,
                      name,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#8892A4' }} />
                  <Line
                    yAxisId="focus"
                    type="monotone"
                    dataKey="focusScore"
                    name="Focus Score"
                    stroke="#00E5A0"
                    strokeWidth={2}
                    dot={{ fill: '#00E5A0', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="fatigue"
                    type="monotone"
                    dataKey="fatigueIndex"
                    name="Fatigue Index"
                    stroke="#F5A623"
                    strokeWidth={2}
                    dot={{ fill: '#F5A623', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Section C: Recent Deep Analysis Cards */}
          {recent5.length > 0 && (
            <div className="animate-slide-up stagger-4">
              <h2 className="font-display font-semibold text-base text-[#F0F4FF] mb-3">Recent Sessions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recent5.map((s) => (
                  <DeepAnalysisCard
                    key={s.id}
                    session={s}
                    analysis={analyses.get(s.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {metas.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-[#4A5568] text-sm">No sessions in the selected period.</p>
              <Link href="/sessions/new" className="btn text-xs py-2 mt-4 inline-block">
                Start a Session
              </Link>
            </div>
          )}

        </div>
      )}
    </AppShell>
  );
}

// ── Deep Analysis Card ─────────────────────────────────────────────────────────

function DeepAnalysisCard({
  session,
  analysis,
}: {
  session: SessionMeta;
  analysis?: DeepAnalysis;
}) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display font-semibold text-sm text-[#F0F4FF]">{session.discipline}</p>
          <p className="text-[#4A5568] text-xs mt-0.5">
            {new Date(session.sessionDate).toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/sessions/${session.id}`}
          className="text-xs font-display text-[#F5A623] hover:underline"
        >
          View
        </Link>
      </div>

      {analysis ? (
        <div className="grid grid-cols-2 gap-2">
          <Metric
            label="Focus"
            value={`${analysis.focusScore}/100`}
            color={analysis.focusScore >= 60 ? '#00E5A0' : analysis.focusScore >= 40 ? '#F5A623' : '#FF4D6D'}
          />
          <Metric
            label="Fatigue"
            value={analysis.fatigueIndex >= 0
              ? `+${analysis.fatigueIndex.toFixed(3)}`
              : analysis.fatigueIndex.toFixed(3)}
            color={analysis.fatigueIndex >= 0 ? '#00E5A0' : '#FF4D6D'}
          />
          <Metric
            label="Outliers"
            value={`${analysis.outlierShots.length} shots`}
            color={analysis.outlierShots.length === 0 ? '#00E5A0' : '#F5A623'}
          />
          <Metric
            label="Clusters"
            value={String(analysis.clusterCount)}
            color={analysis.clusterCount === 1 ? '#00E5A0' : analysis.clusterCount === 2 ? '#F5A623' : '#FF4D6D'}
          />
        </div>
      ) : (
        <p className="text-[#4A5568] text-xs">No shot data</p>
      )}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-[#4A5568] text-[10px] font-display uppercase tracking-wide">{label}</p>
      <p className="font-data font-bold text-sm mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-5 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="h-4 w-36 rounded mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-32 w-full rounded"   style={{ background: 'rgba(255,255,255,0.03)' }} />
        </div>
      ))}
    </div>
  );
}
