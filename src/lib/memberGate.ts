import { viewedIds } from './lastList';
// 7 nov. (décision de Hedi : « laisser mûrir le visiteur ») : rien n'est demandé tant que l'artisan découvre le site.
// À 20 fiches ouvertes ET au moins 2 jours de visite : demande douce (« Plus tard » possible, redemandée le lendemain).
// À 30 fiches ET au moins 3 jours de visite : portable + e-mail nécessaires pour ouvrir de NOUVELLES fiches (celles déjà vues restent libres).
// Enregistrer une annonce ou une recherche reste libre. Seuils à ajuster selon les chiffres réels.
export const SOFT_AT = 20, HARD_AT = 30, SOFT_DAYS = 2, HARD_DAYS = 3;
const KEY = 'md_member', DAYS = 'md_visit_days', LATER = 'md_gate_later';
const today = () => new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } };
export const isMember = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return true; } };
export const setMember = () => write(KEY, '1');
/** Note le jour de visite (au plus 60 jours gardés). */
export function noteVisitDay() {
  let days: string[] = []; try { days = JSON.parse(read(DAYS) || '[]'); } catch { days = []; }
  if (!days.includes(today())) write(DAYS, JSON.stringify([...days, today()].slice(-60)));
}
const visitDays = () => { try { return (JSON.parse(read(DAYS) || '[]') as string[]).length; } catch { return 1; } };
export const later = () => write(LATER, today());
/** 'none' | 'soft' (avec « Plus tard ») | 'hard' pour cette fiche. Une fiche déjà vue est toujours libre. */
export function needsGate(id: string, signedIn: boolean): 'none' | 'soft' | 'hard' {
  if (signedIn || isMember()) return 'none';
  const seen = viewedIds();
  if (seen.has(id)) return 'none';
  const days = visitDays();
  if (seen.size >= HARD_AT && days >= HARD_DAYS) return 'hard';
  if (seen.size >= SOFT_AT && days >= SOFT_DAYS && read(LATER) !== today()) return 'soft';
  return 'none';
}
