// apps/web/contexts/auth-context.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { User } from '@shooting-platform/shared-types';
import {
  getStoredUser,
  isAuthenticated,
  logout as authLogout,
  persistUser,
} from '../lib/auth';
import { apiFetch } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setIsLoading(false);
      return;
    }
    const stored = getStoredUser();
    if (stored) {
      setUserState(stored);
      setIsLoading(false);
    } else {
      // Token exists but user not in localStorage — fetch from API
      apiFetch<User>('/auth/me')
        .then((u) => {
          persistUser(u);
          setUserState(u);
        })
        .catch(() => {
          // Token is invalid/expired — clear it
          authLogout();
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const setUser = useCallback((u: User) => {
    persistUser(u);
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUserState(null);
  }, []);

  // Listen for 401 events dispatched by apiFetch
  useEffect(() => {
    const handleUnauthorized = () => {
      authLogout();
      setUserState(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, isLoading, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
