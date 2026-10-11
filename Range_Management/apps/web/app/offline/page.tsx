'use client';

// app/offline/page.tsx
// Fallback page served by the service worker when navigation fails while offline
// and there is no cached version of the requested page.

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 px-6"
      style={{ background: 'var(--bg-void)' }}
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        {/* Signal icon */}
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-40">
          <path d="M6 36L14 28" stroke="#FF4D6D" strokeWidth="3" strokeLinecap="round" />
          <path d="M12 30L20 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-text-muted" />
          <path d="M18 24L26 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-text-muted" />
          <path d="M24 18L32 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-text-muted" />
          <circle cx="24" cy="40" r="3" fill="#FF4D6D" />
        </svg>

        <h1
          className="font-display font-black text-2xl uppercase tracking-[0.15em]"
          style={{ color: 'var(--text-primary)' }}
        >
          You&apos;re Offline
        </h1>

        <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          This page isn&apos;t available without a connection. Your cached sessions and
          data are still accessible from the dashboard.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/dashboard"
          className="flex items-center justify-center px-6 py-3 rounded-xl font-display
                     font-bold uppercase tracking-[0.1em] text-sm transition-all duration-200
                     active:scale-95"
          style={{
            background: 'var(--accent-primary)',
            color: 'var(--bg-void)',
          }}
        >
          Go to Dashboard
        </Link>

        <Link
          href="/sessions"
          className="flex items-center justify-center px-6 py-3 rounded-xl font-display
                     font-bold uppercase tracking-[0.1em] text-sm transition-all duration-200
                     active:scale-95"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          My Sessions
        </Link>
      </div>
    </div>
  );
}
