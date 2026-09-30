// apps/web/app/auth/login/page.tsx
'use client';

// DESIGN NOTE: Split-screen auth. Left 55% = animated visual panel with SVG
// target rings that "draw in" on load. Right 45% = form. The radial gradient
// on the left slowly shifts (8s loop) for a living-wallpaper feel.
// Floating stat cards reinforce the platform's elite positioning.

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '../../../lib/auth';
import { useAuth } from '../../../contexts/auth-context';
import { useIsMobile } from '../../../lib/use-mobile';
import { useToast } from '../../../contexts/toast-context';
import { GoogleSignInButton } from '../../../components/GoogleSignInButton';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const GOOGLE_ENABLED = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'dummy' && !GOOGLE_CLIENT_ID.startsWith('your-google'));

export default function LoginPage() {
  const router = useRouter();
  const { setUser, isLoggedIn, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const safeTopInset = isMobile ? 'max(env(safe-area-inset-top, 0px), 24px)' : 'env(safe-area-inset-top, 0px)';

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [hasError, setHasError]   = useState(false);

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && isLoggedIn) router.replace('/dashboard');
  }, [isLoading, isLoggedIn, router]);

  function clearError() {
    if (error) { setError(null); setHasError(false); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setHasError(false);

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      setHasError(true);
      return;
    }
    if (!password) {
      setError('Password is required');
      setHasError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password });
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
      className="h-screen flex flex-col lg:flex-row bg-void relative"
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

      {/* ── Mobile image banner (shown only on small screens) ────────── */}
      <div className="lg:hidden relative h-32 overflow-hidden flex-shrink-0">
        <img
          src="https://images.pexels.com/photos/6091606/pexels-photo-6091606.jpeg?auto=compress&cs=tinysrgb&w=800&h=300&dpr=1"
          className="w-full h-full object-cover"
          alt=""
          aria-hidden="true"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(6,8,16,0.45) 0%, rgba(6,8,16,0.96) 100%)' }} />
        <div className="absolute bottom-4 left-6 flex items-center gap-2.5">
          <CrosshairMark />
          <span className="font-display font-bold text-xl tracking-widest text-[#F0F4FF] uppercase">MARKSMAN</span>
        </div>
      </div>

      {/* ── Left visual panel (hidden on mobile) ───────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12 noise-overlay"
        style={{
          backgroundImage: [
            'linear-gradient(135deg, rgba(6,8,16,0.82) 0%, rgba(8,12,28,0.60) 50%, rgba(6,8,16,0.90) 100%)',
            'url(https://images.pexels.com/photos/6091606/pexels-photo-6091606.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=1)',
          ].join(', '),
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center, center',
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
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-10 lg:flex lg:items-center lg:justify-center">
        <div className="w-full max-w-md mx-auto animate-slide-up">

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
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                className={`field ${hasError ? 'field-error' : ''}`}
                placeholder="arjun@example.com"
                aria-describedby={error ? 'auth-error' : undefined}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  className={`field pr-10 ${hasError ? 'field-error' : ''}`}
                  placeholder="Your password"
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

          {/* Divider + Google Sign In — only shown when Google OAuth is configured */}
          {GOOGLE_ENABLED && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-subtle" />
                <span className="text-[10px] font-display uppercase tracking-widest text-text-muted">or</span>
                <div className="flex-1 h-px bg-subtle" />
              </div>
              <GoogleSignInButton
                text="signin_with"
                onSuccess={(user) => { setUser(user); router.push('/dashboard'); }}
                onError={(msg) => { setError(msg); setHasError(true); }}
              />
            </>
          )}


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
