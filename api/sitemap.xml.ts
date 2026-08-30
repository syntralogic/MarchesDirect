// Vercel serverless function -> GET /sitemap.xml
// Static marketing routes + every published /pages/:slug SEO page pulled
// live from the backend. This is what was actually missing for Milestone 11:
// the /pages/:slug route (SeoLandingPage.tsx) can render a page once you
// know its slug, but Google has no way to discover any slug without a
// sitemap linking to them - nothing else on the site links to these pages.
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
      seoUrls = (data.pages || []).map((p: { page_slug: string; updated_at: string }) => ({
        loc: `${siteUrl}/pages/${p.page_slug}`,
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
      }));
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
