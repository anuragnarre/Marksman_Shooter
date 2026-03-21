'use client';

import Link from 'next/link';
import { SessionProvider } from 'next-auth/react';
import { Rajdhani, DM_Sans } from 'next/font/google';

const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['500', '600', '700'] });
const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500'] });

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className={`min-h-screen bg-[#080A0F] text-white ${dmSans.className}`}>
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#080A0F]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/events" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#F5A623] to-[#F5A623]/60">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <span className={`text-lg font-bold tracking-wider text-white ${rajdhani.className}`}>
                MARKSMAN
              </span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/events"
                className="text-sm text-[#8892A4] transition-colors hover:text-white"
              >
                Events
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-[#F5A623]/30 bg-[#F5A623]/10 px-4 py-1.5 text-sm font-medium text-[#F5A623] transition-all hover:bg-[#F5A623]/20"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </header>

        {/* Content */}
        <main className="pt-16">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-[#0E1118] py-8">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-[#8892A4]">
            Marksman Shooting Platform
          </div>
        </footer>
      </div>
    </SessionProvider>
  );
}
