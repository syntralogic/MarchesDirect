import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Handshake, ChevronRight, Globe,
  Building, ArrowRight, Zap, Settings, Monitor, Truck, Briefcase,
  Search, MousePointerClick, Locate, MapPin, Loader2, AlertCircle, X,
  PlayCircle, ChevronLeft, ChevronUp, Plus,
  Flame, Paintbrush, Lightbulb, Hammer, Sparkles, Trees, Users, ArrowUpRight,
  Euro, FileText, Clock, Lock, Shield, Calendar, Trophy,
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import { useLang } from '@/contexts/LangContext';
import PageMeta from '@/components/common/PageMeta';
import { AppointmentModal } from '@/components/AppointmentModal';
import DemoVideoModal from '@/components/DemoVideoModal';
import { CallbackModal } from '@/components/CallbackModal';
import { allSectors } from '@/data/mockData';
import { frenchCitiesGeo } from '@/data/frenchCitiesGeo';
import { opportunitiesApi, type ApiOpportunity } from '@/lib/apiClient';
import { useOpportunityCounts } from '@/hooks/use-opportunity-counts';

import mem1 from "@/assets/1.jpeg";

interface GeoFeatureProps { code: string; nom: string }
interface GeoFeature { rsmKey: string; properties: GeoFeatureProps }
interface GeoJsonData { type: string; features: unknown[] }

function touchAwareZoomFilter(event: { type: string; touches?: TouchList; ctrlKey?: boolean; button?: number }) {
  if (event.type === 'touchstart' || event.type === 'touchmove' || event.type === 'touchend') {
    return !!(event.touches && event.touches.length > 1);
  }
  return !event.ctrlKey && !event.button;
}

function normalizeFr(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// HERO
// ---------------------------------------------------------------------------
function HeroSection({ onAppt, onCallback }: { onAppt: () => void; onCallback: () => void }) {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <section className="px-3 md:px-6 pt-5 md:pt-10 pb-10 md:pb-10 max-w-3xl mx-auto w-full">
      {/* Card-internal padding/margins/gaps reverted to their pre-65360a3
          sizes (12 Sep bug, found live 12 Sep 7:57pm): that commit grew
          these to make the whole card taller so the *next* heading ("De la
          recherche...") would sit further below the fold - but the CTA
          buttons are the last thing INSIDE this same card, so a taller
          card pushed them past the fold too, off-screen on this device.
          Only the outer <section>'s pb-10 (added by that same commit)
          actually does what was wanted: it adds space AFTER the card,
          pushing later content down without touching what's visible
          inside the card itself - kept as-is. */}
      <div className="border border-orange/40 rounded-2xl bg-[#061D32] p-4 md:p-6 orange-glow relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[11px] md:text-[11px] font-bold text-orange uppercase tracking-widest">
            Artisans · TPE · PME
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mt-2.5 md:mt-2 mb-4 md:mb-3">
            <span className="text-white">Trouvez des marchés adaptés</span>{' '}
            <span className="text-orange">à votre entreprise.</span>
          </h1>
          <div className="mb-5 md:mb-4"><OpportunityPaths onDemoClick={() => setDemoOpen(true)} /></div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-3">
            <button onClick={onAppt} className="flex-1 bg-orange text-white font-semibold py-3.5 md:py-3 rounded-xl text-sm md:text-sm hover:bg-orange/90 transition-colors">
              Prendre rendez-vous
            </button>
            <button onClick={onCallback} className="flex-1 border border-orange text-orange font-semibold py-3.5 md:py-3 rounded-xl text-sm md:text-sm hover:bg-orange/10 transition-colors">
              Être rappelé
            </button>
          </div>
        </div>
      </div>
      <DemoVideoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  );
}

function HeroCounters() {
  const { counts, loading } = useOpportunityCounts();
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  return (
    <>
      <Link to="/marches-publics" className="border border-[#17334D] rounded-xl bg-[#061D32] p-4 flex items-center justify-between hover:border-orange/40 transition-colors">
        <div>
          <div className="text-xs text-white font-semibold">Marchés publics</div>
          <div className="text-xs text-[#B9BBC8]">{loading ? '…' : `${fmt(counts.public_procurement)} opportunités`}</div>
        </div>
        <ChevronRight size={16} className="text-[#B9BBC8]" />
      </Link>
      <Link to="/appels-doffres" className="border border-[#17334D] rounded-xl bg-[#061D32] p-4 flex items-center justify-between hover:border-orange/40 transition-colors">
        <div>
          <div className="text-xs text-white font-semibold">Appels d'offres privés</div>
          <div className="text-xs text-[#B9BBC8]">{loading ? '…' : `${fmt(counts.tender)} opportunités`}</div>
        </div>
        <ChevronRight size={16} className="text-[#B9BBC8]" />
      </Link>
      <Link to="/sous-traitance" className="border border-[#17334D] rounded-xl bg-[#061D32] p-4 flex items-center justify-between hover:border-orange/40 transition-colors">
        <div>
          <div className="text-xs text-white font-semibold">Sous-traitance</div>
          <div className="text-xs text-[#B9BBC8]">{loading ? '…' : `${fmt(counts.subcontracting)} opportunités`}</div>
        </div>
        <ChevronRight size={16} className="text-[#B9BBC8]" />
      </Link>
    </>
  );
}

function OpportunityPaths({ onDemoClick }: { onDemoClick?: () => void }) {
  const { counts, loading } = useOpportunityCounts();
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const paths = [
    { icon: Building, title: 'Marchés publics', sub: 'Travaux et prestations pour les organismes publics', href: '/parcours?type=marches-publics', key: 'public_procurement' as const },
    { icon: Building2, title: "Appels d'offres privés", sub: 'Besoins des entreprises, promoteurs et bailleurs privés', href: '/parcours?type=appels-doffres', key: 'tender' as const },
    { icon: Handshake, title: 'Sous-traitance', sub: "Une partie d'un chantier ou d'une prestation à réaliser", href: '/parcours?type=sous-traitance', key: 'subcontracting' as const },
  ];
  return (
    <div className="grid grid-cols-1 gap-2.5 md:gap-2">
      {paths.map(p => {
        const count = counts[p.key];
        return (
          <Link key={p.href} to={p.href} className="flex items-center gap-3 md:gap-3 bg-[#061D32]/80 border border-[#17334D] rounded-xl p-3.5 md:p-3 hover:border-orange/50 group transition-all">
            <div className="w-11 h-11 md:w-11 md:h-11 rounded-lg bg-orange/10 flex items-center justify-center shrink-0">
              <p.icon size={22} className="text-orange md:hidden" />
              <p.icon size={22} className="text-orange hidden md:block" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm md:text-sm font-semibold text-white group-hover:text-orange transition-colors">{p.title}</div>
              <div className="text-[11px] md:text-[11px] text-[#B9BBC8] mt-0.5 leading-snug">{p.sub}</div>
            </div>
            <ChevronRight size={16} className="text-orange shrink-0 md:hidden" />
            <ChevronRight size={16} className="text-orange shrink-0 hidden md:block" />
            {loading ? null : <span className="sr-only">{fmt(count)}</span>}
          </Link>
        );
      })}
      <div className="grid grid-cols-2 gap-2.5 md:gap-2">
        <button onClick={onDemoClick} className="flex flex-col items-start gap-2 md:gap-2 bg-[#061D32]/80 border border-[#17334D] rounded-xl p-3.5 md:p-3 hover:border-orange/50 group transition-all text-left">
          <PlayCircle size={22} className="text-orange md:hidden" />
          <PlayCircle size={22} className="text-orange hidden md:block" />
          <div className="text-sm md:text-sm font-semibold text-white group-hover:text-orange transition-colors">Démo vidéo</div>
          <div className="text-[11px] md:text-[11px] text-[#B9BBC8] leading-snug">Le parcours en 1 min</div>
        </button>
        <a href="#mdh-temoignages" className="flex flex-col items-start gap-2 md:gap-2 bg-[#061D32]/80 border border-[#17334D] rounded-xl p-3.5 md:p-3 hover:border-orange/50 group transition-all">
          <PlayCircle size={22} className="text-orange md:hidden" />
          <PlayCircle size={22} className="text-orange hidden md:block" />
          <div className="text-sm md:text-sm font-semibold text-white group-hover:text-orange transition-colors">Témoignages vidéo</div>
          <div className="text-[11px] md:text-[11px] text-[#B9BBC8] leading-snug">Leurs retours d'expérience</div>
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DEMO WALKTHROUGH ("De la recherche au dossier, en 1 minute.")
// ---------------------------------------------------------------------------
function DemoWalkthroughSection() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const steps = [
    { label: 'Opportunité', title: 'Chauffage · lot 03', desc: 'Épinal · 120 000 € HT', card: { label: 'Opportunité', title: 'Chauffage · lot 03', meta: 'Épinal · 120 000 € HT', note: 'Critères et conditions' } },
    { label: 'Concordance', title: '78 % de concordance', desc: 'Votre entreprise correspond aux critères demandés', card: { label: 'Concordance', title: '78 % de concordance', meta: 'Votre entreprise correspond aux critères demandés', note: 'Analyse IA' } },
    { label: 'Dossier', title: 'Le besoin · les critères · le dossier', desc: "Votre chargé d'affaires prépare la candidature", card: { label: 'Dossier', title: 'Le besoin · les critères · le dossier', meta: "Votre chargé d'affaires prépare la candidature", note: 'Vous validez avant dépôt' } },
  ];
  return (
    <section className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">
        De la recherche au dossier, en 1 minute.
      </h2>

      <button
        onClick={() => setDemoOpen(true)}
        className="w-full text-left rounded-2xl border border-[#17334D] bg-gradient-to-br from-[#0B2A46] to-[#061D32] p-4 md:p-6 mb-6 relative overflow-hidden hover:border-orange/50 transition-colors"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PlayCircle size={18} className="text-orange" />
            <span className="text-[11px] font-bold text-white uppercase tracking-widest">Démo vidéo</span>
          </div>
          <span className="text-[11px] font-bold text-white bg-black/40 border border-[#17334D] rounded-md px-2 py-0.5">01:00</span>
        </div>
        <div className="relative h-40 md:h-56 flex items-center justify-center">
          <div className="absolute left-0 top-4 bg-[#061D32]/90 border border-[#17334D] rounded-lg px-3 py-2 text-[11px] text-white w-40">
            <div className="font-bold">Marchés <span className="text-orange">Direct</span></div>
            <div className="text-[#B9BBC8] text-[10px] mt-1">Votre opportunité · Installation de chaudière</div>
          </div>
          <div className="absolute right-0 top-2 bg-white rounded-lg px-3 py-2 text-[#061D32] shadow-lg w-28">
            <div className="text-2xl font-extrabold leading-none">78 %</div>
            <div className="text-[10px] text-[#061D32]/70 font-medium">Concordance</div>
          </div>
          <span className="relative w-14 h-14 rounded-full bg-orange flex items-center justify-center shadow-lg">
            <PlayCircle size={28} className="text-white" />
          </span>
        </div>
        <p className="text-sm md:text-base font-bold text-white mt-4 leading-snug">
          Choisissez votre zone.<br />Découvrez comment candidater.
        </p>
      </button>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {steps.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setStep(i as 0 | 1 | 2)}
            className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
              step === i ? 'border-orange bg-orange/10' : 'border-[#17334D] bg-[#031B30] hover:border-orange/40'
            }`}
          >
            <div className={`text-[11px] font-bold ${step === i ? 'text-orange' : 'text-[#B9BBC8]'}`}>0{i + 1}</div>
            <div className={`text-xs font-semibold mt-0.5 ${step === i ? 'text-orange' : 'text-white'}`}>{s.label}</div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#17334D] bg-[#061D32] p-4 md:p-5">
        <div className="flex gap-4">
          <div className="w-32 md:w-40 shrink-0 rounded-xl border border-[#17334D] bg-[#031B30] p-3">
            <span className="inline-block text-[10px] font-semibold text-[#B9BBC8] bg-[#061D32] border border-[#17334D] rounded-md px-2 py-0.5 mb-2">
              {steps[step].card.label}
            </span>
            <div className="text-xs font-bold text-white leading-snug">{steps[step].card.title}</div>
            <div className="text-[10px] text-[#B9BBC8] mt-1">{steps[step].card.meta}</div>
            <div className="text-[10px] text-[#B9BBC8] mt-2">{steps[step].card.note}</div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-bold text-white leading-snug mb-2">
              Comprenez ce que l'acheteur attend.
            </h3>
            <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed">
              Travaux demandés, budget, délais et conditions : les informations utiles sont réunies dans une fiche.
            </p>
            <button
              onClick={() => setDemoOpen(true)}
              className="mt-4 inline-flex items-center gap-2 text-orange font-semibold text-sm hover:gap-3 transition-all"
            >
              Voir dans la démo <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setStep((s => ((s + 2) % 3) as 0 | 1 | 2))}
          className="w-10 h-10 rounded-full border border-[#17334D] flex items-center justify-center text-[#B9BBC8] hover:text-orange hover:border-orange/40 transition-colors"
          aria-label="Étape précédente"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-xs text-[#B9BBC8]">
          Étape {step + 1} sur 3 · {steps[step].label}
        </span>
        <button
          onClick={() => setStep((s => ((s + 1) % 3) as 0 | 1 | 2))}
          className="w-10 h-10 rounded-full border border-[#17334D] flex items-center justify-center text-[#B9BBC8] hover:text-orange hover:border-orange/40 transition-colors"
          aria-label="Étape suivante"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <DemoVideoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  );
}

// ---------------------------------------------------------------------------
// TESTIMONIALS ("Des entrepreneurs racontent leur candidature.")
// ---------------------------------------------------------------------------
function TestimonialsSection() {
  const slides = [
    { title: 'Son premier dossier, étape par étape.', note: 'Portrait, identité du client et vidéo à intégrer.' },
    { title: "De la recherche à la signature, sans stress.", note: 'Portrait, identité du client et vidéo à intégrer.' },
  ];
  const [i, setI] = useState(0);
  const slide = slides[i];
  return (
    <section id="mdh-temoignages" className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <span className="text-[11px] font-bold text-orange uppercase tracking-widest">
        Leur expérience, avec leurs mots
      </span>
      <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-5">
        Des entrepreneurs racontent leur candidature.
      </h2>

      <div className="rounded-2xl border border-[#17334D] bg-[#061D32] p-4 md:p-5">
        <div className="relative rounded-xl border border-[#17334D] bg-[#031B30] overflow-hidden">
          <div className="flex items-center justify-between px-3 pt-3">
            <div className="flex items-center gap-2">
              <PlayCircle size={16} className="text-orange" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Témoignage vidéo</span>
            </div>
            <span className="text-[10px] font-bold text-white bg-orange rounded-md px-2 py-0.5">À intégrer</span>
          </div>

          <div className="flex items-center justify-between px-3 py-6">
            <button
              onClick={() => setI((i - 1 + slides.length) % slides.length)}
              className="w-9 h-9 rounded-full border border-[#17334D] flex items-center justify-center text-[#B9BBC8] hover:text-orange transition-colors"
              aria-label="Témoignage précédent"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="w-14 h-14 rounded-full bg-orange flex items-center justify-center shadow-lg">
              <PlayCircle size={28} className="text-white" />
            </span>
            <button
              onClick={() => setI((i + 1) % slides.length)}
              className="w-9 h-9 rounded-full border border-[#17334D] flex items-center justify-center text-[#B9BBC8] hover:text-orange transition-colors"
              aria-label="Témoignage suivant"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <p className="px-4 pb-4 text-sm md:text-base font-bold text-white leading-snug">
            {slide.title}
          </p>
        </div>

        <p className="text-[11px] text-[#B9BBC8] mt-3">{slide.note}</p>
        <p className="text-[11px] text-[#B9BBC8] text-center mt-3">
          Témoignage {i + 1} sur {slides.length}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// TEAM ("Une équipe pour préparer votre candidature.")
// ---------------------------------------------------------------------------
function TeamSection() {
  return (
    <section className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <div className="rounded-2xl border border-[#17334D] bg-[#061D32] p-4 md:p-6 relative">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[11px] font-bold text-[#B9BBC8] uppercase tracking-widest">Notre équipe</span>
          <Users size={20} className="text-[#B9BBC8]" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-3">
          <span className="text-white">Une équipe pour </span>
          <span className="text-orange">préparer votre candidature.</span>
        </h2>
        <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed mb-5">
          Votre chargé d'affaires prépare le dossier.<br />
          Vous le validez avant son dépôt.
        </p>

        <div className="rounded-xl border border-[#17334D] bg-[#031B30] p-3 md:p-4 flex gap-3 md:gap-4">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-orange overflow-hidden shrink-0">
            <img src={mem1} alt="Maria" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[#B9BBC8]">Votre premier contact</div>
            <div className="text-lg md:text-xl font-extrabold text-white leading-tight">Elena Popescu</div>
            <div className="text-xs text-[#B9BBC8] mb-2">Assistante de direction</div>
            <p className="text-[11px] md:text-xs text-[#B9BBC8] leading-relaxed">
              Elena accueille votre demande et vous oriente vers le bon interlocuteur.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#17334D]">
          <span className="text-sm font-semibold text-orange">Découvrir notre équipe</span>
          <Link
            to="/a-propos"
            className="w-10 h-10 rounded-full border border-orange text-orange flex items-center justify-center hover:bg-orange/10 transition-colors"
            aria-label="Découvrir notre équipe"
          >
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// GEOGRAPHIC ("Des opportunités partout en France.")
// ---------------------------------------------------------------------------
function GeographicSection() {
  const { t } = useLang();
  const [tab, setTab] = useState<'regions' | 'departments' | 'cities'>('regions');
  const [search, setSearch] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<GeoFeatureProps[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<GeoFeatureProps[]>([]);
  const [selectedCities, setSelectedCities] = useState<{name: string; coords: [number, number]}[]>([]);
  const [, setHovered] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResult, setCityResult] = useState<{ name: string; coords: [number, number] | null } | null>(null);
  const [cityOpportunities, setCityOpportunities] = useState<ApiOpportunity[]>([]);
  const [cityTotal, setCityTotal] = useState(0);
  const [cityLoading, setCityLoading] = useState(false);
  const [position, setPosition] = useState({ coordinates: [2.4, 46.6] as [number, number], zoom: 1 });
  const [citiesPosition, setCitiesPosition] = useState({ coordinates: [2.4, 46.6] as [number, number], zoom: 1 });

  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({});
  const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});
  const [regionsGeoJson, setRegionsGeoJson] = useState<GeoJsonData | null>(null);
  const [departementsGeoJson, setDepartementsGeoJson] = useState<GeoJsonData | null>(null);
  const [geoLoadError, setGeoLoadError] = useState(false);

  useEffect(() => {
    import('@/data/geo/regions.json')
      .then(m => setRegionsGeoJson(m.default as GeoJsonData))
      .catch(err => { console.error('Failed to load regions.json', err); setGeoLoadError(true); });
    import('@/data/geo/departements.json')
      .then(m => setDepartementsGeoJson(m.default as GeoJsonData))
      .catch(err => { console.error('Failed to load departements.json', err); setGeoLoadError(true); });
  }, []);

  useEffect(() => {
    opportunitiesApi.statsByRegion()
      .then(({ regions }) => {
        const map: Record<string, number> = {};
        regions.forEach(r => { map[normalizeFr(r.region)] = r.count; });
        setRegionCounts(map);
      })
      .catch(() => setRegionCounts({}));
    opportunitiesApi.statsByDepartment()
      .then(({ departments }) => {
        const map: Record<string, number> = {};
        departments.forEach(d => { map[d.department] = d.count; });
        setDeptCounts(map);
      })
      .catch(() => setDeptCounts({}));
  }, []);

  const getRegionCount = (name: string) => regionCounts[normalizeFr(name)] ?? 0;
  const getDeptCount = (code: string, name: string) => deptCounts[code] ?? deptCounts[normalizeFr(name)] ?? 0;

  const handleCitySearch = async (override?: string) => {
    const raw = override ?? cityQuery;
    if (!raw.trim()) return;
    if (override) setCityQuery(override);
    setCityLoading(true);
    const query = raw.trim();
    try {
      const [searchData, geo] = await Promise.all([
        opportunitiesApi.search({ journey: undefined, city: query, limit: 5 }),
        fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=1`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
      ]);
      setCityOpportunities(searchData.results);
      setCityTotal(searchData.pagination.total);
      const feature = geo?.features?.[0];
      const coords: [number, number] | null = feature ? [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] : null;
      setCityResult({ name: feature?.properties?.city || query, coords });
    } catch {
      setCityResult({ name: query, coords: null });
      setCityOpportunities([]);
      setCityTotal(0);
    } finally {
      setCityLoading(false);
    }
  };

  const selectMapCity = (city: { name: string; coords: [number, number] }) => {
    setCitiesPosition(p => ({ coordinates: city.coords, zoom: Math.max(p.zoom, 4) }));
    setSelectedCities(prev => {
      const exists = prev.some(c => c.name === city.name);
      return exists ? prev.filter(c => c.name !== city.name) : [...prev, city];
    });
    handleCitySearch(city.name);
  };

  const visibleCities = frenchCitiesGeo.filter(c => {
    if (c.tier === 1) return true;
    if (c.tier === 2) return citiesPosition.zoom >= 2;
    return citiesPosition.zoom >= 4;
  });
  const zoomLevelLabel = citiesPosition.zoom >= 4 ? 'Élevé' : citiesPosition.zoom >= 2 ? 'Moyen' : 'Faible';

  useEffect(() => {
    if (!search.trim()) return;
    const query = search.trim().toLowerCase();
    if (tab === 'regions' && regionsGeoJson) {
      const matches = (regionsGeoJson.features as { properties: GeoFeatureProps }[]).filter(f =>
        f.properties.nom.toLowerCase().includes(query)
      );
      if (matches.length === 1) {
        const match = matches[0].properties;
        setSelectedRegions(prev => (prev.some(r => r.code === match.code) ? prev : [...prev, match]));
      }
    } else if (tab === 'departments' && departementsGeoJson) {
      const matches = (departementsGeoJson.features as { properties: GeoFeatureProps }[]).filter(
        f => f.properties.nom.toLowerCase().includes(query) || f.properties.code?.includes(search.trim())
      );
      if (matches.length === 1) {
        const match = matches[0].properties;
        setSelectedDepts(prev => (prev.some(d => d.code === match.code) ? prev : [...prev, match]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab, regionsGeoJson, departementsGeoJson]);

  const getSelectedItems = () => {
    if (tab === 'regions') return selectedRegions;
    if (tab === 'departments') return selectedDepts;
    return selectedCities;
  };
  const clearAllSelections = () => {
    if (tab === 'regions') setSelectedRegions([]);
    else if (tab === 'departments') setSelectedDepts([]);
    else setSelectedCities([]);
  };
  const removeSelection = (item: any) => {
    if (tab === 'regions') setSelectedRegions(prev => prev.filter(r => r.code !== item.code));
    else if (tab === 'departments') setSelectedDepts(prev => prev.filter(d => d.code !== item.code));
    else setSelectedCities(prev => prev.filter(c => c.name !== item.name));
  };

  const selected = getSelectedItems();
  const selectedCount = selected.length;

  const buildSearchUrl = () => {
    if (tab === 'regions' && selectedRegions.length > 0)
      return `/recherche?${selectedRegions.map(r => `region=${encodeURIComponent(r.nom)}`).join('&')}`;
    if (tab === 'departments' && selectedDepts.length > 0)
      return `/recherche?${selectedDepts.map(d => `department=${encodeURIComponent(d.code)}`).join('&')}`;
    if (tab === 'cities' && selectedCities.length > 0)
      return `/recherche?${selectedCities.map(c => `city=${encodeURIComponent(c.name)}`).join('&')}`;
    return '/recherche';
  };

  return (
    <section className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <span className="text-[11px] font-bold text-orange uppercase tracking-widest">{t('nearYou')}</span>
      <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-2">
        Des opportunités partout en France.
      </h2>
      <p className="text-[#B9BBC8] text-sm mb-5">
        Explorez les marchés par région, département ou ville, puis précisez votre métier.
      </p>

      <div className="border border-[#17334D] rounded-2xl bg-[#061D32] p-4 md:p-5">
        <div className="grid grid-cols-3 gap-1 border border-[#17334D] rounded-xl p-1 w-full mb-4">
          {(['regions', 'departments', 'cities'] as const).map(k => (
            <button
              key={k}
              onClick={() => { setTab(k); setSearch(''); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === k ? 'bg-orange/15 text-orange border border-orange' : 'text-[#B9BBC8] hover:text-white border border-transparent'
              }`}
            >
              {t(k)}
            </button>
          ))}
        </div>

        {tab !== 'cities' ? (
          <>
            <label className="block text-xs text-[#B9BBC8] mb-2">
              {tab === 'regions' ? 'Rechercher une région' : 'Rechercher un département'}
            </label>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={tab === 'regions' ? 'Grand Est' : 'Bas-Rhin'}
                  className="w-full bg-[#031B30] border border-[#17334D] rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
                />
              </div>
              <button
                onClick={() => setSearch(s => s)}
                className="w-12 h-12 rounded-xl bg-orange text-white flex items-center justify-center hover:bg-orange/90 transition-colors"
                aria-label="Rechercher"
              >
                <ArrowRight size={18} />
              </button>
            </div>
            <p className="text-[11px] text-[#B9BBC8] flex items-center gap-1.5 mb-3">
              <MousePointerClick size={12} /> Sélectionnez une région sur la carte ou dans la recherche.
            </p>

            <div className="relative rounded-xl overflow-hidden border border-[#17334D] bg-[#031B30] h-[300px] md:h-[420px]" style={{ touchAction: 'pan-y' }}>
              {geoLoadError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
                  <AlertCircle size={20} className="text-red-400 mb-2" />
                  <p className="text-xs text-[#B9BBC8]">Impossible de charger la carte. Rechargez la page.</p>
                </div>
              ) : !regionsGeoJson || !departementsGeoJson ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-orange" />
                </div>
              ) : (
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ center: [2.454, 46.6], scale: 2600 }}
                  width={780}
                  height={720}
                  style={{ width: '100%', height: '100%' }}
                >
                  <ZoomableGroup center={position.coordinates} zoom={position.zoom} onMoveEnd={setPosition} minZoom={1} maxZoom={8} filterZoomEvent={touchAwareZoomFilter as unknown as (element: SVGElement) => boolean}>
                    <Geographies geography={tab === 'regions' ? regionsGeoJson : departementsGeoJson}>
                      {({ geographies }: { geographies: GeoFeature[] }) =>
                        geographies.map(geo => {
                          const isSelected = tab === 'regions'
                            ? selectedRegions.some(r => r.code === geo.properties.code)
                            : tab === 'departments'
                            ? selectedDepts.some(d => d.code === geo.properties.code)
                            : false;
                          const isSearchMatch =
                            search !== '' &&
                            (geo.properties.nom.toLowerCase().includes(search.toLowerCase()) ||
                              (geo.properties.code?.includes(search) ?? false));
                          const labelText = tab === 'regions' ? geo.properties.nom : geo.properties.code;
                          const centroid = geoCentroid(geo as unknown as Parameters<typeof geoCentroid>[0]);
                          return (
                            <g key={geo.rsmKey}>
                              <Geography
                                geography={geo}
                                onMouseEnter={() => setHovered(geo.properties.nom)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => {
                                  if (tab === 'regions') {
                                    setSelectedRegions(prev => {
                                      const exists = prev.some(r => r.code === geo.properties.code);
                                      return exists ? prev.filter(r => r.code !== geo.properties.code) : [...prev, geo.properties];
                                    });
                                  } else {
                                    setSelectedDepts(prev => {
                                      const exists = prev.some(d => d.code === geo.properties.code);
                                      return exists ? prev.filter(d => d.code !== geo.properties.code) : [...prev, geo.properties];
                                    });
                                  }
                                }}
                                style={{
                                  default: { fill: isSelected || isSearchMatch ? '#FF6500' : '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none', cursor: 'pointer' },
                                  hover: { fill: isSelected || isSearchMatch ? '#FF6500' : '#5A7893', stroke: '#031B30', strokeWidth: 0.75, outline: 'none', cursor: 'pointer' },
                                  pressed: { fill: '#FF6500', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                                }}
                              />
                              {labelText && centroid && !isNaN(centroid[0]) && !isNaN(centroid[1]) && (
                                <Marker coordinates={centroid} style={{ default: { pointerEvents: 'none' }, hover: { pointerEvents: 'none' }, pressed: { pointerEvents: 'none' } }}>
                                  <text
                                    textAnchor="middle"
                                    style={{
                                      fontSize: tab === 'regions' ? 7.5 : 8,
                                      fill: '#fff',
                                      fontWeight: isSelected || isSearchMatch ? 700 : 500,
                                      pointerEvents: 'none',
                                      paintOrder: 'stroke',
                                      stroke: '#031B30',
                                      strokeWidth: 2,
                                      strokeLinejoin: 'round',
                                    }}
                                  >
                                    {labelText}
                                  </text>
                                </Marker>
                              )}
                            </g>
                          );
                        })
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              )}

              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={() => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))} className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">+</button>
                <button onClick={() => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))} className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">−</button>
                <button onClick={() => setPosition({ coordinates: [2.4, 46.6], zoom: 1 })} className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors flex items-center justify-center"><Locate size={14} /></button>
              </div>

              {selectedCount > 0 && (
                <div className="absolute bottom-3 left-3 bg-[#061D32]/95 border border-[#17334D] rounded-lg px-3 py-2 max-h-32 overflow-y-auto min-w-[150px] max-w-[250px]">
                  {selected.map((item, index) => {
                    const isRegion = 'nom' in item && 'code' in item;
                    const name = isRegion ? item.nom : (item as any).name;
                    const code = isRegion ? item.code : undefined;
                    const count = isRegion
                      ? (tab === 'regions' ? getRegionCount(item.nom) : getDeptCount(item.code, item.nom))
                      : undefined;
                    return (
                      <div key={code || name || index} className="flex items-center justify-between gap-2 py-1 border-b border-[#17334D]/50 last:border-0">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{name}</p>
                          {count !== undefined && (
                            <p className="text-[10px] text-orange font-medium">
                              {count.toLocaleString('fr-FR')} {count > 1 ? 'opportunités disponibles' : 'opportunité disponible'}
                            </p>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeSelection(item); }} className="text-red-400 hover:text-red-300 shrink-0 ml-1">
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-[10px] text-[#B9BBC8] text-center mt-3">
              Contours régionaux : IGN / France GeoJSON
            </p>

            {selectedCount > 0 ? (
              <Link
                to={buildSearchUrl()}
                className="mt-3 w-full flex items-center justify-center gap-2 border border-orange text-orange font-semibold text-sm py-3 px-3 rounded-xl hover:bg-orange/10 transition-colors text-center"
              >
                <span className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 min-w-0">
                  <span>Voir les opportunités en </span>
                  {selected.slice(0, 2).map((item, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      {'nom' in item ? item.nom : (item as any).name}
                    </span>
                  ))}
                  {selected.length > 2 && <span>+{selected.length - 2} autres</span>}
                </span>
                <ArrowRight size={14} className="shrink-0" />
              </Link>
            ) : (
              <div className="mt-3 flex flex-col items-center text-center py-4">
                <Globe size={26} className="text-orange mb-2" />
                <p className="text-sm font-bold text-white">Sélectionnez une zone</p>
                <p className="text-xs text-[#B9BBC8] mt-1">Touchez une région ou un département sur la carte.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
                <input
                  value={cityQuery}
                  onChange={e => { setCityQuery(e.target.value); setCityResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
                  placeholder={t('mapSearchCity') || 'Rechercher une ville'}
                  className="w-full bg-[#031B30] border border-[#17334D] rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
                />
              </div>
              <button
                onClick={() => handleCitySearch()}
                disabled={cityLoading || !cityQuery.trim()}
                className="px-4 bg-orange text-white font-semibold text-sm rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {cityLoading && <Loader2 size={14} className="animate-spin" />} Rechercher
              </button>
            </div>
            <p className="text-[11px] text-[#B9BBC8] flex items-center gap-1.5 mb-3">
              <MousePointerClick size={12} /> Touchez une ville sur la carte, ou zoomez pour en voir davantage.
            </p>

            <div className="relative rounded-xl overflow-hidden border border-[#17334D] bg-[#031B30] h-[240px] md:h-[320px] mb-3" style={{ touchAction: 'pan-y' }}>
              {geoLoadError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
                  <AlertCircle size={20} className="text-red-400 mb-2" />
                  <p className="text-xs text-[#B9BBC8]">Impossible de charger la carte. Rechargez la page.</p>
                </div>
              ) : !regionsGeoJson ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-orange" />
                </div>
              ) : (
                <ComposableMap projection="geoMercator" projectionConfig={{ center: [2.454, 46.6], scale: 2600 }} width={780} height={620} style={{ width: '100%', height: '100%' }}>
                  <ZoomableGroup center={citiesPosition.coordinates} zoom={citiesPosition.zoom} onMoveEnd={setCitiesPosition} minZoom={1} maxZoom={8} filterZoomEvent={touchAwareZoomFilter as unknown as (element: SVGElement) => boolean}>
                    <Geographies geography={regionsGeoJson}>
                      {({ geographies }: { geographies: GeoFeature[] }) =>
                        geographies.map(geo => (
                          <Geography key={geo.rsmKey} geography={geo} style={{
                            default: { fill: '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                            hover: { fill: '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                            pressed: { fill: '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                          }} />
                        ))
                      }
                    </Geographies>
                    {visibleCities.map(city => {
                      const isSelected = selectedCities.some(c => c.name === city.name);
                      return (
                        <Marker key={city.name} coordinates={city.coords} onClick={() => selectMapCity(city)} style={{ default: { cursor: 'pointer' } }}>
                          {isSelected && <circle r={11} fill="#FF6500" fillOpacity={0.25} />}
                          <circle r={isSelected ? 6 : 4} fill="#FF6500" stroke="#fff" strokeWidth={1.2} />
                          <text textAnchor="middle" y={-9} style={{ fontSize: isSelected ? 11 : 9, fill: '#fff', fontWeight: isSelected ? 700 : 600, pointerEvents: 'none' }}>
                            {city.name}
                          </text>
                        </Marker>
                      );
                    })}
                  </ZoomableGroup>
                </ComposableMap>
              )}

              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={() => setCitiesPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))} className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">+</button>
                <button onClick={() => setCitiesPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))} className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">−</button>
                <button onClick={() => setCitiesPosition({ coordinates: [2.4, 46.6], zoom: 1 })} className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors flex items-center justify-center"><Locate size={14} /></button>
              </div>

              <div className="absolute bottom-3 left-3 bg-[#061D32]/95 border border-[#17334D] rounded-lg px-2.5 py-1.5">
                <p className="text-[10px] font-semibold text-white">Niveau de zoom : {zoomLevelLabel}</p>
              </div>
            </div>
            <p className="text-[11px] text-[#B9BBC8] mb-3">Plus vous zoomez, plus les villes apparaissent.</p>

            {cityLoading ? (
              <div className="rounded-xl border border-[#17334D] bg-[#031B30] p-8 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-orange" />
              </div>
            ) : !cityResult ? (
              <div className="rounded-xl border border-[#17334D] bg-[#031B30] p-6 flex flex-col items-center text-center">
                <Globe size={24} className="text-orange mb-2" />
                <p className="text-sm font-bold text-white">Sélectionnez une ville</p>
                <p className="text-xs text-[#B9BBC8] mt-1">Touchez une ville sur la carte ou lancez une recherche.</p>
              </div>
            ) : cityOpportunities.length === 0 ? (
              <div className="rounded-xl border border-[#17334D] bg-[#031B30] p-6 text-center">
                <p className="text-sm font-semibold text-white">{cityResult.name}</p>
                <p className="text-xs text-[#B9BBC8] mt-1">Aucune opportunité pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cityOpportunities.map(opp => (
                  <Link key={opp.id} to={`/opportunites/${opp.id}`} className="block bg-[#031B30] border border-[#17334D] rounded-xl p-3 hover:border-orange/40 transition-colors">
                    <p className="text-sm font-semibold text-white leading-snug mb-1">{opp.title}</p>
                    <div className="flex flex-wrap gap-3 text-[10px] text-[#B9BBC8]">
                      {opp.location_city && <span className="flex items-center gap-1"><MapPin size={10} /> {opp.location_city}</span>}
                      {opp.deadline && <span>{new Date(opp.deadline).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {selectedCities.length > 0 && (
              <Link to={buildSearchUrl()} className="mt-3 w-full flex items-center justify-center gap-2 border border-orange text-orange font-semibold text-sm py-3 rounded-xl hover:bg-orange/10 transition-colors">
                Voir les opportunités autour de {selectedCities.map((c, i) => (<span key={i}>{i > 0 && ', '}{c.name}</span>))} ({cityTotal}) <ArrowRight size={14} />
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SECTORS ("Quel est votre métier ?")
// ---------------------------------------------------------------------------
function SectorsSection() {
  const { t } = useLang();
  const iconMap: Record<string, React.ElementType> = {
    Flame, Paintbrush, Lightbulb, Hammer, Sparkles, Trees,
    Building2, Zap, Settings, Monitor, Truck, Briefcase,
  };
  const fallbackIcons: React.ElementType[] = [Flame, Paintbrush, Lightbulb, Hammer, Sparkles, Trees];
  return (
    <section className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <span className="text-[11px] font-bold text-orange uppercase tracking-widest">{t('sectors') || "Secteurs d'activité"}</span>
      <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-5">Quel est votre métier ?</h2>

      <div className="grid grid-cols-2 gap-3">
        {allSectors.slice(0, 6).map((sector, idx) => {
          const Icon = iconMap[sector.icon] || fallbackIcons[idx % fallbackIcons.length] || Building2;
          return (
            <Link key={sector.id} to="/secteurs" className="flex flex-col items-start gap-2 bg-[#061D32] border border-[#17334D] rounded-xl p-3.5 hover:border-orange/50 group transition-all">
              <div className="w-11 h-11 rounded-lg bg-orange/10 flex items-center justify-center shrink-0 group-hover:bg-orange/20 transition-colors">
                <Icon size={22} className="text-orange" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white group-hover:text-orange transition-colors leading-snug">{sector.name}</div>
                <div className="text-[11px] text-[#B9BBC8] mt-0.5">{sector.count.toLocaleString('fr-FR')} opportunités</div>
              </div>
            </Link>
          );
        })}
      </div>

      <Link to="/secteurs" className="mt-4 w-full flex items-center justify-center gap-2 border border-orange text-orange font-semibold text-sm rounded-xl py-3 px-4 hover:bg-orange/10 transition-colors">
        Voir tous les métiers <ArrowRight size={14} />
      </Link>

      <div className="flex items-center justify-between mt-4 text-xs">
        <span className="text-[#B9BBC8]">Zone : Grand Est</span>
        <Link to="/recherche" className="text-orange font-semibold">Toute la France</Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// BLOG ("Répondre à un marché : les premiers repères.")
// ---------------------------------------------------------------------------
function BlogSection() {
  const posts = [
    { category: 'Premiers pas', title: 'Premier marché : par où commencer ?', icon: CompassIcon },
    { category: 'Réglementation', title: 'Marchés publics : les changements à connaître en 2026', icon: DocIcon },
    { category: 'Tendances', title: 'Les secteurs qui recherchent de nouveaux partenaires', icon: TrendIcon },
  ];
  return (
    <section className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold text-orange uppercase tracking-widest">Le blog Marchés Direct</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 leading-tight">
            Répondre à un marché : les premiers repères.
          </h2>
        </div>
        <Link to="/actualites" className="text-orange font-semibold text-xs whitespace-nowrap flex items-center gap-1 ml-3">
          Tous les articles <ArrowRight size={14} />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {posts.map(p => (
          <Link key={p.title} to="/actualites" className="border border-[#17334D] rounded-xl bg-[#061D32] p-4 flex items-center gap-4 hover:border-orange/50 transition-colors group">
            <span className="shrink-0 w-12 h-12 rounded-full border-2 border-orange text-orange flex items-center justify-center group-hover:bg-orange/10 transition-colors">
              <p.icon />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-orange uppercase tracking-widest mb-1">{p.category}</div>
              <h3 className="text-sm font-bold text-white group-hover:text-orange transition-colors leading-snug">{p.title}</h3>
            </div>
            <ArrowRight size={16} className="text-[#B9BBC8] group-hover:text-orange transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polygon points="16 8 14 14 8 16 10 10 16 8" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v14a2 2 0 0 0 2 2h8" /><path d="M6 3h8l3 3v11" /><path d="M9 8h5M9 11h5" />
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V6M16 20v-8" /><path d="M4 12l6-5 6 4 6-8" /><path d="M18 5h4v4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// FAQ ("Utiliser Marchés Direct.")
// Mirrors InfoPage's FAQ_SECTIONS exactly so both pages show identical content.
// ---------------------------------------------------------------------------
const HOME_FAQ_SECTIONS = [
  {
    titleKey: 'faqService',
    items: [
      { icon: Euro,      qKey: 'faqCostQ',         aKey: 'faqCostA' },
      { icon: FileText,  qKey: 'faqTakeCareQ',     aKey: 'faqTakeCareA' },
      { icon: Clock,     qKey: 'faqTimeQ',         aKey: 'faqTimeA' },
      { icon: Lock,      qKey: 'faqConfidentialQ', aKey: 'faqConfidentialA' },
    ],
  },
  {
    titleKey: 'faqOpportunities',
    items: [
      { icon: Search,    qKey: 'faqFindQ',         aKey: 'faqFindA' },
      { icon: Handshake, qKey: 'faqWhyUsQ',        aKey: 'faqWhyUsA' },
      { icon: Building2, qKey: 'faqFitQ',          aKey: 'faqFitA' },
    ],
  },
  {
    titleKey: 'faqResults',
    items: [
      { icon: Trophy,    qKey: 'faqChancesQ',      aKey: 'faqChancesA' },
      { icon: Shield,    qKey: 'faqNoWinQ',        aKey: 'faqNoWinA' },
      { icon: Calendar,  qKey: 'faqTimelineQ',     aKey: 'faqTimelineA' },
    ],
  },
];

function HomeFaqSection() {
  const { t } = useLang();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [activeFaqTab, setActiveFaqTab] = useState(HOME_FAQ_SECTIONS[0].titleKey);

  return (
    <section className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <span className="text-[11px] font-bold text-orange uppercase tracking-widest">{t('faqTag')}</span>
      <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-3">{t('faqTitle')}</h2>
      <p className="text-[#B9BBC8] text-sm mb-5">{t('faqSub')}</p>

      <div className="flex flex-wrap gap-1 border border-[#17334D] rounded-xl p-1 w-fit mb-5">
        {HOME_FAQ_SECTIONS.map((section) => (
          <button
            key={section.titleKey}
            onClick={() => {
              setActiveFaqTab(section.titleKey);
              setOpenFaq(null);
              setOpenSection(null);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
              activeFaqTab === section.titleKey
                ? 'bg-orange/15 text-orange border border-orange'
                : 'text-[#B9BBC8] hover:text-white'
            }`}
          >
            {t(section.titleKey)}
          </button>
        ))}
      </div>

      {HOME_FAQ_SECTIONS.filter((s) => s.titleKey === activeFaqTab).map((section) => (
        <div key={section.titleKey} className="space-y-3">
          {section.items.map((item, itemIndex) => {
            const isOpen = openFaq === itemIndex && openSection === section.titleKey;
            return (
              <div key={item.qKey} className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
                <button
                  onClick={() => {
                    setOpenSection(section.titleKey);
                    setOpenFaq(isOpen ? null : itemIndex);
                  }}
                  className="w-full flex items-center justify-between p-4 text-left gap-3"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className="text-orange shrink-0" />
                    <span className="text-sm font-semibold text-white leading-snug">{t(item.qKey)}</span>
                  </div>
                  {isOpen
                    ? <ChevronUp size={18} className="text-orange shrink-0" />
                    : <Plus size={18} className="text-orange shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pl-12 border-t border-[#17334D]">
                    <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4 whitespace-pre-line">
                      {t(item.aKey)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="mt-4">
        <Link to="/faq" className="inline-flex items-center gap-2 text-orange font-semibold text-sm hover:gap-3 transition-all">
          Toutes les questions pratiques <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FINAL CTA
// ---------------------------------------------------------------------------
function FinalCTA({ onAppt, onCallback }: { onAppt: () => void; onCallback: () => void }) {
  return (
    <section className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-8 text-center orange-glow-sm">
        <span className="text-[11px] font-bold text-[#B9BBC8] uppercase tracking-widest">
          Et si votre prochain marché était ici ?
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2 mb-3">
          Commencez par une opportunité.
        </h2>
        <p className="text-[#B9BBC8] text-sm md:text-base mb-6 max-w-md mx-auto leading-relaxed">
          Découvrez le besoin, vérifiez son intérêt pour votre entreprise, puis décidez de la suite.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/marches-publics" className="bg-orange text-white font-semibold py-3.5 rounded-xl hover:bg-orange/90 transition-colors text-sm">
            Explorer les marchés publics
          </Link>
          <Link to="/appels-doffres" className="border border-[#17334D] text-white font-semibold py-3.5 rounded-xl hover:border-orange/50 transition-colors text-sm">
            Appels d'offres privés
          </Link>
          <Link to="/sous-traitance" className="border border-[#17334D] text-white font-semibold py-3.5 rounded-xl hover:border-orange/50 transition-colors text-sm">
            Missions de sous-traitance
          </Link>
        </div>
        <p className="text-xs text-[#B9BBC8] mt-5">Vous ne savez pas par où commencer ?</p>
        <div className="flex justify-center gap-2 mt-2">
          <button onClick={onCallback} className="text-orange font-semibold text-sm hover:underline">
            Être rappelé
          </button>
          <button onClick={onAppt} className="text-[#B9BBC8] text-sm hover:text-white transition-colors">
            · Prendre rendez-vous
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// HOME PAGE
// ---------------------------------------------------------------------------
export default function HomePage() {
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <div className="page-fade-in">
      <PageMeta
        title="Marchés Direct — Marchés publics, appels d'offres privés et sous-traitance"
        description="Trouvez et candidatez aux marchés publics, appels d'offres privés et missions de sous-traitance partout en France. Analyse IA du DCE, scoring de compatibilité et génération de dossier."
      />
      <HeroSection onAppt={() => setAppointmentOpen(true)} onCallback={() => setCallbackOpen(true)} />
      <DemoWalkthroughSection />
      <TestimonialsSection />
      <TeamSection />
      <GeographicSection />
      <SectorsSection />
      <BlogSection />
      <HomeFaqSection />
      <FinalCTA onAppt={() => setAppointmentOpen(true)} onCallback={() => setCallbackOpen(true)} />
      <AppointmentModal open={appointmentOpen} onClose={() => setAppointmentOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}