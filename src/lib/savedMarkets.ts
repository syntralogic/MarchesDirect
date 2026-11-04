// "Marché enregistré" (client brief v26, 3.10 and 1.6): the visitor saves a market ON THIS PHONE, localStorage only, no
// network call, no contact detail. The "Enregistrer" button of the fiche writes here; the home banner reads here.
export type SavedMarket = { id: string; title?: string; siret?: string | null; savedAt: number };
const KEY = 'md_saved_markets';

export function getSavedMarkets(): SavedMarket[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((m): m is SavedMarket => !!m && typeof m.id === 'string' && typeof m.savedAt === 'number')
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch { return []; }
}

export function saveMarket(m: Omit<SavedMarket, 'savedAt'>): void {
  try {
    const rest = getSavedMarkets().filter(x => x.id !== m.id);
    localStorage.setItem(KEY, JSON.stringify([{ ...m, savedAt: Date.now() }, ...rest].slice(0, 20)));
  } catch { /* storage unavailable: nothing saved, nothing promised */ }
}

export function unsaveMarket(id: string): void {
  try { localStorage.setItem(KEY, JSON.stringify(getSavedMarkets().filter(x => x.id !== id))); } catch { /* ignore */ }
}
