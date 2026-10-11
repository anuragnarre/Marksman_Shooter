'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export interface Tab {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl animate-slide-up"
      style={{ background: 'var(--chip-bg)', border: '1px solid var(--glass-border)' }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex-1 py-2.5 px-4 rounded-lg text-xs font-display font-semibold transition-all duration-200"
          style={{
            background: active === t.id ? 'rgba(245,166,35,0.12)' : 'transparent',
            color: active === t.id ? '#F5A623' : 'var(--text-secondary)',
            border: active === t.id ? '1px solid rgba(245,166,35,0.25)' : '1px solid transparent',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Hook to sync active tab with URL search params */
export function useTabParam(defaultTab: string): [string, (tab: string) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const active = searchParams.get('tab') ?? defaultTab;

  const setTab = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === defaultTab) {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [searchParams, router, pathname, defaultTab],
  );

  return [active, setTab];
}
