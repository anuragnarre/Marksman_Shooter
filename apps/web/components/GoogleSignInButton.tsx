// apps/web/components/GoogleSignInButton.tsx
// Renders the official Google Sign-In button using the GSI library on web,
// and a native Google Sign-In button via the Capacitor plugin on Android/iOS.
'use client';

import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { loadGoogleScript, googleSignIn, nativeGoogleSignIn } from '../lib/google-auth';
import type { User } from '@shooting-platform/shared-types';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

interface GoogleSignInButtonProps {
  onSuccess: (user: User) => void;
  onError: (message: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  role?: 'SHOOTER' | 'COACH';
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'continue_with',
  role,
}: GoogleSignInButtonProps) {
  // Native path — Capacitor Android/iOS
  if (Capacitor.isNativePlatform()) {
    return (
      <NativeGoogleSignInButton
        role={role}
        onSuccess={onSuccess}
        onError={onError}
      />
    );
  }

  // Web path — GSI library rendered button
  return (
    <WebGoogleSignInButton
      text={text}
      role={role}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}

// ── Native button (Android / iOS) ─────────────────────────────────────────────

function NativeGoogleSignInButton({
  role,
  onSuccess,
  onError,
}: {
  role?: 'SHOOTER' | 'COACH';
  onSuccess: (user: User) => void;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const roleRef = useRef(role);
  roleRef.current = role;

  async function handlePress() {
    setLoading(true);
    try {
      const result = await nativeGoogleSignIn(roleRef.current);
      onSuccess(result.user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      // User cancelled the picker — don't surface as an error
      if (!msg.includes('cancel') && !msg.includes('Cancel') && !msg.includes('dismissed')) {
        onError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePress}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-[4px] h-[44px] transition-opacity disabled:opacity-60"
      style={{ background: '#1F1F1F', border: '1px solid rgba(255,255,255,0.12)' }}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-[rgba(255,255,255,0.2)] border-t-white rounded-full animate-spin" />
          <span className="text-white text-sm font-medium">Signing in...</span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span className="text-white text-sm font-medium">
            {' '}Continue with Google
          </span>
        </>
      )}
    </button>
  );
}

// ── Web button (GSI library) ───────────────────────────────────────────────────

function WebGoogleSignInButton({
  text,
  role,
  onSuccess,
  onError,
}: {
  text: 'signin_with' | 'signup_with' | 'continue_with';
  role?: 'SHOOTER' | 'COACH';
  onSuccess: (user: User) => void;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const roleRef      = useRef(role);
  const [loading, setLoading] = useState(false);
  const [ready, setReady]     = useState(false);

  // Keep ref in sync so the GSI callback always reads the latest role
  roleRef.current = role;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      onError('Google Sign-In is not configured.');
      return;
    }

    loadGoogleScript(() => {
      if (!window.google || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (!response.credential) {
            onError('Google sign-in failed. Please try again.');
            return;
          }
          setLoading(true);
          try {
            const result = await googleSignIn(response.credential, roleRef.current);
            onSuccess(result.user);
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Google sign-in failed');
          } finally {
            setLoading(false);
          }
        },
        auto_select: false,
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'filled_black',
        size: 'large',
        type: 'standard',
        text,
        shape: 'rectangular',
        width: containerRef.current.offsetWidth || 360,
      });

      setReady(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full">
      {/* Google's rendered button */}
      <div
        ref={containerRef}
        className="w-full"
        style={{ minHeight: 44, visibility: ready && !loading ? 'visible' : 'hidden' }}
      />

      {/* Loading overlay */}
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-[4px]"
          style={{ background: '#1F1F1F', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <span className="w-4 h-4 border-2 border-[rgba(255,255,255,0.2)] border-t-white rounded-full animate-spin" />
          <span className="ml-2 text-white text-sm font-medium">Signing in...</span>
        </div>
      )}

      {/* Skeleton while GSI script loads */}
      {!ready && !loading && (
        <div
          className="w-full rounded-[4px] flex items-center justify-center gap-3"
          style={{ height: 44, background: '#1F1F1F', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <GoogleIcon />
          <span className="text-white text-sm font-medium">Continue with Google</span>
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
