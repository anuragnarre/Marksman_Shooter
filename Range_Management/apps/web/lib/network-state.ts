// lib/network-state.ts
// Module-level singleton so apiFetch (non-React) can read network status
// without importing hooks. Updated by useNetwork whenever status changes.

let _online = true;

export function isOnline(): boolean {
  return _online;
}

export function setOnline(v: boolean): void {
  _online = v;
}
