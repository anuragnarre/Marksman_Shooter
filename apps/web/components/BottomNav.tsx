// apps/web/components/BottomNav.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';

interface NavEntry {
  href: string;
  label: string;
  icon: React.ReactNode;
  center?: boolean;
  roles?: string[];
}

// Items shown in the bottom bar (max 4 + center)
const BAR_ITEMS: NavEntry[] = [
  { href: '/dashboard',    label: 'Home',     icon: <HomeIcon />,    roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/sessions',     label: 'Sessions', icon: <TargetIcon />,  roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/sessions/new', label: 'New',      icon: null, center: true, roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/ai-coach',     label: 'AI Coach', icon: <SparkleIcon />, roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/analytics',    label: 'Stats',    icon: <ChartIcon />,   roles: ['SHOOTER','COACH','SOLDIER'] },
];

// All sidebar items — shown in the "More" drawer
const ALL_ITEMS: NavEntry[] = [
  { href: '/dashboard',                 label: 'Dashboard',      icon: <GridIcon />,     roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/sessions',                  label: 'Sessions',       icon: <TargetIcon />,   roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/sessions/new',              label: 'New Session',    icon: <PlusSmIcon />,   roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/analytics',                 label: 'Analytics',      icon: <ChartIcon />,    roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/performance',               label: 'Performance',    icon: <PulseIcon />,    roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/performance/training-plan', label: 'Training Plan',  icon: <PlanIcon />,     roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/performance/pose',          label: 'Stance',         icon: <PoseIcon />,     roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/connect',                   label: 'Connect',        icon: <LinkIcon />,     roles: ['SHOOTER'] },
  { href: '/ai-coach',                  label: 'AI Coach',       icon: <SparkleIcon />,  roles: ['SHOOTER','COACH','SOLDIER'] },
  { href: '/calendar',                  label: 'Schedule',       icon: <CalendarIcon />, roles: ['SHOOTER','SOLDIER'] },
  { href: '/calendar',                  label: 'Calendar',       icon: <CalendarIcon />, roles: ['COACH'] },
  { href: '/soldier/weapons',           label: 'Weapons',        icon: <WeaponIcon />,   roles: ['SOLDIER'] },
  { href: '/soldier/analytics',         label: 'Field Analytics',icon: <FieldIcon />,    roles: ['SOLDIER'] },
  { href: '/coach/shooters',            label: 'Shooters',       icon: <PeopleIcon />,   roles: ['COACH'] },
  { href: '/docs',                      label: 'Docs',           icon: <DocsIcon /> },
];

const ROLE_COLOR: Record<string, { color: string; bg: string; label: string }> = {
  SHOOTER: { color: '#F5A623', bg: 'rgba(245,166,35,0.15)', label: 'Shooter' },
  COACH:   { color: '#4FC3F7', bg: 'rgba(79,195,247,0.12)', label: 'Coach' },
  SOLDIER: { color: '#00E5A0', bg: 'rgba(0,229,160,0.12)',  label: 'Soldier' },
};

export function BottomNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  if (!user) return null;

  const role = user.role;
  const roleStyle = ROLE_COLOR[role] ?? ROLE_COLOR.SHOOTER;

  const barFiltered = BAR_ITEMS.filter(
    (i) => !i.roles || i.roles.includes(role),
  );
  const allFiltered = ALL_ITEMS.filter(
    (i) => !i.roles || i.roles.includes(role),
  );

  const barLeft   = barFiltered.filter((i) => !i.center).slice(0, 2);
  const barRight  = barFiltered.filter((i) => !i.center).slice(2, 4);
  const centerBtn = barFiltered.find((i) => i.center);

  function handleLogout() {
    logout();
    router.push('/auth/login');
  }

  return (
    <>
      {/* ── Bottom Bar ───────────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-sidebar"
        style={{
          height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'rgba(6, 8, 16, 0.92)',
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
          {barLeft.map((item) => (
            <NavItem
              key={item.href + item.label}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)}
            />
          ))}

          {/* Center primary action */}
          {centerBtn ? (
            <Link
              href={centerBtn.href}
              className="flex flex-col items-center justify-center mb-1 relative"
              aria-label="New Session"
            >
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
          {barRight.map((item) => (
            <NavItem
              key={item.href + item.label}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname.startsWith(item.href)}
            />
          ))}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-end gap-1 min-w-[52px] h-full pt-2
                       pb-1 transition-all duration-200 active:scale-90"
            aria-label="More navigation options"
          >
            <span className="transition-all duration-200" style={{ color: drawerOpen ? '#F5A623' : '#4A5568' }}>
              <MoreIcon />
            </span>
            <span
              className="text-[10px] font-display font-bold uppercase tracking-wide leading-none"
              style={{ color: drawerOpen ? '#F5A623' : '#4A5568' }}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu Panel ─────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div
        className="lg:hidden fixed right-0 top-0 bottom-0 z-50 overflow-hidden w-[min(92vw,380px)] flex flex-col"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'linear-gradient(180deg, rgba(12,15,23,0.99) 0%, rgba(7,9,14,0.99) 100%)',
          backdropFilter: 'blur(32px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-12px 0 56px rgba(0,0,0,0.72)',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(105%)',
          transition: 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        aria-hidden={!drawerOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div>
            <p className="font-display font-black text-sm tracking-[0.15em] uppercase"
              style={{
                background: 'linear-gradient(135deg, #F5A623, #FFD580)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              MARKSMAN
            </p>
            <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: '#4A5568' }}>
              All Features
            </p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4A5568]
                       hover:text-[#F0F4FF] transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-sm shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${roleStyle.bg}, rgba(255,255,255,0.03))`,
                  border: `1.5px solid ${roleStyle.color}50`,
                  color: roleStyle.color,
                  boxShadow: `0 0 12px ${roleStyle.color}30`,
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[#F0F4FF] text-sm font-semibold leading-tight">{user.name}</p>
                <p className="text-[10px] font-display font-bold uppercase tracking-widest mt-0.5"
                  style={{ color: roleStyle.color }}>
                  {roleStyle.label}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* All nav items */}
        <div className="overflow-y-auto px-3 py-3 flex-1 min-h-0">
          <div className="space-y-1.5">
            {allFiltered.map((item) => {
              const active = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3.5 rounded-xl transition-all duration-150
                             active:scale-95 min-h-[50px]"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(245,166,35,0.06))'
                      : 'rgba(255,255,255,0.03)',
                    border: active
                      ? '1px solid rgba(245,166,35,0.2)'
                      : '1px solid rgba(255,255,255,0.04)',
                    color: active ? '#F5A623' : '#8892A4',
                  }}
                >
                  <span className="shrink-0" style={{
                    filter: active ? 'drop-shadow(0 0 6px rgba(245,166,35,0.5))' : 'none',
                  }}>
                    {item.icon}
                  </span>
                  <span className="font-display font-semibold text-[13px] tracking-wide leading-tight">
                    {item.label}
                  </span>
                  {active && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: '#F5A623', boxShadow: '0 0 6px rgba(245,166,35,0.8)' }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3.5 mt-3 rounded-xl min-h-[50px]
                       text-[#4A5568] hover:text-[#FF4D6D] transition-all duration-150 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <SignOutIcon />
            <span className="font-display font-semibold text-[13px] tracking-wide">Sign Out</span>
          </button>

          <div className="h-6" />
        </div>
      </div>
    </>
  );
}

// ── Nav Bar Item ──────────────────────────────────────────────────────────────

function NavItem({ href, label, icon, active }: {
  href: string; label: string; icon: React.ReactNode; active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-end gap-1 min-w-[52px] h-full pt-2
                 pb-1 transition-all duration-200 active:scale-90 relative"
      aria-current={active ? 'page' : undefined}
    >
      <span
        className="absolute top-1.5 left-1/2 w-1 h-1 rounded-full transition-all duration-300"
        style={{
          background: active ? '#F5A623' : 'transparent',
          boxShadow: active ? '0 0 6px rgba(245,166,35,0.8)' : 'none',
          transform: `translateX(-50%) scale(${active ? 1 : 0})`,
        }}
      />
      <span className="transition-all duration-200" style={{
        color: active ? '#F5A623' : '#4A5568',
        filter: active ? 'drop-shadow(0 0 6px rgba(245,166,35,0.5))' : 'none',
        transform: active ? 'translateY(-1px)' : 'none',
      }}>
        {icon}
      </span>
      <span
        className="text-[10px] font-display font-bold uppercase tracking-wide leading-none"
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
function PlusSmIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="9" y1="3" x2="9" y2="15" />
      <line x1="3" y1="9" x2="15" y2="9" />
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
function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,9 4,9 6,3 8,15 10,7 12,11 14,9 17,9" />
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
function PlanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="3" y="2" width="12" height="14" rx="2" />
      <line x1="6" y1="6"  x2="12" y2="6"  />
      <line x1="6" y1="9"  x2="12" y2="9"  />
      <line x1="6" y1="12" x2="9"  y2="12" />
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
function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 10.5a3.5 3.5 0 0 0 5 0l2-2a3.536 3.536 0 0 0-5-5l-1 1" />
      <path d="M10.5 7.5a3.5 3.5 0 0 0-5 0l-2 2a3.536 3.536 0 0 0 5 5l1-1" />
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
function FieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M1 14l4-8 4 5 3-4 5 7" />
      <circle cx="14" cy="4" r="2" />
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
function MoreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="5"  cy="11" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="11" cy="11" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="11" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="2" y1="2" x2="12" y2="12" />
      <line x1="12" y1="2" x2="2" y2="12" />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M6 9h8M11 5l4 4-4 4" />
      <path d="M6 2H4a1 1 0 00-1 1v12a1 1 0 001 1h2" />
    </svg>
  );
}
