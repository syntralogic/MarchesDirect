import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { seoPagesApi } from '@/lib/apiClient';

// SEO audit 23 Oct, point 2: /marches-publics and /appels-doffres only redirected (client side) to a
// /recherche page carrying noindex, although they are the site's core topics. When opened WITHOUT any
// filter they now render a real, indexable entry page: unique copy, a way into the search, and plain
// links to the local pages. With filters in the URL the pages keep redirecting to /recherche (those
// variants stay noindex, as intended).
//
// Keep the copy below in sync with api/prerender.ts (the same text is sent in the initial HTML).
export type Journey = 'public_procurement' | 'tender' | 'subcontracting';

export const CATEGORY_COPY: Record<Journey, { base: string; title: string; description: string; h1: string; intro: string; cta: string }> = {
  public_procurement: {
    base: '/marches-publics',
    title: 'Marchés publics du bâtiment : consultations ouvertes | Marchés Direct',
    description: 'Consultez les marchés publics du bâtiment et des travaux ouverts à candidature, par métier et par zone, avec la date limite de réponse et le détail des lots.',
    h1: 'Marchés publics du bâtiment et des travaux',
    intro: "Marchés Direct rassemble les avis de marchés publics publiés par les acheteurs publics. Pour chaque marché, retrouvez le lieu des travaux, la date limite de réponse et les lots concernés, puis vérifiez en quelques clics s'il correspond à votre métier et à votre entreprise.",
    cta: 'Rechercher un marché public',
  },
  tender: {
    base: '/appels-doffres',
    title: "Appels d'offres privés du bâtiment | Marchés Direct",
    description: "Trouvez les appels d'offres privés du bâtiment et des travaux, par métier et par zone, avec la date limite de réponse et les lots concernés.",
    h1: "Appels d'offres privés du bâtiment et des travaux",
    intro: "Retrouvez les appels d'offres lancés par des maîtres d'ouvrage privés et des entreprises générales. Filtrez par métier et par zone, consultez la date limite de réponse et les lots, puis vérifiez la concordance avec votre entreprise avant de demander le dossier.",
    cta: "Rechercher un appel d'offres",
  },
  subcontracting: {
    base: '/sous-traitance',
    title: 'Sous-traitance du bâtiment : missions et chantiers | Marchés Direct',
    description: 'Trouvez des missions de sous-traitance dans le bâtiment, par métier et par zone, et mettez-vous en relation avec les entreprises qui recherchent des partenaires.',
    h1: 'Sous-traitance : missions et chantiers du bâtiment',
    intro: "Des entreprises du bâtiment recherchent des partenaires pour leurs chantiers. Parcourez les missions de sous-traitance par métier et par zone, puis proposez vos services directement.",
    cta: 'Rechercher une mission',
  },
};

interface LocalPage { page_slug: string; filter_city?: string | null; filter_department?: string | null; filter_trade_name?: string | null }

// Same clean-URL structure as api/sitemap.xml.ts and SeoLocalPage.
const localLink = (base: string, p: LocalPage): { to: string; label: string } | null => {
  const e = encodeURIComponent;
  if (p.filter_city && p.filter_trade_name) return { to: `${base}/${e(p.filter_city)}/${e(p.filter_trade_name)}`, label: `${p.filter_trade_name} à ${p.filter_city}` };
  if (p.filter_city) return { to: `${base}/${e(p.filter_city)}`, label: p.filter_city };
  if (p.filter_department) return { to: `${base}/departement/${e(p.filter_department)}`, label: `Département : ${p.filter_department}` };
  return null;
};

export default function CategoryLandingPage({ journey }: { journey: Journey }) {
  const copy = CATEGORY_COPY[journey];
  const [links, setLinks] = useState<{ to: string; label: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    seoPagesApi
      .listByJourney(journey, 60)
      .then(({ pages }) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const out: { to: string; label: string }[] = [];
        for (const p of pages) {
          const l = localLink(copy.base, p);
          if (l && !seen.has(l.to)) { seen.add(l.to); out.push(l); }
        }
        setLinks(out);
      })
      .catch(() => undefined); // links are a bonus; the page works without them
    return () => { cancelled = true; };
  }, [journey, copy.base]);

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <PageMeta title={copy.title} description={copy.description} />
      <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-snug mb-4">{copy.h1}</h1>
      <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed mb-6">{copy.intro}</p>
      <Link
        to={`/recherche?journey=${journey}`}
        className="inline-flex items-center gap-2 bg-orange text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-orange/90 transition-colors mb-10"
      >
        <Search size={16} />
        {copy.cta}
      </Link>

      {links.length > 0 && (
        <nav aria-label="Pages par zone et par métier">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
            <MapPin size={15} className="text-orange" /> Par zone et par métier
          </h2>
          <ul className="flex flex-wrap gap-2">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="inline-block text-xs text-white bg-[#031B30] border border-[#17334D] rounded-full px-3 py-1.5 hover:border-orange/50 transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
