import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';
import {
  Target, ArrowRight, CheckCircle, FileText, Handshake,
  Phone, Calendar, Plus, ChevronUp, Euro, Clock, Shield, Search, Building2,
  Briefcase, FolderSearch, Trophy, Lock, ChevronRight
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
  { name: 'Bernard Delmas', role: 'Directeur général', image: mem3 },
  { name: 'Elena Popescu', role: 'Assistante de direction', image: mem1 },
  { name: 'Maria Ferreira', role: 'Chargée d\'affaires', image: mem2 },
  { name: 'Nicole Pisseron', role: 'Chargée d\'affaires', image: mem4 },
  { name: 'Emre Kaya', role: 'Chargé d\'affaires', image: mem5 },
  { name: 'Charlotte Le Guen', role: 'Experte marchés publics', image: mem6 },
];

// FAQ DATA with translation keys
const FAQ_SECTIONS = [
  {
    titleKey: 'faqService',
    items: [
      {
        icon: Euro,
        qKey: 'faqCostQ',
        aKey: 'faqCostA',
      },
      {
        icon: FileText,
        qKey: 'faqTakeCareQ',
        aKey: 'faqTakeCareA',
      },
      {
        icon: Clock,
        qKey: 'faqTimeQ',
        aKey: 'faqTimeA',
      },
      {
        icon: Lock,
        qKey: 'faqConfidentialQ',
        aKey: 'faqConfidentialA',
      },
    ],
  },
  {
    titleKey: 'faqOpportunities',
    items: [
      {
        icon: Search,
        qKey: 'faqFindQ',
        aKey: 'faqFindA',
      },
      {
        icon: Handshake,
        qKey: 'faqWhyUsQ',
        aKey: 'faqWhyUsA',
      },
      {
        icon: Building2,
        qKey: 'faqFitQ',
        aKey: 'faqFitA',
      },
    ],
  },
  {
    titleKey: 'faqResults',
    items: [
      {
        icon: Trophy,
        qKey: 'faqChancesQ',
        aKey: 'faqChancesA',
      },
      {
        icon: Shield,
        qKey: 'faqNoWinQ',
        aKey: 'faqNoWinA',
      },
      {
        icon: Calendar,
        qKey: 'faqTimelineQ',
        aKey: 'faqTimelineA',
      },
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
  const path = location.pathname;

  // ------- CONTACT PAGE -------
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
            {[
              t('contactReason1'),
              t('contactReason2'),
              t('contactReason3'),
              t('contactReason4')
            ].map(reason => (
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

  // ------- FAQ PAGE -------
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
                      onClick={() => {
                        setOpenSection(section.titleKey);
                        setOpenFaq(isOpen ? null : itemIndex);
                      }}
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
                        <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4 whitespace-pre-line">
                          {t(item.aKey)}
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

  // ------- MAIN INFO PAGE -------
  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">

      {/* SECTION 1: Des marchés à portée de main */}
      <div className="mb-10">
        <div className="mb-4 md:mb-6 text-justify">
          <h2 className="text-xl md:text-5xl font-extrabold text-white leading-tight mb-1 md:mb-2">
            {t('infoMarketsTitle')}
          </h2>
          <p className="text-orange font-semibold text-sm md:text-base mb-2 md:mb-4">{t('infoMarketsSub')}</p>
          <p className="text-[#B9BBC8] text-[11px] md:text-base leading-relaxed">
            {t('infoMarketsText')}
          </p>
        </div>

        <img src={aboutImage} className="w-80 rounded-xl mb-8" alt={t('infoAboutImageAlt')} />

        <div className="text-center mb-8">
          <h3 className="text-lg font-bold text-white mb-4">{t('infoPublicMarketsStats')}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 flex flex-col items-center text-center">
              <Briefcase size={20} className="text-orange mb-2" />
              <span className="text-sm font-extrabold text-orange mb-1">114 000 €</span>
              <p className="text-[8px] text-[#B9BBC8]">{t('infoStat1')}</p>
            </div>
            <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 flex flex-col items-center text-center">
              <FileText size={20} className="text-orange mb-2" />
              <span className="text-sm font-extrabold text-orange mb-1">3 {t('infoStat2Offers')}</span>
              <p className="text-[8px] text-[#B9BBC8]">{t('infoStat2')}</p>
            </div>
            <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 flex flex-col items-center text-center">
              <FileText size={20} className="text-orange mb-2" />
              <span className="text-sm font-extrabold text-orange mb-1">17 %</span>
              <p className="text-[8px] text-[#B9BBC8]">{t('infoStat3')}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
          <h3 className="text-lg font-bold text-white mb-2">{t('infoWeBringOpportunities')}</h3>
          <p className="text-sm text-[#B9BBC8] mb-4">{t('infoWeBringSub')}</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Search size={22} className="text-orange shrink-0" />
              <span className="text-sm text-white">{t('infoWeBring1')}</span>
            </div>
            <div className="flex items-center gap-3">
              <FolderSearch size={22} className="text-orange shrink-0" />
              <span className="text-sm text-white">{t('infoWeBring2')}</span>
            </div>
            <div className="flex items-center gap-3">
              <FileText size={22} className="text-orange shrink-0" />
              <span className="text-sm text-white">{t('infoWeBring3')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Handshake size={22} className="text-orange shrink-0" />
              <span className="text-sm text-white">{t('infoWeBring4')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Trophy size={22} className="text-orange shrink-0" />
              <span className="text-sm text-white">{t('infoWeBring5')}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-[#B9BBC8] mt-4">{t('infoYouDoYourJob')}</p>
      </div>

      {/* SECTION 2: TEAM GRID */}
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
              className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 md:p-6 flex flex-col items-center text-center hover:border-orange/50 transition-all cursor-pointer group"
              key={member.name}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#031B30] border-2 border-[#17334D] group-hover:border-orange/50 mb-3 md:mb-4 overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] md:text-sm font-semibold text-orange mb-0.5 md:mb-1">{member.role}</p>
              <h3 className="text-xs md:text-lg font-bold text-white mb-1 md:mb-2">{member.name}</h3>
              <span className="text-[9px] md:text-xs text-orange font-medium flex items-center gap-0.5 md:gap-1 group-hover:underline">
                {t('discoverFunction')} <ArrowRight size={8} className="md:hidden" /><ArrowRight size={12} className="hidden md:block" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* SECTION 3: HOW IT WORKS */}
      <div className="mb-10">
        <div className="mb-6">
          <h2 className="text-xl md:text-3xl font-extrabold text-white leading-tight mb-2">
            {t('howItWorksTitle')}
          </h2>
          <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed">
            {t('howItWorksSub')}
          </p>
        </div>

        {/* Elena - First Contact with Buttons */}
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 md:p-5 mb-3">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#031B30] border-2 border-orange overflow-hidden shrink-0">
              <img src={mem1} alt="Elena Popescu" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-1">
                <span className="text-xs font-bold text-orange">1.</span>
                <span className="text-xs font-semibold text-white">{t('firstContact')}</span>
              </div>
              <h3 className="text-base md:text-xl font-bold text-white">Elena Popescu</h3>
              <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed mt-0.5 md:mt-1">
                {t('elenaDescription')}
              </p>
              <div className="flex items-start gap-2 mt-2 md:mt-3 justify-center md:justify-start">
                <CheckCircle size={16} className="text-orange shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="text-xs md:text-sm font-semibold text-white">{t('qualifiedRequest')}</span>
                  <p className="text-[10px] md:text-xs text-[#B9BBC8]">{t('firstResponse')}</p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-row gap-2 mt-4 w-full">
                <button
                  onClick={() => setApptOpen(true)}
                  className="flex-1 bg-orange hover:bg-orange/95 active:bg-orange/85 text-white font-bold py-2.5 md:py-3 rounded-xl transition-all text-[11px] md:text-sm shadow-lg hover:shadow-orange/30 hover:shadow-xl whitespace-nowrap"
                >
                  {t('bookAppointment')}
                </button>
                <button
                  onClick={() => setCallbackOpen(true)}
                  className="flex-1 border-2 border-orange text-orange hover:bg-orange/5 active:bg-orange/10 font-bold py-2.5 md:py-3 rounded-xl transition-all text-[11px] md:text-sm hover:border-orange/80 whitespace-nowrap"
                >
                  {t('callBack')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical line separator */}
        <div className="flex flex-col items-center py-0.5">
          <div className="w-px h-4 bg-orange/30"></div>
          <ChevronRight size={12} className="text-orange rotate-90 -mt-0.5" />
          <div className="w-px h-4 bg-orange/30 -mt-0.5"></div>
        </div>

        {/* Assignment */}
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 md:p-5 mb-3">
          <div className="flex items-start gap-2 md:gap-3">
            <CheckCircle size={16} className="text-orange shrink-0 mt-0.5" />
            <div>
              <span className="text-xs md:text-sm font-semibold text-white">{t('qualifiedRequestAssigned')}</span>
              <p className="text-[10px] md:text-xs text-[#B9BBC8] mt-0.5 md:mt-1">
                {t('dedicatedAdvisor')}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4 md:gap-6 mt-3 md:mt-4">
            {[TEAM[2], TEAM[3], TEAM[4]].map((member) => (
              <Link
                key={member.name}
                to={`/team-profile?member=${encodeURIComponent(member.name)}`}
                className="flex flex-col items-center group"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#031B30] border-2 border-[#17334D] group-hover:border-orange/50 overflow-hidden">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[8px] md:text-[10px] font-medium text-white text-center mt-1 md:mt-1.5">{member.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Vertical line separator */}
        <div className="flex flex-col items-center py-0.5">
          <div className="w-px h-4 bg-orange/30"></div>
          <ChevronRight size={12} className="text-orange rotate-90 -mt-0.5" />
          <div className="w-px h-4 bg-orange/30 -mt-0.5"></div>
        </div>

        {/* Steps 2-5 */}
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 md:p-5 mb-3">
          <h3 className="text-sm md:text-base font-bold text-white mb-3 md:mb-4 text-center md:text-left">
            {t('singleAdvisor')}
          </h3>

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-xs md:text-sm font-bold text-orange shrink-0 w-6 md:w-7">02</span>
              <div>
                <span className="text-xs md:text-sm font-semibold text-white">{t('step02')}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle size={12} className="text-orange" />
                  <span className="text-[10px] md:text-xs text-[#B9BBC8]">{t('step02Sub')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-xs md:text-sm font-bold text-orange shrink-0 w-6 md:w-7">03</span>
              <div>
                <span className="text-xs md:text-sm font-semibold text-white">{t('step03')}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle size={12} className="text-orange" />
                  <span className="text-[10px] md:text-xs text-[#B9BBC8]">{t('step03Sub')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-xs md:text-sm font-bold text-orange shrink-0 w-6 md:w-7">04</span>
              <div>
                <span className="text-xs md:text-sm font-semibold text-white">{t('step04')}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle size={12} className="text-orange" />
                  <span className="text-[10px] md:text-xs text-[#B9BBC8]">{t('step04Sub')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-xs md:text-sm font-bold text-orange shrink-0 w-6 md:w-7">05</span>
              <div>
                <span className="text-xs md:text-sm font-semibold text-white">{t('step05')}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle size={12} className="text-orange" />
                  <span className="text-[10px] md:text-xs text-[#B9BBC8]">{t('step05Sub')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: OBJECTIVE CTA */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-8 text-center mb-10">
        <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">
          {t('objectiveTitle')}
        </h2>
        <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed mb-4">
          {t('objectiveSub')}
        </p>
        <div className="bg-[#031B30] border border-[#17334D] rounded-xl p-3">
          <p className="text-[11px] md:text-sm text-[#B9BBC8]">
            {t('objectiveText')}
          </p>
        </div>
      </div>

      {/* SECTION 5: FAQ (Repeated for main page) */}
      <div className="mb-10">
        <div className="mb-6">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('faqTag')}</span>
          <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">{t('faqTitle')}</h1>
          <p className="text-xs md:text-sm text-[#B9BBC8]">{t('faqSub')}</p>
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
                      onClick={() => {
                        setOpenSection(section.titleKey);
                        setOpenFaq(isOpen ? null : itemIndex);
                      }}
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
                        <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4 whitespace-pre-line">
                          {t(item.aKey)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}