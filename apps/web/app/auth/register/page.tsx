// apps/web/app/auth/register/page.tsx
'use client';

// DESIGN NOTE: Same split-screen layout as login but rings draw in from
// opposite direction. Role selector uses two large toggle cards — the
// amber border on the selected state creates a strong selection affordance.

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '../../../lib/auth';
import { useAuth } from '../../../contexts/auth-context';
import type { UserRole } from '@shooting-platform/shared-types';
import { ARMY_WEAPONS } from '@shooting-platform/shared-types';
import { useIsMobile } from '../../../lib/use-mobile';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const isMobile = useIsMobile();
  const safeTopInset = isMobile ? 'max(env(safe-area-inset-top, 0px), 24px)' : 'env(safe-area-inset-top, 0px)';

  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [role, setRole]               = useState<UserRole>('SHOOTER');
  const [primaryWeapon, setPrimary]   = useState<string>('AK-203');
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await register({ name, email, password, role });
      setUser(res.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex bg-[#080A0F] relative overflow-hidden"
      style={{ paddingTop: safeTopInset }}
    >
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: safeTopInset,
          background:
            'linear-gradient(90deg, rgba(245,166,35,0.20) 0%, rgba(79,195,247,0.16) 45%, rgba(0,229,160,0.12) 100%)',
        }}
      />

      {/* ── Left visual panel ───────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-end p-12 noise-overlay"
        style={{
          background: 'radial-gradient(ellipse at 60% 60%, #0f2d1f 0%, #080A0F 70%)',
        }}
      >
        <AnimatedRingsGreen />

        <div className="relative z-10 space-y-3 mb-8">
          <InfoPill icon={<PillTargetIcon />} text="Track every shot, every session" delay={600} />
          <InfoPill icon={<PillChartIcon />}  text="AI-powered coaching suggestions" delay={750} />
          <InfoPill icon={<PillTeamIcon />}   text="Coach-shooter collaboration tools" delay={900} />
        </div>

        <p className="relative z-10 text-[#4A5568] italic text-sm font-body animate-fade-in"
           style={{ animationDelay: '1100ms' }}>
          "Excellence is a habit, not an act."
        </p>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <CrosshairMark />
            <span className="font-display font-bold text-2xl tracking-widest text-[#F0F4FF]">
              MARKSMAN
            </span>
          </div>

          <div className="mb-7">
            <h1 className="font-display font-bold text-3xl text-[#F0F4FF] mb-1">
              Create account
            </h1>
            <p className="text-[#8892A4] text-sm">
              Join the precision training platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input
                id="name" type="text" required autoComplete="name"
                value={name} onChange={(e) => setName(e.target.value)}
                className="field" placeholder="Alex Marksman"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email" type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="field" placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password" type="password" required minLength={8}
                autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="field" placeholder="Min 8 characters"
              />
            </div>

            {/* Role selector */}
            <div>
              <span className="label block mb-2">I am a</span>
              <div className="grid grid-cols-3 gap-2">
                <RoleCard
                  id="SHOOTER"
                  selected={role === 'SHOOTER'}
                  onSelect={() => setRole('SHOOTER')}
                  icon={<RifleIcon />}
                  label="Shooter"
                  description="Track my training sessions"
                />
                <RoleCard
                  id="COACH"
                  selected={role === 'COACH'}
                  onSelect={() => setRole('COACH')}
                  icon={<CoachIcon />}
                  label="Coach"
                  description="Manage and review shooters"
                />
                <RoleCard
                  id="SOLDIER"
                  selected={role === 'SOLDIER'}
                  onSelect={() => setRole('SOLDIER')}
                  icon={<SoldierIcon />}
                  label="Soldier"
                  description="Military training & qualification"
                />
              </div>
            </div>

            {/* Soldier weapon selection panel */}
            {role === 'SOLDIER' && (
              <div className="animate-slide-down overflow-hidden">
                <span className="label block mb-2">Primary weapon</span>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {ARMY_WEAPONS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPrimary(w)}
                      className={`
                        text-left px-3 py-2 rounded-lg border text-xs font-display tracking-wide
                        transition-all duration-150
                        ${primaryWeapon === w
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-[#1E2433] bg-[#161B26] text-[#8892A4] hover:border-[#2A3040] hover:text-[#F0F4FF]'
                        }
                      `}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div role="alert"
                className="flex items-center gap-2 px-4 py-3 bg-[rgba(255,77,109,0.08)]
                           border border-[rgba(255,77,109,0.3)] rounded-lg text-[#FF4D6D] text-sm">
                <AlertIcon /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[#4A5568] text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-accent hover:text-amber-400 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Role card ─────────────────────────────────────────────────────────────────

function RoleCard({
  id, selected, onSelect, icon, label, description,
}: {
  id: string; selected: boolean; onSelect: () => void;
  icon: React.ReactNode; label: string; description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-xl border-2
        text-center transition-all duration-200 cursor-pointer
        ${selected
          ? 'border-accent bg-accent/10 shadow-glow-sm'
          : 'border-[#1E2433] bg-[#161B26] hover:border-[#2A3040]'
        }
      `}
    >
      <span className={`transition-colors duration-200 ${selected ? 'text-accent' : 'text-[#4A5568]'}`}>
        {icon}
      </span>
      <span className={`font-display font-bold text-sm tracking-wide uppercase transition-colors duration-200 ${selected ? 'text-accent' : 'text-[#8892A4]'}`}>
        {label}
      </span>
      <span className="text-[10px] text-[#4A5568] leading-tight">{description}</span>
    </button>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AnimatedRingsGreen() {
  const rings = Array.from({ length: 8 }, (_, i) => {
    const r = 220 - i * 24;
    const circ = 2 * Math.PI * r;
    return { r, circ, delay: i * 200 };
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg viewBox="0 0 600 600" className="w-full h-full opacity-15" aria-hidden="true">
        {rings.map(({ r, circ, delay }, i) => (
          <circle key={i} cx="300" cy="300" r={r} fill="none"
            stroke="#00E5A0" strokeWidth={0.8}
            strokeDasharray={circ} strokeDashoffset={circ}
            style={{ animation: `dashDraw 1.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms forwards` }}
          />
        ))}
      </svg>
    </div>
  );
}

function InfoPill({ icon, text, delay }: { icon: React.ReactNode; text: string; delay: number }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[rgba(0,229,160,0.06)]
                 border border-[rgba(0,229,160,0.15)] max-w-xs animate-slide-in-right"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-[#00E5A0] shrink-0">{icon}</span>
      <span className="text-[#8892A4] text-xs font-body">{text}</span>
    </div>
  );
}

function CrosshairMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 6px rgba(245,166,35,0.45))' }}>
      <circle cx="32" cy="32" r="27" stroke="#F5A623" strokeWidth="1.5" opacity="0.5"/>
      <circle cx="32" cy="32" r="19" stroke="#F5A623" strokeWidth="1.5" opacity="0.85"/>
      <circle cx="32" cy="32" r="8"  stroke="#F5A623" strokeWidth="1.5"/>
      <circle cx="32" cy="32" r="3"  fill="#F5A623"/>
      <line x1="32" y1="4"  x2="32" y2="22" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="42" x2="32" y2="60" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4"  y1="32" x2="22" y2="32" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="42" y1="32" x2="60" y2="32" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function RifleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="14" r="10" />
      <circle cx="14" cy="14" r="3" />
      <line x1="14" y1="4" x2="14" y2="9" />
      <line x1="14" y1="19" x2="14" y2="24" />
      <line x1="4" y1="14" x2="9" y2="14" />
      <line x1="19" y1="14" x2="24" y2="14" />
    </svg>
  );
}

function CoachIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="8" width="16" height="12" rx="2" />
      <line x1="14" y1="20" x2="14" y2="24" />
      <line x1="10" y1="24" x2="18" y2="24" />
      <line x1="10" y1="13" x2="18" y2="13" />
      <line x1="10" y1="16" x2="15" y2="16" />
    </svg>
  );
}

function SoldierIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="14,3 17,10 25,10 19,15 21,23 14,18 7,23 9,15 3,10 11,10" />
    </svg>
  );
}

function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-[#080A0F] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
  );
}

// ── Alert icon ────────────────────────────────────────────────────────────────

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

// ── Info pill icons ───────────────────────────────────────────────────────────

function PillTargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" />
      <circle cx="8" cy="8" r="3.5" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PillChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="2,12 5.5,7 9,9.5 13.5,4" />
      <circle cx="5.5" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="4" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PillTeamIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="5" r="2.2" />
      <path d="M1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
      <circle cx="11.5" cy="5" r="1.8" />
      <path d="M13 10.5c1.2.4 2 1.5 2 3" />
    </svg>
  );
}
