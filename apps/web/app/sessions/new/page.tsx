// apps/web/app/sessions/new/page.tsx
'use client';

// DESIGN NOTE: Clean single-column form on the dark grid background.
// Each form section is a card that slides up on load. The submit button
// has the primary amber shimmer hover treatment.

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { AppShell } from '../../../components/AppShell';
import { useAuth } from '../../../contexts/auth-context';
import type { Session } from '@shooting-platform/shared-types';
import { ARMY_WEAPONS, TRAINING_MODES, TRAINING_MODE_COLORS } from '@shooting-platform/shared-types';

const DISCIPLINES = [
  '10m Air Rifle', '10m Air Pistol', '25m Rapid Fire Pistol',
  '50m Rifle 3 Positions', '50m Rifle Prone', '50m Pistol',
  'Skeet', 'Trap', 'Double Trap', 'Other',
];

const WEAPON_TYPES = [
  'Air Rifle', 'Air Pistol', 'Standard Pistol', 'Free Pistol', 'Shotgun', 'Other',
];

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isSoldier = user?.role === 'SOLDIER';

  const weaponList = isSoldier ? [...ARMY_WEAPONS] : WEAPON_TYPES;

  const [discipline, setDiscipline]       = useState(DISCIPLINES[0]);
  const [weaponType, setWeaponType]       = useState(weaponList[0]);
  const [customWeapon, setCustomWeapon]   = useState('');
  const [distance, setDistance]           = useState(isSoldier ? 25 : 10);
  const [numberOfShots, setShots]         = useState(60);
  const [sessionDate, setSessionDate]     = useState(new Date().toISOString().slice(0, 10));
  const [trainingMode, setTrainingMode]   = useState<string>(TRAINING_MODES[0]);
  const [error, setError]                 = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);

  const isCustom = weaponType === 'Custom Gun';
  const resolvedWeapon = isCustom ? customWeapon : weaponType;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body: Record<string, unknown> = {
      discipline, weaponType: resolvedWeapon, distance, numberOfShots, sessionDate,
    };
    if (isSoldier) body.trainingMode = trainingMode;

    try {
      const session = await apiFetch<Session>('/sessions', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="New Session">
      <div className="max-w-xl mx-auto">

        {/* Breadcrumb */}
        <Link href="/sessions"
          className="inline-flex items-center gap-1 text-[#4A5568] hover:text-accent text-xs font-display uppercase tracking-widest transition-colors mb-6">
          ← Sessions
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-5 animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent text-[#080A0F] font-display font-bold text-xs flex items-center justify-center">
              1
            </span>
            <span className="text-[#F0F4FF] text-xs font-display font-semibold uppercase tracking-wide">Session Details</span>
          </div>
          <div className="flex-1 h-px bg-[#1E2433]" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full border border-[#1E2433] text-[#4A5568] font-display font-bold text-xs flex items-center justify-center">
              2
            </span>
            <span className="text-[#4A5568] text-xs font-display uppercase tracking-wide">Add Shots</span>
          </div>
        </div>

        <div className="card p-6 animate-slide-up stagger-1">
          <div className="mb-6">
            <h1 className="font-display font-bold text-2xl text-[#F0F4FF]">New Training Session</h1>
            <p className="text-[#8892A4] text-sm mt-1">
              Define the session parameters. You'll add shots on the next screen.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Discipline */}
            <div>
              <label htmlFor="discipline" className="label">Discipline</label>
              <select
                id="discipline"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="field bg-[#161B26]"
              >
                {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Weapon */}
            <div>
              <label htmlFor="weaponType" className="label">Weapon Type</label>
              <select
                id="weaponType"
                value={weaponType}
                onChange={(e) => setWeaponType(e.target.value)}
                className="field bg-[#161B26]"
              >
                {weaponList.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
              {isCustom && (
                <input
                  type="text"
                  placeholder="Enter weapon name…"
                  value={customWeapon}
                  onChange={(e) => setCustomWeapon(e.target.value)}
                  required
                  className="field mt-2"
                />
              )}
            </div>

            {/* Training mode — SOLDIER only */}
            {isSoldier && (
              <div>
                <label htmlFor="trainingMode" className="label">Training Mode</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TRAINING_MODES.map((m) => {
                    const color = TRAINING_MODE_COLORS[m] ?? '#8892A4';
                    const selected = trainingMode === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTrainingMode(m)}
                        className={`
                          px-3 py-2 rounded-lg border text-xs font-display tracking-wide text-left
                          transition-all duration-150
                          ${selected
                            ? 'border-current text-current bg-current/10'
                            : 'border-[#1E2433] text-[#8892A4] hover:border-[#2A3040]'
                          }
                        `}
                        style={selected ? { color, borderColor: color } : {}}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Distance + shots row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="distance" className="label">Distance (m)</label>
                <input
                  id="distance" type="number" required min={1} max={1000}
                  value={distance} onChange={(e) => setDistance(Number(e.target.value))}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="shots" className="label">Planned Shots</label>
                <input
                  id="shots" type="number" required min={1} max={1000}
                  value={numberOfShots} onChange={(e) => setShots(Number(e.target.value))}
                  className="field"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="sessionDate" className="label">Session Date</label>
              <input
                id="sessionDate" type="date" required
                value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
                className="field"
              />
            </div>

            {error && (
              <div role="alert"
                className="px-4 py-3 bg-[rgba(255,77,109,0.08)] border border-[rgba(255,77,109,0.3)]
                           rounded-lg text-[#FF4D6D] text-sm flex items-center gap-2">
                <AlertIcon /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Creating session...
                </span>
              ) : (
                'Create Session & Add Shots'
              )}
            </button>
          </form>
        </div>

        {/* Quick-start presets */}
        <div className="mt-4 animate-slide-up stagger-3">
          <p className="label mb-3 px-1">Quick presets</p>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
            {(isSoldier ? [
              { label: 'AK-203 25m', disc: 'Other', weapon: 'AK-203', dist: 25, shots: 30, mode: 'Marksmanship' },
              { label: 'Glock 17 15m', disc: 'Other', weapon: 'Glock 17', dist: 15, shots: 20, mode: 'Rapid Fire' },
              { label: 'Sig716 100m', disc: 'Other', weapon: 'Sig Sauer SIG716', dist: 100, shots: 20, mode: 'Field Exercise' },
            ] : [
              { label: '60-Shot Air Rifle', disc: '10m Air Rifle', weapon: 'Air Rifle', dist: 10, shots: 60, mode: '' },
              { label: '40-Shot Air Pistol', disc: '10m Air Pistol', weapon: 'Air Pistol', dist: 10, shots: 40, mode: '' },
              { label: '3P Rifle', disc: '50m Rifle 3 Positions', weapon: 'Air Rifle', dist: 50, shots: 120, mode: '' },
            ]).map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setDiscipline(p.disc);
                  setWeaponType(p.weapon);
                  setDistance(p.dist);
                  setShots(p.shots);
                  if (p.mode) setTrainingMode(p.mode);
                }}
                className="btn btn-ghost text-xs py-2 px-3 leading-tight"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-[#080A0F] border-t-transparent rounded-full animate-spin" aria-hidden="true" />;
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M7 1L13 12H1z" />
      <line x1="7" y1="5.5" x2="7" y2="8" />
      <circle cx="7" cy="10" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
