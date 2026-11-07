// « Chantiers à venir » (7 nov.) : textes et types partagés entre les pages (src/pages/ChantiersPage.tsx,
// src/pages/ChantierPage.tsx) et le pré-rendu serveur (api/prerender.ts, kind=chantiers). Données : GET /api/chantiers.
// Source : base Sitadel du SDES (permis de construire et déclarations préalables autorisés), Licence Ouverte.
// Aucune donnée personnelle : ni adresse du terrain, ni nom du demandeur.
export interface Chantier {
  id: string; path: string; category: string; categoryLabel: string; title: string; what: string; nature: string | null; permit: string;
  state: 'authorized' | 'started' | 'cancelled'; authorizedAt: string | null; startedAt: string | null; commune: string | null; postalCode: string | null;
  department: string; departmentName: string | null; floorArea: number | null; dwellings: number | null; landArea: number | null; pool: boolean; applicant: string;
  distanceKm?: number | null; phases?: { from: string; text: string } | null;
}
export interface ChantierSource { label: string; url: string }
export interface ChantiersList { results: Chantier[]; total: number; page: number; pages: number; source: ChantierSource }
export interface ChantiersStats {
  total: number; last30: number; latestAuthorization: string | null; lastImport: string | null; source: ChantierSource;
  importProgress?: { partsDone: number; partsFailed: number; partsTotal: number } | null;
  departments: { code: string; name: string; count: number }[]; categories: { slug: string; label: string; count: number }[];
}
export interface ChantierFiche extends Chantier { nearby: Chantier[]; source: ChantierSource }

export const CHANTIERS_BASE = '/chantiers-a-venir';
export const chantiersDeptPath = (code: string) => `${CHANTIERS_BASE}/departement/${code.toLowerCase()}`;
export const CHANTIER_CATEGORIES: { slug: string; label: string }[] = [
  { slug: 'maison', label: 'Maisons individuelles' }, { slug: 'logements', label: 'Logements collectifs' },
  { slug: 'bureaux_commerces', label: 'Bureaux et commerces' }, { slug: 'industrie', label: 'Industrie et entrepôts' },
  { slug: 'agricole', label: 'Agricole' }, { slug: 'public', label: 'Équipements publics' },
];
const nf = new Intl.NumberFormat('fr-FR');
export const cn = (x: number) => nf.format(x);
export const cDay = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }) : '';

export const chantiersTitle = (deptName?: string | null, dept?: string | null) => deptName
  ? `Chantiers à venir en ${deptName} (${dept}) : permis de construire | Marchés Direct`
  : 'Chantiers à venir : permis de construire autorisés | Marchés Direct';
export const chantiersH1 = (deptName?: string | null, dept?: string | null) => deptName
  ? `Chantiers à venir en ${deptName} (${dept})` : 'Chantiers à venir';
export const chantiersDescription = (total: number, deptName?: string | null) =>
  `${total > 0 ? `${cn(total)} permis de construire et déclarations préalables autorisés` : 'Les permis de construire autorisés'}${deptName ? ` en ${deptName}` : ' partout en France'} ces 12 derniers mois : maisons, logements, bureaux, commerces, bâtiments agricoles et industriels. Repérez les chantiers avant qu’ils commencent.`.slice(0, 300);
export const chantiersIntro = (deptName?: string | null) =>
  `Chaque projet autorisé${deptName ? ` en ${deptName}` : ''} est un futur chantier : gros œuvre, charpente, couverture, menuiseries, plomberie, électricité, finitions. Nous publions les permis de construire et les déclarations préalables accordés ces 12 derniers mois, avec la commune, la nature du projet et les surfaces. Les adresses et l’identité des particuliers ne sont jamais affichées.`;
export const chantierLine = (c: Chantier) => [
  c.distanceKm != null ? `à ${c.distanceKm} km` : null,
  c.commune ? `${c.commune}${c.postalCode ? ` (${c.postalCode})` : ''}` : null,
  c.floorArea ? `${cn(c.floorArea)} m²` : null,
  c.state === 'started' ? `chantier ouvert le ${cDay(c.startedAt)}` : c.authorizedAt ? `autorisé le ${cDay(c.authorizedAt)}` : null,
].filter(Boolean).join(' · ');
export const SOURCE_NOTE = 'Données publiques du SDES (ministère de la Transition écologique), base Sitadel, Licence Ouverte. Publiées environ deux mois après la décision ; un permis autorisé peut ne pas être réalisé.';
