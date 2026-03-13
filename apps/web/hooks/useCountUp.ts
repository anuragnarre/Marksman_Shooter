// apps/web/hooks/useCountUp.ts
'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Uses ease-out-cubic for a satisfying deceleration effect.
 * Returns the current animated value as a number (not rounded —
 * let the caller decide precision with .toFixed()).
 */
export function useCountUp(
  target: number,
  duration: number = 1200,
): number {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset on target change
    startTimeRef.current = null;
    setCurrent(0);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: fast start, smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);

      setCurrent(eased * target);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(target);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return current;
}

/**
 * Same as useCountUp but rounds to nearest integer.
 */
export function useCountUpInt(target: number, duration?: number): number {
  const value = useCountUp(target, duration);
  return Math.round(value);
}
