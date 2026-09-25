import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Euro, Loader2, FileText, AlertTriangle,
  CheckCircle2, XCircle, HelpCircle, Lock, Gauge, Landmark, Briefcase, Handshake, ShieldCheck, PhoneCall,
  ChevronDown, ChevronRight, Globe, Facebook, Star, BadgeCheck, Download, ExternalLink, Clock3,
  Building2, Users, TrendingUp, Pencil, Award, User, ThumbsUp, Info, Search, Copy, Send,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { SaveButton } from '@/components/SaveButton';
import { AppointmentModal } from '@/components/AppointmentModal';
import PageMeta from '@/components/common/PageMeta';
import { trackVisitorEvent, getSessionId, getConsultationsToday } from '@/lib/visitorTracking';
import {
  opportunitiesApi, tendersApi, companyVaultApi, favoritesApi, getApiErrorMessage,
  dossiersApi, siretApi,
  type ApiOpportunityDetail, type ApiTender, type ApiBidResponse, type ApiTenderDocument,
  type ApiOpportunityAccess, type ApiMatchScore, type ApiCompanyDocument, type ApiSiretCompany,
  type ApiDossierRequest,
} from '@/lib/apiClient';
import { stripMarkdownArtifacts, humanizeRawLabel } from '@/lib/utils';
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
// 25 Sep client audit: the header showed just the date while the dossier
// detail row's free text stated a submission time ("11h00"), reading as a
// mismatch. deadline_time is the same time, derived server-side from that
// same fact (utils/officialFields.ts) - appended here so both blocks agree.
function formatDeadlineWithTime(deadline: string | null, deadlineTime?: string | null) {
  const date = formatDate(deadline);
  return deadlineTime ? `${date} à ${deadlineTime}` : date;
}
// Client's report: the AI-extracted "submission_deadline" fact sometimes
// comes back as a raw JS/ISO timestamp (e.g. "Thu Dec 12 2025 00:00:00
// GMT+0000 (Coordinated Universal Time)" or "2025-12-12T00:00:00.000Z")
// instead of natural-language text, showing an English date format with a
// long GMT timezone mention. When the value looks like one of those raw
// timestamps, render it as a plain French date instead; genuine free-text
// extractions from the source document are left untouched.
function formatFactDeadline(value: string) {
  const looksLikeRawTimestamp = /^\d{4}-\d{2}-\d{2}T|GMT|^[A-Za-z]{3} [A-Za-z]{3} \d{1,2} \d{4}/.test(value);
  if (!looksLikeRawTimestamp) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Client's audit (15 Sep): "Remplacer les libellés bruts comme APPEL_OFFRE
// par des intitulés lisibles." Handled centrally by humanizeRawLabel in
// lib/utils.ts (already applied to procedure_type/submission_method below) -
// AI extraction is deliberately literal about source text, and BOAMP/DECP
// notices themselves carry these as raw ALL_CAPS_WITH_UNDERSCORES codes.

// Client's 12 Sep report: the dossier hub's "Vos opportunités enregistrées"
// selector showed full opportunity titles as option text, running 3-4 lines
// on a real (long) BOAMP title. Asked for one line: shortened title, plus
// city or amount if there's room. Native <select><option> text can't be
// CSS-truncated cross-browser, so the label itself has to be short -
// truncates the title and appends city (preferred, shorter) or a formatted
// amount, whichever fits under the length budget.
function compactOpportunityLabel(title: string, city: string | null, value: number | null): string {
  const suffix = city || (value ? `${Math.round(value / 1000)} k€` : null);
  const titleBudget = suffix ? 42 : 52;
  const shortTitle = title.length > titleBudget ? `${title.slice(0, titleBudget - 1).trimEnd()}…` : title;
  return suffix ? `${shortTitle} — ${suffix}` : shortTitle;
}
// Client's follow-up (11 Sep, dossier-demo message): the red dot on the two
// social-proof cards must scale in size with the number it's next to
// ("dont la taille augmente ou diminue selon les données affichées") - not
// a fixed dot. Maps each counter's known range to a px size range; kept as
// a plain linear map since the client described this as already
// calculated/fixed, not something to make configurable.
function socialProofDotSizePx(value: number, min: number, max: number, minPx: number, maxPx: number): number {
  if (max === min) return (minPx + maxPx) / 2;
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return Math.round(minPx + t * (maxPx - minPx));
}
// Client's brief (5 Sep, "Votre concordance" page): "l'ancienneté calculée
// automatiquement" - derived from the company's creation date, never a
// separate field to fetch/store.
function formatSeniority(created: string | null): string | null {
  if (!created) return null;
  const years = Math.floor((Date.now() - new Date(created).getTime()) / (365.25 * 24 * 3600 * 1000));
  if (years < 0) return null;
  if (years < 1) return 'Moins d\'un an';
  if (years > 10) return 'Plus de 10 ans';
  return `${years} an${years > 1 ? 's' : ''}`;
}
// Client's ask #4: many BOAMP notices have `description` identical to
// `title` in the raw data (the source only ever gave one line of text).
// Falling back to description when there's no AI summary then just
// repeated the title verbatim under "Résumé" - detect and treat that as
// "no real description" instead, so the block hides/shows the empty-state
// message rather than reproducing the title.
// Matches the backend's hasAnalysisContent() (routes/opportunities.ts) -
// an ai_analysis_sections object can exist but have all 3 fields blank
// (the coercion in generateOpportunityAnalysisSections falls back to '' per
// key rather than throwing on a partial/edge-case response). Checking the
// object is merely non-null treated that shape as "generated": it rendered
// <OpportunityAnalysisAccordions>, whose own empty-items filter then
// returned null - nothing shown where the ai_summary paragraph used to be,
// instead of falling back to it.
function hasAnalysisContent(sections: { presentation: string; conditions: string; entreprises: string } | null | undefined): boolean {
  if (!sections) return false;
  return Boolean(sections.presentation?.trim() || sections.conditions?.trim() || sections.entreprises?.trim());
}

function isRedundantWithTitle(text: string | null | undefined, title: string | null | undefined): boolean {
  if (!text || !title) return false;
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalize(text) === normalize(title);
}

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

// Placeholder near-term slots, matching the client's prototype (e.g.
// "Aujourd'hui · 17h30"). Not backed by a real staff calendar yet.
const CALLBACK_SLOTS = ["Aujourd'hui · 17h30", "Demain · 08h30", "Demain · 14h00", 'Après-demain · 10h00'];

// Which opportunities THIS visitor has actually identified a company for,
// scoped per-opportunity-id rather than relying on CompanyKnownContext's
// `companyKnown` alone. `companyKnown` is session-wide and, once true from
// looking up a company on any single opportunity, stays true forever for
// every other opportunity the visitor opens in that browser - which is why
// the "3 pages" journey used to collapse to 2: page 1 (the opportunity
// itself) was being skipped on every new listing because a company from a
// completely unrelated earlier listing was still "known". Recording the
// confirmation per opportunity id keeps the (desired, client-requested)
// behaviour of not losing the selected company on back/refresh within the
// *same* opportunity, without that leaking into every other one.
const CONFIRMED_OPPS_KEY = 'md_confirmed_opportunities';
function getConfirmedOpportunities(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CONFIRMED_OPPS_KEY) || '{}'); } catch { return {}; }
}
function isOpportunityConfirmed(oppId: string | undefined): boolean {
  if (!oppId) return false;
  return !!getConfirmedOpportunities()[oppId];
}
function markOpportunityConfirmed(oppId: string | undefined, siret: string | null | undefined) {
  if (!oppId) return;
  try {
    const map = getConfirmedOpportunities();
    map[oppId] = siret || 'confirmed';
    localStorage.setItem(CONFIRMED_OPPS_KEY, JSON.stringify(map));
  } catch {
    // Storage blocked - worst case the visitor re-lands on screen 1 next
    // time, which is the safe direction to fail in.
  }
}

export default function OpportunityDetailPage() {
  const { t } = useLang();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, company, user, completeSignup } = useAuth();
  const { company: anonSiretCompany, candidates, lookup: lookupSiret, confirm: confirmCandidate, leadCaptured, leadPhone: contextLeadPhone, leadEmail: contextLeadEmail, phoneVerified, captureLead, confirmPhoneVerified } = useCompanyKnown();

  // The company card (below) and the "Dossier prep" checklist both key off
  // `siretCompany`, but that comes from CompanyKnownContext, which only ever
  // holds an ANONYMOUS session's Pappers/INSEE lookup (siret_lookups, keyed
  // by session_id). A logged-in visitor's own company profile lives in
  // `companies` (via useAuth()) instead, and if they never personally ran
  // the anonymous SIRET flow in this browser (e.g. different device, or
  // cleared storage after signing up), `anonSiretCompany` is null and the
  // whole card used to disappear even though they ARE identified. Falling
  // back to their account's own company here - mapped into the same shape,
  // with whatever `companies` doesn't store left null so the existing
  // "non disponible" placeholders take over rather than showing anything
  // invented - fixes that gap without changing what an anonymous visitor sees.
  const siretCompany: ApiSiretCompany | null = anonSiretCompany || (isAuthenticated && company ? {
    name: company.name || null,
    legal: company.legal_form || null,
    // Only the founding YEAR is stored on `companies`, not a real creation
    // date - fabricating "1 janvier {year}" would show a false-precision
    // date the client's rule explicitly forbids ("ne jamais afficher une
    // valeur incorrecte"), so this stays null and the existing "non
    // disponible" placeholder is used instead.
    created: null,
    capital: null,
    address: (company as any).address_street || null,
    city: (company as any).address_city || null,
    postal: (company as any).address_postal_code || null,
    director: null,
    employees: (company as any).employee_count != null ? String((company as any).employee_count) : null,
    ape: null,
    activity: (company as any).industry_sector || null,
    siren: null,
    siret: company.siret || null,
    statut: company.status || null,
    revenue: (company as any).annual_revenue != null ? String((company as any).annual_revenue) : null,
    revenueYear: null,
    website: (company as any).website_url || null,
    facebook: null,
    googleRating: null,
    googleReviewCount: null,
    certifications: [],
  } as ApiSiretCompany : null);

  const [opportunity, setOpportunity] = useState<ApiOpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Progressive 3-screen journey (client's brief: "Opportunité" →
  // "Votre compatibilité" → "Dossier & suivi"), replacing the old
  // single-scroll two-tab layout so each step is its own page on mobile.
  // Nothing that used to be visible is hidden by this split - every card
  // still renders, only regrouped by screen; the email/phone step only
  // gates moving on to the next screen, never the analysis itself.
  // FIX 1: Always start on screen 1, regardless of authentication status.
  const [screen, setScreen] = useState<1 | 2 | 3>(1);
  // Dossier hub's opportunity selector (client's 10 Sep card spec): was a
  // hardcoded <select disabled> showing only the current opportunity as its
  // one option - the reference mockup's selector actually switches between
  // several saved candidatures. Populated from the same "opportunités
  // enregistrées" (favorites) the client's spec names for this selector.
  const [savedOpportunities, setSavedOpportunities] = useState<{ id: string; title: string; location_city: string | null; estimated_value: number | null }[]>([]);
  
  // FIX 2: No auto-advance - users must click "Continuer" to go to screen 2
  const autoAdvancedRef = useRef(false);
  // Client's 13 Sep concordance-apercu screenshots: the "Recevoir mon
  // dossier pré-rempli" CTA sits right under the score card (before the
  // two accordions below), always visible - not gated behind auth/
  // leadCaptured. For an authenticated/already-captured visitor it jumps
  // straight to screen 3; otherwise it scrolls down to the lead-capture
  // card ("Ceci n'est qu'un aperçu") rather than duplicating that form's
  // logic here.
  const leadGateRef = useRef<HTMLDivElement>(null);

  const [access, setAccess] = useState<ApiOpportunityAccess | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [slotForm, setSlotForm] = useState({ email: user?.email || '', phone: '', firstName: user?.firstName || '', lastName: user?.lastName || '', companyName: company?.name || '' });
  // "Comment souhaitez-vous continuer ?" (client's dix images, écran 5):
  // three plain choice-cards, not a form. Reserving a slot or asking for a
  // callback is picked here; contact info itself was already captured
  // earlier in the journey (screen 4's "Enregistrer cette opportunité"
  // gate) so this step never re-asks for name/email/phone.
  const [contactChoice, setContactChoice] = useState<'slot' | 'callback' | 'none' | null>(null);
  // "Votre dossier" hub state (client's 10 Sep card spec, free-visitor view).
  const [dossierStepsOpen, setDossierStepsOpen] = useState(false);
  const [dceViewed, setDceViewed] = useState(false);
  const [dceAnalysisViewed, setDceAnalysisViewed] = useState(false);
  // Updates local state immediately (instant UI feedback) and persists to
  // bid_responses in the background (see backend's POST
  // /:tenderId/dce-viewed) - was local-state-only before, resetting the
  // dossier progress bar's first 2 "real" steps on every refresh/re-login.
  // Silently ignores failure: this is a progress-bar nicety, not worth
  // surfacing an error toast over.
  const markDceViewed = (step: 'dce' | 'analysis') => {
    if (step === 'dce') setDceViewed(true); else setDceAnalysisViewed(true);
    if (tender?.id) tendersApi.markDceViewed(tender.id, step).catch(() => {});
  };
  const [eligibilityOpen, setEligibilityOpen] = useState(false);
  // "Affinez votre concordance" mini self-assessment (client's 12 Sep
  // concordance-apercu reference): 3 yes/no/to-confirm questions the
  // visitor answers about themselves. Purely a self-reflection prompt for
  // now, client-side only - it doesn't feed back into the server-computed
  // matchScore (that stays 100% derived from real company/opportunity data,
  // never from unverified self-reported answers).
  const [refineOpen, setRefineOpen] = useState(false);
  // "Les points forts de cette opportunité pour vous" (client's 13 Sep
  // concordance-apercu screenshots): a collapsed-by-default accordion,
  // matching "Affinez votre concordance" right above it - was previously
  // always expanded with no toggle at all.
  const [strengthsOpen, setStrengthsOpen] = useState(false);
  // Client (19 Sep): "les retours en arrière doivent conserver l'entreprise,
  // les réponses et les critères de recherche." Company identification
  // (CompanyKnownContext) and search criteria (RecherchePage's own
  // sessionStorage/URL state) already survive client-side navigation - this
  // was the one gap: refineAnswers is local component state, so leaving
  // this fiche and coming back (even just SPA back/forward, not just a full
  // reload) remounted the page with every "Affinez votre concordance"
  // answer wiped. Same per-opportunity sessionStorage pattern already used
  // for getConsultationsCount above.
  const refineAnswersStorageKey = id ? `md_refine_answers_${id}` : null;
  const [refineAnswers, setRefineAnswers] = useState<Record<string, 'oui' | 'non' | 'a_confirmer' | undefined>>(() => {
    if (!refineAnswersStorageKey) return {};
    try {
      const raw = sessionStorage.getItem(refineAnswersStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    if (!refineAnswersStorageKey) return;
    try {
      sessionStorage.setItem(refineAnswersStorageKey, JSON.stringify(refineAnswers));
    } catch {
      // sessionStorage unavailable - answers just won't survive navigation this session
    }
  }, [refineAnswers, refineAnswersStorageKey]);
  const [excerptOpen, setExcerptOpen] = useState(false);
  const [companyPiecesOpen, setCompanyPiecesOpen] = useState(false);
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
  // "Votre dossier" 5-section aperçu (client's 12 Sep dossier-demo
  // reference, Écran "3. Dossier") - replaces the old locked
  // "Préparer ma candidature" card below. Backed by dossier_requests
  // (see dossiersApi) - draft-savable, doesn't submit anything real until
  // "Générer mon dossier" is pressed, per the client's exact wording.
  const [dossier, setDossier] = useState<ApiDossierRequest | null>(null);
  const [dossierResponseText, setDossierResponseText] = useState('');
  const [dossierPartners, setDossierPartners] = useState<{ name: string; role: string }[]>([]);
  const [dossierGenerating, setDossierGenerating] = useState(false);
  const [dossierDownloading, setDossierDownloading] = useState(false);
  // Inline Confidentialité/Préférences de contact disclosures on the lead
  // form (client's 12 Sep concordance-apercu reference, exact HTML source
  // this time - md8-preferences/md8-privacy) - replaces the plain links to
  // existing pages that were there before.
  const [contactPrefsOpen, setContactPrefsOpen] = useState(false);
  const [privacyPanelOpen, setPrivacyPanelOpen] = useState(false);
  const [contactMode, setContactMode] = useState<'followup' | 'request-only'>('followup');
  // Phone+email gate (client's newest brief, Écran 7): shown once SIRET is
  // known but leadCaptured is still false, in place of the fuller analysis
  // breakdown (criteria/eligibility/refine accordion) - global per session
  // via CompanyKnownContext, so once given it never reappears anywhere.
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [justUnlockedAnalysis, setJustUnlockedAnalysis] = useState(false);
  // C08 (contre-audit 15 Sep 2026): "Mettre en œuvre le contrôle SMS
  // convenu, avec saisie et correction simples". Phone format validation
  // (handleLeadSubmit below) proved the number is well-formed, not that the
  // visitor actually holds it - this adds the missing possession check.
  // otpSent tracks whether *this mount* has fired the send, separately from
  // phoneVerified (session-wide, from CompanyKnownContext) so a returning
  // visitor who captured a phone earlier but never verified it gets a code
  // sent automatically (effect below) instead of being stuck with no
  // resend affordance.
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  // Whether the backend actually requires phone verification right now
  // (false in any environment with no SMS provider configured - see
  // GET /siret/phone/verification/config). null while unknown, which is
  // deliberately treated the same as "not required" below: the backend's
  // own comment on that endpoint is explicit that showing this step when
  // it can't be completed (no code will ever arrive) is worse than
  // skipping it, so this never blocks on a still-loading config.
  const [otpRequired, setOtpRequired] = useState<boolean | null>(null);
  useEffect(() => {
    siretApi.getPhoneVerificationConfig()
      .then(r => setOtpRequired(r.required))
      .catch(() => setOtpRequired(false));
  }, []);
  // 20 Sep fix: when otpRequired is true, POST /siret/lead 403s on an
  // unverified phone (see backend), so captureLead can't run until the
  // code is confirmed - this flag hides the lead form and shows the code
  // step for that in-progress window, without depending on leadCaptured
  // (which only flips true once captureLead itself succeeds).
  const [pendingOtpVerification, setPendingOtpVerification] = useState(false);
  // Whether the free "dossier pré-rempli" PDF was actually emailed on this
  // validation, straight from POST /siret/lead's response - drives the
  // confirmation message on screen 3 (vs. a generic "you're set up" state
  // if the email dispatch itself failed server-side, still non-fatal there).
  const [dossierJustEmailed, setDossierJustEmailed] = useState(false);

  // D06 (contre-audit 15 Sep): "Le formulaire de modification prévu
  // n'apparaissait pas. Le clic fait apparaître une proposition « Être
  // rappelé, sans créneau précis », pas le formulaire attendu." Once
  // leadCaptured flips true the phone/email form above disappears for
  // good (line ~1555/1703 below) and nothing in the Dossier screen ever
  // showed what was actually captured or let the visitor fix a typo -
  // there was no edit path at all behind whatever triggered the callback
  // suggestion the audit saw. Reuses captureLead itself as the "update":
  // it's the same upsert the initial form calls.
  const [editingContact, setEditingContact] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editContactError, setEditContactError] = useState<string | null>(null);
  const [editContactSaving, setEditContactSaving] = useState(false);
  const handleContactUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^0[1-9]\d{8}$/.test(editPhone)) {
      setEditContactError(t('leadPhoneInvalid') || 'Le téléphone doit contenir 10 chiffres.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(editEmail)) {
      setEditContactError(t('leadEmailInvalid') || "L'e-mail n'est pas valide.");
      return;
    }
    setEditContactSaving(true);
    setEditContactError(null);
    const { error } = await captureLead(editPhone, editEmail, id);
    setEditContactSaving(false);
    if (error) {
      setEditContactError(error);
    } else {
      setEditingContact(false);
    }
  };

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
    // Was just /^\d{10}$/ - accepted any 10 digits including all-zero
    // numbers like "0000000000" (client's 15 Sep audit). A real French
    // fixed/mobile line starts with 0 then 1-9, never a second 0.
    if (!/^0[1-9]\d{8}$/.test(leadPhone)) {
      setLeadError(t('leadPhoneInvalid') || 'Le téléphone doit contenir 10 chiffres.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(leadEmail)) {
      setLeadError(t('leadEmailInvalid') || "L'e-mail n'est pas valide.");
      return;
    }
    setLeadSubmitting(true);
    setLeadError(null);
    // 20 Sep fix: POST /siret/lead rejects an unverified phone whenever
    // otpRequired is true (see backend's isVerificationRequired guard), so
    // calling captureLead before the code is confirmed just 403s with no
    // way back to the code-entry step (the exact gap the 15 Sep audit
    // flagged). Send the code first instead and defer captureLead to
    // handleOtpSubmit, once the phone is actually proven.
    if (otpRequired) {
      setPendingOtpVerification(true);
      await sendOtp(leadPhone);
      setLeadSubmitting(false);
      return;
    }
    const { error, dossierEmailed } = await captureLead(leadPhone, leadEmail, id);
    setLeadSubmitting(false);
    if (error) {
      setLeadError(error);
      return;
    }
    // Contact details are already fully validated here (no OTP required in
    // this environment) - go straight to the Dossier screen instead of
    // leaving the visitor on a blank Concordance screen (the bug: the lead
    // form disappears once leadCaptured flips true, but nothing used to
    // take its place or advance `screen`).
    setDossierJustEmailed(!!dossierEmailed);
    setJustUnlockedAnalysis(true);
    setScreen(3);
  };

  // Fires POST /siret/phone/verification/request for the given phone. Shared by the
  // initial submit above, the "Renvoyer le code" button, and the auto-send
  // effect below (a visitor who already has leadCaptured=true from an
  // earlier session but never completed OTP verification).
  const sendOtp = async (phone: string) => {
    setOtpSending(true);
    setOtpError(null);
    try {
      await siretApi.requestPhoneOtp(phone, getSessionId());
      setOtpSent(true);
    } catch (err) {
      setOtpError(getApiErrorMessage(err, "L'envoi du code a échoué. Réessayez."));
    } finally {
      setOtpSending(false);
    }
  };

  // A visitor whose phone was captured in an earlier session (leadCaptured
  // true from CompanyKnownContext's initial status load) but who never
  // completed the OTP step still needs a code sent - without this, they'd
  // see the "saisir le code" screen with no code ever having been sent and
  // no way to trigger one except the resend button.
  const phoneForOtp = leadPhone || contextLeadPhone || '';
  useEffect(() => {
    if (otpRequired && !isAuthenticated && leadCaptured && !phoneVerified && !otpSent && !otpSending && phoneForOtp) {
      setPendingOtpVerification(true);
      sendOtp(phoneForOtp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpRequired, isAuthenticated, leadCaptured, phoneVerified, phoneForOtp]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(otpCode)) {
      setOtpError(t('otpCodeInvalid') || 'Saisissez le code reçu par SMS.');
      return;
    }
    setOtpSubmitting(true);
    setOtpError(null);
    try {
      await siretApi.confirmPhoneOtp(phoneForOtp, otpCode, getSessionId());
      confirmPhoneVerified();
      let dossierEmailed = false;
      if (!leadCaptured) {
        // 20 Sep fix: for a brand-new visitor this is the first point the
        // phone is actually proven, so this is where captureLead (POST
        // /siret/lead) finally runs - it would have 403'd (phone_not_verified)
        // any earlier. A returning visitor who already had leadCaptured=true
        // from an earlier session doesn't need this repeated.
        const email = leadEmail || contextLeadEmail || '';
        const result = await captureLead(phoneForOtp, email, id);
        if (result.error) {
          setOtpError(result.error);
          setOtpSubmitting(false);
          return;
        }
        dossierEmailed = !!result.dossierEmailed;
      }
      setPendingOtpVerification(false);
      setDossierJustEmailed(dossierEmailed);
      // Client's exact button label is "Enregistrer et continuer" - one
      // action, not submit-then-a-second-tap. Was previously just setting
      // leadCaptured and leaving the visitor on the same screen with a
      // "Continuer" button that had appeared in the form's place.
      setJustUnlockedAnalysis(true);
      setScreen(3);
    } catch (err) {
      setOtpError(getApiErrorMessage(err, 'Code incorrect. Vérifiez le code reçu par SMS.'));
    } finally {
      setOtpSubmitting(false);
    }
  };

  const [matchScore, setMatchScore] = useState<ApiMatchScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  // Client (19 Sep): "reproduire le fonctionnement de la carte interactive:
  // les réponses aux quatre questions doivent afficher les points ajoutés
  // et actualiser immédiatement le score, selon le barème prévu. Exemple:
  // +2 points, puis passage de 50% à 52%. Modifier une réponse doit
  // également recalculer le résultat." The 15 Sep contre-audit had this
  // refinement block as pure self-reflection with zero effect on the score
  // (illustrative points were leaking into the UI as if real, so they were
  // removed entirely) - the client is now asking for the opposite: a real,
  // stated barème that genuinely moves the number, live, as each question
  // is answered or changed. refineAdjustment is a plain derived value off
  // refineAnswers (not its own state), so changing any answer recomputes
  // it automatically on the next render - no separate "recalculate" step
  // needed to satisfy "modifier une réponse doit également recalculer".
  // 25 Sep client audit: the answers used to add a flat +2 / -3 to a score that
  // measured how complete the notice was. They now go to the backend, which
  // applies each answer to the criterion it concerns (expérience, moyens,
  // zone, calendrier) and recomputes the comparison, so the number, the
  // criteria and their explanations can never disagree.
  const displayScore: number | null = matchScore ? matchScore.score : null;
  const refineAnswersParam = Object.entries(refineAnswers).filter(([, v]) => !!v).map(([k, v]) => `${k}:${v}`).join(',');
  const CRITERION_FOR_ANSWER: Record<string, string> = { experience: 'experience', capacity: 'moyens', location: 'zone', calendar: 'disponibilite' };
  // 20 Sep audit (Marssac): Concordance said "Le métier n'est pas précisé"
  // while the notice is plainly about isolation thermique extérieure. The
  // backend now links/infers the trade itself; if it still has none, the AI's
  // own matched-trade name is the next real signal before admitting the
  // métier is unknown.
  const tradeLabel = opportunity?.trade_name
    || opportunity?.ai_matched_trades?.find(m => m.trade_name)?.trade_name
    || null;
  // Client (20 Sep): "dès que les quatre questions sont renseignées, le bloc
  // se ferme automatiquement... Lorsqu'on le rouvre pour corriger ses
  // réponses, il doit rester ouvert pendant les modifications." So this only
  // fires the auto-close on the transition into "all 4 answered" - not on
  // every render while already complete, or reopening to edit an answer
  // would immediately snap shut again.
  const allRefineAnswered = ['experience', 'capacity', 'location', 'calendar'].every(k => !!refineAnswers[k]);
  const wasAllRefineAnsweredRef = useRef(false);
  useEffect(() => {
    if (allRefineAnswered && !wasAllRefineAnsweredRef.current) setRefineOpen(false);
    wasAllRefineAnsweredRef.current = allRefineAnswered;
  }, [allRefineAnswered]);
  const [siretInput, setSiretInput] = useState('');
  const [siretSubmitting, setSiretSubmitting] = useState(false);
  const [siretError, setSiretError] = useState<string | null>(null);

  const [tender, setTender] = useState<ApiTender | null>(null);
  const [bid, setBid] = useState<ApiBidResponse | null>(null);
  const [checklistDocs, setChecklistDocs] = useState<ApiCompanyDocument[]>([]);

  // C06 (contre-audit 15 Sep): real distinct-session view count for the
  // "X entreprises ont consulté cette annonce aujourd'hui" card, replacing
  // the seeded-random placeholder (getConsultationsCount below stays as
  // the fallback while this loads / if it fails).
  const [realConsultations, setRealConsultations] = useState<number | null>(null);

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
    getConsultationsToday(id).then(setRealConsultations);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setAccessLoading(true);
    opportunitiesApi.getAccess(id, getSessionId(), user?.email)
      .then(setAccess)
      .catch(() => setAccess({ identityUnlocked: false }))
      .finally(() => setAccessLoading(false));
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (screen !== 3) return;
    if (isAuthenticated) {
      favoritesApi.list()
        .then(list => setSavedOpportunities(list.map(o => ({ id: o.id, title: o.title, location_city: o.location_city, estimated_value: o.estimated_value }))))
        .catch(() => setSavedOpportunities([]));
      return;
    }
    // Anonymous visitor: there's no account to hold "favorites" yet, but the
    // selector's whole point (client's 10 Sep spec) is switching between
    // opportunities *this visitor* has already engaged with. That's exactly
    // what CONFIRMED_OPPS_KEY tracks - every opportunity they've identified
    // their company on in this browser. Was only ever read for the
    // single-id `isOpportunityConfirmed` check above; never used to build
    // this list, so the selector stayed empty (current-opportunity-only)
    // for every visitor who hadn't logged in.
    const confirmedIds = Object.keys(getConfirmedOpportunities()).filter(oppId => oppId !== id);
    if (confirmedIds.length === 0) { setSavedOpportunities([]); return; }
    let cancelled = false;
    Promise.all(
      confirmedIds.map(oppId =>
        opportunitiesApi.getById(oppId)
          .then(o => ({ id: o.id, title: o.title, location_city: o.location_city, estimated_value: o.estimated_value }))
          .catch(() => null) // e.g. since-removed listing - drop it, don't fail the whole selector
      )
    ).then(results => {
      if (!cancelled) setSavedOpportunities(results.filter((o): o is NonNullable<typeof o> => o !== null));
    });
    return () => { cancelled = true; };
  }, [screen, isAuthenticated, id]);

  useEffect(() => {
    if (!id || screen === 3 || matchScore || scoreLoading) return;
    // Gate on this specific opportunity's own confirmation, not the
    // session-wide `companyKnown` - otherwise a company confirmed on a
    // different, earlier opportunity would compute (and cache) a score for
    // this one before the visitor ever identifies the right company here.
    if (!isOpportunityConfirmed(id) && !isAuthenticated) return;
    setScoreLoading(true);
    setScoreError(null);
    opportunitiesApi.getMatchScore(id, getSessionId(), refineAnswersParam)
      .then(setMatchScore)
      .catch(err => setScoreError(getApiErrorMessage(err, t('scoreLoadError') || "Impossible de calculer le score pour cette opportunité.")))
      .finally(() => setScoreLoading(false));
  }, [id, screen, matchScore, scoreLoading, t, isAuthenticated]);

  // Recompute (quietly, without swapping the card for a spinner) whenever an
  // answer to the four questions is added or changed. The counter drops
  // responses that arrive out of order after quick successive clicks.
  const scoreRequestRef = useRef(0);
  const lastAnswersParamRef = useRef(refineAnswersParam);
  useEffect(() => {
    if (lastAnswersParamRef.current === refineAnswersParam) return;
    lastAnswersParamRef.current = refineAnswersParam;
    if (!id || !matchScore) return;
    const ticket = ++scoreRequestRef.current;
    opportunitiesApi.getMatchScore(id, getSessionId(), refineAnswersParam)
      .then(result => { if (ticket === scoreRequestRef.current) setMatchScore(result); })
      .catch(() => { /* keep the previous comparison on screen */ });
  }, [refineAnswersParam, id, matchScore]);

  const handleSiretSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Accept a 14-digit SIRET OR a company name (client's ask: label the
    // field "SIRET ou entreprise" so either works) - only reject genuinely
    // too-short input. A SIRET resolves directly; a name now returns a
    // candidates list (client's 5 Sep brief) rendered below instead of
    // auto-resolving to Pappers' best guess.
    const trimmed = siretInput.trim();
    if (trimmed.length < 2) {
      setSiretError(t('siretInputTooShort') || "Indiquez un SIRET (14 chiffres) ou le nom de l'entreprise.");
      return;
    }
    setSiretSubmitting(true);
    setSiretError(null);
    const result = await lookupSiret(trimmed);
    if (result.error) setSiretError(result.error);
    // A 14-digit SIRET resolves straight to a company (no candidates list) -
    // record it as confirmed for THIS opportunity and move on. A name search
    // instead returns `candidates` for the visitor to pick from below, so
    // nothing to mark yet in that case.
    else if (result.companyKnown) {
      markOpportunityConfirmed(id, result.siret);
      setScreen(2);
    }
    setSiretSubmitting(false);
  };

  const [confirmingCandidate, setConfirmingCandidate] = useState<string | null>(null);
  const handleConfirmCandidate = async (candidateSiret: string) => {
    setConfirmingCandidate(candidateSiret);
    setSiretError(null);
    const result = await confirmCandidate(candidateSiret);
    if (result.error) setSiretError(result.error);
    else if (result.companyKnown) {
      markOpportunityConfirmed(id, result.siret);
      setScreen(2);
    }
    setConfirmingCandidate(null);
  };

  // DCE - Dossier de consultation raw document list (client's dix images,
  // écran 8): these are the buyer's own published files, already public -
  // no reason to gate this behind the paid subscription like the AI
  // analysis/bid-package cards below it are.
  const [dceDocuments, setDceDocuments] = useState<ApiTenderDocument[]>([]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    tendersApi.getDocuments(id)
      .then(({ documents }) => setDceDocuments(documents))
      .catch(() => {});
  }, [id, isAuthenticated]);

  // "Votre dossier" aperçu: load any existing draft/request for this
  // opportunity + the company profile (Identification/Présentation
  // sections). Independent of the tender/bid fetch above - this reads
  // dossier_requests, not the deeper BidWorkspacePage tender flow.
  useEffect(() => {
    if (!id || !isAuthenticated) return;
    dossiersApi.get(id).then(d => {
      if (!d) return;
      setDossier(d);
      setDossierResponseText(d.response_text || '');
      setDossierPartners(d.partners || []);
    }).catch(() => {});
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    // Point 5 (20 Sep client audit): dceViewed/dceAnalysisViewed are plain
    // useState, so navigating from one opportunity straight to another
    // (same OpportunityDetailPage instance, just a new :id - React Router
    // doesn't remount for that) left them at whatever the *previous*
    // opportunity had set them to until this fetch resolved: opening Lyon
    // (DCE consulted) then Romainville showed Romainville at 40% too, with
    // no action taken there. Reset first, then let the fetch below set
    // them from Romainville's own bid.
    setDceViewed(false);
    setDceAnalysisViewed(false);
    tendersApi.get(id)
      .then(async tData => {
        setTender(tData);
        const b = await tendersApi.getBid(tData.id);
        setBid(b);
        // Restore persisted dossier-progress steps (see markDceViewed
        // below) instead of always starting from false on every load.
        if (b.dce_viewed_at) setDceViewed(true);
        if (b.dce_analysis_viewed_at) setDceAnalysisViewed(true);
      })
      .catch(() => {});
  }, [id, isAuthenticated]);

  // D03: the "Offert · disponible" promise only actually holds once the
  // chargé d'affaires has approved the memo - see BidWorkspacePage's own
  // download button, gated on this same field.
  const dossierReady = isAuthenticated && !!bid?.is_technical_memo_approved;

  // Checklist fetch is independent of isPaid on purpose - spec 3.7 keeps
  // the company-document checklist addable regardless of subscription,
  // only the AI-assisted mémoire technique below it is gated.
  useEffect(() => {
    if (!isAuthenticated) return;
    companyVaultApi.documents.list()
      .then(setChecklistDocs)
      .catch(() => {});
  }, [isAuthenticated]);

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

  // Client priority #10 "Créer mon accès" - shown once a slot/callback has
  // already captured phone+email. Calls the new completeSignup(), which
  // pulls company name/SIRET/address/revenue from this same session's
  // already-completed SIRET lookup instead of a bare company name - this is
  // the fix for "Mon entreprise" showing almost nothing after signup. Never
  // blocks navigation - "Plus tard" just dismisses this block.
  const handleQuickPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quickPassword.length < 8) {
      setQuickPasswordError(t('quickPasswordTooShort') || 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setQuickPasswordSubmitting(true);
    setQuickPasswordError(null);
    const result = await completeSignup(getSessionId(), quickPassword);
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

  const metaDescription = stripMarkdownArtifacts((opportunity.ai_summary || opportunity.description)
    || `${journeyMeta.label} : ${opportunity.title}${opportunity.location_city ? ` à ${opportunity.location_city}` : ''}. Consultez l'annonce complète sur Marchés Direct.`);

  return (
    <div className="page-fade-in bg-[#001326] relative z-10 max-w-3xl mx-auto px-4 py-6 md:py-10">
      <PageMeta title={`${opportunity.title} — Marchés Direct`} description={metaDescription.slice(0, 300)} />
      <button
        onClick={() => (screen > 1 ? setScreen((s) => (s - 1) as 1 | 2 | 3) : navigate(-1))}
        className="flex items-center gap-1.5 text-xs text-[#B9BBC8] hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft size={14} /> {t('detailBack')}
      </button>

      {/* Numbered stepper (client's 6 Sep brief, screenshots #1/#2): "chaque
          étape doit être clairement visible en haut de la page afin que
          l'utilisateur comprenne immédiatement où il se trouve dans le
          parcours." Purely a progress indicator - screen state/navigation
          logic is unchanged, this just makes it visible. */}
      {/* Client's exact complaint: "seuls les numéros 1, 2 et 3
          apparaissent... le visiteur ne sait pas à quoi correspondent les
          étapes" - labels were `hidden sm:inline`, i.e. invisible below a
          640px viewport. Every reference screenshot this project has been
          checked against was taken on a phone, so in practice every visitor
          only ever saw three bare numbered circles with no idea what step
          1/2/3 actually meant. Now shown at every width, stacked under the
          circle with short (not the full-sentence) labels so three of them
          still fit a phone without wrapping or overlapping. */}
      <div className="flex items-center justify-between gap-1 mb-4 w-full">
        {([
          { n: 1, label: t('stepperOpportunity') || 'Votre opportunité', short: t('stepperOpportunityShort') || 'Opportunité' },
          { n: 2, label: t('stepperConcordance') || 'Concordance', short: t('stepperConcordanceShort') || 'Concordance' },
          { n: 3, label: t('stepperDossier') || 'Votre dossier', short: t('stepperDossierShort') || 'Dossier' },
        ] as const).map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`shrink-0 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 ${screen === s.n ? '' : 'opacity-60'}`}>
              <span className={`shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold ${
                screen > s.n ? 'bg-green-400/15 text-green-400 border border-green-400/40'
                : screen === s.n ? 'bg-orange text-white'
                : 'border border-[#17334D] text-[#5B6B80]'
              }`}>
                {screen > s.n ? <CheckCircle2 size={14} /> : s.n}
              </span>
              {/* Short label always visible (mobile-first); the full
                  sentence-length label only from sm+ where there's room. */}
              <span className={`sm:hidden text-[9px] font-semibold text-center leading-tight whitespace-nowrap ${screen === s.n ? 'text-orange' : screen > s.n ? 'text-green-400' : 'text-[#5B6B80]'}`}>
                {s.short}
              </span>
              <span className={`hidden sm:inline text-sm font-semibold whitespace-nowrap ${screen === s.n ? 'text-orange' : screen > s.n ? 'text-green-400' : 'text-[#5B6B80]'}`}>
                {s.label}
              </span>
            </div>
            {i < 2 && <div className={`h-px flex-1 min-w-[16px] self-start mt-3 sm:mt-0 sm:self-auto ${screen > s.n ? 'bg-green-400/40' : 'bg-[#17334D]'}`} />}
          </div>
        ))}
      </div>

      {/* Client's exact wording ("il faut clairement afficher: Étape 1 –
          Votre opportunité...") - a small kicker above the step's own
          heading. Screens 2/3 already show the full name as a big H2 right
          below (existing "Page title" block), so this only repeats the
          name for screen 1, which has no separate H2 of its own (its title
          lives inside the opportunity card instead). */}
      <p className="text-xs font-bold text-orange uppercase tracking-wide mb-3">
        {t('stepperStepPrefix') || 'Étape'} {screen}{screen === 1 ? ` — ${t('stepperOpportunity') || 'Votre opportunité'}` : ''}
      </p>


      {/* Opportunity header — client's screenshots show this only on screen
          1 ("Votre opportunité"); screens 2 and 3 are each dedicated to
          their own content (Concordance / Votre dossier) with no repeated
          opportunity card, per the exact reference screenshots. */}
      {screen === 1 && (
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
          <span className="flex items-center gap-1.5"><Calendar size={13} /> {t('detailDeadline')} : {formatDeadlineWithTime(opportunity.deadline, opportunity.deadline_time)}</span>
          <span className="flex items-center gap-1.5"><Euro size={13} /> {formatAmount(opportunity.estimated_value, opportunity.currency)}</span>
        </div>
        {/* 20 Sep client audit: "les statistiques illustratives restent
            visibles." The "N entreprises intéressées" card (a number seeded
            from the opportunity id, captioned "Exemple illustratif —
            statistique à vérifier") is gone: a placeholder figure has no
            place on a fiche whatever its caption says. Only the real
            distinct-session consultation count (realConsultations, from
            /api/visitor-events/consultations/:id) remains, and it stays
            hidden while loading, on a fetch failure, or when it is 0 -
            never a fabricated number. */}
        {realConsultations != null && realConsultations > 0 && (
          <div className="space-y-2.5 mt-4">
            <div className="bg-[#031B30] border border-[#17334D] border-l-2 border-l-orange rounded-xl p-4">
              <p className="flex items-center gap-2 text-xs text-[#EAF0F6] leading-relaxed">
                <span
                  className="rounded-full bg-red-500 shrink-0 animate-pulse"
                  style={{ width: socialProofDotSizePx(realConsultations, 2, 5, 6, 11), height: socialProofDotSizePx(realConsultations, 2, 5, 6, 11) }}
                />
                <span>
                  <span className="font-bold text-white">{realConsultations} {t('consultationsLabel') || 'consultations récentes'}.</span>{' '}
                  {t('consultationsBody') || "D'autres entreprises s'intéressent à ce marché en ce moment."}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
      )}


      {/* Page title — one distinct, clearly-titled screen per step instead
          of tabs on a single long scroll. Screen 1's title lives inside the
          opportunity card itself (its <h1> above) so no redundant heading
          here; screens 2/3 get their own H1 + one-line subtitle, exactly
          matching the client's reference screenshots ("Concordance" /
          "Votre dossier" with the descriptive line directly underneath). */}
      {screen !== 1 && (
        <div className="mb-4">
          <h2 className={screen === 3 ? 'text-2xl font-extrabold text-white' : 'text-xl font-extrabold text-white'}>
            {screen === 2 ? (t('compatibilityTitle') || 'Concordance') : (t('detailDossier') || 'Votre dossier')}
          </h2>
          <p className="text-sm text-[#B9BBC8] mt-1">
            {screen === 2
              ? (t('compatibilitySubtitle') || 'Découvrez votre entreprise et son adéquation avec cette opportunité.')
              : (t('detailDossierSubtitle') || 'Vos documents et votre accompagnement, au même endroit.')}
          </p>
        </div>
      )}

      {/* PARCOURS COMPLET — client's brief (dix images de référence): one
          continuous scroll from "le marché en 30 secondes" through
          l'identification de l'entreprise jusqu'au rappel, no tab switch in
          between. Order below matches the reference screenshots: résumé →
          points de vigilance → donneur d'ordre → détails du dossier →
          identification SIRET → fiche entreprise → indice de correspondance
          → coordonnées → dossier prep → suivi/rappel. */}
      {screen === 1 && (
        <div className="space-y-4">
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
            {hasAnalysisContent(opportunity.ai_analysis_sections) ? (
              <OpportunityAnalysisAccordions
                sections={opportunity.ai_analysis_sections!}
                sourceText={
                  opportunity.description && !isRedundantWithTitle(opportunity.description, opportunity.title)
                    ? opportunity.description
                    : null
                }
                t={t}
              />
            ) : (
              <>
                {opportunity.ai_summary && !isRedundantWithTitle(opportunity.ai_summary, opportunity.title) && (
                  <p className="text-sm text-white leading-relaxed whitespace-pre-line">{stripMarkdownArtifacts(opportunity.ai_summary)}</p>
                )}
                {opportunity.description && !opportunity.ai_summary && !isRedundantWithTitle(opportunity.description, opportunity.title) && (
                  <p className="text-sm text-[#B9BBC8] leading-relaxed">{opportunity.description}</p>
                )}
                {(!opportunity.ai_summary || isRedundantWithTitle(opportunity.ai_summary, opportunity.title))
                  && (!opportunity.description || isRedundantWithTitle(opportunity.description, opportunity.title)) && (
                  // O03 (contre-audit 15 Sep): "Différencier une donnée
                  // absente de la source, une analyse en attente et une
                  // erreur." This was a single flat "no description"
                  // message regardless of why nothing was there - a
                  // classification that's still queued, one that failed
                  // outright, and one that finished and genuinely found
                  // nothing to add (the source notice itself is just
                  // that terse) all read identically. Same
                  // ai_classification_status the quick-stats block above
                  // already reads.
                  <p className="text-sm text-[#B9BBC8]">
                    {/* 20 Sep audit (Romainville): "Analyse en cours de
                        génération" was shown for not_analyzed / missing
                        statuses too, i.e. indefinitely for any fiche the
                        batch job never reached. The backend now classifies
                        and summarises on open, so "en cours" is only
                        honest while a run is genuinely active
                        ('processing'); otherwise say what is true. */}
                    {opportunity.ai_classification_status === 'failed'
                      ? (t('detailAnalysisFailed') || "L'analyse automatique a échoué pour ce marché. Consultez l'annonce officielle ci-dessous.")
                      : opportunity.ai_classification_status === 'processing'
                        ? (t('detailAnalysisPending') || 'Analyse en cours de génération pour cette opportunité.')
                        : (t('detailNoDescription') || "Aucune description détaillée n'est disponible pour cette annonce. Consultez l'annonce officielle ci-dessous.")}
                  </p>
                )}
              </>
            )}
            {/* Client's audit (6 Sep): fiche had no way to cross-check
                against the source (BOAMP/TED/PLACE). Only renders when we
                actually have a confirmed link for this source - see
                buildOfficialUrl in the backend, which returns null rather
                than guess one for sources without a stable public scheme
                (e.g. DECP). */}
            {opportunity.official_url && (
              <a
                href={opportunity.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#4EA1FF] hover:underline"
              >
                <ExternalLink size={13} />
                {t('detailOfficialNoticeLink') || "Voir l'annonce officielle"}
              </a>
            )}
          </div>

          {/* LE MARCHÉ EN 30 SECONDES — client's dix images (écrans 2-3):
              a 2x2 quick-stats grid, separate from the drier "Détails du
              dossier" list below. Each cell only renders when the
              underlying value is real (estimated_value / start date / a
              stated team size or duration) - never a placeholder. */}
          {(() => {
            const facts = opportunity.ai_extracted_facts;
            // O03 (contre-audit 15 Sep): "Différencier une donnée absente de
            // la source, une analyse en attente et une erreur." This used
            // `!facts` as a proxy for "pending" - but the real signal
            // (ai_classification_status) already exists on the record and
            // was never read here. A 'failed' row showed the same "revenez
            // bientôt" pending message as a genuinely queued one (it won't
            // ever finish on its own), and a 'classified' row that simply
            // found nothing worth extracting read as if analysis were still
            // running, when it's actually done - there's just nothing more
            // to say about that particular notice.
            const status = opportunity.ai_classification_status;
            const factsPending = !facts && status === 'processing';
            const factsFailed = !facts && status === 'failed';
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
                  <p className="text-xs text-[#B9BBC8]">
                    {factsFailed
                      ? (t('quickStatFailed') || "L'analyse automatique de ce marché a échoué. Les informations de la source restent consultables via le lien officiel.")
                      : factsPending
                        ? (t('quickStatPending') || 'Analyse en cours — revenez bientôt pour le détail complet.')
                        : (t('quickStatUnavailable') || 'Peu de détails disponibles pour ce marché.')}
                  </p>
                )}
                {facts?.contract_object?.available
                  && !isRedundantWithTitle(facts.contract_object.value, opportunity.title)
                  && !isRedundantWithTitle(facts.contract_object.value, opportunity.ai_summary) && (
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
            // 20 Sep audit: with no facts at all this card used to promise
            // "Analyse en cours" whatever the status (including never-run and
            // failed). Only claim a run in progress while one actually is.
            if (!facts && opportunity.ai_classification_status !== 'processing') return null;
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
            // Client's audit: no "référence officielle" shown anywhere on
            // the fiche. source_reference is the raw BOAMP idweb / TED
            // publication-number etc. (see officialUrl.ts) - always known
            // at ingest time, unlike the AI-extracted fields below.
            if (opportunity.source_reference) rows.push({ label: t('dossierFactReference'), value: opportunity.source_reference });
            // contract_object is already shown prominently above as "Travaux
            // à réaliser" ("Le marché en 30 secondes" block) - repeating the
            // exact same string here under "Objet du marché" is precisely
            // the "je lis deux ou trois fois la même description" complaint,
            // so it's intentionally left out of this second list.
            if (facts.procedure_type?.available) rows.push({ label: t('dossierFactProcedure'), value: humanizeRawLabel(facts.procedure_type.value) || facts.procedure_type.value });
            if (facts.submission_deadline?.available) rows.push({ label: t('dossierFactDeadline'), value: formatFactDeadline(facts.submission_deadline.value) });
            if (facts.estimated_value?.available) rows.push({ label: t('dossierFactValue'), value: facts.estimated_value.value });
            if (facts.team_size_estimate?.available) rows.push({ label: t('dossierFactTeam'), value: facts.team_size_estimate.value });
            if (facts.required_qualifications?.available) rows.push({ label: t('dossierFactQualifications'), value: facts.required_qualifications.value });
            if (facts.contract_duration?.available) rows.push({ label: t('dossierFactDuration'), value: facts.contract_duration.value });
            if (facts.submission_method?.available) rows.push({ label: t('dossierFactSubmissionMethod'), value: humanizeRawLabel(facts.submission_method.value) || facts.submission_method.value });
            if (facts.allotment?.available) rows.push({ label: t('dossierFactAllotment'), value: facts.allotment.value });
            if (facts.technical_visit?.available) rows.push({ label: t('dossierFactTechnicalVisit'), value: facts.technical_visit.value });
            // Attribution info only ever shows up once BOAMP/DECP actually
            // publishes an award notice - not available on an open call for
            // tenders is the expected, common case, not a gap.
            if (facts.attribution_winner?.available) rows.push({ label: t('dossierFactAttributionWinner'), value: facts.attribution_winner.value });
            if (facts.attribution_amount?.available) rows.push({ label: t('dossierFactAttributionAmount'), value: facts.attribution_amount.value });
            if (facts.attribution_date?.available) rows.push({ label: t('dossierFactAttributionDate'), value: facts.attribution_date.value });
            if (facts.buyer_phone?.available) rows.push({ label: t('dossierFactBuyerPhone'), value: facts.buyer_phone.value });
            if (facts.buyer_website?.available) rows.push({ label: t('dossierFactBuyerWebsite'), value: facts.buyer_website.value });
            if (opportunity.buyer_history_count != null) rows.push({
              label: t('dossierFactBuyerHistory'),
              value: opportunity.buyer_history_count === 0
                ? (t('dossierBuyerHistoryNone') || 'Aucun marché similaire publié')
                : t('dossierBuyerHistoryValue').replace('{n}', String(opportunity.buyer_history_count)),
            });
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

          {/* FIX 2: "Continuer" button for logged-in users on screen 1 */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setScreen(2)}
              className="w-full bg-orange text-white font-bold py-3 rounded-xl hover:bg-orange/90 transition-colors"
            >
              {t('compatibilityContinue') || 'Continuer'}
            </button>
          )}
        </div>
      )}

      {/* IDENTIFICATION / ANALYSE — continues the same "main" scroll right
          after "Détails du dossier" above (client's brief: no tab switch
          between the fiche and the identification/score flow). */}
      {/* Client's repeated complaint (screenshots, "same data shows on
          multiple cards/pages"): this used to be one `screen < 3` block
          with an if/else inside, so once a company was confirmed the
          company/score/lead-capture content rendered on screen 1 too
          (e.g. after using "Modifier" or the lead form's "Retour" button
          to navigate back) - the exact same card duplicated across two
          screens. Split into two mutually exclusive, single-screen blocks:
          the search form only ever belongs to screen 1, the company card /
          concordance / lead capture only ever belongs to screen 2. */}
      {screen === 1 && !isAuthenticated && (
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
              {/* Client's 5 Sep brief: a name search returns a results list
                  to pick from and confirm, not an auto-resolved best guess. */}
              {candidates.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] text-[#B9BBC8]">{candidates.length > 1 ? 'Plusieurs entreprises correspondent — sélectionnez la vôtre :' : 'Confirmez votre entreprise :'}</p>
                  {candidates.map(c => (
                    <button
                      key={c.siret}
                      type="button"
                      onClick={() => handleConfirmCandidate(c.siret)}
                      disabled={confirmingCandidate !== null}
                      className="w-full flex items-center justify-between gap-3 text-left bg-[#031B30] border border-[#17334D] rounded-lg px-3.5 py-3 hover:border-orange/50 transition-colors disabled:opacity-60"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate">{c.name || c.siret}</p>
                          {c.statut && (
                            <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${c.statut === 'Active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                              {c.statut}
                            </span>
                          )}
                        </div>
                        {/* Client priority #6: raison sociale / ville / activité /
                            SIREN ou SIRET / statut - all five, not just name+address+ape code. */}
                        <p className="text-[10px] text-[#B9BBC8] truncate">
                          {[c.city, c.activity || c.ape].filter(Boolean).join(' — ') || c.address}
                        </p>
                        <p className="text-[10px] text-[#5B6B80] truncate">SIRET {c.siret}{c.siren ? ` · SIREN ${c.siren}` : ''}</p>
                      </div>
                      {confirmingCandidate === c.siret ? <Loader2 size={14} className="animate-spin text-orange shrink-0" /> : <ChevronRight size={14} className="text-[#5B6B80] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
      )}

      {/* Page 2 ("Votre entreprise et votre concordance", client's exact
          4-page breakdown) - company card + concordance score + email/phone,
          nothing else. Criteria breakdown / eligibility docs / dossier-prep
          checklist moved into screen 3 below (they never appear in the
          client's reference screenshot for this screen). */}
      {screen === 2 && (
          <>
            {siretCompany && (
              <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-full bg-orange/15 border border-orange/30 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-orange" />
                    </span>
                    <p className="text-sm font-bold text-white">{t('siretYourCompany') || 'Votre entreprise'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setScreen(1); setSiretInput(''); }}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-orange border border-orange/40 rounded-lg px-3 py-1.5 hover:bg-orange/10 transition-colors shrink-0"
                  >
                    <Pencil size={12} /> {t('siretModify') || 'Modifier'}
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-base font-extrabold text-white">{siretCompany.name || '—'}</p>
                  {siretCompany.statut && (
                    <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${siretCompany.statut === 'Active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                      {siretCompany.statut}
                    </span>
                  )}
                </div>
                {siretCompany.siret && <p className="text-xs text-[#5B6B80] mb-4">SIRET {siretCompany.siret}</p>}

                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs pt-1 border-t border-[#17334D] mt-1">
                  <CompanyInfoRow icon={MapPin} label="Localisation" value={[siretCompany.city, siretCompany.postal].filter(Boolean).join(' ') || siretCompany.address || null} />
                  <CompanyInfoRow
                    icon={User}
                    label={siretCompany.directors && siretCompany.directors.length > 1 ? 'Dirigeants' : 'Dirigeant'}
                    value={siretCompany.directors && siretCompany.directors.length > 0 ? siretCompany.directors.join(', ') : siretCompany.director}
                    empty="Aucun dirigeant affiché"
                  />
                  <CompanyInfoRow icon={Users} label="Effectif" value={siretCompany.employees} empty="Effectif non communiqué" />
                  <CompanyInfoRow icon={Calendar} label="Ancienneté" value={formatSeniority(siretCompany.created)} />
                  <CompanyInfoRow
                    icon={TrendingUp}
                    label="Chiffre d'affaires"
                    value={siretCompany.revenue ? `${Number(siretCompany.revenue).toLocaleString('fr-FR')} €${siretCompany.revenueYear ? ` (${siretCompany.revenueYear}${siretCompany.revenueEstimated ? ' — estimé' : ''})` : ''}` : null}
                    empty="Chiffre d'affaires non disponible"
                  />
                  <CompanyInfoRow icon={FileText} label="Activité principale" value={siretCompany.activity || siretCompany.ape} />
                  <CompanyInfoRow
                    icon={Star}
                    label="Avis Google"
                    value={siretCompany.googleRating ? `${siretCompany.googleRating}/5${siretCompany.googleReviewCount ? ` (${siretCompany.googleReviewCount} avis)` : ''}` : null}
                    empty="Non disponible"
                  />
                  <CompanyInfoRow icon={Award} label="Certifications" value={siretCompany.certifications?.length ? siretCompany.certifications.join(', ') : null} empty="Aucune certification détectée dans notre recherche" />
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
                <h2 className="text-base font-extrabold text-white mb-1">{t('presenceDetectedTitle')}</h2>
                <p className="text-[11px] text-[#5B6B80] mb-3">{t('presenceDetectedSub')}</p>
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
                      <p className="text-xs text-[#B9BBC8] mt-0.5">
                        {siretCompany.rgeOrganisme ? `${t('presenceRgeDetected')} — ${siretCompany.rgeOrganisme}` : t('presenceNotDetected')}
                      </p>
                    </div>
                    {siretCompany.rgeOrganisme ? <CheckCircle2 size={18} className="text-green-400 shrink-0" /> : <XCircle size={18} className="text-[#5B6B80] shrink-0" />}
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
            {/* Concordance card (client's 12 Sep concordance-apercu
                reference): ring + "Indice de concordance" description
                beside it, the numerical breakdown of the score (20 Sep
                audit), and a highlighted quote using the server-computed whyRespond
                text. score/matchLabel/whyRespond are all server-computed
                (matchScoreService.ts) - never independently derived here. */}
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
              <h2 className="text-2xl font-extrabold text-white mb-2 leading-tight">{t('scoreCardCaption') || 'Votre concordance avec ce marché'}</h2>
              <p className="text-sm text-[#B9BBC8] mb-5">{opportunity.title}</p>
              <div className="flex flex-row items-start gap-5">
                <div className="relative w-28 h-28 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#17334D" strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="42" fill="none" stroke="#FF7A00" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={2 * Math.PI * 42 * (1 - (displayScore ?? 0) / 100)}
                      className="transition-[stroke-dashoffset] duration-500 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {displayScore === null
                      ? <span className="text-sm font-extrabold text-white text-center leading-tight px-2">{t('matchScoreToConfirm') || 'À confirmer'}</span>
                      : <span className="text-2xl font-extrabold text-white">{displayScore}%</span>}
                  </div>
                </div>
                <div className="flex-1 w-full min-w-0">
                  <p className="text-base font-bold text-white">{t('scoreIndexTitle') || 'Indice de concordance'}</p>
                  <p className="text-sm text-[#B9BBC8] mt-1.5 leading-relaxed">{t('scoreIndexDesc') || 'Ce score compare le profil de votre entreprise aux exigences du marché, à partir des informations disponibles. Vos réponses permettent de préciser cette évaluation.'}</p>
                  <p className="text-[11px] text-[#B9BBC8] mt-2">
                    {matchScore.scoreNote}
                  </p>
                </div>
              </div>

              {/* One line per criterion: what the market asks, what the company
                  does, and one of three states. Unknown data stays "à
                  confirmer" and is not counted in the percentage. */}
              <div className="bg-[#031B30] border border-[#17334D] rounded-xl p-4 mt-5">
                <p className="text-sm font-bold text-white mb-1">{t('matchCriteriaTitle') || 'Comment votre entreprise correspond à ce marché'}</p>
                <p className="text-[11px] text-[#B9BBC8] mb-3">
                  {t('matchCriteriaIntro') || 'Chaque critère compare votre entreprise à ce que le marché demande. Une information inconnue reste « à confirmer » et n\'est pas comptée.'}
                </p>
                <ul className="divide-y divide-[#17334D]">
                  {matchScore.matchCriteria.map(c => (
                    <li key={c.key} className="py-2.5 flex items-start gap-2.5">
                      {c.status === 'match'
                        ? <CheckCircle2 size={15} className="text-green-400 shrink-0 mt-0.5" />
                        : c.status === 'mismatch'
                          ? <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                          : <span className="w-[15px] h-[15px] rounded-full border border-[#5B6B80] shrink-0 mt-0.5" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white">{c.label}</p>
                        <p className="text-[11px] text-[#B9BBC8] mt-0.5 leading-relaxed">{c.detail}</p>
                      </div>
                      <span className={`text-[11px] font-bold shrink-0 ${c.status === 'match' ? 'text-green-400' : c.status === 'mismatch' ? 'text-red-400' : 'text-[#B9BBC8]'}`}>
                        {c.status === 'match' ? (t('matchStatusMatch') || 'Correspond') : c.status === 'mismatch' ? (t('matchStatusMismatch') || 'Ne correspond pas') : (t('matchStatusConfirm') || 'À confirmer')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Client (20 Sep, concordance point 4): the "Cessée" status on
                  VERIFRANCE HABITAT matches the live data.gouv.fr record
                  (siret.ts), so it is not a display bug - but its effect on
                  this score was only ever explained deep in the "Aperçu du
                  dossier" (scorePreviewStatusNotice below), where a visitor
                  may never scroll. Same condition, same wording, surfaced
                  right next to the score it actually affects. */}
              {siretCompany?.statut && siretCompany.statut !== 'Active' && (
                <div className="border-l-2 border-[#bd7027] bg-[#bd7027]/10 rounded-r-lg pl-3 pr-3 py-2.5 mt-4">
                  <p className="text-xs text-[#EAF0F6] leading-relaxed">
                    {t('scoreStatusNotice', { status: siretCompany.statut }) || `Statut « ${siretCompany.statut} » d'après la fiche officielle : l'indice ci-dessus ne tient pas compte de ce statut et doit être interprété avec prudence tant que la situation de l'entreprise n'est pas clarifiée.`}
                  </p>
                </div>
              )}

              {/* The "N entreprises avec un indice comparable ont remporté un
                  marché similaire" card was removed (20 Sep audit): its number
                  was derived from the opportunity id, not from any award
                  data, so it was an invented statistic even with its
                  "Exemple illustratif" caption. */}

              {/* 20 Sep audit: this was fixed copy claiming "Le lot, le budget
                  et les critères donnent des repères concrets" on every fiche,
                  including ones with no announced amount. It now only names
                  what the notice actually provides. */}
              {(() => {
                const repères: string[] = [];
                if (tradeLabel) repères.push(t('scoreReperLot') || 'le lot');
                if (opportunity.estimated_value) repères.push(t('scoreReperBudget') || 'le budget');
                if (opportunity.deadline) repères.push(t('scoreReperDeadline') || "l'échéance");
                if (repères.length === 0) return null;
                const list = repères.length > 1 ? `${repères.slice(0, -1).join(', ')} et ${repères[repères.length - 1]}` : repères[0];
                return (
                  <div className="border-l-2 border-orange rounded-r-lg bg-orange/5 pl-4 pr-3 py-3 mt-4">
                    <p className="text-sm text-white leading-relaxed">
                      <span className="font-bold">{t('scoreStructuredTitle') || 'Ce que l\'annonce précise.'}</span>{' '}
                      {(t('scoreStructuredDescDyn') || 'Repères disponibles pour préparer votre candidature : {list}.').replace('{list}', list)}
                      {!opportunity.estimated_value && ` ${t('scoreBudgetNotCommunicated') || "Le montant n'est pas communiqué."}`}
                    </p>
                  </div>
                );
              })()}

              {matchScore.whyRespond && (
                <div className="border-l-2 border-orange rounded-r-lg bg-orange/5 pl-4 pr-3 py-3 mt-4">
                  <p className="text-sm text-white leading-relaxed">{matchScore.whyRespond}</p>
                </div>
              )}

              {/* Fixed disclaimer (client's exact wording): this is never
                  an odds-of-winning estimate, only a fit measurement. */}
              <p className="text-[11px] text-[#5B6B80] leading-relaxed mt-4 pt-3 border-t border-[#17334D]">{matchScore.scoreDisclaimer}</p>

              {/* Client's 13 Sep concordance-apercu screenshots: this CTA is
                  always visible here, right under the score card - not
                  gated behind isAuthenticated/leadCaptured. An already-
                  qualified visitor jumps straight to screen 3; everyone
                  else scrolls down to the existing lead-capture card
                  ("Ceci n'est qu'un aperçu") instead of duplicating its
                  form logic. */}
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated || leadCaptured) setScreen(3);
                  else leadGateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="w-full bg-orange text-white font-bold py-3 rounded-xl hover:bg-orange/90 transition-colors mt-5"
              >
                {t('scorePrefilledCta') || 'Recevoir mon dossier pré-rempli'}
              </button>
              <p className="text-center text-[11px] text-[#B9BBC8] mt-2">{t('scoreReassurance') || 'Votre premier dossier de candidature pré-rempli offert'}</p>
            </div>

            {/* Client (19/20 Sep): "expliquer sur quels critères repose le
                pourcentage" + the 6-criterion table (Métier/Localisation/
                Moyens/Expérience/Calendrier/Qualifications), each row
                distinguishing correspondance identifiée / déclaration de
                l'entreprise / information à vérifier / difficulté détectée.
                Built entirely from data already real and present on this
                page (opportunity fields, siretCompany from the SIRET
                lookup, the visitor's own refineAnswers just below, and
                matchScore.eligibility for Qualifications) - no new backend
                call, and never a status stronger than what the underlying
                field actually supports (a self-reported refineAnswers
                'oui' is 'declared', never 'identified' - that tier is
                reserved for data this page can independently confirm). */}
            {(() => {
              const STATUS_META: Record<string, { label: string; className: string }> = {
                identified: { label: t('concordStatusIdentified') || 'Correspondance identifiée', className: 'bg-green-400/10 text-green-400' },
                declared: { label: t('concordStatusDeclared') || "Déclaration de l'entreprise", className: 'bg-orange/10 text-orange' },
                to_verify: { label: t('concordStatusToVerify') || 'Information à vérifier', className: 'bg-[#17334D] text-[#B9BBC8]' },
                issue: { label: t('concordStatusIssue') || 'Difficulté détectée', className: 'bg-red-500/10 text-red-400' },
              };
              const answerNote = (key: string, base: string, ifYes: string, ifNo: string): { status: keyof typeof STATUS_META; text: string } => {
                const a = refineAnswers[key];
                if (a === 'oui') return { status: 'declared', text: `${base} ${ifYes}` };
                if (a === 'non') return { status: 'issue', text: `${base} ${ifNo}` };
                return { status: 'to_verify', text: `${base} ${t('concordUnconfirmed') || "Capacité non confirmée par l'entreprise."}` };
              };
              const location = [opportunity.location_city, opportunity.location_region].filter(Boolean).join(', ');
              const metierRow = tradeLabel
                ? { status: siretCompany?.activity ? 'identified' as const : 'to_verify' as const,
                    text: siretCompany?.activity
                      ? `${t('concordMetierDemande') || 'Prestation demandée'} : ${tradeLabel} · ${t('concordMetierDeclare') || 'activité déclarée'} : ${siretCompany.activity}`
                      : `${t('concordMetierDemande') || 'Prestation demandée'} : ${tradeLabel} · ${t('concordMetierManquant') || "activité de l'entreprise non renseignée"}` }
                : { status: 'to_verify' as const, text: t('concordMetierAbsent') || "Le métier n'est pas précisé sur cette fiche." };
              const localisationRow = answerNote(
                'location',
                location ? `${t('concordLieu') || "Lieu d'intervention"} : ${location}.` : (t('concordLieuAbsent') || "Lieu d'intervention non précisé."),
                t('concordCapaciteOui') || "Vous avez indiqué pouvoir vous y déplacer.",
                t('concordCapaciteNon') || "Vous avez indiqué ne pas pouvoir vous y déplacer."
              );
              const moyensRow = answerNote(
                'capacity',
                t('concordMoyensBase') || 'Moyens requis non détaillés sur cette fiche.',
                t('concordMoyensOui') || 'Vous avez indiqué pouvoir les mobiliser.',
                t('concordMoyensNon') || 'Vous avez indiqué ne pas pouvoir les mobiliser actuellement.'
              );
              const experienceRow = answerNote(
                'experience',
                t('concordExpBase') || 'Expérience similaire non vérifiable automatiquement.',
                t('concordExpOui') || 'Prestation similaire déclarée - référence à préciser dans votre dossier.',
                t('concordExpNon') || 'Aucune prestation similaire déclarée.'
              );
              const calendarAnswer = answerNote(
                'calendar',
                opportunity.deadline ? `${t('concordEcheance') || 'Échéance'} : ${formatDate(opportunity.deadline)}.` : (t('concordEcheanceAbsente') || 'Échéance non communiquée.'),
                t('concordDispoOui') || 'Vous avez confirmé pouvoir la respecter.',
                t('concordDispoNon') || 'Vous avez indiqué ne pas pouvoir la respecter.'
              );
              const eligibilityRequired = matchScore.eligibility.filter(e => e.required);
              const eligibilityMet = eligibilityRequired.filter(e => e.met === true).length;
              const eligibilityUnmet = eligibilityRequired.filter(e => e.met === false).length;
              const eligibilityUnknown = eligibilityRequired.filter(e => e.met == null).length;
              const qualifRow = matchScore.eligibility.length === 0
                ? { status: 'to_verify' as const, text: t('concordQualifAbsent') || "Aucune exigence de qualification détectée dans les documents disponibles." }
                : eligibilityUnmet > 0
                  ? { status: 'issue' as const, text: `${eligibilityUnmet} ${t('concordQualifUnmetSuffix') || 'exigence(s) non satisfaite(s) parmi celles mentionnées dans les documents du marché.'}` }
                  : eligibilityUnknown > 0
                    ? { status: 'to_verify' as const, text: `${eligibilityMet}/${eligibilityRequired.length} ${t('concordQualifPartialSuffix') || 'exigences confirmées ; le reste ne peut pas être vérifié avec les informations disponibles.'}` }
                    : { status: 'identified' as const, text: `${eligibilityRequired.length} ${t('concordQualifMetSuffix') || 'exigence(s) mentionnée(s) dans les documents, toutes satisfaites par votre profil.'}` };

              const rows: { key: string; label: string; status: keyof typeof STATUS_META; text: string }[] = [
                { key: 'metier', label: t('concordCritMetier') || 'Métier', ...metierRow },
                { key: 'localisation', label: t('concordCritLocalisation') || 'Localisation', ...localisationRow },
                { key: 'moyens', label: t('concordCritMoyens') || 'Moyens', ...moyensRow },
                { key: 'experience', label: t('concordCritExperience') || 'Expérience', ...experienceRow },
                { key: 'calendrier', label: t('concordCritCalendrier') || 'Calendrier', ...calendarAnswer },
                { key: 'qualifications', label: t('concordCritQualifications') || 'Qualifications', ...qualifRow },
              ];

              return (
                <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
                  <h2 className="text-sm font-extrabold text-white mb-1">{t('concordBreakdownTitle') || 'Sur quoi repose ce pourcentage'}</h2>
                  <p className="text-xs text-[#B9BBC8] mb-4">{t('concordBreakdownSub') || 'Les six critères réellement comparés pour ce marché.'}</p>
                  <div className="divide-y divide-[#17334D]">
                    {rows.map(row => (
                      <div key={row.key} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-bold text-white">{row.label}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_META[row.status].className}`}>
                            {STATUS_META[row.status].label}
                          </span>
                        </div>
                        <p className="text-xs text-[#B9BBC8] leading-relaxed">{row.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* "Affinez votre concordance" self-assessment accordion
                (client's 12 Sep reference): purely a reflection prompt for
                the visitor, doesn't alter the server-computed score.
                Client's 15 Sep audit: the illustrative +1/-3/0 points and
                the "Barème à valider avant intégration" dev note were
                leaking into the visitor-facing UI as if real - removed;
                answers are just acknowledged and passed along with the
                dossier request, nothing folded into matchScore.score. */}
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
              <button type="button" onClick={() => setRefineOpen(o => !o)} className="w-full flex items-center justify-between text-left">
                <span className="text-sm font-extrabold text-white">{t('concordRefineTitle') || 'Affinez votre concordance'}</span>
                <ChevronDown size={16} className={`text-orange shrink-0 transition-transform ${refineOpen ? 'rotate-180' : ''}`} />
              </button>
              {!refineOpen && (
                <p className="text-xs mt-1">
                  {allRefineAnswered
                    ? <span className="text-orange font-semibold">{t('refineEditAnswers') || 'Modifier mes réponses'}</span>
                    : <span className="text-[#B9BBC8]">{t('concordRefineSub') || '4 réponses facultatives · expérience, moyens, zone et calendrier'}</span>}
                </p>
              )}
              {refineOpen && (
                <div className="mt-4 space-y-4">
                  <p className="text-xs text-[#B9BBC8]">{t('refineHelp') || 'Vos réponses seront jointes à votre demande de dossier. Vous pouvez aussi le demander sans répondre.'}</p>
                  {[
                    { key: 'experience', q: t('concordRefineQ1') || 'Avez-vous déjà réalisé une prestation similaire ?' },
                    { key: 'capacity', q: t('concordRefineQ2') || 'Pouvez-vous mobiliser les moyens nécessaires pour cette prestation ?', help: t('refineQ2Help') || 'Vous-même, votre équipe ou vos partenaires.' },
                    { key: 'location', q: t('concordRefineQ3') || 'Pouvez-vous intervenir ou livrer dans la zone indiquée ?' },
                    { key: 'calendar', q: t('refineQ4') || 'Pouvez-vous respecter le calendrier indiqué ?', help: t('refineQ4Help') || 'Si le calendrier manque ou reste incertain, choisissez « À confirmer ».' },
                  ].map(row => (
                    <div key={row.key} className="pb-4 border-b border-[#17334D] last:border-0 last:pb-0">
                      <p className="text-xs font-bold text-white mb-1">{row.q}</p>
                      {row.help && <p className="text-[11px] text-[#B9BBC8] mb-2">{row.help}</p>}
                      <div className="flex gap-2">
                        {(['oui', 'non', 'a_confirmer'] as const).map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setRefineAnswers(a => ({ ...a, [row.key]: opt }))}
                            className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${
                              refineAnswers[row.key] === opt
                                ? 'bg-orange border-orange text-white'
                                : 'border-[#17334D] text-[#B9BBC8] hover:border-orange/40'
                            }`}
                          >
                            {opt === 'oui' ? (t('concordRefineYes') || 'Oui') : opt === 'non' ? (t('concordRefineNo') || 'Non') : (t('concordRefineUnsure') || 'À confirmer')}
                          </button>
                        ))}
                      </div>
                      {refineAnswers[row.key] && (() => {
                        const crit = matchScore.matchCriteria.find(c => c.key === CRITERION_FOR_ANSWER[row.key]);
                        if (!crit) return null;
                        return (
                          <p className={`text-[11px] mt-2 font-semibold ${crit.status === 'match' ? 'text-green-400' : crit.status === 'mismatch' ? 'text-red-400' : 'text-[#B9BBC8]'}`}>
                            {crit.label} : {crit.status === 'match' ? (t('matchStatusMatch') || 'Correspond') : crit.status === 'mismatch' ? (t('matchStatusMismatch') || 'Ne correspond pas') : (t('matchStatusConfirm') || 'À confirmer')}
                          </p>
                        );
                      })()}
                    </div>
                  ))}
                  <p className="text-[11px] text-[#B9BBC8]">
                    {t('refineNote') || 'Réponses déclaratives, transmises avec votre demande de dossier.'}
                  </p>
                </div>
              )}
            </div>

            {/* "Les points forts de cette opportunité pour vous" (client's
                12 Sep reference): derived straight from real opportunity/
                matchScore fields already on this page - never a separate
                fabricated data source.
                Client's 20 Sep audit, point 3: even with a neutral label
                and only the icon colour/desc signalling absence (the C05
                fix below), a missing fact sitting inside a "points forts"
                list still reads as a strength - client's own wording this
                time: "Une information inconnue doit apparaître comme un
                point à vérifier, pas comme un point fort." Split into two
                actual sections instead of one list with mixed ok/not-ok
                rows: only present facts stay under "points forts"; missing
                ones move to their own "à vérifier" block below it.
                Contre-audit 15 Sep, C05: the payment row's label used to
                stay "Paiement public" even on a private-market opportunity
                (only its desc switched to the private-market explanation),
                so a private fiche showed a public-sounding title next to a
                private-sounding sentence. Every row here keeps a neutral
                category label regardless of ok/not-ok ("Budget défini"
                stays put whether or not a budget exists) - that part of
                the fix still holds, it just no longer decides which
                section a row lands in. */}
            {(() => {
              const rows = [
                { icon: Briefcase, ok: !!tradeLabel, label: t('strengthLot') || 'Lot / métier identifié', desc: tradeLabel || (t('strengthLotMissing') || "Le métier n'est pas précisé sur cette fiche."), verifyLabel: t('verifyLot') || 'Métier à confirmer' },
                { icon: Euro, ok: !!opportunity.estimated_value, label: t('strengthBudget') || 'Budget défini', desc: opportunity.estimated_value ? `${new Intl.NumberFormat('fr-FR').format(opportunity.estimated_value)} € HT` : (t('strengthBudgetMissing') || "Le montant n'est pas communiqué."), verifyLabel: t('verifyBudget') || 'Budget à vérifier' },
                { icon: MapPin, ok: !!opportunity.location_city, label: t('strengthLocation') || 'Localisation précisée', desc: [opportunity.location_city, opportunity.location_region].filter(Boolean).join(', ') || (t('strengthLocationMissing') || "La localisation n'est pas précisée."), verifyLabel: t('verifyLocation') || 'Localisation à vérifier' },
                { icon: Calendar, ok: !!opportunity.deadline, label: t('strengthCalendar') || 'Calendrier identifié', desc: opportunity.deadline ? formatDate(opportunity.deadline) : (t('strengthCalendarMissing') || "La date limite n'est pas communiquée."), verifyLabel: t('verifyCalendar') || 'Échéance à vérifier' },
                { icon: Landmark, ok: opportunity.journey === 'public_procurement', label: t('strengthPayment') || 'Conditions de paiement', desc: opportunity.journey === 'public_procurement' ? (t('strengthPaymentDesc') || 'Les conditions de règlement du contrat vous permettent d\'évaluer vos besoins de trésorerie.') : (t('strengthPaymentMissing') || "Marché privé : les conditions de paiement dépendent du contrat."), verifyLabel: t('verifyPayment') || 'Conditions de paiement à préciser' },
                { icon: Award, ok: matchScore.criteria.length > 0, label: t('strengthCriteria') || 'Critères de notation identifiés', desc: matchScore.criteria.length > 0 ? matchScore.criteria.map(c => c.label).join(', ') : (t('strengthCriteriaMissing') || "Les critères de notation ne sont pas détaillés sur cette fiche."), verifyLabel: t('verifyCriteria') || 'Critères de notation à vérifier' },
              ];
              const present = rows.filter(r => r.ok);
              const missing = rows.filter(r => !r.ok);
              return (
                <>
                  <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
                    <button type="button" onClick={() => setStrengthsOpen(o => !o)} className="w-full flex items-center justify-between text-left">
                      <span className="text-sm font-extrabold text-white">{t('strengthsTitle') || 'Les points forts de cette opportunité pour vous'}</span>
                      <ChevronDown size={16} className={`text-orange shrink-0 transition-transform ${strengthsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {strengthsOpen && (
                      <div className="divide-y divide-[#17334D] mt-4">
                        {present.length === 0 && (
                          <p className="text-xs text-[#B9BBC8] py-2">{t('strengthsNoneYet') || "Cette fiche ne contient pas encore assez d'informations confirmées pour dégager des points forts."}</p>
                        )}
                        {present.map((row, i) => (
                          <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-400/10">
                              <row.icon size={15} className="text-green-400" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white">{row.label}</p>
                              <p className="text-xs text-[#B9BBC8] mt-0.5">{row.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {strengthsOpen && missing.length > 0 && (
                    <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 mt-3">
                      <span className="text-sm font-extrabold text-white">{t('toVerifyTitle') || 'À vérifier avant de candidater'}</span>
                      <div className="divide-y divide-[#17334D] mt-4">
                        {missing.map((row, i) => (
                          <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#17334D]">
                              <row.icon size={15} className="text-[#5B6B80]" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white">{row.verifyLabel}</p>
                              <p className="text-xs text-[#B9BBC8] mt-0.5">{row.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            </div>
          ) : null}

                {/* Client's 14 Sep report: logged-in/already-qualified
                    visitors never saw this at all, since the whole block
                    used to be gated behind !(isAuthenticated ||
                    leadCaptured) - the excerpt toggle is useful to anyone,
                    not just visitors still deciding whether to hand over
                    contact info. Only the email/phone capture form itself
                    stays gated below; the excerpt viewer is always here. */}
                <div ref={leadGateRef} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
                  {!(isAuthenticated || leadCaptured) ? (
                    <>
                      <p className="flex items-center gap-2 text-lg font-extrabold text-white mb-2">
                        <Copy size={17} className="text-orange shrink-0" /> {t('scorePreviewOnlyTitle') || "Ceci n'est qu'un aperçu"}
                      </p>
                      <p className="text-sm text-[#B9BBC8] mb-1">{t('scorePreviewCopy') || 'Recevez votre dossier de candidature pré-rempli pour votre entreprise et ce marché.'}</p>
                      <p className="text-sm text-[#B9BBC8] mb-4">{t('scorePreviewIncomplete') || 'Une base à compléter et à vérifier avec vos pièces avant le dépôt.'}</p>
                    </>
                  ) : (
                    <p className="flex items-center gap-2 text-lg font-extrabold text-white mb-4">
                      <Copy size={17} className="text-orange shrink-0" /> {t('scorePreviewAuthedTitle') || 'Extrait de votre dossier'}
                    </p>
                  )}

                    {/* Client's 13 Sep concordance-apercu screenshots: the
                        excerpt link and the "viewed today" counter sit
                        together in one plain bordered box (no reddish
                        tint) - only the counter's own text is colored. */}
                    <div className="bg-[#031B30] border border-[#17334D] rounded-xl p-4 mb-4">
                      <button type="button" onClick={() => setExcerptOpen(o => !o)} className="flex items-center gap-2 text-sm text-orange font-semibold hover:underline">
                        <Search size={14} /> {excerptOpen ? (t('scorePreviewClose') || "Refermer l'extrait") : (t('scorePreviewSample') || 'Voir un extrait de mon dossier')}
                      </button>
                      {realConsultations != null && realConsultations > 0 && (
                        <div className="flex items-start gap-2 mt-3">
                          <span className="relative flex w-1.5 h-1.5 shrink-0 mt-1">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-red-500" />
                          </span>
                          <p className="text-sm text-red-200">
                            {realConsultations} {t('consultationsLabel') || 'consultations récentes'}
                          </p>
                        </div>
                      )}
                    </div>
                    {excerptOpen && (() => {
                      const answerLabel = (key: string) => {
                        const v = refineAnswers[key];
                        return v === 'oui' ? (t('refineYes') || 'Oui') : v === 'non' ? (t('refineNo') || 'Non') : v === 'a_confirmer' ? (t('refineUnsure') || 'À confirmer') : (t('scorePreviewUnanswered') || 'Non renseigné');
                      };
                      return (
                      <div className="bg-[#F1F4F7] text-[#203242] rounded-xl overflow-hidden mb-4 text-xs">
                        <div className="bg-[#102D44] text-white px-4 py-4 border-t-4 border-orange">
                          <p className="font-bold text-[15px] text-white">{t('brandName') || 'Marchés'} <span className="text-orange">{t('brandDirect') || 'Direct'}</span></p>
                          <p className="text-[#c5d4e0] mt-3">{t('scorePreviewLabel') || 'Extrait personnalisé · démonstration'}</p>
                          <h4 className="text-[19px] font-bold mt-1 mb-3">{t('scorePreviewDocTitle') || 'Votre dossier de candidature'}</h4>
                          <div className="pt-3 border-t border-[#49627a]">
                            <p className="font-bold">{siretCompany?.name || (t('dossierPrefilledYourCompany') || 'Votre entreprise')}</p>
                            <p className="text-[#c5d4e0]">{opportunity.title}</p>
                          </div>
                        </div>
                        <div className="p-4 space-y-4">
                          <p className="text-[#4f6474]">{t('scorePreviewBaseLabel') || 'Base pré-remplie · à compléter avant dépôt'}</p>

                          {/* C07 (contre-audit 15 Sep): the excerpt read as a
                              short generic fiche (identity + presentation +
                              one-paragraph trame + piece list) rather than a
                              real technical memo with a sommaire and enough
                              substance to fill the promised 10-15 pages.
                              Two changes: (1) an actual table of contents up
                              front, listing every section including the
                              blurred ones, so the document reads as one
                              continuous mémoire rather than a 6-block
                              summary; (2) the single "trame de réponse
                              technique" paragraph is split into the sections
                              a real technical memo for a public/private
                              tender actually needs (context, methodology,
                              means, planning, QSE) instead of one generic
                              3-bullet plan - each with enough guidance text
                              to represent a real page once filled in, not
                              filler. Nothing here is fabricated company data:
                              every section is either real (siretCompany/
                              opportunity fields, the visitor's own refine
                              answers) or explicitly marked "à compléter",
                              same discipline as before this change. */}
                          <section className="pt-1">
                            <h4 className="font-bold mb-2 text-[13px]">{t('scorePreviewSommaireTitle') || 'Sommaire'}</h4>
                            <ol className="space-y-1 text-[#4f6474]">
                              <li className="flex justify-between gap-2"><span>01. {t('scorePreviewSection01Title') || "Identification de l'entreprise"}</span><span>p.1</span></li>
                              <li className="flex justify-between gap-2"><span>02. {t('scorePreviewSection02Title') || "Présentation de l'entreprise"}</span><span>p.2</span></li>
                              <li className="flex justify-between gap-2"><span>03. {t('scorePreviewSection03aTitle') || 'Contexte et enjeux du marché'}</span><span>p.3</span></li>
                              <li className="flex justify-between gap-2"><span>04. {t('scorePreviewSection03bTitle') || "Méthodologie d'intervention"}</span><span>p.4-6</span></li>
                              <li className="flex justify-between gap-2"><span>05. {t('scorePreviewSection03cTitle') || 'Moyens humains et matériels'}</span><span>p.7</span></li>
                              <li className="flex justify-between gap-2"><span>06. {t('scorePreviewSection03dTitle') || "Planning prévisionnel d'exécution"}</span><span>p.8</span></li>
                              <li className="flex justify-between gap-2"><span>07. {t('scorePreviewSection03eTitle') || 'Démarche qualité, sécurité et environnement'}</span><span>p.9</span></li>
                              <li className="flex justify-between gap-2 opacity-60"><span>08. {t('scorePreviewSection04Title') || 'Vos premières réponses'}</span><span>p.10</span></li>
                              <li className="flex justify-between gap-2 opacity-60"><span>09. {t('scorePreviewSection05Title') || 'Pièces à rassembler'}</span><span>p.11-12</span></li>
                              <li className="flex justify-between gap-2 opacity-60"><span>10. {t('scorePreviewSection06Title') || 'Pour finaliser votre candidature'}</span><span>p.13</span></li>
                            </ol>
                            <p className="text-[10px] text-[#7c8b98] mt-2">{t('scorePreviewSommaireNote') || 'Pagination indicative : la longueur réelle dépend du contenu que vous complétez dans chaque section.'}</p>
                          </section>

                          <section className="pt-3 border-t border-[#c4d0da]">
                            <h4 className="font-bold mb-2">{t('scorePreviewSection01') || '01. Identification de l\'entreprise'} <span className="inline-block text-[11px] rounded px-1.5 py-0.5 text-[#205d44] bg-[#dcebe2] ml-1">{t('scorePreviewPrefilled') || 'Pré-rempli'}</span></h4>
                            <dl className="grid grid-cols-[minmax(90px,0.7fr)_minmax(0,1.3fr)] gap-x-3 gap-y-1.5">
                              <dt className="text-[#4f6474]">{t('scorePreviewCompanyName') || 'Raison sociale'}</dt><dd className="font-bold">{siretCompany?.name || '—'}</dd>
                              <dt className="text-[#4f6474]">SIRET</dt><dd>{siretCompany?.siret || '—'}</dd>
                              <dt className="text-[#4f6474]">{t('scorePreviewLocation') || 'Implantation'}</dt><dd>{[siretCompany?.city, siretCompany?.postal].filter(Boolean).join(' · ') || '—'}</dd>
                              <dt className="text-[#4f6474]">{t('scorePreviewDeclaredActivity') || 'Activité déclarée'}</dt><dd>{siretCompany?.activity || siretCompany?.ape || '—'}</dd>
                            </dl>
                            {siretCompany?.statut && siretCompany.statut !== 'Active' && (
                              <p className="border-l-2 border-[#bd7027] pl-2.5 text-[#664320] mt-2">
                                {t('scorePreviewStatusNotice', { status: siretCompany.statut }) || `Statut « ${siretCompany.statut} » : l'identité et la situation de l'entreprise doivent être clarifiées avant d'utiliser ce dossier.`}
                              </p>
                            )}
                          </section>

                          <section className="pt-3 border-t border-[#c4d0da]">
                            <h4 className="font-bold mb-2">{t('scorePreviewSection02') || "02. Présentation de l'entreprise"} <span className="inline-block text-[11px] rounded px-1.5 py-0.5 text-[#205d44] bg-[#dcebe2] ml-1">{t('scorePreviewDrafted') || 'Pré-rédigée'}</span></h4>
                            <p className="border-l-2 border-[#439377] bg-[#e5eee8] text-[#213c31] rounded-r p-3">
                              <span className="block text-[#38654d] mb-1">{t('scorePreviewDraftLabel') || 'Texte préparé pour votre dossier'}</span>
                              {t('scorePreviewDraftText', {
                                company: siretCompany?.name || (t('dossierPrefilledYourCompany') || 'Votre entreprise'),
                                siret: siretCompany?.siret || '',
                                city: siretCompany?.city || '',
                                activity: siretCompany?.activity || siretCompany?.ape || '',
                                opportunity: opportunity.title,
                              }) || `${siretCompany?.name || 'Votre entreprise'}${siretCompany?.city ? ` est implantée à ${siretCompany.city}` : ''}${siretCompany?.siret ? ` sous le SIRET ${siretCompany.siret}` : ''}.${siretCompany?.activity || siretCompany?.ape ? ` Son activité déclarée concerne ${siretCompany.activity || siretCompany.ape}.` : ''} La présente préparation porte sur : ${opportunity.title}.`}
                            </p>
                            <p className="mt-2"><strong>{t('scorePreviewToComplete') || 'À compléter :'}</strong> {t('scorePreviewToCompleteDesc') || "présentation de l'équipe, organisation, moyens matériels et périmètre d'intervention effectivement assuré."}</p>
                          </section>

                          <section className="pt-3 border-t border-[#c4d0da]">
                            <h4 className="font-bold mb-2">{t('scorePreviewSection03a') || '03. Contexte et enjeux du marché'} <span className="inline-block text-[11px] rounded px-1.5 py-0.5 text-[#205d44] bg-[#dcebe2] ml-1">{t('scorePreviewPrepared') || 'Préparée'}</span></h4>
                            <p>{t('scorePreviewSection03aBody', { opportunity: opportunity.title }) || `Rappel de l'objet du marché (« ${opportunity.title} »), des attentes du donneur d'ordre telles qu'elles ressortent du dossier de consultation, et des points de vigilance identifiés dans l'annonce.`}</p>
                            <p className="mt-1">{t('scorePreviewSection03aNotice') || "À renseigner : votre lecture des enjeux propres à ce marché (contraintes de site, délais, exigences particulières du règlement de consultation)."}</p>
                          </section>

                          <section className="pt-3 border-t border-[#c4d0da]">
                            <h4 className="font-bold mb-2">{t('scorePreviewSection03') || '04. Méthodologie d\'intervention'} <span className="inline-block text-[11px] rounded px-1.5 py-0.5 text-[#205d44] bg-[#dcebe2] ml-1">{t('scorePreviewPrepared') || 'Préparée'}</span></h4>
                            <p>{t('scorePreviewSection03Intro') || "Plan de rédaction proposé à partir de l'intitulé du marché. À adapter au dossier technique et à vos méthodes réelles."}</p>
                            <ol className="mt-2 space-y-2">
                              <li className="pb-2 border-b border-[#c4d0da]"><strong className="block">{t('scorePreviewMilestone1') || "Préparer l'intervention"}</strong>{t('scorePreviewMilestone1Desc') || "Décrire le repérage des éléments concernés, les accès, la protection des zones de travail et l'organisation de votre équipe."}</li>
                              <li className="pb-2 border-b border-[#c4d0da]"><strong className="block">{t('scorePreviewMilestone2') || 'Organiser les travaux'}</strong>{t('scorePreviewMilestone2Desc') || "Présenter l'enchaînement proposé, les moyens mobilisés et la coordination des interventions."}</li>
                              <li><strong className="block">{t('scorePreviewMilestone3') || 'Contrôler et remettre'}</strong>{t('scorePreviewMilestone3Desc') || "Préciser les contrôles, essais et réglages envisagés, puis les documents et consignes remis en fin d'intervention."}</li>
                            </ol>
                            <p className="border-l-2 border-[#bd7027] pl-2.5 text-[#664320] mt-2">{t('scorePreviewSection03Notice') || 'À renseigner : moyens prévus, effectif mobilisé, durée, contraintes du site et prestations exactes demandées.'}</p>
                          </section>

                          <section className="pt-3 border-t border-[#c4d0da]">
                            <h4 className="font-bold mb-2">{t('scorePreviewSection03c') || '05. Moyens humains et matériels'} <span className="inline-block text-[11px] rounded px-1.5 py-0.5 text-[#205d44] bg-[#dcebe2] ml-1">{t('scorePreviewPrepared') || 'Préparée'}</span></h4>
                            <p>{t('scorePreviewSection03cBody') || "Effectif dédié à ce chantier, qualifications mobilisées, matériel et véhicules affectés. Un tableau récapitulatif (nom du poste, nombre, qualification) est attendu ici."}</p>
                            <p className="mt-1 border-l-2 border-[#bd7027] pl-2.5 text-[#664320]">{t('scorePreviewSection03cNotice') || 'À renseigner : effectif réel affecté, qualifications et habilitations, liste du matériel mobilisé.'}</p>
                          </section>

                          <section className="pt-3 border-t border-[#c4d0da]">
                            <h4 className="font-bold mb-2">{t('scorePreviewSection03d') || '06. Planning prévisionnel d\'exécution'} <span className="inline-block text-[11px] rounded px-1.5 py-0.5 text-[#205d44] bg-[#dcebe2] ml-1">{t('scorePreviewPrepared') || 'Préparée'}</span></h4>
                            <p>{t('scorePreviewSection03dBody') || "Calendrier prévisionnel des phases décrites en section 04 (préparation, exécution, réception), rapporté à l'échéance de ce marché. Un planning détaillé (Gantt ou tableau par semaine) est attendu ici."}</p>
                            <p className="mt-1 border-l-2 border-[#bd7027] pl-2.5 text-[#664320]">{t('scorePreviewSection03dNotice') || "À renseigner : dates réelles, durée d'exécution envisagée, jalons intermédiaires."}</p>
                          </section>

                          <section className="pt-3 border-t border-[#c4d0da]">
                            <h4 className="font-bold mb-2">{t('scorePreviewSection03e') || '07. Démarche qualité, sécurité et environnement'} <span className="inline-block text-[11px] rounded px-1.5 py-0.5 text-[#205d44] bg-[#dcebe2] ml-1">{t('scorePreviewPrepared') || 'Préparée'}</span></h4>
                            <p>{t('scorePreviewSection03eBody') || "Dispositions prévues en matière de sécurité (plan de prévention, EPI), de contrôle qualité (auto-contrôles, réception) et de gestion environnementale (déchets, nuisances) sur ce chantier."}</p>
                            <p className="mt-1 border-l-2 border-[#bd7027] pl-2.5 text-[#664320]">{t('scorePreviewSection03eNotice') || 'À renseigner : certifications détenues (Qualibat, RGE, MASE...), procédures internes applicables à ce marché.'}</p>
                          </section>

                          {/* Client's 13 Sep reference (marches-direct-memoire-defilement.html):
                              first 2-3 "pages" fully readable, rest blurred
                              with an unlock invitation - same email+phone
                              capture already gates this whole excerpt, so
                              this blur is the excerpt's own internal
                              preview-of-a-preview, not a second signup. */}
                          <div className="relative overflow-hidden rounded-lg -mx-1 px-1">
                            <div className="filter blur-[3px] select-none pointer-events-none opacity-50 space-y-4">
                              <section className="pt-3 border-t border-[#c4d0da]">
                                <h4 className="font-bold mb-2">{t('scorePreviewSection04') || '08. Vos premières réponses'}</h4>
                                <p className="text-[#4f6474] mb-2">{t('scorePreviewSection04Intro') || 'Les réponses renseignées dans la concordance sont reprises ici.'}</p>
                                <dl className="grid grid-cols-[minmax(90px,0.7fr)_minmax(0,1.3fr)] gap-x-3 gap-y-1.5">
                                  <dt className="text-[#4f6474]">{t('scorePreviewExperience') || 'Expérience similaire'}</dt><dd>{answerLabel('experience')}</dd>
                                  <dt className="text-[#4f6474]">{t('scorePreviewCapacity') || 'Moyens mobilisables'}</dt><dd>{answerLabel('capacity')}</dd>
                                  <dt className="text-[#4f6474]">{t('scorePreviewLocationZone') || "Zone d'intervention"}</dt><dd>{answerLabel('location')}</dd>
                                  <dt className="text-[#4f6474]">{t('scorePreviewCalendar') || 'Calendrier'}</dt><dd>{answerLabel('calendar')}</dd>
                                </dl>
                                <p className="mt-2"><strong>{t('scorePreviewRefToDetail') || 'Référence à détailler :'}</strong> {t('scorePreviewRefToDetailDesc') || "client, nature de la prestation, année, rôle de votre entreprise et résultat obtenu. Ces éléments restent à fournir."}</p>
                              </section>

                              <section className="pt-3 border-t border-[#c4d0da]">
                                <h4 className="font-bold mb-2">{t('scorePreviewSection05') || '09. Pièces à rassembler'}</h4>
                                <p className="text-[#4f6474] mb-2">{t('scorePreviewSection05Intro') || 'Liste de préparation indicative, à adapter aux pièces réellement demandées dans le règlement de consultation.'}</p>
                                <ul className="list-disc pl-4 space-y-1.5">
                                  <li>{t('scorePreviewPiece1') || "Les justificatifs d'identification et les coordonnées du représentant de l'entreprise."}</li>
                                  <li>{t('scorePreviewPiece2') || 'Les références professionnelles utiles et les éléments décrivant vos moyens.'}</li>
                                  <li>{t('scorePreviewPiece3') || 'Les attestations, assurances ou qualifications demandées, avec leur validité à vérifier.'}</li>
                                  <li>{t('scorePreviewPiece4') || 'Les formulaires et pièces spécifiques exigés pour ce marché.'}</li>
                                </ul>
                              </section>

                              <section className="pt-3 border-t border-[#c4d0da]">
                                <h4 className="font-bold mb-2">{t('scorePreviewSection06') || '10. Pour finaliser votre candidature'}</h4>
                                <ol className="list-decimal pl-4 space-y-1.5">
                                  <li>{t('scorePreviewStep1') || 'Confirmer les informations et la situation de votre entreprise.'}</li>
                                  <li>{t('scorePreviewStep2') || 'Compléter vos références, vos moyens et le périmètre de votre réponse.'}</li>
                                  <li>{t('scorePreviewStep3') || "Rassembler les pièces demandées et relire l'ensemble."}</li>
                                  <li>{t('scorePreviewStep4') || "Vérifier les modalités et l'échéance du dépôt sur la plateforme officielle."}</li>
                                </ol>
                              </section>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                              <p className="bg-[#0f2747] text-white text-xs font-bold text-center rounded-xl px-4 py-3 shadow-lg max-w-[85%]">
                                {t('scorePreviewLocked') || 'Aperçu réservé — recevez l\'exemplaire complet gratuitement'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })()}

                  {!(isAuthenticated || leadCaptured || pendingOtpVerification) && (
                    <form onSubmit={handleLeadSubmit} className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-1.5">{t('leadEmailFieldLabel') || 'Votre e-mail'}</label>
                        <input
                          value={leadEmail}
                          onChange={e => setLeadEmail(e.target.value)}
                          type="email"
                          placeholder={t('leadEmailPlaceholder') || 'vous@exemple.fr'}
                          className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-1.5">{t('leadPhoneFieldLabel') || 'Votre téléphone'}</label>
                        <input
                          value={leadPhone}
                          onChange={e => setLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          inputMode="numeric"
                          placeholder={t('leadPhonePlaceholder') || '06 12 34 56 78'}
                          className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50"
                        />
                      </div>
                      {leadError && <p className="text-xs text-red-400">{leadError}</p>}
                      {/* Client's 12 Sep ask (with reference screenshot): keep
                          this consent text and the two links small, muted
                          gray, deliberately low-attention - the priority
                          stays on the score/analysis and the email/phone
                          fields above, not on legal copy. Still real,
                          clickable links (Confidentialité -> the existing
                          privacy page; Préférences de contact -> its "Vos
                          droits (RGPD)" section, the closest existing page
                          to a contact-preferences center - there's no
                          separate one for an anonymous, not-yet-logged-in
                          visitor to land on). */}
                      <p className="text-[11px] text-[#5B6B80] leading-relaxed">
                        {t('leadConsentText')}
                      </p>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setContactPrefsOpen(o => !o)} className="text-[11px] text-[#5B6B80] underline decoration-[#5B6B80]/50 hover:text-[#8B95A5] transition-colors">
                          {t('leadContactPreferences') || 'Préférences de contact'}
                        </button>
                        <button type="button" onClick={() => setPrivacyPanelOpen(o => !o)} className="text-[11px] text-[#5B6B80] underline decoration-[#5B6B80]/50 hover:text-[#8B95A5] transition-colors">
                          {t('privacy') || 'Confidentialité'}
                        </button>
                      </div>
                      {contactPrefsOpen && (
                        <div className="bg-[#031B30] border border-[#17334D] rounded-lg p-3 space-y-2">
                          <p className="text-xs font-bold text-white">{t('contactPrefsTitle') || 'Vos préférences de contact'}</p>
                          <label className="block">
                            <span className="text-[11px] text-[#B9BBC8] block mb-1">{t('contactPrefsUsageLabel') || 'Utilisation de mes coordonnées'}</span>
                            <select
                              value={contactMode}
                              onChange={e => setContactMode(e.target.value as 'followup' | 'request-only')}
                              className="w-full bg-[#061D32] border border-[#17334D] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-orange/50"
                            >
                              <option value="followup">{t('contactPrefsFollowup') || "Suivi et offres d'accompagnement"}</option>
                              <option value="request-only">{t('contactPrefsRequestOnly') || 'Suivi de ma demande uniquement'}</option>
                            </select>
                          </label>
                          <p className="text-[11px] text-[#5B6B80]">{t('contactPrefsHelp') || 'Nous pouvons échanger au sujet de votre dossier et vous présenter notre accompagnement.'}</p>
                          <p className="text-[11px] text-[#5B6B80]">{t('contactPrefsNote') || "Ce choix ne change pas l'envoi de votre dossier pré-rempli."}</p>
                          {contactMode === 'request-only' && (
                            <p className="text-[11px] text-green-400">{t('contactPrefsConfirmed') || 'Votre opposition aux sollicitations commerciales est prise en compte.'}</p>
                          )}
                          <button type="button" onClick={() => setContactPrefsOpen(false)} className="text-[11px] text-orange font-semibold hover:underline">
                            {t('contactPrefsClose') || 'Fermer les préférences'}
                          </button>
                        </div>
                      )}
                      {privacyPanelOpen && (
                        // Reference's own aside ("Avant publication, compléter la
                        // notice avec l'identité du responsable, les bases
                        // légales...") is a note to whoever finalizes the legal
                        // copy, not end-user text - deliberately not reproduced
                        // here. Real legal review (responsable de traitement,
                        // bases légales RGPD, durée de conservation) still
                        // needed before this is final; links to the fuller
                        // /confidentialite page in the meantime.
                        <div className="bg-[#031B30] border border-[#17334D] rounded-lg p-3 space-y-2">
                          <p className="text-xs font-bold text-white">{t('privacyPanelTitle') || 'Vos données'}</p>
                          <p className="text-[11px] text-[#5B6B80] leading-relaxed">
                            {t('privacyPanelBody') || "Vos coordonnées servent à préparer et envoyer le dossier, à préciser votre demande et, selon vos préférences, à vous présenter les services d'accompagnement. Le choix « Suivi de ma demande uniquement » exclut les appels et messages de prospection ; seuls les échanges nécessaires au traitement de votre demande restent possibles."}
                          </p>
                          <Link to="/confidentialite" target="_blank" rel="noopener noreferrer" className="text-[11px] text-orange font-semibold hover:underline">
                            {t('privacyPanelFullPolicy') || 'Consulter la politique de confidentialité complète'}
                          </Link>
                        </div>
                      )}
                      {/* Client's 13 Sep concordance-apercu screenshots: no
                          "Retour" button down here - the page's persistent
                          back arrow at the very top already covers
                          navigation for every screen, and the reference
                          only shows the single full-width submit CTA. */}
                      <button type="submit" disabled={leadSubmitting} className="w-full flex items-center justify-center gap-2 bg-orange text-white font-bold py-3 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50">
                        {leadSubmitting ? <Loader2 size={14} className="animate-spin" /> : null} {t('leadSubmit')}
                      </button>
                      <p className="text-center text-[11px] text-[#B9BBC8]">{t('scoreReassurance') || 'Votre premier dossier de candidature pré-rempli offert'}</p>
                    </form>
                  )}

                  {/* C08 (contre-audit 15 Sep 2026): "Le téléphone réel
                      devait être vérifié avant accès au document offert."
                      Shown once the phone/email above are captured but not
                      yet OTP-confirmed - replaces the form (same card, no
                      extra navigation) rather than advancing to screen 3,
                      so an unverified phone can never reach the Dossier hub.
                      Gated on otpRequired: this only ever fires today for a
                      *returning* visitor (leadCaptured already true from an
                      earlier session, loaded via GET /siret/status) whose
                      phone was never OTP-confirmed. A brand-new visitor
                      whose captureLead call gets rejected 403
                      phone_not_verified never reaches leadCaptured=true in
                      the first place (see CompanyKnownContext.captureLead),
                      so that submission just surfaces the backend's error
                      text via leadError on the original form with no path
                      to the code-entry step from there - a real remaining
                      gap, out of scope for this pass (needs captureLead's
                      403 handled as its own case, not just an error
                      string). Left as a comment rather than silently
                      patched over. */}
                  {otpRequired && !isAuthenticated && !phoneVerified && (pendingOtpVerification || leadCaptured) && (
                    <form onSubmit={handleOtpSubmit} className="space-y-3">
                      <p className="flex items-center gap-2 text-lg font-extrabold text-white mb-1">
                        <Copy size={17} className="text-orange shrink-0" /> {t('otpTitle') || 'Vérifiez votre téléphone'}
                      </p>
                      <p className="text-sm text-[#B9BBC8]">
                        {otpSending && !otpSent
                          ? (t('otpSending') || 'Envoi du code en cours…')
                          : (t('otpSentTo', { phone: phoneForOtp }) || `Un code à 6 chiffres a été envoyé par SMS au ${phoneForOtp}.`)}
                      </p>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-1.5">{t('otpCodeFieldLabel') || 'Code reçu par SMS'}</label>
                        <input
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                          inputMode="numeric"
                          autoFocus
                          placeholder={t('otpCodePlaceholder') || '123456'}
                          className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-sm text-white tracking-[0.3em] placeholder:tracking-normal placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50"
                        />
                      </div>
                      {otpError && <p className="text-xs text-red-400">{otpError}</p>}
                      <button type="submit" disabled={otpSubmitting || !otpCode} className="w-full flex items-center justify-center gap-2 bg-orange text-white font-bold py-3 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50">
                        {otpSubmitting ? <Loader2 size={14} className="animate-spin" /> : null} {t('otpConfirm') || 'Vérifier le code'}
                      </button>
                      <div className="text-[11px] text-[#5B6B80]">
                        <button
                          type="button"
                          onClick={() => { setOtpCode(''); sendOtp(phoneForOtp); }}
                          disabled={otpSending}
                          className="underline decoration-[#5B6B80]/50 hover:text-[#8B95A5] transition-colors disabled:opacity-50"
                        >
                          {t('otpResend') || 'Renvoyer le code'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
          </>
      )}

      {/* SUIVI & RAPPEL — "Votre dossier" hub (client's screenshot,
          10:50pm brief item 4 discipline: one clear function per block).
          "Opportunité enregistrée" banner, then two navigation lists
          ("Dossier de candidature" -> BidWorkspacePage / dossier entreprise;
          "Accompagnement" -> the existing rappel/rendez-vous flow, kept
          working exactly as before, just presented as rows instead of a
          big card), then a way back into search and the two bottom
          buttons. */}
      {screen === 3 && (
        <div className="space-y-4 mt-4">
          {justUnlockedAnalysis && (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/5 border border-green-400/20 rounded-xl px-3 py-2.5">
              <CheckCircle2 size={14} className="shrink-0" />
              {!isAuthenticated && dossierJustEmailed
                ? (t('leadUnlockedBannerEmailed', { email: leadEmail || contextLeadEmail || '' })
                    || `Vos coordonnées sont validées. Votre dossier pré-rempli vient d'être envoyé à ${leadEmail || contextLeadEmail || 'votre adresse e-mail'}.`)
                : (t('leadUnlockedBanner') || 'Informations supplémentaires débloquées')}
            </div>
          )}

          {(contextLeadPhone || contextLeadEmail) && (
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4">
              {editingContact ? (
                <form onSubmit={handleContactUpdate} className="space-y-3">
                  <p className="text-sm font-bold text-white">{t('dossierVerifyContactTitle') || 'Vérifier mes coordonnées'}</p>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#B9BBC8] mb-1">{t('leadPhoneFieldLabel') || 'Votre téléphone'}</label>
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder={t('leadPhonePlaceholder') || '06 12 34 56 78'} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#B9BBC8] mb-1">{t('leadEmailFieldLabel') || 'Votre e-mail'}</label>
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder={t('leadEmailPlaceholder') || 'vous@exemple.fr'} className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange" />
                  </div>
                  {editContactError && <p className="text-xs text-red-400">{editContactError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={editContactSaving} className="flex-1 bg-orange text-white text-xs font-bold py-2 rounded-lg disabled:opacity-50">
                      {editContactSaving ? <Loader2 size={13} className="animate-spin mx-auto" /> : (t('dossierSaveContact') || 'Enregistrer')}
                    </button>
                    <button type="button" onClick={() => setEditingContact(false)} className="flex-1 border border-[#17334D] text-[#B9BBC8] text-xs font-semibold py-2 rounded-lg">
                      {t('cancel') || 'Annuler'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1">{t('dossierVerifyContactTitle') || 'Vérifier mes coordonnées'}</p>
                    <p className="text-sm text-white truncate">{contextLeadPhone || '—'}</p>
                    <p className="text-sm text-white truncate">{contextLeadEmail || '—'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setEditPhone(contextLeadPhone || ''); setEditEmail(contextLeadEmail || ''); setEditContactError(null); setEditingContact(true); }}
                    className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-orange hover:underline"
                  >
                    <Pencil size={12} /> {t('siretModify') || 'Modifier'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Client's 10 Sep interactive-card spec ("Votre dossier" - free
              visitor view): reproduces the reference card layout exactly -
              opportunity selector, 5-step progress, dossier pré-rempli,
              locked "Générer mon dossier" (subscriber-only, no free draft
              pipeline per the client's own rule), buyer criteria weighting,
              DCE + analysis, the 3 locked candidature documents, pièces
              d'entreprise count, and the accompagnement CTA - in that exact
              order. Wired to real data everywhere it already exists
              (matchScore for weighting, checklistDocs for the pièces
              count); the dossier-progress step tracking itself has no
              backend field yet, so it's derived client-side from signals
              already on the page (see DOSSIER_STEPS below) rather than a
              new migration - good enough to render correctly, worth a real
              status column later if the client wants steps to persist
              server-side. */}
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <label className="block text-xs font-semibold text-[#B9BBC8] mb-2">{t('dossierSelectorLabel') || 'Vos opportunités enregistrées'}</label>
            <div className="relative">
              <select
                value={id}
                onChange={e => { if (e.target.value !== id) navigate(`/opportunites/${e.target.value}`); }}
                className="w-full appearance-none bg-[#031B30] border border-[#17334D] rounded-xl px-3.5 py-2.5 pr-9 text-sm text-white cursor-pointer"
              >
                {/* Current opportunity always shows even if it isn't (yet)
                    saved, so the selector never renders empty/without the
                    page you're actually on. */}
                {!savedOpportunities.some(o => o.id === id) && (
                  <option value={id}>{compactOpportunityLabel(opportunity.title, opportunity.location_city, opportunity.estimated_value)}</option>
                )}
                {savedOpportunities.map(o => (
                  <option key={o.id} value={o.id}>
                    {compactOpportunityLabel(o.title, o.location_city, o.estimated_value)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="text-[#B9BBC8] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="mt-3">
              <h2 className="text-sm font-bold text-white">{opportunity.title}</h2>
              <p className="text-xs text-[#B9BBC8] mt-1">
                {tradeLabel}
                {opportunity.deadline && <> · {formatDate(opportunity.deadline)}</>}
              </p>
            </div>
          </div>

          {(() => {
            // "Dossier généré" / "Dépôt effectué" were hardcoded `false` -
            // could never show as done even after the company actually
            // generated their mémoire technique or the team filed the
            // submission. `bid` (ApiBidResponse) is already fetched above
            // via tendersApi.getBid - just wasn't being read here.
            const dossierGenerated = !!bid?.technical_memo_text;
            const dossierFiled = bid?.status === 'submitted' || !!bid?.submitted_at;
            // 20 Sep client audit (round 2): opening "Voir l'analyse" used to
            // bump the bar 20% -> 40% although nothing had been prepared.
            // Consulting the DCE / its analysis is just reading, not work on
            // the dossier, so those two lines stay visible below as
            // informational "consultations" but no longer count. Only real
            // states drive the percentage.
            const documentsPrepared = !!(
              bid?.dc1_text || bid?.dc2_text || bid?.dume_text || bid?.engagement_act_text
              || (bid?.pricing_schedule_json && bid.pricing_schedule_json.length > 0)
            );
            const steps = [
              { done: true, label: t('dossierStepPreview') || 'Aperçu disponible' },
              { done: documentsPrepared, label: t('dossierStepDocsPrepared') || 'Documents préparés' },
              { done: dossierGenerated, label: t('dossierStepGenerated') || 'Dossier généré' },
              { done: dossierFiled, label: t('dossierStepFiled') || 'Dépôt effectué' },
            ];
            const consultations = [
              { done: dceViewed, label: t('dossierStepDce') || 'DCE consulté' },
              { done: dceAnalysisViewed, label: t('dossierStepAnalysis') || 'Analyse du DCE consultée' },
            ];
            const doneCount = steps.filter(s => s.done).length;
            const pct = Math.round((doneCount / steps.length) * 100);
            return (
              <div id="dossier-progress-block" className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-white">{t('dossierProgressTitle') || 'Avancement de votre dossier'}</h2>
                  <span className="text-orange font-extrabold text-lg">{pct} %</span>
                </div>
                <div className="h-1.5 bg-[#031B30] rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-orange rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-[#B9BBC8] mb-3">
                  {(t('dossierProgressSteps') || '{done} étape sur {total} terminée · Dépôt non effectué')
                    .replace('{done}', String(doneCount)).replace('{total}', String(steps.length))}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-[#B9BBC8] mb-2">
                  <Clock3 size={13} className="shrink-0" /> {t('dossierStepPreview') || 'Aperçu disponible'}
                </p>
                <p className="text-xs text-white mb-2">{t('dossierProgressReady') || 'Votre aperçu est prêt. Découvrez la suite de l\'accompagnement.'}</p>
                <button type="button" onClick={() => setDossierStepsOpen(o => !o)} className="flex items-center gap-1 text-xs font-semibold text-orange hover:underline">
                  <ChevronRight size={12} className={`transition-transform ${dossierStepsOpen ? 'rotate-90' : ''}`} /> {t('dossierProgressSeeSteps') || 'Voir les étapes de préparation'}
                </button>
                {dossierStepsOpen && (
                  <div className="mt-3 pt-3 border-t border-[#17334D] space-y-2">
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {s.done ? <CheckCircle2 size={13} className="text-green-400 shrink-0" /> : <span className="w-[13px] h-[13px] rounded-full border border-[#5B6B80] shrink-0" />}
                        <span className={s.done ? 'text-white' : 'text-[#B9BBC8]'}>{s.label}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-1 border-t border-[#17334D] space-y-2">
                      {consultations.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-[#5B6B80]">
                          {s.done ? <CheckCircle2 size={12} className="shrink-0" /> : <span className="w-3 h-3 rounded-full border border-[#17334D] shrink-0" />}
                          <span>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">{t('dossierPrefilledTitle') || 'Votre dossier pré-rempli'}</h2>
              {/* 20 Sep fix: an anonymous visitor who just validated their
                  email/phone on Concordance has, in fact, already received
                  this document by email (see POST /siret/lead's
                  dossierEmailed - sendPrefilledDossierEmail on the backend).
                  The old copy here ("compte gratuit requis") told them the
                  opposite and pushed them to /inscription regardless -
                  exactly the "still asking for account creation" gap in the
                  client's latest audit. Authenticated visitors keep the
                  existing candidature-workspace document untouched below;
                  this only changes what an anonymous, already-leadCaptured
                  visitor sees. */}
              <span className={`text-[11px] font-semibold ${dossierReady || (!isAuthenticated && leadCaptured) ? 'text-green-400' : 'text-orange'}`}>
                {!isAuthenticated
                  ? (leadCaptured
                      ? (t('dossierPrefilledBadgeSent') || 'Offert · envoyé par e-mail')
                      : (t('dossierPrefilledBadgeLocked') || 'Offert · compte gratuit requis'))
                  : dossierReady
                    ? (t('dossierPrefilledBadge') || 'Offert · disponible')
                    : (t('dossierPrefilledBadgePending') || 'Offert · en préparation')}
              </span>
            </div>
            <div className="flex items-start gap-3 mb-4">
              <span className="w-9 h-9 rounded-lg bg-orange/15 border border-orange/30 flex items-center justify-center shrink-0"><FileText size={16} className="text-orange" /></span>
              <div>
                <p className="text-sm font-semibold text-white">{siretCompany?.name || (t('dossierPrefilledYourCompany') || 'Votre entreprise')} × {opportunity.title}</p>
                <p className="text-xs text-[#B9BBC8] mt-0.5">
                  {!isAuthenticated
                    ? (leadCaptured
                        ? (t('dossierPrefilledDescSent', { email: leadEmail || contextLeadEmail || '' })
                            || `Votre dossier pré-rempli a été envoyé à ${leadEmail || contextLeadEmail || 'votre adresse e-mail'}. Pensez à vérifier vos courriers indésirables si vous ne le voyez pas d'ici quelques minutes.`)
                        : (t('dossierPrefilledDescLocked') || "Créez un compte gratuit (30 secondes) pour consulter et télécharger ce document - vous revenez directement ici après."))
                    : dossierReady
                      ? (t('dossierPrefilledDesc') || 'Votre entreprise, le lot retenu et une première trame de réponse rassemblés dans un document.')
                      : (t('dossierPrefilledDescPending') || "Votre chargé d'affaires prépare la version finale de ce document - vous serez prévenu dès qu'il est prêt à télécharger.")}
                </p>
              </div>
            </div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to={`/opportunites/${id}/candidature`} className="bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors">
                  {t('dossierPrefilledConsult') || 'Consulter mon dossier'}
                </Link>
                <button
                  type="button"
                  disabled={dossierDownloading}
                  onClick={async () => {
                    // D03 (contre-audit 15 Sep): this button only checked
                    // technical_memo_text existed, but the real package
                    // endpoint's document is a DRAFT until a human "chargé
                    // d'affaires" approves it (is_technical_memo_approved -
                    // see BidWorkspacePage, which already correctly disables
                    // its own download button on this same condition). This
                    // button didn't have that guard, so a visitor with a
                    // generated-but-unapproved draft got a click that
                    // either downloaded an unapproved draft (inconsistent
                    // with the workspace page) or, depending on backend
                    // state, hung/failed with no clear reason ("no file
                    // detected" in the audit). Route through the same
                    // waiting-state explanation as the else branch below
                    // instead of attempting the request at all.
                    if (!bid?.id || !bid.technical_memo_text || !bid.is_technical_memo_approved) {
                      navigate(`/opportunites/${id}/candidature`);
                      return;
                    }
                    setDossierDownloading(true);
                    try {
                      const result = await tendersApi.downloadPackage(bid.id);
                      if (result.url) {
                        window.open(result.url, '_blank');
                      } else if (result.blob) {
                        const url = URL.createObjectURL(result.blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `dossier-candidature-${bid.id}.zip`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    } catch (err) {
                      toast.error(getApiErrorMessage(err, 'Échec du téléchargement.'));
                    } finally {
                      setDossierDownloading(false);
                    }
                  }}
                  className="flex items-center gap-1.5 text-sm text-orange font-semibold hover:underline disabled:opacity-50"
                >
                  {dossierDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} {t('dossierPrefilledDownload') || 'Télécharger'}
                </button>
              </div>
            ) : leadCaptured ? (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/5 border border-green-400/20 rounded-xl px-3 py-2.5">
                <CheckCircle2 size={14} className="shrink-0" /> {t('dossierPrefilledSentConfirm') || 'Document envoyé - vérifiez votre boîte e-mail.'}
              </div>
            ) : (
              <Link
                to="/inscription"
                state={{ from: `/opportunites/${id}/candidature` }}
                className="inline-flex items-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors"
              >
                <Lock size={13} /> {t('dossierPrefilledUnlock') || 'Créer mon accès gratuit'}
              </Link>
            )}
          </div>

          {/* "Préparer ma candidature" — client's reference screenshot (14
              Sep, item 4 "interactive card") replaces the earlier 01-05
              editable form with this simpler locked card: icon, one-line
              description, a single full-width "Générer mon dossier" CTA
              (locked padlock, same as the reference), and the
              accompagnement note underneath. The 01-05 fields
              (présentation, réponse, partenaires, pièces) stay collected
              elsewhere on the page (Pièces de votre entreprise below,
              CompanyVaultPage) rather than duplicated in this card; the
              button still calls the same generate endpoint using whatever
              is already on file, so no functionality is lost - only the
              in-card manual-entry form is removed to match the reference. */}
          {/* D13 (contre-audit 15 Sep): three of this hub's card titles
              ("Préparer ma candidature", "Pondération des critères de
              l'acheteur", "Continuer mes recherches") were left at text-sm
              from an earlier pass while every other card title in this
              same redesigned hub uses text-lg - unmeasured/inconsistent
              typography, matching the audit's complaint. Normalized to the
              size used throughout the rest of the hub. */}
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Send size={15} className="text-orange" /> {t('dossierGenerateTitle') || 'Préparer ma candidature'}</h2>
              {dossier?.status && dossier.status !== 'draft' && (
                <span className="text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/30 rounded-full px-2 py-0.5 uppercase">
                  {dossier.status === 'requested' ? (t('dossierStatusRequested') || 'Demande envoyée')
                    : dossier.status === 'in_review' ? (t('dossierStatusInReview') || "En cours d'examen")
                    : dossier.status === 'ready' ? (t('dossierStatusReady') || 'Prêt')
                    : (t('dossierStatusSubmitted') || 'Déposé')}
                </span>
              )}
            </div>
            <p className="text-xs text-[#B9BBC8] mb-4">{t('dossierGenerateSub') || "Votre chargé d'affaires prépare et dépose votre candidature."}</p>

            {dossier?.status && dossier.status !== 'draft' ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/5 border border-green-400/20 px-4 py-2.5 rounded-xl justify-center">
                <CheckCircle2 size={13} /> {t('dossierRequestSent') || "Demande envoyée à votre chargé d'affaires"}
              </div>
            ) : !isAuthenticated ? (
              // 20 Sep fix: this used to fire the authed /generate call (or,
              // in an earlier pass, redirect straight to /connexion) for an
              // anonymous visitor who has, in fact, already received their
              // free dossier by email - "Générer mon dossier" implied a
              // second, different document they still needed to unlock via
              // login. The per-document "Générer" buttons further down
              // already route to the appointment flow instead of login for
              // exactly this reason (see AppointmentModal below);
              // this main CTA now matches that same pattern rather than
              // being the one holdout that still pointed at login.
              <button
                type="button"
                onClick={() => setShowAccountManagerModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-orange text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-orange/90 transition-colors"
              >
                <Calendar size={14} /> {t('dossierGenerateCtaAnon') || 'Prendre rendez-vous avec mon chargé d\'affaires'}
              </button>
            ) : (
              <button
                type="button"
                disabled={dossierGenerating}
                onClick={async () => {
                  if (!id) return;
                  setDossierGenerating(true);
                  try {
                    const saved = await dossiersApi.generate(id, {
                      response_text: dossierResponseText,
                      partners: dossierPartners.filter(p => p.name.trim()),
                      checklist: CHECKLIST_DOCS.map(item => ({ label: item.type, done: checklistDocs.some(d => d.document_type === item.type) })),
                    });
                    setDossier(saved);
                    toast.success(t('dossierGenerateSuccess') || "Demande envoyée à votre chargé d'affaires.");
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, t('dossierGenerateError') || "Impossible d'envoyer la demande."));
                  } finally {
                    setDossierGenerating(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 bg-orange text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50"
              >
                {dossierGenerating ? <Loader2 size={14} className="animate-spin" /> : <Lock size={13} />} {t('dossierGenerateCta') || 'Générer mon dossier'}
              </button>
            )}
            <p className="text-[11px] text-[#5B6B80] mt-2">
              {t('dossierGenerateNote') || "Préparation complète incluse dans l'accompagnement."}
            </p>
          </div>

          {matchScore && (
            <div id="eligibility-analysis-block" className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white mb-3">{t('scoreCriteriaWeight') || "Pondération des critères de l'acheteur"}</h2>
              {matchScore.criteria.length > 0 ? (
                <div className="space-y-2.5">
                  {matchScore.criteria.map((c, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#B9BBC8]">{c.label}</span>
                        <span className="text-white font-semibold">{c.weight != null ? `${c.weight}%` : (t('scoreCriteriaNoWeight') || 'pondération non précisée')}</span>
                      </div>
                      {c.weight != null && (
                        <div className="h-1.5 bg-[#031B30] rounded-full overflow-hidden">
                          <div className="h-full bg-orange rounded-full" style={{ width: `${c.weight}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#B9BBC8]">{t('scoreCriteriaUnknown') || 'Critères à vérifier dans le règlement de consultation.'}</p>
              )}
              
              {matchScore.eligibility.length > 0 && (
                <>
                  <button type="button" onClick={() => setEligibilityOpen(o => !o)} className="flex items-center gap-1 text-xs font-semibold text-orange hover:underline mt-3">
                    <ChevronRight size={12} className={`transition-transform ${eligibilityOpen ? 'rotate-90' : ''}`} /> {t('scoreEligibilityDocs') || 'Exigences de cette consultation'}
                  </button>
                  {eligibilityOpen && (
                    <div className="mt-3 pt-3 border-t border-[#17334D] space-y-2.5">
                      <p className="text-[11px] text-[#5B6B80]">{t('scoreEligibilityNote') || "Liste indicative de préparation, pas l'exigence de l'acheteur : à confirmer dans le règlement de consultation."}</p>
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
                  )}
                </>
              )}
            </div>
          )}

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={15} className="text-orange" />
              <h2 className="text-lg font-bold text-white">{t('dossierDceTitle') || 'DCE — Dossier de consultation'}</h2>
            </div>
            <p className="text-xs text-[#B9BBC8] mb-3">{t('dossierDceSub') || 'Les documents du marché et leurs versions.'}</p>
            <div className="flex items-center justify-between border-t border-[#17334D] pt-3">
              {(() => {
                // Was always pointing "Règlement de consultation" at
                // official_url, which is the BOAMP/DECP notice page, not
                // the actual RC document - client's exact complaint. If
                // the ingestion pipeline actually parsed a real RC file
                // (dceDocuments), link to that and use its real name;
                // otherwise be honest about what official_url actually is.
                const rcDoc = dceDocuments.find(d => d.document_label === 'RC' && (d.status === 'downloaded' || d.status === 'parsed'));
                if (rcDoc) {
                  return (
                    <>
                      <div>
                        <p className="text-sm text-white font-semibold">{DCE_LABEL_NAMES.RC}</p>
                        <p className="text-[11px] text-[#5B6B80]">{opportunity.source_reference ? `${t('dossierDceRef') || 'Référence'} · ${opportunity.source_reference}` : ''}</p>
                      </div>
                      <a href={rcDoc.source_url} target="_blank" rel="noopener noreferrer" onClick={() => markDceViewed('dce')} className="text-orange font-semibold text-sm hover:underline shrink-0">
                        {t('dossierDceConsult') || 'Consulter'}
                      </a>
                    </>
                  );
                }
                return (
                  <>
                    <div>
                      <p className="text-sm text-white font-semibold">{t('dossierDceNoticeName') || "Avis du marché"}</p>
                      <p className="text-[11px] text-[#5B6B80]">{opportunity.source_reference ? `${t('dossierDceRef') || 'Référence'} · ${opportunity.source_reference}` : ''}</p>
                    </div>
                    {opportunity.official_url ? (
                      <a href={opportunity.official_url} target="_blank" rel="noopener noreferrer" onClick={() => markDceViewed('dce')} className="text-orange font-semibold text-sm hover:underline shrink-0">
                        {t('dossierDceConsult') || 'Consulter'}
                      </a>
                    ) : (
                      // D05 (contre-audit 15 Sep): this used to be a live
                      // "Consulter" button with no href and no document
                      // behind it - clicking it still called
                      // markDceViewed('dce'), so "DCE consulté" flipped to
                      // done and the progress bar jumped 20%→40% even
                      // though nothing was actually shown ("aucune analyse
                      // ne s'affiche" in the audit). Don't mark a step
                      // complete for an action that didn't do anything;
                      // say plainly that there's no document yet instead.
                      <span className="text-xs text-[#5B6B80] shrink-0">{t('dossierDceNotAvailable') || 'Document pas encore disponible'}</span>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Search size={15} className="text-orange" />
              <h2 className="text-lg font-bold text-white">{t('dossierDceAnalysisTitle') || 'Analyse du DCE'}</h2>
            </div>
            <p className="text-xs text-[#B9BBC8] mb-3">{t('dossierDceAnalysisSub') || 'Les exigences, les points de vigilance et la préparation de votre réponse.'}</p>
            <button
              type="button"
              onClick={() => {
                // Was only setting state - the eligibility block it opens
                // sits further up the page (in the criteria/weighting
                // card), so the expanded content landed off-screen and
                // looked like nothing happened, matching the client's
                // "n'affiche pas l'analyse" complaint. Actually scroll to
                // it once it's open. If there's genuinely nothing to show
                // yet, say so instead of silently doing nothing.
                // D05 (contre-audit 15 Sep): "l'avancement passe de 20 % à
                // 40 %, sans analyse affichée." markDceViewed ran before
                // the check below, so the pending branch still credited the
                // step and returned - progress advanced on a click that
                // showed nothing but a toast. Only mark the step once the
                // analysis is actually on screen.
                if (!matchScore || matchScore.eligibility.length === 0) {
                  toast.info(t('dossierDceAnalysisPending') || "L'analyse de ce marché est en cours de préparation.");
                  return;
                }
                markDceViewed('analysis');
                setEligibilityOpen(true);
                requestAnimationFrame(() => {
                  document.getElementById('eligibility-analysis-block')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
              }}
              className="flex items-center gap-2 border border-[#5b6d7d] text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:border-orange/50 transition-colors"
            >
              <Lock size={12} /> {t('dossierDceAnalysisCta') || "Voir l'analyse"}
            </button>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} className="text-orange" />
              <h2 className="text-lg font-bold text-white">{t('dossierCandidatureTitle') || 'Dossier de candidature'}</h2>
            </div>
            <p className="text-xs text-[#B9BBC8] mb-3 -mt-2">{t('dossierCandidatureSub') || "Les documents que votre chargé d'affaires prépare avec vous."}</p>
            <p className="text-xs text-[#B9BBC8] bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 mb-3">
              {t('dossierCandidatureExplain') || "Ces documents ne sont pas générés automatiquement : votre chargé d'affaires les prépare avec vous, sur rendez-vous, en fonction des informations de ce marché et de votre entreprise."}
            </p>
            <div className="divide-y divide-[#17334D]">
              {[
                { title: t('dossierCandidatureMemo') || 'Mémoire technique', desc: t('dossierCandidatureMemoDesc') || 'Organisation, moyens et méthode pour ce marché.' },
                { title: t('dossierCandidatureDocs') || 'Documents de candidature', desc: t('dossierCandidatureDocsDesc') || 'Informations de candidature et formulaires applicables.' },
                { title: t('dossierCandidatureFinance') || 'Réponse financière', desc: t('dossierCandidatureFinanceDesc') || 'Chiffrage et cadre financiers du marché.' },
              ].map(item => (
                <div key={item.title} className="py-4">
                  <p className="text-sm text-white font-semibold">{item.title}</p>
                  <p className="text-xs text-[#B9BBC8] mt-0.5">{item.desc}</p>
                  <p className="text-[11px] text-[#5B6B80] mt-0.5 mb-3">{t('dossierCandidatureIncluded') || "Inclus dans l'accompagnement."}</p>
                  {/* D11 (contre-audit 15 Sep): "Reprendre les libellés
                      courts « Générer » ... alléger les répétitions." These
                      per-document rows shared dossierGenerateCta with the
                      page's main CTA, so each one rendered the full
                      "Générer mon dossier" - repeating the long label down
                      the list even though the row above already names the
                      document. Own short key. */}
                  <button type="button" onClick={() => setShowAccountManagerModal(true)} className="w-full flex items-center justify-center gap-1.5 border border-[#5b6d7d] text-white text-xs font-semibold py-2.5 rounded-lg hover:border-orange/50 transition-colors">
                    <Lock size={12} /> {t('dossierGenerateCtaShort') || 'Générer'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <button type="button" onClick={() => setCompanyPiecesOpen(o => !o)} className="w-full flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                <ChevronRight size={14} className={`text-orange transition-transform ${companyPiecesOpen ? 'rotate-90' : ''}`} />
                {(t('dossierPiecesTitle') || 'Pièces de votre entreprise')} · {CHECKLIST_DOCS.filter(item => checklistDocs.some(d => d.document_type === item.type)).length} / {CHECKLIST_DOCS.length} {t('dossierPiecesVerified') || 'vérifiées'}
              </span>
            </button>
            {companyPiecesOpen && (
              <div className="mt-3 pt-3 border-t border-[#17334D] space-y-2">
                {CHECKLIST_DOCS.map(item => {
                  const done = checklistDocs.some(d => d.document_type === item.type);
                  return (
                    <div key={item.type} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-[#B9BBC8]">{t(item.labelKey)}</span>
                      {done ? (
                        <span className="flex items-center gap-1 text-green-400 font-semibold shrink-0"><CheckCircle2 size={13} /> {t('checklistAdded')}</span>
                      ) : (
                        <Link to="/profil/dossier-entreprise" className="text-orange font-semibold hover:underline shrink-0">{t('checklistAdd')}</Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            {/* D07 (contre-audit 15 Sep): this accordion toggled
                dossierStepsOpen but had no body of its own - the actual
                step history lives in the "Avancement de votre dossier"
                card near the top of the page, so clicking here looked
                like nothing happened ("pas d'historique visible après
                ouverture"), same off-screen-content class of bug as
                dossierDceAnalysisCta above. Open it and scroll there
                instead of duplicating the list in two places. */}
            <button
              type="button"
              onClick={() => {
                setDossierStepsOpen(true);
                requestAnimationFrame(() => {
                  document.getElementById('dossier-progress-block')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
              }}
              className="w-full flex items-center gap-2"
            >
              <ChevronRight size={14} className={`text-orange transition-transform ${dossierStepsOpen ? 'rotate-90' : ''}`} />
              <span className="text-sm font-bold text-white">{t('dossierProgressAccordion') || "Suivi de l'avancement"}</span>
            </button>
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Users size={15} className="text-orange" />
              <h2 className="text-lg font-bold text-white">{t('dossierHubSupportTitle') || 'Votre accompagnement'}</h2>
            </div>
            <p className="text-xs text-[#B9BBC8] mb-4">{t('dossierSupportSub') || "Un chargé d'affaires vous aide à préparer votre candidature et réalise le dépôt."}</p>
            <button type="button" onClick={() => setShowAccountManagerModal(true)} className="w-full bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors mb-3">
              {t('dossierHubSlot') || 'Prendre rendez-vous'}
            </button>
            <button type="button" onClick={() => setContactChoice(c => c === 'callback' ? null : 'callback')} className="block text-sm text-orange font-semibold hover:underline">
              {t('dossierVerifyContact') || 'Demander à être rappelé'}
            </button>
            {contactChoice === 'callback' && (
              <div className="mt-3 pt-3 border-t border-[#17334D]">
                {callbackConfirmed ? (
                  <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/5 border border-green-400/20 rounded-xl px-3 py-2.5">
                    <CheckCircle2 size={14} className="shrink-0" /> {slotSubmitting === 'callback' ? <Loader2 size={13} className="animate-spin" /> : (t('accessCallbackConfirmed') || 'Rappel demandé')}
                  </div>
                ) : (
                  <button type="button" disabled={!!slotSubmitting} onClick={handleCallback} className="w-full flex items-center justify-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50">
                    {slotSubmitting === 'callback' ? <Loader2 size={14} className="animate-spin" /> : <PhoneCall size={14} />} {t('accessCallbackNoSlot') || 'Confirmer la demande de rappel'}
                  </button>
                )}
                {slotError && <p className="text-xs text-red-400 mt-2">{slotError}</p>}
              </div>
            )}
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-3">{t('dossierHubMoreTitle') || 'Continuer mes recherches'}</h2>
            <p className="text-xs text-[#B9BBC8] mb-3">{t('dossierHubMoreSub') || "Retrouvez vos opportunités enregistrées et choisissez les prochaines candidatures."}</p>
            <Link to="/tableau-de-bord" className="text-sm text-orange font-semibold hover:underline">{t('dossierHubDashboard') || 'Voir mon tableau de bord'}</Link>
          </div>

          <div className="flex gap-2.5">
            <button type="button" onClick={() => setScreen(2)} className="flex-1 border border-orange/50 text-orange font-bold py-2.5 rounded-xl hover:bg-orange/10 transition-colors">
              {t('compatibilityBack') || 'Retour'}
            </button>
          </div>
        </div>
      )}

      <AppointmentModal
        open={showAccountManagerModal}
        onClose={() => setShowAccountManagerModal(false)}
        defaultMotif="Répondre à un appel d'offres"
        marketLabel={opportunity ? [opportunity.title, opportunity.source_reference].filter(Boolean).join(' · ') : undefined}
      />

    </div>
  );
}

type DossierPrepItem = { label: string; ready: boolean; readyText: string; pendingText: string };

// "Votre entreprise" card (client's screenshot, écran "Concordance"): icon +
// muted label above, white value below - a missing value never leaves a
// blank cell or an omitted row, it shows the caller's explicit fallback
// text instead (client's exact wording: "Chiffre d'affaires non
// disponible", "Effectif non communiqué", etc.) so the grid never looks
// broken or incomplete.
function CompanyInfoRow({ icon: Icon, label, value, empty }: { icon: typeof MapPin; label: string; value: string | null | undefined; empty?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-[#5B6B80] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] text-[#5B6B80]">{label}</p>
        <p className="text-white font-medium">{value || empty || '—'}</p>
      </div>
    </div>
  );
}

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

// Client's 10 Sep spec: the opportunity analysis (previously one dense
// paragraph - see ai_summary above) is now split into 3 fixed accordions,
// reused identically on every fiche: Présentation du marché / Conditions
// et points à vérifier / Entreprises concernées. First one open by
// default, the other two collapsed; each toggles independently on click.
// Content comes from ai_analysis_sections (generateOpportunityAnalysisSections
// in aiService.ts) - this component only lays it out, using the site's
// existing card/accordion styling (RefineAnalysisAccordion above), not the
// client's mockup's own literal colors.
function OpportunityAnalysisAccordions({
  sections,
  sourceText,
  t,
}: {
  sections: { presentation: string; conditions: string; entreprises: string };
  // Full, un-summarized opportunity description (raw `description` field).
  // The 3 sections above are an AI-condensed 2-5 sentence synthesis, which
  // risks trimming details a candidate actually needs (a specific clause,
  // an exact figure, a secondary requirement the summary rolled up into a
  // generic sentence). Rather than changing the generation itself - the
  // condensed sections are what the client's 10 Sep spec asked for, for
  // readability - this keeps the full original text one click away so
  // nothing from the source is ever actually lost, per the later "do not
  // lose information" clarification. Null/omitted when there's no
  // meaningful original text to fall back to (already covered by
  // isRedundantWithTitle upstream).
  sourceText?: string | null;
  t: (key: string) => string;
}) {
  const items = [
    { key: 'presentation', icon: FileText, title: t('detailAccordionPresentation') || 'Présentation du marché', text: sections.presentation },
    { key: 'conditions', icon: Search, title: t('detailAccordionConditions') || 'Conditions et points à vérifier', text: sections.conditions },
    { key: 'entreprises', icon: Users, title: t('detailAccordionEntreprises') || 'Entreprises concernées', text: sections.entreprises },
  ].filter(item => item.text && item.text.trim().length > 0);

  const [openKey, setOpenKey] = useState<string | null>(items[0]?.key ?? null);
  const [sourceOpen, setSourceOpen] = useState(false);

  // Client's audit (15 Sep): "gérer clairement les annonces dont le
  // descriptif ou l'analyse sont encore incomplets, pour que la suite du
  // parcours ne donne pas une impression de précision que les informations
  // disponibles ne permettent pas." Returning null here rendered a silent
  // gap - no accordions, no explanation - which reads as "nothing to say
  // about this opportunity" rather than "still being analyzed", right
  // before the rest of the journey (concordance, dossier) proceeds as if
  // it had full information to work from.
  if (items.length === 0) {
    return (
      <div className="border border-[#17334D] rounded-xl bg-[#031B30] px-4 py-4 flex items-center gap-2.5">
        <Loader2 size={15} className="text-orange shrink-0" />
        <p className="text-xs text-[#B9BBC8]">{t('detailAnalysisIncomplete') || "Analyse détaillée en cours de génération pour cette opportunité."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* O04 (contre-audit 15 Sep): "« Analyse de l'opportunité » à remettre
          au-dessus des accordéons selon l'audit esthétique - ce titre de
          groupe n'a pas été retrouvé dans la fiche privée contrôlée." The
          three accordions rendered as a bare stack with no group heading
          tying them together, so nothing on the page said these three
          sections are the analysis of the opportunity. */}
      <h2 className="text-lg font-bold text-white mb-3">
        {t('detailAnalysisGroupTitle') || "Analyse de l'opportunité"}
      </h2>
      {items.map(item => {
        const isOpen = openKey === item.key;
        const Icon = item.icon;
        return (
          <div key={item.key} className="border border-[#17334D] rounded-xl bg-[#031B30] overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenKey(cur => (cur === item.key ? null : item.key))}
              className="w-full flex items-center gap-2.5 px-3.5 py-[18px] text-left"
              aria-expanded={isOpen}
            >
              <Icon size={16} className="text-orange shrink-0" />
              <span className="flex-1 text-sm font-semibold text-white">{item.title}</span>
              <ChevronDown size={14} className={`text-[#B9BBC8] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-3.5 pb-4 text-sm text-[#EAF0F6] leading-relaxed whitespace-pre-line">
                {stripMarkdownArtifacts(item.text)}
              </div>
            )}
          </div>
        );
      })}
      {sourceText && (
        <div className="border border-[#17334D] rounded-xl bg-[#031B30] overflow-hidden">
          <button
            type="button"
            onClick={() => setSourceOpen(o => !o)}
            className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left"
            aria-expanded={sourceOpen}
          >
            <FileText size={14} className="text-[#5B6B80] shrink-0" />
            <span className="flex-1 text-xs font-semibold text-[#B9BBC8]">
              {t('detailSourceTextToggle') || 'Voir le texte source complet'}
            </span>
            <ChevronDown size={13} className={`text-[#5B6B80] shrink-0 transition-transform ${sourceOpen ? 'rotate-180' : ''}`} />
          </button>
          {sourceOpen && (
            <div className="px-3.5 pb-4 text-xs text-[#B9BBC8] leading-relaxed whitespace-pre-line">
              {stripMarkdownArtifacts(sourceText)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}