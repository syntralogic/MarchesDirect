// Textes des pages locales SEO (5 nov.), partagés par le pré-rendu serveur (api/prerender.ts) et la page React
// (SeoLocalPage) pour que robots et visiteurs lisent EXACTEMENT la même chose. Sans dépendance : importable des deux côtés.
// Tous les chiffres viennent de /api/seo/v2/page (annonces réellement ouvertes, compteurs = liste affichée).

export type SeoItem = { id: string; title: string; city: string | null; department: string | null; deadline: string | null; buyer: string | null;
  reference: string | null; estimatedValue: number | null; trades: string[]; path: string };
export type SeoV2Page = {
  status: 200; journey: 'public_procurement' | 'tender' | 'subcontracting'; base: string;
  zone: { type: 'city' | 'department'; slug: string; name: string; department: string | null; departmentName: string | null };
  trade: { slug: string; name: string } | null; canonicalPath: string; indexable: boolean; indexReason: string;
  count: number; items: SeoItem[]; nearbyCount: number; nearby: SeoItem[];
  trades: { slug: string; name: string; count: number }[]; cities: { slug: string; name: string; count: number }[];
  buyers: { name: string; count: number }[]; otherTypes: { base: string; journey: string; count: number }[];
  nextDeadline: string | null; lastmod: string | null; generatedAt: string;
};

export const SEO_LABEL: Record<string, string> = { public_procurement: 'Marchés publics', tender: 'Appels d’offres privés', subcontracting: 'Sous-traitance' };
const NOUN: Record<string, [string, string]> = {
  public_procurement: ['consultation ouverte', 'consultations ouvertes'],
  tender: ['appel d’offres ouvert', 'appels d’offres ouverts'],
  subcontracting: ['mission ouverte', 'missions ouvertes'],
};
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const paris = (iso: string) => new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
export const seoDate = (iso: string | null | undefined): string | null => {
  if (!iso) return null; const d = paris(iso); if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
};
export const seoMonth = (iso: string) => { const d = paris(iso); return `${MOIS[d.getMonth()]} ${d.getFullYear()}`; };
export const countText = (journey: string, n: number) => `${n} ${NOUN[journey][n > 1 ? 1 : 0]}`;

export const zoneLabel = (p: SeoV2Page) => (p.zone.type === 'city' ? p.zone.name : `${p.zone.name} (${p.zone.department})`);
const zoneIn = (p: SeoV2Page) => (p.zone.type === 'city' ? `à ${p.zone.name}` : `dans le département ${p.zone.name} (${p.zone.department})`);
const tradeIn = (p: SeoV2Page) => (p.trade ? ` ${p.trade.name.toLowerCase() === 'cvc' ? 'CVC (chauffage, ventilation, climatisation)' : p.trade.name.toLowerCase()}` : '');

export function seoTitle(p: SeoV2Page): string {
  const what = `${SEO_LABEL[p.journey]}${p.trade ? ` ${p.trade.name}` : ''}`;
  const where = p.zone.type === 'city' ? `à ${p.zone.name}` : zoneLabel(p);
  return p.count > 0
    ? `${what} ${where} : ${countText(p.journey, p.count)} (${seoMonth(p.generatedAt)}) | Marchés Direct`
    : `${what} ${where} | Marchés Direct`;
}
export function seoH1(p: SeoV2Page): string {
  return `${SEO_LABEL[p.journey]}${tradeIn(p)} ${p.zone.type === 'city' ? `à ${p.zone.name}` : `— ${zoneLabel(p)}`}`;
}
export function seoDescription(p: SeoV2Page): string {
  const next = seoDate(p.nextDeadline);
  if (p.count > 0) return `${countText(p.journey, p.count)}${tradeIn(p)} ${zoneIn(p)}${next ? `, prochaine date limite le ${next}` : ''}. Acheteur, date limite et lien vers chaque avis ; vérifiez gratuitement si le marché correspond à votre entreprise.`.slice(0, 300);
  return `Aucune ${NOUN[p.journey][0].split(' ')[0]}${tradeIn(p)} n’est ouverte ${zoneIn(p)} aujourd’hui. Consultez les autres annonces du département et soyez prévenu des prochaines.`;
}
/** Introduction construite à partir des données de la zone (jamais un texte où seul le nom de ville change). */
export function seoIntro(p: SeoV2Page): string[] {
  const out: string[] = [];
  const asOf = seoDate(p.generatedAt);
  if (p.count > 0) {
    out.push(`Au ${asOf}, Marchés Direct recense ${countText(p.journey, p.count)}${tradeIn(p)} ${zoneIn(p)}${p.zone.type === 'city' ? ' (acheteurs dont l’adresse est dans la commune ; le lieu d’exécution précis figure dans chaque avis)' : ''}.`);
    const next = seoDate(p.nextDeadline); if (next) out.push(`La prochaine date limite de réponse est le ${next}.`);
    if (p.buyers.length) out.push(`${p.journey === 'public_procurement' ? 'Acheteurs publics' : 'Donneurs d’ordre'} les plus actifs : ${p.buyers.slice(0, 3).map(b => `${b.name} (${b.count})`).join(', ')}.`);
    if (!p.trade && p.trades.length) out.push(`Métiers les plus représentés : ${p.trades.slice(0, 4).map(t => `${t.name} (${t.count})`).join(', ')}.`);
  } else {
    out.push(`Aucune ${NOUN[p.journey][0]}${tradeIn(p)} ${zoneIn(p)} au ${asOf}. Les annonces sont mises à jour chaque jour ; cette page affichera les prochaines dès leur publication.`);
  }
  if (p.zone.type === 'city' && p.nearbyCount > 0 && p.zone.departmentName) out.push(`Autres annonces du département ${p.zone.departmentName} (${p.zone.department}) : ${countText(p.journey, p.nearbyCount)}. L’acheteur y est situé dans une autre commune, ou sa commune n’est pas précisée : liste à part ci-dessous.`);
  return out;
}
export function seoFaq(p: SeoV2Page): { q: string; a: string }[] {
  const where = zoneIn(p);
  if (p.journey === 'public_procurement') return [
    { q: `Comment répondre à un marché public ${where} ?`, a: 'Téléchargez le dossier de consultation (DCE) sur le profil d’acheteur indiqué dans l’avis, lisez le règlement de la consultation, préparez les pièces de candidature (DC1 et DC2 ou DUME, attestations, références) et votre offre, puis déposez le tout en ligne avant la date et l’heure limites.' },
    { q: 'Une petite entreprise ou un artisan peut-il candidater ?', a: 'Oui. Les marchés sont souvent découpés en lots pour permettre aux petites entreprises de répondre seules, ou en groupement avec d’autres entreprises.' },
    { q: 'Que fait Marchés Direct ?', a: 'Nous rassemblons les avis publiés, calculons gratuitement la correspondance avec votre entreprise à partir de son SIRET, et préparons un dossier prérempli. Elena, chargée de relation, peut vous accompagner jusqu’au dépôt.' },
  ];
  if (p.journey === 'subcontracting') return [
    { q: `Comment trouver des chantiers en sous-traitance ${where} ?`, a: 'Les entreprises générales titulaires de marchés recherchent des partenaires par lot. Chaque mission publiée ici indique le métier, le lieu et la date limite ; vous pouvez proposer vos services directement.' },
    { q: 'Comment être payé en sous-traitance d’un marché public ?', a: 'La loi du 31 décembre 1975 impose que l’acheteur public accepte le sous-traitant et agrée ses conditions de paiement (formulaire DC4). Au-delà de 600 € TTC, le sous-traitant est payé directement par l’acheteur.' },
  ];
  return [
    { q: `Qu’est-ce qu’un appel d’offres privé ${where} ?`, a: 'C’est une consultation lancée par un maître d’ouvrage privé (copropriété, entreprise, promoteur). Le Code de la commande publique ne s’applique pas : le contrat signé fixe les conditions, d’où l’importance du devis et des conditions de paiement.' },
  ];
}
export function seoBreadcrumb(p: SeoV2Page): { name: string; path: string }[] {
  const b = [{ name: 'Accueil', path: '/' }, { name: SEO_LABEL[p.journey], path: `/${p.base}` }];
  if (p.zone.department && (p.zone.type === 'city' || p.trade)) b.push({ name: `${p.zone.departmentName || p.zone.department} (${p.zone.department})`, path: `/${p.base}/departement/${p.zone.department.toLowerCase()}` });
  if (p.zone.type === 'city') b.push({ name: p.zone.name, path: `/${p.base}/${p.zone.slug}` });
  if (p.trade) b.push({ name: p.trade.name, path: p.canonicalPath });
  // Dernier élément = la page elle-même
  const last = b[b.length - 1]; if (last.path !== p.canonicalPath) b.push({ name: p.trade?.name || zoneLabel(p), path: p.canonicalPath });
  return b.filter((x, i, arr) => arr.findIndex(y => y.path === x.path) === i);
}
/** Lien vers la recherche complète. La recherche filtre par département (pas par commune) : le libellé le dit. */
/** Majuscules d'avis (« PAUILLAC ») remises en casse normale ; titres multi-lignes ramenés à une ligne. */
const unshout = (v: string) => (/[a-zà-ÿ]/.test(v) ? v : v.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase()).replace(/-(De|Du|Des|La|Le|Les|Sur|Sous|En|Et|Lès|Lez|Aux)-/g, (m) => m.toLowerCase()));
export const seoItemTitle = (i: SeoItem) => { const t = i.title.replace(/\s+/g, ' ').trim(); return t.length > 160 ? `${t.slice(0, 157).trimEnd()}…` : t; };
/** Ligne de détail d'une annonce, identique côté robot et côté visiteur. */
export const seoItemLine = (i0: SeoItem) => { const i = { ...i0, city: i0.city ? unshout(i0.city) : null }; return [i.buyer ? `Acheteur : ${i.buyer}${i.city && !i.buyer.toLowerCase().includes(i.city.toLowerCase()) ? ` (${i.city})` : ''}` : (i.city ? `Commune de l’acheteur : ${i.city}` : null),
  i.deadline ? `date limite : ${seoDate(i.deadline)}` : 'date limite non communiquée', i.reference ? `réf. ${i.reference}` : null].filter(Boolean).join(' · '); };
export const seoSearchPath = (p: SeoV2Page) => {
  const q = new URLSearchParams({ journey: p.journey });
  if (p.zone.department) q.set('department', p.zone.department);
  if (p.trade) q.set('q', p.trade.name);
  return `/vos-marches?${q.toString()}`;
};
export const seoSearchLabel = (p: SeoV2Page) => (p.zone.type === 'city'
  ? `Voir toutes les annonces du département ${p.zone.departmentName || p.zone.department}`
  : `Voir les ${p.count} annonces dans la recherche`);
export const zonePath = (p: SeoV2Page, tradeSlug?: string) => (p.zone.type === 'city' ? `/${p.base}/${p.zone.slug}` : `/${p.base}/departement/${p.zone.slug}`) + (tradeSlug ? `/${tradeSlug}` : '');
