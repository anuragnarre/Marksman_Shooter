'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';
export type DashboardTheme = 'compact-tactical' | 'harmonized-precision';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  dashboardTheme: DashboardTheme;
  setDashboardTheme: (theme: DashboardTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
  dashboardTheme: 'compact-tactical',
  setDashboardTheme: () => {},
  toggleTheme: () => {},
});

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(resolved: ResolvedTheme, dashboardTheme: DashboardTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
  root.setAttribute('data-dashboard-theme', dashboardTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [dashboardTheme, setDashboardThemeState] = useState<DashboardTheme>('compact-tactical');

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = storedTheme && ['dark', 'light', 'system'].includes(storedTheme) ? storedTheme : 'dark';
    setThemeState(initialTheme);

    const storedDashTheme = localStorage.getItem('dashboardTheme') as DashboardTheme | null;
    const initialDashTheme = storedDashTheme && ['compact-tactical', 'harmonized-precision'].includes(storedDashTheme)
      ? storedDashTheme
      : 'compact-tactical';
    setDashboardThemeState(initialDashTheme);

    const resolved = initialTheme === 'system' ? getSystemTheme() : initialTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved, initialDashTheme);
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      applyTheme(resolved, dashboardTheme);
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, dashboardTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved, dashboardTheme);
  }, [dashboardTheme]);

  const setDashboardTheme = useCallback((newDashTheme: DashboardTheme) => {
    setDashboardThemeState(newDashTheme);
    localStorage.setItem('dashboardTheme', newDashTheme);
    applyTheme(resolvedTheme, newDashTheme);
  }, [resolvedTheme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: ResolvedTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        dashboardTheme,
        setDashboardTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
