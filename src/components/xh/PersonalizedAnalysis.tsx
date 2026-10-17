import { useEffect, useRef, useState } from 'react';
import './xh.css';
import './xhPersonal.css';
import { xhEngine } from './xhEngine';
import { XH_MARKUP } from './xhMarkup';
import { CompanyAnalysisOverlay } from '@/components/CompanyAnalysisOverlay';

// Analysis shown after the visitor has selected his company (client brief 17 Oct, point 3):
//   SIRET or name entered -> company selected -> THIS animation -> concordance (automatic).
// It is the validated « Analyse croisée » animation of the home page (same markup, same engine, same motion), fed with
// the selected company and market instead of the fictional ones. Slower first seconds so the visitor recognises his
// company (SIRET, then name + « Entreprise retrouvée »), then the checks scroll quickly; ~11 s in total. The company
// name stays in the header of the analysis. No score is shown here (the result is the concordance screen), and
// nothing is invented: a market row without data is removed, never filled in.

export interface AnalysisCompany { name?: string | null; siret?: string | null; city?: string | null; postal?: string | null; activity?: string | null; ape?: string | null }
export interface AnalysisMarket { title?: string | null; city?: string | null; department?: string | null; value?: number | null; deadline?: string | null }

const fmtSiret = (s?: string | null) => {
  const d = (s || '').replace(/\D/g, '');
  return d.length === 14 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}` : (s || '').trim();
};

function deadlineText(deadline?: string | null): string | null {
  if (!deadline) return null;
  const t = new Date(deadline).getTime();
  if (Number.isNaN(t)) return null;
  const days = Math.ceil((t - Date.now()) / 86400000);
  if (days > 1) return `dans ${days} jours`;
  if (days === 1) return 'demain';
  if (days === 0) return "aujourd'hui";
  return new Date(t).toLocaleDateString('fr-FR');
}

/** Pure DOM step: turn the demo markup into the visitor's own analysis. Exported for tests. */
export function personalizeXh(host: HTMLElement, company: AnalysisCompany, market: AnalysisMarket): void {
  host.innerHTML = XH_MARKUP;
  const root = host.querySelector('.xh') as HTMLElement;
  const name = (company.name || 'Votre entreprise').trim();
  const siret = fmtSiret(company.siret);
  root.setAttribute('data-siret', siret);
  root.setAttribute('aria-label', `Analyse de ${name} pour le marché sélectionné`);
  const sr = root.querySelector('.xh-sr'); if (sr) sr.textContent = `Analyse en cours pour ${name}${market.title ? `, marché : ${market.title}` : ''}.`;
  const ex = root.querySelector('.xh-ex'); if (ex) ex.textContent = 'Votre analyse';
  const sim = root.querySelector('.xh-sim'); if (sim) sim.textContent = 'Analyse';
  const sv = root.querySelector('.xh-sv'); if (sv) sv.textContent = '';
  // Company recognised: label, real name, then place and activity when we have them.
  const found = root.querySelector('.xh-found');
  if (found) {
    const box = found.children[1] as HTMLElement;
    box.textContent = '';
    const lab = document.createElement('span'); lab.className = 'xh-rf'; lab.textContent = 'Entreprise retrouvée';
    const b = document.createElement('b'); b.textContent = name;
    box.append(lab, b, [company.city, company.activity || company.ape].filter(Boolean).join(' · '));
  }
  // The company name stays visible while the checks run.
  const osub = root.querySelector('.xh-osub');
  if (osub) { osub.textContent = name; if (siret) { const s = document.createElement('small'); s.textContent = `SIRET ${siret}`; osub.appendChild(s); } }
  // Market card: real values only, a row with no data is removed.
  const mt = root.querySelector('.xh-mt'); if (mt) mt.textContent = market.title || 'Marché sélectionné';
  const rows = Array.from(root.querySelectorAll('.xh-mm .xh-mr')) as HTMLElement[];
  const place = [market.city, market.department && `(${market.department})`].filter(Boolean).join(' ');
  const values = [place || null, market.value ? `${Number(market.value).toLocaleString('fr-FR')} €` : null, deadlineText(market.deadline), null];
  rows.forEach((row, i) => {
    const b = row.querySelector('b');
    if (!values[i] || !b) { row.remove(); return; }
    b.textContent = values[i] as string;
  });
}

interface Props {
  company: AnalysisCompany;
  market: AnalysisMarket;
  /** true once the concordance result is available (the page requests it while this plays). */
  ready?: boolean;
  onDone: () => void;
  /** Back to the fiche without going on to the result. */
  onCancel?: () => void;
}

const MAX_WAIT_AFTER_END_MS = 12000;

export function PersonalizedAnalysis({ company, market, ready = true, onDone, onCancel }: Props) {
  const reduce = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hostRef = useRef<HTMLDivElement>(null);
  const [ended, setEnded] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone); onDoneRef.current = onDone;
  const finish = () => { if (doneRef.current) return; doneRef.current = true; onDoneRef.current(); };

  useEffect(() => {
    if (reduce || !hostRef.current) return;
    personalizeXh(hostRef.current, company, market);
    const root = hostRef.current.querySelector('.xh') as HTMLElement;
    root.classList.add('xh-pers');
    hostRef.current.querySelector('.xh-cq')?.classList.add('xh-pers');
    const api = xhEngine(root, { loop: false, intro: 1.6, speed: 0.55, calcHold: 0.5, onResult: () => setEnded(true) });
    api.play();
    return () => api.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Automatic passage to the concordance once the sequence is over AND the result exists. If the real calculation is
  // late the visitor sees a true waiting state; after a safety delay we move on anyway (the concordance screen has its own
  // loading/error state).
  useEffect(() => { if (ended && ready) finish(); }, [ended, ready]);
  useEffect(() => {
    if (!ended || ready) return;
    const t = window.setTimeout(finish, MAX_WAIT_AFTER_END_MS);
    return () => window.clearTimeout(t);
  }, [ended, ready]);

  if (reduce) {
    // Reduced motion: the existing static, short version (no animated sequence).
    return <CompanyAnalysisOverlay companyName={company.name} subject={market.title} onDone={onDone} />;
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Analyse de votre entreprise en cours"
      className="fixed inset-0 z-[60] overflow-y-auto bg-[#001326]/95 backdrop-blur-sm"
      style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto w-full max-w-[640px] px-3">
        <div ref={hostRef} />
        {ended && !ready && <p className="xh-pers-status" role="status" aria-live="polite">Calcul de l’indice en cours…</p>}
        <div className="xh-pers-actions">
          <button type="button" className="xh-pers-go" disabled={!ready} onClick={finish}>Voir le résultat</button>
          {onCancel && <button type="button" className="xh-pers-back" onClick={onCancel}>Retour à la fiche</button>}
        </div>
      </div>
    </div>
  );
}
