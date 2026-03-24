// apps/web/app/auth/login/page.tsx
'use client';

// DESIGN NOTE: Split-screen auth. Left 55% = animated visual panel with SVG
// target rings that "draw in" on load. Right 45% = form. The radial gradient
// on the left slowly shifts (8s loop) for a living-wallpaper feel.
// Floating stat cards reinforce the platform's elite positioning.

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '../../../lib/auth';
import { googleSignIn } from '../../../lib/google-auth';
import { useAuth } from '../../../contexts/auth-context';
import { useIsMobile } from '../../../lib/use-mobile';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const isMobile = useIsMobile();
  const safeTopInset = isMobile ? 'max(env(safe-area-inset-top, 0px), 24px)' : 'env(safe-area-inset-top, 0px)';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setHasError(false);
    setLoading(true);

    try {
      const res = await login({ email, password });
      setUser(res.user);
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setError(msg);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex bg-void relative overflow-hidden"
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

      {/* ── Left visual panel (hidden on mobile) ───────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12 noise-overlay"
        style={{
          background: 'radial-gradient(ellipse at 40% 50%, rgba(15,31,61,0.5) 0%, var(--bg-void) 70%)',
          animation: 'radialShift 8s ease infinite',
          backgroundSize: '200% 200%',
        }}
      >
        {/* Animated target rings SVG */}
        <AnimatedRings />

        {/* Floating stat cards */}
        <div className="relative z-10 flex flex-col gap-4 pointer-events-none">
          <StatCard
            value="10.9"
            label="World Record — Air Rifle"
            color="#F5A623"
            delay={800}
          />
          <StatCard
            value="2,847"
            label="Elite Shooters Tracked"
            color="#4FC3F7"
            delay={1000}
          />
          <StatCard
            value="98.4%"
            label="Prediction Accuracy"
            color="#00E5A0"
            delay={1200}
          />
        </div>

        {/* Quote */}
        <p
          className="relative z-10 text-text-muted italic text-sm font-body animate-fade-in"
          style={{ animationDelay: '1400ms' }}
        >
          "Precision is not an accident."
        </p>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <CrosshairMark />
            <span className="font-display font-bold text-2xl tracking-widest text-text-primary">
              MARKSMAN
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl text-text-primary mb-1">
              Welcome back
            </h1>
            <p className="text-text-secondary text-sm">
              Sign in to your training dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`field ${hasError ? 'field-error' : ''}`}
                placeholder="you@example.com"
                aria-describedby={error ? 'auth-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`field ${hasError ? 'field-error' : ''}`}
                placeholder="Your password"
              />
            </div>

            {error && (
              <div
                id="auth-error"
                role="alert"
                className="flex items-center gap-2 px-4 py-3 bg-[rgba(255,77,109,0.08)]
                           border border-[rgba(255,77,109,0.3)] rounded-lg text-[#FF4D6D] text-sm"
              >
                <AlertIcon />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-2"
              aria-busy={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-subtle" />
            <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">or</span>
            <div className="flex-1 h-px bg-subtle" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={() => googleSignIn()}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                       border border-border-subtle bg-elevated text-text-primary text-sm font-medium
                       hover:border-border-active hover:bg-subtle transition-all duration-200"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Footer links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-text-muted text-sm">
              No account yet?{' '}
              <Link href="/auth/register" className="text-accent hover:text-amber-400 transition-colors font-medium">
                Create one
              </Link>
            </p>
            <p className="text-text-muted text-xs mt-4">
              Trusted by 12 national teams worldwide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AnimatedRings() {
  // 10 concentric rings that draw in sequentially
  const rings = Array.from({ length: 10 }, (_, i) => {
    const r = 260 - i * 22;
    const circ = 2 * Math.PI * r;
    return { r, circ, delay: i * 180 };
  });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full opacity-20"
        aria-hidden="true"
      >
        {rings.map(({ r, circ, delay }, i) => (
          <circle
            key={i}
            cx="300" cy="300"
            r={r}
            fill="none"
            stroke="#F5A623"
            strokeWidth={i === 9 ? 2 : 0.8}
            strokeDasharray={circ}
            strokeDashoffset={circ}
            style={{
              animation: `dashDraw 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
            }}
          />
        ))}
        {/* Center dot */}
        <circle cx="300" cy="300" r="4" fill="#F5A623"
          style={{ animation: 'fadeIn 300ms 1800ms both' }} />
      </svg>
    </div>
  );
}

function StatCard({
  value,
  label,
  color,
  delay,
}: { value: string; label: string; color: string; delay: number }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-xl border border-border-subtle/50
                 glass max-w-xs animate-slide-in-right"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className="score-value text-2xl font-bold"
        style={{ color }}
      >
        {value}
      </span>
      <span className="text-text-secondary text-xs font-body">{label}</span>
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

function Spinner() {
  return (
    <span
      className="w-4 h-4 border-2 border-[#F5A623]/30 border-t-[#F5A623] rounded-full animate-spin"
      aria-hidden="true"
    />
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
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
