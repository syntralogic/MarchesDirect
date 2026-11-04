import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import elenaPhoto from '@/assets/1.jpeg';
import { homeApi } from '@/lib/apiClient';
import { getSavedMarkets, type SavedMarket } from '@/lib/savedMarkets';

// Blocs de l'accueil « nouveau parcours » (maquette v26, écran 1 ; fonctionnalités détaillées §1.4 à 1.8).
// Textes repris tels quels de la maquette. Contenu statique, sauf le compteur (réel) et le bandeau « marché enregistré »
// (localStorage). Affichés seulement avec VITE_HOME_COMPANY_TAB=true, voir HomePage.

const wrap = 'px-4 md:px-6 py-5 md:py-8 max-w-3xl mx-auto w-full';
const card = 'rounded-2xl border border-[#17334D] bg-[#061D32] p-4 md:p-6';
const eyebrow = 'text-[11px] md:text-xs font-bold text-orange uppercase tracking-widest';
const h2 = 'text-xl md:text-2xl font-bold text-white mt-1 mb-3 leading-tight';

// ---- compteur « marchés ouverts aujourd'hui » : un seul appel par session, jamais de valeur en dur ----------------
let countPromise: Promise<number | null> | null = null;
function useOpenMarketsCount(): number | null {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    if (!countPromise) countPromise = homeApi.openMarketsCount().catch(() => null);
    countPromise.then(v => { if (alive) setN(v); });
    return () => { alive = false; };
  }, []);
  return n;
}

// ---- sous le moteur : Elena, compteur réel, marché enregistré ------------------------------------------------------
export function HeroExtras({ onQuestion }: { onQuestion: () => void }) {
  const navigate = useNavigate();
  const count = useOpenMarketsCount();
  const [saved, setSaved] = useState<SavedMarket[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { setSaved(getSavedMarkets()); }, []);

  const goSaved = () => {
    if (saved.length === 1) navigate(`/opportunites/${saved[0].id}`);
    else setOpen(v => !v);
  };

  return (
    <section className={`${wrap} !py-3`}>
      {saved.length > 0 && (
        <div className="mb-3 rounded-xl border border-green-400/30 bg-green-400/10 px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-green-200">
          <Check size={18} aria-hidden />
          <span>{saved.length === 1 ? '1 marché enregistré sur ce téléphone' : `${saved.length} marchés enregistrés sur ce téléphone`}</span>
          <button type="button" onClick={goSaved} aria-expanded={saved.length > 1 ? open : undefined} className="min-h-[48px] px-1 font-semibold text-white underline underline-offset-2">
            {saved.length === 1 ? 'Le retrouver' : 'Les retrouver'}
          </button>
          {open && saved.length > 1 && (
            <ul className="basis-full list-none m-0 p-0 grid gap-1">
              {saved.map(m => (
                <li key={m.id}><button type="button" onClick={() => navigate(`/opportunites/${m.id}`)} className="min-h-[48px] w-full text-left text-white underline underline-offset-2">{m.title || 'Marché enregistré'}</button></li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-start gap-3">
        <img src={elenaPhoto} alt="Elena Popescu" width={48} height={48} loading="lazy" className="w-12 h-12 rounded-full object-cover shrink-0 border border-[#17334D]" />
        <div className="text-[15px] leading-snug">
          <div className="text-white font-bold">Elena Popescu <span className="font-medium text-[#B9BBC8]">· Chargée de relation</span></div>
          <p className="m-0 text-[#B9BBC8]">
            « Une question avant de commencer ? Je vous rappelle, de 9 h à 18 h. »{' '}
            <button type="button" onClick={onQuestion} className="min-h-[48px] px-1 text-orange font-semibold underline underline-offset-2">Poser ma question</button>
          </p>
        </div>
      </div>

      {count !== null && (
        <p className="mt-3 text-center text-[15px] text-[#B9BBC8]">
          <strong className="text-orange text-lg">{count.toLocaleString('fr-FR')}</strong> marchés ouverts aujourd’hui en France <span className="text-[#8FA0B5]">· chiffre mis à jour chaque matin</span>
        </p>
      )}
    </section>
  );
}

// ---- « Trois étapes » ---------------------------------------------------------------------------------------------
export function HowItWorksBlock() {
  const steps = [
    ['Indiquez votre entreprise', 'Son nom ou son SIRET : nous l’identifions dans les registres officiels.'],
    ['Comparez vos marchés', 'Chaque marché affiche son pourcentage de correspondance avec votre entreprise, analysé sur six critères.'],
    ['Obtenez votre dossier prérempli', 'À votre nom, prêt tout de suite. Puis notre équipe vous rappelle pour préparer la suite avec vous.'],
  ];
  return (
    <section className={wrap}>
      <span className={eyebrow}>Comment ça marche</span>
      <h2 className={h2}>Trois étapes, en quelques minutes</h2>
      <ol className={`${card} list-none m-0 grid gap-4`}>
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <b className="w-9 h-9 shrink-0 rounded-full bg-orange text-white flex items-center justify-center text-base">{i + 1}</b>
            <div><h3 className="text-base font-bold text-white m-0">{t}</h3><p className="m-0 text-[15px] text-[#B9BBC8]">{d}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ---- « Six critères » ---------------------------------------------------------------------------------------------
export function SixCriteriaBlock() {
  const items = [
    ['Activité', 'Vos métiers face aux prestations demandées.'],
    ['Zone', 'Le lieu d’exécution face à votre secteur.'],
    ['Calendrier', 'Date limite, démarrage, durée.'],
    ['Moyens', 'Équipe et matériel nécessaires.'],
    ['Références', 'Chantiers similaires à présenter.'],
    ['Qualifications', 'Certifications, assurances, labels exigés.'],
  ];
  return (
    <section className={wrap}>
      <span className={eyebrow}>Le moteur de correspondance</span>
      <h2 className={h2}>Six critères analysés sur chaque marché</h2>
      <p className="m-0 mb-3 text-[15px] text-[#B9BBC8]">Ce que demande l’acheteur, face à ce que nous savons de votre entreprise.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(([t, d]) => (
          <div key={t} className={`${card} !p-4`}><h3 className="text-base font-bold text-white m-0">{t}</h3><p className="m-0 text-[15px] text-[#B9BBC8]">{d}</p></div>
        ))}
      </div>
    </section>
  );
}

// ---- « Vous n'êtes pas seul face au dossier » -----------------------------------------------------------------------
export function NotAloneBlock() {
  const rows: [string, string][] = [
    ['Gratuit :', ' la recherche, le pourcentage par marché et votre dossier prérempli à votre nom.'],
    ['Un premier échange offert de 30 minutes', ' pour faire le point sur le marché et sur votre entreprise.'],
    ['Si vous le souhaitez, nous préparons la candidature avec vous :', ' formulaires, mémoire technique, dépôt. Sur devis, après l’échange.'],
  ];
  return (
    <section className={wrap}>
      <span className={eyebrow}>Ce que nous faisons avec vous</span>
      <h2 className={h2}>Vous n’êtes pas seul face au dossier</h2>
      <div className={`${card} grid gap-3`}>
        {rows.map(([b, t]) => (
          <div key={b} className="flex gap-3 text-[15px] text-[#DCE3EC]"><Check size={20} className="shrink-0 text-green-400 mt-0.5" aria-hidden /><span><strong className="text-white">{b}</strong>{t}</span></div>
        ))}
      </div>
    </section>
  );
}

// ---- « Vos questions » (4) -------------------------------------------------------------------------------------------
export function HomeFaq4() {
  const qa = [
    ['Qu’est-ce qui est gratuit ?', 'La recherche, le pourcentage par marché, le premier échange de 30 minutes et votre dossier prérempli. L’accompagnement à la candidature (mémoire technique, formulaires, dépôt) est sur devis, présenté lors de cet échange. Vous décidez ensuite.'],
    ['Je ne connais pas les marchés publics. C’est pour moi ?', 'Oui. La plupart des entreprises que nous accompagnons répondent pour la première fois. Nous expliquons chaque étape et nous préparons les pièces avec vous.'],
    ['Que fait Marchés Direct à ma place ?', 'La recherche des marchés, le pourcentage de correspondance, le dossier prérempli et, si vous le souhaitez, les formulaires de candidature, le mémoire technique et le dépôt. Vous fournissez vos références et vos pièces, vous validez.'],
    ['Mes informations restent-elles confidentielles ?', 'Oui. Vos coordonnées servent à préparer votre dossier et à vous appeler au sujet de vos marchés. Vous pouvez demander à ne plus être appelé à tout moment.'],
  ];
  return (
    <section className={wrap}>
      <h2 className={h2}>Vos questions</h2>
      <div className="grid gap-2">
        {qa.map(([q, a]) => (
          <details key={q} className={`${card} !p-0`}>
            <summary className="cursor-pointer min-h-[48px] px-4 py-3 text-base font-semibold text-white flex items-center">{q}</summary>
            <p className="m-0 px-4 pb-4 text-[15px] text-[#B9BBC8]">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ---- chargement différé : le contenu n'est monté (et ses données chargées) qu'à l'approche de l'écran ------------------
export function LazyOnView({ children, minHeight = 320 }: { children: ReactNode; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || on) return;
    if (typeof IntersectionObserver === 'undefined') { setOn(true); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: '400px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [on]);
  return <div ref={ref} style={on ? undefined : { minHeight }}>{on ? children : null}</div>;
}

// ---- dernier appel -------------------------------------------------------------------------------------------------
export function BottomCta({ onCallback }: { onCallback: () => void }) {
  return (
    <section className={wrap}>
      <div className={`${card} text-center`}>
        <h2 className="text-xl md:text-2xl font-bold text-white m-0 mb-3">Voyez les marchés qui vous correspondent</h2>
        <button type="button" onClick={() => window.dispatchEvent(new Event('md:show-company'))} className="w-full min-h-[56px] rounded-xl bg-orange text-white font-semibold text-base">
          Indiquer mon entreprise
        </button>
        <button type="button" onClick={onCallback} className="mt-2 min-h-[48px] px-2 text-[15px] text-orange font-semibold underline underline-offset-2">
          Vous préférez qu’on vous appelle ?
        </button>
      </div>
    </section>
  );
}
