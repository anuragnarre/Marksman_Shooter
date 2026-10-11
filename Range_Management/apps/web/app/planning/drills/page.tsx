// apps/web/app/planning/drills/page.tsx
'use client';

import React, { useState } from 'react';

const DRILLS = [
  {
    tag: 'Precision',
    tagColor: 'text-[#4FC3F7] bg-[#4FC3F7]/10 border-[#4FC3F7]/20',
    name: 'The Dot Drill',
    desc: 'Engage 5 small targets at varying distances. Tests foundational trigger control and sight alignment under mild time pressure.',
    time: '5:00',
    rounds: '10 RNDS',
    distance: '25-50Y',
  },
  {
    tag: 'Speed / Transition',
    tagColor: 'text-accent bg-accent/10 border-accent/20',
    name: 'Rapid Engagement',
    desc: 'Multiple targets spread laterally. Focuses on smooth target acquisition and minimizing over-travel during transitions.',
    time: '2:30',
    rounds: '15 RNDS',
    distance: '20Y',
  },
  {
    tag: 'Fundamentals',
    tagColor: 'text-[#00D48A] bg-[#00D48A]/10 border-[#00D48A]/20',
    name: 'Trigger Reset Drill',
    desc: 'Slow-fire, single shot at a time with deliberate trigger reset. Eliminates flinch and builds clean follow-through habits.',
    time: '10:00',
    rounds: '20 RNDS',
    distance: '10-25Y',
  },
  {
    tag: 'Endurance',
    tagColor: 'text-[#A78BFA] bg-[#A78BFA]/10 border-[#A78BFA]/20',
    name: '60-Round Endurance',
    desc: 'Full competitive simulation. Six 10-round strings with 90-second intervals. Records split times and group sizes per string.',
    time: '45:00',
    rounds: '60 RNDS',
    distance: '50Y',
  },
];

export default function DrillsPage() {
  const [objectives, setObjectives] = useState<string[]>([
    'Focus on wind reading holds',
    'Run The Dot Drill 2x for baseline',
  ]);
  const [checked, setChecked] = useState<boolean[]>([true, false]);
  const [newObj, setNewObj] = useState('');

  function addObjective(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && newObj.trim()) {
      setObjectives([...objectives, newObj.trim()]);
      setChecked([...checked, false]);
      setNewObj('');
    }
  }

  function toggleCheck(i: number) {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
  }

  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-text-primary font-bold tracking-wide mb-3">
            Training &amp; Drill Hub
          </h1>
          <p className="font-body text-[15px] text-text-secondary max-w-2xl leading-relaxed">
            Structured routines and data-driven insights to elevate marksmanship precision.
          </p>
        </div>
        <button className="bg-accent text-bg-void font-display font-bold text-[12px] tracking-widest uppercase px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-sm shrink-0 w-full md:w-auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Session Plan
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">

        {/* Drills Library — 8 cols */}
        <section className="xl:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <h2 className="font-display font-semibold text-[13px] tracking-widest uppercase text-text-muted">
              Standardized Drills
            </h2>
            <button className="font-display font-bold text-[12px] tracking-widest uppercase text-accent hover:underline flex items-center gap-1">
              View Library
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {DRILLS.map((drill) => (
              <div
                key={drill.name}
                className="bg-bg-void border border-border-subtle rounded-xl p-6 hover:border-accent/40 transition-colors cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`border font-display font-bold text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 inline-block ${drill.tagColor}`}>
                      {drill.tag}
                    </span>
                    <h3 className="font-display font-bold text-[16px] text-text-primary leading-tight">{drill.name}</h3>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted group-hover:text-accent transition-colors shrink-0 mt-1">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <p className="font-body text-[13px] leading-relaxed text-text-secondary mb-5 flex-grow">{drill.desc}</p>
                <div className="pt-4 border-t border-border-subtle flex justify-between items-center font-mono text-[12px] text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {drill.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
                    {drill.rounds}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
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
          <div className="relative overflow-hidden rounded-xl p-6 border border-accent/20 flex flex-col gap-5"
            style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.06) 0%, rgba(245,166,35,0.02) 100%)' }}>
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
              <span className="font-display font-bold text-[11px] uppercase tracking-widest text-accent">Analysis Complete</span>
            </div>
            <p className="font-body text-[14px] text-text-secondary leading-relaxed relative z-10">
              Based on your last 3 sessions, you tend to pull shots slightly to the{' '}
              <strong className="text-text-primary">right</strong> when wind reading exceeds{' '}
              <strong className="text-accent">5mph</strong>.
              <br /><br />
              Recommendation: Focus on trigger follow-through and natural respiratory pause during gusting conditions.
            </p>
            <button className="relative z-10 w-full font-display font-bold text-[12px] uppercase tracking-widest border border-accent/30 text-accent hover:bg-accent/10 py-2.5 rounded-xl transition-colors">
              View Detailed Metrics
            </button>
          </div>

          {/* Session Goals Planner */}
          <div className="bg-bg-void border border-border-subtle rounded-xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <h2 className="font-display font-semibold text-[13px] tracking-widest uppercase text-text-muted">
                Next Session Goals
              </h2>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>

            <div>
              <label className="block font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-2">Primary Focus</label>
              <input className="w-full bg-bg-surface border border-border-subtle focus:border-accent rounded-lg px-3.5 py-2.5 font-body text-[14px] text-text-primary outline-none transition-colors" defaultValue="Verify 50y zero and ballistic app data" />
            </div>

            <div>
              <label className="block font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-3">Secondary Objectives</label>
              <ul className="space-y-2.5">
                {objectives.map((obj, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCheck(i)}
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${checked[i] ? 'bg-accent border-accent' : 'bg-bg-surface border-border-subtle'}`}
                    >
                      {checked[i] && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </button>
                    <span className={`font-body text-[13px] ${checked[i] ? 'line-through text-text-muted' : 'text-text-primary'}`}>{obj}</span>
                  </li>
                ))}
                <li>
                  <input
                    className="w-full bg-transparent border-b border-dashed border-border-subtle focus:border-accent font-body text-[13px] text-text-secondary py-1.5 outline-none transition-colors placeholder:text-text-muted"
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
              <button className="font-display font-bold text-[12px] uppercase tracking-widest text-accent hover:underline">Save Plan</button>
            </div>
          </div>

          {/* Heat Map */}
          <div className="bg-bg-void border border-border-subtle rounded-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
              <h2 className="font-display font-semibold text-[13px] tracking-widest uppercase text-text-muted">Target Heat Map</h2>
              <div className="flex gap-1.5">
                <button className="bg-bg-surface border border-border-subtle px-2.5 py-1 rounded-md font-mono text-[11px] text-text-secondary hover:text-text-primary transition-colors">50Y</button>
                <button className="bg-accent text-bg-void px-2.5 py-1 rounded-md font-mono text-[11px] font-bold">100Y</button>
              </div>
            </div>
            <div className="relative min-h-[260px] flex items-center justify-center overflow-hidden bg-bg-surface">
              {/* Simulated radial heatmap */}
              <div className="absolute inset-0 flex items-center justify-center">
                {[80, 60, 44, 28, 14].map((size, i) => (
                  <div key={i} className="absolute rounded-full border border-border-subtle/40"
                    style={{ width: `${size}%`, height: `${size}%`, opacity: 0.6 - i * 0.08 }} />
                ))}
                <div className="absolute w-[60%] h-[60%] rounded-full"
                  style={{ background: 'radial-gradient(circle at 55% 50%, rgba(245,166,35,0.45) 0%, rgba(245,166,35,0.1) 40%, transparent 70%)' }}
                />
                <div className="absolute w-[20%] h-[20%] rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(255,77,109,0.7) 0%, rgba(245,166,35,0.3) 60%, transparent 100%)', transform: 'translate(10%, 0%)' }}
                />
              </div>
              {/* Overlay stats */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                <div className="bg-bg-void/90 backdrop-blur border border-border-subtle rounded-lg p-3">
                  <span className="block font-display font-semibold text-[10px] uppercase tracking-wider text-text-muted mb-1">Mean Radius</span>
                  <span className="font-mono font-bold text-text-primary">1.24 IN</span>
                </div>
                <div className="bg-bg-void/90 backdrop-blur border border-border-subtle rounded-lg p-3 text-right">
                  <span className="block font-display font-semibold text-[10px] uppercase tracking-wider text-text-muted mb-1">Total Shots</span>
                  <span className="font-mono font-bold text-text-primary">142</span>
                </div>
              </div>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}
