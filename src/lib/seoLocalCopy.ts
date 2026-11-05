// Textes des pages locales SEO, partagés par le pré-rendu serveur (api/prerender.ts) et la page React (SeoLocalPage) :
// robots et visiteurs lisent EXACTEMENT la même chose. Sans dépendance : importable des deux côtés.
// Tous les chiffres viennent de /api/seo/v2/page ; chaque compteur est celui de la liste qu'il annonce.
//
// 6 nov. : trois informations distinctes par annonce — lieu d'exécution, commune de l'acheteur, départements de
// publication — et trois états — ouverte (date limite à venir), à vérifier (pas de date limite), clôturée.

export type SeoItem = {
  id: string; title: string; deadline: string | null; state: 'open' | 'verify' | 'closed'; buyer: string | null;
  reference: string | null; estimatedValue: number | null; trades: string[]; path: string;
  execution: { status: string; communes: string[]; departments: string[]; text: string | null };
  buyerCity: string | null; buyerDepartment: string | null; publicationDepartments: string[];
  city: string | null; department: string | null;
};
export type SeoV2Page = {
  status: 200; journey: 'public_procurement' | 'tender' | 'subcontracting'; base: string;
  zone: { type: 'city' | 'department'; slug: string; name: string; department: string | null; departmentName: string | null };
  trade: { slug: string; name: string } | null; canonicalPath: string; indexable: boolean; indexReason: string;
  count: number; items: SeoItem[]; page: number; pages: number; pageSize: number;
  buyerCount: number; buyerItems: SeoItem[]; verifyCount: number; verifyItems: SeoItem[];
  nearbyCount: number; nearby: SeoItem[]; closedCount: number; closedItems: SeoItem[]; publishedOnlyCount: number;
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
const BARE: Record<string, [string, string]> = { public_procurement: ['consultation', 'consultations'], tender: ['appel d’offres', 'appels d’offres'], subcontracting: ['mission', 'missions'] };
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const paris = (iso: string) => new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
export const seoDate = (iso: string | null | undefined): string | null => {
  if (!iso) return null; const d = paris(iso); if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}`;
};
export const seoMonth = (iso: string) => { const d = paris(iso); return `${MOIS[d.getMonth()]} ${d.getFullYear()}`; };
export const countText = (journey: string, n: number) => `${n} ${NOUN[journey][n > 1 ? 1 : 0]}`;
const bare = (journey: string, n: number) => `${n} ${BARE[journey][n > 1 ? 1 : 0]}`;
/** Accord : « clôturée » / « clôturées » (consultation et mission sont féminins ; appel d’offres masculin). */
const ag = (journey: string, n: number, f: string) => { const w = journey === 'tender' ? f.replace(/ée$/, 'é') : f; return n > 1 ? `${w}s` : w; };

export const zoneLabel = (p: SeoV2Page) => (p.zone.type === 'city' ? p.zone.name : `${p.zone.name} (${p.zone.department})`);
const zoneIn = (p: SeoV2Page) => (p.zone.type === 'city' ? `à ${p.zone.name}` : `dans le département ${p.zone.name} (${p.zone.department})`);
const tradeIn = (p: SeoV2Page) => (p.trade ? ` ${p.trade.name.toLowerCase() === 'cvc' ? 'CVC (chauffage, ventilation, climatisation)' : p.trade.name.toLowerCase()}` : '');
const openTotal = (p: SeoV2Page) => p.count + p.buyerCount;

export function seoTitle(p: SeoV2Page): string {
  const what = `${SEO_LABEL[p.journey]}${p.trade ? ` ${p.trade.name}` : ''}`;
  const where = p.zone.type === 'city' ? `à ${p.zone.name}` : zoneLabel(p);
  const pg = p.page > 1 ? ` — page ${p.page}` : '';
  return openTotal(p) > 0
    ? `${what} ${where} : ${countText(p.journey, openTotal(p))} (${seoMonth(p.generatedAt)})${pg} | Marchés Direct`
    : `${what} ${where}${pg} | Marchés Direct`;
}
export function seoH1(p: SeoV2Page): string {
  return `${SEO_LABEL[p.journey]}${tradeIn(p)} ${p.zone.type === 'city' ? `à ${p.zone.name}` : `— ${zoneLabel(p)}`}`;
}
export function seoDescription(p: SeoV2Page): string {
  const next = seoDate(p.nextDeadline);
  if (openTotal(p) > 0) return `${countText(p.journey, openTotal(p))}${tradeIn(p)} ${zoneIn(p)}${next ? `, prochaine date limite le ${next}` : ''}. Lieu d’exécution, acheteur et date limite de chaque avis ; vérifiez gratuitement si le marché correspond à votre entreprise.`.slice(0, 300);
  if (p.closedCount > 0) return `Pas de ${BARE[p.journey][0]}${tradeIn(p)} ${p.journey === 'tender' ? 'ouvert' : 'ouverte'} ${zoneIn(p)} aujourd’hui ; ${bare(p.journey, p.closedCount)} ${ag(p.journey, p.closedCount, 'clôturée')} ces 6 derniers mois, avec leurs acheteurs. Soyez prévenu des prochaines.`;
  return `${p.journey === 'tender' ? 'Aucun' : 'Aucune'} ${NOUN[p.journey][0]}${tradeIn(p)} ${zoneIn(p)} aujourd’hui. Consultez les annonces du département et soyez prévenu des prochaines.`;
}
/** Introduction construite à partir des données de la zone (jamais un texte où seul le nom de ville change). */
export function seoIntro(p: SeoV2Page): string[] {
  const out: string[] = [];
  const asOf = seoDate(p.generatedAt);
  const city = p.zone.type === 'city';
  if (p.count > 0) out.push(`Au ${asOf}, ${countText(p.journey, p.count)}${tradeIn(p)} ${city ? `ont pour lieu d’exécution ${p.zone.name}` : `ont leur lieu d’exécution dans le département ${p.zone.name} (${p.zone.department})`}, d’après les avis publiés.`);
  if (p.buyerCount > 0) out.push(`${countText(p.journey, p.buyerCount)} de plus émanent d’acheteurs situés ${city ? `à ${p.zone.name}` : 'dans le département'}, sans lieu d’exécution ${city ? 'communal ' : ''}précisé dans l’avis : elles sont listées à part.`);
  if (!openTotal(p)) out.push(`${p.journey === 'tender' ? 'Aucun' : 'Aucune'} ${NOUN[p.journey][0]}${tradeIn(p)} ${zoneIn(p)} au ${asOf}.${p.closedCount ? ` ${bare(p.journey, p.closedCount)} de la zone ${p.closedCount > 1 ? 'ont' : 'a'} été ${ag(p.journey, p.closedCount, 'clôturée')} ces 6 derniers mois ; elles montrent quels acheteurs publient ici.` : ' Les annonces sont relues chaque jour ; cette page affichera les prochaines dès leur publication.'}`);
  const next = seoDate(p.nextDeadline); if (next) out.push(`Prochaine date limite de réponse : ${next}.`);
  if (p.buyers.length) out.push(`${p.journey === 'public_procurement' ? 'Acheteurs publics' : 'Donneurs d’ordre'} les plus actifs : ${p.buyers.slice(0, 3).map(b => `${b.name} (${b.count})`).join(', ')}.`);
  if (!p.trade && p.trades.length) out.push(`Métiers les plus représentés : ${p.trades.slice(0, 4).map(t => `${t.name} (${t.count})`).join(', ')}.`);
  if (p.publishedOnlyCount > 0) out.push(`${bare(p.journey, p.publishedOnlyCount)} ${ag(p.journey, p.publishedOnlyCount, 'publiée')} aussi dans ce département ${p.publishedOnlyCount > 1 ? 'concernent' : 'concerne'} un lieu d’exécution situé ailleurs : elles ne sont pas comptées ici.`);
  return out;
}

export type SeoSection = { key: string; title: string; note?: string; items: SeoItem[]; count: number };
/** Sections de liste, dans l'ordre, avec leur propre compteur. Identiques pour le robot et pour le visiteur. */
export function seoSections(p: SeoV2Page): SeoSection[] {
  const city = p.zone.type === 'city';
  const s: SeoSection[] = [];
  if (p.count) s.push({ key: 'main', count: p.count, items: p.items,
    title: `${countText(p.journey, p.count)} — lieu d’exécution : ${city ? p.zone.name : `${p.zone.name} (${p.zone.department})`}`,
    note: p.pages > 1 ? `Page ${p.page} sur ${p.pages}.` : undefined });
  if (p.buyerCount) s.push({ key: 'buyer', count: p.buyerCount, items: p.buyerItems,
    title: `${countText(p.journey, p.buyerCount)} — acheteur situé ${city ? `à ${p.zone.name}` : 'dans le département'}, lieu d’exécution non précisé`,
    note: p.buyerCount > p.buyerItems.length ? `${p.buyerItems.length} premières affichées.` : undefined });
  if (p.verifyCount) s.push({ key: 'verify', count: p.verifyCount, items: p.verifyItems,
    title: `${bare(p.journey, p.verifyCount)} sans date limite indiquée — à vérifier dans l’avis`,
    note: 'Elles ne sont pas comptées comme ouvertes : la date limite n’apparaît ni dans nos données ni dans l’avis.' });
  if (city && p.nearbyCount) s.push({ key: 'dept', count: p.nearbyCount, items: p.nearby,
    title: `${countText(p.journey, p.nearbyCount)} ailleurs dans le département ${p.zone.departmentName || ''} (${p.zone.department})`,
    note: p.nearbyCount > p.nearby.length ? `${p.nearby.length} premières, par date limite.` : undefined });
  if (p.closedCount) s.push({ key: 'closed', count: p.closedCount, items: p.closedItems,
    title: `${bare(p.journey, p.closedCount)} ${ag(p.journey, p.closedCount, 'clôturée')} ces 6 derniers mois`,
    note: 'Pour information : ces consultations n’acceptent plus de candidatures.' });
  return s;
}

export function seoFaq(p: SeoV2Page): { q: string; a: string }[] {
  const where = zoneIn(p);
  const lieu = { q: 'D’où vient le lieu indiqué pour chaque annonce ?', a: 'Du texte de l’avis publié : lieu d’exécution quand l’acheteur le précise (commune ou département), sinon l’adresse de l’acheteur, présentée comme telle. Quand l’avis ne donne aucun lieu, nous l’indiquons comme non précisé.' };
  if (p.journey === 'public_procurement') return [
    { q: `Comment répondre à un marché public ${where} ?`, a: 'Téléchargez le dossier de consultation (DCE) sur le profil d’acheteur indiqué dans l’avis, lisez le règlement de la consultation, préparez les pièces de candidature (DC1 et DC2 ou DUME, attestations, références) et votre offre, puis déposez le tout en ligne avant la date et l’heure limites.' },
    { q: 'Une petite entreprise ou un artisan peut-il candidater ?', a: 'Oui. Les marchés sont souvent découpés en lots pour permettre aux petites entreprises de répondre seules, ou en groupement avec d’autres entreprises.' },
    lieu,
    { q: 'Que fait Marchés Direct ?', a: 'Nous rassemblons les avis publiés, calculons gratuitement la correspondance avec votre entreprise à partir de son SIRET, et préparons un dossier prérempli. Elena, chargée de relation, peut vous accompagner jusqu’au dépôt.' },
  ];
  if (p.journey === 'subcontracting') return [
    { q: `Comment trouver des chantiers en sous-traitance ${where} ?`, a: 'Les entreprises générales titulaires de marchés recherchent des partenaires par lot. Chaque mission publiée ici indique le métier, le lieu et la date limite ; vous pouvez proposer vos services directement.' },
    { q: 'Comment être payé en sous-traitance d’un marché public ?', a: 'La loi du 31 décembre 1975 impose que l’acheteur public accepte le sous-traitant et agrée ses conditions de paiement (formulaire DC4). Au-delà de 600 € TTC, le sous-traitant est payé directement par l’acheteur.' },
    lieu,
  ];
  return [
    { q: `Qu’est-ce qu’un appel d’offres privé ${where} ?`, a: 'C’est une consultation lancée par un maître d’ouvrage privé (copropriété, entreprise, promoteur). Le Code de la commande publique ne s’applique pas : le contrat signé fixe les conditions, d’où l’importance du devis et des conditions de paiement.' },
    lieu,
  ];
}
export function seoBreadcrumb(p: SeoV2Page): { name: string; path: string }[] {
  const b = [{ name: 'Accueil', path: '/' }, { name: SEO_LABEL[p.journey], path: `/${p.base}` }];
  if (p.zone.department && (p.zone.type === 'city' || p.trade)) b.push({ name: `${p.zone.departmentName || p.zone.department} (${p.zone.department})`, path: `/${p.base}/departement/${p.zone.department.toLowerCase()}` });
  if (p.zone.type === 'city') b.push({ name: p.zone.name, path: `/${p.base}/${p.zone.slug}` });
  if (p.trade) b.push({ name: p.trade.name, path: p.canonicalPath });
  const last = b[b.length - 1]; if (last.path !== p.canonicalPath) b.push({ name: p.trade?.name || zoneLabel(p), path: p.canonicalPath });
  return b.filter((x, i, arr) => arr.findIndex(y => y.path === x.path) === i);
}
/** Adresse d'une page de la liste principale (page 1 = adresse canonique nue). */
export const seoPagePath = (p: SeoV2Page, n: number) => (n <= 1 ? p.canonicalPath : `${p.canonicalPath}?page=${n}`);

/** Majuscules d'avis (« PAUILLAC ») remises en casse normale ; titres multi-lignes ramenés à une ligne. */
const unshout = (v: string) => (/[a-zà-ÿ]/.test(v) ? v : v.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase()).replace(/-(De|Du|Des|La|Le|Les|Sur|Sous|En|Et|Lès|Lez|Aux)-/g, (m) => m.toLowerCase()));
export const seoItemTitle = (i: SeoItem) => { const t = i.title.replace(/\s+/g, ' ').trim(); return t.length > 160 ? `${t.slice(0, 157).trimEnd()}…` : t; };
/** Lieu d'exécution tel que l'avis le donne ; « non précisé » quand il ne le donne pas. */
export const seoExecLine = (i: SeoItem): string => {
  const e = i.execution;
  if (e.communes.length) return `Lieu d’exécution : ${e.communes.slice(0, 4).map(unshout).join(', ')}${e.communes.length > 4 ? ` (+${e.communes.length - 4})` : ''}`;
  if (e.departments.length) return `Lieu d’exécution : département${e.departments.length > 1 ? 's' : ''} ${e.departments.slice(0, 4).join(', ')}`;
  if (e.status === 'etranger') return 'Lieu d’exécution : hors de France';
  return `Lieu d’exécution non précisé${e.text ? ` (« ${e.text.replace(/\s+/g, ' ').slice(0, 60)} »)` : ''}`;
};
/** Ligne de détail d'une annonce, identique côté robot et côté visiteur. */
export const seoItemLine = (i: SeoItem) => [
  seoExecLine(i),
  i.buyer ? `acheteur : ${i.buyer}${i.buyerCity && !i.buyer.toLowerCase().includes(i.buyerCity.toLowerCase()) ? ` (${unshout(i.buyerCity)})` : ''}` : (i.buyerCity ? `acheteur situé à ${unshout(i.buyerCity)}` : null),
  i.state === 'closed' ? `clôturée le ${seoDate(i.deadline) || '—'}` : i.deadline ? `date limite : ${seoDate(i.deadline)}` : 'date limite à vérifier dans l’avis',
  i.reference ? `réf. ${i.reference}` : null,
].filter(Boolean).join(' · ');
export const seoSearchPath = (p: SeoV2Page) => {
  const q = new URLSearchParams({ journey: p.journey });
  if (p.zone.department) q.set('department', p.zone.department);
  if (p.trade) q.set('q', p.trade.name);
  return `/vos-marches?${q.toString()}`;
};
export const seoSearchLabel = (p: SeoV2Page) => `Rechercher dans tout le département ${p.zone.departmentName || p.zone.department}`;
export const zonePath = (p: SeoV2Page, tradeSlug?: string) => (p.zone.type === 'city' ? `/${p.base}/${p.zone.slug}` : `/${p.base}/departement/${p.zone.slug}`) + (tradeSlug ? `/${tradeSlug}` : '');
