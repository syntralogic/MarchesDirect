// Vercel serverless function: initial HTML for the SEO-relevant pages (SEO audit 23 Oct, points 4 and 5).
//
// The app is a client-side React SPA: every URL used to return the same 813-byte shell and the content
// only appeared after JavaScript ran. For the pages that matter for search - category entry pages, local
// pages (city / trade / department), opportunity fiches and /pages/:slug - this function returns the SAME
// shell (so the SPA boots exactly as before and replaces the content: main.tsx uses createRoot, not
// hydration) with the real <title>, description, canonical and a readable body (h1, text, plain links)
// already in the first response. Everyone gets this HTML, bots and humans alike - it is not cloaking.
//
// It also answers with the proper HTTP status: a local page / fiche / slug that does not exist is a real
// 404 (it used to be "Page introuvable" with status 200, i.e. a soft 404), and 503 when the backend is
// down, so a crawler retries later instead of recording an empty page.
//
// Routed by vercel.json rewrites (kind=category|local|opportunity|slug|guides|guide). Keep the category copy in sync
// with src/pages/CategoryLandingPage.tsx, and the URL structure with api/sitemap.xml.ts.

import { seoTitle, seoH1, seoDescription, seoIntro, seoFaq, seoBreadcrumb, seoSearchPath, seoSearchLabel, seoItemLine, seoItemTitle, seoSections, seoPagePath, seoExecLine, seoDate, zonePath, SEO_LABEL, type SeoV2Page, type SeoItem } from '../src/lib/seoLocalCopy.js';
import { GUIDES, GUIDE_CATEGORIES, GUIDES_INTRO, guideBySlug } from '../src/content/guides/index.js';
import { localGuides } from '../src/content/guides/catalog.js';
import { BARO_METHOD, BARO_PATH, baroDate, baroTime, baroDescription, baroTitle, euros, n as nfmt, pct, type Barometre } from '../src/lib/barometre.js';
import { buyerDescription, buyerIntro, buyerPath, buyerTitle, frDay, type BuyerCard, type BuyerData } from '../src/lib/acheteur.js';
import { guideBodyHtml, guideJsonLd, guideMetaTitle, guidePath, GUIDES_BASE } from '../src/content/guideModel.js';

const PUBLIC_SITE = 'https://www.marchesdirect.fr';

const JOURNEY_BY_BASE: Record<string, 'public_procurement' | 'tender' | 'subcontracting'> = {
  'marches-publics': 'public_procurement',
  'appels-doffres': 'tender',
  'sous-traitance': 'subcontracting',
};

const CATEGORY_COPY: Record<string, { title: string; description: string; h1: string; intro: string; cta: string }> = {
  public_procurement: {
    title: 'Marchés publics du bâtiment : consultations ouvertes | Marchés Direct',
    description: 'Consultez les marchés publics du bâtiment et des travaux ouverts à candidature, par métier et par zone, avec la date limite de réponse et le détail des lots.',
    h1: 'Marchés publics du bâtiment et des travaux',
    intro: "Marchés Direct rassemble les avis de marchés publics publiés par les acheteurs publics. Pour chaque marché, retrouvez le lieu des travaux, la date limite de réponse et les lots concernés, puis vérifiez en quelques clics s'il correspond à votre métier et à votre entreprise.",
    cta: 'Rechercher un marché public',
  },
  tender: {
    title: "Appels d'offres privés du bâtiment | Marchés Direct",
    description: "Trouvez les appels d'offres privés du bâtiment et des travaux, par métier et par zone, avec la date limite de réponse et les lots concernés.",
    h1: "Appels d'offres privés du bâtiment et des travaux",
    intro: "Retrouvez les appels d'offres lancés par des maîtres d'ouvrage privés et des entreprises générales. Filtrez par métier et par zone, consultez la date limite de réponse et les lots, puis vérifiez la concordance avec votre entreprise avant de demander le dossier.",
    cta: "Rechercher un appel d'offres",
  },
  subcontracting: {
    title: 'Sous-traitance du bâtiment : missions et chantiers | Marchés Direct',
    description: 'Trouvez des missions de sous-traitance dans le bâtiment, par métier et par zone, et mettez-vous en relation avec les entreprises qui recherchent des partenaires.',
    h1: 'Sous-traitance : missions et chantiers du bâtiment',
    intro: "Des entreprises du bâtiment recherchent des partenaires pour leurs chantiers. Parcourez les missions de sous-traitance par métier et par zone, puis proposez vos services directement.",
    cta: 'Rechercher une mission',
  },
};

const JOURNEY_LABEL: Record<string, string> = {
  public_procurement: 'Marché public',
  tender: "Appel d'offres",
  subcontracting: 'Mission de sous-traitance',
};

// Routes of the SPA that live under these bases but are NOT local pages: serve the plain shell.
const RESERVED_SEGMENTS = new Set(['mission', 'mise-en-relation']);

const esc = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const clip = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

const param = (v: unknown): string => {
  const s = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
  if (!s.includes('%')) return s;
  try { return decodeURIComponent(s); } catch { return s; }
};

const fmtDate = (d: unknown): string | null => {
  if (!d) return null;
  const dt = new Date(d as string);
  const y = dt.getFullYear();
  if (Number.isNaN(dt.getTime()) || y < 2000 || y > 2100) return null;
  return dt.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric' });
};

// ---------------------------------------------------------------------------
// Backend + shell access
// ---------------------------------------------------------------------------
const apiUrl = (): string => (process.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function getJson(path: string): Promise<{ status: number; json: any }> {
  try {
    const r = await fetch(`${apiUrl()}${path}`, { signal: AbortSignal.timeout(6000) });
    let json: any = null;
    try { json = await r.json(); } catch { /* non-JSON body */ }
    return { status: r.status, json };
  } catch {
    return { status: 0, json: null }; // network error / timeout
  }
}

let shellCache: { html: string; at: number } | null = null;
async function getShell(): Promise<string | null> {
  if (shellCache && Date.now() - shellCache.at < 5 * 60_000) return shellCache.html;
  // /index.html is a static file, served before any rewrite: no loop back into this function.
  const hosts = [PUBLIC_SITE, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''].filter(Boolean);
  for (const h of hosts) {
    try {
      const r = await fetch(`${h}/index.html`, { signal: AbortSignal.timeout(4000) });
      const html = r.ok ? await r.text() : '';
      if (html.includes('<div id="root">')) {
        shellCache = { html, at: Date.now() };
        return html;
      }
    } catch { /* try the next host */ }
  }
  return null;
}

// ---------------------------------------------------------------------------
// HTML assembly
// ---------------------------------------------------------------------------
interface Doc { status: number; title: string; description: string; path: string; noindex?: boolean; body: string; cache?: string; redirect?: string; jsonld?: object[]; ogType?: string }

const link = (href: string, label: string): string => `<li style="display:inline-block;margin:0 .5rem .5rem 0"><a href="${esc(href)}" style="color:#FF6B00">${esc(label)}</a></li>`;
const wrap = (inner: string): string =>
  `<main style="max-width:48rem;margin:0 auto;padding:2rem 1rem;color:#E5E7EB;font-family:Inter,system-ui,sans-serif;line-height:1.6">${inner}<nav aria-label="Ressources" style="margin-top:2rem"><ul style="list-style:none;padding:0">${link('/guides', 'Guides pour répondre aux marchés publics')}${link('/barometre-marches-publics', 'Baromètre des marchés publics')}${link('/marches-publics', 'Tous les marchés publics')}</ul></nav></main>`;

function render(shell: string, d: Doc): string {
  const url = `${PUBLIC_SITE}${d.path}`;
  const head = [
    `<meta name="description" content="${esc(d.description)}" data-rh="true">`,
    d.noindex ? '<meta name="robots" content="noindex, follow" data-rh="true">' : `<link rel="canonical" href="${esc(url)}" data-rh="true">`,
    `<meta property="og:title" content="${esc(d.title)}" data-rh="true">`,
    `<meta property="og:description" content="${esc(d.description)}" data-rh="true">`,
    `<meta property="og:url" content="${esc(url)}" data-rh="true">`,
    `<meta property="og:type" content="${d.ogType || 'website'}" data-rh="true">`,
    ...(d.jsonld || []).map(j => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].join('');
  return shell
    .replace(/<title>[^<]*<\/title>/i, `<title>${esc(d.title)}</title>`)
    .replace('</head>', `${head}</head>`)
    .replace('<div id="root"></div>', `<div id="root">${d.body}</div>`);
}

const notFound = (path: string): Doc => ({
  status: 404, title: 'Page introuvable | Marchés Direct', description: "Cette page n'existe pas ou n'est plus disponible.",
  path, noindex: true, cache: 'public, s-maxage=120',
  body: wrap(`<h1>Page introuvable</h1><p>Cette page n'existe pas ou n'est plus disponible.</p><p><a href="/recherche" style="color:#FF6B00">Rechercher une opportunité</a></p>`),
});

const unavailable = (path: string): Doc => ({
  status: 503, title: 'Marchés Direct', description: '', path, noindex: true, cache: 'no-store',
  body: '',
});

// Baromètre des marchés publics (6 nov.) : chiffres du jour dans la première réponse, méthode comprise.
async function buildBarometre(): Promise<Doc> {
  const r = await getJson('/api/seo/v2/barometre');
  if (r.status !== 200 || !r.json) return unavailable(BARO_PATH);
  const b = r.json as Barometre; const N = b.national;
  const row = (cells: string[]) => `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
  const body = [
    `<p>Baromètre · ${esc(baroDate(b.generatedAt))} à ${esc(baroTime(b.generatedAt))}</p>`,
    '<h1>Baromètre des marchés publics en France</h1>',
    `<p>${nfmt(N.open)} consultations ouvertes ; ${nfmt(N.published30)} publiées sur 30 jours ; ${nfmt(N.horizon.under7)} se terminent dans moins de 7 jours ; montant médian estimé ${N.medianEstimatedValue != null ? esc(euros(N.medianEstimatedValue)) : 'non disponible'} (${nfmt(N.withEstimatedValue)} avis chiffrés).</p>`,
    '<h2>Temps restant pour répondre</h2><table>' + [['Moins de 7 jours', N.horizon.under7], ['7 à 14 jours', N.horizon.d7to14], ['15 à 30 jours', N.horizon.d15to30], ['Plus de 30 jours', N.horizon.over30]].map(([l, v]) => row([String(l), nfmt(Number(v)), pct(Number(v), N.open)])).join('') + '</table>',
    '<h2>Départements avec le plus de consultations ouvertes</h2><table><tr><th>Département</th><th>Ouvertes</th><th>Publiées 30 j</th><th>Acheteurs les plus actifs</th></tr>'
      + b.departments.slice(0, 20).map(d => row([`<a href="/marches-publics/departement/${esc(d.code.toLowerCase())}" style="color:#FF6B00">${esc(d.name)} (${esc(d.code)})</a>`, nfmt(d.open), nfmt(d.published30), esc(d.topBuyers.map(x => `${x.name} (${x.count})`).join(' · '))])).join('') + '</table>',
    `<h2>Métiers les plus demandés</h2><p>${nfmt(N.openWithoutTrade)} consultations ouvertes n’ont pas de métier reconnu dans leur intitulé.</p><table><tr><th>Métier</th><th>Ouvertes</th><th>Publiées 30 j</th></tr>`
      + b.trades.slice(0, 25).map(t => row([esc(t.name), nfmt(t.open), nfmt(t.published30)])).join('') + '</table>',
    `<h2>Méthode</h2><ul>${BARO_METHOD.map(m => `<li>${esc(m)}</li>`).join('')}</ul>`,
    '<p><a href="/" style="color:#FF6B00">Trouver les marchés pour mon entreprise</a> · <a href="/guides" style="color:#FF6B00">Guides pour répondre</a></p>',
  ].join('');
  return { status: 200, title: baroTitle(b), description: baroDescription(b), path: BARO_PATH, body: wrap(body), cache: 'public, s-maxage=900, stale-while-revalidate=3600',
    jsonld: [{ '@context': 'https://schema.org', '@type': 'Dataset', name: 'Baromètre des marchés publics en France (Marchés Direct)', description: baroDescription(b),
      url: `${PUBLIC_SITE}${BARO_PATH}`, dateModified: b.generatedAt, inLanguage: 'fr-FR', creator: { '@type': 'Organization', name: 'Marchés Direct', url: PUBLIC_SITE },
      isBasedOn: ['https://www.data.gouv.fr/datasets/boamp/'], spatialCoverage: 'France' }] };
}

// Guides pratiques (6 nov.) : contenu statique du dépôt, texte complet dans la première réponse.
function buildGuides(): Doc {
  const body = [`<h1>${esc(GUIDES_INTRO.h1)}</h1>`, `<p>${esc(GUIDES_INTRO.text)}</p>`,
    ...GUIDE_CATEGORIES.map(cat => { const list = GUIDES.filter(g => g.category === cat); return list.length
      ? `<section><h2>${esc(cat)}</h2><ul>${list.map(g => `<li><a href="${guidePath(g.slug)}" style="color:#FF6B00">${esc(g.title)}</a> — ${esc(g.description)}</li>`).join('')}</ul></section>` : ''; })].join('');
  return { status: 200, title: GUIDES_INTRO.metaTitle, description: GUIDES_INTRO.description, path: GUIDES_BASE, body: wrap(body), cache: 'public, s-maxage=3600',
    jsonld: [{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: GUIDES_INTRO.h1, url: `${PUBLIC_SITE}${GUIDES_BASE}`, inLanguage: 'fr-FR' }] };
}
function buildGuide(slug: string): Doc {
  const g = guideBySlug(slug);
  if (!g) return notFound(`${GUIDES_BASE}/${slug}`);
  const related = g.related.map(guideBySlug).filter(Boolean) as typeof GUIDES;
  return { status: 200, title: guideMetaTitle(g), description: g.description, path: guidePath(g.slug), body: wrap(guideBodyHtml(g, related)),
    cache: 'public, s-maxage=3600', jsonld: guideJsonLd(g, PUBLIC_SITE), ogType: 'article' };
}

const localPath = (base: string, p: { filter_city?: string | null; filter_department?: string | null; filter_trade_name?: string | null }): { to: string; label: string } | null => {
  const e = encodeURIComponent;
  if (p.filter_city && p.filter_trade_name) return { to: `/${base}/${e(p.filter_city)}/${e(p.filter_trade_name)}`, label: `${p.filter_trade_name} à ${p.filter_city}` };
  if (p.filter_city) return { to: `/${base}/${e(p.filter_city)}`, label: p.filter_city };
  if (p.filter_department) return { to: `/${base}/departement/${e(p.filter_department)}`, label: `Département : ${p.filter_department}` };
  return null;
};

// ---------------------------------------------------------------------------
// One builder per kind
// ---------------------------------------------------------------------------
// 5 nov. (mandat référencement) : liens réels vers les zones et métiers qui ont des annonces ouvertes (/api/seo/v2/links).
const chip = (href: string, label: string) => `<li style="display:inline-block;margin:0 .5rem .5rem 0"><a href="${esc(href)}" style="color:#FF6B00">${esc(label)}</a></li>`;
async function zoneLinks(base: string, journeyLabel: string): Promise<string> {
  const r = await getJson(`/api/seo/v2/links?base=${encodeURIComponent(base)}`);
  if (r.status !== 200 || !r.json) return '';
  const L = r.json;
  const deps = (L.departments || []).map((d: any) => chip(`/${base}/departement/${d.slug}`, `${d.name} (${d.code}) · ${d.count}`));
  const cities = (L.cities || []).map((c: any) => chip(`/${base}/${c.slug}`, `${c.name} · ${c.count}`));
  return (deps.length ? `<h2>${esc(journeyLabel)} par département</h2><ul style="list-style:none;padding:0">${deps.join('')}</ul>` : '')
    + (cities.length ? `<h2>${esc(journeyLabel)} par ville</h2><ul style="list-style:none;padding:0">${cities.join('')}</ul>` : '');
}

async function buildCategory(base: string): Promise<Doc | null> {
  const journey = JOURNEY_BY_BASE[base];
  const c = journey && CATEGORY_COPY[journey];
  if (!c) return null;
  const links = await zoneLinks(base, SEO_LABEL[journey]);
  return {
    status: 200, title: c.title, description: c.description, path: `/${base}`, cache: 'public, s-maxage=600, stale-while-revalidate=86400',
    jsonld: [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${PUBLIC_SITE}/` }, { '@type': 'ListItem', position: 2, name: SEO_LABEL[journey], item: `${PUBLIC_SITE}/${base}` }] }],
    body: wrap(
      `<h1>${esc(c.h1)}</h1><p>${esc(c.intro)}</p>` +
      `<p><a href="/recherche?journey=${journey}" style="color:#FF6B00;font-weight:600">${esc(c.cta)}</a></p>` + links
    ),
  };
}

async function buildHome(): Promise<Doc> {
  const r = await getJson('/api/seo/v2/links');
  const L = r.status === 200 && r.json ? r.json : null;
  const by = (L?.byType || {}) as Record<string, number>;
  const cats = Object.entries(JOURNEY_BY_BASE).map(([b, j]) => chip(`/${b}`, `${SEO_LABEL[j]}${by[j] ? ` · ${by[j]} ouverts` : ''}`));
  const deps = (L?.departments || []).slice(0, 20).map((d: any) => chip(`/marches-publics/departement/${d.slug}`, `${d.name} (${d.code})`));
  const cities = (L?.cities || []).slice(0, 24).map((c: any) => chip(`/marches-publics/${c.slug}`, c.name));
  return {
    status: 200, path: '/', cache: 'public, s-maxage=600, stale-while-revalidate=86400',
    title: 'Marchés publics et appels d’offres pour artisans et PME | Marchés Direct',
    description: 'Marchés publics, appels d’offres privés et sous-traitance du bâtiment près de chez vous. Indiquez votre SIRET : nous trouvons les marchés faits pour votre entreprise et vous accompagnons jusqu’au dépôt.',
    jsonld: [
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'Marchés Direct', url: `${PUBLIC_SITE}/`, logo: `${PUBLIC_SITE}/icons/icon-512.png` },
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Marchés Direct', url: `${PUBLIC_SITE}/`, inLanguage: 'fr-FR' },
    ],
    body: wrap(
      '<h1>Marchés publics, appels d’offres et sous-traitance pour artisans et PME</h1>' +
      '<p>Marchés Direct rassemble les avis de marchés publiés chaque jour et vous montre ceux qui correspondent à votre entreprise : indiquez votre nom ou votre SIRET, nous calculons la correspondance avec chaque marché, préparons un dossier prérempli et Elena, chargée de relation, vous accompagne jusqu’au dépôt.</p>' +
      `<ul style="list-style:none;padding:0">${cats.join('')}</ul>` +
      (deps.length ? `<h2>Marchés publics par département</h2><ul style="list-style:none;padding:0">${deps.join('')}</ul>` : '') +
      (cities.length ? `<h2>Marchés publics par ville</h2><ul style="list-style:none;padding:0">${cities.join('')}</ul>` : '')
    ),
  };
}

const itemHtml = (i: SeoItem) => `<li style="margin:0 0 1rem"><a href="${esc(i.path)}" style="color:#FF6B00;font-weight:600">${esc(seoItemTitle(i))}</a><br>`
  + `<small>${esc(seoItemLine(i))}</small></li>`;

async function buildLocal(base: string, city: string, trade: string, department: string, pageParam = ''): Promise<Doc> {
  const journey = JOURNEY_BY_BASE[base];
  const asked = department ? `/${base}/departement/${department}${trade ? `/${trade}` : ''}` : `/${base}/${city}${trade ? `/${trade}` : ''}`;
  if (!journey) return notFound(asked);
  const qs = new URLSearchParams({ base });
  if (department) qs.set('department', department); else qs.set('city', city);
  if (trade) qs.set('trade', trade);
  // Pagination : ?page=2… ; « page=1 » ou une valeur invalide renvoient vers l'adresse nue (une seule adresse par page).
  const pageNum = pageParam ? Number(pageParam) : 1;
  if (pageParam && (!Number.isInteger(pageNum) || pageNum < 2)) return { ...notFound(asked), status: 301, redirect: asked };
  if (pageNum > 1) qs.set('page', String(pageNum));
  const r = await getJson(`/api/seo/v2/page?${qs.toString()}`);
  if (r.status === 404 || r.status === 400) return notFound(asked);
  if (r.status !== 200 || !r.json) return unavailable(asked);
  if (r.json.redirect) return { ...notFound(asked), status: 301, redirect: r.json.redirect };
  if (Array.isArray(r.json.choices)) {
    // Communes homonymes sans majorité nette : page de choix, jamais un mélange (non indexée).
    const c = r.json as { name: string; choices: { departmentName: string; department: string; path: string }[] };
    return { status: 200, path: asked, noindex: true, cache: 'public, s-maxage=600, stale-while-revalidate=86400',
      title: `${SEO_LABEL[journey]} — ${c.name} : plusieurs communes portent ce nom | Marchés Direct`,
      description: `Plusieurs communes s’appellent ${c.name}. Choisissez la vôtre.`,
      body: wrap(`<h1>${esc(c.name)} : plusieurs communes portent ce nom</h1><p>Choisissez le département :</p><ul>${c.choices.map(x => `<li><a href="${esc(x.path)}${trade ? `/${esc(trade)}` : ''}" style="color:#FF6B00">${esc(c.name)} (${esc(x.departmentName)}, ${esc(x.department)})</a></li>`).join('')}</ul>`) };
  }
  const p = r.json as SeoV2Page;
  // Une seule adresse par page : majuscules, accents, synonymes de métier → 301 vers l'adresse canonique.
  if (p.canonicalPath !== asked) return { ...notFound(asked), status: 301, redirect: seoPagePath(p, pageNum) };

  const crumbs = seoBreadcrumb(p);
  const others = p.otherTypes.filter(o => o.count > 0).map(o => chip(zonePath({ ...p, base: o.base }, p.trade?.slug), `${SEO_LABEL[o.journey]} · ${o.count}`));
  const trades = p.trades.filter(t => t.slug !== p.trade?.slug).map(t => chip(zonePath(p, t.slug), `${t.name} (${t.count})`));
  const cities = p.cities.map(c => chip(`/${base}/${c.slug}${p.trade ? `/${p.trade.slug}` : ''}`, `${c.name} (${c.count})`));
  const faq = seoFaq(p);
  return {
    status: 200, path: seoPagePath(p, p.page), noindex: !p.indexable, cache: 'public, s-maxage=600, stale-while-revalidate=86400',
    title: seoTitle(p), description: seoDescription(p),
    jsonld: [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, k) => ({ '@type': 'ListItem', position: k + 1, name: c.name, item: `${PUBLIC_SITE}${c.path}` })) }],
    body: wrap(
      `<nav aria-label="Fil d'Ariane">${crumbs.map((c, k) => k === crumbs.length - 1 ? esc(c.name) : `<a href="${esc(c.path)}" style="color:#FF6B00">${esc(c.name)}</a>`).join(' › ')}</nav>` +
      `<h1>${esc(seoH1(p))}</h1>` + seoIntro(p).map(t => `<p>${esc(t)}</p>`).join('') +
      seoSections(p).map(sec => `<h2>${esc(sec.title)}</h2>${sec.note ? `<p><small>${esc(sec.note)}</small></p>` : ''}<ul style="list-style:none;padding:0">${sec.items.map(itemHtml).join('')}</ul>` +
        (sec.key === 'main' && p.pages > 1 ? `<nav aria-label="Pages">${Array.from({ length: p.pages }, (_, k) => k + 1).map(n => n === p.page ? `<strong>${n}</strong>` : `<a href="${esc(seoPagePath(p, n))}" style="color:#FF6B00">${n}</a>`).join(' · ')}</nav>` : '')).join('') +
      (!p.count && !p.buyerCount ? `<p><a href="/question" style="color:#FF6B00;font-weight:600">Être prévenu par Elena dès qu’une annonce paraît</a></p>` : '') +
      `<p><a href="${esc(seoSearchPath(p))}" style="color:#FF6B00;font-weight:600">${esc(seoSearchLabel(p))}</a></p>` +
      (trades.length ? `<h2>Par métier</h2><ul style="list-style:none;padding:0">${trades.join('')}</ul>` : '') +
      (cities.length ? `<h2>Autres villes du département</h2><ul style="list-style:none;padding:0">${cities.join('')}</ul>` : '') +
      (others.length ? `<h2>Autres types d’opportunités</h2><ul style="list-style:none;padding:0">${others.join('')}</ul>` : '') +
      `<h2>Guides pour répondre</h2><ul>${localGuides(journey).map(g => `<li><a href="${guidePath(g.slug)}" style="color:#FF6B00">${esc(g.title)}</a></li>`).join('')}</ul>` +
      `<h2>Questions fréquentes</h2>${faq.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}` +
      `<p><small>Données issues des avis publiés par les acheteurs, mises à jour le ${esc(seoDate(p.generatedAt) || '')}. Marchés Direct est une plateforme indépendante.</small></p>`
    ),
  };
}

async function buildOpportunity(id: string): Promise<Doc> {
  const path = `/opportunites/${encodeURIComponent(id)}`;
  const r = await getJson(`/api/seo/v2/annonce/${encodeURIComponent(id)}`);
  if (r.status === 404 || r.status === 400) return notFound(path); // supprimée : 404 avec liens utiles, jamais l'accueil
  if (r.status !== 200 || !r.json) return unavailable(path);
  const o = r.json;
  const label = JOURNEY_LABEL[o.journey] || 'Opportunité';
  const deadline = fmtDate(o.deadline);
  const exec = seoExecLine({ execution: o.execution } as SeoItem);
  const stateLine = o.state === 'cancelled' ? 'Consultation annulée : elle n’accepte pas de candidatures.'
    : o.state === 'closed' ? `Consultation clôturée le ${deadline} : elle n’accepte plus de candidatures.`
      : o.state === 'open' ? `Date limite de réponse : ${deadline}.` : 'Date limite non indiquée : à vérifier dans l’avis officiel.';
  const facts = [
    `${label}${o.tradeName ? ` — ${o.tradeName}` : ''}.`, `${exec}.`,
    o.buyer ? `Acheteur : ${o.buyer}${o.buyerCity ? ` (${o.buyerCity})` : ''}.` : '', stateLine,
    o.state === 'open' || o.state === 'verify' ? 'Vérifiez la concordance avec votre entreprise et demandez le dossier sur Marchés Direct.' : '',
  ].filter(Boolean).join(' ');
  const journeyBase = Object.keys(JOURNEY_BY_BASE).find((k) => JOURNEY_BY_BASE[k] === o.journey) || 'marches-publics';
  const similar = (o.similar || []) as { title: string; path: string; deadline: string | null }[];
  return {
    status: 200, path,
    title: `${o.state === 'closed' ? '[Clôturée] ' : o.state === 'cancelled' ? '[Annulée] ' : ''}${clip(String(o.title || label), 90)} | Marchés Direct`,
    description: clip(facts, 300),
    noindex: !o.indexable, // politique fondée sur la valeur de l'annonce (backend : closedIndexPolicy)
    cache: 'public, s-maxage=600, stale-while-revalidate=86400',
    body: wrap(
      `<nav aria-label="Fil d'Ariane"><a href="/" style="color:#FF6B00">Accueil</a> › <a href="/${journeyBase}" style="color:#FF6B00">${esc(label)}</a></nav>` +
      `<h1>${esc(clip(String(o.title || label), 200))}</h1><p>${esc(facts)}</p>` +
      (similar.length ? `<h2>${o.state === 'open' ? 'Autres consultations ouvertes' : 'Consultations ouvertes comparables'}</h2><ul style="list-style:none;padding:0">${similar.map(x => `<li><a href="${esc(x.path)}" style="color:#FF6B00">${esc(clip(x.title.replace(/\s+/g, ' '), 140))}</a>${x.deadline ? ` <small>— date limite ${esc(fmtDate(x.deadline) || '')}</small>` : ''}</li>`).join('')}</ul>` : '') +
      `<p><a href="/${journeyBase}" style="color:#FF6B00;font-weight:600">Voir les ${esc(label.toLowerCase())} par département</a></p>`
    ),
  };
}

async function buildSlug(slug: string): Promise<Doc> {
  // Anciennes pages générées (/pages/:slug) : 301 vers la page canonique correspondante (commune, département ou
  // catégorie), calculée par le serveur. La page d'origine n'est pas supprimée en base.
  const path = `/pages/${encodeURIComponent(slug)}`;
  const r = await getJson(`/api/seo/v2/legacy?slug=${encodeURIComponent(slug)}`);
  if (r.status !== 200 || !r.json) return unavailable(path);
  const row = (r.json.rows || [])[0];
  if (!row) return notFound(path);
  return { ...notFound(path), status: 301, redirect: row.target };
}

// ---------------------------------------------------------------------------

// Page acheteur (7 nov.) : mêmes textes que src/pages/AcheteurPage.tsx.
const JOURNEY_FR: Record<string, string> = { public_procurement: 'Marché public', tender: 'Appel d’offres privé', subcontracting: 'Sous-traitance' };
async function buildAcheteur(slug: string): Promise<Doc> {
  const path = buyerPath(slug);
  if (!/^[a-z0-9-]{3,120}$/.test(slug)) return notFound(path);
  const r = await getJson(`/api/seo/v2/acheteur/${encodeURIComponent(slug)}`);
  if (r.status === 404) return notFound(path);
  if (r.status !== 200 || !r.json) return unavailable(path);
  const b = r.json as BuyerData;
  const li = (c: BuyerCard) => `<li><a href="${esc(c.path)}" style="color:#FF6B00">${esc(c.title)}</a> — ${esc(JOURNEY_FR[c.journey] || 'Consultation')}${c.place ? ` · ${esc(c.place)}` : ''}${c.state === 'open' && c.deadline ? ` · date limite le ${esc(frDay(c.deadline))}` : c.state === 'closed' ? ' · clôturée' : ' · date limite à vérifier'}${c.trades.length ? ` · ${esc(c.trades.map(t => t.name).join(', '))}` : ''}</li>`;
  const crumbs = [{ name: 'Accueil', path: '/' }, { name: 'Marchés publics', path: '/marches-publics' }, ...(b.dept ? [{ name: `${b.deptName} (${b.dept})`, path: `/marches-publics/departement/${b.dept.toLowerCase()}` }] : []), { name: b.name, path }];
  const body = [
    `<nav aria-label="Fil d'Ariane">${crumbs.map((c, k) => k === crumbs.length - 1 ? esc(c.name) : `<a href="${esc(c.path)}" style="color:#FF6B00">${esc(c.name)}</a>`).join(' › ')}</nav>`,
    `<h1>${esc(b.name)} : marchés publics et appels d’offres</h1>`,
    `<p>${esc(buyerIntro(b))}</p>`,
    `<h2>Consultations ouvertes (${b.counts.open})</h2>`,
    b.open.length ? `<ul>${b.open.map(li).join('')}</ul>` : '<p>Aucune consultation ouverte aujourd’hui.</p>',
    b.verify.length ? `<h2>Date limite à vérifier (${b.counts.verify})</h2><ul>${b.verify.map(li).join('')}</ul>` : '',
    b.topTrades.length ? `<h2>Métiers recherchés par cet acheteur</h2><p>${esc(b.topTrades.map(t => `${t.name} (${t.count})`).join(' · '))}</p>` : '',
    b.closed.length ? `<h2>Consultations des six derniers mois (${b.counts.closed} clôturées)</h2><ul>${b.closed.map(li).join('')}</ul>` : '',
    b.otherBuyers.length ? `<h2>Autres acheteurs publics${b.deptName ? ` en ${esc(b.deptName)}` : ''}</h2><ul style="list-style:none;padding:0">${b.otherBuyers.map(o => link(buyerPath(o.slug), o.name)).join('')}</ul>` : '',
    '<p><a href="/" style="color:#FF6B00">Trouver les marchés pour mon entreprise</a></p>',
  ].join('');
  return { status: 200, title: buyerTitle(b), description: buyerDescription(b), path, noindex: !b.indexable, body: wrap(body),
    cache: 'public, s-maxage=900, stale-while-revalidate=86400',
    jsonld: [
      { '@context': 'https://schema.org', '@type': 'GovernmentOrganization', name: b.name, ...(b.city ? { address: { '@type': 'PostalAddress', addressLocality: b.city, addressCountry: 'FR' } } : {}), url: `${PUBLIC_SITE}${path}` },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, k) => ({ '@type': 'ListItem', position: k + 1, name: c.name, item: `${PUBLIC_SITE}${c.path}` })) },
    ] };
}

export default async function handler(req: any, res: any) {
  const q = req.query || {};
  const kind = param(q.kind);
  try {
    const shell = await getShell();
    if (!shell) {
      res.status(500).setHeader('Content-Type', 'text/plain; charset=utf-8').send('Service temporairement indisponible');
      return;
    }
    const send = (status: number, html: string, cache: string) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', cache);
      res.status(status).send(html);
    };
    const plain = () => send(200, shell, 'public, max-age=0, s-maxage=60');

    let doc: Doc | null = null;
    if (kind === 'category') {
      // Filtered variants (?city=, ?sector=, ?mode=...) keep the SPA behaviour: they redirect to /recherche
      // and stay noindex, so they get the plain shell.
      const extra = Object.keys(q).filter((k) => k !== 'kind' && k !== 'base');
      if (extra.length > 0) return plain();
      doc = await buildCategory(param(q.base));
    } else if (kind === 'local') {
      const base = param(q.base);
      const city = param(q.city);
      if (JOURNEY_BY_BASE[base] === 'subcontracting' && RESERVED_SEGMENTS.has(city)) return plain();
      doc = await buildLocal(base, city, param(q.trade), param(q.department), param(q.page));
    } else if (kind === 'home') {
      if (Object.keys(q).some(k => k !== 'kind')) return plain(); // paramètres de suivi ou de recherche : la page d'accueil normale
      doc = await buildHome();
    } else if (kind === 'opportunity') {
      doc = await buildOpportunity(param(q.id));
    } else if (kind === 'slug') {
      doc = await buildSlug(param(q.slug));
    } else if (kind === 'acheteur') {
      doc = await buildAcheteur(param(q.slug));
    } else if (kind === 'barometre') {
      doc = await buildBarometre();
    } else if (kind === 'guides') {
      doc = buildGuides();
    } else if (kind === 'guide') {
      doc = buildGuide(param(q.slug));
    }
    if (!doc) return plain();

    if (doc.redirect) { res.setHeader('Location', doc.redirect); res.setHeader('Cache-Control', 'public, s-maxage=3600'); res.status(301).send(''); return; }
    if (doc.status === 503) return send(503, shell, 'no-store'); // humans still get the SPA shell; crawlers retry later
    return send(doc.status, render(shell, doc), doc.cache || 'public, s-maxage=60');
  } catch {
    res.status(500).setHeader('Content-Type', 'text/plain; charset=utf-8').send('Erreur temporaire');
  }
}
