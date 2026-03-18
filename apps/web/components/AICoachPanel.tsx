'use client';

// AICoachPanel — floating AI coach assistant.
// Appears as a pulsing button in the bottom-right corner.
// Expands to show insight cards with typewriter animation.

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';

const SPARKLE = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.3 3.3l1 1M11.7 11.7l1 1M3.3 12.7l1-1M11.7 4.3l1-1" />
    <circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

const CLOSE_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="3" y1="3" x2="11" y2="11" />
    <line x1="11" y1="3" x2="3" y2="11" />
  </svg>
);

const INSIGHT_ICON = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1,9 3.5,6 6,7 8.5,4 11,5.5" />
  </svg>
);

const WARN_ICON = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 1L11 10H1L6 1z" />
    <line x1="6" y1="5" x2="6" y2="7.5" />
    <circle cx="6" cy="9" r="0.4" fill="currentColor" stroke="none" />
  </svg>
);

const TIP_ICON = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M6 1a4 4 0 0 1 1.5 7.7V10H4.5V8.7A4 4 0 0 1 6 1z" />
    <line x1="4.5" y1="11" x2="7.5" y2="11" />
  </svg>
);

interface Insight {
  id: string;
  type: 'info' | 'warn' | 'tip';
  text: string;
  metric?: string;
  metricLabel?: string;
}

const SHOOTER_INSIGHTS: Insight[] = [
  { id: '1', type: 'warn', text: 'Your accuracy drops after 20 shots. Consider shorter sessions with focused breaks.', metric: '-0.8', metricLabel: 'Avg score after shot 20' },
  { id: '2', type: 'info', text: 'Best performance recorded between 7–9 AM. Morning sessions yield 12% higher scores.', metric: '+12%', metricLabel: 'Morning vs afternoon' },
  { id: '3', type: 'tip', text: 'Group radius improved 18% this week. Keep consistent follow-through on your trigger release.', metric: '18%', metricLabel: 'Group improvement' },
  { id: '4', type: 'info', text: 'Shot 4 and shot 8 consistently score lowest in your sequences — possible fatigue pattern.', metric: '9.3', metricLabel: 'Avg score at positions 4,8' },
  { id: '5', type: 'tip', text: 'Your standing position scores are 0.4 points higher than kneeling. Prioritize kneeling drills.', metric: '0.4', metricLabel: 'Score gap to close' },
];

const COACH_INSIGHTS: Insight[] = [
  { id: '1', type: 'info', text: '3 shooters showed significant score drops in their last session — review fatigue patterns.', metric: '3', metricLabel: 'Shooters flagged' },
  { id: '2', type: 'warn', text: 'Alex M. has missed 2 consecutive sessions. Consider scheduling a check-in.', metric: '2', metricLabel: 'Missed sessions' },
  { id: '3', type: 'tip', text: 'Team average improved 0.3 points this month. Consistent group training is paying off.', metric: '+0.3', metricLabel: 'Team score delta' },
  { id: '4', type: 'info', text: 'Best performing shooter this week: Sarah C. with 10.42 average across 40 shots.', metric: '10.42', metricLabel: 'Top performer avg' },
];

function useTypewriter(text: string, speed = 18, active = true): string {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;
    idxRef.current = 0;
    setDisplayed('');

    const type = () => {
      if (idxRef.current < text.length) {
        idxRef.current++;
        setDisplayed(text.slice(0, idxRef.current));
        timerRef.current = setTimeout(type, speed);
      }
    };
    timerRef.current = setTimeout(type, speed);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [text, speed, active]);

  return displayed;
}

function InsightCard({ insight, delay = 0 }: { insight: Insight; delay?: number }) {
  const [visible, setVisible] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay);
    const t2 = setTimeout(() => setTyping(true), delay + 80);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay]);

  const typed = useTypewriter(insight.text, 15, typing);

  const colors: Record<Insight['type'], { color: string; bg: string; border: string }> = {
    info:  { color: '#4FC3F7', bg: 'rgba(79,195,247,0.06)', border: 'rgba(79,195,247,0.2)' },
    warn:  { color: '#FF4D6D', bg: 'rgba(255,77,109,0.06)', border: 'rgba(255,77,109,0.2)' },
    tip:   { color: '#00E5A0', bg: 'rgba(0,229,160,0.06)', border: 'rgba(0,229,160,0.2)' },
  };
  const icons = { info: INSIGHT_ICON, warn: WARN_ICON, tip: TIP_ICON };
  const c = colors[insight.type];

  return (
    <div
      className="rounded-xl p-3 transition-all duration-500"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 400ms ease, transform 400ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 shrink-0 w-5 h-5 rounded-lg flex items-center justify-center"
          style={{ background: `${c.color}18`, color: c.color }}
        >
          {icons[insight.type]}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] leading-relaxed" style={{ color: '#C8D0E0' }}>
            {typed}
            {typed.length < insight.text.length && (
              <span
                className="inline-block w-0.5 h-3 ml-0.5 rounded-full align-middle"
                style={{ background: c.color, animation: 'pulseGlow 1s ease-in-out infinite' }}
              />
            )}
          </p>
          {insight.metric && typed === insight.text && (
            <div className="flex items-center gap-1.5 mt-1.5" style={{ animation: 'fadeIn 300ms both' }}>
              <span
                className="font-jetbrains font-bold text-[13px]"
                style={{ color: c.color }}
              >
                {insight.metric}
              </span>
              <span className="text-[10px] font-display uppercase tracking-[0.1em]" style={{ color: '#4A5568' }}>
                {insight.metricLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AICoachPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);

  if (!user) return null;

  const insights = user.role === 'COACH' ? COACH_INSIGHTS : SHOOTER_INSIGHTS;

  const handleOpen = () => {
    setKey((k) => k + 1);
    setOpen(true);
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-[9990] flex items-center gap-2.5 px-4 py-3 rounded-2xl
                     transition-all duration-300 group"
          style={{
            background: 'linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(245,166,35,0.08) 100%)',
            border: '1px solid rgba(245,166,35,0.35)',
            boxShadow:
              '0 8px 32px rgba(245,166,35,0.15), 0 0 0 1px rgba(245,166,35,0.08), inset 0 1px 0 rgba(245,166,35,0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          }}
          aria-label="Open AI Coach"
        >
          {/* Pulse ring */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              border: '1px solid rgba(245,166,35,0.4)',
              animation: 'radarPing 3s cubic-bezier(0,0,0.2,1) infinite',
            }}
          />
          <span style={{ color: '#F5A623', filter: 'drop-shadow(0 0 8px rgba(245,166,35,0.7))' }}>
            {SPARKLE}
          </span>
          <span
            className="font-display font-bold text-[12px] uppercase tracking-[0.12em]"
            style={{ color: '#F5A623' }}
          >
            AI Coach
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: '#00E5A0',
              boxShadow: '0 0 8px rgba(0,229,160,0.8)',
              animation: 'pulseGlowGreen 2s ease-in-out infinite',
            }}
          />
        </button>
      )}

      {/* Expanded panel */}
      {open && (
        <div
          className="fixed z-[9990] flex flex-col"
          style={{
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            right: 24,
            width: 340,
            maxWidth: 'calc(100vw - 48px)',
            maxHeight: '70vh',
            background: 'rgba(8,10,18,0.96)',
            border: '1px solid rgba(245,166,35,0.2)',
            borderRadius: 20,
            boxShadow:
              '0 0 0 1px rgba(245,166,35,0.06), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(245,166,35,0.08)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            animation: 'glassReveal 300ms cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          {/* Top glow */}
          <div
            className="absolute top-0 inset-x-0 h-px pointer-events-none rounded-t-[20px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 10%, rgba(245,166,35,0.7) 50%, transparent 90%)',
            }}
          />

          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245,166,35,0.2) 0%, rgba(245,166,35,0.08) 100%)',
                border: '1px solid rgba(245,166,35,0.3)',
                color: '#F5A623',
                filter: 'drop-shadow(0 0 8px rgba(245,166,35,0.4))',
              }}
            >
              {SPARKLE}
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-[13px] text-[#F0F4FF] tracking-wide">
                AI Coach
              </p>
              <p className="text-[10px] font-display uppercase tracking-[0.12em]" style={{ color: '#00E5A0' }}>
                ● Live Insights
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150"
              style={{ color: '#4A5568' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#F0F4FF'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#4A5568'; e.currentTarget.style.background = 'transparent'; }}
              aria-label="Close AI Coach"
            >
              {CLOSE_ICON}
            </button>
          </div>

          {/* Insights list */}
          <div
            className="flex-1 overflow-y-auto p-3 space-y-2"
            key={key}
          >
            <p
              className="text-[11px] font-display uppercase tracking-[0.14em] px-1 mb-3"
              style={{ color: '#2A3350' }}
            >
              Based on your recent sessions
            </p>
            {insights.map((insight, i) => (
              <InsightCard key={`${key}-${insight.id}`} insight={insight} delay={i * 200} />
            ))}
          </div>

          {/* Footer */}
          <div
            className="shrink-0 px-4 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            <a
              href="/ai-coach"
              className="block w-full py-2 rounded-xl text-center text-[12px] font-display font-bold
                         uppercase tracking-[0.12em] transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(245,166,35,0.06) 100%)',
                border: '1px solid rgba(245,166,35,0.25)',
                color: '#F5A623',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,166,35,0.2) 0%, rgba(245,166,35,0.1) 100%)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,166,35,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(245,166,35,0.06) 100%)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Full AI Analysis →
            </a>
          </div>
        </div>
      )}
    </>
  );
}
