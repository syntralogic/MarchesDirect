// 7 nov. : chaque favori a une étape et une note personnelle, gardées sur ce téléphone (privées, jamais envoyées).
export const STAGES = [
  { key: 'look', label: 'À regarder' }, { key: 'interest', label: 'M’intéresse' },
  { key: 'team', label: 'À voir avec l’équipe' }, { key: 'entrusted', label: 'Confié à Marchés Direct' },
] as const;
export type StageKey = typeof STAGES[number]['key'];
export type FavMeta = { stage: StageKey; note: string };
const KEY = 'md_fav_meta';
const all = (): Record<string, FavMeta> => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
export const metaOf = (id: string): FavMeta => all()[id] || { stage: 'look', note: '' };
export function setMeta(id: string, patch: Partial<FavMeta>) {
  const m = all(); m[id] = { ...metaOf(id), ...patch, note: String(patch.note ?? metaOf(id).note).slice(0, 500) };
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* stockage indisponible */ }
}
