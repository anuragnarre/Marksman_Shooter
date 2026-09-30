'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const PLANNING_NAV = [
  { id: 'schedule',      label: 'Schedule',        href: '/planning' },
  { id: 'goals',         label: 'Goals & Records', href: '/planning?tab=goals' },
  { id: 'training-plan', label: 'Training Plan',   href: '/planning/training-plan' },
];

function PlanningSectionNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  let active = 'schedule';
  if (pathname === '/planning') {
    const tab = searchParams.get('tab');
    active = tab === 'goals' ? 'goals' : 'schedule';
  } else if (pathname.startsWith('/planning/')) {
    active = pathname.replace('/planning/', '');
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
      {PLANNING_NAV.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(tab.href)}
          className="flex-1 py-2.5 px-4 rounded-lg text-xs font-display font-semibold
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

export function PlanningSectionNav() {
  return (
    <Suspense>
      <PlanningSectionNavInner />
    </Suspense>
  );
}
