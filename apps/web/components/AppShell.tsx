// apps/web/components/AppShell.tsx
'use client';

// DESIGN NOTE: Authenticated shell — sidebar + glass topbar + bottom nav.
// Deep grid-bg with amber/blue ambient orbs for depth and atmosphere.
// Premium additions: CommandPalette (⌘K), AICoachPanel, PageTransition.

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';
import { useTheme } from '../contexts/theme-context';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { MobileMenu } from './MobileMenu';
import { SwipeNavigator } from './SwipeNavigator';
import { CommandPalette } from './CommandPalette';
import { AICoachPanel } from './AICoachPanel';
import { PageTransition } from './PageTransition';
import { OfflineBanner } from './OfflineBanner';
import { useIsMobile } from '../lib/use-mobile';
import { initStatusBar, hideSplashScreen } from '../lib/capacitor';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  isLive?: boolean;
}

const SIDEBAR_EXPANDED  = 244;
const SIDEBAR_COLLAPSED = 72;

export function AppShell({ children, title, isLive = false }: AppShellProps) {
  const { isLoggedIn, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const router    = useRouter();
  const isMobile  = useIsMobile();
  const [sidebarW, setSidebarW] = useState(SIDEBAR_EXPANDED);
  const [cmdOpen,  setCmdOpen]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace('/auth/login');
  }, [isLoading, isLoggedIn, router]);

  // Init native status bar style + hide splash screen on mount
  useEffect(() => {
    void initStatusBar();
    void hideSplashScreen();
  }, []);

  // Track sidebar width dynamically via ResizeObserver
  useEffect(() => {
    const aside = document.querySelector('aside[data-sidebar]');
    if (!aside) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w !== undefined) setSidebarW(Math.round(w));
    });
    observer.observe(aside);
    return () => observer.disconnect();
  }, []);

  // ⌘K / Ctrl+K shortcut
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCmdOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  if (isLoading) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Animated crosshair loader */}
          <div className="relative w-12 h-12">
            <div
              className="absolute inset-0 rounded-full border-2 border-t-[#F5A623] border-r-transparent
                         border-b-transparent border-l-transparent animate-spin"
            />
            <div
              className="absolute inset-2 rounded-full border border-t-transparent
                         border-r-[#4FC3F7] border-b-transparent border-l-transparent animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ color: '#F5A623', opacity: 0.8 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="6" cy="6" r="2.5" />
              </svg>
            </div>
          </div>
          <p className="text-text-muted text-[11px] font-display uppercase tracking-widest animate-pulse">
            Loading
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  // Mobile-first safe area: keep content clear of status bars/notches even when env() reports 0.
  const safeTopInset = isMobile ? 'max(env(safe-area-inset-top, 0px), 24px)' : 'env(safe-area-inset-top, 0px)';
  const topOffset = `calc(58px + ${safeTopInset})`;
  const bottomOffsetMobile = 'calc(84px + env(safe-area-inset-bottom, 0px))';

  return (
    <div className="min-h-screen grid-bg relative overflow-x-hidden">

      {/* ── Ambient background orbs (dark mode only) ─────────────────── */}
      {resolvedTheme === 'dark' && (
        <>
          <div
            className="fixed pointer-events-none no-print"
            style={{
              top: '-10%', left: '-5%',
              width: '50vw', height: '50vw',
              background: 'radial-gradient(circle, rgba(245,166,35,0.055) 0%, transparent 65%)',
              animation: 'orbFloat 18s ease-in-out infinite',
              zIndex: 0,
            }}
          />
          <div
            className="fixed pointer-events-none no-print"
            style={{
              bottom: '10%', right: '-10%',
              width: '40vw', height: '40vw',
              background: 'radial-gradient(circle, rgba(79,195,247,0.04) 0%, transparent 65%)',
              animation: 'orbFloat 22s ease-in-out infinite reverse',
              zIndex: 0,
            }}
          />
          <div
            className="fixed pointer-events-none no-print"
            style={{
              top: '40%', left: '30%',
              width: '30vw', height: '30vw',
              background: 'radial-gradient(circle, rgba(120,80,255,0.018) 0%, transparent 65%)',
              animation: 'orbFloat 28s ease-in-out 6s infinite',
              zIndex: 0,
            }}
          />
        </>
      )}

      <Sidebar onCommandPalette={() => setCmdOpen(true)} />
      <TopBar
        title={title}
        isLive={isLive}
        sidebarWidth={isMobile ? 0 : sidebarW}
        safeTopInset={safeTopInset}
        onCommandPalette={() => setCmdOpen(true)}
        onMenuToggle={() => setMenuOpen(true)}
      />

      {/* Main content */}
      <main
        className="relative z-10 min-h-screen transition-all duration-300 ease-spring overflow-x-hidden"
        style={{
          paddingTop:        topOffset,
          paddingLeft:       isMobile ? 0 : sidebarW,
          paddingBottom:     isMobile ? bottomOffsetMobile : 0,
          overscrollBehavior: 'contain',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 lg:py-8">
          <SwipeNavigator>
            <PageTransition>
              {children}
            </PageTransition>
          </SwipeNavigator>
        </div>
      </main>

      <BottomNav onMorePress={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* AI Coach Panel — bottom-right, above BottomNav on mobile */}
      <AICoachPanel />

      {/* Offline/network banner — slides in from top */}
      <OfflineBanner />
    </div>
  );
}
