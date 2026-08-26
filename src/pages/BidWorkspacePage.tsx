import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Save, CheckCircle2, Download, Plus, Trash2,
  AlertTriangle, FileText, Euro,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  tendersApi, opportunitiesApi, getApiErrorMessage,
  type ApiBidResponse, type ApiPricingItem, type ApiOpportunityDetail,
} from '@/lib/apiClient';

const DOC_LABELS: Record<string, string> = {
  kbis: 'Extrait KBIS', insurance: "Attestation d'assurance décennale",
  dc1: 'DC1', dc2: 'DC2', dume: 'DUME',
  attestation_fiscale: 'Attestation fiscale', attestation_sociale: 'Attestation sociale',
};

export default function BidWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const [opportunity, setOpportunity] = useState<ApiOpportunityDetail | null>(null);
  const [bid, setBid] = useState<ApiBidResponse | null>(null);
  const [memoText, setMemoText] = useState('');
  const [pricing, setPricing] = useState<ApiPricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingMemo, setSavingMemo] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([opportunitiesApi.getById(id), tendersApi.get(id)])
      .then(async ([opp, tender]) => {
        setOpportunity(opp);
        const b = await tendersApi.getBid(tender.id);
        setBid(b);
        setMemoText(b.technical_memo_text || '');
        setPricing(b.pricing_schedule_json || []);
      })
      .catch(err => setError(getApiErrorMessage(err, 'Impossible de charger le dossier de candidature.')))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveMemo = async (approve: boolean) => {
    if (!bid) return;
    setSavingMemo(true);
    try {
      const updated = await tendersApi.updateBid(bid.id, {
        technical_memo_text: memoText,
        is_technical_memo_approved: approve,
      });
      setBid(updated);
      toast.success(approve ? 'Mémoire technique validé.' : 'Brouillon enregistré.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Échec de l'enregistrement."));
    } finally {
      setSavingMemo(false);
    }
  };

  const totalPricing = pricing.reduce((sum, p) => sum + (p.quantity || 0) * (p.unit_price || 0), 0);

  const handleSavePricing = async () => {
    if (!bid) return;
    setSavingPricing(true);
    try {
      const updated = await tendersApi.updateBid(bid.id, {
        pricing_schedule_json: pricing,
        total_bid_amount: totalPricing,
      });
      setBid(updated);
      toast.success('Bordereau de prix enregistré.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Échec de l'enregistrement du bordereau."));
    } finally {
      setSavingPricing(false);
    }
  };

  const handleDownload = async () => {
    if (!bid) return;
    setDownloading(true);
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
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 size={24} className="animate-spin text-orange" /></div>;
  }

  if (error || !bid || !opportunity) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-red-400 mb-4">{error || 'Dossier introuvable.'}</p>
        <Link to={`/opportunites/${id}`} className="text-orange text-sm font-semibold hover:underline">Retour à l'annonce</Link>
      </div>
    );
  }

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
      <Link to={`/opportunites/${id}`} className="flex items-center gap-1.5 text-xs text-[#B9BBC8] hover:text-white mb-4 transition-colors w-fit">
        <ArrowLeft size={14} /> Retour à l'annonce
      </Link>

      <div className="mb-5">
        <h1 className="text-lg md:text-xl font-extrabold text-white mb-1">Dossier de candidature</h1>
        <p className="text-xs text-[#B9BBC8]">{opportunity.title}</p>
      </div>

      {bid.missing_documents && bid.missing_documents.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-orange/5 border border-orange/20 rounded-xl text-xs text-brand-muted mb-5">
          <AlertTriangle size={14} className="text-orange shrink-0 mt-0.5" />
          <span>
            Documents manquants : {bid.missing_documents.map(d => DOC_LABELS[d] || d).join(', ')}.{' '}
            <Link to="/profil/dossier-entreprise" className="text-orange font-semibold hover:underline">Complétez votre dossier entreprise</Link>.
          </span>
        </div>
      )}

      {/* Technical memo review */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><FileText size={15} className="text-orange" /> Mémoire technique</h2>
          {bid.is_technical_memo_approved && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400"><CheckCircle2 size={12} /> VALIDÉ</span>
          )}
        </div>
        <p className="text-xs text-[#B9BBC8] mb-3">
          Premier brouillon généré à partir de votre dossier entreprise. Relisez, modifiez si besoin, puis validez — aucune section n'est soumise sans votre validation.
        </p>
        <textarea
          value={memoText}
          onChange={e => { setMemoText(e.target.value); if (bid.is_technical_memo_approved) setBid({ ...bid, is_technical_memo_approved: false }); }}
          rows={14}
          className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-3 py-2.5 text-xs text-white leading-relaxed font-mono focus:outline-none focus:border-orange mb-3"
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleSaveMemo(false)} disabled={savingMemo} className="flex items-center gap-1.5 text-xs text-white bg-[#031B30] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors disabled:opacity-40">
            {savingMemo ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Enregistrer le brouillon
          </button>
          <button onClick={() => handleSaveMemo(true)} disabled={savingMemo} className="flex items-center gap-1.5 text-xs text-white bg-orange px-3 py-2 rounded-lg hover:bg-orange/90 transition-colors disabled:opacity-40">
            <CheckCircle2 size={13} /> Valider ce mémoire
          </button>
        </div>
      </div>

      {/* Pricing schedule */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Euro size={15} className="text-orange" /> Bordereau de prix</h2>

        <div className="space-y-2 mb-3">
          {pricing.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_60px_70px_90px_auto] gap-2 items-center">
              <input
                value={item.label}
                onChange={e => setPricing(p => p.map((it, idx) => idx === i ? { ...it, label: e.target.value } : it))}
                placeholder="Désignation"
                className="bg-[#031B30] border border-[#17334D] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange"
              />
              <input
                type="number" value={item.quantity ?? ''}
                onChange={e => setPricing(p => p.map((it, idx) => idx === i ? { ...it, quantity: Number(e.target.value) } : it))}
                placeholder="Qté"
                className="bg-[#031B30] border border-[#17334D] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange"
              />
              <input
                value={item.unit ?? ''}
                onChange={e => setPricing(p => p.map((it, idx) => idx === i ? { ...it, unit: e.target.value } : it))}
                placeholder="Unité"
                className="bg-[#031B30] border border-[#17334D] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange"
              />
              <input
                type="number" value={item.unit_price ?? ''}
                onChange={e => setPricing(p => p.map((it, idx) => idx === i ? { ...it, unit_price: Number(e.target.value) } : it))}
                placeholder="PU €"
                className="bg-[#031B30] border border-[#17334D] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange"
              />
              <button onClick={() => setPricing(p => p.filter((_, idx) => idx !== i))} className="text-[#B9BBC8] hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setPricing(p => [...p, { label: '', quantity: 1, unit: 'u', unit_price: 0 }])}
          className="flex items-center gap-1.5 text-xs font-semibold text-orange mb-4"
        >
          <Plus size={13} /> Ajouter une ligne
        </button>

        <div className="flex items-center justify-between border-t border-[#17334D] pt-3 mb-3">
          <span className="text-xs text-[#B9BBC8]">Total estimé</span>
          <span className="text-sm font-extrabold text-white">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalPricing)}</span>
        </div>

        <button onClick={handleSavePricing} disabled={savingPricing} className="flex items-center gap-1.5 text-xs text-white bg-[#031B30] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors disabled:opacity-40">
          {savingPricing ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Enregistrer le bordereau
        </button>
      </div>

      {/* Final download */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
        <h2 className="text-sm font-bold text-white mb-2">Dossier complet</h2>
        <p className="text-xs text-[#B9BBC8] mb-3">
          Mémoire technique, acte d'engagement, bordereau de prix, DC1, DC2 et synthèse DUME — assemblés dans un fichier ZIP prêt à soumettre.
        </p>
        {!bid.is_technical_memo_approved && (
          <p className="text-xs text-orange mb-3">Validez le mémoire technique ci-dessus avant de télécharger le dossier final.</p>
        )}
        <button
          onClick={handleDownload}
          disabled={downloading || !bid.is_technical_memo_approved}
          className="flex items-center gap-1.5 text-xs text-white bg-orange px-4 py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-40"
        >
          {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Télécharger le dossier (ZIP)
        </button>
      </div>
    </div>
  );
}
