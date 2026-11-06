#!/usr/bin/env node
// Contrôle SEO reproductible (6 nov.) — aucune dépendance, Node 18+.
//   node scripts/seo-check.mjs https://marche-direct-frontend-git-claude-seo-page-256de9-marche-direct.vercel.app
// Pour chaque adresse de l'échantillon : statut HTTP (sans suivre les redirections), Location, <title>, canonical,
// robots, compteur du titre comparé au nombre d'annonces de la liste principale, JSON-LD, pagination.
// Puis le sitemap index et chacun de ses fichiers enfants (nombre d'adresses, domaine, minuscules, doublons).
// Sortie : un tableau lisible + un fichier seo-check-<date>.json pour comparer avant/après.
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'https://www.marchesdirect.fr').replace(/\/$/, '');
const SAMPLE = [
  ['/', 200], ['/marches-publics', 200],
  ['/marches-publics/bordeaux', 200], ['/marches-publics/Bordeaux', 301], ['/marches-publics/departement/33', 200],
  ['/marches-publics/departement/33?page=2', 200], ['/marches-publics/departement/33?page=1', 301], ['/marches-publics/departement/33?page=999', 404],
  ['/marches-publics/paris', 200], ['/marches-publics/lyon', 200], ['/marches-publics/toulouse', 200], ['/marches-publics/marseille', 200],
  ['/marches-publics/nantes', 200], ['/marches-publics/lille', 200], ['/marches-publics/la-rochelle', 200], ['/marches-publics/angouleme', 200],
  ['/marches-publics/toulouse/electricite', 200], ['/marches-publics/paris/climatisation', 301], ['/marches-publics/bordeaux/plomberie', 200],
  ['/sous-traitance/paris/cvc', 200], ['/appels-doffres/lyon', 200], ['/marches-publics/CHU-de-Bordeaux', 301],
  ['/pages/marche-public-departement-de-l-oise', 301], ['/pages/appel-d-offres-agen-cvc', 301],
  ['/opportunites/00000000-0000-0000-0000-000000000000', 404],
];

const pick = (html, re) => (html.match(re) || [])[1] || null;
async function check(path, expected) {
  const url = BASE + path;
  const t0 = Date.now();
  const r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'MarchesDirect-SEO-check/1.0' } });
  const html = r.status === 200 ? await r.text() : '';
  const title = pick(html, /<title>([^<]*)<\/title>/i);
  const canonical = pick(html, /<link rel="canonical" href="([^"]+)"/i);
  const robots = pick(html, /<meta name="robots" content="([^"]+)"/i);
  const titleCount = title ? Number(pick(title, /: (\d+) /)) || 0 : null;
  // Liste principale = première <ul> après le premier <h2> « … lieu d’exécution … »
  const mainBlock = html.split(/<h2>/).find(b => /lieu d’exécution :/.test(b.split('</h2>')[0] || '')) || '';
  const headCount = Number(pick(mainBlock, /^(\d+) /)) || 0;
  const listed = (mainBlock.split('</ul>')[0].match(/<li /g) || []).length;
  const jsonld = (html.match(/application\/ld\+json/g) || []).length;
  const pagesNav = (html.match(/aria-label="Pages"/g) || []).length > 0;
  return { path, expected, status: r.status, ok: r.status === expected, location: r.headers.get('location'), ms: Date.now() - t0,
    title, canonical, robots, titleCount, mainHeadingCount: headCount, mainListed: listed, jsonld, pagination: pagesNav };
}
async function sitemaps() {
  const out = [];
  const idx = await (await fetch(`${BASE}/sitemap.xml`)).text();
  const children = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  out.push({ file: 'sitemap.xml', entries: children.length });
  for (const c of children) {
    const local = c.replace(/^https:\/\/www\.marchesdirect\.fr/, BASE);
    const r = await fetch(local); const x = r.status === 200 ? await r.text() : '';
    const locs = [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    out.push({ file: c.split('/').pop(), status: r.status, urls: locs.length,
      wrongHost: locs.filter(l => !l.startsWith('https://www.marchesdirect.fr/')).length,
      upperOrEncoded: locs.filter(l => /[A-Z%]/.test(l.replace('https://www.marchesdirect.fr', ''))).length,
      duplicates: locs.length - new Set(locs).size, withLastmod: (x.match(/<lastmod>/g) || []).length });
  }
  return out;
}

const rows = [];
for (const [p, e] of SAMPLE) { try { rows.push(await check(p, e)); } catch (err) { rows.push({ path: p, expected: e, error: String(err) }); } }
const sm = await sitemaps().catch(err => [{ error: String(err) }]);
for (const r of rows) console.log(`${r.ok ? 'OK ' : 'ÉCART'} ${String(r.status).padEnd(4)} ${r.path}${r.location ? ` → ${r.location}` : ''}${r.robots ? ` [${r.robots}]` : ''}${r.titleCount != null ? ` titre=${r.titleCount} liste=${r.mainHeadingCount}/${r.mainListed}` : ''}`);
console.table(sm);
const file = `seo-check-${new Date().toISOString().slice(0, 10)}.json`;
writeFileSync(file, JSON.stringify({ base: BASE, at: new Date().toISOString(), rows, sitemaps: sm }, null, 2));
console.log(`Résultats détaillés : ${file}`);
