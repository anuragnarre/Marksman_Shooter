// apps/web/app/soldier/weapons/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/api';
import { AppShell } from '../../../components/AppShell';
import { SkeletonCard } from '../../../components/ui/SkeletonCard';
import type { WeaponPerformance } from '@shooting-platform/shared-types';

function weaponBadge(avg: number): { label: string; color: string } {
  if (avg >= 9.5) return { label: 'Elite',        color: '#F5A623' };
  if (avg >= 8.5) return { label: 'Competitive',  color: '#4FC3F7' };
  return               { label: 'Developing',    color: '#00E5A0' };
}

// Simple radial score ring rendered as SVG
function ScoreRing({ value, max = 11, size = 80 }: { value: number; max?: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E2433" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#F5A623" strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: 'drop-shadow(0 0 4px rgba(245,166,35,0.5))', transition: 'stroke-dashoffset 600ms ease' }}
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        className="font-display font-bold" fill="#F0F4FF" fontSize="14">
        {value.toFixed(1)}
      </text>
    </svg>
  );
}

function WeaponCard({ wp, delay }: { wp: WeaponPerformance; delay: number }) {
  const badge = weaponBadge(wp.averageScore);
  return (
    <div
      className="card p-5 animate-slide-up hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <ScoreRing value={wp.averageScore} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-sm text-[#F0F4FF] truncate">{wp.weaponType}</h3>
            <span
              className="text-[10px] font-display uppercase tracking-wide px-2 py-0.5 rounded"
              style={{ color: badge.color, backgroundColor: `${badge.color}18` }}
            >
              {badge.label}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <div>
              <p className="label">Sessions</p>
              <p className="score-value text-[#F0F4FF] font-bold text-lg">{wp.sessions}</p>
            </div>
            <div>
              <p className="label">Best</p>
              <p className="score-value text-accent font-bold text-lg">{wp.bestScore.toFixed(1)}</p>
            </div>
            <div>
              <p className="label">Shots</p>
              <p className="score-value text-[#F0F4FF] font-bold text-lg">{wp.totalShots}</p>
            </div>
          </div>

          {wp.groupRadius > 0 && (
            <div className="mt-3 pt-3 border-t border-[#1E2433]">
              <div className="flex items-center justify-between">
                <span className="label">Avg Group Radius</span>
                <span className="score-value text-xs text-[#4FC3F7]">{wp.groupRadius.toFixed(2)}</span>
              </div>
              <div className="mt-1 h-1 bg-[#1E2433] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4FC3F7]"
                  style={{ width: `${Math.min((wp.groupRadius / 10) * 100, 100)}%`, transition: 'width 600ms ease' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WeaponsPage() {
  const [weapons, setWeapons] = useState<WeaponPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    apiFetch<WeaponPerformance[]>('/analytics/weapons/summary')
      .then(setWeapons)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Weapons">
      <div className="space-y-6">

        <div className="animate-slide-up">
          <h1 className="font-display font-bold text-2xl text-[#F0F4FF]">Weapon Performance</h1>
          <p className="text-[#4A5568] text-sm mt-1">
            Performance breakdown by weapon type across all training sessions.
          </p>
        </div>

        {error && (
          <div role="alert" className="px-4 py-3 bg-[rgba(255,77,109,0.08)] border border-[rgba(255,77,109,0.3)] rounded-lg text-[#FF4D6D] text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} height={140} animationDelay={i * 60} />)}
          </div>
        ) : weapons.length === 0 ? (
          <div className="card p-16 flex flex-col items-center text-center">
            <p className="text-[#F0F4FF] font-display font-bold text-xl">No weapon data yet</p>
            <p className="text-[#4A5568] text-sm mt-2">Create training sessions to see weapon performance.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weapons.map((w, i) => (
              <WeaponCard key={w.weaponType} wp={w} delay={i * 60} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
