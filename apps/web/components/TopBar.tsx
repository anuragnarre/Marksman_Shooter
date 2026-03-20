// apps/web/components/TopBar.tsx
'use client';

// DESIGN NOTE: 2026 glass topbar with animated gradient border-bottom,
// gradient page title, live indicator, ⌘K search trigger, and role-coloured avatar ring.

import { useAuth } from '../contexts/auth-context';
import { LiveIndicator } from './ui/LiveIndicator';

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
  SOLDIER: '#00E5A0',
};

const SEARCH_ICON = (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <circle cx="5.5" cy="5.5" r="4" />
    <line x1="8.5" y1="8.5" x2="12" y2="12" />
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
  const roleColor = user?.role ? (ROLE_COLOR[user.role] ?? '#F5A623') : '#F5A623';

  return (
    <header
      data-topbar
      className="fixed top-0 right-0 z-topbar relative overflow-hidden flex items-center px-4 sm:px-5
                 transition-all duration-300 ease-spring"
      style={{
        left: sidebarWidth,
        height: `calc(58px + ${safeTopInset})`,
        paddingTop: `calc(${safeTopInset} + 8px)`,
        background: 'rgba(6, 8, 16, 0.82)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '0 1px 0 rgba(245,166,35,0.07), 0 4px 24px rgba(0,0,0,0.4)',
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

      {/* Hamburger menu — mobile only */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl mr-2.5
                     transition-all duration-200 active:scale-90 shrink-0"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          aria-label="Open navigation menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#8892A4" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="5" x2="15" y2="5" />
            <line x1="3" y1="9" x2="12" y2="9" />
            <line x1="3" y1="13" x2="15" y2="13" />
          </svg>
        </button>
      )}

      {/* Page title */}
      <h1
        className="font-display font-black text-lg tracking-[0.12em] uppercase flex-1 truncate"
        style={{
          background: 'linear-gradient(135deg, #F0F4FF 0%, #8892A4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {title}
      </h1>

      {/* Right side actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">

        {/* ⌘K search trigger — hidden on mobile */}
        {onCommandPalette && (
          <button
            onClick={onCommandPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg
                       transition-all duration-200 group"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(245,166,35,0.06)';
              e.currentTarget.style.borderColor = 'rgba(245,166,35,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
            aria-label="Open command palette"
          >
            <span style={{ color: '#4A5568' }}>{SEARCH_ICON}</span>
            <span className="text-[11px] font-display" style={{ color: '#3A4458' }}>
              Search
            </span>
            <kbd
              className="px-1 py-0.5 rounded text-[9px] font-display ml-1"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#2A3350',
              }}
            >
              ⌘K
            </kbd>
          </button>
        )}

        {/* Live indicator */}
        {isLive && (
          <div className="mr-1">
            <LiveIndicator />
          </div>
        )}

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2.5">
            {/* Role label - hidden on mobile */}
            <span
              className="hidden sm:block text-[10px] font-display font-bold uppercase tracking-[0.12em]"
              style={{ color: roleColor, opacity: 0.8 }}
            >
              {user.role.toLowerCase()}
            </span>

            {/* Avatar with colored ring */}
            <div
              className="relative w-[34px] h-[34px] rounded-full flex items-center justify-center
                         font-display font-black text-[13px] cursor-default select-none
                         transition-all duration-200 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, rgba(6,8,16,0.9) 0%, rgba(19,24,38,0.8) 100%)`,
                border: `2px solid ${roleColor}50`,
                color: roleColor,
                boxShadow: `0 0 0 1px ${roleColor}20, 0 0 16px ${roleColor}25`,
              }}
              title={`${user.name} · ${user.role}`}
            >
              {user.name.charAt(0).toUpperCase()}

              {/* Online dot */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{
                  background: '#00E5A0',
                  border: '2px solid rgba(6,8,16,0.9)',
                  boxShadow: '0 0 6px rgba(0,229,160,0.6)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
