'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CompetitionEvent } from '@shooting-platform/shared-types';

interface EventCardProps {
  event: CompetitionEvent;
  index: number;
}

export default function EventCard({ event, index }: EventCardProps) {
  const eventDate = new Date(event.date);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link href={`/events/${event.id}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0E1118] transition-all duration-300 hover:border-[#F5A623]/20 hover:shadow-[0_0_40px_rgba(245,166,35,0.06)]">
          {/* Image */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#161B26] to-[#0E1118]">
            {event.images?.[0] ? (
              <img
                src={event.images[0]}
                alt={event.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2A3040" strokeWidth="1" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
            )}

            {/* Date badge */}
            <div className="absolute left-3 top-3 flex flex-col items-center rounded-lg bg-[#080A0F]/90 px-2.5 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-medium text-[#F5A623]">{month}</span>
              <span className="text-lg font-bold leading-tight text-white">{day}</span>
            </div>

            {/* Registration count */}
            {event._count && (
              <div className="absolute right-3 top-3 rounded-full bg-[#080A0F]/90 px-2.5 py-1 text-xs text-[#8892A4] backdrop-blur-sm">
                {event._count.registrations} registered
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-[#F5A623]">
              {event.name}
            </h3>

            <div className="mb-3 flex flex-col gap-1.5 text-sm text-[#8892A4]">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {event.location}
              </div>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {event.time}
              </div>
            </div>

            <div className="flex items-center justify-between">
              {event.registrationFee ? (
                <span className="text-sm font-semibold text-[#F5A623]">
                  Rs. {event.registrationFee}
                </span>
              ) : (
                <span className="text-sm font-medium text-[#00E5A0]">Free Entry</span>
              )}

              <span className="text-xs font-medium text-[#F5A623] opacity-0 transition-opacity group-hover:opacity-100">
                View Details &rarr;
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
