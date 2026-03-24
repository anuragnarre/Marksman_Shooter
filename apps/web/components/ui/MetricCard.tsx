// apps/web/components/ui/MetricCard.tsx
'use client';

// DESIGN NOTE: 2026 KPI bento-card. Large neon stat number with count-up,
// progress-arc ring dial, sparkline, and animated delta badge.

import { useCountUp } from '../../hooks/useCountUp';

interface MetricCardProps {
  label: string;
  value: number;
  unit?: string;
  delta?: number;
  suffix?: string;
  color?: 'accent' | 'blue' | 'red' | 'emerald';
  sparklineData?: number[];
  isPB?: boolean;
  decimals?: number;
  icon?: React.ReactNode;
  animationDelay?: number;
  className?: string;
}

const COLOR_MAP = {
  accent:  { hex: '#F5A623', glow: 'rgba(245,166,35,0.35)',   text: '#F5A623', bg: 'rgba(245,166,35,0.08)'  },
  blue:    { hex: '#4FC3F7', glow: 'rgba(79,195,247,0.3)',    text: '#4FC3F7', bg: 'rgba(79,195,247,0.07)'  },
  red:     { hex: '#FF4D6D', glow: 'rgba(255,77,109,0.3)',    text: '#FF4D6D', bg: 'rgba(255,77,109,0.07)'  },
  emerald: { hex: '#00E5A0', glow: 'rgba(0,229,160,0.28)',    text: '#00E5A0', bg: 'rgba(0,229,160,0.06)'   },
};

export function MetricCard({
  label, value, unit, delta, suffix = '',
  color = 'accent', sparklineData, isPB = false,
  decimals = 1, icon, animationDelay = 0, className = '',
}: MetricCardProps) {
  const animatedValue = useCountUp(value, 1400);
  const c = COLOR_MAP[color];
  const hasDelta = delta !== undefined;
  const deltaUp  = (delta ?? 0) >= 0;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden flex flex-col gap-2 p-5
                  animate-slide-up transition-all duration-300 group ${className}`}
      style={{
        animationDelay: `${animationDelay}ms`,
        background: `linear-gradient(145deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)`,
        border: `1px solid var(--glass-border)`,
        boxShadow: isPB
          ? `0 0 0 1px ${c.hex}30, 0 8px 32px -8px ${c.glow}, var(--shadow-card)`
          : `var(--shadow-card)`,
      }}
    >
      {/* Top gradient accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${c.hex}90 40%, ${c.hex} 50%, ${c.hex}90 60%, transparent 100%)`,
          opacity: isPB ? 1 : 0.4,
        }}
      />

      {/* Subtle color wash background */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, ${c.bg} 0%, transparent 60%)`,
        }}
      />

      {/* PB corner badge */}
      {isPB && (
        <div
          className="absolute top-0 right-0 w-0 h-0"
          style={{
            borderStyle: 'solid',
            borderWidth: '0 40px 40px 0',
            borderColor: `transparent ${c.hex} transparent transparent`,
          }}
        >
          <span
            className="absolute top-1 right-[-34px] text-[8px] font-display font-black
                       uppercase tracking-wide rotate-45 text-[#060810]"
          >
            PB
          </span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p
            className="text-[10px] font-display font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--text-muted)' }}
          >
            {label}
          </p>
          {unit && (
            <p className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {unit}
            </p>
          )}
        </div>

        {icon ? (
          <span style={{ color: c.text, opacity: 0.5, filter: `drop-shadow(0 0 4px ${c.hex}40)` }}>
            {icon}
          </span>
        ) : (
          /* Mini glow dot */
          <div
            className="w-1.5 h-1.5 rounded-full mt-1"
            style={{
              background: c.hex,
              boxShadow: `0 0 6px ${c.hex}`,
              animation: 'pulseGlow 2.5s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-2 relative z-10">
        <span
          className="font-data font-black leading-none tabular-nums"
          style={{
            fontSize: 'clamp(28px, 3.5vw, 38px)',
            color: c.hex,
            textShadow: `0 0 20px ${c.glow}, 0 0 40px ${c.glow}`,
            animation: 'countUp 600ms cubic-bezier(0.16,1,0.3,1) both',
            animationDelay: `${animationDelay + 100}ms`,
          }}
        >
          {animatedValue.toFixed(decimals)}
        </span>
        {suffix && (
          <span className="text-sm mb-1 font-display font-semibold" style={{ color: 'var(--text-muted)' }}>
            {suffix}
          </span>
        )}
      </div>

      {/* Delta + sparkline */}
      <div className="flex items-center justify-between mt-auto relative z-10">
        {hasDelta ? (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-display font-bold
                       uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{
              color: deltaUp ? '#00E5A0' : '#FF4D6D',
              background: deltaUp ? 'rgba(0,229,160,0.1)' : 'rgba(255,77,109,0.1)',
              border: `1px solid ${deltaUp ? 'rgba(0,229,160,0.2)' : 'rgba(255,77,109,0.2)'}`,
            }}
          >
            {deltaUp ? '↑' : '↓'} {Math.abs(delta!).toFixed(2)}
          </span>
        ) : (
          <span />
        )}

        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} color={c.hex} />
        )}
      </div>
    </div>
  );
}

// ── Mini Sparkline ────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 70; const H = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * (H - 4) - 2,
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = `M0,${H} L${points.map((p) => `${p.x},${p.y}`).join(' L')} L${W},${H} Z`;
  const last = points[points.length - 1];
  const id = `sg-${color.replace('#', '')}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <polyline
        points={polyline} fill="none" stroke={color}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}90)` }}
      />
      <circle cx={last.x} cy={last.y} r="2.5" fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
}
