import RequestPrivacyNote from '@/components/RequestPrivacyNote';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Check, Calendar, Clock, User, Phone, Mail, Building2, Loader2, AlertTriangle, Download } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { useBrand } from '@/hooks/use-brand';
import { crmApi, getApiErrorMessage } from '@/lib/apiClient';
import { useIdempotency } from '@/lib/useIdempotency';
import { FormRetryError } from '@/components/FormRetryError';
import { getSessionId, trackVisitorEvent, trackRequestSubmitted } from '@/lib/visitorTracking';
import { normalizeFrPhoneDigits, isValidEmail, isValidFrPhone } from '@/lib/utils';
import RequiredLegend from '@/components/RequiredLegend';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  // When the modal is opened from a context that already knows why the
  // visitor wants a rendez-vous (e.g. a specific tender's dossier page), the
  // motif is pre-selected (step 1 is skipped) and the market is attached to
  // the lead so the visitor isn't asked to re-state what the page implies.
  defaultMotif?: string;
  marketLabel?: string;
  // Tender's submission deadline (opportunity.deadline), when the modal is
  // opened from a specific opportunity's dossier page. Used to warn the
  // visitor when they're booking a rendez-vous after that deadline has
  // already passed - the account manager can no longer help submit a
  // candidature for *this* market, only discuss next steps.
  deadline?: string | null;
}

const MOTIFS = [
  'Découvrir Marchés Direct',
  "Configuration de mon profil",
  "Répondre à un appel d'offres",
  'Comprendre les marchés publics',
  "Développer ma sous-traitance",
  'Autre demande',
];

// Slots are owned by the SERVER (Europe/Paris, one booking per slot, guide v24 s.12):
// they are fetched when the modal opens and a slot is confirmed only after the server reserved it.
type SlotDay = { date: string; label: string; slots: { slotAt: string; time: string }[] };
const icsEscape = (v: string) => v.replace(/[\\,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
const icsStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function AppointmentModal({ open, onClose, defaultMotif, marketLabel, deadline }: AppointmentModalProps) {
  const { t } = useLang();
  const { brandId } = useBrand();
  const { user, company } = useAuth();
  // Anonymous visitors who identified their company (SIRET) and left their
  // email/phone on the dossier flow have no AuthContext account - their
  // details live here instead.
  const { company: anonCompany, leadEmail, leadPhone } = useCompanyKnown();
  const [step, setStep] = useState(1);
  const [motif, setMotif] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [form, setForm] = useState({ nom: '', entreprise: '', email: '', telephone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [days, setDays] = useState<SlotDay[]>([]);
  const [slotsState, setSlotsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [confirmed, setConfirmed] = useState<{ slotAt: string; slotLabel: string; already?: boolean } | null>(null);
  const idem = useIdempotency();
  // DEV-14: the contact-details step is the real start of the form.
  const formStartedRef = useRef(false);
  useEffect(() => {
    if (step === 4 && !formStartedRef.current) {
      formStartedRef.current = true;
      trackVisitorEvent('form_started', 'Formulaire commencé : appointment', undefined, { kind: 'appointment' });
    }
  }, [step]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadSlots = () => {
    setSlotsState('loading');
    crmApi.getAppointmentSlots().then(r => { setDays(r.days); setSlotsState('ready'); }).catch(() => setSlotsState('error'));
  };
  useEffect(() => { if (open) loadSlots(); }, [open]);

  // Point 5 (20 Sep client audit): "Le rendez-vous demandé depuis le
  // dossier réclame à nouveau entreprise, email et téléphone, alors que
  // ces informations viennent d'être enregistrées." This form always
  // started blank even for a visitor who already has an account (or just
  // registered/logged a company profile) with that exact information on
  // file. Prefill from it once, when the modal opens, without overwriting
  // anything the visitor has already typed in this session.
  useEffect(() => {
    if (!open) return;
    setForm(f => {
      if (f.nom || f.entreprise || f.email || f.telephone) return f;
      const nom = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : (company?.contact_name || '');
      return {
        nom: nom || f.nom,
        entreprise: company?.name || anonCompany?.name || f.entreprise,
        email: user?.email || company?.email || leadEmail || f.email,
        telephone: company?.phone || leadPhone || f.telephone,
      };
    });
  }, [open, user, company, anonCompany, leadEmail, leadPhone]);

  // Motif already implied by the page that opened the modal: pre-select it
  // and start at the date step instead of asking again.
  useEffect(() => {
    if (!open || !defaultMotif) return;
    setMotif(m => m || defaultMotif);
    setStep(s => (s === 1 ? 2 : s));
  }, [open, defaultMotif]);

  // Client's 12 Sep report: opening this modal (now reachable from several
  // new "Générer mon dossier" buttons on the dossier hub) left the page
  // layout broken/non-responsive even after closing the modal or navigating
  // back. Root cause: this modal never locked background scroll, so on a
  // narrow viewport the page underneath could pick up horizontal scroll
  // while the modal was open (its own content briefly wider than the
  // viewport during the step transitions below) - and since nothing ever
  // reset it, that scroll offset/state stuck around after close. Standard
  // scroll-lock: freezes body scroll on mount, restores the exact prior
  // inline style on unmount (covers close via the X button, the backdrop
  // click, and unmounting from a route change/back navigation alike, since
  // all three take the `open` prop to false and run this same cleanup).
  useEffect(() => {
    if (!open) return;
    const { overflow, position, top, width } = document.body.style;
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;

  const deadlinePassed = !!deadline && new Date(deadline).getTime() < Date.now();

  const downloadRecap = () => {
    const lines = [
      'Marchés Direct — Récapitulatif de rendez-vous',
      '',
      `Motif : ${motif}`,
      marketLabel ? `Marché : ${marketLabel}` : null,
      `Rendez-vous : ${confirmed?.slotLabel || ''}`,
      '',
      `Contact : ${form.nom}`,
      form.entreprise ? `Entreprise : ${form.entreprise}` : null,
      `Email : ${form.email}`,
      form.telephone ? `Téléphone : ${form.telephone}` : null,
      '',
      'Un conseiller Marchés Direct vous contactera à ce créneau (heure de Paris).',
    ].filter((l): l is string => l !== null);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rendez-vous-marches-direct.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadIcs = () => {
    if (!confirmed) return;
    const end = new Date(new Date(confirmed.slotAt).getTime() + 30 * 60000).toISOString();
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Marches Direct//RDV//FR', 'BEGIN:VEVENT',
      `UID:${icsStamp(confirmed.slotAt)}-${Math.random().toString(36).slice(2)}@marches-direct`, `DTSTAMP:${icsStamp(new Date().toISOString())}`,
      `DTSTART:${icsStamp(confirmed.slotAt)}`, `DTEND:${icsStamp(end)}`, `SUMMARY:${icsEscape('Rendez-vous Marchés Direct')}`,
      `DESCRIPTION:${icsEscape(`Motif : ${motif}${marketLabel ? ` - Marché : ${marketLabel}` : ''}`)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'rendez-vous-marches-direct.ics';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const reset = () => { setStep(1); setMotif(''); setSelectedDate(''); setSelectedSlot(''); setConfirmed(null); setForm({ nom: '', entreprise: '', email: '', telephone: '' }); setError(null); setFieldErrors({}); };
  const handleClose = () => { onClose(); setTimeout(reset, 300); };

  const stepLabels = ['Motif', 'Date', 'Heure', 'Contact', 'Confirmation'];

  const handleConfirm = async () => {
    if (!brandId) { setError('Impossible de contacter le serveur, réessayez.'); return; }

    // DEV-08: errors shown next to the field, before anything is sent.
    const errs: Record<string, string> = {};
    if (!form.nom.trim()) errs.nom = t('requestErrRequired');
    if (!form.email.trim()) errs.email = t('requestErrRequired');
    else if (!isValidEmail(form.email)) errs.email = t('requestErrEmail');
    if (form.telephone && !isValidFrPhone(form.telephone)) errs.telephone = t('requestErrPhone');
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) { setError(null); return; }

    if (!idem.begin()) return;
    setSubmitting(true);
    setError(null);
    try {
      const [firstName, ...rest] = form.nom.trim().split(' ');
      const data = await crmApi.submitLead({
        brandId,
        firstName: firstName || form.nom,
        lastName: rest.join(' ') || undefined,
        email: form.email,
        phone: form.telephone || undefined,
        companyName: form.entreprise || undefined,
        leadSource: 'appointment_modal',
        message: `Motif : ${motif}${marketLabel ? `\nMarché : ${marketLabel}` : ''}`,
        slotAt: selectedSlot,
        sessionId: getSessionId(),
        idempotencyKey: idem.key(),
      });
      idem.reset();
      trackRequestSubmitted('appointment');
      setConfirmed({ slotAt: data.slotAt, slotLabel: data.slotLabel, already: !!data.alreadyBooked });
      setStep(5);
    } catch (err: any) {
      if (err?.response?.status === 409 && err.response.data?.code === 'slot_taken') {
        // slot lost to someone else: keep every field, offer the alternatives
        idem.reset();
        setDays(err.response.data.alternatives || []);
        setSelectedSlot(''); setSelectedDate(''); setStep(2);
        setError(err.response.data.error);
        return;
      }
      setError(`${getApiErrorMessage(err, "Échec de l'envoi.")} ${t('requestRetryHint')}`);
    } finally {
      idem.end();
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-[calc(100%-0px)] md:max-w-lg bg-[#031B30] border border-[#17334D] rounded-t-2xl md:rounded-2xl shadow-2xl z-10 max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#17334D]">
          <div>
            <h2 className="text-lg font-bold text-brand-primary">{t('appointmentTitle')}</h2>
            <p className="text-xs text-brand-muted mt-0.5">Étape {step} sur 5</p>
          </div>
          <button onClick={handleClose} aria-label={t('close')} className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-brand-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-5 py-3 gap-1">
          {stepLabels.map((_label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 ${
                i + 1 < step ? 'bg-orange text-white' :
                i + 1 === step ? 'bg-orange text-white ring-2 ring-orange/30' :
                'bg-[#17334D] text-muted-foreground'
              }`}>
                {i + 1 < step ? <Check size={12} /> : i + 1}
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`h-px flex-1 ${i + 1 < step ? 'bg-orange' : 'bg-[#17334D]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="p-5">
          {deadlinePassed && step < 5 && (
            <div className="flex items-start gap-2 mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>
                La date limite de dépôt de ce marché est déjà passée. Votre conseiller pourra toujours échanger avec vous, mais ne pourra plus vous accompagner pour déposer une candidature sur cette offre.
              </span>
            </div>
          )}
          {marketLabel && step < 5 && (
            <p className="text-xs text-brand-muted mb-4 -mt-1">
              Marché : <span className="text-brand-primary font-medium">{marketLabel}</span>
              {motif && step > 1 && <> · Motif : <span className="text-brand-primary font-medium">{motif}</span></>}
            </p>
          )}
          {/* Step 1: Motif */}
          {step === 1 && (
            <div>
              <h3 className="font-semibold text-brand-primary mb-4">Quel est le motif de votre rendez-vous ?</h3>
              <div className="space-y-2">
                {MOTIFS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMotif(m)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-sm ${
                      motif === m
                        ? 'border-orange bg-orange/10 text-brand-primary'
                        : 'border-[#17334D] text-brand-muted hover:border-orange/40 hover:text-brand-primary'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <button
                disabled={!motif}
                onClick={() => setStep(2)}
                className="mt-5 w-full bg-orange text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-orange/90 transition-colors"
              >
                Continuer <ChevronRight size={16} className="inline ml-1" />
              </button>
            </div>
          )}

          {/* Step 2: Date */}
          {step === 2 && (
            <div>
              <h3 className="font-semibold text-brand-primary mb-4">Choisissez une date</h3>
              {slotsState === 'loading' && <p className="text-sm text-brand-muted">Chargement des créneaux…</p>}
              {slotsState === 'error' && <p className="text-sm text-amber-200">Créneaux indisponibles pour le moment. <button type="button" onClick={loadSlots} className="underline">Réessayer</button></p>}
              <div className="grid grid-cols-1 gap-2">
                {days.map(d => (
                  <button
                    key={d.date}
                    onClick={() => { setSelectedDate(d.date); setSelectedSlot(''); }}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-sm ${
                      selectedDate === d.date
                        ? 'border-orange bg-orange/10 text-brand-primary'
                        : 'border-[#17334D] text-brand-muted hover:border-orange/40'
                    }`}
                  >
                    <Calendar size={16} className="text-orange shrink-0" />
                    <span>{d.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{d.slots.length} créneaux</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="flex-1 border border-[#17334D] text-brand-muted font-medium py-3 rounded-xl hover:border-orange/40 transition-colors text-sm">
                  <ChevronLeft size={14} className="inline mr-1" /> Retour
                </button>
                <button disabled={!selectedDate} onClick={() => setStep(3)} className="flex-1 bg-orange text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-orange/90 transition-colors text-sm">
                  Continuer <ChevronRight size={14} className="inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Heure */}
          {step === 3 && (
            <div>
              <h3 className="font-semibold text-brand-primary mb-1">Choisissez un créneau</h3>
              <p className="text-xs text-brand-muted mb-4">{days.find(d => d.date === selectedDate)?.label} · heure de Paris</p>
              <div className="grid grid-cols-3 gap-2">
                {(days.find(d => d.date === selectedDate)?.slots || []).map(sl => (
                  <button
                    key={sl.slotAt}
                    onClick={() => setSelectedSlot(sl.slotAt)}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-sm font-medium ${
                      selectedSlot === sl.slotAt
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-[#17334D] text-brand-muted hover:border-orange/40'
                    }`}
                  >
                    <Clock size={13} className="shrink-0" /> {sl.time}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(2)} className="flex-1 border border-[#17334D] text-brand-muted font-medium py-3 rounded-xl hover:border-orange/40 transition-colors text-sm">
                  <ChevronLeft size={14} className="inline mr-1" /> Retour
                </button>
                <button disabled={!selectedSlot} onClick={() => setStep(4)} className="flex-1 bg-orange text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-orange/90 transition-colors text-sm">
                  Continuer <ChevronRight size={14} className="inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Contact */}
          {step === 4 && (
            <div>
              <h3 className="font-semibold text-brand-primary mb-1">Vos coordonnées</h3>
              <RequiredLegend className="mb-4" />
              <div className="space-y-3">
                {[
                  { key: 'nom', label: 'Nom complet', icon: User, placeholder: 'Jean Dupont', required: true },
                  { key: 'entreprise', label: 'Entreprise', icon: Building2, placeholder: 'Ma Société SAS', required: false },
                  { key: 'email', label: 'Email', icon: Mail, placeholder: 'jean@exemple.fr', required: true },
                  { key: 'telephone', label: 'Téléphone', icon: Phone, placeholder: '06 00 00 00 00', required: false },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-brand-muted mb-1 block">{field.label}{field.required && <span aria-hidden="true" className="text-orange"> *</span>}</label>
                    <div className="relative">
                      <field.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={field.key === 'email' ? 'email' : field.key === 'telephone' ? 'tel' : 'text'}
                        placeholder={field.placeholder}
                        aria-required={field.required}
                        aria-invalid={!!fieldErrors[field.key]}
                        value={form[field.key as keyof typeof form]}
                        onChange={e => { setFieldErrors(fe => ({ ...fe, [field.key]: '' })); setForm(f => ({
                          ...f,
                          // 27 Sep audit, point 5: this free-text field had no
                          // phone normalization at all, so "+33 6 ..." got
                          // truncated/rejected the same way editPhone did on
                          // the dossier page - reuse the same helper here.
                          [field.key]: field.key === 'telephone' ? normalizeFrPhoneDigits(e.target.value) : e.target.value,
                        })); }}
                        className={`w-full bg-[#061D32] border rounded-xl pl-9 pr-4 py-3 text-sm text-brand-primary placeholder:text-muted-foreground focus:outline-none focus:border-orange transition-colors ${fieldErrors[field.key] ? 'border-red-500/60' : 'border-[#17334D]'}`}
                      />
                    </div>
                    {fieldErrors[field.key] && <p role="alert" className="text-[11px] text-red-400 mt-1">{fieldErrors[field.key]}</p>}
                  </div>
                ))}
              </div>
              {error && <FormRetryError className="mt-3" message={error} onRetry={() => handleConfirm()} busy={submitting} />}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(3)} className="flex-1 border border-[#17334D] text-brand-muted font-medium py-3 rounded-xl hover:border-orange/40 transition-colors text-sm">
                  <ChevronLeft size={14} className="inline mr-1" /> Retour
                </button>
                <button
                  disabled={submitting}
                  onClick={handleConfirm}
                  className="flex-1 bg-orange text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-orange/90 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {submitting ? t('requestSending') : 'Confirmer'}
                </button>
              </div>
              <RequestPrivacyNote className="mt-3 text-center" />
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-brand-primary mb-2">{confirmed?.already ? 'Vous avez déjà un rendez-vous' : 'Rendez-vous confirmé !'}</h3>
              <p className="text-brand-muted text-sm mb-4">
                Un conseiller Marchés Direct vous contactera le <strong className="text-orange">{confirmed?.slotLabel}</strong>.
              </p>
              <div className="brand-card rounded-xl p-4 text-left mb-5 border border-[#17334D]">
                <div className="text-xs text-brand-muted space-y-1">
                  <div><span className="text-brand-muted">Motif :</span> <span className="text-brand-primary">{motif}</span></div>
                  <div><span className="text-brand-muted">Contact :</span> <span className="text-brand-primary">{form.nom}</span></div>
                  <div><span className="text-brand-muted">Email :</span> <span className="text-brand-primary">{form.email}</span></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={downloadIcs} className="flex-1 border border-[#17334D] text-brand-muted font-medium py-3 rounded-xl hover:border-orange/40 hover:text-brand-primary transition-colors text-sm flex items-center justify-center gap-1.5">
                  <Calendar size={14} /> Ajouter à mon agenda
                </button>
                <button onClick={downloadRecap} className="flex-1 border border-[#17334D] text-brand-muted font-medium py-3 rounded-xl hover:border-orange/40 hover:text-brand-primary transition-colors text-sm flex items-center justify-center gap-1.5">
                  <Download size={14} /> Télécharger mon exemplaire
                </button>
                <button onClick={handleClose} className="flex-1 bg-orange text-white font-semibold py-3 rounded-xl hover:bg-orange/90 transition-colors">
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
