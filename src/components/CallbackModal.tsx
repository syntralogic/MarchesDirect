import { useState } from 'react';
import { X, Check, Phone, User, Building2, Clock, Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useBrand } from '@/hooks/use-brand';
import { crmApi, getApiErrorMessage } from '@/lib/apiClient';

interface CallbackModalProps {
  open: boolean;
  onClose: () => void;
}

const MOMENT_LABELS: Record<string, string> = {
  matin: 'Matin (9h–12h)',
  aprem: 'Après-midi (14h–17h)',
  fin: 'Fin de journée (17h–19h)',
};

export function CallbackModal({ open, onClose }: CallbackModalProps) {
  const { t } = useLang();
  const { brandId } = useBrand();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nom: '', entreprise: '', telephone: '', moment: '' });

  if (!open) return null;

  const handleClose = () => { onClose(); setTimeout(() => { setSubmitted(false); setError(null); }, 300); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) { setError('Impossible de contacter le serveur, réessayez.'); return; }

    setSubmitting(true);
    setError(null);
    try {
      const [firstName, ...rest] = form.nom.trim().split(' ');
      await crmApi.submitLead({
        brandId,
        firstName: firstName || form.nom,
        lastName: rest.join(' ') || undefined,
        phone: form.telephone,
        companyName: form.entreprise || undefined,
        leadSource: 'callback_modal',
        message: form.moment ? `Créneau souhaité : ${MOMENT_LABELS[form.moment] || form.moment}` : undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Échec de l'envoi — réessayez."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-[calc(100%-0px)] md:max-w-md bg-[#031B30] border border-[#17334D] rounded-t-2xl md:rounded-2xl shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#17334D]">
          <div>
            <h2 className="text-lg font-bold text-brand-primary">{t('callbackTitle')}</h2>
            <p className="text-xs text-brand-muted mt-0.5">Un conseiller vous rappelle rapidement.</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/10 text-brand-muted hover:text-brand-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: 'nom', label: t('callbackName'), icon: User, placeholder: 'Jean Dupont', type: 'text' },
                { key: 'entreprise', label: t('callbackCompany'), icon: Building2, placeholder: 'Ma Société SAS', type: 'text' },
                { key: 'telephone', label: t('callbackPhone'), icon: Phone, placeholder: '06 00 00 00 00', type: 'tel' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-brand-muted mb-1.5 block font-medium">{field.label}</label>
                  <div className="relative">
                    <field.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      required={field.key !== 'entreprise'}
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-3 text-sm text-brand-primary placeholder:text-muted-foreground focus:outline-none focus:border-orange transition-colors"
                    />
                  </div>
                </div>
              ))}

              {/* Moment souhaité */}
              <div>
                <label className="text-xs text-brand-muted mb-1.5 block font-medium">{t('callbackTime')}</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={form.moment}
                    onChange={e => setForm(f => ({ ...f, moment: e.target.value }))}
                    className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-3 text-sm text-brand-primary focus:outline-none focus:border-orange transition-colors appearance-none"
                  >
                    <option value="">Indifférent</option>
                    <option value="matin">Matin (9h–12h)</option>
                    <option value="aprem">Après-midi (14h–17h)</option>
                    <option value="fin">Fin de journée (17h–19h)</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 -mb-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange text-white font-semibold py-3.5 rounded-xl hover:bg-orange/90 transition-colors mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {t('callbackSubmit')}
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-brand-primary mb-2">Demande envoyée !</h3>
              <p className="text-sm text-brand-muted">{t('callbackConfirm')}</p>
              <button onClick={handleClose} className="mt-5 w-full bg-orange text-white font-semibold py-3 rounded-xl hover:bg-orange/90 transition-colors">
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
