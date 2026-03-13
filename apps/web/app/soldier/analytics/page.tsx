// apps/web/app/soldier/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { AppShell } from '../../../components/AppShell';
import { SkeletonCard, SkeletonRow } from '../../../components/ui/SkeletonCard';
import type { Session, WeaponPerformance } from '@shooting-platform/shared-types';
import { TRAINING_MODES, TRAINING_MODE_COLORS } from '@shooting-platform/shared-types';

// ── Simple bar chart ───────────────────────────────────────────────────────────

function WeaponBarChart({ weapons }: { weapons: WeaponPerformance[] }) {
  if (weapons.length === 0) return null;
  const max = Math.max(...weapons.map((w) => w.averageScore), 1);

  return (
    <div className="space-y-3">
      {weapons.map((w, i) => (
        <div key={w.weaponType} className="animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#8892A4] font-display truncate max-w-[60%]">{w.weaponType}</span>
            <span className="score-value text-xs text-accent">{w.averageScore.toFixed(2)}</span>
          </div>
          <div className="h-2 bg-[#1E2433] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent"
              style={{ width: `${(w.averageScore / max) * 100}%`, transition: 'width 600ms ease' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Training mode breakdown grid ───────────────────────────────────────────────

function ModeBreakdown({ sessions }: { sessions: Session[] }) {
  const counts = TRAINING_MODES.map((m) => ({
    mode: m,
    count: sessions.filter((s) => s.trainingMode === m).length,
    color: TRAINING_MODE_COLORS[m] ?? '#8892A4',
  }));
  const total = counts.reduce((a, b) => a + b.count, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {counts.map((c) => (
        <div key={c.mode} className="bg-[#161B26] border border-[#1E2433] rounded-xl p-4 text-center">
          <p className="score-value font-bold text-2xl" style={{ color: c.color }}>{c.count}</p>
          <p className="text-[10px] font-display uppercase tracking-wide mt-1" style={{ color: c.color }}>{c.mode}</p>
          {total > 0 && (
            <p className="text-[#4A5568] text-[10px] mt-0.5">{((c.count / total) * 100).toFixed(0)}%</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SoldierAnalyticsPage() {
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [weapons, setWeapons]     = useState<WeaponPerformance[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterWeapon, setFilter] = useState<string>('All');

  useEffect(() => {
    Promise.all([
      apiFetch<Session[]>('/sessions').catch(() => [] as Session[]),
      apiFetch<WeaponPerformance[]>('/analytics/weapons/summary').catch(() => [] as WeaponPerformance[]),
    ]).then(([s, w]) => {
      setSessions(s);
      setWeapons(w);
    }).finally(() => setLoading(false));
  }, []);

  const weaponOptions = ['All', ...weapons.map((w) => w.weaponType)];
  const filtered = filterWeapon === 'All' ? sessions : sessions.filter((s) => s.weaponType === filterWeapon);

  return (
    <AppShell title="Field Analytics">
      <div className="space-y-6">

        <div className="animate-slide-up">
          <h1 className="font-display font-bold text-2xl text-[#F0F4FF]">Field Analytics</h1>
          <p className="text-[#4A5568] text-sm mt-1">
            Weapon performance comparison and training mode breakdown.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard height={200} animationDelay={0} />
            <SkeletonCard height={120} animationDelay={80} />
          </div>
        ) : (
          <>
            {/* Weapon comparison bar chart */}
            <div className="card p-5 animate-slide-up stagger-1">
              <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide mb-4">
                Avg Score by Weapon
              </h3>
              {weapons.length === 0 ? (
                <p className="text-[#4A5568] text-sm text-center py-8">No data yet.</p>
              ) : (
                <WeaponBarChart weapons={weapons} />
              )}
            </div>

            {/* Training mode breakdown */}
            <div className="card p-5 animate-slide-up stagger-2">
              <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide mb-4">
                Sessions by Training Mode
              </h3>
              <ModeBreakdown sessions={sessions} />
            </div>

            {/* Recent sessions table with filter */}
            <div className="card animate-slide-up stagger-3">
              <div className="flex items-center justify-between p-5 pb-4 flex-wrap gap-3">
                <h3 className="font-display font-semibold text-base text-[#F0F4FF] tracking-wide">
                  Session History
                </h3>
                <select
                  value={filterWeapon}
                  onChange={(e) => setFilter(e.target.value)}
                  className="field bg-[#161B26] text-xs py-1.5 px-3 max-w-[180px]"
                >
                  {weaponOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              {filtered.length === 0 ? (
                <p className="text-[#4A5568] text-sm text-center py-12">No sessions for this weapon.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1E2433]">
                      <th className="text-left py-3 px-5 label">Date</th>
                      <th className="text-left py-3 px-5 label hidden sm:table-cell">Weapon</th>
                      <th className="text-left py-3 px-5 label hidden md:table-cell">Mode</th>
                      <th className="text-right py-3 px-5 label">Dist</th>
                      <th className="text-right py-3 px-5 label">Shots</th>
                      <th className="py-3 px-5" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 15).map((s, i) => (
                      <tr
                        key={s.id}
                        className="table-row-hover border-b border-[#1E2433]/50 animate-fade-in"
                        style={{ animationDelay: `${i * 25}ms` }}
                      >
                        <td className="py-3 px-5">
                          <span className="score-value text-xs text-[#8892A4]">
                            {new Date(s.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-[#8892A4] text-xs hidden sm:table-cell truncate max-w-[120px]">
                          {s.weaponType}
                        </td>
                        <td className="py-3 px-5 hidden md:table-cell">
                          {s.trainingMode && (
                            <span
                              className="text-[10px] font-display uppercase tracking-wide px-2 py-0.5 rounded"
                              style={{
                                color: TRAINING_MODE_COLORS[s.trainingMode] ?? '#8892A4',
                                backgroundColor: `${TRAINING_MODE_COLORS[s.trainingMode] ?? '#8892A4'}18`,
                              }}
                            >
                              {s.trainingMode}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right text-[#8892A4] text-xs">{s.distance}m</td>
                        <td className="py-3 px-5 text-right score-value text-[#F0F4FF]">{s.numberOfShots}</td>
                        <td className="py-3 px-5 text-right">
                          <Link
                            href={`/sessions/${s.id}`}
                            className="text-accent hover:text-amber-300 text-xs font-display font-semibold uppercase tracking-wide transition-colors"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
