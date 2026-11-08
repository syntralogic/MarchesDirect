import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/apiClient';

const KEY = 'md_company_siret';
const CHANGED = 'md:company-changed';
function readSiret() { try { return localStorage.getItem(KEY); } catch { return null; } }
function subscribe(notify: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) notify(); };
  window.addEventListener(CHANGED, notify); window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(CHANGED, notify); window.removeEventListener('storage', onStorage); };
}
type Logo = { dataUrl: string; source: string };
const pending = new Map<string, Promise<Logo | null>>();
function loadLogo(siret: string) {
  if (!pending.has(siret)) {
    if (pending.size >= 30) pending.delete(pending.keys().next().value!);
    pending.set(siret, apiClient.get(`/public/company-logos/${siret}`, { timeout: 12000 })
      .then(r => {
        const logo = r.data?.logo;
        return logo && /^data:image\/(png|jpeg|webp);base64,/.test(logo.dataUrl || '')
          && /^https:\/\//.test(logo.source || '') ? logo as Logo : null;
      }).catch(() => null));
  }
  return pending.get(siret)!;
}

export function useCompanyLogo(enabled: boolean) {
  const { isAuthenticated, company, loading } = useAuth();
  const remembered = useSyncExternalStore(subscribe, readSiret, () => null);
  const siret = isAuthenticated ? company?.siret || null : remembered;
  const [result, setResult] = useState<{ siret: string; logo: Logo | null } | null>(null);
  useEffect(() => {
    if (!enabled || loading || !siret || !/^\d{14}$/.test(siret)) return;
    let live = true;
    loadLogo(siret).then(logo => { if (live) setResult({ siret, logo }); });
    return () => { live = false; };
  }, [enabled, loading, siret]);
  return enabled && !loading && result?.siret === siret ? result.logo : null;
}
