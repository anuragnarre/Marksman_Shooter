// apps/web/lib/google-auth.ts
// Google Sign-In Library (ID token approach) — no OAuth redirect, no NextAuth.
// The Google button sends a credential (JWT) to our backend which verifies it
// server-side via google-auth-library.

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
 * Send the Google ID token credential to the backend for verification.
 * Returns the AuthResponse ({ access_token, user }).
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
 * Sign out — clears local state. Google revokes on their side automatically.
 */
export function googleSignOut(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    // Optionally disable Google auto-select to prevent immediate re-login
    window.google?.accounts.id.disableAutoSelect();
  }
}
