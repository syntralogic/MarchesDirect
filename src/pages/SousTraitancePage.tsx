import { useState, useMemo } from 'react';
import { MapPin, Filter, X, SlidersHorizontal, Search } from 'lucide-react';
import { mockSubcontractingOpportunities } from '@/data/mockData';
import { OpportunityCard } from '@/components/OpportunityCard';

const PROFESSIONS = ['Tous', 'Maçonnerie', 'Plomberie', 'Revêtements', 'Métallerie', 'Peinture', 'Électricité'];
const DEPARTMENTS = ['Tous', 'Hauts-de-Seine (92)', 'Yvelines (78)', 'Alpes-Maritimes (06)', 'Isère (38)', 'Rhône (69)'];

export default function SousTraitancePage() {
  const [mode, setMode] = useState<'chantier' | 'partenaire'>('chantier');
  const [location, setLocation] = useState('');
  const [dept, setDept] = useState('Tous');
  const [profession, setProfession] = useState('Tous');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return mockSubcontractingOpportunities.filter(o => {
      if (location && !o.location.toLowerCase().includes(location.toLowerCase())) return false;
      if (dept !== 'Tous' && o.department !== dept) return false;
      if (profession !== 'Tous' && o.category !== profession) return false;
      return true;
    });
  }, [location, dept, profession]);

  const resetFilters = () => { setLocation(''); setDept('Tous'); setProfession('Tous'); };
  const hasFilters = location || dept !== 'Tous' || profession !== 'Tous';

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2 block">Localisation</label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Ville..." value={location} onChange={e => setLocation(e.target.value)}
            className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange" />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2 block">Département</label>
        <select value={dept} onChange={e => setDept(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2 block">Métier</label>
        <select value={profession} onChange={e => setProfession(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
          {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
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
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Entre entreprises</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-2">Sous-traitance</h1>
        <p className="text-[#B9BBC8] text-sm md:text-base max-w-2xl">Lots à reprendre entre entreprises du bâtiment. Rapidité et disponibilité en priorité.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 bg-[#061D32] border border-[#17334D] rounded-xl p-1 w-fit">
        {[{ key: 'chantier' as const, label: 'Je cherche un chantier' }, { key: 'partenaire' as const, label: 'Je cherche un partenaire' }].map(m => (
          <button key={m.key} onClick={() => setMode(m.key)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === m.key ? 'bg-orange text-white' : 'text-[#B9BBC8] hover:text-white'}`}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="md:hidden flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Ville..." value={location} onChange={e => setLocation(e.target.value)}
            className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange" />
        </div>
        <button onClick={() => setFiltersOpen(true)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${hasFilters ? 'border-orange text-orange bg-orange/10' : 'border-[#17334D] text-[#B9BBC8]'}`}>
          <SlidersHorizontal size={14} /> Filtres
        </button>
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
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[#B9BBC8]"><span className="text-white font-semibold">{filtered.length}</span> lot{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-10 text-center">
              <Search size={32} className="text-[#B9BBC8] mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Aucun résultat</h3>
              <p className="text-[#B9BBC8] text-sm">Aucune opportunité ne correspond à ces filtres.</p>
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
              <button onClick={() => setFiltersOpen(false)}><X size={18} className="text-[#B9BBC8]" /></button>
            </div>
            <FilterPanel />
            <button onClick={() => setFiltersOpen(false)} className="w-full mt-5 bg-orange text-white font-semibold py-3 rounded-xl">Voir {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</button>
          </div>
        </div>
      )}
    </div>
  );
}
