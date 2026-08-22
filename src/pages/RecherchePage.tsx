import { useState, useMemo } from 'react';
import { Search, Filter, X, SlidersHorizontal, MapPin } from 'lucide-react';
import { mockPublicOpportunities, mockPrivateOpportunities, mockSubcontractingOpportunities } from '@/data/mockData';
import { OpportunityCard } from '@/components/OpportunityCard';

const ALL_OPPS = [...mockPublicOpportunities, ...mockPrivateOpportunities, ...mockSubcontractingOpportunities];
const TYPES = ['Tous', 'Marchés publics', "Appels d'offres", 'Sous-traitance'];
const SECTORS = ['Tous', 'Travaux & construction', 'Énergie & environnement', 'Industrie & maintenance', 'Informatique & télécoms', 'Transport & logistique', 'Services aux entreprises'];
const REGIONS = ['Toutes', 'Île-de-France', 'Auvergne-Rhône-Alpes', 'Hauts-de-France', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire'];
const AMOUNTS = ['Tous', 'Moins de 50 000 €', '50 000 – 200 000 €', '200 000 – 1 000 000 €', 'Plus de 1 000 000 €'];

function typeMatch(type: string, oType: string) {
  if (type === 'Tous') return true;
  if (type === 'Marchés publics') return oType === 'public';
  if (type === "Appels d'offres") return oType === 'private';
  if (type === 'Sous-traitance') return oType === 'subcontracting';
  return true;
}

export default function RecherchePage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('Tous');
  const [sector, setSector] = useState('Tous');
  const [region, setRegion] = useState('Toutes');
  const [amount, setAmount] = useState('Tous');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    return ALL_OPPS.filter(o => {
      if (query && !o.title.toLowerCase().includes(query.toLowerCase()) && !o.organization.toLowerCase().includes(query.toLowerCase())) return false;
      if (!typeMatch(type, o.type)) return false;
      if (sector !== 'Tous' && o.sector !== sector) return false;
      return true;
    });
  }, [query, type, sector]);

  const resetFilters = () => { setQuery(''); setType('Tous'); setSector('Tous'); setRegion('Toutes'); setAmount('Tous'); };
  const hasFilters = query || type !== 'Tous' || sector !== 'Tous' || region !== 'Toutes' || amount !== 'Tous';

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2 block">Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2 block">Région</label>
        <select value={region} onChange={e => setRegion(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2 block">Secteur</label>
        <select value={sector} onChange={e => setSector(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2 block">Montant</label>
        <select value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
          {AMOUNTS.map(a => <option key={a} value={a}>{a}</option>)}
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
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Recherche</h1>
        <p className="text-[#B9BBC8] text-sm">Retrouvez toutes les opportunités disponibles sur Marchés Direct.</p>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par titre, organisation, métier..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange transition-colors"
        />
      </div>

      {/* Mobile filter button */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <span className="text-sm text-[#B9BBC8]"><span className="text-white font-semibold">{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setFiltersOpen(true)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${hasFilters ? 'border-orange text-orange bg-orange/10' : 'border-[#17334D] text-[#B9BBC8]'}`}>
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
          <div className="hidden md:flex items-center justify-between mb-4">
            <span className="text-sm text-[#B9BBC8]"><span className="text-white font-semibold">{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}</span>
            <select className="bg-[#061D32] border border-[#17334D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none appearance-none">
              <option>Trier : Plus récents</option>
              <option>Trier : Meilleur match</option>
              <option>Trier : Échéance proche</option>
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-10 text-center">
              <Search size={32} className="text-[#B9BBC8] mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Aucun résultat</h3>
              <p className="text-[#B9BBC8] text-sm">Essayez d'autres mots-clés ou réinitialisez les filtres.</p>
              <button onClick={resetFilters} className="mt-4 text-orange text-sm font-semibold hover:underline">Réinitialiser</button>
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
