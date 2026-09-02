// Vercel serverless function -> GET /sitemap.xml
// Static marketing routes + every published SEO page pulled live from the
// backend. Links use the clean local-SEO URL structure
// (/marches-publics/bordeaux, /marches-publics/bordeaux/electricite,
// /appels-doffres/bordeaux, /sous-traitance/bordeaux,
// /marches-publics/departement/gironde) per the client's brief, rather than
// the flat /pages/:slug fallback route - that route still exists and still
// works for direct visits, but Google should discover the clean paths.
const JOURNEY_BASE_PATH: Record<string, string> = {
  public_procurement: '/marches-publics',
  tender: '/appels-doffres',
  subcontracting: '/sous-traitance',
};

export default async function handler(req: any, res: any) {
  const siteUrl = (process.env.FRONTEND_URL || 'https://marchesdirect.vercel.app').replace(/\/$/, '');
  const apiUrl = (process.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  const staticPaths = [
    '/', '/recherche', '/marches-publics', '/appels-doffres', '/sous-traitance',
    '/tarifs', '/a-propos', '/team', '/how-it-works', '/faq', '/contact',
  ];

  let seoUrls: { loc: string; lastmod?: string }[] = [];
  try {
    const r = await fetch(`${apiUrl}/api/seo-pages`);
    if (r.ok) {
      const data = await r.json();
      seoUrls = (data.pages || []).map((p: {
        page_slug: string; updated_at: string; page_type?: string;
        filter_city?: string; filter_department?: string; filter_trade_name?: string; filter_journey?: string;
      }) => {
        const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined;
        const base = p.filter_journey ? JOURNEY_BASE_PATH[p.filter_journey] : undefined;

        // Build the clean nested path from real structured filters when we
        // have enough of them - city (+trade) or department-only. Anything
        // that doesn't cleanly map (e.g. the older trade_region page type)
        // falls back to the flat /pages/:slug route rather than guessing
        // wrong and linking a 404.
        let loc: string;
        if (base && p.filter_city && p.filter_trade_name) {
          loc = `${siteUrl}${base}/${encodeURIComponent(p.filter_city)}/${encodeURIComponent(p.filter_trade_name)}`;
        } else if (base && p.filter_city) {
          loc = `${siteUrl}${base}/${encodeURIComponent(p.filter_city)}`;
        } else if (base && p.filter_department) {
          loc = `${siteUrl}${base}/departement/${encodeURIComponent(p.filter_department)}`;
        } else {
          loc = `${siteUrl}/pages/${p.page_slug}`;
        }

        return { loc, lastmod };
      });
    }
  } catch {
    // Backend unreachable - still serve the static URLs rather than a 500,
    // so the sitemap keeps working during a backend deploy/outage.
  }

  const staticUrls = staticPaths.map((p) => ({ loc: `${siteUrl}${p}` }));
  const allUrls = [...staticUrls, ...seoUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
}
