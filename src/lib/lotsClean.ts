// Client report (WhatsApp, 15 Oct, Saint-Cyr-en-Val fiche): "non-restricted-document",
// "Cf. le greffe du Tribunal Administratif..." and "AW Solutions" were shown as lots.
// The backend now stops producing them, but rows already stored (description "Lots : ...",
// ai_analysis_sections.presentation, ai_extracted_facts.allotment) still hold them until
// re-ingested, so the fiche also filters them at display time.

export function isJunkLot(raw: string): boolean {
  const t = String(raw || '').replace(/\s+/g, ' ').trim();
  if (t.length < 4) return true;
  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/.test(t)) return true; // code-list token
  if (/^(non[- ]?)?restricted/i.test(t)) return true;
  if (/\b(greffe|tribunal|recours|référé|refere|médiateur|mediateur)\b/i.test(t)) return true;
  if (/^cf\.?\s/i.test(t)) return true;
  if (/^(à l'adresse|a l'adresse|ci-dessus|voir |see |n\/a|néant|neant|sans objet)/i.test(t)) return true;
  return false;
}

/** "a ; b ; c" / "a · b · c" / bullet lines -> clean items. */
export function splitLots(value: string): string[] {
  return String(value || '')
    .split(/\s;\s|\s·\s|\n+/)
    .map((x) => x.replace(/^[•\-\s]+/, '').replace(/\s+/g, ' ').trim())
    .filter((x) => x && !isJunkLot(x));
}

/** Allotissement row of "Détails du dossier": junk removed, '' when nothing real is left. */
export function cleanAllotmentValue(value: string | null | undefined): string {
  return splitLots(String(value || '')).join(' · ');
}

/** Presentation text: keep the prose, rebuild the "Lots indiqués dans l'avis" bullets without junk. */
export function cleanPresentationLots(text: string | null | undefined): string {
  const s = String(text || '');
  const m = /\n\s*Lots indiqués dans l['’]avis\s*:\s*\n?([\s\S]*)$/i.exec(s);
  if (!m) return s;
  const head = s.slice(0, m.index).trim();
  // The lots block ends at the first paragraph that is not a bullet line.
  const lines = m[1].split('\n');
  const bullets: string[] = [];
  const rest: string[] = [];
  let inBullets = true;
  for (const line of lines) {
    if (inBullets && (/^\s*•/.test(line) || !line.trim())) { if (line.trim()) bullets.push(line.replace(/^\s*•\s*/, '')); continue; }
    inBullets = false;
    rest.push(line);
  }
  const kept = bullets.filter((b) => !isJunkLot(b));
  const parts = [head];
  if (kept.length) parts.push(`Lots indiqués dans l’avis :\n${kept.map((b) => `• ${b}`).join('\n')}`);
  const tail = rest.join('\n').trim();
  if (tail) parts.push(tail);
  return parts.filter(Boolean).join('\n\n');
}
