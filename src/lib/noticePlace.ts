// Lieu et état d'une annonce (recherche v2, 6 nov.) : trois informations distinctes — lieu d'exécution, adresse de
// l'acheteur, départements de publication — et un état relu dans l'avis. Une information absente reste « non précisée ».
// Utilisé par les cartes de résultats, la liste « Vos marchés » et la fiche, pour qu'une annonce dise partout la même chose.
export type ExecInfo = { status?: string | null; communes?: { name: string; department?: string | null }[] | null; departments?: string[] | null; text?: string | null };
export type PlaceFields = {
  exec_status?: string | null; exec_communes?: { name: string; department?: string | null }[] | null; exec_departments?: string[] | null; exec_text?: string | null;
  buyer_city?: string | null; buyer_department?: string | null; location_v2?: { execution: ExecInfo; buyer: { city: string | null; department: string | null } } | null;
  open_state?: string | null; deadline_checked?: string | null; location_level?: number | null;
};
const shout = (v: string) => (/[a-zà-ÿ]/.test(v) ? v : v.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase()).replace(/-(De|Du|Des|La|Le|Les|Sur|En|Et|Aux)-/g, m => m.toLowerCase()));
export function execOf(o: PlaceFields): ExecInfo | null {
  if (o.location_v2) return o.location_v2.execution;
  if (o.exec_status != null) return { status: o.exec_status, communes: o.exec_communes, departments: o.exec_departments, text: o.exec_text };
  return null;
}
/** « Lieu d’exécution : Laruns (64) » / « département 33 » / « non précisé ». Null si la donnée v2 est absente (ancienne réponse). */
export function execLabel(o: PlaceFields): string | null {
  const e = execOf(o); if (!e) return null;
  const c = (e.communes || []);
  if (c.length) return `${c.slice(0, 3).map(x => `${shout(x.name)}${x.department ? ` (${x.department})` : ''}`).join(', ')}${c.length > 3 ? ` +${c.length - 3}` : ''}`;
  if ((e.departments || []).length) return `département${(e.departments || []).length > 1 ? 's' : ''} ${(e.departments || []).slice(0, 4).join(', ')}`;
  if (e.status === 'etranger') return 'hors de France';
  return 'non précisé dans l’avis';
}
export function buyerPlace(o: PlaceFields): string | null {
  const b = o.location_v2 ? o.location_v2.buyer : { city: o.buyer_city ?? null, department: o.buyer_department ?? null };
  return b.city ? `${shout(b.city)}${b.department ? ` (${b.department})` : ''}` : null;
}
export const STATE_LABEL: Record<string, string> = { open: 'Ouverte', verify: 'Date limite à vérifier', closed: 'Clôturée', cancelled: 'Annulée', awarded: 'Attribuée' };
/** Remplace, dans un résumé déjà enregistré, une ligne « Lieu d’exécution : … » devenue fausse par le lieu relu dans l'avis. */
export function fixSummaryPlace(text: string | null | undefined, o: PlaceFields): string | null | undefined {
  const l = execLabel(o); if (!text || !l) return text;
  return text.replace(/Lieu d[’']exécution\s*:\s*[^\n]*/i, `Lieu d’exécution : ${l}.`);
}
