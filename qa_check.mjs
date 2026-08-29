import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';

const routes = [
  '/',
  '/appels-doffres',
  '/marches-publics',
  '/sous-traitance',
  '/parcours',
  '/parcours?type=marches-publics',
  '/parcours?type=appels-doffres',
  '/parcours?type=sous-traitance',
  '/info',
  '/team-profile',
  '/a-propos',
  '/about',
  '/team',
  '/how-it-works',
  '/faq',
  '/tarifs',
  '/recherche',
  '/equipe',
  '/actualites',
  '/zones',
  '/secteurs',
  '/international',
  '/mentions-legales',
  '/confidentialite',
  '/cgu',
  '/contact',
  '/connexion',
  '/inscription',
  '/marches-publics?department=33',
  '/marches-publics?region=Île-de-France',
  '/recherche?q=climatisation',
  '/opportunites/pub-1',
];

const results = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

page.on('response', resp => {
  if (resp.status() >= 400 && resp.url().startsWith('http')) {
    results[results.length - 1]?.errors.push(`HTTP ${resp.status()}: ${resp.url()}`);
  }
});
page.on('pageerror', err => {
  results[results.length - 1]?.errors.push('pageerror: ' + err.message);
});
page.on('console', msg => {
  if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
    results[results.length - 1]?.errors.push('console.error: ' + msg.text());
  }
});
page.on('requestfailed', req => {
  results[results.length - 1]?.errors.push('requestfailed: ' + req.url() + ' (' + req.failure()?.errorText + ')');
});

for (const route of routes) {
  const entry = { route, errors: [], status: null, bodyLen: 0, title: '' };
  results.push(entry);
  try {
    const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 15000 });
    entry.status = resp?.status() ?? null;
    await page.waitForTimeout(400);
    entry.bodyLen = await page.evaluate(() => document.getElementById('root')?.innerText?.length || 0);
    entry.title = await page.title();
  } catch (e) {
    entry.errors.push('navigation error: ' + e.message);
  }
}

await browser.close();

let hadIssue = false;
for (const r of results) {
  const flags = [];
  if (r.status && r.status >= 400) flags.push(`HTTP ${r.status}`);
  if (r.bodyLen === 0) flags.push('EMPTY BODY (blank page)');
  if (r.errors.length) flags.push(`${r.errors.length} error(s)`);
  const ok = flags.length === 0;
  if (!ok) hadIssue = true;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${r.route}  [status=${r.status}, textLen=${r.bodyLen}, title="${r.title}"]`);
  for (const e of r.errors) console.log('      -> ' + e);
}
console.log(hadIssue ? '\n=== ISSUES FOUND ===' : '\n=== ALL CLEAN ===');
