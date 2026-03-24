// apps/web/components/MobileMenu.tsx
'use client';

// Clean slide-in navigation drawer for mobile. Compact (280px), flat list, no section clutter.
// Swipe-left to dismiss.

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { useAuth } from '../contexts/auth-context';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',                label: 'Dashboard',     icon: <IconGrid /> },
  { href: '/sessions',                 label: 'Sessions',      icon: <IconTarget /> },
  { href: '/sessions/new',             label: 'New Session',   icon: <IconPlus /> },
  { href: '/performance',              label: 'Performance',   icon: <IconPulse /> },
  { href: '/performance/ai-coach',     label: 'AI Coach',      icon: <IconSparkle /> },
  { href: '/performance/ai-assistant', label: 'AI Assistant',  icon: <IconBrain /> },
  { href: '/performance/health',       label: 'Health',        icon: <IconHeart /> },
  { href: '/planning',                  label: 'Schedule',      icon: <IconCalendar /> },
  { href: '/planning/training-plan',   label: 'Training Plan', icon: <IconPlan /> },
  { href: '/sessions/compare',         label: 'Compare',       icon: <IconCompare /> },
  { href: '/docs',                     label: 'Docs & Guides', icon: <IconDocs /> },
  { href: '/connect',                  label: 'Connect',       icon: <IconLink /> },
  { href: '/settings',                 label: 'Settings',      icon: <IconSettings /> },
];

const ROLE_COLOR: Record<string, { text: string; bg: string }> = {
  SHOOTER: { text: '#F5A623', bg: 'rgba(245,166,35,0.12)' },
  COACH:   { text: '#4FC3F7', bg: 'rgba(79,195,247,0.12)' },
};

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();
  const dragX = useMotionValue(0);

  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleDragEnd = useCallback((_: unknown, info: { velocity: { x: number }; offset: { x: number } }) => {
    if (info.velocity.x < -200 || info.offset.x < -80) {
      onClose();
    } else {
      animate(dragX, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  }, [onClose, dragX]);

  function handleLogout() {
    logout();
    router.push('/auth/login');
    onClose();
  }

  if (!user) return null;

  const rs = ROLE_COLOR[user.role] ?? ROLE_COLOR.SHOOTER;

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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer panel */}
          <motion.div
            className="lg:hidden fixed left-0 top-0 bottom-0 z-[91] flex flex-col w-[280px]"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.7 }}
            drag="x"
            dragConstraints={{ left: -280, right: 0 }}
            dragElastic={0.08}
            onDragEnd={handleDragEnd}
            style={{
              x: dragX,
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              background: 'var(--glass-heavy-bg)',
              backdropFilter: 'blur(32px) saturate(180%)',
              borderRight: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-glass)',
            }}
          >
            {/* ── Header: logo + close ──────────────────────────── */}
            <div
              className="flex items-center justify-between px-4 h-14 shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2.5">
                <svg width="24" height="24" viewBox="0 0 64 64" fill="none"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(245,166,35,0.4))' }}>
                  <circle cx="32" cy="32" r="22" stroke="#F5A623" strokeWidth="1.5" opacity="0.45"/>
                  <circle cx="32" cy="32" r="12" stroke="#F5A623" strokeWidth="1.5" opacity="0.75"/>
                  <circle cx="32" cy="32" r="3.5" fill="#F5A623"/>
                  <line x1="32" y1="8" x2="32" y2="17" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="32" y1="47" x2="32" y2="56" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="8" y1="32" x2="17" y2="32" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="47" y1="32" x2="56" y2="32" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span
                  className="font-display font-black text-base tracking-[0.16em]"
                  style={{
                    background: 'linear-gradient(135deg, #F5A623 0%, #FFD580 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  MARKSMAN
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted
                           hover:text-text-primary transition-colors active:scale-90"
                style={{ background: 'var(--chip-bg)', border: '1px solid var(--border-subtle)' }}
                aria-label="Close menu"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
                </svg>
              </button>
            </div>

            {/* ── User info ─────────────────────────────────────── */}
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="relative shrink-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-base"
                  style={{
                    background: rs.bg,
                    border: `1.5px solid ${rs.text}40`,
                    color: rs.text,
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#00E5A0', border: '2px solid var(--bg-void)', boxShadow: '0 0 5px rgba(0,229,160,0.6)' }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-text-primary text-sm font-semibold truncate leading-tight">{user.name}</p>
                <p className="text-[10px] font-display font-bold uppercase tracking-[0.12em] mt-0.5"
                  style={{ color: rs.text }}>
                  {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                </p>
              </div>
            </div>

            {/* ── Nav list ─────────────────────────────────────── */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 min-h-0">
              {NAV_ITEMS.map((item, i) => {
                const isNew = item.href === '/sessions/new';
                const active = (() => {
                  if (item.href === '/dashboard') return pathname === '/dashboard';
                  return pathname === item.href || pathname.startsWith(item.href + '/');
                })();

                if (isNew) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5
                                 transition-all duration-150 active:scale-[0.98] min-h-[44px]"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(245,166,35,0.08) 100%)',
                        border: '1px solid rgba(245,166,35,0.25)',
                        color: '#F5A623',
                      }}
                    >
                      <span className="w-4 h-4 shrink-0 flex items-center justify-center">{item.icon}</span>
                      <span className="font-display font-semibold text-[13px] tracking-wide">{item.label}</span>
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href + i}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5
                               transition-all duration-150 active:scale-[0.98] min-h-[44px] relative"
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, rgba(245,166,35,0.1) 0%, rgba(245,166,35,0.04) 100%)'
                        : 'transparent',
                      border: active ? '1px solid rgba(245,166,35,0.18)' : '1px solid transparent',
                      color: active ? '#F5A623' : 'var(--text-secondary)',
                    }}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ background: '#F5A623', boxShadow: '0 0 8px rgba(245,166,35,0.5)' }}
                      />
                    )}
                    <span
                      className="w-4 h-4 shrink-0 flex items-center justify-center"
                      style={{ filter: active ? 'drop-shadow(0 0 4px rgba(245,166,35,0.4))' : 'none' }}
                    >
                      {item.icon}
                    </span>
                    <span className="font-display font-semibold text-[13px] tracking-wide">{item.label}</span>
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="my-2 h-px mx-1" style={{ background: 'var(--border-subtle)' }} />

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                           text-text-muted hover:text-[#FF4D6D] transition-colors duration-150
                           active:scale-[0.98] min-h-[44px]"
                style={{ border: '1px solid transparent' }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor"
                  strokeWidth="1.7" strokeLinecap="round" className="shrink-0">
                  <path d="M5.5 7.5h7M9.5 4l3 3.5-3 3.5" /><path d="M5 2H3a1 1 0 00-1 1v9a1 1 0 001 1h2" />
                </svg>
                <span className="font-display font-semibold text-[13px] tracking-wide">Sign Out</span>
              </button>
            </nav>

            {/* ── Footer ───────────────────────────────────────── */}
            <div
              className="px-4 py-2.5 shrink-0"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <p className="text-[9px] text-text-muted font-display text-center tracking-widest uppercase">
                Marksman v2.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="1" width="5" height="5" rx="1.2"/><rect x="9" y="1" width="5" height="5" rx="1.2"/>
    <rect x="1" y="9" width="5" height="5" rx="1.2"/><rect x="9" y="9" width="5" height="5" rx="1.2"/>
  </svg>);
}
function IconTarget() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7.5" cy="7.5" r="6"/><circle cx="7.5" cy="7.5" r="3.5"/>
    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none"/>
  </svg>);
}
function IconPlus() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="7.5" y1="2" x2="7.5" y2="13"/><line x1="2" y1="7.5" x2="13" y2="7.5"/>
  </svg>);
}
function IconPulse() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1,7.5 3.5,7.5 5,2.5 7,12 9,5.5 10.5,9 12,7.5 14,7.5"/>
  </svg>);
}
function IconSparkle() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M7.5 2v1.5M7.5 11.5V13M2 7.5h1.5M11.5 7.5H13M3.7 3.7l1 1M10.3 10.3l1 1M3.7 11.3l1-1M10.3 4.7l1-1"/>
    <circle cx="7.5" cy="7.5" r="2" fill="currentColor" stroke="none"/>
  </svg>);
}
function IconBrain() {
  return (<svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2a4 4 0 014 4c0 1.2-.6 2.3-1.5 3A4 4 0 0110 18a4 4 0 01-2.5-9A4 4 0 0110 2z"/>
    <line x1="10" y1="2" x2="10" y2="18"/>
  </svg>);
}
function IconHeart() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 13L2 7.5C1 6 1 4 2.5 3S5.5 2.5 7.5 4.5c2-2 4-1.5 5-0.5S14 6 13 7.5z"/>
    <polyline points="3,7.5 5.5,7.5 6.5,5.5 8.5,9.5 9.5,7.5 12,7.5"/>
  </svg>);
}
function IconCalendar() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="2.5" width="12" height="11" rx="1.5"/>
    <line x1="1.5" y1="6" x2="13.5" y2="6"/>
    <line x1="4.5" y1="1" x2="4.5" y2="4"/><line x1="10.5" y1="1" x2="10.5" y2="4"/>
  </svg>);
}
function IconPlan() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2.5" y="1.5" width="10" height="12" rx="1.5"/>
    <line x1="5" y1="5" x2="10" y2="5"/><line x1="5" y1="7.5" x2="10" y2="7.5"/><line x1="5" y1="10" x2="7.5" y2="10"/>
  </svg>);
}
function IconCompare() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7.5" y1="1" x2="7.5" y2="14" strokeDasharray="2 2"/>
    <rect x="1" y="3" width="5.5" height="9" rx="1.2"/>
    <rect x="8.5" y="3" width="5.5" height="9" rx="1.2"/>
  </svg>);
}
function IconDocs() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2.5" y="1.5" width="10" height="12" rx="1.5"/>
    <line x1="5" y1="5" x2="10" y2="5"/><line x1="5" y1="7.5" x2="10" y2="7.5"/><line x1="5" y1="10" x2="7.5" y2="10"/>
  </svg>);
}
function IconLink() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9.5a3 3 0 004.2 0l2-2a3 3 0 00-4.2-4.2l-.9.9"/>
    <path d="M9 5.5a3 3 0 00-4.2 0l-2 2a3 3 0 004.2 4.2l.9-.9"/>
  </svg>);
}
function IconSettings() {
  return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="7.5" r="2"/>
    <path d="M12.2 9.4a1 1 0 00.2 1.1l.04.04a1.2 1.2 0 11-1.7 1.7l-.04-.04a1 1 0 00-1.1-.2 1 1 0 00-.6.9v.1a1.2 1.2 0 11-2.4 0v-.05a1 1 0 00-.66-.92 1 1 0 00-1.1.2l-.04.04a1.2 1.2 0 11-1.7-1.7l.04-.04a1 1 0 00.2-1.1 1 1 0 00-.9-.6H2.9a1.2 1.2 0 110-2.4h.06a1 1 0 00.92-.66 1 1 0 00-.2-1.1l-.04-.04a1.2 1.2 0 111.7-1.7l.04.04a1 1 0 001.1.2h.04a1 1 0 00.6-.9V2.9a1.2 1.2 0 112.4 0v.06a1 1 0 00.6.92 1 1 0 001.1-.2l.04-.04a1.2 1.2 0 111.7 1.7l-.04.04a1 1 0 00-.2 1.1v.04a1 1 0 00.9.6h.1a1.2 1.2 0 110 2.4h-.05a1 1 0 00-.92.6z"/>
  </svg>);
}
