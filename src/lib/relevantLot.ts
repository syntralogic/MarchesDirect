// "Le lot qui vous concerne" (client brief 18 Oct, point 3): with fifteen lots, the artisan must see at once which one
// is his. The lot is matched against signals we really have - the métier he searched, the opportunity's own trade and
// its matched trades - never guessed. Accent/case-insensitive, matched on word stems (électricien/électricité/électrique).

const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'au', 'aux', 'un', 'une', 'pour', 'sur', 'dans', 'lot', 'lots', 'travaux', 'tous', 'corps', 'etat', 'divers', 'autres', 'generaux', 'general', 'prestations', 'service', 'services', 'fourniture', 'fournitures', 'installation', 'installations']);

const fold = (s: string) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const words = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP.has(w));
// 6-letter stem: "electricien", "electricite", "electrique" -> "electr"; short acronyms (cvc, vrd) stay whole.
const stem = (w: string) => (w.length <= 5 ? w : w.slice(0, 6));

export interface RelevantLots { matched: string[]; total: number; others: number }

export function pickRelevantLots(lots: string[], signals: Array<string | null | undefined>): RelevantLots {
  const total = lots.length;
  const keys = new Set<string>();
  for (const sig of signals) for (const w of words(sig || '')) keys.add(stem(w));
  if (!keys.size || total < 2) return { matched: [], total, others: total };
  const matched = lots.filter(l => words(l).some(w => keys.has(stem(w))));
  return { matched: matched.slice(0, 3), total, others: total - Math.min(matched.length, 3) };
}

// Lots of a notice: the analysis' allotment when present, else the "Lots : a ; b ; c" line of the source text.
export function lotsFrom(allotment: string[] | null | undefined, description: string | null | undefined, split: (v: string) => string[]): string[] {
  if (allotment && allotment.length) return allotment;
  const m = /(?:^|\n)\s*Lots\s*:\s*([\s\S]+)$/.exec(String(description || ''));
  return m ? split(m[1]) : [];
}

const KEY = 'md_last_search_q';
export const rememberSearchedTrade = (q: string) => { try { if (q.trim()) sessionStorage.setItem(KEY, q.trim()); } catch { /* storage unavailable */ } };
export const recallSearchedTrade = (): string => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } };
