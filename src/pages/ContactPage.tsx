import { useState } from 'react';
import { Calendar, Phone, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';
import { useLang } from '@/contexts/LangContext';
import { useBrand } from '@/hooks/use-brand';
import { crmApi, getApiErrorMessage } from '@/lib/apiClient';

type ContactOption = 'rdv' | 'rappel' | 'message';

export default function ContactPage() {
  const { t } = useLang();
  const { brandId } = useBrand();
  const [activeOption, setActiveOption] = useState<ContactOption>('message');
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SUBJECTS = [
    t('contactSubj1'),
    t('contactSubj2'),
    t('contactSubj3'),
    t('contactSubj4'),
    t('contactSubj5'),
  ];

  const OPTIONS: { key: ContactOption; icon: React.ElementType; title: string; sub: string }[] = [
    { key: 'rdv', icon: Calendar, title: t('contactRdv'), sub: t('contactRdvSub') },
    { key: 'rappel', icon: Phone, title: t('contactCallback'), sub: t('contactCallbackSub') },
    { key: 'message', icon: Mail, title: t('contactMessage'), sub: t('contactMessageSub') },
  ];

  // Form state
  const [nom, setNom] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) { setError('Impossible de contacter le serveur, réessayez.'); return; }

    setSubmitting(true);
    setError(null);
    try {
      const [firstName, ...rest] = nom.trim().split(' ');
      await crmApi.submitLead({
        brandId,
        firstName: firstName || nom,
        lastName: rest.join(' ') || undefined,
        email,
        phone: phone || undefined,
        companyName: entreprise || undefined,
        leadSource: 'contact_form',
        message: `Sujet : ${subject}\n\n${message}`,
      });
      setSubmitted(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Échec de l'envoi — réessayez."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('contactTag')}</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 mb-2">{t('contactTitle')}</h1>
        <p className="text-[#B9BBC8] text-sm">{t('contactSub')}</p>
      </div>

      {/* Contact options */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => {
              if (opt.key === 'rdv') { setApptOpen(true); return; }
              if (opt.key === 'rappel') { setCallbackOpen(true); return; }
              setActiveOption(opt.key);
            }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
              activeOption === opt.key && opt.key === 'message'
                ? 'border-orange bg-orange/5'
                : 'border-[#17334D] bg-[#061D32] hover:border-orange/40'
            }`}
          >
            <opt.icon size={20} className="text-orange" />
            <span className={`text-xs font-semibold leading-snug ${activeOption === opt.key && opt.key === 'message' ? 'text-orange' : 'text-white'}`}>
              {opt.title}
            </span>
          </button>
        ))}
      </div>

      {/* Contact form */}
      {submitted ? (
        <div className="bg-[#061D32] border border-green-500/30 rounded-2xl p-8 text-center orange-glow-sm">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{t('contactSentTitle')}</h2>
          <p className="text-[#B9BBC8] text-sm">{t('contactSentSub')}</p>
          <button onClick={() => setSubmitted(false)} className="mt-6 text-orange text-sm font-semibold hover:underline">
            {t('contactSentAgain')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('contactName')}</label>
              <input required value={nom} onChange={e => setNom(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange"
                placeholder={t('contactNamePlaceholder')} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('contactCompany')}</label>
              <input value={entreprise} onChange={e => setEntreprise(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange"
                placeholder={t('contactCompanyPlaceholder')} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('contactEmail')}</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange"
                placeholder={t('contactEmailPlaceholder')} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('contactPhone')}</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange"
                placeholder={t('contactPhonePlaceholder')} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('contactSubject')}</label>
            <select required value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('contactMessageLabel')}</label>
            <textarea required rows={5} value={message} onChange={e => setMessage(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange resize-none"
              placeholder={t('contactMessagePlaceholder')} />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange text-white font-semibold py-3.5 rounded-xl hover:bg-orange/90 transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {t('contactSubmit')}
          </button>
        </form>
      )}

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}