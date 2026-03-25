// apps/web/app/auth/register/page.tsx
'use client';

// DESIGN NOTE: Same split-screen layout as login but rings draw in from
// opposite direction. Role selector uses two large toggle cards — the
// amber border on the selected state creates a strong selection affordance.

import React, { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { register } from '../../../lib/auth';
import { useAuth } from '../../../contexts/auth-context';
import type { UserRole } from '@shooting-platform/shared-types';
import { useIsMobile } from '../../../lib/use-mobile';
import { GoogleSignInButton } from '../../../components/GoogleSignInButton';

function RegisterPageInner() {
  const router = useRouter();
  const { setUser } = useAuth();
  const isMobile = useIsMobile();
  const safeTopInset = isMobile ? 'max(env(safe-area-inset-top, 0px), 24px)' : 'env(safe-area-inset-top, 0px)';

  const searchParams = useSearchParams();
  const VALID_ROLES: UserRole[] = ['SHOOTER', 'COACH'];
  const paramRole = searchParams.get('role') as UserRole;
  const initialRole: UserRole = VALID_ROLES.includes(paramRole) ? paramRole : 'SHOOTER';

  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole]               = useState<UserRole>(initialRole);
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
      className="min-h-screen flex flex-col lg:flex-row bg-void relative overflow-hidden"
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

      {/* ── Mobile image banner ──────────────────────────────────────────── */}
      <div className="lg:hidden relative h-32 overflow-hidden flex-shrink-0">
        <img
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80"
          className="w-full h-full object-cover"
          alt=""
          aria-hidden="true"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(6,8,16,0.4) 0%, rgba(6,8,16,0.96) 100%)' }} />
        <div className="absolute bottom-4 left-6 flex items-center gap-2.5">
          <CrosshairMark />
          <span className="font-display font-bold text-xl tracking-widest text-[#F0F4FF] uppercase">MARKSMAN</span>
        </div>
      </div>

      {/* ── Left visual panel ───────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-end p-12 noise-overlay"
        style={{
          backgroundImage: [
            'linear-gradient(135deg, rgba(6,8,16,0.80) 0%, rgba(8,20,16,0.55) 50%, rgba(6,8,16,0.90) 100%)',
            'url(https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop&q=80)',
          ].join(', '),
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
        }}
      >
        <AnimatedRingsGreen />

        <div className="relative z-10 space-y-3 mb-8">
          <InfoPill icon={<PillTargetIcon />} text="Track every shot, every session" delay={600} />
          <InfoPill icon={<PillChartIcon />}  text="AI-powered coaching suggestions" delay={750} />
          <InfoPill icon={<PillTeamIcon />}   text="Coach-shooter collaboration tools" delay={900} />
        </div>

        <p className="relative z-10 text-text-muted italic text-sm font-body animate-fade-in"
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
            <span className="font-display font-bold text-2xl tracking-widest text-text-primary">
              MARKSMAN
            </span>
          </div>

          <div className="mb-7">
            <h1 className="font-display font-bold text-3xl text-text-primary mb-1">
              Create account
            </h1>
            <p className="text-text-secondary text-sm">
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field pr-10"
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {password.length > 0 && <PasswordStrength password={password} />}
            </div>

            {/* Role selector */}
            <div>
              <span className="label block mb-2">I am a</span>
              <div className="grid grid-cols-2 gap-2">
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
              </div>
            </div>

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

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-subtle" />
            <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">or</span>
            <div className="flex-1 h-px bg-subtle" />
          </div>

          {/* Google Sign Up — passes the role the user selected above */}
          <GoogleSignInButton
            text="signup_with"
            role={role === 'COACH' ? 'COACH' : 'SHOOTER'}
            onSuccess={(user) => { setUser(user); router.push('/dashboard'); }}
            onError={(msg) => setError(msg)}
          />

          <p className="mt-6 text-center text-text-muted text-sm">
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

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
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
          : 'border-border-subtle bg-elevated hover:border-[#2A3040]'
        }
      `}
    >
      <span className={`transition-colors duration-200 ${selected ? 'text-accent' : 'text-text-muted'}`}>
        {icon}
      </span>
      <span className={`font-display font-bold text-sm tracking-wide uppercase transition-colors duration-200 ${selected ? 'text-accent' : 'text-text-secondary'}`}>
        {label}
      </span>
      <span className="text-[10px] text-text-muted leading-tight">{description}</span>
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
      <span className="text-text-secondary text-xs font-body">{text}</span>
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

function Spinner() {
  return (
    <span className="w-4 h-4 border-2 border-[#F5A623]/30 border-t-[#F5A623] rounded-full animate-spin" aria-hidden="true" />
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special', pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['#FF4D6D', '#FF4D6D', '#F5A623', '#00E5A0', '#00E5A0'];
  const labels = ['Weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score] : '#1E2433' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-display uppercase tracking-wide" style={{ color: colors[score] }}>
          {labels[score]}
        </span>
        <div className="flex gap-2">
          {checks.map(c => (
            <span
              key={c.label}
              className="text-[9px] font-display tracking-wide"
              style={{ color: c.pass ? '#00E5A0' : 'var(--text-muted)' }}
            >
              {c.pass ? '\u2713' : '\u2717'} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
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
