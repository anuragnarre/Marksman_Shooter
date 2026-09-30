'use client';

// app/sw-register.tsx
// Registers the service worker and wires SW messages to the sync engine.
// Mounted once in layout.tsx — renders nothing.

import { useEffect } from 'react';
import { registerSyncTriggers } from '../lib/sync-engine';

export function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async (reg) => {
        // Periodic Background Sync for analytics refresh (browser may deny)
        if ('periodicSync' in reg) {
          try {
            await (
              reg as ServiceWorkerRegistration & {
                periodicSync: { register(tag: string, opts: object): Promise<void> };
              }
            ).periodicSync.register('marksman-analytics-refresh', {
              minInterval: 24 * 60 * 60 * 1000,
            });
          } catch {
            // Not granted or not supported — foreground sync handles it
          }
        }
      })
      .catch(() => {
        // SW registration failed (e.g. HTTP, file:// protocol) — offline
        // features degrade gracefully to foreground-only sync
      });

    // Register foreground sync triggers (online event, visibilitychange)
    registerSyncTriggers();
  }, []);

  return null;
}
