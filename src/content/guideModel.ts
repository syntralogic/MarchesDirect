// Guides pratiques (6 nov., mandat référencement) : contenu éditorial durable pour les artisans et PME.
// Fichier sans dépendance (ni React ni alias « @/ ») : il est lu à la fois par l'application et par le pré-rendu
// serveur (api/prerender.ts), qui envoie le texte complet dans la première réponse HTML. Un seul texte, deux rendus.
//
// Règles de rédaction : chaque chiffre ou règle de droit est vérifié sur une source officielle listée dans `sources`,
// avec la date de vérification (`checked`). Pas de promesse, pas de statistique inventée.

export type Block =
  | { p: string }
  | { h3: string }
  | { ul: string[] }
  | { ol: string[] }
  | { table: { head: string[]; rows: string[][] } }
  | { note: string };

export interface GuideSection { id: string; h2: string; blocks: Block[] }

export interface Guide {
  slug: string;
  category: 'Répondre' | 'Documents' | 'Argent et paiement' | 'Travailler à plusieurs' | 'Comprendre les règles';
  title: string;          // titre H1
  metaTitle: string;      // balise <title> (≤ 60 caractères avant « | Marchés Direct »)
  description: string;    // meta description (≤ 160 caractères)
  published: string;      // AAAA-MM-JJ
  updated: string;        // AAAA-MM-JJ
  checked: string;        // date de vérification des règles citées
  minutes: number;
  summary: string[];      // « En bref » : 3 à 5 points
  sections: GuideSection[];
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  related: string[];      // slugs d'autres guides
}

export const GUIDES_BASE = '/guides';
export const guidePath = (slug: string) => `${GUIDES_BASE}/${slug}`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Mise en forme minimale dans le texte : **gras** et [libellé](/chemin-ou-url). Le texte est échappé d'abord.
export function inline(s: string): string {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(((?:\/|https:\/\/)[^)\s]+)\)/g, (_m, label, href) => {
      const ext = href.startsWith('https://');
      return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    });
}

// Texte brut (méta, données structurées) : retire la mise en forme.
export const plain = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

export function blockHtml(b: Block): string {
  if ('p' in b) return `<p>${inline(b.p)}</p>`;
  if ('h3' in b) return `<h3>${inline(b.h3)}</h3>`;
  if ('ul' in b) return `<ul>${b.ul.map(i => `<li>${inline(i)}</li>`).join('')}</ul>`;
  if ('ol' in b) return `<ol>${b.ol.map(i => `<li>${inline(i)}</li>`).join('')}</ol>`;
  if ('note' in b) return `<aside class="guide-note"><p>${inline(b.note)}</p></aside>`;
  return `<div class="guide-table"><table><thead><tr>${b.table.head.map(h => `<th scope="col">${inline(h)}</th>`).join('')}</tr></thead>`
    + `<tbody>${b.table.rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const frDate = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d === 1 ? '1er' : d} ${MONTHS[m - 1]} ${y}`; };

export const guideMetaTitle = (g: Guide) => `${g.metaTitle} | Marchés Direct`;

export function guideJsonLd(g: Guide, site: string): object[] {
  const url = `${site}${guidePath(g.slug)}`;
  const org = { '@type': 'Organization', name: 'Marchés Direct', url: site };
  return [
    { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.description, inLanguage: 'fr-FR',
      datePublished: g.published, dateModified: g.updated, author: org, publisher: org, mainEntityOfPage: url },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${site}/` },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${site}${GUIDES_BASE}` },
      { '@type': 'ListItem', position: 3, name: g.title, item: url }] },
    ...(g.faq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: g.faq.map(f => ({
      '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })) }] : []),
  ];
}

// Corps HTML complet d'un guide (pré-rendu serveur). L'application affiche les mêmes blocs avec ses propres styles.
export function guideBodyHtml(g: Guide, related: Guide[]): string {
  return [
    `<nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › <a href="${GUIDES_BASE}">Guides</a></nav>`,
    `<h1>${esc(g.title)}</h1>`,
    `<p>Mis à jour le ${frDate(g.updated)} · règles vérifiées le ${frDate(g.checked)} · ${g.minutes} min de lecture</p>`,
    `<section><h2>En bref</h2><ul>${g.summary.map(s => `<li>${inline(s)}</li>`).join('')}</ul></section>`,
    `<nav aria-label="Sommaire"><h2>Sommaire</h2><ol>${g.sections.map(s => `<li><a href="#${s.id}">${esc(s.h2)}</a></li>`).join('')}</ol></nav>`,
    ...g.sections.map(s => `<section id="${s.id}"><h2>${esc(s.h2)}</h2>${s.blocks.map(blockHtml).join('')}</section>`),
    g.faq.length ? `<section><h2>Questions fréquentes</h2>${g.faq.map(f => `<h3>${esc(f.q)}</h3><p>${inline(f.a)}</p>`).join('')}</section>` : '',
    `<section><h2>Sources officielles</h2><ul>${g.sources.map(s => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul></section>`,
    related.length ? `<section><h2>À lire aussi</h2><ul>${related.map(r => `<li><a href="${guidePath(r.slug)}">${esc(r.title)}</a></li>`).join('')}</ul></section>` : '',
    `<p><a href="/marches-publics">Voir les marchés publics ouverts près de chez vous</a></p>`,
    `<p>Ce guide est une information générale, pas un conseil juridique. Marchés Direct est une plateforme indépendante.</p>`,
  ].join('');
}
