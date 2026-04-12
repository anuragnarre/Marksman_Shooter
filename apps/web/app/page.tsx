'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';
import { useTheme } from '../contexts/theme-context';
import { AppDownloadButton } from '../components/AppDownloadButton';
import { LoadingScreen } from '../components/LoadingScreen';

// ─── Shot data (deterministic) ────────────────────────────────────────────────
const SHOTS = [
  { cx: 50.4, cy: 49.2, score: 10.9 },
  { cx: 49.1, cy: 50.8, score: 10.7 },
  { cx: 51.2, cy: 48.6, score: 10.6 },
  { cx: 48.8, cy: 51.4, score: 10.4 },
  { cx: 50.9, cy: 50.5, score: 10.8 },
  { cx: 49.6, cy: 49.0, score: 10.2 },
  { cx: 51.8, cy: 51.1, score: 10.1 },
  { cx: 47.9, cy: 48.7, score: 9.9  },
];

function shotColor(score: number): string {
  if (score >= 10.5) return '#F5A623';
  if (score >= 10.0) return '#4FC3F7';
  if (score >= 9.0)  return '#00D48A';
  return '#FF4D6D';
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconCrosshair({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  );
}
function IconBrain({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14Z" />
    </svg>
  );
}
function IconUsers({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconTrophy({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
function IconMenu({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function IconX({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconSun({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function IconMoon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function IconBarChart({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconZap({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconDownload({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconCamera({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function IconActivity({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function IconArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconUpload({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// ─── Scroll Reveal ────────────────────────────────────────────────────────────
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', duration = 2000 }: {
  end: number; suffix?: string; duration?: number;
}) {
  const { ref, visible } = useReveal(0.3);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const steps = 70;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - Math.min(step / steps, 1), 4);
      setCount(Math.round(end * eased));
      if (step >= steps) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [visible, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Section Eyebrow ──────────────────────────────────────────────────────────
// Single unified eyebrow component — consistent rhythm across all sections.
function Eyebrow({ children, color = '#F5A623' }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="inline-flex items-center gap-2.5 mb-5">
      <span className="inline-block w-4 h-px rounded-full" style={{ background: color, opacity: 0.6 }} />
      <span className="font-mono text-[10px] font-semibold tracking-[0.22em] uppercase" style={{ color }}>
        {children}
      </span>
      <span className="inline-block w-4 h-px rounded-full" style={{ background: color, opacity: 0.6 }} />
    </div>
  );
}

// ─── Target SVG Mockup ────────────────────────────────────────────────────────
function TargetMockup() {
  const rings  = [50, 40, 30, 22, 15, 9, 5, 2.5];
  const ringBg = [
    'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.02)',
    'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.04)',
    'rgba(14,17,30,0.95)',    'rgba(14,17,30,0.95)',
    'rgba(79,195,247,0.06)',  'rgba(245,166,35,0.10)',
  ];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Air rifle target with shot markers">
      <defs>
        <radialGradient id="tgt-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0a0d1c" />
          <stop offset="100%" stopColor="#050710" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#tgt-bg)" />
      {rings.map((r, i) => (
        <circle key={r} cx="50" cy="50" r={r} fill={ringBg[i]} stroke="rgba(255,255,255,0.055)" strokeWidth="0.35" />
      ))}
      <line x1="50" y1="3"  x2="50" y2="21" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
      <line x1="50" y1="79" x2="50" y2="97" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
      <line x1="3"  y1="50" x2="21" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
      <line x1="79" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
      {SHOTS.map((s, i) => {
        const col = shotColor(s.score);
        return (
          <g key={i}>
            <circle cx={s.cx} cy={s.cy} r="1.75" fill={col} opacity="0.13" />
            <circle cx={s.cx} cy={s.cy} r="0.85" fill={col} opacity="0.92" />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
// Cleaner and more legible — matches the reference design's reduced density.
// Glow reduced ~25% vs. original implementation.
function DashboardMockup({ isDark }: { isDark: boolean }) {
  const miniShots  = SHOTS.slice(0, 5);
  const glass      = isDark ? 'rgba(8,10,18,0.97)' : 'rgba(255,255,255,0.99)';
  const bdr        = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const innerBg    = isDark ? 'rgba(255,255,255,0.024)' : 'rgba(0,0,0,0.024)';
  const labelCol   = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.28)';
  const dimCol     = isDark ? 'rgba(255,255,255,0.11)' : 'rgba(0,0,0,0.14)';

  return (
    <div className="relative w-full max-w-[400px] mx-auto" style={{ animation: 'lp-floatY 8s ease-in-out infinite' }}>
      {/* Ambient halo — glow reduced ~28% */}
      <div className="absolute -inset-10 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 72% 52% at 55% 48%, rgba(245,166,35,0.040) 0%, rgba(79,195,247,0.016) 55%, transparent 80%)',
      }} />

      <div
        className="relative rounded-[20px] overflow-hidden"
        style={{
          background: glass,
          border: `1px solid ${bdr}`,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: isDark
            ? '0 0 0 1px rgba(245,166,35,0.034), 0 2px 4px rgba(0,0,0,0.24), 0 14px 44px rgba(0,0,0,0.46), 0 44px 88px rgba(0,0,0,0.22)'
            : '0 0 0 1px rgba(0,0,0,0.038), 0 4px 20px rgba(0,0,0,0.06)',
        }}
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3" style={{ borderBottom: `1px solid ${bdr}`, background: innerBg }}>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <div className="flex-1 mx-3 rounded-md px-3 py-0.5 text-center" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
            <span className="font-mono text-[9px]" style={{ color: labelCol }}>app.marksman.pro / session / 047</span>
          </div>
        </div>

        {/* Session header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <p className="font-mono font-semibold text-[10px] tracking-[0.2em] uppercase" style={{ color: '#F5A623' }}>Session #047</p>
            <p className="font-mono text-[9px] mt-0.5" style={{ color: labelCol }}>Air Rifle · 10m · 2026-03-21</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5" style={{ background: 'rgba(0,212,138,0.065)', border: '1px solid rgba(0,212,138,0.15)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D48A]" style={{ animation: 'lp-pulseDot 2s ease-in-out infinite' }} />
            <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#00D48A]">LIVE</span>
          </div>
        </div>

        {/* Target */}
        <div className="px-5 pb-3">
          <div className="relative w-full aspect-square rounded-[14px] overflow-hidden" style={{ border: `1px solid ${bdr}` }}>
            <TargetMockup />
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[14px]">
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent 0%,rgba(34,211,238,0.26) 50%,transparent 100%)', animation: 'lp-scanH 4s linear infinite' }} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 px-5 pb-4">
          {[
            { label: 'AVG',  value: '10.45', color: '#F5A623' },
            { label: 'LAST', value: '9.9',   color: '#4FC3F7' },
            { label: 'MPI',  value: '0.8mm', color: '#00D48A' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-[10px] py-2.5 text-center" style={{ background: innerBg, border: `1px solid ${bdr}` }}>
              <p className="font-mono font-bold text-[13px] leading-none" style={{ color }}>{value}</p>
              <p className="font-mono text-[8px] mt-1.5 tracking-[0.12em] uppercase" style={{ color: dimCol }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Shot list */}
        <div className="px-5 pb-4 space-y-1">
          {miniShots.map((shot, i) => {
            const color = shotColor(shot.score);
            const badge = shot.score >= 10.5 ? 'GOLD' : shot.score >= 10.0 ? 'BLUE' : 'GRN';
            return (
              <div key={i} className="flex items-center justify-between rounded-[8px] px-3 py-1.5"
                style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', border: `1px solid ${bdr}` }}>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[9px]" style={{ color: dimCol }}>#{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-mono text-[11px] font-bold" style={{ color }}>{shot.score.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[8px]" style={{ color: dimCol }}>x{shot.cx.toFixed(1)} y{shot.cy.toFixed(1)}</span>
                  <span className="rounded-full px-1.5 py-0.5 font-mono text-[7px] font-bold tracking-wide"
                    style={{ background: `${color}12`, color, border: `1px solid ${color}24` }}>{badge}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI tip bar */}
        <div className="mx-5 mb-5 rounded-[12px] px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.11)' }}>
          <div className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#A78BFA', opacity: 0.85 }}>
            <IconBrain className="w-full h-full" />
          </div>
          <div>
            <p className="font-mono text-[9px] font-semibold tracking-[0.16em] uppercase mb-1" style={{ color: '#A78BFA' }}>AI Coach</p>
            <p className="font-mono text-[9px] leading-[1.65]" style={{ color: labelCol }}>
              Trigger release consistent. Focus on follow-through on shots 7–8 to close the 0.3mm group gap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Trust Marquee ────────────────────────────────────────────────────────────
const TRUST_ITEMS = [
  { code: 'IND', color: '#F59030' }, { code: 'GER', color: '#C9A800' },
  { code: 'CHN', color: '#D84545' }, { code: 'USA', color: '#6090C0' },
  { code: 'KOR', color: '#BB6060' }, { code: 'GBR', color: '#5878A8' },
  { code: 'FRA', color: '#5878A8' }, { code: 'NOR', color: '#BB6060' },
  { code: 'AUT', color: '#BB6060' }, { code: 'SRB', color: '#5888B8' },
  { code: 'JPN', color: '#D84545' }, { code: 'HUN', color: '#BB6060' },
];

function TrustMarquee() {
  const items = [...TRUST_ITEMS, ...TRUST_ITEMS];
  return (
    <div className="relative overflow-hidden group">
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, var(--bg-surface), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, var(--bg-surface), transparent)' }} />
      <div className="lp-ticker-animate flex gap-6 py-1.5">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-5 whitespace-nowrap">
            <span className="inline-flex items-center justify-center rounded-[6px] font-mono font-semibold text-[10px] tracking-[0.12em] px-2.5 py-1"
              style={{ background: `${item.color}0E`, border: `1px solid ${item.color}28`, color: item.color }}>
              {item.code}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.05)', fontSize: '7px' }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────
// Reference-inspired: large numerals, clean card grid, generous padding.
const STATS = [
  { end: 1200000, suffix: '+',   label: 'Shots Analysed',  sub: 'Across all sessions',     color: '#F5A623', icon: <IconCrosshair className="w-4 h-4" /> },
  { end: 48000,   suffix: '+',   label: 'Active Athletes',  sub: 'Competing in 47 nations', color: '#4FC3F7', icon: <IconUsers     className="w-4 h-4" /> },
  { end: 127,     suffix: '',    label: 'Medals Won',       sub: 'By Marksman users',       color: '#00D48A', icon: <IconTrophy    className="w-4 h-4" /> },
  { end: 97,      suffix: '.8%', label: 'AI Accuracy',      sub: 'Computer vision model',   color: '#A78BFA', icon: <IconActivity  className="w-4 h-4" /> },
];

function StatsSection() {
  const { ref, visible } = useReveal(0.08);
  return (
    <section ref={ref} className="py-24 lg:py-28"
      style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="relative flex flex-col px-8 py-8 rounded-[16px]"
              style={{
                background: 'var(--lp-card-bg)',
                border: '1px solid var(--lp-card-border)',
                opacity:   visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(18px)',
                transition: `opacity 640ms ${i * 85}ms cubic-bezier(0.16,1,0.3,1), transform 640ms ${i * 85}ms cubic-bezier(0.16,1,0.3,1)`,
              }}
            >
              {/* Top hairline accent — subtle */}
              <div className="absolute top-0 inset-x-0 h-px rounded-t-[16px]"
                style={{ background: `linear-gradient(90deg, transparent 10%, ${stat.color}2A 50%, transparent 90%)` }} />

              {/* Icon chip */}
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-5"
                style={{ background: `${stat.color}0C`, border: `1px solid ${stat.color}16`, color: stat.color }}>
                {stat.icon}
              </div>

              {/* Number */}
              <div className="font-mono font-black leading-none mb-2.5"
                style={{ fontSize: 'clamp(28px, 3vw, 40px)', color: stat.color, letterSpacing: '-0.025em' }}>
                {visible ? <AnimatedCounter end={stat.end} suffix={stat.suffix} /> : '0'}
              </div>

              <div className="font-display font-semibold text-[13px] tracking-tight" style={{ color: 'var(--text-primary)' }}>{stat.label}</div>
              <div className="font-mono text-[9px] tracking-[0.16em] uppercase mt-1.5" style={{ color: 'var(--text-muted)' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Bento Features ───────────────────────────────────────────────────────────
const TIER: Record<string, { bg: string; color: string; border: string }> = {
  Core:   { bg: 'rgba(255,255,255,0.04)',  color: 'rgba(255,255,255,0.36)', border: 'rgba(255,255,255,0.08)'  },
  Pro:    { bg: 'rgba(245,166,35,0.08)',   color: '#F5A623',                border: 'rgba(245,166,35,0.18)'   },
  Teams:  { bg: 'rgba(79,195,247,0.08)',   color: '#4FC3F7',                border: 'rgba(79,195,247,0.18)'   },
  AI:     { bg: 'rgba(167,139,250,0.08)',  color: '#A78BFA',                border: 'rgba(167,139,250,0.18)'  },
  Vision: { bg: 'rgba(255,77,109,0.08)',   color: '#FF4D6D',                border: 'rgba(255,77,109,0.18)'   },
  Export: { bg: 'rgba(0,212,138,0.08)',    color: '#00D48A',                border: 'rgba(0,212,138,0.18)'    },
};

const FEATURES = [
  { icon: <IconCrosshair className="w-5 h-5" />, title: 'Shot-by-Shot Analysis',  desc: 'Every shot mapped with x/y coordinates, score deviation, MPI, and group radius — sub-millimetre precision on every release.',                                      color: '#F5A623', span: 'lg:col-span-2', tag: 'Core'   },
  { icon: <IconActivity  className="w-5 h-5" />, title: 'Live Biometric Feed',    desc: 'Sync HRV, heart rate, and breath rhythm. Correlate physiological state with shot scores in real time.',                                                              color: '#4FC3F7', span: 'lg:col-span-1', tag: 'Pro'    },
  { icon: <IconUsers     className="w-5 h-5" />, title: 'Coach Dashboard',        desc: 'Invite coaches to review sessions, add structured feedback, and track athlete progression over time.',                                                                  color: '#00D48A', span: 'lg:col-span-1', tag: 'Teams'  },
  { icon: <IconBrain     className="w-5 h-5" />, title: 'AI Coaching Engine',     desc: 'Proprietary rules engine delivers structured coaching feedback immediately after every session — personalised recommendations that improve over time.',                  color: '#A78BFA', span: 'lg:col-span-2', tag: 'AI'     },
  { icon: <IconCamera    className="w-5 h-5" />, title: 'Vision AI',              desc: 'Camera-based target analysis. Point, shoot, upload — automatic hole detection and precision scoring from any standard smartphone.',                                      color: '#FF4D6D', span: 'lg:col-span-1', tag: 'Vision' },
  { icon: <IconDownload  className="w-5 h-5" />, title: 'Export & Reports',       desc: 'PDF session reports, CSV exports, and shareable links. Your data, your way.',                                                                                           color: '#00D48A', span: 'lg:col-span-1', tag: 'Export' },
];

function BentoFeaturesSection() {
  const { ref, visible } = useReveal(0.05);
  return (
    <section id="features" ref={ref} className="py-32 lg:py-44" style={{ background: 'var(--bg-void)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Eyebrow>Platform Capabilities</Eyebrow>
          <h2 className="font-display font-bold mb-5"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: 'var(--text-primary)', lineHeight: '1.06', letterSpacing: '-0.028em' }}>
            Built for precision at every level
          </h2>
          <p className="font-body text-[15px] max-w-md mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: '1.72' }}>
            Six capabilities working in concert to give you an unfair analytical edge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feat, i) => (
            <div
              key={feat.title}
              className={`group relative rounded-[20px] p-8 overflow-hidden cursor-default ${feat.span}`}
              style={{
                background: 'var(--lp-card-bg)',
                border: '1px solid var(--lp-card-border)',
                opacity:   visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(22px)',
                transition: `opacity 570ms ${i * 58}ms cubic-bezier(0.16,1,0.3,1), transform 570ms ${i * 58}ms cubic-bezier(0.16,1,0.3,1)`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.cssText += `border-color:${feat.color}1E;transform:translateY(-2px);box-shadow:0 0 0 1px ${feat.color}08,0 10px 32px rgba(0,0,0,0.16);transition:border-color 220ms,transform 220ms,box-shadow 220ms`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = 'var(--lp-card-border)';
                el.style.transform   = 'translateY(0)';
                el.style.boxShadow   = 'none';
              }}
            >
              {/* Top hairline — reduced opacity */}
              <div className="absolute top-0 left-[20%] right-[20%] h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${feat.color}36, transparent)` }} />
              {/* Corner glow — very subtle on hover */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-600"
                style={{ background: `radial-gradient(circle, ${feat.color}05 0%, transparent 70%)` }} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-7">
                  <div className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0"
                    style={{ background: `${feat.color}0C`, border: `1px solid ${feat.color}18`, color: feat.color }}>
                    {feat.icon}
                  </div>
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase px-2 py-1 rounded-[5px]"
                    style={{ background: TIER[feat.tag]?.bg, color: TIER[feat.tag]?.color, border: `1px solid ${TIER[feat.tag]?.border}` }}>
                    {feat.tag}
                  </span>
                </div>
                <h3 className="font-display font-bold text-[16px] mb-3"
                  style={{ color: 'var(--text-primary)', letterSpacing: '-0.014em' }}>{feat.title}</h3>
                <p className="font-body text-[13px] leading-[1.76]" style={{ color: 'var(--text-secondary)' }}>{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── App Preview ──────────────────────────────────────────────────────────────
function AppPreviewSection({ isDark }: { isDark: boolean }) {
  const { ref, visible } = useReveal(0.08);
  return (
    <section ref={ref} className="py-32 lg:py-44 overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-28 items-center">
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-22px)', transition: 'opacity 680ms cubic-bezier(0.16,1,0.3,1), transform 680ms cubic-bezier(0.16,1,0.3,1)' }}>
            <Eyebrow>See It In Action</Eyebrow>
            <h2 className="font-display font-bold mb-6"
              style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', color: 'var(--text-primary)', lineHeight: '1.06', letterSpacing: '-0.028em' }}>
              Your entire session,<br />in one intelligent view.
            </h2>
            <p className="font-body text-[15px] leading-[1.76] mb-9" style={{ color: 'var(--text-secondary)' }}>
              The Marksman dashboard brings together your shot map, score timeline, AI coaching feedback, and biometric data — all in real time.
            </p>
            <ul className="space-y-3.5 mb-10">
              {[
                { icon: <IconCrosshair className="w-3.5 h-3.5" />, text: 'Interactive shot-by-shot replay', color: '#F5A623' },
                { icon: <IconBarChart  className="w-3.5 h-3.5" />, text: 'Series score trend analysis',     color: '#4FC3F7' },
                { icon: <IconBrain    className="w-3.5 h-3.5" />, text: 'Instant AI coaching feedback',    color: '#A78BFA' },
                { icon: <IconZap      className="w-3.5 h-3.5" />, text: 'Live session with coach access',  color: '#00D48A' },
              ].map(({ icon, text, color }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}0C`, border: `1px solid ${color}16`, color }}>
                    {icon}
                  </div>
                  <span className="font-body text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>{text}</span>
                </li>
              ))}
            </ul>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 font-display font-bold text-[13px] tracking-wide px-6 py-3.5 rounded-[12px] group"
              style={{ background: '#F5A623', color: '#07090F', boxShadow: '0 0 16px rgba(245,166,35,0.14)', transition: 'filter 200ms ease' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1.07)'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1)'}
            >
              START FOR FREE
              <IconArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(22px)', transition: 'opacity 680ms 90ms cubic-bezier(0.16,1,0.3,1), transform 680ms 90ms cubic-bezier(0.16,1,0.3,1)' }}>
            <DashboardMockup isDark={isDark} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
// Reference-inspired: more padding, elegant step numbers, better alignment.
const HIW = [
  { num: '01', icon: <IconUpload className="w-4 h-4" />, title: 'Upload Your Session',   desc: 'Import CSV/PDF shot data or connect directly from compatible devices. Our mobile scanner handles paper targets instantly.',                    color: '#F5A623' },
  { num: '02', icon: <IconBrain  className="w-4 h-4" />, title: 'Instant Analysis',      desc: 'AI processes groupings, MPI, score trends, and technique indicators in real time — the moment your data arrives.',                              color: '#A78BFA' },
  { num: '03', icon: <IconZap    className="w-4 h-4" />, title: 'Receive Your Coaching', desc: 'Structured feedback and personalised training recommendations appear immediately. Share with your coach or act on them yourself.',               color: '#00D48A' },
];

function HowItWorksSection() {
  const { ref, visible } = useReveal(0.08);
  return (
    <section id="how-it-works" ref={ref} className="py-32 lg:py-44" style={{ background: 'var(--bg-void)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Eyebrow>Simple Process</Eyebrow>
          <h2 className="font-display font-bold"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: 'var(--text-primary)', lineHeight: '1.06', letterSpacing: '-0.028em' }}>
            Three steps to elite insight
          </h2>
          <p className="font-body text-[15px] mt-5 max-w-xs mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: '1.72' }}>
            From range to refined analysis in under three minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {HIW.map((step, i) => (
            <div
              key={step.num}
              className="relative p-10 flex flex-col rounded-[20px]"
              style={{
                background: 'var(--lp-card-bg)',
                border: '1px solid var(--lp-card-border)',
                opacity:   visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(18px)',
                transition: `opacity 570ms ${i * 100}ms cubic-bezier(0.16,1,0.3,1), transform 570ms ${i * 100}ms cubic-bezier(0.16,1,0.3,1)`,
              }}
            >
              {/* Top hairline */}
              <div className="absolute top-0 inset-x-0 h-px rounded-t-[20px]"
                style={{ background: `linear-gradient(90deg, transparent 10%, ${step.color}38 50%, transparent 90%)` }} />

              <div className="flex items-start justify-between mb-9">
                <span
                  className="font-display font-black leading-none select-none"
                  style={{
                    fontSize: 'clamp(52px, 5.5vw, 64px)',
                    background: `linear-gradient(148deg, ${step.color}BB 0%, ${step.color}18 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.05em',
                  }}
                >
                  {step.num}
                </span>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mt-2"
                  style={{ background: `${step.color}0C`, border: `1px solid ${step.color}18`, color: step.color }}>
                  {step.icon}
                </div>
              </div>

              <h3 className="font-display font-bold text-[17px] mb-3.5"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.014em' }}>{step.title}</h3>
              <p className="font-body text-[13px] leading-[1.78] flex-1" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
// More padding, decorative quote mark, cleaner metric display.
const TESTIMONIALS = [
  { quote: "The shot grouping analysis alone changed how I approach each series. I can pinpoint exactly which shots are technique errors vs. ammunition variance.",                                    name: 'Arjun Babuta',   role: 'National Rifle Team · IND', initials: 'AB', metric: '629.1',  metricLabel: 'World Cup Score',     color: '#F5A623' },
  { quote: "I monitor all my athletes simultaneously in real-time. The AI coaching suggestions surface patterns I'd miss reviewing manually — a genuine force multiplier.",                         name: 'Sanjeev Rajput', role: 'Olympic Coach · IND',       initials: 'SR', metric: '12×',    metricLabel: 'Athletes Managed',    color: '#4FC3F7' },
  { quote: "My average improved by 0.4 points in six weeks using the breathing sync analysis. The data doesn't lie — and now neither does my trigger hand.",                                       name: 'Manu Bhaker',    role: 'Olympic Medallist · IND',   initials: 'MB', metric: '+0.4',   metricLabel: 'Avg Pts Improvement', color: '#00D48A' },
];

function TestimonialsSection() {
  const { ref, visible } = useReveal(0.08);
  return (
    <section ref={ref} className="py-32 lg:py-44" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Eyebrow>Social Proof</Eyebrow>
          <h2 className="font-display font-bold"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: 'var(--text-primary)', lineHeight: '1.06', letterSpacing: '-0.028em' }}>
            Trusted by elite athletes
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="group relative rounded-[20px] p-10 flex flex-col"
              style={{
                background: 'var(--lp-card-bg)',
                border: '1px solid var(--lp-card-border)',
                opacity:   visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(22px)',
                transition: `opacity 570ms ${i * 100}ms cubic-bezier(0.16,1,0.3,1), transform 570ms ${i * 100}ms cubic-bezier(0.16,1,0.3,1)`,
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${t.color}1A`; el.style.transform = 'translateY(-2px)'; el.style.transition = 'border-color 220ms,transform 220ms'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--lp-card-border)'; el.style.transform = 'translateY(0)'; }}
            >
              <div className="absolute top-0 left-10 right-10 h-px rounded-t-[20px]"
                style={{ background: `linear-gradient(90deg, transparent, ${t.color}2C, transparent)` }} />

              {/* Decorative quote mark */}
              <div className="font-display font-black leading-none mb-3 select-none"
                style={{ fontSize: '56px', color: `${t.color}20`, lineHeight: 1 }}>&ldquo;</div>

              <p className="font-body text-[13.5px] leading-[1.78] flex-1 mb-8" style={{ color: 'var(--text-secondary)' }}>{t.quote}</p>

              {/* Metric */}
              <div className="flex items-baseline gap-2 mb-7">
                <span className="font-mono font-black text-[24px] leading-none" style={{ color: t.color, letterSpacing: '-0.022em' }}>{t.metric}</span>
                <span className="font-mono text-[9px] tracking-[0.14em] uppercase" style={{ color: `${t.color}48` }}>{t.metricLabel}</span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3.5 pt-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-[11px] flex-shrink-0"
                  style={{ background: `${t.color}10`, color: t.color, border: `1px solid ${t.color}1E` }}>
                  {t.initials}
                </div>
                <div>
                  <div className="font-display font-semibold text-[13px] tracking-tight" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                  <div className="font-mono text-[9px] tracking-wide mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center font-mono text-[9px] mt-10 tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
          * Testimonials are representative examples. Performance results vary by athlete and training regimen. Marksman is currently in beta.
        </p>
      </div>
    </section>
  );
}

// ─── Vision AI ────────────────────────────────────────────────────────────────
// Strong identity preserved. Glow reduced ~28%. More breathing space.
function VisionAISection() {
  const { ref, visible } = useReveal(0.08);
  return (
    <section ref={ref} className="py-32 lg:py-44 overflow-hidden" style={{ background: 'var(--bg-void)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-28 items-center">
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-22px)', transition: 'opacity 680ms cubic-bezier(0.16,1,0.3,1), transform 680ms cubic-bezier(0.16,1,0.3,1)' }}>
            <Eyebrow color="#FF4D6D">Computer Vision</Eyebrow>
            <h2 className="font-display font-bold mb-6"
              style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', color: 'var(--text-primary)', lineHeight: '1.06', letterSpacing: '-0.028em' }}>
              Target detection with{' '}
              <span style={{ background: 'linear-gradient(135deg, #FF4D6D 0%, #F5A623 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                97.8% accuracy.
              </span>
            </h2>
            <p className="font-body text-[15px] leading-[1.76] mb-9" style={{ color: 'var(--text-secondary)' }}>
              Our Vision AI engine automatically detects bullet holes, calculates precise x/y coordinates, and scores each shot from a standard smartphone photo. No specialised hardware required.
            </p>
            <div className="space-y-3 mb-10">
              {[
                { label: 'Sub-millimetre precision', desc: 'Detects holes as small as 0.5mm from any angle',   color: '#4FC3F7' },
                { label: 'Instant processing',       desc: 'Results in under 3 seconds from photo to score',   color: '#F5A623' },
                { label: 'All ISSF target formats',  desc: 'Works with 10m, 25m and 50m standard targets',     color: '#00D48A' },
              ].map(({ label, desc, color }) => (
                <div key={label} className="flex items-start gap-4 p-4 rounded-[13px]"
                  style={{ background: 'var(--lp-card-bg)', border: '1px solid var(--lp-card-border)' }}>
                  <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: `${color}0C`, color }}>
                    <IconCheck className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>{label}</div>
                    <div className="font-body text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)', lineHeight: '1.68' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 font-display font-bold text-[13px] tracking-wide px-6 py-3.5 rounded-[12px] group"
              style={{ background: 'transparent', color: '#F5A623', border: '1px solid rgba(245,166,35,0.22)', transition: 'all 220ms ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(245,166,35,0.38)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(245,166,35,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(245,166,35,0.22)'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
            >
              Try Vision AI Free
              <IconArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(22px)', transition: 'opacity 680ms 90ms cubic-bezier(0.16,1,0.3,1), transform 680ms 90ms cubic-bezier(0.16,1,0.3,1)' }}>
            <div className="relative">
              {/* Target — glow reduced ~28% from original */}
              <div className="relative w-full max-w-[380px] mx-auto aspect-square rounded-full overflow-hidden"
                style={{ background: '#060810', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 0 40px rgba(255,77,109,0.047), 0 0 72px rgba(245,166,35,0.026), inset 0 0 36px rgba(0,0,0,0.52)' }}>
                <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="CV target detection">
                  <defs>
                    <radialGradient id="vis-bg" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#09091a" />
                      <stop offset="100%" stopColor="#040509" />
                    </radialGradient>
                  </defs>
                  <circle cx="50" cy="50" r="50" fill="url(#vis-bg)" />
                  {[46, 36, 26, 18, 12, 7.5, 4].map(r => (
                    <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.038)" strokeWidth="0.4" />
                  ))}
                  <circle cx="50" cy="50" r="7.5" fill="rgba(18,22,42,0.85)" stroke="rgba(245,166,35,0.16)" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="4"   fill="rgba(245,166,35,0.052)" stroke="rgba(245,166,35,0.36)" strokeWidth="0.5" />
                  <line x1="50" y1="3" x2="50" y2="18"  stroke="rgba(255,255,255,0.05)" strokeWidth="0.36" />
                  <line x1="50" y1="82" x2="50" y2="97" stroke="rgba(255,255,255,0.05)" strokeWidth="0.36" />
                  <line x1="3"  y1="50" x2="18" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.36" />
                  <line x1="82" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.36" />
                  <rect x="46.5" y="46.5" width="7" height="7" fill="none" stroke="rgba(34,211,238,0.50)" strokeWidth="0.58" strokeDasharray="1.4 0.9" rx="0.5" />
                  <rect x="44.5" y="44.5" width="11" height="11" fill="none" stroke="rgba(34,211,238,0.11)" strokeWidth="0.4" rx="1" />
                  <path d="M41 43.5 L41 41 L43.5 41" stroke="rgba(34,211,238,0.72)" strokeWidth="0.64" fill="none" />
                  <path d="M59 43.5 L59 41 L56.5 41" stroke="rgba(34,211,238,0.72)" strokeWidth="0.64" fill="none" />
                  <path d="M41 56.5 L41 59 L43.5 59" stroke="rgba(34,211,238,0.72)" strokeWidth="0.64" fill="none" />
                  <path d="M59 56.5 L59 59 L56.5 59" stroke="rgba(34,211,238,0.72)" strokeWidth="0.64" fill="none" />
                  {SHOTS.slice(0, 5).map((shot, i) => {
                    const col = shotColor(shot.score);
                    return (
                      <g key={i}>
                        <circle cx={shot.cx} cy={shot.cy} r="1.5" fill={col} opacity="0.12" />
                        <circle cx={shot.cx} cy={shot.cy} r="0.76" fill={col} opacity="0.90" />
                      </g>
                    );
                  })}
                  <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(34,211,238,0.08)" strokeWidth="0.44" />
                  <text x="2" y="28.5" fontFamily="monospace" fontSize="2.2" fill="rgba(34,211,238,0.28)">SCAN</text>
                </svg>
              </div>

              {/* Ambient glow — reduced ~28% */}
              <div className="absolute -z-10 inset-6 rounded-full blur-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,77,109,0.38) 0%, rgba(245,166,35,0.16) 55%, transparent 80%)', opacity: 0.09 }} />

              {/* Floating chips — cleaner, less heavy shadow */}
              <div className="absolute top-[5%] right-[-2%] rounded-[13px] px-4 py-3 backdrop-blur-xl"
                style={{ background: 'rgba(8,10,20,0.94)', border: '1px solid rgba(79,195,247,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.32)' }}>
                <p className="font-mono text-[8px] tracking-[0.16em] uppercase" style={{ color: 'rgba(255,255,255,0.22)' }}>Detected</p>
                <p className="font-mono font-bold text-[15px] leading-none mt-0.5" style={{ color: '#4FC3F7' }}>10.9 pts</p>
              </div>
              <div className="absolute bottom-[8%] left-[-2%] rounded-[13px] px-4 py-3 backdrop-blur-xl"
                style={{ background: 'rgba(8,10,20,0.94)', border: '1px solid rgba(245,166,35,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.32)' }}>
                <p className="font-mono text-[8px] tracking-[0.16em] uppercase" style={{ color: 'rgba(255,255,255,0.22)' }}>Group MPI</p>
                <p className="font-mono font-bold text-[15px] leading-none mt-0.5" style={{ color: '#F5A623' }}>0.8mm</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ─────────────────────────────────────────────────────────
const pricingPlans = [
  {
    name: 'Athlete',
    price: 'Free',
    period: 'forever',
    description: 'For individual competitive shooters.',
    features: ['Unlimited sessions', 'Shot-by-shot analysis', 'AI coaching feedback', 'PDF exports', '1 weapon profile'],
    cta: 'Start Free',
    href: '/auth/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: 'per month',
    description: 'For serious athletes and coaches.',
    features: ['Everything in Athlete', 'Up to 10 athletes', 'Live biometric sync', 'Session comparison', 'Priority AI analysis', 'Custom training plans'],
    cta: 'Start Pro Trial',
    href: '/auth/register?plan=pro',
    highlight: true,
  },
  {
    name: 'Team',
    price: '₹1,999',
    period: 'per month',
    description: 'For national teams and academies.',
    features: ['Everything in Pro', 'Unlimited athletes', 'Team analytics', 'National team reports', 'Dedicated support', 'Custom integrations'],
    cta: 'Contact Us',
    href: 'mailto:team@marksmanspro.com',
    highlight: false,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="py-24" style={{ background: 'var(--bg-void)' }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase mb-4" style={{ color: '#F5A623' }}>Pricing</p>
          <h2 className="font-display font-black mb-4" style={{ fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: '1.06', color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
            Simple, transparent pricing
          </h2>
          <p className="font-body text-[15px] max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Start free. Upgrade when your team grows.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {pricingPlans.map((plan) => (
            <div key={plan.name}
              className="rounded-2xl p-7 flex flex-col"
              style={{
                background: 'var(--lp-card-bg, var(--bg-surface))',
                border: plan.highlight ? '1px solid rgba(245,166,35,0.40)' : '1px solid var(--border-subtle)',
                boxShadow: plan.highlight ? '0 0 28px rgba(245,166,35,0.10)' : 'none',
              }}>
              {plan.highlight && (
                <div className="mb-4">
                  <span className="font-mono text-[9px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.20)' }}>
                    Most Popular
                  </span>
                </div>
              )}
              <p className="font-display font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{plan.name}</p>
              <p className="font-body text-[13px] mb-5" style={{ color: 'var(--text-secondary)' }}>{plan.description}</p>
              <div className="mb-6">
                <span className="font-mono font-bold" style={{ fontSize: 'clamp(28px, 4vw, 36px)', color: plan.highlight ? '#F5A623' : 'var(--text-primary)' }}>{plan.price}</span>
                <span className="font-body text-[12px] ml-1.5" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
              </div>
              <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" stroke={plan.highlight ? '#F5A623' : 'rgba(255,255,255,0.15)'} strokeWidth="1" />
                      <path d="M5 8l2 2 4-4" stroke={plan.highlight ? '#F5A623' : 'rgba(255,255,255,0.40)'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="font-body text-[13px]" style={{ color: 'var(--text-secondary)' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href}
                className="flex items-center justify-center font-display font-bold text-[13px] py-3 rounded-[11px] transition-all duration-150 active:scale-[0.98]"
                style={plan.highlight
                  ? { background: 'linear-gradient(135deg, #F5A623 0%, #E18E0D 100%)', color: '#07090F', boxShadow: '0 0 18px rgba(245,166,35,0.18)' }
                  : { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user }                            = useAuth();
  const router                              = useRouter();
  const { resolvedTheme, setTheme }         = useTheme();
  const [mounted, setMounted]               = useState(false);
  const [scrolled, setScrolled]             = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoading, setShowLoading]       = useState(true);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const isDark     = !mounted || resolvedTheme !== 'light';
  const isLoggedIn = mounted && !!user;

  // ── CSS Design Token Injection ─────────────────────────────────────────────
  // Defines all CSS variables that this page references, for both modes.
  // DARK: deep navy palette — keeps rich, product-grade aesthetic.
  // LIGHT: derived from dark — #F1F3F7 / #F7F8FA soft grays (NOT pure white),
  //        per the brief's explicit instruction to avoid blank-page feel.
  useEffect(() => {
    const r = document.documentElement;
    if (isDark) {
      r.style.setProperty('--bg-void',         '#07090F');
      r.style.setProperty('--bg-surface',      '#0B0D18');
      r.style.setProperty('--bg-elevated',     '#10131F');
      r.style.setProperty('--text-primary',    '#ECEEF4');
      r.style.setProperty('--text-secondary',  'rgba(236,238,244,0.57)');
      r.style.setProperty('--text-muted',      'rgba(236,238,244,0.30)');
      r.style.setProperty('--border-subtle',   'rgba(255,255,255,0.07)');
      r.style.setProperty('--nav-glass-bg',    'rgba(7,9,15,0.86)');
      r.style.setProperty('--nav-glass-border','rgba(255,255,255,0.07)');
      r.style.setProperty('--nav-logo-color',  '#ECEEF4');
      r.style.setProperty('--lp-card-bg',      '#0B0D18');
      r.style.setProperty('--lp-card-border',  'rgba(255,255,255,0.07)');
    } else {
      r.style.setProperty('--bg-void',         '#F1F3F7');   // brief: #F1F3F7
      r.style.setProperty('--bg-surface',      '#F7F8FA');   // brief: #F7F8FA
      r.style.setProperty('--bg-elevated',     '#FFFFFF');
      r.style.setProperty('--text-primary',    '#0C0F1A');
      r.style.setProperty('--text-secondary',  'rgba(12,15,26,0.57)');
      r.style.setProperty('--text-muted',      'rgba(12,15,26,0.36)');
      r.style.setProperty('--border-subtle',   'rgba(0,0,0,0.08)');
      r.style.setProperty('--nav-glass-bg',    'rgba(241,243,247,0.88)');
      r.style.setProperty('--nav-glass-border','rgba(0,0,0,0.08)');
      r.style.setProperty('--nav-logo-color',  '#0C0F1A');
      r.style.setProperty('--lp-card-bg',      '#FFFFFF');
      r.style.setProperty('--lp-card-border',  'rgba(0,0,0,0.08)');
    }
    return () => {
      // Remove all inline overrides so globals.css :root values are restored
      // when navigating away from the homepage (e.g. to /dashboard)
      const props = ['--bg-void','--bg-surface','--bg-elevated','--text-primary',
        '--text-secondary','--text-muted','--border-subtle','--nav-glass-bg',
        '--nav-glass-border','--nav-logo-color','--lp-card-bg','--lp-card-border'];
      props.forEach((p) => r.style.removeProperty(p));
    };
  }, [isDark]);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} />}

      {/* ── Global Styles ─────────────────────────────────────────────────── */}
      <style>{`
        /* Fonts: Outfit (display) + JetBrains Mono (data/labels) */
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');

        /* Keyframes */
        @keyframes lp-marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes lp-floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes lp-orbFloat { 0%,100%{transform:translate(0,0)} 33%{transform:translate(13px,-11px)} 66%{transform:translate(-6px,5px)} }
        @keyframes lp-heroUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-heroDelay{ 0%{opacity:0;transform:translateY(16px)} 22%{opacity:0} 100%{opacity:1;transform:translateY(0)} }
        @keyframes lp-drawerIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
        @keyframes lp-scanH    { from{transform:translateX(-100%)} to{transform:translateX(380%)} }
        @keyframes lp-pulseDot { 0%,100%{opacity:1} 50%{opacity:0.26} }
        @keyframes lp-gradShift{ 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

        /* Utilities */
        .lp-ticker-animate                { animation: lp-marquee 40s linear infinite; width: max-content; }
        .group:hover .lp-ticker-animate   { animation-play-state: paused; }

        .gradient-text {
          background: linear-gradient(135deg, #F5A623 0%, #FBC94E 42%, #F5A623 72%, #DF8C0E 100%);
          background-size: 230%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: lp-gradShift 6s ease-in-out infinite;
        }

        /* Base resets */
        html  { scroll-behavior: smooth; }
        *     { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
        .font-body    { font-family: 'Outfit', system-ui, sans-serif; font-weight: 400; }
        .font-mono    { font-family: 'JetBrains Mono', 'Fira Mono', monospace; }

        /* Smooth transitions for all interactive elements */
        button, a { transition-property: color, background-color, border-color, opacity, transform, box-shadow, filter; transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1); transition-duration: 200ms; }
      `}</style>

      <div className="min-h-screen font-body" style={{ background: 'var(--bg-void)', color: 'var(--text-primary)' }}>

        {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            ...(scrolled ? {
              backdropFilter: 'blur(22px) saturate(148%)',
              WebkitBackdropFilter: 'blur(22px) saturate(148%)',
              background: 'var(--nav-glass-bg)',
              borderBottom: '1px solid var(--nav-glass-border)',
              boxShadow: isDark
                ? '0 1px 0 rgba(255,255,255,0.034), 0 4px 16px rgba(0,0,0,0.20)'
                : '0 1px 0 rgba(0,0,0,0.06),       0 4px 12px rgba(0,0,0,0.04)',
            } : {}),
          }}
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                <div className="w-6 h-6 transition-transform duration-200 group-hover:rotate-[15deg]" style={{ color: '#F5A623' }}>
                  <IconCrosshair className="w-full h-full" />
                </div>
                <span className="font-display font-bold text-[15px] tracking-[0.09em] uppercase" style={{ color: 'var(--nav-logo-color)' }}>Marksman</span>
              </Link>

              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-7">
                {[{ label: 'Features', id: 'features' }, { label: 'How it Works', id: 'how-it-works' }, { label: 'Pricing', id: 'pricing' }].map(({ label, id }) => (
                  <button key={id} onClick={() => scrollTo(id)}
                    className="font-body text-[13px] font-medium hover:text-[#F5A623] relative group/link"
                    style={{ color: 'var(--text-secondary)', transition: 'color 180ms ease' }}>
                    {label}
                    <span className="absolute -bottom-0.5 left-0 right-0 h-px rounded-full origin-left scale-x-0 group-hover/link:scale-x-100 transition-transform duration-200" style={{ background: '#F5A623' }} />
                  </button>
                ))}
              </div>

              {/* Desktop right */}
              <div className="hidden md:flex items-center gap-2">
                {mounted && (
                  <button onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
                    className="w-8 h-8 flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--text-muted)', transition: 'color 180ms ease' }} aria-label="Toggle theme">
                    {resolvedTheme === 'light' ? <IconMoon className="w-3.5 h-3.5" /> : <IconSun className="w-3.5 h-3.5" />}
                  </button>
                )}
                <AppDownloadButton size="sm" />
                {isLoggedIn ? (
                  <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-display font-bold text-[13px] px-4 py-2 rounded-[10px]"
                    style={{ background: '#F5A623', color: '#07090F', boxShadow: '0 0 13px rgba(245,166,35,0.16)', transition: 'filter 200ms ease' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1.07)'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1)'}>
                    Dashboard <IconArrowRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" className="font-body text-[13px] font-medium px-3 py-2 hover:text-[#F5A623]"
                      style={{ color: 'var(--text-secondary)', transition: 'color 180ms ease' }}>Sign in</Link>
                    <Link href="/auth/register" className="inline-flex items-center gap-1.5 font-display font-bold text-[13px] px-4 py-2 rounded-[10px]"
                      style={{ background: '#F5A623', color: '#07090F', boxShadow: '0 0 13px rgba(245,166,35,0.16)', transition: 'filter 200ms ease' }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1.07)'}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1)'}>
                      Get Started <IconArrowRight className="w-3 h-3" />
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile controls */}
              <div className="md:hidden flex items-center gap-1">
                {mounted && (
                  <button onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
                    className="w-9 h-9 flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--text-muted)' }} aria-label="Toggle theme">
                    {resolvedTheme === 'light' ? <IconMoon className="w-3.5 h-3.5" /> : <IconSun className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button className="w-10 h-10 flex items-center justify-center rounded-lg"
                  style={{ color: 'var(--text-secondary)' }} onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
                  <IconMenu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* ── MOBILE DRAWER ───────────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col px-6"
              style={{ background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border-subtle)', animation: 'lp-drawerIn 250ms cubic-bezier(0.16,1,0.3,1) both', paddingTop: 'max(20px, env(safe-area-inset-top, 20px))', paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5" style={{ color: '#F5A623' }}><IconCrosshair className="w-full h-full" /></div>
                  <span className="font-display font-bold text-[14px] tracking-[0.09em] uppercase" style={{ color: 'var(--text-primary)' }}>Marksman</span>
                </div>
                <button className="w-9 h-9 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-secondary)' }} onClick={() => setMobileMenuOpen(false)}>
                  <IconX className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                {[{ label: 'Features', id: 'features' }, { label: 'How it Works', id: 'how-it-works' }, { label: 'Pricing', id: 'pricing' }].map(({ label, id }) => (
                  <button key={id} onClick={() => scrollTo(id)} className="font-body text-[15px] font-medium text-left py-3 px-2 rounded-lg hover:text-[#F5A623]"
                    style={{ color: 'var(--text-secondary)', transition: 'color 180ms ease' }}>{label}</button>
                ))}
                {!isLoggedIn && (
                  <Link href="/auth/login" className="font-body text-[15px] font-medium py-3 px-2 rounded-lg hover:text-[#F5A623]"
                    style={{ color: 'var(--text-secondary)', transition: 'color 180ms ease' }} onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                )}
              </div>
              <div className="pb-8 pt-4 flex flex-col gap-3">
                <AppDownloadButton size="md" className="w-full" />
                <Link href={isLoggedIn ? '/dashboard' : '/auth/register'} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 font-display font-bold text-[13px] w-full py-3.5 rounded-[12px]"
                  style={{ background: '#F5A623', color: '#07090F', boxShadow: '0 0 18px rgba(245,166,35,0.20)' }}>
                  {isLoggedIn ? 'Go to Dashboard' : 'Get Started Free'}
                  <IconArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </>
        )}

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ background: 'var(--bg-void)', minHeight: '100dvh', display: 'flex', alignItems: 'center' }}>
          {/* Background */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Dot grid */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.014) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(ellipse 82% 78% at 55% 44%, black 14%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse 82% 78% at 55% 44%, black 14%, transparent 70%)',
            }} />
            {/* Orbs — ~28% less opaque than original, refined */}
            <div className="absolute rounded-full" style={{ width: '660px', height: '660px', background: 'radial-gradient(circle, rgba(245,166,35,0.047) 0%, transparent 56%)', top: '-16%', right: '-10%', animation: 'lp-orbFloat 20s ease-in-out infinite' }} />
            <div className="absolute rounded-full" style={{ width: '460px', height: '460px', background: 'radial-gradient(circle, rgba(79,195,247,0.026) 0%, transparent 58%)', bottom: '2%', left: '-12%', animation: 'lp-orbFloat 24s ease-in-out infinite reverse' }} />
            {/* Target ring SVG */}
            <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none select-none" style={{ opacity: 0.055 }}>
              <svg viewBox="0 0 600 600" className="w-[640px] h-[640px]">
                {[280, 240, 200, 160, 120, 80, 40].map((r, i) => (
                  <circle key={r} cx="300" cy="300" r={r}
                    fill="none" stroke="#F5A623" strokeWidth={i === 0 ? 1 : 0.5} />
                ))}
                <line x1="0"   y1="300" x2="600" y2="300" stroke="#F5A623" strokeWidth="0.5"/>
                <line x1="300" y1="0"   x2="300" y2="600" stroke="#F5A623" strokeWidth="0.5"/>
              </svg>
            </div>
          </div>

          <div className="relative max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pb-20 lg:py-0 w-full"
            style={{ paddingTop: '7rem' }}>
            <div className="grid lg:grid-cols-[1fr_440px] gap-14 lg:gap-20 items-center">

              {/* Copy */}
              <div>
                {/* Eyebrow badge */}
                <div className="inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 mb-8"
                  style={{ background: 'rgba(245,166,35,0.042)', border: '1px solid rgba(245,166,35,0.13)', animation: 'lp-heroUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: '#F5A623', boxShadow: '0 0 4px rgba(245,166,35,0.36)', animation: 'lp-pulseDot 2s ease-in-out infinite' }} />
                  <span className="font-mono font-semibold text-[10px] tracking-[0.20em] uppercase" style={{ color: '#F5A623' }}>Precision Analytics · Elite Performance</span>
                </div>

                {/* H1 */}
                <h1 className="font-display font-black mb-6"
                  style={{ fontSize: 'clamp(38px, 5.2vw, 72px)', lineHeight: '0.95', color: 'var(--text-primary)', letterSpacing: '-0.038em', animation: 'lp-heroUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.12s both' }}>
                  The performance<br />
                  platform built for<br />
                  <span className="gradient-text">elite shooters.</span>
                </h1>

                {/* Sub */}
                <p className="font-body text-[15.5px] leading-[1.74] mb-9 max-w-[440px]"
                  style={{ color: 'var(--text-secondary)', animation: 'lp-heroUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.20s both' }}>
                  Track every shot with millimetre precision. Detect technique flaws automatically.
                  Receive structured, elite-level coaching powered by Advanced AI — after every session.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5 mb-9"
                  style={{ animation: 'lp-heroUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.28s both' }}>
                  <Link href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 font-display font-bold text-[14px] px-7 py-3.5 rounded-[12px] group active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E18E0D 100%)', color: '#07090F', boxShadow: isDark ? '0 0 22px rgba(245,166,35,0.16), 0 4px 14px rgba(0,0,0,0.26)' : '0 4px 14px rgba(245,166,35,0.16)', transition: 'filter 220ms ease, transform 150ms ease' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1)'}>
                    START FOR FREE
                    <IconArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                  <button onClick={() => scrollTo('how-it-works')}
                    className="inline-flex items-center justify-center gap-2 font-body font-medium text-[13px] px-5 py-3.5 rounded-[12px] hover:text-[#F5A623]"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', background: 'transparent', transition: 'color 220ms ease' }}>
                    See how it works
                  </button>
                  <AppDownloadButton size="md" />
                </div>

                {/* Stat chips */}
                <div className="flex flex-wrap items-center gap-2 mb-6"
                  style={{ animation: 'lp-heroUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both' }}>
                  <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: '1px solid var(--border-subtle)' }}>
                    <IconTrophy className="w-3 h-3 text-[#F5A623]" />
                    <span className="font-mono text-[11px] font-bold" style={{ color: '#F5A623' }}>10.9</span>
                    <span className="font-mono text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>WORLD RECORD · AIR RIFLE</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: '1px solid var(--border-subtle)' }}>
                    <IconUsers className="w-3 h-3 text-[#4FC3F7]" />
                    <span className="font-mono text-[11px] font-bold" style={{ color: '#4FC3F7' }}>2,897</span>
                    <span className="font-mono text-[9px] tracking-wider" style={{ color: 'var(--text-muted)' }}>SHOOTERS TRACKED</span>
                  </div>
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-2.5" style={{ animation: 'lp-heroUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.42s both' }}>
                  <div className="flex">
                    {[
                      { bg: 'linear-gradient(135deg,#F5A623,#E8920A)', c: '#000', l: 'A' },
                      { bg: 'linear-gradient(135deg,#4FC3F7,#0891B2)', c: '#000', l: 'K' },
                      { bg: 'linear-gradient(135deg,#00D48A,#009960)', c: '#000', l: 'M' },
                      { bg: 'linear-gradient(135deg,#A78BFA,#7C3AED)', c: '#fff', l: 'R' },
                    ].map((av, i) => (
                      <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center font-display font-black text-[10px]"
                        style={{ background: av.bg, color: av.c, border: '2px solid var(--bg-void)', marginLeft: i === 0 ? 0 : '-8px', position: 'relative', zIndex: 4 - i }}>
                        {av.l}
                      </div>
                    ))}
                  </div>
                  <p className="font-body text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    Join <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>2,897 elite shooters</span> training smarter
                  </p>
                </div>
              </div>

              {/* Dashboard mockup */}
              <div className="hidden lg:block" style={{ animation: 'lp-heroDelay 850ms cubic-bezier(0.16,1,0.3,1) both' }}>
                <DashboardMockup isDark={isDark} />
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
        <div style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', padding: '22px 0 18px' }}>
          <div className="max-w-6xl mx-auto px-4 mb-4 text-center">
            <p className="font-mono text-[9px] tracking-[0.26em] uppercase" style={{ color: 'var(--text-muted)' }}>
              Trusted by national teams &amp; ISSF federations worldwide
            </p>
          </div>
          <TrustMarquee />
        </div>

        <StatsSection />
        <BentoFeaturesSection />
        <AppPreviewSection isDark={isDark} />
        <VisionAISection />
        <HowItWorksSection />
        {/* <PricingSection /> */}
        <TestimonialsSection />

        {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
        <section className="py-40 lg:py-52 relative overflow-hidden" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.010) 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 14%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 14%, transparent 70%)',
            }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 46% at 50% 50%, rgba(245,166,35,0.040) 0%, transparent 60%)' }} />
          </div>

          <div className="max-w-2xl mx-auto px-5 sm:px-6 lg:px-8 text-center relative">
            <Eyebrow>Get Started Today — Free</Eyebrow>
            <h2 className="font-display font-black mb-7"
              style={{ fontSize: 'clamp(34px, 5.4vw, 66px)', lineHeight: '0.96', color: 'var(--text-primary)', letterSpacing: '-0.038em' }}>
              Train like an elite.<br />
              <span className="gradient-text">Score like a champion.</span>
            </h2>
            <p className="font-body text-[15px] leading-[1.76] mb-11 mx-auto max-w-md" style={{ color: 'var(--text-secondary)' }}>
              Join thousands of competitive shooters who use Marksman to track, analyse, and sharpen their performance — one shot at a time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link href="/auth/register"
                className="inline-flex items-center gap-2 font-display font-bold text-[14px] px-9 py-4 rounded-[13px] group active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E18E0D 100%)', color: '#07090F', boxShadow: '0 0 28px rgba(245,166,35,0.18), 0 4px 14px rgba(0,0,0,0.30)', transition: 'filter 220ms ease' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1.07)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1)'}>
                START FOR FREE
                <IconArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link href="/auth/login"
                className="inline-flex items-center gap-2 font-body font-medium text-[13px] px-6 py-4 rounded-[13px] hover:text-[#F5A623]"
                style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', transition: 'color 220ms ease' }}>
                Already have an account →
              </Link>
            </div>
            <p className="font-mono text-[9px] mt-7 tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
              No credit card required · Free forever for individual athletes
            </p>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer className="pt-20" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-12 mb-14">
              <div className="md:col-span-2">
                <Link href="/" className="inline-flex items-center gap-2 mb-4">
                  <div className="w-5 h-5" style={{ color: '#F5A623' }}><IconCrosshair className="w-full h-full" /></div>
                  <span className="font-display font-bold text-[14px] tracking-[0.09em] uppercase" style={{ color: 'var(--text-primary)' }}>Marksman</span>
                </Link>
                <p className="font-body text-[13px] leading-[1.7] max-w-xs" style={{ color: 'var(--text-muted)' }}>
                  Elite shooting analytics — precision data, structured coaching, and measurable improvement for every competitor.
                </p>
                <div className="flex items-center gap-2 mt-4 rounded-full w-fit px-3 py-1.5"
                  style={{ background: 'rgba(0,212,138,0.052)', border: '1px solid rgba(0,212,138,0.12)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D48A]" style={{ animation: 'lp-pulseDot 2s ease-in-out infinite' }} />
                  <span className="font-mono text-[9px] text-[#00D48A] tracking-[0.18em]">ALL SYSTEMS NOMINAL</span>
                </div>
              </div>
              <div>
                <p className="font-mono font-semibold text-[9px] tracking-[0.24em] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Platform</p>
                <ul className="space-y-3">
                  {[{ label: 'Features', id: 'features' }, { label: 'How It Works', id: 'how-it-works' }, { label: 'Pricing', id: 'pricing' }].map(({ label, id }) => (
                    <li key={id}><button onClick={() => scrollTo(id)} className="font-body text-[13px] hover:text-[#F5A623]" style={{ color: 'var(--text-secondary)', transition: 'color 180ms ease' }}>{label}</button></li>
                  ))}
                  <li><AppDownloadButton size="sm" /></li>
                </ul>
              </div>
              <div>
                <p className="font-mono font-semibold text-[9px] tracking-[0.24em] uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Account</p>
                <ul className="space-y-3">
                  {[{ label: 'Sign In', href: '/auth/login' }, { label: 'Get Started', href: '/auth/register' }, { label: 'Privacy Policy', href: '#' }, { label: 'Support', href: '#' }].map(({ label, href }) => (
                    <li key={label}><Link href={href} className="font-body text-[13px] hover:text-[#F5A623]" style={{ color: 'var(--text-secondary)', transition: 'color 180ms ease' }}>{label}</Link></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="pt-6 flex flex-wrap items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="font-mono text-[10px] tracking-wide" style={{ color: 'var(--text-muted)' }}>© 2026 Marksman · Precision Analytics Platform</p>
              <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>Built for precision. Engineered for champions.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}