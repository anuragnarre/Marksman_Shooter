// apps/web/app/ranges/page.tsx
'use client';

import React from 'react';

export default function RangesPage() {
  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-text-primary font-bold tracking-wide mb-3">
            Range Locations
          </h1>
          <p className="font-body text-[15px] text-text-secondary max-w-2xl leading-relaxed">
            Manage technical specifications and environmental data across multiple shooting facilities.
          </p>
        </div>
        <button className="bg-accent text-bg-void px-6 py-3.5 rounded-xl font-display font-bold text-[13px] tracking-wide flex items-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-sm shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          ADD RANGE
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        {/* Left Column: Range List */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          
          {/* Range Card 1 (Active) */}
          <div className="bg-bg-void border border-accent/40 rounded-xl p-6 shadow-sm cursor-pointer relative overflow-hidden group hover:border-accent transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
            <div className="flex justify-between items-start mb-5">
              <h3 className="font-display font-bold text-xl text-text-primary">West Valley Range</h3>
              <span className="bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-md font-display font-bold text-[11px] uppercase flex items-center gap-1.5 tracking-wider">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Active
              </span>
            </div>
            <div className="font-mono text-[13px] text-text-secondary grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="flex flex-col gap-1">
                <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted">Max Distance</span>
                <span className="text-text-primary">1000 yds</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted">Altitude</span>
                <span className="text-text-primary">4,520 ft</span>
              </div>
            </div>
          </div>

          {/* Range Card 2 */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 hover:border-border-strong transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-5">
              <h3 className="font-display font-bold text-xl text-text-secondary group-hover:text-text-primary transition-colors">Indoor 10m Lab</h3>
              <span className="bg-bg-void text-text-muted border border-border-subtle px-2.5 py-1 rounded-md font-display font-bold text-[11px] uppercase tracking-wider">
                Inactive
              </span>
            </div>
            <div className="font-mono text-[13px] text-text-muted grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="flex flex-col gap-1">
                <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-border-strong">Max Distance</span>
                <span>10m</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-border-strong">Altitude</span>
                <span>Sea Level</span>
              </div>
            </div>
          </div>

          {/* Range Card 3 */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 hover:border-border-strong transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-5">
              <h3 className="font-display font-bold text-xl text-text-secondary group-hover:text-text-primary transition-colors">Pine Ridge Field</h3>
            </div>
            <div className="font-mono text-[13px] text-text-muted grid grid-cols-2 gap-y-3 gap-x-4">
              <div className="flex flex-col gap-1">
                <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-border-strong">Max Distance</span>
                <span>600 yds</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-border-strong">Altitude</span>
                <span>2,100 ft</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Details & Technical Data */}
        <div className="xl:col-span-8 flex flex-col gap-6 md:gap-8">
          
          {/* Main Technical Dashboard */}
          <div className="bg-bg-void border border-border-subtle rounded-xl overflow-hidden shadow-sm">
            {/* Map Placeholder */}
            <div className="h-48 md:h-56 bg-bg-surface relative w-full border-b border-border-subtle overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-semibold text-[13px] tracking-widest uppercase text-text-muted">MAP VIEW PENDING...</span>
              </div>
              
              <div className="absolute bottom-4 left-4 bg-bg-void/80 backdrop-blur-md border border-border-subtle p-3 rounded-lg font-mono text-[13px] text-text-primary shadow-sm flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted">GPS Coordinates</span>
                </div>
                33°27'42.1"N 112°04'21.5"W
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-8 pb-5 border-b border-border-subtle">
                <h2 className="font-display font-bold text-2xl text-text-primary">Technical Specifications</h2>
                <button className="text-text-secondary hover:text-accent transition-colors flex items-center gap-1.5 font-display font-semibold text-[12px] uppercase tracking-wider bg-bg-surface px-4 py-2.5 rounded-lg border border-border-subtle hover:border-accent/40">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Specs
                </button>
              </div>

              {/* Technical Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="flex flex-col border-l-2 border-accent pl-4">
                  <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Elevation / Altitude</span>
                  <span className="font-mono text-text-primary text-xl">4,520 ft</span>
                </div>
                <div className="flex flex-col border-l-2 border-accent pl-4">
                  <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Typical Wind Dir.</span>
                  <span className="font-mono text-text-primary text-xl flex items-center gap-2">
                    NW (315°) 
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </span>
                </div>
                <div className="flex flex-col border-l-2 border-accent pl-4">
                  <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-1.5">Max Allowable Caliber</span>
                  <span className="font-mono text-text-primary text-xl">.30 Cal Air</span>
                </div>
              </div>

              {/* Environmental Log Section */}
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                  <h3 className="font-display font-semibold text-[13px] uppercase tracking-widest text-text-primary flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    Environmental Log History
                  </h3>
                  <span className="font-mono text-text-muted text-[13px] bg-bg-void px-3 py-1.5 rounded-md border border-border-subtle">Last 24h</span>
                </div>
                
                <div className="w-full overflow-x-auto hide-scrollbar">
                  <table className="w-full text-left font-mono min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border-subtle text-text-muted font-display font-semibold text-[11px] tracking-wider uppercase">
                        <th className="py-3 px-3">Time</th>
                        <th className="py-3 px-3">Temp (°F)</th>
                        <th className="py-3 px-3">Humidity</th>
                        <th className="py-3 px-3">Pressure (inHg)</th>
                        <th className="py-3 px-3">Wind (mph)</th>
                      </tr>
                    </thead>
                    <tbody className="text-text-primary text-[13px]">
                      {[
                        { t: '14:00', tm: '78.2', h: '32%', p: '29.84', w: '8.5 NW' },
                        { t: '13:00', tm: '76.5', h: '34%', p: '29.86', w: '7.2 NW' },
                        { t: '12:00', tm: '74.1', h: '38%', p: '29.88', w: '5.0 NNW' },
                        { t: '11:00', tm: '69.8', h: '45%', p: '29.91', w: '3.1 N' },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-border-subtle/40 hover:bg-bg-void transition-colors">
                          <td className="py-3.5 px-3">{row.t}</td>
                          <td className="py-3.5 px-3">{row.tm}</td>
                          <td className="py-3.5 px-3">{row.h}</td>
                          <td className="py-3.5 px-3">{row.p}</td>
                          <td className="py-3.5 px-3">{row.w}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
