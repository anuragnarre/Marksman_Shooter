'use client';

import { ShotResult } from '../../lib/target-specs';

interface RealTimeScoreboardProps {
  shots: ShotResult[];
}

export function RealTimeScoreboard({ shots }: RealTimeScoreboardProps) {
  const totalScore = shots.reduce((sum, s) => sum + s.score, 0);
  const innerTens = shots.filter(s => s.isInnerTen).length;
  const avgScore = shots.length > 0 ? (totalScore / shots.length) : 0;
  
  // Basic mock grouping size calculation (extreme spread approximation)
  // Note: in a real scenario we'd calculate the max distance between any two shot centers
  // Since we only have `distance` from center in ShotResult, we can't do extreme spread perfectly here
  // unless we pass in full coordinates. For this component, we'll just show average distance to center.
  const avgDistance = shots.length > 0 
    ? shots.reduce((sum, s) => sum + s.distance, 0) / shots.length 
    : 0;

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 shadow-card h-full flex flex-col">
      <h3 className="font-display text-xl font-bold text-text-primary tracking-wide mb-6 border-b border-border-subtle pb-4">
        Live Telemetry
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
        <div className="bg-bg-elevated rounded-lg p-4 flex flex-col justify-center items-center">
          <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-1">Total Score</p>
          <p className="font-mono text-4xl font-bold text-accent">{totalScore.toFixed(1)}</p>
        </div>
        
        <div className="bg-bg-elevated rounded-lg p-4 flex flex-col justify-center items-center">
          <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-1">Inner Tens</p>
          <p className="font-mono text-4xl font-bold text-data-blue">{innerTens}</p>
        </div>
        
        <div className="bg-bg-elevated rounded-lg p-4 flex flex-col justify-center items-center">
          <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-1">Avg Score</p>
          <p className="font-mono text-2xl font-bold text-text-primary">{avgScore.toFixed(2)}</p>
        </div>
        
        <div className="bg-bg-elevated rounded-lg p-4 flex flex-col justify-center items-center">
          <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-1">Avg Spread</p>
          <p className="font-mono text-2xl font-bold text-text-primary">
            {avgDistance.toFixed(1)}<span className="text-sm text-text-muted ml-1">mm</span>
          </p>
        </div>
      </div>

      <div>
        <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-3">Recent Shots</p>
        <div className="flex gap-2 flex-wrap">
          {shots.slice(-10).map((shot, i) => (
            <span 
              key={i} 
              className={`font-mono text-sm px-3 py-1 rounded border ${
                shot.score >= 10.5 ? 'bg-accent/15 text-accent border-accent/30' :
                shot.score >= 10.0 ? 'bg-data-blue/15 text-data-blue border-data-blue/30' :
                shot.score >= 9.0  ? 'bg-emerald-data/15 text-emerald-data border-emerald-data/30' :
                'bg-signal-red/15 text-signal-red border-signal-red/30'
              } animate-fade-up`}
            >
              {shot.score.toFixed(1)}
              {shot.isInnerTen ? '*' : ''}
            </span>
          ))}
          {shots.length === 0 && (
            <span className="text-text-muted font-body text-sm italic">Waiting for shots...</span>
          )}
        </div>
      </div>
    </div>
  );
}
