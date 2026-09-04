import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Euro, Loader2, FileText, Sparkles, AlertTriangle,
  CheckCircle2, XCircle, HelpCircle, LogIn, Lock, Gauge, Landmark, Briefcase, Handshake, ShieldCheck, PhoneCall,
  ChevronDown, KeyRound, Globe, Facebook, Star, BadgeCheck, Download,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { SaveButton } from '@/components/SaveButton';
import { AppointmentModal } from '@/components/AppointmentModal';
import PageMeta from '@/components/common/PageMeta';
import { trackVisitorEvent, getSessionId } from '@/lib/visitorTracking';
import {
  opportunitiesApi, tendersApi, companyVaultApi, getApiErrorMessage,
  type ApiOpportunityDetail, type ApiTender, type ApiBidResponse, type ApiTenderDocument,
  type ApiOpportunityAccess, type ApiMatchScore, type ApiCompanyDocument, type ApiSiretCompany,
} from '@/lib/apiClient';
import { useLang } from '@/contexts/LangContext';

// Spec 3.7: "Fin du parcours" company-document checklist - always addable
// once logged in, regardless of subscription (only the AI-assisted mémoire
// technique below it is gated). Same document_type values CompanyVaultPage
// already writes, so ticking one off here and there never disagree.
const CHECKLIST_DOCS: { type: string; labelKey: string }[] = [
  { type: 'kbis', labelKey: 'checklistKbis' },
  { type: 'insurance', labelKey: 'checklistInsurance' },
  { type: 'attestation_fiscale', labelKey: 'checklistFiscale' },
  { type: 'attestation_sociale', labelKey: 'checklistSociale' },
];
function formatAmount(value: number | null, currency: string | null) {
  if (value == null) return 'Montant non communiqué';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' ' + (currency || 'EUR');
}
function formatDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
}

const DOC_LABELS: Record<string, string> = {
  kbis: 'Extrait KBIS', insurance: "Attestation d'assurance décennale", dc1: 'DC1 (lettre de candidature)',
  dc2: 'DC2 (déclaration du candidat)', dume: 'DUME', attestation_fiscale: 'Attestation fiscale', attestation_sociale: 'Attestation sociale',
};

// DCE viewer (écran 8): document_label is the ingestion pipeline's own
// best-effort tag (see schema.sql - 'RC', 'CCAP', 'CCTP', 'AAPC', 'Autre').
// Display names only, no re-categorization of what the backend already tagged.
const DCE_LABEL_NAMES: Record<string, string> = {
  RC: 'RC — Règlement de consultation',
  CCTP: 'CCTP — Cahier des clauses techniques',
  CCAP: 'CCAP — Clauses administratives',
  AAPC: "AAPC — Avis d'appel public à la concurrence",
  DPGF: 'DPGF / BPU — Pièces de prix',
  BPU: 'DPGF / BPU — Pièces de prix',
  Autre: 'Plans et annexes',
};

const JOURNEY_LABEL: Record<string, { label: string; icon: typeof Landmark }> = {
  public_procurement: { label: 'Marché public', icon: Landmark },
  tender: { label: "Appel d'offres privé", icon: Briefcase },
  subcontracting: { label: 'Sous-traitance', icon: Handshake },
};

type Tab = 'main' | 'dossier';

// Placeholder near-term slots, matching the client's prototype (e.g.
// "Aujourd'hui · 17h30"). Not backed by a real staff calendar yet.
const CALLBACK_SLOTS = ["Aujourd'hui · 17h30", "Demain · 08h30", "Demain · 14h00", 'Après-demain · 10h00'];

export default function OpportunityDetailPage() {
  const { t } = useLang();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, company, user, register } = useAuth();
  const { companyKnown, company: siretCompany, lookup: lookupSiret, leadCaptured, leadPhone: contextLeadPhone, leadEmail: contextLeadEmail, captureLead } = useCompanyKnown();
  const isPaid = company?.subscription_status === 'active';

  const [opportunity, setOpportunity] = useState<ApiOpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('main');

  const [access, setAccess] = useState<ApiOpportunityAccess | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [slotForm, setSlotForm] = useState({ email: user?.email || '', phone: '', firstName: user?.firstName || '', lastName: user?.lastName || '', companyName: company?.name || '' });
  // "Comment souhaitez-vous continuer ?" (client's dix images, écran 5):
  // three plain choice-cards, not a form. Reserving a slot or asking for a
  // callback is picked here; contact info itself was already captured
  // earlier in the journey (screen 4's "Enregistrer cette opportunité"
  // gate) so this step never re-asks for name/email/phone.
  const [contactChoice, setContactChoice] = useState<'slot' | 'callback' | 'none' | null>(null);
  const [slotSubmitting, setSlotSubmitting] = useState<'slot' | 'callback' | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [callbackConfirmed, setCallbackConfirmed] = useState(false);
  const [quickPassword, setQuickPassword] = useState('');
  const [quickPasswordSubmitting, setQuickPasswordSubmitting] = useState(false);
  const [quickPasswordError, setQuickPasswordError] = useState<string | null>(null);
  const [quickPasswordDone, setQuickPasswordDone] = useState(false);
  const [quickPasswordDismissed, setQuickPasswordDismissed] = useState(false);
  const [showAccountManagerModal, setShowAccountManagerModal] = useState(false);
  // Phone+email gate (client's newest brief, Écran 7): shown once SIRET is
  // known but leadCaptured is still false, in place of the fuller analysis
  // breakdown (criteria/eligibility/refine accordion) - global per session
  // via CompanyKnownContext, so once given it never reappears anywhere.
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [justUnlockedAnalysis, setJustUnlockedAnalysis] = useState(false);

  // Once contact info exists anywhere (this mount's own lead form, an
  // earlier session via CompanyKnownContext, or a logged-in account),
  // carry it into slotForm so the "suivi & rappel" step never re-asks.
  useEffect(() => {
    const email = leadEmail || contextLeadEmail || user?.email || '';
    const phone = leadPhone || contextLeadPhone || '';
    if (email || phone) {
      setSlotForm(f => ({ ...f, email: f.email || email, phone: f.phone || phone }));
    }
  }, [leadEmail, leadPhone, contextLeadEmail, contextLeadPhone, user?.email]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(leadPhone)) {
      setLeadError(t('leadPhoneInvalid') || 'Le téléphone doit contenir 10 chiffres.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(leadEmail)) {
      setLeadError(t('leadEmailInvalid') || "L'e-mail n'est pas valide.");
      return;
    }
    setLeadSubmitting(true);
    setLeadError(null);
    const { error } = await captureLead(leadPhone, leadEmail, id);
    if (error) setLeadError(error);
    else setJustUnlockedAnalysis(true);
    setLeadSubmitting(false);
  };

  const [matchScore, setMatchScore] = useState<ApiMatchScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [siretInput, setSiretInput] = useState('');
  const [siretSubmitting, setSiretSubmitting] = useState(false);
  const [siretError, setSiretError] = useState<string | null>(null);

  const [tender, setTender] = useState<ApiTender | null>(null);
  const [bid, setBid] = useState<ApiBidResponse | null>(null);
  const [dceLoading, setDceLoading] = useState(false);
  const [checklistDocs, setChecklistDocs] = useState<ApiCompanyDocument[]>([]);
  const [checklistCertCount, setChecklistCertCount] = useState(0);
  const [checklistRefCount, setChecklistRefCount] = useState(0);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dceError, setDceError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    opportunitiesApi.getById(id)
      .then(o => {
        setOpportunity(o);
        trackVisitorEvent('view_opportunity', o.title, undefined, { opportunityId: id, journey: o.journey });
      })
      .catch(err => setError(getApiErrorMessage(err, t('detailLoadError'))))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    if (!id) return;
    setAccessLoading(true);
    opportunitiesApi.getAccess(id, getSessionId(), user?.email)
      .then(setAccess)
      .catch(() => setAccess({ identityUnlocked: false }))
      .finally(() => setAccessLoading(false));
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!id || tab !== 'score' || matchScore || scoreLoading) return;
    if (!companyKnown && !isAuthenticated) return; // gate: nothing to fetch until identified
    setScoreLoading(true);
    setScoreError(null);
    opportunitiesApi.getMatchScore(id, getSessionId())
      .then(setMatchScore)
      .catch(err => setScoreError(getApiErrorMessage(err, t('scoreLoadError') || "Impossible de calculer le score pour cette opportunité.")))
      .finally(() => setScoreLoading(false));
  }, [id, tab, matchScore, scoreLoading, t, companyKnown, isAuthenticated]);

  const handleSiretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Accept a 14-digit SIRET OR a company name (client's ask: label the
    // field "SIRET ou entreprise" so either works) - only reject genuinely
    // too-short input, the backend resolves a name to a SIRET via Pappers
    // search before doing the actual lookup.
    const trimmed = siretInput.trim();
    if (trimmed.length < 2) {
      setSiretError(t('siretInputTooShort') || "Indiquez un SIRET (14 chiffres) ou le nom de l'entreprise.");
      return;
    }
    setSiretSubmitting(true);
    setSiretError(null);
    const { error } = await lookupSiret(trimmed);
    if (error) setSiretError(error);
    setSiretSubmitting(false);
  };

  // DCE - Dossier de consultation raw document list (client's dix images,
  // écran 8): these are the buyer's own published files, already public -
  // no reason to gate this behind the paid subscription like the AI
  // analysis/bid-package cards below it are.
  const [dceDocuments, setDceDocuments] = useState<ApiTenderDocument[]>([]);
  const [dceDocsExpanded, setDceDocsExpanded] = useState(false);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    tendersApi.getDocuments(id)
      .then(({ documents }) => setDceDocuments(documents))
      .catch(() => {});
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!id || !isAuthenticated || !isPaid) return;
    setDceLoading(true);
    setDceError(null);
    tendersApi.get(id)
      .then(async tData => {
        setTender(tData);
        const b = await tendersApi.getBid(tData.id);
        setBid(b);
      })
      .catch(err => setDceError(getApiErrorMessage(err, t('detailDCEAnalysisFailed') || "Impossible de charger le dossier.")))
      .finally(() => setDceLoading(false));
  }, [id, isAuthenticated, isPaid, t]);

  // Checklist fetch is independent of isPaid on purpose - spec 3.7 keeps
  // the company-document checklist addable regardless of subscription,
  // only the AI-assisted mémoire technique below it is gated.
  useEffect(() => {
    if (!isAuthenticated) return;
    setChecklistLoading(true);
    Promise.all([companyVaultApi.documents.list(), companyVaultApi.certifications.list(), companyVaultApi.references.list()])
      .then(([docs, certs, refs]) => {
        setChecklistDocs(docs);
        setChecklistCertCount(certs.length);
        setChecklistRefCount(refs.length);
      })
      .catch(() => {})
      .finally(() => setChecklistLoading(false));
  }, [isAuthenticated]);

  const handleAnalyze = async () => {
    if (!tender) return;
    setAnalyzing(true);
    setDceError(null);
    try {
      const updated = await tendersApi.analyze(tender.id);
      setTender(updated);
    } catch (err) {
      setDceError(getApiErrorMessage(err, t('detailDCEAnalysisFailed')));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!bid) return;
    setGenerating(true);
    setDceError(null);
    try {
      const result = await tendersApi.generateBidDocuments(bid.id);
      setBid(result.bid);
    } catch (err) {
      setDceError(getApiErrorMessage(err, t('detailBidGenerationFailed')));
    } finally {
      setGenerating(false);
    }
  };

  const handleBookSlot = async (slotLabel: string) => {
    if (!id) return;
    if (!slotForm.email) {
      setSlotError(t('followUpNeedsContact') || 'Identifiez votre entreprise et enregistrez vos coordonnées ci-dessus avant de choisir un créneau.');
      setContactChoice(null);
      return;
    }
    setSelectedSlot(slotLabel);
    setSlotSubmitting('slot');
    setSlotError(null);
    try {
      const result = await opportunitiesApi.requestAccess(id, { ...slotForm, sessionId: getSessionId(), mode: 'slot', slotLabel });
      setAccess({ identityUnlocked: result.identityUnlocked });
    } catch (err) {
      setSlotError(getApiErrorMessage(err, t('accessRequestFailed') || "L'envoi a échoué. Vérifiez votre email et réessayez."));
      setSelectedSlot(null);
    } finally {
      setSlotSubmitting(null);
    }
  };

  const handleCallback = async () => {
    if (!id) return;
    if (!slotForm.email) {
      setSlotError(t('followUpNeedsContact') || 'Identifiez votre entreprise et enregistrez vos coordonnées ci-dessus avant de demander un rappel.');
      setContactChoice(null);
      return;
    }
    setSlotSubmitting('callback');
    setSlotError(null);
    try {
      await opportunitiesApi.requestAccess(id, { ...slotForm, sessionId: getSessionId(), mode: 'callback' });
      setCallbackConfirmed(true);
    } catch (err) {
      setSlotError(getApiErrorMessage(err, t('accessRequestFailed') || "L'envoi a échoué. Vérifiez votre email et réessayez."));
    } finally {
      setSlotSubmitting(null);
    }
  };

  // Lightweight account finalisation (prototype V17, section 3.5) - shown
  // once a slot/callback has already captured phone+email. Reuses the
  // existing full register() flow (same as SignupPage) rather than a new
  // endpoint: companyName defaults to the SIRET-recognized name when known,
  // since re-typing it would contradict "single password field, nothing
  // else to fill in" from the spec. Never blocks navigation - "Plus tard"
  // just dismisses this block, per rule 6/7 of the spec.
  const handleQuickPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPassword.length < 8) {
      setQuickPasswordError(t('quickPasswordTooShort') || 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setQuickPasswordSubmitting(true);
    setQuickPasswordError(null);
    const result = await register({
      companyName: siretCompany?.name || slotForm.companyName || `${slotForm.firstName} ${slotForm.lastName}`.trim() || 'Mon entreprise',
      firstName: slotForm.firstName,
      lastName: slotForm.lastName,
      email: slotForm.email,
      password: quickPassword,
    });
    setQuickPasswordSubmitting(false);
    if (result.error) {
      setQuickPasswordError(result.error);
    } else {
      setQuickPasswordDone(true);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin text-orange" /></div>;
  }
  if (error || !opportunity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-red-400 mb-4">{error || t('detailNotFound')}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-orange hover:underline">{t('detailBack')}</button>
      </div>
    );
  }

  const journey = opportunity.journey || 'tender';
  const isPublic = journey === 'public_procurement';
  const journeyMeta = JOURNEY_LABEL[journey] || JOURNEY_LABEL.tender;
  const JourneyIcon = journeyMeta.icon;

  // Prototype V17 rule: a private tender / sous-traitance fiche is exactly
  // as open as a public one - amount, tasks, deadline, criteria, score are
  // never gated. Only the buyer's identity (name) is, and only until a
  // callback slot is booked (see the "Donneur d'ordre" block below).
  const identityUnlocked = isPublic || !!access?.identityUnlocked;

  const metaDescription = (opportunity.ai_summary || opportunity.description)
    || `${journeyMeta.label} : ${opportunity.title}${opportunity.location_city ? ` à ${opportunity.location_city}` : ''}. Consultez l'annonce complète sur Marchés Direct.`;

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 py-6 md:py-10">
      <PageMeta title={`${opportunity.title} — Marchés Direct`} description={metaDescription.slice(0, 300)} />
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-[#B9BBC8] hover:text-white mb-4 transition-colors">
        <ArrowLeft size={14} /> {t('detailBack')}
      </button>

      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 mb-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange uppercase tracking-wide bg-orange/10 border border-orange/30 rounded-full px-2.5 py-1">
            <JourneyIcon size={11} /> {journeyMeta.label}
          </span>
          {/* Deadline countdown pill (client's dix images, écran 1) - same
              days-left math as OpportunityListCard's getDeadlineText, kept
              in sync here since this is the only other place that renders
              a "days remaining" badge from the same opportunity.deadline
              field. */}
          {opportunity.deadline && (() => {
            const days = Math.ceil((new Date(opportunity.deadline as string).getTime() - Date.now()) / 86400000);
            if (Number.isNaN(days)) return null;
            const text = days < 0 ? t('listingClosedLabel') : `${days} ${days > 1 ? t('listingDaysPlural') : t('listingDaySingular')}`;
            return (
              <span className="text-[11px] font-medium text-white border border-white/25 rounded-full px-3 py-1">
                {text}
              </span>
            );
          })()}
          {/* Transparency badge - public markets are fully open by law (no
              donneur d'ordre lock at all); private tenders/sous-traitance
              mask only the buyer's identity until a callback is booked (see
              "Donneur d'ordre" block below). Matches the client's own
              explanation of the public/private distinction almost verbatim. */}
          <span className={`text-[11px] font-semibold rounded-full px-3 py-1 ${isPublic ? 'text-green-400 bg-green-400/10 border border-green-400/30' : 'text-[#B9BBC8] bg-white/5 border border-white/15'}`}>
            {isPublic ? (t('detailInfoPublic') || 'Informations publiques') : (t('detailInfoPartial') || 'Coordonnées protégées')}
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-lg md:text-xl font-extrabold text-white leading-snug">{opportunity.title}</h1>
          <SaveButton opportunityId={opportunity.id} size="md" />
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-[#B9BBC8]">
          {(opportunity.location_city || opportunity.location_region) && (
            <span className="flex items-center gap-1.5"><MapPin size={13} /> {[opportunity.location_city, opportunity.location_region].filter(Boolean).join(', ')}</span>
          )}
          <span className="flex items-center gap-1.5"><Calendar size={13} /> {t('detailDeadline')} : {formatDate(opportunity.deadline)}</span>
          <span className="flex items-center gap-1.5"><Euro size={13} /> {formatAmount(opportunity.estimated_value, opportunity.currency)}</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-4 border-b border-[#17334D]">
        {([
          { key: 'main' as Tab, label: t('detailResume') || 'Le marché' },
          { key: 'dossier' as Tab, label: t('detailDossier') || 'Dossier & candidature' },
        ]).map(tabItem => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              tab === tabItem.key ? 'text-orange border-orange' : 'text-[#B9BBC8] border-transparent hover:text-white'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* PARCOURS COMPLET — client's brief (dix images de référence): one
          continuous scroll from "le marché en 30 secondes" through
          l'identification de l'entreprise jusqu'au rappel, no tab switch in
          between. Order below matches the reference screenshots: résumé →
          points de vigilance → donneur d'ordre → détails du dossier →
          identification SIRET → fiche entreprise → indice de correspondance
          → coordonnées → dossier prep → suivi/rappel. */}
      {tab === 'main' && (
        <div className="space-y-4">
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
            {opportunity.ai_summary && (
              <p className="text-sm text-white leading-relaxed">{opportunity.ai_summary}</p>
            )}
            {opportunity.description && !opportunity.ai_summary && (
              <p className="text-sm text-[#B9BBC8] leading-relaxed">{opportunity.description}</p>
            )}
            {!opportunity.ai_summary && !opportunity.description && (
              <p className="text-sm text-[#B9BBC8]">{t('detailNoDescription')}</p>
            )}
          </div>

          {/* LE MARCHÉ EN 30 SECONDES — client's dix images (écrans 2-3):
              a 2x2 quick-stats grid, separate from the drier "Détails du
              dossier" list below. Each cell only renders when the
              underlying value is real (estimated_value / start date / a
              stated team size or duration) - never a placeholder. */}
          {(() => {
            const facts = opportunity.ai_extracted_facts;
            const factsPending = !facts;
            const cells: { label: string; value: string }[] = [];
            if (opportunity.estimated_value != null) cells.push({ label: t('quickStatAmount') || 'Montant', value: formatAmount(opportunity.estimated_value, opportunity.currency) });
            if (facts?.team_size_estimate?.available) cells.push({ label: t('quickStatTeam') || 'Équipe', value: facts.team_size_estimate.value });
            if (opportunity.estimated_start_date) cells.push({ label: t('quickStatStart') || 'Démarrage', value: formatDate(opportunity.estimated_start_date) });
            if (facts?.contract_duration?.available) cells.push({ label: t('quickStatDuration') || 'Durée', value: facts.contract_duration.value });
            return (
              <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h2 className="text-sm font-bold text-white">{t('quickStatTitle') || 'Le marché en 30 secondes'}</h2>
                  <span className="shrink-0 text-[10px] font-medium text-white border border-white/25 rounded-full px-2.5 py-1">
                    {isPublic ? (t('detailAccessFree') || 'Accès libre') : (t('detailAccessPartial') || 'Accès partiel')}
                  </span>
                </div>
                {cells.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {cells.map((c, i) => (
                      <div key={i} className="bg-[#031B30] border border-[#17334D] rounded-xl px-3 py-3">
                        <p className="text-sm font-bold text-white leading-tight">{c.value}</p>
                        <p className="text-[10px] text-[#B9BBC8] mt-0.5">{c.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#B9BBC8]">{factsPending ? (t('quickStatPending') || 'Analyse en cours — revenez bientôt pour le détail complet.') : (t('quickStatUnavailable') || 'Peu de détails disponibles pour ce marché.')}</p>
                )}
                {facts?.contract_object?.available && (
                  <div className="mt-3 pt-3 border-t border-[#17334D]">
                    <p className="text-[10px] font-bold text-[#5B6B80] uppercase tracking-wide mb-1">{t('quickStatScope') || 'Travaux à réaliser'}</p>
                    <p className="text-xs text-[#B9BBC8] leading-relaxed">{facts.contract_object.value}</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* POINTS DE VIGILANCE — same "always show the slot" logic as the
              card above: while facts are pending, keep the card visible with
              a pending note rather than have the whole section disappear
              and reappear once the backfill job eventually reaches this
              opportunity (client's ask: same flow on every opportunity). */}
          {(() => {
            const facts = opportunity.ai_extracted_facts;
            const risks = Array.isArray(facts?.key_risks?.value) ? facts.key_risks.value : [];
            if (facts && (!facts.key_risks?.available || risks.length === 0)) return null; // analyzed, genuinely nothing to flag
            return (
              <div className="bg-orange/5 border border-orange/20 rounded-2xl p-5 md:p-6">
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><AlertTriangle size={15} className="text-orange" /> {t('dossierRisksTitle')}</h2>
                {risks.length > 0 ? (
                  <ul className="space-y-2 text-xs text-[#B9BBC8]">
                    {risks.map((risk, i) => {
                      const isStructured = typeof risk === 'object' && risk !== null;
                      const label = isStructured ? risk.label : risk;
                      const severity = isStructured ? risk.severity : null;
                      return (
                        <li key={i} className="flex items-start gap-2">
                          <span className={severity === 'obligatoire' ? 'text-red-400 shrink-0' : 'text-orange shrink-0'}>△</span>
                          <span>
                            {label}
                            {severity === 'obligatoire' && (
                              <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-red-400 bg-red-400/10 border border-red-400/30 rounded-full px-1.5 py-0.5 align-middle">{t('riskMandatory') || 'Obligatoire'}</span>
                            )}
                            {severity === 'recommandee' && (
                              <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-orange bg-orange/10 border border-orange/30 rounded-full px-1.5 py-0.5 align-middle">{t('riskRecommended') || 'Recommandé'}</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-[#B9BBC8]">{t('quickStatPending') || 'Analyse en cours — revenez bientôt pour le détail complet.'}</p>
                )}
              </div>
            );
          })()}

          {/* DONNEUR D'ORDRE — info only here (public markets show it
              outright, private ones show the locked placeholder); the
              actual booking form lives in the "suivi & rappel" block at the
              very end of the journey, matching the reference order. */}
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
            <h2 className="text-sm font-bold text-white mb-3">{t('accessBuyerTitle')}</h2>
            {identityUnlocked ? (
              <div className="flex items-center gap-2 text-sm text-white">
                <ShieldCheck size={15} className="text-green-400 shrink-0" />
                {opportunity.buyer_name || (isPublic ? t('accessPublicBuyer') : t('accessUnlockedGeneric'))}
              </div>
            ) : accessLoading ? (
              <div className="h-5 w-40 bg-[#17334D] rounded animate-pulse" />
            ) : (
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-9 h-9 rounded-full bg-[#31283a] border border-[#5e5266] flex items-center justify-center">
                  <Lock size={16} className="text-[#d3c7dc]" />
                </div>
                <div>
                  <p className="text-sm text-white font-semibold mb-1">{t('accessProtectedTitle')}</p>
                  <p className="text-xs text-[#B9BBC8]">{t('accessProtectedSub')}{opportunity.location_city ? ` · ${opportunity.location_city}` : ''}.</p>
                </div>
              </div>
            )}
          </div>

          {/* DÉTAILS DU DOSSIER — spec section 3.2/3.4: this stays visible on
              every fiche, public or private, even before the buyer's
              identity is unlocked (only buyer_name/contact_email are ever
              redacted, both excluded from this list on purpose since the
              "Donneur d'ordre" card above already owns those). */}
          {opportunity.ai_extracted_facts && (() => {
            const facts = opportunity.ai_extracted_facts;
            const rows: { label: string; value: string }[] = [];
            if (facts.contract_object?.available) rows.push({ label: t('dossierFactObject'), value: facts.contract_object.value });
            if (facts.procedure_type?.available) rows.push({ label: t('dossierFactProcedure'), value: facts.procedure_type.value });
            if (facts.submission_deadline?.available) rows.push({ label: t('dossierFactDeadline'), value: facts.submission_deadline.value });
            if (facts.estimated_value?.available) rows.push({ label: t('dossierFactValue'), value: facts.estimated_value.value });
            if (facts.team_size_estimate?.available) rows.push({ label: t('dossierFactTeam'), value: facts.team_size_estimate.value });
            if (facts.required_qualifications?.available) rows.push({ label: t('dossierFactQualifications'), value: facts.required_qualifications.value });
            if (facts.contract_duration?.available) rows.push({ label: t('dossierFactDuration'), value: facts.contract_duration.value });
            if (facts.submission_method?.available) rows.push({ label: t('dossierFactSubmissionMethod'), value: facts.submission_method.value });
            if (facts.allotment?.available) rows.push({ label: t('dossierFactAllotment'), value: facts.allotment.value });
            if (facts.technical_visit?.available) rows.push({ label: t('dossierFactTechnicalVisit'), value: facts.technical_visit.value });
            if (opportunity.buyer_history_count != null) rows.push({ label: t('dossierFactBuyerHistory'), value: t('dossierBuyerHistoryValue').replace('{n}', String(opportunity.buyer_history_count)) });
            if (Array.isArray(facts.selection_criteria?.value) && facts.selection_criteria.available && facts.selection_criteria.value.length > 0) {
              rows.push({
                label: t('dossierFactCriteria') || 'Critères de notation',
                value: facts.selection_criteria.value
                  .map(c => c.not_specified || c.weight_percent == null ? c.label : `${c.label} ${c.weight_percent} %`)
                  .join(' · '),
              });
            }
            if (rows.length === 0) return null;
            return (
              <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
                <h2 className="text-sm font-bold text-white mb-3">{t('dossierFactsTitle')}</h2>
                <div className="space-y-2.5">
                  {rows.map((r, i) => (
                    <div key={i} className="flex justify-between gap-3 text-xs border-b border-[#17334D] last:border-0 pb-2.5 last:pb-0">
                      <span className="text-[#B9BBC8] shrink-0">{r.label}</span>
                      <span className="text-white text-right">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* IDENTIFICATION / ANALYSE — continues the same "main" scroll right
          after "Détails du dossier" above (client's brief: no tab switch
          between the fiche and the identification/score flow). */}
      {tab === 'main' && (
        !companyKnown && !isAuthenticated ? (
          <div className="space-y-4">
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 w-9 h-9 rounded-full bg-orange/10 border border-orange/30 flex items-center justify-center">
                  <Gauge size={16} className="text-orange" />
                </div>
                <div>
                  <p className="text-sm text-white font-semibold mb-1">{t('siretGateTitle')}</p>
                  <p className="text-xs text-[#B9BBC8]">{t('siretGateSub')}</p>
                </div>
              </div>
              <form onSubmit={handleSiretSubmit} className="flex flex-col gap-2.5">
                <label className="text-[10px] font-bold text-[#5B6B80] uppercase tracking-wide">{t('siretGateLabel')}</label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    value={siretInput}
                    onChange={e => setSiretInput(e.target.value)}
                    placeholder={t('siretPlaceholder')}
                    className="flex-1 bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50 tracking-wide"
                  />
                  <button type="submit" disabled={siretSubmitting} className="flex items-center justify-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50 shrink-0">
                    {siretSubmitting ? <Loader2 size={14} className="animate-spin" /> : null} {t('siretSubmit')}
                  </button>
                </div>
              </form>
              {siretError && <p className="text-xs text-red-400 mt-2">{siretError}</p>}
            </div>
          </div>
        ) : (
          <>
            {siretCompany && (
              <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={15} className="text-green-400 shrink-0" />
                  <p className="text-sm font-bold text-white">{t('siretRecognizedTitle')}{siretCompany.name ? ` — ${siretCompany.name}` : ''}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {siretCompany.legal && <p className="text-[#B9BBC8]">{t('siretLegalForm')} : <span className="text-white">{siretCompany.legal}</span></p>}
                  {siretCompany.created && <p className="text-[#B9BBC8]">{t('siretCreated')} : <span className="text-white">{formatDate(siretCompany.created)}</span></p>}
                  {(siretCompany.address || siretCompany.city) && <p className="text-[#B9BBC8] col-span-2">{t('siretAddress')} : <span className="text-white">{[siretCompany.address, siretCompany.postal, siretCompany.city].filter(Boolean).join(', ')}</span></p>}
                  {siretCompany.employees && <p className="text-[#B9BBC8]">{t('siretEmployees')} : <span className="text-white">{siretCompany.employees}</span></p>}
                  {siretCompany.ape && <p className="text-[#B9BBC8]">{t('siretApe')} : <span className="text-white">{siretCompany.ape}{siretCompany.activity ? ` — ${siretCompany.activity}` : ''}</span></p>}
                </div>
              </div>
            )}
            {/* "Présence détectée" (client reference screens 5-6): digital
                footprint checklist shown right after SIRET recognition,
                before the compatibility score. Backend already resolves
                these fields (routes/siret.ts) - only ever real signals from
                Pappers/INSEE/demo data, never fabricated, so a missing
                signal renders as "Non détecté" rather than being hidden or
                guessed. Layout matches the reference exactly: label + value
                stacked on the left, a single checkmark/cross on the right -
                not a duplicated checkmark-plus-text pill. */}
            {siretCompany && (
              <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 mb-4">
                <h2 className="text-base font-extrabold text-white mb-3">{t('presenceDetectedTitle')}</h2>
                <div className="divide-y divide-[#17334D]">
                  <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center gap-2"><Globe size={14} className="text-[#5B6B80]" /> {t('presenceWebsite')}</p>
                      <p className="text-xs text-[#B9BBC8] mt-0.5">{siretCompany.website || t('presenceNotDetected')}</p>
                    </div>
                    {siretCompany.website ? <CheckCircle2 size={18} className="text-green-400 shrink-0" /> : <XCircle size={18} className="text-[#5B6B80] shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center gap-2"><Facebook size={14} className="text-[#5B6B80]" /> {t('presenceFacebook')}</p>
                      <p className="text-xs text-[#B9BBC8] mt-0.5">{siretCompany.facebook || t('presenceNotDetected')}</p>
                    </div>
                    {siretCompany.facebook ? <CheckCircle2 size={18} className="text-green-400 shrink-0" /> : <XCircle size={18} className="text-[#5B6B80] shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center gap-2"><Star size={14} className="text-[#5B6B80]" /> {t('presenceGoogleReviews')}</p>
                      <p className="text-xs text-[#B9BBC8] mt-0.5">{siretCompany.googleRating ? `${siretCompany.googleRating}/5 · ${siretCompany.googleReviewCount ?? 0} avis` : t('presenceNotDetected')}</p>
                    </div>
                    {siretCompany.googleRating ? <CheckCircle2 size={18} className="text-green-400 shrink-0" /> : <XCircle size={18} className="text-[#5B6B80] shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center gap-2"><BadgeCheck size={14} className="text-[#5B6B80]" /> {t('presenceRge')}</p>
                      <p className="text-xs text-[#B9BBC8] mt-0.5">{siretCompany.certifications?.includes('RGE') ? t('presenceRgeDetected') : t('presenceNotDetected')}</p>
                    </div>
                    {siretCompany.certifications?.includes('RGE') ? <CheckCircle2 size={18} className="text-green-400 shrink-0" /> : <XCircle size={18} className="text-[#5B6B80] shrink-0" />}
                  </div>
                </div>
              </div>
            )}

            {scoreLoading ? (
          <div className="flex items-center justify-center py-16 text-[#B9BBC8] text-sm gap-2"><Loader2 size={18} className="animate-spin" /> {t('scoreCalculating')}</div>
        ) : scoreError ? (
          <div className="bg-[#061D32] border border-red-500/30 rounded-2xl p-4 text-xs text-red-400">{scoreError}</div>
        ) : matchScore ? (
          <div className="space-y-4">
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
              {/* Score badge — client reference flow, screen 3: green-tinted
                  card, "Compatibilité avec cette opportunité" caption, the
                  tiered matchLabel ("Très pertinent" etc.) in bold green
                  with a small orange dot, and the raw percentage large on
                  the right. matchLabel/score are both server-computed
                  (matchScoreService.ts) - never independently derived here. */}
              <div className="bg-green-400/10 border border-green-400/25 rounded-xl p-4 flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-[11px] text-[#B9BBC8] mb-1">{t('scoreCardCaption') || 'Compatibilité avec cette opportunité'}</p>
                  <p className="text-base font-extrabold text-green-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange shrink-0" /> {matchScore.matchLabel}
                  </p>
                </div>
                <p className="text-3xl font-extrabold text-white shrink-0">{matchScore.score}%</p>
              </div>
              <p className="text-xs text-[#B9BBC8]">{matchScore.scoreNote}</p>
              {/* Fixed disclaimer (client's exact wording): this is never
                  an odds-of-winning estimate, only a fit measurement. */}
              <p className="text-[11px] text-[#5B6B80] leading-relaxed mt-3 mb-3">{matchScore.scoreDisclaimer}</p>
              <p className="text-xs text-[#B9BBC8] leading-relaxed pt-3 border-t border-[#17334D]">{matchScore.whyRespond}</p>
              {matchScore.warning && (
                <div className="flex items-start gap-2 mt-3 p-3 bg-orange/5 border border-orange/20 rounded-xl text-xs text-[#B9BBC8]">
                  <AlertTriangle size={14} className="text-orange shrink-0 mt-0.5" /> {matchScore.warning}
                </div>
              )}
            </div>

            {matchScore.positiveFactors.length > 0 && (
              <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Gauge size={15} className="text-orange" /> {t('scoreCompatibilityFactors')}</h2>
                <div className="space-y-2">
                  {matchScore.positiveFactors.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[#B9BBC8]">{f.label}</span>
                      <span className="text-white font-semibold">+{f.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(isAuthenticated || leadCaptured) ? (
              <>
                {justUnlockedAnalysis && (
                  <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/5 border border-green-400/20 rounded-xl px-3 py-2.5">
                    <CheckCircle2 size={14} className="shrink-0" /> {t('leadUnlockedBanner') || 'Informations supplémentaires débloquées'}
                  </div>
                )}

                <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-white mb-3">{t('scoreCriteriaWeight')}</h2>
                  <div className="space-y-2.5">
                    {matchScore.criteria.map((c, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[#B9BBC8]">{c.label}</span>
                          <span className="text-white font-semibold">{c.weight}%</span>
                        </div>
                        <div className="h-1.5 bg-[#031B30] rounded-full overflow-hidden">
                          <div className="h-full bg-orange rounded-full" style={{ width: `${c.weight}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {matchScore.eligibility.length > 0 && (
                  <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
                    <h2 className="text-sm font-bold text-white mb-3">{t('scoreEligibilityDocs')}</h2>
                    <div className="space-y-2.5">
                      {matchScore.eligibility.map((el, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs">
                          {el.met === true ? <CheckCircle2 size={15} className="text-green-400 shrink-0 mt-0.5" />
                            : el.met === false ? <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                            : <HelpCircle size={15} className="text-[#5B6B80] shrink-0 mt-0.5" />}
                          <div>
                            <p className="text-white font-semibold">{el.label}</p>
                            <p className="text-[#B9BBC8]">{el.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!isAuthenticated && (
                      <p className="text-[11px] text-[#5B6B80] mt-3 pt-3 border-t border-[#17334D]">{t('scoreLoginToCheck')}</p>
                    )}
                  </div>
                )}

                <RefineAnalysisAccordion t={t} />

                {/* Client's newest brief: "Votre candidature peut déjà commencer" -
                    a single new screen/block inserted after the full analysis,
                    reusing real signals already on this page rather than
                    fabricating readiness. DC1/DC2/DUME/mémoire technique/prix
                    are never marked ready here - no free draft-generation
                    pipeline runs pre-payment, and the client's rule is explicit
                    ("aucune information inventée... aucun document présenté
                    comme définitif sans vérification"). */}
                <DossierPrepBlock
                  t={t}
                  siretCompany={siretCompany}
                  matchScore={matchScore}
                  checklistDocs={checklistDocs}
                  checklistRefCount={checklistRefCount}
                  onContactManager={() => setShowAccountManagerModal(true)}
                />
              </>
            ) : (
              // Phone+email gate (client's newest brief, Écran 7): the
              // visitor has already seen the score + why-it-matches above
              // (the value obtained), coordinates are requested only now,
              // before the fuller breakdown - never before.
              <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
                <p className="text-base font-extrabold text-white mb-1">{t('leadGateTitle')}</p>
                <p className="text-xs text-[#B9BBC8] mb-4">{t('leadGateSub')}</p>
                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#5B6B80] uppercase tracking-wide mb-1 block">{t('leadPhoneLabel')}</label>
                    <input
                      value={leadPhone}
                      onChange={e => setLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                      placeholder="06 12 34 56 78"
                      className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#5B6B80] uppercase tracking-wide mb-1 block">{t('leadEmailLabel')}</label>
                    <input
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      type="email"
                      placeholder="vous@entreprise.fr"
                      className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50"
                    />
                  </div>
                  {leadError && <p className="text-xs text-red-400">{leadError}</p>}
                  <button type="submit" disabled={leadSubmitting} className="w-full flex items-center justify-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-3 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50">
                    {leadSubmitting ? <Loader2 size={14} className="animate-spin" /> : null} {t('leadSubmit')}
                  </button>
                </form>
              </div>
            )}
          </div>
            ) : null}
          </>
        )
      )}

      {/* SUIVI & RAPPEL — last block of the continuous journey (client's
          reference: "Opportunité enregistrée" then "Comment souhaitez-vous
          continuer ?"). Kept reachable regardless of SIRET/lead state so a
          visitor who skips identification can still book a callback; for a
          private tender/sous-traitance this is also what unlocks the
          "Donneur d'ordre" name shown further up the page. */}
      {tab === 'main' && (
        <div className="space-y-4 mt-4">
          <div className="bg-green-400/10 border border-green-400/30 rounded-2xl p-5 md:p-6">
            <p className="flex items-center gap-2 text-xs font-semibold text-green-400 mb-1"><CheckCircle2 size={14} /> {t('followUpSaved') || 'Opportunité enregistrée'}</p>
            <h2 className="text-base font-extrabold text-white">{t('followUpSavedSub') || 'Elle apparaît maintenant dans votre tableau de bord'}</h2>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
            <h2 className="text-sm font-bold text-white mb-1">{t('accessHowToContinue')}</h2>
            <p className="text-xs text-[#B9BBC8] mb-4">
              {t('followUpOptionalNote') || "Le rendez-vous ou le rappel sont facultatifs à ce stade. Vous pouvez continuer sans contact et y revenir au moment de votre demande."}
            </p>

            {contactChoice === null && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setContactChoice('slot')}
                  className="w-full text-left bg-[#031B30] border border-[#17334D] hover:border-orange/50 rounded-xl px-4 py-3 transition-colors"
                >
                  <p className="text-sm font-semibold text-white">{t('followUpChoiceSlotTitle') || "Choisir un créneau d'appel"}</p>
                  <p className="text-xs text-[#B9BBC8] mt-0.5">{t('followUpChoiceSlotSub') || 'Réserver un échange commercial avec Marchés Direct.'}</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setContactChoice('callback'); handleCallback(); }}
                  className="w-full text-left bg-[#031B30] border border-[#17334D] hover:border-orange/50 rounded-xl px-4 py-3 transition-colors"
                >
                  <p className="text-sm font-semibold text-white">{t('accessCallbackNoSlot')}</p>
                  <p className="text-xs text-[#B9BBC8] mt-0.5">{t('followUpChoiceCallbackSub') || 'Nous vous recontactons plus tard.'}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setContactChoice('none')}
                  className="w-full text-left bg-[#031B30] border border-[#17334D] hover:border-orange/50 rounded-xl px-4 py-3 transition-colors"
                >
                  <p className="text-sm font-semibold text-white">{t('followUpChoiceNoneTitle') || 'Continuer sans rendez-vous pour le moment'}</p>
                  <p className="text-xs text-[#B9BBC8] mt-0.5">{t('followUpChoiceNoneSub') || 'Vous pourrez demander un échange plus tard si nécessaire, notamment pour finaliser le dossier technique.'}</p>
                </button>
              </div>
            )}

            {contactChoice === 'slot' && !selectedSlot && (
              <div className="grid grid-cols-2 gap-2">
                {CALLBACK_SLOTS.map(slotLabel => (
                  <button
                    key={slotLabel}
                    type="button"
                    disabled={!!slotSubmitting}
                    onClick={() => handleBookSlot(slotLabel)}
                    className="min-h-[46px] text-xs font-semibold rounded-xl border border-[#5b6d7d] text-white hover:border-orange/50 px-2 transition-colors disabled:opacity-50"
                  >
                    {slotSubmitting === 'slot' ? <Loader2 size={13} className="animate-spin mx-auto" /> : slotLabel}
                  </button>
                ))}
              </div>
            )}

            {contactChoice === 'slot' && selectedSlot && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/5 border border-green-400/20 rounded-xl px-3 py-2.5">
                <CheckCircle2 size={14} className="shrink-0" /> {t('followUpSlotConfirmed') || 'Créneau réservé — le suivi reste accessible normalement.'}
              </div>
            )}

            {contactChoice === 'callback' && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/5 border border-green-400/20 rounded-xl px-3 py-2.5">
                <CheckCircle2 size={14} className="shrink-0" /> {slotSubmitting === 'callback' ? <Loader2 size={13} className="animate-spin" /> : (t('accessCallbackConfirmed') || 'Rappel demandé')}
              </div>
            )}

            {contactChoice === 'none' && (
              <p className="text-xs text-[#B9BBC8]">{t('followUpChoiceNoneConfirmed') || 'Le suivi reste accessible normalement, sans rendez-vous ni rappel.'}</p>
            )}

            {slotError && <p className="text-xs text-red-400 mt-3">{slotError}</p>}
          </div>

          {contactChoice !== null && !quickPasswordDismissed && (!isAuthenticated || quickPasswordDone) && (
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
              {quickPasswordDone ? (
                <div className="flex items-center gap-2 text-sm text-white">
                  <ShieldCheck size={15} className="text-green-400 shrink-0" />
                  {t('quickPasswordSecuredSpace') || 'Espace sécurisé'} — {slotForm.email}
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-orange/10 border border-orange/30 flex items-center justify-center">
                      <KeyRound size={16} className="text-orange" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-orange uppercase tracking-wide block mb-1">{t('quickPasswordEyebrow') || 'Facultatif'}</span>
                      <p className="text-sm text-white font-semibold mb-1">{t('quickPasswordHeading') || 'Retrouvez votre espace partout'}</p>
                      <p className="text-xs text-[#B9BBC8]">{t('quickPasswordSub') || 'Retrouvez cette opportunité et vos rendez-vous depuis votre tableau de bord.'}</p>
                    </div>
                  </div>
                  <form onSubmit={handleQuickPassword} className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={quickPassword}
                      onChange={e => setQuickPassword(e.target.value)}
                      placeholder={t('quickPasswordPlaceholder') || 'Mot de passe (8 caractères min.)'}
                      className="flex-1 bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50"
                    />
                    <button type="submit" disabled={quickPasswordSubmitting} className="flex items-center justify-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50 shrink-0">
                      {quickPasswordSubmitting ? <Loader2 size={14} className="animate-spin" /> : null} {t('quickPasswordSubmit') || 'Créer mon mot de passe'}
                    </button>
                  </form>
                  {quickPasswordError && <p className="text-xs text-red-400 mt-2">{quickPasswordError}</p>}
                  <button type="button" onClick={() => setQuickPasswordDismissed(true)} className="text-xs text-[#B9BBC8] hover:text-white underline mt-3">
                    {t('quickPasswordLater') || 'Plus tard'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* DOSSIER & CANDIDATURE TAB */}
      {tab === 'dossier' && (
        !isAuthenticated ? (
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 text-center">
            <p className="text-sm text-white font-semibold mb-1">{t('dossierAnalysisTitle')}</p>
            <p className="text-xs text-[#B9BBC8] mb-4">{t('dossierLoginRequired')}</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Link to="/connexion" state={{ from: `/opportunites/${id}` }} className="inline-flex items-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors">
                <LogIn size={14} /> {t('loginButton')}
              </Link>
              <Link to="/inscription" state={{ from: `/opportunites/${id}` }} className="inline-flex items-center gap-2 border border-[#17334D] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:border-orange/50 transition-colors">
                {t('signupCreateProfile')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Spec 3.7: dossier entreprise checklist - always addable, not
                behind the subscription gate below. */}
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-3">{t('checklistTitle')}</h2>
              {checklistLoading ? (
                <div className="h-16 bg-[#17334D]/40 rounded-lg animate-pulse" />
              ) : (
                <div className="space-y-2">
                  {CHECKLIST_DOCS.map(item => {
                    const done = checklistDocs.some(d => d.document_type === item.type);
                    return (
                      <div key={item.type} className="flex items-center justify-between gap-3 text-xs border-b border-[#17334D] last:border-0 pb-2.5 last:pb-0">
                        <span className="text-[#B9BBC8]">{t(item.labelKey)}</span>
                        {done ? (
                          <span className="flex items-center gap-1 text-green-400 font-semibold shrink-0"><CheckCircle2 size={13} /> {t('checklistAdded')}</span>
                        ) : (
                          <Link to="/profil/dossier-entreprise" className="text-orange font-semibold hover:underline shrink-0">{t('checklistAdd')}</Link>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between gap-3 text-xs border-b border-[#17334D] last:border-0 pb-2.5 last:pb-0">
                    <span className="text-[#B9BBC8]">{t('checklistQualification')}</span>
                    {checklistCertCount > 0 ? (
                      <span className="flex items-center gap-1 text-green-400 font-semibold shrink-0"><CheckCircle2 size={13} /> {t('checklistAdded')}</span>
                    ) : (
                      <Link to="/profil/dossier-entreprise" className="text-orange font-semibold hover:underline shrink-0">{t('checklistAdd')}</Link>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#B9BBC8]">{t('checklistReferences')}</span>
                    {checklistRefCount > 0 ? (
                      <span className="flex items-center gap-1 text-green-400 font-semibold shrink-0"><CheckCircle2 size={13} /> {t('checklistAdded')}</span>
                    ) : (
                      <Link to="/profil/dossier-entreprise" className="text-orange font-semibold hover:underline shrink-0">{t('checklistAdd')}</Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* DCE - Dossier de consultation (écran 8): the buyer's raw
                published documents, grouped by type. Public info once the
                notice exists - shown regardless of subscription status. */}
            {dceDocuments.length > 0 && (
              <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1"><FileText size={15} className="text-orange" /> DCE — Dossier de consultation</h2>
                <p className="text-xs text-[#B9BBC8] mb-3">Consulter les documents sources publiés par l'acheteur.</p>
                <div className="space-y-2 mb-3">
                  {Object.entries(
                    dceDocuments.reduce<Record<string, ApiTenderDocument[]>>((groups, d) => {
                      const key = d.document_label || 'Autre';
                      (groups[key] ||= []).push(d);
                      return groups;
                    }, {})
                  ).map(([label, docs]) => (
                    <div key={label} className="flex items-center justify-between gap-3 text-xs border-b border-[#17334D] last:border-0 pb-2 last:pb-0">
                      <span className="text-white font-semibold">{DCE_LABEL_NAMES[label] || label}</span>
                      <span className="text-[#B9BBC8]">{docs.length > 1 ? `${docs.length} fichiers` : docs[0].mime_type?.includes('pdf') ? 'PDF' : 'fichier'}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setDceDocsExpanded(v => !v)} className="text-xs font-semibold text-orange hover:underline">
                  {dceDocsExpanded ? 'Réduire' : `Voir les ${dceDocuments.length} documents du DCE`}
                </button>
                {dceDocsExpanded && (
                  <div className="mt-3 space-y-1.5">
                    {dceDocuments.map(doc => (
                      <a
                        key={doc.id}
                        href={doc.status === 'downloaded' || doc.status === 'parsed' ? doc.source_url : undefined}
                        target="_blank" rel="noreferrer"
                        className={`flex items-center justify-between gap-2 text-[11px] px-2.5 py-2 rounded-lg border border-[#17334D] ${doc.status === 'failed' ? 'opacity-50' : 'hover:border-orange/50'} transition-colors`}
                      >
                        <span className="text-white truncate">{DCE_LABEL_NAMES[doc.document_label || 'Autre'] || doc.document_label || 'Document'}</span>
                        {doc.status === 'failed' ? (
                          <span className="text-red-400 shrink-0">Indisponible</span>
                        ) : (
                          <Download size={12} className="text-orange shrink-0" />
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isPaid ? (
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-9 h-9 rounded-full bg-orange/10 border border-orange/30 flex items-center justify-center">
                <Lock size={16} className="text-orange" />
              </div>
              <div>
                <p className="text-sm text-white font-semibold mb-1">{t('dossierLockedTitle')}</p>
                <p className="text-xs text-[#B9BBC8]">{t('dossierLockedSub')}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><FileText size={13} className="text-orange/70" /> {t('dossierFeature1')}</div>
              <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><Sparkles size={13} className="text-orange/70" /> {t('dossierFeature2')}</div>
              <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><CheckCircle2 size={13} className="text-orange/70" /> {t('dossierFeature3')}</div>
            </div>
            <button
              type="button"
              onClick={() => setShowAccountManagerModal(true)}
              className="inline-flex items-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors"
            >
              <PhoneCall size={14} /> {t('pricingViewPlans')}
            </button>
          </div>
        ) : dceLoading ? (
          <div className="flex items-center justify-center py-10 text-[#B9BBC8] text-sm gap-2"><Loader2 size={18} className="animate-spin" /> {t('dossierLoading')}</div>
        ) : (
          <div className="space-y-4">
            {/* DCE analysis */}
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><FileText size={15} className="text-orange" /> {t('dossierDCEAnalysis')}</h2>
                {tender?.dce_analysis_status !== 'analyzed' && (
                  <button onClick={handleAnalyze} disabled={analyzing} className="flex items-center gap-1.5 text-xs text-orange border border-orange px-3 py-1.5 rounded-lg hover:bg-orange/10 transition-colors disabled:opacity-40">
                    {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {t('dossierAnalyzeDCE')}
                  </button>
                )}
              </div>
              {tender?.dce_analysis_status === 'analyzed' ? (
                <div className="space-y-2 text-xs text-[#B9BBC8]">
                  {tender.complexity_assessment && <p>{t('dossierComplexity')} : <span className="text-white font-semibold">{tender.complexity_assessment}</span></p>}
                  {tender.estimated_effort_hours != null && <p>{t('dossierEstimatedEffort')} : <span className="text-white font-semibold">{tender.estimated_effort_hours} h</span></p>}
                  {tender.required_documents && tender.required_documents.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[#B9BBC8] mb-1">{t('dossierRequiredDocs')}</p>
                      <ul className="list-disc list-inside space-y-0.5 text-white">
                        {tender.required_documents.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#B9BBC8]">{tender?.dce_analysis_status === 'processing' ? t('dossierProcessing') : t('dossierNotAnalyzed')}</p>
              )}
            </div>

            {/* Bid package */}
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><FileText size={15} className="text-orange" /> {t('dossierBidPackage')}</h2>

              {bid?.missing_documents && bid.missing_documents.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-orange/5 border border-orange/20 rounded-xl text-xs text-brand-muted mb-3">
                  <AlertTriangle size={14} className="text-orange shrink-0 mt-0.5" />
                  <span>
                    {t('dossierMissingDocs')} : {bid.missing_documents.map(d => DOC_LABELS[d] || d).join(', ')}.{' '}
                    <Link to="/profil/dossier-entreprise" className="text-orange font-semibold hover:underline">{t('dossierAddDocs')}</Link>
                  </span>
                </div>
              )}
              {bid?.technical_memo_text && (
                <div className="flex items-center gap-2 text-xs text-green-400 mb-3"><CheckCircle2 size={14} /> {t('dossierDocsGenerated')}</div>
              )}

              <div className="flex flex-wrap gap-2">
                <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1.5 text-xs text-white bg-[#031B30] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors disabled:opacity-40">
                  {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} {t('dossierGenerateDocs')}
                </button>
                <Link to={`/opportunites/${id}/candidature`} className="flex items-center gap-1.5 text-xs text-white bg-orange px-3 py-2 rounded-lg hover:bg-orange/90 transition-colors">
                  <FileText size={13} /> {bid?.technical_memo_text ? t('dossierReviewValidate') : t('dossierManageBid')}
                </Link>
              </div>
            </div>

            {dceError && <p className="text-xs text-red-400">{dceError}</p>}
          </div>
        )}
          </div>
        )
      )}

      <AppointmentModal open={showAccountManagerModal} onClose={() => setShowAccountManagerModal(false)} />
    </div>
  );
}

type DossierPrepItem = { label: string; ready: boolean; readyText: string; pendingText: string };

function DossierPrepBlock({
  t, siretCompany, matchScore, checklistDocs, checklistRefCount, onContactManager,
}: {
  t: (key: string) => string;
  siretCompany: ApiSiretCompany | null;
  matchScore: ApiMatchScore | null;
  checklistDocs: ApiCompanyDocument[];
  checklistRefCount: number;
  onContactManager: () => void;
}) {
  const hasDoc = (type: string) => checklistDocs.some(d => d.document_type === type);

  const items: DossierPrepItem[] = [
    { label: t('prepIdentity') || "Identité de l'entreprise", ready: !!siretCompany?.name, readyText: t('prepPrefilled') || 'Préremplie', pendingText: t('prepToIdentify') || 'À identifier' },
    { label: t('prepPresentation') || "Présentation de l'entreprise", ready: !!siretCompany?.activity, readyText: t('prepPrepared') || 'Préparée', pendingText: t('prepToComplete') || 'À compléter' },
    { label: t('prepRequirements') || 'Exigences du marché', ready: !!matchScore, readyText: t('prepAnalyzed') || 'Analysées', pendingText: t('prepToAnalyze') || 'À analyser' },
    { label: t('prepKbis') || 'Extrait KBIS', ready: hasDoc('kbis'), readyText: t('checklistAdded') || 'Ajouté', pendingText: t('checklistAdd') || 'À ajouter' },
    { label: t('prepInsurance') || 'Assurance décennale', ready: hasDoc('insurance'), readyText: t('checklistAdded') || 'Ajouté', pendingText: t('checklistAdd') || 'À ajouter' },
    { label: t('prepReferences') || 'Références similaires', ready: checklistRefCount > 0, readyText: t('checklistAdded') || 'Ajouté', pendingText: t('prepToComplete') || 'À compléter' },
    // Never marked ready here: no free draft-generation runs before a
    // chargé d'affaires is involved (client's explicit rule against
    // inventing documents or auto-picking a price).
    { label: t('prepDc1') || 'Brouillon DC1', ready: false, readyText: '', pendingText: t('prepWithManager') || 'À préparer avec un chargé d\'affaires' },
    { label: t('prepDc2') || 'Brouillon DC2', ready: false, readyText: '', pendingText: t('prepWithManager') || 'À préparer avec un chargé d\'affaires' },
    { label: t('prepMemo') || 'Trame du mémoire technique', ready: false, readyText: '', pendingText: t('prepWithManager') || 'À préparer avec un chargé d\'affaires' },
    { label: t('prepPrice') || "Prix de l'offre", ready: false, readyText: '', pendingText: t('prepToValidate') || 'À valider' },
  ];
  const readyCount = items.filter(i => i.ready).length;

  return (
    <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
      <h2 className="text-sm font-bold text-white mb-1">{t('prepTitle') || 'Votre candidature peut déjà commencer'}</h2>
      <p className="text-xs text-orange font-semibold mb-4">
        {(t('prepSummary') || '{ready} éléments déjà préparés — {pending} informations à compléter')
          .replace('{ready}', String(readyCount)).replace('{pending}', String(items.length - readyCount))}
      </p>
      <div className="space-y-2 mb-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-xs border-b border-[#17334D] last:border-0 pb-2.5 last:pb-0">
            <span className="text-[#B9BBC8]">{item.label}</span>
            {item.ready ? (
              <span className="flex items-center gap-1 text-green-400 font-semibold shrink-0"><CheckCircle2 size={13} /> {item.readyText}</span>
            ) : (
              <span className="text-[#5B6B80] shrink-0">{item.pendingText}</span>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onContactManager}
        className="w-full flex items-center justify-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors"
      >
        <PhoneCall size={14} /> {t('prepCta') || 'Finaliser ce dossier avec un chargé d\'affaires'}
      </button>
      <p className="text-[11px] text-[#5B6B80] text-center mt-2.5">{t('prepPromise') || 'Aucun dossier lancé sans votre accord.'}</p>
    </div>
  );
}

// "Affinez votre analyse" (prototype V17, section 3.4) - an optional,
// collapsed-by-default refinement block. Three questions, each its own
// sub-accordion, each answered with Oui / Non / Je ne sais pas buttons only
// - the spec is explicit that there's no free-text field here. Purely local
// UI state: the spec describes the interaction, not a backend contract for
// storing the answers, so nothing is invented server-side for this.
type RefineAnswer = 'oui' | 'non' | 'nsp' | null;

function RefineAnalysisAccordion({ t }: { t: (key: string) => string }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, RefineAnswer>>({ q1: null, q2: null, q3: null });
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const questions = [
    { key: 'q1', label: t('refineQ1') || 'Disposez-vous de la qualification professionnelle requise ?' },
    { key: 'q2', label: t('refineQ2') || 'Avez-vous une référence récente sur un chantier comparable ?' },
    { key: 'q3', label: t('refineQ3') || "Pouvez-vous mobiliser l'équipe nécessaire sur ce délai ?" },
  ];

  return (
    <div className="bg-[#061D32] border border-[#17334D] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div>
          <h2 className="text-sm font-bold text-white">{t('refineTitle') || 'Affinez votre analyse'}</h2>
          <p className="text-[11px] text-[#B9BBC8] mt-0.5">{t('refineOptional') || 'Optionnel · 3 questions'}</p>
        </div>
        <ChevronDown size={16} className={`text-[#B9BBC8] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-2">
          {questions.map(q => (
            <div key={q.key} className="border border-[#17334D] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedQ(cur => (cur === q.key ? null : q.key))}
                className="w-full flex items-center justify-between p-3 text-left bg-[#031B30]"
              >
                <span className="text-xs text-white font-medium pr-2">{q.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {answers[q.key] && (
                    <span className="text-[10px] font-semibold text-orange uppercase">
                      {answers[q.key] === 'oui' ? (t('refineYes') || 'Oui') : answers[q.key] === 'non' ? (t('refineNo') || 'Non') : (t('refineUnsure') || 'Je ne sais pas')}
                    </span>
                  )}
                  <ChevronDown size={13} className={`text-[#5B6B80] transition-transform ${expandedQ === q.key ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {expandedQ === q.key && (
                <div className="flex gap-2 p-3 bg-[#061D32]">
                  {(['oui', 'non', 'nsp'] as const).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAnswers(a => ({ ...a, [q.key]: val }))}
                      className={`flex-1 text-xs font-semibold rounded-lg py-2 border transition-colors ${answers[q.key] === val ? 'border-orange bg-orange/10 text-white' : 'border-[#5b6d7d] text-white hover:border-orange/50'}`}
                    >
                      {val === 'oui' ? (t('refineYes') || 'Oui') : val === 'non' ? (t('refineNo') || 'Non') : (t('refineUnsure') || 'Je ne sais pas')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}