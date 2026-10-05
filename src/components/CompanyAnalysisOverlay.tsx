import { useEffect, useRef, useState } from 'react';
import { Check, Search } from 'lucide-react';

// 5 Oct client brief ("Petit ajout concernant le site"): once the visitor has
// searched for and selected his company (by name or SIRET), show this
// animation for three seconds, then go straight to the "Concordance" screen.
// Layout and wording follow the client's screen recording: a card with a
// search icon in an orange ring, the company name, "Analyse technique de votre
// entreprise en cours...", a rolling list of checks and a progress bar.
//
// Notes:
// - The match score is requested while this is on screen (the page effect
//   starts it as soon as the company is confirmed), so the concordance is
//   usually ready the moment the animation ends.
// - Purely a transition: it never blocks data and has a discreet "Passer" link.
// - Motion is switched off for visitors who ask for reduced motion (the three
//   seconds and the redirect stay).
// - The client's recording also shows a hard figure ("taux de réussite 68 %")
//   in one step. That is a statistic nobody computes for this visitor, so the
//   step is kept without the number.

export const ANALYSIS_STEPS = [
  'Vérification SIRENE / INSEE',
  'Indexation base BOAMP / JOUE',
  'Croisement RGE / Qualibat',
  'Scoring de compatibilité métier (IA)',
  'Analyse sémantique des critères techniques',
  'Analyse de solvabilité (scoring financier)',
  'Calcul de la probabilité d’attribution',
  'Extraction OCR du cahier des charges',
  'Comparables sectoriels — taux de réussite',
  'Détection marchés similaires remportés',
  'Historique marchés publics — 24 mois',
];

interface Props {
  companyName: string | null | undefined;
  onDone: () => void;
  durationMs?: number;
}

export function CompanyAnalysisOverlay({ companyName, onDone, durationMs = 3000 }: Props) {
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const redirect = window.setTimeout(finish, durationMs);
    const stepTimer = window.setInterval(() => {
      setStep(s => Math.min(s + 1, ANALYSIS_STEPS.length - 1));
    }, Math.max(120, Math.floor(durationMs / ANALYSIS_STEPS.length)));
    // Start the bar on the next frame so the CSS transition actually runs.
    const raf = window.requestAnimationFrame(() => setProgress(100));
    return () => {
      window.clearTimeout(redirect);
      window.clearInterval(stepTimer);
      window.cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMs]);

  const visible = ANALYSIS_STEPS.slice(Math.max(0, step - 2), step + 1);
  const name = (companyName || 'Votre entreprise').toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Analyse de votre entreprise en cours"
      className="fixed inset-0 z-[60] flex items-center justify-center px-5 bg-[#001326]/90 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#17334D] bg-[#0B2540] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full border-2 border-orange flex items-center justify-center motion-safe:animate-pulse">
          <Search size={24} className="text-orange" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-extrabold text-white tracking-wide leading-tight break-words">{name}</h2>
        <p className="text-sm text-[#B9BBC8] mt-1.5 mb-4" role="status" aria-live="polite">
          Analyse technique de votre entreprise en cours…
        </p>

        <ul className="rounded-xl border border-[#17334D] bg-[#061D32] text-left overflow-hidden mb-4 min-h-[112px]">
          {visible.map((label, i) => {
            const latest = i === visible.length - 1;
            return (
              <li
                key={label}
                className={`flex items-start gap-2 px-3 py-2 text-xs border-b border-[#17334D] last:border-0 transition-opacity ${latest ? 'text-white opacity-100' : 'text-[#B9BBC8] opacity-60'}`}
              >
                <Check size={13} className="text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{label}</span>
              </li>
            );
          })}
        </ul>

        <div className="h-1.5 rounded-full bg-[#17334D] overflow-hidden" aria-hidden="true">
          <div
            className="h-full bg-orange rounded-full motion-safe:transition-[width] ease-linear"
            style={{ width: `${progress}%`, transitionDuration: `${durationMs}ms` }}
          />
        </div>

        <button
          type="button"
          onClick={finish}
          className="mt-4 text-[11px] text-[#B9BBC8] underline underline-offset-2 hover:text-white"
        >
          Passer
        </button>
      </div>
    </div>
  );
}
