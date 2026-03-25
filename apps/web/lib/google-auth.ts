// apps/web/lib/google-auth.ts
// Google Sign-In — two paths:
//   Web:    GSI library renders the official button, returns a credential JWT
//   Native: @codetrix-studio/capacitor-google-auth uses the Android/iOS native
//           Google Sign-In SDK, also returns an ID token.
// Both paths send the ID token to the backend /auth/google endpoint.

import { Capacitor } from '@capacitor/core';
import { apiFetch } from './api';
import { persistUser } from './auth';
import type { AuthResponse, User } from '@shooting-platform/shared-types';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
            }
          ) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, done: () => void) => void;
        };
      };
    };
  }
}

let scriptLoading = false;
let scriptLoaded = false;

/**
 * Load the Google Sign-In script once, then call the callback.
 * Only used on web — native uses the Capacitor plugin.
 */
export function loadGoogleScript(onLoad: () => void): void {
  if (scriptLoaded) { onLoad(); return; }
  if (scriptLoading) {
    const interval = setInterval(() => {
      if (scriptLoaded) { clearInterval(interval); onLoad(); }
    }, 50);
    return;
  }

  scriptLoading = true;
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => { scriptLoaded = true; scriptLoading = false; onLoad(); };
  script.onerror = () => { scriptLoading = false; };
  document.head.appendChild(script);
}

/**
 * Send a Google ID token to the backend for verification and login/register.
 * Used by both the web GSI flow and the native Capacitor flow.
 */
export async function googleSignIn(
  credential: string,
  role?: 'SHOOTER' | 'COACH',
): Promise<{ access_token: string; user: User }> {
  const body: Record<string, string> = { credential };
  if (role) body.role = role;
  const res = await apiFetch<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', res.access_token);
    persistUser(res.user);
  }
  return res;
}

/**
 * Native Google Sign-In via @codetrix-studio/capacitor-google-auth.
 * Triggers the native Android/iOS Google account picker, gets an ID token,
 * then sends it to the backend — same flow as the web GSI button.
 */
export async function nativeGoogleSignIn(
  role?: 'SHOOTER' | 'COACH',
): Promise<{ access_token: string; user: User }> {
  const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

  // Initialize is idempotent — safe to call each time
  GoogleAuth.initialize({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email'],
    grantOfflineAccess: false,
  });

  const googleUser = await GoogleAuth.signIn();
  const idToken = googleUser.authentication.idToken;

  if (!idToken) {
    throw new Error('Google Sign-In did not return an ID token.');
  }

  return googleSignIn(idToken, role);
}

/**
 * Sign out — clears local state.
 * On native, also signs out from the Google Capacitor plugin to clear the
 * cached account so the user is prompted to choose an account next time.
 */
export async function googleSignOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.signOut();
    } catch {
      // ignore — user may not have been signed in via Google
    }
  } else {
    window.google?.accounts.id.disableAutoSelect();
  }
}
