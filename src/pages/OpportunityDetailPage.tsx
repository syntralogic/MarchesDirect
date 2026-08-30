import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Euro, Loader2, FileText, Sparkles, AlertTriangle,
  CheckCircle2, XCircle, HelpCircle, LogIn, Lock, Crown, Gauge, Landmark, Briefcase, Handshake, Send,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SaveButton } from '@/components/SaveButton';
import PageMeta from '@/components/common/PageMeta';
import {
  opportunitiesApi, tendersApi, getApiErrorMessage,
  type ApiOpportunityDetail, type ApiTender, type ApiBidResponse,
  type ApiOpportunityAccess, type ApiMatchScore,
} from '@/lib/apiClient';

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

const JOURNEY_LABEL: Record<string, { label: string; icon: typeof Landmark }> = {
  public_procurement: { label: 'Marché public', icon: Landmark },
  tender: { label: "Appel d'offres privé", icon: Briefcase },
  subcontracting: { label: 'Sous-traitance', icon: Handshake },
};

type Tab = 'resume' | 'score' | 'dossier';

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, company, user } = useAuth();
  // Three visibility tiers on the DCE/candidature tools specifically: (1)
  // anonymous - login/register CTA, (2) authenticated but no active
  // subscription - tools locked, (3) active subscription - full DCE
  // analysis + candidature generation. Separate from the content-level
  // `access` gating below, which controls whether the opportunity's own
  // description is visible at all on private/sous-traitance fiches.
  const isPaid = company?.subscription_status === 'active';

  const [opportunity, setOpportunity] = useState<ApiOpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('resume');

  // Graduated access (level1/level2/level3/full) - only meaningful for
  // private tender / sous-traitance fiches, which start hidden behind a
  // teaser until a visitor leaves their coordinates (level2) or a chargé
  // d'affaires reviews the lead (level3). Public-market fiches are always
  // 'full' server-side.
  const [access, setAccess] = useState<ApiOpportunityAccess | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [leadForm, setLeadForm] = useState({ email: user?.email || '', phone: '', firstName: user?.firstName || '', lastName: user?.lastName || '', companyName: company?.name || '' });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  // "Analyse stratégique" tab
  const [matchScore, setMatchScore] = useState<ApiMatchScore | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);

  // DCE / bid section - only fetched for authenticated users, since
  // /api/tenders/* requires a company_id (see backend server.ts route
  // mounting: authenticate is applied to /api/tenders but not
  // /api/opportunities, matching the public-browse / auth-for-tools split
  // used elsewhere in the app).
  const [tender, setTender] = useState<ApiTender | null>(null);
  const [bid, setBid] = useState<ApiBidResponse | null>(null);
  const [dceLoading, setDceLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dceError, setDceError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    opportunitiesApi.getById(id)
      .then(setOpportunity)
      .catch(err => setError(getApiErrorMessage(err, "Impossible de charger cette opportunité.")))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setAccessLoading(true);
    opportunitiesApi.getAccess(id)
      .then(setAccess)
      .catch(() => setAccess({ level: 'level1' }))
      .finally(() => setAccessLoading(false));
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (!id || tab !== 'score' || matchScore || scoreLoading) return;
    setScoreLoading(true);
    setScoreError(null);
    opportunitiesApi.getMatchScore(id)
      .then(setMatchScore)
      .catch(err => setScoreError(getApiErrorMessage(err, "Impossible de calculer le score pour cette opportunité.")))
      .finally(() => setScoreLoading(false));
  }, [id, tab, matchScore, scoreLoading]);

  useEffect(() => {
    if (!id || !isAuthenticated || !isPaid) return;
    setDceLoading(true);
    setDceError(null);
    tendersApi.get(id)
      .then(async t => {
        setTender(t);
        const b = await tendersApi.getBid(t.id);
        setBid(b);
      })
      .catch(err => setDceError(getApiErrorMessage(err, "Impossible de charger le dossier.")))
      .finally(() => setDceLoading(false));
  }, [id, isAuthenticated, isPaid]);

  const handleAnalyze = async () => {
    if (!tender) return;
    setAnalyzing(true);
    setDceError(null);
    try {
      const updated = await tendersApi.analyze(tender.id);
      setTender(updated);
    } catch (err) {
      setDceError(getApiErrorMessage(err, "L'analyse du DCE a échoué."));
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
      setDceError(getApiErrorMessage(err, "La génération des documents a échoué."));
    } finally {
      setGenerating(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !leadForm.email) return;
    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const result = await opportunitiesApi.requestAccess(id, leadForm);
      setAccess({ level: result.level as ApiOpportunityAccess['level'] });
    } catch (err) {
      setLeadError(getApiErrorMessage(err, "L'envoi a échoué. Vérifiez votre email et réessayez."));
    } finally {
      setLeadSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin text-orange" /></div>;
  }
  if (error || !opportunity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-red-400 mb-4">{error || 'Opportunité introuvable.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-orange hover:underline">Retour</button>
      </div>
    );
  }

  const journey = opportunity.journey || 'tender';
  const isPublic = journey === 'public_procurement';
  const journeyMeta = JOURNEY_LABEL[journey] || JOURNEY_LABEL.tender;
  const JourneyIcon = journeyMeta.icon;

  // Content-level gating only applies to non-public fiches: public-market
  // listings are open data, always readable in full regardless of access.
  const contentLocked = !isPublic && !accessLoading && (access?.level === 'level1' || !access);
  const hasEnrichedAccess = isPublic || access?.level === 'level2' || access?.level === 'level3' || access?.level === 'full';

  const metaDescription = (hasEnrichedAccess ? (opportunity.ai_summary || opportunity.description) : null)
    || `${journeyMeta.label} : ${opportunity.title}${opportunity.location_city ? ` à ${opportunity.location_city}` : ''}. Consultez l'annonce complète sur Marchés Direct.`;

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 py-6 md:py-10">
      <PageMeta title={`${opportunity.title} — Marchés Direct`} description={metaDescription.slice(0, 300)} />
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-[#B9BBC8] hover:text-white mb-4 transition-colors">
        <ArrowLeft size={14} /> Retour aux résultats
      </button>

      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange uppercase tracking-wide bg-orange/10 border border-orange/30 rounded-full px-2.5 py-1">
            <JourneyIcon size={11} /> {journeyMeta.label}
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
          <span className="flex items-center gap-1.5"><Calendar size={13} /> Échéance : {formatDate(opportunity.deadline)}</span>
          {hasEnrichedAccess && (
            <span className="flex items-center gap-1.5"><Euro size={13} /> {formatAmount(opportunity.estimated_value, opportunity.currency)}</span>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-4 border-b border-[#17334D]">
        {([
          { key: 'resume' as Tab, label: 'Résumé' },
          { key: 'score' as Tab, label: 'Analyse stratégique' },
          { key: 'dossier' as Tab, label: 'Dossier & candidature' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'text-orange border-orange' : 'text-[#B9BBC8] border-transparent hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* RÉSUMÉ TAB */}
      {tab === 'resume' && (
        contentLocked ? (
          <div className="space-y-4">
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
              <p className="text-sm text-[#B9BBC8] leading-relaxed">
                {(opportunity.ai_summary || opportunity.description || '').slice(0, 160)}
                {(opportunity.ai_summary || opportunity.description || '').length > 160 ? '…' : ''}
              </p>
              <p className="text-xs text-orange font-semibold mt-3">Description complète, montant estimé et coordonnées de l'acheteur réservés à l'aperçu enrichi.</p>
            </div>
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 w-9 h-9 rounded-full bg-orange/10 border border-orange/30 flex items-center justify-center">
                  <Lock size={16} className="text-orange" />
                </div>
                <div>
                  <p className="text-sm text-white font-semibold mb-1">Débloquer l'aperçu enrichi</p>
                  <p className="text-xs text-[#B9BBC8]">Laissez vos coordonnées pour accéder immédiatement à la description complète, au montant estimé et à l'analyse de compatibilité.</p>
                </div>
              </div>
              <form onSubmit={handleRequestAccess} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <input required value={leadForm.firstName} onChange={e => setLeadForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Prénom" className="bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50" />
                  <input required value={leadForm.lastName} onChange={e => setLeadForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Nom" className="bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50" />
                </div>
                <input value={leadForm.companyName} onChange={e => setLeadForm(f => ({ ...f, companyName: e.target.value }))} placeholder="Entreprise" className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50" />
                <input required type="email" value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} placeholder="Email professionnel" className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50" />
                <input value={leadForm.phone} onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))} placeholder="Téléphone (optionnel)" className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50" />
                {leadError && <p className="text-xs text-red-400">{leadError}</p>}
                <button type="submit" disabled={leadSubmitting} className="w-full flex items-center justify-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50">
                  {leadSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Voir l'aperçu enrichi
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
            {opportunity.ai_summary && (
              <p className="text-sm text-white leading-relaxed">{opportunity.ai_summary}</p>
            )}
            {opportunity.description && !opportunity.ai_summary && (
              <p className="text-sm text-[#B9BBC8] leading-relaxed">{opportunity.description}</p>
            )}
            {!opportunity.ai_summary && !opportunity.description && (
              <p className="text-sm text-[#B9BBC8]">Aucune description disponible pour cette opportunité.</p>
            )}
            {access?.level === 'level2' && !isPublic && (
              <div className="flex items-start gap-2 mt-4 pt-4 border-t border-[#17334D] text-xs text-[#B9BBC8]">
                <HelpCircle size={14} className="text-orange shrink-0 mt-0.5" />
                <span>Un chargé d'affaires étudie votre demande pour vous donner accès aux documents complets et vous mettre en relation.</span>
              </div>
            )}
          </div>
        )
      )}

      {/* ANALYSE STRATÉGIQUE TAB */}
      {tab === 'score' && (
        scoreLoading ? (
          <div className="flex items-center justify-center py-16 text-[#B9BBC8] text-sm gap-2"><Loader2 size={18} className="animate-spin" /> Calcul du score...</div>
        ) : scoreError ? (
          <div className="bg-[#061D32] border border-red-500/30 rounded-2xl p-4 text-xs text-red-400">{scoreError}</div>
        ) : matchScore ? (
          <div className="space-y-4">
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="shrink-0 w-16 h-16 rounded-full border-4 border-orange/30 flex items-center justify-center relative">
                  <span className="text-xl font-extrabold text-orange">{matchScore.score}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{matchScore.scoreTitle}</p>
                  <p className="text-xs text-[#B9BBC8]">{matchScore.scoreNote}</p>
                </div>
              </div>
              <p className="text-xs text-[#B9BBC8] leading-relaxed pt-3 border-t border-[#17334D]">{matchScore.whyRespond}</p>
              {matchScore.warning && (
                <div className="flex items-start gap-2 mt-3 p-3 bg-orange/5 border border-orange/20 rounded-xl text-xs text-[#B9BBC8]">
                  <AlertTriangle size={14} className="text-orange shrink-0 mt-0.5" /> {matchScore.warning}
                </div>
              )}
            </div>

            {matchScore.positiveFactors.length > 0 && (
              <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Gauge size={15} className="text-orange" /> Facteurs de compatibilité</h2>
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

            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-3">Pondération des critères de l'acheteur</h2>
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
                <h2 className="text-sm font-bold text-white mb-3">Pièces attendues pour candidater</h2>
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
                  <p className="text-[11px] text-[#5B6B80] mt-3 pt-3 border-t border-[#17334D]">Connectez-vous pour vérifier automatiquement ces pièces contre votre dossier entreprise.</p>
                )}
              </div>
            )}
          </div>
        ) : null
      )}

      {/* DOSSIER & CANDIDATURE TAB */}
      {tab === 'dossier' && (
        !isAuthenticated ? (
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 text-center">
            <p className="text-sm text-white font-semibold mb-1">Analyse du dossier (DCE) et candidature</p>
            <p className="text-xs text-[#B9BBC8] mb-4">Créez votre profil entreprise ou connectez-vous pour analyser les documents de consultation et générer votre dossier de candidature.</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Link to="/connexion" state={{ from: `/opportunites/${id}` }} className="inline-flex items-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors">
                <LogIn size={14} /> Se connecter
              </Link>
              <Link to="/inscription" state={{ from: `/opportunites/${id}` }} className="inline-flex items-center gap-2 border border-[#17334D] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:border-orange/50 transition-colors">
                Créer mon profil
              </Link>
            </div>
          </div>
        ) : !isPaid ? (
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-9 h-9 rounded-full bg-orange/10 border border-orange/30 flex items-center justify-center">
                <Lock size={16} className="text-orange" />
              </div>
              <div>
                <p className="text-sm text-white font-semibold mb-1">Analyse du DCE et candidature : réservées à l'offre payante</p>
                <p className="text-xs text-[#B9BBC8]">Votre profil entreprise est bien enregistré. L'analyse automatique du dossier de consultation, la génération du mémoire technique et le suivi de candidature nécessitent un abonnement actif.</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><FileText size={13} className="text-orange/70" /> Analyse IA des documents de consultation (critères, pièces demandées)</div>
              <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><Sparkles size={13} className="text-orange/70" /> Génération automatique du dossier de candidature</div>
              <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><CheckCircle2 size={13} className="text-orange/70" /> Suivi et téléchargement du dossier complet</div>
            </div>
            <Link to="/tarifs" className="inline-flex items-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors">
              <Crown size={14} /> Voir les offres
            </Link>
          </div>
        ) : dceLoading ? (
          <div className="flex items-center justify-center py-10 text-[#B9BBC8] text-sm gap-2"><Loader2 size={18} className="animate-spin" /> Chargement du dossier...</div>
        ) : (
          <div className="space-y-4">
            {/* DCE analysis */}
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2"><FileText size={15} className="text-orange" /> Analyse du DCE</h2>
                {tender?.dce_analysis_status !== 'analyzed' && (
                  <button onClick={handleAnalyze} disabled={analyzing} className="flex items-center gap-1.5 text-xs text-orange border border-orange px-3 py-1.5 rounded-lg hover:bg-orange/10 transition-colors disabled:opacity-40">
                    {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Analyser le DCE
                  </button>
                )}
              </div>
              {tender?.dce_analysis_status === 'analyzed' ? (
                <div className="space-y-2 text-xs text-[#B9BBC8]">
                  {tender.complexity_assessment && <p>Complexité estimée : <span className="text-white font-semibold">{tender.complexity_assessment}</span></p>}
                  {tender.estimated_effort_hours != null && <p>Effort estimé : <span className="text-white font-semibold">{tender.estimated_effort_hours} h</span></p>}
                  {tender.required_documents && tender.required_documents.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[#B9BBC8] mb-1">Documents demandés par l'acheteur :</p>
                      <ul className="list-disc list-inside space-y-0.5 text-white">
                        {tender.required_documents.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#B9BBC8]">{tender?.dce_analysis_status === 'processing' ? 'Analyse en cours...' : "Le dossier n'a pas encore été analysé."}</p>
              )}
            </div>

            {/* Bid package */}
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><FileText size={15} className="text-orange" /> Dossier de candidature</h2>

              {bid?.missing_documents && bid.missing_documents.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-orange/5 border border-orange/20 rounded-xl text-xs text-brand-muted mb-3">
                  <AlertTriangle size={14} className="text-orange shrink-0 mt-0.5" />
                  <span>
                    Documents manquants dans votre profil : {bid.missing_documents.map(d => DOC_LABELS[d] || d).join(', ')}.{' '}
                    <Link to="/profil/dossier-entreprise" className="text-orange font-semibold hover:underline">Ajoutez-les depuis votre dossier entreprise</Link> avant de soumettre.
                  </span>
                </div>
              )}
              {bid?.technical_memo_text && (
                <div className="flex items-center gap-2 text-xs text-green-400 mb-3"><CheckCircle2 size={14} /> Documents générés.</div>
              )}

              <div className="flex flex-wrap gap-2">
                <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1.5 text-xs text-white bg-[#031B30] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors disabled:opacity-40">
                  {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Générer les documents
                </button>
                {/* Always reachable once a (draft) bid exists - GET /api/tenders/:id/bid
                    auto-creates one on first load, so this doesn't need to wait on a
                    successful AI generation first. Previously this link only appeared
                    after `bid?.technical_memo_text` was set, meaning if AI generation
                    wasn't configured/working, there was no way to reach the bid
                    workspace page at all - it would look like the page didn't exist. */}
                <Link to={`/opportunites/${id}/candidature`} className="flex items-center gap-1.5 text-xs text-white bg-orange px-3 py-2 rounded-lg hover:bg-orange/90 transition-colors">
                  <FileText size={13} /> {bid?.technical_memo_text ? 'Relire, valider et télécharger' : 'Gérer ma candidature'}
                </Link>
              </div>
            </div>

            {dceError && <p className="text-xs text-red-400">{dceError}</p>}
          </div>
        )
      )}
    </div>
  );
}
