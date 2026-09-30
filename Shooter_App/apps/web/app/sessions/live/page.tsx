'use client';
// apps/web/app/sessions/live/page.tsx
// Live range session — real-time shot detection + MJPEG feed

import React, { useState, useCallback } from 'react';
import { useLiveRange, LiveShot } from '../../../hooks/useLiveRange';
import LiveFeedPanel from '../../../components/LiveFeedPanel';

const TARGET_TYPES = [
  { value: 'air_rifle_10m',    label: '10m Air Rifle' },
  { value: 'air_pistol_10m',   label: '10m Air Pistol' },
  { value: 'air_rifle_50m',    label: '50m Air Rifle' },
  { value: 'nr_50m',           label: '50m Rifle (NR)' },
  { value: 'nr_25m',           label: '25m Pistol (NR)' },
  { value: 'issf_300m_rifle',  label: '300m Rifle (ISSF)' },
  { value: 'nra_b8_25yd',      label: 'NRA B-8 25yd' },
  { value: 'airgun_multi_bull',label: 'Airgun Multi-Bull' },
  { value: 'field_target_ft',  label: 'Field Target (FT)' },
];

function scoreColor(score: number): string {
  if (score >= 10.0) return 'text-accent';
  if (score >= 9.0)  return 'text-[#00E5A0]';
  if (score >= 8.0)  return 'text-[#4FC3F7]';
  return 'text-[#FF4D6D]';
}

function scoreBg(score: number): string {
  if (score >= 10.0) return 'bg-accent/10 border-accent/30';
  if (score >= 9.0)  return 'bg-[#00E5A0]/10 border-[#00E5A0]/30';
  if (score >= 8.0)  return 'bg-[#4FC3F7]/10 border-[#4FC3F7]/30';
  return 'bg-[#FF4D6D]/10 border-[#FF4D6D]/30';
}

export default function LiveSessionPage() {
  const [rangeId, setRangeId] = useState('range-station-01');
  const [targetType, setTargetType] = useState('air_rifle_10m');
  const [sessionActive, setSessionActive] = useState(false);
  const [lastShot, setLastShot] = useState<LiveShot | null>(null);

  const handleShot = useCallback((shot: LiveShot) => {
    setLastShot(shot);
  }, []);

  const { shots, isConnected, connectionError, clearShots } = useLiveRange({
    rangeId,
    enabled: sessionActive,
    onShot: handleShot,
  });

  const runningTotal = shots.reduce((sum, s) => sum + s.score, 0);
  const avgScore = shots.length > 0 ? runningTotal / shots.length : 0;

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-text-primary font-bold tracking-wide mb-2">
            Live Range Session
          </h1>
          <p className="font-body text-[14px] text-text-secondary">
            Real-time scoring from range camera engine
          </p>
        </div>
        <div className="flex gap-3 shrink-0 flex-wrap">
          {sessionActive ? (
            <button
              onClick={() => setSessionActive(false)}
              className="px-5 py-3 bg-[#FF4D6D]/15 border border-[#FF4D6D]/40 text-[#FF4D6D] font-display font-bold text-[12px] uppercase tracking-widest rounded-xl hover:bg-[#FF4D6D]/25 transition-colors flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#FF4D6D] animate-pulse" />
              Stop Session
            </button>
          ) : (
            <button
              onClick={() => setSessionActive(true)}
              className="px-5 py-3 bg-accent text-bg-void font-display font-bold text-[12px] uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-bg-void" />
              Start Live Session
            </button>
          )}
          {shots.length > 0 && (
            <button
              onClick={clearShots}
              className="px-4 py-3 bg-bg-surface border border-border-subtle text-text-secondary font-display font-bold text-[12px] uppercase tracking-widest rounded-xl hover:border-accent/30 hover:text-text-primary transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Config bar */}
      <div className="flex flex-wrap gap-4 mb-8 p-5 bg-bg-surface border border-border-subtle rounded-xl">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <label className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted">Range ID</label>
          <input
            value={rangeId}
            onChange={(e) => setRangeId(e.target.value)}
            disabled={sessionActive}
            className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 font-mono text-[13px] text-text-primary focus:border-accent outline-none transition-colors disabled:opacity-50"
            placeholder="range-station-01"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-muted">Target Type</label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            disabled={sessionActive}
            className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 font-body text-[13px] text-text-primary focus:border-accent outline-none transition-colors disabled:opacity-50"
          >
            {TARGET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        {connectionError && (
          <div className="flex-1 flex items-center px-3 py-2 bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 rounded-lg">
            <span className="font-mono text-[12px] text-[#FF4D6D]">{connectionError}</span>
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Live Feed — 8 cols */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          <LiveFeedPanel
            shots={shots}
            isConnected={isConnected}
            className="aspect-video"
          />

          {/* Score Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Shots', value: shots.length.toString(), unit: '' },
              { label: 'Total', value: runningTotal.toFixed(1), unit: 'pts' },
              { label: 'Average', value: avgScore.toFixed(2), unit: '' },
              { label: 'Last Shot', value: lastShot ? lastShot.score.toFixed(1) : '—', unit: '', highlight: !!lastShot },
            ].map((stat) => (
              <div key={stat.label} className="bg-bg-void border border-border-subtle rounded-xl p-4 text-center">
                <span className="block font-display font-semibold text-[10px] uppercase tracking-widest text-text-muted mb-2">{stat.label}</span>
                <span className={`font-mono font-bold text-2xl ${stat.highlight && lastShot ? scoreColor(lastShot.score) : 'text-text-primary'}`}>
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className="font-display text-[11px] text-text-muted ml-1">{stat.unit}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Shot Log — 4 cols */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          <div className="bg-bg-void border border-border-subtle rounded-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
              <h2 className="font-display font-semibold text-[13px] uppercase tracking-widest text-text-muted">Shot Log</h2>
              <span className="font-mono text-[12px] text-text-muted">{shots.length} recorded</span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-border-subtle/50">
              {shots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                  </svg>
                  <span className="font-body text-[13px] text-text-muted">
                    {sessionActive ? 'Waiting for shots...' : 'Start session to record shots'}
                  </span>
                </div>
              ) : (
                [...shots].reverse().map((shot, i) => {
                  const shotNum = shots.length - i;
                  return (
                    <div key={`${shot.timestamp}-${i}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-surface transition-colors">
                      <span className="font-mono text-[11px] text-text-muted w-6 text-right shrink-0">
                        {shotNum}
                      </span>
                      <div className={`border font-mono font-bold text-[15px] px-2.5 py-0.5 rounded-lg shrink-0 ${scoreBg(shot.score)} ${scoreColor(shot.score)}`}>
                        {shot.score.toFixed(1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-3 font-mono text-[11px] text-text-muted">
                          <span>x: {shot.x.toFixed(2)}</span>
                          <span>y: {shot.y.toFixed(2)}</span>
                        </div>
                        <div className="font-mono text-[10px] text-text-muted mt-0.5">
                          {new Date(shot.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="font-mono text-[10px] text-text-muted shrink-0">
                        {(shot.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Engine setup hint */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5">
            <h3 className="font-display font-bold text-[13px] uppercase tracking-widest text-text-muted mb-3">Range Engine</h3>
            <p className="font-body text-[12px] text-text-secondary leading-relaxed mb-3">
              Run the standalone engine on your range hardware to stream live shots to this dashboard.
            </p>
            <div className="bg-bg-void border border-border-subtle rounded-lg p-3 font-mono text-[11px] text-[#00E5A0] space-y-1">
              <div># In engine/ directory:</div>
              <div>python start.py --range-id {rangeId}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
