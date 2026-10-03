// Client-facing reference for an opportunity (DEV-10 / EDIT-03).
// Some rows carry an internal identifier in source_reference (editorial
// catalogue seeds "editorial-<key>", demo rows "DEMO-..."). Those must not be
// shown to visitors: we show a short stable "MD-XXXXXXXX" derived from the row
// id instead. The raw source_reference stays in the data (traceability, leads).
const INTERNAL_PREFIX = /^(editorial-|demo-)/i;

export function publicReference(opp: { id?: string | null; source_reference?: string | null }): string | null {
  const ref = (opp.source_reference || '').trim();
  if (ref && !INTERNAL_PREFIX.test(ref)) return ref;
  if (!ref && !opp.id) return null;
  if (!opp.id) return null;
  return `MD-${String(opp.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}`;
}
