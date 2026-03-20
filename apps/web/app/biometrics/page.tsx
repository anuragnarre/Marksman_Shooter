// apps/web/app/biometrics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../contexts/auth-context';
import { AppShell } from '../../components/AppShell';
import { BiometricLiveCard } from '../../components/BiometricLiveCard';
import { BiometricSessionChart } from '../../components/BiometricSessionChart';
import { BiometricTrendChart } from '../../components/BiometricTrendChart';
import type {
  Session,
  BiometricSummary,
  AiBiometricAnalysis,
  BiometricInsight,
} from '@shooting-platform/shared-types';

export default function BiometricsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [summary, setSummary] = useState<BiometricSummary | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiBiometricAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [trendDays, setTrendDays] = useState(30);

  useEffect(() => {
    apiFetch<Session[]>('/sessions')
      .then(data => {
        setSessions(data);
        if (data.length > 0) setSelectedSessionId(data[0].id);
      })
      .catch(() => {});
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
    try {
      const result = await apiFetch<AiBiometricAnalysis>(
        `/biometrics/session/${selectedSessionId}/ai-analysis`,
      );
      setAiAnalysis(result);
    } catch {}
    setAiLoading(false);
  }

  if (!user) return null;

  return (
    <AppShell title="Biometrics">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header with device management link */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h2 className="font-display font-bold text-xl text-[#F0F4FF]">Biometrics</h2>
            <p className="text-xs mt-0.5" style={{ color: '#8892A4' }}>
              Real-time heart rate, SpO2, and physiological tracking
            </p>
          </div>
          <Link
            href="/settings/devices"
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
              <h3 className="font-display font-semibold text-base text-[#F0F4FF]">
                Session Biometrics
              </h3>
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
            </div>

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
                <button
                  onClick={handleAiAnalysis}
                  disabled={aiLoading || !summary || summary.readingCount === 0}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
                >
                  {aiLoading ? 'Analysing...' : 'AI Biometric Analysis'}
                </button>
              ) : (
                <div className="space-y-3 mt-2">
                  <div className="card p-4" style={{ border: '1px solid rgba(245,166,35,0.15)' }}>
                    <p className="text-sm text-[#F0F4FF] mb-1 font-semibold">Summary</p>
                    <p className="text-xs" style={{ color: '#8892A4' }}>{aiAnalysis.summary}</p>
                  </div>
                  <div className="card p-4" style={{ border: '1px solid rgba(79,195,247,0.15)' }}>
                    <p className="text-sm text-[#F0F4FF] mb-1 font-semibold">Performance Correlation</p>
                    <p className="text-xs" style={{ color: '#8892A4' }}>{aiAnalysis.performanceCorrelation}</p>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-base text-[#F0F4FF]">
                Biometric Trends
              </h3>
              <div className="flex gap-1">
                {[7, 30, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => setTrendDays(d)}
                    className="px-3 py-1 rounded-lg text-xs font-display font-semibold transition-all"
                    style={{
                      background: trendDays === d ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.03)',
                      color: trendDays === d ? '#F5A623' : '#4A5568',
                      border: trendDays === d ? '1px solid rgba(245,166,35,0.2)' : '1px solid transparent',
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <BiometricTrendChart days={trendDays} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MiniMetric({ label, value, unit, color }: {
  label: string; value: string; unit: string; color: string;
}) {
  return (
    <div className="card p-3 text-center">
      <p className="text-[10px] font-display font-bold uppercase tracking-wider mb-1"
        style={{ color: '#8892A4' }}>
        {label}
      </p>
      <p className="font-mono text-lg font-bold" style={{ color }}>
        {value}
        {unit && <span className="text-xs font-normal ml-0.5" style={{ color: '#4A5568' }}>{unit}</span>}
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
        <span className="text-sm font-semibold text-[#F0F4FF]">{insight.title}</span>
      </div>
      <p className="text-xs mb-1" style={{ color: '#8892A4' }}>{insight.observation}</p>
      <p className="text-xs" style={{ color: '#F0F4FF' }}>{insight.recommendation}</p>
    </div>
  );
}
