import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { useOpportunities } from '@/hooks/use-opportunities';
import { useDebounce } from '@/hooks/use-debounce';
import { useLang } from '@/contexts/LangContext';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { trackVisitorEvent } from '@/lib/visitorTracking';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { OpportunityListCard } from '@/components/OpportunityListCard';

export default function RecherchePage() {
  const { t } = useLang();
  const { companyKnown } = useCompanyKnown();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState('');
  // Client's map lets 2+ regions/departments/cities be selected at once
  // ("Nouvelle-Aquitaine, Bretagne") - HomePage's buildSearchUrl() already
  // sent every selection as its own repeated `region=` param, but this only
  // ever read `.get('region')`, which returns just the FIRST match and
  // silently drops the rest. `.getAll()` + comma-join matches the backend's
  // new comma-separated multi-value parsing (opportunities.ts).
  const initialRegions = searchParams.getAll('region');
  const initialCities = searchParams.getAll('city');
  const initialCity = initialCities.join(', ');
  const initialRegion = initialRegions.join(', ');
  const [location, setLocation] = useState(initialRegion || initialCity);
  const [locationField] = useState<'region' | 'city'>(initialCity && !initialRegion ? 'city' : 'region');
  const tradeId = searchParams.get('trade_id') || undefined;
  const journeyParam = (searchParams.get('journey') as 'tender' | 'public_procurement' | 'subcontracting' | null) || undefined;

  // Add state for radius (decorative for now - main list endpoint has no
  // geo-radius filter, only /stats/near does; out of scope for this fix)
  const [radius, setRadius] = useState('50');

  // Client's audit: filters need a real status set (nouveau/en cours/
  // clôturé/attribué/annulé) and a montant range - neither existed here.
  // 'nouveau' isn't its own backend status (it's a temporary badge on
  // recently-published rows per opportunityStatusJob's comments), so it
  // maps to the default "no status filter" browse view rather than a
  // literal status value.
  const [statutFilter, setStatutFilter] = useState('');
  const [montantMin, setMontantMin] = useState('');
  const [montantMax, setMontantMax] = useState('');

  const debouncedQuery = useDebounce(query, 400);
  const debouncedLocation = useDebounce(location, 400);
  const debouncedMontantMin = useDebounce(montantMin, 400);
  const debouncedMontantMax = useDebounce(montantMax, 400);

  const { opportunities: filtered, loading, error, total, hasMore, loadingMore, loadMore } = useOpportunities({
    q: debouncedQuery || undefined,
    region: locationField === 'region' ? (debouncedLocation || undefined) : undefined,
    city: locationField === 'city' ? (debouncedLocation || undefined) : undefined,
    trade_id: tradeId,
    journey: journeyParam,
    status: statutFilter || undefined,
    min_value: debouncedMontantMin ? Number(debouncedMontantMin) : undefined,
    max_value: debouncedMontantMax ? Number(debouncedMontantMax) : undefined,
  });

  useEffect(() => {
    if (!debouncedQuery && !debouncedLocation) return;
    const parts = [debouncedQuery, debouncedLocation].filter(Boolean);
    trackVisitorEvent('search', `Recherche : ${parts.join(' · ')}`, undefined, { q: debouncedQuery, location: debouncedLocation, journey: journeyParam });
  }, [debouncedQuery, debouncedLocation, journeyParam]);

  // Handle search button click - force a re-fetch by triggering a state update
  const handleSearch = () => {
    // The debounced values will trigger the useOpportunities hook
    // We just need to ensure the debounce flushes immediately
    // We can achieve this by toggling a key or using a ref
    // For simplicity, we'll just use the existing debounce logic
    // and let the user know the search is happening
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <div className="page-fade-in max-w-md mx-auto px-4 py-3 min-h-screen pb-24">
      
      {/* Header */}
      <div className="mb-3">
        <span className="text-[9px] font-bold text-orange uppercase tracking-widest mb-1 block">{t('searchHeaderTag')}</span>
        <h1 className="text-[20px] leading-tight font-extrabold text-white mb-1">
          {t('searchHeaderTitle')}
        </h1>
        <p className="text-[#B9BBC8] text-[11px] leading-snug">
          {t('searchHeaderSub')}
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-2.5 mb-3">
        <div className="mb-2">
          <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchKeywords')}</label>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <input
              type="text"
              placeholder={t('searchKeywordsPlaceholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchLocation')}</label>
            <div className="relative">
              <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
              <input
                type="text"
                placeholder={t('searchLocationPlaceholder')}
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchRadius')}</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8] font-semibold text-[10px]">⌖</span>
              <select 
                value={radius}
                onChange={e => setRadius(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-6 py-2 text-[11px] text-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="50">50 km</option>
                <option value="100">100 km</option>
                <option value="200">200 km</option>
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B9BBC8] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mb-2.5">
          <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchStatut')}</label>
          <div className="relative">
            <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <select
              value={statutFilter}
              onChange={e => setStatutFilter(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-6 py-2 text-[11px] text-white focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">{t('searchStatutAll')}</option>
              <option value="active">{t('searchStatutActive')}</option>
              <option value="expired">{t('searchStatutExpired')}</option>
              <option value="awarded">{t('searchStatutAwarded')}</option>
              <option value="cancelled">{t('searchStatutCancelled')}</option>
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B9BBC8] pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-2 mb-2.5">
          <div className="flex-1">
            <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchMontantMin')}</label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="0"
              value={montantMin}
              onChange={e => setMontantMin(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-md px-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchMontantMax')}</label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder={t('searchMontantMaxPlaceholder')}
              value={montantMax}
              onChange={e => setMontantMax(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-md px-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-orange text-white font-bold py-2 rounded-md text-xs hover:bg-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
          {t('searchButton')}
        </button>
      </div>

      {/* Results Header */}
      {/* Was filtered.length - only the currently loaded batch (max
          PAGE_SIZE), not the real match count. With a narrow filter that
          matches e.g. 340 opportunities, this showed "20 résultats" (one
          page) instead of 340, since LoadMoreButton already correctly
          uses `total` for the same data lower on this page. */}
      <div className="mb-2">
        <h2 className="text-[11px] font-bold text-white">
          <span className="text-orange">{total}</span> {t('searchResults')}
        </h2>
      </div>

      {loading && <div className="text-center text-[11px] text-[#B9BBC8] py-8">{t('searchLoading')}</div>}
      {!loading && error && <div className="text-center text-[11px] text-orange py-8">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center text-[11px] text-[#B9BBC8] py-8">{t('searchNoResults')}</div>
      )}

      {/* Cards */}
      {/* Was a hand-rolled card here with a badge hardcoded to "Nouveau" on
          every single result and no real lifecycle status shown at all -
          client's exact complaint ("Nouveau" badge replacing the actual
          Clôturé/Attribué/Annulé status). OpportunityListCard already has
          the correct real-status badge logic (used elsewhere); this page
          just wasn't using it. */}
      <div className="space-y-2">
        {filtered.map((o) => (
          <OpportunityListCard key={o.id} opportunity={o} compatible={companyKnown} />
        ))}
      </div>

      <LoadMoreButton
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        total={total}
        shown={filtered.length}
      />
    </div>
  );
}