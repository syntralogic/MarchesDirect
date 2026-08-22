import { useState } from 'react';
import { Calendar, Phone, Mail, CheckCircle } from 'lucide-react';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';

type ContactOption = 'rdv' | 'rappel' | 'message';

const OPTIONS: { key: ContactOption; icon: React.ElementType; title: string; sub: string }[] = [
  { key: 'rdv', icon: Calendar, title: 'Prendre rendez-vous', sub: 'Planifiez un entretien avec un conseiller.' },
  { key: 'rappel', icon: Phone, title: 'Être rappelé', sub: 'Un conseiller vous rappelle sous 24h.' },
  { key: 'message', icon: Mail, title: 'Nous écrire', sub: 'Envoyez-nous un message directement.' },
];

const SUBJECTS = [
  'Demande d\'information',
  'Problème technique',
  'Question sur mon abonnement',
  'Partenariat',
  'Autre',
];

export default function ContactPage() {
  const [activeOption, setActiveOption] = useState<ContactOption>('message');
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [nom, setNom] = useState('');
  const [entreprise, setEntreprise] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Contactez-nous</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 mb-2">Comment pouvons-nous vous aider ?</h1>
        <p className="text-[#B9BBC8] text-sm">Choisissez le canal le plus adapté à votre besoin.</p>
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
          <h2 className="text-xl font-bold text-white mb-2">Message envoyé !</h2>
          <p className="text-[#B9BBC8] text-sm">Nous vous répondrons dans les meilleurs délais, généralement sous 24h ouvrées.</p>
          <button onClick={() => setSubmitted(false)} className="mt-6 text-orange text-sm font-semibold hover:underline">
            Envoyer un autre message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Nom *</label>
              <input required value={nom} onChange={e => setNom(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange"
                placeholder="Votre nom complet" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Entreprise</label>
              <input value={entreprise} onChange={e => setEntreprise(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange"
                placeholder="Nom de votre entreprise" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Email *</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange"
                placeholder="vous@exemple.fr" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Téléphone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange"
                placeholder="06 xx xx xx xx" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Sujet *</label>
            <select required value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Message *</label>
            <textarea required rows={5} value={message} onChange={e => setMessage(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange resize-none"
              placeholder="Décrivez votre demande..." />
          </div>
          <button type="submit" className="w-full bg-orange text-white font-semibold py-3.5 rounded-xl hover:bg-orange/90 transition-colors text-sm">
            Envoyer le message
          </button>
        </form>
      )}

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}
