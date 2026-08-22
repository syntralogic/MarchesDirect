import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Calendar, Clock, User, Phone, Mail, Building2 } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
}

const MOTIFS = [
  'Découvrir Marchés Direct',
  "Configuration de mon profil",
  "Répondre à un appel d'offres",
  'Comprendre les marchés publics',
  "Développer ma sous-traitance",
  'Autre demande',
];

const MOCK_DATES = [
  { date: 'Lun 25 août', slots: ['09:00', '10:00', '14:00', '15:00'] },
  { date: 'Mar 26 août', slots: ['09:30', '11:00', '14:30', '16:00'] },
  { date: 'Mer 27 août', slots: ['10:00', '11:30', '15:00'] },
  { date: 'Jeu 28 août', slots: ['09:00', '10:30', '14:00', '16:30'] },
  { date: 'Ven 29 août', slots: ['09:00', '10:00', '11:00'] },
];

export function AppointmentModal({ open, onClose }: AppointmentModalProps) {
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [motif, setMotif] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [form, setForm] = useState({ nom: '', entreprise: '', email: '', telephone: '' });

  if (!open) return null;

  const reset = () => { setStep(1); setMotif(''); setSelectedDate(''); setSelectedSlot(''); setForm({ nom: '', entreprise: '', email: '', telephone: '' }); };
  const handleClose = () => { onClose(); setTimeout(reset, 300); };

  const stepLabels = ['Motif', 'Date', 'Heure', 'Contact', 'Confirmation'];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-[calc(100%-0px)] md:max-w-lg bg-[#031B30] border border-[#17334D] rounded-t-2xl md:rounded-2xl shadow-2xl z-10 max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#17334D]">
          <div>
            <h2 className="text-lg font-bold text-brand-primary">{t('appointmentTitle')}</h2>
            <p className="text-xs text-brand-muted mt-0.5">Étape {step} sur 5</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-brand-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-5 py-3 gap-1">
          {stepLabels.map((label, i) => (
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
              <div className="grid grid-cols-1 gap-2">
                {MOCK_DATES.map(d => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-sm ${
                      selectedDate === d.date
                        ? 'border-orange bg-orange/10 text-brand-primary'
                        : 'border-[#17334D] text-brand-muted hover:border-orange/40'
                    }`}
                  >
                    <Calendar size={16} className="text-orange shrink-0" />
                    <span>{d.date}</span>
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
              <p className="text-xs text-brand-muted mb-4">{selectedDate}</p>
              <div className="grid grid-cols-3 gap-2">
                {(MOCK_DATES.find(d => d.date === selectedDate)?.slots || []).map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-sm font-medium ${
                      selectedSlot === slot
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-[#17334D] text-brand-muted hover:border-orange/40'
                    }`}
                  >
                    <Clock size={13} className="shrink-0" /> {slot}
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
              <h3 className="font-semibold text-brand-primary mb-4">Vos coordonnées</h3>
              <div className="space-y-3">
                {[
                  { key: 'nom', label: 'Nom complet', icon: User, placeholder: 'Jean Dupont' },
                  { key: 'entreprise', label: 'Entreprise', icon: Building2, placeholder: 'Ma Société SAS' },
                  { key: 'email', label: 'Email', icon: Mail, placeholder: 'jean@exemple.fr' },
                  { key: 'telephone', label: 'Téléphone', icon: Phone, placeholder: '06 00 00 00 00' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-brand-muted mb-1 block">{field.label}</label>
                    <div className="relative">
                      <field.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-3 text-sm text-brand-primary placeholder:text-muted-foreground focus:outline-none focus:border-orange transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(3)} className="flex-1 border border-[#17334D] text-brand-muted font-medium py-3 rounded-xl hover:border-orange/40 transition-colors text-sm">
                  <ChevronLeft size={14} className="inline mr-1" /> Retour
                </button>
                <button
                  disabled={!form.nom || !form.email}
                  onClick={() => setStep(5)}
                  className="flex-1 bg-orange text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-orange/90 transition-colors text-sm"
                >
                  Confirmer <Check size={14} className="inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-brand-primary mb-2">Rendez-vous confirmé !</h3>
              <p className="text-brand-muted text-sm mb-4">
                Un conseiller Marchés Direct vous contactera le <strong className="text-brand-primary">{selectedDate}</strong> à <strong className="text-orange">{selectedSlot}</strong>.
              </p>
              <div className="brand-card rounded-xl p-4 text-left mb-5 border border-[#17334D]">
                <div className="text-xs text-brand-muted space-y-1">
                  <div><span className="text-brand-muted">Motif :</span> <span className="text-brand-primary">{motif}</span></div>
                  <div><span className="text-brand-muted">Contact :</span> <span className="text-brand-primary">{form.nom}</span></div>
                  <div><span className="text-brand-muted">Email :</span> <span className="text-brand-primary">{form.email}</span></div>
                </div>
              </div>
              <button onClick={handleClose} className="w-full bg-orange text-white font-semibold py-3 rounded-xl hover:bg-orange/90 transition-colors">
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
