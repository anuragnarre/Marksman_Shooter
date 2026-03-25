'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';
import { useTheme } from '../contexts/theme-context';

// ─── Shot data (deterministic) ───────────────────────────────────────────────
const SHOTS = [
  { cx: 50.4, cy: 49.2, score: 10.9 },
  { cx: 49.1, cy: 50.8, score: 10.7 },
  { cx: 51.2, cy: 48.6, score: 10.6 },
  { cx: 48.8, cy: 51.4, score: 10.4 },
  { cx: 50.9, cy: 50.5, score: 10.8 },
  { cx: 49.6, cy: 49.0, score: 10.2 },
  { cx: 51.8, cy: 51.1, score: 10.1 },
  { cx: 47.9, cy: 48.7, score: 9.9 },
];

function shotColor(score: number): string {
  if (score >= 10.5) return '#F5A623';
  if (score >= 10.0) return '#4FC3F7';
  if (score >= 9.0)  return '#00E5A0';
  return '#FF4D6D';
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconCrosshair({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconTrophy({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function IconMenu({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconSun({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
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

// ─── Target Canvas Mockup ─────────────────────────────────────────────────────
function TargetMockup() {
  const rings = [50, 40, 30, 22, 15, 9, 5, 2.5];
  const ringColors = [
    'rgba(255,255,255,0.05)',
    'rgba(255,255,255,0.05)',
    'rgba(255,255,255,0.07)',
    'rgba(255,255,255,0.07)',
    '#1a2035',
    '#1a2035',
    'rgba(79,195,247,0.12)',
    'rgba(245,166,35,0.18)',
  ];

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-label="Air rifle target with shot markers">
      <circle cx="50" cy="50" r="50" fill="#060810" />
      {rings.map((r, i) => (
        <circle
          key={r}
          cx="50"
          cy="50"
          r={r}
          fill={ringColors[i]}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.4"
        />
      ))}
      <line x1="50" y1="2" x2="50" y2="22" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
      <line x1="50" y1="78" x2="50" y2="98" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
      <line x1="2" y1="50" x2="22" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
      <line x1="78" y1="50" x2="98" y2="50" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
      {SHOTS.map((shot, i) => {
        const color = shotColor(shot.score);
        return (
          <g key={i}>
            <circle cx={shot.cx} cy={shot.cy} r="1.6" fill={color} opacity="0.25" />
            <circle cx={shot.cx} cy={shot.cy} r="0.9" fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup({ isDark }: { isDark: boolean }) {
  const miniShots = SHOTS.slice(0, 4);
  return (
    <div
      className="relative w-full max-w-[420px] mx-auto"
      style={{ animation: 'lp-floatY 5s ease-in-out infinite' }}
    >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: isDark ? 'rgba(12,15,26,0.88)' : 'rgba(255,255,255,0.95)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          backdropFilter: 'blur(24px)',
          boxShadow: isDark
            ? '0 0 60px rgba(245,166,35,0.15), 0 0 120px rgba(79,195,247,0.08), 0 24px 64px rgba(0,0,0,0.6)'
            : '0 0 40px rgba(245,166,35,0.10), 0 8px 40px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.8) inset',
        }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <p className="font-display font-bold text-[11px] tracking-widest text-[#F5A623] uppercase">Session #047</p>
            <p className="font-data text-[10px] mt-0.5" style={{ color: isDark ? '#4A5568' : '#8892A4' }}>Air Rifle · 10m · 2026-03-21</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" style={{ boxShadow: '0 0 6px #00E5A0' }} />
            <span className="font-data text-[10px] text-[#00E5A0]">LIVE</span>
          </div>
        </div>

        {/* Target */}
        <div className="px-4 pb-2">
          <div
            className="relative w-full aspect-square rounded-xl overflow-hidden"
            style={{
              background: isDark ? '#060810' : '#0C1020',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.15)',
            }}
          >
            <TargetMockup />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-3">
          {[
            { label: 'AVG', value: '10.45', color: '#F5A623' },
            { label: 'LAST', value: '9.9', color: '#4FC3F7' },
            { label: 'MPI', value: '0.8mm', color: '#00E5A0' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-lg px-2 py-2 text-center"
              style={{
                background: isDark ? 'rgba(19,24,38,0.8)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.07)',
              }}
            >
              <p className="font-data font-bold text-sm leading-none" style={{ color }}>{value}</p>
              <p className="font-data text-[9px] mt-1 tracking-widest" style={{ color: isDark ? '#4A5568' : '#8892A4' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Mini shot list */}
        <div className="px-4 pb-4 space-y-1.5">
          {miniShots.map((shot, i) => {
            const color = shotColor(shot.score);
            const badge = shot.score >= 10.5 ? 'GOLD' : shot.score >= 10.0 ? 'BLUE' : 'GRN';
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg px-3 py-1.5"
                style={{
                  background: isDark ? 'rgba(19,24,38,0.6)' : 'rgba(0,0,0,0.03)',
                  border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-data text-[10px]" style={{ color: isDark ? '#4A5568' : '#8892A4' }}>#{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-data text-[10px] font-bold" style={{ color }}>{shot.score.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-data text-[9px]" style={{ color: isDark ? '#4A5568' : '#8892A4' }}>
                    x{shot.cx.toFixed(1)} y{shot.cy.toFixed(1)}
                  </span>
                  <span
                    className="rounded-full px-1.5 py-0.5 font-data text-[8px] font-bold"
                    style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                  >
                    {badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ambient orbs */}
      <div
        className="absolute -z-10 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)',
          top: '20%',
          left: '10%',
          animation: 'lp-orbFloat 12s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -z-10 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(79,195,247,0.08) 0%, transparent 70%)',
          bottom: '10%',
          right: '5%',
          animation: 'lp-orbFloat 15s ease-in-out infinite reverse',
        }}
      />
    </div>
  );
}

// ─── Trust Marquee ────────────────────────────────────────────────────────────
const TRUST_ITEMS = [
  { code: 'IND', color: '#FF671F' },
  { code: 'GER', color: '#FFCE00' },
  { code: 'CHN', color: '#DE2910' },
  { code: 'USA', color: '#3C3B6E' },
  { code: 'RUS', color: '#0039A6' },
  { code: 'KOR', color: '#C60C30' },
  { code: 'GBR', color: '#00247D' },
  { code: 'FRA', color: '#002395' },
  { code: 'NOR', color: '#EF2B2D' },
  { code: 'AUT', color: '#ED2939' },
  { code: 'SRB', color: '#0C4076' },
  { code: 'HUN', color: '#CE2939' },
];

function TrustMarquee() {
  const items = [...TRUST_ITEMS, ...TRUST_ITEMS];
  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--bg-surface), transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--bg-surface), transparent)' }}
      />
      <div
        className="flex gap-6 py-3"
        style={{ animation: 'lp-marquee 32s linear infinite', width: 'max-content' }}
      >
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-3 whitespace-nowrap">
            <span
              className="inline-flex items-center justify-center rounded font-display font-bold text-[10px] tracking-widest px-2 py-0.5"
              style={{
                background: `${item.color}22`,
                border: `1px solid ${item.color}55`,
                color: item.color,
              }}
            >
              {item.code}
            </span>
            <span style={{ color: 'var(--border-subtle)', fontSize: '10px' }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative rounded-2xl p-6 transition-all duration-300 cursor-default"
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${hovered ? 'rgba(245,166,35,0.3)' : 'var(--border-subtle)'}`,
        boxShadow: hovered
          ? '0 8px 40px rgba(0,0,0,0.4), 0 0 40px -10px rgba(245,166,35,0.15)'
          : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: 'rgba(245,166,35,0.12)',
          border: '1px solid rgba(245,166,35,0.2)',
        }}
      >
        {icon}
      </div>
      <h3 className="font-display font-bold text-lg tracking-wide mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
    </div>
  );
}

// ─── Step Item ────────────────────────────────────────────────────────────────
interface StepItemProps {
  number: string;
  title: string;
  description: string;
}

function StepItem({ number, title, description }: StepItemProps) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0 w-16">
        <span
          className="font-display font-bold text-5xl leading-none select-none"
          style={{
            background: 'linear-gradient(135deg, #F5A623 0%, rgba(245,166,35,0.3) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {number}
        </span>
      </div>
      <div className="pt-1">
        <h3 className="font-display font-bold text-xl tracking-wide mb-2" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <p className="font-body text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Additional Icons ─────────────────────────────────────────────────────────
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
function IconShield({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

// ─── Scroll Reveal Hook ────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2000 }: {
  end: number; suffix?: string; prefix?: string; duration?: number;
}) {
  const { ref, visible } = useReveal(0.3);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const steps = 60;
    let step = 0;
    const id = setInterval(() => {
      step++;
      setCount(Math.round(end * Math.min(step / steps, 1)));
      if (step >= steps) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [visible, end, duration]);
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ─── Stats Section ────────────────────────────────────────────────────────────
const STATS = [
  { end: 1200000, suffix: '+', label: 'Shots Analyzed', color: '#F5A623', icon: <IconCrosshair className="w-5 h-5" /> },
  { end: 48000,   suffix: '+', label: 'Sessions Logged', color: '#4FC3F7', icon: <IconBarChart className="w-5 h-5" /> },
  { end: 127,     suffix: '',  label: 'Nations Active',  color: '#00E5A0', icon: <IconUsers className="w-5 h-5" /> },
  { end: 97,      suffix: '.8%', label: 'AI Accuracy',  color: '#A78BFA', icon: <IconActivity className="w-5 h-5" /> },
];

function StatsSection() {
  const { ref, visible } = useReveal(0.1);
  return (
    <section ref={ref} style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="relative flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-500"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 600ms ${i * 120}ms cubic-bezier(0.16,1,0.3,1), transform 600ms ${i * 120}ms cubic-bezier(0.16,1,0.3,1)`,
              }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-1/4 right-1/4 h-px rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${stat.color}80, transparent)` }} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 flex-shrink-0" style={{ background: `${stat.color}18`, border: `1px solid ${stat.color}30`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="font-data font-black text-3xl lg:text-4xl mb-1 leading-none" style={{ color: stat.color }}>
                {visible ? <AnimatedCounter end={stat.end} suffix={stat.suffix} /> : '0'}
              </div>
              <div className="font-display text-[11px] font-bold tracking-widest uppercase mt-1" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Bento Grid Features ──────────────────────────────────────────────────────
const BENTO_FEATURES = [
  {
    icon: <IconCrosshair className="w-6 h-6" />,
    title: 'Shot-by-Shot Analysis',
    description: 'Every shot mapped with x/y coordinates, score deviation, MPI, and group radius. Understand exactly where and why shots land.',
    color: '#F5A623',
    span: 'lg:col-span-2',
    tag: 'Core',
  },
  {
    icon: <IconActivity className="w-6 h-6" />,
    title: 'Live Biometric Feed',
    description: 'Sync HRV, heart rate, and breath rhythm. Correlate physiological state with shot scores in real time.',
    color: '#4FC3F7',
    span: 'lg:col-span-1',
    tag: 'Pro',
  },
  {
    icon: <IconUsers className="w-6 h-6" />,
    title: 'Coach Dashboard',
    description: 'Invite coaches to review sessions, add structured feedback, and track athlete progression over time.',
    color: '#00E5A0',
    span: 'lg:col-span-1',
    tag: 'Teams',
  },
  {
    icon: <IconBrain className="w-6 h-6" />,
    title: 'AI Coaching Engine',
    description: 'Proprietary rules engine delivers structured coaching feedback immediately after every session — no human review needed.',
    color: '#A78BFA',
    span: 'lg:col-span-2',
    tag: 'AI',
  },
  {
    icon: <IconCamera className="w-6 h-6" />,
    title: 'Vision AI',
    description: 'Camera-based target analysis. Point, shoot, upload — automatic hole detection and scoring via computer vision.',
    color: '#FF4D6D',
    span: 'lg:col-span-1',
    tag: 'Vision',
  },
  {
    icon: <IconDownload className="w-6 h-6" />,
    title: 'Export & Reports',
    description: 'PDF session reports, CSV exports, and shareable session links. Your data, your way.',
    color: '#F5A623',
    span: 'lg:col-span-1',
    tag: 'Export',
  },
];

function BentoFeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32" style={{ background: 'var(--bg-void)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="font-display font-bold text-[11px] tracking-widest uppercase mb-3" style={{ color: '#F5A623' }}>
            Platform Capabilities
          </p>
          <h2 className="font-display font-bold text-3xl lg:text-5xl" style={{ color: 'var(--text-primary)', lineHeight: '1.15' }}>
            Built for precision at every level
          </h2>
          <p className="font-body text-base mt-4 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Six core capabilities working together to give you an unfair analytical advantage.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENTO_FEATURES.map((feat, i) => {
            const { ref, visible } = useRevealStatic(i);
            return (
              <div
                key={feat.title}
                ref={ref}
                className={`relative rounded-2xl p-6 overflow-hidden group cursor-default ${feat.span}`}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(32px)',
                  transition: `opacity 600ms ${i * 80}ms cubic-bezier(0.16,1,0.3,1), transform 600ms ${i * 80}ms cubic-bezier(0.16,1,0.3,1), border-color 250ms ease, box-shadow 250ms ease`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${feat.color}40`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 40px -8px ${feat.color}22, 0 4px 24px rgba(0,0,0,0.4)`;
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLDivElement).style.transform = visible ? 'translateY(0)' : 'translateY(32px)';
                }}
              >
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent 5%, ${feat.color}60 50%, transparent 95%)`, opacity: 0.6 }} />
                {/* Background glow blob */}
                <div className="absolute top-4 right-4 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle, ${feat.color}08 0%, transparent 70%)` }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${feat.color}16`, border: `1px solid ${feat.color}30`, color: feat.color }}>
                      {feat.icon}
                    </div>
                    <span className="font-display font-bold text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full" style={{ background: `${feat.color}14`, border: `1px solid ${feat.color}30`, color: feat.color }}>
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg tracking-wide mb-2" style={{ color: 'var(--text-primary)' }}>{feat.title}</h3>
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Hooks can't be called inside .map, use a pre-built stable approach
const BENTO_REFS: Array<{ ref: React.RefObject<HTMLDivElement | null>; visible: boolean }> = [];
function useRevealStatic(_index: number) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useReveal(0.1);
}

// ─── App Preview Section ─────────────────────────────────────────────────────
function AppPreviewSection({ isDark }: { isDark: boolean }) {
  const { ref, visible } = useReveal(0.1);
  return (
    <section ref={ref} className="py-24 lg:py-32 overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-32px)', transition: 'opacity 700ms cubic-bezier(0.16,1,0.3,1), transform 700ms cubic-bezier(0.16,1,0.3,1)' }}>
            <p className="font-display font-bold text-[11px] tracking-widest uppercase mb-3" style={{ color: '#F5A623' }}>See It In Action</p>
            <h2 className="font-display font-bold text-3xl lg:text-4xl mb-5" style={{ color: 'var(--text-primary)', lineHeight: '1.15' }}>
              Your entire session,<br />in one intelligent view.
            </h2>
            <p className="font-body text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
              The Marksman dashboard brings together your shot map, score timeline, AI coaching feedback, and biometric data — all in real time. Nothing gets lost between the firing point and your next training plan.
            </p>
            <ul className="space-y-3">
              {[
                { icon: <IconCrosshair className="w-4 h-4" />, text: 'Interactive shot-by-shot replay', color: '#F5A623' },
                { icon: <IconBarChart className="w-4 h-4" />, text: 'Series score trend analysis',     color: '#4FC3F7' },
                { icon: <IconBrain className="w-4 h-4" />,   text: 'Instant AI coaching feedback',    color: '#A78BFA' },
                { icon: <IconZap className="w-4 h-4" />,     text: 'Live session with coach access',  color: '#00E5A0' },
              ].map(({ icon, text, color }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}14`, color }}>{icon}</span>
                  <span className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: browser chrome + dashboard */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(32px)', transition: 'opacity 700ms 150ms cubic-bezier(0.16,1,0.3,1), transform 700ms 150ms cubic-bezier(0.16,1,0.3,1)' }}>
            <div className="relative" style={{ animation: 'lp-floatY 6s ease-in-out infinite' }}>
              {/* Browser chrome */}
              <div className="rounded-2xl overflow-hidden" style={{ border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', boxShadow: isDark ? '0 32px 80px rgba(0,0,0,0.7), 0 0 80px rgba(245,166,35,0.08)' : '0 16px 60px rgba(0,0,0,0.15)' }}>
                {/* URL bar */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: isDark ? '#0C0F1A' : '#F8F9FC', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' }}>
                  <div className="flex gap-1.5">
                    {['#FF5F57','#FFBD2E','#28CA41'].map((c, i) => <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
                  </div>
                  <div className="flex-1 rounded-md px-3 py-1 text-center" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                    <span className="font-data text-[10px]" style={{ color: 'var(--text-muted)' }}>app.marksmanspro.com/sessions</span>
                  </div>
                </div>
                {/* Dashboard content */}
                <DashboardMockup isDark={isDark} />
              </div>
              {/* Ambient glow */}
              <div className="absolute -z-10 inset-4 rounded-3xl blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.3) 0%, rgba(79,195,247,0.15) 50%, transparent 80%)' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "The shot grouping analysis alone changed how I approach each series. I can pinpoint exactly which shots are technique errors vs. ammunition variance.",
    name: 'Arjun Babuta',
    role: 'National Rifle Team · IND',
    initials: 'AB',
    score: '629.1',
    scoreLabel: 'World Cup Score',
    color: '#F5A623',
  },
  {
    quote: "I monitor all my athletes simultaneously in real-time. The AI coaching suggestions surface patterns I'd miss reviewing manually — it's a genuine force multiplier.",
    name: 'M. Kovalenko',
    role: 'Olympic Coach · UKR',
    initials: 'MK',
    score: '12',
    scoreLabel: 'Athletes Managed',
    color: '#4FC3F7',
  },
  {
    quote: "My average improved by 0.4 points in six weeks using the breathing sync analysis. The data doesn't lie — and now neither does my trigger hand.",
    name: 'Seo Yu-jin',
    role: 'World Championship Medallist · KOR',
    initials: 'SY',
    score: '10.8',
    scoreLabel: 'Session Average',
    color: '#00E5A0',
  },
];

function TestimonialsSection() {
  const { ref, visible } = useReveal(0.1);
  return (
    <section ref={ref} className="py-24 lg:py-32" style={{ background: 'var(--bg-void)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="font-display font-bold text-[11px] tracking-widest uppercase mb-3" style={{ color: '#F5A623' }}>Social Proof</p>
          <h2 className="font-display font-bold text-3xl lg:text-5xl" style={{ color: 'var(--text-primary)', lineHeight: '1.15' }}>
            Trusted by elite athletes
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="relative rounded-2xl p-6 flex flex-col"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(36px)',
                transition: `opacity 700ms ${i * 120}ms cubic-bezier(0.16,1,0.3,1), transform 700ms ${i * 120}ms cubic-bezier(0.16,1,0.3,1)`,
              }}
            >
              {/* Top accent */}
              <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${t.color}60, transparent)` }} />
              {/* Quote mark */}
              <span className="font-serif text-5xl leading-none mb-3 select-none" style={{ color: `${t.color}40` }}>"</span>
              <p className="font-body text-sm leading-relaxed flex-1 mb-6" style={{ color: 'var(--text-secondary)' }}>"{t.quote}"</p>
              {/* Score badge */}
              <div className="flex items-center justify-between mb-5">
                <div className="rounded-xl px-3 py-2 text-center" style={{ background: `${t.color}12`, border: `1px solid ${t.color}25` }}>
                  <div className="font-data font-black text-xl leading-none" style={{ color: t.color }}>{t.score}</div>
                  <div className="font-display text-[9px] font-bold tracking-widest uppercase mt-0.5" style={{ color: `${t.color}80` }}>{t.scoreLabel}</div>
                </div>
              </div>
              {/* Author */}
              <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-black text-sm flex-shrink-0" style={{ background: `${t.color}20`, color: t.color, border: `1.5px solid ${t.color}40` }}>
                  {t.initials}
                </div>
                <div>
                  <div className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                  <div className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const isLoggedIn = mounted && !!user;
  const isDark = !mounted || resolvedTheme !== 'light';

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        @keyframes lp-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes lp-floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes lp-orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(16px, -18px) scale(1.06); }
          66%       { transform: translate(-10px, 8px) scale(0.96); }
        }
        @keyframes lp-heroFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-heroFadeUpDelay {
          0%   { opacity: 0; transform: translateY(28px); }
          20%  { opacity: 0; transform: translateY(28px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-drawerIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes lp-counterUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-sectionReveal {
          from { opacity: 0; transform: translateY(40px) scale(0.98); filter: blur(3px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes lp-borderPulse {
          0%, 100% { border-color: rgba(245,166,35,0.25); }
          50% { border-color: rgba(245,166,35,0.6); box-shadow: 0 0 24px rgba(245,166,35,0.15); }
        }
        @keyframes lp-scanH {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
        html { scroll-behavior: smooth; }
      `}</style>

      <div className="min-h-screen font-body" style={{ background: 'var(--bg-void)', color: 'var(--text-primary)' }}>

        {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={scrolled ? {
            backdropFilter: 'blur(12px)',
            background: 'rgba(8,10,15,0.85)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          } : {}}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-8 h-8 text-[#F5A623]">
                  <IconCrosshair className="w-full h-full" />
                </div>
                <span className="font-display font-bold text-xl tracking-widest text-[#F0F4FF] uppercase">
                  Marksman
                </span>
              </Link>

              {/* Desktop center links */}
              <div className="hidden md:flex items-center gap-8">
                {[
                  { label: 'Features', id: 'features' },
                  { label: 'How it Works', id: 'how-it-works' },
                  { label: 'Pricing', id: 'pricing' },
                ].map(({ label, id }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className="font-body text-sm transition-colors duration-200 hover:text-[#F5A623]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Desktop right CTA */}
              <div className="hidden md:flex items-center gap-4">
                {/* Theme toggle */}
                {mounted && (
                  <button
                    onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
                    className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  >
                    {resolvedTheme === 'light' ? <IconMoon className="w-4.5 h-4.5" /> : <IconSun className="w-4.5 h-4.5" />}
                  </button>
                )}
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="font-display font-bold text-sm tracking-wide px-5 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.03]"
                    style={{ background: '#F5A623', color: '#080A0F' }}
                  >
                    Go to Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="font-body text-sm transition-colors duration-200 hover:text-[#F5A623]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/register"
                      className="font-display font-bold text-sm tracking-wide px-5 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.03]"
                      style={{
                        background: '#F5A623',
                        color: '#080A0F',
                        boxShadow: '0 0 24px rgba(245,166,35,0.3)',
                      }}
                    >
                      Get Started →
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile controls */}
              <div className="md:hidden flex items-center gap-1">
                {mounted && (
                  <button
                    onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
                    className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  >
                    {resolvedTheme === 'light' ? <IconMoon className="w-4 h-4" /> : <IconSun className="w-4 h-4" />}
                  </button>
                )}
                <button
                  className="w-11 h-11 flex items-center justify-center rounded-lg"
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <IconMenu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* ── MOBILE DRAWER ────────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col pt-6 px-6"
              style={{
                background: 'var(--bg-elevated)',
                borderLeft: '1px solid var(--border-subtle)',
                animation: 'lp-drawerIn 280ms cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-display font-bold text-lg tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>
                  Menu
                </span>
                <div className="flex items-center gap-1">
                  {mounted && (
                    <button
                      onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
                      className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200"
                      style={{ color: 'var(--text-secondary)' }}
                      aria-label={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    >
                      {resolvedTheme === 'light' ? <IconMoon className="w-4 h-4" /> : <IconSun className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    className="w-10 h-10 flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-1">
                {[
                  { label: 'Features', id: 'features' },
                  { label: 'How it Works', id: 'how-it-works' },
                  { label: 'Pricing', id: 'pricing' },
                ].map(({ label, id }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className="text-left px-4 py-3 rounded-xl font-body text-base transition-colors duration-200 hover:bg-[#1A2035]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 pb-8">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-display font-bold text-sm tracking-wide px-5 py-3.5 rounded-xl text-center"
                    style={{ background: '#F5A623', color: '#080A0F' }}
                  >
                    Go to Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="font-body text-sm py-3.5 text-center rounded-xl border transition-colors duration-200"
                      style={{
                        color: 'var(--text-secondary)',
                        borderColor: 'var(--border-subtle)',
                        background: 'transparent',
                      }}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="font-display font-bold text-sm tracking-wide px-5 py-3.5 rounded-xl text-center"
                      style={{ background: '#F5A623', color: '#080A0F' }}
                    >
                      Get Started →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
          {/* Background image with gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1547347298-4074ad3086f0?w=1800&auto=format&fit=crop&q=70)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 40%',
              filter: 'brightness(0.18) saturate(0.6)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(6,8,16,0.7) 0%, rgba(8,12,28,0.4) 40%, rgba(6,8,16,0.85) 100%)',
            }}
          />
          {/* Scan line animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.025]">
            <div className="absolute inset-x-0 h-px bg-[#F5A623]" style={{ top: '30%', animation: 'lp-scanH 8s linear infinite' }} />
          </div>
          {/* Ambient glows */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: '80vw', height: '80vw', maxWidth: '900px', maxHeight: '900px',
              background: 'radial-gradient(circle at 30% 50%, rgba(245,166,35,0.09) 0%, transparent 60%)',
              top: '-10%', left: '-10%',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              width: '60vw', height: '60vw', maxWidth: '700px', maxHeight: '700px',
              background: 'radial-gradient(circle at 70% 60%, rgba(79,195,247,0.07) 0%, transparent 60%)',
              top: '10%', right: '-5%',
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
            <div className="grid lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-center">

              {/* Left column */}
              <div style={{ animation: 'lp-heroFadeUp 700ms cubic-bezier(0.16,1,0.3,1) both' }}>
                {/* Pill badge */}
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6"
                  style={{
                    background: 'rgba(245,166,35,0.08)',
                    border: '1px solid rgba(245,166,35,0.25)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: '#F5A623', boxShadow: '0 0 6px #F5A623' }}
                  />
                  <span
                    className="font-display font-bold text-[11px] tracking-widest uppercase"
                    style={{ color: '#F5A623' }}
                  >
                    Precision Analytics · Elite Performance
                  </span>
                </div>

                {/* H1 */}
                <h1
                  className="font-display font-bold text-4xl lg:text-6xl mb-6"
                  style={{ color: 'var(--text-primary)', lineHeight: '1.12' }}
                >
                  The performance<br />
                  platform built for<br />
                  <span className="gradient-text" style={{ backgroundSize: '200%' }}>
                    elite shooters.
                  </span>
                </h1>

                {/* Subheadline */}
                <p
                  className="font-body text-[15px] leading-loose mb-8 max-w-xl"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Track every shot with millimetre precision. Detect technique flaws automatically.
                  Receive structured, elite-level coaching powered by Advanced AI — after every single session.
                </p>

                {/* Primary CTA */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center font-display font-bold tracking-wide text-base px-8 py-4 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                      background: '#F5A623',
                      color: '#080A0F',
                      boxShadow: '0 0 40px rgba(245,166,35,0.35), 0 4px 16px rgba(0,0,0,0.4)',
                    }}
                  >
                    START FOR FREE →
                  </Link>
                </div>

                {/* Stat chips */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div
                    className="flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <IconTrophy className="w-3.5 h-3.5 text-[#F5A623]" />
                    <span className="font-data text-xs font-bold" style={{ color: '#F5A623' }}>10.9</span>
                    <span className="font-data text-xs" style={{ color: 'var(--text-muted)' }}>WORLD RECORD · AIR RIFLE</span>
                  </div>
                  <div
                    className="flex items-center gap-2 rounded-full px-3 py-1.5"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <IconUsers className="w-3.5 h-3.5 text-[#4FC3F7]" />
                    <span className="font-data text-xs font-bold" style={{ color: '#4FC3F7' }}>2,847</span>
                    <span className="font-data text-xs" style={{ color: 'var(--text-muted)' }}>SHOOTERS TRACKED</span>
                  </div>
                </div>

                {/* Social proof */}
                <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                  Join{' '}
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    2,847 elite shooters
                  </span>{' '}
                  already training smarter
                </p>
              </div>

              {/* Right column — Dashboard mockup */}
              <div style={{ animation: 'lp-heroFadeUpDelay 900ms cubic-bezier(0.16,1,0.3,1) both' }}>
                <DashboardMockup isDark={isDark} />
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST BAR ──────────────────────────────────────────────────── */}
        <div
          className="py-5"
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 mb-4">
            <p
              className="font-display font-bold text-[11px] tracking-widest text-center uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              Trusted by 12 National Teams &amp; ISSF Federations
            </p>
          </div>
          <TrustMarquee />
        </div>

        {/* ── STATS ──────────────────────────────────────────────────────── */}
        <StatsSection />

        {/* ── FEATURES (BENTO) ───────────────────────────────────────────── */}
        <BentoFeaturesSection />

        {/* ── APP PREVIEW ────────────────────────────────────────────────── */}
        <AppPreviewSection isDark={isDark} />

        {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 lg:py-32" style={{ background: 'var(--bg-surface)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p
                className="font-display font-bold text-[11px] tracking-widest uppercase mb-3"
                style={{ color: '#F5A623' }}
              >
                How It Works
              </p>
              <h2
                className="font-display font-bold text-3xl lg:text-5xl"
                style={{ color: 'var(--text-primary)' }}
              >
                Three steps to elite insight
              </h2>
            </div>
            <div className="max-w-2xl mx-auto flex flex-col gap-12">
              <StepItem
                number="01"
                title="Upload Your Session"
                description="Import CSV/PDF shot data or connect directly from compatible devices. We handle the rest."
              />
              <div
                className="w-px h-8 self-start"
                style={{
                  marginLeft: '28px',
                  background: 'linear-gradient(to bottom, var(--border-subtle), transparent)',
                }}
              />
              <StepItem
                number="02"
                title="Instant Analysis"
                description="AI analyses groupings, MPI, score trends, and technique indicators automatically the moment your data is uploaded."
              />
              <div
                className="w-px h-8 self-start"
                style={{
                  marginLeft: '28px',
                  background: 'linear-gradient(to bottom, var(--border-subtle), transparent)',
                }}
              />
              <StepItem
                number="03"
                title="Receive Your Coaching"
                description="Structured feedback and personalised training recommendations appear immediately after every session."
              />
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
        <TestimonialsSection />

        {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
        <section id="pricing" className="py-24 lg:py-32 relative overflow-hidden">
          {/* Background dots grid */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.03 }}>
            <svg width="100%" height="100%"><defs><pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots)" /></svg>
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(245,166,35,0.09) 0%, transparent 70%)',
            }}
          />
          {/* Ambient orbs */}
          <div className="absolute left-1/4 top-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,166,35,0.06)', animation: 'lp-orbFloat 10s ease-in-out infinite' }} />
          <div className="absolute right-1/4 bottom-1/4 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(79,195,247,0.05)', animation: 'lp-orbFloat 14s ease-in-out infinite reverse' }} />

          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            <p
              className="font-display font-bold text-[11px] tracking-widest uppercase mb-4"
              style={{ color: '#F5A623' }}
            >
              Get Started Today — Free
            </p>
            <h2
              className="font-display font-bold text-3xl lg:text-6xl mb-6 gradient-text"
              style={{ lineHeight: '1.1', backgroundSize: '200%' }}
            >
              Train like an elite.<br />Score like a champion.
            </h2>
            <p
              className="font-body text-base leading-relaxed mb-10 mx-auto max-w-lg"
              style={{ color: 'var(--text-secondary)' }}
            >
              Join thousands of competitive shooters who use Marksman to track, analyse, and sharpen
              their performance — one shot at a time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center font-display font-bold tracking-wide text-base px-10 py-4 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  background: '#F5A623',
                  color: '#080A0F',
                  boxShadow: '0 0 50px rgba(245,166,35,0.4), 0 4px 20px rgba(0,0,0,0.5)',
                }}
              >
                START FOR FREE →
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center font-display font-bold tracking-wide text-base px-8 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Already have an account →
              </Link>
            </div>
            <p
              className="font-body text-xs mt-5"
              style={{ color: 'var(--text-muted)' }}
            >
              No credit card required. Free forever for individual athletes.
            </p>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer
          className="py-12"
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-10 mb-10">
              {/* Brand */}
              <div>
                <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 text-[#F5A623]">
                    <IconCrosshair className="w-full h-full" />
                  </div>
                  <span className="font-display font-bold text-lg tracking-widest text-[#F0F4FF] uppercase">
                    Marksman
                  </span>
                </Link>
                <p
                  className="font-body text-sm leading-relaxed max-w-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Elite shooting analytics — precision data, structured coaching, and measurable improvement.
                </p>
              </div>

              {/* Quick links */}
              <div>
                <p
                  className="font-display font-bold text-xs tracking-widest uppercase mb-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Quick Links
                </p>
                <ul className="space-y-2">
                  {[
                    { label: 'Features', type: 'scroll', id: 'features' },
                    { label: 'How It Works', type: 'scroll', id: 'how-it-works' },
                    { label: 'Pricing', type: 'scroll', id: 'pricing' },
                  ].map(({ label, id }) => (
                    <li key={id}>
                      <button
                        onClick={() => scrollTo(id)}
                        className="font-body text-sm transition-colors duration-200 hover:text-[#F5A623]"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="/auth/login"
                      className="font-body text-sm transition-colors duration-200 hover:text-[#F5A623]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/register"
                      className="font-body text-sm transition-colors duration-200 hover:text-[#F5A623]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Get Started
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal / status */}
              <div className="md:text-right">
                <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                  © 2026 Marksman.
                </p>
                <p className="font-body text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Built for precision.
                </p>
                <div className="flex md:justify-end gap-4 mt-4">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{
                      background: 'rgba(0,229,160,0.08)',
                      border: '1px solid rgba(0,229,160,0.2)',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]"
                      style={{ boxShadow: '0 0 4px #00E5A0' }}
                    />
                    <span className="font-data text-[10px] text-[#00E5A0]">All systems nominal</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p
                className="font-data text-[11px] text-center"
                style={{ color: 'var(--text-muted)' }}
              >
                MARKSMAN · PRECISION ANALYTICS PLATFORM · EST. 2026
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
