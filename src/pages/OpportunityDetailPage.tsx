import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Euro, Loader2, FileText, Sparkles, Download, AlertTriangle, CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  opportunitiesApi, tendersApi, getApiErrorMessage,
  type ApiOpportunity, type ApiTender, type ApiBidResponse,
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

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [opportunity, setOpportunity] = useState<ApiOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [downloading, setDownloading] = useState(false);
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
    if (!id || !isAuthenticated) return;
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
  }, [id, isAuthenticated]);

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

  const handleDownload = async () => {
    if (!bid) return;
    setDownloading(true);
    setDceError(null);
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
      setDceError(getApiErrorMessage(err, "Le téléchargement a échoué — générez d'abord les documents."));
    } finally {
      setDownloading(false);
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

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 py-6 md:py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-[#B9BBC8] hover:text-white mb-4 transition-colors">
        <ArrowLeft size={14} /> Retour aux résultats
      </button>

      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 mb-6">
        <h1 className="text-lg md:text-xl font-extrabold text-white mb-3 leading-snug">{opportunity.title}</h1>
        <div className="flex flex-wrap gap-4 text-xs text-[#B9BBC8] mb-4">
          {(opportunity.location_city || opportunity.location_region) && (
            <span className="flex items-center gap-1.5"><MapPin size={13} /> {[opportunity.location_city, opportunity.location_region].filter(Boolean).join(', ')}</span>
          )}
          <span className="flex items-center gap-1.5"><Calendar size={13} /> Échéance : {formatDate(opportunity.deadline)}</span>
          <span className="flex items-center gap-1.5"><Euro size={13} /> {formatAmount(opportunity.estimated_value, opportunity.currency)}</span>
        </div>
        {opportunity.ai_summary && (
          <p className="text-sm text-white leading-relaxed border-t border-[#17334D] pt-4">{opportunity.ai_summary}</p>
        )}
        {opportunity.description && !opportunity.ai_summary && (
          <p className="text-sm text-[#B9BBC8] leading-relaxed border-t border-[#17334D] pt-4">{opportunity.description}</p>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 text-center">
          <p className="text-sm text-white font-semibold mb-1">Analyse du dossier (DCE) et candidature</p>
          <p className="text-xs text-[#B9BBC8] mb-4">Connectez-vous pour analyser les documents de consultation et générer votre dossier de candidature.</p>
          <Link to="/connexion" state={{ from: `/opportunites/${id}` }} className="inline-flex items-center gap-2 bg-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-orange/90 transition-colors">
            <LogIn size={14} /> Se connecter
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
                <span>Documents manquants dans votre profil : {bid.missing_documents.map(d => DOC_LABELS[d] || d).join(', ')}. Ajoutez-les depuis votre profil avant de soumettre.</span>
              </div>
            )}
            {bid?.technical_memo_text && (
              <div className="flex items-center gap-2 text-xs text-green-400 mb-3"><CheckCircle2 size={14} /> Documents générés — prêts à télécharger.</div>
            )}

            <div className="flex flex-wrap gap-2">
              <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1.5 text-xs text-white bg-[#031B30] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors disabled:opacity-40">
                {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Générer les documents
              </button>
              <button onClick={handleDownload} disabled={downloading || !bid?.technical_memo_text} className="flex items-center gap-1.5 text-xs text-white bg-orange px-3 py-2 rounded-lg hover:bg-orange/90 transition-colors disabled:opacity-40">
                {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Télécharger le dossier (ZIP)
              </button>
            </div>
          </div>

          {dceError && <p className="text-xs text-red-400">{dceError}</p>}
        </div>
      )}
    </div>
  );
}
