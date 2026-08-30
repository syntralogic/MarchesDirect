import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { seoPagesApi, getApiErrorMessage, type ApiSeoPage } from '@/lib/apiClient';
import { trackVisitorEvent } from '@/lib/visitorTracking';
import { useLang } from '@/contexts/LangContext';

export default function SeoLandingPage() {
  const { t } = useLang();
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<ApiSeoPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    seoPagesApi
      .getBySlug(slug)
      .then((data) => {
        if (!cancelled) {
          setPage(data);
          trackVisitorEvent('view_seo_page', data.page_title || slug, undefined, { slug });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, t('seoNotFound')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug, t]);

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
        <Link to="/recherche" className="text-orange font-semibold text-sm hover:underline">
          {t('seoViewAllOpportunities')}
        </Link>
      </div>
    );
  }

  const searchParams = new URLSearchParams();
  if (page.filter_region) searchParams.set('region', page.filter_region);
  if (page.filter_city) searchParams.set('city', page.filter_city);
  if (page.filter_department) searchParams.set('department', page.filter_department);
  if (page.filter_trade_id) searchParams.set('trade_id', String(page.filter_trade_id));
  if (page.filter_journey) searchParams.set('journey', page.filter_journey);

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <PageMeta title={page.page_title || page.page_slug} description={page.page_meta_description || ''} />

      <div className="mb-6">
        {(page.filter_region || page.filter_city) && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange uppercase tracking-widest mb-3">
            <MapPin size={12} />
            {page.filter_region || page.filter_city}
          </span>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
          {page.page_title}
        </h1>
      </div>

      <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed mb-8">
        {page.page_content}
      </p>

      <Link
        to={`/recherche?${searchParams.toString()}`}
        className="inline-flex items-center gap-2 bg-orange text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-orange/90 transition-colors"
      >
        <Search size={16} />
        {t('seoViewAllOpportunities')}
      </Link>
    </div>
  );
}