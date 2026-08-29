'use client';

// CursorGlow — premium ambient cursor trail.
// A warm amber radial gradient that smoothly follows the cursor.
// Disabled on touch devices and in light mode. Kept deliberately subtle.

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/theme-context';

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -400, y: -400 });
  const cur = useRef({ x: -400, y: -400 });
  const raf = useRef<number>(0);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on pointer devices in dark mode
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (resolvedTheme === 'light') return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const LERP = 0.1;
    const tick = () => {
      cur.current.x += (pos.current.x - cur.current.x) * LERP;
      cur.current.y += (pos.current.y - cur.current.y) * LERP;
      if (glowRef.current) {
        glowRef.current.style.transform =
          `translate(${cur.current.x - 300}px, ${cur.current.y - 300}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [resolvedTheme]);

  if (!mounted || resolvedTheme === 'light') return null;

  return (
    <div
      ref={glowRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{
        width: 600,
        height: 600,
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(245,166,35,0.055) 0%, rgba(245,166,35,0.02) 40%, transparent 70%)',
        willChange: 'transform',
        mixBlendMode: 'screen',
      }}
      aria-hidden="true"
    />
  );
}
