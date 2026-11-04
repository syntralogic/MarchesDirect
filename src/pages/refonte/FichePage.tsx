import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronLeft } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { CallbackModal } from '@/components/CallbackModal';
import { AppointmentModal } from '@/components/AppointmentModal';
import ScoreRing from '@/components/refonte/ScoreRing';
import SocialProofDot from '@/components/refonte/SocialProofDot';
import InvitationSheet from '@/components/refonte/InvitationSheet';
import { INVITE_DELAY_MS, INVITE_POSTPONE_MS, decideInvitation, markInviteShown, wasInviteShown } from '@/lib/refonte/invitation';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { opportunitiesApi, getApiErrorMessage, type ApiMatchScore, type ApiOpportunityDetail } from '@/lib/apiClient';
import { getSessionId, trackVisitorEvent } from '@/lib/visitorTracking';
import {
  answersToParam, buildAdvice, buildShortTitle, companyLine, criteriaRows, deadlineInfo, scoreBand,
  REFINE_QUESTIONS, type Answers, type RowTone,
} from '@/lib/refonte/fiche';

// Refonte v26 - screen 3 "Marché + analyse" (spec 3.1 - 3.12), mounted at /v2/opportunites/:id behind VITE_REFONTE=on.
// The legacy page (/opportunites/:id) is untouched until the "bascule" is approved in writing.
// Percentages come from the existing rules engine (GET /opportunities/:id/match-score): opening a fiche never calls an AI.

const JOURNEY_LABEL: Record<string, string> = { public_procurement: 'MARCHÉ PUBLIC', tender: "APPEL D'OFFRES PRIVÉ", subcontracting: 'SOUS-TRAITANCE' };
const TONE: Record<RowTone, string> = { green: 'text-[#6EE7B7]', amber: 'text-[#FDBA74]', red: 'text-[#FCA5A5]' };
const SAVED_KEY = 'md_saved_markets';

type Saved = { id: string; siret?: string | null; at: string };
const readSaved = (): Saved[] => { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; } };

function ElenaAvatar({ size = 44 }: { size?: number }) {
  // Placeholder until the real photo is supplied by the client (brief: "photo d'Elena" provided by Hedi).
  return <div className="shrink-0 rounded-full bg-[#1C2433] border border-[#2B4468] text-[#FB923C] font-bold flex items-center justify-center" style={{ width: size, height: size }} aria-hidden="true">EP</div>;
}

/** "Ce marché est-il pour vous ?" (3.2): company name or SIRET, result shown in place, no reload. */
function CompanyForm({ opportunityId, onKnown }: { opportunityId: string; onKnown: () => void }) {
  const { lookup, confirm, candidates } = useCompanyKnown();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const done = (r: { error: string | null; companyKnown?: boolean; siret?: string | null }) => {
    if (r.error) { setErr(r.error); return; }
    if (r.companyKnown) {
      trackVisitorEvent('company_selected', 'Entreprise sélectionnée', undefined, { siret: r.siret ?? undefined, opportunityId });
      onKnown();
    }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 3) { setErr('Indiquez le nom de votre entreprise ou votre SIRET.'); return; }
    setBusy(true); setErr(null);
    done(await lookup(q.trim()));
    setBusy(false);
  };
  const pick = async (siret: string) => { setBusy(true); setErr(null); done(await confirm(siret)); setBusy(false); };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-[#C2410C] p-5 flex flex-col gap-3" noValidate>
      <h2 className="text-xl font-extrabold text-white">Ce marché est-il pour vous ?</h2>
      <p className="text-sm text-[#FFE9DC]">Entrez le nom de votre entreprise ou votre SIRET. Résultat immédiat, analysé sur six critères.</p>
      <label htmlFor="fiche-company" className="text-sm font-semibold text-white">Nom de votre entreprise ou SIRET</label>
      <input id="fiche-company" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex. : 929 393 072 00012" autoComplete="organization" enterKeyHint="go"
        className="min-h-[48px] rounded-xl px-4 text-base text-[#0A1628] bg-white" />
      {err && <p role="alert" className="text-sm text-white bg-[#7F1D1D] rounded-lg px-3 py-2">{err}</p>}
      {candidates.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Entreprises trouvées">
          {candidates.slice(0, 3).map((c) => (
            <li key={c.siret}>
              <button type="button" disabled={busy} onClick={() => pick(c.siret)} className="w-full text-left min-h-[48px] rounded-xl bg-white/95 text-[#0A1628] px-4 py-2 text-sm">
                <b>{c.name}</b>{c.activity ? ` · ${c.activity}` : ''}{c.city ? ` · ${c.city}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="submit" disabled={busy} className="min-h-[52px] rounded-xl bg-white text-[#C2410C] font-extrabold text-base disabled:opacity-60">
        {busy ? 'Recherche…' : 'Voir si ce marché me correspond'}
      </button>
      <p className="text-xs text-center text-[#FFE9DC]">Gratuit · Sans inscription · Résultat immédiat</p>
    </form>
  );
}

export default function FichePage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company, siret } = useCompanyKnown();

  const [opp, setOpp] = useState<ApiOpportunityDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [score, setScore] = useState<ApiMatchScore | null>(null);
  const [scoreErr, setScoreErr] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [refineOpen, setRefineOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modal, setModal] = useState<null | 'rappel' | 'rdv'>(null);
  const [stub, setStub] = useState<null | 'dossier' | 'question'>(null);
  const [mainBtnVisible, setMainBtnVisible] = useState(false);
  const [typing, setTyping] = useState(false);
  const [invite, setInvite] = useState(false);
  const acted = useRef(false); // any choice made on this fiche: the invitation never shows afterwards
  const mainBtn = useRef<HTMLButtonElement>(null);
  const shownFor = useRef<string | null>(null);

  // --- market
  useEffect(() => {
    let cancelled = false;
    setOpp(null); setNotFound(false); setScore(null); setAnswers({});
    opportunitiesApi.getById(id).then((o) => { if (!cancelled) setOpp(o); }).catch(() => { if (!cancelled) setNotFound(true); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => { setSaved(readSaved().some((s) => s.id === id)); }, [id]);

  // --- score (rules engine). Keeps the previous value on screen while an answer is being applied: no layout jump.
  const answersParam = useMemo(() => answersToParam(answers), [answers]);
  useEffect(() => {
    if (!company || !id) { setScore(null); return; }
    let cancelled = false;
    setScoreErr(null);
    opportunitiesApi.getMatchScore(id, getSessionId(), answersParam || undefined)
      .then((s) => { if (!cancelled) setScore(s); })
      .catch((e) => { if (!cancelled) setScoreErr(getApiErrorMessage(e, "Le pourcentage n'a pas pu être calculé pour le moment.")); });
    return () => { cancelled = true; };
  }, [id, company, answersParam]);

  // concordance_shown: once per market, first time the percentage is on screen (existing event code).
  useEffect(() => {
    if (score && shownFor.current !== id) {
      shownFor.current = id;
      trackVisitorEvent('concordance_shown', 'Concordance affichée', undefined, { opportunityId: id, siret: siret ?? undefined, journey: opp?.journey });
    }
  }, [score, id, siret, opp?.journey]);

  // --- sticky bar rules (3.11): hidden while the main choice button is on screen (40 %), and while a field is being typed in.
  useEffect(() => {
    const el = mainBtn.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setMainBtnVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [company, score, opp]);
  useEffect(() => {
    const on = (e: Event) => setTyping(['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName));
    const off = () => setTyping(false);
    document.addEventListener('focusin', on); document.addEventListener('focusout', off);
    return () => { document.removeEventListener('focusin', on); document.removeEventListener('focusout', off); };
  }, []);

  // 3.12: 40 s on a fiche with a percentage and no action -> one invitation per visit (postponed 15 s while a field is active).
  const hasPct = score !== null && score.score !== null;
  useEffect(() => {
    if (!hasPct) return;
    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      const ae = document.activeElement as HTMLElement | null;
      const d = decideInvitation({ alreadyShown: wasInviteShown(), acted: acted.current, fieldActive: !!ae && ['INPUT', 'TEXTAREA', 'SELECT'].includes(ae.tagName) });
      if (d === 'postpone') { timer = setTimeout(attempt, INVITE_POSTPONE_MS); return; }
      if (d === 'show') {
        markInviteShown();
        setInvite(true);
        trackVisitorEvent('invitation_30min_shown', 'Invitation 30 minutes affichée', undefined, { opportunityId: id, siret: siret ?? undefined });
      }
    };
    timer = setTimeout(attempt, INVITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [hasPct, id, siret]);

  const toggleSave = useCallback(() => {
    const list = readSaved();
    const next = list.some((s) => s.id === id) ? list.filter((s) => s.id !== id) : [...list, { id, siret, at: new Date().toISOString() }];
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* private mode: button simply does nothing */ }
    setSaved(next.some((s) => s.id === id));
  }, [id, siret]);

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-[#F2F5F9]">
        <PageMeta title="Marché introuvable | Marchés Direct" description="Ce marché n'existe pas ou n'est plus disponible." noindex />
        <h1 className="text-xl font-bold mb-3">Ce marché n'est plus disponible</h1>
        <Link to="/recherche" className="text-[#FB923C] underline">Rechercher d'autres marchés</Link>
      </div>
    );
  }
  if (!opp) return <div className="max-w-xl mx-auto px-4 py-16 text-center text-[#B4C1D3]" aria-busy="true">Chargement du marché…</div>;

  // --- derived view data
  const dept = opp.location_department || null;
  const place = [opp.location_city, dept ? `(${dept})` : ''].filter(Boolean).join(' ');
  const dl = deadlineInfo(opp.deadline);
  const title = buildShortTitle({ officialTitle: opp.title, city: opp.location_city });
  const pct = score ? score.score : null;
  const band = pct !== null ? scoreBand(pct) : null;
  const rows = criteriaRows(score?.matchCriteria);
  const activity = score?.matchCriteria.find((c) => c.key === 'metier');
  const activityStatus: 'match' | 'confirm' | 'mismatch' = !activity || activity.evidence === 'unknown' ? 'confirm' : activity.status;
  const companyName = company?.name || 'votre entreprise';
  const advice = company && pct !== null
    ? buildAdvice({ activity: activityStatus, city: opp.location_city, company: companyName, answers, pct })
    : null;
  const answeredCount = REFINE_QUESTIONS.filter((q) => answers[q.key]).length;
  const rowByCriterion = new Map(rows.map((r) => [r.key, r]));
  const choose = (c: 'dossier' | 'rappel' | 'rdv' | 'question') => {
    acted.current = true;
    setInvite(false);
    if (c === 'rappel' || c === 'rdv') setModal(c); else setStub(c);
  };

  const kv: [string, string | null][] = [
    ["Donneur d'ordre", opp.buyer_name ?? null],
    ["Lieu d'exécution", place || null],
    ['Date limite', dl.daysLeft === null ? null : dl.text.replace(/ · J-\d+$/, '')],
    ['Montant estimé', typeof opp.estimated_value === 'number' && opp.estimated_value > 0 ? `${opp.estimated_value.toLocaleString('fr-FR')} €` : null],
    ['Référence', opp.source_reference ?? null],
  ];

  return (
    <div className="bg-[#0A1628] text-[#F2F5F9] min-h-screen pb-32" style={{ fontFamily: '"Plus Jakarta Sans","Segoe UI",Roboto,system-ui,sans-serif' }}>
      <PageMeta title={`${title} | Marchés Direct`} description={`${JOURNEY_LABEL[opp.journey] ?? 'Marché'} · ${place}`} noindex />
      <div className="max-w-[460px] mx-auto px-4 flex flex-col gap-6 pt-3">

        {/* 3.1 header */}
        <nav aria-label="Étapes" className="flex flex-col gap-2">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-[15px] text-[#B4C1D3] min-h-[44px] self-start"><ChevronLeft size={18} /> Vos marchés</button>
          <ol className="flex text-[13px] text-[#B4C1D3] text-center">
            {['Vos marchés', 'Mon analyse', 'Mon dossier'].map((s, i) => (
              <li key={s} className="flex-1 flex flex-col items-center gap-1" aria-current={i === 1 ? 'step' : undefined}>
                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-extrabold text-sm ${i === 1 ? 'border-[#FB923C] text-[#FB923C]' : i === 0 ? 'border-[#34D399] text-[#34D399]' : 'border-[#2B4468]'}`}>{i === 0 ? <Check size={16} /> : i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </nav>

        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full border border-[#2B4468] px-3 py-1">{JOURNEY_LABEL[opp.journey] ?? 'MARCHÉ'}</span>
            {place && <span className="rounded-full border border-[#2B4468] px-3 py-1">{place}</span>}
            <span className={`rounded-full border px-3 py-1 ${dl.amber ? 'border-[#FDBA74] text-[#FDBA74] bg-[#3A2312]' : 'border-[#2B4468]'}`}>{dl.text}</span>
          </div>
          <h1 className="text-[23px] font-extrabold leading-snug">{title}</h1>
          <SocialProofDot opportunityId={id} />
        </header>

        {/* 3.2 unknown company */}
        {!company && <CompanyForm opportunityId={id} onKnown={() => undefined} />}

        {company && (
          <>
            {/* 3.3 percentage */}
            <section className="rounded-2xl bg-[#12233A] border border-[#22385A] p-5 flex flex-col gap-4" aria-live="polite">
              <div className="flex items-center gap-4">
                <ScoreRing pct={pct} color={band?.color ?? '#8A94A6'} />
                <div className="flex flex-col gap-1.5 min-w-0">
                  <h2 className="text-[19px] font-extrabold leading-tight">{pct !== null ? `Ce marché vous correspond à ${pct} %` : 'Correspondance à confirmer'}</h2>
                  {band && <span className="self-start rounded-full px-3 py-0.5 text-xs font-bold" style={{ background: `${band.color}22`, color: band.color }}>{band.label}</span>}
                  <span className="text-xs text-[#B4C1D3]">Correspondance estimée · à préciser avec vos réponses</span>
                </div>
              </div>
              {scoreErr && <p role="alert" className="text-sm text-[#FCA5A5]">{scoreErr}</p>}
              {!score && !scoreErr && <p className="text-sm text-[#B4C1D3]" aria-busy="true">Calcul en cours…</p>}
              <div className="flex items-center gap-2 rounded-xl bg-[#123B2A] text-[#6EE7B7] px-3 py-2 text-[13px]">
                <Check size={16} className="shrink-0" />
                <span className="min-w-0 flex-1">Pour {companyLine({ name: company.name, activity: company.activity, city: company.city, postal: company.postal })}</span>
                <button type="button" className="underline font-semibold min-h-[44px] px-1" onClick={() => navigate('/')}>Modifier</button>
              </div>
              <p className="text-xs text-[#B4C1D3]">Pourcentage de correspondance calculé à partir des informations publiques de votre entreprise. Il ne mesure pas vos chances de gagner. Répondez aux 4 questions ci-dessous pour l'affiner.</p>
            </section>

            {/* 3.4 Elena's advice */}
            {advice && (
              <section className="rounded-2xl bg-[#1C2433] border-l-4 border-[#FB923C] p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <ElenaAvatar size={52} />
                  <div className="flex flex-col"><b className="text-[15px]">Votre conseil personnalisé</b><span className="text-xs text-[#B4C1D3]">Elena Popescu · Chargée de relation</span></div>
                </div>
                <p className="text-[15px] leading-relaxed text-[#D6E0EC]">{advice.sentences.join(' ')}</p>
                {advice.showBetterLink && <Link to="/recherche" className="text-[#FB923C] text-sm font-semibold">Voir les marchés qui me correspondent mieux ›</Link>}
                <p className="text-xs text-[#B4C1D3]">Synthèse automatique, à confirmer avec Elena.</p>
              </section>
            )}

            {/* 3.5 six criteria + refine */}
            <section className="rounded-2xl bg-[#12233A] border border-[#22385A] p-5 flex flex-col gap-3">
              <h3 className="font-extrabold text-[17px]">Analysé sur six critères</h3>
              <ul className="flex flex-col divide-y divide-[#22385A]">
                {rows.map((r) => (
                  <li key={r.key} className="py-3 flex flex-col gap-1">
                    <div className="flex justify-between gap-3"><b className="text-[15px]">{r.label}</b><span className={`text-sm font-bold ${TONE[r.tone]}`}>{r.status}</span></div>
                    <p className="text-[13px] text-[#B4C1D3]">{r.detail}</p>
                  </li>
                ))}
              </ul>
              <details open={refineOpen} onToggle={(e) => setRefineOpen((e.target as HTMLDetailsElement).open)} className="rounded-xl border border-[#2B4468]">
                <summary className="min-h-[48px] px-4 flex items-center font-semibold text-[15px] cursor-pointer">Affiner mon pourcentage · 4 questions · 1 minute</summary>
                <div className="px-4 pb-4 flex flex-col gap-3">
                  {REFINE_QUESTIONS.map((q) => (
                    <div key={q.key} className="flex flex-col gap-2">
                      <span className="text-[14px] text-[#D6E0EC]">{q.text}</span>
                      <div className="flex gap-2" role="group" aria-label={q.text}>
                        {(['oui', 'non'] as const).map((a) => (
                          <button key={a} type="button" aria-pressed={answers[q.key] === a}
                            onClick={() => setAnswers((cur) => ({ ...cur, [q.key]: cur[q.key] === a ? undefined : a }))}
                            className={`flex-1 min-h-[48px] rounded-xl border font-bold text-[15px] ${answers[q.key] === a ? 'border-[#FB923C] bg-[#3A2312] text-[#FB923C]' : 'border-[#2B4468]'}`}>{a === 'oui' ? 'Oui' : 'Non'}</button>
                        ))}
                      </div>
                      {answers[q.key] && rowByCriterion.get(q.criterion) && <span className="text-xs text-[#B4C1D3]">Ligne « {rowByCriterion.get(q.criterion)!.label} » : {rowByCriterion.get(q.criterion)!.status}</span>}
                    </div>
                  ))}
                  <p className="text-xs text-[#B4C1D3]">{answeredCount}/4 réponses. Le pourcentage se met à jour à chaque réponse. Une information que nous n'avons pas n'est jamais comptée comme acquise, ni contre vous.</p>
                </div>
              </details>
            </section>
          </>
        )}

        {/* 3.6 question line, 3.7 choices */}
        {company && (
          <>
            <p className="text-sm text-[#B4C1D3]">Une question avant de choisir ? <button type="button" className="text-[#FB923C] font-semibold underline min-h-[44px]" onClick={() => choose('question')}>Demandez à Elena</button>, elle vous rappelle dans l'heure.</p>
            <section className="flex flex-col gap-3" aria-labelledby="fiche-choices">
              <h2 id="fiche-choices" className="text-xl font-extrabold">Que voulez-vous faire ?</h2>
              <button ref={mainBtn} type="button" onClick={() => choose('dossier')} className="min-h-[64px] rounded-2xl bg-[#C2410C] text-white px-4 py-3 text-left flex flex-col">
                <b className="text-base">Obtenir mon dossier prérempli</b><span className="text-[13px] text-[#FFE9DC]">Gratuit · à votre nom · à télécharger tout de suite</span>
              </button>
              <button type="button" onClick={() => choose('rappel')} className="min-h-[64px] rounded-2xl border border-[#2B4468] px-4 py-3 text-left flex flex-col">
                <b className="text-base">Être rappelé par Elena</b><span className="text-[13px] text-[#B4C1D3]">Dans l'heure, de 9 h à 18 h · pour faire le point</span>
              </button>
              <button type="button" onClick={() => choose('rdv')} className="min-h-[64px] rounded-2xl border border-[#2B4468] px-4 py-3 text-left flex flex-col">
                <b className="text-base">Prendre rendez-vous</b><span className="text-[13px] text-[#B4C1D3]">30 minutes offertes avec notre équipe, par téléphone</span>
              </button>
              <button type="button" onClick={() => choose('question')} className="text-sm text-[#FB923C] underline min-h-[44px]">J'ai juste une question</button>
              <p className="text-xs text-center text-[#B4C1D3]">Sans engagement · Vous pouvez arrêter à tout moment</p>
            </section>
          </>
        )}

        {/* 3.8 market in detail (official title + the 6 facts; accordions follow in the next step) */}
        <section className="flex flex-col gap-3" aria-labelledby="fiche-detail">
          <h2 id="fiche-detail" className="text-lg font-extrabold">Le marché en détail</h2>
          <p className="text-sm text-[#D6E0EC]"><span className="text-xs text-[#B4C1D3]">Intitulé officiel</span><br />{opp.title}</p>
          <dl className="grid grid-cols-1 gap-2">
            {kv.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-[#12233A] border border-[#22385A] px-4 py-3"><dt className="text-xs text-[#B4C1D3]">{k}</dt><dd className="text-[15px] font-semibold">{v}</dd></div>
            ))}
          </dl>
          {opp.official_url && <a href={opp.official_url} target="_blank" rel="noopener noreferrer" className="text-[#FB923C] text-sm font-semibold">Voir l'annonce officielle ↗</a>}
        </section>

        {/* 3.10 save on this phone: localStorage only, no number, no call */}
        <section className="rounded-2xl bg-[#0F1F35] border border-[#22385A] p-4 flex items-center justify-between gap-3">
          <div><h3 className="text-[15px] font-bold">Pas le temps maintenant ?</h3><p className="text-xs text-[#B4C1D3]">Enregistrez ce marché sur ce téléphone pour le retrouver. Aucun numéro demandé, aucun appel.</p></div>
          <button type="button" onClick={toggleSave} aria-pressed={saved} className="min-h-[44px] px-4 rounded-xl border border-[#2B4468] text-sm font-bold whitespace-nowrap">{saved ? 'Enregistré ✓' : 'Enregistrer'}</button>
        </section>
      </div>

      {/* 3.11 fixed bar */}
      {company && !mainBtnVisible && !typing && !modal && !stub && (
        <div className="fixed bottom-0 inset-x-0 bg-[#0A1628]/95 border-t border-[#22385A] px-4 pt-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="max-w-[460px] mx-auto">
            <button type="button" onClick={() => choose('dossier')} className="w-full min-h-[52px] rounded-xl bg-[#C2410C] text-white font-extrabold">Obtenir mon dossier prérempli</button>
            <p className="text-xs text-center text-[#B4C1D3] mt-1">À votre nom · à télécharger tout de suite</p>
          </div>
        </div>
      )}

      {invite && !modal && !stub && (
        <InvitationSheet
          onClose={() => { setInvite(false); trackVisitorEvent('invitation_30min_closed', 'Invitation 30 minutes fermée', undefined, { opportunityId: id, siret: siret ?? undefined }); }}
          onAccept={() => { trackVisitorEvent('invitation_30min_clicked', 'Invitation 30 minutes acceptée', undefined, { opportunityId: id, siret: siret ?? undefined }); choose('rdv'); }}
        />
      )}

      <CallbackModal open={modal === 'rappel'} onClose={() => setModal(null)} opportunityId={id} />
      <AppointmentModal open={modal === 'rdv'} onClose={() => setModal(null)} marketLabel={title} />

      {/* Coordonnées screens (dossier / question) are the NEXT step of the refonte: clearly marked, nothing is sent. */}
      {stub && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setStub(null)}>
          <div className="w-full max-w-[460px] rounded-t-2xl bg-[#12233A] p-5 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <b>{stub === 'dossier' ? 'Obtenir mon dossier prérempli' : 'Poser ma question'}</b>
            <p className="text-sm text-[#B4C1D3]">Cet écran (coordonnées puis confirmation) est la prochaine étape de la refonte. Rien n'est envoyé pour le moment.</p>
            <button type="button" onClick={() => setStub(null)} className="min-h-[48px] rounded-xl border border-[#2B4468] font-bold">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
