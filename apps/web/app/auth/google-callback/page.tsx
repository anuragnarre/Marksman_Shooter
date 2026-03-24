'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { syncGoogleUser } from '../../../lib/google-auth';
import { useAuth } from '../../../contexts/auth-context';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    syncGoogleUser()
      .then((result) => {
        if (result) {
          setUser(result.user);
          router.replace('/dashboard');
        } else {
          setError('Google sign-in failed. Please try again.');
        }
      })
      .catch(() => {
        setError('Google sign-in failed. Please try again.');
      });
  }, [router, setUser]);

  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <>
            <div className="text-[#FF4D6D] text-sm text-center max-w-xs">{error}</div>
            <button
              onClick={() => router.replace('/auth/login')}
              className="btn btn-primary text-sm"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-t-[#F5A623] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border border-t-transparent border-r-[#4FC3F7] border-b-transparent border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
            <p className="text-text-muted text-[11px] font-display uppercase tracking-widest animate-pulse">
              Signing you in...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
