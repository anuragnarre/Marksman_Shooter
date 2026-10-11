'use client';

// PageTransition — Framer Motion fade+slide wrapper for page content.
// Wrap inner page content for smooth animated transitions.

import { motion, AnimatePresence, type Variants, type Transition } from 'framer-motion';
import { usePathname } from 'next/navigation';

const springIn: Transition = {
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

const fastOut: Transition = {
  duration: 0.2,
  ease: [0.4, 0, 1, 1] as [number, number, number, number],
};

const variants: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { ...springIn, staggerChildren: 0.07 },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: fastOut,
  },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants}
        style={{ willChange: 'opacity, transform, filter' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Staggered child variant — wrap individual cards/elements
export const staggerChild: Variants = {
  hidden:  { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};
