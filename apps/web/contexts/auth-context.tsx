// apps/web/contexts/auth-context.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import type { User } from '@shooting-platform/shared-types';
import {
  getStoredUser,
  isAuthenticated,
  logout as authLogout,
  persistUser,
  getToken,
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

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!isAuthenticated() || (token && isTokenExpired(token))) {
      authLogout();
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
          if (isMounted.current) {
            persistUser(u);
            setUserState(u);
          }
        })
        .catch(() => {
          // Token is invalid/expired — clear it
          authLogout();
        })
        .finally(() => {
          if (isMounted.current) setIsLoading(false);
        });
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
