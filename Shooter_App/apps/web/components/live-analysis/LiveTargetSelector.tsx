'use client';

import { TargetType, TARGET_SPECS } from '../../lib/target-specs';

interface LiveTargetSelectorProps {
  selectedTarget: TargetType;
  onChange: (type: TargetType) => void;
  isConnected: boolean;
}

export function LiveTargetSelector({ selectedTarget, onChange, isConnected }: LiveTargetSelectorProps) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 shadow-card flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <label className="block font-body text-xs text-text-secondary uppercase tracking-widest mb-1">
            Target Type
          </label>
          <select 
            value={selectedTarget}
            onChange={(e) => onChange(e.target.value as TargetType)}
            className="bg-bg-elevated border border-border-default focus:border-accent text-text-primary font-body text-sm px-3 py-2 rounded-lg outline-none cursor-pointer"
          >
            {Object.values(TARGET_SPECS).map(spec => (
              <option key={spec.id} value={spec.id}>
                {spec.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-elevated border border-border-subtle">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-data pulse-amber' : 'bg-signal-red'}`} />
          <span className="font-body text-xs font-medium text-text-secondary">
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  );
}
