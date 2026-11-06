// Vercel serverless function -> /sitemap.xml (index) and /sitemap-<part>.xml (5 nov., mandat référencement)
//
// Avant : un seul fichier de 5 000 adresses, dont 4 535 écrites avec majuscules/accents encodés (beaucoup étaient des
// noms d'acheteurs pris pour des villes), et aucune fiche d'annonce (la requête des annonces n'aboutissait pas).
// Maintenant :
//   /sitemap.xml              index des fichiers ci-dessous
//   /sitemap-pages.xml        pages fixes + pages locales INDEXABLES (au moins une annonce ouverte), adresses canoniques
//   /sitemap-annonces-N.xml   fiches d'annonces ouvertes, par lots de 10 000
// lastmod = dernière mise à jour réelle des annonces de la page (jamais la date du jour par défaut).
const PUBLIC_SITE = 'https://www.marchesdirect.fr';
const CHUNK = 10000;
const STATIC = ['/', '/marches-publics', '/appels-doffres', '/sous-traitance', '/tarifs', '/a-propos', '/how-it-works', '/faq', '/contact', '/actualites',
  ...['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map((id) => `/actualites/${id}`)];

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
    return send(urlset([...STATIC.map((p) => ({ loc: `${PUBLIC_SITE}${p}` })), ...local].slice(0, 50000)));
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
  const files = ['sitemap-pages.xml', ...Array.from({ length: chunks }, (_, k) => `sitemap-annonces-${k + 1}.xml`)];
  return send(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.map((f) => `  <sitemap><loc>${PUBLIC_SITE}/${f}</loc></sitemap>`).join('\n')}
</sitemapindex>`);
}
