import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';
import { 
  Target, ArrowRight, CheckCircle, CircleHelp, Filter, FileText, Edit3, Send, Handshake, 
  Phone, Calendar, Plus, ChevronUp, Euro, Clock, Shield, Search, Scale, Building2, TrendingUp
} from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

const TEAM = [
  { name: 'Bernard Delmas', role: 'Directeur général' },
  { name: 'Elena Popescu', role: 'Assistante de direction' },
  { name: 'Maria Ferreira', role: 'Chargée d’affaires' },
  { name: 'Nicole Pisseron', role: 'Chargée d’affaires' },
  { name: 'Emre Kaya', role: 'Chargé d’affaires' },
  { name: 'Charlotte Le Guen', role: 'Experte marchés publics' },
];

// EXACT FAQ DATA & STYLE FROM IMAGE
const FAQ_SECTIONS = [
  {
    title: 'LE SERVICE',
    items: [
      {
        icon: Euro,
        q: 'Combien ça va me coûter ?',
        a: "L'essentiel de notre rémunération vient de vos succès : un pourcentage compris entre 0,5 % et 5 % du marché selon sa taille, et uniquement si vous le signez.\n\nÀ côté, un abonnement à partir de 29 €/mois vous donne accès à la plateforme, à la veille sur vos secteurs, à votre chargé d'affaires dédié et à une équipe complète qui prend tout en charge, du repérage jusqu'à la signature du marché.\n\nPas de frais de dossier. Les conditions exactes sont fixées avec vous dès le premier échange.",
      },
      {
        icon: FileText,
        q: 'Que prend concrètement en charge Marchés Direct ?',
        a: "Nous prenons en charge la veille, la qualification, la génération des pièces administratives (DC1, DC2, mémoire technique, BPU), la soumission sur les plateformes et l'accompagnement jusqu'à la signature.",
      },
      {
        icon: Clock,
        q: 'Combien de temps devrais-je personnellement y consacrer ?',
        a: "Environ 2 à 3 heures par mois pour valider les dossiers que nous préparons. Le reste est automatisé ou géré par nos équipes.",
      },
      {
        icon: Shield,
        q: 'Mes informations d\'entreprise restent-elles confidentielles ?',
        a: "Oui, toutes vos données sont chiffrées et stockées de manière sécurisée. Nous ne partageons jamais vos informations sans votre accord explicite.",
      },
    ],
  },
  {
    title: 'LES OPPORTUNITÉS',
    items: [
      {
        icon: Search,
        q: 'Marchés Direct peut-il réellement trouver des opportunités adaptées à mon entreprise ?',
        a: "Oui, notre IA et nos experts analysent des milliers d'annonces chaque jour pour cibler uniquement les appels d'offres correspondant à votre secteur, votre localisation et votre capacité de production.",
      },
      {
        icon: Scale,
        q: 'Pourquoi choisir Marchés Direct plutôt que chercher seul ou passer par une autre plateforme ?',
        a: "Nous ne nous contentons pas de lister les offres : nous qualifions, nous préparons le dossier administratif et technique, et nous déposons pour vous. Vous gagnez un temps considérable.",
      },
      {
        icon: Building2,
        q: 'Comment savoir si Marchés Direct correspond à mon entreprise ?',
        a: "Le plus simple est de réserver un appel de 15 minutes avec un conseiller. Il étudie votre activité et vous dit immédiatement si nos services sont pertinents pour vous.",
      },
    ],
  },
  {
    title: 'LES RÉSULTATS',
    items: [
      {
        icon: Shield,
        q: 'Que se passe-t-il si je ne remporte aucun marché ?',
        a: "Aucun marché signé, aucune commission. Vous ne payez que l'abonnement de base, et vous conservez tous les dossiers préparés pour vos futures candidatures.",
      },
      {
        icon: TrendingUp,
        q: 'Quelles sont mes chances de remporter un marché ?',
        a: "Nos clients déposent en moyenne 40 % de dossiers en plus qu'auparavant, avec un taux de signature qui augmente dès les premiers mois grâce à des dossiers mieux préparés et ciblés.",
      },
      {
        icon: Calendar,
        q: 'Sous quel délai puis-je obtenir mes premiers résultats ?',
        a: "Vous recevez vos premières alertes dès la première semaine. Les premiers dossiers sont déposés généralement sous 2 à 3 semaines, selon la complexité de votre profil.",
      },
    ],
  },
];

export default function InfoPage() {
  const { t } = useLang();
  const location = useLocation();
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null); // All FAQs closed
  const [openSection, setOpenSection] = useState<string | null>(null); // No section open
  const path = location.pathname;

  // ------- CONTACT PAGE -------
  if (path === '/contact') {
    return (
      <div className="page-fade-in max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-3">
            Nous sommes là pour vous aider à remporter des appels d'offres privés et des marchés publics, <span className="text-orange">tout en développant votre chiffre d'affaires et vos marges.</span>
          </h1>
          <p className="text-xl font-bold text-white mt-4">Marchés Direct est <span className="text-orange">votre partenaire.</span></p>
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
            {['Gagnez du temps', 'Augmentez votre chiffre d’affaires et surtout vos marges', 'Soyez accompagné de A à Z', 'Améliorez votre taux de signature'].map(reason => (
              <div key={reason} className="flex items-center gap-2">
                <CheckCircle size={16} className="text-orange shrink-0" />
                <span className="text-sm text-white">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setApptOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors flex-1"><Calendar size={16} /> {t('bookAppointment')}</button>
          <button onClick={() => setCallbackOpen(true)} className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-6 py-3 rounded-xl hover:bg-orange/10 transition-colors flex-1"><Phone size={16} /> {t('callBack')}</button>
        </div>

        <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
        <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
      </div>
    );
  }

  // ------- FAQ PAGE (Only opens when on /faq, all closed by default) -------
  if (path === '/faq') {
    return (
      <div className="page-fade-in max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">FAQ</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">
            Tout savoir avant <br className="hidden md:block" /> <span className="text-orange">de démarrer.</span>
          </h1>
          <p className="text-[#B9BBC8] text-sm md:text-base">Les réponses aux principales questions avant de nous confier votre prochain marché.</p>
        </div>

        {FAQ_SECTIONS.map((section) => (
          <div key={section.title} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-orange uppercase tracking-widest">{section.title}</h2>
              <div className="flex-1 h-px bg-orange/30 ml-4" />
            </div>

            <div className="space-y-3">
              {section.items.map((item, itemIndex) => {
                const isOpen = openFaq === itemIndex && openSection === section.title;
                
                return (
                  <div key={item.q} className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
                    <button
                      onClick={() => {
                        setOpenSection(section.title);
                        setOpenFaq(isOpen ? null : itemIndex);
                      }}
                      className="w-full flex items-center justify-between p-4 text-left gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className="text-orange shrink-0" />
                        <span className="text-sm font-semibold text-white leading-snug">{item.q}</span>
                      </div>
                      {isOpen ? <ChevronUp size={18} className="text-orange shrink-0" /> : <Plus size={18} className="text-orange shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pl-12 border-t border-[#17334D]">
                        <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4 whitespace-pre-line">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 text-center">
          <h2 className="text-lg font-bold text-white mb-1">Une question avant de vous lancer ?</h2>
          <p className="text-sm text-orange font-medium mb-4">Elena vous répond directement.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setApptOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors text-sm"><Calendar size={16} /> Prendre rendez-vous</button>
            <button onClick={() => setCallbackOpen(true)} className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-6 py-3 rounded-xl hover:bg-orange/10 transition-colors text-sm"><Phone size={16} /> Être rappelé</button>
          </div>
        </div>

        <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
        <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
      </div>
    );
  }

  // ------- MAIN PAGE (HOW IT WORKS + TEAM GRID + FAQ) -------
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
      
      {/* 1. HOW IT WORKS */}
      <div className="mb-10">
        <div className="mb-6">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('howItWorks')}</span>
          <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">{t('stepsTitle')}</h1>
          <p className="text-[#B9BBC8] text-sm md:text-base">{t('stepsSub')}</p>
        </div>

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

      {/* 2. TEAM GRID */}
      <div className="mb-10">
        <div className="mb-6">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('teamTag')}</span>
          <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">{t('teamTitle')}</h1>
          <p className="text-xs md:text-sm text-[#B9BBC8] max-w-2xl">{t('teamSub')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {TEAM.map((member) => (
            <Link 
              to={`/team-profile?member=${encodeURIComponent(member.name)}`}
              className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 md:p-6 flex flex-col items-center text-center hover:border-orange/50 transition-all cursor-pointer"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#031B30] border border-[#17334D] mb-3 md:mb-4" />
              <p className="text-[10px] md:text-sm font-semibold text-orange mb-0.5 md:mb-1">{member.role}</p>
              <h3 className="text-xs md:text-lg font-bold text-white mb-1 md:mb-2">{member.name}</h3>
              <span className="text-[9px] md:text-xs text-orange font-medium flex items-center gap-0.5 md:gap-1">
                Découvrir sa fonction <ArrowRight size={8} className="md:hidden" /><ArrowRight size={12} className="hidden md:block" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 3. OBJECTIVE CTA */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-8 text-center mb-10">
        <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">
          Notre objectif : vous faire <span className="text-orange">remporter le marché.</span>
        </h2>
        <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed mb-4">
          Nous ne sommes pas là uniquement pour déposer des dossiers. De la sélection de l'opportunité jusqu'à la signature, toute l'équipe se mobilise pour maximiser vos chances de succès.
        </p>
        <div className="bg-[#031B30] border border-[#17334D] rounded-xl p-3">
          <p className="text-[11px] md:text-sm text-[#B9BBC8]">
            Appel d'offres privé, marché public ou contrat de sous-traitance :<br />
            <span className="text-orange font-semibold">quand vous gagnez, nous gagnons.</span>
          </p>
        </div>
      </div>

      {/* 4. FAQ SECTION (On Main Page) */}
      <div className="mb-10">
        <div className="mb-6">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('faqTag')}</span>
          <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">{t('faqTitle')}</h1>
          <p className="text-xs md:text-sm text-[#B9BBC8]">{t('faqSub')}</p>
        </div>

        {FAQ_SECTIONS.map((section) => (
          <div key={section.title} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-orange uppercase tracking-widest">{section.title}</h2>
              <div className="flex-1 h-px bg-orange/30 ml-4" />
            </div>

            <div className="space-y-3">
              {section.items.map((item, itemIndex) => {
                const isOpen = openFaq === itemIndex && openSection === section.title;
                
                return (
                  <div key={item.q} className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
                    <button
                      onClick={() => {
                        setOpenSection(section.title);
                        setOpenFaq(isOpen ? null : itemIndex);
                      }}
                      className="w-full flex items-center justify-between p-4 text-left gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className="text-orange shrink-0" />
                        <span className="text-sm font-semibold text-white leading-snug">{item.q}</span>
                      </div>
                      {isOpen ? <ChevronUp size={18} className="text-orange shrink-0" /> : <Plus size={18} className="text-orange shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pl-12 border-t border-[#17334D]">
                        <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4 whitespace-pre-line">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 text-center">
          <h2 className="text-lg font-bold text-white mb-1">Une question avant de vous lancer ?</h2>
          <p className="text-sm text-orange font-medium mb-4">Elena vous répond directement.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setApptOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors text-sm"><Calendar size={16} /> Prendre rendez-vous</button>
            <button onClick={() => setCallbackOpen(true)} className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-6 py-3 rounded-xl hover:bg-orange/10 transition-colors text-sm"><Phone size={16} /> Être rappelé</button>
          </div>
        </div>
      </div>

      {/* 5. FINAL CTA */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-xl md:rounded-2xl p-4 md:p-6 text-center orange-glow-sm">
        <h2 className="text-lg md:text-2xl font-extrabold text-white mb-2">Votre prochain marché <br className="hidden md:block" /> <span className="text-orange">commence peut-être ici.</span></h2>
        <p className="text-[10px] md:text-sm text-[#B9BBC8] mb-4 md:mb-6">Présentez-nous votre entreprise dès aujourd'hui.</p>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
          <button onClick={() => setApptOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-4 md:px-6 py-2.5 md:py-3 rounded-xl hover:bg-orange/90 transition-colors text-xs md:text-sm"><Calendar size={14} /> {t('bookAppointment')}</button>
          <button onClick={() => setCallbackOpen(true)} className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-4 md:px-6 py-2.5 md:py-3 rounded-xl hover:bg-orange/10 transition-colors text-xs md:text-sm"><Phone size={14} /> {t('callBack')}</button>
        </div>
      </div>

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}