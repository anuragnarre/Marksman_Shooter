'use client';

// apps/web/app/page.tsx — Marksman Landing Page (mobile-first)

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '../lib/use-mobile';

// ── Entry Point ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const isMobile  = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const safeTopInset = isMobile ? 'max(env(safe-area-inset-top, 0px), 24px)' : 'env(safe-area-inset-top, 0px)';

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && user) router.replace('/dashboard');
  }, [user, mounted, router]);

  if (!mounted || user) return null;

  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F0F4FF] overflow-x-hidden">
      <Nav safeTopInset={safeTopInset} />
      <div style={{ paddingTop: safeTopInset }}>
        <Hero />
        <DisciplineMarquee />
        <LiveStats />
        <BentoFeatures />
        <HowItWorks />
        <CoachSection />
        <CtaBanner />
        <Footer />
      </div>
    </div>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────

function Nav({ safeTopInset }: { safeTopInset: string }) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const h = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Prevent body scroll while menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const NAV_LINKS = [
    { label: 'Features',     href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Coaches',      href: '#coaches' },
  ];

  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500 relative overflow-hidden"
        style={
          scrolled
            ? {
                paddingTop: safeTopInset,
                background: 'rgba(6,8,16,0.95)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                boxShadow: '0 1px 0 rgba(245,166,35,0.07), 0 8px 40px rgba(0,0,0,0.55)',
              }
            : {
                paddingTop: safeTopInset,
                background: 'transparent',
              }
        }
      >
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: safeTopInset,
            background:
              'linear-gradient(90deg, rgba(245,166,35,0.20) 0%, rgba(79,195,247,0.16) 45%, rgba(0,229,160,0.12) 100%)',
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[60px] sm:h-[68px] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0 touch-target">
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9">
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.2) 0%, transparent 70%)' }}
              />
              <CrosshairLogo size={26} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-black text-[14px] sm:text-[15px] tracking-[0.2em] uppercase text-[#F0F4FF]">
                Marksman
              </span>
              <span className="font-display text-[7px] sm:text-[8px] tracking-[0.25em] uppercase text-[#F5A623] opacity-70 mt-0.5">
                Precision Analytics
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative px-4 py-2 text-[#8892A4] hover:text-[#F0F4FF] text-[11px]
                           font-display uppercase tracking-[0.18em] transition-colors duration-200
                           group rounded-lg hover:bg-white/[0.03]"
              >
                {item.label}
                <span
                  className="absolute bottom-1 left-4 right-4 h-px origin-left scale-x-0
                             group-hover:scale-x-100 transition-transform duration-300"
                  style={{ background: 'linear-gradient(90deg, #F5A623 0%, rgba(245,166,35,0.2) 100%)' }}
                />
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-[#8892A4] hover:text-[#F0F4FF] text-[11px]
                         font-display uppercase tracking-[0.18em] transition-colors duration-200
                         rounded-lg hover:bg-white/[0.03]"
            >
              Sign In
            </Link>
            <Link href="/auth/register" className="btn btn-primary text-[11px] py-2.5 px-5 gap-2">
              Get Started
              <ArrowRightIcon size={11} />
            </Link>
          </div>

          {/* Mobile: Sign in text + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <Link
              href="/auth/login"
              className="px-3 py-2 text-[#8892A4] text-[11px] font-display uppercase tracking-[0.15em]
                         touch-target flex items-center"
            >
              Sign In
            </Link>
            <button
              className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-xl
                         transition-colors active:bg-white/[0.06]"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle navigation menu"
            >
              <span
                className="w-5 h-[1.5px] rounded-full transition-all duration-300 origin-center"
                style={{
                  background: '#8892A4',
                  transform: menuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none',
                }}
              />
              <span
                className="h-[1.5px] rounded-full transition-all duration-200"
                style={{
                  background: '#8892A4',
                  width: menuOpen ? '20px' : '12px',
                  opacity: menuOpen ? 0 : 1,
                }}
              />
              <span
                className="w-5 h-[1.5px] rounded-full transition-all duration-300 origin-center"
                style={{
                  background: '#8892A4',
                  transform: menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
                }}
              />
            </button>
          </div>
        </div>

        {/* Scrolled bottom border */}
        <div
          className="absolute bottom-0 inset-x-0 h-px pointer-events-none transition-opacity duration-500"
          style={{
            opacity: scrolled ? 1 : 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.3) 30%, rgba(79,195,247,0.18) 70%, transparent 100%)',
          }}
        />
      </nav>

      {/* Mobile drawer */}
      <div
        className="fixed inset-0 z-40 md:hidden transition-opacity duration-300"
        style={{ opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'auto' : 'none' }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(6,8,16,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          onClick={() => setMenuOpen(false)}
        />

        {/* Panel — slides in from top */}
        <div
          className="absolute inset-x-0 transition-transform duration-300"
          style={{
            top: `calc(60px + ${safeTopInset})`,
            background: 'rgba(6,8,16,0.98)',
            borderBottom: '1px solid rgba(245,166,35,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            transform: menuOpen ? 'translateY(0)' : 'translateY(-16px)',
          }}
        >
          <div className="px-4 pt-3 pb-6 flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-4 text-[#8892A4] hover:text-[#F0F4FF] text-sm font-display
                           uppercase tracking-[0.18em] transition-colors rounded-xl active:bg-white/[0.05]
                           flex items-center justify-between touch-target"
              >
                {item.label}
                <span className="text-[#2A3350] text-lg">›</span>
              </a>
            ))}
            <div
              className="h-px my-2 mx-4"
              style={{ background: 'linear-gradient(90deg, rgba(245,166,35,0.2), rgba(245,166,35,0.05))' }}
            />
            <div className="px-4 pt-2 flex flex-col gap-3">
              <Link
                href="/auth/register"
                onClick={() => setMenuOpen(false)}
                className="btn btn-primary text-sm py-3.5 w-full justify-center"
              >
                Get Started — Free
              </Link>
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="btn btn-ghost text-sm py-3.5 w-full justify-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-[60px] sm:pt-[68px] overflow-hidden">

      {/* Hex grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-2l26-15V18L28 2 2 18v31L28 64z' fill='none' stroke='%231E2433' stroke-width='0.6' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 72px',
          opacity: 0.35,
        }}
      />

      {/* Drifting orbs */}
      <div className="absolute pointer-events-none" style={{ width: 500, height: 500, right: '0%', top: '5%', background: 'radial-gradient(ellipse at center, rgba(245,166,35,0.07) 0%, transparent 65%)', animation: 'orbFloat 14s ease-in-out infinite' }} />
      <div className="absolute pointer-events-none" style={{ width: 300, height: 300, left: '-10%', bottom: '10%', background: 'radial-gradient(ellipse at center, rgba(79,195,247,0.04) 0%, transparent 65%)', animation: 'orbFloat 18s ease-in-out 4s infinite' }} />

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-x-0 h-px opacity-[0.03]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #F5A623 40%, #4FC3F7 60%, transparent 100%)', animation: 'scanLine 10s linear infinite' }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-16 items-center">

          {/* Copy — always first on mobile */}
          <div className="space-y-6 sm:space-y-8" style={{ animation: 'slideUpFade 700ms cubic-bezier(0.16,1,0.3,1) both' }}>

            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.22)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] flex-shrink-0" style={{ animation: 'pulseGlow 2.5s ease-in-out infinite' }} />
              <span className="text-[#F5A623] font-display text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">
                Precision Training Analytics
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1
                className="font-display font-black leading-[1.0] tracking-tight"
                style={{ fontSize: 'clamp(2.6rem, 10vw, 5.5rem)' }}
              >
                <span className="block text-[#F0F4FF]" style={{ animation: 'slideUpFade 700ms 100ms both' }}>
                  Master
                </span>
                <span className="block gradient-text" style={{ animation: 'slideUpFade 700ms 180ms both' }}>
                  Every Shot.
                </span>
              </h1>
              <p
                className="text-[#8892A4] text-base sm:text-lg leading-relaxed mt-4 sm:mt-6"
                style={{ animation: 'slideUpFade 700ms 260ms both', maxWidth: '34rem' }}
              >
                The complete analytics platform for competitive shooters and coaches.
                Log every shot, spot patterns with computer vision, and close the gap
                to your personal best.
              </p>
            </div>

            {/* Mini stat pills */}
            <div
              className="flex flex-wrap gap-3 sm:gap-6 pt-1"
              style={{ animation: 'slideUpFade 700ms 340ms both' }}
            >
              {[
                { value: '10-Ring', label: 'ISSF scoring', color: '#F5A623' },
                { value: 'CV Vision', label: 'Photo analysis', color: '#4FC3F7' },
                { value: 'Real-time', label: 'Coach feedback', color: '#00E5A0' },
              ].map(({ value, label, color }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="font-display font-bold text-base sm:text-xl leading-none" style={{ color }}>
                    {value}
                  </span>
                  <span className="text-[#4A5568] text-[9px] sm:text-[10px] font-display uppercase tracking-[0.15em]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div
              className="flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-3 xs:gap-4 pt-1"
              style={{ animation: 'slideUpFade 700ms 420ms both' }}
            >
              <Link href="/auth/register" className="btn btn-primary text-sm px-6 sm:px-8 py-3.5 sm:py-3 gap-2 justify-center">
                Start Free
                <ArrowRightIcon size={14} />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 text-[#8892A4] hover:text-[#F0F4FF]
                           font-display text-sm uppercase tracking-[0.15em] transition-all duration-200 group py-2"
              >
                Sign in
                <span className="group-hover:translate-x-1 transition-transform duration-200 text-[#F5A623]">→</span>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3" style={{ animation: 'slideUpFade 700ms 500ms both' }}>
              <div className="flex -space-x-2">
                {['AM', 'SC', 'JH', 'RK'].map((init) => (
                  <div
                    key={init}
                    className="w-7 h-7 rounded-full border-2 border-[#080A0F] flex items-center justify-center text-[8px] font-display font-bold"
                    style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(79,195,247,0.15))' }}
                  >
                    <span className="text-[#8892A4]">{init}</span>
                  </div>
                ))}
              </div>
              <p className="text-[#4A5568] text-xs font-display">
                Trusted by <span className="text-[#8892A4]">2,400+</span> competitive shooters
              </p>
            </div>
          </div>

          {/* Animated target — below copy on mobile */}
          <div
            className="flex items-center justify-center"
            style={{ animation: 'slideUpFade 700ms 250ms both' }}
          >
            <AnimatedHeroTarget />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to top, #080A0F, transparent)' }} />
    </section>
  );
}

// ── Animated Hero Target ──────────────────────────────────────────────────────

function AnimatedHeroTarget() {
  const [tick, setTick]             = useState(0);
  const [sweepAngle, setSweepAngle] = useState(0);

  const dots = [
    { x: 180, y: 174, score: 10.4 },
    { x: 193, y: 188, score: 9.8  },
    { x: 172, y: 196, score: 9.5  },
    { x: 186, y: 170, score: 10.7 },
    { x: 199, y: 183, score: 9.2  },
    { x: 175, y: 182, score: 10.1 },
  ];

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let frame: number;
    let start: number;
    const animate = (ts: number) => {
      if (!start) start = ts;
      setSweepAngle(((ts - start) / 4000) * 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const visibleDots = dots.filter((_, i) => tick > i);
  const avg  = visibleDots.length ? visibleDots.reduce((s, d) => s + d.score, 0) / visibleDots.length : null;
  const best = visibleDots.length ? Math.max(...visibleDots.map((d) => d.score)) : null;
  const mpiX = visibleDots.length ? visibleDots.reduce((s, d) => s + d.x, 0) / visibleDots.length : null;
  const mpiY = visibleDots.length ? visibleDots.reduce((s, d) => s + d.y, 0) / visibleDots.length : null;

  const rings = [76, 63, 50, 38, 28, 18, 10, 5];
  const cx = 183;
  const cy = 183;
  const sweepRad = (sweepAngle * Math.PI) / 180;
  const sweepX   = cx + 100 * Math.cos(sweepRad);
  const sweepY   = cy + 100 * Math.sin(sweepRad);

  const dotColor = (s: number) =>
    s >= 10.5 ? '#F5A623' : s >= 10.0 ? '#4FC3F7' : s >= 9.0 ? '#00E5A0' : '#FF4D6D';

  return (
    /* Outer wrapper constrains size and positions floating cards safely */
    <div className="relative w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[440px] mx-auto">

      {/* Floating cards — visible sm+ only to avoid horizontal overflow on mobile */}
      {avg !== null && (
        <div
          className="hidden sm:block absolute -top-3 -right-3 lg:-top-4 lg:-right-4 z-10 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(8,10,15,0.9)', border: '1px solid rgba(245,166,35,0.28)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', animation: 'floatY 3.5s ease-in-out infinite', minWidth: 88 }}
        >
          <p className="text-[#4A5568] text-[9px] font-display uppercase tracking-[0.14em] mb-0.5">Session Avg</p>
          <p className="font-jetbrains font-bold text-lg leading-none" style={{ color: '#F5A623' }}>{avg.toFixed(2)}</p>
        </div>
      )}

      {visibleDots.length >= 3 && (
        <div
          className="hidden sm:block absolute -bottom-2 -left-4 lg:-left-6 z-10 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(8,10,15,0.9)', border: '1px solid rgba(79,195,247,0.24)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', animation: 'floatY 4s ease-in-out 1.2s infinite', minWidth: 80 }}
        >
          <p className="text-[#4A5568] text-[9px] font-display uppercase tracking-[0.14em] mb-0.5">Shots</p>
          <p className="font-jetbrains font-bold text-lg leading-none text-[#4FC3F7]">{visibleDots.length}</p>
        </div>
      )}

      {best !== null && (
        <div
          className="hidden lg:block absolute top-1/2 -right-7 z-10 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(8,10,15,0.9)', border: '1px solid rgba(0,229,160,0.22)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', animation: 'floatY 5s ease-in-out 0.6s infinite', minWidth: 76 }}
        >
          <p className="text-[#4A5568] text-[9px] font-display uppercase tracking-[0.14em] mb-0.5">Best</p>
          <p className="font-jetbrains font-bold text-lg leading-none text-[#00E5A0]">{best.toFixed(1)}</p>
        </div>
      )}

      {/* SVG */}
      <svg
        viewBox="0 0 366 366"
        className="w-full"
        style={{ filter: 'drop-shadow(0 0 40px rgba(245,166,35,0.1)) drop-shadow(0 20px 48px rgba(0,0,0,0.7))' }}
      >
        <rect width="366" height="366" rx="16" fill="#0C0F1A" />
        <rect width="366" height="366" rx="16" fill="none" stroke="#1E2433" strokeWidth="1" />

        <defs>
          <pattern id="igrid" width="30" height="30" patternUnits="userSpaceOnUse" x={cx - 90} y={cy - 90}>
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1A2030" strokeWidth="0.4" />
          </pattern>
          <radialGradient id="iradarFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245,166,35,0.12)" />
            <stop offset="100%" stopColor="rgba(245,166,35,0)" />
          </radialGradient>
          <filter id="iglow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <rect x={cx - 90} y={cy - 90} width="180" height="180" fill="url(#igrid)" opacity="0.6" />

        {[...rings].reverse().map((r, ri) => {
          const idx = rings.length - 1 - ri;
          const isCore = idx <= 1;
          const isInner = idx <= 3;
          return (
            <circle key={r} cx={cx} cy={cy} r={r}
              fill={isCore ? 'rgba(245,166,35,0.09)' : isInner ? 'rgba(245,166,35,0.04)' : 'none'}
              stroke={isCore ? 'rgba(245,166,35,0.7)' : isInner ? 'rgba(245,166,35,0.35)' : '#1E2433'}
              strokeWidth={isCore ? 1 : 0.6}
              style={{ animation: `fadeIn 400ms ${ri * 60}ms both` }}
            />
          );
        })}

        {/* Radar sweep */}
        <circle cx={cx} cy={cy} r={100} fill="url(#iradarFade)" opacity={0.35}
          style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${sweepAngle}deg)` }} />
        <line x1={cx} y1={cy} x2={sweepX} y2={sweepY} stroke="rgba(245,166,35,0.55)" strokeWidth="1.2" filter="url(#iglow)" />

        {/* Crosshairs */}
        <line x1={cx - 95} y1={cy} x2={cx + 95} y2={cy} stroke="#1E2433" strokeWidth="0.5" strokeDasharray="4 5" />
        <line x1={cx} y1={cy - 95} x2={cx} y2={cy + 95} stroke="#1E2433" strokeWidth="0.5" strokeDasharray="4 5" />

        {/* Ring labels */}
        {[{ r: 63, label: '8' }, { r: 50, label: '9' }, { r: 38, label: '10' }].map(({ r, label }) => (
          <text key={label} x={cx + r + 4} y={cy + 4} fill="#2A3350" fontSize="7" fontFamily="Rajdhani, sans-serif" fontWeight="700">{label}</text>
        ))}

        {/* MPI */}
        {mpiX !== null && mpiY !== null && (
          <g opacity={0.75}>
            <line x1={mpiX - 14} y1={mpiY} x2={mpiX + 14} y2={mpiY} stroke="#4FC3F7" strokeWidth="0.9" />
            <line x1={mpiX} y1={mpiY - 14} x2={mpiX} y2={mpiY + 14} stroke="#4FC3F7" strokeWidth="0.9" />
            <circle cx={mpiX} cy={mpiY} r="4" fill="none" stroke="#4FC3F7" strokeWidth="0.9" />
          </g>
        )}

        {/* Shot dots */}
        {dots.map((d, i) => {
          const visible = tick > i;
          const c = dotColor(d.score);
          return (
            <g key={i} style={{ opacity: visible ? 1 : 0, transition: 'opacity 400ms ease' }}>
              <circle cx={d.x} cy={d.y} r={visible ? 5 : 0} fill={c} filter="url(#iglow)"
                style={visible ? { animation: 'dotPop 500ms cubic-bezier(0.16,1,0.3,1) both' } : {}} />
              {visible && (
                <circle cx={d.x} cy={d.y} r="5" fill="none" stroke={c} strokeWidth="1.5" opacity="0"
                  style={{ animation: 'pulseRing 800ms ease-out both' }} />
              )}
              <text x={d.x + 8} y={d.y + 3} fill={c} fontSize="7" fontFamily="JetBrains Mono, monospace" fontWeight="600"
                opacity={visible ? 0.85 : 0} style={{ transition: 'opacity 300ms' }}>
                {d.score}
              </text>
            </g>
          );
        })}

        {/* Stats bar */}
        <rect x="8" y="294" width="350" height="64" rx="8" fill="#060810" opacity="0.95" />
        <rect x="8" y="294" width="350" height="64" rx="8" fill="none" stroke="#1E2433" strokeWidth="0.7" />
        <line x1="8" y1="294" x2="358" y2="294" stroke="rgba(245,166,35,0.25)" strokeWidth="0.7" />

        {[
          { x: 38,  label: 'AVG',   value: avg  !== null ? avg.toFixed(2)  : '—', color: '#F5A623' },
          { x: 128, label: 'SHOTS', value: String(visibleDots.length),             color: '#4FC3F7' },
          { x: 215, label: 'BEST',  value: best !== null ? best.toFixed(1) : '—', color: '#00E5A0' },
          { x: 298, label: 'MPI',   value: mpiX !== null ? 'LIVE' : '—',           color: '#F5A623' },
        ].map(({ x, label, value, color }) => (
          <g key={label}>
            <text x={x} y="314" fill="#4A5568" fontSize="7" fontFamily="Rajdhani, sans-serif" fontWeight="600" letterSpacing="0.12em">{label}</text>
            <text x={x} y="334" fill={color} fontSize="15" fontFamily="JetBrains Mono, monospace" fontWeight="700">{value}</text>
          </g>
        ))}

        <rect width="366" height="366" rx="16" fill="none" stroke="rgba(245,166,35,0.05)" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ── Discipline Marquee ────────────────────────────────────────────────────────

function DisciplineMarquee() {
  const disciplines = [
    'Air Rifle 10m', 'Air Pistol 10m', '.22 LR Smallbore', 'Biathlon',
    'Olympic Trap', 'Skeet', 'Sporting Clays', 'ISSF Prone', 'Standing',
    'Kneeling', '50m Rifle', '300m Rifle', 'Rapid Fire Pistol',
  ];

  return (
    <div
      className="relative overflow-hidden py-3 sm:py-4"
      style={{ background: 'linear-gradient(90deg, #080A0F 0%, #0C0F1A 50%, #080A0F 100%)', borderTop: '1px solid #1E2433', borderBottom: '1px solid #1E2433' }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #080A0F, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, #080A0F, transparent)' }} />

      <div className="flex gap-8 sm:gap-10 whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite' }}>
        {[...disciplines, ...disciplines].map((d, i) => (
          <span
            key={i}
            className="text-[#4A5568] font-display text-[9px] sm:text-[10px] uppercase
                       tracking-[0.16em] sm:tracking-[0.18em] flex-shrink-0 flex items-center gap-2 sm:gap-3"
          >
            <span className="w-1 h-1 rounded-full flex-shrink-0"
              style={{ background: i % 3 === 0 ? '#F5A623' : i % 3 === 1 ? '#4FC3F7' : '#00E5A0', opacity: 0.5 }} />
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Live Stats Counter ────────────────────────────────────────────────────────

function useCountUp(target: number, duration: number, active: boolean): number {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const ease = 1 - Math.pow(1 - Math.min((ts - start) / duration, 1), 3);
      setCount(Math.floor(ease * target));
      if (ease < 1) raf.current = requestAnimationFrame(step);
      else setCount(target);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, active]);

  return count;
}

function StatItem({ value, suffix, label, color, active, duration }: {
  value: number; suffix: string; label: string; color: string; active: boolean; duration: number;
}) {
  const count = useCountUp(value, duration, active);
  return (
    <div className="flex flex-col items-center text-center group px-2">
      <div
        className="font-jetbrains font-black leading-none"
        style={{ fontSize: 'clamp(1.9rem, 7vw, 3.8rem)', color, filter: active ? `drop-shadow(0 0 16px ${color}40)` : 'none', transition: 'filter 300ms' }}
      >
        {count.toLocaleString()}{suffix}
      </div>
      <p className="text-[#4A5568] font-display text-[9px] sm:text-[10px] uppercase tracking-[0.18em] mt-2 sm:mt-3">
        {label}
      </p>
      <div
        className="h-px mt-2 sm:mt-3 w-0 group-hover:w-full transition-all duration-700"
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
      />
    </div>
  );
}

function LiveStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setActive(true); },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="py-12 sm:py-16 lg:py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #080A0F 0%, #0C0F1A 40%, #0C0F1A 60%, #080A0F 100%)' }}
    >
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(245,166,35,0.2) 50%, transparent 90%)' }} />
      <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(79,195,247,0.15) 50%, transparent 90%)' }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          <StatItem value={2400} suffix="+"      label="Active Shooters"      color="#F5A623" active={active} duration={1800} />
          <StatItem value={847}  suffix="K+"     label="Shots Logged"         color="#4FC3F7" active={active} duration={2000} />
          <StatItem value={12}   suffix=" types" label="Disciplines Tracked"  color="#00E5A0" active={active} duration={1400} />
          <StatItem value={98}   suffix="%"      label="Coach Satisfaction"   color="#F5A623" active={active} duration={1600} />
        </div>
      </div>
    </section>
  );
}

// ── Bento Features ────────────────────────────────────────────────────────────

const FEATURES = [
  { id: 'canvas',    icon: <TargetIcon />,    color: '#F5A623', glow: 'rgba(245,166,35,0.12)',  title: 'Interactive Target Canvas', desc: 'Click directly on a rendered target to log shot placement. Scores calculate automatically using ISSF 10-ring thresholds.' },
  { id: 'cv',        icon: <CameraIcon />,    color: '#4FC3F7', glow: 'rgba(79,195,247,0.1)',   title: 'Computer Vision',           desc: 'Photograph paper targets. The vision service detects hole positions, computes scores, and maps them to your shot record.' },
  { id: 'analytics', icon: <ChartLineIcon />, color: '#00E5A0', glow: 'rgba(0,229,160,0.1)',    title: 'Deep Analytics',            desc: 'Session trends, MPI, group radius, standard deviation, fatigue index, and focus score — all visualised in real time.' },
  { id: 'coach',     icon: <CoachIcon />,     color: '#4FC3F7', glow: 'rgba(79,195,247,0.1)',   title: 'Coach Connection',          desc: 'Coaches gain read access to full session history and can leave timestamped feedback on any shot.' },
  { id: 'ai',        icon: <SparkleIcon />,   color: '#F5A623', glow: 'rgba(245,166,35,0.12)',  title: 'AI Training Plan',          desc: 'Groq Llama 3.3-powered personalised 4-week plans generated from your fatigue index, focus score, and outlier patterns.' },
  { id: 'import',    icon: <ImportIcon />,    color: '#00E5A0', glow: 'rgba(0,229,160,0.1)',    title: 'Multi-format Import',       desc: 'Import from CSV, JSON, or electronic target systems. Scores and positions normalised automatically.' },
];

function BentoCard({ feature, idx }: { feature: typeof FEATURES[0]; idx: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group relative rounded-2xl border overflow-hidden"
      style={{
        background: '#0C0F1A',
        borderColor: '#1E2433',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 600ms ${idx * 60}ms, transform 600ms ${idx * 60}ms cubic-bezier(0.16,1,0.3,1), border-color 300ms, box-shadow 300ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = `${feature.color}40`;
        el.style.boxShadow   = `0 12px 48px -8px ${feature.color}28, 0 4px 24px rgba(0,0,0,0.5)`;
        el.style.transform   = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = '#1E2433';
        el.style.boxShadow   = 'none';
        el.style.transform   = 'translateY(0)';
      }}
    >
      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${feature.color}, transparent)` }} />

      {/* Corner glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 15% 15%, ${feature.glow} 0%, transparent 60%)` }} />

      <div className="relative p-5 sm:p-6 lg:p-7 flex flex-col h-full">
        {/* Icon */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 mb-4 sm:mb-5"
          style={{ background: feature.glow, color: feature.color }}>
          {feature.icon}
        </div>

        <h3 className="font-display font-bold text-[#F0F4FF] text-sm sm:text-base tracking-wide mb-2">
          {feature.title}
        </h3>
        <p className="text-[#8892A4] text-sm leading-relaxed flex-1">{feature.desc}</p>

        {/* Bottom colour tick */}
        <div className="mt-4 sm:mt-5 h-px w-8 opacity-40 group-hover:w-full group-hover:opacity-60 transition-all duration-500"
          style={{ background: `linear-gradient(90deg, ${feature.color}, transparent)` }} />
      </div>
    </div>
  );
}

function BentoFeatures() {
  return (
    <section id="features" className="py-14 sm:py-20 lg:py-32 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-10 sm:mb-14 lg:mb-16">
        <p className="text-[#F5A623] font-display text-[9px] sm:text-[10px] uppercase tracking-[0.25em] mb-3 sm:mb-4">
          Platform Features
        </p>
        <h2
          className="font-display font-black text-[#F0F4FF] leading-[1.05]"
          style={{ fontSize: 'clamp(1.7rem, 6vw, 3.2rem)' }}
        >
          Everything a competitive shooter needs
        </h2>
        <p className="text-[#8892A4] mt-3 sm:mt-4 max-w-lg mx-auto text-sm leading-relaxed px-4 sm:px-0">
          From first session to elite performance — Marksman covers the full training loop.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {FEATURES.map((f, i) => <BentoCard key={f.id} feature={f} idx={i} />)}
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

const STEPS = [
  { num: '01', title: 'Create your account',    desc: 'Register as a shooter, soldier, or coach in under 60 seconds. No credit card required.',                                                                           color: '#F5A623', glow: 'rgba(245,166,35,0.2)'  },
  { num: '02', title: 'Log your first session', desc: 'Click on the target canvas, upload a photo, or import from a file. Scores computed automatically.',                                                               color: '#4FC3F7', glow: 'rgba(79,195,247,0.18)' },
  { num: '03', title: 'Analyse & improve',      desc: 'Review fatigue curves, MPI, outlier shots, and AI training plans. Track the gap to your personal best.', color: '#00E5A0', glow: 'rgba(0,229,160,0.16)'  },
];

function HowItWorks() {
  const ref    = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) [0, 1, 2].forEach((i) => setTimeout(() => setActive(i), i * 180)); },
      { threshold: 0.2 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      className="py-14 sm:py-20 lg:py-32 relative"
      style={{ background: 'linear-gradient(180deg, #080A0F 0%, #0C0F1A 30%, #0C0F1A 70%, #080A0F 100%)', borderTop: '1px solid #1E2433', borderBottom: '1px solid #1E2433' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14 lg:mb-20">
          <p className="text-[#F5A623] font-display text-[9px] sm:text-[10px] uppercase tracking-[0.25em] mb-3 sm:mb-4">
            Get started in minutes
          </p>
          <h2
            className="font-display font-black text-[#F0F4FF]"
            style={{ fontSize: 'clamp(1.7rem, 6vw, 3.2rem)' }}
          >
            How it works
          </h2>
        </div>

        <div ref={ref} className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-8">
          {/* Connector — desktop only */}
          <div
            className="hidden sm:block absolute"
            style={{
              top: 36,
              left: 'calc(16.67% + 2.5rem)',
              right: 'calc(16.67% + 2.5rem)',
              height: 1,
              background: 'linear-gradient(90deg, #F5A623 0%, #4FC3F7 50%, #00E5A0 100%)',
              opacity: active >= 2 ? 0.55 : 0,
              transition: 'opacity 800ms 400ms',
            }}
          />

          {/* Mobile vertical connector */}
          <div
            className="sm:hidden absolute left-[34px] top-[72px] w-px"
            style={{
              bottom: 36,
              background: 'linear-gradient(180deg, #F5A623 0%, #4FC3F7 50%, #00E5A0 100%)',
              opacity: active >= 2 ? 0.4 : 0,
              transition: 'opacity 800ms 400ms',
            }}
          />

          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className="relative flex flex-col sm:items-center sm:text-center"
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '1rem' }}
            >
              {/* On mobile: horizontal layout — circle + text side by side */}
              <div className="sm:hidden flex flex-row items-start gap-4 w-full">
                <div
                  className="w-[68px] h-[68px] rounded-full border-2 flex items-center justify-center z-10 shrink-0"
                  style={{
                    background: '#0C0F1A',
                    borderColor: s.color,
                    boxShadow: active >= i ? `0 0 24px ${s.glow}` : 'none',
                    opacity: active >= i ? 1 : 0,
                    transform: active >= i ? 'scale(1)' : 'scale(0.8)',
                    transition: `all 500ms ${i * 150}ms`,
                  }}
                >
                  <span className="font-display font-black text-xl" style={{ color: s.color }}>{s.num}</span>
                </div>
                <div
                  className="flex-1 pt-2"
                  style={{ opacity: active >= i ? 1 : 0, transform: active >= i ? 'translateX(0)' : 'translateX(12px)', transition: `all 500ms ${i * 150 + 80}ms` }}
                >
                  <h3 className="font-display font-bold text-[#F0F4FF] text-base mb-1.5">{s.title}</h3>
                  <p className="text-[#8892A4] text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>

              {/* On desktop: vertical stacked layout */}
              <div
                className="hidden sm:flex sm:flex-col sm:items-center sm:text-center w-full"
                style={{ opacity: active >= i ? 1 : 0, transform: active >= i ? 'translateY(0)' : 'translateY(24px)', transition: `all 600ms ${i * 180}ms cubic-bezier(0.16,1,0.3,1)` }}
              >
                <div
                  className="w-[72px] h-[72px] rounded-full border-2 flex items-center justify-center z-10 mb-6"
                  style={{ background: '#0C0F1A', borderColor: s.color, boxShadow: active >= i ? `0 0 28px ${s.glow}` : 'none', transition: 'box-shadow 600ms' }}
                >
                  <span className="font-display font-black text-2xl" style={{ color: s.color }}>{s.num}</span>
                </div>
                <h3 className="font-display font-bold text-[#F0F4FF] text-lg mb-3">{s.title}</h3>
                <p className="text-[#8892A4] text-sm leading-relaxed max-w-[220px]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Coach Section ─────────────────────────────────────────────────────────────

function CoachSection() {
  return (
    <section id="coaches" className="py-14 sm:py-20 lg:py-32 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">

        {/* Visual — shown second on mobile, first on desktop */}
        <div className="order-2 lg:order-1">
          <CoachVisual />
        </div>

        {/* Copy — shown first on mobile */}
        <div className="order-1 lg:order-2 space-y-5 sm:space-y-6 lg:space-y-7">
          <p className="text-[#4FC3F7] font-display text-[9px] sm:text-[10px] uppercase tracking-[0.25em]">
            For Coaches
          </p>
          <h2
            className="font-display font-black text-[#F0F4FF] leading-[1.05]"
            style={{ fontSize: 'clamp(1.7rem, 6vw, 3rem)' }}
          >
            The bridge between data and improvement
          </h2>
          <p className="text-[#8892A4] leading-relaxed text-sm sm:text-base">
            Coaches search for shooters by email and send connection requests.
            Once approved, coaches gain full read access to session history and
            can leave timestamped feedback on any individual shot.
          </p>

          <ul className="space-y-3 sm:space-y-4">
            {[
              { sym: '↗', color: '#4FC3F7', text: 'Browse full sessions with shot-level detail' },
              { sym: '✦', color: '#F5A623', text: 'Post timestamped feedback on any session' },
              { sym: '⊕', color: '#00E5A0', text: 'Manage multiple shooters from one dashboard' },
              { sym: '◎', color: '#4FC3F7', text: 'Real-time WebSocket notifications on new sessions' },
            ].map(({ sym, color, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold mt-0.5"
                  style={{ background: `${color}12`, color }}
                >{sym}</span>
                <span className="text-[#8892A4] text-sm">{text}</span>
              </li>
            ))}
          </ul>

          <div className="pt-1">
            <Link href="/auth/register" className="btn btn-primary inline-flex text-sm py-3 px-6">
              Join as Coach
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoachVisual() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-4 sm:p-6"
      style={{ background: '#0C0F1A', border: '1px solid #1E2433', boxShadow: '0 20px 60px rgba(0,0,0,0.55)' }}
    >
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #4FC3F7, transparent)' }} />

      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <p className="font-display font-bold text-[#F0F4FF] text-sm uppercase tracking-[0.12em]">Your Shooters</p>
        <span className="text-[9px] font-display uppercase tracking-[0.1em] px-2 py-1 rounded-md"
          style={{ color: '#4FC3F7', background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)' }}>
          3 Connected
        </span>
      </div>

      {[
        { name: 'Alex Morgan', avg: '9.84',  trend: '+0.12', pos: 'Standing', shots: 48, up: true  },
        { name: 'Sam Chen',    avg: '10.21', trend: '+0.35', pos: 'Prone',    shots: 60, up: true  },
        { name: 'Jordan Hill', avg: '9.57',  trend: '−0.08', pos: 'Kneeling', shots: 30, up: false },
      ].map((s) => (
        <div
          key={s.name}
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl mb-2 border transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, rgba(79,195,247,0.12), rgba(245,166,35,0.06))', color: '#4FC3F7', border: '1px solid rgba(79,195,247,0.15)' }}>
            {s.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#F0F4FF] text-sm font-medium truncate">{s.name}</p>
            <p className="text-[#4A5568] text-[10px] font-display uppercase tracking-wide mt-0.5">
              {s.pos} · {s.shots} shots
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-jetbrains text-[#F5A623] font-bold text-sm">{s.avg}</p>
            <p className="text-[10px] font-display font-bold mt-0.5" style={{ color: s.up ? '#00E5A0' : '#FF4D6D' }}>{s.trend}</p>
          </div>
        </div>
      ))}

      <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl"
        style={{ background: 'rgba(79,195,247,0.04)', border: '1px solid rgba(79,195,247,0.12)' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FC3F7] flex-shrink-0" style={{ animation: 'pulseGlowBlue 2s ease-in-out infinite' }} />
          <p className="text-[#4FC3F7] text-[9px] sm:text-[10px] font-display uppercase tracking-[0.16em]">
            New feedback · Alex's session
          </p>
        </div>
        <p className="text-[#8892A4] text-xs leading-relaxed italic">
          "Good trigger discipline today. Focus on hold area — still drifting right before release."
        </p>
      </div>
    </div>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────

function CtaBanner() {
  return (
    <section className="py-14 sm:py-20 lg:py-32 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#1E2433 1px, transparent 1px), linear-gradient(90deg, #1E2433 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,166,35,0.07) 0%, transparent 70%)' }} />
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(245,166,35,0.22) 50%, transparent 90%)' }} />
      <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(245,166,35,0.12) 50%, transparent 90%)' }} />

      <div className="relative max-w-2xl mx-auto text-center space-y-6 sm:space-y-8">
        {/* Crosshair icon */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full -m-3" style={{ border: '1px solid rgba(245,166,35,0.25)', animation: 'radarPing 3s cubic-bezier(0,0,0.2,1) infinite' }} />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.28)' }}>
              <CrosshairLogo size={26} />
            </div>
          </div>
        </div>

        <h2
          className="font-display font-black text-[#F0F4FF] leading-[1.05] px-2"
          style={{ fontSize: 'clamp(1.7rem, 7vw, 3.5rem)' }}
        >
          Ready to track your{' '}
          <span className="gradient-text">next session?</span>
        </h2>

        <p className="text-[#8892A4] text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          Join the platform built for shooters who take training seriously.
          Free to start. Data stays yours.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0">
          <Link href="/auth/register" className="btn btn-primary text-sm px-8 py-3.5 justify-center">
            Create Account — Free
          </Link>
          <Link href="/auth/login" className="btn btn-ghost text-sm px-8 py-3.5 justify-center">
            Sign In
          </Link>
        </div>

        <p className="text-[#4A5568] text-[10px] font-display uppercase tracking-[0.15em]">
          No credit card · Setup in 60 seconds · Cancel anytime
        </p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear();

  const cols = [
    {
      heading: 'Platform',
      links: [
        { label: 'Features',     href: '#features' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'For Coaches',  href: '#coaches' },
        { label: 'Analytics',    href: '/analytics' },
      ],
    },
    {
      heading: 'Account',
      links: [
        { label: 'Sign In',   href: '/auth/login' },
        { label: 'Register',  href: '/auth/register' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Sessions',  href: '/sessions' },
      ],
    },
    {
      heading: 'Training',
      links: [
        { label: 'Performance',     href: '/performance' },
        { label: 'Training Plan',   href: '/performance/training-plan' },
        { label: 'Stance Analysis', href: '/performance/pose' },
        { label: 'AI Coach',        href: '/ai-coach' },
      ],
    },
  ];

  return (
    <footer style={{ borderTop: '1px solid #1E2433', background: 'linear-gradient(180deg, #0C0F1A 0%, #080A0F 100%)' }}>
      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.22) 30%, rgba(79,195,247,0.15) 70%, transparent 100%)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
        {/* Brand row — full width on mobile */}
        <div className="mb-8 sm:mb-10 lg:hidden">
          <div className="flex items-center gap-3 mb-4">
            <CrosshairLogo size={24} />
            <div className="flex flex-col leading-none">
              <span className="font-display font-black text-[13px] tracking-[0.2em] uppercase text-[#F0F4FF]">Marksman</span>
              <span className="font-display text-[7px] tracking-[0.22em] uppercase text-[#F5A623] opacity-60 mt-0.5">Precision Analytics</span>
            </div>
          </div>
          <p className="text-[#4A5568] text-xs leading-relaxed max-w-xs">
            The complete training analytics platform for competitive shooters and coaches.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" style={{ animation: 'pulseGlowGreen 2.5s ease-in-out infinite' }} />
            <span className="text-[#4A5568] text-[10px] font-display uppercase tracking-[0.12em]">All systems operational</span>
          </div>
        </div>

        {/* Main grid: 2-col on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-8 lg:gap-10">

          {/* Brand column — desktop only */}
          <div className="hidden lg:flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <CrosshairLogo size={26} />
              <div className="flex flex-col leading-none">
                <span className="font-display font-black text-[14px] tracking-[0.2em] uppercase text-[#F0F4FF]">Marksman</span>
                <span className="font-display text-[7px] tracking-[0.22em] uppercase text-[#F5A623] opacity-60 mt-0.5">Precision Analytics</span>
              </div>
            </div>
            <p className="text-[#4A5568] text-xs leading-relaxed">
              The complete training analytics platform for competitive shooters and coaches.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" style={{ animation: 'pulseGlowGreen 2.5s ease-in-out infinite' }} />
              <span className="text-[#4A5568] text-[10px] font-display uppercase tracking-[0.12em]">All systems operational</span>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3 sm:gap-4">
              <p className="font-display text-[10px] sm:text-[10px] uppercase tracking-[0.2em] text-[#F0F4FF] font-bold">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2.5 sm:gap-3">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[#4A5568] hover:text-[#8892A4] text-xs font-display uppercase
                                 tracking-[0.1em] transition-colors duration-200 inline-flex items-center gap-1.5 group
                                 active:text-[#F5A623]"
                    >
                      <span className="w-0 h-px bg-[#F5A623] transition-all duration-300 group-hover:w-3" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t px-4 sm:px-6 py-4 sm:py-5" style={{ borderColor: '#181E2E' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#252E42] text-[10px] font-display tracking-widest uppercase">
            © {year} Marksman · Built for precision
          </p>
          <div className="flex items-center gap-5 sm:gap-6">
            {['Privacy', 'Terms', 'Docs'].map((item) => (
              <Link
                key={item}
                href={item === 'Docs' ? '/docs' : '#'}
                className="text-[#252E42] hover:text-[#4A5568] text-[10px] font-display
                           uppercase tracking-[0.14em] transition-colors duration-200 touch-target flex items-center"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CrosshairLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="10" stroke="#F5A623" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="5"  stroke="#F5A623" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="2"  fill="#F5A623" />
      <line x1="16" y1="2"  x2="16" y2="8"  stroke="#F5A623" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="16" y1="24" x2="16" y2="30" stroke="#F5A623" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="2"  y1="16" x2="8"  y2="16" stroke="#F5A623" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="24" y1="16" x2="30" y2="16" stroke="#F5A623" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="2" y1="7" x2="12" y2="7" />
      <polyline points="8,3 12,7 8,11" />
    </svg>
  );
}

function TargetIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="8" /><circle cx="10" cy="10" r="4.5" /><circle cx="10" cy="10" r="1.8" fill="currentColor" stroke="none" /></svg>;
}

function CameraIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="6" width="16" height="12" rx="2" /><circle cx="10" cy="12" r="3" /><path d="M7 6l1.5-2.5h3L13 6" /></svg>;
}

function ChartLineIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,15 6,9 11,12 17,5" /><line x1="2" y1="18" x2="18" y2="18" /></svg>;
}

function CoachIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="7" r="3" /><path d="M2 18c0-4 2.7-6 6-6s6 2 6 6" /><path d="M14 5l2 2 3-3" /></svg>;
}

function ImportIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5" /><polyline points="15,3 17,5 12,10" /><line x1="10" y1="10" x2="17" y2="3" /></svg>;
}

function SparkleIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18M4 4l1.8 1.8M14.2 14.2L16 16M4 16l1.8-1.8M14.2 5.8L16 4" /><circle cx="10" cy="10" r="3" fill="currentColor" stroke="none" opacity="0.8" /></svg>;
}
