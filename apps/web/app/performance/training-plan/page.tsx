'use client';

// AI Training Plan Generator — generate & view 4-week personalised plans

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../../components/AppShell';
import { apiFetch } from '../../../lib/api';
import type { TrainingPlan, TrainingPlanWeek, TrainingPlanSession } from '@shooting-platform/shared-types';

export default function TrainingPlanPage() {
  const [plans,      setPlans]      = useState<TrainingPlan[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<TrainingPlan[]>('/performance/training-plans')
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const plan = await apiFetch<TrainingPlan>('/performance/training-plan', { method: 'POST' });
      setPlans((prev) => [plan, ...prev]);
      setExpandedId(plan.id);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  }

  const latestPlan = plans[0];

  return (
    <AppShell title="Training Plan">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between animate-slide-up">
          <div>
            <h1 className="font-display font-bold text-2xl text-[#F0F4FF]">Training Plan</h1>
            <p className="text-[#4A5568] text-sm mt-1">AI-generated 4-week personalised programme</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-primary text-xs py-2 px-4 shrink-0"
          >
            {generating ? 'Analysing...' : 'Generate New Plan'}
          </button>
        </div>

        {/* Generating state */}
        {generating && (
          <div className="card p-8 flex flex-col items-center gap-4 animate-slide-up">
            <div
              className="w-12 h-12 rounded-full border-2 border-[#F5A623] border-t-transparent animate-spin"
            />
            <p
              className="font-display font-semibold text-lg"
              style={{
                background: 'linear-gradient(135deg, #F5A623 0%, #FFD580 50%, #F5A623 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 2s linear infinite',
              }}
            >
              Analysing your sessions…
            </p>
            <p className="text-[#4A5568] text-sm">This may take a few seconds</p>
          </div>
        )}

        {error && (
          <div className="card p-4 border border-[rgba(255,77,109,0.3)] bg-[rgba(255,77,109,0.06)]">
            <p className="text-[#FF4D6D] text-sm">{error}</p>
          </div>
        )}

        {/* Latest plan — full display */}
        {!generating && latestPlan && (
          <div className="space-y-4 animate-slide-up stagger-2">
            {/* Coaching note */}
            {latestPlan.coachingNote && (
              <div
                className="card p-5"
                style={{ borderLeft: '3px solid #F5A623', background: 'rgba(245,166,35,0.04)' }}
              >
                <p className="label mb-2">Coach Note</p>
                <p className="text-[#F0F4FF] text-sm leading-relaxed">{latestPlan.coachingNote}</p>
                {latestPlan.focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {latestPlan.focusAreas.map((area) => (
                      <span key={area} className="chip capitalize">{area}</span>
                    ))}
                  </div>
                )}
                <p className="text-[#4A5568] text-xs mt-3 font-display">
                  Generated {new Date(latestPlan.generatedAt).toLocaleDateString()} · Week of {latestPlan.weekStart}
                </p>
              </div>
            )}

            {/* 4-week grid */}
            {latestPlan.weeks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {latestPlan.weeks.map((week) => (
                  <WeekCard key={week.week} week={week} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && plans.length === 0 && !generating && (
          <div className="card p-8 text-center">
            <p className="text-[#4A5568] text-sm">No training plans yet. Generate your first plan above.</p>
          </div>
        )}

        {/* Previous plans history */}
        {plans.length > 1 && (
          <div className="animate-slide-up stagger-4">
            <h2 className="font-display font-semibold text-sm text-[#F0F4FF] mb-3 uppercase tracking-wide">Previous Plans</h2>
            <div className="space-y-2">
              {plans.slice(1).map((plan) => (
                <div key={plan.id} className="card overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                    className="w-full flex items-center justify-between p-4 text-left
                               hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <div>
                      <p className="font-display font-semibold text-sm text-[#F0F4FF]">
                        Week of {plan.weekStart}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {plan.focusAreas.slice(0, 3).map((a) => (
                          <span key={a} className="chip text-[10px] capitalize">{a}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronIcon open={expandedId === plan.id} />
                  </button>

                  {expandedId === plan.id && (
                    <div className="px-4 pb-4 space-y-3">
                      {plan.coachingNote && (
                        <p className="text-[#8892A4] text-xs leading-relaxed">{plan.coachingNote}</p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {plan.weeks.map((week) => (
                          <WeekCard key={week.week} week={week} compact />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}

// ── Week Card ──────────────────────────────────────────────────────────────────

function WeekCard({ week, compact = false }: { week: TrainingPlanWeek; compact?: boolean }) {
  const weekColors = ['#F5A623', '#4FC3F7', '#00E5A0', '#FF4D6D'];
  const color = weekColors[(week.week - 1) % 4];

  return (
    <div
      className="card p-4 space-y-3"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div>
        <div className="flex items-center gap-2">
          <span
            className="font-data font-bold text-xs px-2 py-0.5 rounded"
            style={{ background: `${color}20`, color }}
          >
            Week {week.week}
          </span>
        </div>
        <p className="font-display font-semibold text-sm text-[#F0F4FF] mt-1">{week.focus}</p>
      </div>

      <div className="space-y-2">
        {week.sessions.map((session, i) => (
          <SessionCard key={i} session={session} color={color} compact={compact} />
        ))}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  color,
  compact,
}: {
  session: TrainingPlanSession;
  color: string;
  compact: boolean;
}) {
  return (
    <div
      className="rounded-lg p-3 space-y-1"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-display font-semibold text-xs text-[#F0F4FF]">{session.day}</span>
        <span className="font-data text-xs" style={{ color }}>
          {session.sets}×{session.shots} shots
        </span>
      </div>
      <p className="text-[#8892A4] text-xs">{session.drill}</p>
      {!compact && session.notes && (
        <p className="text-[#4A5568] text-[11px] leading-relaxed">{session.notes}</p>
      )}
      <p className="text-[#4A5568] text-[10px] font-display uppercase tracking-wide">
        Rest {session.restMinutes}min
      </p>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="#4A5568" strokeWidth="1.8" strokeLinecap="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
    >
      <polyline points="3,5 8,11 13,5" />
    </svg>
  );
}
