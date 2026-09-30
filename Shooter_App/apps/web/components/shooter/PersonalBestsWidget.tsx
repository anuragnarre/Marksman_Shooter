import React from "react";
import { GlassCard } from "../ui/Card";
import { Award, Target, TrendingUp } from "lucide-react";

export function PersonalBestsWidget() {
  return (
    <GlassCard className="p-6 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--emerald-signal)] opacity-10 blur-3xl group-hover:opacity-20 transition-opacity" />
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <Award className="text-[var(--emerald-signal)]" /> 
          Personal Bests
        </h3>
        <span className="text-xs font-semibold text-[var(--emerald-signal)] bg-[rgba(0,229,160,0.1)] px-3 py-1 rounded-full">
          Top 5% Regionally
        </span>
      </div>

      <div className="space-y-4">
        {/* Record 1 */}
        <div className="flex items-center justify-between bg-[var(--bg-void)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">10m Air Rifle</p>
            <h4 className="text-2xl font-bold text-white font-data tracking-tight">631.5</h4>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)] mb-2 flex items-center justify-end gap-1">
              <TrendingUp size={12} className="text-[var(--emerald-signal)]" /> +1.2 pts
            </p>
            <div className="h-1.5 w-24 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--emerald-signal)] rounded-full" style={{ width: '92%' }} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">92% to next rank</p>
          </div>
        </div>

        {/* Record 2 */}
        <div className="flex items-center justify-between bg-[var(--bg-void)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">50m 3 Positions</p>
            <h4 className="text-2xl font-bold text-white font-data tracking-tight">585.0</h4>
          </div>
          <div className="text-right">
            <p className="text-xs text-[var(--text-muted)] mb-2 flex items-center justify-end gap-1">
              <Target size={12} className="text-[var(--accent-primary)]" /> PB Maintained
            </p>
            <div className="h-1.5 w-24 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: '75%' }} />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">75% to next rank</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
