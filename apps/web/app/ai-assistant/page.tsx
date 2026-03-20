// apps/web/app/ai-assistant/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { apiFetch } from '../../lib/api';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { useCoachShooter } from '../../lib/use-coach-shooter';
import type {
  AiPerformanceAssistant,
  TechniqueInsight,
  PerformancePattern,
  MentalRecommendation,
  PhysicalRecommendation,
  SmartAlert,
} from '@shooting-platform/shared-types';

// ── Constants ─────────────────────────────────────────────────────────────────

const TECHNIQUE_META: Record<string, { label: string; color: string; icon: string }> = {
  posture:       { label: 'Posture',        color: '#4FC3F7', icon: '\u2299' },
  breathing:     { label: 'Breathing',      color: '#00E5A0', icon: '\u301C' },
  trigger:       { label: 'Trigger',        color: '#F5A623', icon: '\u25CE' },
  stability:     { label: 'Stability',      color: '#8892A4', icon: '\u229A' },
  followThrough: { label: 'Follow-Through', color: '#FF4D6D', icon: '\u2192' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  strong:     { label: 'Strong',     color: '#00E5A0', bg: 'rgba(0,229,160,0.08)' },
  developing: { label: 'Developing', color: '#F5A623', bg: 'rgba(245,166,35,0.08)' },
  needsWork:  { label: 'Needs Work', color: '#FF4D6D', bg: 'rgba(255,77,109,0.08)' },
};

const TREND_META: Record<string, { label: string; color: string; arrow: string }> = {
  improving: { label: 'Improving', color: '#00E5A0', arrow: '\u2191' },
  stable:    { label: 'Stable',    color: '#F5A623', arrow: '\u2192' },
  declining: { label: 'Declining', color: '#FF4D6D', arrow: '\u2193' },
};

const MENTAL_META: Record<string, { color: string; icon: string }> = {
  focus:         { color: '#4FC3F7', icon: '\u25C9' },
  calmness:      { color: '#00E5A0', icon: '\u223F' },
  competition:   { color: '#FF4D6D', icon: '\u2605' },
  meditation:    { color: '#8892A4', icon: '\u25CB' },
  visualization: { color: '#F5A623', icon: '\u25CA' },
};

const PHYSICAL_META: Record<string, { color: string; icon: string }> = {
  core:        { color: '#F5A623', icon: '\u25A0' },
  stability:   { color: '#4FC3F7', icon: '\u25B2' },
  endurance:   { color: '#FF4D6D', icon: '\u21BB' },
  flexibility: { color: '#00E5A0', icon: '\u223C' },
  recovery:    { color: '#8892A4', icon: '\u2726' },
};

const ALERT_META: Record<string, { color: string; border: string; bg: string; icon: string }> = {
  warning: { color: '#FF4D6D', border: 'rgba(255,77,109,0.3)', bg: 'rgba(255,77,109,0.06)', icon: '\u26A0' },
  info:    { color: '#4FC3F7', border: 'rgba(79,195,247,0.3)',  bg: 'rgba(79,195,247,0.06)', icon: '\u24D8' },
  success: { color: '#00E5A0', border: 'rgba(0,229,160,0.3)',   bg: 'rgba(0,229,160,0.06)',  icon: '\u2713' },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AiAssistantPage() {
  const {
    isCoach,
    shooters,
    selectedShooter,
    selectedShooterId,
    setSelectedShooterId,
  } = useCoachShooter();

  const [data,      setData]      = useState<AiPerformanceAssistant | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'technique' | 'analytics' | 'mental' | 'physical' | 'insights'>('technique');

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const query = isCoach && selectedShooterId
        ? `?shooterId=${encodeURIComponent(selectedShooterId)}`
        : '';
      const result = await apiFetch<AiPerformanceAssistant>(
        `/ai-coach/performance-assistant${query}`,
        { method: 'POST' },
      );
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="AI Performance Assistant">
      <div className="space-y-8 max-w-5xl">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.25)]
                            flex items-center justify-center">
              <BrainIcon />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-[#F0F4FF]">AI Performance Assistant</h2>
              <p className="text-[#4A5568] text-xs font-display">
                Powered by Llama 3.3 70B
              </p>
            </div>
          </div>
          <p className="text-[#8892A4] text-sm mt-2 max-w-2xl">
            Comprehensive analysis of your entire shooting history. Get personalized technique corrections,
            performance trends, mental and physical training recommendations, and an actionable improvement plan.
          </p>
          {isCoach && selectedShooter && (
            <p className="text-[#4A5568] text-xs mt-2">
              Analysing: <span className="text-[#F0F4FF]">{selectedShooter.name}</span>
            </p>
          )}
        </div>

        {/* ── Coach shooter selector ─────────────────────────────────── */}
        {isCoach && (
          <div className="card p-4 animate-slide-up">
            <label className="label mb-2 block">Shooter</label>
            <select
              value={selectedShooterId ?? ''}
              onChange={(e) => { setSelectedShooterId(e.target.value || null); setData(null); }}
              className="field w-full sm:max-w-sm"
            >
              {shooters.length === 0 && <option value="">No connected shooters</option>}
              {shooters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.shooterProfile?.isManaged ? ` (ID: ${s.shooterProfile.shooterCode})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Analyze button ─────────────────────────────────────────── */}
        {!data && !loading && (
          <div className="animate-slide-up">
            <div className="relative rounded-xl border border-[#1E2433] bg-[#0E1118] p-8 text-center overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px"
                   style={{ background: 'linear-gradient(90deg,transparent,rgba(245,166,35,0.45),transparent)' }} />
              <div className="absolute inset-0 pointer-events-none"
                   style={{ background: 'radial-gradient(ellipse at 50% 0%,rgba(245,166,35,0.04) 0%,transparent 60%)' }} />

              <div className="relative">
                <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-[rgba(245,166,35,0.08)]
                                border border-[rgba(245,166,35,0.2)] flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <circle cx="18" cy="18" r="14" stroke="#F5A623" strokeWidth="1.5" opacity="0.4"/>
                    <circle cx="18" cy="18" r="8" stroke="#F5A623" strokeWidth="1.5" opacity="0.7"/>
                    <circle cx="18" cy="18" r="3" fill="#F5A623"/>
                    <line x1="18" y1="2" x2="18" y2="10" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="18" y1="26" x2="18" y2="34" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="2" y1="18" x2="10" y2="18" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="26" y1="18" x2="34" y2="18" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>

                <p className="font-display font-bold text-lg text-[#F0F4FF] mb-2">
                  Ready to Analyse Your Performance
                </p>
                <p className="text-[#8892A4] text-sm mb-6 max-w-md mx-auto">
                  The AI will examine all your sessions to generate technique analysis,
                  performance trends, training recommendations, and a personalised improvement plan.
                </p>

                <button
                  onClick={() => void runAnalysis()}
                  disabled={isCoach && !selectedShooterId}
                  className="btn btn-primary px-10 py-3 text-base disabled:opacity-40"
                >
                  Generate Full Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────── */}
        {error && (
          <div role="alert"
            className="flex items-center gap-3 px-4 py-3 rounded-xl
                       bg-[rgba(255,77,109,0.08)] border border-[rgba(255,77,109,0.25)]
                       text-[#FF4D6D] text-sm animate-slide-down">
            <AlertIcon /> {error}
            <button onClick={() => void runAnalysis()} className="ml-auto text-xs font-display font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────── */}
        {loading && <LoadingState />}

        {/* ── Results ────────────────────────────────────────────────── */}
        {data && !loading && (
          <div className="space-y-6 animate-slide-up">

            {/* ── Overview card ─────────────────────────────────────── */}
            <OverviewCard data={data} onReanalyze={runAnalysis} />

            {/* ── Tab navigation ────────────────────────────────────── */}
            <div className="flex gap-1 p-1 rounded-xl bg-[#0E1118] border border-[#1E2433] overflow-x-auto">
              {([
                { key: 'technique', label: 'Technique' },
                { key: 'analytics', label: 'Analytics' },
                { key: 'mental',    label: 'Mental' },
                { key: 'physical',  label: 'Physical' },
                { key: 'insights',  label: 'Insights' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-display font-semibold text-xs
                             tracking-wide transition-all duration-200 whitespace-nowrap"
                  style={{
                    background: activeTab === tab.key ? 'rgba(245,166,35,0.12)' : 'transparent',
                    color: activeTab === tab.key ? '#F5A623' : '#4A5568',
                    border: activeTab === tab.key ? '1px solid rgba(245,166,35,0.25)' : '1px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab content ───────────────────────────────────────── */}
            {activeTab === 'technique' && <TechniqueTab insights={data.techniqueInsights} />}
            {activeTab === 'analytics' && <AnalyticsTab patterns={data.performancePatterns} comparison={data.sessionComparison} />}
            {activeTab === 'mental'    && <MentalTab recommendations={data.mentalRecommendations} />}
            {activeTab === 'physical'  && <PhysicalTab recommendations={data.physicalRecommendations} />}
            {activeTab === 'insights'  && <InsightsTab alerts={data.smartAlerts} plan={data.improvementPlan}
                                                       weaknesses={data.weaknesses} strengths={data.strengths} />}

            {/* ── Footer ────────────────────────────────────────────── */}
            <p className="text-[#4A5568] text-[11px] text-center font-display">
              Generated {new Date(data.generatedAt).toLocaleString()} | {data.model} | {data.sessionsAnalyzed} sessions analysed
            </p>
          </div>
        )}

      </div>
    </AppShell>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Loading State
   ══════════════════════════════════════════════════════════════════════════════ */

function LoadingState() {
  const stages = [
    'Loading shooting history...',
    'Computing cross-session analytics...',
    'Analysing technique patterns...',
    'Evaluating mental & physical factors...',
    'Generating personalised recommendations...',
    'Building improvement plan...',
  ];
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStage(s => Math.min(s + 1, stages.length - 1)), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl border border-[rgba(245,166,35,0.2)] bg-[#0E1118] p-12
                    flex flex-col items-center text-center animate-fade-in">
      {/* Animated brain scanner */}
      <div className="relative mb-8">
        <svg width="90" height="90" viewBox="0 0 90 90" className="animate-spin" style={{ animationDuration: '10s' }}>
          {[36, 28, 20, 12].map((r, i) => (
            <circle key={r} cx="45" cy="45" r={r} fill="none" stroke="#F5A623"
              strokeWidth="0.8" opacity={0.12 + i * 0.12}
              strokeDasharray={i % 2 === 0 ? '4 6' : 'none'} />
          ))}
          <line x1="45" y1="4"  x2="45" y2="22" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="45" y1="68" x2="45" y2="86" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4"  y1="45" x2="22" y2="45" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="68" y1="45" x2="86" y2="45" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <BrainIcon size={28} />
        </div>
      </div>

      <p className="font-display font-bold text-[#F0F4FF] text-lg mb-2">
        AI is analysing your complete shooting profile
      </p>
      <p className="text-[#F5A623] text-sm font-display animate-pulse">
        {stages[stage]}
      </p>

      {/* Progress bar */}
      <div className="w-64 h-1 rounded-full bg-[#1E2433] mt-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${((stage + 1) / stages.length) * 100}%`,
            background: 'linear-gradient(90deg, #F5A623, #FFD580)',
            boxShadow: '0 0 8px rgba(245,166,35,0.5)',
          }}
        />
      </div>
      <p className="text-[#4A5568] text-xs mt-4">
        Comprehensive analysis takes 15-30 seconds
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Overview Card
   ══════════════════════════════════════════════════════════════════════════════ */

function OverviewCard({ data, onReanalyze }: { data: AiPerformanceAssistant; onReanalyze: () => void }) {
  const ratingColor = data.overallRating >= 8 ? '#00E5A0'
    : data.overallRating >= 6 ? '#F5A623' : '#FF4D6D';

  const trendMeta = TREND_META[data.sessionComparison.trend] ?? TREND_META.stable;

  return (
    <div className="relative rounded-xl border border-[rgba(245,166,35,0.25)] bg-[#0E1118] overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px"
           style={{ background: 'linear-gradient(90deg,transparent,#F5A623,transparent)' }} />
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at 90% 50%,rgba(245,166,35,0.04) 0%,transparent 60%)' }} />

      <div className="relative p-6">
        <div className="flex items-start gap-6 flex-wrap">
          {/* Rating dial */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <RatingDial rating={data.overallRating} color={ratingColor} />
            <p className="label text-[9px] text-center">Overall Rating</p>
          </div>

          {/* Summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <BrainIcon size={16} />
              <p className="font-display font-bold text-[#F0F4FF] text-base tracking-wide">
                Performance Summary
              </p>
              <button
                onClick={onReanalyze}
                className="ml-auto text-[10px] font-display font-semibold text-[#4A5568] hover:text-[#F5A623] transition-colors"
              >
                Re-analyse
              </button>
            </div>
            <p className="text-[#8892A4] text-sm leading-relaxed mb-4">
              {data.summary}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4">
              <MiniStat label="Sessions" value={String(data.sessionsAnalyzed)} color="#4FC3F7" />
              <MiniStat label="Recent Avg" value={data.sessionComparison.recentAvg.toFixed(2)} color="#F0F4FF" />
              <MiniStat
                label="Trend"
                value={`${trendMeta.arrow} ${Math.abs(data.sessionComparison.percentChange).toFixed(1)}%`}
                color={trendMeta.color}
              />
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses pills */}
        <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-[#1E2433]">
          {data.strengths.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <p className="label text-[9px] mb-2 text-[#00E5A0]">Strengths</p>
              <div className="flex flex-wrap gap-1.5">
                {data.strengths.map((s, i) => (
                  <span key={i} className="text-[10px] font-display font-semibold px-2 py-1 rounded-lg
                                           bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.2)] text-[#00E5A0]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.weaknesses.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <p className="label text-[9px] mb-2 text-[#FF4D6D]">Weaknesses</p>
              <div className="flex flex-wrap gap-1.5">
                {data.weaknesses.map((w, i) => (
                  <span key={i} className="text-[10px] font-display font-semibold px-2 py-1 rounded-lg
                                           bg-[rgba(255,77,109,0.08)] border border-[rgba(255,77,109,0.2)] text-[#FF4D6D]">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Technique Tab
   ══════════════════════════════════════════════════════════════════════════════ */

function TechniqueTab({ insights }: { insights: TechniqueInsight[] }) {
  if (insights.length === 0) return <EmptySection label="technique insights" />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Shooting Technique Optimization" subtitle="Body position, breathing, trigger, stability analysis" />

      {insights.map((insight, i) => {
        const tech = TECHNIQUE_META[insight.area] ?? TECHNIQUE_META.posture;
        const status = STATUS_META[insight.status] ?? STATUS_META.developing;

        return (
          <TechniqueCard key={i} insight={insight} tech={tech} status={status} index={i} />
        );
      })}
    </div>
  );
}

function TechniqueCard({ insight, tech, status, index }: {
  insight: TechniqueInsight;
  tech: { label: string; color: string; icon: string };
  status: { label: string; color: string; bg: string };
  index: number;
}) {
  const [open, setOpen] = useState(index < 2);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-300"
      style={{
        borderColor: `${tech.color}30`,
        background: `linear-gradient(135deg, ${tech.color}06 0%, transparent 60%)`,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
             style={{ background: `${tech.color}12`, border: `1px solid ${tech.color}25` }}>
          <span className="font-display font-bold text-lg" style={{ color: tech.color }}>{tech.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold text-[#F0F4FF] text-sm">{insight.title}</p>
            <span className="text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color: tech.color, background: `${tech.color}12` }}>
              {tech.label}
            </span>
            <span className="text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{ color: status.color, background: status.bg, border: `1px solid ${status.color}30` }}>
              {status.label}
            </span>
          </div>
        </div>
        <ChevronRight open={open} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-[#1E2433]/60 pt-4">
          <div>
            <p className="label text-[9px] mb-1">Observation</p>
            <p className="text-[#8892A4] text-sm leading-relaxed">{insight.observation}</p>
          </div>
          <div>
            <p className="label text-[9px] mb-1" style={{ color: tech.color }}>Correction</p>
            <p className="text-[#F0F4FF] text-sm leading-relaxed">{insight.correction}</p>
          </div>
          {insight.drill && (
            <div className="rounded-lg border border-[rgba(245,166,35,0.2)] bg-[rgba(245,166,35,0.04)] p-3">
              <p className="label text-[9px] mb-1 text-[#F5A623]">Drill</p>
              <p className="text-[#8892A4] text-sm leading-relaxed">{insight.drill}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Analytics Tab
   ══════════════════════════════════════════════════════════════════════════════ */

function AnalyticsTab({ patterns, comparison }: {
  patterns: PerformancePattern[];
  comparison: AiPerformanceAssistant['sessionComparison'];
}) {
  const trendMeta = TREND_META[comparison.trend] ?? TREND_META.stable;

  return (
    <div className="space-y-4">
      <SectionHeader title="Performance Analytics" subtitle="Shot grouping, accuracy trends, pattern detection" />

      {/* Comparison card */}
      <div className="rounded-xl border border-[#1E2433] bg-[#0E1118] p-5">
        <p className="label text-[9px] mb-4">Session Comparison</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="font-data font-bold text-xl text-[#F0F4FF]">{comparison.recentAvg.toFixed(2)}</p>
            <p className="text-[10px] text-[#4A5568] font-display mt-1">Recent Avg</p>
          </div>
          <div className="text-center">
            <p className="font-data font-bold text-xl" style={{ color: trendMeta.color }}>
              {trendMeta.arrow} {Math.abs(comparison.percentChange).toFixed(1)}%
            </p>
            <p className="text-[10px] font-display mt-1" style={{ color: trendMeta.color }}>{trendMeta.label}</p>
          </div>
          <div className="text-center">
            <p className="font-data font-bold text-xl text-[#8892A4]">{comparison.previousAvg.toFixed(2)}</p>
            <p className="text-[10px] text-[#4A5568] font-display mt-1">Previous Avg</p>
          </div>
        </div>

        {/* Visual bar */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-[#1E2433] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
                 style={{
                   width: `${Math.min(100, (comparison.previousAvg / 10.9) * 100)}%`,
                   background: '#8892A4',
                   opacity: 0.4,
                 }} />
          </div>
          <div className="flex-1 h-2 rounded-full bg-[#1E2433] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
                 style={{
                   width: `${Math.min(100, (comparison.recentAvg / 10.9) * 100)}%`,
                   background: `linear-gradient(90deg, ${trendMeta.color}, ${trendMeta.color}80)`,
                   boxShadow: `0 0 6px ${trendMeta.color}50`,
                 }} />
          </div>
        </div>
        <div className="flex justify-between text-[9px] text-[#4A5568] font-display mt-1">
          <span>Previous</span>
          <span>Recent</span>
        </div>
      </div>

      {/* Pattern cards */}
      {patterns.length === 0 ? <EmptySection label="performance patterns" /> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {patterns.map((p, i) => {
            const trend = TREND_META[p.trend] ?? TREND_META.stable;
            return (
              <div key={i} className="rounded-xl border border-[#1E2433] bg-[#0E1118] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-display font-bold" style={{ color: trend.color }}>
                    {trend.arrow}
                  </span>
                  <p className="font-display font-semibold text-sm text-[#F0F4FF]">{p.title}</p>
                  <span className="ml-auto text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ color: trend.color, background: `${trend.color}15`, border: `1px solid ${trend.color}30` }}>
                    {trend.label}
                  </span>
                </div>
                <p className="text-[#8892A4] text-xs leading-relaxed mb-2">{p.detail}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-display text-[#4A5568] uppercase tracking-widest">{p.type}</span>
                  <span className="font-data font-bold text-sm" style={{ color: trend.color }}>{p.dataPoint}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Mental Tab
   ══════════════════════════════════════════════════════════════════════════════ */

function MentalTab({ recommendations }: { recommendations: MentalRecommendation[] }) {
  if (recommendations.length === 0) return <EmptySection label="mental recommendations" />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Mental Training" subtitle="Focus, calmness, competition mindset, meditation routines" />

      <div className="grid gap-4 sm:grid-cols-2">
        {recommendations.map((rec, i) => {
          const meta = MENTAL_META[rec.category] ?? MENTAL_META.focus;
          return (
            <div key={i} className="rounded-xl border border-[#1E2433] bg-[#0E1118] p-5 overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-px"
                   style={{ background: `linear-gradient(90deg, transparent, ${meta.color}40, transparent)` }} />

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}25` }}>
                  <span className="text-base" style={{ color: meta.color }}>{meta.icon}</span>
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-[#F0F4FF]">{rec.title}</p>
                  <p className="text-[9px] font-display uppercase tracking-widest" style={{ color: meta.color }}>
                    {rec.category}
                  </p>
                </div>
              </div>

              <p className="text-[#8892A4] text-xs leading-relaxed mb-3">{rec.description}</p>

              {rec.routine && (
                <div className="rounded-lg bg-[rgba(255,255,255,0.02)] border border-[#1E2433] p-3 mb-2">
                  <p className="label text-[8px] mb-1" style={{ color: meta.color }}>Routine</p>
                  <p className="text-[#F0F4FF] text-xs leading-relaxed">{rec.routine}</p>
                </div>
              )}

              {rec.duration && (
                <p className="text-[10px] text-[#4A5568] font-display">
                  Duration: <span className="text-[#8892A4]">{rec.duration}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Physical Tab
   ══════════════════════════════════════════════════════════════════════════════ */

function PhysicalTab({ recommendations }: { recommendations: PhysicalRecommendation[] }) {
  if (recommendations.length === 0) return <EmptySection label="physical recommendations" />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Physical Training" subtitle="Core strength, stability, endurance, flexibility, recovery" />

      <div className="grid gap-4 sm:grid-cols-2">
        {recommendations.map((rec, i) => {
          const meta = PHYSICAL_META[rec.category] ?? PHYSICAL_META.core;
          return (
            <div key={i} className="rounded-xl border border-[#1E2433] bg-[#0E1118] p-5 overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-px"
                   style={{ background: `linear-gradient(90deg, transparent, ${meta.color}40, transparent)` }} />

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}25` }}>
                  <span className="text-base" style={{ color: meta.color }}>{meta.icon}</span>
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-[#F0F4FF]">{rec.title}</p>
                  <p className="text-[9px] font-display uppercase tracking-widest" style={{ color: meta.color }}>
                    {rec.category}
                  </p>
                </div>
                {rec.frequency && (
                  <span className="ml-auto text-[9px] font-display text-[#4A5568] px-2 py-0.5 rounded
                                   bg-[rgba(255,255,255,0.03)] border border-[#1E2433]">
                    {rec.frequency}
                  </span>
                )}
              </div>

              <p className="text-[#8892A4] text-xs leading-relaxed mb-3">{rec.description}</p>

              {rec.exercises && rec.exercises.length > 0 && (
                <div className="space-y-1.5">
                  <p className="label text-[8px]" style={{ color: meta.color }}>Exercises</p>
                  {rec.exercises.map((ex, j) => (
                    <div key={j} className="flex items-center gap-2 px-3 py-2 rounded-lg
                                            bg-[rgba(255,255,255,0.02)] border border-[#1E2433]">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]
                                       font-display font-bold shrink-0"
                            style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}25` }}>
                        {j + 1}
                      </span>
                      <p className="text-[#F0F4FF] text-xs">{ex}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Insights Tab (Alerts + Improvement Plan)
   ══════════════════════════════════════════════════════════════════════════════ */

function InsightsTab({ alerts, plan, weaknesses, strengths }: {
  alerts: SmartAlert[];
  plan: AiPerformanceAssistant['improvementPlan'];
  weaknesses: string[];
  strengths: string[];
}) {
  return (
    <div className="space-y-6">
      <SectionHeader title="Smart Insights" subtitle="Alerts, corrections, and your personalised improvement plan" />

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <p className="label text-[9px]">Active Alerts</p>
          {alerts.map((alert, i) => {
            const meta = ALERT_META[alert.severity] ?? ALERT_META.info;
            return (
              <div key={i} className="rounded-xl overflow-hidden"
                   style={{ border: `1px solid ${meta.border}`, background: meta.bg }}>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base" style={{ color: meta.color }}>{meta.icon}</span>
                    <p className="font-display font-semibold text-sm text-[#F0F4FF]">{alert.title}</p>
                    <span className="ml-auto text-[9px] font-display font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                          style={{ color: meta.color, border: `1px solid ${meta.border}` }}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-[#8892A4] text-xs leading-relaxed mb-2">{alert.message}</p>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                    <p className="text-xs font-display font-semibold" style={{ color: meta.color }}>
                      {alert.actionItem}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Improvement Plan */}
      <div className="rounded-xl border border-[rgba(245,166,35,0.25)] bg-[#0E1118] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2433]"
             style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.06) 0%, transparent 60%)' }}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
            <p className="font-display font-bold text-sm text-[#F5A623] uppercase tracking-widest">
              Next Improvement Plan
            </p>
          </div>
          <p className="text-[#8892A4] text-xs mt-1">{plan.timeframe}</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Goal */}
          <div className="rounded-lg border border-[rgba(0,229,160,0.2)] bg-[rgba(0,229,160,0.04)] p-4">
            <p className="label text-[9px] text-[#00E5A0] mb-1">Goal</p>
            <p className="text-[#F0F4FF] text-sm font-display font-semibold">{plan.goal}</p>
          </div>

          {/* Steps */}
          {plan.steps.length > 0 && (
            <div>
              <p className="label text-[9px] mb-3">Steps</p>
              <div className="space-y-2">
                {plan.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full border border-[rgba(245,166,35,0.4)]
                                     bg-[rgba(245,166,35,0.08)] flex items-center justify-center
                                     text-[#F5A623] font-display font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[#8892A4] text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          {plan.milestones.length > 0 && (
            <div>
              <p className="label text-[9px] mb-3 text-[#4FC3F7]">Milestones</p>
              <div className="flex flex-wrap gap-2">
                {plan.milestones.map((m, i) => (
                  <span key={i} className="text-[10px] font-display font-semibold px-3 py-1.5 rounded-lg
                                           bg-[rgba(79,195,247,0.08)] border border-[rgba(79,195,247,0.2)] text-[#4FC3F7]">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Shared Components
   ══════════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="font-display font-bold text-lg text-[#F0F4FF]">{title}</p>
      <p className="text-[#4A5568] text-xs">{subtitle}</p>
    </div>
  );
}

function EmptySection({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-[#1E2433] bg-[#0E1118] p-8 text-center">
      <p className="text-[#4A5568] text-sm">No {label} generated for this analysis.</p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="label text-[9px]">{label}</p>
      <p className="font-data font-bold text-lg" style={{ color }}>{value}</p>
    </div>
  );
}

function ChevronRight({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4A5568"
         strokeWidth="1.5" strokeLinecap="round"
         style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }}>
      <polyline points="5,3 9,7 5,11" />
    </svg>
  );
}

function RatingDial({ rating, color }: { rating: number; color: string }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const filled = (rating / 10) * circ;

  return (
    <div className="relative w-20 h-20">
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1E2433" strokeWidth="5" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}70)`, transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-data font-bold text-xl leading-none" style={{ color }}>
          {rating.toFixed(1)}
        </p>
        <p className="text-[#4A5568] text-[9px] font-display">/10</p>
      </div>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────────────────────────── */

function BrainIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 5 5c0 1.5-.7 2.9-1.8 3.8A5.002 5.002 0 0 1 12 22a5.002 5.002 0 0 1-3.2-11.2A5.002 5.002 0 0 1 12 2z" />
      <path d="M12 2v20" />
      <path d="M8.5 6.5C7 7.5 7 9.5 8 11" />
      <path d="M15.5 6.5c1.5 1 1.5 3 .5 4.5" />
      <path d="M8 14.5c-1 1-1 2.5 0 3.5" />
      <path d="M16 14.5c1 1 1 2.5 0 3.5" />
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
