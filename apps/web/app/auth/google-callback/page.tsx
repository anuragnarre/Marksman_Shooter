'use client';

// Google auth no longer uses a redirect callback — the Sign-In Library
// handles everything inline. Redirect anyone who lands here to login.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallbackPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/auth/login'); }, [router]);
  return null;
}
