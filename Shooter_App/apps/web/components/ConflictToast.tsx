'use client';

// ConflictToast — listens for offline:id-replaced events and notifies the user
// when a temp offline ID has been replaced with a real server ID.
// Useful for pages that navigate to /sessions/<tempId> while offline.

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function ConflictToast() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: Event) => {
      const { tempId, serverId } = (e as CustomEvent<{ tempId: string; serverId: string }>).detail;

      // If currently viewing the temp session, redirect to the real one
      if (pathname?.includes(tempId)) {
        router.replace(pathname.replace(tempId, serverId));
      }
    };

    window.addEventListener('offline:id-replaced', handler);
    return () => window.removeEventListener('offline:id-replaced', handler);
  }, [pathname, router]);

  return null;
}
