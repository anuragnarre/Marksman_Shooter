// apps/web/components/TopBar.tsx
'use client';

// DESIGN NOTE: 2026 glass topbar with animated gradient border-bottom,
// gradient page title, live indicator and role-coloured avatar ring.

import { useAuth } from '../contexts/auth-context';
import { LiveIndicator } from './ui/LiveIndicator';

interface TopBarProps {
  title: string;
  isLive?: boolean;
  sidebarWidth?: number;
}

const ROLE_COLOR: Record<string, string> = {
  SHOOTER: '#F5A623',
  COACH:   '#4FC3F7',
  SOLDIER: '#00E5A0',
};

export function TopBar({ title, isLive = false, sidebarWidth = 244 }: TopBarProps) {
  const { user } = useAuth();
  const roleColor = user?.role ? (ROLE_COLOR[user.role] ?? '#F5A623') : '#F5A623';

  return (
    <header
      className="fixed top-0 right-0 z-topbar h-[58px] flex items-center px-5
                 transition-all duration-300 ease-spring"
      style={{
        left: sidebarWidth,
        background: 'rgba(6, 8, 16, 0.82)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '0 1px 0 rgba(245,166,35,0.07), 0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Animated bottom gradient border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.5) 30%, rgba(79,195,247,0.3) 60%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 6s linear infinite',
        }}
      />

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
      <div className="flex items-center gap-3 shrink-0">

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
