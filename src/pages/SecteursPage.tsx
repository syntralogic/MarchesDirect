import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { tradesApi, ApiTrade } from '@/lib/apiClient';
import { tradeIcon } from '@/lib/tradeIcons';
import { useLang } from '@/contexts/LangContext';

// A04/Q04 (contre-audit 15 Sep): "generic FAQ tabs, sector families ki
// jagah concrete métiers wapas nahi laaye gaye" - this page was showing 16
// hand-written marketing "sector families" (Travaux & construction,
// Services aux entreprises...) with hardcoded opportunity counts, instead
// of the real métiers (Peinture, Plomberie, Maçonnerie...) the
// classification pipeline, search ranking and match score already use
// everywhere else. N02's fix comment on the old cards said as much
// directly: "these 16 marketing sectors don't map 1:1 onto the real
// 15-trade taxonomy" - and worked around the mismatch with a free-text
// search instead of a real filter, rather than closing the gap.
// Fetches the real taxonomy from GET /api/trades (id, name, slug,
// description, live opportunity_count) so the cards, the counts and the
// click-through filter are all the same 16 trades the rest of the app
// already reasons about - trade_id, not a marketing label, so the link
// below is an exact filter rather than a fuzzy text search.
export default function SecteursPage() {
  const { t } = useLang();
  const [trades, setTrades] = useState<ApiTrade[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    tradesApi.list()
      .then(setTrades)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 md:mb-10">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('sectorsPageTag')}</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-2">{t('sectorsPageTitle')}</h1>
        <p className="text-[#B9BBC8] text-sm max-w-2xl">
          {t('sectorsPageSub')}
        </p>
      </div>

      {!trades && !error && (
        <div className="flex items-center justify-center py-16 text-[#B9BBC8]">
          <Loader2 size={22} className="animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">{t('sectorsLoadError') || 'Impossible de charger les métiers pour le moment.'}</p>
      )}

      {/* Trades grid */}
      {trades && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trades.map(trade => {
            const Icon = tradeIcon(trade.slug);
            return (
              <Link
                key={trade.id}
                to={`/recherche?trade_id=${trade.id}`}
                className="group bg-[#061D32] border border-[#17334D] rounded-2xl p-5 hover:border-orange/40 transition-all flex flex-col"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white group-hover:text-orange transition-colors">{trade.name}</h3>
                    <span className="text-xs text-orange font-semibold">{trade.opportunity_count.toLocaleString('fr-FR')} opportunités</span>
                  </div>
                </div>
                {trade.description && (
                  <p className="text-xs text-[#B9BBC8] leading-relaxed mb-4">{trade.description}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-orange font-semibold mt-auto">
                  {t('sectorsSeeOpp')} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
