// app/api/download/android/route.ts
// Secure APK delivery endpoint.
// Reads NEXT_PUBLIC_APK_URL (or server-only APK_URL) and issues a
// 302 redirect with proper security headers.
// Keeps the actual APK URL out of HTML source when using APK_URL.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Prefer server-only APK_URL; fall back to public var for convenience
  const apkUrl =
    process.env.APK_URL ??
    process.env.NEXT_PUBLIC_APK_URL;

  if (!apkUrl) {
    return NextResponse.json(
      { error: 'APK not available yet. Check back soon.' },
      { status: 503 },
    );
  }

  return NextResponse.redirect(apkUrl, {
    status: 302,
    headers: {
      'Cache-Control':          'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag':           'noindex',
    },
  });
}
