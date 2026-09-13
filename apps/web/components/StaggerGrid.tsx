'use client';

// StaggerGrid — Framer Motion staggered entry container.
// Wrap any grid of cards and children animate in with a cascade effect.

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { ReactNode } from 'react';

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
}

/** Wrap a grid container — all direct children animate in with stagger. */
export function StaggerGrid({ children, className = '' }: StaggerGridProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

/** Wrap each individual grid item. */
export function StaggerItem({ children, className = '' }: StaggerGridProps) {
  return (
    <motion.div
      className={className}
      variants={itemVariants}
      style={{ willChange: 'opacity, transform, filter' }}
    >
      {children}
    </motion.div>
  );
}

// ── Standalone scroll-triggered stagger section ───────────────────────────────

interface StaggerSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** A single element that animates in from below when scrolled into view. */
export function RevealItem({ children, className = '', delay = 0 }: StaggerSectionProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      style={{ willChange: 'opacity, transform, filter' }}
    >
      {children}
    </motion.div>
  );
}
