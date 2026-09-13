// apps/web/app/ballistics/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { AppShell } from '../../components/AppShell';
import { apiFetch } from '../../lib/api';
import { useToast } from '../../contexts/toast-context';

interface TrajectoryRow { range: number; drop: number; vel: number; ke: number; }

const DEFAULT_PROFILE = {
  muzzleVelocityFps: 890,
  pelletWeightGrains: 18.1,
  ballisticCoef: 0.033,
  sightHeightInches: 1.8,
  zeroRangeYards: 50,
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-text-muted mb-1 font-display uppercase tracking-widest text-[10px]">{label}y</p>
      {payload.map((e: any) => (
        <div key={e.name} className="flex items-center justify-between gap-4">
          <span className="text-text-secondary">{e.name}</span>
          <span className="font-mono font-bold" style={{ color: e.color }}>{Number(e.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export default function BallisticsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [trajectory, setTrajectory] = useState<TrajectoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'drop' | 'velocity'>('drop');

  const handleChange = (key: string, value: string) => {
    setProfile(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch<{ trajectory: TrajectoryRow[] }>('/ballistics/calculate', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
      setTrajectory(result.trajectory);
      toast?.('Trajectory calculated successfully!', 'success');
    } catch {
      toast?.('Calculation failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const fields = [
    { key: 'muzzleVelocityFps', label: 'Muzzle Velocity (FPS)', step: '1' },
    { key: 'pelletWeightGrains', label: 'Pellet Weight (Grains)', step: '0.1' },
    { key: 'ballisticCoef', label: 'Ballistic Coefficient (G1)', step: '0.001' },
    { key: 'sightHeightInches', label: 'Sight Height (Inches)', step: '0.1' },
    { key: 'zeroRangeYards', label: 'Zero Range (Yards)', step: '1' },
  ];

  const chartData = trajectory.length > 0 ? trajectory : [
    { range: 0, drop: 0.0 }, { range: 10, drop: 0.2 }, { range: 25, drop: 0.8 },
    { range: 50, drop: 0 }, { range: 75, drop: -2.1 }, { range: 100, drop: -6.4 },
  ];

  return (
    <AppShell title="Ballistics">
      <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 overflow-y-auto">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl md:text-4xl text-text-primary font-bold tracking-wide mb-3">
            Technical Ballistics Laboratory
          </h1>
          <p className="font-body text-[15px] text-text-secondary max-w-2xl leading-relaxed">
            Precision modeling for field and benchrest disciplines. Input parameters below to generate live trajectory analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column: Input Controls */}
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

              <div className="space-y-4">
                {fields.map(({ key, label, step }) => (
                  <div key={key}>
                    <label className="block font-display text-[11px] uppercase tracking-wider text-text-muted mb-1.5">{label}</label>
                    <input
                      className="w-full bg-bg-void border border-border-subtle focus:border-accent text-text-primary font-mono text-sm px-3 py-2.5 rounded-lg outline-none transition-colors"
                      type="number"
                      step={step}
                      value={(profile as any)[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                  </div>
                ))}

                <div className="pt-5">
                  <button
                    className="w-full bg-accent text-bg-void font-display font-bold text-[13px] tracking-wide py-3.5 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                    type="button"
                    onClick={calculate}
                    disabled={loading}
                  >
                    {loading ? (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    )}
                    {loading ? 'CALCULATING...' : 'CALCULATE TRAJECTORY'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Analytics */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            {/* Main Graph Area */}
            <div className="bg-bg-void border border-border-subtle rounded-xl p-5 shadow-sm flex flex-col min-h-[400px]">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6 border-b border-border-subtle pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('drop')}
                    className={`px-3 py-1.5 text-[11px] font-display font-bold rounded-md transition-colors ${activeTab === 'drop' ? 'bg-accent text-bg-void' : 'bg-bg-surface text-text-secondary border border-border-subtle hover:text-text-primary'}`}
                  >DROP (IN)</button>
                  <button
                    onClick={() => setActiveTab('velocity')}
                    className={`px-3 py-1.5 text-[11px] font-display font-bold rounded-md transition-colors ${activeTab === 'velocity' ? 'bg-accent text-bg-void' : 'bg-bg-surface text-text-secondary border border-border-subtle hover:text-text-primary'}`}
                  >VELOCITY (FPS)</button>
                </div>
                {trajectory.length === 0 && (
                  <span className="text-text-muted font-display text-[11px] uppercase tracking-wider">Click Calculate to generate live data</span>
                )}
              </div>

              <div className="flex-grow w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="range" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono' }} tickFormatter={(v) => `${v}y`} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey={activeTab === 'drop' ? 'drop' : 'vel'} name={activeTab === 'drop' ? 'Drop (in)' : 'Velocity (fps)'} stroke="#F5A623" strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data Table */}
            {trajectory.length > 0 && (
              <div className="bg-bg-void border border-border-subtle rounded-xl overflow-hidden shadow-sm">
                <div className="flex border-b border-border-subtle bg-bg-surface px-6 py-3">
                  <span className="font-display font-bold text-[12px] tracking-widest text-accent uppercase">Trajectory Table</span>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-bg-surface border-b border-border-subtle font-display text-[11px] tracking-wider text-text-muted uppercase">
                        <th className="p-3.5 pl-6 font-semibold">Range (Yds)</th>
                        <th className="p-3.5 font-semibold">Drop (In)</th>
                        <th className="p-3.5 font-semibold">Velocity (FPS)</th>
                        <th className="p-3.5 pr-6 font-semibold">Energy (Ft-Lbs)</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[13px] text-text-primary">
                      {trajectory.map((row) => (
                        <tr key={row.range} className={`border-b border-border-subtle hover:bg-bg-surface transition-colors ${row.range === profile.zeroRangeYards ? 'bg-accent/5' : ''}`}>
                          <td className={`p-3.5 pl-6 ${row.range === profile.zeroRangeYards ? 'font-bold text-accent' : ''}`}>{row.range === profile.zeroRangeYards ? `${row.range} (Zero)` : row.range}</td>
                          <td className="p-3.5">{row.drop > 0 ? '+' : ''}{row.drop}</td>
                          <td className="p-3.5">{row.vel}</td>
                          <td className="p-3.5 pr-6 text-text-secondary">{row.ke}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Summary Metrics */}
            {trajectory.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                {[
                  { label: 'Terminal Energy @ Zero', val: trajectory.find(r => r.range === profile.zeroRangeYards)?.ke.toFixed(1) ?? '—', unit: 'Ft-Lbs' },
                  { label: 'Velocity @ Zero', val: trajectory.find(r => r.range === profile.zeroRangeYards)?.vel ?? '—', unit: 'FPS' },
                  { label: 'Total Drop @ 100y', val: trajectory.find(r => r.range === 100)?.drop.toFixed(2) ?? '—', unit: 'Inches', color: 'text-accent' },
                ].map((metric, idx) => (
                  <div key={idx} className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex flex-col justify-between">
                    <span className="font-display text-[11px] uppercase tracking-wider text-text-muted mb-2">{metric.label}</span>
                    <div className={`font-mono text-3xl font-semibold ${metric.color || 'text-text-primary'}`}>
                      {metric.val} <span className="text-[13px] text-text-muted">{metric.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
