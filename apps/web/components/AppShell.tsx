// apps/web/components/AppShell.tsx
'use client';

// DESIGN NOTE: Authenticated shell — sidebar + glass topbar + bottom nav.
// Deep grid-bg with amber/blue ambient orbs for depth and atmosphere.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { useIsMobile } from '../lib/use-mobile';

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  isLive?: boolean;
}

const SIDEBAR_EXPANDED  = 244;
const SIDEBAR_COLLAPSED = 72;

export function AppShell({ children, title, isLive = false }: AppShellProps) {
  const { isLoggedIn, isLoading } = useAuth();
  const router    = useRouter();
  const isMobile  = useIsMobile();
  const [sidebarW, setSidebarW] = useState(SIDEBAR_EXPANDED);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace('/auth/login');
  }, [isLoading, isLoggedIn, router]);

  // Track sidebar width dynamically via ResizeObserver
  useEffect(() => {
    const aside = document.querySelector('aside');
    if (!aside) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w !== undefined) setSidebarW(Math.round(w));
    });
    observer.observe(aside);
    return () => observer.disconnect();
  }, []);

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
          <p className="text-[#4A5568] text-[11px] font-display uppercase tracking-widest animate-pulse">
            Loading
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen grid-bg relative overflow-x-hidden">

      {/* ── Ambient background orbs ────────────────────────────────────── */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: '-10%', left: '-5%',
          width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, rgba(245,166,35,0.04) 0%, transparent 65%)',
          animation: 'orbFloat 18s ease-in-out infinite',
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: '10%', right: '-10%',
          width: '40vw', height: '40vw',
          background: 'radial-gradient(circle, rgba(79,195,247,0.035) 0%, transparent 65%)',
          animation: 'orbFloat 22s ease-in-out infinite reverse',
          zIndex: 0,
        }}
      />

      <Sidebar />
      <TopBar title={title} isLive={isLive} sidebarWidth={isMobile ? 0 : sidebarW} />

      {/* Main content */}
      <main
        className="relative z-10 min-h-screen transition-all duration-300 ease-spring"
        style={{
          paddingTop:    '58px',
          paddingLeft:   isMobile ? 0 : sidebarW,
          paddingBottom: isMobile ? 84 : 0,
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
