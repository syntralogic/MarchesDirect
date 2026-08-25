import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { seoPagesApi, getApiErrorMessage, type ApiSeoPage } from '@/lib/apiClient';

export default function SeoLandingPage() {
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
        if (!cancelled) setPage(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Page introuvable.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

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
        <h1 className="text-xl font-bold text-white mb-2">Page introuvable</h1>
        <p className="text-[#B9BBC8] text-sm mb-6">Cette page n'existe pas ou n'est plus disponible.</p>
        <Link to="/recherche" className="text-orange font-semibold text-sm hover:underline">
          Voir toutes les opportunités
        </Link>
      </div>
    );
  }

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <PageMeta title={page.page_title || page.page_slug} description={page.page_meta_description || ''} />

      <div className="mb-6">
        {page.filter_region && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange uppercase tracking-widest mb-3">
            <MapPin size={12} />
            {page.filter_region}
          </span>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
          {page.page_title}
        </h1>
      </div>

      <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed mb-8">
        {page.page_content}
      </p>

      {/* NOTE for client: RecherchePage.tsx doesn't read URL query params yet
          (its filters are local useState only), so this can't deep-link
          straight into a pre-filtered result set today - it lands on the
          general search page. Worth wiring region/trade_id params through
          RecherchePage as a follow-up so this link is fully useful. */}
      <Link
        to="/recherche"
        className="inline-flex items-center gap-2 bg-orange text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-orange/90 transition-colors"
      >
        <Search size={16} />
        Voir les opportunités correspondantes
      </Link>
    </div>
  );
}
