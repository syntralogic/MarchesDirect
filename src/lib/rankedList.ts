import type { PlaceFields } from './noticePlace';
// Écran 2 « Vos marchés » (maquette v26): pure rules for ranking, filters and card texts. No network, no AI.
export type Tone = 'hi' | 'mid' | 'lo';
export type Filter = 'all' | Tone;

export interface RankedCard extends PlaceFields {
  id: string;
  title: string;
  journey: string | null;
  buyer_name: string | null;
  location_city: string | null;
  location_department: string | null;
  deadline: string | null;
  estimated_value?: number | null;
  distance_km?: number | null;
  matched_lot?: string | null; // 7 nov. : le lot qui correspond au métier ou à la recherche
}
// undefined = still being computed, null = the engine cannot compare yet ("à confirmer"), number = percentage
export type ScoreMap = Record<string, number | null | undefined>;

export const toneOf = (s: number): Tone => (s >= 70 ? 'hi' : s >= 40 ? 'mid' : 'lo');
export const labelOf = (s: number) => (s >= 70 ? 'Très adapté' : s >= 40 ? 'À étudier' : 'Peu adapté');
export const TYPE_LABEL: Record<string, string> = { public_procurement: 'MARCHÉ PUBLIC', tender: 'APPEL D’OFFRES PRIVÉ', subcontracting: 'SOUS-TRAITANCE' };

const time = (d: string | null) => (d ? new Date(d).getTime() : Number.POSITIVE_INFINITY);

// Percentage descending, then deadline ascending. A market whose percentage is not known yet (or not computable)
// goes after the ones that have one, in deadline order, so nothing jumps while the percentages arrive.
export function rank(cards: RankedCard[], scores: ScoreMap): RankedCard[] {
  return [...cards].sort((a, b) => {
    const sa = typeof scores[a.id] === 'number' ? (scores[a.id] as number) : -1;
    const sb = typeof scores[b.id] === 'number' ? (scores[b.id] as number) : -1;
    if (sa !== sb) return sb - sa;
    return time(a.deadline) - time(b.deadline);
  });
}

export function counts(cards: RankedCard[], scores: ScoreMap): Record<Filter, number> {
  const c: Record<Filter, number> = { all: cards.length, hi: 0, mid: 0, lo: 0 };
  for (const card of cards) { const s = scores[card.id]; if (typeof s === 'number') c[toneOf(s)]++; }
  return c;
}

export function applyFilter(cards: RankedCard[], scores: ScoreMap, f: Filter): RankedCard[] {
  if (f === 'all') return cards;
  return cards.filter(c => { const s = scores[c.id]; return typeof s === 'number' && toneOf(s) === f; });
}

// Whole calendar days left in Europe/Paris; negative once passed.
export function daysLeft(deadline: string | null, now: Date = new Date()): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  const day = (x: Date) => {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(x);
    return Date.UTC(+p.slice(0, 4), +p.slice(5, 7) - 1, +p.slice(8, 10)) / 86400000;
  };
  return Math.round(day(d) - day(now));
}
export const isClosingSoon = (deadline: string | null, now?: Date) => { const n = daysLeft(deadline, now); return n != null && n >= 0 && n <= 7; };

export function titleFor(total: number, known: boolean, trade?: string | null, zone?: string): { title: string; sub: string } {
  const n = `${total} marché${total > 1 ? 's' : ''}`;
  return known
    ? { title: `${n} correspond${total > 1 ? 'ent' : ''} à votre entreprise`, sub: 'Classés du plus adapté au moins adapté · mis à jour aujourd’hui' }
    : { title: `${n}${trade ? ` · ${trade}` : ''} · ${zone || 'Toute la France'}`, sub: 'Indiquez votre entreprise (nom ou SIRET) pour voir le pourcentage de chaque marché' };
}

// The three best percentages, for the ranked_list_shown event.
export const topScores = (scores: ScoreMap, n = 3): number[] =>
  Object.values(scores).filter((s): s is number => typeof s === 'number').sort((a, b) => b - a).slice(0, n);

// Runs `worker` over `items` with at most `limit` in flight, calling `onEach` as each one finishes.
export async function mapLimit<T>(items: T[], limit: number, worker: (x: T) => Promise<void>, shouldStop: () => boolean = () => false) {
  let i = 0;
  const run = async () => { while (i < items.length && !shouldStop()) { const x = items[i++]; await worker(x); } };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
}
