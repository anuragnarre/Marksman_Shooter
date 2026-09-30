// apps/web/components/SwipeNavigator.tsx
'use client';

// Swipe-based page navigation for mobile.
// Detects horizontal swipe gestures and navigates between main pages.
// Only activates on touch devices at mobile breakpoints.

import { useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';

// Ordered page routes for swipe navigation (role-filtered at runtime)
const SWIPE_PAGES: { href: string; roles?: string[] }[] = [
  { href: '/dashboard' },
  { href: '/sessions' },
  { href: '/planning' },
  { href: '/performance' },
];

const SWIPE_THRESHOLD = 80;   // px to trigger navigation
const VELOCITY_THRESHOLD = 0.4; // px/ms for quick swipes

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isHorizontal: boolean | null; // null = not yet determined
}

export function SwipeNavigator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const touchState = useRef<TouchState | null>(null);

  const pages = SWIPE_PAGES.filter(
    p => !p.roles || (user?.role && p.roles.includes(user.role)),
  );

  const currentIndex = pages.findIndex(p =>
    p.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(p.href),
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Ignore if starting from edge (browser back gesture zone)
    if (touch.clientX < 20 || touch.clientX > window.innerWidth - 20) return;

    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isHorizontal: null,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchState.current.startX;
    const dy = touch.clientY - touchState.current.startY;

    // Determine direction on first significant movement
    if (touchState.current.isHorizontal === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        touchState.current.isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.5;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState.current || !touchState.current.isHorizontal) {
      touchState.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchState.current.startX;
    const dt = Date.now() - touchState.current.startTime;
    const velocity = Math.abs(dx) / dt;

    const isSwipe = Math.abs(dx) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;

    if (isSwipe && currentIndex >= 0) {
      if (dx > 0 && currentIndex > 0) {
        // Swipe right → previous page
        router.push(pages[currentIndex - 1].href);
      } else if (dx < 0 && currentIndex < pages.length - 1) {
        // Swipe left → next page
        router.push(pages[currentIndex + 1].href);
      }
    }

    touchState.current = null;
  }, [currentIndex, pages, router]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-0"
    >
      {/* Page indicator dots — only show on mobile when on a swipeable page */}
      {currentIndex >= 0 && pages.length > 1 && (
        <div className="lg:hidden flex justify-center gap-1.5 pb-3 pt-1">
          {pages.map((p, i) => (
            <button
              key={p.href}
              onClick={() => router.push(p.href)}
              className="transition-all duration-300"
              style={{
                width: i === currentIndex ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === currentIndex
                  ? 'linear-gradient(90deg, #F5A623, #FFD580)'
                  : 'rgba(255,255,255,0.1)',
                boxShadow: i === currentIndex ? '0 0 8px rgba(245,166,35,0.4)' : 'none',
              }}
              aria-label={`Go to ${p.href.replace('/', '')}`}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
