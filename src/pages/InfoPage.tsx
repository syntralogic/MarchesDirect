import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';
import { 
  Target, ArrowRight, CheckCircle, 
  CircleHelp, Filter, FileText, Edit3, Send, Handshake, 
  Phone, Calendar, Plus, ChevronUp 
} from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

const TEAM = [
  { name: 'Rodolphe Toupain', role: 'Président' },
  { name: 'Charline Goessen', role: 'Assistante de direction' },
  { name: 'Anthony Toupain', role: 'Manager général' },
  { name: 'Garance Marchal', role: 'Community Manager' },
  { name: 'Sophie Martin', role: 'Responsable appels d’offres' },
  { name: 'Julien Morel', role: 'Chargé d’affaires' },
  { name: 'Ivan Aldikan', role: 'Pôle recherche' },
  { name: 'Marine Mkrtchian', role: 'Pôle recherche' },
  { name: 'Marine Mkrtchian', role: 'Pôle recherche' },
  { name: 'Elodie Bernard', role: 'Experte marchés publics' },
  { name: 'Thomas Leroy', role: 'Responsable sous-traitance' },
  { name: 'Camille Robert', role: 'Support administratif' },
];

const FAQ_ITEMS = [
  { q: 'Marchés Direct peut-il réellement trouver des opportunités adaptées à mon entreprise ?', a: 'Oui, notre IA et nos experts analysent des milliers d’annonces chaque jour pour cibler uniquement les appels d’offres correspondant à votre secteur, votre localisation et votre capacité de production.' },
  { q: 'Pourquoi choisir Marchés Direct plutôt que chercher seul ou passer par une autre plateforme ?', a: 'Nous ne nous contentons pas de lister les offres : nous qualifions, nous préparons le dossier administratif et technique, et nous déposons pour vous. Vous gagnez un temps considérable.' },
  { q: 'Que prend concrètement en charge Marchés Direct ?', a: 'La veille, la qualification, la génération des pièces administratives (DC1, DC2, mémoire technique, BPU), la soumission sur les plateformes et l’accompagnement jusqu’à la signature.' },
  { q: 'Combien de temps devrais-je personnellement y consacrer ?', a: 'Environ 2 à 3 heures par mois pour valider les dossiers que nous préparons. Le reste est automatisé ou géré par nos équipes.' },
  { q: 'Quelles sont mes chances de remporter un marché ?', a: 'Nos clients déposent en moyenne 40 % de dossiers en plus qu’auparavant, avec un taux de signature qui augmente dès les premiers mois grâce à des dossiers mieux préparés et ciblés.' },
  { q: 'Sous quel délai puis-je obtenir mes premiers résultats ?', a: 'Vous recevez vos premières alertes dès la première semaine. Les premiers dossiers sont déposés généralement sous 2 à 3 semaines, selon la complexité de votre profil.' },
  { q: 'Comment savoir si Marchés Direct correspond à mon entreprise ?', a: 'Le plus simple est de réserver un appel de 15 minutes avec un conseiller. Il étudie votre activité et vous dit immédiatement si nos services sont pertinents pour vous.' },
];

export default function InfoPage() {
  const { t } = useLang();
  const location = useLocation();
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null); // All FAQs closed by default

  const path = location.pathname;

  // ------- CONTACT PAGE (ONLY CONTACT) -------
  if (path === '/contact') {
    return (
      <div className="page-fade-in max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-3">
            Nous sommes là pour vous aider à <br className="hidden md:block" />
            remporter des appels d'offres privés et des marchés publics, <span className="text-orange">tout en développant votre chiffre d'affaires et vos marges.</span>
          </h1>
          <p className="text-xl font-bold text-white mt-4">
            Marchés Direct est <span className="text-orange">votre partenaire.</span>
          </p>
        </div>

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
              <Target size={28} className="text-orange" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Notre mission</h2>
              <p className="text-sm text-[#B9BBC8] leading-relaxed">Vous faire gagner du temps et augmenter vos chances de réussite.</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              'Gagnez du temps',
              'Augmentez votre chiffre d’affaires et surtout vos marges',
              'Soyez accompagné de A à Z',
              'Améliorez votre taux de signature'
            ].map(reason => (
              <div key={reason} className="flex items-center gap-2">
                <CheckCircle size={16} className="text-orange shrink-0" />
                <span className="text-sm text-white">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setApptOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors flex-1">
            <Calendar size={16} /> {t('bookAppointment')}
          </button>
          <button onClick={() => setCallbackOpen(true)} className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-6 py-3 rounded-xl hover:bg-orange/10 transition-colors flex-1">
            <Phone size={16} /> {t('callBack')}
          </button>
        </div>

        <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
        <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
      </div>
    );
  }

  // ------- FAQ PAGE (ONLY FAQ) -------
  if (path === '/faq') {
    return (
      <div className="page-fade-in max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('faqTag')}</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">
            {t('faqTitle')}
          </h1>
          <p className="text-[#B9BBC8] text-sm md:text-base">{t('faqSub')}</p>
        </div>

        <div className="space-y-3 mb-8">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left gap-4"
              >
                <span className="text-sm font-semibold text-white leading-snug">{item.q}</span>
                {openFaq === i ? (
                  <ChevronUp size={18} className="text-orange shrink-0" />
                ) : (
                  <Plus size={18} className="text-orange shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 border-t border-[#17334D]">
                  <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 text-center orange-glow-sm">
          <h2 className="text-2xl font-extrabold text-white mb-2">
            Votre prochain marché <br className="hidden md:block" />
            <span className="text-orange">commence peut-être ici.</span>
          </h2>
          <p className="text-[#B9BBC8] text-sm mb-6">Présentez-nous votre entreprise dès aujourd'hui.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setApptOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors">
              <Calendar size={16} /> {t('bookAppointment')}
            </button>
            <button onClick={() => setCallbackOpen(true)} className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-6 py-3 rounded-xl hover:bg-orange/10 transition-colors">
              <Phone size={16} /> {t('callBack')}
            </button>
          </div>
        </div>

        <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
        <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
      </div>
    );
  }

  // ------- ABOUT, TEAM, AND HOW IT WORKS ALL SHOW EVERYTHING -------
  const STEPS = [
    { num: '01', icon: CircleHelp, title: t('step1'), desc: t('step1Desc') },
    { num: '02', icon: Filter, title: t('step2'), desc: t('step2Desc') },
    { num: '03', icon: FileText, title: t('step3'), desc: t('step3Desc') },
    { num: '04', icon: Edit3, title: t('step4'), desc: t('step4Desc') },
    { num: '05', icon: Send, title: t('step5'), desc: t('step5Desc') },
    { num: '06', icon: Handshake, title: t('step6'), desc: t('step6Desc') },
  ];

  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
      
      {/* 1. HOW IT WORKS STEPS */}
      <div className="mb-10">
        <div className="mb-6">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('howItWorks')}</span>
          <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">
            {t('stepsTitle')}
          </h1>
          <p className="text-[#B9BBC8] text-sm md:text-base">{t('stepsSub')}</p>
        </div>

        {/* 2 cols on mobile, 3 cols on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {STEPS.map((step) => (
            <div key={step.num} className="bg-[#061D32] border border-[#17334D] rounded-xl p-3 md:p-6">
              <div className="flex items-center gap-2 md:items-start md:gap-4 mb-2 md:mb-4">
                <span className="text-lg md:text-2xl font-extrabold text-orange">{step.num}</span>
                <step.icon size={20} className="text-orange shrink-0 md:hidden" strokeWidth={1.5} />
                <step.icon size={28} className="text-orange shrink-0 hidden md:block" strokeWidth={1.5} />
              </div>
              <h3 className="text-xs md:text-lg font-bold text-white mb-1 md:mb-2">{step.title}</h3>
              <p className="text-[10px] md:text-sm text-[#B9BBC8] leading-relaxed hidden md:block">{step.desc}</p>
              <p className="text-[10px] md:text-sm text-[#B9BBC8] leading-snug md:hidden">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MISSION / VISION SECTION */}
      <div className="mb-10">
        <div className="bg-[#061D32] border border-[#17334D] rounded-xl md:rounded-2xl p-4 md:p-6">
          <div className="flex items-start gap-3 md:gap-4 mb-3 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
              <Target size={22} className="text-orange md:hidden" />
              <Target size={28} className="text-orange hidden md:block" />
            </div>
            <div>
              <h2 className="text-base md:text-xl font-bold text-white mb-1 md:mb-2">{t('aboutMissionTitle')}</h2>
              <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed">Vous faire gagner du temps et augmenter vos chances de réussite.</p>
            </div>
          </div>
          <div className="space-y-1.5 md:space-y-2">
            {[
              'Gagnez du temps',
              'Augmentez votre chiffre d’affaires et surtout vos marges',
              'Soyez accompagné de A à Z',
              'Améliorez votre taux de signature'
            ].map(reason => (
              <div key={reason} className="flex items-center gap-1.5 md:gap-2">
                <CheckCircle size={14} className="text-orange shrink-0 md:hidden" />
                <CheckCircle size={16} className="text-orange shrink-0 hidden md:block" />
                <span className="text-xs md:text-sm text-white">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. TEAM SECTION */}
      <div className="mb-10">
        <div className="mb-6">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('teamTag')}</span>
          <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">
            {t('teamTitle')}
          </h1>
          <p className="text-xs md:text-sm text-[#B9BBC8] max-w-2xl">
            {t('teamSub')}
          </p>
        </div>

        {/* 3 cols on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4">
          {TEAM.map((member, i) => (
            <div key={i} className="bg-[#061D32] border border-[#17334D] rounded-xl p-2 md:p-6 flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-20 md:h-20 rounded-full bg-[#031B30] border border-[#17334D] mb-2 md:mb-4" />
              <p className="text-[8px] md:text-sm font-semibold text-orange mb-0.5 md:mb-1">{member.role}</p>
              <h3 className="text-[10px] md:text-lg font-bold text-white mb-1 md:mb-2">{member.name}</h3>
              <button className="text-[8px] md:text-xs text-orange font-medium hover:underline flex items-center gap-0.5 md:gap-1">
                Découvrir sa fonction <ArrowRight size={8} className="md:hidden" /><ArrowRight size={12} className="hidden md:block" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. FAQ SECTION */}
      <div className="mb-10">
        <div className="mb-6">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('faqTag')}</span>
          <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">
            {t('faqTitle')}
          </h1>
          <p className="text-xs md:text-sm text-[#B9BBC8]">{t('faqSub')}</p>
        </div>

        <div className="space-y-2 md:space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-3 md:p-5 text-left gap-4"
              >
                <span className="text-[11px] md:text-sm font-semibold text-white leading-snug">{item.q}</span>
                {openFaq === i ? (
                  <ChevronUp size={16} className="text-orange shrink-0" />
                ) : (
                  <Plus size={16} className="text-orange shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-3 pb-3 md:px-5 md:pb-5 border-t border-[#17334D]">
                  <p className="text-[10px] md:text-sm text-[#B9BBC8] leading-relaxed pt-3 md:pt-4">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. FINAL CTA */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-xl md:rounded-2xl p-4 md:p-6 text-center orange-glow-sm">
        <h2 className="text-lg md:text-2xl font-extrabold text-white mb-2">
          Votre prochain marché <br className="hidden md:block" />
          <span className="text-orange">commence peut-être ici.</span>
        </h2>
        <p className="text-[10px] md:text-sm text-[#B9BBC8] mb-4 md:mb-6">Présentez-nous votre entreprise dès aujourd'hui.</p>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
          <button onClick={() => setApptOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-4 md:px-6 py-2.5 md:py-3 rounded-xl hover:bg-orange/90 transition-colors text-xs md:text-sm">
            <Calendar size={14} /> {t('bookAppointment')}
          </button>
          <button onClick={() => setCallbackOpen(true)} className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-4 md:px-6 py-2.5 md:py-3 rounded-xl hover:bg-orange/10 transition-colors text-xs md:text-sm">
            <Phone size={14} /> {t('callBack')}
          </button>
        </div>
      </div>

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}