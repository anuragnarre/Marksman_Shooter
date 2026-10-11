// apps/web/app/sessions/new/page.tsx
'use client';

// DESIGN NOTE: Clean single-column form on the dark grid background.
// Each form section is a card that slides up on load. The submit button
// has the primary amber shimmer hover treatment.

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '../../../lib/api';
import { AppShell } from '../../../components/AppShell';
import { useAuth } from '../../../contexts/auth-context';
import { toLocalDateTimeInput } from '../../../lib/session-time';
import { useCoachShooter } from '../../../lib/use-coach-shooter';
import type { Session } from '@shooting-platform/shared-types';

const DISCIPLINES: { label: string; weapon: string; distance: number; shots: number }[] = [
  { label: '10m Air Rifle',          weapon: 'Air Rifle',       distance: 10, shots: 60  },
  { label: '10m Air Pistol',         weapon: 'Air Pistol',      distance: 10, shots: 40  },
  { label: '25m Rapid Fire Pistol',  weapon: 'Standard Pistol', distance: 25, shots: 60  },
  { label: '50m Rifle 3 Positions',  weapon: 'Standard Rifle',  distance: 50, shots: 120 },
  { label: '50m Rifle Prone',        weapon: 'Standard Rifle',  distance: 50, shots: 60  },
  { label: '50m Pistol',             weapon: 'Free Pistol',     distance: 50, shots: 60  },
];

const WEAPON_TYPES = [
  'Air Rifle', 'Air Pistol', 'Standard Rifle', 'Standard Pistol', 'Free Pistol',
];

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    isCoach,
    shooters,
    selectedShooterId,
    setSelectedShooterId,
  } = useCoachShooter();
  const [shooterIdFromUrl, setShooterIdFromUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = new URLSearchParams(window.location.search).get('shooterId');
    setShooterIdFromUrl(id);
  }, []);

  const targetShooterId = isCoach
    ? (shooterIdFromUrl && shooters.some((s) => s.id === shooterIdFromUrl)
      ? shooterIdFromUrl
      : selectedShooterId)
    : null;

  const [discipline, setDisciplineState]  = useState(DISCIPLINES[0].label);
  const [weaponType, setWeaponType]       = useState(DISCIPLINES[0].weapon);
  const [distance, setDistance]           = useState(DISCIPLINES[0].distance);
  const [numberOfShots, setShots]         = useState(DISCIPLINES[0].shots);
  const [sessionDate, setSessionDate]     = useState(toLocalDateTimeInput(new Date()));
  const [error, setError]                 = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);

  function setDiscipline(label: string) {
    const d = DISCIPLINES.find(d => d.label === label);
    if (!d) return;
    setDisciplineState(d.label);
    setWeaponType(d.weapon);
    setDistance(d.distance);
    setShots(d.shots);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body: Record<string, unknown> = {
      discipline,
      weaponType,
      distance,
      numberOfShots,
      sessionDate: new Date(sessionDate).toISOString(),
    };

    try {
      const path = isCoach
        ? `/sessions?shooterId=${encodeURIComponent(targetShooterId ?? '')}`
        : '/sessions';
      const session = await apiFetch<Session>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.push(
        isCoach && targetShooterId
          ? `/sessions/${session.id}?shooterId=${encodeURIComponent(targetShooterId)}`
          : `/sessions/${session.id}`,
      );
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
          className="inline-flex items-center gap-1 text-text-muted hover:text-accent text-xs font-display uppercase tracking-widest transition-colors mb-6">
          ← Sessions
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-5 animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent text-[#080A0F] font-display font-bold text-xs flex items-center justify-center">
              1
            </span>
            <span className="text-text-primary text-xs font-display font-semibold uppercase tracking-wide">Session Details</span>
          </div>
          <div className="flex-1 h-px bg-subtle" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full border border-border-subtle text-text-muted font-display font-bold text-xs flex items-center justify-center">
              2
            </span>
            <span className="text-text-muted text-xs font-display uppercase tracking-wide">Add Shots</span>
          </div>
        </div>

        <div className="card p-6 animate-slide-up stagger-1">
          <div className="mb-6">
            <h1 className="font-display font-bold text-2xl text-text-primary">New Training Session</h1>
            <p className="text-text-secondary text-sm mt-1">
              Define the session parameters. You'll add shots on the next screen.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isCoach && (
              <div>
                <label className="label">Shooter</label>
                <select
                  className="field bg-elevated"
                  value={targetShooterId ?? ''}
                  onChange={(e) => setSelectedShooterId(e.target.value || null)}
                  required
                >
                  {shooters.length === 0 && <option value="">No connected shooters</option>}
                  {shooters.map((shooter) => (
                    <option key={shooter.id} value={shooter.id}>
                      {shooter.name}{shooter.shooterProfile?.isManaged ? ` (ID: ${shooter.shooterProfile.shooterCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Discipline */}
            <div>
              <label htmlFor="discipline" className="label">Discipline</label>
              <select
                id="discipline"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="field bg-elevated"
              >
                {DISCIPLINES.map((d) => <option key={d.label} value={d.label}>{d.label}</option>)}
              </select>
            </div>

            {/* Weapon */}
            <div>
              <label htmlFor="weaponType" className="label">Weapon Type</label>
              <select
                id="weaponType"
                value={weaponType}
                onChange={(e) => setWeaponType(e.target.value)}
                className="field bg-elevated"
              >
                {WEAPON_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

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

            {/* Start Timestamp */}
            <div>
              <label htmlFor="sessionDate" className="label">Session Start Timestamp</label>
              <input
                id="sessionDate" type="datetime-local" required
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

            <button
              type="submit"
              disabled={loading || (isCoach && !targetShooterId)}
              className="btn btn-primary w-full mt-2 disabled:opacity-40"
            >
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DISCIPLINES.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setDiscipline(d.label)}
                className={`btn text-xs py-2 px-3 leading-tight text-left ${discipline === d.label ? 'btn-primary' : 'btn-ghost'}`}
              >
                <span className="block font-display font-semibold">{d.label}</span>
                <span className="block text-[10px] opacity-60 mt-0.5">{d.shots} shots · {d.distance}m</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-[#F5A623]/30 border-t-[#F5A623] rounded-full animate-spin" aria-hidden="true" />;
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
