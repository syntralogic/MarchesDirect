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
// Routed by vercel.json rewrites (kind=category|local|opportunity|slug). Keep the category copy in sync
// with src/pages/CategoryLandingPage.tsx, and the URL structure with api/sitemap.xml.ts.

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
interface Doc { status: number; title: string; description: string; path: string; noindex?: boolean; body: string; cache?: string }

const link = (href: string, label: string): string => `<li style="display:inline-block;margin:0 .5rem .5rem 0"><a href="${esc(href)}" style="color:#FF6B00">${esc(label)}</a></li>`;
const wrap = (inner: string): string =>
  `<main style="max-width:48rem;margin:0 auto;padding:2rem 1rem;color:#E5E7EB;font-family:Inter,system-ui,sans-serif;line-height:1.6">${inner}</main>`;

function render(shell: string, d: Doc): string {
  const url = `${PUBLIC_SITE}${d.path}`;
  const head = [
    `<meta name="description" content="${esc(d.description)}" data-rh="true">`,
    d.noindex ? '<meta name="robots" content="noindex, follow" data-rh="true">' : `<link rel="canonical" href="${esc(url)}" data-rh="true">`,
    `<meta property="og:title" content="${esc(d.title)}" data-rh="true">`,
    `<meta property="og:description" content="${esc(d.description)}" data-rh="true">`,
    `<meta property="og:url" content="${esc(url)}" data-rh="true">`,
    '<meta property="og:type" content="website" data-rh="true">',
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
async function buildCategory(base: string): Promise<Doc | null> {
  const journey = JOURNEY_BY_BASE[base];
  const c = journey && CATEGORY_COPY[journey];
  if (!c) return null;
  const list = await getJson(`/api/seo-pages?journey=${journey}&limit=60`);
  const seen = new Set<string>();
  const items: string[] = [];
  for (const p of (list.status === 200 ? list.json?.pages : []) || []) {
    const l = localPath(base, p);
    if (l && !seen.has(l.to)) { seen.add(l.to); items.push(link(l.to, l.label)); }
  }
  return {
    status: 200, title: c.title, description: c.description, path: `/${base}`, cache: 'public, s-maxage=600, stale-while-revalidate=86400',
    body: wrap(
      `<h1>${esc(c.h1)}</h1><p>${esc(c.intro)}</p>` +
      `<p><a href="/recherche?journey=${journey}" style="color:#FF6B00;font-weight:600">${esc(c.cta)}</a></p>` +
      (items.length ? `<nav aria-label="Pages par zone et par métier"><h2>Par zone et par métier</h2><ul style="list-style:none;padding:0">${items.join('')}</ul></nav>` : '')
    ),
  };
}

async function buildLocal(base: string, city: string, trade: string, department: string): Promise<Doc> {
  const journey = JOURNEY_BY_BASE[base];
  const path = department
    ? `/${base}/departement/${encodeURIComponent(department)}`
    : `/${base}/${encodeURIComponent(city)}${trade ? `/${encodeURIComponent(trade)}` : ''}`;
  if (!journey) return notFound(path);
  const qs = new URLSearchParams({ journey });
  if (department) qs.set('department', department);
  else { qs.set('city', city); if (trade) qs.set('trade', trade); }
  const r = await getJson(`/api/seo-pages/lookup?${qs.toString()}`);
  if (r.status === 404 || r.status === 400) return notFound(path);
  if (r.status !== 200 || !r.json) return unavailable(path);
  const p = r.json;

  const zone = p.filter_city || p.filter_department || '';
  const label = JOURNEY_LABEL[journey];
  const trades = ((p.related_trades || []) as { name: string; opp_count: string | number }[])
    .filter(() => !!p.filter_city)
    .map((t) => link(`/${base}/${encodeURIComponent(p.filter_city)}/${encodeURIComponent(t.name)}`, `${t.name} (${t.opp_count})`));
  const cities = ((p.neighboring_cities || []) as string[]).map((c) => link(`/${base}/${encodeURIComponent(c)}`, c));
  const buyers = ((p.local_buyers || []) as string[]).map((b) => `<li>${esc(b)}</li>`);
  const updated = fmtDate(p.updated_at);
  const searchQs = new URLSearchParams({ journey });
  if (p.filter_city) searchQs.set('city', p.filter_city);
  if (p.filter_department) searchQs.set('department', p.filter_department);

  return {
    status: 200, path, cache: 'public, s-maxage=600, stale-while-revalidate=86400',
    title: p.page_title || `${label} ${zone}`,
    description: p.page_meta_description || `${label} ${zone ? `à ${zone}` : ''} : opportunités ouvertes, date limite de réponse et lots.`,
    body: wrap(
      `<nav aria-label="Fil d'Ariane"><a href="/" style="color:#FF6B00">Accueil</a> › <a href="/${base}" style="color:#FF6B00">${esc(label)}</a>` +
      `${p.filter_department && p.filter_city ? ` › <a href="/${base}/departement/${encodeURIComponent(p.filter_department)}" style="color:#FF6B00">${esc(p.filter_department)}</a>` : ''}</nav>` +
      `<h1>${esc(p.page_title || `${label} ${zone}`)}</h1>` +
      (updated ? `<p><small>Mis à jour le ${esc(updated)}</small></p>` : '') +
      (p.page_content ? `<p>${esc(p.page_content)}</p>` : '') +
      `<p><a href="/recherche?${esc(searchQs.toString())}" style="color:#FF6B00;font-weight:600">Voir toutes les opportunités</a></p>` +
      (buyers.length ? `<h2>Principaux acheteurs publics locaux</h2><ul>${buyers.join('')}</ul>` : '') +
      (trades.length ? `<h2>Métiers concernés${zone ? ` à ${esc(zone)}` : ''}</h2><ul style="list-style:none;padding:0">${trades.join('')}</ul>` : '') +
      (cities.length ? `<h2>Villes voisines</h2><ul style="list-style:none;padding:0">${cities.join('')}</ul>` : '')
    ),
  };
}

async function buildOpportunity(id: string): Promise<Doc> {
  const path = `/opportunites/${encodeURIComponent(id)}`;
  const r = await getJson(`/api/seo-pages/opportunity-meta/${encodeURIComponent(id)}`);
  if (r.status === 404 || r.status === 400) return notFound(path);
  if (r.status !== 200 || !r.json) return unavailable(path);
  const o = r.json;

  const label = JOURNEY_LABEL[o.journey] || 'Opportunité';
  const place = [o.location_city, o.location_department && o.location_department !== o.location_city ? `(${o.location_department})` : ''].filter(Boolean).join(' ');
  const deadline = fmtDate(o.deadline);
  const facts = [
    `${label}${o.trade_name ? ` — ${o.trade_name}` : ''}${place ? ` à ${place}` : ''}.`,
    deadline ? `Date limite de réponse : ${deadline}.` : '',
    'Vérifiez la concordance avec votre entreprise et demandez le dossier sur Marchés Direct.',
  ].filter(Boolean).join(' ');
  const journeyBase = Object.keys(JOURNEY_BY_BASE).find((k) => JOURNEY_BY_BASE[k] === o.journey) || 'marches-publics';
  return {
    status: 200, path,
    title: `${clip(String(o.title || label), 90)} | Marchés Direct`,
    description: clip(facts, 300),
    noindex: !!o.is_demo, // the demo catalogue must never be indexed
    cache: 'public, s-maxage=600, stale-while-revalidate=86400',
    body: wrap(
      `<nav aria-label="Fil d'Ariane"><a href="/" style="color:#FF6B00">Accueil</a> › <a href="/${journeyBase}" style="color:#FF6B00">${esc(label)}</a></nav>` +
      `<h1>${esc(clip(String(o.title || label), 200))}</h1><p>${esc(facts)}</p>` +
      `<p><a href="/recherche?journey=${esc(o.journey || '')}" style="color:#FF6B00;font-weight:600">Voir d'autres opportunités</a></p>`
    ),
  };
}

async function buildSlug(slug: string): Promise<Doc> {
  const path = `/pages/${encodeURIComponent(slug)}`;
  const r = await getJson(`/api/seo-pages/${encodeURIComponent(slug)}`);
  if (r.status === 404) return notFound(path);
  if (r.status !== 200 || !r.json) return unavailable(path);
  const p = r.json;
  return {
    status: 200, path, title: p.page_title || 'Marchés Direct', description: p.page_meta_description || '',
    cache: 'public, s-maxage=600, stale-while-revalidate=86400',
    body: wrap(`<h1>${esc(p.page_title || '')}</h1>${p.page_content ? `<p>${esc(p.page_content)}</p>` : ''}<p><a href="/recherche" style="color:#FF6B00;font-weight:600">Voir les opportunités</a></p>`),
  };
}

// ---------------------------------------------------------------------------
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
      doc = await buildLocal(base, city, param(q.trade), param(q.department));
    } else if (kind === 'opportunity') {
      doc = await buildOpportunity(param(q.id));
    } else if (kind === 'slug') {
      doc = await buildSlug(param(q.slug));
    }
    if (!doc) return plain();

    if (doc.status === 503) return send(503, shell, 'no-store'); // humans still get the SPA shell; crawlers retry later
    return send(doc.status, render(shell, doc), doc.cache || 'public, s-maxage=60');
  } catch {
    res.status(500).setHeader('Content-Type', 'text/plain; charset=utf-8').send('Erreur temporaire');
  }
}
