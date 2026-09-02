import { useState, useMemo } from 'react';
import { Search, MapPin, SlidersHorizontal, X, Filter } from 'lucide-react';
import { useOpportunities } from '@/hooks/use-opportunities';
import { useTrades } from '@/hooks/use-trades';
import { useMatchScores } from '@/hooks/use-match-scores';
import { useLang } from '@/contexts/LangContext';
import { OpportunitiesPendingState } from '@/components/OpportunitiesPendingState';
import { OpportunityListCard } from '@/components/OpportunityListCard';
import PageMeta from '@/components/common/PageMeta';

export default function AppelsPage() {
  const { t } = useLang();
  const { opportunities: mockPrivateOpportunities, loading, error } = useOpportunities('tender');
  const trades = useTrades();
  const [location, setLocation] = useState('');
  const [sector, setSector] = useState('Tous');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return mockPrivateOpportunities.filter(o => {
      if (location && !o.location.toLowerCase().includes(location.toLowerCase())) return false;
      // Filters against the real trade_name-backed `sector` field - the old
      // hardcoded SECTORS/CATEGORIES label lists never matched actual data
      // (see useTrades for why), so any non-default selection silently
      // returned zero results.
      if (sector !== 'Tous' && o.sector !== sector) return false;
      return true;
    });
  }, [location, sector, mockPrivateOpportunities]);

  const resetFilters = () => { setLocation(''); setSector('Tous'); };
  const hasFilters = location || sector !== 'Tous';
  const { scores: matchScores, canScore } = useMatchScores(filtered.map(o => o.id));

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
          {trades.map(name => <option key={name} value={name}>{name}</option>)}
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
              <button onClick={() => setFiltersOpen(false)}><X size={18} className="text-[#B9BBC8]" /></button>
            </div>
            <FilterPanel />
            <button onClick={() => setFiltersOpen(false)} className="w-full mt-5 bg-orange text-white font-semibold text-sm py-3 rounded-xl">
              {t('searchButton')} ({filtered.length})
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
            {!error && <h2 className="text-xs font-bold text-white">
              <span className="text-orange">{filtered.length}</span> {filtered.length !== 1 ? t('appelsResultsPlural') : t('appelsResults')}
            </h2>}
          </div>

          {loading && <div className="text-center text-[11px] text-[#B9BBC8] py-8">Chargement des opportunités...</div>}
          {!loading && error && <OpportunitiesPendingState />}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center text-[11px] text-[#B9BBC8] py-8">Aucune opportunité ne correspond à ces critères.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((o) => (
              <OpportunityListCard
                key={o.id}
                opportunity={o}
                matchScore={matchScores[o.id]?.score}
                canScore={canScore}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}