import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Handshake, ChevronRight, Globe,
  Building, ArrowRight, Zap, Settings, Monitor, Truck, Briefcase
} from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';
import { mockArticles, sectors } from '@/data/mockData';

import arrowImage from "@/assets/home-arrow.png";
import team from "@/assets/team.jpg";
import map from "@/assets/map.png";

const SECTOR_ICONS: Record<string, React.ElementType> = {
  Building2, Zap, Settings, Monitor, Truck, Briefcase,
};

function HeroSection({ onAppt, onCallback }: { onAppt: () => void; onCallback: () => void }) {
  const { t } = useLang();
  return (
    <section className="px-4 md:px-6 pt-6 md:pt-16 pb-8 md:pb-16 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center md:gap-16">
        {/* Left: text */}
        <div className="flex-1 min-w-0">
          {/* Mobile hero card */}
          <div className="md:hidden border border-orange/40 rounded-2xl bg-[#061D32] p-6 orange-glow mb-6 relative overflow-hidden">
            {/* Trading Arrow - Bigger, behind text, with fade gradient */}
            <div className="absolute right-5 top-5 z-0 opacity-50">
              <img 
                src={arrowImage} 
                alt="Trading arrow up" 
                className="w-44 h-auto"
                style={{ 
                  filter: 'drop-shadow(0 0 30px rgba(249, 115, 22, 0.3))'
                }}
              />
              {/* Gradient overlay to fade the tail */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#061D32] via-[#061D32]/20 to-transparent"></div>
            </div>

            {/* Content with relative z-index to appear above arrow */}
            <div className="relative z-10">
              <h1 className="text-3xl font-extrabold leading-tight mb-3">
                <span className="text-white">{t('heroLine1')}</span>
                <br />
                <span className="text-orange">{t('heroLine2')}</span>
              </h1>
              <p className="text-[#B9BBC8] text-sm leading-relaxed mb-6">{t('heroSub')}</p>
              
              {/* OpportunityPaths */}
              <div className="mb-6">
                <OpportunityPaths />
              </div>

              {/* Buttons - Reduced text size for mobile */}
              <div className="flex gap-3">
                <button
                  onClick={onAppt}
                  className="flex-1 bg-orange text-white font-semibold py-3 rounded-xl text-xs hover:bg-orange/90 transition-colors"
                >
                  {t('bookAppointment')}
                </button>
                <button
                  onClick={onCallback}
                  className="flex-1 border border-orange text-orange font-semibold py-3 rounded-xl text-xs hover:bg-orange/10 transition-colors"
                >
                  {t('callBack')}
                </button>
              </div>
            </div>
          </div>

          {/* Desktop hero text */}
          <div className="hidden md:block">
            <h1 className="text-5xl xl:text-6xl font-extrabold leading-tight mb-4 tracking-tight">
              <span className="text-white">{t('heroLine1')}</span>
              <br />
              <span className="text-orange">{t('heroLine2')}</span>
            </h1>
            <p className="text-[#B9BBC8] text-lg leading-relaxed mb-8 max-w-xl">{t('heroSub')}</p>
            <div className="flex gap-4">
              <button
                onClick={onAppt}
                className="bg-orange text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-orange/90 transition-colors"
              >
                {t('bookAppointment')}
              </button>
              <button
                onClick={onCallback}
                className="border border-orange text-orange font-semibold px-6 py-3.5 rounded-xl hover:bg-orange/10 transition-colors"
              >
                {t('callBack')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right: desktop visual */}
        <div className="hidden md:flex flex-shrink-0 w-80 xl:w-96 flex-col gap-3 relative">
          {/* Desktop arrow */}
          <div className="absolute -top-8 -right-8 opacity-90 z-10">
            <div className="absolute inset-0 rounded-full bg-orange/20 blur-3xl scale-150 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>
            <img 
              src={arrowImage} 
              alt="Trading arrow up" 
              className="w-32 h-auto relative"
              style={{ 
                filter: 'drop-shadow(0 0 25px rgba(249, 115, 22, 0.8)) drop-shadow(0 0 50px rgba(249, 115, 22, 0.4))'
              }}
            />
          </div>

          <div className="border border-[#17334D] rounded-2xl bg-[#061D32] p-5 orange-glow-sm">
            <div className="text-xs text-orange font-semibold uppercase tracking-wide mb-2">BOAMP · PLACE · JOUE</div>
            <div className="text-2xl font-bold text-white mb-1">3 421+</div>
            <div className="text-sm text-[#B9BBC8]">opportunités disponibles</div>
            <div className="mt-3 flex gap-2">
              <span className="text-xs bg-orange/10 text-orange px-2 py-1 rounded-full">Marchés publics</span>
              <span className="text-xs bg-[#17334D] text-[#B9BBC8] px-2 py-1 rounded-full">Appels d'offres</span>
            </div>
          </div>
          <div className="border border-[#17334D] rounded-xl bg-[#061D32] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div>
              <div className="text-xs text-white font-semibold">Nouvelles opportunités</div>
              <div className="text-xs text-[#B9BBC8]">127 publiées aujourd'hui</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OpportunityPaths() {
  const paths = [
    {
      icon: Building,
      title: 'Marchés publics',
      sub: 'Mairies, État, collectivités',
      href: '/marches-publics',
    },
    {
      icon: Building2,
      title: "Appels d'offres",
      sub: 'Promoteurs, bailleurs, grandes entreprises',
      href: '/appels-doffres',
    },
    {
      icon: Handshake,
      title: 'Sous-traitance',
      sub: 'Lots entre entreprises du bâtiment',
      href: '/sous-traitance',
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-3">
      {paths.map(p => (
        <Link
          key={p.href}
          to={p.href}
          className="flex items-center gap-4 bg-[#061D32]/80 border border-[#17334D] rounded-xl p-4 hover:border-orange/50 group transition-all"
        >
          <div className="w-14 h-14 rounded-lg bg-orange/10 flex items-center justify-center shrink-0">
            <p.icon size={28} className="text-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white group-hover:text-orange transition-colors">{p.title}</div>
            <div className="text-xs text-[#B9BBC8] mt-0.5">{p.sub}</div>
          </div>
          <ChevronRight size={16} className="text-orange shrink-0" />
        </Link>
      ))}
    </div>
  );
}

function WhoWeAre() {
  const { t } = useLang();
  return (
    <section className="px-4 md:px-6 py-1 md:py-2 max-w-7xl mx-auto w-full">
      <div className="border border-[#17334D] rounded-xl bg-[#061D32] p-2 md:p-4 hover:border-orange/30 transition-all">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Visual - Avatar with image */}
          <div className="flex-shrink-0">
            <div className="relative w-10 h-10 md:w-14 md:h-14">
              <div className="w-full h-full rounded-full border border-orange bg-[#061D32] flex items-center justify-center orange-glow-sm overflow-hidden">
                <img 
                  src={team}
                  alt="Marchés Direct" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Text */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xs md:text-base font-bold text-white mb-0">{t('whoWeAre')}</h2>
            <p className="text-[#B9BBC8] leading-relaxed text-[10px] md:text-sm mb-1">{t('whoWeAreSub')}</p>
            <Link
              to="/a-propos"
              className="inline-flex items-center gap-1 text-orange font-semibold text-[10px] md:text-xs hover:gap-2 transition-all"
            >
              {t('discoverUs')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function GeographicSection() {
  const { t } = useLang();
  const [tab, setTab] = useState<'regions' | 'departments' | 'cities'>('regions');
  const tabs = [
    { key: 'regions' as const, label: t('regions') },
    { key: 'departments' as const, label: t('departments') },
    { key: 'cities' as const, label: t('cities') },
  ];
  
  // Sample data for regions, departments, cities
  const regionData = [
    "Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France", 
    "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire"
  ];
  const departmentData = [
    "Paris (75)", "Rhône (69)", "Nord (59)", 
    "Gironde (33)", "Haute-Garonne (31)", "Loire-Atlantique (44)"
  ];
  const cityData = [
    "Paris", "Lyon", "Lille", 
    "Bordeaux", "Toulouse", "Nantes"
  ];
  
  const items = tab === 'regions' ? regionData : tab === 'departments' ? departmentData : cityData;

  return (
    <section className="px-4 md:px-6 py-6 md:py-10 max-w-7xl mx-auto w-full">
      <div className="mb-4 md:mb-6">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('nearYou')}</span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-2">{t('opportunitiesFrance')}</h2>
        <p className="text-[#B9BBC8] text-sm">{t('exploreFrance')}</p>
      </div>

      {/* Card container */}
      <div className="border border-[#17334D] rounded-2xl bg-[#061D32] p-4 md:p-6 hover:border-orange/30 transition-all">
        <div className="flex flex-row items-start gap-3 md:gap-6">
          {/* France map image on the left - smaller on mobile with navy overlay */}
          <div className="shrink-0 w-[100px] md:w-[180px] relative">
            <img 
              src={map} 
              alt="France map" 
              className="w-full h-auto rounded-lg"
            />
            {/* Navy blue overlay */}
            <div className="absolute inset-0 bg-[#061D32]/90 rounded-lg"></div>
            {/* Orange accent dots on the overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                <div className="absolute top-[30%] left-[45%] w-2 h-2 md:w-3 md:h-3 rounded-full bg-orange shadow-lg shadow-orange/50"></div>
                <div className="absolute top-[55%] left-[60%] w-2 h-2 md:w-3 md:h-3 rounded-full bg-orange shadow-lg shadow-orange/50"></div>
                <div className="absolute top-[65%] left-[25%] w-2 h-2 md:w-3 md:h-3 rounded-full bg-orange shadow-lg shadow-orange/50"></div>
                <div className="absolute top-[80%] left-[45%] w-2 h-2 md:w-3 md:h-3 rounded-full bg-orange shadow-lg shadow-orange/50"></div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Filter buttons - 3 in a row */}
            <div className="flex flex-row gap-0 mb-4 w-full">
              {tabs.map((tab_) => (
                <button
                  key={tab_.key}
                  onClick={() => setTab(tab_.key)}
                  className={`flex-1 px-2 py-1.5 text-[11px] md:text-[13px] font-semibold border transition-colors text-center first:rounded-l-md last:rounded-r-md ${
                    tab === tab_.key 
                      ? "border-orange text-orange bg-orange/5" 
                      : "border-[#17334D] text-[#B9BBC8] hover:text-white hover:bg-[#17334D]/30"
                  }`}
                >
                  {tab_.label}
                </button>
              ))}
            </div>

            {/* Items displayed in a table-like grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
              {items.map((item) => (
                <Link
                  key={item}
                  to="/zones"
                  className="flex items-center justify-between gap-2 text-[12px] md:text-[14px] font-semibold py-1 px-2 hover:bg-[#17334D]/30 rounded transition-colors text-white hover:text-orange group"
                >
                  <span className="truncate">{item}</span>
                  <ChevronRight size={14} className="text-orange shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* See all zones link */}
        <Link
          to="/zones"
          className="inline-flex items-center justify-center gap-2 text-orange font-semibold text-sm mt-4 w-full hover:gap-3 transition-all"
        >
          {t('seeAllZones')}
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

function InternationalCard() {
  const { t } = useLang();
  return (
    <section className="px-4 md:px-6 py-4 max-w-7xl mx-auto w-full">
      <Link
        to="/international"
        className="flex items-center gap-4 bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 hover:border-orange/50 group transition-all"
      >
        <div className="w-14 h-14 rounded-xl bg-orange/10 flex items-center justify-center shrink-0">
          <Globe size={28} className="text-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-bold text-white group-hover:text-orange transition-colors">
            {t('international')}
          </h3>
          <p className="text-sm text-[#B9BBC8] mt-0.5">{t('internationalSub')}</p>
        </div>
        <ArrowRight size={18} className="text-orange shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>
    </section>
  );
}

function SectorsSection() {
  const { t } = useLang();
  const iconMap: Record<string, React.ElementType> = {
    Building2, Zap, Settings, Monitor, Truck, Briefcase,
  };

  return (
    <section className="px-4 md:px-6 py-10 md:py-16 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('sectors')}</span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-2">{t('sectorsSub')}</h2>
        <p className="text-[#B9BBC8] text-sm">{t('sectorsSub2')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sectors.map(sector => {
          const Icon = iconMap[sector.icon] || Building2;
          return (
            <Link
              key={sector.id}
              to="/secteurs"
              className="flex items-center gap-3 bg-[#061D32] border border-[#17334D] rounded-xl p-4 hover:border-orange/50 group transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-orange/10 flex items-center justify-center shrink-0">
                <Icon size={24} className="text-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white group-hover:text-orange transition-colors leading-snug">{sector.name}</div>
                <div className="text-xs text-[#B9BBC8] mt-0.5">{sector.count.toLocaleString('fr-FR')}</div>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mt-5 text-center md:text-left">
        <Link to="/secteurs" className="inline-flex items-center gap-2 text-orange font-semibold text-sm hover:gap-3 transition-all">
          {t('seeAllSectors')} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

function NewsSection() {
  const { t } = useLang();
  const categoryColors: Record<string, string> = {
    Réglementation: 'text-blue-400 bg-blue-400/10',
    Tendances: 'text-purple-400 bg-purple-400/10',
    Opportunités: 'text-green-400 bg-green-400/10',
  };

  return (
    <section className="px-4 md:px-6 py-10 md:py-16 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('news')}</span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-2">{t('newsSub')}</h2>
        <p className="text-[#B9BBC8] text-sm">{t('newsSub2')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockArticles.slice(0, 3).map(article => (
          <Link
            key={article.id}
            to="/actualites"
            className="flex flex-col bg-[#061D32] border border-[#17334D] rounded-xl p-5 hover:border-orange/40 group transition-all"
          >
            <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit mb-3 ${categoryColors[article.category] || 'text-orange bg-orange/10'}`}>
              {article.category}
            </span>
            <h3 className="text-sm font-bold text-white group-hover:text-orange transition-colors mb-2 flex-1">{article.title}</h3>
            <p className="text-xs text-[#B9BBC8] leading-relaxed mb-4 line-clamp-2">{article.description}</p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs text-[#B9BBC8]">{article.date}</span>
              <ArrowRight size={14} className="text-orange group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-5 text-center md:text-left">
        <Link to="/actualites" className="inline-flex items-center gap-2 text-orange font-semibold text-sm hover:gap-3 transition-all">
          {t('seeAllNews')} <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}

function FinalCTA({ onAppt, onCallback }: { onAppt: () => void; onCallback: () => void }) {
  const { t } = useLang();
  return (
    <section className="px-4 md:px-6 py-10 md:py-16 max-w-7xl mx-auto w-full">
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 md:p-10 text-center orange-glow-sm">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{t('finalCtaHeading')}</h2>
        <p className="text-[#B9BBC8] text-sm md:text-base mb-8 max-w-xl mx-auto">{t('finalCtaSub')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onAppt}
            className="bg-orange text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-orange/90 transition-colors"
          >
            {t('bookAppointment')}
          </button>
          <button
            onClick={onCallback}
            className="border border-orange text-orange font-semibold px-6 py-3.5 rounded-xl hover:bg-orange/10 transition-colors"
          >
            {t('callBack')}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <div className="page-fade-in">
      <HeroSection onAppt={() => setAppointmentOpen(true)} onCallback={() => setCallbackOpen(true)} />
      <WhoWeAre />
      <GeographicSection />
      <InternationalCard />
      <SectorsSection />
      <NewsSection />
      <FinalCTA onAppt={() => setAppointmentOpen(true)} onCallback={() => setCallbackOpen(true)} />
      <AppointmentModal open={appointmentOpen} onClose={() => setAppointmentOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}