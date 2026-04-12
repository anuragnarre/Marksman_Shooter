// apps/web/components/TopBar.tsx
'use client';

// DESIGN NOTE: 2026 glass topbar with animated gradient border-bottom,
// gradient page title, live indicator, expanded search bar on desktop, and role-coloured avatar ring.

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/auth-context';
import { useTheme } from '../contexts/theme-context';
import { LiveIndicator } from './ui/LiveIndicator';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { FeedbackModal } from './FeedbackModal';

const ADMIN_EMAIL = 'ashwin.hingave123@gmail.com';

interface TopBarProps {
  title: string;
  isLive?: boolean;
  sidebarWidth?: number;
  safeTopInset?: string;
  onCommandPalette?: () => void;
  onMenuToggle?: () => void;
}

const ROLE_COLOR: Record<string, string> = {
  SHOOTER: '#F5A623',
  COACH:   '#4FC3F7',
};

const SEARCH_ICON = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="6" cy="6" r="4.5" />
    <line x1="9.5" y1="9.5" x2="13" y2="13" />
  </svg>
);

const SUN_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MOON_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export function TopBar({
  title,
  isLive = false,
  sidebarWidth = 244,
  safeTopInset = 'env(safe-area-inset-top, 0px)',
  onCommandPalette,
  onMenuToggle,
}: TopBarProps) {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const roleColor = user?.role ? (ROLE_COLOR[user.role] ?? '#F5A623') : '#F5A623';

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [shareToast,   setShareToast]   = useState(false);

  async function handleShare() {
    const url   = window.location.href;
    const title = 'Marksman — Precision Shooting Analytics';
    const text  = 'Track every shot with millimetre precision. AI coaching after every session.';
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title, text, url }); return; } catch { /* cancelled */ return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    } catch { /* no clipboard access */ }
  }

  return (
    <>
    <header
      data-topbar
      className="fixed top-0 right-0 z-topbar flex items-center px-3 sm:px-5
                 transition-all duration-300 ease-spring"
      style={{
        left: sidebarWidth,
        height: `calc(58px + ${safeTopInset})`,
        paddingTop: `calc(${safeTopInset} + 8px)`,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-glass)',
      }}
    >
      {/* Color wash across the notch/status-bar safe area */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: `max(${safeTopInset}, 10px)`,
          background:
            'linear-gradient(90deg, rgba(245,166,35,0.20) 0%, rgba(79,195,247,0.16) 45%, rgba(0,229,160,0.12) 100%)',
        }}
      />

      {/* Animated bottom gradient border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.5) 30%, rgba(79,195,247,0.3) 60%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 6s linear infinite',
        }}
      />

      {/* ── Left: hamburger (mobile) + title ──────────────────────── */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        {/* Hamburger — mobile only */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl shrink-0
                       transition-all duration-200 active:scale-90"
            style={{
              background: 'var(--chip-bg)',
              border: '1px solid var(--glass-border)',
            }}
            aria-label="Open navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-text-secondary">
              <line x1="3" y1="5" x2="15" y2="5" />
              <line x1="3" y1="9" x2="12" y2="9" />
              <line x1="3" y1="13" x2="15" y2="13" />
            </svg>
          </button>
        )}

        {/* Page title */}
        <h1
          className="font-display font-black text-lg tracking-[0.12em] uppercase truncate"
          style={{
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {title}
        </h1>

        {/* Live indicator — desktop, next to title */}
        {isLive && (
          <div className="hidden lg:block">
            <LiveIndicator />
          </div>
        )}
      </div>

      {/* ── Center: expanded search bar — desktop only ────────────── */}
      {onCommandPalette && (
        <button
          onClick={onCommandPalette}
          className="hidden lg:flex flex-1 mx-6 max-w-sm items-center gap-3 px-4 py-2 rounded-xl
                     transition-all duration-200 text-left"
          style={{
            background: 'var(--chip-bg)',
            border: '1px solid var(--glass-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(245,166,35,0.06)';
            e.currentTarget.style.borderColor = 'rgba(245,166,35,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--chip-bg)';
            e.currentTarget.style.borderColor = 'var(--glass-border)';
          }}
          aria-label="Open command palette"
        >
          <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{SEARCH_ICON}</span>
          <span className="flex-1 text-[13px] font-body" style={{ color: 'var(--text-muted)' }}>
            Search pages, commands…
          </span>
          <kbd
            className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-display"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            ⌘K
          </kbd>
        </button>
      )}

      {/* Spacer when no search */}
      {!onCommandPalette && <div className="flex-1" />}

      {/* ── Right: search icon (tablet), live, separator, theme toggle, avatar ── */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">

        {/* Compact search — tablet (md, not lg) */}
        {onCommandPalette && (
          <button
            onClick={onCommandPalette}
            className="flex lg:hidden items-center justify-center w-9 h-9 rounded-xl
                       transition-all duration-200 active:scale-90"
            style={{
              background: 'var(--chip-bg)',
              border: '1px solid var(--glass-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(245,166,35,0.3)';
              e.currentTarget.style.background = 'rgba(245,166,35,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.background = 'var(--chip-bg)';
            }}
            aria-label="Search"
          >
            <span style={{ color: 'var(--text-muted)' }}>{SEARCH_ICON}</span>
          </button>
        )}

        {/* Sync status chip — visible when offline or queue has items */}
        <SyncStatusIndicator />

        {/* Admin feedback inbox — only for admin user */}
        {user?.email === ADMIN_EMAIL && (
          <Link
            href="/admin/feedback"
            className="flex items-center justify-center w-9 h-9 rounded-xl
                       transition-all duration-200 active:scale-90"
            style={{
              background: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.25)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,166,35,0.5)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.14)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,166,35,0.25)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(245,166,35,0.08)';
            }}
            aria-label="Feedback inbox"
            title="Feedback Inbox"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F5A623"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </Link>
        )}

        {/* Feedback button */}
        <button
          onClick={() => setFeedbackOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-xl
                     transition-all duration-200 active:scale-90"
          style={{
            background: 'var(--chip-bg)',
            border: '1px solid var(--glass-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(245,166,35,0.3)';
            e.currentTarget.style.background = 'rgba(245,166,35,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.background = 'var(--chip-bg)';
          }}
          aria-label="Give feedback"
          title="Feedback"
        >
          <span style={{ color: 'var(--text-muted)' }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor"
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 1H2a1 1 0 00-1 1v7a1 1 0 001 1h3l2.5 2.5L10 10h3a1 1 0 001-1V2a1 1 0 00-1-1z"/>
              <line x1="4.5" y1="4.5" x2="10.5" y2="4.5"/>
              <line x1="4.5" y1="7"   x2="7.5"   y2="7"/>
            </svg>
          </span>
        </button>

        {/* Live indicator — mobile */}
        {isLive && (
          <div className="lg:hidden mr-0.5">
            <LiveIndicator />
          </div>
        )}

        {/* Vertical separator */}
        <div
          className="w-px h-5 mx-1 shrink-0"
          style={{ background: 'var(--border-subtle)' }}
        />

        {/* Share button — desktop only, right side */}
        <div className="relative hidden sm:block">
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-9 h-9 rounded-xl
                       transition-all duration-200 active:scale-90"
            style={{
              background: 'var(--chip-bg)',
              border: '1px solid var(--glass-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(245,166,35,0.3)';
              e.currentTarget.style.background = 'rgba(245,166,35,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.background = 'var(--chip-bg)';
            }}
            aria-label="Share this page"
            title="Share"
          >
            <span style={{ color: 'var(--text-muted)' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor"
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="2.5" r="1.5"/>
                <circle cx="12" cy="12.5" r="1.5"/>
                <circle cx="3"  cy="7.5"  r="1.5"/>
                <line x1="4.4"  y1="6.8"  x2="10.6" y2="3.2"/>
                <line x1="4.4"  y1="8.2"  x2="10.6" y2="11.8"/>
              </svg>
            </span>
          </button>
          {shareToast && (
            <span
              className="absolute top-full mt-2 right-0 whitespace-nowrap
                         font-body text-[11px] px-3 py-1 rounded-lg pointer-events-none z-50"
              style={{
                background: 'var(--bg-overlay)',
                border: '1px solid rgba(0,229,160,0.3)',
                color: '#00E5A0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}
            >
              Link copied!
            </span>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex items-center justify-center w-9 h-9 rounded-xl
                     transition-all duration-200 active:scale-90"
          style={{
            background: 'var(--chip-bg)',
            border: '1px solid var(--glass-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(245,166,35,0.3)';
            e.currentTarget.style.background = 'rgba(245,166,35,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.background = 'var(--chip-bg)';
          }}
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="text-text-secondary">
            {resolvedTheme === 'dark' ? SUN_ICON : MOON_ICON}
          </span>
        </button>

        {/* User avatar */}
        {user && (
          <div
            className="flex items-center gap-2.5 pl-1.5 pr-1 py-1 rounded-xl cursor-default
                       transition-all duration-200"
            style={{
              background: `${roleColor}08`,
              border: `1px solid ${roleColor}20`,
            }}
            title={`${user.name} · ${user.role}`}
          >
            {/* Role label - hidden on mobile */}
            <span
              className="hidden sm:block text-[10px] font-display font-bold uppercase tracking-[0.12em] pl-0.5"
              style={{ color: roleColor, opacity: 0.85 }}
            >
              {user.role.toLowerCase()}
            </span>

            {/* Avatar with colored ring */}
            <div
              className="relative w-[30px] h-[30px] rounded-full flex items-center justify-center
                         font-display font-black text-[12px] select-none"
              style={{
                background: `linear-gradient(135deg, ${roleColor}20 0%, ${roleColor}0a 100%)`,
                border: `1.5px solid ${roleColor}60`,
                color: roleColor,
              }}
            >
              {user.name.charAt(0).toUpperCase()}

              {/* Online dot */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{
                  background: '#00E5A0',
                  border: '1.5px solid var(--bg-void)',
                  boxShadow: '0 0 5px rgba(0,229,160,0.6)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </header>

    <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
