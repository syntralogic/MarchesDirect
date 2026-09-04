import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Save, CheckCircle2, Download, Plus, Trash2,
  AlertTriangle, FileText, Euro, Lock, PhoneCall, Circle, CalendarClock, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  tendersApi, opportunitiesApi, getApiErrorMessage,
  type ApiBidResponse, type ApiPricingItem, type ApiOpportunityDetail, type ApiBidAppointment,
} from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentModal } from '@/components/AppointmentModal';

const DOC_LABELS: Record<string, string> = {
  kbis: 'Extrait KBIS', insurance: "Attestation d'assurance décennale",
  dc1: 'DC1', dc2: 'DC2', dume: 'DUME',
  attestation_fiscale: 'Attestation fiscale', attestation_sociale: 'Attestation sociale',
};

// Small check/circle row used across "Documents de candidature" and
// "Dossier final" (client's dix images, écrans 10 & 17): a generated/present
// item shows a green check, a pending one shows a plain outline circle -
// same visual language in both places rather than two different components.
function ChecklistRow({ label, sublabel, done, action }: { label: string; sublabel?: string; done: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-[#17334D] last:border-b-0">
      <div className="flex items-start gap-2.5 min-w-0">
        {done ? <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" /> : <Circle size={16} className="text-[#4A5A6E] shrink-0 mt-0.5" />}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">{label}</p>
          {sublabel && <p className="text-[10px] text-[#B9BBC8]">{sublabel}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function BidWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { company } = useAuth();
  const isPaid = company?.subscription_status === 'active';
  const [opportunity, setOpportunity] = useState<ApiOpportunityDetail | null>(null);
  const [bid, setBid] = useState<ApiBidResponse | null>(null);
  const [appointment, setAppointment] = useState<ApiBidAppointment | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [pricing, setPricing] = useState<ApiPricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingMemo, setSavingMemo] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [generatingForms, setGeneratingForms] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [showAccountManagerModal, setShowAccountManagerModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([opportunitiesApi.getById(id), tendersApi.get(id)])
      .then(async ([opp, tender]) => {
        setOpportunity(opp);
        const b = await tendersApi.getBid(tender.id);
        setBid(b);
        setMemoText(b.technical_memo_text || '');
        setPricing(b.pricing_schedule_json || []);
        try {
          const { appointment: appt, availableSlots: slots } = await tendersApi.getAppointment(b.id);
          setAppointment(appt);
          setAvailableSlots(slots);
        } catch {
          // Non-fatal: rendez-vous card just shows the "no appointment yet" state.
        }
      })
      .catch(err => setError(getApiErrorMessage(err, 'Impossible de charger le dossier de candidature.')))
      .finally(() => setLoading(false));
  }, [id]);

  // Fills technical_memo_text (brouillon) + engagement_act_text + pricing
  // catalog prefill + missing_documents in one call (client's dix images,
  // écran 10 "Générer mon brouillon"). Shared by the Mémoire technique
  // button and the Acte d'engagement row below - either one produces both.
  const handleGenerateDraft = async () => {
    if (!bid) return;
    setGeneratingDraft(true);
    try {
      const result = await tendersApi.generateBidDocuments(bid.id);
      setBid(result.bid);
      setMemoText(result.bid.technical_memo_text || '');
      if (result.bid.pricing_schedule_json) setPricing(result.bid.pricing_schedule_json);
      toast.success('Brouillon généré.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Échec de la génération du brouillon.'));
    } finally {
      setGeneratingDraft(false);
    }
  };

  // DC1/DC2/DUME (client's dix images, écran 10) - separate endpoint, its
  // own "Générer" action, independent from the memo/engagement-act draft above.
  const handleGenerateForms = async () => {
    if (!bid) return;
    setGeneratingForms(true);
    try {
      const result = await tendersApi.generateForms(bid.id);
      setBid(result.bid);
      toast.success('DC1, DC2 et DUME générés.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Échec de la génération des documents.'));
    } finally {
      setGeneratingForms(false);
    }
  };

  const handleBookSlot = async (slotLabel: string) => {
    if (!bid) return;
    setBookingSlot(slotLabel);
    try {
      const result = await tendersApi.requestAppointment(bid.id, { mode: 'slot', slotLabel });
      setAppointment(result.appointment);
      setShowSlotPicker(false);
      toast.success('Rendez-vous confirmé.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Échec de la prise de rendez-vous.'));
    } finally {
      setBookingSlot(null);
    }
  };

  const handleRequestCallback = async () => {
    if (!bid) return;
    setBookingSlot('callback');
    try {
      const result = await tendersApi.requestAppointment(bid.id, { mode: 'callback' });
      setAppointment(result.appointment);
      toast.success('Demande de rappel enregistrée.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Échec de la demande de rappel."));
    } finally {
      setBookingSlot(null);
    }
  };

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

  // Rendez-vous state (client's dix images, écrans 12-15): distinct from the
  // pre-identification callback on the opportunity page - this one is
  // scoped to this specific bid and is what the "mémoire final" card below
  // points to as the next step.
  const appointmentConfirmed = appointment?.mode === 'slot' && appointment.status === 'confirmed';
  const appointmentCallbackRequested = appointment?.mode === 'callback';

  const formsGenerated = !!(bid.dc1_text && bid.dc2_text && bid.dume_text);
  const draftGenerated = !!bid.technical_memo_text;
  const pricingSaved = pricing.length > 0 && totalPricing > 0 && bid.total_bid_amount === totalPricing;
  const allSelfServeDone = formsGenerated && !!bid.engagement_act_text && pricingSaved && draftGenerated;

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24">
      <Link to={`/opportunites/${id}`} className="flex items-center gap-1.5 text-xs text-[#B9BBC8] hover:text-white mb-4 transition-colors w-fit">
        <ArrowLeft size={14} /> Retour à l'annonce
      </Link>

      <div className="mb-5">
        <h1 className="text-lg md:text-xl font-extrabold text-white mb-1">Dossier de candidature</h1>
        <p className="text-xs text-[#B9BBC8]">{opportunity.title}</p>
      </div>

      {!isPaid && (
        <div className="bg-[#061D32] border border-orange/40 rounded-2xl p-5 mb-5 text-center">
          <Lock size={22} className="text-orange mx-auto mb-2" />
          <h2 className="text-sm font-bold text-white mb-1">Mémoire technique et dépôt : accompagnement dédié</h2>
          <p className="text-xs text-[#B9BBC8] mb-4">
            Un chargé d'affaires Marchés Direct vous accompagne pour rédiger, valider et déposer votre mémoire technique, votre bordereau de prix et le dossier complet.
          </p>
          <button
            type="button"
            onClick={() => setShowAccountManagerModal(true)}
            className="inline-flex items-center gap-1.5 bg-orange text-white font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-orange/90 transition-colors"
          >
            <PhoneCall size={13} /> Contacter un chargé d'affaires
          </button>
        </div>
      )}

      {bid.missing_documents && bid.missing_documents.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-orange/5 border border-orange/20 rounded-xl text-xs text-brand-muted mb-5">
          <AlertTriangle size={14} className="text-orange shrink-0 mt-0.5" />
          <span>
            Documents manquants : {bid.missing_documents.map(d => DOC_LABELS[d] || d).join(', ')}.{' '}
            <Link to="/profil/dossier-entreprise" className="text-orange font-semibold hover:underline">Complétez votre dossier entreprise</Link>.
          </span>
        </div>
      )}

      {isPaid && (
        <>
          {/* Documents de candidature (écran 10) */}
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1"><FileText size={15} className="text-orange" /> Documents de candidature</h2>
            <p className="text-xs text-[#B9BBC8] mb-3">Ces documents sont générés directement à partir de l'entreprise à partir de son profil.</p>

            <ChecklistRow
              label="DC1" sublabel="Lettre de candidature — à générer"
              done={!!bid.dc1_text}
              action={
                <button onClick={handleGenerateForms} disabled={generatingForms} className="flex items-center gap-1 text-[10px] font-bold text-orange border border-orange/40 rounded-lg px-2.5 py-1.5 hover:bg-orange/10 transition-colors disabled:opacity-40 shrink-0">
                  {generatingForms ? <Loader2 size={11} className="animate-spin" /> : null} {bid.dc1_text ? 'Régénérer' : 'Générer'}
                </button>
              }
            />
            <ChecklistRow
              label="DC2" sublabel="Déclaration du candidat — à générer"
              done={!!bid.dc2_text}
              action={
                <button onClick={handleGenerateForms} disabled={generatingForms} className="flex items-center gap-1 text-[10px] font-bold text-orange border border-orange/40 rounded-lg px-2.5 py-1.5 hover:bg-orange/10 transition-colors disabled:opacity-40 shrink-0">
                  {generatingForms ? <Loader2 size={11} className="animate-spin" /> : null} {bid.dc2_text ? 'Régénérer' : 'Générer'}
                </button>
              }
            />
            <ChecklistRow
              label="DUME" sublabel="Document unique de marché européen — à générer"
              done={!!bid.dume_text}
              action={
                <button onClick={handleGenerateForms} disabled={generatingForms} className="flex items-center gap-1 text-[10px] font-bold text-orange border border-orange/40 rounded-lg px-2.5 py-1.5 hover:bg-orange/10 transition-colors disabled:opacity-40 shrink-0">
                  {generatingForms ? <Loader2 size={11} className="animate-spin" /> : null} {bid.dume_text ? 'Régénérer' : 'Générer'}
                </button>
              }
            />
            <ChecklistRow
              label="Acte d'engagement" sublabel="Pièce contractuelle à compléter — à générer"
              done={!!bid.engagement_act_text}
              action={
                <button onClick={handleGenerateDraft} disabled={generatingDraft} className="flex items-center gap-1 text-[10px] font-bold text-orange border border-orange/40 rounded-lg px-2.5 py-1.5 hover:bg-orange/10 transition-colors disabled:opacity-40 shrink-0">
                  {generatingDraft ? <Loader2 size={11} className="animate-spin" /> : null} {bid.engagement_act_text ? 'Régénérer' : 'Générer'}
                </button>
              }
            />
          </div>

          {/* Mémoire technique (écrans 10-11): self-serve brouillon, but the
              final version always needs the chargé d'affaires - matching the
              client's "Le mémoire final nécessite l'intervention de chargé
              d'affaires" copy on every one of screens 11/12/14/15. */}
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-2"><FileText size={15} className="text-orange" /> Mémoire technique</h2>
              {bid.is_technical_memo_approved && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-green-400"><CheckCircle2 size={12} /> VALIDÉ</span>
              )}
            </div>
            <p className="text-xs text-[#B9BBC8] mb-3">
              Vous pouvez préparer un brouillon. Le mémoire final est ensuite construit et débloqué avec votre chargé d'affaires.
            </p>

            {!draftGenerated ? (
              <button onClick={handleGenerateDraft} disabled={generatingDraft} className="flex items-center gap-1.5 text-xs text-white bg-orange px-4 py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-40 mb-1">
                {generatingDraft ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Générer mon brouillon
              </button>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 mb-2"><CheckCircle2 size={12} /> Brouillon disponible</div>
                <textarea
                  value={memoText}
                  onChange={e => { setMemoText(e.target.value); if (bid.is_technical_memo_approved) setBid({ ...bid, is_technical_memo_approved: false }); }}
                  rows={10}
                  className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-3 py-2.5 text-xs text-white leading-relaxed font-mono focus:outline-none focus:border-orange mb-3"
                />
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => handleSaveMemo(false)} disabled={savingMemo} className="flex items-center gap-1.5 text-xs text-white bg-[#031B30] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors disabled:opacity-40">
                    {savingMemo ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Enregistrer le brouillon
                  </button>
                </div>
              </>
            )}

            {/* Rendez-vous gating (écrans 12-15) */}
            <div className="border border-[#17334D] rounded-xl p-3.5 bg-[#031B30]">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange bg-orange/10 border border-orange/30 rounded-full px-2 py-0.5 mb-2">
                <Lock size={10} /> Mémoire final
              </span>
              <p className="text-xs font-bold text-white mb-1">Le mémoire final nécessite l'intervention du chargé d'affaires</p>
              <p className="text-[11px] text-[#B9BBC8] mb-3">
                Un chargé d'affaires recueille les précisions sur les méthodes, moyens, organisation et références, puis envoie le mémoire final dans votre espace client.
              </p>

              {appointmentConfirmed ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                  <CheckCircle2 size={14} /> Rendez-vous confirmé — {appointment?.slot_label}
                </div>
              ) : appointmentCallbackRequested ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-400">
                  <CheckCircle2 size={14} /> Rappel demandé, sans créneau précis
                </div>
              ) : showSlotPicker ? (
                <div className="grid grid-cols-2 gap-2">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => handleBookSlot(slot)}
                      disabled={bookingSlot !== null}
                      className="flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-[#061D32] border border-[#17334D] rounded-lg py-2 hover:border-orange/50 transition-colors disabled:opacity-40"
                    >
                      {bookingSlot === slot ? <Loader2 size={11} className="animate-spin" /> : null} {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="bg-[#2A1B0E] border border-orange/20 rounded-lg p-3 mb-3">
                    <p className="text-xs font-bold text-white mb-1">Aucun rendez-vous ni rappel n'est prévu</p>
                    <p className="text-[11px] text-[#B9BBC8]">
                      Ce n'était pas obligatoire avant. Pour finaliser le mémoire technique, un échange avec le chargé d'affaires devient maintenant nécessaire.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setShowSlotPicker(true)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange px-3.5 py-2 rounded-lg hover:bg-orange/90 transition-colors">
                      <CalendarClock size={13} /> Prendre rendez-vous
                    </button>
                    <button onClick={handleRequestCallback} disabled={bookingSlot !== null} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#061D32] border border-[#17334D] px-3.5 py-2 rounded-lg hover:border-orange/50 transition-colors disabled:opacity-40">
                      {bookingSlot === 'callback' ? <Loader2 size={13} className="animate-spin" /> : <PhoneCall size={13} />} Être rappelé
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pricing schedule (écran 16) */}
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3"><Euro size={15} className="text-orange" /> Bordereau de prix</h2>

            {pricingSaved && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 mb-3"><CheckCircle2 size={12} /> Cadre de prix préparé</div>
            )}

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
              <span className="text-xs text-[#B9BBC8]">Montant du travail</span>
              <span className="text-sm font-extrabold text-white">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalPricing)}</span>
            </div>

            {pricingSaved ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-400/5 border border-green-400/20 px-4 py-2.5 rounded-xl">
                <CheckCircle2 size={13} /> Prix préparé
              </div>
            ) : (
              <button onClick={handleSavePricing} disabled={savingPricing} className="flex items-center gap-1.5 text-xs text-white bg-orange px-4 py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-40">
                {savingPricing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Préparer le bordereau de prix
              </button>
            )}
          </div>

          {/* Dossier final (écran 17) */}
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 mb-5">
            {allSelfServeDone ? (
              <>
                <h2 className="text-sm font-bold text-white mb-1">Votre partie est prête</h2>
                <p className="text-xs text-[#B9BBC8] mb-3">
                  DC1, DC2, DUME, acte d'engagement, bordereau de prix — uniquement le mémoire technique final transmis par le chargé d'affaires reste en attente.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-sm font-bold text-white mb-1">Préparation du dossier final</h2>
                <p className="text-xs text-[#B9BBC8] mb-1">Complétez les documents du dossier à partir du brouillon.</p>
                <p className="text-[11px] font-semibold text-orange mb-3">Compléter les étapes ci-dessous</p>
              </>
            )}
            <div className="mb-3">
              <ChecklistRow label="DC1 / DC2 / DUME" done={formsGenerated} />
              <ChecklistRow label="Acte d'engagement" done={!!bid.engagement_act_text} />
              <ChecklistRow label="Bordereau de prix" done={pricing.length > 0 && totalPricing > 0} />
              <ChecklistRow label="Mémoire technique — brouillon" done={draftGenerated} />
              <ChecklistRow label="Mémoire technique — version finale (chargé d'affaires)" done={bid.is_technical_memo_approved} />
            </div>
            {!bid.is_technical_memo_approved && (
              <p className="text-xs text-orange mb-3">En attente du mémoire technique final transmis par le chargé d'affaires.</p>
            )}
            <button
              onClick={handleDownload}
              disabled={downloading || !bid.is_technical_memo_approved}
              className="flex items-center gap-1.5 text-xs text-white bg-orange px-4 py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-40 mb-2"
            >
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Télécharger le dossier (ZIP)
            </button>
            <Link to="/tableau-de-bord" className="block text-center text-xs font-semibold text-[#B9BBC8] hover:text-white transition-colors mt-2">
              Retour au tableau de bord
            </Link>
          </div>
        </>
      )}

      <AppointmentModal open={showAccountManagerModal} onClose={() => setShowAccountManagerModal(false)} />
    </div>
  );
}
