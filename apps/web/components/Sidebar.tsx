// apps/web/components/Sidebar.tsx
'use client';

// DESIGN NOTE: 2026 glassmorphism sidebar. Deep glass with blur, amber neon
// active glow, scale+brightness hover, animated crosshair logo with pulse ring.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: ('SHOOTER' | 'COACH' | 'SOLDIER')[];
}

const ALL_NAV: NavItem[] = [
  { href: '/dashboard',               label: 'Dashboard',      icon: <GridIcon /> },
  { href: '/sessions',                label: 'Sessions',       icon: <TargetIcon />,    roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
  { href: '/sessions/new',            label: 'New Session',    icon: <PlusIcon />,      roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
  { href: '/analytics',               label: 'Analytics',      icon: <AnalyticsIcon />, roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
  { href: '/performance',             label: 'Performance',    icon: <PulseIcon />,     roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
  { href: '/performance/training-plan', label: 'Training Plan', icon: <PlanIcon />,     roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
  { href: '/performance/pose',        label: 'Stance',         icon: <PoseIcon />,      roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
  { href: '/connect',                 label: 'Connect',        icon: <LinkIcon />,      roles: ['SHOOTER'] },
  { href: '/ai-coach',                label: 'AI Coach',       icon: <SparkleIcon />,   roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
  { href: '/calendar',                label: 'Calendar',       icon: <CalendarIcon />,  roles: ['COACH'] },
  { href: '/calendar',                label: 'Schedule',       icon: <CalendarIcon />,  roles: ['SHOOTER', 'SOLDIER'] },
  { href: '/soldier/weapons',         label: 'Weapons',        icon: <WeaponIcon />,    roles: ['SOLDIER'] },
  { href: '/soldier/analytics',       label: 'Field Analytics',icon: <FieldIcon />,     roles: ['SOLDIER'] },
  { href: '/coach/shooters',          label: 'Shooters',       icon: <PeopleIcon />,    roles: ['COACH'] },
  { href: '/docs',                    label: 'Docs',           icon: <DocsIcon /> },
];

const ROLE_COLOR: Record<string, { color: string; bg: string; label: string }> = {
  SHOOTER: { color: '#F5A623', bg: 'rgba(245,166,35,0.15)', label: 'Shooter' },
  COACH:   { color: '#4FC3F7', bg: 'rgba(79,195,247,0.12)', label: 'Coach' },
  SOLDIER: { color: '#00E5A0', bg: 'rgba(0,229,160,0.12)',  label: 'Soldier' },
};

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [mounted,  setMounted]  = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      setExpanded(false);
    }
  }, []);

  if (!mounted) return null;

  const nav = ALL_NAV.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role)),
  );

  function handleLogout() {
    logout();
    router.push('/auth/login');
  }

  const W = expanded ? 244 : 72;
  const roleStyle = user?.role ? (ROLE_COLOR[user.role] ?? ROLE_COLOR.SHOOTER) : ROLE_COLOR.SHOOTER;

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-sidebar hidden lg:flex flex-col
                 border-r border-white/[0.05]
                 transition-all duration-300 ease-spring overflow-hidden"
      style={{
        width: W,
        background: 'linear-gradient(180deg, rgba(6,8,16,0.97) 0%, rgba(10,13,22,0.97) 100%)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.6), 1px 0 0 rgba(245,166,35,0.06)',
      }}
      aria-label="Main navigation"
    >
      {/* Ambient glow orb */}
      <div
        className="absolute top-0 left-0 w-48 h-48 pointer-events-none opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(245,166,35,0.15) 0%, transparent 70%)',
          transform: 'translate(-30%, -30%)',
          animation: 'orbFloat 14s ease-in-out infinite',
        }}
      />

      {/* ── Logo ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center h-[62px] shrink-0 relative"
        style={{
          padding: expanded ? '0 18px' : '0',
          justifyContent: expanded ? 'flex-start' : 'center',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <CrosshairLogo />
        {expanded && (
          <div className="ml-3 overflow-hidden">
            <span
              className="font-display font-black text-xl tracking-[0.18em] whitespace-nowrap block"
              style={{
                background: 'linear-gradient(135deg, #F5A623 0%, #FFD580 50%, #F5A623 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'shimmer 6s linear infinite',
              }}
            >
              MARKSMAN
            </span>
          </div>
        )}
      </div>

      {/* ── Nav items ───────────────────────────────────────────────────── */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden space-y-0.5 px-2" role="menubar">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              expanded={expanded}
            />
          );
        })}
      </nav>

      {/* ── User section ────────────────────────────────────────────────── */}
      <div
        className="shrink-0 p-3 space-y-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        {user && (
          <div
            className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-all duration-200
                        ${expanded ? '' : 'justify-center'}`}
            style={{ background: 'rgba(255,255,255,0.025)' }}
          >
            {/* Avatar with ring */}
            <div className="relative shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-display font-black text-sm"
                style={{
                  background: `linear-gradient(135deg, ${roleStyle.bg} 0%, rgba(255,255,255,0.03) 100%)`,
                  border: `1.5px solid ${roleStyle.color}50`,
                  color: roleStyle.color,
                  boxShadow: `0 0 12px ${roleStyle.color}30`,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              {/* Online dot */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{
                  background: '#00E5A0',
                  borderColor: 'rgba(6,8,16,0.97)',
                  boxShadow: '0 0 6px rgba(0,229,160,0.7)',
                }}
              />
            </div>

            {expanded && (
              <div className="flex-1 min-w-0">
                <p className="text-[#F0F4FF] text-[12px] font-semibold truncate leading-tight">
                  {user.name}
                </p>
                <p
                  className="text-[9px] font-display font-bold uppercase tracking-[0.12em] mt-0.5"
                  style={{ color: roleStyle.color }}
                >
                  {roleStyle.label}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Toggle + Logout row */}
        <div className={`flex gap-1.5 ${expanded ? 'flex-row' : 'flex-col'} items-center`}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                       text-[#4A5568] hover:text-[#F0F4FF]"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronIcon collapsed={!expanded} />
          </button>

          {expanded ? (
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg
                         text-[#4A5568] hover:text-[#FF4D6D] transition-all duration-200
                         text-[11px] font-display font-semibold uppercase tracking-wide"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,77,109,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <SignOutIcon />
              Sign out
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-8 h-8 rounded-lg
                         text-[#4A5568] hover:text-[#FF4D6D] transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,77,109,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              aria-label="Sign out"
            >
              <SignOutIcon />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// ── Sidebar Item ──────────────────────────────────────────────────────────────

function SidebarItem({
  href, label, icon, active, expanded,
}: {
  href: string; label: string; icon: React.ReactNode;
  active: boolean; expanded: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
      style={{
        background: active
          ? 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(245,166,35,0.06) 100%)'
          : 'transparent',
        border: active ? '1px solid rgba(245,166,35,0.2)' : '1px solid transparent',
        color: active ? '#F5A623' : '#8892A4',
        boxShadow: active
          ? '0 0 20px rgba(245,166,35,0.08), inset 0 1px 0 rgba(245,166,35,0.1)'
          : 'none',
        justifyContent: expanded ? 'flex-start' : 'center',
      }}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.color = '#F0F4FF';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#8892A4';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
      role="menuitem"
      aria-current={active ? 'page' : undefined}
    >
      {/* Active left glow bar */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
          style={{
            background: 'linear-gradient(to bottom, #F5A623, rgba(245,166,35,0.5))',
            boxShadow: '0 0 10px rgba(245,166,35,0.7), 0 0 20px rgba(245,166,35,0.4)',
          }}
        />
      )}

      {/* Icon */}
      <span
        className="shrink-0 w-5 h-5 flex items-center justify-center transition-all duration-200"
        style={{
          filter: active ? 'drop-shadow(0 0 6px rgba(245,166,35,0.5))' : 'none',
        }}
      >
        {icon}
      </span>

      {/* Label */}
      {expanded && (
        <span className="font-display font-semibold text-[13px] tracking-wide whitespace-nowrap overflow-hidden">
          {label}
        </span>
      )}

      {/* Collapsed tooltip */}
      {!expanded && (
        <span
          className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-display
                     font-semibold text-[#F0F4FF] whitespace-nowrap z-tooltip
                     opacity-0 pointer-events-none group-hover:opacity-100
                     transition-all duration-150 translate-x-1 group-hover:translate-x-0"
          style={{
            background: 'rgba(12,15,26,0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(245,166,35,0.2)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          {label}
        </span>
      )}
    </Link>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function CrosshairLogo() {
  return (
    <div className="relative shrink-0 w-9 h-9 flex items-center justify-center">
      {/* Pulse ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: '1px solid rgba(245,166,35,0.3)',
          animation: 'radarPing 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        }}
      />
      <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden="true"
        style={{ filter: 'drop-shadow(0 0 8px rgba(245,166,35,0.5))' }}>
        <circle cx="32" cy="32" r="27" stroke="#F5A623" strokeWidth="1.5" opacity="0.4"/>
        <circle cx="32" cy="32" r="19" stroke="#F5A623" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="32" cy="32" r="8"  stroke="#F5A623" strokeWidth="2"/>
        <circle cx="32" cy="32" r="3.5" fill="#F5A623"/>
        <line x1="32" y1="4"  x2="32" y2="21" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="32" y1="43" x2="32" y2="60" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="4"  y1="32" x2="21" y2="32" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="43" y1="32" x2="60" y2="32" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="11"  y="1.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="1.5" y="11"  width="5.5" height="5.5" rx="1.5" />
      <rect x="11"  y="11"  width="5.5" height="5.5" rx="1.5" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="9" r="7.5" />
      <circle cx="9" cy="9" r="4.5" />
      <circle cx="9" cy="9" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="9" y1="3" x2="9" y2="15" />
      <line x1="3" y1="9" x2="15" y2="9" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 10.5a3.5 3.5 0 0 0 5 0l2-2a3.536 3.536 0 0 0-5-5l-1 1" />
      <path d="M10.5 7.5a3.5 3.5 0 0 0-5 0l-2 2a3.536 3.536 0 0 0 5 5l1-1" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="6" cy="6" r="3" />
      <path d="M1 15c0-2.8 2.2-5 5-5" />
      <circle cx="13" cy="6" r="2.5" />
      <path d="M13 11c2.2.2 4 2 4 4.5" />
    </svg>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)' }}>
      <polyline points="9,3 5,7 9,11" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" />
      <circle cx="9" cy="9" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="3" y="2" width="12" height="14" rx="2" />
      <line x1="6" y1="6"  x2="12" y2="6"  />
      <line x1="6" y1="9"  x2="12" y2="9"  />
      <line x1="6" y1="12" x2="9"  y2="12" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M5 7h7M9 4l3 3-3 3" />
      <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2" />
    </svg>
  );
}

function WeaponIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10h10l2-3h2" />
      <path d="M2 10l1 3h3" />
      <circle cx="7" cy="14" r="1" fill="currentColor" stroke="none" />
      <path d="M12 7v-2h2v2" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,13 5,8 9,10 13,5 17,7" />
      <line x1="1" y1="16" x2="17" y2="16" />
    </svg>
  );
}

function FieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M1 14l4-8 4 5 3-4 5 7" />
      <circle cx="14" cy="4" r="2" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,9 4,9 6,3 8,15 10,7 12,11 14,9 17,9" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="3" y="2" width="12" height="14" rx="2" />
      <line x1="6" y1="6"  x2="12" y2="6"  />
      <line x1="6" y1="9"  x2="12" y2="9"  />
      <line x1="6" y1="12" x2="9"  y2="12" />
      <circle cx="13" cy="13" r="3" fill="rgba(0,0,0,0)" />
    </svg>
  );
}

function PoseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="3.5" r="1.5" />
      <line x1="9" y1="5" x2="9" y2="10" />
      <line x1="5" y1="7.5" x2="13" y2="7.5" />
      <line x1="9" y1="10" x2="6" y2="15" />
      <line x1="9" y1="10" x2="12" y2="15" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="14" height="13" rx="2" />
      <line x1="2" y1="7" x2="16" y2="7" />
      <line x1="6" y1="1" x2="6"  y2="5" />
      <line x1="12" y1="1" x2="12" y2="5" />
      <rect x="5" y="10" width="2.5" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="10" y="10" width="2.5" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
