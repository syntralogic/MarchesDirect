import { useState, useMemo } from 'react';
import { Search, MapPin, SlidersHorizontal, X, Filter } from 'lucide-react';
import { useOpportunities } from '@/hooks/use-opportunities';
import { useTrades } from '@/hooks/use-trades';
import { useLang } from '@/contexts/LangContext';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { OpportunitiesPendingState } from '@/components/OpportunitiesPendingState';
import { OpportunityListCard } from '@/components/OpportunityListCard';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import PageMeta from '@/components/common/PageMeta';

// label -> raw INSEE department code, since opportunities store the bare
// code (e.g. "92") in `department`, not this display label.
const DEPARTMENTS: { label: string; code: string }[] = [
  { label: 'Tous', code: 'Tous' },
  { label: 'Hauts-de-Seine (92)', code: '92' },
  { label: 'Yvelines (78)', code: '78' },
  { label: 'Alpes-Maritimes (06)', code: '06' },
  { label: 'Isère (38)', code: '38' },
  { label: 'Rhône (69)', code: '69' },
];

export default function SousTraitancePage() {
  const { t } = useLang();
  const { companyKnown } = useCompanyKnown();
  const { opportunities: mockSubcontractingOpportunities, loading, error, total, hasMore, loadingMore, loadMore } = useOpportunities('subcontracting');
  const trades = useTrades();
  const [mode, setMode] = useState<'chantier' | 'partenaire'>('chantier');
  const [location, setLocation] = useState('');
  const [dept, setDept] = useState('Tous');
  const [profession, setProfession] = useState('Tous');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return mockSubcontractingOpportunities.filter(o => {
      if (location && !o.location.toLowerCase().includes(location.toLowerCase())) return false;
      if (dept !== 'Tous' && o.department !== dept) return false;
      // Filters against the real trade_name-backed `sector` field - see
      // useTrades for why `o.category` (never populated by the API adapter)
      // silently returned zero results for any non-default selection.
      if (profession !== 'Tous' && o.sector !== profession) return false;
      return true;
    });
  }, [location, dept, profession, mockSubcontractingOpportunities]);

  const resetFilters = () => { setLocation(''); setDept('Tous'); setProfession('Tous'); };
  const hasFilters = location || dept !== 'Tous' || profession !== 'Tous';

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('searchLocation')}</label>
        <div className="relative">
          <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
          <input type="text" placeholder={t('subLocationPlaceholder')} value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('subDept')}</label>
        <select value={dept} onChange={e => setDept(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none appearance-none">
          {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('subJob')}</label>
        <select value={profession} onChange={e => setProfession(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none appearance-none">
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
      <PageMeta title="Sous-traitance BTP — Marchés Direct" description="Trouvez une mission de sous-traitance ou publiez un besoin de renfort partout en France. Mettez-vous en relation directement avec des entreprises du bâtiment." />
      
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
        <span className="text-[10px] font-bold text-orange uppercase tracking-widest mb-1 block">{t('subTag')}</span>
        <h1 className="text-xl md:text-3xl font-extrabold text-white mb-2">{t('subTitle')}</h1>
        <p className="text-[#B9BBC8] text-xs md:text-sm leading-snug max-w-2xl">{t('subSub')}</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-4 bg-[#061D32] border border-[#17334D] rounded-lg p-1 w-fit">
        <button onClick={() => setMode('chantier')} className={`px-4 py-1.5 rounded-md text-[10px] md:text-xs font-semibold transition-colors ${mode === 'chantier' ? 'bg-orange text-white' : 'text-[#B9BBC8] hover:text-white'}`}>
          {t('subModeChantier')}
        </button>
        <button onClick={() => setMode('partenaire')} className={`px-4 py-1.5 rounded-md text-[10px] md:text-xs font-semibold transition-colors ${mode === 'partenaire' ? 'bg-orange text-white' : 'text-[#B9BBC8] hover:text-white'}`}>
          {t('subModePartenaire')}
        </button>
      </div>

      {/* Mobile: Search & Filters */}
      <div className="md:hidden mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <input type="text" placeholder={t('subLocationPlaceholder')} value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange" />
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
              <span className="text-orange">{filtered.length}</span> {filtered.length !== 1 ? t('subResultsPlural') : t('subResults')}
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
                compatible={companyKnown}
                to={mode === 'chantier' ? `/sous-traitance/mission/${o.id}` : `/sous-traitance/mise-en-relation?oid=${o.id}`}
                ctaLabel={t('searchView')}
              />
            ))}
          </div>

          <LoadMoreButton
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            total={total}
            shown={mockSubcontractingOpportunities.length}
          />
        </div>
      </div>
    </div>
  );
}