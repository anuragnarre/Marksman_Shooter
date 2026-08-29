// apps/web/app/performance/competitions/page.tsx
'use client';

import React, { useState } from 'react';

const RANKINGS = [
  { rank: '#1', name: 'E. Varga', score: '632.4', xCount: '58x', avgVel: '592 fps', isTop: true },
  { rank: '#2', name: 'S. Lindholm', score: '631.8', xCount: '55x', avgVel: '590 fps', isTop: false },
  { rank: '#3', name: 'J. Doe', score: '629.1', xCount: '51x', avgVel: '595 fps', isTop: false },
  { rank: '#4', name: 'K. Patel', score: '627.5', xCount: '49x', avgVel: '588 fps', isTop: false },
  { rank: '#5', name: 'A. Müller', score: '624.8', xCount: '46x', avgVel: '591 fps', isTop: false },
];

const DISCIPLINES = ['10m Olympic', '25m Benchrest', 'Field Target'];

export default function CompetitionsPage() {
  const [activeDiscipline, setActiveDiscipline] = useState('10m Olympic');

  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 overflow-y-auto">
      {/* Header */}
      <header className="mb-10">
        <h1 className="font-display text-3xl md:text-4xl text-text-primary font-bold tracking-wide mb-3">
          Network &amp; Rankings
        </h1>
        <p className="font-body text-[15px] text-text-secondary max-w-2xl leading-relaxed">
          Global performance data and local club affiliations. Calibrated for technical accuracy.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-start">

        {/* Left: Rankings + Challenge — 8 cols */}
        <div className="xl:col-span-8 flex flex-col gap-8">

          {/* Global Rankings */}
          <section>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h2 className="font-display font-bold text-2xl text-text-primary">Global Rankings</h2>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {DISCIPLINES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setActiveDiscipline(d)}
                    className={`px-4 py-2.5 font-display font-bold text-[12px] uppercase tracking-widest rounded-xl border transition-all whitespace-nowrap ${
                      activeDiscipline === d
                        ? 'bg-accent text-bg-void border-accent'
                        : 'bg-bg-surface text-text-secondary border-border-subtle hover:border-accent/40 hover:text-text-primary'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-bg-void border border-border-subtle rounded-xl overflow-hidden shadow-sm">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-border-subtle bg-bg-surface font-display font-semibold text-[11px] tracking-widest uppercase text-text-muted">
                <div className="col-span-1 text-center">Rnk</div>
                <div className="col-span-4">Shooter</div>
                <div className="col-span-3 text-right">Score</div>
                <div className="col-span-2 text-right">X-Count</div>
                <div className="col-span-2 text-right">Avg Vel</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border-subtle/50">
                {RANKINGS.map((row) => (
                  <div
                    key={row.rank}
                    className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-bg-surface transition-colors cursor-default ${row.isTop ? 'bg-accent/[0.03]' : ''}`}
                  >
                    <div className={`col-span-1 text-center font-mono font-bold ${row.isTop ? 'text-accent' : 'text-text-secondary'}`}>
                      {row.rank}
                    </div>
                    <div className="col-span-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 font-display font-bold text-[12px] ${row.isTop ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border-subtle bg-bg-surface text-text-muted'}`}>
                        {row.name.charAt(0)}
                      </div>
                      <span className="font-body text-[14px] text-text-primary truncate">{row.name}</span>
                    </div>
                    <div className={`col-span-3 text-right font-mono font-bold ${row.isTop ? 'text-accent' : 'text-text-primary'}`}>{row.score}</div>
                    <div className="col-span-2 text-right font-mono text-[13px] text-text-secondary">{row.xCount}</div>
                    <div className="col-span-2 text-right font-mono text-[13px] text-text-secondary">{row.avgVel}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Challenge of the Month */}
          <section
            className="relative overflow-hidden rounded-xl p-6 md:p-8 border-l-4 border-accent flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
            style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.02) 100%)', border: '1px solid rgba(245,166,35,0.2)', borderLeftWidth: '4px' }}
          >
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.2) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
            />
            <div className="space-y-3 flex-1 relative z-10">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                </svg>
                <span className="font-display font-bold text-[11px] uppercase tracking-widest text-accent">Active Challenge</span>
              </div>
              <h2 className="font-display font-bold text-2xl text-text-primary">Micro-Grouping Directive</h2>
              <p className="font-body text-[14px] text-text-secondary leading-relaxed max-w-md">
                Achieve the smallest 5-shot group at 50 yards. Submit your electronic target data to qualify.
              </p>
              <div className="flex gap-3 font-mono text-[12px] pt-1">
                <span className="bg-bg-void/50 border border-border-subtle px-3 py-1.5 rounded-lg text-text-secondary">
                  Target: <span className="text-text-primary">50y</span>
                </span>
                <span className="bg-bg-void/50 border border-border-subtle px-3 py-1.5 rounded-lg text-text-secondary">
                  Shots: <span className="text-text-primary">5</span>
                </span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center justify-center p-5 bg-bg-void border border-accent/30 rounded-xl relative z-10">
              <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-1">Current Best</span>
              <span className="font-mono text-3xl font-bold text-text-primary">0.18"</span>
              <span className="font-display font-bold text-[11px] uppercase tracking-widest text-accent mt-1">E. Varga</span>
            </div>
          </section>
        </div>

        {/* Right: Club + Activity Feed — 4 cols */}
        <div className="xl:col-span-4 flex flex-col gap-6">

          {/* Club Affiliation */}
          <section className="bg-bg-void border border-border-subtle rounded-xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-xl text-text-primary mb-5 border-b border-border-subtle pb-4">
              Local Affiliation
            </h3>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-bg-surface rounded-xl flex items-center justify-center border border-border-subtle shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-text-muted">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <h4 className="font-display font-bold text-[16px] text-text-primary">Metro Precision Club</h4>
                <p className="font-mono text-[12px] text-text-muted uppercase tracking-wider mt-1">Member ID: 884-X9</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-bg-surface border border-border-subtle p-3 rounded-xl text-center">
                <span className="block font-mono font-bold text-xl text-text-primary mb-1">12</span>
                <span className="block font-display font-semibold text-[10px] uppercase tracking-widest text-text-muted">Active Members</span>
              </div>
              <div className="bg-bg-surface border border-border-subtle p-3 rounded-xl text-center">
                <span className="block font-mono font-bold text-xl text-accent mb-1">4th</span>
                <span className="block font-display font-semibold text-[10px] uppercase tracking-widest text-text-muted">Regional Rank</span>
              </div>
            </div>
            <button className="w-full py-2.5 border border-border-subtle text-text-secondary font-display font-bold text-[12px] uppercase tracking-widest rounded-xl hover:border-accent/40 hover:text-text-primary transition-colors">
              View Club Roster
            </button>
          </section>

          {/* Activity Feed */}
          <section className="bg-bg-void border border-border-subtle rounded-xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-xl text-text-primary mb-5 border-b border-border-subtle pb-4">
              Network Activity
            </h3>
            <div className="space-y-6">
              {[
                {
                  initial: 'M',
                  name: 'M. Rossi',
                  action: 'recorded a new personal best in',
                  detail: '25m Benchrest',
                  result: 'Score: 248-12x',
                  badge: 'PB',
                  badgeColor: 'text-accent bg-accent/10',
                  time: '2 hours ago',
                },
                {
                  initial: '🏆',
                  name: 'Metro Precision Club',
                  action: 'advanced to Rank #4 Regionally.',
                  detail: null,
                  result: null,
                  badge: null,
                  badgeColor: '',
                  time: '5 hours ago',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-bg-surface border border-border-subtle flex-shrink-0 flex items-center justify-center font-display font-bold text-[14px] text-text-secondary">
                    {item.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[14px] text-text-primary leading-relaxed">
                      <span className="font-semibold">{item.name}</span>{' '}
                      {item.action}{' '}
                      {item.detail && <span className="font-mono text-text-secondary">{item.detail}</span>}.
                    </p>
                    {item.result && (
                      <div className="mt-2 px-3 py-2 bg-bg-surface border border-border-subtle rounded-lg flex justify-between items-center">
                        <span className="font-mono text-[13px] text-text-primary">{item.result}</span>
                        {item.badge && (
                          <span className={`font-display font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded-md ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="font-display font-semibold text-[10px] uppercase tracking-wider text-text-muted mt-2 block">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
