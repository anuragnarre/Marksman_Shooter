'use client';

// apps/web/app/page.tsx — Marksman Landing Page
// Design base: GitHub 2026 aurora aesthetic — deep void, shifting colour orbs,
// bold display type, glass product windows, premium spacing.

import { useEffect, useRef, useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/auth-context';
import { useTheme } from '../contexts/theme-context';
import { useRouter } from 'next/navigation';

// Theme context shared by all sections on this page
const PageTheme = createContext<boolean>(true); // true = dark
function usePageTheme() { return useContext(PageTheme); }

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useSectionReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null!);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, vis] as const;
}

function useCounter(target: number, active: boolean, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let v = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      v = Math.min(v + step, target);
      setVal(Math.round(v));
      if (v >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [active, target, duration]);
  return val;
}

// ── Deterministic shot data (SSR-safe — no Math.random) ──────────────────────

const HERO_SHOTS = [
  { cx: 50.4, cy: 49.2, score: 10.9, r: '#F5A623' },
  { cx: 49.1, cy: 50.8, score: 10.7, r: '#F5A623' },
  { cx: 51.2, cy: 48.6, score: 10.6, r: '#F5A623' },
  { cx: 48.8, cy: 51.4, score: 10.4, r: '#4FC3F7' },
  { cx: 50.9, cy: 50.5, score: 10.8, r: '#F5A623' },
  { cx: 49.6, cy: 49.0, score: 10.2, r: '#4FC3F7' },
  { cx: 51.8, cy: 51.1, score: 10.1, r: '#4FC3F7' },
  { cx: 47.9, cy: 48.7, score:  9.9, r: '#00E5A0' },
];

const TABLE_SHOTS = [
  { n:  1, score: 10.3, x: -1.2, y:  0.8 },
  { n:  2, score: 10.6, x:  0.3, y: -0.4 },
  { n:  3, score: 10.8, x: -0.6, y:  0.2 },
  { n:  4, score: 10.1, x:  1.8, y: -1.1 },
  { n:  5, score: 10.7, x: -0.1, y:  0.6 },
  { n:  6, score: 10.9, x:  0.4, y: -0.3 },
  { n:  7, score: 10.4, x: -0.8, y:  0.9 },
  { n:  8, score: 10.2, x:  1.1, y: -0.7 },
];

// ── Entry Point ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user }  = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const router    = useRouter();
  const [mounted, setMounted]     = useState(false);
  const [navSolid, setNavSolid]   = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && user) router.replace('/dashboard'); }, [user, mounted, router]);
  useEffect(() => {
    const h = () => setNavSolid(window.scrollY > 60);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  if (!mounted || user) return <PageLoader />;

  const isDark = resolvedTheme !== 'light';
  const pageBg   = isDark ? '#060810' : '#F4F6FB';
  const pageText  = isDark ? '#F0F4FF' : '#0E1118';
  const navBgSolid = isDark ? 'rgba(6,8,16,0.92)' : 'rgba(244,246,251,0.92)';
  const navBorderSolid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  return (
    <PageTheme.Provider value={isDark}>
    <div style={{ background: pageBg, color: pageText, overflowX: 'hidden', transition: 'background 0.4s, color 0.4s' }}>

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={{
          height: 64,
          background: navSolid ? navBgSolid : 'transparent',
          backdropFilter: navSolid ? 'blur(20px) saturate(160%)' : 'none',
          borderBottom: navSolid ? `1px solid ${navBorderSolid}` : '1px solid transparent',
        }}
      >
        <div className="max-w-[1280px] mx-auto h-full flex items-center justify-between px-5 sm:px-8 lg:px-12">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <CrosshairLogo size={26} />
            <span className="font-display font-black text-[17px] tracking-[0.2em] uppercase" style={{ color: pageText }}>
              Marksman
            </span>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {[['Features', '#features'], ['Analytics', '#analytics'], ['AI Coach', '#ai-coach'], ['How it works', '#how']].map(([label, href]) => (
              <a key={label} href={href}
                className="text-[13px] font-display font-semibold uppercase tracking-[0.07em] transition-colors duration-200"
                style={{ color: isDark ? 'rgba(240,244,255,0.45)' : 'rgba(14,17,24,0.45)' }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = pageText; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = isDark ? 'rgba(240,244,255,0.45)' : 'rgba(14,17,24,0.45)'; }}
              >{label}</a>
            ))}
          </div>

          {/* Auth CTAs */}
          <div className="flex items-center gap-2.5">

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 active:scale-90 shrink-0"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                color: isDark ? 'rgba(240,244,255,0.6)' : 'rgba(14,17,24,0.55)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.1)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,166,35,0.35)';
                (e.currentTarget as HTMLElement).style.color = '#F5A623';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
                (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(240,244,255,0.6)' : 'rgba(14,17,24,0.55)';
              }}
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolvedTheme === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <Link href="/auth/login"
              className="hidden sm:block text-[13px] font-display font-semibold px-4 py-2 rounded-lg transition-all duration-200"
              style={{ color: isDark ? 'rgba(240,244,255,0.55)' : 'rgba(14,17,24,0.55)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = pageText; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(240,244,255,0.55)' : 'rgba(14,17,24,0.55)'; }}
            >Sign in</Link>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-display font-bold uppercase tracking-[0.07em] transition-all duration-200 active:scale-95"
              style={{
                background: 'rgba(245,166,35,0.12)',
                border: '1px solid rgba(245,166,35,0.35)',
                color: '#F5A623',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.2)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,166,35,0.6)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.12)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,166,35,0.35)';
              }}
            >Get started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <StatsStrip />

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <FeaturesSection />

      {/* ── Roles ───────────────────────────────────────────────────────────── */}
      <RolesSection />

      {/* ── Analytics showcase ──────────────────────────────────────────────── */}
      <AnalyticsShowcase />

      {/* ── AI Coach ────────────────────────────────────────────────────────── */}
      <AICoachSection />

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <CTASection />

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <Footer />

    </div>
    </PageTheme.Provider>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// GitHub-aurora aesthetic: deep void + shifting colour orbs + product window
// ═════════════════════════════════════════════════════════════════════════════

const HERO_PARTICLES = [
  { x: 12, y: 18, s: 3, c: '#F5A623', d: '0s',   dur: '6s'   },
  { x: 28, y: 72, s: 2, c: '#4FC3F7', d: '1.2s', dur: '8s'   },
  { x: 45, y: 35, s: 2, c: '#00E5A0', d: '2.4s', dur: '7s'   },
  { x: 62, y: 58, s: 3, c: '#F5A623', d: '0.6s', dur: '9s'   },
  { x: 78, y: 22, s: 2, c: '#4FC3F7', d: '3.1s', dur: '6.5s' },
  { x: 88, y: 80, s: 2, c: '#00E5A0', d: '1.8s', dur: '7.5s' },
  { x: 8,  y: 55, s: 2, c: '#F5A623', d: '4.0s', dur: '8.5s' },
  { x: 35, y: 90, s: 3, c: '#4FC3F7', d: '2.0s', dur: '6s'   },
  { x: 55, y: 12, s: 2, c: '#F5A623', d: '1.5s', dur: '9.5s' },
  { x: 72, y: 45, s: 2, c: '#00E5A0', d: '3.6s', dur: '7s'   },
  { x: 18, y: 40, s: 2, c: '#4FC3F7', d: '0.9s', dur: '8s'   },
  { x: 92, y: 38, s: 3, c: '#F5A623', d: '2.7s', dur: '6.5s' },
  { x: 40, y: 65, s: 2, c: '#00E5A0', d: '4.5s', dur: '9s'   },
  { x: 68, y: 88, s: 2, c: '#4FC3F7', d: '1.1s', dur: '7.5s' },
  { x: 25, y: 8,  s: 2, c: '#F5A623', d: '3.3s', dur: '8s'   },
  { x: 82, y: 62, s: 3, c: '#00E5A0', d: '0.4s', dur: '6s'   },
  { x: 52, y: 78, s: 2, c: '#4FC3F7', d: '2.2s', dur: '9s'   },
  { x: 15, y: 85, s: 2, c: '#F5A623', d: '4.8s', dur: '7s'   },
  { x: 75, y: 10, s: 2, c: '#00E5A0', d: '1.7s', dur: '8.5s' },
  { x: 38, y: 50, s: 3, c: '#4FC3F7', d: '3.9s', dur: '6s'   },
];

function HeroSection() {
  const isDark = usePageTheme();
  const textPri  = isDark ? '#F0F4FF' : '#0E1118';
  const textMut  = isDark ? 'rgba(240,244,255,0.55)'  : 'rgba(14,17,24,0.6)';
  const textDim  = isDark ? 'rgba(240,244,255,0.4)'   : 'rgba(14,17,24,0.45)';
  const dotGrid  = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.05)';
  const scrollBd = isDark ? 'rgba(255,255,255,0.15)'  : 'rgba(0,0,0,0.15)';
  const secBtnBg = isDark ? 'rgba(240,244,255,0.04)'  : 'rgba(0,0,0,0.04)';
  const secBtnBd = isDark ? 'rgba(240,244,255,0.1)'   : 'rgba(0,0,0,0.1)';
  const secBtnTx = isDark ? 'rgba(240,244,255,0.6)'   : 'rgba(14,17,24,0.6)';

  return (
    <section
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ minHeight: '100dvh', paddingTop: 64 }}
    >
      {/* ── Aurora background ─── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">

        {/* Dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, ${dotGrid} 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        {/* Primary aurora — amber/gold */}
        <div className="absolute" style={{
          top: '5%', left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(245,166,35,0.13) 0%, rgba(245,166,35,0.05) 35%, transparent 65%)',
          filter: 'blur(40px)',
          animation: 'breathe 8s ease-in-out infinite',
        }} />

        {/* Secondary aurora — blue */}
        <div className="absolute" style={{
          bottom: '10%', right: '5%',
          width: '600px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(79,195,247,0.08) 0%, transparent 60%)',
          filter: 'blur(50px)',
          animation: 'breathe 11s ease-in-out 3s infinite',
        }} />

        {/* Tertiary aurora — green */}
        <div className="absolute" style={{
          top: '30%', left: '-5%',
          width: '500px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(0,229,160,0.06) 0%, transparent 60%)',
          filter: 'blur(60px)',
          animation: 'breathe 14s ease-in-out 6s infinite',
        }} />

        {/* Horizontal scan line */}
        <div className="absolute inset-x-0 top-0 h-px" style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.3) 30%, rgba(79,195,247,0.2) 60%, transparent 100%)',
          top: 64,
        }} />

        {/* Floating particles */}
        {HERO_PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none" style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.s, height: p.s,
            background: p.c,
            opacity: 0.45,
            boxShadow: `0 0 ${p.s * 3}px ${p.c}80`,
            animation: `floatY ${p.dur} ease-in-out ${p.d} infinite`,
          }} />
        ))}

        {/* Radar ping rings */}
        <div className="absolute pointer-events-none" style={{
          bottom: '15%', right: '25%',
          width: 200, height: 200,
          borderRadius: '50%',
          border: '1px solid rgba(245,166,35,0.15)',
          animation: 'radarPing 3s cubic-bezier(0,0,0.2,1) infinite',
        }} />
        <div className="absolute pointer-events-none" style={{
          bottom: '15%', right: '25%',
          width: 200, height: 200,
          borderRadius: '50%',
          border: '1px solid rgba(79,195,247,0.12)',
          animation: 'radarPing 3s cubic-bezier(0,0,0.2,1) 1.5s infinite',
        }} />

        {/* Moving scan line sweep */}
        <div className="absolute inset-x-0 h-px pointer-events-none" style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.4) 50%, transparent 100%)',
          animation: 'scanLine 8s linear infinite',
          opacity: 0.6,
        }} />
      </div>

      {/* ── Main content ─── */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center">

          {/* ── Left: text ── */}
          <div>
            {/* Trust badge */}
            <div
              className="inline-flex items-center gap-2.5 mb-7 px-3.5 py-1.5 rounded-full"
              style={{
                background: 'rgba(245,166,35,0.08)',
                border: '1px solid rgba(245,166,35,0.22)',
                animation: 'fadeIn 500ms both',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F5A623' }} />
              <span className="text-[11px] font-display font-bold uppercase tracking-[0.15em]" style={{ color: '#F5A623' }}>
                Trusted by 12 national teams
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-display font-black leading-[1.03] tracking-[-0.015em] mb-6"
              style={{ fontSize: 'clamp(2.6rem, 5.8vw, 4.2rem)', animation: 'slideUp 600ms 80ms both' }}
            >
              The performance<br />
              platform built for{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #F5A623 0%, #FFD580 40%, #F5A623 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'gradientFlow 4s linear infinite',
                }}
              >
                elite shooters.
              </span>
            </h1>

            {/* Subtext */}
            <p
              className="text-base sm:text-[17px] leading-[1.7] mb-9 max-w-[500px]"
              style={{ color: textMut, animation: 'slideUp 600ms 160ms both' }}
            >
              Track every shot with millimetre precision. Detect technique flaws automatically.
              Receive structured coaching from Claude Opus 4.6 — after every single session.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mb-10" style={{ animation: 'slideUp 600ms 240ms both' }}>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-display font-black text-[13px] uppercase tracking-[0.1em] transition-all duration-200 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E8961A 100%)', color: '#060810', boxShadow: '0 0 40px rgba(245,166,35,0.25), 0 4px 16px rgba(245,166,35,0.3)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(245,166,35,0.4), 0 6px 24px rgba(245,166,35,0.4)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(245,166,35,0.25), 0 4px 16px rgba(245,166,35,0.3)'; }}
              >
                Start for free <ArrowRightIcon />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-display font-semibold text-[13px] transition-all duration-200"
                style={{ background: secBtnBg, border: `1px solid ${secBtnBd}`, color: secBtnTx }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(240,244,255,0.08)' : 'rgba(0,0,0,0.08)';
                  (e.currentTarget as HTMLElement).style.color = textPri;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = secBtnBg;
                  (e.currentTarget as HTMLElement).style.color = secBtnTx;
                }}
              >
                Sign in to dashboard
              </Link>
            </div>

            {/* Live stat pills */}
            <div className="flex flex-wrap gap-3" style={{ animation: 'slideUp 600ms 320ms both' }}>
              {[
                { val: '10.9', label: 'World Record · Air Rifle', color: '#F5A623', glowColor: 'rgba(245,166,35,0.15)' },
                { val: '2,847', label: 'Shooters tracked', color: '#4FC3F7', glowColor: 'rgba(79,195,247,0.12)' },
                { val: '98.4%', label: 'AI accuracy', color: '#00E5A0', glowColor: 'rgba(0,229,160,0.12)' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                  style={{ background: s.glowColor, border: `1px solid ${s.color}22` }}
                >
                  <span className="font-data font-black text-base" style={{ color: s.color }}>{s.val}</span>
                  <span className="text-[11px] font-display uppercase tracking-[0.08em]" style={{ color: textDim }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: product window ── */}
          <div style={{ animation: 'slideUp 700ms 120ms both' }}>
            <HeroProductWindow />
          </div>

        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ animation: 'fadeIn 1s 1.5s both', opacity: 0 }}>
        <div className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
          style={{ borderColor: scrollBd }}>
          <div className="w-1 h-1.5 rounded-full" style={{ background: 'rgba(245,166,35,0.6)', animation: 'scrollDot 1.8s ease-in-out infinite' }} />
        </div>
      </div>
    </section>
  );
}

// ── Hero Product Window ───────────────────────────────────────────────────────

function HeroProductWindow() {
  const [shots, setShots] = useState(0);
  const SIZE = 260;
  const rings = [115, 98, 80, 62, 46, 30, 18, 10];

  useEffect(() => {
    const t = setTimeout(() => {
      let n = 0;
      const id = setInterval(() => {
        n++;
        setShots(n);
        if (n >= HERO_SHOTS.length) clearInterval(id);
      }, 280);
      return () => clearInterval(id);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  const lastShot = HERO_SHOTS[shots - 1];
  const avg = shots > 0
    ? (HERO_SHOTS.slice(0, shots).reduce((a, s) => a + s.score, 0) / shots).toFixed(2)
    : null;

  return (
    <div className="relative">
      {/* Outer glow */}
      <div className="absolute -inset-8 rounded-3xl pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(245,166,35,0.07) 0%, transparent 65%)',
      }} />

      {/* Window frame */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(13,17,28,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,166,35,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,77,109,0.7)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(245,166,35,0.7)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(0,229,160,0.7)' }} />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[11px] font-display uppercase tracking-[0.12em]" style={{ color: 'rgba(240,244,255,0.3)' }}>
              10m Air Rifle · Session #2847
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E5A0' }} />
            <span className="text-[9px] font-display uppercase tracking-widest" style={{ color: '#00E5A0' }}>Live</span>
          </div>
        </div>

        {/* Content: target + stats side by side */}
        <div className="flex gap-0">

          {/* Target panel */}
          <div className="flex-shrink-0 flex items-center justify-center p-6"
            style={{ borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(6,8,16,0.5)' }}>
            <div className="relative" style={{ width: SIZE, height: SIZE }}>
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="w-full h-full">
                {/* Ring fill */}
                <circle cx={130} cy={130} r={SIZE / 2 - 1} fill="rgba(245,166,35,0.015)" />
                <circle cx={130} cy={130} r={22}           fill="rgba(245,166,35,0.05)" />

                {/* Rings */}
                {rings.map((r, i) => {
                  const circ = 2 * Math.PI * r;
                  const isGold = i >= 6;
                  return (
                    <circle key={r} cx={130} cy={130} r={r}
                      fill="none"
                      stroke={isGold ? 'rgba(245,166,35,0.9)' : 'rgba(255,255,255,0.1)'}
                      strokeWidth={isGold ? 1.5 : 0.6}
                      strokeDasharray={circ} strokeDashoffset={circ}
                      style={{ animation: `dashDraw 1.2s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms forwards` }}
                    />
                  );
                })}

                {/* Crosshair */}
                {[[130, 5, 130, 105], [130, 155, 130, SIZE - 5], [5, 130, 105, 130], [155, 130, SIZE - 5, 130]].map(([x1, y1, x2, y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="rgba(245,166,35,0.5)" strokeWidth="0.8" strokeLinecap="round"
                    strokeDasharray="200" strokeDashoffset="200"
                    style={{ animation: `dashDraw 0.6s ease ${900 + i * 50}ms forwards` }}
                  />
                ))}

                {/* Center */}
                <circle cx={130} cy={130} r={3} fill="#F5A623"
                  style={{ animation: 'fadeIn 200ms 1400ms both' }} />

                {/* Shot dots */}
                {HERO_SHOTS.slice(0, shots).map((s, i) => {
                  const px = (s.cx / 100) * SIZE;
                  const py = (s.cy / 100) * SIZE;
                  return (
                    <g key={i}>
                      <circle cx={px} cy={py} r={4.5} fill={s.r} opacity={0.92}
                        style={{ filter: `drop-shadow(0 0 4px ${s.r}80)`, animation: 'shotPop 280ms cubic-bezier(0.16,1,0.3,1) both' }} />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Stats panel */}
          <div className="flex-1 flex flex-col justify-between p-4 min-w-[160px]">
            {/* Live score badge */}
            {lastShot ? (
              <div>
                <p className="text-[10px] font-display uppercase tracking-[0.15em] mb-1" style={{ color: 'rgba(240,244,255,0.35)' }}>Last shot</p>
                <p className="font-data font-black text-4xl leading-none mb-0.5"
                  style={{ color: lastShot.r, filter: `drop-shadow(0 0 12px ${lastShot.r}60)` }}>
                  {lastShot.score.toFixed(1)}
                </p>
                <p className="text-[10px] font-display uppercase tracking-widest" style={{ color: 'rgba(240,244,255,0.3)' }}>
                  {lastShot.score >= 10.5 ? 'X-Ring' : lastShot.score >= 10.0 ? '10-Ring' : '9-Ring'}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-display uppercase tracking-[0.15em] mb-1" style={{ color: 'rgba(240,244,255,0.35)' }}>Session</p>
                <p className="font-data font-black text-4xl leading-none mb-0.5" style={{ color: 'rgba(240,244,255,0.15)' }}>—</p>
                <p className="text-[10px] font-display uppercase tracking-widest" style={{ color: 'rgba(240,244,255,0.2)' }}>Waiting</p>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Avg', value: avg ?? '—', color: '#F5A623' },
                { label: 'Shots', value: shots > 0 ? String(shots) : '0', color: '#4FC3F7' },
                { label: 'X-Ring', value: String(HERO_SHOTS.slice(0, shots).filter(s => s.score >= 10.5).length), color: '#F5A623' },
                { label: 'Series', value: shots > 0 ? 'S1' : '—', color: '#00E5A0' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-[9px] font-display uppercase tracking-[0.12em] mb-0.5" style={{ color: 'rgba(240,244,255,0.3)' }}>{s.label}</p>
                  <p className="font-data font-bold text-base" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

            {/* AI indicator */}
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg" style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.12)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#F5A623' }} />
              <span className="text-[10px] font-display uppercase tracking-[0.12em]" style={{ color: 'rgba(245,166,35,0.7)' }}>
                AI analysis ready
              </span>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div className="flex items-center gap-4">
            {['Session', 'Performance', 'AI Coach'].map((t, i) => (
              <button key={t} className="text-[10px] font-display uppercase tracking-[0.1em] transition-colors"
                style={{ color: i === 0 ? '#F5A623' : 'rgba(240,244,255,0.25)', borderBottom: i === 0 ? '1px solid #F5A623' : '1px solid transparent', paddingBottom: 2 }}>
                {t}
              </button>
            ))}
          </div>
          <span className="text-[9px] font-display uppercase tracking-widest" style={{ color: 'rgba(240,244,255,0.2)' }}>
            10m · 40 shots
          </span>
        </div>
      </div>

      {/* Floating badges */}
      <div
        className="absolute -top-4 -right-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl"
        style={{
          background: 'rgba(13,17,28,0.95)',
          border: '1px solid rgba(0,229,160,0.25)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'floatY 5s ease-in-out infinite',
        }}
      >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,160,0.12)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#00E5A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1,8 3.5,5.5 6,6.5 9,3 11,4.5" />
          </svg>
        </div>
        <div>
          <p className="font-data font-bold text-sm leading-none" style={{ color: '#00E5A0' }}>+18%</p>
          <p className="text-[9px] font-display uppercase tracking-widest mt-0.5" style={{ color: 'rgba(240,244,255,0.35)' }}>Group radius</p>
        </div>
      </div>

      <div
        className="absolute -bottom-4 -left-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
        style={{
          background: 'rgba(13,17,28,0.95)',
          border: '1px solid rgba(245,166,35,0.25)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'floatY 6s ease-in-out 2s infinite',
        }}
      >
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,166,35,0.12)' }}>
          <span className="text-[11px]" style={{ color: '#F5A623' }}>✦</span>
        </div>
        <div>
          <p className="font-display font-bold text-[11px] leading-tight" style={{ color: '#F5A623' }}>AI Coach</p>
          <p className="text-[9px] font-display mt-0.5" style={{ color: 'rgba(240,244,255,0.35)' }}>3 actions identified</p>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROLES SECTION  — "Your role. Your platform."
// ═════════════════════════════════════════════════════════════════════════════

const SHOOTER_FEATURES = [
  'Shot-by-shot placement on interactive target',
  'AI coaching feedback after every session',
  'Biometric overlay — HR, SpO₂, fatigue zones',
  'Series comparison & consistency scoring',
  'Competition goal tracking & training plans',
];
const COACH_FEATURES = [
  'Full dashboard across all connected shooters',
  'Team heatmaps & group radius trends',
  'Add session feedback with drill recommendations',
  'Progress tracking toward competition peaks',
  'Multi-discipline & multi-weapon support',
];

function RolesSection() {
  const isDark = usePageTheme();
  const [ref, vis] = useSectionReveal(0.08);

  const cardBg   = isDark ? 'rgba(13,17,28,0.85)' : 'rgba(255,255,255,0.92)';
  const cardBord = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const textPri  = isDark ? '#F0F4FF' : '#0E1118';
  const textMut  = isDark ? 'rgba(240,244,255,0.5)' : 'rgba(14,17,24,0.55)';
  const textDim  = isDark ? 'rgba(240,244,255,0.3)' : 'rgba(14,17,24,0.38)';
  const chipBg   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  const roles = [
    {
      role: 'Shooter',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#F5A623" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="11" cy="11" r="9.5" />
          <circle cx="11" cy="11" r="5.5" />
          <circle cx="11" cy="11" r="2" fill="#F5A623" stroke="none" />
          <line x1="11" y1="1.5" x2="11" y2="5.5" />
          <line x1="11" y1="16.5" x2="11" y2="20.5" />
          <line x1="1.5" y1="11" x2="5.5" y2="11" />
          <line x1="16.5" y1="11" x2="20.5" y2="11" />
        </svg>
      ),
      headline: 'The Competitor',
      sub: 'Every shot mapped. Every session analysed. Compete with precision data behind every decision.',
      features: SHOOTER_FEATURES,
      accent: '#F5A623',
      glow: 'rgba(245,166,35,0.12)',
      border: 'rgba(245,166,35,0.28)',
      hoverShadow: '0 0 60px rgba(245,166,35,0.08), 0 20px 50px rgba(0,0,0,0.35)',
      cta: 'Start as Shooter',
      href: '/auth/register',
      tag: 'For Athletes',
    },
    {
      role: 'Coach',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#4FC3F7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 2L13.09 8.26L20 9.27L15 14.14L16.18 21.02L11 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L11 2Z" />
        </svg>
      ),
      headline: 'The Coach',
      sub: 'Monitor your full squad in one view. Deliver structured feedback that drives measurable improvement.',
      features: COACH_FEATURES,
      accent: '#4FC3F7',
      glow: 'rgba(79,195,247,0.10)',
      border: 'rgba(79,195,247,0.28)',
      hoverShadow: '0 0 60px rgba(79,195,247,0.08), 0 20px 50px rgba(0,0,0,0.35)',
      cta: 'Set up Coach Account',
      href: '/auth/register',
      tag: 'For Coaches',
    },
  ];

  return (
    <section
      ref={ref}
      className="relative py-28 sm:py-36 overflow-hidden"
      style={{
        background: isDark ? 'rgba(8,10,18,0.6)' : 'rgba(243,246,252,0.7)',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      {/* Aurora accent */}
      {isDark && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute" style={{
            top: '30%', left: '20%', width: '50vw', height: '40vw',
            background: 'radial-gradient(ellipse, rgba(245,166,35,0.04) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }} />
          <div className="absolute" style={{
            top: '20%', right: '10%', width: '40vw', height: '35vw',
            background: 'radial-gradient(ellipse, rgba(79,195,247,0.04) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }} />
        </div>
      )}

      <div className="relative z-10 max-w-[1280px] mx-auto px-5 sm:px-8">

        {/* Header */}
        <div className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-[11px] font-display font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#F5A623' }}>
            Built For You
          </p>
          <h2
            className="font-display font-black leading-[1.06] mb-5"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', color: textPri }}
          >
            Your role.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #F5A623 0%, #4FC3F7 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Your platform.</span>
          </h2>
          <p className="text-base sm:text-[17px] leading-relaxed" style={{ color: textMut }}>
            Marksman is designed for two perspectives that work better together.
            A shooter improves with data. A coach leads with insight.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {roles.map((r, i) => (
            <div
              key={r.role}
              className={`group relative rounded-2xl p-7 sm:p-9 transition-all duration-700 cursor-default flex flex-col ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{
                background: cardBg,
                border: `1px solid ${cardBord}`,
                transitionDelay: `${i * 120}ms`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = r.border;
                el.style.boxShadow = r.hoverShadow;
                el.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = cardBord;
                el.style.boxShadow = 'none';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Subtle top accent bar */}
              <div
                className="absolute top-0 inset-x-0 h-px rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent 5%, ${r.accent} 50%, transparent 95%)` }}
              />

              {/* Tag + icon row */}
              <div className="flex items-center justify-between mb-7">
                <div
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full"
                  style={{ background: r.glow, border: `1px solid ${r.border}` }}
                >
                  {r.icon}
                  <span className="text-[11px] font-display font-bold uppercase tracking-[0.14em]" style={{ color: r.accent }}>
                    {r.tag}
                  </span>
                </div>
                {/* Animated ring indicator */}
                <div className="relative w-10 h-10 flex items-center justify-center" style={{ animation: 'breathe 3s ease-in-out infinite', animationDelay: `${i * 1.5}s` }}>
                  <div className="w-6 h-6 rounded-full" style={{ background: r.glow, border: `1.5px solid ${r.accent}40` }} />
                  <div className="absolute w-10 h-10 rounded-full" style={{ border: `1px solid ${r.accent}18` }} />
                </div>
              </div>

              {/* Headline */}
              <h3
                className="font-display font-black mb-3 leading-tight"
                style={{ fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', color: r.accent }}
              >
                {r.headline}
              </h3>
              <p className="text-[14px] sm:text-[15px] leading-relaxed mb-8" style={{ color: textMut }}>
                {r.sub}
              </p>

              {/* Feature list */}
              <ul className="flex flex-col gap-3 mb-10 flex-1">
                {r.features.map((f, fi) => (
                  <li
                    key={f}
                    className={`flex items-start gap-3 text-[13px] sm:text-[14px] leading-snug transition-all duration-500 ${vis ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                    style={{ transitionDelay: `${i * 120 + fi * 60 + 300}ms`, color: textMut }}
                  >
                    <span
                      className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: r.glow, border: `1px solid ${r.border}` }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={r.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1.5,4 3,5.5 6.5,2" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={r.href}
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-display font-bold text-[13px] uppercase tracking-[0.08em] transition-all duration-200 active:scale-95"
                style={{
                  background: r.glow,
                  border: `1px solid ${r.border}`,
                  color: r.accent,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isDark ? `${r.accent}18` : `${r.accent}15`;
                  (e.currentTarget as HTMLElement).style.borderColor = r.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = r.glow;
                  (e.currentTarget as HTMLElement).style.borderColor = r.border;
                }}
              >
                {r.cta} <ArrowRightIcon />
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom connector hint */}
        <div className={`mt-10 text-center transition-all duration-700 delay-300 ${vis ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[12px] font-display" style={{ color: textDim }}>
            Shooter and Coach accounts can be linked — coaches see their athletes&apos; live sessions.
          </p>
        </div>

      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STATS STRIP
// ═════════════════════════════════════════════════════════════════════════════

function StatsStrip() {
  const isDark = usePageTheme();
  const [ref, vis] = useSectionReveal();
  const n1 = useCounter(12, vis, 800);
  const n2 = useCounter(2847, vis, 1600);
  const n3 = useCounter(1200, vis, 1800);
  const n4 = useCounter(98, vis, 1200);

  const stripBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
  const textLabel   = isDark ? 'rgba(240,244,255,0.7)' : 'rgba(14,17,24,0.7)';
  const textSub     = isDark ? 'rgba(240,244,255,0.3)' : 'rgba(14,17,24,0.38)';

  return (
    <div
      ref={ref}
      className="relative py-14"
      style={{ borderTop: `1px solid ${stripBorder}`, borderBottom: `1px solid ${stripBorder}` }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(245,166,35,0.02) 0%, transparent 50%, rgba(79,195,247,0.02) 100%)' }} />
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4">
          {[
            { val: `${n1}+`, label: 'National Teams', sub: 'across 4 continents', c: '#F5A623' },
            { val: n2.toLocaleString(), label: 'Active Shooters', sub: 'on the platform', c: '#4FC3F7' },
            { val: `${n3}K+`, label: 'Sessions Logged', sub: 'and counting', c: '#00E5A0' },
            { val: `${n4}%+`, label: 'AI Accuracy', sub: 'prediction reliability', c: '#F5A623' },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`text-center transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <p className="font-data font-black mb-1.5" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', color: s.c }}>{s.val}</p>
              <p className="font-display font-bold text-sm uppercase tracking-[0.08em]" style={{ color: textLabel }}>{s.label}</p>
              <p className="text-[11px] font-display mt-0.5" style={{ color: textSub }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FEATURES SECTION
// ═════════════════════════════════════════════════════════════════════════════

const FEATURES = [
  { icon: <TargetIcon />, title: 'Shot-by-Shot Analytics', desc: 'Visualise exact placement on an interactive target. Track MPI, group radius, standard deviation, and scoring patterns across every session and series.', c: '#F5A623', tag: 'Core' },
  { icon: <AISparkIcon />, title: 'AI Coaching (Claude Opus 4.6)', desc: 'Receive expert feedback after every session. Trigger control, breathing patterns, positioning, and fatigue — all analysed and prioritised automatically.', c: '#4FC3F7', tag: 'AI' },
  { icon: <HeartIcon />, title: 'Biometric Integration', desc: 'Overlay heart rate and SpO₂ data from Apple Watch, Garmin, or Polar onto your shot timeline. Identify optimal shooting windows precisely.', c: '#00E5A0', tag: 'Health' },
  { icon: <CalendarIcon />, title: 'AI Training Plans', desc: 'Periodised training programmes generated from your discipline, competition schedule, and session performance history. Adapts as you improve.', c: '#F5A623', tag: 'Planning' },
  { icon: <DownloadIcon />, title: 'Universal Import', desc: 'Import from Sius, Megalink, and ISSF systems. Log manually via interactive target, file upload, or photo capture from paper targets.', c: '#4FC3F7', tag: 'Import' },
  { icon: <TeamIcon />, title: 'Coach & Team Portal', desc: 'Full dashboard for coaches: monitor multiple shooters, review heatmaps, add feedback, and track progress toward competition targets.', c: '#00E5A0', tag: 'Teams' },
];

function FeaturesSection() {
  const isDark = usePageTheme();
  const [ref, vis] = useSectionReveal();

  const textPri  = isDark ? '#F0F4FF' : '#0E1118';
  const textMut  = isDark ? 'rgba(240,244,255,0.5)'  : 'rgba(14,17,24,0.55)';
  const textBody = isDark ? 'rgba(240,244,255,0.45)' : 'rgba(14,17,24,0.5)';
  const cardBg   = isDark ? 'rgba(13,17,28,0.7)'     : 'rgba(255,255,255,0.85)';
  const cardBord = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.07)';
  const cardBgHover  = isDark ? 'rgba(13,17,28,0.95)' : 'rgba(255,255,255,1)';
  const cardShadHov  = isDark
    ? (c: string) => `0 0 40px ${c}08, 0 8px 32px rgba(0,0,0,0.4)`
    : (c: string) => `0 0 30px ${c}12, 0 8px 24px rgba(0,0,0,0.08)`;

  return (
    <section id="features" ref={ref} className="py-28 sm:py-36">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className={`max-w-2xl mb-16 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-[11px] font-display font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#F5A623' }}>Platform</p>
          <h2 className="font-display font-black leading-[1.08] mb-5" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: textPri }}>
            Everything a competitive<br />shooter needs.
          </h2>
          <p className="text-base sm:text-[17px] leading-relaxed" style={{ color: textMut }}>
            Built with national team coaches across 10m Air Rifle, Pistol, 50m Prone, and shotgun disciplines.
            One platform. Every metric that matters.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`group rounded-2xl p-6 transition-all duration-700 cursor-default ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ background: cardBg, border: `1px solid ${cardBord}`, transitionDelay: `${i * 70}ms` }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = cardBgHover;
                el.style.borderColor = `${f.c}30`;
                el.style.boxShadow = cardShadHov(f.c);
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = cardBg;
                el.style.borderColor = cardBord;
                el.style.boxShadow = 'none';
                el.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${f.c}12`, color: f.c, border: `1px solid ${f.c}20` }}>
                  {f.icon}
                </div>
                <span className="text-[9px] font-display font-bold uppercase tracking-[0.18em] px-2 py-1 rounded-lg"
                  style={{ background: `${f.c}10`, color: f.c }}>
                  {f.tag}
                </span>
              </div>
              <h3 className="font-display font-bold text-[15px] mb-2.5" style={{ color: textPri }}>{f.title}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: textBody }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS SHOWCASE
// "Understand every shot. Not just your total."
// ═════════════════════════════════════════════════════════════════════════════

function AnalyticsShowcase() {
  const isDark = usePageTheme();
  const [ref, vis] = useSectionReveal(0.08);

  const sectionBg = isDark ? 'rgba(10,13,22,0.5)' : 'rgba(243,246,252,0.7)';
  const secBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const dotGrid   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const textPri   = isDark ? '#F0F4FF' : '#0E1118';
  const textMut   = isDark ? 'rgba(240,244,255,0.5)'  : 'rgba(14,17,24,0.55)';
  const textDim   = isDark ? 'rgba(240,244,255,0.35)' : 'rgba(14,17,24,0.4)';
  const textBody  = isDark ? 'rgba(240,244,255,0.45)' : 'rgba(14,17,24,0.5)';

  return (
    <section
      id="analytics"
      ref={ref}
      className="relative py-28 sm:py-36 overflow-hidden"
      style={{ background: sectionBg, borderTop: `1px solid ${secBorder}`, borderBottom: `1px solid ${secBorder}` }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {isDark && (
          <div className="absolute" style={{
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: '80vw', height: '60vw',
            background: 'radial-gradient(ellipse, rgba(79,195,247,0.05) 0%, transparent 55%)',
            filter: 'blur(60px)',
          }} />
        )}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, ${dotGrid} 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          opacity: 0.4,
        }} />
        <div className="absolute top-0 inset-x-0 h-px" style={{
          background: 'linear-gradient(90deg, transparent 10%, rgba(79,195,247,0.25) 40%, rgba(245,166,35,0.2) 60%, transparent 90%)',
        }} />
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-[11px] font-display font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#4FC3F7' }}>Session Analytics</p>
          <h2 className="font-display font-black leading-[1.06] mb-5" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', color: textPri }}>
            Understand every shot.
            <br />
            <span style={{ color: textDim }}>Not just your total.</span>
          </h2>
          <p className="text-base sm:text-[17px] leading-relaxed" style={{ color: textMut }}>
            Every shot has a story — placement, direction, timing. Marksman reads it for you.
            Track MPI, group radius, series fatigue, and technique bias across every session.
          </p>
        </div>

        <div
          className={`transition-all duration-1000 overflow-x-auto ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
          style={{ transitionDelay: '150ms' }}
        >
          <AnalyticsProductWindow />
        </div>

        <div
          className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '300ms' }}
        >
          {[
            { title: 'Mean Point of Impact', desc: 'Detect systematic aim error — is your group centred on the bullseye?', color: '#4FC3F7' },
            { title: 'Group Radius & σ', desc: 'Measure shot-to-shot consistency with standard deviation across each series.', color: '#00E5A0' },
            { title: 'Series Fatigue Curve', desc: 'Spot performance drop-off across series. Know when fatigue starts affecting your score.', color: '#F5A623' },
            { title: 'Directional Bias', desc: 'Identify left/right, top/bottom tendencies by series, weapon, or session condition.', color: '#4FC3F7' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col gap-2">
              <div className="w-6 h-0.5 rounded-full" style={{ background: item.color }} />
              <h4 className="font-display font-bold text-[14px]" style={{ color: textPri }}>{item.title}</h4>
              <p className="text-[13px] leading-relaxed" style={{ color: textBody }}>{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ── Analytics Product Window ──────────────────────────────────────────────────

function AnalyticsProductWindow() {
  const SIZE = 200;
  const miniRings = [88, 74, 60, 44, 30, 18, 10];

  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{
        background: 'rgba(11,14,24,0.98)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(79,195,247,0.05), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Chrome bar */}
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,77,109,0.6)' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(245,166,35,0.6)' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(0,229,160,0.6)' }} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#F5A623' }} />
            <span className="text-[11px] font-display uppercase tracking-[0.1em]" style={{ color: 'rgba(240,244,255,0.35)' }}>
              marksman.app / sessions / 2847 — 10m Air Rifle
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E5A0' }} />
          <span className="text-[10px] font-display uppercase tracking-widest" style={{ color: '#00E5A0' }}>Live</span>
        </div>
      </div>

      {/* App layout */}
      <div className="flex divide-x" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>

        {/* Sidebar nav */}
        <div className="w-14 flex flex-col items-center py-4 gap-4 shrink-0" style={{ background: 'rgba(6,8,16,0.6)' }}>
          {[
            { icon: '⌂', active: false },
            { icon: '◎', active: true },
            { icon: '≈', active: false },
            { icon: '✦', active: false },
          ].map((item, i) => (
            <div key={i}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px]"
              style={{
                background: item.active ? 'rgba(245,166,35,0.12)' : 'transparent',
                color: item.active ? '#F5A623' : 'rgba(240,244,255,0.2)',
                border: item.active ? '1px solid rgba(245,166,35,0.2)' : '1px solid transparent',
              }}>
              {item.icon}
            </div>
          ))}
        </div>

        {/* Target panel */}
        <div className="flex flex-col items-center justify-center p-6 shrink-0"
          style={{ background: 'rgba(6,8,16,0.4)', width: SIZE + 48 }}>
          <p className="text-[10px] font-display uppercase tracking-[0.15em] mb-3 self-start" style={{ color: 'rgba(240,244,255,0.3)' }}>
            Shot Placement
          </p>
          <div className="relative" style={{ width: SIZE, height: SIZE }}>
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE}>
              <circle cx={100} cy={100} r={SIZE / 2 - 1} fill="rgba(245,166,35,0.015)" />
              {miniRings.map((r, i) => (
                <circle key={r} cx={100} cy={100} r={r}
                  fill="none"
                  stroke={i >= 5 ? 'rgba(245,166,35,0.7)' : 'rgba(255,255,255,0.08)'}
                  strokeWidth={i >= 5 ? 1 : 0.5}
                />
              ))}
              {[[100, 4, 100, 84], [100, 116, 100, SIZE - 4], [4, 100, 84, 100], [116, 100, SIZE - 4, 100]].map(([x1, y1, x2, y2], i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(245,166,35,0.3)" strokeWidth="0.6" strokeLinecap="round" />
              ))}
              <circle cx={100} cy={100} r={2.5} fill="#F5A623" />
              {TABLE_SHOTS.map((s, i) => {
                const dx = s.x * 8;
                const dy = -s.y * 8;
                const color = s.score >= 10.5 ? '#F5A623' : s.score >= 10.0 ? '#4FC3F7' : '#00E5A0';
                return (
                  <g key={i}>
                    <circle cx={100 + dx} cy={100 + dy} r={4} fill={color} opacity={0.85}
                      style={{ filter: `drop-shadow(0 0 3px ${color}70)` }} />
                  </g>
                );
              })}
            </svg>
          </div>
          {/* MPI indicator */}
          <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg w-full justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-[9px] font-display uppercase tracking-widest" style={{ color: 'rgba(240,244,255,0.3)' }}>MPI</span>
            <span className="font-data text-xs" style={{ color: '#4FC3F7' }}>x: +0.3 · y: -0.2</span>
          </div>
        </div>

        {/* Center: session stats + sparkline */}
        <div className="flex flex-col gap-4 p-5" style={{ minWidth: 180, maxWidth: 220 }}>
          <p className="text-[10px] font-display uppercase tracking-[0.15em]" style={{ color: 'rgba(240,244,255,0.3)' }}>
            Session Summary
          </p>

          {/* Big avg */}
          <div>
            <p className="font-data font-black text-4xl leading-none" style={{ color: '#F5A623' }}>10.51</p>
            <p className="text-[10px] font-display uppercase tracking-widest mt-1" style={{ color: 'rgba(240,244,255,0.3)' }}>Session average</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Best', v: '10.9', c: '#F5A623' },
              { l: 'Shots', v: '40', c: '#4FC3F7' },
              { l: 'X-Ring', v: '12', c: '#F5A623' },
              { l: 'Grp Ø', v: '3.2mm', c: '#00E5A0' },
            ].map((s) => (
              <div key={s.l} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p className="text-[8px] font-display uppercase tracking-[0.12em] mb-1" style={{ color: 'rgba(240,244,255,0.3)' }}>{s.l}</p>
                <p className="font-data font-bold text-sm" style={{ color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Mini sparkline */}
          <div>
            <p className="text-[9px] font-display uppercase tracking-widest mb-2" style={{ color: 'rgba(240,244,255,0.25)' }}>Score trend</p>
            <svg viewBox="0 0 160 40" width="100%" className="w-full">
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5A623" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Band */}
              <path d="M0,22 L20,18 L40,20 L60,12 L80,16 L100,10 L120,14 L140,8 L160,12 L160,40 L0,40 Z"
                fill="url(#sg)" opacity="0.5" />
              {/* Line */}
              <polyline
                points="0,22 20,18 40,20 60,12 80,16 100,10 120,14 140,8 160,12"
                fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              />
              {/* Dots */}
              {[[0,22],[20,18],[40,20],[60,12],[80,16],[100,10],[120,14],[140,8],[160,12]].map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r={i === 7 ? 3 : 1.5} fill="#F5A623"
                  style={i === 7 ? { filter: 'drop-shadow(0 0 3px rgba(245,166,35,0.8))' } : {}} />
              ))}
            </svg>
          </div>
        </div>

        {/* Right: shot table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[10px] font-display uppercase tracking-[0.15em]" style={{ color: 'rgba(240,244,255,0.3)' }}>
              Shot Log
            </p>
            <span className="text-[9px] font-data" style={{ color: 'rgba(240,244,255,0.2)' }}>Series 1 · 8 shots</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['#', 'Ring', 'Score', 'X', 'Y', 'Δ'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-[9px] font-display font-bold uppercase tracking-[0.12em]"
                      style={{ color: 'rgba(240,244,255,0.25)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_SHOTS.map((s, i) => {
                  const color = s.score >= 10.5 ? '#F5A623' : s.score >= 10.0 ? '#4FC3F7' : '#00E5A0';
                  const ring  = s.score >= 10.5 ? 'X' : s.score >= 10.0 ? '10' : '9';
                  const prev  = i > 0 ? TABLE_SHOTS[i - 1].score : null;
                  return (
                    <tr key={s.n}
                      className="transition-colors duration-100"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <td className="py-2 px-3 font-data text-[11px]" style={{ color: 'rgba(240,244,255,0.3)' }}>{s.n}</td>
                      <td className="py-2 px-3">
                        <span className="text-[9px] font-display font-bold px-1.5 py-0.5 rounded"
                          style={{ color, background: `${color}18` }}>{ring}</span>
                      </td>
                      <td className="py-2 px-3 font-data font-bold text-sm" style={{ color }}>{s.score.toFixed(1)}</td>
                      <td className="py-2 px-3 font-data text-[11px]" style={{ color: s.x < 0 ? '#FF4D6D' : '#4FC3F7' }}>
                        {s.x > 0 ? '+' : ''}{s.x.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 font-data text-[11px]" style={{ color: s.y < 0 ? '#FF4D6D' : '#00E5A0' }}>
                        {s.y > 0 ? '+' : ''}{s.y.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-center text-[11px] font-bold">
                        {prev === null ? <span style={{ color: 'rgba(240,244,255,0.2)' }}>—</span>
                          : s.score > prev
                            ? <span style={{ color: '#00E5A0' }}>↑</span>
                            : <span style={{ color: '#FF4D6D' }}>↓</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Table footer */}
          <div className="flex items-center gap-4 px-4 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
            {[
              { l: 'Avg', v: '10.5', c: '#F5A623' },
              { l: 'Std dev', v: '0.27', c: '#4FC3F7' },
              { l: 'Grp Ø', v: '3.2mm', c: '#00E5A0' },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-1.5">
                <span className="text-[9px] font-display uppercase tracking-widest" style={{ color: 'rgba(240,244,255,0.25)' }}>{s.l}</span>
                <span className="font-data font-bold text-[11px]" style={{ color: s.c }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// AI COACH SECTION
// ═════════════════════════════════════════════════════════════════════════════

const AI_FINDINGS = [
  { sev: 'critical', cat: 'Trigger', title: 'Premature release detected on shots 4, 7 & 10', obs: 'X-axis deviation beyond ±1.5mm consistent with early finger movement. Occurs under fatigue in final third of each series.', c: '#FF4D6D', bg: 'rgba(255,77,109,0.05)', border: 'rgba(255,77,109,0.18)' },
  { sev: 'moderate', cat: 'Breathing', title: 'Group centre drifting upward across series 2–4', obs: 'MPI shifted +2.1mm vertically. Suggests breath hold is shortening as fatigue builds. Common pattern in long sessions.', c: '#F5A623', bg: 'rgba(245,166,35,0.05)', border: 'rgba(245,166,35,0.18)' },
  { sev: 'positive', cat: 'Consistency', title: 'Group radius improved 18% vs last session', obs: 'Standard deviation reduced from 2.8mm to 2.3mm. Consistent follow-through is measurably improving your tight group performance.', c: '#00E5A0', bg: 'rgba(0,229,160,0.05)', border: 'rgba(0,229,160,0.18)' },
];

function AICoachSection() {
  const isDark = usePageTheme();
  const [ref, vis] = useSectionReveal();

  const cardBg    = isDark ? 'rgba(11,14,24,0.98)'    : 'rgba(255,255,255,0.95)';
  const cardBord  = isDark ? 'rgba(245,166,35,0.12)'  : 'rgba(245,166,35,0.25)';
  const cardShadow= isDark ? '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(245,166,35,0.04)' : '0 20px 60px rgba(0,0,0,0.1), 0 0 40px rgba(245,166,35,0.06)';
  const headerBg  = isDark ? 'rgba(245,166,35,0.03)'  : 'rgba(245,166,35,0.04)';
  const headerBord= isDark ? 'rgba(245,166,35,0.1)'   : 'rgba(245,166,35,0.15)';
  const divider   = isDark ? 'rgba(255,255,255,0.04)'  : 'rgba(0,0,0,0.05)';
  const textPri   = isDark ? '#F0F4FF'                 : '#0E1118';
  const textMut   = isDark ? 'rgba(240,244,255,0.5)'   : 'rgba(14,17,24,0.55)';
  const textBody  = isDark ? 'rgba(240,244,255,0.45)'  : 'rgba(14,17,24,0.5)';
  const textDim   = isDark ? 'rgba(240,244,255,0.3)'   : 'rgba(14,17,24,0.35)';
  const textDim2  = isDark ? 'rgba(240,244,255,0.4)'   : 'rgba(14,17,24,0.45)';
  const textDim3  = isDark ? 'rgba(240,244,255,0.35)'  : 'rgba(14,17,24,0.4)';
  const checkBg   = isDark ? 'rgba(245,166,35,0.1)'    : 'rgba(245,166,35,0.08)';

  return (
    <section id="ai-coach" ref={ref} className="py-28 sm:py-36">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: mock AI card */}
          <div className={`transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${cardBord}`, boxShadow: cardShadow }}>
              <div className="relative px-5 py-4" style={{ borderBottom: `1px solid ${headerBord}`, background: headerBg }}>
                <div className="absolute top-0 inset-x-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.5), transparent)' }} />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)' }}>
                    <AISparkIcon size={14} color="#F5A623" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display font-bold text-[13px]" style={{ color: textPri }}>Coach Assessment</p>
                    <p className="text-[10px] font-display uppercase tracking-widest" style={{ color: '#00E5A0' }}>Powered by Claude Opus 4.6</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-data font-black text-2xl" style={{ color: '#F5A623' }}>8.4</p>
                    <p className="text-[9px] font-display" style={{ color: textDim }}>/10</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${divider}` }}>
                <p className="text-[13px] leading-relaxed" style={{ color: textMut }}>
                  Strong technical base with improving group consistency. Primary concern is trigger release
                  under fatigue — particularly in the final shots of each series. Address trigger discipline
                  before increasing session volume.
                </p>
              </div>

              <div className="p-4 space-y-2.5">
                {AI_FINDINGS.map((f, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: f.bg, border: `1px solid ${f.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-display font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded"
                        style={{ color: f.c, background: `${f.c}12` }}>{f.cat}</span>
                      <span className="text-[9px] font-display font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded"
                        style={{ color: f.c, border: `1px solid ${f.border}` }}>{f.sev}</span>
                    </div>
                    <p className="font-display font-semibold text-[13px] mb-1" style={{ color: textPri }}>{f.title}</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: textDim2 }}>{f.obs}</p>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3.5" style={{ borderTop: `1px solid ${divider}` }}>
                <div className="py-2 rounded-xl text-center text-[11px] font-display font-bold uppercase tracking-[0.12em]"
                  style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: '#F5A623' }}>
                  3 Priority Actions · 5 Total Findings
                </div>
              </div>
            </div>
          </div>

          {/* Right: text + shooter visual */}
          <div className={`transition-all duration-700 delay-150 ${vis ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>

            {/* Shooter silhouette card */}
            <div className="relative mb-7 rounded-2xl overflow-hidden flex items-end justify-center"
              style={{
                height: 180,
                background: isDark ? 'rgba(11,14,24,0.6)' : 'rgba(245,166,35,0.04)',
                border: `1px solid ${isDark ? 'rgba(245,166,35,0.1)' : 'rgba(245,166,35,0.2)'}`,
              }}>
              {/* Radar rings behind shooter */}
              <div className="absolute pointer-events-none" style={{
                bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: 160, height: 160, borderRadius: '50%',
                border: '1px solid rgba(245,166,35,0.12)',
                animation: 'radarPing 3s ease-out infinite',
              }} />
              <div className="absolute pointer-events-none" style={{
                bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: 160, height: 160, borderRadius: '50%',
                border: '1px solid rgba(245,166,35,0.08)',
                animation: 'radarPing 3s ease-out 1.5s infinite',
              }} />
              {/* Ground line */}
              <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'rgba(245,166,35,0.2)' }} />
              {/* Shooter SVG silhouette — standing rifle position */}
              <svg width="120" height="160" viewBox="0 0 120 160" fill="none" className="relative z-10"
                style={{ filter: 'drop-shadow(0 0 12px rgba(245,166,35,0.4))' }}>
                <circle cx="62" cy="18" r="10" fill="rgba(245,166,35,0.85)" />
                <path d="M55 28 L50 75 L58 75 L60 50 L65 75 L73 75 L67 28 Z" fill="rgba(245,166,35,0.7)" />
                <path d="M55 38 L20 48 L22 52 L58 44 Z" fill="rgba(245,166,35,0.65)" />
                <path d="M67 36 L80 40 L79 44 L66 40 Z" fill="rgba(245,166,35,0.65)" />
                <rect x="8" y="47" width="75" height="4" rx="2" fill="rgba(245,166,35,0.9)" />
                <path d="M80 43 L95 50 L90 58 L78 50 Z" fill="rgba(245,166,35,0.75)" />
                <rect x="35" y="43" width="18" height="5" rx="2" fill="rgba(245,166,35,0.5)" />
                <path d="M52 75 L48 120 L56 120 L58 85 Z" fill="rgba(245,166,35,0.65)" />
                <path d="M66 75 L62 85 L64 120 L72 120 Z" fill="rgba(245,166,35,0.65)" />
                <rect x="44" y="118" width="14" height="5" rx="2" fill="rgba(245,166,35,0.5)" />
                <rect x="61" y="118" width="14" height="5" rx="2" fill="rgba(245,166,35,0.5)" />
                <circle cx="6" cy="49" r="2.5" fill="#F5A623" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }} />
              </svg>
              {/* Score badge */}
              <div className="absolute top-4 right-4 text-right">
                <p className="font-data font-black text-3xl leading-none" style={{ color: '#F5A623', filter: 'drop-shadow(0 0 8px rgba(245,166,35,0.6))' }}>+18%</p>
                <p className="text-[9px] font-display uppercase tracking-[0.14em] mt-0.5" style={{ color: isDark ? 'rgba(240,244,255,0.4)' : 'rgba(14,17,24,0.4)' }}>group radius</p>
              </div>
              {/* Session counter */}
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E5A0' }} />
                  <p className="text-[10px] font-display uppercase tracking-widest" style={{ color: '#00E5A0' }}>Session 24</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-display font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#F5A623' }}>AI Coaching</p>
            <h2 className="font-display font-black leading-[1.08] mb-5"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: textPri }}>
              Expert coaching,<br />
              <span style={{ color: '#F5A623' }}>after every session.</span>
            </h2>
            <p className="text-[15px] sm:text-[17px] leading-relaxed mb-6" style={{ color: textMut }}>
              Claude Opus 4.6 analyses your shot data and delivers structured feedback categorised
              by technique area and severity — like having a national team coach review every session.
            </p>

            {/* Score trend sparkline */}
            <div className="mb-8 rounded-xl p-4 flex items-center gap-4"
              style={{ background: isDark ? 'rgba(245,166,35,0.04)' : 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.12)' }}>
              <div className="shrink-0">
                <p className="text-[10px] font-display uppercase tracking-widest mb-0.5" style={{ color: 'rgba(245,166,35,0.6)' }}>Score Trend</p>
                <p className="font-data font-black text-2xl leading-none" style={{ color: '#F5A623' }}>+2.1</p>
                <p className="text-[9px] font-display" style={{ color: textDim }}>pts over 6 sessions</p>
              </div>
              <svg width="120" height="40" viewBox="0 0 120 40" fill="none" style={{ flex: 1 }}>
                <polyline
                  points="0,32 24,28 48,22 72,18 96,12 120,6"
                  stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  fill="none"
                  strokeDasharray="200"
                  strokeDashoffset={vis ? '0' : '200'}
                  style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s' }}
                />
                {([0,24,48,72,96,120] as number[]).map((x, i) => {
                  const y = [32,28,22,18,12,6][i];
                  return <circle key={i} cx={x} cy={y} r="3" fill="#F5A623"
                    style={{ opacity: vis ? 1 : 0, transition: `opacity 0.3s ${0.3 + i*0.1}s` }} />;
                })}
              </svg>
            </div>

            <div className="space-y-4 mb-10">
              {[
                { l: 'Technique breakdown', d: 'Trigger, breathing, positioning, sight alignment — each assessed independently.' },
                { l: 'Fatigue & consistency', d: 'Detect performance patterns across series and between sessions over time.' },
                { l: 'Drill recommendations', d: 'Specific, actionable drills generated for each identified weakness.' },
                { l: 'Session-to-session tracking', d: 'Measure how coaching feedback translates into measurable score improvement.' },
              ].map((item) => (
                <div key={item.l} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-lg flex items-center justify-center"
                    style={{ background: checkBg }}>
                    <svg width="9" height="9" viewBox="0 0 9 9">
                      <path d="M1.5 4.5l2 2 3.5-3.5" stroke="#F5A623" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: textPri }}>{item.l}</p>
                    <p className="text-[13px] leading-relaxed" style={{ color: textBody }}>{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-display font-black text-[13px] uppercase tracking-[0.1em] transition-all duration-200 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #F5A623, #E8961A)',
                color: '#060810',
                boxShadow: '0 0 40px rgba(245,166,35,0.2)',
              }}>
              Try AI Coach <ArrowRightIcon />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HOW IT WORKS
// ═════════════════════════════════════════════════════════════════════════════

function HowItWorksSection() {
  const isDark = usePageTheme();
  const [ref, vis] = useSectionReveal();

  const sectionBg = isDark ? 'rgba(10,13,22,0.5)' : 'rgba(243,246,252,0.7)';
  const secBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const cardBg    = isDark ? 'rgba(13,17,28,0.8)'    : 'rgba(255,255,255,0.9)';
  const cardBord  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const textPri   = isDark ? '#F0F4FF'                : '#0E1118';
  const textMut   = isDark ? 'rgba(240,244,255,0.45)' : 'rgba(14,17,24,0.5)';
  const textDim   = isDark ? 'rgba(240,244,255,0.25)' : 'rgba(14,17,24,0.3)';
  const chipBg    = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const chipBord  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const chipText  = isDark ? 'rgba(240,244,255,0.5)'  : 'rgba(14,17,24,0.5)';

  return (
    <section
      id="how"
      ref={ref}
      className="py-28 sm:py-36 relative"
      style={{ background: sectionBg, borderTop: `1px solid ${secBorder}` }}
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className={`text-center max-w-xl mx-auto mb-16 transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-[11px] font-display font-bold uppercase tracking-[0.2em] mb-4" style={{ color: '#00E5A0' }}>Getting Started</p>
          <h2 className="font-display font-black leading-[1.08] mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: textPri }}>
            From first session<br />to peak performance.
          </h2>
          <p className="text-[15px] leading-relaxed" style={{ color: textMut }}>
            Set up in under 5 minutes. See actionable insights from your very first session.
          </p>
        </div>

        {/* Desktop: horizontal connected timeline */}
        <div className="hidden lg:block relative mb-12">
          {/* Base connector line */}
          <div className="absolute h-px" style={{
            top: 24, left: '12.5%', right: '12.5%',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
          }} />
          {/* Animated fill line */}
          <div className="absolute h-px transition-all duration-[2000ms] ease-out" style={{
            top: 24,
            left: '12.5%',
            right: vis ? '12.5%' : '87.5%',
            background: 'linear-gradient(90deg, #F5A623, #4FC3F7, #00E5A0, #F5A623)',
            transitionDelay: '200ms',
          }} />

          <div className="grid grid-cols-4 gap-4">
            {[
              { n: '01', title: 'Create your profile', desc: 'Select discipline, weapon, and competition goals. Connect a coach for team-based training.', c: '#F5A623',
                icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F5A623" strokeWidth="1.5"><circle cx="9" cy="6" r="3.5"/><circle cx="9" cy="9" r="7.5" strokeDasharray="3 2"/></svg> },
              { n: '02', title: 'Log your sessions', desc: 'Import from scoring systems, log manually on an interactive target, or capture paper targets with your camera.', c: '#4FC3F7',
                icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="8" width="12" height="8" rx="1.5"/><path d="M9 2v8M6 5l3-3 3 3"/></svg> },
              { n: '03', title: 'Receive AI feedback', desc: 'After each session, get structured coaching from Claude Opus 4.6 with prioritised drills and technique flags.', c: '#00E5A0',
                icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#00E5A0" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7l-4 3V4a1 1 0 0 1 1-1z"/><circle cx="9" cy="7.5" r="1" fill="#00E5A0" stroke="none"/></svg> },
              { n: '04', title: 'Track your progress', desc: 'Monitor scoring trends, consistency metrics, and training plan adherence toward competition peak.', c: '#F5A623',
                icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,14 6,10 10,12 16,5"/><polyline points="12,5 16,5 16,9"/></svg> },
            ].map((s, i) => (
              <div key={s.n}
                className={`flex flex-col items-center text-center transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 relative z-10"
                  style={{
                    background: isDark ? 'rgba(13,17,28,1)' : 'rgba(255,255,255,1)',
                    border: `2px solid ${s.c}`,
                    boxShadow: `0 0 16px ${s.c}30`,
                  }}>
                  {s.icon}
                </div>
                <p className="font-data font-black text-[11px] uppercase tracking-[0.2em] mb-1.5" style={{ color: s.c }}>{s.n}</p>
                <h3 className="font-display font-bold text-[14px] mb-2" style={{ color: textPri }}>{s.title}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: textMut }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="lg:hidden space-y-0 mb-12">
          {[
            { n: '01', title: 'Create your profile', desc: 'Select discipline, weapon, and competition goals. Connect a coach for team-based training.', c: '#F5A623',
              icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F5A623" strokeWidth="1.5"><circle cx="9" cy="6" r="3.5"/><circle cx="9" cy="9" r="7.5" strokeDasharray="3 2"/></svg> },
            { n: '02', title: 'Log your sessions', desc: 'Import from scoring systems, log manually on an interactive target, or capture paper targets with your camera.', c: '#4FC3F7',
              icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="8" width="12" height="8" rx="1.5"/><path d="M9 2v8M6 5l3-3 3 3"/></svg> },
            { n: '03', title: 'Receive AI feedback', desc: 'After each session, get structured coaching from Claude Opus 4.6 with prioritised drills and technique flags.', c: '#00E5A0',
              icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#00E5A0" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7l-4 3V4a1 1 0 0 1 1-1z"/><circle cx="9" cy="7.5" r="1" fill="#00E5A0" stroke="none"/></svg> },
            { n: '04', title: 'Track your progress', desc: 'Monitor scoring trends, consistency metrics, and training plan adherence toward competition peak.', c: '#F5A623',
              icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,14 6,10 10,12 16,5"/><polyline points="12,5 16,5 16,9"/></svg> },
          ].map((s, i) => (
            <div key={s.n}
              className={`flex gap-4 transition-all duration-700 ${vis ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}`}
              style={{ transitionDelay: `${i * 120}ms` }}>
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: isDark ? 'rgba(13,17,28,1)' : '#fff',
                    border: `2px solid ${s.c}`,
                    boxShadow: `0 0 12px ${s.c}25`,
                  }}>
                  {s.icon}
                </div>
                {i < 3 && <div className="w-px flex-1 my-1" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', minHeight: 32 }} />}
              </div>
              <div className="pb-8">
                <p className="font-data font-bold text-[10px] uppercase tracking-[0.18em] mb-0.5" style={{ color: s.c }}>{s.n}</p>
                <h3 className="font-display font-bold text-[15px] mb-1.5" style={{ color: textPri }}>{s.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: textMut }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`rounded-2xl p-6 sm:p-8 transition-all duration-700 delay-300 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ background: cardBg, border: `1px solid ${cardBord}` }}
        >
          <p className="text-[10px] font-display font-bold uppercase tracking-[0.18em] mb-5" style={{ color: textDim }}>Supported Disciplines</p>
          <div className="flex flex-wrap gap-2.5">
            {['10m Air Rifle', '10m Air Pistol', '25m Rapid Fire Pistol', '50m Rifle 3×40', '50m Rifle Prone', '50m Pistol', 'Trap', 'Skeet', 'Double Trap'].map((d) => (
              <span key={d} className="px-3.5 py-1.5 rounded-xl text-[12px] font-display font-semibold"
                style={{ background: chipBg, border: `1px solid ${chipBord}`, color: chipText }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CTA
// ═════════════════════════════════════════════════════════════════════════════

function CTASection() {
  const isDark = usePageTheme();
  const [ref, vis] = useSectionReveal();

  const textPri   = isDark ? '#F0F4FF' : '#0E1118';
  const textMut   = isDark ? 'rgba(240,244,255,0.45)' : 'rgba(14,17,24,0.5)';
  const dotGrid   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const secBtnBg  = isDark ? 'rgba(240,244,255,0.04)' : 'rgba(0,0,0,0.04)';
  const secBtnBord= isDark ? 'rgba(240,244,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const secBtnTxt = isDark ? 'rgba(240,244,255,0.55)' : 'rgba(14,17,24,0.6)';

  return (
    <section ref={ref} className="relative py-28 sm:py-36 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(245,166,35,0.07) 0%, transparent 60%)' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle, ${dotGrid} 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-0 inset-x-0 h-px" style={{
          background: 'linear-gradient(90deg, transparent 20%, rgba(245,166,35,0.2) 50%, transparent 80%)',
        }} />
      </div>

      <div className={`relative z-10 max-w-2xl mx-auto px-5 sm:px-8 text-center transition-all duration-700 ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full mb-8"
          style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00E5A0' }} />
          <span className="text-[11px] font-display font-bold uppercase tracking-[0.15em]" style={{ color: '#00E5A0' }}>
            Free to start · No credit card needed
          </span>
        </div>

        <h2 className="font-display font-black leading-[1.04] mb-6" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: textPri }}>
          Start training with<br />
          <span style={{
            background: 'linear-gradient(135deg, #F5A623, #FFD580)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>data on your side.</span>
        </h2>

        <p className="text-base sm:text-[17px] mb-10" style={{ color: textMut }}>
          Join 2,847 shooters who use Marksman to train smarter and compete at their best.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/auth/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-display font-black text-[14px] uppercase tracking-[0.1em] transition-all duration-200 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #F5A623, #E8961A)', color: '#060810', boxShadow: '0 0 60px rgba(245,166,35,0.3)' }}>
            Create free account <ArrowRightIcon />
          </Link>
          <Link href="/auth/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-display font-semibold text-[14px] transition-all duration-200"
            style={{ background: secBtnBg, border: `1px solid ${secBtnBord}`, color: secBtnTxt }}>
            Sign in to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// FOOTER
// ═════════════════════════════════════════════════════════════════════════════

function Footer() {
  const isDark = usePageTheme();
  const border  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
  const logoCl  = isDark ? 'rgba(240,244,255,0.4)'  : 'rgba(14,17,24,0.4)';
  const caption = isDark ? 'rgba(240,244,255,0.2)'  : 'rgba(14,17,24,0.3)';
  const linkCl  = isDark ? 'rgba(240,244,255,0.25)' : 'rgba(14,17,24,0.3)';
  const linkHov = isDark ? 'rgba(240,244,255,0.6)'  : 'rgba(14,17,24,0.7)';

  return (
    <footer className="py-10" style={{ borderTop: `1px solid ${border}` }}>
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <CrosshairLogo size={18} />
            <span className="font-display font-black text-[14px] tracking-[0.18em] uppercase" style={{ color: logoCl }}>
              Marksman
            </span>
          </div>
          <p className="text-[12px] font-display text-center" style={{ color: caption }}>
            Precision analytics for competitive shooters. Built for athletes, by athletes.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map((l) => (
              <a key={l} href="#"
                className="text-[12px] font-display transition-colors duration-200"
                style={{ color: linkCl }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = linkHov; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = linkCl; }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE LOADER
// ═════════════════════════════════════════════════════════════════════════════

function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#060810' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-t-[#F5A623] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border border-t-transparent border-r-[#4FC3F7] border-b-transparent border-l-transparent animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full" style={{ background: '#F5A623' }} />
          </div>
        </div>
        <p className="text-[11px] font-display uppercase tracking-widest animate-pulse" style={{ color: 'rgba(240,244,255,0.3)' }}>
          Loading
        </p>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SHARED ICONS
// ═════════════════════════════════════════════════════════════════════════════

function CrosshairLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 4px rgba(245,166,35,0.5))' }}>
      <circle cx="16" cy="16" r="13" stroke="#F5A623" strokeWidth="1" opacity="0.45" />
      <circle cx="16" cy="16" r="9"  stroke="#F5A623" strokeWidth="1" opacity="0.75" />
      <circle cx="16" cy="16" r="4"  stroke="#F5A623" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="1.5" fill="#F5A623" />
      <line x1="16" y1="2"  x2="16" y2="10" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="22" x2="16" y2="30" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2"  y1="16" x2="10" y2="16" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22" y1="16" x2="30" y2="16" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="6.5" x2="11" y2="6.5" />
      <polyline points="7.5,3 11,6.5 7.5,10" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="9" r="7.5" /><circle cx="9" cy="9" r="4.5" /><circle cx="9" cy="9" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AISparkIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M3.9 3.9l1.1 1.1M13 13l1.1 1.1M3.9 14.1l1.1-1.1M13 5l1.1-1.1" />
      <circle cx="9" cy="9" r="2.8" fill={color ?? 'currentColor'} stroke="none" opacity="0.85" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,9 4,9 6,4 8,14 10,6 12,11 14,9 17,9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="14" height="13" rx="2" />
      <line x1="2" y1="7" x2="16" y2="7" />
      <line x1="6" y1="1" x2="6" y2="5" />
      <line x1="12" y1="1" x2="12" y2="5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v9M5.5 7.5L9 11l3.5-3.5" /><path d="M3 13.5v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="6" r="2.8" /><path d="M1.5 15.5c0-3 2.5-5.5 5.5-5.5" />
      <circle cx="13" cy="7" r="2.2" /><path d="M10.5 15.5c0-2.2 1.1-4 2.5-4s2.5 1.8 2.5 4" />
    </svg>
  );
}
