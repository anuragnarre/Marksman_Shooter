// apps/web/app/ballistics/page.tsx
'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';

// Dummy data for trajectory
const trajectoryData = [
  { range: 0, drop: 40 },
  { range: 25, drop: 22 },
  { range: 50, drop: 20 },
  { range: 75, drop: 45 },
  { range: 100, drop: 85 },
];

export default function BallisticsPage() {
  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 overflow-y-auto">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="font-display text-3xl md:text-4xl text-text-primary font-bold tracking-wide mb-3">
          Technical Ballistics Laboratory
        </h1>
        <p className="font-body text-[15px] text-text-secondary max-w-2xl leading-relaxed">
          Precision modeling for field and benchrest disciplines. Input your variable parameters below to generate highly accurate trajectory analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Input Controls (4 Columns on XL) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5 border-b border-border-subtle pb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h2 className="font-display font-semibold text-[13px] tracking-widest uppercase text-text-primary">
                BALLISTIC VARIABLES
              </h2>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Muzzle Velocity (FPS)</label>
                <input className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors" type="number" defaultValue="890" />
              </div>
              <div>
                <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Pellet Weight (Grains)</label>
                <input className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors" step="0.1" type="number" defaultValue="18.1" />
              </div>
              <div>
                <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Ballistic Coefficient (G1)</label>
                <input className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors" step="0.001" type="number" defaultValue="0.033" />
              </div>
              <div>
                <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Sight Height (Inches)</label>
                <input className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors" step="0.1" type="number" defaultValue="1.8" />
              </div>
              <div>
                <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Zero Range (Yards)</label>
                <input className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors" type="number" defaultValue="50" />
              </div>

              {/* Wind Group */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border-subtle mt-2">
                <div>
                  <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Wind (MPH)</label>
                  <input className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors" type="number" defaultValue="5" />
                </div>
                <div>
                  <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Angle (Deg)</label>
                  <input className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors" type="number" defaultValue="90" />
                </div>
              </div>

              <div className="pt-5">
                <button 
                  className="w-full bg-accent text-bg-void font-display font-bold text-[13px] tracking-wide py-3.5 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                    <line x1="9" y1="1" x2="9" y2="4"></line>
                    <line x1="15" y1="1" x2="15" y2="4"></line>
                    <line x1="9" y1="20" x2="9" y2="23"></line>
                    <line x1="15" y1="20" x2="15" y2="23"></line>
                    <line x1="20" y1="9" x2="23" y2="9"></line>
                    <line x1="20" y1="14" x2="23" y2="14"></line>
                    <line x1="1" y1="9" x2="4" y2="9"></line>
                    <line x1="1" y1="14" x2="4" y2="14"></line>
                  </svg>
                  CALCULATE TRAJECTORY
                </button>
              </div>
            </form>
          </div>

          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-sm">
            <h3 className="font-display font-semibold text-[13px] tracking-widest uppercase text-text-primary mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
              MEDIA & DEVICE
            </h3>
            <div className="flex flex-col gap-3">
              <button className="w-full flex items-center justify-between px-4 py-3 bg-bg-void border border-border-subtle rounded-lg hover:border-accent transition-colors group">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline>
                  </svg>
                  <span className="font-display text-[12px] uppercase tracking-wider text-text-primary group-hover:text-accent transition-colors">Connect Device</span>
                </div>
                <span className="text-[11px] font-mono text-text-muted group-hover:text-text-primary">OFFLINE</span>
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center justify-center py-3 bg-bg-void border border-border-subtle rounded-lg hover:border-accent transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary mb-1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  <span className="text-[10px] font-display uppercase tracking-wider text-text-secondary">Capture</span>
                </button>
                <button className="flex flex-col items-center justify-center py-3 bg-bg-void border border-border-subtle rounded-lg hover:border-accent transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary mb-1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span className="text-[10px] font-display uppercase tracking-wider text-text-secondary">Gallery</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Analytics (8 Columns on XL) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Main Graph Area */}
          <div className="bg-bg-void border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col min-h-[400px]">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-accent text-bg-void text-[11px] font-display font-bold rounded-md transition-colors">DROP (IN)</button>
                <button className="px-3 py-1.5 bg-bg-surface text-text-secondary text-[11px] font-display font-bold rounded-md border border-border-subtle hover:text-text-primary transition-colors">MIL</button>
                <button className="px-3 py-1.5 bg-bg-surface text-text-secondary text-[11px] font-display font-bold rounded-md border border-border-subtle hover:text-text-primary transition-colors">MOA</button>
              </div>
            </div>
            
            <div className="flex-grow w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trajectoryData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDrop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="range" 
                    stroke="var(--text-muted)" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono' }} 
                    tickFormatter={(val) => `${val}y`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    reversed={true} 
                    stroke="var(--text-muted)" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <ReferenceLine y={20} stroke="var(--text-muted)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="drop" stroke="#F5A623" strokeWidth={2} fillOpacity={1} fill="url(#colorDrop)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Data Panels */}
          <div className="bg-bg-void border border-border-subtle rounded-xl overflow-hidden shadow-sm">
            <div className="flex border-b border-border-subtle bg-bg-surface overflow-x-auto hide-scrollbar">
              <button className="px-6 py-3 font-display font-bold text-[12px] tracking-widest text-accent border-b-2 border-accent bg-bg-void whitespace-nowrap">RETICLE HOLDOVER</button>
              <button className="px-6 py-3 font-display font-bold text-[12px] tracking-widest text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap">WINDAGE TABLE</button>
            </div>
            
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-bg-surface border-b border-border-subtle font-display text-[11px] tracking-wider text-text-muted uppercase">
                    <th className="p-3.5 pl-6 font-semibold">Range (Yds)</th>
                    <th className="p-3.5 font-semibold">Drop (In)</th>
                    <th className="p-3.5 font-semibold">Hold (MIL)</th>
                    <th className="p-3.5 font-semibold">Wind 5mph (In)</th>
                    <th className="p-3.5 font-semibold">Wind Hold (MIL)</th>
                    <th className="p-3.5 pr-6 font-semibold">Vel (FPS)</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[13px] text-text-primary">
                  {[
                    { r: 10, d: '-1.20', h: 'UP 3.33', w: '0.10', wh: 'L 0.28', v: 872 },
                    { r: 25, d: '+0.35', h: 'DN 0.39', w: '0.45', wh: 'L 0.50', v: 845 },
                    { r: '50 (Zero)', d: '0.00', h: '0.00', w: '1.85', wh: 'L 1.03', v: 802, highlight: true },
                    { r: 75, d: '-4.15', h: 'UP 1.54', w: '4.20', wh: 'L 1.56', v: 760 },
                    { r: 100, d: '-12.80', h: 'UP 3.56', w: '7.55', wh: 'L 2.10', v: 720 },
                  ].map((row, idx) => (
                    <tr key={idx} className={`border-b border-border-subtle hover:bg-bg-surface transition-colors ${row.highlight ? 'bg-accent/5' : ''}`}>
                      <td className={`p-3.5 pl-6 ${row.highlight ? 'font-bold text-accent' : ''}`}>{row.r}</td>
                      <td className="p-3.5">{row.d}</td>
                      <td className={`p-3.5 ${row.highlight ? 'font-bold' : ''}`}>{row.h}</td>
                      <td className="p-3.5">{row.w}</td>
                      <td className="p-3.5">{row.wh}</td>
                      <td className="p-3.5 text-text-secondary pr-6">{row.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            {[
              { label: 'Terminal Energy @ 50y', val: '25.8', unit: 'Ft-Lbs' },
              { label: 'Velocity @ 50y', val: '802', unit: 'FPS' },
              { label: 'Total Drop @ 100y', val: '12.8', unit: 'Inches', color: 'text-accent' },
            ].map((metric, idx) => (
              <div key={idx} className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex flex-col justify-between">
                <span className="font-display text-[11px] uppercase tracking-wider text-text-muted mb-2">{metric.label}</span>
                <div className={`font-mono text-3xl font-semibold ${metric.color || 'text-text-primary'}`}>
                  {metric.val} <span className="text-[13px] text-text-muted">{metric.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
