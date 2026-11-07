// Accueil v27 (mobile d'abord). Ordre : promesse courte + moteur (visible sans défiler) → carte de France →
// trois étapes → accompagnement → équipe → témoignages → questions → dernier appel. Le pied de page est celui du site.
// Retirés de l'accueil : « Marchés ouverts / Futurs chantiers », « Conseils et actualités ».
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import DemoVideoModal from '@/components/DemoVideoModal';
import PageMeta from '@/components/common/PageMeta';
import { CallbackModal } from '@/components/CallbackModal';
import { CompanySearchForm, type CompanySearchHandle } from '@/components/home/CompanySearchForm';
import { DEPARTMENTS } from '@/data/departments';
import { ELENA, TEAM } from '@/data/homeContent';
import { chantiersApi, opportunitiesApi } from '@/lib/apiClient';
import { chantierLine, type Chantier, type ChantiersStats } from '@/lib/chantiers';
import { GUIDE_CATALOG, PUBLISHED_GUIDES } from '@/content/guides/catalog';

const GeographicSection = lazy(() => import('@/components/home/GeographicSection'));
const SAVED_KEY = 'md_saved_markets';
// Champ clair sur carte sombre : le moteur doit ressortir du fond bleu nuit.
export const FIELD = 'h-[54px] w-full rounded-xl border-2 border-[#C9D6E8] bg-white px-3.5 text-[16px] text-[#0A1628]';
export const BTN = 'min-h-[56px] w-full rounded-[14px] bg-[#C2410C] px-4 py-2 text-[17px] font-extrabold text-white shadow-[0_6px_20px_rgba(194,65,12,.35)] disabled:opacity-70';

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#FB923C]">{children}</div>
);
const Block = ({ children }: { children: React.ReactNode }) => <section className="flex flex-col gap-3">{children}</section>;

function ElenaAvatar({ size = 48 }: { size?: number }) {
  return ELENA.photo
    ? <img src={ELENA.photo} alt={ELENA.name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    : <div aria-hidden className="flex shrink-0 items-center justify-center rounded-full bg-[#1C2433] text-[15px] font-bold text-[#FB923C]" style={{ width: size, height: size }}>EP</div>;
}

// 1.5 : « [N] marchés ouverts aujourd'hui en France ». Valeur réelle (une requête par jour côté serveur), jamais de valeur fixe : en cas d'échec, toute la ligne disparaît.
/** 6 nov. : compteur vivant dans le moteur de recherche. Point rouge qui pulse, chiffre relu toutes les 5 minutes
 *  (et au retour sur l'onglet), même définition que la recherche : date limite connue et à venir, non annulée.
 *  La fraîcheur est dite honnêtement : si le dernier import date de plus de 24 h, on l'écrit au lieu de « en direct ». */
function LiveCounter() {
  const [c, setC] = useState<{ open: number; new24h: number; lastImportAt: string | null; byJourney?: Record<string, { open: number; verify: number; new24h: number }> } | null>(null);
  const [bump, setBump] = useState(false);
  const [works, setWorks] = useState(0); // 7 nov. : chantiers à venir (permis autorisés), une ligne discrète
  useEffect(() => { chantiersApi.stats().then(r => setWorks(r.total || 0)).catch(() => {}); }, []);
  useEffect(() => {
    let live = true; let prev: number | null = null;
    const load = () => opportunitiesApi.getLiveCounter().then(res => { let r = res;
      if (!live || !Number.isFinite(r.open) || r.open <= 0) return;
      if (prev !== null && prev !== r.open) { setBump(true); setTimeout(() => setBump(false), 1200); }
      // 7 nov. : la ligne principale = marchés publics seuls (le privé et la sous-traitance ont leur propre ligne).
      const pub = r.byJourney?.public_procurement;
      if (pub) r = { ...r, open: pub.open, new24h: pub.new24h };
      prev = r.open; setC(r);
    }).catch(() => {});
    load();
    const t = setInterval(load, 5 * 60000);
    const vis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', vis);
    return () => { live = false; clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, []);
  if (!c) return null;
  const age = c.lastImportAt ? (Date.now() - Date.parse(c.lastImportAt)) / 3600000 : null;
  const fresh = age != null && age <= 24;
  const when = c.lastImportAt ? new Date(c.lastImportAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px]" aria-live="polite">
      <span className="relative flex h-2.5 w-2.5" aria-hidden>
        {fresh && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EF4444] opacity-75" />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${fresh ? 'bg-[#EF4444]' : 'bg-[#94A3B8]'}`} />
      </span>
      <span><b className={`text-white transition-colors ${bump ? 'text-[#FDBA74]' : ''}`}>{new Intl.NumberFormat('fr-FR').format(c.open)}</b> marchés publics ouverts
        <span className="text-[#B4C1D3]">{fresh ? (c.new24h > 0 ? ` · ${new Intl.NumberFormat('fr-FR').format(c.new24h)} nouveaux en 24 h` : ' · en direct') : when ? ` · dernier import le ${when}` : ''}</span></span>
      {/* 7 nov. : appels d'offres privés et sous-traitance, mêmes règles (annonces disponibles ; archives non comptées). */}
      {(() => {
        const nf = new Intl.NumberFormat('fr-FR'); const t = c.byJourney?.tender; const st = c.byJourney?.subcontracting;
        const parts: string[] = [];
        if (t && t.open + t.verify > 0) parts.push(`${nf.format(t.open + t.verify)} appels d’offres privés${t.new24h > 0 ? ` (${nf.format(t.new24h)} nouveaux en 24 h)` : ''}`);
        if (st && st.open + st.verify > 0) parts.push(`${nf.format(st.open + st.verify)} demandes de sous-traitance${st.new24h > 0 ? ` (${nf.format(st.new24h)} nouvelles en 24 h)` : ''}`);
        return parts.length || works ? <span className="basis-full pl-[18px] text-[12.5px] text-[#B4C1D3]">{parts.join(' · ')}{works > 0 && <>{parts.length ? ' · ' : ''}<Link to="/chantiers-a-venir" className="underline hover:text-[#FB923C]">{nf.format(works)} chantiers à venir</Link></>}</span> : null;
      })()}
    </div>
  );
}

// 7 nov. : chantiers à venir (permis de construire autorisés) visibles dès l'accueil, en un bloc court.
function ChantiersBlock() {
  const [stats, setStats] = useState<ChantiersStats | null>(null);
  const [latest, setLatest] = useState<Chantier[]>([]);
  useEffect(() => {
    chantiersApi.stats().then(setStats).catch(() => {});
    chantiersApi.list({ page: 1 }).then(r => setLatest(r.results.slice(0, 4))).catch(() => {});
  }, []);
  if (!stats || !stats.total) return null;
  const nf = new Intl.NumberFormat('fr-FR');
  return (
    <section className="w-full">
      <Eyebrow>Nouveau · Chantiers à venir</Eyebrow>
      <h2 className="mt-1 text-[22px] font-extrabold leading-tight md:text-[28px]">Repérez les chantiers avant qu’ils commencent</h2>
      <p className="mt-1 text-[15px] text-[#B4C1D3]"><b className="text-white">{nf.format(stats.total)}</b> permis de construire autorisés ces 12 derniers mois : maisons, logements, bureaux, commerces, bâtiments agricoles et industriels.</p>
      {latest.length > 0 && <ul className="mt-3 grid gap-2 md:grid-cols-2">{latest.map(c => (
        <li key={c.id}><Link to={c.path} className="block h-full rounded-[14px] border border-[#22385A] bg-[#12233A] p-3 hover:border-[#FB923C]">
          <span className="text-[11.5px] font-extrabold uppercase tracking-[.06em] text-[#FB923C]">{c.categoryLabel}</span>
          <span className="mt-0.5 block text-[15px] font-bold text-[#F2F5F9]">{c.title}</span>
          <span className="mt-0.5 block text-[12.5px] text-[#B4C1D3]">{chantierLine(c)}</span>
        </Link></li>))}</ul>}
      <Link to="/chantiers-a-venir" className="mt-3 inline-block text-[14.5px] font-bold text-[#FB923C] underline">Voir les chantiers de mon département</Link>
    </section>
  );
}

function OpenCounter() {
  // v28 : bande de chiffres (vrais), au niveau visuel du moteur et de la carte. Le compteur reste réel ; sans chiffre, la tuile est absente.
  const tiles: { big: string; small: string; hot?: boolean }[] = [
    { big: '3 types', small: 'marchés publics, appels d’offres privés, sous-traitance' },
    { big: '6 critères', small: 'pour votre pourcentage : activité, zone, calendrier, moyens, références, qualifications' },
    { big: '30 min', small: 'offertes avec notre équipe pour faire le point sur un marché' },
  ];
  return (
    <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {tiles.map(t => (
        <div key={t.big} className={`rounded-2xl border p-3.5 ${t.hot ? 'border-[#C2410C]' : 'border-[#22385A]'}`} style={{ background: 'linear-gradient(160deg,#142B4A,#0F1F35)' }}>
          <b className={`block text-[26px] leading-none ${t.hot ? 'text-[#FDBA74]' : 'text-white'}`}>{t.big}</b>
          <span className="mt-1.5 block text-[13px] leading-snug text-[#B4C1D3]">{t.small}</span>
        </div>))}
    </div>
  );
}

// 1.6 : lecture de localStorage uniquement, aucun appel réseau tant que le visiteur ne déplie pas la liste.
function SavedBanner() {
  const [ids, setIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') as { id?: string }[];
      setIds(list.map(s => s?.id).filter((x): x is string => typeof x === 'string'));
    } catch { setIds([]); }
  }, []);
  useEffect(() => {
    if (!open) return;
    ids.slice(0, 10).forEach(id => {
      opportunitiesApi.getById(id).then(o => setTitles(t => ({ ...t, [id]: o.title }))).catch(() => {});
    });
  }, [open, ids]);
  if (ids.length === 0) return null;
  return (
    <div className="rounded-xl bg-[#123B2A] px-3.5 py-3 text-[15px] text-[#6EE7B7]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">{ids.length === 1 ? '1 marché enregistré' : `${ids.length} marchés enregistrés`} sur ce téléphone</span>
        {ids.length === 1
          ? <Link to={`/opportunites/${ids[0]}`} className="flex min-h-[48px] items-center font-bold underline">Le retrouver</Link>
          : <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex min-h-[48px] items-center font-bold underline">{open ? 'Masquer' : 'Les retrouver'}</button>}
      </div>
      {open && (
        <ul className="mt-1 flex flex-col gap-1">
          {ids.slice(0, 10).map(id => (
            <li key={id}><Link to={`/opportunites/${id}`} className="flex min-h-[48px] items-center underline">{titles[id] || 'Marché enregistré'}</Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SimpleSearch() {
  const navigate = useNavigate();
  const [metier, setMetier] = useState('');
  const [dept, setDept] = useState('FR');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Recherche simple -> la liste v26 (cartes d'abord, sans pourcentage), jamais l'ancienne page de filtres.
    const p = new URLSearchParams();
    if (metier.trim()) p.set('q', metier.trim());
    if (dept !== 'FR') p.set('department', dept);
    navigate(`/vos-marches?${p.toString()}`);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <LiveCounter />
      <label htmlFor="md-metier" className="text-[15px] font-bold">Votre métier</label>
      <input id="md-metier" value={metier} onChange={e => setMetier(e.target.value)} placeholder="Ex. : nettoyage, peinture, sécurité, architecte…" className={`${FIELD} placeholder:text-[#6B7A90]`} />
      <label htmlFor="md-zone" className="text-[15px] font-bold">Votre zone</label>
      <select id="md-zone" value={dept} onChange={e => setDept(e.target.value)} className={FIELD}>
        <option value="FR">Toute la France</option>
        {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code} – {d.name}</option>)}
      </select>
      <button type="submit" className={BTN}>Rechercher des marchés</button>
      <p className="text-center text-[13px] font-bold text-[#FDBA74]">Marchés publics · Appels d’offres privés · Sous-traitance</p>
      <p className="text-center text-[15px] text-[#B4C1D3]">Indiquez ensuite votre entreprise (nom ou SIRET) pour voir le pourcentage de chaque marché</p>
    </form>
  );
}

// Bloc témoignages : copie EXACTE de l'accueil actuel (vignette, flèches, « Témoignage 1 sur 2 », lecteur en fenêtre au clic).
function TestimonialsSection() {
  // 30 Sep, client over WhatsApp: "Ca c'est la 1ere video temoignage avec la
  // miniature ... En tout il y aura 8 video temoignage." 4 Oct: 2nd video (Nico,
  // gérant chauffage & climatisation) added. The clips are NOT chained: the
  // visitor moves from one thumbnail to the next with the arrows, and a video
  // only plays when its own thumbnail is tapped ("Non du tout - tu as une
  // flèche pour aller à la miniature suivante"). Adding a clip = one more entry
  // in this array (+ its .mp4 and .jpeg in public/testimonials).
  const slides = [
    {
      title: '10 mois de planning rempli — Bordeaux Élec.',
      image: '/testimonials/temoignage-didier-bourdon.jpeg',
      alt: 'Témoignage client : Didier Bourdon, directeur de Bordeaux Élec, 10 mois de planning rempli',
      videoUrl: '/testimonials/temoignage-didier-bourdon.mp4',
    },
    {
      title: 'Nico — gérant, chauffage & climatisation.',
      image: '/testimonials/temoignage-nico.jpeg',
      alt: 'Témoignage client : Nico, gérant dans le chauffage et la climatisation',
      videoUrl: '/testimonials/temoignage-nico.mp4',
    },
  ];
  const [i, setI] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const slide = slides[i];
  const arrow = 'w-9 h-9 shrink-0 rounded-full border border-[#17334D] bg-[#061D32] flex items-center justify-center text-[#B9BBC8] hover:text-orange hover:border-orange/50 transition-colors';
  return (
    <section id="mdh-temoignages" className="scroll-mt-16 px-4 md:px-6 py-5 md:py-10 max-w-3xl mx-auto w-full">
      <span className="text-[11px] font-bold text-orange uppercase tracking-widest">
        Leur expérience, avec leurs mots
      </span>
      <h2 className="text-xl md:text-2xl font-bold text-white mt-1 mb-3 leading-tight">
        Des entrepreneurs racontent leur candidature.
      </h2>

      {/* 4 Oct, client: "Réduire la taille car ça prend trop de place ... comme la
          partie démo niveau taille". The portrait thumbnail is now capped in height
          (about the height of the demo thumbnail just above) and the arrows sit
          on each side of it instead of on a row of their own. */}
      <div className="rounded-2xl border border-[#17334D] bg-[#061D32] p-3 md:p-4">
        {/* 4 Oct (evening), client: the video block looked small, with empty space on
            both sides. The thumbnail is larger (width-driven, portrait ratio kept) and
            the arrows now sit over its left/right edges instead of taking room beside it. */}
        <div className="relative mx-auto w-full max-w-[300px] md:max-w-[380px]">
          <button
            onClick={() => setVideoOpen(true)}
            className="relative rounded-xl border border-[#17334D] overflow-hidden block group w-full"
            aria-label={`Lire la vidéo : ${slide.title}`}
          >
            <img src={slide.image} alt={slide.alt} loading="lazy" className="w-full h-auto block" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
              <span className="w-12 h-12 rounded-full bg-orange/90 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle size={24} className="text-white" />
              </span>
            </span>
          </button>
          {slides.length > 1 && (
            <>
              <button onClick={() => setI((i - 1 + slides.length) % slides.length)} className={`${arrow} absolute left-2 top-1/2 -translate-y-1/2 bg-[#061D32]/85`} aria-label="Témoignage précédent">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setI((i + 1) % slides.length)} className={`${arrow} absolute right-2 top-1/2 -translate-y-1/2 bg-[#061D32]/85`} aria-label="Témoignage suivant">
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>
        {slides.length > 1 && (
          <p className="text-[11px] text-[#B9BBC8] text-center mt-2">
            Témoignage {i + 1} sur {slides.length}
          </p>
        )}
      </div>

      <DemoVideoModal open={videoOpen} onClose={() => setVideoOpen(false)} videoUrl={slide.videoUrl || ''} title={slide.title} />
    </section>
  );
}

function Faq() {
  const items: [string, string][] = [
    ['Qu’est-ce qui est gratuit ?', 'La recherche, le pourcentage par marché, le premier échange de 30 minutes et votre dossier prérempli. L’accompagnement (candidature, présentation de votre entreprise aux donneurs d’ordre, mise en relation, négociation) fait partie de nos formules, présentées lors de cet échange. Vous décidez ensuite.'],
    ['Je ne connais pas les marchés publics. C’est pour moi ?', 'Oui. La plupart des entreprises que nous accompagnons répondent pour la première fois. Nous expliquons chaque étape et nous préparons les pièces avec vous.'],
    ['Que fait Marchés Direct à ma place ?', 'La recherche des marchés, le pourcentage de correspondance, le dossier prérempli et, si vous le souhaitez, les formulaires de candidature, le mémoire technique et le dépôt. Vous fournissez vos références et vos pièces, vous validez.'],
    ['Mes informations restent-elles confidentielles ?', 'Oui. Vos coordonnées servent à préparer votre dossier et à vous appeler au sujet de vos marchés. Vous pouvez demander à ne plus être appelé à tout moment.'],
  ];
  return (
    <Block>
      <h2 className="text-[19px] font-bold">Vos questions</h2>
      {items.map(([q, a]) => (
        <details key={q} className="group rounded-2xl border border-[#22385A] bg-[#12233A]">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[16px] font-bold [&::-webkit-details-marker]:hidden">
            {q}<span className="text-[22px] font-semibold text-[#FB923C] group-open:hidden">+</span><span className="hidden text-[22px] font-semibold text-[#FB923C] group-open:inline">–</span>
          </summary>
          <p className="px-4 pb-4 text-[15px] text-[#D6E0EC]">{a}</p>
        </details>
      ))}
    </Block>
  );
}

// Carte juste sous le moteur : le code de la carte reste un morceau séparé (lazy) chargé après le premier rendu,
// pour ne jamais retarder l'affichage du champ.
function DeferredMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [geoTab, setGeoTab] = useState<'regions' | 'departments' | 'cities'>('regions');
  const [regions, setRegions] = useState<{ code: string; nom: string }[]>([]);
  const [depts, setDepts] = useState<{ code: string; nom: string }[]>([]);
  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    if (!('IntersectionObserver' in window)) { setShow(true); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setShow(true); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [show]);
  return (
    <div ref={ref} className="min-h-[320px]">
      {show && (
        <Suspense fallback={<p className="px-4 text-[15px] text-[#B4C1D3]">Chargement de la carte…</p>}>
          <GeographicSection tab={geoTab} setTab={setGeoTab} selectedRegions={regions} setSelectedRegions={setRegions} selectedDepts={depts} setSelectedDepts={setDepts} />
        </Suspense>
      )}
    </div>
  );
}

export default function HomePage() {
  // ?mode=metier : arrivée depuis « Vos marchés » sans entreprise, l'onglet « Par métier » s'ouvre directement.
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'company' | 'simple'>(params.get('mode') === 'metier' ? 'simple' : 'company');
  const [callbackOpen, setCallbackOpen] = useState(false);
  const companyRef = useRef<CompanySearchHandle>(null);
  // « Modifier » depuis la liste (2.1) : retour ici, onglet « Par entreprise », champ vide et curseur dedans.
  const location = useLocation();
  useEffect(() => {
    if (!(location.state as { focusCompany?: boolean } | null)?.focusCompany) return;
    setMode('company');
    const t = window.setTimeout(() => companyRef.current?.clear(), 50);
    return () => window.clearTimeout(t);
  }, [location.state]);
  const hasTeam = !!ELENA.photo;

  const focusCompany = () => {
    setMode('company');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => companyRef.current?.focus(), 300);
  };
  const tabCls = (on: boolean) => `min-h-[48px] min-w-0 flex-1 rounded-[10px] px-1.5 text-center text-[15px] font-bold leading-tight transition-colors ${on ? 'bg-[#C2410C] text-white' : 'text-[#D6E0EC]'}`;

  return (
    <div className="page-fade-in">
      <PageMeta
        title="Marchés publics et appels d’offres pour artisans et PME | Marchés Direct"
        description="Marchés publics, appels d’offres privés et sous-traitance du bâtiment près de chez vous. Indiquez votre SIRET : nous trouvons les marchés faits pour votre entreprise et vous accompagnons jusqu’au dépôt."
      />
      <main className="w-full bg-[#0A1628] pb-16 text-[#F2F5F9]" style={{ fontFamily: '"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif' }}>

        {/* ===== 1. PREMIER ÉCRAN : promesse courte + moteur. Rien d'autre avant le champ. ===== */}
        <section className="mx-auto grid w-full max-w-[1100px] gap-5 px-4 pt-4 md:grid-cols-[1fr_1.15fr] md:items-start md:gap-10 md:px-6 md:pt-14">
          <div className="flex flex-col gap-2 md:gap-4 md:pt-6">
            {/* v28 (5 Nov, client) : le B2B doit sauter aux yeux — pas un site d'artisans pour particuliers. */}
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#FB923C] px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wider text-[#FDBA74]"><span aria-hidden className="h-2 w-2 rounded-full bg-[#F97316]" />Réservé aux professionnels · B2B</span>
            <h1 className="text-[25px] font-extrabold leading-[1.15] md:text-[40px]">Les appels d’offres et marchés faits pour votre entreprise.</h1>
            <p className="text-[15px] text-[#B4C1D3] md:text-[18px]">Marchés publics, appels d’offres privés, sous-traitance : les contrats des collectivités, des donneurs d’ordre et des entreprises générales. Aucune demande de particulier.</p>
          </div>

          <div className="flex flex-col gap-3">
            <section aria-label="Rechercher des marchés" className="flex flex-col gap-4 rounded-[20px] border-2 border-[#C2410C] bg-[#142B4A] p-4 shadow-[0_12px_40px_rgba(0,0,0,.45)] md:p-6">
              <div role="tablist" aria-label="Mode de recherche" className="flex gap-1.5 rounded-xl bg-[#0A1628] p-1">
                <button type="button" role="tab" aria-selected={mode === 'company'} onClick={() => setMode('company')} className={tabCls(mode === 'company')}>Par entreprise</button>
                <button type="button" role="tab" aria-selected={mode === 'simple'} onClick={() => setMode('simple')} className={tabCls(mode === 'simple')}>Par métier</button>
              </div>
              <div hidden={mode !== 'company'}><CompanySearchForm ref={companyRef} /></div>
              {mode === 'simple' && <SimpleSearch />}
              <SavedBanner />
            </section>
            <p className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-center text-[13px] font-bold text-[#6EE7B7]">
              <span>✓ Gratuit</span><span>✓ Réservé aux entreprises</span><span>✓ Réponse immédiate</span>
            </p>
            <div className="flex items-center gap-3 px-1">
              <ElenaAvatar size={44} />
              <p className="text-[14px] text-[#B4C1D3]"><span className="font-bold text-[#F2F5F9]">{ELENA.name}</span>, {ELENA.role.toLowerCase()} · « Une question ? Je vous rappelle, de 9 h à 18 h. »{' '}
                <Link to="/question" className="font-bold text-[#FB923C] underline">Poser ma question</Link>
              </p>
            </div>
          </div>
        </section>

        {/* ===== 2. LA VIDÉO (témoignages), juste sous le moteur. ===== */}
        <div className="mt-10"><TestimonialsSection /></div>

        {/* ===== 3. COMPRENDRE, pour celui qui veut lire avant d'agir. Trois blocs courts, pas de cadres. ===== */}
        <div id="mdh-etapes" className="mx-auto mt-12 flex w-full max-w-[720px] scroll-mt-16 flex-col gap-12 px-4 md:px-6">
          <Block>
            <Eyebrow>Comment ça marche</Eyebrow>
            <h2 className="text-[22px] font-extrabold leading-tight">Trois étapes, en quelques minutes</h2>
            <ol className="mt-1 flex flex-col gap-2.5 md:flex-row">
              {[
                ['Indiquez votre entreprise', 'Son nom ou son SIRET : nous l’identifions dans les registres officiels.'],
                ['Comparez vos marchés', 'Chaque marché affiche son pourcentage de correspondance, analysé sur six critères.'],
                ['Recevez votre dossier et faites le point', 'Dossier prérempli à votre nom tout de suite, puis 30 minutes avec Elena pour voir si ce marché vaut le coup pour vous.'],
              ].map(([t, d], i) => (
                <li key={t} className="relative flex flex-1 gap-3.5 overflow-hidden rounded-2xl border border-[#22385A] bg-[#12233A] p-3.5 pl-4">
                  <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-[#F97316]" />
                  <b className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#C2410C] text-[20px] font-extrabold text-white">{i + 1}</b>
                  <div><h3 className="text-[16px] font-bold leading-tight">{t}</h3><p className="mt-1 text-[14px] leading-snug text-[#D6E0EC]">{d}</p></div>
                </li>
              ))}
            </ol>
          </Block>

          <Block>
            <Eyebrow>Ce que nous faisons avec vous</Eyebrow>
            <h2 className="text-[22px] font-extrabold leading-tight">Vous n’êtes pas seul face au dossier</h2>
            <ul className="mt-1 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {([
                ['🔎', 'Gratuit', 'La recherche et votre pourcentage', 'Tous les marchés de votre métier, classés pour votre entreprise.'],
                ['📄', 'Gratuit', 'Votre dossier prérempli, à votre nom', 'Téléchargé tout de suite, prêt à compléter.'],
                ['📞', 'Offert', '30 minutes avec notre équipe', 'Pour faire le point sur le marché et sur votre entreprise.'],
                ['🤝', 'Formule', 'Votre dossier porté avec vous', 'Candidature, mise en relation avec les donneurs d’ordre, négociation. Vous décidez après l’échange.'],
              ] as const).map(([ico, tag, t, d]) => (
                <li key={t} className="flex gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-3.5">
                  <span aria-hidden className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#1E3352] text-[22px]">{ico}</span>
                  <div>
                    <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-extrabold ${tag === 'Formule' ? 'bg-[#3A2312] text-[#FDBA74]' : 'bg-[#123B2A] text-[#6EE7B7]'}`}>{tag}</span>
                    <b className="block text-[16px] leading-tight">{t}</b><span className="text-[14px] leading-snug text-[#D6E0EC]">{d}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Block>

          {hasTeam && (
            <Block>
              <Eyebrow>Notre équipe</Eyebrow>
              <h2 className="text-[22px] font-extrabold leading-tight">De vraies personnes, du premier appel au dépôt</h2>
              <div className="mt-1 grid grid-cols-3 gap-2.5">
                {[{ name: ELENA.name, role: `${ELENA.role} · votre premier contact`, photo: ELENA.photo || '' }, ...TEAM.map(m => ({ name: m.name, role: m.role, photo: m.photo }))].map(m => (
                  <Link key={m.name} to={`/team-profile?member=${encodeURIComponent(m.name)}`} className="overflow-hidden rounded-2xl border border-[#22385A] bg-[#12233A]">
                    <img src={m.photo} alt={m.name} loading="lazy" className="aspect-[4/5] w-full object-cover object-top" />
                    <div className="p-2.5"><b className="block text-[14px] leading-tight">{m.name}</b><span className="mt-0.5 block text-[12px] leading-snug text-[#B4C1D3]">{m.role}</span></div>
                  </Link>
                ))}
              </div>
            </Block>
          )}

          {/* ===== LA CARTE (déplacée à l'ancienne place de la vidéo). ===== */}
          <section className="w-full">
            <Eyebrow>Ou explorez par zone</Eyebrow>
            <h2 className="mt-1 text-[22px] font-extrabold leading-tight md:text-[28px]">Les marchés près de chez vous</h2>
            <p className="mt-1 text-[15px] text-[#B4C1D3]">Touchez une région, un département ou une ville : les marchés ouverts s’affichent.</p>
            <DeferredMap />
            <OpenCounter />
          </section>

          <ChantiersBlock />

          {/* 7 nov. : guides et baromètre visibles dès l'accueil (avant : seulement dans le menu et le pied de page). */}
          <section className="w-full">
            <Eyebrow>Guides gratuits</Eyebrow>
            <h2 className="mt-1 text-[22px] font-extrabold leading-tight md:text-[28px]">Répondre aux marchés, pas à pas</h2>
            <p className="mt-1 text-[15px] text-[#B4C1D3]">Candidature, mémoire technique, seuils, avance, paiement : des guides vérifiés sur les textes officiels.</p>
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {GUIDE_CATALOG.filter(g => PUBLISHED_GUIDES.has(g.slug)).slice(0, 6).map(g => (
                <li key={g.slug}><Link to={`/guides/${g.slug}`} className="block rounded-[14px] border border-[#22385A] bg-[#12233A] p-3 text-[15px] font-bold text-[#F2F5F9] hover:border-[#FB923C]">{g.title}</Link></li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[14.5px] font-bold">
              <Link to="/guides" className="text-[#FB923C] underline">Tous les guides ({PUBLISHED_GUIDES.size})</Link>
              <Link to="/barometre-marches-publics" className="text-[#FB923C] underline">Baromètre des marchés publics</Link>
            </div>
          </section>

          <Faq />

          <section className="flex flex-col items-center gap-3 rounded-[20px] border-2 border-[#C2410C] bg-[#142B4A] p-5 text-center">
            <h2 className="text-[22px] font-extrabold leading-tight">Voyez les marchés qui vous correspondent</h2>
            <button type="button" onClick={focusCompany} className={BTN}>Indiquer mon entreprise</button>
            <button type="button" onClick={() => setCallbackOpen(true)} className="min-h-[48px] text-[15px] font-bold text-[#FB923C] underline">Vous préférez qu’on vous appelle ?</button>
          </section>
        </div>
      </main>
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}
