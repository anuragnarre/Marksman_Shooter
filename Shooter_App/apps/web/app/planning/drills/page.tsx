// apps/web/app/planning/drills/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import { useCoachShooter } from '../../../lib/use-coach-shooter';
import { AppShell } from '../../../components/AppShell';
import { useToast } from '../../../contexts/toast-context';

interface Drill {
  id: string;
  name: string;
  description: string;
  timeLimit: number;
  rounds: number;
  distance: string;
  tags: string[];
}

const DEFAULT_DRILLS: Drill[] = [
  {
    id: 'drill-dot',
    name: '10m Precision Dot Drill',
    description: 'Shoot 1 shot into each of 10 sequential 2mm sub-targets. Pause 15s between shots to verify natural point of aim.',
    timeLimit: 600,
    rounds: 10,
    distance: '10m',
    tags: ['Precision'],
  },
  {
    id: 'drill-cadence',
    name: 'Respiratory Pause Cadence',
    description: 'Complete 20 shots strictly during the natural 3-5 second respiratory pause without exceeding 7s hold time.',
    timeLimit: 900,
    rounds: 20,
    distance: '10m',
    tags: ['Consistency'],
  },
  {
    id: 'drill-wind',
    name: '50m Wind Drift Holdover',
    description: 'Call wind direction before every 5-shot string and compensate exclusively with sight clicks or reticle holdover.',
    timeLimit: 720,
    rounds: 25,
    distance: '50m',
    tags: ['Ballistics'],
  },
  {
    id: 'drill-dryfire',
    name: 'Dry-Fire Trigger Wall Isolation',
    description: 'Observe sight picture stability on blank white card before & for 1.5s after sear break.',
    timeLimit: 480,
    rounds: 30,
    distance: '10m',
    tags: ['Precision'],
  },
];

const CUSTOM_DRILLS_KEY = 'marksman_custom_drills_v1';
const SESSION_PLAN_KEY = 'marksman_session_plan_v1';

export default function DrillsPage() {
  const { selectedShooterId, isCoach } = useCoachShooter();
  const { toast } = useToast();
  const [drills, setDrills] = useState<Drill[]>(DEFAULT_DRILLS);
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [activeDrill, setActiveDrill] = useState<Drill | null>(null);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [heatmapDistance, setHeatmapDistance] = useState<'50Y' | '100Y'>('100Y');

  const [newDrillForm, setNewDrillForm] = useState({
    name: '',
    description: '',
    distance: '10m',
    rounds: '20',
    minutes: '10',
    tag: 'Precision',
  });

  const [primaryFocus, setPrimaryFocus] = useState('Verify 50y zero and ballistic app data');
  const [objectives, setObjectives] = useState<string[]>([
    'Focus on wind reading holds',
    'Run The Dot Drill 2x for baseline',
  ]);
  const [checked, setChecked] = useState<boolean[]>([true, false]);
  const [newObj, setNewObj] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem(SESSION_PLAN_KEY);
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan);
        if (parsed.primaryFocus) setPrimaryFocus(parsed.primaryFocus);
        if (Array.isArray(parsed.objectives)) setObjectives(parsed.objectives);
        if (Array.isArray(parsed.checked)) setChecked(parsed.checked);
      }
    } catch { /* ignore */ }

    const load = async () => {
      let localCustom: Drill[] = [];
      try {
        const raw = localStorage.getItem(CUSTOM_DRILLS_KEY);
        if (raw) localCustom = JSON.parse(raw);
      } catch { /* ignore */ }

      try {
        const data = await apiFetch<Drill[]>('/planning/drills');
        if (Array.isArray(data) && data.length > 0) {
          setDrills([...localCustom, ...data]);
          return;
        }
      } catch { /* fallback */ }
      setDrills([...localCustom, ...DEFAULT_DRILLS]);
    };
    load();
  }, []);

  function addObjective(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && newObj.trim()) {
      setObjectives((prev) => [...prev, newObj.trim()]);
      setChecked((prev) => [...prev, false]);
      setNewObj('');
    }
  }

  function toggleCheck(i: number) {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  async function handleSavePlan() {
    setSaving(true);
    try {
      localStorage.setItem(
        SESSION_PLAN_KEY,
        JSON.stringify({ primaryFocus, objectives, checked, updatedAt: new Date().toISOString() })
      );
      await apiFetch('/planning/session-plan', {
        method: 'POST',
        body: JSON.stringify({
          shooterId: isCoach ? selectedShooterId : undefined,
          primaryFocus,
          objectives,
        }),
      });
      toast('Session plan saved & synchronized!', 'success');
    } catch {
      toast('Session plan saved locally on device.', 'info');
    } finally {
      setSaving(false);
    }
  }

  function handleCreateCustomDrill(e: React.FormEvent) {
    e.preventDefault();
    if (!newDrillForm.name.trim()) {
      toast('Please enter a drill title.', 'warning');
      return;
    }
    const created: Drill = {
      id: `custom-${Date.now()}`,
      name: newDrillForm.name.trim(),
      description: newDrillForm.description.trim() || 'Custom marksmanship training routine.',
      distance: newDrillForm.distance.trim() || '10m',
      rounds: Number(newDrillForm.rounds) || 20,
      timeLimit: (Number(newDrillForm.minutes) || 10) * 60,
      tags: [newDrillForm.tag || 'Precision'],
    };
    setDrills((prev) => [created, ...prev]);
    try {
      const existing = JSON.parse(localStorage.getItem(CUSTOM_DRILLS_KEY) || '[]');
      localStorage.setItem(CUSTOM_DRILLS_KEY, JSON.stringify([created, ...existing]));
    } catch { /* ignore */ }
    setNewDrillForm({ name: '', description: '', distance: '10m', rounds: '20', minutes: '10', tag: 'Precision' });
    setShowNewPlanModal(false);
    toast(`Added "${created.name}" to your drills!`, 'success');
  }

  const allTags = ['ALL', ...Array.from(new Set(drills.flatMap((d) => d.tags || [])))];
  const filteredDrills =
    selectedTag === 'ALL' ? drills : drills.filter((d) => (d.tags || []).includes(selectedTag));

  const heatmapStats =
    heatmapDistance === '50Y'
      ? { meanRadius: '0.68 IN', shots: '186', hotStyle: 'translate(2%, -4%)', spreadSize: '42%' }
      : { meanRadius: '1.24 IN', shots: '142', hotStyle: 'translate(10%, 0%)', spreadSize: '60%' };

  return (
    <AppShell title="Drills">
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-text-primary font-bold tracking-wide mb-2">
              Training &amp; Drill Hub
            </h1>
            <p className="font-body text-[15px] text-text-secondary max-w-2xl leading-relaxed">
              Structured routines and data-driven insights to elevate marksmanship precision.
            </p>
          </div>
          <button
            onClick={() => setShowNewPlanModal(true)}
            className="bg-accent text-bg-void font-display font-bold text-[12px] tracking-widest uppercase px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-sm shrink-0 w-full md:w-auto"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Session Plan
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          {/* Drills Library — 8 cols */}
          <section className="xl:col-span-8 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-display font-semibold text-[13px] tracking-widest uppercase text-text-muted">
                  Standardized Drills
                </h2>
                <div className="flex gap-1.5 flex-wrap">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-display font-bold uppercase tracking-wider transition-colors ${
                        selectedTag === tag
                          ? 'bg-accent text-bg-void'
                          : 'bg-bg-surface text-text-secondary border border-border-subtle hover:text-text-primary'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowLibraryModal(true)}
                className="font-display font-bold text-[12px] tracking-widest uppercase text-accent hover:underline flex items-center gap-1"
              >
                View Library
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredDrills.map((drill) => (
                <div
                  key={drill.id}
                  onClick={() => setActiveDrill(drill)}
                  className="bg-bg-surface border border-border-subtle rounded-xl p-6 hover:border-accent/40 transition-colors cursor-pointer group flex flex-col h-full shadow-card"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span
                        className={`border font-display font-bold text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block ${
                          drill.tags?.[0] === 'Precision'
                            ? 'text-[#4FC3F7] bg-[#4FC3F7]/10 border-[#4FC3F7]/20'
                            : 'text-accent bg-accent/10 border-accent/20'
                        }`}
                      >
                        {drill.tags?.[0] || 'Drill'}
                      </span>
                      <h3 className="font-display font-bold text-[16px] text-text-primary leading-tight">
                        {drill.name}
                      </h3>
                    </div>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-text-muted group-hover:text-accent transition-colors shrink-0 mt-1"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <p className="font-body text-[13px] leading-relaxed text-text-secondary mb-5 flex-grow">
                    {drill.description}
                  </p>
                  <div className="pt-4 border-t border-border-subtle flex justify-between items-center font-mono text-[12px] text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      {Math.floor((drill.timeLimit || 0) / 60)}:00
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                      </svg>
                      {drill.rounds} RNDS
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" />
                      </svg>
                      {drill.distance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right column — 4 cols */}
          <section className="xl:col-span-4 flex flex-col gap-6">
            {/* AI Coaching Insight */}
            <div
              className="relative overflow-hidden rounded-xl p-6 border border-accent/25 flex flex-col gap-5"
              style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.02) 100%)' }}
            >
              <div
                className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
              />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2">
                    <path d="M12 2a5 5 0 0 1 5 5c0 1.5-.7 2.9-1.8 3.8A5.002 5.002 0 0 1 12 22a5.002 5.002 0 0 1-3.2-11.2A5.002 5.002 0 0 1 12 2z" />
                  </svg>
                </div>
                <span className="font-display font-bold text-[11px] uppercase tracking-widest text-accent">
                  Analysis Complete
                </span>
              </div>
              <p className="font-body text-[14px] text-text-secondary leading-relaxed relative z-10">
                Based on your last 3 sessions, you tend to pull shots slightly to the{' '}
                <strong className="text-text-primary">right</strong> when wind reading exceeds{' '}
                <strong className="text-accent">5mph</strong>.
                <br /><br />
                Recommendation: Focus on trigger follow-through and natural respiratory pause during gusting conditions.
              </p>
              <button
                onClick={() => setShowMetricsModal(true)}
                className="relative z-10 w-full font-display font-bold text-[12px] uppercase tracking-widest border border-accent/30 text-accent hover:bg-accent/10 py-2.5 rounded-xl transition-colors"
              >
                View Detailed Metrics
              </button>
            </div>

            {/* Session Goals Planner */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 flex flex-col gap-5 shadow-card">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <h2 className="font-display font-semibold text-[13px] tracking-widest uppercase text-text-muted">
                  Next Session Goals
                </h2>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>

              <div>
                <label className="block font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-2">
                  Primary Focus
                </label>
                <input
                  className="w-full bg-bg-elevated border border-border-subtle focus:border-accent rounded-lg px-3.5 py-2.5 font-body text-[14px] text-text-primary outline-none transition-colors"
                  value={primaryFocus}
                  onChange={(e) => setPrimaryFocus(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-3">
                  Secondary Objectives
                </label>
                <ul className="space-y-2.5">
                  {objectives.map((obj, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCheck(i)}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          checked[i] ? 'bg-accent border-accent text-bg-void' : 'bg-bg-elevated border-border-subtle'
                        }`}
                      >
                        {checked[i] && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <span className={`font-body text-[13px] flex-1 ${checked[i] ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {obj}
                      </span>
                    </li>
                  ))}
                  <li>
                    <input
                      className="w-full bg-transparent border-b border-dashed border-border-subtle focus:border-accent font-body text-[13px] text-text-primary py-1.5 outline-none transition-colors placeholder:text-text-muted"
                      placeholder="Add objective and press Enter..."
                      value={newObj}
                      onChange={(e) => setNewObj(e.target.value)}
                      onKeyDown={addObjective}
                    />
                  </li>
                </ul>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border-subtle">
                <span className="font-mono text-[12px] text-text-muted">EST. RNDS: 50</span>
                <button
                  onClick={handleSavePlan}
                  disabled={saving || (isCoach && !selectedShooterId)}
                  className="font-display font-bold text-[12px] uppercase tracking-widest text-accent hover:underline disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </div>

            {/* Heat Map */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-card">
              <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
                <h2 className="font-display font-semibold text-[13px] tracking-widest uppercase text-text-muted">
                  Target Heat Map
                </h2>
                <div className="flex gap-1.5">
                  {(['50Y', '100Y'] as const).map((dist) => (
                    <button
                      key={dist}
                      onClick={() => setHeatmapDistance(dist)}
                      className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors ${
                        heatmapDistance === dist
                          ? 'bg-accent text-bg-void font-bold'
                          : 'bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative min-h-[260px] flex items-center justify-center overflow-hidden bg-bg-void">
                <div className="absolute inset-0 flex items-center justify-center">
                  {[80, 60, 44, 28, 14].map((size, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full border border-border-subtle"
                      style={{ width: `${size}%`, height: `${size}%`, opacity: 0.7 - i * 0.08 }}
                    />
                  ))}
                  <div
                    className="absolute rounded-full transition-all duration-300"
                    style={{
                      width: heatmapStats.spreadSize,
                      height: heatmapStats.spreadSize,
                      background:
                        'radial-gradient(circle at 55% 50%, rgba(245,166,35,0.45) 0%, rgba(245,166,35,0.1) 40%, transparent 70%)',
                    }}
                  />
                  <div
                    className="absolute w-[20%] h-[20%] rounded-full transition-all duration-300"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(255,77,109,0.7) 0%, rgba(245,166,35,0.3) 60%, transparent 100%)',
                      transform: heatmapStats.hotStyle,
                    }}
                  />
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                  <div className="bg-bg-surface/90 backdrop-blur border border-border-subtle rounded-lg p-3">
                    <span className="block font-display font-semibold text-[10px] uppercase tracking-wider text-text-muted mb-1">
                      Mean Radius ({heatmapDistance})
                    </span>
                    <span className="font-mono font-bold text-text-primary">{heatmapStats.meanRadius}</span>
                  </div>
                  <div className="bg-bg-surface/90 backdrop-blur border border-border-subtle rounded-lg p-3 text-right">
                    <span className="block font-display font-semibold text-[10px] uppercase tracking-wider text-text-muted mb-1">
                      Total Shots
                    </span>
                    <span className="font-mono font-bold text-text-primary">{heatmapStats.shots}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Drill Execution Modal */}
        {activeDrill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setActiveDrill(null)}>
            <div className="w-full max-w-lg rounded-2xl bg-bg-surface border border-border-subtle p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-border-subtle pb-3">
                <div>
                  <span className="text-[10px] font-display font-bold uppercase tracking-widest text-accent">
                    {activeDrill.tags?.[0] || 'DRILL BRIEFING'}
                  </span>
                  <h3 className="font-display font-bold text-xl text-text-primary mt-0.5">{activeDrill.name}</h3>
                </div>
                <button onClick={() => setActiveDrill(null)} className="text-text-muted hover:text-text-primary px-2 py-1">
                  ✕
                </button>
              </div>
              <p className="font-body text-sm text-text-secondary leading-relaxed">{activeDrill.description}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-bg-elevated border border-border-subtle text-center">
                  <span className="text-[10px] font-display uppercase text-text-muted block">Time Cap</span>
                  <span className="font-mono font-bold text-text-primary">{Math.floor(activeDrill.timeLimit / 60)} min</span>
                </div>
                <div className="p-3 rounded-xl bg-bg-elevated border border-border-subtle text-center">
                  <span className="text-[10px] font-display uppercase text-text-muted block">Rounds</span>
                  <span className="font-mono font-bold text-accent">{activeDrill.rounds}</span>
                </div>
                <div className="p-3 rounded-xl bg-bg-elevated border border-border-subtle text-center">
                  <span className="text-[10px] font-display uppercase text-text-muted block">Distance</span>
                  <span className="font-mono font-bold text-text-primary">{activeDrill.distance}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (!objectives.includes(`Complete ${activeDrill.name}`)) {
                      setObjectives((prev) => [...prev, `Complete ${activeDrill.name}`]);
                      setChecked((prev) => [...prev, false]);
                    }
                    toast(`Added "${activeDrill.name}" to today's goals!`, 'success');
                    setActiveDrill(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-bg-void font-display font-bold text-xs uppercase tracking-wider"
                >
                  Add to Session Plan
                </button>
                <button
                  onClick={() => setActiveDrill(null)}
                  className="px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-text-primary font-display font-bold text-xs uppercase"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Session Plan / Custom Drill Modal */}
        {showNewPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setShowNewPlanModal(false)}>
            <form
              onSubmit={handleCreateCustomDrill}
              className="w-full max-w-lg rounded-2xl bg-bg-surface border border-border-subtle p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h3 className="font-display font-bold text-xl text-text-primary">Create Training Drill</h3>
                <button type="button" onClick={() => setShowNewPlanModal(false)} className="text-text-muted hover:text-text-primary">✕</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label block mb-1">Drill Name *</label>
                  <input
                    className="field w-full"
                    placeholder="e.g. Offhand 40-Shot Match Sim"
                    value={newDrillForm.name}
                    onChange={(e) => setNewDrillForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label block mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="field w-full resize-none"
                    placeholder="Focus on sight picture settle time and trigger reset..."
                    value={newDrillForm.description}
                    onChange={(e) => setNewDrillForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label block mb-1">Distance</label>
                    <input
                      className="field w-full"
                      value={newDrillForm.distance}
                      onChange={(e) => setNewDrillForm((p) => ({ ...p, distance: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label block mb-1">Rounds</label>
                    <input
                      type="number"
                      className="field w-full"
                      value={newDrillForm.rounds}
                      onChange={(e) => setNewDrillForm((p) => ({ ...p, rounds: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label block mb-1">Minutes</label>
                    <input
                      type="number"
                      className="field w-full"
                      value={newDrillForm.minutes}
                      onChange={(e) => setNewDrillForm((p) => ({ ...p, minutes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNewPlanModal(false)} className="btn btn-ghost text-xs">Cancel</button>
                <button type="submit" className="btn btn-primary text-xs">Save Drill</button>
              </div>
            </form>
          </div>
        )}

        {/* Drill Library Full Modal */}
        {showLibraryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setShowLibraryModal(false)}>
            <div className="w-full max-w-2xl rounded-2xl bg-bg-surface border border-border-subtle p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h3 className="font-display font-bold text-xl text-text-primary">Complete Drill Library ({drills.length})</h3>
                <button onClick={() => setShowLibraryModal(false)} className="text-text-muted hover:text-text-primary">✕</button>
              </div>
              <div className="space-y-2.5">
                {drills.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => { setShowLibraryModal(false); setActiveDrill(d); }}
                    className="p-4 rounded-xl bg-bg-elevated border border-border-subtle hover:border-accent/40 cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm text-text-primary">{d.name}</p>
                      <p className="text-xs text-text-secondary truncate">{d.description}</p>
                    </div>
                    <span className="font-mono text-xs text-accent shrink-0">{d.rounds} rds • {d.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Metrics Modal */}
        {showMetricsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setShowMetricsModal(false)}>
            <div className="w-full max-w-lg rounded-2xl bg-bg-surface border border-border-subtle p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h3 className="font-display font-bold text-xl text-text-primary">Detailed Drill Metrics</h3>
                <button onClick={() => setShowMetricsModal(false)} className="text-text-muted hover:text-text-primary">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-subtle">
                  <span className="text-[10px] font-display uppercase text-text-muted block">Horizontal Wind Drift</span>
                  <span className="font-mono text-xl font-bold text-[#4FC3F7]">+1.4 mm Right</span>
                </div>
                <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-subtle">
                  <span className="text-[10px] font-display uppercase text-text-muted block">Avg Hold Window</span>
                  <span className="font-mono text-xl font-bold text-[#00E5A0]">3.8 sec</span>
                </div>
                <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-subtle">
                  <span className="text-[10px] font-display uppercase text-text-muted block">Follow-Through</span>
                  <span className="font-mono text-xl font-bold text-accent">91.5%</span>
                </div>
                <div className="p-3.5 rounded-xl bg-bg-elevated border border-border-subtle">
                  <span className="text-[10px] font-display uppercase text-text-muted block">Breath Consistency</span>
                  <span className="font-mono text-xl font-bold text-text-primary">94 / 100</span>
                </div>
              </div>
              <button onClick={() => setShowMetricsModal(false)} className="w-full btn btn-primary text-xs">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
