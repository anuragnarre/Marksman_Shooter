// apps/web/app/biometrics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../contexts/auth-context';
import { AppShell } from '../../../components/AppShell';
import { BiometricLiveCard } from '../../../components/BiometricLiveCard';
import { BiometricSessionChart } from '../../../components/BiometricSessionChart';
import { BiometricTrendChart } from '../../../components/BiometricTrendChart';
import type {
  Session,
  BiometricSummary,
  AiBiometricAnalysis,
  BiometricInsight,
  AdvancedBiometricInsights,
  AdvancedInsightItem,
} from '@shooting-platform/shared-types';
import { PerformanceSectionNav } from '../../../components/performance/PerformanceSectionNav';

export default function BiometricsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [summary, setSummary] = useState<BiometricSummary | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiBiometricAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [trendMode, setTrendMode] = useState<'live' | '1h' | '1d' | '7d' | '30d' | '90d'>('30d');

  // Advanced insights state
  const [advancedInsights, setAdvancedInsights] = useState<AdvancedBiometricInsights | null>(null);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedError, setAdvancedError] = useState<string | null>(null);
  const [insightPeriod, setInsightPeriod] = useState(30);

  useEffect(() => {
    apiFetch<Session[]>('/sessions')
      .then(data => {
        setSessions(data);
        if (data.length > 0) setSelectedSessionId(data[0].id);
      })
      .catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return;
    apiFetch<BiometricSummary>(`/biometrics/session/${selectedSessionId}/summary`)
      .then(setSummary)
      .catch(() => setSummary(null));
    setAiAnalysis(null);
  }, [selectedSessionId]);

  async function handleAiAnalysis() {
    if (!selectedSessionId) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await apiFetch<AiBiometricAnalysis>(
        `/biometrics/session/${selectedSessionId}/ai-analysis`,
      );
      setAiAnalysis(result);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI analysis failed. Please try again.');
    }
    setAiLoading(false);
  }

  async function handleAdvancedInsights() {
    setAdvancedLoading(true);
    setAdvancedError(null);
    try {
      const result = await apiFetch<AdvancedBiometricInsights>(
        `/biometrics/advanced-insights?days=${insightPeriod}`,
      );
      setAdvancedInsights(result);
    } catch (err: any) {
      setAdvancedError(err?.message || 'Failed to generate insights');
    }
    setAdvancedLoading(false);
  }

  if (!user) return null;

  return (
    <AppShell title="Health">
      <div className="space-y-6 max-w-6xl mx-auto">

        <div className="animate-slide-up">
          <h1 className="font-display font-bold text-2xl text-text-primary">Performance</h1>
          <p className="text-text-muted text-sm mt-1">
            Heart rate, SpO₂, HRV, and physiological tracking
          </p>
        </div>

        <PerformanceSectionNav />

        {/* Header with device management link */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h2 className="font-display font-bold text-xl text-text-primary">Biometrics</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Real-time heart rate, SpO2, and physiological tracking
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display font-semibold transition-all"
            style={{
              color: '#F5A623',
              background: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.2)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="6" />
              <line x1="8" y1="5" x2="8" y2="11" />
              <line x1="5" y1="8" x2="11" y2="8" />
            </svg>
            Manage Devices
          </Link>
        </div>

        {/* Section 1: Live Monitor */}
        <section className="animate-slide-up stagger-1">
          <BiometricLiveCard />
        </section>

        {/* Section 2: Session Biometrics */}
        <section className="animate-slide-up stagger-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h3 className="font-display font-semibold text-base text-text-primary">
                Session Biometrics
              </h3>
              {sessions.length > 0 && (
                <select
                  value={selectedSessionId}
                  onChange={e => setSelectedSessionId(e.target.value)}
                  className="field text-sm"
                >
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.sessionDate).toLocaleDateString()} - {s.discipline} ({s.weaponType})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {sessions.length === 0 && !selectedSessionId && (
              <div className="py-12 flex flex-col items-center text-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4 opacity-40">
                  <path d="M24 4v8m0 24v8M4 24h8m24 0h8" stroke="#F5A623" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="24" cy="24" r="16" stroke="#F5A623" strokeWidth="1.5" opacity="0.3"/>
                  <circle cx="24" cy="24" r="8" stroke="#F5A623" strokeWidth="1.5" opacity="0.5"/>
                  <circle cx="24" cy="24" r="2" fill="#F5A623"/>
                </svg>
                <p className="font-display font-bold text-base text-text-primary">No sessions yet</p>
                <p className="text-text-secondary text-sm mt-1 max-w-xs">
                  Record a training session to see biometric data and analysis here.
                </p>
              </div>
            )}

            {/* Summary metrics */}
            {summary && summary.readingCount > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
                <MiniMetric label="Avg HR" value={`${summary.avgHeartRate}`} unit="bpm" color="#FF4D6D" />
                <MiniMetric label="HR Range" value={`${summary.minHeartRate}-${summary.maxHeartRate}`} unit="bpm" color="#FF4D6D" />
                <MiniMetric label="HRV" value={`${summary.hrv}`} unit="ms" color="#F5A623" />
                <MiniMetric label="Avg SpO2" value={`${summary.avgSpo2}`} unit="%" color="#4FC3F7" />
                {summary.avgRespiratoryRate !== null && (
                  <MiniMetric label="Resp Rate" value={`${summary.avgRespiratoryRate}`} unit="/min" color="#00E5A0" />
                )}
                <MiniMetric label="Readings" value={`${summary.readingCount}`} unit="" color="#8892A4" />
              </div>
            )}

            {/* Chart */}
            {selectedSessionId && (
              <BiometricSessionChart sessionId={selectedSessionId} />
            )}

            {/* AI Analysis */}
            <div className="mt-4">
              {!aiAnalysis ? (
                <>
                  <button
                    onClick={handleAiAnalysis}
                    disabled={aiLoading || !summary || summary.readingCount === 0}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
                  >
                    {aiLoading ? 'Analysing...' : 'AI Biometric Analysis'}
                  </button>
                  {aiError && (
                    <p className="text-[#FF4D6D] text-xs mt-2">{aiError}</p>
                  )}
                </>
              ) : (
                <div className="space-y-3 mt-2">
                  <div className="card p-4" style={{ border: '1px solid rgba(245,166,35,0.15)' }}>
                    <p className="text-sm text-text-primary mb-1 font-semibold">Summary</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{aiAnalysis.summary}</p>
                  </div>
                  <div className="card p-4" style={{ border: '1px solid rgba(79,195,247,0.15)' }}>
                    <p className="text-sm text-text-primary mb-1 font-semibold">Performance Correlation</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{aiAnalysis.performanceCorrelation}</p>
                  </div>
                  {aiAnalysis.insights.map((insight, i) => (
                    <InsightCard key={i} insight={insight} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Trends */}
        <section className="animate-slide-up stagger-3">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-display font-semibold text-base text-text-primary">
                Biometric Trends
              </h3>
              <div className="flex gap-1">
                {(['live', '1h', '1d', '7d', '30d', '90d'] as const).map(m => {
                  const isLive = m === 'live';
                  const active = trendMode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setTrendMode(m)}
                      className="px-3 py-1 rounded-lg text-xs font-display font-semibold transition-all flex items-center gap-1"
                      style={{
                        background: active
                          ? isLive ? 'rgba(0,229,160,0.15)' : 'rgba(245,166,35,0.15)'
                          : 'rgba(255,255,255,0.03)',
                        color: active
                          ? isLive ? '#00E5A0' : '#F5A623'
                          : '#4A5568',
                        border: active
                          ? isLive ? '1px solid rgba(0,229,160,0.2)' : '1px solid rgba(245,166,35,0.2)'
                          : '1px solid transparent',
                      }}
                    >
                      {isLive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: active ? '#00E5A0' : '#4A5568',
                            boxShadow: active ? '0 0 4px rgba(0,229,160,0.7)' : 'none',
                          }}
                        />
                      )}
                      {m === 'live' ? 'Live' : m}
                    </button>
                  );
                })}
              </div>
            </div>
            <BiometricTrendChart mode={trendMode} />
          </div>
        </section>

        {/* Section 4: Advanced Analysis & Insights */}
        <section className="animate-slide-up stagger-4">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
              <div>
                <h3 className="font-display font-semibold text-base text-text-primary">
                  Advanced Analysis & Insights
                </h3>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  AI-powered personalized coaching from your biometric data
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[7, 30, 90].map(d => (
                    <button
                      key={d}
                      onClick={() => { setInsightPeriod(d); setAdvancedInsights(null); }}
                      className="px-3 py-1 rounded-lg text-xs font-display font-semibold transition-all"
                      style={{
                        background: insightPeriod === d ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.03)',
                        color: insightPeriod === d ? '#F5A623' : 'var(--text-muted)',
                        border: insightPeriod === d ? '1px solid rgba(245,166,35,0.2)' : '1px solid transparent',
                      }}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
                {!advancedInsights && (
                  <button
                    onClick={handleAdvancedInsights}
                    disabled={advancedLoading}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
                  >
                    {advancedLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing...
                      </span>
                    ) : 'Generate Insights'}
                  </button>
                )}
              </div>
            </div>

            {advancedError && (
              <div className="card p-4 mt-3" style={{ border: '1px solid rgba(255,77,109,0.2)', background: 'rgba(255,77,109,0.05)' }}>
                <p className="text-xs" style={{ color: '#FF4D6D' }}>{advancedError}</p>
              </div>
            )}

            {!advancedInsights && !advancedLoading && !advancedError && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <DomainPreview
                  icon={<LungsIcon />}
                  title="Breathing Patterns"
                  description="Respiratory rate analysis, breathing consistency, and technique recommendations"
                  color="#00E5A0"
                />
                <DomainPreview
                  icon={<HeartStableIcon />}
                  title="HR Stabilization"
                  description="Heart rate zones, calmness scoring, and relaxation techniques"
                  color="#FF4D6D"
                />
                <DomainPreview
                  icon={<BrainIcon />}
                  title="Focus & Stress"
                  description="Stress detection, mental readiness assessment, and mindfulness strategies"
                  color="#F5A623"
                />
                <DomainPreview
                  icon={<TargetIcon />}
                  title="Performance"
                  description="Optimal zones, shot timing correlation, and session optimization"
                  color="#4FC3F7"
                />
              </div>
            )}

            {advancedLoading && (
              <div className="mt-6 flex flex-col items-center justify-center py-12">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-[#F5A623]/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#F5A623] animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-[#4FC3F7] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                </div>
                <p className="text-sm font-display font-semibold text-text-primary">Analyzing your biometric data...</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>Processing {insightPeriod} days of readings across all domains</p>
              </div>
            )}

            {advancedInsights && (
              <div className="mt-4 space-y-5">
                {/* Overall Readiness Score */}
                <div className="flex items-center gap-5 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                  <ReadinessGauge score={advancedInsights.overallReadiness} />
                  <div className="flex-1">
                    <p className="text-[10px] font-display font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Overall Readiness
                    </p>
                    <p className="font-display font-bold text-lg text-text-primary">
                      {advancedInsights.overallReadinessLabel}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-display font-semibold"
                        style={{
                          background: advancedInsights.dataSource === 'combined' ? 'rgba(245,166,35,0.1)' : advancedInsights.dataSource === 'health_connect' ? 'rgba(0,229,160,0.1)' : 'rgba(79,195,247,0.1)',
                          color: advancedInsights.dataSource === 'combined' ? '#F5A623' : advancedInsights.dataSource === 'health_connect' ? '#00E5A0' : '#4FC3F7',
                        }}>
                        {advancedInsights.dataSource === 'combined' ? 'Sensor + Health Connect' : advancedInsights.dataSource === 'health_connect' ? 'Health Connect' : 'Sensor Data'}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Last {insightPeriod} days
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setAdvancedInsights(null); setAdvancedError(null); }}
                    className="text-[10px] font-display font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                    style={{ color: 'var(--text-secondary)', background: 'var(--chip-bg)', border: '1px solid var(--glass-border)' }}
                  >
                    Refresh
                  </button>
                </div>

                {/* Domain Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Breathing Analysis */}
                  <DomainCard
                    icon={<LungsIcon />}
                    title="Breathing & Respiration"
                    color="#00E5A0"
                    score={advancedInsights.breathing.consistencyScore}
                    scoreLabel="Consistency"
                  >
                    <div className="space-y-3">
                      {advancedInsights.breathing.estimatedRate !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-display font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Est. Rate</span>
                          <span className="font-mono text-sm font-bold" style={{ color: '#00E5A0' }}>
                            {advancedInsights.breathing.estimatedRate} <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>br/min</span>
                          </span>
                        </div>
                      )}
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{advancedInsights.breathing.pattern}</p>
                      <div className="space-y-1.5">
                        {advancedInsights.breathing.recommendations.map((rec, i) => (
                          <RecommendationItem key={i} text={rec} color="#00E5A0" />
                        ))}
                      </div>
                    </div>
                  </DomainCard>

                  {/* HR Stability */}
                  <DomainCard
                    icon={<HeartStableIcon />}
                    title="Heart Rate Stabilization"
                    color="#FF4D6D"
                    score={advancedInsights.hrStability.calmnessScore}
                    scoreLabel="Calmness"
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="font-mono text-sm font-bold" style={{ color: '#FF4D6D' }}>{advancedInsights.hrStability.restingHr}</p>
                          <p className="text-[9px] font-display font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Resting</p>
                        </div>
                        <div className="text-center">
                          <p className="font-mono text-sm font-bold" style={{ color: '#F5A623' }}>{advancedInsights.hrStability.activeHr}</p>
                          <p className="text-[9px] font-display font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Active</p>
                        </div>
                        <div className="text-center">
                          <p className="font-mono text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{advancedInsights.hrStability.recoveryRate}</p>
                          <p className="text-[9px] font-display font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Recovery</p>
                        </div>
                      </div>
                      {/* Zone bar */}
                      <div>
                        <p className="text-[9px] font-display font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>HR Zone Distribution</p>
                        <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--chip-bg)' }}>
                          <div style={{ width: `${advancedInsights.hrStability.zoneBreakdown.optimal}%`, background: '#00E5A0' }} title={`Optimal ${advancedInsights.hrStability.zoneBreakdown.optimal}%`} />
                          <div style={{ width: `${advancedInsights.hrStability.zoneBreakdown.elevated}%`, background: '#F5A623' }} title={`Elevated ${advancedInsights.hrStability.zoneBreakdown.elevated}%`} />
                          <div style={{ width: `${advancedInsights.hrStability.zoneBreakdown.high}%`, background: '#FF4D6D' }} title={`High ${advancedInsights.hrStability.zoneBreakdown.high}%`} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[8px] font-mono" style={{ color: '#00E5A0' }}>{advancedInsights.hrStability.zoneBreakdown.optimal}% optimal</span>
                          <span className="text-[8px] font-mono" style={{ color: '#F5A623' }}>{advancedInsights.hrStability.zoneBreakdown.elevated}% elevated</span>
                          <span className="text-[8px] font-mono" style={{ color: '#FF4D6D' }}>{advancedInsights.hrStability.zoneBreakdown.high}% high</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {advancedInsights.hrStability.recommendations.map((rec, i) => (
                          <RecommendationItem key={i} text={rec} color="#FF4D6D" />
                        ))}
                      </div>
                    </div>
                  </DomainCard>

                  {/* Focus & Stress */}
                  <DomainCard
                    icon={<BrainIcon />}
                    title="Focus & Stress Management"
                    color="#F5A623"
                    score={advancedInsights.focusStress.mentalReadiness}
                    scoreLabel="Mental Readiness"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <StressIndicator level={advancedInsights.focusStress.stressLevel} />
                        <div className="flex-1">
                          <p className="text-[10px] font-display font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>HRV Trend</p>
                          <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{advancedInsights.focusStress.hrvTrend}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {advancedInsights.focusStress.recommendations.map((rec, i) => (
                          <RecommendationItem key={i} text={rec} color="#F5A623" />
                        ))}
                      </div>
                    </div>
                  </DomainCard>

                  {/* Performance Optimization */}
                  <DomainCard
                    icon={<TargetIcon />}
                    title="Performance Optimization"
                    color="#4FC3F7"
                    score={null}
                    scoreLabel=""
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        <PerfDetail label="Optimal HR Zone" value={advancedInsights.performanceOptimization.optimalHrZone} />
                        <PerfDetail label="Peak Window" value={advancedInsights.performanceOptimization.bestPerformanceWindow} />
                        <PerfDetail label="Shot-HR Correlation" value={advancedInsights.performanceOptimization.shotTimingCorrelation} />
                      </div>
                      <div className="space-y-1.5">
                        {advancedInsights.performanceOptimization.recommendations.map((rec, i) => (
                          <RecommendationItem key={i} text={rec} color="#4FC3F7" />
                        ))}
                      </div>
                    </div>
                  </DomainCard>
                </div>

                {/* Individual Insight Cards */}
                {advancedInsights.insights.length > 0 && (
                  <div>
                    <h4 className="font-display font-semibold text-sm text-text-primary mb-3">
                      Personalized Insights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {advancedInsights.insights.map((insight, i) => (
                        <AdvancedInsightCard key={i} insight={insight} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

// ── Sub Components ──────────────────────────────────────────────────────────

function MiniMetric({ label, value, unit, color }: {
  label: string; value: string; unit: string; color: string;
}) {
  return (
    <div className="card p-3 text-center">
      <p className="text-[10px] font-display font-bold uppercase tracking-wider mb-1"
        style={{ color: 'var(--text-secondary)' }}>
        {label}
      </p>
      <p className="font-mono text-lg font-bold" style={{ color }}>
        {value}
        {unit && <span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
      </p>
    </div>
  );
}

function InsightCard({ insight }: { insight: BiometricInsight }) {
  const severityColor = {
    critical: '#FF4D6D',
    moderate: '#F5A623',
    positive: '#00E5A0',
  }[insight.severity];

  return (
    <div className="card p-4" style={{ borderLeft: `3px solid ${severityColor}` }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-display font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ background: `${severityColor}15`, color: severityColor }}>
          {insight.category.replace('_', ' ')}
        </span>
        <span className="text-sm font-semibold text-text-primary">{insight.title}</span>
      </div>
      <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{insight.observation}</p>
      <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{insight.recommendation}</p>
    </div>
  );
}

function DomainPreview({ icon, title, description, color }: {
  icon: React.ReactNode; title: string; description: string; color: string;
}) {
  return (
    <div className="card p-4 text-center transition-all hover:scale-[1.02]" style={{ border: `1px solid ${color}15` }}>
      <div className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center" style={{ background: `${color}10` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <p className="font-display font-semibold text-xs text-text-primary mb-1">{title}</p>
      <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{description}</p>
    </div>
  );
}

function DomainCard({ icon, title, color, score, scoreLabel, children }: {
  icon: React.ReactNode; title: string; color: string; score: number | null; scoreLabel: string; children: React.ReactNode;
}) {
  return (
    <div className="card p-5" style={{ border: `1px solid ${color}20` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}12` }}>
            <div style={{ color }}>{icon}</div>
          </div>
          <h4 className="font-display font-semibold text-sm text-text-primary">{title}</h4>
        </div>
        {score !== null && (
          <div className="text-right">
            <p className="font-mono text-lg font-bold" style={{ color }}>
              {score}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/100</span>
            </p>
            <p className="text-[8px] font-display font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{scoreLabel}</p>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function RecommendationItem({ text, color }: { text: string; color: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
      <p className="text-[11px]" style={{ color: 'var(--text-primary)' }}>{text}</p>
    </div>
  );
}

function PerfDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'rgba(79,195,247,0.04)' }}>
      <p className="text-[9px] font-display font-bold uppercase tracking-wider shrink-0 w-24 pt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-[11px]" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function AdvancedInsightCard({ insight }: { insight: AdvancedInsightItem }) {
  const severityColor = {
    critical: '#FF4D6D',
    moderate: '#F5A623',
    positive: '#00E5A0',
  }[insight.severity];

  const domainColor: Record<string, string> = {
    breathing: '#00E5A0',
    heart_rate_stability: '#FF4D6D',
    focus_stress: '#F5A623',
    performance_optimization: '#4FC3F7',
    recovery: '#A78BFA',
    health_connect: '#00E5A0',
  };

  const trendIcon = insight.trend === 'improving' ? '\u2191' : insight.trend === 'declining' ? '\u2193' : '\u2192';
  const trendColor = insight.trend === 'improving' ? '#00E5A0' : insight.trend === 'declining' ? '#FF4D6D' : '#8892A4';

  return (
    <div className="card p-4" style={{ borderLeft: `3px solid ${severityColor}` }}>
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="text-[9px] font-display font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ background: `${domainColor[insight.domain] ?? '#8892A4'}15`, color: domainColor[insight.domain] ?? '#8892A4' }}>
          {insight.domain.replace(/_/g, ' ')}
        </span>
        {insight.metric && insight.metricValue && (
          <span className="font-mono text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {insight.metricValue}
          </span>
        )}
        {insight.trend && (
          <span className="font-mono text-xs font-bold" style={{ color: trendColor }}>{trendIcon}</span>
        )}
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">{insight.title}</p>
      <p className="text-[11px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>{insight.observation}</p>
      <p className="text-[11px]" style={{ color: 'var(--text-primary)' }}>{insight.recommendation}</p>
    </div>
  );
}

function ReadinessGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#00E5A0' : score >= 60 ? '#F5A623' : '#FF4D6D';
  const circumference = 2 * Math.PI * 28;
  const dashLength = (score / 100) * circumference;

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r="28" fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${dashLength} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-base font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function StressIndicator({ level }: { level: 'low' | 'moderate' | 'high' }) {
  const config = {
    low: { color: '#00E5A0', label: 'Low Stress', bars: 1 },
    moderate: { color: '#F5A623', label: 'Moderate', bars: 2 },
    high: { color: '#FF4D6D', label: 'High Stress', bars: 3 },
  }[level];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end gap-0.5 h-5">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="w-1.5 rounded-sm"
            style={{
              height: `${i * 6}px`,
              background: i <= config.bars ? config.color : 'rgba(255,255,255,0.06)',
            }}
          />
        ))}
      </div>
      <p className="text-[8px] font-display font-bold uppercase tracking-wider" style={{ color: config.color }}>
        {config.label}
      </p>
    </div>
  );
}

// ── SVG Icons ────────────────────────────────────────────────────────────────

function LungsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v8" />
      <path d="M12 12c-2 0-4 1-5 3s-1.5 5 0 6.5c1 1 3 .5 4-1l1-2" />
      <path d="M12 12c2 0 4 1 5 3s1.5 5 0 6.5c-1 1-3 .5-4-1l-1-2" />
      <path d="M10 6h4" />
    </svg>
  );
}

function HeartStableIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20l-7-7c-1.5-1.5-2-4-1-6s3.5-3 5.5-2L12 7l2.5-2c2-1 4.5 0 5.5 2s.5 4.5-1 6l-7 7z" />
      <path d="M6 12h3l1.5-3 3 6 1.5-3h3" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 4.5 7.2A4 4 0 0 1 18 13a4 4 0 0 1-2 3.5V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3.5A4 4 0 0 1 6 13a4 4 0 0 1 1.5-3.8A5 5 0 0 1 12 2z" />
      <path d="M12 2v20" />
      <path d="M8 8h0" />
      <path d="M16 8h0" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
