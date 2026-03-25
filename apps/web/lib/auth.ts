// apps/web/lib/auth.ts
import { apiFetch } from './api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@shooting-platform/shared-types';

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  persistToken(res.access_token);
  persistUser(res.user);
  return res;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  persistToken(res.access_token);
  persistUser(res.user);
  return res;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
  }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('current_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function persistToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
}

export function persistUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('current_user', JSON.stringify(user));
  }
}

export function isAuthenticated(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('access_token');
}
