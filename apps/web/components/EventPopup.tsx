'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { CompetitionEvent } from '@shooting-platform/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function EventPopup() {
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only once per session
    if (typeof window !== 'undefined' && sessionStorage.getItem('event_popup_dismissed')) {
      return;
    }

    fetch(`${API_BASE}/events/upcoming`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data.slice(0, 3));
          // Delay popup for smooth UX
          setTimeout(() => setVisible(true), 3000);
        }
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('event_popup_dismissed', '1');
    }
  }

  return (
    <AnimatePresence>
      {visible && events.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-4 right-4 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0E1118]/95 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:right-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#F5A623] animate-pulse" />
              <span className="text-sm font-semibold text-white">Upcoming Events</span>
            </div>
            <button
              onClick={dismiss}
              className="rounded-md p-1 text-[#8892A4] transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Events list */}
          <div className="max-h-52 overflow-y-auto px-4 py-3">
            {events.map((event, i) => {
              const d = new Date(event.date);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group mb-2 flex items-start gap-3 rounded-lg p-2 transition-colors last:mb-0 hover:bg-white/5"
                >
                  <div className="flex flex-col items-center rounded-md bg-[#161B26] px-2 py-1 text-center">
                    <span className="text-[10px] font-medium text-[#F5A623]">
                      {d.toLocaleString('default', { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-sm font-bold leading-tight text-white">
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white group-hover:text-[#F5A623]">
                      {event.name}
                    </p>
                    <p className="truncate text-xs text-[#8892A4]">{event.location}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-4 py-2.5">
            <Link
              href="/events"
              className="flex items-center justify-center gap-1 text-xs font-medium text-[#F5A623] transition-colors hover:text-[#F5A623]/80"
              onClick={dismiss}
            >
              View All Events
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
