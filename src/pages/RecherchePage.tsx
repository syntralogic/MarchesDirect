import { useState, useMemo } from 'react';
import { Search, MapPin, Calendar, ChevronDown, ArrowRight, Zap, Paintbrush, Building, CheckCircle2 } from 'lucide-react';
import { mockPublicOpportunities, mockPrivateOpportunities, mockSubcontractingOpportunities } from '@/data/mockData';
import { useLang } from '@/contexts/LangContext';

// Combine all opportunities
const ALL_OPPS = [...mockPublicOpportunities, ...mockPrivateOpportunities, ...mockSubcontractingOpportunities];

export default function RecherchePage() {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  
  const filtered = useMemo(() => {
    return ALL_OPPS.filter(o => {
      if (query && !o.title.toLowerCase().includes(query.toLowerCase()) && !o.organization.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query]);

  const getIcon = (title: string) => {
    if (title.toLowerCase().includes('peinture')) return <Paintbrush size={16} className="text-orange" />;
    if (title.toLowerCase().includes('électricité')) return <Zap size={16} className="text-orange" />;
    if (title.toLowerCase().includes('cloisons')) return <Building size={16} className="text-orange" />;
    return <Building size={16} className="text-orange" />;
  };

  return (
    <div className="page-fade-in max-w-md mx-auto px-4 py-3 min-h-screen pb-24">
      
      {/* Header */}
      <div className="mb-3">
        <span className="text-[9px] font-bold text-orange uppercase tracking-widest mb-1 block">{t('searchHeaderTag')}</span>
        <h1 className="text-[20px] leading-tight font-extrabold text-white mb-1">
          {t('searchHeaderTitle')}
        </h1>
        <p className="text-[#B9BBC8] text-[11px] leading-snug">
          {t('searchHeaderSub')}
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-2.5 mb-3">
        <div className="mb-2">
          <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchKeywords')}</label>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <input
              type="text"
              placeholder={t('searchKeywordsPlaceholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchLocation')}</label>
            <div className="relative">
              <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
              <input
                type="text"
                placeholder={t('searchLocationPlaceholder')}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchRadius')}</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8] font-semibold text-[10px]">⌖</span>
              <select className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-6 py-2 text-[11px] text-white focus:outline-none appearance-none cursor-pointer">
                <option>50 km</option>
                <option>100 km</option>
                <option>200 km</option>
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B9BBC8] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mb-2.5">
          <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchAvailability')}</label>
          <div className="relative">
            <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <select className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-6 py-2 text-[11px] text-white focus:outline-none appearance-none cursor-pointer">
              <option>{t('searchAvailabilityNow')}</option>
              <option>{t('searchAvailability1')}</option>
              <option>{t('searchAvailability3')}</option>
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B9BBC8] pointer-events-none" />
          </div>
        </div>

        <button className="w-full bg-orange text-white font-bold py-2 rounded-md text-xs hover:bg-orange/90 transition-colors">
          {t('searchButton')}
        </button>
      </div>

      {/* Results Header */}
      <div className="mb-2">
        <h2 className="text-[11px] font-bold text-white">
          <span className="text-orange">{filtered.length}</span> {t('searchResults')}
        </h2>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {filtered.map((o) => (
          <div key={o.id} className="bg-[#061D32] border border-[#17334D] rounded-lg p-2.5">
            <div className="flex items-start gap-2.5">
              {/* Icon Circle */}
              <div className="shrink-0 w-8 h-8 rounded-full bg-[#031B30] border border-[#17334D] flex items-center justify-center">
                {getIcon(o.title)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="bg-[#0F3D2E] text-[#3FA96E] text-[8px] font-bold px-1 py-px rounded uppercase">{t('searchNew')}</span>
                </div>
                
                <h3 className="text-xs font-bold text-white leading-tight mb-0.5">{o.title}</h3>
                <p className="text-[10px] text-[#B9BBC8] mb-1">{o.organization}</p>

                <div className="flex items-center gap-2 text-[9px] text-[#B9BBC8]">
                  <span className="flex items-center gap-0.5"><MapPin size={9} className="text-[#B9BBC8]" /> {o.location}</span>
                  <span className="flex items-center gap-0.5"><Calendar size={9} className="text-[#B9BBC8]" /> {t('searchStart')} {o.startDate || 'octobre'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Details Grid */}
            <div className="mt-2 pt-2 border-t border-[#17334D]">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[8px] text-[#B9BBC8] mb-0.5">{t('searchDuration')}</p>
                  <p className="text-[11px] font-semibold text-white">{o.duration || '4 semaines'}</p>
                </div>
                <div>
                  <p className="text-[8px] text-[#B9BBC8] mb-0.5">{t('searchBudget')}</p>
                  <p className="text-[11px] font-semibold text-white">{o.budget?.toLocaleString('fr-FR') || '42 000'} € HT</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                {/* Status Badge */}
                <div className="flex items-center gap-1 text-[9px] font-medium text-[#3FA96E]">
                  <CheckCircle2 size={10} />
                  <span>{t('searchCompatible')}</span>
                </div>
                {/* CTA Button */}
                <button className="flex items-center gap-1 text-[10px] font-bold text-orange border border-orange/40 rounded px-2 py-1 hover:bg-orange/10 transition-colors">
                  {t('searchView')} <ArrowRight size={10} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}