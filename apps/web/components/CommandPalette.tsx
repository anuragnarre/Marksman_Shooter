'use client';

// CommandPalette — ⌘K / Ctrl+K global command palette.
// Linear/Vercel-style: glass overlay, fuzzy search, keyboard nav.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';

interface Command {
  id: string;
  label: string;
  description?: string;
  href?: string;
  action?: () => void;
  icon: React.ReactNode;
  category: string;
  keywords?: string[];
}

const NAV_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,7 7,3 11,7" />
    <line x1="7" y1="3" x2="7" y2="11" />
  </svg>
);
const TARGET_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="7" cy="7" r="5.5" />
    <circle cx="7" cy="7" r="3" />
    <circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
const PLUS_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="7" y1="2" x2="7" y2="12" />
    <line x1="2" y1="7" x2="12" y2="7" />
  </svg>
);
const CHART_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1,10 4,7 7,8 10,4 13,5" />
  </svg>
);
const AI_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 2v1M7 11v1M2 7h1M11 7h1M3.6 3.6l.7.7M9.7 9.7l.7.7M3.6 10.4l.7-.7M9.7 4.3l.7-.7" />
    <circle cx="7" cy="7" r="2" fill="currentColor" stroke="none" />
  </svg>
);
const GOAL_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="5.5" />
    <circle cx="7" cy="7" r="3" />
    <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const COMPARE_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="1.5" x2="7" y2="12.5" strokeDasharray="2 2" />
    <rect x="1" y="3.5" width="5" height="7" rx="1.2" />
    <rect x="8" y="3.5" width="5" height="7" rx="1.2" />
  </svg>
);
const LOGOUT_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <path d="M5 7h7M9 4l3 3-3 3" />
    <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2" />
  </svg>
);

const BASE_COMMANDS: Command[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: NAV_ICON, category: 'Navigate', keywords: ['home', 'overview'] },
  { id: 'sessions', label: 'Sessions', description: 'View all shooting sessions', href: '/sessions', icon: TARGET_ICON, category: 'Navigate' },
  { id: 'new-session', label: 'New Session', description: 'Start a new training session', href: '/sessions/new', icon: PLUS_ICON, category: 'Actions' },
  { id: 'analytics', label: 'Analytics', description: 'Performance analytics', href: '/analytics', icon: CHART_ICON, category: 'Navigate' },
  { id: 'ai-coach', label: 'AI Coach', description: 'Get AI-powered coaching insights', href: '/ai-coach', icon: AI_ICON, category: 'Navigate' },
  { id: 'goals', label: 'Goals', description: 'Track your shooting goals', href: '/goals', icon: GOAL_ICON, category: 'Navigate' },
  { id: 'compare', label: 'Compare Sessions', description: 'Side-by-side session analysis', href: '/sessions/compare', icon: COMPARE_ICON, category: 'Navigate' },
  { id: 'performance', label: 'Performance', href: '/performance', icon: CHART_ICON, category: 'Navigate' },
  { id: 'training-plan', label: 'Training Plan', description: 'AI-generated training program', href: '/performance/training-plan', icon: AI_ICON, category: 'Navigate' },
];

function fuzzy(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = [
    ...BASE_COMMANDS,
    {
      id: 'logout',
      label: 'Sign Out',
      description: 'Log out of your account',
      action: () => { logout(); router.push('/auth/login'); },
      icon: LOGOUT_ICON,
      category: 'Account',
    },
  ];

  const filtered = commands.filter((cmd) => {
    const searchable = [cmd.label, cmd.description ?? '', ...(cmd.keywords ?? [])].join(' ');
    return fuzzy(query, searchable);
  });

  const execute = useCallback((cmd: Command) => {
    onClose();
    setQuery('');
    if (cmd.href) router.push(cmd.href);
    else if (cmd.action) cmd.action();
  }, [onClose, router]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      }
      if (e.key === 'Enter' && filtered[selected]) {
        execute(filtered[selected]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, selected, execute, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const item = listRef.current?.children[selected] as HTMLElement;
    item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);

  if (!open) return null;

  // Group commands by category
  const categories = Array.from(new Set(filtered.map((c) => c.category)));

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(4,6,14,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          animation: 'fadeIn 150ms ease both',
        }}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[560px] mx-4 overflow-hidden"
        style={{
          background: 'rgba(10,13,24,0.97)',
          border: '1px solid rgba(245,166,35,0.2)',
          borderRadius: 16,
          boxShadow:
            '0 0 0 1px rgba(245,166,35,0.06), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(245,166,35,0.06)',
          animation: 'slideDownFade 200ms cubic-bezier(0.16,1,0.3,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 10%, rgba(245,166,35,0.7) 50%, transparent 90%)',
          }}
        />

        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div style={{ color: '#F5A623', opacity: 0.7, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="6.5" cy="6.5" r="4.5" />
              <line x1="10" y1="10" x2="14" y2="14" />
            </svg>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, pages, sessions…"
            className="flex-1 bg-transparent py-4 text-[14px] text-[#F0F4FF] outline-none placeholder:text-[#3A4458]"
            style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd
            className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-display"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#4A5568',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="overflow-y-auto"
          style={{ maxHeight: 360 }}
        >
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[#3A4458] text-sm font-display">No results for "{query}"</p>
            </div>
          ) : (
            categories.map((cat) => {
              const items = filtered.filter((c) => c.category === cat);
              const globalOffset = filtered.indexOf(items[0]);
              return (
                <div key={cat}>
                  <div
                    className="px-4 pt-3 pb-1"
                  >
                    <span
                      className="text-[10px] font-display font-bold uppercase tracking-[0.15em]"
                      style={{ color: '#3A4458' }}
                    >
                      {cat}
                    </span>
                  </div>
                  {items.map((cmd, localIdx) => {
                    const idx = globalOffset + localIdx;
                    const isSelected = selected === idx;
                    return (
                      <button
                        key={cmd.id}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-100"
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(245,166,35,0.1) 0%, rgba(245,166,35,0.05) 100%)'
                            : 'transparent',
                          borderLeft: isSelected
                            ? '2px solid rgba(245,166,35,0.6)'
                            : '2px solid transparent',
                        }}
                        onMouseEnter={() => setSelected(idx)}
                        onClick={() => execute(cmd)}
                      >
                        <span
                          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            background: isSelected
                              ? 'rgba(245,166,35,0.15)'
                              : 'rgba(255,255,255,0.04)',
                            color: isSelected ? '#F5A623' : '#4A5568',
                            transition: 'all 150ms',
                          }}
                        >
                          {cmd.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[13px] font-semibold"
                            style={{ color: isSelected ? '#F0F4FF' : '#8892A4' }}
                          >
                            {cmd.label}
                          </p>
                          {cmd.description && (
                            <p className="text-[11px] truncate" style={{ color: '#3A4458' }}>
                              {cmd.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <kbd
                            className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-display"
                            style={{
                              background: 'rgba(245,166,35,0.1)',
                              border: '1px solid rgba(245,166,35,0.2)',
                              color: '#F5A623',
                            }}
                          >
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-4 px-4 py-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          {[
            { keys: ['↑', '↓'], label: 'navigate' },
            { keys: ['↵'], label: 'open' },
            { keys: ['esc'], label: 'close' },
          ].map(({ keys, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-1.5 py-0.5 rounded text-[9px] font-display"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#3A4458',
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
              <span className="text-[10px] font-display" style={{ color: '#2A3350' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
