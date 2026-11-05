// Écran 3 de la refonte (maquette v26): fiche marché + analyse sur place, en un seul écran.
// Pas d'appel IA à l'ouverture: le pourcentage vient du moteur de règles existant (match-score).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  opportunitiesApi, siretApi, crmApi, getApiErrorMessage,
  type ApiOpportunityDetail, type ApiMatchScore, type ApiSiretCandidate, type ApiSiretStatus,
} from '@/lib/apiClient';
import { getSessionId, trackVisitorEvent, trackRequestSubmitted, getConsultationIndicator, getDossierRequestsCount } from '@/lib/visitorTracking';
import { getAnalyticsConsent } from '@/lib/consent';
import { formatDeadlineExact } from '@/lib/deadlineFormat';
import { useBrand } from '@/hooks/use-brand';
import { useIdempotency } from '@/lib/useIdempotency';
import { normalizeFrPhoneDigits } from '@/lib/utils';
import { loadCoords, MOMENT_API, saveCoords, validateCoords, leadMessage, pdfFileName, type CoordChoice, type CoordErrors, type CoordValues } from '@/lib/coordonnees';
import CoordonneesScreen from '@/components/fiche/CoordonneesScreen';
import ConfirmationScreen, { type PdfState } from '@/components/fiche/ConfirmationScreen';
import { AppointmentModal } from '@/components/AppointmentModal';
import {
  QUESTIONS, CRITERIA_ORDER, STATUS_TEXT, answersToParam, buildAdvice, criterionStatus, daysLeft,
  scoreLabel, scoreTone, shortTitle, summaryFor, type CriterionStatus, type FicheAnswers,
} from '@/lib/ficheAdvice';

const TYPE_LABEL: Record<string, string> = { public_procurement: 'MARCHÉ PUBLIC', subcontracting: 'SOUS-TRAITANCE', tender: 'APPEL D’OFFRES PRIVÉ' };
const TONE_COLOR = { hi: '#34D399', mid: '#FDBA74', lo: '#6B7A90' } as const;
const STATUS_CLASS: Record<CriterionStatus, string> = { ok: 'text-[#6EE7B7]', tbc: 'text-[#FDBA74]', no: 'text-[#FCA5A5]', unknown: 'text-[#FDBA74]' };
const SAVED_KEY = 'md_saved_markets';
const INVITE_KEY = 'md_invite30_shown';

type View = { kind: 'fiche' } | { kind: 'coords' | 'done'; choice: CoordChoice };

const money = (v: number | null | undefined, cur?: string | null) =>
  v ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur || 'EUR', maximumFractionDigits: 0 }).format(v) : 'Non communiqué';

function Details({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-[#22385A] bg-[#12233A]">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
        {title}<span className="text-[22px] font-semibold text-[#FB923C] group-open:hidden">+</span><span className="hidden text-[22px] font-semibold text-[#FB923C] group-open:inline">–</span>
      </summary>
      <div className="px-4 pb-4 text-[15px] text-[#D6E0EC]">{children}</div>
    </details>
  );
}

// Elena's photo is supplied by the client: drop it at public/team/elena.jpg and it appears. Until then, initials (never a stock photo).
function ElenaPhoto() {
  const [ok, setOk] = useState(true);
  return ok
    ? <img src="/team/elena.jpg" alt="Elena Popescu" width={48} height={48} onError={() => setOk(false)} className="h-12 w-12 shrink-0 rounded-full object-cover" />
    : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#22385A] text-[13px] font-bold text-[#D6E0EC]" aria-hidden>EP</div>;
}

export default function FicheMarchePage() {
  const { id = '' } = useParams<{ id: string }>();
  const sessionId = useMemo(() => getSessionId(), []);

  const [opp, setOpp] = useState<ApiOpportunityDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [status, setStatus] = useState<ApiSiretStatus | null>(null);
  const [score, setScore] = useState<ApiMatchScore | null>(null);
  const [answers, setAnswers] = useState<FicheAnswers>({});
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ApiSiretCandidate[]>([]);
  const [editing, setEditing] = useState(false);
  const [consult, setConsult] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [mainVisible, setMainVisible] = useState(false);
  const [fieldActive, setFieldActive] = useState(false);
  const [invite, setInvite] = useState(false);
  const mainBtn = useRef<HTMLButtonElement>(null);
  const acted = useRef(false);
  const shownFor = useRef('');

  // --- screens 4 and 5 (first half): DOSSIER / RAPPEL / QUESTION; the page keeps what was typed when going back ---
  const [view, setView] = useState<View>(() => (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('alerte') === '1' ? { kind: 'coords', choice: 'alerte' } : { kind: 'fiche' }));  // ?alerte=1 : entry point for the alert (the ranked list links here)
  const [coords, setCoords] = useState<CoordValues>(() => loadCoords());
  const [coordErrors, setCoordErrors] = useState<CoordErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pdf, setPdf] = useState<PdfState>('loading');
  const pdfBlob = useRef<Blob | null>(null);
  const idem = useIdempotency();
  const { brandId } = useBrand();

  const known = !!status?.companyKnown && !editing;
  const company = status?.company?.name || '';

  // The phone's back button leaves the form / confirmation and returns to the fiche (state kept in this page).
  useEffect(() => {
    const onPop = () => setView((v) => (v.kind === 'fiche' ? v : { kind: 'fiche' }));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // The prefilled dossier is fetched as soon as the confirmation shows: the button exists only for a real file.
  useEffect(() => {
    if (view.kind !== 'done') return;
    if (view.choice !== 'dossier' && !status?.leadCaptured) { setPdf('unavailable'); return; }
    let live = true; setPdf('loading'); pdfBlob.current = null;
    siretApi.downloadPrefilledDossier(sessionId, id)
      .then((b) => { if (!live) return; if (b && b.size > 0) { pdfBlob.current = b; setPdf('ready'); } else setPdf('unavailable'); })
      .catch(() => { if (live) setPdf('unavailable'); });
    return () => { live = false; };
  }, [view, sessionId, id, status?.leadCaptured]);

  // --- load market + company status (no AI) ---
  useEffect(() => {
    let live = true;
    setOpp(null); setLoadError(false); setScore(null); setAnswers({}); setEditing(false);
    opportunitiesApi.getById(id).then(o => { if (live) setOpp(o); }).catch(() => live && setLoadError(true));
    siretApi.status(sessionId).then(s => { if (live) setStatus(s); }).catch(() => {});
    getConsultationIndicator(id).then(v => { if (live) setConsult(v && (v.value ?? 2) >= 2 ? v.label : null); });
    getDossierRequestsCount(id).then(n => { if (live) setDossiers(n); });
    try { setSaved((JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') as { id: string }[]).some(s => s.id === id)); } catch { setSaved(false); }
    return () => { live = false; };
  }, [id, sessionId]);

  useEffect(() => { if (opp) trackVisitorEvent('offer_view', 'Fiche marché ouverte', undefined, { opportunityId: id, journey: opp.journey }); }, [opp, id]);

  // --- score from the real engine; re-run with the visitor's answers ---
  const loadScore = useCallback(async (a: FicheAnswers) => {
    try {
      const s = await opportunitiesApi.getMatchScore(id, sessionId, answersToParam(a) || undefined);
      setScore(s);
      return s;
    } catch { setScore(null); return null; }
  }, [id, sessionId]);

  useEffect(() => { if (known && opp) { void loadScore(answers); } }, [known, opp]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!known || !score || score.score == null || shownFor.current === id + answersToParam(answers)) return;
    shownFor.current = id + answersToParam(answers);
    trackVisitorEvent('concordance_shown', 'Concordance affichée', undefined, { opportunityId: id, siret: status?.siret, answers: answersToParam(answers) });
  }, [known, score, answers, id, status?.siret]);

  const submitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) { setFormError('Indiquez le nom de votre entreprise ou votre SIRET.'); return; }
    setSearching(true); setFormError(null); setCandidates([]);
    trackVisitorEvent('analysis_started', 'Analyse lancée', undefined, { opportunityId: id });
    try {
      const s = await siretApi.lookup(q, sessionId);
      if (s.companyKnown) afterKnown(s);
      else if (s.candidates?.length) setCandidates(s.candidates);
      else setFormError('Nous ne trouvons pas cette entreprise. Vérifiez le nom ou saisissez les 14 chiffres du SIRET.');
    } catch { setFormError('La recherche n’a pas abouti. Réessayez dans un instant.'); }
    finally { setSearching(false); }
  };
  const pick = async (c: ApiSiretCandidate) => {
    setSearching(true); setFormError(null);
    try { afterKnown(await siretApi.confirm(c.siret, sessionId)); }
    catch { setFormError('Cette entreprise n’a pas pu être confirmée. Réessayez.'); }
    finally { setSearching(false); }
  };
  const afterKnown = (s: ApiSiretStatus) => {
    setStatus(s); setEditing(false); setCandidates([]); setAnswers({});
    trackVisitorEvent('company_selected', 'Entreprise sélectionnée', undefined, { opportunityId: id, siret: s.siret });
  };

  const answer = async (key: keyof FicheAnswers, v: 0 | 1) => {
    const next = { ...answers, [key]: v };
    setAnswers(next);
    const s = await loadScore(next);
    if (s && Object.keys(next).length === 4) trackVisitorEvent('analysis_completed', 'Analyse terminée', undefined, { opportunityId: id, siret: status?.siret });
  };

  // --- derived view ---
  const city = opp?.location_city || '';
  const dept = opp?.location_department ? ` (${opp.location_department})` : '';
  const days = daysLeft(opp?.deadline);
  const deadlineTxt = formatDeadlineExact(opp?.deadline) || 'Non précisée';
  const title = opp ? shortTitle(opp.title, city) : '';
  const crit = (k: string) => score?.matchCriteria?.find(c => c.key === k);
  const sc = score?.score ?? null;
  const advice = known && sc != null && opp ? buildAdvice({
    score: sc, activity: (crit('metier')?.status ?? 'confirm') as 'match' | 'confirm' | 'mismatch',
    nature: opp.trade_name ? `de ${opp.trade_name.toLowerCase()}` : `« ${title.replace(/\s+—\s+[^—]+$/, '')} »`,
    city, company: company || 'votre entreprise', answers,
  }) : null;

  // --- choices: no network call and no event here, the request itself fires events once saved ---
  const choose = (c: 'dossier' | 'rappel' | 'rdv' | 'info' | 'alerte') => {
    acted.current = true; setInvite(false);
    if (c === 'rdv') { setApptOpen(true); return; }      // RENDEZ-VOUS and ALERTE are the second half of screens 4 and 5
    const choice: CoordChoice = c === 'rappel' ? 'rappel' : c === 'info' ? 'info' : c === 'alerte' ? 'alerte' : 'dossier';
    setSubmitError(null); setCoordErrors({});
    window.history.pushState({ md: 'coords' }, '');
    setView({ kind: 'coords', choice });
    window.scrollTo({ top: 0 });
  };

  // One submit for the three forms. The request is confirmed only once the server says it was really saved.
  const submitCoords = async (choice: CoordChoice) => {
    const errs = validateCoords(choice, coords);
    setCoordErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!idem.begin()) return;                    // double tap: one request
    setSubmitting(true); setSubmitError(null);
    try {
      const phone = normalizeFrPhoneDigits(coords.phone);
      const requestId = idem.key();
      if (choice === 'dossier') {
        await siretApi.captureLead(phone, coords.email.trim() || undefined, sessionId, id);
        trackRequestSubmitted('dossier_request', { requestId });
      } else if (choice === 'alerte') {
        // The alert is about FUTURE markets: no market is linked to the request, only the company, trade and zone.
        if (!brandId) throw new Error('Impossible de contacter le serveur, réessayez.');
        const scope = [opp?.trade_name, city ? `${city} et alentours` : ''].filter(Boolean).join(' · ');
        await crmApi.submitLead({
          brandId, phone, companyName: company || undefined, industryTrade: opp?.trade_name || undefined, locationCity: city || undefined,
          sessionId, idempotencyKey: requestId, leadSource: 'alert_signup', message: leadMessage(choice, coords, scope),
        });
        trackRequestSubmitted('alert', { requestId });
      } else {
        if (!brandId) throw new Error('Impossible de contacter le serveur, réessayez.');
        await crmApi.submitLead({
          brandId, phone, companyName: company || undefined, opportunityId: id, sessionId, idempotencyKey: requestId,
          leadSource: choice === 'rappel' ? 'callback_modal' : 'contact_form', message: leadMessage(choice, coords),
          ...(choice === 'rappel' && coords.moment ? { callbackMoment: MOMENT_API[coords.moment] } : {}),
          ...(choice === 'info' ? { visitorChoice: 'info' as const } : {}),
        });
        trackRequestSubmitted(choice === 'rappel' ? 'callback' : 'contact', { requestId });
      }
      idem.reset(); saveCoords(coords);
      window.history.replaceState({ md: 'done' }, '');
      setView({ kind: 'done', choice });
      window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(`${getApiErrorMessage(err, 'Échec de l’envoi.')} Vous pouvez réessayer.`);
    } finally { idem.end(); setSubmitting(false); }
  };

  const downloadPdf = () => {
    const blob = pdfBlob.current; if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = pdfFileName(company, opp?.source_reference); document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // --- save on this phone (3.10): localStorage only, no network ---
  const toggleSave = () => {
    try {
      const list = (JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') as { id: string; siret?: string }[]).filter(s => s.id !== id);
      if (!saved) list.push({ id, siret: status?.siret });
      localStorage.setItem(SAVED_KEY, JSON.stringify(list));
      setSaved(!saved);
    } catch { /* storage unavailable: nothing to save, nothing to claim */ }
  };

  // --- fixed bar (3.11): hidden while the main button is on screen or a field is being typed in ---
  useEffect(() => {
    const el = mainBtn.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setMainVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el); return () => io.disconnect();
  }, [known, score]);
  useEffect(() => {
    const on = (e: Event) => setFieldActive((e.target as HTMLElement)?.tagName === 'INPUT');
    const off = () => setFieldActive(false);
    document.addEventListener('focusin', on); document.addEventListener('focusout', off);
    return () => { document.removeEventListener('focusin', on); document.removeEventListener('focusout', off); };
  }, []);

  // --- "30 minutes offertes" invitation (3.12): once per visit, never after a choice, never mid-typing ---
  const openInvite = useCallback(() => {
    if (acted.current) return;
    try { if (sessionStorage.getItem(INVITE_KEY)) return; } catch { return; }
    // Not while the visitor is typing, and not on top of the cookie banner (they have not answered it yet).
    if (document.activeElement?.tagName === 'INPUT' || getAnalyticsConsent() === null) { window.setTimeout(openInvite, 15000); return; }
    try { sessionStorage.setItem(INVITE_KEY, '1'); } catch { return; }
    setInvite(true);
    trackVisitorEvent('invitation_30min_shown', 'Invitation 30 minutes affichée', undefined, { opportunityId: id });
  }, [id]);
  const hasScore = known && sc != null;
  useEffect(() => {
    if (!hasScore) return;
    const t = window.setTimeout(openInvite, 40000);
    return () => window.clearTimeout(t);
  }, [hasScore, openInvite]);
  useEffect(() => {
    if (!hasScore) return;
    window.addEventListener('popstate', openInvite);
    return () => window.removeEventListener('popstate', openInvite);
  }, [hasScore, openInvite]);
  const closeInvite = () => { setInvite(false); trackVisitorEvent('invitation_30min_closed', 'Invitation fermée', undefined, { opportunityId: id }); };

  if (loadError) return <main className="mx-auto max-w-[560px] px-4 py-16 text-center text-[#F2F5F9]"><p>Ce marché n’est plus disponible.</p><Link to="/recherche" className="mt-4 inline-block text-[#FB923C] underline">‹ Voir les marchés</Link></main>;
  if (!opp) return <main className="mx-auto max-w-[560px] px-4 py-10" aria-busy="true"><div className="h-8 w-2/3 animate-pulse rounded bg-[#12233A]" /><div className="mt-6 h-40 animate-pulse rounded-2xl bg-[#12233A]" /></main>;

  const tone = sc != null ? scoreTone(sc) : 'mid';
  const sections = opp.ai_analysis_sections;
  if (view.kind !== 'fiche') {
    const context = view.choice === 'alerte'
      ? [company, opp.trade_name, city ? `${city} et alentours` : ''].filter(Boolean).join(' · ')
      : [company, title, `réponse avant le ${deadlineTxt}`].filter(Boolean).join(' · ');
    const back = () => { setView({ kind: 'fiche' }); window.scrollTo({ top: 0 }); };
    return (
      <main className="mx-auto flex w-full max-w-[560px] flex-col gap-6 bg-[#0A1628] px-4 pb-10 pt-3 text-[#F2F5F9]" style={{ fontFamily: '"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif' }}>
        {view.kind === 'coords' ? (
          <CoordonneesScreen choice={view.choice} context={context} values={coords} errors={coordErrors} submitting={submitting} submitError={submitError}
            onChange={(patch) => { setCoords((c) => ({ ...c, ...patch })); setCoordErrors({}); }} onSubmit={() => submitCoords(view.choice)} onBack={back} elenaPhoto={<ElenaPhoto />} />
        ) : (
          <ConfirmationScreen choice={view.choice} values={coords} company={status?.company} pdf={pdf} onDownload={downloadPdf} onAppointment={() => setApptOpen(true)} onBackToMarket={back} elenaPhoto={<ElenaPhoto />}
            market={{ shortTitle: title, reference: opp.source_reference || null, deadline: (opp.deadline as string | null) || null, deadlineText: deadlineTxt, daysLeft: days, officialUrl: opp.official_url || null }} />
        )}
        <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} opportunityId={opp.id}
          marketLabel={[opp.title, opp.source_reference].filter(Boolean).join(' · ')} deadline={opp.deadline} />
      </main>
    );
  }

  const btnMain = 'flex min-h-[54px] w-full items-center justify-center rounded-[14px] bg-[#C2410C] px-4 py-2 text-center text-[17px] font-extrabold text-white';
  const choiceBase = 'flex min-h-[64px] w-full flex-col items-start justify-center gap-0.5 rounded-[14px] border px-4 py-2 text-left';

  const companyForm = (sticky = false) => (
    <form onSubmit={submitCompany} className={sticky ? 'flex gap-2' : 'flex flex-col gap-3 rounded-2xl bg-[#1C2433] p-4 ring-1 ring-[#C2410C]'}>
      {!sticky && <><h2 className="text-[20px] font-extrabold text-white">Ce marché est-il pour vous ?</h2>
        <p className="text-[14px] text-[#FFE9DC]">Entrez le nom de votre entreprise ou votre SIRET. Résultat immédiat, analysé sur six critères.</p>
        <label htmlFor="siret2" className="text-[14px] font-semibold">Nom de votre entreprise ou SIRET</label></>}
      <input id={sticky ? 'siret3' : 'siret2'} value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex. : 929 393 072 00012" autoComplete="organization" enterKeyHint="go"
        aria-label="Nom de votre entreprise ou SIRET" className="h-[52px] w-full rounded-xl border border-[#2B4468] bg-[#0A1628] px-3.5 text-[16px] text-[#F2F5F9]" />
      <button type="submit" disabled={searching} className={sticky ? 'min-h-[52px] shrink-0 rounded-[14px] bg-[#C2410C] px-4 font-extrabold text-white' : btnMain}>
        {searching ? 'Recherche…' : sticky ? 'Voir mon %' : 'Voir si ce marché me correspond'}
      </button>
      {!sticky && <div className="text-center text-[13px] text-[#B4C1D3]">Gratuit · Sans inscription · Résultat immédiat</div>}
    </form>
  );

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-6 bg-[#0A1628] px-4 pb-32 pt-3 text-[#F2F5F9]" style={{ fontFamily: '"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif' }}>
      <nav aria-label="Étapes" className="flex flex-col gap-3">
        <Link to="/recherche" className="flex min-h-[44px] items-center gap-1.5 text-[15px] text-[#B4C1D3]">‹ Vos marchés</Link>
        <ol className="flex text-center text-[13px]">
          {['Vos marchés', 'Mon analyse', 'Mon dossier'].map((s, i) => (
            <li key={s} className={`flex flex-1 flex-col items-center gap-1.5 ${i === 1 ? 'font-bold text-[#FB923C]' : i === 0 ? 'text-[#6EE7B7]' : 'text-[#B4C1D3]'}`} aria-current={i === 1 ? 'step' : undefined}>
              <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 text-[14px] font-extrabold ${i === 1 ? 'border-[#C2410C] bg-[#C2410C] text-white' : i === 0 ? 'border-[#34D399]' : 'border-[#2B4468]'}`}>{i + 1}</span>{s}
            </li>))}
        </ol>
      </nav>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 text-[12px] font-bold">
          <span className="rounded-full bg-[#3A2312] px-2.5 py-1 text-[#FDBA74]">{TYPE_LABEL[opp.journey] || 'MARCHÉ'}</span>
          <span className="rounded-full bg-[#1E3352] px-2.5 py-1 font-semibold text-[#D6E0EC]">{city}{dept}</span>
          <span className={`rounded-full bg-[#1E3352] px-2.5 py-1 font-semibold ${days != null && days <= 7 ? 'text-[#FDBA74]' : 'text-[#D6E0EC]'}`}>Réponse avant le {deadlineTxt}{days != null && days >= 0 ? ` · J-${days}` : ''}</span>
        </div>
        <h1 className="text-[23px] font-extrabold leading-tight">{title}</h1>
        {consult && <p className="flex items-center gap-2 text-[14px] text-[#D6E0EC]"><span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" aria-hidden />{consult}</p>}
      </section>

      {!known && (<>
        {companyForm()}
        {formError && <p role="alert" className="text-[14px] text-[#FCA5A5]">{formError}</p>}
        {candidates.length > 0 && (
          <ul className="flex flex-col gap-2" aria-label="Entreprises trouvées">
            <li className="text-[14px] text-[#B4C1D3]">Plusieurs entreprises correspondent. Choisissez la vôtre :</li>
            {candidates.map(c => (
              <li key={c.siret}><button type="button" onClick={() => pick(c)} className="min-h-[56px] w-full rounded-xl border border-[#2B4468] bg-[#12233A] px-3.5 py-2 text-left">
                <b className="block text-[15px]">{c.name}</b><span className="text-[13px] text-[#B4C1D3]">{[c.postal, c.city].filter(Boolean).join(' ')} · SIRET {c.siret}</span></button></li>))}
          </ul>)}
      </>)}

      {known && (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-4">
            {sc != null ? (
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 120 120" className="h-[104px] w-[104px] shrink-0" role="img" aria-label={`Correspondance ${sc} %`}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#1E3352" strokeWidth="12" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke={TONE_COLOR[tone]} strokeWidth="12" strokeLinecap="round" strokeDasharray="314.2" strokeDashoffset={314.2 * (1 - sc / 100)} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset .4s' }} />
                  <text x="60" y="68" textAnchor="middle" fontSize="26" fontWeight="800" fill="#F2F5F9">{sc} %</text>
                </svg>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="text-[19px] font-extrabold">Ce marché vous correspond à {sc} %</h2>
                  <span className="w-fit rounded-full px-2.5 py-1 text-[13px] font-bold" style={{ background: tone === 'hi' ? '#123B2A' : tone === 'mid' ? '#3A2312' : '#1E3352', color: tone === 'hi' ? '#6EE7B7' : tone === 'mid' ? '#FDBA74' : '#D6E0EC' }}>{scoreLabel(sc)}</span>
                  <span className="text-[13px] text-[#B4C1D3]">Correspondance estimée · à préciser avec vos réponses</span>
                </div>
              </div>
            ) : score ? (
              <div className="flex flex-col gap-1.5"><h2 className="text-[19px] font-extrabold">Correspondance à confirmer</h2>
                <p className="text-[14px] text-[#D6E0EC]">Nous ne savons pas encore comparer votre entreprise à ce marché. Répondez aux 4 questions ci-dessous : aucun pourcentage n’est inventé.</p></div>
            ) : <div className="h-24 animate-pulse rounded-xl bg-[#0F1F35]" aria-busy="true" />}
            {sc != null && <p className="text-[14px] text-[#D6E0EC]">{summaryFor(sc)}</p>}
            <div className="flex items-center gap-2 rounded-xl bg-[#123B2A] px-3 py-2 text-[13px] text-[#6EE7B7]">
              <span aria-hidden>✓</span><span className="min-w-0 flex-1">{['Pour ' + company, status?.company?.activity && status.company.activity.length <= 40 ? status.company.activity : null, status?.company?.city ? `${status.company.city}${status.company.postal ? ` (${status.company.postal.slice(0, 2)})` : ''}` : null].filter(Boolean).join(' · ')}</span>
              <button type="button" onClick={() => { setEditing(true); setQuery(company); }} className="min-h-[44px] min-w-[44px] font-bold underline">Modifier</button>
            </div>
            <p className="text-[13px] text-[#B4C1D3]">Pourcentage de correspondance calculé à partir des informations publiques de votre entreprise. Il ne mesure pas vos chances de gagner. Répondez aux 4 questions ci-dessous pour l’affiner.</p>
          </section>

          {advice && (
            <section className="flex flex-col gap-3 rounded-2xl border-l-4 border-[#C2410C] bg-[#1C2433] p-4" aria-label="Votre conseil personnalisé">
              <div className="flex items-center gap-3">
                <ElenaPhoto />
                <div className="flex flex-col"><b>Votre conseil personnalisé</b><span className="text-[13px] text-[#B4C1D3]">Elena Popescu · Chargée de relation</span></div>
              </div>
              <p className="text-[15px]">{advice.text}</p>
              {advice.suggestBetter && <Link to="/recherche" className="text-[14px] font-semibold text-[#FB923C]">Voir les marchés qui me correspondent mieux ›</Link>}
              <p className="text-[12px] text-[#B4C1D3]">Synthèse automatique, à confirmer avec Elena.</p>
            </section>)}

          <section className="flex flex-col gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-4">
            <h3 className="text-[17px] font-extrabold">Analysé sur six critères</h3>
            {score ? CRITERIA_ORDER.map(({ key, label }) => {
              const c = crit(key); const st = criterionStatus(c);
              return (<div key={key} className="flex flex-col gap-0.5 border-t border-[#22385A] pt-3 first:border-0 first:pt-0">
                <div className="flex justify-between gap-3"><b className="text-[15px]">{label}</b><span className={`text-[13px] font-bold ${STATUS_CLASS[st]}`}>{STATUS_TEXT[st]}</span></div>
                {c?.detail && <p className="text-[14px] text-[#D6E0EC]">{c.detail}</p>}</div>);
            }) : <div className="h-32 animate-pulse rounded-xl bg-[#0F1F35]" aria-busy="true" />}
            <details className="group">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 text-[14px] font-semibold text-[#FB923C] [&::-webkit-details-marker]:hidden">Affiner mon pourcentage · 4 questions · 1 minute</summary>
              <div className="flex flex-col gap-3 pt-2">
                {QUESTIONS.map(q => (
                  <div key={q.key} className="flex flex-col gap-2 text-[15px]">
                    <span>{q.text}</span>
                    <div className="flex gap-2" role="group" aria-label={q.text}>
                      {([1, 0] as const).map(v => (
                        <button key={v} type="button" aria-pressed={answers[q.key] === v} onClick={() => answer(q.key, v)}
                          className={`min-h-[48px] flex-1 rounded-xl border px-3 font-bold ${answers[q.key] === v ? 'border-[#FB923C] bg-[#3A2312] text-[#FDBA74]' : 'border-[#2B4468]'}`}>{v ? 'Oui' : 'Non'}</button>))}
                    </div>
                  </div>))}
                <p className="text-[13px] text-[#B4C1D3]">Le pourcentage se met à jour à chaque réponse. Une information que nous n’avons pas n’est jamais comptée comme acquise, ni contre vous.</p>
              </div>
            </details>
          </section>

          <div className="flex flex-col text-[14px] text-[#B4C1D3]"><span>Une question avant de choisir ?</span><button type="button" onClick={() => choose('info')} className="min-h-[44px] self-start text-left font-semibold text-[#FB923C] underline">Demandez à Elena, elle vous rappelle dans l’heure ›</button></div>

          <section className="flex flex-col gap-3">
            <h2 className="text-[20px] font-extrabold">Que voulez-vous faire ?</h2>
            <button ref={mainBtn} type="button" onClick={() => choose('dossier')} className={`${choiceBase} border-[#C2410C] bg-[#C2410C] text-white`}><b className="text-[17px]">Obtenir mon dossier prérempli</b><span className="text-[13px] text-[#FFE9DC]">Gratuit · à votre nom · à télécharger tout de suite</span></button>
            <button type="button" onClick={() => choose('rappel')} className={`${choiceBase} border-[#2B4468]`}><b className="text-[16px]">Être rappelé par Elena</b><span className="text-[13px] text-[#B4C1D3]">Dans l’heure, de 9 h à 18 h · pour faire le point</span></button>
            <button type="button" onClick={() => choose('rdv')} className={`${choiceBase} border-[#2B4468]`}><b className="text-[16px]">Prendre rendez-vous</b><span className="text-[13px] text-[#B4C1D3]">30 minutes offertes avec notre équipe, par téléphone</span></button>
            <div className="text-center"><button type="button" onClick={() => choose('info')} className="min-h-[44px] text-[13px] text-[#B4C1D3] underline">J’ai juste une question</button></div>
            <div className="text-center text-[13px] text-[#B4C1D3]">Sans engagement · Vous pouvez arrêter à tout moment</div>
          </section>
        </div>)}

      <section className="flex flex-col gap-4">
        <h2 className="text-[18px] font-extrabold">Le marché en détail</h2>
        <p className="text-[14px] text-[#D6E0EC]"><span className="text-[13px] text-[#B4C1D3]">Intitulé officiel</span><br />{opp.title}</p>
        <dl className="grid grid-cols-2 gap-3 text-[14px]">
          {([['Donneur d’ordre', opp.buyer_name || (opp.identity_unlocked === false ? 'Révélé après un rendez-vous' : 'Non précisé')], ['Lieu d’exécution', `${city}${dept}` || 'Non précisé'], ['Date limite', deadlineTxt], ['Montant', money(opp.estimated_value, opp.currency)], ['Lot', opp.trade_name || 'Non précisé'], ['Référence', opp.source_reference || 'Non précisée']] as const).map(([k, v]) => (
            <div key={k} className="flex flex-col"><dt className="text-[13px] text-[#B4C1D3]">{k}</dt><dd className="font-bold">{v}</dd></div>))}
        </dl>
        {dossiers != null && dossiers >= 2 && <p className="text-[14px] text-[#D6E0EC]">{dossiers} dossiers préremplis demandés pour ce marché ces 7 derniers jours</p>}
        {(opp.ai_summary || sections?.presentation) && <div className="rounded-2xl border border-[#22385A] bg-[#12233A] p-4"><h3 className="mb-1 font-extrabold">Le marché en 30 secondes</h3><p className="text-[14px] text-[#D6E0EC]">{opp.ai_summary || sections?.presentation}</p></div>}
        {sections?.conditions && <Details title="Conditions et points à vérifier"><p className="whitespace-pre-line">{sections.conditions}</p></Details>}
        {sections?.presentation && <Details title="Informations techniques"><p className="whitespace-pre-line">{sections.presentation}</p></Details>}
        {sections?.entreprises && <Details title="Entreprises concernées"><p className="whitespace-pre-line">{sections.entreprises}</p></Details>}
        {opp.description && <Details title="Extrait de l’avis officiel"><p className="whitespace-pre-line">{opp.description.slice(0, 1500)}</p></Details>}
        {opp.official_url && /^https?:\/\//i.test(opp.official_url) && <a href={opp.official_url} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-[#FB923C]">Voir l’annonce officielle ↗</a>}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#22385A] bg-[#0F1F35] p-4">
          <div><h3 className="text-[15px] font-extrabold">Pas le temps maintenant ?</h3><p className="text-[13px] text-[#B4C1D3]">Enregistrez ce marché sur ce téléphone pour le retrouver. Aucun numéro demandé, aucun appel.</p></div>
          <button type="button" onClick={toggleSave} aria-pressed={saved} className="min-h-[44px] shrink-0 rounded-[14px] border border-[#2B4468] px-3.5 font-bold">{saved ? 'Enregistré ✓' : 'Enregistrer'}</button>
        </div>
      </section>

      {/* Barre fixe (3.11) */}
      {!(known && mainVisible) && !fieldActive && !invite && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#22385A] bg-[#0A1628]/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto max-w-[560px]">
            {known
              ? <><button type="button" onClick={() => choose('dossier')} className={btnMain}>Obtenir mon dossier prérempli</button><div className="mt-1 text-center text-[12px] text-[#B4C1D3]">À votre nom · à télécharger tout de suite</div></>
              : companyForm(true)}
          </div>
        </div>)}

      {/* Invitation « 30 minutes offertes » (3.12): volet bas, pas un pop-up */}
      {invite && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2B4468] bg-[#12233A] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_24px_rgba(0,0,0,.4)]" role="region" aria-label="30 minutes offertes">
          <div className="relative mx-auto flex max-w-[560px] flex-col gap-3 pr-8">
            <p className="text-[15px]">Ce marché vous intéresse, mais vous ne savez pas par où commencer ? Profitez de 30 minutes offertes avec notre équipe pour faire le point sur votre entreprise, ce marché et les prochaines étapes.</p>
            <button type="button" className={btnMain} onClick={() => { trackVisitorEvent('invitation_30min_clicked', 'Invitation cliquée', undefined, { opportunityId: id }); setInvite(false); acted.current = true; setApptOpen(true); }}>Demander mes 30 minutes offertes</button>
            <div className="text-center text-[13px] text-[#B4C1D3]">Par téléphone · Sans engagement</div>
            <button type="button" onClick={closeInvite} aria-label="Fermer" className="absolute right-[-8px] top-[-8px] min-h-[44px] min-w-[44px] text-[18px]">✕</button>
          </div>
        </div>)}

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} opportunityId={opp.id}
        marketLabel={[opp.title, opp.source_reference].filter(Boolean).join(' · ')} deadline={opp.deadline} />
    </main>
  );
}
