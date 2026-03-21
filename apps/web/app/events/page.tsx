'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import EventCard from '../../components/events/EventCard';
import { apiFetch } from '../../lib/api';
import type { CompetitionEvent } from '@shooting-platform/shared-types';

export default function EventsPage() {
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'free'>('all');

  useEffect(() => {
    apiFetch<CompetitionEvent[]>('/events')
      .then(setEvents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const filtered = events.filter((e) => {
    if (filter === 'upcoming') return new Date(e.date) >= now;
    if (filter === 'free') return !e.registrationFee;
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-[#0E1118] to-[#080A0F] py-20 sm:py-28">
        {/* Ambient decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-[#F5A623]/5 blur-[100px]" />
          <div className="absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-[#4FC3F7]/5 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F5A623]/20 bg-[#F5A623]/10 px-3 py-1 text-xs font-medium text-[#F5A623]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623] animate-pulse" />
              Live Events
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Upcoming Competitions
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-[#8892A4]">
              Compete, improve, and connect with the shooting community.
              Browse upcoming events and register today.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="border-b border-white/5 bg-[#0E1118]/50">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6">
          {(['all', 'upcoming', 'free'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[#F5A623]/15 text-[#F5A623]'
                  : 'text-[#8892A4] hover:text-white'
              }`}
            >
              {f === 'all' ? 'All Events' : f === 'upcoming' ? 'Upcoming' : 'Free Entry'}
            </button>
          ))}
          <span className="ml-auto text-sm text-[#8892A4]">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <div className="rounded-xl bg-[rgba(255,77,109,0.08)] border border-[rgba(255,77,109,0.25)] px-4 py-3 text-[#FF4D6D] text-sm">
            Failed to load events: {error}
          </div>
        </div>
      )}

      {/* Events grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-[#0E1118]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-5xl opacity-20">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#8892A4" strokeWidth="1" strokeLinecap="round" className="mx-auto">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">No Events Found</h3>
            <p className="text-sm text-[#8892A4]">
              Check back later for upcoming competitions.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
