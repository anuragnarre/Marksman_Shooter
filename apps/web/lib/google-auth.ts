import { signIn, signOut, getSession } from 'next-auth/react';
import { persistUser } from './auth';
import type { User } from '@shooting-platform/shared-types';

/**
 * Trigger Google sign-in via NextAuth.
 * After the redirect-based flow completes, call syncGoogleUser() to
 * persist the backend JWT and user into localStorage.
 */
export async function googleSignIn() {
  await signIn('google', { callbackUrl: '/auth/google-callback' });
}

/**
 * After NextAuth Google sign-in, the JWT callback in [...nextauth]/route.ts
 * already synced the user with the NestJS backend. This function reads
 * the backend token + user from the NextAuth session and persists them.
 */
export async function syncGoogleUser(): Promise<{ access_token: string; user: User } | null> {
  const session = await getSession();
  if (!session?.user?.email) return null;

  const backendToken = (session as any).backendToken as string | undefined;
  const backendUser = (session as any).backendUser as User | undefined;

  if (!backendToken || !backendUser) return null;

  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', backendToken);
    persistUser(backendUser);
  }

  return { access_token: backendToken, user: backendUser };
}

export async function googleSignOut() {
  await signOut({ redirect: false });
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
  }
}
