import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Zap, Paintbrush, Building, CheckCircle2, SlidersHorizontal, X, Filter } from 'lucide-react';
import { useOpportunities } from '@/hooks/use-opportunities';
import { useTrades } from '@/hooks/use-trades';
import { useLang } from '@/contexts/LangContext';
import { OpportunitiesPendingState } from '@/components/OpportunitiesPendingState';
import { SaveButton } from '@/components/SaveButton';

const STATUSES = ['Tous', 'Non analysé', 'En cours', 'Déposé'];

export default function MarchesPublicsPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { opportunities: mockPublicOpportunities, loading, error } = useOpportunities('public_procurement');
  const trades = useTrades();
  const [location, setLocation] = useState('');
  const [sector, setSector] = useState('Tous');
  const [status, setStatus] = useState('Tous');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return mockPublicOpportunities.filter(o => {
      if (location && !o.location.toLowerCase().includes(location.toLowerCase())) return false;
      // Filters against the real trade_name-backed `sector` field - see
      // useTrades for why the old hardcoded SECTORS/CATEGORIES label lists
      // never matched real data and silently returned zero results.
      if (sector !== 'Tous' && o.sector !== sector) return false;
      if (status !== 'Tous' && o.status !== status) return false;
      return true;
    });
  }, [location, sector, status, mockPublicOpportunities]);

  const resetFilters = () => { setLocation(''); setSector('Tous'); setStatus('Tous'); };
  const hasFilters = location || sector !== 'Tous' || status !== 'Tous';

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('peinture')) return <Paintbrush size={18} className="text-orange" />;
    if (title.toLowerCase().includes('électricité')) return <Zap size={18} className="text-orange" />;
    return <Building size={18} className="text-orange" />;
  };

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
      <div>
        <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('publicStatus')}</label>
        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none appearance-none">
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
        <span className="text-[10px] font-bold text-orange uppercase tracking-widest mb-1 block">{t('publicTag')}</span>
        <h1 className="text-xl md:text-3xl font-extrabold text-white mb-2">{t('publicTitle')}</h1>
        <p className="text-[#B9BBC8] text-xs md:text-sm leading-snug max-w-2xl">{t('publicSub')}</p>
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
              <span className="text-orange">{filtered.length}</span> {filtered.length !== 1 ? t('publicResultsPlural') : t('publicResults')}
            </h2>}
          </div>

          {loading && <div className="text-center text-[11px] text-[#B9BBC8] py-8">Chargement des opportunités...</div>}
          {!loading && error && <OpportunitiesPendingState />}
          {!loading && !error && filtered.length === 0 && (
            <div className="text-center text-[11px] text-[#B9BBC8] py-8">Aucune opportunité ne correspond à ces critères.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((o) => (
              <div key={o.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-3">
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[#031B30] border border-[#17334D] flex items-center justify-center">
                    {getIcon(o.title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs md:text-sm font-bold text-white leading-tight mb-0.5">{o.title}</h3>
                    <p className="text-[10px] text-[#B9BBC8] mb-1">{o.organization}</p>
                    <div className="flex items-center gap-2 text-[9px] text-[#B9BBC8]">
                      <span className="flex items-center gap-0.5"><MapPin size={9} className="text-[#B9BBC8]" /> {o.location}</span>
                    </div>
                  </div>
                  <SaveButton opportunityId={o.id} />
                </div>

                <div className="mt-2 pt-2 border-t border-[#17334D]">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-[8px] text-[#B9BBC8] mb-0.5">{t('dashDeadlineLabel')}</p>
                      <p className="text-[11px] font-semibold text-white">{o.deadline || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-[#B9BBC8] mb-0.5">{t('searchBudget')}</p>
                      <p className="text-[11px] font-semibold text-white">{o.amount}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[9px] font-medium text-[#3FA96E]">
                      <CheckCircle2 size={10} />
                      <span>{t('searchCompatible')}</span>
                    </div>
                    <button onClick={() => navigate(`/opportunites/${o.id}`)} className="flex items-center gap-1 text-[10px] font-bold text-orange border border-orange/40 rounded px-2 py-1 hover:bg-orange/10 transition-colors">
                      {t('searchView')} <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}