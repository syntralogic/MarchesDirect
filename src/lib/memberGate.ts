// Portable + e-mail donnés une fois : retenu sur le téléphone.
const KEY = 'md_member';
export const isMember = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return true; } };
export const setMember = () => { try { localStorage.setItem(KEY, '1'); } catch { /* idem */ } };
/** Doit-on demander les coordonnées avant d'ouvrir cette fiche ? (fiche déjà vue = toujours libre) */
// 7 nov. (révision) : la lecture n'est plus jamais bloquée ; voir MemberGateContext (portable au premier enregistrement).
export const needsGate = (_id: string, _signedIn: boolean) => false;
