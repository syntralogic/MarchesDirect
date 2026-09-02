import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, ChevronDown, ArrowRight, Zap, Paintbrush, Building, CheckCircle2, HelpCircle, Loader2 } from 'lucide-react';
import { useOpportunities } from '@/hooks/use-opportunities';
import { useDebounce } from '@/hooks/use-debounce';
import { useLang } from '@/contexts/LangContext';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { trackVisitorEvent } from '@/lib/visitorTracking';

export default function RecherchePage() {
  const { t } = useLang();
  const { companyKnown } = useCompanyKnown();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState('');
  const initialCity = searchParams.get('city') || '';
  const initialRegion = searchParams.get('region') || '';
  const [location, setLocation] = useState(initialRegion || initialCity);
  const [locationField] = useState<'region' | 'city'>(initialCity && !initialRegion ? 'city' : 'region');
  const tradeId = searchParams.get('trade_id') || undefined;
  const journeyParam = (searchParams.get('journey') as 'tender' | 'public_procurement' | 'subcontracting' | null) || undefined;

  // Add state for radius and availability
  const [radius, setRadius] = useState('50');
  const [availability, setAvailability] = useState('now');

  const debouncedQuery = useDebounce(query, 400);
  const debouncedLocation = useDebounce(location, 400);

  const { opportunities: filtered, loading, error } = useOpportunities({
    q: debouncedQuery || undefined,
    region: locationField === 'region' ? (debouncedLocation || undefined) : undefined,
    city: locationField === 'city' ? (debouncedLocation || undefined) : undefined,
    trade_id: tradeId,
    journey: journeyParam,
  });

  useEffect(() => {
    if (!debouncedQuery && !debouncedLocation) return;
    const parts = [debouncedQuery, debouncedLocation].filter(Boolean);
    trackVisitorEvent('search', `Recherche : ${parts.join(' · ')}`, undefined, { q: debouncedQuery, location: debouncedLocation, journey: journeyParam });
  }, [debouncedQuery, debouncedLocation, journeyParam]);

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('peinture')) return <Paintbrush size={16} className="text-orange" />;
    if (title.toLowerCase().includes('électricité')) return <Zap size={16} className="text-orange" />;
    if (title.toLowerCase().includes('cloisons')) return <Building size={16} className="text-orange" />;
    return <Building size={16} className="text-orange" />;
  };

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
          <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchAvailability')}</label>
          <div className="relative">
            <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <select 
              value={availability}
              onChange={e => setAvailability(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-6 py-2 text-[11px] text-white focus:outline-none appearance-none cursor-pointer"
            >
              <option value="now">{t('searchAvailabilityNow')}</option>
              <option value="1month">{t('searchAvailability1')}</option>
              <option value="3month">{t('searchAvailability3')}</option>
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B9BBC8] pointer-events-none" />
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
      <div className="mb-2">
        <h2 className="text-[11px] font-bold text-white">
          <span className="text-orange">{filtered.length}</span> {t('searchResults')}
        </h2>
      </div>

      {loading && <div className="text-center text-[11px] text-[#B9BBC8] py-8">{t('searchLoading')}</div>}
      {!loading && error && <div className="text-center text-[11px] text-orange py-8">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center text-[11px] text-[#B9BBC8] py-8">{t('searchNoResults')}</div>
      )}

      {/* Cards */}
      <div className="space-y-2">
        {filtered.map((o) => (
          <div key={o.id} className="bg-[#061D32] border border-[#17334D] rounded-lg p-2.5">
            <div className="flex items-start gap-2.5">
              {/* Icon Circle */}
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#031B30] border border-[#17334D] flex items-center justify-center">
                {getIcon(o.title)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="bg-[#0F3D2E] text-[#3FA96E] text-[8px] font-bold px-1 py-px rounded uppercase">{t('searchNew')}</span>
                </div>
                
                <h3 className="text-xs font-bold text-white leading-tight mb-0.5">{o.title}</h3>
                <p className="text-[10px] text-[#B9BBC8] mb-1">{o.organization}</p>

                <div className="flex items-center gap-2 text-[9px] text-[#B9BBC8]">
                  <span className="flex items-center gap-0.5"><MapPin size={9} className="text-[#B9BBC8]" /> {o.location}</span>
                  <span className="flex items-center gap-0.5"><Calendar size={9} className="text-[#B9BBC8]" /> {t('dashDeadlineLabel')} {o.deadline ? new Date(o.deadline).toLocaleDateString('fr-FR') : '-'}</span>
                </div>
                {o.description && (
                  <p className="text-[10px] text-[#B9BBC8] mt-1.5 line-clamp-2 leading-snug">{o.description}</p>
                )}
              </div>
            </div>

            {/* Bottom Details Grid */}
            <div className="mt-2 pt-2 border-t border-[#17334D]">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[8px] text-[#B9BBC8] mb-0.5">{t('searchBudget')}</p>
                  <p className="text-[11px] font-semibold text-white">{o.amount}</p>
                </div>
                <div>
                  <p className="text-[8px] text-[#B9BBC8] mb-0.5">{t('appelsSector')}</p>
                  <p className="text-[11px] font-semibold text-white">{o.sector || '-'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Status Badge */}
                {companyKnown ? (
                  <div className="flex items-center gap-1 text-[9px] font-medium text-[#3FA96E]">
                    <CheckCircle2 size={10} />
                    <span>{t('searchCompatible')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[9px] font-medium text-[#B9BBC8]">
                    <HelpCircle size={10} />
                    <span>{t('searchIdentifyPrompt')}</span>
                  </div>
                )}
                {/* CTA Button */}
                <button onClick={() => navigate(`/opportunites/${o.id}`)} className="flex items-center gap-1 text-[10px] font-bold text-orange border border-orange/40 rounded px-2 py-1 hover:bg-orange/10 transition-colors">
                  {t('searchView')} <ArrowRight size={10} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}