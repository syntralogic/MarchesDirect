import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, X, Filter } from 'lucide-react';
import { useOpportunities } from '@/hooks/use-opportunities';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { useTrades } from '@/hooks/use-trades';
import { useMatchScores } from '@/hooks/use-match-scores';
import { useLang } from '@/contexts/LangContext';
import { OpportunitiesPendingState } from '@/components/OpportunitiesPendingState';
import { OpportunityListCard } from '@/components/OpportunityListCard';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import PageMeta from '@/components/common/PageMeta';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';

export default function AppelsPage() {
  const { t } = useLang();
  const trades = useTrades();
  // Filters live in the URL, not just component state - previously pure
  // useState, so a card link into an opportunity then browser-back
  // remounted this page fresh and silently dropped whatever métier/ville
  // the visitor had selected (client's "liens de métiers perdaient le
  // métier sélectionné" report).
  const [searchParams, setSearchParams] = useSearchParams();
  const [location, setLocationState] = useState(searchParams.get('city') || '');
  const [sector, setSectorState] = useState(searchParams.get('sector') || 'Tous');
  const [filtersOpen, setFiltersOpen] = useState(false);
  useBodyScrollLock(filtersOpen); // L01: mobile filter drawer no longer lets the page scroll behind it

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'Tous') next.delete(key); else next.set(key, value);
    setSearchParams(next, { replace: true });
  };
  const setLocation = (v: string) => { setLocationState(v); updateParam('city', v); };
  const setSector = (v: string) => { setSectorState(v); updateParam('sector', v); };

  const selectedTradeId = sector === 'Tous' ? undefined : trades.find(tr => tr.name === sector)?.id;

  const { opportunities: results, loading, error, total, hasMore, loadingMore, loadMore } = useOpportunities({
    journey: 'tender',
    city: location || undefined,
    trade_id: selectedTradeId,
  });

  const resetFilters = () => { setLocation(''); setSector('Tous'); };
  useScrollRestore(!loading);
  const hasFilters = location || sector !== 'Tous';
  const { scores: matchScores, canScore } = useMatchScores(results.map(o => o.id));

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('appelsLocation')}</label>
        <div className="relative">
          <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
          <input type="text" placeholder={t('appelsLocationPlaceholder')} value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('appelsSector')}</label>
        <select value={sector} onChange={e => setSector(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none appearance-none">
          <option value="Tous">Tous</option>
          {trades.map(tr => <option key={tr.id} value={tr.name}>{tr.name}</option>)}
        </select>
      </div>
      {hasFilters && (
        <button onClick={resetFilters} className="w-full flex items-center justify-center gap-2 border border-[#17334D] text-[#B9BBC8] text-xs py-2.5 rounded-lg hover:border-orange/40 hover:text-white transition-colors">
          <X size={13} /> {t('appelsReset')}
        </button>
      )}
    </div>
  );

  return (
    <div className="page-fade-in max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 pb-24">
      <PageMeta title="Appels d'offres privés — Marchés Direct" description="Consultez les appels d'offres privés ouverts partout en France : BTP, industrie, services. Analysez votre compatibilité et candidatez directement." />
      
      {/* MOBILE FILTER MODAL (AT THE TOP) */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setFiltersOpen(false)} />
          <div className="relative w-[95%] bg-[#031B30] border border-[#17334D] rounded-2xl p-5 max-h-[85dvh] overflow-y-auto z-10 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-sm">{t('appelsFilters')}</h3>
              <button onClick={() => setFiltersOpen(false)} aria-label={t('close')}><X size={18} className="text-[#B9BBC8]" /></button>
            </div>
            <FilterPanel />
            <button onClick={() => setFiltersOpen(false)} className="w-full mt-5 bg-orange text-white font-semibold text-sm py-3 rounded-xl">
              {t('searchButton')} ({total})
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <span className="text-[10px] font-bold text-orange uppercase tracking-widest mb-1 block">{t('appelsTag')}</span>
        <h1 className="text-xl md:text-3xl font-extrabold text-white mb-2">{t('appelsTitle')}</h1>
        <p className="text-[#B9BBC8] text-xs md:text-sm leading-snug max-w-2xl">{t('appelsSub')}</p>
      </div>

      {/* Mobile: Search & Filters */}
      <div className="md:hidden mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <input type="text" placeholder={t('appelsLocationPlaceholder')} value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange" />
          </div>
          <button onClick={() => setFiltersOpen(true)} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-medium ${hasFilters ? 'border-orange text-orange bg-orange/10' : 'border-[#17334D] text-[#B9BBC8]'}`}>
            <SlidersHorizontal size={13} /> {t('appelsFilters')}
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 sticky top-20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Filter size={14} className="text-orange" /> {t('appelsFilters')}</h3>
              {hasFilters && <button onClick={resetFilters} className="text-xs text-orange hover:underline">{t('appelsReset')}</button>}
            </div>
            <FilterPanel />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            {/* Client (19 Sep): same "0 opportunités" + spinner shown
                together during the initial load - see OpportunityJourneyPage
                for the full writeup. */}
            {loading ? (
              <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
            ) : (
              !error && <h2 className="text-xs font-bold text-white">
                <span className="text-orange">{total}</span> {total !== 1 ? t('appelsResultsPlural') : t('appelsResults')}
              </h2>
            )}
          </div>

          {loading && <div className="text-center text-[11px] text-[#B9BBC8] py-8">Chargement des opportunités...</div>}
          {!loading && error && <OpportunitiesPendingState />}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-10 px-4">
              {hasFilters ? (
                <>
                  <p className="text-[11px] text-[#B9BBC8] mb-2">{t('appelsEmptyFiltered') || 'Aucune opportunité ne correspond à ces critères.'}</p>
                  <button onClick={resetFilters} className="text-xs font-semibold text-orange hover:underline">{t('appelsReset') || 'Réinitialiser les filtres'}</button>
                </>
              ) : (
                // Client report (appels d'offres privés quasi vides):
                // BOAMP/PLACE/TED/DECP only cover public procurement -
                // Batiweb is the sole private-tender source, so this pool
                // is genuinely thin right now regardless of filters. The
                // old flat "no match for these criteria" message was
                // misleading with zero filters applied - it implies
                // narrowing is the problem when the real issue is volume.
                // Said honestly instead, with somewhere else to go.
                <>
                  <p className="text-[11px] text-[#B9BBC8] max-w-[42ch] mx-auto mb-3">
                    {t('appelsEmptyNoFilters') || "Peu d'appels d'offres privés sont disponibles pour le moment - de nouvelles opportunités sont ajoutées régulièrement."}
                  </p>
                  <a href="/marches-publics" className="text-xs font-semibold text-orange hover:underline">
                    {t('appelsEmptyCta') || 'Voir les marchés publics en attendant →'}
                  </a>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((o) => (
              <OpportunityListCard
                key={o.id}
                opportunity={o}
                matchScore={matchScores[o.id]?.score}
                canScore={canScore}
              />
            ))}
          </div>

          <LoadMoreButton
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            total={total}
            shown={results.length}
          />
        </div>
      </div>
    </div>
  );
}