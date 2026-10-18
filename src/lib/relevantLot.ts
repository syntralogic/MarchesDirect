// "Le lot qui vous concerne" (client brief 18 Oct, point 3): with fifteen lots, the artisan must see at once which one
// is his. The lot is matched against signals we really have - the métier he searched, the opportunity's own trade and
// its matched trades - never guessed. Accent/case-insensitive, matched on word stems (électricien/électricité/électrique).

const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'au', 'aux', 'un', 'une', 'pour', 'sur', 'dans', 'lot', 'lots', 'travaux', 'tous', 'corps', 'etat', 'divers', 'autres', 'generaux', 'general', 'prestations', 'service', 'services', 'fourniture', 'fournitures', 'installation', 'installations']);

const fold = (s: string) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const words = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(w => w.length >= 3 && !STOP.has(w));
// 6-letter stem: "electricien", "electricite", "electrique" -> "electr"; short acronyms (cvc, vrd) stay whole.
const stem = (w: string) => (w.length <= 5 ? w : w.slice(0, 6));

// Trade abbreviations used in lot titles (CVC = chauffage, ventilation, climatisation; PLB = plomberie/sanitaire;
// CFO/CFA = courants forts/faibles = électricité) expand to the stems a searcher would type.
const ABBREV: Record<string, string[]> = { cvc: ['climat', 'chauff', 'ventil'], plb: ['plomb', 'sanit'], cfo: ['electr'], cfa: ['electr'] };
const lotStems = (text: string): string[] => words(text).flatMap(w => [stem(w), ...(ABBREV[w] || [])]);

export interface RelevantLots { matched: string[]; total: number; others: number }

export function pickRelevantLots(lots: string[], signals: Array<string | null | undefined>): RelevantLots {
  const total = lots.length;
  const keys = new Set<string>();
  for (const sig of signals) for (const w of words(sig || '')) keys.add(stem(w));
  if (!keys.size || total < 2) return { matched: [], total, others: total };
  const matched = lots.filter(l => lotStems(l).some(k => keys.has(k)));
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

// Relation between the visitor and the lots of a notice, for the chargé d'affaires text (cahier §6/§8):
//   match   - a lot is about his trade;  partial - the lot is mixed (several trades) and only part of it matches;
//   none    - lots exist, we know his activity, and no lot matches;  unknown - not enough signal to say.
export interface LotInfo { lot: string | null; total: number; relation: 'match' | 'partial' | 'none' | 'unknown' }

export function lotInfo(lots: string[], signals: Array<string | null | undefined>, activityKnown: boolean): LotInfo {
  const total = lots.length;
  if (total < 2) return { lot: lots[0] || null, total, relation: 'unknown' };
  const { matched } = pickRelevantLots(lots, signals);
  if (!matched.length) return { lot: null, total, relation: activityKnown ? 'none' : 'unknown' };
  const lot = matched[0];
  const keys = new Set<string>();
  for (const sig of signals) for (const w of words(sig || '')) keys.add(stem(w));
  // « Peinture - nettoyage »: cleaning bundled with the finishing work is not a second trade (client example).
  const parts = lot.split(/\s[-–/&]\s|\s+et\s+|,|;/).map(p => p.trim()).filter(p => words(p).length > 0 && !words(p).every(w => ['nettoy', 'divers', 'autres'].includes(stem(w))));
  const partsHit = parts.filter(p => lotStems(p).some(k => keys.has(k))).length;
  return { lot, total, relation: parts.length >= 2 && partsHit < parts.length ? 'partial' : 'match' };
}
