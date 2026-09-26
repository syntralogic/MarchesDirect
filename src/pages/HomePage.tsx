import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Handshake, ChevronRight, Globe,
  Building, ArrowRight,
  Search, MousePointerClick, Locate, MapPin, Loader2, AlertCircle, X,
  PlayCircle, ChevronLeft, ChevronUp, Plus,
  Users, ArrowUpRight,
  Euro, FileText, Clock, Lock, Shield, Calendar, Trophy,
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { geoCentroid, geoMercator } from 'd3-geo';
import { useLang } from '@/contexts/LangContext';
import PageMeta from '@/components/common/PageMeta';
import { AppointmentModal } from '@/components/AppointmentModal';
import DemoVideoModal from '@/components/DemoVideoModal';
import { CallbackModal } from '@/components/CallbackModal';
import { tradesApi, type ApiTrade } from '@/lib/apiClient';
import { tradeIcon } from '@/lib/tradeIcons';
import { frenchCitiesGeo, type CityGeo } from '@/data/frenchCitiesGeo';
import { opportunitiesApi, type ApiOpportunity } from '@/lib/apiClient';
import { useOpportunityCounts } from '@/hooks/use-opportunity-counts';
import { DEFAULT_CITY_RADIUS_KM } from '@/lib/searchRadius';

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
    <section className="px-3 md:px-6 pt-3 md:pt-10 pb-10 md:pb-10 max-w-3xl mx-auto w-full">
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
      <div className="border border-orange/40 rounded-2xl bg-[#061D32] p-3 md:p-6 orange-glow relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[11px] md:text-[11px] font-bold text-orange uppercase tracking-widest">
            Artisans · TPE · PME
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mt-2 md:mt-2 mb-3 md:mb-3">
            <span className="text-white">Trouvez des marchés adaptés</span>{' '}
            <span className="text-orange">à votre entreprise.</span>
          </h1>
          {/* Reverted back to below OpportunityPaths (13 Sep, client's
              follow-up screenshot: explicitly wants the original
              cards-then-buttons order, like the "video" reference
              screenshot - the 13 Sep move to above OpportunityPaths is
              undone). If the below-the-fold complaint resurfaces on a
              specific short viewport, that needs a fix that doesn't
              reorder the buttons - e.g. shrinking OpportunityPaths itself
              on mobile - not moving them again. */}
          <div className="mb-3 md:mb-4"><OpportunityPaths onDemoClick={() => setDemoOpen(true)} /></div>
          <div className="flex flex-row gap-2 md:gap-3">
            <button onClick={onAppt} className="flex-1 bg-orange text-white font-semibold py-3 md:py-3 rounded-xl text-sm md:text-sm hover:bg-orange/90 transition-colors">
              Prendre rendez-vous
            </button>
            <button onClick={onCallback} className="flex-1 border border-orange text-orange font-semibold py-3 md:py-3 rounded-xl text-sm md:text-sm hover:bg-orange/10 transition-colors">
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
      <Link to="/marches-publics?status=TousStatuts" className="border border-[#17334D] rounded-xl bg-[#061D32] p-4 flex items-center justify-between hover:border-orange/40 transition-colors">
        <div>
          <div className="text-xs text-white font-semibold">Marchés publics</div>
          {loading ? <div className="h-3 w-20 mt-1 rounded bg-[#17334D] animate-pulse" aria-hidden="true" /> : <div className="text-xs text-[#B9BBC8]">{`${fmt(counts.public_procurement)} opportunités`}</div>}
        </div>
        <ChevronRight size={16} className="text-[#B9BBC8]" />
      </Link>
      <Link to="/appels-doffres" className="border border-[#17334D] rounded-xl bg-[#061D32] p-4 flex items-center justify-between hover:border-orange/40 transition-colors">
        <div>
          <div className="text-xs text-white font-semibold">Appels d'offres privés</div>
          {loading ? <div className="h-3 w-20 mt-1 rounded bg-[#17334D] animate-pulse" aria-hidden="true" /> : <div className="text-xs text-[#B9BBC8]">{`${fmt(counts.tender)} opportunités`}</div>}
        </div>
        <ChevronRight size={16} className="text-[#B9BBC8]" />
      </Link>
      <Link to="/sous-traitance" className="border border-[#17334D] rounded-xl bg-[#061D32] p-4 flex items-center justify-between hover:border-orange/40 transition-colors">
        <div>
          <div className="text-xs text-white font-semibold">Sous-traitance</div>
          {loading ? <div className="h-3 w-20 mt-1 rounded bg-[#17334D] animate-pulse" aria-hidden="true" /> : <div className="text-xs text-[#B9BBC8]">{`${fmt(counts.subcontracting)} opportunités`}</div>}
        </div>
        <ChevronRight size={16} className="text-[#B9BBC8]" />
      </Link>
    </>
  );
}

function OpportunityPaths({ onDemoClick }: { onDemoClick?: () => void }) {
  // 26 Sep client audit (point 3 remainder): these tiles link to /parcours,
  // whose guided journey only ever shows active (open-to-candidature)
  // opportunities by design - unlike HeroCounters just above, which links
  // to ?status=TousStatuts and correctly uses the all-statuses total. Using
  // that same all-statuses total here promised a bigger number than
  // /parcours would ever show. 'active' matches what the destination
  // actually displays.
  const { counts, loading } = useOpportunityCounts('active');
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const paths = [
    { icon: Building, title: 'Marchés publics', sub: 'Travaux et prestations pour les organismes publics', href: '/parcours?type=marches-publics', key: 'public_procurement' as const },
    { icon: Building2, title: "Appels d'offres privés", sub: 'Besoins des entreprises, promoteurs et bailleurs privés', href: '/parcours?type=appels-doffres', key: 'tender' as const },
    { icon: Handshake, title: 'Sous-traitance', sub: "Une partie d'un chantier ou d'une prestation à réaliser", href: '/parcours?type=sous-traitance', key: 'subcontracting' as const },
  ];
  return (
    <div className="grid grid-cols-1 gap-1 md:gap-2">
      {paths.map(p => {
        const count = counts[p.key];
        return (
          <Link key={p.href} to={p.href} className="flex items-center gap-2 md:gap-3 bg-[#061D32]/80 border border-[#17334D] rounded-xl p-1.5 md:p-3 hover:border-orange/50 group transition-all">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg bg-orange/10 flex items-center justify-center shrink-0">
              <p.icon size={18} className="text-orange md:hidden" />
              <p.icon size={22} className="text-orange hidden md:block" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm md:text-sm font-semibold text-white group-hover:text-orange transition-colors">{p.title}</div>
              <div className="text-[9px] md:text-[11px] text-[#B9BBC8] mt-0 md:mt-0.5 leading-tight md:leading-snug">{p.sub}</div>
            </div>
            <div className="text-[11px] text-orange font-semibold whitespace-nowrap shrink-0">
              {loading
                ? <div className="h-3 w-16 rounded bg-orange/20 animate-pulse" aria-hidden="true" />
                : `${fmt(count)} opportunité${count > 1 ? 's' : ''}`}
            </div>
            <ChevronRight size={16} className="text-orange shrink-0 md:hidden" />
            <ChevronRight size={16} className="text-orange shrink-0 hidden md:block" />
          </Link>
        );
      })}
      <div className="grid grid-cols-2 gap-1 md:gap-2">
        <button onClick={onDemoClick} className="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-2 bg-[#061D32]/80 border border-[#17334D] rounded-xl p-1.5 md:p-3 hover:border-orange/50 group transition-all text-left">
          <PlayCircle size={18} className="text-orange md:hidden" />
          <PlayCircle size={22} className="text-orange hidden md:block" />
          <div className="min-w-0">
            <div className="text-sm md:text-sm font-semibold text-white group-hover:text-orange transition-colors">Démo vidéo</div>
            <div className="text-[9px] md:text-[11px] text-[#B9BBC8] mt-0 md:mt-0 leading-tight md:leading-snug">Le parcours en 1 min</div>
          </div>
        </button>
        <a href="#mdh-temoignages" className="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-2 bg-[#061D32]/80 border border-[#17334D] rounded-xl p-1.5 md:p-3 hover:border-orange/50 group transition-all">
          <PlayCircle size={18} className="text-orange md:hidden" />
          <PlayCircle size={22} className="text-orange hidden md:block" />
          <div className="min-w-0">
            <div className="text-sm md:text-sm font-semibold text-white group-hover:text-orange transition-colors">Témoignages vidéo</div>
            <div className="text-[9px] md:text-[11px] text-[#B9BBC8] mt-0 md:mt-0 leading-tight md:leading-snug">Leurs retours d'expérience</div>
          </div>
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
    { label: 'Opportunité', title: 'Chauffage · lot 03', desc: 'Épinal · 120 000 € HT', card: { label: 'Opportunité', title: 'Chauffage · lot 03', meta: 'Épinal · 120 000 € HT', note: 'Critères et conditions' },
      heading: 'Comprenez ce que l’acheteur attend.',
      explain: 'Travaux demandés, budget, délais et conditions : les informations utiles sont réunies dans une fiche.' },
    { label: 'Concordance', title: '78 % de concordance', desc: 'Votre entreprise correspond aux critères demandés', card: { label: 'Concordance', title: '78 % de concordance', meta: 'Votre entreprise correspond aux critères demandés', note: 'Analyse IA' },
      heading: 'Voyez si cette opportunité vous correspond.',
      explain: 'Notre IA compare votre profil aux exigences du marché et calcule un indice de correspondance clair, avec le détail de son calcul.' },
    { label: 'Dossier', title: 'Le besoin · les critères · le dossier', desc: "Votre chargé d'affaires prépare la candidature", card: { label: 'Dossier', title: 'Le besoin · les critères · le dossier', meta: "Votre chargé d'affaires prépare la candidature", note: 'Vous validez avant dépôt' },
      heading: 'Votre dossier est préparé pour vous.',
      explain: "Le besoin, les critères de l'acheteur et le dossier de candidature sont réunis ; votre chargé d'affaires prépare, vous validez avant le dépôt." },
  ];
  return (
    <section className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">
        De la recherche au dossier, en 1 minute.
      </h2>

      <button
        onClick={() => setDemoOpen(true)}
        className="w-full text-left rounded-2xl border border-[#17334D] bg-[#061D32] mb-6 relative overflow-hidden hover:border-orange/50 transition-colors group"
      >
        {/* Client (20 Sep): real thumbnail image for the demo video, click
            opens the actual demo (DemoVideoModal / public/demo.mp4) -
            replaces the hand-built div mockup that used to stand in for it. */}
        <img
          src="/testimonials/demo-plateforme.jpeg"
          alt="Démo de la plateforme : de l'offre au dossier"
          className="w-full h-auto block"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
          <span className="w-14 h-14 rounded-full bg-orange/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayCircle size={28} className="text-white" />
          </span>
        </span>
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
              {steps[step].heading}
            </h3>
            <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed">
              {steps[step].explain}
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
  // Client (20 Sep): "Les trois photos que je t'ai envoyées serviront de
  // vignettes pour les vidéos sur le site. Lorsqu'un visiteur cliquera sur
  // l'une d'elles, il accédera à la vidéo correspondante." Real thumbnails
  // (with their own baked-in text/branding) replace the old hand-built
  // placeholder circle + "À intégrer" badge. The third image (plateforme
  // demo) is wired above to the real public/demo.mp4. These two are
  // testimonial-specific clips the client hasn't sent video files for yet -
  // only the thumbnails - so they honestly fall back to DemoVideoModal's
  // "vidéo bientôt disponible" state on click rather than faking a video.
  const slides = [
    { title: 'Un contrat de plus de 345 000 € — maintenance de chaudières.', image: '/testimonials/temoignage-chaudieres.jpeg', alt: 'Témoignage client : contrat de plus de 345 000 € en maintenance de chaudières' },
    { title: 'Un contrat de plus de 125 000 € — menuiseries pour un lotissement (exemple fictif).', image: '/testimonials/exemple-menuiseries.jpeg', alt: 'Exemple fictif : contrat de plus de 125 000 € en pose de fenêtres et portes' },
  ];
  const [i, setI] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
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
        <button
          onClick={() => setVideoOpen(true)}
          className="relative w-full rounded-xl border border-[#17334D] overflow-hidden block group"
        >
          <img src={slide.image} alt={slide.alt} className="w-full h-auto block" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
            <span className="w-14 h-14 rounded-full bg-orange/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <PlayCircle size={28} className="text-white" />
            </span>
          </span>
        </button>

        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={() => setI((i - 1 + slides.length) % slides.length)}
            className="w-9 h-9 rounded-full border border-[#17334D] flex items-center justify-center text-[#B9BBC8] hover:text-orange transition-colors"
            aria-label="Témoignage précédent"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-[11px] text-[#B9BBC8] text-center">
            Témoignage {i + 1} sur {slides.length}
          </p>
          <button
            onClick={() => setI((i + 1) % slides.length)}
            className="w-9 h-9 rounded-full border border-[#17334D] flex items-center justify-center text-[#B9BBC8] hover:text-orange transition-colors"
            aria-label="Témoignage suivant"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <DemoVideoModal open={videoOpen} onClose={() => setVideoOpen(false)} videoUrl="" title={slide.title} />
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
          {/* Client audit (15 Sep), A03: the portrait rendered as an 80/96px
              circle where the spec calls for a 110x144 portrait frame, and
              the alt text said "Maria" while the card underneath names Elena
              Popescu - a screen reader announced a different person from the
              one on screen (InfoPage's copy of this card already had the
              right name; this one was never updated with it).
              Sized in explicit pixels rather than a Tailwind scale step
              because the spec is in pixels and the previous responsive
              w-20/md:w-24 pair is what let it drift off-spec in the first
              place. */}
          <div className="w-[110px] h-[144px] rounded-xl border-2 border-orange overflow-hidden shrink-0">
            <img src={mem1} alt="Elena Popescu" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[#B9BBC8]">Votre premier contact</div>
            {/* A03 also specifies the name at 26px; text-lg/md:text-xl
                resolved to 18/20px, which is what the counter-audit
                re-measured ("nom 20 px" against the 26px reference).
                Pinned in px for the same reason as the frame above. */}
            <div className="text-[26px] font-extrabold text-white leading-tight">Elena Popescu</div>
            <div className="text-xs text-[#B9BBC8] mb-2">Assistante de direction</div>
            <p className="text-[11px] md:text-xs text-[#B9BBC8] leading-relaxed">
              Elena accueille votre demande et vous oriente vers le bon interlocuteur.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#17334D]">
          <span className="text-sm font-semibold text-orange">Découvrir notre équipe</span>
          {/* Client's audit (15 Sep): "Découvrir l'équipe doit conduire aux
              portraits, pas aux étapes de fonctionnement." This linked to
              /a-propos with no hash at all, so it landed at the top of that
              page - the workflow/steps section - rather than the team
              portraits further down (#mdq-team). App.tsx's AppLayout
              already scrolls to any hash on route change; this link just
              never supplied one. */}
          <Link
            to="/a-propos#mdq-team"
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
  const { counts: siteWideCounts } = useOpportunityCounts();
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
  // Perimeter the cityTotal above was actually computed with: DEFAULT_CITY_RADIUS_KM
  // when the city resolved to coordinates (real distance filter, same as
  // /recherche), null when it fell back to a plain city-name match.
  const [cityRadiusKm, setCityRadiusKm] = useState<number | null>(null);
  // Exact coordinates cityTotal above was computed with (25 Sep audit) -
  // handed off to /recherche via the URL so it reuses this point instead
  // of re-geocoding the city name a second time and risking a different
  // (or failed) result. Null whenever coords couldn't be resolved, same
  // as cityRadiusKm.
  const [cityApiCoords, setCityApiCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  // Counter shown on the "Voir les opportunités autour de …" button - always
  // computed for the whole selection with the same rule /recherche applies
  // (one city -> real radius; several cities -> plain name match), so the
  // announced perimeter and the number can never disagree.
  const [selectionCount, setSelectionCount] = useState<{ total: number; radiusKm: number | null; coords: { lat: number; lng: number } | null } | null>(null);
  const selectionRequestId = useRef(0);
  const [position, setPosition] = useState({ coordinates: [2.4, 46.6] as [number, number], zoom: 1 });
  const [citiesPosition, setCitiesPosition] = useState({ coordinates: [2.4, 46.6] as [number, number], zoom: 1 });
  // G09 (contre-audit 15 Sep): "10 noms à faible zoom, 57 à fort zoom... les
  // quatre villes signalées absentes des marqueurs" - Angoulême, Périgueux,
  // Bergerac et Marmande stayed missing "au niveau élevé testé" even though
  // the total count (57) was already correct.
  //
  // Root cause: citiesPosition.zoom was doing two unrelated jobs at once -
  // (1) how many city labels to reveal (the tier system below), which the
  // client's own wording treats as a country-wide density dial ("57" is a
  // constant regardless of where you're looking, per the audit's repeated
  // identical count), and (2) the ZoomableGroup's actual optical
  // magnification, which shrinks the visible geographic area around
  // whatever citiesPosition.coordinates happens to be. Clicking "+"
  // repeatedly (with coordinates still at the default center) increases
  // both at once - at zoom 8 the visible viewport is a small fraction of
  // France around that fixed point, so any tier-3 city far from it (all
  // four flagged cities sit ~200-280km southwest, near Bordeaux) is
  // logically "in" the 57-city count but physically clipped off-screen by
  // the SVG viewport - invisible no matter how far past its own tier
  // threshold you zoom, unless you'd also happened to drag/search/click
  // your way over there first.
  //
  // Client audit (19 Sep), point 3: "les boutons + / − ajoutent ou
  // retirent des noms de villes sans agrandir ou réduire réellement la
  // carte. Ces boutons doivent modifier le véritable zoom." The G09 fix
  // above (decoupling label density from citiesPosition.zoom) solved that
  // bug but created this one - the buttons stopped touching the map's
  // actual optical zoom at all, which reads as broken zoom controls (and
  // is: a "+" that doesn't visually enlarge anything is not a zoom
  // control). Re-merged, but the G09 root cause (a city geographically far
  // from citiesPosition.coordinates being "revealed" by tier yet clipped
  // off-screen by a narrow high-zoom viewport) is fixed properly this time
  // instead of by decoupling: visibleCities below now also checks whether
  // a city actually falls within the currently visible area (derived from
  // citiesPosition itself), so the reveal-by-tier and what's physically
  // on-screen can never disagree again - the buttons drive real zoom, and
  // "which cities show" adapts to both the zoom level AND the visible part
  // of the map, per the client's own wording for this point.
  const labelDensity = citiesPosition.zoom;

  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({});
  const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});
  // Nationwide rows with no resolved region/department at all (26 Sep fix -
  // see the fetch effect below for why these get a proportional per-region/
  // department display share instead of staying invisible or being folded
  // identically into every single one).
  const [unlocatedRegionCount, setUnlocatedRegionCount] = useState(0);
  const [unlocatedDeptCount, setUnlocatedDeptCount] = useState(0);
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
    // 26 Sep fix (client: "wo divide kr do khe konse region mein display
    // honge, phir original data ke baad display krwana") - unlocatedCount
    // still must never be folded INTO any single region/department's own
    // count (see getRegionCount/getDeptCount below - that's the exact
    // duplication bug this fixed a few hours ago). But leaving it
    // completely invisible per-region meant selecting just 2 of 13 regions
    // showed 253 while selecting all 13 jumped to 70 330 with nothing in
    // between explaining the gap. Each region/department badge now also
    // shows its own proportional share of that nationwide pool - "228
    // opportunités disponibles" (real, resolved) followed by "+ ~1 780
    // estimées (non localisées, réparties au prorata)" (a display-only
    // estimate, weighted by that region's share of all resolved rows) -
    // appended after, visually distinct, never merged into the first
    // number so it can't be mistaken for a verified count.
    opportunitiesApi.statsByRegion()
      .then(({ regions, unlocatedCount }) => {
        const map: Record<string, number> = {};
        // G13: was `map[key] = r.count`, which silently overwrote an
        // earlier variant's count instead of adding to it if two rows ever
        // normalized to the same key here (the real fix is upstream - see
        // /stats/regions - which now sums server-side and returns one row
        // per region; this is a defensive fallback so a future upstream
        // slip degrades to double-counting rather than losing counts again).
        regions.forEach(r => { const key = normalizeFr(r.region); map[key] = (map[key] || 0) + r.count; });
        setRegionCounts(map);
        setUnlocatedRegionCount(unlocatedCount || 0);
      })
      .catch(() => setRegionCounts({}));
    opportunitiesApi.statsByDepartment()
      .then(({ departments, unlocatedCount }) => {
        const map: Record<string, number> = {};
        departments.forEach(d => { map[d.department] = (map[d.department] || 0) + d.count; });
        setDeptCounts(map);
        setUnlocatedDeptCount(unlocatedCount || 0);
      })
      .catch(() => setDeptCounts({}));
  }, []);

  // A region/department filter now deliberately keeps opportunities whose
  // corresponding location field is NULL (see backend fix), so the map's
  // displayed count for any single region/department needs to include that
  // same unknown-location pool to match what clicking through to /recherche
  // will actually show.
  // 26 Sep fix ("ek element select karne pe 9200+, pura map select karne pe
  // sirf 11k+"): these used to add unlocatedRegionCount/unlocatedDeptCount
  // (the entire nationwide un-located pool) to EVERY single region/
  // department's badge, so one region could show more opportunities than
  // the whole, unfiltered country - mostly unrelated data with no real
  // connection to that region. The backend's region/department filter no
  // longer folds that pool into a single zone's results (see
  // routes/opportunities.ts), so this must match: a zone's badge is just
  // its own real, resolved matches.
  const getRegionCount = (name: string) => regionCounts[normalizeFr(name)] ?? 0;
  const getDeptCount = (code: string, name: string) => deptCounts[code] ?? deptCounts[normalizeFr(name)] ?? 0;
  // Proportional (display-only, never merged into getRegionCount/getDeptCount
  // above) share of the nationwide un-located pool: weighted by this one
  // region/department's share of every resolved row, so the 13 shares add
  // up to unlocatedRegionCount exactly once in total, not once per region.
  const resolvedRegionTotal = Object.values(regionCounts).reduce((sum, n) => sum + n, 0);
  const resolvedDeptTotal = Object.values(deptCounts).reduce((sum, n) => sum + n, 0);
  const getRegionUnlocatedShare = (name: string) => {
    if (unlocatedRegionCount <= 0 || resolvedRegionTotal <= 0) return 0;
    return Math.round(unlocatedRegionCount * (getRegionCount(name) / resolvedRegionTotal));
  };
  const getDeptUnlocatedShare = (code: string, name: string) => {
    if (unlocatedDeptCount <= 0 || resolvedDeptTotal <= 0) return 0;
    return Math.round(unlocatedDeptCount * (getDeptCount(code, name) / resolvedDeptTotal));
  };

  // Same rule as /recherche (RecherchePage): a single city is resolved to
  // coordinates through the backend geocoder and searched with a real
  // DEFAULT_CITY_RADIUS_KM distance filter; if it can't be resolved we fall
  // back to the plain city-name match and report radiusKm = null so the UI
  // doesn't announce a perimeter it didn't apply.
  const searchAroundCity = async (name: string, limit: number) => {
    const coords = await opportunitiesApi.geocodeCity(name);
    const data = coords
      ? await opportunitiesApi.search({ journey: undefined, lat: coords.lat, lng: coords.lng, radius_km: DEFAULT_CITY_RADIUS_KM, limit })
      : await opportunitiesApi.search({ journey: undefined, city: name, limit });
    // 25 Sep audit: the "Voir toutes les opportunités..." link below only
    // ever sent `city=<name>`, never the lat/lng this count was actually
    // computed with - so /recherche re-geocoded the same city name from
    // scratch. Usually landed on the same point, but not guaranteed to
    // (a second, independent call to the same external geocoder), and if
    // that second call ever failed, silently fell back to a plain
    // city-name text match with no radius applied at all - a card here
    // could say "123 dans un rayon de 50 km" while the link it sits next
    // to showed 90 (fewer, since the destination text-match won't return
    // registered communes near Bordeaux, only ones literally named
    // "Bordeaux"), including at a wider radius since a null cityCoords
    // downstream never sends radius_km at all no matter what's selected.
    // Returning the exact coordinates this total was computed with (see
    // callers below) lets the link hand them off directly instead.
    return { results: data.results, total: data.pagination.total, radiusKm: coords ? DEFAULT_CITY_RADIUS_KM : null, coords };
  };

  const handleCitySearch = async (override?: string) => {
    const raw = override ?? cityQuery;
    if (!raw.trim()) return;
    if (override) setCityQuery(override);
    setCityLoading(true);
    const query = raw.trim();
    try {
      const [around, geo] = await Promise.all([
        searchAroundCity(query, 5),
        fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=1`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
      ]);
      setCityOpportunities(around.results);
      setCityTotal(around.total);
      setCityRadiusKm(around.radiusKm);
      setCityApiCoords(around.coords);
      const feature = geo?.features?.[0];
      const coords: [number, number] | null = feature ? [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] : null;
      const resolvedName = feature?.properties?.city || query;
      setCityResult({ name: resolvedName, coords });
      // Client's audit (20 Sep, location point 5): typing a city into this
      // box updated cityOpportunities/cityTotal/cityResult but never
      // touched selectedCities - which is what the "Voir les opportunités
      // autour de ..." button's label AND its /recherche?city= link are
      // built from (see the tab==='cities' href below and the button
      // around line ~1015). So after picking Libourne on the map (setting
      // selectedCities) and then typing "Périgueux" here, the button kept
      // reading "autour de Libourne" with Périgueux's count grafted onto
      // it, and its link still pointed at Libourne (empty results). Only
      // do this for a text-box search (no override) - selectMapCity
      // passes an override and manages selectedCities itself for its own
      // multi-marker toggle behaviour, which this must not clobber.
      if (override === undefined) setSelectedCities(coords ? [{ name: resolvedName, coords }] : []);
      // Client's audit (15 Sep): "il faut... centrer la carte sur la ville
      // recherchée" - typing a city into the search box (as opposed to
      // clicking a marker, which already did this via selectMapCity) found
      // opportunities but never moved the map at all, so the map stayed
      // wherever it happened to be while the results below it were for a
      // totally different city.
      if (coords) setCitiesPosition(p => ({ coordinates: coords, zoom: Math.max(p.zoom, 4) }));
    } catch {
      setCityResult({ name: query, coords: null });
      setCityOpportunities([]);
      setCityTotal(0);
      setCityRadiusKm(null);
      setCityApiCoords(null);
      if (override === undefined) setSelectedCities([]);
    } finally {
      setCityLoading(false);
    }
  };

  // Count for the "Voir les opportunités autour de …" button: recomputed
  // whenever the selection changes so it always describes exactly what the
  // /recherche link will show (see buildSearchUrl / RecherchePage).
  useEffect(() => {
    const names = selectedCities.map(c => c.name);
    if (names.length === 0) { setSelectionCount(null); return; }
    const requestId = ++selectionRequestId.current;
    setSelectionCount(null);
    (async () => {
      try {
        if (names.length === 1) {
          const { total, radiusKm, coords } = await searchAroundCity(names[0], 1);
          if (selectionRequestId.current === requestId) setSelectionCount({ total, radiusKm, coords });
        } else {
          const data = await opportunitiesApi.search({ journey: undefined, city: names.join(','), limit: 1 });
          if (selectionRequestId.current === requestId) setSelectionCount({ total: data.pagination.total, radiusKm: null, coords: null });
        }
      } catch {
        if (selectionRequestId.current === requestId) setSelectionCount(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCities]);

  const selectMapCity = (city: { name: string; coords: [number, number] }) => {
    setCitiesPosition(p => ({ coordinates: city.coords, zoom: Math.max(p.zoom, 4) }));
    setSelectedCities(prev => {
      const exists = prev.some(c => c.name === city.name);
      return exists ? prev.filter(c => c.name !== city.name) : [...prev, city];
    });
    handleCitySearch(city.name);
  };

  // Rough (non-Mercator-accurate, but this codebase already treats
  // coordinates as plain lng/lat everywhere, not a real GIS projection) half
  // -span of what's visible around citiesPosition.coordinates at the
  // current zoom. BASE_HALF_* sized so zoom=1 comfortably covers mainland
  // France (~-5 to 9.5° lng, ~41 to 51° lat) end to end from the default
  // center - a city genuinely tier-revealed can only fail the bounds check
  // once you've actually zoomed/panned in far enough that it's realistically
  // off-screen, not before.
  const BASE_HALF_LNG = 8;
  const BASE_HALF_LAT = 6;
  const [centerLng, centerLat] = citiesPosition.coordinates;
  const halfLng = BASE_HALF_LNG / citiesPosition.zoom;
  const halfLat = BASE_HALF_LAT / citiesPosition.zoom;
  const visibleCities = frenchCitiesGeo.filter(c => {
    const tierRevealed = c.tier === 1 || (c.tier === 2 && labelDensity >= 2) || (c.tier === 3 && labelDensity >= 4);
    if (!tierRevealed) return false;
    const [lng, lat] = c.coords;
    return Math.abs(lng - centerLng) <= halfLng && Math.abs(lat - centerLat) <= halfLat;
  });
  // Client (19/20 Sep): "afficher trois ou quatre villes principales par
  // département... Bordeaux, Mérignac et Pessac se chevauchent." Tier
  // filtering above has no notion of department - once tier 3 opens up,
  // every close-together small town in the same département (Bordeaux +
  // Mérignac + Pessac sit within ~8km of each other) appears at once. Cap
  // each département to 4 markers: always keep its highest-tier city
  // (the anchor), then greedily add whichever remaining candidate is
  // farthest from what's already picked, so the picks spread across the
  // département (e.g. Bordeaux, Libourne, Langon, Arcachon) instead of
  // clustering around the first one found.
  const MAX_CITIES_PER_DEPARTMENT = 4;
  const visibleCitiesCapped = (() => {
    const byDept = new Map<string, CityGeo[]>();
    for (const c of visibleCities) {
      const list = byDept.get(c.department) || [];
      list.push(c);
      byDept.set(c.department, list);
    }
    const distSq = (a: [number, number], b: [number, number]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    const result: CityGeo[] = [];
    for (const list of byDept.values()) {
      if (list.length <= MAX_CITIES_PER_DEPARTMENT) { result.push(...list); continue; }
      const sortedByTier = [...list].sort((a, b) => a.tier - b.tier);
      const chosen: CityGeo[] = [sortedByTier[0]];
      const remaining = sortedByTier.slice(1);
      while (chosen.length < MAX_CITIES_PER_DEPARTMENT && remaining.length > 0) {
        let bestIdx = 0, bestMinDist = -1;
        remaining.forEach((cand, i) => {
          const minDist = Math.min(...chosen.map(ch => distSq(ch.coords, cand.coords)));
          if (minDist > bestMinDist) { bestMinDist = minDist; bestIdx = i; }
        });
        chosen.push(remaining[bestIdx]);
        remaining.splice(bestIdx, 1);
      }
      result.push(...chosen);
    }
    return result;
  })();
  // 20 Sep audit (location point 1): "Bordeaux/Libourne et Langon/Marmande
  // se chevauchent au zoom." Two separate causes:
  //  1. Markers sat inside <ZoomableGroup>, which scales its children, so
  //     dots and labels grew with the zoom exactly as fast as the distances
  //     between cities did - zooming in could never pull neighbours apart.
  //     They are now counter-scaled (1 / zoom) so a marker keeps a constant
  //     on-screen size and zooming genuinely separates close cities.
  //  2. The per-département cap above knows nothing about cities of
  //     *different* départements sitting next to each other (Langon 33 /
  //     Marmande 47). Labels are now decluttered in screen space: cities
  //     are placed by priority (selected first, then tier) and any city
  //     whose label box would touch an already-placed one is hidden until
  //     the visitor zooms in far enough to have room for it.
  // Same projection ComposableMap is configured with below (react-simple-maps
  // translates to width/2, height/2 by default).
  const cityProjection = geoMercator().center([2.454, 46.6]).scale(2600).translate([390, 310]);
  const visibleCitiesDeclutter = (() => {
    const zoom = citiesPosition.zoom;
    const centerPx = cityProjection(citiesPosition.coordinates) || [390, 310];
    const toScreen = (coords: [number, number]): [number, number] | null => {
      const p = cityProjection(coords);
      return p ? [(p[0] - centerPx[0]) * zoom, (p[1] - centerPx[1]) * zoom] : null;
    };
    const LABEL_CHAR_W = 5.6; // ~9px semi-bold
    const PAD = 4;
    const boxFor = (c: CityGeo, [x, y]: [number, number]) => {
      const w = c.name.length * LABEL_CHAR_W + 8;
      return { l: x - w / 2 - PAD, r: x + w / 2 + PAD, t: y - 20 - PAD, b: y + 6 + PAD };
    };
    const isSel = (c: CityGeo) => selectedCities.some(sc => sc.name === c.name);
    const ordered = [...visibleCitiesCapped].sort((a, b) => Number(isSel(b)) - Number(isSel(a)) || a.tier - b.tier || a.name.localeCompare(b.name));
    const placed: { l: number; r: number; t: number; b: number }[] = [];
    const result: CityGeo[] = [];
    for (const c of ordered) {
      const px = toScreen(c.coords);
      if (!px) continue;
      const box = boxFor(c, px);
      const collides = placed.some(o => box.l < o.r && box.r > o.l && box.t < o.b && box.b > o.t);
      if (collides && !isSel(c)) continue;
      placed.push(box);
      result.push(c);
    }
    return result;
  })();
  const zoomLevelLabel = labelDensity >= 4 ? 'Élevé' : labelDensity >= 2 ? 'Moyen' : 'Faible';

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

  // Lifted out of buildSearchUrl (below) so combinedSelectedTotal can use
  // the exact same "is this literally everything" check the click-through
  // URL already uses - see that function's own comment for why "all
  // selected" must be treated as "no location filter at all".
  const regionFeaturesAll = (regionsGeoJson?.features as { properties?: { code?: string } }[] | undefined) ?? [];
  const departmentFeaturesAll = (departementsGeoJson?.features as { properties?: { code?: string } }[] | undefined) ?? [];
  const selectedRegionCodesAll = new Set(selectedRegions.map(r => r.code));
  const selectedDepartmentCodesAll = new Set(selectedDepts.map(d => d.code));
  const allRegionsSelected = regionFeaturesAll.length > 0 && selectedRegions.length > 0
    && regionFeaturesAll.every(feature => feature.properties?.code && selectedRegionCodesAll.has(feature.properties.code));
  const allDeptsSelected = departmentFeaturesAll.length > 0 && selectedDepts.length > 0
    && departmentFeaturesAll.every(feature => feature.properties?.code && selectedDepartmentCodesAll.has(feature.properties.code));

  // Client report (26 Sep, WhatsApp screenshots): "Marchés publics" tile
  // says 70 695 opportunités, but selecting the whole map (every region
  // circled) shows "Total combiné 2 319". Cause: /stats/regions (and
  // /stats/departments) only ever counts status='active' rows that DO have
  // a resolved location_region/department (see that route's own 25/26 Sep
  // comments) - summing every single region therefore always undercounts
  // by (a) every non-active-status row and (b) the entire un-geocoded
  // pool, neither of which any region/department count can ever include.
  // Selecting literally every region/department is semantically "no
  // location filter at all" - buildSearchUrl already treats it that way
  // and sends a bare, unfiltered /recherche?status=all - so the number
  // shown here must match that same unfiltered universe instead of a sum
  // of necessarily-partial per-region counts. siteWideCounts.total (from
  // /stats/counts, the same source the homepage tiles above already use)
  // is exactly that: every status, every location, every journey.
  const combinedSelectedTotal = selectedCount === 0 ? 0
    : (tab === 'regions' && allRegionsSelected) || (tab === 'departments' && allDeptsSelected)
      ? siteWideCounts.total
      : tab === 'regions'
        // 26 Sep fix: was a bare sum of regionCounts (resolved rows only),
        // which is exactly the "253 for 2 regions, 70 330 once all 13 are
        // selected, nothing in between" jump the client flagged - the
        // un-located pool's proportional share (see getRegionUnlocatedShare
        // above) is now folded in here too, so this line always matches
        // what the per-region badges above it add up to.
        ? selectedRegions.reduce((sum, r) => sum + (regionCounts[normalizeFr(r.nom)] ?? 0) + getRegionUnlocatedShare(r.nom), 0)
        : tab === 'departments'
          ? selectedDepts.reduce((sum, d) => sum + (deptCounts[d.code] ?? deptCounts[normalizeFr(d.nom)] ?? 0) + getDeptUnlocatedShare(d.code, d.nom), 0)
          : 0;

  const buildSearchUrl = () => {
    // BUG (client report, 25 Sep - "pura map select karo to total bohot kam
    // ata hai"): the backend's region/department filters are a strict
    // `location_region ILIKE ANY(...)` / `location_department = ANY(...)`
    // match (see opportunities.ts) with no "OR IS NULL" fallback the way the
    // nature filter has - a row whose location wasn't resolved during
    // ingestion (geocodingService.ts's coverage gap) is silently dropped by
    // *any* region/department filter, selected-all included. Selecting every
    // region individually therefore undercounted the true nationwide total
    // by however many rows have no location_region at all - the ~2 500 the
    // client saw instead of the real, much larger, count. Selecting literally
    // every region/department on the map is semantically "no location filter
    // at all" (the visitor isn't narrowing anything), so send no region/
    // department params in that case and let /recherche's default
    // (unfiltered) view carry every opportunity, no-location rows included.
    // A genuine partial selection (1..n-1 regions) is left exactly as before -
    // widening that case to include no-location rows would reintroduce the
    // G13 map-vs-list count mismatch this filter was already fixed for.
    // Compares feature codes rather than raw feature/selection counts: some
    // GeoJSON sources represent one region/department as more than one
    // feature (multi-part geometries), which a plain length check can get
    // wrong in either direction. Checking that every feature's code is in
    // the selected set is correct regardless of how many features share a
    // code.
    //
    // allRegionsSelected/allDeptsSelected are computed once, above (next to
    // combinedSelectedTotal), and reused here so the displayed total and
    // this link can never disagree about what "everything" means.

    // Edge case: if the region/department GeoJSON hasn't finished loading
    // yet, allRegionsSelected/allDeptsSelected stay false no matter how many
    // regions/departments are selected (there's nothing to compare the count
    // against), so a "select all" click made before the GeoJSON loads would
    // still send a strict region=/department= filter instead of the bare,
    // unfiltered /recherche it should. Treat "GeoJSON not loaded" the same
    // as "everything selected".
    if (tab === 'regions' && selectedRegions.length > 0)
      return (allRegionsSelected || !regionsGeoJson) ? '/recherche?status=all' : `/recherche?status=all&${selectedRegions.map(r => `region=${encodeURIComponent(r.nom)}`).join('&')}`;
    if (tab === 'departments' && selectedDepts.length > 0)
      return (allDeptsSelected || !departementsGeoJson) ? '/recherche?status=all' : `/recherche?status=all&${selectedDepts.map(d => `department=${encodeURIComponent(d.code)}`).join('&')}`;
    if (tab === 'cities' && selectedCities.length > 0) {
      const cityParams = selectedCities.map(c => `city=${encodeURIComponent(c.name)}`).join('&');
      // 25 Sep audit: hand off the exact coordinates + radius selectionCount
      // was just computed with (single-city case only - see searchAroundCity)
      // so /recherche shows the same total this button just promised instead
      // of silently re-geocoding and possibly landing on a plain city-name
      // text match with no radius applied.
      if (selectedCities.length === 1 && selectionCount?.coords) {
        return `/recherche?${cityParams}&lat=${selectionCount.coords.lat}&lng=${selectionCount.coords.lng}&radius_km=${selectionCount.radiusKm ?? DEFAULT_CITY_RADIUS_KM}`;
      }
      return `/recherche?${cityParams}`;
    }
    return '/recherche';
  };

  return (
    <section id="mdh-zones" className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
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
                    const unlocatedShare = isRegion
                      ? (tab === 'regions' ? getRegionUnlocatedShare(item.nom) : getDeptUnlocatedShare(item.code, item.nom))
                      : 0;
                    return (
                      <div key={code || name || index} className="flex items-center justify-between gap-2 py-1 border-b border-[#17334D]/50 last:border-0">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{name}</p>
                          {count !== undefined && (
                            <p className="text-[10px] text-orange font-medium">
                              {count.toLocaleString('fr-FR')} {count > 1 ? 'opportunités disponibles' : 'opportunité disponible'}
                            </p>
                          )}
                          {/* 26 Sep fix: appended AFTER the real, resolved
                              count above, never merged into it - a
                              proportional, clearly-labelled estimate of
                              this region/département's share of the
                              nationwide un-located pool, not a verified
                              number. */}
                          {unlocatedShare > 0 && (
                            <p className="text-[9px] text-[#B9BBC8]">
                              + {unlocatedShare.toLocaleString('fr-FR')} estimées (non localisées)
                            </p>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeSelection(item); }} aria-label={`Retirer ${name}`} className="text-red-400 hover:text-red-300 shrink-0 ml-1">
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {selectedCount > 1 && (tab === 'regions' || tab === 'departments') && (
                    <div className="flex items-center justify-between gap-2 pt-1.5 mt-0.5 border-t border-[#17334D]">
                      <p className="text-[10px] font-bold text-white">Total combiné</p>
                      <p className="text-[10px] font-bold text-orange">
                        {combinedSelectedTotal.toLocaleString('fr-FR')} {combinedSelectedTotal > 1 ? 'opportunités' : 'opportunité'}
                      </p>
                    </div>
                  )}
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
                    {visibleCitiesDeclutter.map(city => {
                      const isSelected = selectedCities.some(c => c.name === city.name);
                      return (
                        <Marker key={city.name} coordinates={city.coords} onClick={() => selectMapCity(city)} style={{ default: { cursor: 'pointer' } }}>
                          <g transform={`scale(${1 / citiesPosition.zoom})`}>
                          {/* Client (19/20 Sep): "cliquer sur le texte «Libourne»
                              ne sélectionnait pas la ville, alors que cliquer sur
                              son point fonctionnait" + "surface suffisante pour
                              une sélection au doigt." onClick already sits on
                              the whole <Marker> group, so in principle the text
                              should fire it too - but an invisible, generously
                              sized hit-target spanning both the dot and the
                              label removes any doubt (small text glyphs are an
                              unreliable tap target on their own, especially on
                              mobile) rather than relying on SVG event bubbling
                              through a 9-11px <text> element. */}
                          <rect x={-24} y={-22} width={48} height={30} fill="transparent" style={{ cursor: 'pointer' }} />
                          {isSelected && <circle r={11} fill="#FF6500" fillOpacity={0.25} />}
                          <circle r={isSelected ? 6 : 4} fill="#FF6500" stroke="#fff" strokeWidth={1.2} />
                          <text textAnchor="middle" y={-9} style={{ fontSize: isSelected ? 11 : 9, fill: '#fff', fontWeight: isSelected ? 700 : 600, cursor: 'pointer', pointerEvents: 'none' }}>
                            {city.name}
                          </text>
                          </g>
                        </Marker>
                      );
                    })}
                  </ZoomableGroup>
                </ComposableMap>
              )}

              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={() => setCitiesPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))} aria-label="Zoomer" className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">+</button>
                <button onClick={() => setCitiesPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))} aria-label="Dézoomer" className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">−</button>
                <button onClick={() => setCitiesPosition({ coordinates: [2.4, 46.6], zoom: 1 })} aria-label="Recentrer la carte" className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors flex items-center justify-center"><Locate size={14} /></button>
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
                <p className="text-xs text-[#B9BBC8] mt-1">
                  {cityRadiusKm ? `Aucune opportunité dans un rayon de ${cityRadiusKm} km.` : 'Aucune opportunité pour le moment.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Client's audit (15 Sep): "ajouter le nombre de résultats et
                    'Voir toutes les opportunités de cette ville'" - a text
                    search here only ever showed its capped 5-result preview
                    with no total and no way to reach the rest, and gave no
                    way to tell an open opportunity from an expired one. */}
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-[#B9BBC8]">
                    <span className="text-orange font-semibold">{cityTotal}</span> opportunité{cityTotal !== 1 ? 's' : ''}{' '}
                    {cityRadiusKm ? `dans un rayon de ${cityRadiusKm} km autour de ${cityResult.name}` : `à ${cityResult.name}`}
                  </p>
                  <Link
                    to={
                      cityApiCoords
                        ? `/recherche?city=${encodeURIComponent(cityResult.name)}&lat=${cityApiCoords.lat}&lng=${cityApiCoords.lng}&radius_km=${cityRadiusKm ?? DEFAULT_CITY_RADIUS_KM}`
                        : `/recherche?city=${encodeURIComponent(cityResult.name)}`
                    }
                    className="text-[11px] text-orange font-semibold hover:underline"
                  >
                    Voir toutes les opportunités {cityRadiusKm ? `dans ces ${cityRadiusKm} km` : 'de cette ville'}
                  </Link>
                </div>
                {cityOpportunities.map(opp => {
                  const isExpired = opp.status === 'expired' || opp.status === 'cancelled' || opp.status === 'awarded';
                  return (
                    <Link key={opp.id} to={`/opportunites/${opp.id}`} className="block bg-[#031B30] border border-[#17334D] rounded-xl p-3 hover:border-orange/40 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-white leading-snug">{opp.title}</p>
                        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${isExpired ? 'bg-[#17334D] text-[#B9BBC8]' : 'bg-orange/15 text-orange'}`}>
                          {opp.status === 'expired' ? 'Expirée' : opp.status === 'cancelled' ? 'Annulée' : opp.status === 'awarded' ? 'Attribuée' : 'Ouverte'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[10px] text-[#B9BBC8]">
                        {opp.location_city && <span className="flex items-center gap-1"><MapPin size={10} /> {opp.location_city}</span>}
                        {opp.deadline && <span>{new Date(opp.deadline).toLocaleDateString('fr-FR')}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {selectedCities.length > 0 && (
              <Link to={buildSearchUrl()} className="mt-3 w-full flex items-center justify-center gap-2 border border-orange text-orange font-semibold text-sm py-3 rounded-xl hover:bg-orange/10 transition-colors">
                {selectedCities.length === 1 && selectionCount?.radiusKm ? 'Voir les opportunités autour de ' : 'Voir les opportunités à '}
                {selectedCities.map((c, i) => (<span key={i}>{i > 0 && ', '}{c.name}</span>))}
                {selectedCities.length === 1 && selectionCount?.radiusKm ? ` (${selectionCount.radiusKm} km)` : ''}
                {selectionCount ? ` — ${selectionCount.total}` : ''} <ArrowRight size={14} />
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
  // A04/Q04 (contre-audit 15 Sep): this rendered 6 of the 16 hand-written
  // marketing "sector families" from mockData.ts (Travaux & construction,
  // Services aux entreprises...) with hardcoded counts - generic labels
  // standing in for the real métiers, exactly what the audit flagged.
  // Fetches the real trades taxonomy (GET /api/trades) instead, the same
  // one classification/search/match-score already use, with a live count
  // per trade rather than a number typed into mockData.ts once and never
  // updated. Cards link by trade_id (an exact filter) instead of the old
  // free-text-search-on-a-marketing-label workaround.
  const [trades, setTrades] = useState<ApiTrade[] | null>(null);
  useEffect(() => {
    tradesApi.list().then(setTrades).catch(() => setTrades([]));
  }, []);

  return (
    <section className="px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <span className="text-[11px] font-bold text-orange uppercase tracking-widest">{t('sectors') || "Secteurs d'activité"}</span>
      <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-5">Quel est votre métier ?</h2>

      <div className="grid grid-cols-2 gap-3">
        {(trades || []).slice(0, 6).map((trade) => {
          const Icon = tradeIcon(trade.slug);
          return (
            <Link key={trade.id} to={`/recherche?trade_id=${trade.id}`} className="flex flex-col items-start gap-2 bg-[#061D32] border border-[#17334D] rounded-xl p-3.5 hover:border-orange/50 group transition-all">
              <div className="w-11 h-11 rounded-lg bg-orange/10 flex items-center justify-center shrink-0 group-hover:bg-orange/20 transition-colors">
                <Icon size={22} className="text-orange" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white group-hover:text-orange transition-colors leading-snug">{trade.name}</div>
                <div className="text-[11px] text-[#B9BBC8] mt-0.5">{trade.opportunity_count.toLocaleString('fr-FR')} opportunités</div>
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