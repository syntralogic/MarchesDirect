// Pages acheteurs (7 nov.) : textes et types partagés entre la page (src/pages/AcheteurPage.tsx) et le pré-rendu
// serveur (api/prerender.ts, kind=acheteur). Données : GET /api/seo/v2/acheteur/:slug.
export interface BuyerCard { id: string; title: string; journey: string; state: 'open' | 'verify' | 'closed'; deadline: string | null; publishedAt: string | null;
  reference: string | null; trades: { slug: string; name: string }[]; place: string | null; path: string }
export interface BuyerData {
  slug: string; name: string; dept: string | null; deptName: string | null; city: string | null; indexable: boolean; generatedAt: string; lastmod: string;
  counts: { open: number; verify: number; closed: number; total: number; withValue: number };
  open: BuyerCard[]; verify: BuyerCard[]; closed: BuyerCard[];
  topTrades: { slug: string; name: string; count: number }[];
  otherBuyers: { slug: string; name: string; open: number; total: number }[];
}
export const BUYERS_BASE = '/acheteurs';
export const buyerPath = (slug: string) => `${BUYERS_BASE}/${slug}`;
const nf = new Intl.NumberFormat('fr-FR');
export const frDay = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }) : '';
const where = (b: BuyerData) => b.deptName ? ` (${b.deptName}, ${b.dept})` : '';
export const buyerTitle = (b: BuyerData) => {
  const t = `${b.name} : marchés publics et appels d’offres`;
  return `${t.length > 70 ? b.name.slice(0, 55) + '… : marchés publics' : t} | Marchés Direct`;
};
export const buyerDescription = (b: BuyerData) => {
  const lead = b.counts.open > 0 ? `${nf.format(b.counts.open)} consultation${b.counts.open > 1 ? 's' : ''} ouverte${b.counts.open > 1 ? 's' : ''}` : 'Aucune consultation ouverte aujourd’hui';
  return `${b.name}${where(b)} : ${lead}, ${nf.format(b.counts.total)} consultations publiées en 6 mois. Dates limites, lieux, métiers, et alerte pour ses prochains marchés.`.slice(0, 300);
};
export const buyerIntro = (b: BuyerData) =>
  `Les marchés publics publiés par ${b.name}${where(b)} : consultations ouvertes avec leur date limite, puis les consultations des six derniers mois. Données issues des avis officiels (BOAMP, Journal officiel de l’Union européenne), mises à jour plusieurs fois par jour.`;
export const n = (x: number) => nf.format(x);
