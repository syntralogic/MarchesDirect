// Client audit (25 Sep): the guided journey's keyword suggestions
// (OpportunityJourneyPage.tsx) lived as a page-local hardcoded list with no
// accent-folding and no synonym awareness ("elec" didn't match
// "Électricité", "fenêtre" matched nothing at all - see searchQuery.ts's
// TRADE_KEYWORD_SYNONYMS for the backend's equivalent référentiel). The
// direct search page (RecherchePage.tsx) had no suggestion/autocomplete
// feature at all. Extracted to one shared file so both pages search the
// exact same list/synonyms instead of two copies drifting apart.

export const TRADE_SUGGESTIONS = [
  'Climatisation', 'Chauffage / CVC', 'Installation et maintenance de climatisation',
  'Peinture', 'Électricité', 'Plomberie', 'Plomberie sanitaire', 'Chauffage / plomberie',
  'Menuiserie', 'Maçonnerie', 'Couverture / Toiture',
  'Étanchéité', 'Serrurerie / Métallerie', 'Isolation thermique', 'Cloisons / Doublages',
  'Revêtement de sols', 'Nettoyage de chantier', 'Espaces verts',
  'Rénovation énergétique', 'Rénovation intérieure', 'Réhabilitation de bâtiments',
  'Construction neuve', 'Aménagement extérieur',
];

// Same accent/case fold RecherchePage.tsx's location field already uses
// (normalizeFr) - duplicated here rather than imported from there, since
// that one is page-local by its own comment; this file is the shared,
// canonical copy for trade-suggestion matching specifically.
export function normalizeFr(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Trimmed-down copy of the backend's métier synonym/abbreviation
// référentiel (searchQuery.ts's TRADE_KEYWORD_SYNONYMS), limited to the
// entries relevant to the suggestions list above, so "elec"/"fenêtre" find
// "Électricité"/"Menuiserie" the same way the backend search already does.
export const TRADE_SUGGESTION_SYNONYMS: Record<string, string[]> = {
  elec: ['electricite'],
  electricien: ['electricite'],
  clim: ['climatisation'],
  cvc: ['climatisation', 'chauffage', 'ventilation'],
  vmc: ['ventilation'],
  couvreur: ['toiture', 'couverture'],
  toiture: ['couverture'],
  macon: ['maconnerie'],
  plombier: ['plomberie'],
  chauffagiste: ['chauffage'],
  menuisier: ['menuiserie'],
  fenetre: ['menuiserie'],
  fenetres: ['menuiserie'],
};

const normalizedTradeSuggestions = TRADE_SUGGESTIONS.map((s) => normalizeFr(s));

/** Filters TRADE_SUGGESTIONS against a raw query, accent-folded and synonym-aware. */
export function matchTradeSuggestions(query: string, limit: number): string[] {
  const q = normalizeFr(query);
  if (!q) return TRADE_SUGGESTIONS.slice(0, limit);
  // Client audit (25 Sep): typing "fen" (a genuine prefix of "fenetre"/
  // "fenetres") returned nothing - only the full word matched, because
  // this only ever did an exact lookup. Same fix as the backend's
  // searchQuery.ts synonymsOf: a short (>=3 char) fragment that's a
  // prefix of one or more référentiel keys resolves to the union of
  // those keys' synonyms too, same as typing the full word would.
  const exactSynonymTerms = TRADE_SUGGESTION_SYNONYMS[q] || [];
  const prefixSynonymTerms = q.length >= 3
    ? Object.keys(TRADE_SUGGESTION_SYNONYMS)
        .filter((k) => k.startsWith(q))
        .flatMap((k) => TRADE_SUGGESTION_SYNONYMS[k])
    : [];
  const synonymTerms = Array.from(new Set([...exactSynonymTerms, ...prefixSynonymTerms]));
  return TRADE_SUGGESTIONS
    .filter((_, i) => {
      const normalized = normalizedTradeSuggestions[i];
      if (normalized.includes(q)) return true;
      return synonymTerms.some((term) => normalized.includes(term));
    })
    .slice(0, limit);
}

// Client audit (26 Sep, point 9): "climatisation" (typed) finds 67 results,
// but clicking the suggestion offered for it, "Installation et maintenance
// de climatisation", finds 0. Cause: the search backend AND-matches a
// multi-word query (every word must independently appear in a notice - see
// utils/searchQuery.ts on the backend), which is right for something a
// visitor actually typed, but this suggestion is a natural-language
// descriptive phrase, not a search term - almost no real notice literally
// contains "installation" AND "maintenance" AND "climatisation" all at
// once. Maps a suggestion whose display text is such a phrase to a short
// term that actually finds the trade's notices; anything not listed here
// is already a single searchable term/pairing and is used as-is, unchanged.
const TRADE_SUGGESTION_SEARCH_TERM: Record<string, string> = {
  'Installation et maintenance de climatisation': 'Climatisation',
};

export function searchTermForSuggestion(display: string): string {
  return TRADE_SUGGESTION_SEARCH_TERM[display] || display;
}
