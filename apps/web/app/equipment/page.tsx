// apps/web/app/equipment/page.tsx
'use client';

import React from 'react';

interface FirearmSpec {
  id: string;
  name: string;
  caliber: string;
  status: 'Active' | 'Storage';
  statusColor: string;
  roundCount: string;
  regPressure: string;
  lastCleaned: string;
  nextService: string;
  barrelLife: number;
  barrelLifeColor: string;
}

const FIREARMS: FirearmSpec[] = [
  {
    id: 'FX-9021',
    name: 'FX Impact M3 Sniper',
    caliber: '.22 Caliber',
    status: 'Active',
    statusColor: 'text-accent bg-accent/10 border-accent/20',
    roundCount: '4,520',
    regPressure: '135 BAR',
    lastCleaned: '2023-10-15',
    nextService: 'In 480 rds',
    barrelLife: 45,
    barrelLifeColor: 'bg-accent',
  },
  {
    id: 'DW-4432',
    name: 'Daystate Red Wolf',
    caliber: '.25 Caliber',
    status: 'Storage',
    statusColor: 'text-text-muted bg-bg-void border-border-subtle',
    roundCount: '1,200',
    regPressure: 'Elec.',
    lastCleaned: '2023-08-01',
    nextService: 'In 3,800 rds',
    barrelLife: 12,
    barrelLifeColor: 'bg-text-muted',
  },
];

function BarrelLifeBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted mb-2">
        <span>Barrel Life</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-bg-void border border-border-subtle h-2 rounded-full overflow-hidden">
        <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function EquipmentPage() {
  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 overflow-y-auto">
      {/* Page Header */}
      <header className="mb-10">
        <h1 className="font-display text-3xl md:text-4xl text-text-primary font-bold tracking-wide mb-3">
          Equipment Inventory
        </h1>
        <p className="font-body text-[15px] text-text-secondary leading-relaxed">
          Manage firearms, optics, ammunition performance, and maintenance logs.
        </p>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">

        {/* ── Left: Rifle Vault (8 cols) ── */}
        <section className="xl:col-span-8 flex flex-col gap-6">
          <div className="flex flex-wrap justify-between items-center border-b border-border-subtle pb-4 gap-4">
            <h2 className="font-display font-bold text-2xl text-text-primary">Rifle Vault</h2>
            <button className="bg-accent text-bg-void font-display font-bold text-[12px] tracking-widest uppercase px-5 py-2.5 rounded-lg flex items-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Firearm
            </button>
          </div>

          {FIREARMS.map((rifle) => (
            <div key={rifle.id} className="bg-bg-void border border-border-subtle rounded-xl p-6 shadow-sm hover:border-border-strong transition-colors">
              <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-text-primary mb-2">{rifle.name}</h3>
                  <span className="bg-bg-surface border border-border-subtle text-text-muted font-display font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full">
                    {rifle.caliber}
                  </span>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-mono text-[12px] text-text-muted">ID: {rifle.id}</span>
                  <span className={`font-display font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border ${rifle.statusColor}`}>
                    {rifle.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Round Count', val: rifle.roundCount },
                  { label: 'Regulator Pressure', val: rifle.regPressure },
                  { label: 'Last Cleaned', val: rifle.lastCleaned },
                  { label: 'Next Service', val: rifle.nextService },
                ].map(({ label, val }) => (
                  <div key={label} className="border-l-2 border-accent/30 pl-3">
                    <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted block mb-1.5">{label}</span>
                    <span className="font-mono text-[13px] text-text-primary">{val}</span>
                  </div>
                ))}
              </div>

              <BarrelLifeBar pct={rifle.barrelLife} color={rifle.barrelLifeColor} />
            </div>
          ))}
        </section>

        {/* ── Right: Optics + Ammo (4 cols) ── */}
        <section className="xl:col-span-4 flex flex-col gap-6">

          {/* Optics Profile */}
          <div className="bg-bg-void border border-border-subtle rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-5">
              <h2 className="font-display font-bold text-xl text-text-primary">Optics Profile</h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div className="mb-5">
              <h4 className="font-display font-bold text-[15px] text-text-primary mb-1">Element Nexus Gen II</h4>
              <p className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted">5-25x50 FFP | APR-2D MRAD</p>
            </div>
            <table className="w-full text-left font-mono text-[13px] border-collapse">
              <tbody>
                {[
                  { label: 'Zero Dist.', val: '50 yds' },
                  { label: 'Zero Cond.', val: '72°F / 29.92 inHg' },
                  { label: 'Click Value', val: '0.1 MRAD' },
                  { label: 'Mount Ht.', val: '1.93 in' },
                ].map(({ label, val }, i, arr) => (
                  <tr key={label} className={i < arr.length - 1 ? 'border-b border-border-subtle' : ''}>
                    <td className="py-3 font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted">{label}</td>
                    <td className="py-3 text-right text-text-primary">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ammo Performance */}
          <div className="bg-bg-void border border-border-subtle rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-border-subtle pb-4 mb-5">
              <h2 className="font-display font-bold text-xl text-text-primary">Ammo Data</h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { name: 'JSB Exact Jumbo', grains: '18.13gr', avgV: '890 fps', sd: '2.4' },
                { name: 'NSA Slugs', grains: '20.2gr', avgV: '940 fps', sd: '3.1' },
              ].map((ammo) => (
                <div key={ammo.name} className="border border-border-subtle rounded-xl p-4 hover:border-accent/30 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-display font-bold text-[14px] text-text-primary">{ammo.name}</span>
                    <span className="font-display font-bold text-[11px] uppercase tracking-wider bg-bg-surface border border-border-subtle text-text-muted px-2.5 py-1 rounded-md">
                      {ammo.grains}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-[13px]">
                    <span className="text-text-muted">
                      Avg V: <span className="text-text-primary">{ammo.avgV}</span>
                    </span>
                    <span className="text-text-muted">
                      SD: <span className="text-text-primary">{ammo.sd}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Log CTA */}
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <p className="font-display font-bold text-[13px] text-text-primary">Maintenance Due</p>
                <p className="font-body text-[12px] text-text-secondary">FX Impact M3 — 480 rounds to next service</p>
              </div>
            </div>
            <button className="w-full font-display font-bold text-[12px] uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 hover:bg-accent/20 py-2.5 rounded-lg transition-colors">
              Log Maintenance
            </button>
          </div>

        </section>
      </div>
    </div>
  );
}
