// 7 nov. (revue externe) : après une fiche, « Vos marchés » faisait perdre la recherche. La dernière liste consultée
// (adresse avec ses filtres) est gardée pour l'onglet du navigateur et sert à tous les liens « Vos marchés ».
const KEY = 'md_last_list';
export function rememberList(pathAndSearch: string) {
  try { sessionStorage.setItem(KEY, pathAndSearch); } catch { /* stockage indisponible */ }
}
export function lastListPath(): string {
  try { const v = sessionStorage.getItem(KEY); if (v && v.startsWith('/vos-marches')) return v; } catch { /* idem */ }
  return '/vos-marches';
}
