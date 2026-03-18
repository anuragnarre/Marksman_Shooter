'use client';

// ScrollReveal — lightweight IntersectionObserver-based reveal wrapper.
// Wrap any section to get a smooth fade+slide-up on scroll entry.
// Uses CSS transitions only — no Framer Motion dependency.

import { useEffect, useRef, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;      // ms
  threshold?: number;  // 0–1
  once?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  threshold = 0.12,
  once = true,
  direction = 'up',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const translate: Record<string, string> = {
      up:    'translateY(28px)',
      down:  'translateY(-28px)',
      left:  'translateX(-28px)',
      right: 'translateX(28px)',
    };

    // Initial hidden state
    el.style.opacity    = '0';
    el.style.transform  = translate[direction];
    el.style.filter     = 'blur(4px)';
    el.style.transition = `opacity 600ms ${delay}ms cubic-bezier(0.16,1,0.3,1), transform 600ms ${delay}ms cubic-bezier(0.16,1,0.3,1), filter 600ms ${delay}ms ease`;
    el.style.willChange = 'opacity, transform, filter';

    const show = () => {
      el.style.opacity   = '1';
      el.style.transform = 'translate(0)';
      el.style.filter    = 'blur(0)';
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          if (once) observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold, once, direction]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
