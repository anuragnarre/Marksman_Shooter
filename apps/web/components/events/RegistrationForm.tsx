'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { apiFetch } from '../../lib/api';
import { googleLogin, isAuthenticated, getStoredUser } from '../../lib/auth';
import type { CompetitionEvent, CompetitionEventCategory } from '@shooting-platform/shared-types';

interface RegistrationFormProps {
  event: CompetitionEvent;
  categories: CompetitionEventCategory[];
  isRegistered: boolean;
  onRegistered: () => void;
}

export default function RegistrationForm({
  event,
  categories,
  isRegistered,
  onRegistered,
}: RegistrationFormProps) {
  const { data: session } = useSession();
  const [categoryId, setCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loggedIn = isAuthenticated();

  async function handleGoogleAndRegister() {
    // If user has a NextAuth session but no local JWT, sync first
    if (session?.user?.email) {
      try {
        await googleLogin({
          email: session.user.email,
          name: session.user.name ?? undefined,
          googleId: (session as any).googleId ?? session.user.email,
        });
        await handleRegister();
      } catch (err: any) {
        setError(err.message ?? 'Failed to sync Google account');
      }
      return;
    }

    // Otherwise trigger Google sign-in
    signIn('google');
  }

  async function handleRegister() {
    setLoading(true);
    setError('');
    try {
      await apiFetch(`/events/${event.id}/register`, {
        method: 'POST',
        body: JSON.stringify({ categoryId: categoryId || undefined }),
      });
      onRegistered();
    } catch (err: any) {
      setError(err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (isRegistered) {
    return (
      <div className="rounded-2xl border border-[#00E5A0]/20 bg-[#00E5A0]/5 p-6 text-center">
        <div className="mb-2 text-2xl">&#10003;</div>
        <h3 className="text-lg font-semibold text-[#00E5A0]">You're Registered</h3>
        <p className="mt-1 text-sm text-[#8892A4]">
          You have successfully registered for this event.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0E1118] p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">Register for this Event</h3>

      {/* Category picker */}
      {categories.length > 0 && (
        <div className="mb-4">
          <label className="mb-1.5 block text-sm text-[#8892A4]">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#161B26] px-3 py-2.5 text-sm text-white outline-none focus:border-[#F5A623]/50"
          >
            <option value="">General (no category)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.fee ? ` - Rs. ${c.fee}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p className="mb-3 text-sm text-[#FF4D6D]">{error}</p>
      )}

      {loggedIn ? (
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full rounded-lg bg-[#F5A623] px-4 py-3 text-sm font-semibold text-[#080A0F] transition-all hover:bg-[#F5A623]/90 disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register Now'}
        </button>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleGoogleAndRegister}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-white px-4 py-3 text-sm font-medium text-gray-800 transition-all hover:bg-gray-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google to Register
          </button>
          <p className="text-center text-xs text-[#8892A4]">
            Or{' '}
            <a href="/login" className="text-[#F5A623] hover:underline">
              sign in with email
            </a>{' '}
            to register
          </p>
        </div>
      )}
    </div>
  );
}
