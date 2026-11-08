// 7 nov. (revue externe) : après une fiche, « Vos marchés » faisait perdre la recherche. La dernière liste consultée
// (adresse avec ses filtres) est gardée pour l'onglet du navigateur et sert à tous les liens « Vos marchés ».
const KEY = 'md_last_list';
// 8 nov. : gardée aussi d'une visite à l'autre (nouvel onglet, appli ouverte depuis l'écran d'accueil), pas seulement
// pour l'onglet en cours ; une liste vide (« /vos-marches » sans critère) n'efface pas la dernière vraie recherche.
export function rememberList(pathAndSearch: string) {
  try {
    sessionStorage.setItem(KEY, pathAndSearch);
    if (pathAndSearch !== '/vos-marches') localStorage.setItem(KEY, pathAndSearch);
  } catch { /* stockage indisponible */ }
}
export function lastListPath(): string {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v && v.startsWith('/vos-marches') && v !== '/vos-marches') return v;
    const l = localStorage.getItem(KEY); if (l && l.startsWith('/vos-marches')) return l;
    if (v && v.startsWith('/vos-marches')) return v;
  } catch { /* idem */ }
  return '/vos-marches';
}

// 7 nov. (fidélisation) : ce que l'artisan a déjà vu ou écarté, gardé sur le téléphone (fonction demandée par lui, pas de
// traçage) ; l'ordre de la liste en cours sert à passer à la fiche suivante ; la position de défilement est rendue au retour.
const VIEWED = 'md_viewed', HIDDEN = 'md_hidden', IDS = 'md_list_ids', SCROLL = 'md_list_scroll';
const readArr = (store: Storage | null, k: string): string[] => { try { const v = JSON.parse(store?.getItem(k) || '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; } catch { return []; } };
const writeArr = (store: Storage | null, k: string, v: string[]) => { try { store?.setItem(k, JSON.stringify(v.slice(-500))); } catch { /* idem */ } };
const ls = () => { try { return localStorage; } catch { return null; } };
const ss = () => { try { return sessionStorage; } catch { return null; } };
export const viewedIds = () => new Set(readArr(ls(), VIEWED));
export const markViewed = (id: string) => writeArr(ls(), VIEWED, [...readArr(ls(), VIEWED).filter(x => x !== id), id]);
export const hiddenIds = () => new Set(readArr(ls(), HIDDEN));
export const setHidden = (id: string, on: boolean) => writeArr(ls(), HIDDEN, [...readArr(ls(), HIDDEN).filter(x => x !== id), ...(on ? [id] : [])]);
export const rememberListIds = (ids: string[]) => writeArr(ss(), IDS, ids);
export const neighbours = (id: string): { prev: string | null; next: string | null; pos: number; total: number } => {
  const ids = readArr(ss(), IDS); const i = ids.indexOf(id);
  return i < 0 ? { prev: null, next: null, pos: 0, total: 0 } : { prev: ids[i - 1] || null, next: ids[i + 1] || null, pos: i + 1, total: ids.length };
};
// Le lot repéré sur la carte, repris sur la fiche (« Votre lot »).
export const rememberLot = (id: string, lot: string | null | undefined) => {
  if (!lot) return; try { const m = JSON.parse(ss()?.getItem('md_lots') || '{}'); m[id] = lot; ss()?.setItem('md_lots', JSON.stringify(m)); } catch { /* idem */ }
};
export const lotFor = (id: string): string | null => { try { return JSON.parse(ss()?.getItem('md_lots') || '{}')[id] || null; } catch { return null; } };
export const saveScroll = (key: string) => { try { ss()?.setItem(SCROLL, JSON.stringify({ key, y: window.scrollY })); } catch { /* idem */ } };
export const takeScroll = (key: string): number | null => {
  try { const v = JSON.parse(ss()?.getItem(SCROLL) || 'null'); if (v && v.key === key && typeof v.y === 'number') { ss()?.removeItem(SCROLL); return v.y; } } catch { /* idem */ }
  return null;
};
/** Les dernières fiches ouvertes, la plus récente d'abord. */
export const recentViewed = (n: number) => readArr(ls(), VIEWED).slice(-n).reverse();
