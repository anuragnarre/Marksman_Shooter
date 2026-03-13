// apps/web/components/BottomNav.tsx
'use client';

// DESIGN NOTE: 2026 glass bottom nav. Deep blur backdrop, glowing amber
// center action button with pulse ring, role-colored active dots.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  const items = [
    { href: '/dashboard',       label: 'Home',        icon: <HomeIcon />,        roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
    { href: '/sessions',        label: 'Sessions',    icon: <TargetIcon />,      roles: ['SHOOTER', 'SOLDIER'] },
    { href: '/sessions/new',    label: 'New',         icon: null, center: true,  roles: ['SHOOTER', 'SOLDIER'] },
    { href: '/performance',     label: 'Performance', icon: <PulseIcon />,       roles: ['SHOOTER', 'SOLDIER'] },
    { href: '/ai-coach',        label: 'AI Coach',    icon: <SparkleIcon />,     roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
    { href: '/analytics',       label: 'Stats',       icon: <ChartIcon />,       roles: ['SHOOTER', 'SOLDIER'] },
    { href: '/calendar',        label: 'Calendar',    icon: <CalendarIcon />,    roles: ['COACH', 'SHOOTER', 'SOLDIER'] },
    { href: '/coach/shooters',  label: 'Shooters',    icon: <PeopleIcon />,      roles: ['COACH'] },
    { href: '/connect',         label: 'Connect',     icon: <LinkIcon />,        roles: ['SHOOTER'] },
  ] as const;

  type NavEntry = { href: string; label: string; icon: React.ReactNode; center?: boolean; roles: readonly string[] };
  const filtered = ([...items] as NavEntry[])
    .filter((item) => item.roles.includes(role));

  const left   = filtered.filter((i) => !i.center).slice(0, 2);
  const right  = filtered.filter((i) => !i.center).slice(2, 4);
  const center = filtered.find((i) => i.center);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-sidebar"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(6, 8, 16, 0.88)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 -1px 0 rgba(245,166,35,0.06), 0 -8px 32px rgba(0,0,0,0.5)',
      }}
      aria-label="Mobile navigation"
    >
      {/* Gradient top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.4) 40%, rgba(79,195,247,0.3) 70%, transparent 100%)',
        }}
      />

      <div className="flex items-end justify-around w-full px-2 pb-1 h-16">

        {/* Left items */}
        {left.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)}
          />
        ))}

        {/* Center primary action */}
        {center ? (
          <Link
            href={center.href}
            className="flex flex-col items-center justify-center mb-1 relative"
            aria-label="New Session"
          >
            {/* Outer pulse ring */}
            <div
              className="absolute inset-0 m-auto w-14 h-14 rounded-2xl"
              style={{
                border: '1px solid rgba(245,166,35,0.4)',
                animation: 'radarPing 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
              }}
            />
            <span
              className="w-14 h-14 rounded-2xl flex items-center justify-center
                         active:scale-90 transition-transform duration-150 relative"
              style={{
                background: 'linear-gradient(135deg, #F5A623 0%, #E8961A 100%)',
                boxShadow: '0 0 24px rgba(245,166,35,0.5), 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              <PlusIcon />
            </span>
          </Link>
        ) : (
          <div className="w-14" />
        )}

        {/* Right items */}
        {right.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  href, label, icon, active,
}: {
  href: string; label: string;
  icon: React.ReactNode; active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-end gap-1 min-w-[52px] h-full pt-2
                 transition-all duration-200 active:scale-90 relative"
      aria-current={active ? 'page' : undefined}
    >
      {/* Active glow dot */}
      <span
        className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300"
        style={{
          background: active ? '#F5A623' : 'transparent',
          boxShadow: active ? '0 0 6px rgba(245,166,35,0.8)' : 'none',
          transform: `translateX(-50%) scale(${active ? 1 : 0})`,
        }}
      />

      <span
        className="transition-all duration-200"
        style={{
          color: active ? '#F5A623' : '#4A5568',
          filter: active ? 'drop-shadow(0 0 6px rgba(245,166,35,0.5))' : 'none',
          transform: active ? 'translateY(-1px)' : 'none',
        }}
      >
        {icon}
      </span>

      <span
        className="text-[10px] font-display font-bold uppercase tracking-wide leading-none pb-1
                   transition-all duration-200"
        style={{ color: active ? '#F5A623' : '#4A5568' }}
      >
        {label}
      </span>
    </Link>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L11 3l8 7.5V19a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5z" />
      <path d="M8 20v-8h6v8" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="9" />
      <circle cx="11" cy="11" r="5.5" />
      <circle cx="11" cy="11" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#060810" strokeWidth="2.8" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <polyline points="2,16 7,10 11,13 16,6 20,8" />
      <line x1="2" y1="19" x2="20" y2="19" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2v3M11 17v3M2 11h3M17 11h3M4.2 4.2l2.1 2.1M15.7 15.7l2.1 2.1M4.2 17.8l2.1-2.1M15.7 6.3l2.1-2.1" />
      <circle cx="11" cy="11" r="3.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="8" cy="7" r="3.5" />
      <path d="M2 19c0-3.3 2.7-6 6-6" />
      <circle cx="16" cy="7" r="2.5" />
      <path d="M16 13c2.8.3 5 2.5 5 5.5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 13a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5" />
      <path d="M13 9a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66L11.5 16" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,11 5,11 7,4 10,18 13,8 15,14 17,11 21,11" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="16" height="15" rx="2.5" />
      <line x1="3" y1="9" x2="19" y2="9" />
      <line x1="8" y1="2" x2="8"  y2="6" />
      <line x1="14" y1="2" x2="14" y2="6" />
      <rect x="7" y="12" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="12" y="12" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
