import { opportunitiesApi } from '@/lib/apiClient';
import { refineFromParams, searchParamsFor } from '@/components/liste/RefinePanel';

// « Sauvegarder ma recherche » (5 nov., le code Le Bon Coin) : gardée sur ce téléphone. Les « nouveaux » sont les
// marchés apparus depuis la dernière consultation de cette recherche : calculés en relançant la même recherche,
// jamais estimés.
export type SavedSearch = { id: string; label: string; query: string; ranked: boolean; seen: string[]; savedAt: string; viewedAt: string };
const KEY = 'md_saved_searches';
const read = (): SavedSearch[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const write = (l: SavedSearch[]) => { try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, 12))); } catch { /* stockage indisponible */ } };
export const listSaved = read;
export const isSaved = (query: string) => read().some(s => s.query === query);
export function saveSearch(label: string, query: string, ranked: boolean, ids: string[]) {
  const now = new Date().toISOString();
  write([{ id: `${Date.now()}`, label, query, ranked, seen: ids.slice(0, 200), savedAt: now, viewedAt: now }, ...read().filter(s => s.query !== query)]);
}
export const removeSearch = (id: string) => write(read().filter(s => s.id !== id));
export function markViewed(query: string, ids: string[]) {
  const l = read(); const s = l.find(x => x.query === query); if (!s) return;
  s.seen = [...new Set([...ids, ...s.seen])].slice(0, 300); s.viewedAt = new Date().toISOString(); write(l);
}
export async function currentIds(s: SavedSearch, sessionId: string): Promise<string[]> {
  const p = new URLSearchParams(s.query);
  if (s.ranked) return (await opportunitiesApi.rankedCandidates(sessionId, p.get('zone') || undefined)).items.map(i => i.id);
  const r = await opportunitiesApi.search(searchParamsFor(p.get('q') || undefined, refineFromParams(p), { ...(p.get('trade_id') ? { trade_id: p.get('trade_id')! } : {}), limit: 40 }));
  return r.results.map(o => o.id);
}
