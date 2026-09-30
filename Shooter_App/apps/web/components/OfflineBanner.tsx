'use client';

// OfflineBanner — slides in from top when network is lost.
// Listens to both Capacitor Network plugin (native) and browser events (web).

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetwork } from '../hooks/useNetwork';

export function OfflineBanner() {
  const { online, connectionType } = useNetwork();
  // Show banner only after a brief grace period on first mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 800); return () => clearTimeout(t); }, []);

  const isOffline = mounted && !online;
  const label = connectionType === 'cellular'
    ? 'Slow connection — data may be limited'
    : 'No internet connection';

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: 56, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 56, opacity: 0, x: '-50%' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-24 left-1/2 z-[9999] flex items-center justify-center gap-2 px-4 py-2 rounded-full shadow-lg"
          style={{
            background: 'rgba(255,77,109,0.92)',
            backdropFilter: 'blur(12px)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <path d="M7 1L13 12H1L7 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            <line x1="7" y1="5" x2="7" y2="8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="7" cy="10.5" r="0.75" fill="white" />
          </svg>
          <span className="text-white text-[12px] font-display uppercase tracking-[0.1em]">
            {label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
