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
  const synonymTerms = TRADE_SUGGESTION_SYNONYMS[q] || [];
  return TRADE_SUGGESTIONS
    .filter((_, i) => {
      const normalized = normalizedTradeSuggestions[i];
      if (normalized.includes(q)) return true;
      return synonymTerms.some((term) => normalized.includes(term));
    })
    .slice(0, limit);
}
