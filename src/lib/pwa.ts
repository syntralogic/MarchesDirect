import { apiClient } from '@/lib/apiClient';

// Appli sur l'écran d'accueil + notifications (5 nov.). Règles de dosage validées avec le client :
// jamais deux propositions à la fois, rien avant que le visiteur ait obtenu quelque chose d'utile,
// et une proposition refusée n'est plus remontrée.
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
const DISMISS_KEY = 'md_install_dismissed';

export function initPwa(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => { /* non bloquant */ }); });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BIPEvent; listeners.forEach(l => l()); });
  window.addEventListener('appinstalled', () => { deferred = null; try { localStorage.setItem(DISMISS_KEY, 'installed'); } catch { /* */ } listeners.forEach(l => l()); });
}
export const onInstallChange = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };

export const isStandalone = () => typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);
export const isIos = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent) || (typeof navigator !== 'undefined' && /Macintosh/.test(navigator.userAgent) && (navigator as any).maxTouchPoints > 1);
const isMobile = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 820px)').matches;
export const installDismissed = () => { try { return !!localStorage.getItem(DISMISS_KEY); } catch { return true; } };
export const dismissInstall = () => { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* */ } listeners.forEach(l => l()); };

/** 'android' = vrai bouton Installer ; 'ios' = bulle d'aide ; null = rien à proposer. */
export function installMode(): 'android' | 'ios' | null {
  if (isStandalone() || installDismissed() || !isMobile()) return null;
  if (deferred) return 'android';
  if (isIos()) return 'ios';
  return null;
}
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt(); const r = await deferred.userChoice; deferred = null;
  if (r.outcome !== 'accepted') dismissInstall();
  listeners.forEach(l => l());
  return r.outcome === 'accepted';
}

// ---------------------------------------------------------------- notifications
export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && import.meta.env.PROD
    && (!isIos() || isStandalone()); // iPhone : uniquement une fois l'appli ajoutée à l'écran d'accueil
}
export const pushState = (): 'granted' | 'denied' | 'default' | 'unsupported' => (pushSupported() ? Notification.permission : 'unsupported');

const urlB64ToUint8 = (b64: string) => { const pad = '='.repeat((4 - (b64.length % 4)) % 4); const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...raw].map(c => c.charCodeAt(0))); };
export async function subscribePush(sessionId: string): Promise<'ok' | 'denied' | 'error'> {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return 'denied';
    const reg = await navigator.serviceWorker.ready;
    const { data } = await apiClient.get<{ publicKey: string }>('/suivi/push/key');
    const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(data.publicKey) });
    await apiClient.post('/suivi/push/subscribe', { sessionId, subscription: { endpoint: sub.endpoint } });
    return 'ok';
  } catch { return 'error'; }
}
