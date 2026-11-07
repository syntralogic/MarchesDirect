import { viewedIds } from './lastList';
// 7 nov. : 10 fiches libres, puis portable + e-mail (une fois, retenu sur le téléphone). Les robots des moteurs de recherche
// ne gardent rien d'une visite à l'autre : ils lisent toujours la fiche entière (pages pré-rendues côté serveur).
export const FREE_FICHES = 10;
const KEY = 'md_member';
export const isMember = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return true; } };
export const setMember = () => { try { localStorage.setItem(KEY, '1'); } catch { /* idem */ } };
/** Doit-on demander les coordonnées avant d'ouvrir cette fiche ? (fiche déjà vue = toujours libre) */
export const needsGate = (id: string, signedIn: boolean) => {
  if (signedIn || isMember()) return false;
  const seen = viewedIds();
  return !seen.has(id) && seen.size >= FREE_FICHES;
};
