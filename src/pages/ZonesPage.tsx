import { ChevronRight, Landmark, Building2, Handshake } from 'lucide-react';
import { Link } from 'react-router-dom'; // <-- Add this import
import { useLang } from '@/contexts/LangContext';

export default function ZonesPage() {
  const { t } = useLang();

  const zoneCards = [
    {
      title: t('zoneCardPublicTitle'),
      desc: t('zoneCardPublicDesc'),
      icon: Landmark,
    },
    {
      title: t('zoneCardPrivateTitle'),
      desc: t('zoneCardPrivateDesc'),
      icon: Building2,
    },
    {
      title: t('zoneCardSubTitle'),
      desc: t('zoneCardSubDesc'),
      icon: Handshake,
    },
  ];

  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 min-h-screen flex flex-col">
      
      {/* Header */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs md:text-sm text-[#B9BBC8] mb-4">
          {/* Back Arrow to Home */}
          <Link 
            to="/" 
            className="text-orange hover:text-orange/80 transition-colors"
            aria-label="Go back to home"
          >
            <ChevronRight size={16} className="rotate-180" />
          </Link>
          
          <span>{t('zoneBreadcrumbHome')}</span>
          <span className="text-[#4A5568]">•</span>
          <span>{t('zoneBreadcrumbSectors')}</span>
          <span className="text-[#4A5568]">•</span>
          <span className="text-white font-medium">{t('zoneBreadcrumbConstruction')}</span>
        </div>

        {/* Exact Title */}
        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          {t('zoneTitleLine1')}
          <br />
          {t('zoneTitleLine2')}
        </h1>

        {/* Exact Subtitle */}
        <p className="text-[#B9BBC8] text-base md:text-lg max-w-2xl mb-2">
          {t('zoneSubLine1')}
        </p>
        <p className="text-[#B9BBC8] text-xs md:text-sm">
          {t('zoneSubLine2')}
        </p>
      </div>

      {/* Main Cards */}
      <div className="space-y-3 flex-1">
        {zoneCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={index}
              className="w-full flex flex-row items-center gap-4 p-4 md:p-5 rounded-xl border bg-[#061D32] border-[#17334D] hover:border-orange/40 text-left transition-all duration-200 group"
            >
              {/* Icon Box */}
              <div className="shrink-0 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-orange border border-orange/30 group-hover:bg-orange/10 transition-colors rounded-lg">
                <Icon size={28} md:size={32} strokeWidth={1.5} className="text-orange" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-xl font-bold text-white mb-1">{card.title}</h2>
                <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed">{card.desc}</p>
              </div>

              {/* Chevron */}
              <ChevronRight size={20} md:size={24} className="text-orange shrink-0 ml-auto group-hover:translate-x-1 transition-transform" />
            </button>
          );
        })}
      </div>

      {/* Bottom Action Section */}
      <div className="mt-8 pt-4 border-t border-[#17334D]">
        <button className="w-full py-3 rounded-xl border border-orange text-orange text-sm md:text-base font-semibold hover:bg-orange/10 transition-colors mb-3">
          {t('changeSector')}
        </button>

        {/* Selected State Box */}
        <div className="flex items-center gap-3 p-3 bg-[#061D32] border border-[#17334D] rounded-xl">
          {/* Using a Crane icon (or any selected sector icon) */}
          <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-orange/30 bg-[#0A2A44]">
            <Landmark size={20} strokeWidth={1.5} className="text-orange" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-[#B9BBC8]">{t('selectedSectorLabel')}</p>
            <p className="text-sm md:text-base font-bold text-white">{t('selectedSectorValue')}</p>
          </div>
        </div>
      </div>

    </div>
  );
}