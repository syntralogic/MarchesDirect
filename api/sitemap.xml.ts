// Vercel serverless function -> /sitemap.xml (index) and /sitemap-<part>.xml (5 nov., mandat référencement)
//
// Avant : un seul fichier de 5 000 adresses, dont 4 535 écrites avec majuscules/accents encodés (beaucoup étaient des
// noms d'acheteurs pris pour des villes), et aucune fiche d'annonce (la requête des annonces n'aboutissait pas).
// Maintenant :
//   /sitemap.xml              index des fichiers ci-dessous
//   /sitemap-pages.xml        pages fixes + pages locales INDEXABLES (au moins une annonce ouverte), adresses canoniques
//   /sitemap-annonces-N.xml   fiches d'annonces ouvertes, par lots de 10 000
// lastmod = dernière mise à jour réelle des annonces de la page (jamais la date du jour par défaut).
import { GUIDES } from '../src/content/guides/index.js';
import { guidePath, GUIDES_BASE } from '../src/content/guideModel.js';

const PUBLIC_SITE = 'https://www.marchesdirect.fr';
const CHUNK = 10000;
// Les anciennes « actualités » (/actualites/aN) sont redirigées vers les guides depuis le 6 nov. : retirées d'ici.
const STATIC = ['/', '/marches-publics', '/appels-doffres', '/sous-traitance', '/tarifs', '/a-propos', '/how-it-works', '/faq', '/contact', '/barometre-marches-publics'];

const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const day = (d?: string | null) => { if (!d) return undefined; const t = new Date(d); return Number.isNaN(t.getTime()) ? undefined : t.toISOString().slice(0, 10); };
async function getJson(url: string, ms = 20000): Promise<any | null> {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(ms) }); return r.ok ? await r.json() : null; } catch { return null; }
}
const urlset = (urls: { loc: string; lastmod?: string }[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${xmlEsc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;

export default async function handler(req: any, res: any) {
  const apiUrl = (process.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  const part = String((req.query && req.query.part) || '');
  const send = (xml: string, cache = 's-maxage=3600, stale-while-revalidate=86400') => {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8'); res.setHeader('Cache-Control', cache); res.status(200).send(xml);
  };

  if (part === 'pages') {
    const data = await getJson(`${apiUrl}/api/seo/v2/sitemap`);
    const local = ((data && data.pages) || []).map((p: { path: string; lastmod: string }) => ({ loc: `${PUBLIC_SITE}${p.path}`, lastmod: day(p.lastmod) }));
    if (!data) return res.status(503).setHeader('Retry-After', '600').send('');
    const guides = [{ loc: `${PUBLIC_SITE}${GUIDES_BASE}`, lastmod: GUIDES.map(g => g.updated).sort().pop() },
      ...GUIDES.map(g => ({ loc: `${PUBLIC_SITE}${guidePath(g.slug)}`, lastmod: g.updated }))];
    return send(urlset([...STATIC.map((p) => ({ loc: `${PUBLIC_SITE}${p}` })), ...guides, ...local].slice(0, 50000)));
  }
  if (part === 'acheteurs') {
    const data = await getJson(`${apiUrl}/api/seo/v2/acheteurs`);
    if (!data) return res.status(503).setHeader('Retry-After', '600').send('');
    return send(urlset(((data.pages || []) as { path: string; lastmod: string }[]).slice(0, 50000).map(p => ({ loc: `${PUBLIC_SITE}${p.path}`, lastmod: day(p.lastmod) }))));
  }
  const m = part.match(/^annonces-(\d+)$/);
  if (m) {
    const data = await getJson(`${apiUrl}/api/seo-pages/opportunities-sitemap`, 25000);
    if (!data) return res.status(503).setHeader('Retry-After', '600').send('');
    const all = (data.opportunities || []) as { id: string; updated_at?: string }[];
    const n = Number(m[1]);
    const slice = all.slice((n - 1) * CHUNK, n * CHUNK);
    if (!slice.length) return res.status(404).send('');
    return send(urlset(slice.map((o) => ({ loc: `${PUBLIC_SITE}/opportunites/${o.id}`, lastmod: day(o.updated_at) }))));
  }
  if (part) return res.status(404).send('');

  // Index
  const opp = await getJson(`${apiUrl}/api/seo-pages/opportunities-sitemap`, 25000);
  const chunks = Math.max(1, Math.ceil((((opp && opp.opportunities) || []).length) / CHUNK));
  const files = ['sitemap-pages.xml', 'sitemap-acheteurs.xml', ...Array.from({ length: chunks }, (_, k) => `sitemap-annonces-${k + 1}.xml`)];
  return send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.map((f) => `  <sitemap><loc>${PUBLIC_SITE}/${f}</loc></sitemap>`).join('\n')}
</sitemapindex>`);
}
