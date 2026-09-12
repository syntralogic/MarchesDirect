import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';
import {
  Target, ArrowRight, CheckCircle, FileText, Handshake,
  Phone, Calendar, Plus, ChevronUp, Euro, Clock, Shield, Search, Building2,
  Briefcase, FolderSearch, Trophy, Lock, ChevronRight, Users, ShieldCheck,
} from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

import aboutImage from "@/assets/aboutImage.png";
import mem1 from "@/assets/1.jpeg";
import mem2 from "@/assets/2.jpeg";
import mem3 from "@/assets/3.jpeg";
import mem4 from "@/assets/4.jpeg";
import mem5 from "@/assets/5.jpeg";
import mem6 from "@/assets/6.jpeg";

const TEAM = [
  { name: 'Bernard Delmas', role: 'Directeur général', tagline: 'Pilotage stratégique', image: mem3 },
  { name: 'Elena Popescu', role: 'Assistante de direction', tagline: 'Votre premier contact', image: mem1 },
  { name: 'Maria Ferreira', role: 'Chargée d\'affaires', tagline: 'Référente marchés privés', image: mem2 },
  { name: 'Nicole Pisseron', role: 'Chargée d\'affaires', tagline: 'Référente préparation des offres', image: mem4 },
  { name: 'Emre Kaya', role: 'Chargé d\'affaires', tagline: 'Référent sous-traitance', image: mem5 },
  { name: 'Charlotte Le Guen', role: 'Experte marchés publics', tagline: 'Conformité et sécurisation', image: mem6 },
];

// FAQ DATA with translation keys — UNCHANGED
const FAQ_SECTIONS = [
  {
    titleKey: 'faqService',
    items: [
      { icon: Euro,     qKey: 'faqCostQ',         aKey: 'faqCostA' },
      { icon: FileText, qKey: 'faqTakeCareQ',     aKey: 'faqTakeCareA' },
      { icon: Clock,    qKey: 'faqTimeQ',         aKey: 'faqTimeA' },
      { icon: Lock,     qKey: 'faqConfidentialQ', aKey: 'faqConfidentialA' },
    ],
  },
  {
    titleKey: 'faqOpportunities',
    items: [
      { icon: Search,    qKey: 'faqFindQ',  aKey: 'faqFindA' },
      { icon: Handshake, qKey: 'faqWhyUsQ', aKey: 'faqWhyUsA' },
      { icon: Building2, qKey: 'faqFitQ',   aKey: 'faqFitA' },
    ],
  },
  {
    titleKey: 'faqResults',
    items: [
      { icon: Trophy,   qKey: 'faqChancesQ',  aKey: 'faqChancesA' },
      { icon: Shield,   qKey: 'faqNoWinQ',    aKey: 'faqNoWinA' },
      { icon: Calendar, qKey: 'faqTimelineQ', aKey: 'faqTimelineA' },
    ],
  },
];

export default function InfoPage() {
  const { t } = useLang();
  const location = useLocation();
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [activeFaqTab, setActiveFaqTab] = useState(FAQ_SECTIONS[0].titleKey);
  const [activeStep, setActiveStep] = useState<0 | 1 | 2 | 3>(0);
  const path = location.pathname;

  // ------- CONTACT PAGE (UNCHANGED) -------
  if (path === '/contact') {
    return (
      <div className="page-fade-in max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-3">
            {t('contactHeroTitle')}
          </h1>
          <p className="text-xl font-bold text-white mt-4">{t('contactHeroSub')} <span className="text-orange">{t('contactHeroPartner')}</span></p>
        </div>

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
              <Target size={28} className="text-orange" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">{t('contactMission')}</h2>
              <p className="text-sm text-[#B9BBC8] leading-relaxed">{t('contactMissionText')}</p>
            </div>
          </div>
          <div className="space-y-2">
            {[t('contactReason1'), t('contactReason2'), t('contactReason3'), t('contactReason4')].map(reason => (
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

  // ------- FAQ PAGE (UNCHANGED) -------
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

        {FAQ_SECTIONS.map((section) => (
          <div key={section.titleKey} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-orange uppercase tracking-widest">{t(section.titleKey)}</h2>
              <div className="flex-1 h-px bg-orange/30 ml-4" />
            </div>
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => {
                const isOpen = openFaq === itemIndex && openSection === section.titleKey;
                return (
                  <div key={item.qKey} className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
                    <button
                      onClick={() => { setOpenSection(section.titleKey); setOpenFaq(isOpen ? null : itemIndex); }}
                      className="w-full flex items-center justify-between p-4 text-left gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className="text-orange shrink-0" />
                        <span className="text-sm font-semibold text-white leading-snug">{t(item.qKey)}</span>
                      </div>
                      {isOpen ? <ChevronUp size={18} className="text-orange shrink-0" /> : <Plus size={18} className="text-orange shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pl-12 border-t border-[#17334D]">
                        <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4 whitespace-pre-line">{t(item.aKey)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 text-center">
          <h2 className="text-lg font-bold text-white mb-1">{t('faqCTAQuestion')}</h2>
          <p className="text-sm text-orange font-medium mb-4">{t('faqCTAName')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setApptOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors text-sm"><Calendar size={16} /> {t('bookAppointment')}</button>
            <button onClick={() => setCallbackOpen(true)} className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-6 py-3 rounded-xl hover:bg-orange/10 transition-colors text-sm"><Phone size={16} /> {t('callBack')}</button>
          </div>
        </div>

        <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
        <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
      </div>
    );
  }

  // ------- MAIN INFO PAGE — restyled to match screenshots -------
  const WORKFLOW_STEPS = [
    { n: '01', label: 'Votre besoin',  title: 'Elena comprend votre besoin.',     sub: 'Votre premier contact',       you: "Vous présentez votre activité, votre zone d'intervention et vos projets.", team: "Elena précise votre demande et organise votre échange avec un chargé d'affaires.", done: 'Votre besoin est compris et transmis au bon interlocuteur.' },
    { n: '02', label: 'Le bon marché', title: 'Nous identifions le bon marché.',  sub: 'Recherche ciblée',            you: "Vous précisez votre métier et vos critères.",                                team: "Nous filtrons les marchés et appels d'offres qui correspondent à votre profil.",      done: "Une sélection d'opportunités vous est présentée." },
    { n: '03', label: 'Votre dossier', title: 'Nous préparons votre dossier.',    sub: 'Préparation et vérification', you: "Vous validez les opportunités qui vous intéressent.",                        team: "Votre chargé d'affaires monte le dossier et vérifie sa conformité.",                  done: 'Votre candidature est prête à être déposée.' },
    { n: '04', label: 'Le dépôt',      title: 'Vous validez, nous déposons.',     sub: 'Décision finale',             you: 'Vous gardez la décision finale à chaque étape.',                             team: 'Nous déposons la candidature et restons votre point de contact pour le suivi.',       done: 'Votre dossier est déposé et suivi.' },
  ];

  return (
    <div className="page-fade-in max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">

      {/* SECTION 1 — QUI SOMMES-NOUS ? */}
      <div className="mb-10">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Qui sommes-nous ?</span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mt-2 mb-4">
          L'équipe qui prépare vos candidatures <span className="text-orange">avec vous.</span>
        </h2>
        <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed mb-6">
          Marchés Direct accompagne les artisans, TPE et PME dans la recherche de marchés et la préparation de leurs dossiers. Vous choisissez les opportunités ; votre chargé d'affaires vous accompagne jusqu'au dépôt.
        </p>

        <a
          href="#mdq-workflow"
          className="inline-flex items-center gap-2 bg-orange text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-orange/90 transition-colors"
        >
          Découvrir l'équipe <ArrowRight size={16} className="rotate-90" />
        </a>

        <div className="flex items-center gap-4 mt-6">
          <div className="flex -space-x-3">
            {[mem3, mem1, mem2].map((img, i) => (
              <div key={i} className="w-11 h-11 rounded-full border-2 border-[#061D32] overflow-hidden bg-[#031B30]">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Des interlocuteurs identifiés.</div>
            <div className="text-xs text-[#B9BBC8]">Du premier échange au dossier.</div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Votre métier... */}
      <div className="mb-10 bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
        <div className="w-12 h-12 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center mb-4">
          <Briefcase size={24} className="text-orange" />
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight mb-3">
          Votre métier ne devrait pas exiger de maîtriser les appels d'offres.
        </h2>
        <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed">
          Notre rôle : rendre les opportunités compréhensibles et vous aider à construire votre candidature. Marchés publics, appels d'offres privés ou sous-traitance : vous avancez avec une équipe, même pour votre premier dossier.
        </p>
      </div>

      {/* SECTION 3 — LES PERSONNES À VOS CÔTÉS */}
      <div className="mb-10">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Les personnes à vos côtés</span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mt-2 mb-3">
          Vous savez à qui vous parlez.
        </h2>
        <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed mb-6">
          Elena accueille votre demande. Un chargé d'affaires prend ensuite le relais et suit votre candidature avec vous.
        </p>

        <div className="grid grid-cols-2 gap-3 md:gap-4" id="mdq-team">
          {TEAM.map((member) => (
            <Link
              key={member.name}
              to={`/team-profile?member=${encodeURIComponent(member.name)}`}
              className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 flex flex-col items-center text-center hover:border-orange/50 transition-all group cursor-pointer"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-[#17334D] group-hover:border-orange/50 mb-3 overflow-hidden">
                <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-[11px] md:text-sm font-semibold text-orange mb-0.5">{member.role}</p>
              <h3 className="text-sm md:text-lg font-bold text-white mb-1">{member.name}</h3>
              <p className="text-[11px] md:text-xs text-[#B9BBC8] mb-3 leading-snug">{member.tagline}</p>
              <span className="text-[11px] md:text-xs text-orange font-medium flex items-center gap-1 mt-auto group-hover:underline">
                Découvrir son rôle <ArrowRight size={12} className="-rotate-45" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* SECTION 4 — COMMENT NOUS TRAVAILLONS ENSEMBLE */}
      <div className="mb-10" id="mdq-workflow">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Comment nous travaillons ensemble</span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mt-2 mb-3">
          Un premier échange. Puis un chargé d'affaires dédié.
        </h2>
        <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed mb-5">
          Nos outils facilitent la recherche et l'analyse. Votre chargé d'affaires vous aide à décider et prépare votre dossier avec vous.
        </p>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {WORKFLOW_STEPS.map((s, i) => (
            <button
              key={s.n}
              onClick={() => setActiveStep(i as 0 | 1 | 2 | 3)}
              className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
                activeStep === i ? 'border-orange bg-orange/10' : 'border-[#17334D] bg-[#031B30] hover:border-orange/40'
              }`}
            >
              <div className={`text-[11px] font-bold ${activeStep === i ? 'text-orange' : 'text-[#B9BBC8]'}`}>{s.n}</div>
              <div className={`text-[11px] font-semibold mt-0.5 leading-tight ${activeStep === i ? 'text-orange' : 'text-white'}`}>{s.label}</div>
            </button>
          ))}
        </div>

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full border-2 border-orange overflow-hidden shrink-0">
              <img src={mem1} alt="Elena Popescu" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-bold text-white leading-tight">{WORKFLOW_STEPS[activeStep].title}</h3>
              <p className="text-xs text-[#B9BBC8]">{WORKFLOW_STEPS[activeStep].sub}</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-orange font-bold shrink-0 w-16">Vous</span>
              <span className="text-[#B9BBC8] leading-relaxed">{WORKFLOW_STEPS[activeStep].you}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-orange font-bold shrink-0 w-16">L'équipe</span>
              <span className="text-[#B9BBC8] leading-relaxed">{WORKFLOW_STEPS[activeStep].team}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 mt-4 pt-4 border-t border-[#17334D]">
            <CheckCircle size={16} className="text-orange shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed">{WORKFLOW_STEPS[activeStep].done}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setActiveStep((s => ((s + 3) % 4) as 0 | 1 | 2 | 3))}
            className="w-10 h-10 rounded-full border border-[#17334D] flex items-center justify-center text-[#B9BBC8] hover:text-orange hover:border-orange/40 transition-colors"
            aria-label="Étape précédente"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
          <span className="text-xs text-[#B9BBC8]">Étape {activeStep + 1} sur 4 · {WORKFLOW_STEPS[activeStep].label}</span>
          <button
            onClick={() => setActiveStep((s => ((s + 1) % 4) as 0 | 1 | 2 | 3))}
            className="w-10 h-10 rounded-full border border-[#17334D] flex items-center justify-center text-[#B9BBC8] hover:text-orange hover:border-orange/40 transition-colors"
            aria-label="Étape suivante"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* SECTION 5 — Vous gardez la décision */}
      <div className="mb-10 flex items-start gap-3 bg-[#061D32] border border-[#17334D] rounded-2xl p-5">
        <div className="w-10 h-10 rounded-lg bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-orange" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-bold text-white mb-2">Vous gardez la décision, à chaque étape.</h3>
          <p className="text-sm text-[#B9BBC8] leading-relaxed">
            Vous choisissez les marchés auxquels répondre et validez votre candidature avant son dépôt. Votre chargé d'affaires reste votre point de contact pour le suivi.
          </p>
        </div>
      </div>

      {/* SECTION 6 — QUESTIONS FRÉQUENTES (FAQ content UNCHANGED) */}
      <div className="mb-10">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Questions fréquentes</span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mt-2 mb-3">
          Tout savoir avant de démarrer.
        </h2>
        <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed mb-5">
          Les réponses aux principales questions avant de nous confier votre prochain marché.
        </p>

        <div className="flex flex-wrap gap-1 border border-[#17334D] rounded-xl p-1 w-fit mb-5">
          {[
            { key: FAQ_SECTIONS[0].titleKey, label: 'Le service' },
            { key: FAQ_SECTIONS[1].titleKey, label: 'Les opportunités' },
            { key: FAQ_SECTIONS[2].titleKey, label: 'Les résultats' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFaqTab(key)}
              className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
                activeFaqTab === key ? 'bg-orange/15 text-orange border border-orange' : 'text-[#B9BBC8] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {FAQ_SECTIONS.filter((section) => section.titleKey === activeFaqTab).map((section) => (
          <div key={section.titleKey} className="space-y-3">
            {section.items.map((item, itemIndex) => {
              const isOpen = openFaq === itemIndex && openSection === section.titleKey;
              return (
                <div key={item.qKey} className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
                  <button
                    onClick={() => { setOpenSection(section.titleKey); setOpenFaq(isOpen ? null : itemIndex); }}
                    className="w-full flex items-center justify-between p-4 text-left gap-3"
                  >
                    <span className="text-sm font-semibold text-white leading-snug">{t(item.qKey)}</span>
                    {isOpen ? <ChevronUp size={18} className="text-orange shrink-0" /> : <Plus size={18} className="text-orange shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-[#17334D]">
                      <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4 whitespace-pre-line">{t(item.aKey)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* SECTION 7 — ET MAINTENANT ? (Final CTA) */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-8 mb-10">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Et maintenant ?</span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mt-2 mb-3">
          Votre prochain dossier commence par votre projet.
        </h2>
        <p className="text-sm md:text-base text-[#B9BBC8] leading-relaxed mb-5">
          Explorez les opportunités pour votre entreprise, ou échangez avec notre équipe pour faire le point.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/recherche"
            className="w-full flex items-center justify-center gap-2 bg-orange text-white font-semibold py-3.5 rounded-xl hover:bg-orange/90 transition-colors text-sm"
          >
            Trouver une opportunité <ArrowRight size={16} />
          </Link>
          <button
            onClick={() => setCallbackOpen(true)}
            className="w-full flex items-center justify-center gap-2 border border-orange text-orange font-semibold py-3.5 rounded-xl hover:bg-orange/10 transition-colors text-sm"
          >
            <Phone size={16} /> Être rappelé
          </button>
        </div>
        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-[#17334D]">
          <div className="w-10 h-10 rounded-full border border-[#17334D] overflow-hidden shrink-0">
            <img src={mem1} alt="Elena Popescu" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-[#B9BBC8] leading-snug">
            Elena accueille votre demande et vous oriente.
          </p>
        </div>
      </div>

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}