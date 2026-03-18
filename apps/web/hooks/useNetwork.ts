'use client';

// hooks/useNetwork.ts — Real-time network status with Capacitor + web fallback.

import { useState, useEffect } from 'react';
import { isNative } from '../lib/capacitor';

export function useNetwork(): { online: boolean; connectionType: string } {
  const [online, setOnline]         = useState(true);
  const [connectionType, setType]   = useState('unknown');

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    if (isNative()) {
      // Capacitor Network plugin
      void (async () => {
        try {
          const { Network } = await import('@capacitor/network');
          const status = await Network.getStatus();
          setOnline(status.connected);
          setType(status.connectionType);

          const handle = await Network.addListener('networkStatusChange', (s) => {
            setOnline(s.connected);
            setType(s.connectionType);
          });
          cleanupFn = () => void handle.remove();
        } catch { /* web fallback below */ }
      })();
    } else {
      // Browser online/offline events
      const handleOnline  = () => { setOnline(true);  setType('unknown'); };
      const handleOffline = () => { setOnline(false); setType('none'); };
      setOnline(navigator.onLine);
      window.addEventListener('online',  handleOnline);
      window.addEventListener('offline', handleOffline);
      cleanupFn = () => {
        window.removeEventListener('online',  handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => cleanupFn?.();
  }, []);

  return { online, connectionType };
}
