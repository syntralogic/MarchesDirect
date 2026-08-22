import { useState, useMemo } from 'react';
import { Search, Filter, X, MapPin, SlidersHorizontal } from 'lucide-react';
import { mockPrivateOpportunities } from '@/data/mockData';
import { OpportunityCard } from '@/components/OpportunityCard';

const SECTORS = ['Tous', 'Travaux & construction', 'Énergie & environnement', 'Industrie & maintenance', 'Informatique & télécoms', 'Services aux entreprises'];
const CATEGORIES = ['Toutes', 'Second œuvre', 'Technique', 'Aménagement', 'Façade', 'Électricité', 'Paysagisme'];

export default function AppelsPage() {
  const [location, setLocation] = useState('');
  const [sector, setSector] = useState('Tous');
  const [category, setCategory] = useState('Toutes');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return mockPrivateOpportunities.filter(o => {
      if (location && !o.location.toLowerCase().includes(location.toLowerCase())) return false;
      if (sector !== 'Tous' && o.sector !== sector) return false;
      if (category !== 'Toutes' && o.category !== category) return false;
      return true;
    });
  }, [location, sector, category]);

  const resetFilters = () => { setLocation(''); setSector('Tous'); setCategory('Toutes'); };
  const hasFilters = location || sector !== 'Tous' || category !== 'Toutes';

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2 block">Localisation</label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Ville, département..." value={location} onChange={e => setLocation(e.target.value)}
            className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange transition-colors" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2 block">Secteur</label>
        <select value={sector} onChange={e => setSector(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2 block">Catégorie</label>
        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {hasFilters && (
        <button onClick={resetFilters} className="w-full flex items-center justify-center gap-2 border border-[#17334D] text-[#B9BBC8] text-sm py-2.5 rounded-xl hover:border-orange/40 hover:text-white transition-colors">
          <X size={14} /> Réinitialiser
        </button>
      )}
    </div>
  );

  return (
    <div className="page-fade-in max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="mb-6 md:mb-8">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Marchés privés</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-2">Appels d'offres</h1>
        <p className="text-[#B9BBC8] text-sm md:text-base max-w-2xl">Promoteurs, bailleurs et grandes entreprises. Contact direct et réactivité avant tout.</p>
      </div>

      <div className="md:hidden flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Ville, département..." value={location} onChange={e => setLocation(e.target.value)}
            className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange" />
        </div>
        <button onClick={() => setFiltersOpen(true)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${hasFilters ? 'border-orange text-orange bg-orange/10' : 'border-[#17334D] text-[#B9BBC8]'}`}>
          <SlidersHorizontal size={14} /> Filtres
        </button>
      </div>
      <div className="md:hidden mb-4">
        <span className="text-sm text-[#B9BBC8]"><span className="text-white font-semibold">{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex gap-6">
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 sticky top-20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Filter size={14} className="text-orange" /> Filtres</h3>
              {hasFilters && <button onClick={resetFilters} className="text-xs text-orange hover:underline">Réinitialiser</button>}
            </div>
            <FilterPanel />
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <div className="hidden md:flex items-center justify-between mb-4">
            <span className="text-sm text-[#B9BBC8]"><span className="text-white font-semibold">{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}</span>
            <select className="bg-[#061D32] border border-[#17334D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none appearance-none">
              <option>Trier : Plus récents</option>
              <option>Trier : Meilleur match</option>
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-10 text-center">
              <Search size={32} className="text-[#B9BBC8] mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Aucun résultat</h3>
              <p className="text-[#B9BBC8] text-sm">Aucune opportunité ne correspond à ces filtres pour le moment. Essayez d'élargir votre rayon ou de changer de métier.</p>
              <button onClick={resetFilters} className="mt-4 text-orange text-sm font-semibold hover:underline">Réinitialiser les filtres</button>
            </div>
          ) : (
            <div className="space-y-3">{filtered.map(o => <OpportunityCard key={o.id} opportunity={o} />)}</div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setFiltersOpen(false)} />
          <div className="relative w-full bg-[#031B30] border-t border-[#17334D] rounded-t-2xl p-5 max-h-[85dvh] overflow-y-auto z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">Filtres</h3>
              <button onClick={() => setFiltersOpen(false)} className="p-2 rounded-lg text-[#B9BBC8]"><X size={18} /></button>
            </div>
            <FilterPanel />
            <button onClick={() => setFiltersOpen(false)} className="w-full mt-5 bg-orange text-white font-semibold py-3 rounded-xl">Voir {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</button>
          </div>
        </div>
      )}
    </div>
  );
}
