import { useSyncExternalStore } from 'react';

const KEY = 'md:local-avatar:v1';
const CHANGED = 'md:local-avatar-changed';

function read(): string | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value?.startsWith('data:image/jpeg;base64,') ? value : null;
  } catch { return null; }
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === KEY || event.key === null) notify(); };
  window.addEventListener(CHANGED, notify);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGED, notify);
    window.removeEventListener('storage', onStorage);
  };
}

// A user-requested preference, independent of analytics consent. Never sent to the server.
export function useLocalAvatar() {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function saveLocalAvatar(value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, value);
  } catch {
    throw new Error('La photo n’a pas pu être conservée sur cet appareil. Vérifiez l’espace disponible ou les réglages de votre navigateur, puis réessayez.');
  }
  window.dispatchEvent(new Event(CHANGED));
}
