import { opportunitiesApi, savedSearchesApi, getApiErrorMessage } from '@/lib/apiClient';
import { refineFromParams, searchParamsFor } from '@/components/liste/RefinePanel';
import { getSessionId } from '@/lib/visitorTracking';

// « Sauvegarder ma recherche » (5 nov., le code Le Bon Coin). 7 nov. : la liste vit sur le serveur (session du téléphone,
// puis compte dès la connexion : on la retrouve sur ordinateur et téléphone). Le navigateur n'en garde qu'une copie pour
// l'affichage immédiat et les annonces déjà vues (« nouveautés » = apparues depuis la dernière consultation, jamais estimées).
export type SavedSearch = { id: string; label: string; query: string; ranked: boolean; seen: string[]; savedAt: string; viewedAt: string; alert?: boolean };
const KEY = 'md_saved_searches';
export const SAVED_LIMIT = 50;
const read = (): SavedSearch[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const write = (l: SavedSearch[]) => { try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, SAVED_LIMIT))); } catch { /* stockage indisponible */ } };
const clean = (q: string) => { const p = new URLSearchParams(q); p.delete('source'); p.delete('page'); return p.toString(); };
export const listSaved = read;
export const isSaved = (query: string) => read().some(s => s.query === clean(query));

/** Sauvegarde locale immédiate + serveur. Renvoie un message d'erreur (limite atteinte…) ou null. */
export async function saveSearch(label: string, query: string, ranked: boolean, ids: string[]): Promise<string | null> {
  const now = new Date().toISOString(); const q = clean(query);
  write([{ id: `local-${Date.now()}`, label, query: q, ranked, seen: ids.slice(0, 200), savedAt: now, viewedAt: now }, ...read().filter(s => s.query !== q)]);
  try {
    const r = await savedSearchesApi.save(getSessionId(), label, q, ranked);
    write(read().map(s => s.query === q ? { ...s, id: r.id } : s));
    return null;
  } catch (e) {
    const msg = getApiErrorMessage(e);
    if (/\b(409|limite|50 recherches)\b/i.test(String(msg))) { write(read().filter(s => s.query !== q)); return msg; }
    return null; // réseau : la copie locale reste, elle sera envoyée à la prochaine synchronisation
  }
}
export async function removeSearch(id: string) {
  write(read().filter(s => s.id !== id));
  if (!id.startsWith('local-')) await savedSearchesApi.remove(getSessionId(), id).catch(() => {});
}
export async function renameSearch(id: string, label: string) {
  write(read().map(s => s.id === id ? { ...s, label } : s));
  if (!id.startsWith('local-')) await savedSearchesApi.update(getSessionId(), id, { label });
}
export async function setSearchAlert(id: string, on: boolean) {
  await savedSearchesApi.update(getSessionId(), id, { alertEnabled: on });
  write(read().map(s => s.id === id ? { ...s, alert: on } : s));
}
export function markViewed(query: string, ids: string[]) {
  const l = read(); const s = l.find(x => x.query === clean(query)); if (!s) return;
  s.seen = [...new Set([...ids, ...s.seen])].slice(0, 300); s.viewedAt = new Date().toISOString(); write(l);
}
/** Serveur ↔ téléphone : les sauvegardes locales non encore envoyées partent, la liste serveur fait foi. */
export async function syncSaved(): Promise<{ list: SavedSearch[]; canAlert: boolean; limit: number } | null> {
  try {
    const sid = getSessionId();
    const local = read();
    let srv = await savedSearchesApi.list(sid);
    const pending = local.filter(s => s.id.startsWith('local-') && !srv.items.some(i => i.query === s.query));
    if (pending.length) {
      for (const s of pending) await savedSearchesApi.save(sid, s.label, s.query, s.ranked).catch(() => {});
      srv = await savedSearchesApi.list(sid);
    }
    const merged: SavedSearch[] = srv.items.map(i => { const l = local.find(x => x.query === i.query || x.id === i.id);
      return { id: i.id, label: i.label, query: i.query, ranked: i.ranked, alert: i.alert_enabled, seen: l?.seen || [], savedAt: i.created_at, viewedAt: l?.viewedAt || i.created_at }; });
    write(merged);
    return { list: merged, canAlert: srv.canAlert, limit: srv.limit };
  } catch { return null; }
}
export async function currentIds(s: SavedSearch, sessionId: string): Promise<string[]> {
  const p = new URLSearchParams(s.query);
  if (s.ranked) return (await opportunitiesApi.rankedCandidates(sessionId, p.get('zone') || undefined)).items.map(i => i.id);
  const r = await opportunitiesApi.search(searchParamsFor(p.get('q') || undefined, refineFromParams(p), { ...(p.get('trade_id') ? { trade_id: p.get('trade_id')! } : {}), limit: 40 }));
  return r.results.map(o => o.id);
}
