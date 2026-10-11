'use client';

// SyncStatusIndicator — compact chip shown in TopBar.
// Hidden when online and fully synced.
// Shows queue depth, syncing state, and failure prompts.

import { useSyncStatus } from '../hooks/useSyncStatus';
import { useNetwork } from '../hooks/useNetwork';

export function SyncStatusIndicator() {
  const { pending, inflight, hasFailures, retryFailed } = useSyncStatus();
  const { online } = useNetwork();

  // Nothing to show
  if (online && pending === 0 && inflight === 0 && !hasFailures) return null;

  if (hasFailures) {
    return (
      <button
        onClick={() => void retryFailed()}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-display uppercase
                   tracking-[0.08em] transition-all duration-200 active:scale-95"
        style={{
          background: 'rgba(255,77,109,0.12)',
          border: '1px solid rgba(255,77,109,0.35)',
          color: '#FF4D6D',
        }}
        title="Tap to retry failed sync items"
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: '#FF4D6D' }}
        />
        Sync failed
      </button>
    );
  }

  if (!online && pending > 0) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-display uppercase tracking-[0.08em]"
        style={{
          background: 'rgba(255,77,109,0.10)',
          border: '1px solid rgba(255,77,109,0.25)',
          color: 'rgba(255,77,109,0.85)',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: '#FF4D6D' }}
        />
        {pending} queued
      </div>
    );
  }

  if (online && (pending > 0 || inflight > 0)) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-display uppercase tracking-[0.08em]"
        style={{
          background: 'rgba(245,166,35,0.10)',
          border: '1px solid rgba(245,166,35,0.25)',
          color: 'rgba(245,166,35,0.9)',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
          style={{ background: '#F5A623' }}
        />
        {inflight > 0 ? 'Syncing…' : `${pending} pending`}
      </div>
    );
  }

  return null;
}
