// apps/web/components/BottomNav.tsx
'use client';

// DESIGN NOTE: Minimal 4+1 mobile bottom bar (Home, Sessions, [+New], Stats, More).
// "More" delegates to the parent's MobileMenu for a single consolidated drawer.
// Follows modern mobile patterns: max 5 items, prominent center FAB, clean icons.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';

interface BottomNavProps {
  onMorePress?: () => void;
}

export function BottomNav({ onMorePress }: BottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isHome     = pathname === '/dashboard';
  const isSessions = pathname.startsWith('/sessions') && !pathname.startsWith('/sessions/compare');
  const isStats    = pathname.startsWith('/performance');
  const isNew      = pathname === '/sessions/new';

  return (
    <nav
      data-bottomnav
      className="lg:hidden fixed bottom-0 inset-x-0 z-sidebar"
      style={{
        height: 'calc(68px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.4)',
      }}
      aria-label="Mobile navigation"
    >
      {/* Top gradient border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(245,166,35,0.35) 35%, rgba(79,195,247,0.25) 65%, transparent 95%)',
        }}
      />

      <div className="flex items-center justify-around w-full h-[68px] px-1">

        {/* Home */}
        <NavItem
          href="/dashboard"
          label="Home"
          active={isHome}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              {isHome ? (
                <>
                  <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z" fill="currentColor" opacity="0.15" stroke="currentColor" />
                  <path d="M9 21v-8h6v8" stroke="currentColor" />
                </>
              ) : (
                <>
                  <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-9.5z" stroke="currentColor" />
                  <path d="M9 21v-8h6v8" stroke="currentColor" />
                </>
              )}
            </svg>
          }
        />

        {/* Sessions */}
        <NavItem
          href="/sessions"
          label="Sessions"
          active={isSessions && !isNew}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
              {(isSessions && !isNew) ? (
                <>
                  <circle cx="12" cy="12" r="9.5" stroke="currentColor" />
                  <circle cx="12" cy="12" r="6" stroke="currentColor" opacity="0.7" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="9.5" stroke="currentColor" />
                  <circle cx="12" cy="12" r="6" stroke="currentColor" />
                  <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" opacity="0.7" />
                </>
              )}
            </svg>
          }
        />

        {/* Center FAB: New Session */}
        <Link
          href="/sessions/new"
          className="relative flex items-center justify-center -mt-5"
          aria-label="New Session"
        >
          {/* Pulse ring */}
          <div
            className="absolute w-[56px] h-[56px] rounded-2xl"
            style={{
              border: '1px solid rgba(245,166,35,0.35)',
              animation: 'radarPing 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          <span
            className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center
                       active:scale-90 transition-transform duration-150 relative"
            style={{
              background: 'linear-gradient(135deg, #F5A623 0%, #E8961A 100%)',
              boxShadow: '0 0 24px rgba(245,166,35,0.45), 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#060810" strokeWidth="2.8" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
        </Link>

        {/* Stats */}
        <NavItem
          href="/performance"
          label="Stats"
          active={isStats}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              {isStats ? (
                <>
                  <path d="M3 18L8 11l4 3 5-7 4 3" stroke="currentColor" />
                  <path d="M3 18L8 11l4 3 5-7 4 3V21H3z" fill="currentColor" opacity="0.1" stroke="none" />
                  <line x1="3" y1="21" x2="21" y2="21" stroke="currentColor" />
                </>
              ) : (
                <>
                  <polyline points="3,18 8,11 12,14 17,7 21,10" stroke="currentColor" />
                  <line x1="3" y1="21" x2="21" y2="21" stroke="currentColor" />
                </>
              )}
            </svg>
          }
        />

        {/* More — opens MobileMenu */}
        <button
          onClick={onMorePress}
          className="flex flex-col items-center justify-center gap-1.5 min-w-[56px] h-full
                     transition-all duration-200 active:scale-90"
          aria-label="Open menu"
        >
          <span style={{ color: 'var(--text-muted)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="16" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </span>
          <span
            className="text-[10px] font-display font-bold uppercase tracking-wider leading-none"
            style={{ color: 'var(--text-muted)' }}
          >
            More
          </span>
        </button>
      </div>
    </nav>
  );
}

// ── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ href, label, icon, active }: {
  href: string; label: string; icon: React.ReactNode; active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1.5 min-w-[56px] h-full
                 transition-all duration-200 active:scale-90 relative"
      aria-current={active ? 'page' : undefined}
    >
      {/* Active indicator dot */}
      {active && (
        <span
          className="absolute top-2 w-1 h-1 rounded-full"
          style={{
            background: '#F5A623',
            boxShadow: '0 0 6px rgba(245,166,35,0.8)',
          }}
        />
      )}

      <span
        className="transition-all duration-200"
        style={{
          color: active ? '#F5A623' : 'var(--text-muted)',
          filter: active ? 'drop-shadow(0 0 5px rgba(245,166,35,0.4))' : 'none',
          transform: active ? 'translateY(-1px)' : 'none',
        }}
      >
        {icon}
      </span>
      <span
        className="text-[10px] font-display font-bold uppercase tracking-wider leading-none"
        style={{ color: active ? '#F5A623' : 'var(--text-muted)' }}
      >
        {label}
      </span>
    </Link>
  );
}
