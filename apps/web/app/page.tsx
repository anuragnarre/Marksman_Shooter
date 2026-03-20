'use client';

// apps/web/app/page.tsx — Marksman Landing Page (mobile-first)

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '../lib/use-mobile';

// ── Utility Hooks ─────────────────────────────────────────────────────────────

function useScrollY(): number {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return scrollY;
}

function useSectionReveal(threshold = 0.15): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  // Bidirectional: re-triggers on both enter and re-enter from any direction
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => setVis(e.isIntersecting),
      { threshold, rootMargin: '-80px 0px' }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, vis];
}

// Detects scroll direction for directional slide animations
function useScrollDirection(): 'down' | 'up' {
  const [dir, setDir] = useState<'down' | 'up'>('down');
  const lastY = useRef(0);
  useEffect(() => {
    const h = () => {
      const y = window.scrollY;
      setDir(y > lastY.current ? 'down' : 'up');
      lastY.current = y;
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return dir;
}

// ── Magnetic Button ────────────────────────────────────────────────────────────

function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tf, setTf] = useState('translate(0px,0px)');
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.3;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        setTf(`translate(${dx}px,${dy}px)`);
      }}
      onMouseLeave={() => setTf('translate(0px,0px)')}
      style={{
        display: 'inline-block',
        transform: tf,
        transition: tf === 'translate(0px,0px)'
          ? 'transform 400ms cubic-bezier(0.16,1,0.3,1)'
          : 'transform 80ms linear',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}

// ── Particle Field ────────────────────────────────────────────────────────────
// Fixed seed to avoid hydration mismatch — values are deterministic.

const PARTICLES = [
  { x: 8,  y: 12, s: 1.8, d: 7.2, dl: 0,   c: '#F5A623', o: 0.25 },
  { x: 22, y: 35, s: 1.2, d: 9.0, dl: 1.5, c: '#4FC3F7', o: 0.20 },
  { x: 45, y: 8,  s: 2.2, d: 6.5, dl: 3.0, c: '#00E5A0', o: 0.30 },
  { x: 65, y: 20, s: 1.5, d: 8.4, dl: 0.8, c: '#F0F4FF', o: 0.15 },
  { x: 80, y: 45, s: 1.0, d: 7.8, dl: 2.2, c: '#F5A623', o: 0.20 },
  { x: 15, y: 60, s: 2.0, d: 10,  dl: 4.5, c: '#4FC3F7', o: 0.25 },
  { x: 35, y: 75, s: 1.3, d: 6.8, dl: 1.0, c: '#00E5A0', o: 0.18 },
  { x: 55, y: 55, s: 2.5, d: 8.0, dl: 3.5, c: '#F5A623', o: 0.22 },
  { x: 72, y: 70, s: 1.6, d: 9.5, dl: 0.3, c: '#4FC3F7', o: 0.28 },
  { x: 90, y: 15, s: 1.1, d: 7.0, dl: 5.0, c: '#F0F4FF', o: 0.15 },
  { x: 3,  y: 82, s: 1.9, d: 8.8, dl: 2.8, c: '#00E5A0', o: 0.22 },
  { x: 28, y: 48, s: 1.4, d: 6.2, dl: 1.8, c: '#F5A623', o: 0.18 },
  { x: 48, y: 30, s: 2.1, d: 9.8, dl: 4.0, c: '#4FC3F7', o: 0.28 },
  { x: 62, y: 85, s: 1.7, d: 7.5, dl: 0.5, c: '#F0F4FF', o: 0.16 },
  { x: 85, y: 55, s: 1.2, d: 8.2, dl: 3.2, c: '#F5A623', o: 0.24 },
  { x: 12, y: 25, s: 2.3, d: 6.9, dl: 2.0, c: '#00E5A0', o: 0.20 },
  { x: 40, y: 90, s: 1.5, d: 10.2,dl: 1.2, c: '#4FC3F7', o: 0.22 },
  { x: 58, y: 42, s: 1.8, d: 7.8, dl: 4.8, c: '#F5A623', o: 0.26 },
  { x: 75, y: 28, s: 1.0, d: 8.5, dl: 0.7, c: '#F0F4FF', o: 0.14 },
  { x: 92, y: 72, s: 2.0, d: 6.4, dl: 3.8, c: '#00E5A0', o: 0.20 },
];

function ParticleField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top:  `${p.y}%`,
            width:  p.s,
            height: p.s,
            background: p.c,
            opacity: p.o,
            animation: `floatY ${p.d}s ease-in-out ${p.dl}s infinite`,
            boxShadow: `0 0 ${p.s * 4}px ${p.c}55`,
          }}
        />
      ))}
    </div>
  );
}

// ── Entry Point ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const isMobile  = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady]     = useState(false);
  const safeTopInset = isMobile ? 'max(env(safe-area-inset-top, 0px), 24px)' : 'env(safe-area-inset-top, 0px)';
  const scrollY = useScrollY();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && user) router.replace('/dashboard');
  }, [user, mounted, router]);

  // Minimum loader display for polish, then reveal
  useEffect(() => {
    if (mounted && !user) {
      const t = setTimeout(() => setReady(true), 1600);
      return () => clearTimeout(t);
    }
  }, [mounted, user]);

  // Still waiting for hydration or redirecting authenticated user
  if (!mounted || user) {
    return <SplashLoader />;
  }

  return (
    <>
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999]"
          >
            <SplashLoader />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="min-h-screen depth-bg text-[#F0F4FF] overflow-x-hidden"
        style={{ fontSize: '16px' }}
      >
        <Nav safeTopInset={safeTopInset} />
        <div style={{ paddingTop: safeTopInset }}>
          <Hero scrollY={scrollY} />
          <DisciplineMarquee />
          <LiveStats />
          <BentoFeatures />
          <AIHealthSection />
          <HowItWorks />
          <RoleShowcase />
          <CtaBanner />
          <Footer />
        </div>
      </motion.div>
    </>
  );
}

// ── Splash Loader ─────────────────────────────────────────────────────────────
// Premium branded loading screen with animated crosshair, sweep line, and text reveal.

function SplashLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased * 100);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,166,35,0.04) 0%, #060810 70%)',
        zIndex: 9999,
      }}
    >
      {/* Ambient orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '20%', left: '30%',
          width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 65%)',
          animation: 'orbFloat 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '15%', right: '20%',
          width: '30vw', height: '30vw',
          background: 'radial-gradient(circle, rgba(79,195,247,0.04) 0%, transparent 65%)',
          animation: 'orbFloat 10s ease-in-out infinite reverse',
        }}
      />

      {/* Crosshair animation */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-8">
        {/* Outer ping ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '1px solid rgba(245,166,35,0.3)',
            animation: 'radarPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
        {/* Second ping ring offset */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '1px solid rgba(245,166,35,0.2)',
            animation: 'radarPing 2s cubic-bezier(0, 0, 0.2, 1) 0.6s infinite',
          }}
        />
        {/* Rotating sweep */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ animation: 'radarSweep 2.5s linear infinite' }}
        >
          <div
            className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left"
            style={{
              background: 'conic-gradient(from 0deg, rgba(245,166,35,0.25) 0deg, transparent 60deg)',
            }}
          />
        </div>
        {/* Crosshair SVG with draw animation */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          className="absolute inset-0 w-full h-full"
          style={{ filter: 'drop-shadow(0 0 12px rgba(245,166,35,0.5))' }}
        >
          {/* Outer ring */}
          <circle
            cx="32" cy="32" r="27"
            stroke="#F5A623" strokeWidth="1"
            opacity="0.35"
            strokeDasharray="170"
            style={{ animation: 'ringDraw 1.2s cubic-bezier(0.16,1,0.3,1) forwards' }}
          />
          {/* Middle ring */}
          <circle
            cx="32" cy="32" r="19"
            stroke="#F5A623" strokeWidth="1.2"
            opacity="0.6"
            strokeDasharray="120"
            style={{ animation: 'ringDraw 1s cubic-bezier(0.16,1,0.3,1) 0.15s forwards' }}
          />
          {/* Inner ring */}
          <circle
            cx="32" cy="32" r="10"
            stroke="#F5A623" strokeWidth="1.5"
            opacity="0.85"
            strokeDasharray="63"
            style={{ animation: 'ringDraw 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s forwards' }}
          />
          {/* Center dot — pops in */}
          <circle
            cx="32" cy="32" r="3.5"
            fill="#F5A623"
            style={{ animation: 'dotPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.6s both' }}
          />
          {/* Crosshair lines */}
          <line x1="32" y1="4" x2="32" y2="20" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round"
            strokeDasharray="16"
            style={{ animation: 'ringDraw 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s forwards' }}
          />
          <line x1="32" y1="44" x2="32" y2="60" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round"
            strokeDasharray="16"
            style={{ animation: 'ringDraw 0.6s cubic-bezier(0.16,1,0.3,1) 0.45s forwards' }}
          />
          <line x1="4" y1="32" x2="20" y2="32" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round"
            strokeDasharray="16"
            style={{ animation: 'ringDraw 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s forwards' }}
          />
          <line x1="44" y1="32" x2="60" y2="32" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round"
            strokeDasharray="16"
            style={{ animation: 'ringDraw 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s forwards' }}
          />
        </svg>
      </div>

      {/* Brand text */}
      <div className="text-center mb-8" style={{ animation: 'revealUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both' }}>
        <h1
          className="font-display font-black text-2xl sm:text-3xl tracking-[0.22em] uppercase mb-1"
          style={{
            background: 'linear-gradient(135deg, #F5A623 0%, #FFD580 50%, #F5A623 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 3s linear infinite',
          }}
        >
          MARKSMAN
        </h1>
        <p
          className="font-display text-[11px] sm:text-[12px] tracking-[0.3em] uppercase"
          style={{ color: '#4A5568', animation: 'textReveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s both' }}
        >
          Precision Analytics
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="w-48 sm:w-56"
        style={{ animation: 'revealUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.6s both' }}
      >
        <div className="progress-track" style={{ height: 2, background: 'rgba(245,166,35,0.08)' }}>
          <div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #F5A623, #FFD580)',
              boxShadow: '0 0 12px rgba(245,166,35,0.5), 0 0 4px rgba(245,166,35,0.8)',
              transition: 'width 60ms linear',
            }}
          >
            {/* Shimmer on the bar */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1s linear infinite',
              }}
            />
          </div>
        </div>
        {/* Loading status text */}
        <div className="flex justify-between mt-3">
          <span
            className="font-display text-[10px] tracking-[0.15em] uppercase"
            style={{ color: '#4A5568' }}
          >
            Initializing
          </span>
          <span
            className="font-jetbrains text-[10px] font-semibold tabular-nums"
            style={{ color: 'rgba(245,166,35,0.6)' }}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Subtle grid underlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245,166,35,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Scan line effect */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ animation: 'scanLine 3s linear infinite' }}
      >
        <div
          className="w-full h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.15), transparent)' }}
        />
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
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 h-[64px] sm:h-[72px] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0 touch-target">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10">
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.25) 0%, transparent 70%)' }}
              />
              <CrosshairLogo size={28} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-black text-[16px] sm:text-[17px] tracking-[0.18em] uppercase text-[#F0F4FF]">
                Marksman
              </span>
              <span className="font-display text-[9px] sm:text-[10px] tracking-[0.22em] uppercase text-[#F5A623] opacity-80 mt-0.5">
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
                className="relative px-5 py-2.5 text-[#9CA3B4] hover:text-[#F0F4FF] text-[13px]
                           font-display uppercase tracking-[0.15em] transition-colors duration-200
                           group rounded-lg hover:bg-white/[0.04]"
              >
                {item.label}
                <span
                  className="absolute bottom-1 left-5 right-5 h-px origin-left scale-x-0
                             group-hover:scale-x-100 transition-transform duration-300"
                  style={{ background: 'linear-gradient(90deg, #F5A623 0%, rgba(245,166,35,0.2) 100%)' }}
                />
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <MagneticButton>
              <Link href="/auth/register" className="btn btn-primary text-[13px] py-2.5 px-6 gap-2">
                Get Started <ArrowRightIcon size={12} />
              </Link>
            </MagneticButton>
          </div>

          {/* Mobile: hamburger */}
          <div className="flex md:hidden items-center gap-1">
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
          <div className="px-5 pt-3 pb-6 flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-4 text-[#9CA3B4] hover:text-[#F0F4FF] text-base font-display
                           uppercase tracking-[0.15em] transition-colors rounded-xl active:bg-white/[0.05]
                           flex items-center justify-between touch-target"
              >
                {item.label}
                <span className="text-[#4A5568] text-xl">›</span>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ scrollY }: { scrollY: number }) {
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

      {/* Floating particles */}
      <ParticleField />

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
      <div className="relative max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-16 lg:py-24 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-16 items-center">

          {/* Copy — always first on mobile */}
          <div className="space-y-6 sm:space-y-8" style={{ animation: 'slideUpFade 700ms cubic-bezier(0.16,1,0.3,1) both' }}>

            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.22)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623] flex-shrink-0" style={{ animation: 'pulseGlow 2.5s ease-in-out infinite' }} />
              <span className="text-[#F5A623] font-display text-[11px] sm:text-[12px] uppercase tracking-[0.2em]">
                Precision Training Analytics
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1
                className="font-display font-black leading-[1.0] tracking-tight"
                style={{ fontSize: 'clamp(3rem, 11vw, 6.5rem)', letterSpacing: '-0.02em' }}
              >
                <span className="block text-[#F0F4FF]" style={{ animation: 'textReveal 600ms cubic-bezier(0.16,1,0.3,1) 0ms both' }}>
                  Master
                </span>
                <span className="block gradient-text" style={{ animation: 'textReveal 600ms cubic-bezier(0.16,1,0.3,1) 120ms both' }}>
                  Every Shot.
                </span>
              </h1>
              <p
                className="font-body text-[#8892A4] text-[15px] sm:text-[17px] mt-4 sm:mt-6"
                style={{ animation: 'slideUpFade 700ms 260ms both', maxWidth: '34rem', lineHeight: '1.75' }}
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
                  <span className="text-[#6B7A96] text-[10px] sm:text-[11px] font-display uppercase tracking-[0.15em]">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div
              className="flex items-center pt-1"
              style={{ animation: 'slideUpFade 700ms 420ms both' }}
            >
              <MagneticButton>
                <Link href="/auth/register" className="btn btn-primary text-sm px-6 sm:px-8 py-3.5 sm:py-3 gap-2 justify-center">
                  Start Free →
                </Link>
              </MagneticButton>
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
              <p className="text-[#6B7A96] text-sm font-display">
                Trusted by <span className="text-[#C8D0E0]">2,400+</span> competitive shooters
              </p>
            </div>
          </div>

          {/* Animated target — below copy on mobile */}
          <div
            className="flex items-center justify-center"
            style={{ animation: 'slideUpFade 700ms 250ms both' }}
          >
            <AnimatedHeroTarget scrollY={scrollY} />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to top, #080A0F, transparent)' }} />
    </section>
  );
}

// ── Animated Hero Target ──────────────────────────────────────────────────────

function AnimatedHeroTarget({ scrollY }: { scrollY: number }) {
  const [tick, setTick]             = useState(0);
  const [sweepAngle, setSweepAngle] = useState(0);
  const tickRef = useRef(0);

  const dots = [
    { x:186, y:178, score:10.3 }, { x:191, y:184, score:10.1 },
    { x:179, y:187, score:9.7  }, { x:184, y:172, score:10.6 },
    { x:196, y:180, score:9.9  }, { x:177, y:179, score:10.2 },
    { x:188, y:191, score:9.6  }, { x:183, y:176, score:10.4 },
    { x:193, y:188, score:9.8  }, { x:175, y:183, score:10.0 },
    { x:187, y:195, score:9.3  }, { x:194, y:175, score:10.1 },
    { x:180, y:192, score:9.5  }, { x:190, y:181, score:10.5 },
    { x:176, y:186, score:9.8  }, { x:185, y:170, score:10.7 },
    { x:198, y:185, score:9.2  }, { x:178, y:175, score:10.3 },
    { x:192, y:193, score:9.6  }, { x:183, y:188, score:10.0 },
    { x:189, y:177, score:10.4 }, { x:182, y:190, score:9.7  },
    { x:195, y:183, score:9.9  }, { x:174, y:180, score:10.2 },
    { x:186, y:194, score:9.4  }, { x:191, y:172, score:10.6 },
    { x:177, y:185, score:10.1 }, { x:184, y:176, score:10.3 },
    { x:197, y:189, score:9.5  }, { x:180, y:179, score:10.0 },
    { x:188, y:196, score:9.2  }, { x:193, y:174, score:10.5 },
    { x:176, y:182, score:9.8  }, { x:185, y:190, score:9.6  },
    { x:199, y:177, score:9.3  }, { x:181, y:173, score:10.7 },
    { x:190, y:186, score:9.9  }, { x:174, y:188, score:10.1 },
    { x:187, y:180, score:10.4 }, { x:183, y:195, score:9.5  },
    { x:192, y:178, score:10.2 },
  ];

  useEffect(() => {
    function startCycle() {
      tickRef.current = 0;
      setTick(0);
      const id = setInterval(() => {
        tickRef.current += 1;
        setTick(tickRef.current);
        if (tickRef.current >= 41) {
          clearInterval(id);
          setTimeout(startCycle, 2000);
        }
      }, 400);
    }
    startCycle();
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
    <div
      className="relative w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[440px] mx-auto"
      style={{
        transform: `translateY(${-Math.min(scrollY * 0.12, 60)}px)`,
        willChange: 'transform',
        transition: 'transform 50ms linear',
      }}
    >

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
          { x: 40,  label: 'RANGE', value: '40–60',                               color: '#8892A4' },
          { x: 155, label: 'AVG',   value: avg  !== null ? avg.toFixed(2)  : '—', color: '#F5A623' },
          { x: 270, label: 'BEST',  value: best !== null ? best.toFixed(1) : '—', color: '#00E5A0' },
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
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="relative overflow-hidden py-4 sm:py-5"
      style={{ background: 'linear-gradient(90deg, #080A0F 0%, #0D111C 50%, #080A0F 100%)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #080A0F, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, #080A0F, transparent)' }} />

      <div className="flex gap-10 sm:gap-14 whitespace-nowrap" style={{ animation: 'marquee 30s linear infinite', animationPlayState: paused ? 'paused' : 'running' }}>
        {[...disciplines, ...disciplines].map((d, i) => (
          <span
            key={i}
            className="font-display text-[12px] sm:text-[13px] uppercase
                       tracking-[0.18em] flex-shrink-0 flex items-center gap-2.5 sm:gap-3"
            style={{ color: '#6B7A96' }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: i % 3 === 0 ? '#F5A623' : i % 3 === 1 ? '#4FC3F7' : '#00E5A0', opacity: 0.7 }} />
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
      <p className="text-[#6B7A96] font-display text-[11px] sm:text-[12px] uppercase tracking-[0.18em] mt-2 sm:mt-3">
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

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-16">
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
        minHeight: '220px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 600ms ${idx * 60}ms, transform 600ms ${idx * 60}ms cubic-bezier(0.16,1,0.3,1), border-color 300ms, box-shadow 300ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = `${feature.color}40`;
        el.style.boxShadow   = `0 12px 48px -8px ${feature.color}28, 0 4px 24px rgba(0,0,0,0.5)`;
        el.style.transform   = 'translateY(-4px)';
        const glow = el.querySelector('[data-glow]') as HTMLElement | null;
        if (glow) glow.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = '#1E2433';
        el.style.boxShadow   = 'none';
        el.style.transform   = 'translateY(0)';
        const glow = el.querySelector('[data-glow]') as HTMLElement | null;
        if (glow) glow.style.opacity = '0.35';
      }}
    >
      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${feature.color}, transparent)` }} />

      {/* Corner glow — always visible at low opacity */}
      <div
        data-glow="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 15% 15%, ${feature.glow} 0%, transparent 60%)`,
          opacity: 0.35,
          transition: 'opacity 500ms',
        }}
      />

      <div className="relative p-5 sm:p-6 lg:p-7 flex flex-col h-full">
        {/* Icon */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 mb-4 sm:mb-5"
          style={{ background: feature.glow, color: feature.color }}>
          {feature.icon}
        </div>

        <h3 className="font-display font-bold text-[#F0F4FF] text-base sm:text-[17px] tracking-wide mb-2.5">
          {feature.title}
        </h3>
        <p className="text-[#8892A4] text-sm sm:text-[15px] flex-1" style={{ lineHeight: '1.7' }}>{feature.desc}</p>

        {/* Bottom colour tick */}
        <div className="mt-4 sm:mt-5 h-px w-8 opacity-40 group-hover:w-full group-hover:opacity-60 transition-all duration-500"
          style={{ background: `linear-gradient(90deg, ${feature.color}, transparent)` }} />

        {/* SVG watermark icon */}
        <div
          className="absolute bottom-4 right-4 pointer-events-none select-none"
          style={{ opacity: 0.055, width: 60, height: 60, color: feature.color }}
          aria-hidden="true"
        >
          <div style={{ transform: 'scale(3)', transformOrigin: 'bottom right' }}>
            {feature.icon}
          </div>
        </div>
      </div>
    </div>
  );
}

function BentoFeatures() {
  const [headRef, headVis] = useSectionReveal();
  return (
    <section id="features" className="py-14 sm:py-20 lg:py-32 max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
      <div ref={headRef} className="text-center mb-12 sm:mb-16 lg:mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 sm:mb-6"
          style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }} />
          <span className="text-[#F5A623] font-display text-[11px] sm:text-[12px] uppercase tracking-[0.22em]">Platform Features</span>
        </div>
        <h2
          className="font-display font-black leading-[1.0]"
          style={{
            fontSize: 'clamp(2.4rem, 6.5vw, 5rem)',
            letterSpacing: '-0.02em',
            animation: headVis ? 'textReveal 700ms cubic-bezier(0.16,1,0.3,1) both' : 'none',
            opacity: headVis ? undefined : 0,
          }}
        >
          <span className="text-[#F0F4FF]">Everything a shooter </span>
          <span className="gradient-text">needs.</span>
        </h2>
        <p className="font-body text-[#9CA3B4] mt-5 sm:mt-6 max-w-2xl mx-auto text-[16px] sm:text-[18px] px-4 sm:px-0" style={{ lineHeight: '1.75' }}>
          From first session to elite performance — Marksman covers every step of the training loop with tools built for serious competitors.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {FEATURES.map((f, i) => <BentoCard key={f.id} feature={f} idx={i} />)}
      </div>
    </section>
  );
}

// ── AI & Health Section ───────────────────────────────────────────────────────

function BiometricCardContent() {
  const [bpm, setBpm] = useState(62);
  const [phase, setPhase] = useState(0); // 0=resting,1=aim,2=peak
  const [drawn, setDrawn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate BPM value
  useEffect(() => {
    const t = setInterval(() => {
      setBpm(prev => {
        const drift = (Math.random() - 0.5) * 3;
        return Math.round(Math.max(55, Math.min(78, prev + drift)));
      });
    }, 900);
    return () => clearInterval(t);
  }, []);

  // Cycle aim phases
  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 3), 2800);
    return () => clearInterval(t);
  }, []);

  // Trigger ECG draw on viewport enter
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setDrawn(false); setTimeout(() => setDrawn(true), 50); } else { setDrawn(false); } },
      { threshold: 0.3 }
    );
    if (containerRef.current) io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  const bpmColor = bpm > 72 ? '#FF4D6D' : bpm > 65 ? '#F5A623' : '#00E5A0';
  const phaseLabels = ['RESTING', 'AIM PHASE', 'PEAK'];
  const phaseColors = ['#00E5A0', '#4FC3F7', '#FF4D6D'];

  // ECG path with gradient stroke points
  const ecgPoints = "0,40 45,40 50,38 55,22 58,10 62,60 66,44 70,40 78,40 120,40 125,38 130,22 133,10 137,60 141,44 145,40 153,40 280,40";

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      {/* Live BPM display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: bpmColor }}
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-[10px] font-display uppercase tracking-[0.15em]" style={{ color: '#4A5568' }}>Live BPM</span>
        </div>
        <motion.span
          key={bpm}
          className="font-data font-black text-xl tabular-nums"
          style={{ color: bpmColor, textShadow: `0 0 16px ${bpmColor}60` }}
          initial={{ opacity: 0.5, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {bpm}
        </motion.span>
      </div>

      {/* ECG Canvas */}
      <div className="rounded-xl overflow-hidden relative"
        style={{ background: '#060810', border: '1px solid rgba(255,77,109,0.15)', boxShadow: `0 0 20px rgba(255,77,109,0.05)` }}>
        <svg viewBox="0 0 280 80" className="w-full" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="ecgGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#00E5A0" />
              <stop offset="50%"  stopColor="#F5A623" />
              <stop offset="100%" stopColor="#FF4D6D" />
            </linearGradient>
            <filter id="ecgGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="280" height="80" fill="#060810" />

          {/* Grid lines */}
          {[20,40,60].map(y => (
            <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="#1E2433" strokeWidth="0.5" strokeDasharray="4 6" />
          ))}

          {/* ECG fill */}
          <path
            d={`M0,80 0,40 45,40 50,38 55,22 58,10 62,60 66,44 70,40 78,40 120,40 125,38 130,22 133,10 137,60 141,44 145,40 153,40 280,40 280,80 Z`}
            fill="url(#ecgGrad)" fillOpacity="0.07"
          />

          {/* ECG line */}
          <polyline
            points={ecgPoints}
            fill="none"
            stroke="url(#ecgGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="800"
            strokeDashoffset={drawn ? 0 : 800}
            style={{
              transition: drawn ? 'stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1)' : 'none',
              filter: 'url(#ecgGlow)',
            }}
          />

          {/* Animated endpoint dot */}
          <circle cx="280" cy="40" r="3.5" fill="#FF4D6D" style={{ animation: 'pulseGlow 1.4s ease-in-out infinite' }} />

          {/* Phase label */}
          <text x="10" y="72" fill="#2A3350" fontSize="7" fontFamily="Rajdhani, sans-serif" fontWeight="700" letterSpacing="0.15em">
            {phaseLabels[phase]}
          </text>
        </svg>
      </div>

      {/* Stats pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: `AVG ${Math.round(bpm - 2)} BPM`, color: '#FF4D6D' },
          { label: phaseLabels[phase], color: phaseColors[phase] },
          { label: 'REST 58 BPM', color: '#4FC3F7' },
        ].map(({ label, color }) => (
          <span key={label} className="px-2.5 py-1 rounded-full text-[10px] font-display tracking-wide"
            style={{ background: `${color}10`, border: `1px solid ${color}30`, color }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── AI Coaching Engine card ────────────────────────────────────────────────────

const AI_MESSAGES = [
  { role: 'ai', text: 'Detected: Right drift in shots 47–52.' },
  { role: 'ai', text: 'Trigger finger placement may need adjustment.' },
  { role: 'ai', text: 'Follow-through consistency: 73%. Improve to 85%+.' },
];

function AICoachCardContent() {
  const [visibleMsg, setVisibleMsg] = useState(0);
  const [typed, setTyped] = useState('');
  const [scanning, setScanning] = useState(true);

  // Cycle through messages with typewriter
  useEffect(() => {
    const full = AI_MESSAGES[visibleMsg].text;
    let i = 0;
    setTyped('');
    const t = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(t);
        setTimeout(() => setVisibleMsg(m => (m + 1) % AI_MESSAGES.length), 2200);
      }
    }, 28);
    return () => clearInterval(t);
  }, [visibleMsg]);

  // Scanning pulse
  useEffect(() => {
    const t = setInterval(() => setScanning(s => !s), 1600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Scanning header */}
      <div className="rounded-xl overflow-hidden relative"
        style={{ background: '#060810', border: '1px solid rgba(245,166,35,0.18)' }}>

        {/* Shooter silhouette + scan lines */}
        <div className="relative h-28 flex items-center justify-center overflow-hidden">
          {/* Grid overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 280 112" preserveAspectRatio="none">
            {[28,56,84].map(y => (
              <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="#F5A623" strokeWidth="0.4" strokeDasharray="6 8" />
            ))}
            {[56,112,168,224].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="112" stroke="#F5A623" strokeWidth="0.4" strokeDasharray="6 8" />
            ))}
          </svg>

          {/* Shooter silhouette */}
          <svg width="56" height="90" viewBox="0 0 56 90" fill="none" className="relative z-10">
            {/* Head */}
            <circle cx="28" cy="10" r="8" fill="#1E2A3A" stroke="rgba(245,166,35,0.4)" strokeWidth="0.8" />
            {/* Torso */}
            <path d="M16 22 Q28 18 40 22 L38 60 Q28 64 18 60 Z" fill="#1E2A3A" stroke="rgba(245,166,35,0.4)" strokeWidth="0.8" />
            {/* Arms — aiming pose */}
            <path d="M16 28 L4 36" stroke="rgba(245,166,35,0.5)" strokeWidth="3" strokeLinecap="round" />
            <path d="M40 28 L52 26" stroke="rgba(245,166,35,0.5)" strokeWidth="3" strokeLinecap="round" />
            {/* Rifle */}
            <rect x="38" y="23" width="18" height="3" rx="1.5" fill="rgba(245,166,35,0.6)" />
            {/* Legs */}
            <path d="M20 60 L18 82 M36 60 L38 82" stroke="rgba(245,166,35,0.4)" strokeWidth="3" strokeLinecap="round" />
          </svg>

          {/* Animated target detection box */}
          <motion.div
            className="absolute"
            style={{
              width: 64, height: 64,
              border: '1.5px solid #F5A623',
              borderRadius: 4,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Corner accents */}
            {[
              { top: -2, left: -2, borderRight: 'none', borderBottom: 'none' },
              { top: -2, right: -2, borderLeft: 'none', borderBottom: 'none' },
              { bottom: -2, left: -2, borderRight: 'none', borderTop: 'none' },
              { bottom: -2, right: -2, borderLeft: 'none', borderTop: 'none' },
            ].map((s, i) => (
              <div key={i} className="absolute w-2.5 h-2.5" style={{ border: '2px solid #F5A623', ...s }} />
            ))}
          </motion.div>

          {/* Scanning line sweep */}
          <motion.div
            className="absolute inset-x-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.6), transparent)' }}
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Status badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)' }}>
            <motion.div className="w-1.5 h-1.5 rounded-full bg-[#F5A623]"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
            <span className="text-[9px] font-display uppercase tracking-widest text-[#F5A623]">Analyzing</span>
          </div>
        </div>
      </div>

      {/* AI message bubble with typewriter */}
      <AnimatePresence mode="wait">
        <motion.div
          key={visibleMsg}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.3 }}
          className="px-3.5 py-3 rounded-xl text-[13px] text-[#F0F4FF]"
          style={{ background: 'rgba(245,166,35,0.06)', borderLeft: '2px solid #F5A623', borderRadius: '0 12px 12px 0' }}
        >
          {typed}
          <span className="inline-block w-0.5 h-3.5 bg-[#F5A623] ml-0.5 animate-pulse align-middle" />
        </motion.div>
      </AnimatePresence>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'DRIFT', value: 'RIGHT', color: '#FF4D6D' },
          { label: 'FOLLOW', value: '73%', color: '#F5A623' },
          { label: 'PATTERN', value: '6 SHOTS', color: '#4FC3F7' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg px-2 py-1.5 text-center"
            style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
            <p className="text-[9px] font-display uppercase tracking-widest" style={{ color: '#4A5568' }}>{label}</p>
            <p className="font-data font-bold text-xs tabular-nums" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Performance Prediction card ────────────────────────────────────────────────

const PERF_POINTS: [number, number][] = [[30,72],[65,65],[100,60],[135,55],[170,48],[205,42],[240,38],[265,32]];

function PerfPredictionCardContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [projValue, setProjValue] = useState(9.80);

  // Trigger on viewport enter/exit
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setDrawn(false); setTimeout(() => setDrawn(true), 80); }
        else { setDrawn(false); }
      },
      { threshold: 0.2 }
    );
    if (containerRef.current) io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  // Animate projected value counting up
  useEffect(() => {
    if (!drawn) { setProjValue(9.80); return; }
    const target = 10.43;
    const start = 9.80;
    const duration = 1800;
    const startTime = performance.now();
    const raf = (ts: number) => {
      const p = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setProjValue(+(start + (target - start) * ease).toFixed(2));
      if (p < 1) requestAnimationFrame(raf);
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [drawn]);

  const pathD = `M${PERF_POINTS.map(([x,y]) => `${x},${y}`).join(' L')}`;
  const fillD = `M30,82 ${PERF_POINTS.map(([x,y]) => `L${x},${y}`).join(' ')} L265,82 Z`;
  const totalLen = 520; // approximate polyline length

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      {/* Chart */}
      <div className="rounded-xl overflow-hidden relative"
        style={{ background: '#060810', border: '1px solid rgba(79,195,247,0.15)', boxShadow: '0 0 20px rgba(79,195,247,0.04)' }}>
        <svg viewBox="0 0 290 95" className="w-full" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="perfFill2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#4FC3F7" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#4FC3F7" stopOpacity="0"    />
            </linearGradient>
            <linearGradient id="perfStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#00E5A0" />
              <stop offset="70%"  stopColor="#4FC3F7" />
              <stop offset="100%" stopColor="#4FC3F7" />
            </linearGradient>
            <filter id="perfGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="290" height="95" fill="#060810" />

          {/* Grid */}
          {[30,47,64,81].map(y => (
            <line key={y} x1="28" y1={y} x2="285" y2={y} stroke="#1E2433" strokeWidth="0.5" strokeDasharray="4 6" />
          ))}
          {/* Y labels */}
          {[['10.4',30],['10.0',47],['9.6',64],['9.2',81]].map(([v,y]) => (
            <text key={String(v)} x="4" y={Number(y)+3} fill="#2A3350" fontSize="6.5" fontFamily="JetBrains Mono,monospace">{v}</text>
          ))}

          {/* Projection zone */}
          <rect x="260" y="15" width="28" height="72" fill="rgba(79,195,247,0.03)" />
          <line x1="261" y1="15" x2="261" y2="85" stroke="#4FC3F7" strokeWidth="0.7" strokeDasharray="3 4" opacity="0.4" />
          <text x="263" y="20" fill="#4FC3F7" fontSize="6" fontFamily="Rajdhani,sans-serif" fontWeight="600" letterSpacing="0.1em" opacity="0.6">PROJ</text>

          {/* Gradient fill */}
          <path d={fillD} fill="url(#perfFill2)"
            style={{
              opacity: drawn ? 1 : 0,
              transition: drawn ? 'opacity 600ms 400ms ease' : 'none',
            }}
          />

          {/* Main trend line — animated draw */}
          <polyline
            points={PERF_POINTS.map(([x,y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="url(#perfStroke)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={totalLen}
            strokeDashoffset={drawn ? 0 : totalLen}
            style={{
              transition: drawn ? `stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)` : 'none',
              filter: 'url(#perfGlow)',
            }}
          />

          {/* Projected dashed extension */}
          <polyline
            points="265,32 285,20"
            fill="none" stroke="#4FC3F7" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.7"
            style={{ filter: 'url(#perfGlow)' }}
          />

          {/* Historical dots */}
          {PERF_POINTS.map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="2.5" fill="#4FC3F7"
              style={{
                opacity: drawn ? 1 : 0,
                transition: `opacity 200ms ${300 + i * 120}ms ease`,
              }}
            />
          ))}

          {/* Projected future dots */}
          {[[275,26],[285,20]].map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r="2.5" fill="none" stroke="#4FC3F7" strokeWidth="1.5"
              strokeDasharray="3 2"
              style={{
                opacity: drawn ? 0.7 : 0,
                transition: `opacity 300ms ${1200 + i * 150}ms ease`,
              }}
            />
          ))}

          {/* Glowing endpoint */}
          <circle cx="285" cy="20" r="4" fill="#4FC3F7"
            style={{ animation: 'pulseGlow 1.6s ease-in-out infinite', opacity: drawn ? 1 : 0 }} />
        </svg>
      </div>

      {/* Animated stat row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'PROJECTED', value: projValue.toFixed(2), color: '#4FC3F7' },
          { label: 'GAIN', value: '+0.43', color: '#00E5A0' },
          { label: 'CONFIDENCE', value: '91%', color: '#F5A623' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg px-2 py-1.5 text-center"
            style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
            <p className="text-[9px] font-display uppercase tracking-widest" style={{ color: '#4A5568' }}>{label}</p>
            <p className="font-data font-bold text-xs tabular-nums" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AICard wrapper ─────────────────────────────────────────────────────────────

function AICard({ title, tagline, accentColor, icon, idx, children }: {
  title: string; tagline: string; accentColor: string; icon: React.ReactNode; idx: number; children: React.ReactNode;
}) {
  const scrollDir = useScrollDirection();

  return (
    <motion.div
      className="relative rounded-2xl flex flex-col"
      style={{
        background: 'rgba(10,13,24,0.75)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}
      initial={{ opacity: 0, y: scrollDir === 'down' ? 36 : -36, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: false, margin: '-80px' }}
      transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
      whileHover={{
        y: -8,
        boxShadow: `0 28px 64px -12px ${accentColor}35, 0 0 0 1px ${accentColor}25`,
        transition: { duration: 0.28, ease: 'easeOut' },
      }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${accentColor}08, transparent 70%)` }} />

      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

      {/* Subtle corner glow */}
      <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none"
        style={{ background: `radial-gradient(circle at 0% 0%, ${accentColor}10, transparent 70%)` }} />

      <div className="p-5 sm:p-6 flex flex-col gap-4 flex-1"
        style={{ animation: `floatY ${6 + idx * 0.8}s ease-in-out infinite`, animationDelay: `${idx * 0.4}s` }}>
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accentColor}12`, color: accentColor, border: `1px solid ${accentColor}20` }}
            whileHover={{ scale: 1.12, background: `${accentColor}22` }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
          <div>
            <h3 className="font-display font-bold text-[#F0F4FF] text-base tracking-wide">{title}</h3>
            <p className="text-[#6B7A96] text-[13px] mt-0.5">{tagline}</p>
          </div>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </motion.div>
  );
}

function AIHealthSection() {
  const scrollDir = useScrollDirection();
  return (
    <section
      id="ai-health"
      className="py-14 sm:py-20 lg:py-32 relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #080A0F 0%, #080D1A 35%, #0A0F1C 65%, #080A0F 100%)',
        borderTop: '1px solid #1E2433',
        borderBottom: '1px solid #1E2433',
      }}
    >
      {/* Background ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #FF4D6D, transparent)', filter: 'blur(80px)', transform: 'translate(-50%,-50%)' }} />
        <div className="absolute top-1/2 left-1/2 w-[700px] h-[500px] rounded-full opacity-[0.035]"
          style={{ background: 'radial-gradient(ellipse, #F5A623, transparent)', filter: 'blur(100px)', transform: 'translate(-50%,-50%)' }} />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #4FC3F7, transparent)', filter: 'blur(80px)', transform: 'translate(50%,-50%)' }} />
        {/* Subtle noise overlay */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px' }} />
      </div>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 relative">
        {/* Section header — Framer Motion bidirectional */}
        <motion.div
          className="text-center mb-12 sm:mb-16 lg:mb-20"
          initial={{ opacity: 0, y: scrollDir === 'down' ? 30 : -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 sm:mb-6"
            style={{ background: 'rgba(79,195,247,0.07)', border: '1px solid rgba(79,195,247,0.22)' }}>
            <motion.span className="w-1.5 h-1.5 rounded-full bg-[#4FC3F7]"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-[#4FC3F7] font-display text-[11px] sm:text-[12px] uppercase tracking-[0.22em]">AI-Powered Intelligence</span>
          </div>
          <h2
            className="font-display font-black leading-[1.0]"
            style={{ fontSize: 'clamp(2.4rem, 6.5vw, 5rem)', letterSpacing: '-0.02em' }}
          >
            <span className="text-[#F0F4FF]">Train smarter. </span>
            <span style={{ background: 'linear-gradient(135deg, #4FC3F7 20%, #00E5A0 80%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Recover faster.
            </span>
          </h2>
          <motion.p
            className="font-body text-[#9CA3B4] mt-5 sm:mt-6 max-w-2xl mx-auto text-[16px] sm:text-[18px] px-4 sm:px-0"
            style={{ lineHeight: '1.75' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            From biometric monitoring to predictive coaching — Marksman&apos;s AI layer turns raw session data into actionable intelligence you can act on immediately.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 — Biometric Monitoring */}
          <AICard title="Stress Monitoring" tagline="Real-time biometrics during aim phases" accentColor="#FF4D6D" icon={<HeartIcon />} idx={0}>
            <BiometricCardContent />
          </AICard>

          {/* Card 2 — AI Coaching Engine */}
          <AICard title="AI Coaching Engine" tagline="Pattern analysis and personalized feedback" accentColor="#F5A623" icon={<SparkleIcon />} idx={1}>
            <AICoachCardContent />
          </AICard>

          {/* Card 3 — Performance Prediction */}
          <AICard title="Performance Prediction" tagline="Score trajectory and projected improvement" accentColor="#4FC3F7" icon={<ChartLineIcon />} idx={2}>
            <PerfPredictionCardContent />
          </AICard>
        </div>
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
  const [headRef, headVis] = useSectionReveal();

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
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-12">
        <div ref={headRef} className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 sm:mb-6"
            style={{ background: 'rgba(0,229,160,0.07)', border: '1px solid rgba(0,229,160,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" style={{ animation: 'pulseGlowGreen 2s ease-in-out infinite' }} />
            <span className="text-[#00E5A0] font-display text-[11px] sm:text-[12px] uppercase tracking-[0.22em]">Get started in minutes</span>
          </div>
          <h2
            className="font-display font-black text-[#F0F4FF] leading-[1.0]"
            style={{
              fontSize: 'clamp(2.4rem, 6.5vw, 5rem)',
              letterSpacing: '-0.02em',
              animation: headVis ? 'textReveal 700ms cubic-bezier(0.16,1,0.3,1) both' : 'none',
              opacity: headVis ? undefined : 0,
            }}
          >
            Three steps to<br />
            <span className="gradient-text">peak performance.</span>
          </h2>
          <p className="font-body text-[#9CA3B4] mt-5 sm:mt-6 max-w-xl mx-auto text-[16px] sm:text-[18px]" style={{ lineHeight: '1.75' }}>
            Up and running in under 60 seconds. No setup fees, no credit card required.
          </p>
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
              className="relative rounded-2xl p-6 sm:p-8 flex flex-row sm:flex-col gap-5 sm:gap-6 sm:items-start"
              style={{
                background: 'linear-gradient(135deg, rgba(14,17,24,0.95), rgba(10,13,20,0.95))',
                border: `1px solid ${s.color}22`,
                boxShadow: active >= i ? `0 0 0 1px ${s.color}18, 0 16px 48px -8px rgba(0,0,0,0.6)` : '0 8px 32px rgba(0,0,0,0.4)',
                opacity: active >= i ? 1 : 0,
                transform: active >= i ? 'translateY(0)' : 'translateY(28px)',
                transition: `all 600ms ${i * 180}ms cubic-bezier(0.16,1,0.3,1)`,
              }}
            >
              {/* Number badge */}
              <div className="shrink-0 flex items-center justify-center z-10"
                style={{
                  width: 56, height: 56,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${s.color}18, ${s.color}08)`,
                  border: `1px solid ${s.color}40`,
                  boxShadow: active >= i ? `0 0 20px ${s.glow}` : 'none',
                  transition: 'box-shadow 600ms',
                }}>
                <span className="font-display font-black text-2xl" style={{ color: s.color }}>{s.num}</span>
              </div>
              <div className="flex-1 sm:flex-none">
                {/* Color top bar on desktop */}
                <div className="hidden sm:block h-px w-10 mb-5" style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
                <h3 className="font-display font-bold text-[#F0F4FF] text-xl sm:text-2xl mb-3" style={{ letterSpacing: '-0.01em' }}>{s.title}</h3>
                <p className="font-body text-[#8892A4] text-[15px] sm:text-[16px]" style={{ lineHeight: '1.75' }}>{s.desc}</p>
                <div className="mt-4 sm:mt-5 flex items-center gap-2">
                  <span className="text-[12px] font-display uppercase tracking-[0.15em]" style={{ color: s.color }}>Step {s.num}</span>
                  <span className="h-px flex-1 opacity-20" style={{ background: s.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Role Showcase ──────────────────────────────────────────────────────────────

type RoleTab = 'shooter' | 'coach' | 'soldier';

function CoachVisualInline() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden p-4 sm:p-6"
      style={{ background: '#0C0F1A', border: '1px solid #1E2433', boxShadow: '0 20px 60px rgba(0,0,0,0.55)' }}
    >
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #4FC3F7, transparent)' }} />
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <p className="font-display font-bold text-[#F0F4FF] text-base uppercase tracking-[0.12em]">Your Shooters</p>
        <span className="text-[11px] font-display uppercase tracking-[0.1em] px-2.5 py-1 rounded-md"
          style={{ color: '#4FC3F7', background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)' }}>
          3 Connected
        </span>
      </div>
      {[
        { name: 'Alex Morgan', avg: '9.84',  trend: '+0.12', pos: 'Standing', shots: 48, up: true  },
        { name: 'Sam Chen',    avg: '10.21', trend: '+0.35', pos: 'Prone',    shots: 60, up: true  },
        { name: 'Jordan Hill', avg: '9.57',  trend: '−0.08', pos: 'Kneeling', shots: 30, up: false },
      ].map((s) => (
        <div key={s.name} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl mb-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 font-display font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, rgba(79,195,247,0.12), rgba(245,166,35,0.06))', color: '#4FC3F7', border: '1px solid rgba(79,195,247,0.15)' }}>
            {s.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#F0F4FF] text-base font-medium truncate">{s.name}</p>
            <p className="text-[#6B7A96] text-[12px] font-display uppercase tracking-wide mt-0.5">{s.pos} · {s.shots} shots</p>
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
          <p className="text-[#4FC3F7] text-[11px] sm:text-[12px] font-display uppercase tracking-[0.14em]">New feedback · Alex's session</p>
        </div>
        <p className="text-[#8892A4] text-sm leading-relaxed italic">
          "Good trigger discipline today. Focus on hold area — still drifting right before release."
        </p>
      </div>
    </div>
  );
}

function ShooterVisual() {
  const scores = [8.9, 9.1, 9.3, 9.4, 9.6, 9.8, 10.1, 10.3];
  const minS = 8.7, maxS = 10.5;
  const w = 240, h = 80;
  const toY = (s: number) => h - ((s - minS) / (maxS - minS)) * h;
  const pts = scores.map((s, i) => `${(i / (scores.length - 1)) * w},${toY(s)}`).join(' ');
  const fillPts = `${pts} ${w},${h} 0,${h}`;
  return (
    <div className="relative rounded-2xl overflow-hidden p-4 sm:p-6"
      style={{ background: '#0C0F1A', border: '1px solid #1E2433', boxShadow: '0 20px 60px rgba(0,0,0,0.55)' }}>
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #F5A623, transparent)' }} />
      <div className="flex items-center justify-between mb-4">
        <p className="font-display font-bold text-[#F0F4FF] text-base uppercase tracking-[0.12em]">Session Progress</p>
        <span className="text-[11px] font-display uppercase tracking-[0.1em] px-2.5 py-1 rounded-md"
          style={{ color: '#00E5A0', background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)' }}>Active</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full mb-4" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="shooterFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5A623" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={fillPts} fill="url(#shooterFill)" />
        <polyline points={pts} fill="none" stroke="#F5A623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {scores.map((s, i) => {
          const x = (i / (scores.length - 1)) * w;
          const y = toY(s);
          const isLast = i === scores.length - 1;
          return (
            <circle key={i} cx={x} cy={y} r={isLast ? 4 : 2.5} fill="#F5A623"
              style={isLast ? { animation: 'pulseGlow 2s ease-in-out infinite' } : {}} />
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mb-3">
        {[
          { label: 'AVG', value: '9.71', color: '#F5A623' },
          { label: 'BEST', value: '10.3', color: '#00E5A0' },
          { label: 'STREAK', value: '7', color: '#4FC3F7' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="font-jetbrains font-bold text-base leading-none" style={{ color }}>{value}</span>
            <span className="text-[#6B7A96] text-[11px] font-display uppercase tracking-[0.14em]">{label}</span>
          </div>
        ))}
      </div>
      <div className="p-2.5 rounded-xl flex items-center justify-between"
        style={{ background: 'rgba(0,229,160,0.04)', border: '1px solid rgba(0,229,160,0.12)' }}>
        <p className="text-[#8892A4] text-sm">Session #52 · Prone · 10 shots · <span className="text-[#F5A623] font-jetbrains font-bold">9.94 avg</span></p>
        <span className="font-bold text-sm" style={{ color: '#00E5A0' }}>↑</span>
      </div>
    </div>
  );
}

function SoldierVisual() {
  type WeaponKey = 'ak' | 'insas' | 'pistol';
  const [weapon, setWeapon] = useState<WeaponKey>('ak');
  const weapons: Record<WeaponKey, { label: string; score: string; total: string }> = {
    ak:     { label: 'AK-203',  score: '38', total: '40' },
    insas:  { label: 'INSAS',   score: '35', total: '40' },
    pistol: { label: 'Pistol',  score: '29', total: '30' },
  };
  const w = weapons[weapon];
  return (
    <div className="relative rounded-2xl overflow-hidden p-4 sm:p-6"
      style={{ background: '#0C0F1A', border: '1px solid #1E2433', boxShadow: '0 20px 60px rgba(0,0,0,0.55)' }}>
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #00E5A0, transparent)' }} />
      <div className="flex items-center justify-between mb-4">
        <p className="font-display font-bold text-[#F0F4FF] text-base uppercase tracking-[0.12em]">Qualification Record</p>
        <span className="text-[11px] font-display uppercase tracking-[0.1em] px-2.5 py-1 rounded-md"
          style={{ color: '#6B7A96', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>CLASSIFIED</span>
      </div>
      <div className="flex gap-1 mb-5">
        {(['ak', 'insas', 'pistol'] as WeaponKey[]).map((k) => (
          <button key={k} onClick={() => setWeapon(k)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-display uppercase tracking-wide transition-all duration-200"
            style={{
              background: weapon === k ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.03)',
              border: weapon === k ? '1px solid rgba(0,229,160,0.3)' : '1px solid rgba(255,255,255,0.06)',
              color: weapon === k ? '#00E5A0' : '#4A5568',
            }}>
            {weapons[k].label}{weapon === k ? ' ✓' : ''}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-3 mb-5">
        <span className="font-jetbrains font-black leading-none" style={{ fontSize: 'clamp(2.8rem, 10vw, 4rem)', color: '#00E5A0' }}>
          {w.score}/{w.total}
        </span>
        <div className="flex flex-col pb-2">
          <span className="text-[#4A5568] text-[9px] font-display uppercase tracking-[0.14em]">ROUNDS</span>
          <span className="font-display font-black text-xl mt-1" style={{ color: '#00E5A0' }}>GO ✓</span>
        </div>
      </div>
      {[
        { label: 'Group Radius', value: '4.2cm',   color: '#F5A623' },
        { label: 'Qualification', value: 'Q3-2025', color: '#4FC3F7' },
        { label: 'Distance',     value: '100m',    color: '#00E5A0' },
      ].map(({ label, value, color }) => (
        <div key={label} className="flex items-center justify-between py-2 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <span className="text-[#6B7A96] text-sm font-display uppercase tracking-wide">{label}</span>
          <span className="font-jetbrains font-bold text-sm" style={{ color }}>{value}</span>
        </div>
      ))}
      <p className="text-[#4A5568] text-[12px] font-display uppercase tracking-wide mt-3">
        Next qualification due: Q1-2026
      </p>
    </div>
  );
}

function ShooterPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">
      <div className="order-2 lg:order-1"><ShooterVisual /></div>
      <div className="order-1 lg:order-2 space-y-6 sm:space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
          style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
          <span className="text-[#F5A623] font-display text-[11px] uppercase tracking-[0.2em]">For Shooters</span>
        </div>
        <h2 className="font-display font-black leading-[1.0]" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', letterSpacing: '-0.02em' }}>
          <span className="text-[#F0F4FF]">Every shot</span><br />
          <span className="gradient-text">tells a story.</span>
        </h2>
        <p className="font-body text-[#9CA3B4] text-[16px] sm:text-[17px]" style={{ lineHeight: '1.75' }}>
          Log every session, analyse patterns across hundreds of shots, and let the platform surface what&apos;s holding you back — before your next competition.
        </p>
        <ul className="space-y-3 sm:space-y-4">
          {[
            { sym: '◎', color: '#F5A623', text: 'Interactive canvas for instant shot logging' },
            { sym: '↗', color: '#4FC3F7', text: 'Fatigue index and focus score per session' },
            { sym: '✦', color: '#00E5A0', text: 'AI training plans powered by your data' },
            { sym: '⊕', color: '#F5A623', text: 'Export targets as PNG or share with coach' },
          ].map(({ sym, color, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>{sym}</span>
              <span className="font-body text-[#C8D0E0] text-[15px] sm:text-[16px]" style={{ lineHeight: '1.6' }}>{text}</span>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Link href="/auth/register?role=SHOOTER" className="btn btn-primary inline-flex text-[15px] py-3.5 px-8 gap-2">
            Track My Sessions →
          </Link>
        </div>
      </div>
    </div>
  );
}

function CoachPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">
      <div className="order-2 lg:order-1"><CoachVisualInline /></div>
      <div className="order-1 lg:order-2 space-y-6 sm:space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
          style={{ background: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#4FC3F7]" />
          <span className="text-[#4FC3F7] font-display text-[11px] uppercase tracking-[0.2em]">For Coaches</span>
        </div>
        <h2 className="font-display font-black leading-[1.0]" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', letterSpacing: '-0.02em' }}>
          <span className="text-[#F0F4FF]">Data to</span><br />
          <span style={{ background: 'linear-gradient(135deg, #4FC3F7, #F5A623)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>improvement.</span>
        </h2>
        <p className="font-body text-[#9CA3B4] text-[16px] sm:text-[17px]" style={{ lineHeight: '1.75' }}>
          Coaches search for shooters by email and send connection requests.
          Once approved, gain full read access to session history and
          leave timestamped feedback on any individual shot.
        </p>
        <ul className="space-y-3 sm:space-y-4">
          {[
            { sym: '↗', color: '#4FC3F7', text: 'Browse full sessions with shot-level detail' },
            { sym: '✦', color: '#F5A623', text: 'Post timestamped feedback on any session' },
            { sym: '⊕', color: '#00E5A0', text: 'Manage multiple shooters from one dashboard' },
            { sym: '◎', color: '#4FC3F7', text: 'Real-time WebSocket notifications on new sessions' },
          ].map(({ sym, color, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>{sym}</span>
              <span className="font-body text-[#C8D0E0] text-[15px] sm:text-[16px]" style={{ lineHeight: '1.6' }}>{text}</span>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Link href="/auth/register?role=COACH" className="btn btn-primary inline-flex text-[15px] py-3.5 px-8 gap-2">
            Join as Coach
          </Link>
        </div>
      </div>
    </div>
  );
}

function SoldierPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center">
      <div className="order-2 lg:order-1"><SoldierVisual /></div>
      <div className="order-1 lg:order-2 space-y-6 sm:space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
          style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" />
          <span className="text-[#00E5A0] font-display text-[11px] uppercase tracking-[0.2em]">For Soldiers</span>
        </div>
        <h2 className="font-display font-black leading-[1.0]" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', letterSpacing: '-0.02em' }}>
          <span className="text-[#F0F4FF]">Mission-ready</span><br />
          <span style={{ background: 'linear-gradient(135deg, #00E5A0, #4FC3F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>performance.</span>
        </h2>
        <p className="font-body text-[#9CA3B4] text-[16px] sm:text-[17px]" style={{ lineHeight: '1.75' }}>
          Track qualification scores across multiple weapon platforms, monitor group precision, and maintain a complete firing record ready for inspection or review.
        </p>
        <ul className="space-y-3 sm:space-y-4">
          {[
            { sym: '◎', color: '#00E5A0', text: 'Multi-weapon qualification record keeping' },
            { sym: '↗', color: '#F5A623', text: 'Group radius and precision metrics per range session' },
            { sym: '✦', color: '#4FC3F7', text: 'Qualification status and next due date tracking' },
            { sym: '⊕', color: '#00E5A0', text: 'Export full record for review or CO submission' },
          ].map(({ sym, color, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>{sym}</span>
              <span className="font-body text-[#C8D0E0] text-[15px] sm:text-[16px]" style={{ lineHeight: '1.6' }}>{text}</span>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Link href="/auth/register?role=SOLDIER" className="btn btn-primary inline-flex text-[15px] py-3.5 px-8 gap-2">
            Start Qualification →
          </Link>
        </div>
      </div>
    </div>
  );
}

function RoleShowcase() {
  const [activeTab, setActiveTab] = useState<RoleTab>('shooter');
  const [animating, setAnimating] = useState(false);

  const switchTab = (tab: RoleTab) => {
    if (tab === activeTab || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTimeout(() => setAnimating(false), 20);
    }, 180);
  };

  return (
    <section id="coaches" className="py-14 sm:py-20 lg:py-32 max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12">
      {/* Section header */}
      <div className="text-center mb-10 sm:mb-14 lg:mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
          style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.22)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }} />
          <span className="text-[#F5A623] font-display text-[11px] sm:text-[12px] uppercase tracking-[0.22em]">Built for every role</span>
        </div>
        <h2 className="font-display font-black leading-[1.0] mb-4"
          style={{ fontSize: 'clamp(2.4rem, 6.5vw, 5rem)', letterSpacing: '-0.02em' }}>
          <span className="text-[#F0F4FF]">Your role. </span>
          <span className="gradient-text">Your platform.</span>
        </h2>
        <p className="font-body text-[#9CA3B4] max-w-xl mx-auto text-[16px] sm:text-[18px]" style={{ lineHeight: '1.75' }}>
          Whether you compete, coach, or serve — Marksman gives you the tools that match your mission.
        </p>
      </div>

      {/* Tab switcher */}
      <div
        className="flex items-center gap-1.5 p-1.5 rounded-2xl mb-10 sm:mb-14 lg:mb-16 mx-auto"
        style={{ background: '#0C0F1A', border: '1px solid #1E2433', width: 'fit-content' }}
      >
        {([
          { id: 'shooter' as RoleTab, label: 'Shooter', color: '#F5A623' },
          { id: 'coach'   as RoleTab, label: 'Coach',   color: '#4FC3F7' },
          { id: 'soldier' as RoleTab, label: 'Soldier', color: '#00E5A0' },
        ]).map(({ id, label, color }) => {
          const isActive = activeTab === id;
          return (
            <button key={id} onClick={() => switchTab(id)}
              className="relative flex-1 sm:flex-none px-6 sm:px-10 py-3 rounded-xl font-display
                         font-bold text-[13px] sm:text-[14px] uppercase tracking-[0.12em] transition-all duration-250"
              style={{
                color: isActive ? color : '#6B7A96',
                background: isActive ? `${color}12` : 'transparent',
                border: isActive ? `1px solid ${color}35` : '1px solid transparent',
                boxShadow: isActive ? `0 0 20px ${color}20` : 'none',
              }}>
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                  style={{ width: '55%', background: color, boxShadow: `0 0 10px ${color}90` }} />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {/* Panel crossfade */}
      <div style={{
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(6px)' : 'translateY(0)',
        transition: 'opacity 180ms ease, transform 180ms ease',
      }}>
        {activeTab === 'shooter' && <ShooterPanel />}
        {activeTab === 'coach'   && <CoachPanel />}
        {activeTab === 'soldier' && <SoldierPanel />}
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────

function RoleCtaCard({ href, icon, accentColor, role, tagline }: {
  href: string; icon: React.ReactNode; accentColor: string; role: string; tagline: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-4 p-7 rounded-2xl border transition-all duration-250 relative overflow-hidden"
      style={{ background: 'rgba(12,15,26,0.85)', borderColor: '#1E2433', backdropFilter: 'blur(12px)' }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = `${accentColor}45`;
        el.style.boxShadow = `0 12px 40px -8px ${accentColor}30, 0 0 0 1px ${accentColor}15`;
        el.style.transform = 'translateY(-5px)';
        el.style.background = `linear-gradient(135deg, ${accentColor}08, rgba(12,15,26,0.9))`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = '#1E2433';
        el.style.boxShadow = 'none';
        el.style.transform = 'translateY(0)';
        el.style.background = 'rgba(12,15,26,0.85)';
      }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}>
        {icon}
      </div>
      <span className="font-display font-black text-[15px] tracking-[0.12em] uppercase" style={{ color: accentColor }}>{role}</span>
      <span className="text-[#9CA3B4] text-sm text-center" style={{ lineHeight: '1.6' }}>{tagline}</span>
    </Link>
  );
}

function CtaBanner() {
  const [headRef, headVis] = useSectionReveal();
  return (
    <section className="py-14 sm:py-20 lg:py-32 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#1E2433 1px, transparent 1px), linear-gradient(90deg, #1E2433 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,166,35,0.07) 0%, transparent 70%)' }} />
      <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(245,166,35,0.22) 50%, transparent 90%)' }} />
      <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(245,166,35,0.12) 50%, transparent 90%)' }} />

      <div ref={headRef} className="relative max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
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
          className="font-display font-black leading-[1.0] px-2"
          style={{
            fontSize: 'clamp(2.6rem, 7.5vw, 5.5rem)',
            letterSpacing: '-0.02em',
            animation: headVis ? 'textReveal 700ms cubic-bezier(0.16,1,0.3,1) both' : 'none',
            opacity: headVis ? undefined : 0,
          }}
        >
          <span className="text-[#F0F4FF]">Choose your </span>
          <span className="gradient-text">role.</span>
        </h2>

        <p className="font-body text-[#9CA3B4] text-[16px] sm:text-[18px] max-w-lg mx-auto" style={{ lineHeight: '1.75' }}>
          Every role, one platform. Up and running in under 60 seconds — no credit card required.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8 sm:mt-10">
          <RoleCtaCard
            href="/auth/register?role=SHOOTER"
            icon={<TargetIcon />}
            accentColor="#F5A623"
            role="Shooter"
            tagline="Track every session, every shot."
          />
          <RoleCtaCard
            href="/auth/register?role=COACH"
            icon={<CoachIcon />}
            accentColor="#4FC3F7"
            role="Coach"
            tagline="Guide shooters with data-driven insight."
          />
          <RoleCtaCard
            href="/auth/register?role=SOLDIER"
            icon={<SoldierIcon />}
            accentColor="#00E5A0"
            role="Soldier"
            tagline="Military qualification and readiness."
          />
        </div>

        <p className="mt-8 text-center text-[#4A5568] text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#F5A623] hover:text-amber-400 transition-colors font-medium">
            Sign in →
          </Link>
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

      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        {/* Brand row — full width on mobile */}
        <div className="mb-10 sm:mb-12 lg:hidden">
          <div className="flex items-center gap-3 mb-5">
            <CrosshairLogo size={28} />
            <div className="flex flex-col leading-none">
              <span className="font-display font-black text-[16px] tracking-[0.18em] uppercase text-[#F0F4FF]">Marksman</span>
              <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[#F5A623] opacity-75 mt-0.5">Precision Analytics</span>
            </div>
          </div>
          <p className="text-[#8892A4] text-sm leading-relaxed max-w-xs">
            The complete training analytics platform for competitive shooters and coaches.
          </p>
          <div className="flex items-center gap-2 mt-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" style={{ animation: 'pulseGlowGreen 2.5s ease-in-out infinite' }} />
            <span className="text-[#6B7A96] text-[11px] font-display uppercase tracking-[0.14em]">All systems operational</span>
          </div>
        </div>

        {/* Main grid: 2-col on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">

          {/* Brand column — desktop only */}
          <div className="hidden lg:flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <CrosshairLogo size={28} />
              <div className="flex flex-col leading-none">
                <span className="font-display font-black text-[16px] tracking-[0.18em] uppercase text-[#F0F4FF]">Marksman</span>
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[#F5A623] opacity-75 mt-0.5">Precision Analytics</span>
              </div>
            </div>
            <p className="text-[#8892A4] text-sm leading-relaxed">
              The complete training analytics platform for competitive shooters and coaches.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" style={{ animation: 'pulseGlowGreen 2.5s ease-in-out infinite' }} />
              <span className="text-[#6B7A96] text-[11px] font-display uppercase tracking-[0.14em]">All systems operational</span>
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading} className="flex flex-col gap-4 sm:gap-5">
              <p className="font-display text-[12px] sm:text-[13px] uppercase tracking-[0.18em] text-[#C8D0E0] font-bold">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-3 sm:gap-3.5">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[#6B7A96] hover:text-[#C8D0E0] text-sm font-display uppercase
                                 tracking-[0.1em] transition-colors duration-200 inline-flex items-center gap-2 group
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
      <div className="border-t px-5 sm:px-8 py-5 sm:py-6" style={{ borderColor: '#1E2433' }}>
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#4A5568] text-[12px] font-display tracking-widest uppercase">
            © {year} Marksman · Built for precision
          </p>
          <div className="flex items-center gap-6 sm:gap-8">
            {['Privacy', 'Terms', 'Docs'].map((item) => (
              <Link
                key={item}
                href={item === 'Docs' ? '/docs' : '#'}
                className="text-[#4A5568] hover:text-[#8892A4] text-[12px] font-display
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

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 19s-8-5.5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 5.5-8 11-8 11z"/>
    </svg>
  );
}

function SoldierIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="10,2 12.5,7.5 18.5,7.5 13.5,11 15.5,17 10,13.5 4.5,17 6.5,11 1.5,7.5 7.5,7.5" />
    </svg>
  );
}
