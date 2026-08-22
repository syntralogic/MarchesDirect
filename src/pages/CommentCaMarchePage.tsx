import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';
import { ArrowRight } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'On surveille',
    desc: 'Nos connecteurs collectent BOAMP, PLACE, JOUE et d\'autres sources publiques et privées.',
  },
  {
    num: '02',
    title: 'On trie & qualifie',
    desc: 'L\'IA classe chaque opportunité par métier, CPV, distance et montant.',
  },
  {
    num: '03',
    title: 'On prépare votre dossier',
    desc: 'Le dossier est généré à partir de votre profil entreprise : DC1, DC2, mémoire technique, BPU.',
  },
  {
    num: '04',
    title: 'Vous validez',
    desc: 'Vous vérifiez et ajustez le dossier. Nous restons disponibles pour conseil et compléments.',
  },
  {
    num: '05',
    title: 'On dépose',
    desc: 'Nous déposons les dossiers en votre nom sur les plateformes de dématérialisation.',
  },
  {
    num: '06',
    title: 'Vous gagnez du temps',
    desc: 'Vous vous concentrez sur votre activité pendant que nous maximisons vos chances.',
  },
];

export default function CommentCaMarchePage() {
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <div className="page-fade-in max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-16">
      {/* Header */}
      <div className="mb-10 md:mb-16 text-center md:text-left">
        <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-snug mb-4">
          Du repérage de l'opportunité jusqu'au dossier prêt à déposer.
        </h1>
        <p className="text-[#B9BBC8] text-sm md:text-base max-w-2xl md:mx-0 mx-auto">
          Un parcours simple, clair et rapide pour transformer une opportunité en dossier prêt à envoyer.
        </p>
      </div>

      {/* Steps — desktop timeline, mobile stacked */}
      <div className="relative">
        {/* Desktop: vertical line */}
        <div className="hidden md:block absolute left-8 top-6 bottom-6 w-px bg-[#17334D]" />

        <div className="space-y-4 md:space-y-0">
          {STEPS.map((step, i) => (
            <div key={step.num} className="md:flex md:items-start md:gap-8 md:pb-10 md:last:pb-0">
              {/* Step number circle */}
              <div className="hidden md:flex shrink-0 w-16 h-16 rounded-full bg-[#061D32] border-2 border-orange items-center justify-center relative z-10">
                <span className="text-orange font-extrabold text-lg">{step.num}</span>
              </div>

              {/* Mobile: number + content inline */}
              <div className="md:hidden flex gap-4 bg-[#061D32] border border-[#17334D] rounded-2xl p-4 mb-3">
                <div className="shrink-0 w-10 h-10 rounded-full border-2 border-orange flex items-center justify-center">
                  <span className="text-orange font-bold text-sm">{step.num}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-[#B9BBC8] leading-relaxed">{step.desc}</p>
                </div>
              </div>

              {/* Desktop: content card */}
              <div className="hidden md:block flex-1 bg-[#061D32] border border-[#17334D] rounded-2xl p-6 hover:border-orange/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-[#B9BBC8] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 md:mt-16 bg-[#061D32] border border-[#17334D] rounded-2xl p-6 md:p-10 text-center orange-glow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-3">Besoin d'un accompagnement personnalisé ?</h2>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button onClick={() => setApptOpen(true)} className="bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors">
            Prendre rendez-vous
          </button>
          <button onClick={() => setCallbackOpen(true)} className="border border-orange text-orange font-semibold px-6 py-3 rounded-xl hover:bg-orange/10 transition-colors">
            Être rappelé
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 pt-6 border-t border-[#17334D]">
          {[
            { label: 'À propos →', href: '/a-propos' },
            { label: 'Notre équipe →', href: '/equipe' },
            { label: 'Questions fréquentes →', href: '/faq' },
          ].map(link => (
            <Link key={link.href} to={link.href} className="text-sm text-orange font-semibold hover:underline flex items-center justify-center gap-1">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}
