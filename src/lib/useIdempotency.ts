import { useRef } from 'react';

export function newIdempotencyKey(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch { /* fall through */ }
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * One key per form "attempt": it stays the same across retries (so the server can
 * recognise a repeat of the same request) and is renewed only after a success.
 * `begin()` also blocks a second submit while one is in flight (double-click),
 * synchronously - state-based `disabled` alone is one render too late.
 */
export function useIdempotency() {
  const keyRef = useRef<string | null>(null);
  const inFlight = useRef(false);
  return {
    key: () => (keyRef.current ??= newIdempotencyKey()),
    begin: () => { if (inFlight.current) return false; inFlight.current = true; return true; },
    end: () => { inFlight.current = false; },
    reset: () => { keyRef.current = null; },
  };
}
