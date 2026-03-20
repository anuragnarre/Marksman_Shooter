// apps/web/components/MobileMenu.tsx
'use client';

// Full-screen slide-from-left hamburger menu for mobile.
// Glassmorphism design with staggered item animation, role badge, and swipe-to-close.

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { useAuth } from '../contexts/auth-context';

interface NavEntry {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  section?: string;
}

const NAV_SECTIONS: { title: string; items: NavEntry[] }[] = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard',    label: 'Dashboard',  icon: <GridIcon /> },
      { href: '/sessions',     label: 'Sessions',   icon: <TargetIcon />,  roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
      { href: '/sessions/new', label: 'New Session', icon: <PlusIcon />,   roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/analytics',    label: 'Analytics',    icon: <ChartIcon />,   roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
      { href: '/performance',  label: 'Performance',  icon: <PulseIcon />,   roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
      { href: '/sessions/compare', label: 'Compare',  icon: <CompareIcon />, roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
    ],
  },
  {
    title: 'AI & Training',
    items: [
      { href: '/biometrics',   label: 'Biometrics',   icon: <HeartPulseIcon />, roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
      { href: '/ai-coach',     label: 'AI Coach',     icon: <SparkleIcon />, roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
      { href: '/ai-assistant', label: 'AI Assistant',  icon: <BrainIcon />,  roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
      { href: '/performance/training-plan', label: 'Training Plan', icon: <PlanIcon />, roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
      { href: '/performance/pose', label: 'Stance',    icon: <PoseIcon />,   roles: ['SHOOTER', 'COACH', 'SOLDIER'] },
    ],
  },
  {
    title: 'Schedule',
    items: [
      { href: '/calendar',     label: 'Calendar',   icon: <CalendarIcon />, roles: ['COACH'] },
      { href: '/calendar',     label: 'Schedule',   icon: <CalendarIcon />, roles: ['SHOOTER', 'SOLDIER'] },
      { href: '/goals',        label: 'Goals',      icon: <GoalIcon />,    roles: ['SHOOTER', 'SOLDIER'] },
    ],
  },
  {
    title: 'Team',
    items: [
      { href: '/connect',          label: 'Connect',        icon: <LinkIcon />,   roles: ['SHOOTER'] },
      { href: '/coach/shooters',   label: 'Shooters',       icon: <PeopleIcon />, roles: ['COACH'] },
      { href: '/soldier/weapons',  label: 'Weapons',        icon: <WeaponIcon />, roles: ['SOLDIER'] },
      { href: '/soldier/analytics',label: 'Field Analytics', icon: <FieldIcon />,  roles: ['SOLDIER'] },
    ],
  },
  {
    title: 'Resources',
    items: [
      { href: '/guidance', label: 'Guidance', icon: <GuidanceIcon /> },
      { href: '/docs',     label: 'Documentation', icon: <DocsIcon /> },
    ],
  },
];

const ROLE_STYLE: Record<string, { color: string; bg: string; label: string; gradient: string }> = {
  SHOOTER: { color: '#F5A623', bg: 'rgba(245,166,35,0.12)', label: 'Shooter', gradient: 'linear-gradient(135deg, #F5A623, #FFD580)' },
  COACH:   { color: '#4FC3F7', bg: 'rgba(79,195,247,0.12)',  label: 'Coach',   gradient: 'linear-gradient(135deg, #4FC3F7, #81D4FA)' },
  SOLDIER: { color: '#00E5A0', bg: 'rgba(0,229,160,0.12)',   label: 'Soldier', gradient: 'linear-gradient(135deg, #00E5A0, #69F0AE)' },
};

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const menuRef  = useRef<HTMLDivElement>(null);

  // Swipe-to-close gesture
  const dragX = useMotionValue(0);

  // Close on route change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onClose(); }, [pathname]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [open]);

  function handleLogout() {
    logout();
    router.push('/auth/login');
    onClose();
  }

  const handleDragEnd = useCallback((_: any, info: { velocity: { x: number }; offset: { x: number } }) => {
    if (info.velocity.x < -200 || info.offset.x < -120) {
      onClose();
    } else {
      animate(dragX, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  }, [onClose, dragX]);

  if (!user) return null;

  const role = user.role;
  const rs = ROLE_STYLE[role] ?? ROLE_STYLE.SHOOTER;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="lg:hidden fixed inset-0 z-[90]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          />

          {/* Menu panel — slides from left */}
          <motion.div
            ref={menuRef}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-[91] flex flex-col
                       overflow-hidden w-[min(85vw, 340px)]"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35, mass: 0.8 }}
            drag="x"
            dragConstraints={{ left: -340, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{
              x: dragX,
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              background: 'linear-gradient(180deg, rgba(8,10,16,0.98) 0%, rgba(12,15,26,0.98) 100%)',
              backdropFilter: 'blur(40px) saturate(200%)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '12px 0 56px rgba(0,0,0,0.7), 1px 0 0 rgba(245,166,35,0.08)',
            }}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none opacity-30"
                 style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />

            {/* ── Header ─────────────────────────────────────── */}
            <div className="relative px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Crosshair logo */}
                  <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 rounded-full"
                         style={{ border: '1px solid rgba(245,166,35,0.3)', animation: 'radarPing 3s cubic-bezier(0,0,0.2,1) infinite' }} />
                    <svg width="28" height="28" viewBox="0 0 64 64" fill="none"
                         style={{ filter: 'drop-shadow(0 0 6px rgba(245,166,35,0.4))' }}>
                      <circle cx="32" cy="32" r="20" stroke="#F5A623" strokeWidth="1.5" opacity="0.5"/>
                      <circle cx="32" cy="32" r="10" stroke="#F5A623" strokeWidth="1.5" opacity="0.8"/>
                      <circle cx="32" cy="32" r="3.5" fill="#F5A623"/>
                      <line x1="32" y1="8" x2="32" y2="18" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="32" y1="46" x2="32" y2="56" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="8" y1="32" x2="18" y2="32" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="46" y1="32" x2="56" y2="32" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="font-display font-black text-base tracking-[0.18em]"
                    style={{ background: 'linear-gradient(135deg, #F5A623 0%, #FFD580 50%, #F5A623 100%)',
                             WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    MARKSMAN
                  </span>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#4A5568]
                             hover:text-[#F0F4FF] transition-colors active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  aria-label="Close menu"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
                  </svg>
                </button>
              </div>

              {/* Drag handle indicator */}
              <div className="flex justify-center mt-3">
                <div className="w-8 h-1 rounded-full bg-white/[0.08]" />
              </div>
            </div>

            {/* ── User card ──────────────────────────────────── */}
            <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-lg shrink-0"
                    style={{ background: `linear-gradient(135deg, ${rs.bg}, rgba(255,255,255,0.03))`,
                             border: `1.5px solid ${rs.color}40`, color: rs.color,
                             boxShadow: `0 0 16px ${rs.color}25` }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                        style={{ background: '#00E5A0', border: '2px solid rgba(8,10,16,0.98)',
                                 boxShadow: '0 0 6px rgba(0,229,160,0.7)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#F0F4FF] text-sm font-semibold truncate">{user.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: rs.color }} />
                    <span className="text-[10px] font-display font-bold uppercase tracking-[0.12em]"
                          style={{ color: rs.color }}>{rs.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Navigation sections ────────────────────────── */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 min-h-0">
              {NAV_SECTIONS.map((section, si) => {
                const filteredItems = section.items.filter(
                  item => !item.roles || item.roles.includes(role),
                );
                if (filteredItems.length === 0) return null;

                return (
                  <motion.div
                    key={section.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: si * 0.06 + 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="text-[9px] font-display font-bold uppercase tracking-[0.2em] text-[#2A3350]
                                  px-3 pt-3 pb-1.5">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {filteredItems.map((item) => {
                        const allItems = NAV_SECTIONS.flatMap(s => s.items);
                        const active = (() => {
                          if (item.href === '/dashboard') return pathname === '/dashboard';
                          const exactOrChild = pathname === item.href || pathname.startsWith(item.href + '/');
                          if (exactOrChild) {
                            const moreSpecific = allItems.some(
                              other => other.href !== item.href && other.href.startsWith(item.href) && pathname.startsWith(other.href)
                            );
                            return !moreSpecific;
                          }
                          return false;
                        })();

                        return (
                          <Link
                            key={item.href + item.label}
                            href={item.href}
                            className="group flex items-center gap-3 px-3 py-3 rounded-xl
                                       transition-all duration-150 active:scale-[0.97] min-h-[48px] relative"
                            style={{
                              background: active
                                ? 'linear-gradient(135deg, rgba(245,166,35,0.12), rgba(245,166,35,0.05))'
                                : 'transparent',
                              border: active
                                ? '1px solid rgba(245,166,35,0.2)' : '1px solid transparent',
                              color: active ? '#F5A623' : '#8892A4',
                            }}
                          >
                            {active && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                    style={{ background: 'linear-gradient(to bottom, #F5A623, rgba(245,166,35,0.4))',
                                             boxShadow: '0 0 8px rgba(245,166,35,0.6)' }} />
                            )}
                            <span className="shrink-0 w-5 h-5 flex items-center justify-center"
                                  style={{ filter: active ? 'drop-shadow(0 0 4px rgba(245,166,35,0.5))' : 'none' }}>
                              {item.icon}
                            </span>
                            <span className="font-display font-semibold text-[13px] tracking-wide flex-1">{item.label}</span>
                            {active && (
                              <span className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ background: '#F5A623', boxShadow: '0 0 6px rgba(245,166,35,0.8)' }} />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}

              {/* Sign out */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.35 }}
              >
                <div className="my-2 h-px mx-3" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl min-h-[48px]
                             text-[#4A5568] hover:text-[#FF4D6D] transition-all duration-150 active:scale-[0.97]"
                >
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                      <path d="M6 9h8M11 5l4 4-4 4" /><path d="M6 2H4a1 1 0 00-1 1v12a1 1 0 001 1h2" />
                    </svg>
                  </span>
                  <span className="font-display font-semibold text-[13px] tracking-wide">Sign Out</span>
                </button>
              </motion.div>

              <div className="h-4" />
            </nav>

            {/* ── Footer version ──────────────────────────────── */}
            <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[9px] text-[#2A3350] font-display text-center tracking-wider">
                MARKSMAN v2.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Icons (compact versions for menu) ────────────────────────────────────────

function GridIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" /><rect x="11" y="1.5" width="5.5" height="5.5" rx="1.5" />
    <rect x="1.5" y="11" width="5.5" height="5.5" rx="1.5" /><rect x="11" y="11" width="5.5" height="5.5" rx="1.5" />
  </svg>);
}
function TargetIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="9" cy="9" r="7.5" /><circle cx="9" cy="9" r="4.5" /><circle cx="9" cy="9" r="2" fill="currentColor" stroke="none" />
  </svg>);
}
function PlusIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="9" y1="3" x2="9" y2="15" /><line x1="3" y1="9" x2="15" y2="9" />
  </svg>);
}
function ChartIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1,13 5,8 9,10 13,5 17,7" /><line x1="1" y1="16" x2="17" y2="16" />
  </svg>);
}
function PulseIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1,9 4,9 6,3 8,15 10,7 12,11 14,9 17,9" />
  </svg>);
}
function CompareIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="2" x2="9" y2="16" strokeDasharray="2 2" /><rect x="1.5" y="4" width="6" height="10" rx="1.5" /><rect x="10.5" y="4" width="6" height="10" rx="1.5" />
  </svg>);
}
function HeartPulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 15.5l-5.5-5.5C2 8.5 2 6 3.5 4.5S7.5 3 9 5c1.5-2 4-2 5.5-.5S16 8.5 14.5 10L9 15.5z" />
      <polyline points="4,9 7,9 8,7 10,11 11,9 14,9" />
    </svg>
  );
}

function SparkleIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M4.2 13.8l1.4-1.4M12.4 5.6l1.4-1.4" />
    <circle cx="9" cy="9" r="2.5" fill="currentColor" stroke="none" />
  </svg>);
}
function BrainIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 0 1 5 5c0 1.5-.7 2.9-1.8 3.8A5.002 5.002 0 0 1 12 22a5.002 5.002 0 0 1-3.2-11.2A5.002 5.002 0 0 1 12 2z" />
    <path d="M12 2v20" /><path d="M8.5 6.5C7 7.5 7 9.5 8 11" /><path d="M15.5 6.5c1.5 1 1.5 3 .5 4.5" />
  </svg>);
}
function PlanIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="3" y="2" width="12" height="14" rx="2" /><line x1="6" y1="6" x2="12" y2="6" /><line x1="6" y1="9" x2="12" y2="9" /><line x1="6" y1="12" x2="9" y2="12" />
  </svg>);
}
function PoseIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="3.5" r="1.5" /><line x1="9" y1="5" x2="9" y2="10" /><line x1="5" y1="7.5" x2="13" y2="7.5" />
    <line x1="9" y1="10" x2="6" y2="15" /><line x1="9" y1="10" x2="12" y2="15" />
  </svg>);
}
function CalendarIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="14" height="13" rx="2" /><line x1="2" y1="7" x2="16" y2="7" /><line x1="6" y1="1" x2="6" y2="5" /><line x1="12" y1="1" x2="12" y2="5" />
  </svg>);
}
function GoalIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="9" r="7" /><circle cx="9" cy="9" r="4" /><circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
  </svg>);
}
function LinkIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 10.5a3.5 3.5 0 0 0 5 0l2-2a3.536 3.536 0 0 0-5-5l-1 1" />
    <path d="M10.5 7.5a3.5 3.5 0 0 0-5 0l-2 2a3.536 3.536 0 0 0 5 5l1-1" />
  </svg>);
}
function PeopleIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="6" cy="6" r="3" /><path d="M1 15c0-2.8 2.2-5 5-5" /><circle cx="13" cy="6" r="2.5" /><path d="M13 11c2.2.2 4 2 4 4.5" />
  </svg>);
}
function WeaponIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 10h10l2-3h2" /><path d="M2 10l1 3h3" /><circle cx="7" cy="14" r="1" fill="currentColor" stroke="none" /><path d="M12 7v-2h2v2" />
  </svg>);
}
function FieldIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M1 14l4-8 4 5 3-4 5 7" /><circle cx="14" cy="4" r="2" />
  </svg>);
}
function GuidanceIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="9" r="7.5" /><path d="M6.5 7a2.5 2.5 0 015 0c0 1.5-1.5 2-2.5 3" />
    <circle cx="9" cy="13" r="0.8" fill="currentColor" stroke="none" />
  </svg>);
}
function DocsIcon() {
  return (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="3" y="2" width="12" height="14" rx="2" /><line x1="6" y1="6" x2="12" y2="6" /><line x1="6" y1="9" x2="12" y2="9" /><line x1="6" y1="12" x2="9" y2="12" />
  </svg>);
}
