'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const PERF_NAV = [
  { id: 'overview',      label: 'Overview',      href: '/performance' },
  { id: 'analytics',    label: 'Analytics',     href: '/performance?tab=analytics' },
  { id: 'ai-coach',     label: 'AI Coach',      href: '/performance/ai-coach' },
  { id: 'ai-assistant', label: 'AI Assistant',  href: '/performance/ai-assistant' },
  { id: 'health',       label: 'Health',        href: '/performance/health' },
];

function PerformanceSectionNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  let active = 'overview';
  if (pathname === '/performance') {
    const tab = searchParams.get('tab');
    active = tab === 'analytics' ? 'analytics' : 'overview';
  } else if (pathname.startsWith('/performance/')) {
    active = pathname.replace('/performance/', '');
  }

  return (
    <div
      className="flex gap-1 p-1 rounded-xl overflow-x-auto animate-slide-up"
      style={{
        background: 'var(--chip-bg)',
        border: '1px solid var(--glass-border)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {PERF_NAV.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(tab.href)}
          className="flex-1 py-2.5 px-3 rounded-lg text-xs font-display font-semibold
                     transition-all duration-200 whitespace-nowrap"
          style={{
            background: active === tab.id ? 'rgba(245,166,35,0.12)' : 'transparent',
            color: active === tab.id ? '#F5A623' : 'var(--text-secondary)',
            border: active === tab.id ? '1px solid rgba(245,166,35,0.25)' : '1px solid transparent',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function PerformanceSectionNav() {
  return (
    <Suspense>
      <PerformanceSectionNavInner />
    </Suspense>
  );
}
