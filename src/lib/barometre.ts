// Baromètre des marchés publics (6 nov.) : textes et types partagés entre la page (src/pages/BarometrePage.tsx) et le
// pré-rendu serveur (api/prerender.ts). Données : GET /api/seo/v2/barometre (état du jour, mis à jour toutes les 15 min).

export interface Barometre {
  generatedAt: string;
  scope: string;
  national: { open: number; published30: number; withEstimatedValue: number; medianEstimatedValue: number | null;
    horizon: { under7: number; d7to14: number; d15to30: number; over30: number }; openWithoutPlace: number; openWithoutTrade: number };
  departments: { code: string; name: string; open: number; published30: number; topBuyers: { name: string; count: number }[]; topTrades: { name: string; count: number }[] }[];
  trades: { slug: string; name: string; open: number; published30: number; topDepartments: { code: string; name: string; count: number }[] }[];
}

export const BARO_PATH = '/barometre-marches-publics';
const nf = new Intl.NumberFormat('fr-FR');
export const n = (x: number) => nf.format(x);
export const euros = (x: number) => `${nf.format(x)} € HT`;
export const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : '—');
export const baroDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
export const baroTime = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

export const baroTitle = (b: Barometre) => `Baromètre des marchés publics : ${n(b.national.open)} consultations ouvertes (${baroDate(b.generatedAt)}) | Marchés Direct`;
export const baroDescription = (b: Barometre) =>
  `${n(b.national.open)} marchés publics ouverts en France au ${baroDate(b.generatedAt)}, ${n(b.national.published30)} publiés en 30 jours. Classement des départements et des métiers, mis à jour chaque jour, méthode publiée.`;

export const BARO_METHOD: string[] = [
  'Périmètre : les avis de marchés publics rassemblés par Marchés Direct (BOAMP, JOUE/TED pour la France et plateformes importées), hors exemples de démonstration. Un avis modifié par un rectificatif peut encore être compté en plus de son rectificatif : l’écart est faible mais existe.',
  '« Ouverte » : la date limite de réponse, relue dans l’avis à l’heure de Paris, n’est pas encore passée. Les consultations signalées comme annulées par la source et celles sans date limite connue ne sont pas comptées comme ouvertes.',
  '« Publiée sur 30 jours » : date de publication indiquée par la source dans les 30 derniers jours, que la consultation soit encore ouverte ou non.',
  'Département : celui du lieu d’exécution indiqué dans l’avis ; à défaut, celui de l’acheteur. Une consultation exécutée dans plusieurs départements compte dans chacun d’eux.',
  'Métier : reconnu dans l’intitulé de l’avis. Une partie des consultations n’a pas de métier reconnu ; leur nombre est indiqué. Le classement par métier est donc une indication, pas un recensement complet.',
  'Montant médian : calculé uniquement sur les consultations ouvertes dont l’acheteur a publié un montant estimé (leur nombre est indiqué). Ce montant peut être une estimation ou un plafond.',
  'Les chiffres sont recalculés environ toutes les 15 minutes. Le BOAMP est publié par la DILA sous Licence Ouverte ; les avis européens (TED) sont publiés par l’Office des publications de l’Union européenne et réutilisables.',
];
