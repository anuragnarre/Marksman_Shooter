'use client';

// components/AppDownloadButton.tsx
// Platform-aware APK download CTA.
// - android-web  → amber primary "Download for Android"
// - ios-web      → dimmed ghost "iOS — Coming Soon"
// - desktop      → ghost "↓ Get Android App"
// - native       → null (user already has the app)
// - SSR / unknown → null (no hydration flash)

import { useEffect, useState } from 'react';
import { isNative } from '../lib/capacitor';

type Platform = 'unknown' | 'native' | 'android-web' | 'ios-web' | 'desktop';

function detectPlatform(): Platform {
  if (isNative()) return 'native';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua))           return 'android-web';
  if (/iPhone|iPad|iPod/i.test(ua))  return 'ios-web';
  return 'desktop';
}

interface Props {
  /** 'sm' for navbar chip, 'md' for hero / drawer (default) */
  size?: 'sm' | 'md';
  className?: string;
}

const DownloadIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v8M5 8l3 3 3-3"/>
    <path d="M2 13h12"/>
  </svg>
);

const AndroidIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24A8.94 8.94 0 0 0 12 8a8.94 8.94 0 0 0-4.48 1.91L5.65 6.67a.64.64 0 0 0-.83-.22c-.3.16-.42.54-.26.85L6.4 9.48A8.97 8.97 0 0 0 3 17h18a8.97 8.97 0 0 0-3.4-7.52zM7.5 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm9 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
  </svg>
);

export function AppDownloadButton({ size = 'md', className = '' }: Props) {
  const [platform, setPlatform] = useState<Platform>('unknown');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  // Hide on SSR and inside native app
  if (platform === 'unknown' || platform === 'native') return null;

  const isAndroidWeb = platform === 'android-web';
  const isIosWeb     = platform === 'ios-web';

  const sm = size === 'sm';

  function handleDownload() {
    if (isIosWeb) return;
    window.location.href = '/api/download/android';
  }

  /* ── Android: amber primary ─────────────────────────────────────────────── */
  if (isAndroidWeb) {
    return (
      <button
        onClick={handleDownload}
        className={`inline-flex items-center justify-center gap-2 font-display font-bold active:scale-[0.97] ${
          sm ? 'text-[12px] px-3.5 py-2 rounded-[9px]' : 'text-[14px] px-6 py-3.5 rounded-[12px]'
        } ${className}`}
        style={{
          background: 'linear-gradient(135deg, #F5A623 0%, #E18E0D 100%)',
          color: '#07090F',
          boxShadow: '0 0 18px rgba(245,166,35,0.22), 0 4px 12px rgba(0,0,0,0.22)',
          transition: 'filter 200ms ease, transform 150ms ease',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.07)'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'}
        aria-label="Download Marksman APK for Android"
      >
        <AndroidIcon size={sm ? 13 : 15} />
        {sm ? 'Download APK' : 'Download for Android'}
        <DownloadIcon size={sm ? 12 : 14} />
      </button>
    );
  }

  /* ── iOS: ghost dimmed (coming soon) ────────────────────────────────────── */
  if (isIosWeb) {
    return (
      <span
        className={`inline-flex items-center justify-center gap-2 font-body font-medium cursor-not-allowed select-none ${
          sm ? 'text-[12px] px-3.5 py-2 rounded-[9px]' : 'text-[13px] px-5 py-3.5 rounded-[12px]'
        } ${className}`}
        style={{
          color: 'var(--text-muted)',
          border: '1px solid var(--border-subtle)',
          background: 'transparent',
          opacity: 0.55,
        }}
        title="iOS app coming soon"
        aria-label="iOS app coming soon"
      >
        {/* Apple icon */}
        <svg width={sm ? 12 : 14} height={sm ? 12 : 14} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        iOS — Coming Soon
      </span>
    );
  }

  /* ── Desktop: ghost secondary ───────────────────────────────────────────── */
  return (
    <button
      onClick={handleDownload}
      className={`inline-flex items-center justify-center gap-2 font-body font-medium hover:text-[#F5A623] ${
        sm ? 'text-[12px] px-3.5 py-2 rounded-[9px]' : 'text-[13px] px-5 py-3.5 rounded-[12px]'
      } ${className}`}
      style={{
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-subtle)',
        background: 'transparent',
        transition: 'color 200ms ease, border-color 200ms ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = 'rgba(245,166,35,0.35)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = 'var(--border-subtle)';
      }}
      aria-label="Download Marksman APK for Android"
    >
      <AndroidIcon size={sm ? 12 : 14} />
      {sm ? '↓ APK' : '↓ Get Android App'}
    </button>
  );
}
