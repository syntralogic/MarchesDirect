import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building, Building2, Handshake, ChevronRight, ArrowLeft, ArrowRight,
  Search, X, MapPin, CheckCircle2, SlidersHorizontal, Calendar, Target,
  Paintbrush, Zap, Filter,
} from 'lucide-react';
import { useOpportunities } from '@/hooks/use-opportunities';
import { useDebounce } from '@/hooks/use-debounce';
import { cities } from '@/data/mockData';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';
import { SaveButton } from '@/components/SaveButton';
import team from '@/assets/team.jpg';

type OppType = 'Marchés publics' | "Appels d'offres" | 'Sous-traitance';

const TYPE_OPTIONS: { id: OppType; sub: string; icon: typeof Building }[] = [
  { id: 'Marchés publics', sub: 'Mairies, État, collectivités', icon: Building },
  { id: "Appels d'offres", sub: 'Promoteurs, bailleurs, grandes entreprises', icon: Building2 },
  { id: 'Sous-traitance', sub: 'Entre entreprises du bâtiment', icon: Handshake },
];

// Common trade / métier keywords used to power the step-2 autocomplete.
const TRADE_SUGGESTIONS = [
  'Climatisation', 'Chauffage / CVC', 'Installation et maintenance de climatisation',
  'Peinture', 'Électricité', 'Plomberie', 'Menuiserie', 'Maçonnerie', 'Couverture / Toiture',
  'Étanchéité', 'Serrurerie / Métallerie', 'Isolation thermique', 'Cloisons / Doublages',
  'Revêtement de sols', 'Nettoyage de chantier', 'Espaces verts',
  'Rénovation énergétique', 'Rénovation intérieure', 'Réhabilitation de bâtiments',
  'Construction neuve', 'Aménagement extérieur',
];

const RADIUS_OPTIONS = [25, 50, 100, 200];

const TYPE_SLUGS: Record<string, OppType> = {
  'marches-publics': 'Marchés publics',
  'appels-doffres': "Appels d'offres",
  'sous-traitance': 'Sous-traitance',
};

const STATUS_OPTIONS = ['Tous', 'Non analysé', 'En cours', 'Déposé'];
const DATE_OPTIONS = ['Toutes', '24 dernières heures', '7 derniers jours', '30 derniers jours'];
const DEADLINE_OPTIONS = ['Toutes', 'Cette semaine', 'Ce mois-ci', 'Dans plus de 30 jours'];
const AMOUNT_OPTIONS = ['Tous', '< 50 000 €', '50 000 € – 200 000 €', '> 200 000 €'];

function getIcon(title: string) {
  const l = title.toLowerCase();
  if (l.includes('peinture')) return <Paintbrush size={16} className="text-orange" />;
  if (l.includes('électricité') || l.includes('electricite')) return <Zap size={16} className="text-orange" />;
  return <Building size={16} className="text-orange" />;
}

export default function OpportunityJourneyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = TYPE_SLUGS[searchParams.get('type') || ''] || 'Marchés publics';
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  // Step 1 + 2 shared: selected opportunity types
  const [types, setTypes] = useState<OppType[]>([initialType]);

  // Step 2: what the user is looking for
  const [query, setQuery] = useState('');
  const [querySuggestOpen, setQuerySuggestOpen] = useState(false);

  // Step 3: location
  const [locationLabel, setLocationLabel] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [pickedCity, setPickedCity] = useState('');
  const [radius, setRadius] = useState(50);

  // Step 4 filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState('Tous');
  const [dateFilter, setDateFilter] = useState('Toutes');
  const [deadlineFilter, setDeadlineFilter] = useState('Toutes');
  const [amountFilter, setAmountFilter] = useState('Tous');

  const debouncedQuery = useDebounce(query, 350);
  const cityForApi = pickedCity.split(' — ')[0].split(',')[0].trim();

  const { opportunities, loading, error } = useOpportunities({
    q: debouncedQuery || undefined,
    city: cityForApi || undefined,
  });

  const filteredResults = useMemo(
    () => opportunities.filter(o => status === 'Tous' || o.status === status),
    [opportunities, status]
  );

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return TRADE_SUGGESTIONS.slice(0, 3);
    return TRADE_SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  }, [query]);

  const citySuggestions = useMemo(() => {
    if (!citySearch.trim()) return cities.slice(0, 5);
    return cities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 5);
  }, [citySearch]);

  const toggleType = (id: OppType) => {
    setTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const applyZone = () => {
    if (pickedCity) setLocationLabel(`${pickedCity} + ${radius} km`);
    setLocationModalOpen(false);
    setStep(4);
  };

  const stepLabels = ['Choisir une opportunité', 'Saisir son métier', 'Choisir une zone', 'Résultats et filtres'];

  return (
    <div className="page-fade-in w-full max-w-md mx-auto px-4 py-5 pb-24">

      {/* ===== Step progress ===== */}
      <div className="flex items-center gap-1.5 mb-4">
        {stepLabels.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex items-center gap-1.5 flex-1">
              <div
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                  active || done ? 'bg-orange border-orange text-white' : 'border-[#17334D] text-[#B9BBC8]'
                }`}
              >
                {n}
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-px ${step > n ? 'bg-orange' : 'bg-[#17334D]'}`} />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] font-semibold text-orange uppercase tracking-widest mb-4">
        Étape {step} — {stepLabels[step - 1]}
      </p>

      {/* ===== STEP 1: Choisir une opportunité ===== */}
      {step === 1 && (
        <div className="page-fade-in">
          <div className="border border-[#17334D] rounded-xl bg-[#061D32] p-4">
            <h1 className="text-lg font-extrabold text-white leading-tight mb-1">
              Votre prochaine opportunité <span className="text-orange">commence ici.</span>
            </h1>
            <p className="text-[#B9BBC8] text-xs leading-relaxed mb-4">
              Choisissez votre parcours ou échangez avec un conseiller Marchés Direct.
            </p>

            <div className="space-y-2 mb-4">
              {TYPE_OPTIONS.map(opt => {
                const selected = types.includes(opt.id);
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setTypes([opt.id]); setStep(2); }}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      selected ? 'border-orange bg-orange/5' : 'border-[#17334D] hover:border-orange/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{opt.id}</div>
                      <div className="text-[11px] text-[#B9BBC8]">{opt.sub}</div>
                    </div>
                    <ChevronRight size={16} className="text-orange shrink-0" />
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setApptOpen(true)} className="flex-1 bg-orange text-white font-bold py-2.5 rounded-lg text-xs hover:bg-orange/90 transition-colors">
                Prendre rendez-vous
              </button>
              <button onClick={() => setCallbackOpen(true)} className="flex-1 border border-orange text-orange font-bold py-2.5 rounded-lg text-xs hover:bg-orange/10 transition-colors">
                Être rappelé
              </button>
            </div>
          </div>

          <div className="border border-[#17334D] rounded-xl bg-[#061D32] p-3 mt-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full border border-orange overflow-hidden shrink-0">
                <img src={team} alt="Marchés Direct" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-bold text-white mb-0.5">Qui sommes-nous ?</h2>
                <p className="text-[11px] text-[#B9BBC8] leading-snug">
                  Une équipe experte à vos côtés, jusqu'à la signature de vos premiers marchés.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 2: Saisir son métier ===== */}
      {step === 2 && (
        <div className="page-fade-in border border-[#17334D] rounded-xl bg-[#061D32] p-4">
          <h1 className="text-base font-extrabold text-white mb-4">Trouver une opportunité</h1>

          <p className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2">
            Types d'opportunités — 1, 2 ou 3 choix
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {TYPE_OPTIONS.map(opt => {
              const selected = types.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleType(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                    selected ? 'border-orange bg-orange/10 text-orange' : 'border-[#17334D] text-[#B9BBC8]'
                  }`}
                >
                  {selected && <CheckCircle2 size={13} />} {opt.id}
                </button>
              );
            })}
          </div>

          <div className="mb-5 relative">
            <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">
              Que recherchez-vous ?
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setQuerySuggestOpen(true); }}
                onFocus={() => setQuerySuggestOpen(true)}
                placeholder="Métier, mot-clé…"
                className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]">
                  <X size={14} />
                </button>
              )}
            </div>
            {querySuggestOpen && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-[#031B30] border border-[#17334D] rounded-lg overflow-hidden shadow-xl">
                {filteredSuggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); setQuerySuggestOpen(false); }}
                    className="w-full text-left px-3 py-2.5 text-xs text-white hover:bg-orange/10 border-b border-[#17334D] last:border-b-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">
              Où recherchez-vous ?
            </label>
            <button
              onClick={() => setLocationModalOpen(true)}
              className="w-full flex items-center gap-2 bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-left text-sm text-[#6B7280] hover:border-orange/40 transition-colors"
            >
              <MapPin size={14} className="text-[#B9BBC8]" />
              <span className={locationLabel ? 'text-white' : ''}>
                {locationLabel || 'Ville, département, région ou France entière'}
              </span>
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex items-center justify-center gap-1.5 border border-[#17334D] text-[#B9BBC8] font-semibold py-2.5 px-4 rounded-lg text-xs hover:border-orange/40 transition-colors">
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!query.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-orange text-white font-bold py-2.5 rounded-lg text-xs hover:bg-orange/90 transition-colors disabled:opacity-40"
            >
              Continuer <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: Choisir une zone (same layout as step 2, zone modal opens over it) ===== */}
      {step === 3 && (
        <div className="page-fade-in border border-[#17334D] rounded-xl bg-[#061D32] p-4">
          <h1 className="text-base font-extrabold text-white mb-4">Trouver une opportunité</h1>

          <p className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2">
            Types d'opportunités — 1, 2 ou 3 choix
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {TYPE_OPTIONS.map(opt => {
              const selected = types.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleType(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                    selected ? 'border-orange bg-orange/10 text-orange' : 'border-[#17334D] text-[#B9BBC8]'
                  }`}
                >
                  {selected && <CheckCircle2 size={13} />} {opt.id}
                </button>
              );
            })}
          </div>

          <div className="mb-5">
            <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">
              Que recherchez-vous ?
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-9 pr-9 py-2.5 text-sm text-white focus:outline-none focus:border-orange"
              />
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">
              Où recherchez-vous ?
            </label>
            <button
              onClick={() => setLocationModalOpen(true)}
              className="w-full flex items-center gap-2 bg-[#031B30] border border-orange rounded-lg px-3 py-2.5 text-left text-sm text-white"
            >
              <MapPin size={14} className="text-orange" />
              {locationLabel || 'Ville, département, région ou France entière'}
            </button>
          </div>

          <div className="flex gap-2 mt-6">
            <button onClick={() => setStep(2)} className="flex items-center justify-center gap-1.5 border border-[#17334D] text-[#B9BBC8] font-semibold py-2.5 px-4 rounded-lg text-xs hover:border-orange/40 transition-colors">
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              onClick={() => setLocationModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-orange text-white font-bold py-2.5 rounded-lg text-xs hover:bg-orange/90 transition-colors"
            >
              Choisir une localisation <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 4: Résultats et filtres ===== */}
      {step === 4 && (
        <div className="page-fade-in">
          {/* Active filter pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {types.map(t => (
              <span key={t} className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-full border border-orange bg-orange/10 text-orange">
                <CheckCircle2 size={11} /> {t}
              </span>
            ))}
            {query && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-full border border-orange bg-orange/10 text-orange">
                <CheckCircle2 size={11} /> {query}
              </span>
            )}
            {locationLabel && (
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-full border border-orange bg-orange/10 text-orange">
                <CheckCircle2 size={11} /> {locationLabel}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-white">
              <span className="text-orange">{filteredResults.length}</span> opportunité{filteredResults.length !== 1 ? 's' : ''}
            </h2>
            <button
              onClick={() => setFiltersOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                filtersOpen ? 'border-orange text-orange bg-orange/10' : 'border-[#17334D] text-[#B9BBC8]'
              }`}
            >
              <SlidersHorizontal size={13} /> Filtres
            </button>
          </div>

          {loading && <div className="text-center text-[11px] text-[#B9BBC8] py-8">Chargement des opportunités...</div>}
          {!loading && error && <div className="text-center text-[11px] text-[#B9BBC8] py-8">{error}</div>}
          {!loading && !error && filteredResults.length === 0 && (
            <div className="text-center text-[11px] text-[#B9BBC8] py-8">Aucune opportunité ne correspond à ces critères.</div>
          )}

          <div className="space-y-2.5">
            {filteredResults.map(o => (
              <div key={o.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-3">
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[#031B30] border border-[#17334D] flex items-center justify-center">
                    {getIcon(o.title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-white leading-tight mb-0.5">{o.title}</h3>
                    <p className="text-[10px] text-[#B9BBC8] mb-1">{o.organization}</p>
                    <div className="flex items-center gap-2 text-[9px] text-[#B9BBC8]">
                      <span className="flex items-center gap-0.5"><MapPin size={9} /> {o.location}</span>
                    </div>
                  </div>
                  <SaveButton opportunityId={o.id} />
                </div>
                <div className="mt-2 pt-2 border-t border-[#17334D]">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-[8px] text-[#B9BBC8] mb-0.5">Échéance</p>
                      <p className="text-[11px] font-semibold text-white">{o.deadline || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-[#B9BBC8] mb-0.5">Montant</p>
                      <p className="text-[11px] font-semibold text-white">{o.amount}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/opportunites/${o.id}`)} className="flex items-center gap-1 text-[10px] font-bold text-orange border border-orange/40 rounded px-2 py-1 hover:bg-orange/10 transition-colors ml-auto w-fit">
                    Voir <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(3)} className="mt-4 flex items-center justify-center gap-1.5 border border-[#17334D] text-[#B9BBC8] font-semibold py-2.5 px-4 rounded-lg text-xs hover:border-orange/40 transition-colors w-full">
            <ArrowLeft size={14} /> Modifier ma recherche
          </button>
        </div>
      )}

      {/* ===== "Choisir une localisation" bottom-sheet modal (steps 2 & 3) ===== */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setLocationModalOpen(false)} />
          <div className="relative w-full md:max-w-md bg-[#031B30] border border-[#17334D] rounded-t-2xl md:rounded-2xl shadow-2xl z-10 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#17334D]">
              <h3 className="text-sm font-bold text-white">Choisir une localisation</h3>
              <button onClick={() => setLocationModalOpen(false)}><X size={18} className="text-[#B9BBC8]" /></button>
            </div>

            <div className="p-4">
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
                <input
                  autoFocus
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  placeholder="Ville, département, région…"
                  className="w-full bg-[#061D32] border border-[#17334D] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
                />
              </div>

              <div className="space-y-1 mb-4">
                {citySuggestions.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setPickedCity(`${c.name} — Ville`)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                      pickedCity.startsWith(c.name) ? 'bg-orange/10 text-orange' : 'text-white hover:bg-[#061D32]'
                    }`}
                  >
                    <MapPin size={14} /> {c.name} — Ville
                  </button>
                ))}
              </div>

              <p className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2">Rayon de recherche</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {RADIUS_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      radius === r ? 'border-orange bg-orange/10 text-orange' : 'border-[#17334D] text-[#B9BBC8]'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>

              <div className="space-y-1 mb-5">
                <button onClick={() => setPickedCity('Département entier')} className="w-full flex items-center justify-between px-3 py-3 rounded-lg border border-[#17334D] text-sm text-white hover:border-orange/40 transition-colors">
                  Département <ChevronRight size={14} className="text-orange" />
                </button>
                <button onClick={() => setPickedCity('Région entière')} className="w-full flex items-center justify-between px-3 py-3 rounded-lg border border-[#17334D] text-sm text-white hover:border-orange/40 transition-colors">
                  Région <ChevronRight size={14} className="text-orange" />
                </button>
                <button onClick={() => setPickedCity('France entière')} className="w-full flex items-center justify-between px-3 py-3 rounded-lg border border-[#17334D] text-sm text-white hover:border-orange/40 transition-colors">
                  France entière <ChevronRight size={14} className="text-orange" />
                </button>
              </div>

              <button
                onClick={applyZone}
                disabled={!pickedCity}
                className="w-full bg-orange text-white font-bold py-3 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-40"
              >
                Appliquer cette zone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Filtres bottom-sheet modal (step 4) ===== */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="relative w-full md:max-w-md bg-[#031B30] border border-[#17334D] rounded-t-2xl md:rounded-2xl shadow-2xl z-10 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#17334D]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Filter size={14} className="text-orange" /> Filtres</h3>
              <button onClick={() => setFiltersOpen(false)}><X size={18} className="text-[#B9BBC8]" /></button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Statut</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none appearance-none">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block flex items-center gap-1.5"><Calendar size={11} /> Date de publication</label>
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none appearance-none">
                  {DATE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Échéance</label>
                <select value={deadlineFilter} onChange={e => setDeadlineFilter(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none appearance-none">
                  {DEADLINE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block flex items-center gap-1.5"><Target size={11} /> Montant</label>
                <select value={amountFilter} onChange={e => setAmountFilter(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none appearance-none">
                  {AMOUNT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <button onClick={() => setFiltersOpen(false)} className="w-full bg-orange text-white font-bold py-3 rounded-xl hover:bg-orange/90 transition-colors">
                Afficher {filteredResults.length} résultat{filteredResults.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}
