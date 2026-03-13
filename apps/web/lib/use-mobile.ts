// apps/web/lib/use-mobile.ts
// Returns true when viewport is narrower than the lg breakpoint (1024px).
// Defaults to false (desktop) on the server to avoid SSR mismatch.

import { useEffect, useState } from 'react';

export function useIsMobile(breakpoint = 1024): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
