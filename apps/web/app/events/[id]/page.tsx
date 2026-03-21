'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import RegistrationForm from '../../../components/events/RegistrationForm';
import PaymentComingSoon from '../../../components/events/PaymentComingSoon';
import { getStoredUser } from '../../../lib/auth';
import type { CompetitionEvent } from '@shooting-platform/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  return m ? m[1] : null;
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<CompetitionEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/events/${id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        setEvent(data);
        const user = getStoredUser();
        if (user && data.registrations) {
          setIsRegistered(
            data.registrations.some((r: any) => r.userId === user.id),
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#F5A623] border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#8892A4]">Event not found.</p>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E1118] to-[#080A0F]" />
        {event.images?.[0] && (
          <div className="absolute inset-0">
            <img
              src={event.images[0]}
              alt=""
              className="h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080A0F]/60 via-[#080A0F]/80 to-[#080A0F]" />
          </div>
        )}

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F5A623]/20 bg-[#F5A623]/10 px-3 py-1 text-xs font-medium text-[#F5A623]">
              {event.status}
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              {event.name}
            </h1>
            <div className="flex flex-wrap gap-6 text-[#8892A4]">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formattedDate}
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {event.time}
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {event.location}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="space-y-8">
            {/* Description */}
            {event.description && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/5 bg-[#0E1118] p-6"
              >
                <h2 className="mb-3 text-lg font-semibold text-white">About</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#8892A4]">
                  {event.description}
                </p>
              </motion.div>
            )}

            {/* Rules */}
            {event.rules && (
              <div className="rounded-2xl border border-white/5 bg-[#0E1118] p-6">
                <h2 className="mb-3 text-lg font-semibold text-white">Rules</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#8892A4]">
                  {event.rules}
                </p>
              </div>
            )}

            {/* Guidelines */}
            {event.guidelines && (
              <div className="rounded-2xl border border-white/5 bg-[#0E1118] p-6">
                <h2 className="mb-3 text-lg font-semibold text-white">Guidelines</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#8892A4]">
                  {event.guidelines}
                </p>
              </div>
            )}

            {/* Categories */}
            {event.categories && event.categories.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-[#0E1118] p-6">
                <h2 className="mb-3 text-lg font-semibold text-white">Categories</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-left text-[#8892A4]">
                        <th className="pb-2 font-medium">Category</th>
                        <th className="pb-2 font-medium">Fee</th>
                        <th className="pb-2 font-medium">Max Participants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.categories.map((cat) => (
                        <tr key={cat.id} className="border-b border-white/5">
                          <td className="py-2.5 text-white">{cat.name}</td>
                          <td className="py-2.5 text-[#F5A623]">
                            {cat.fee ? `Rs. ${cat.fee}` : 'Free'}
                          </td>
                          <td className="py-2.5 text-[#8892A4]">
                            {cat.maxParticipants ?? 'No limit'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Image Gallery */}
            {event.images && event.images.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-[#0E1118] p-6">
                <h2 className="mb-3 text-lg font-semibold text-white">Gallery</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {event.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Event image ${i + 1}`}
                      className="h-48 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {event.videos && event.videos.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-[#0E1118] p-6">
                <h2 className="mb-3 text-lg font-semibold text-white">Videos</h2>
                <div className="grid gap-4">
                  {event.videos.map((url, i) => {
                    const ytId = extractYouTubeId(url);
                    return ytId ? (
                      <div key={i} className="aspect-video overflow-hidden rounded-lg">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          className="h-full w-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                    ) : (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#4FC3F7] hover:underline"
                      >
                        {url}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Registration + Payment */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Quick stats */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-[#0E1118] p-4 text-center">
                  <div className="text-xl font-bold text-[#F5A623]">
                    {event.registrationFee ? `Rs.${event.registrationFee}` : 'Free'}
                  </div>
                  <div className="text-xs text-[#8892A4]">Entry Fee</div>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#0E1118] p-4 text-center">
                  <div className="text-xl font-bold text-[#4FC3F7]">
                    {event._count?.registrations ?? 0}
                  </div>
                  <div className="text-xs text-[#8892A4]">Registered</div>
                </div>
              </div>

              <RegistrationForm
                event={event}
                categories={event.categories ?? []}
                isRegistered={isRegistered}
                onRegistered={() => setIsRegistered(true)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PaymentComingSoon />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
