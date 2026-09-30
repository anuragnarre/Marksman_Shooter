// apps/web/lib/api.ts
// Centralised API client. All fetch calls go through apiFetch() which
// automatically attaches the JWT from localStorage, with offline-first
// fallback: reads from IndexedDB when offline, queues mutations for later sync.

import { isOnline, setOnline } from './network-state';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiFetchOptions extends RequestInit {
  /** Skip offline fallback — used by sync engine when intentionally hitting the network. */
  skipOffline?: boolean;
  /** Idempotency key forwarded to the server as X-Operation-Id header. */
  operationId?: string;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipOffline = false, operationId, ...fetchOptions } = options;
  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const isRead = method === 'GET';

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: Record<string, string> = {
    ...(fetchOptions.body && !(fetchOptions.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(operationId ? { 'X-Operation-Id': operationId } : {}),
    ...(fetchOptions.headers as Record<string, string>),
  };

  // ── Offline path ──────────────────────────────────────────────────────────

  if (!skipOffline && typeof window !== 'undefined' && !isOnline()) {
    if (isRead) {
      try {
        const { offlineRead } = await import('./offline-api');
        const cached = await offlineRead<T>(path);
        if (cached !== null) return cached;
      } catch {
        // IndexedDB unavailable
      }
      throw new ApiError(0, 'offline:no-cache');
    } else {
      try {
        const { offlineWrite } = await import('./offline-api');
        return await offlineWrite<T>(path, {
          method,
          body: typeof fetchOptions.body === 'string' ? JSON.parse(fetchOptions.body) : undefined,
        });
      } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, 'offline:write-failed');
      }
    }
  }

  // ── Online path ───────────────────────────────────────────────────────────

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
      cache: 'no-store',
    });
  } catch {
    // Network failure — update singleton and retry offline path
    setOnline(false);
    window.dispatchEvent(new Event('offline'));
    return apiFetch<T>(path, options);
  }

  setOnline(true);

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // ignore JSON parse errors
    }
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new ApiError(res.status, message);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  const data = await res.json() as T;

  // Cache successful GET responses into IndexedDB (fire-and-forget)
  if (isRead && typeof window !== 'undefined') {
    void import('./offline-api').then(({ cacheResponse }) =>
      cacheResponse(path, data),
    );
  }

  return data;
}
