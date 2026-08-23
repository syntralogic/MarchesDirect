import { useState } from 'react';
import { Globe, MapPin, ArrowRight, ChevronRight } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

export default function InternationalPage() {
  const { t } = useLang();
  const [selected, setSelected] = useState<string | null>(null);

  const MARKETS = [
    {
      id: 'europe',
      flag: '🇪🇺',
      name: t('intlEU'),
      sub: t('intlEUSub'),
      count: 1842,
      color: '#003399',
      description: t('intlEUDesc'),
      keywords: ['Fonds structurels', 'Horizon Europe', 'FEDER', 'FSE+'],
    },
    {
      id: 'belgique',
      flag: '🇧🇪',
      name: t('intlBelgium'),
      sub: t('intlBelgiumSub'),
      count: 312,
      color: '#FFD700',
      description: t('intlBelgiumDesc'),
      keywords: ['e-Procurement', 'Wallonie', 'Bruxelles', 'Flandre'],
    },
    {
      id: 'luxembourg',
      flag: '🇱🇺',
      name: t('intlLux'),
      sub: t('intlLuxSub'),
      count: 98,
      color: '#EF3340',
      description: t('intlLuxDesc'),
      keywords: ['eMarché', 'Ville de Luxembourg', 'Services publics'],
    },
    {
      id: 'suisse',
      flag: '🇨🇭',
      name: t('intlSwiss'),
      sub: t('intlSwissSub'),
      count: 227,
      color: '#FF0000',
      description: t('intlSwissDesc'),
      keywords: ['Simap', 'Confédération', 'Cantons romands'],
    },
    {
      id: 'espagne',
      flag: '🇪🇸',
      name: t('intlSpain'),
      sub: t('intlSpainSub'),
      count: 541,
      color: '#F1BF00',
      description: t('intlSpainDesc'),
      keywords: ['Licitaciones', 'Ayuntamientos', 'Administración General'],
    },
    {
      id: 'allemagne',
      flag: '🇩🇪',
      name: t('intlGermany'),
      sub: t('intlGermanySub'),
      count: 689,
      color: '#FFCC00',
      description: t('intlGermanyDesc'),
      keywords: ['Bundesbeschaffung', 'Länder', 'Vergaberecht'],
    },
    {
      id: 'autres',
      flag: '🌍',
      name: t('intlOther'),
      sub: t('intlOtherSub'),
      count: 134,
      color: '#B9BBC8',
      description: t('intlOtherDesc'),
      keywords: ['Banque Mondiale', 'AFD', 'BERD', 'ONU'],
    },
  ];

  const active = MARKETS.find(m => m.id === selected) ?? null;

  return (
    <div className="page-fade-in max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('intlTag')}</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-2">{t('intlTitle')}</h1>
        <p className="text-[#B9BBC8] text-sm max-w-2xl">{t('intlSub')}</p>
      </div>

      <div className="flex flex-col md:flex-row md:gap-8 md:items-start">
        {/* Market list */}
        <div className="flex-1 min-w-0 space-y-2 md:max-w-sm">
          {MARKETS.map(market => (
            <button
              key={market.id}
              onClick={() => setSelected(selected === market.id ? null : market.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                selected === market.id
                  ? 'border-orange bg-orange/5'
                  : 'border-[#17334D] bg-[#061D32] hover:border-orange/30'
              }`}
            >
              <span className="text-2xl shrink-0">{market.flag}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${selected === market.id ? 'text-orange' : 'text-white'}`}>{market.name}</p>
                <p className="text-xs text-[#B9BBC8] truncate">{market.sub}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-orange">{market.count.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-[#B9BBC8]">{t('intlOpp')}</p>
              </div>
              <ChevronRight size={14} className={`text-orange shrink-0 transition-transform ${selected === market.id ? 'rotate-90' : ''}`} />
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="mt-4 md:mt-0 flex-1 min-w-0">
          {active ? (
            <div className="bg-[#061D32] border border-orange/30 rounded-2xl p-6 orange-glow-sm sticky top-20">
              <div className="flex items-center gap-4 mb-5">
                <span className="text-4xl">{active.flag}</span>
                <div>
                  <h2 className="text-xl font-extrabold text-white">{active.name}</h2>
                  <p className="text-sm text-orange font-semibold">{active.count.toLocaleString('fr-FR')} {t('intlAvailable')}</p>
                </div>
              </div>
              <p className="text-sm text-[#B9BBC8] leading-relaxed mb-5">{active.description}</p>
              <div className="mb-6">
                <p className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-2">{t('intlKeywords')}</p>
                <div className="flex flex-wrap gap-2">
                  {active.keywords.map(kw => (
                    <span key={kw} className="text-xs text-orange bg-orange/10 border border-orange/20 px-2.5 py-1 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
              <button className="w-full bg-orange text-white font-semibold py-3 rounded-xl hover:bg-orange/90 transition-colors text-sm flex items-center justify-center gap-2">
                {t('intlExplore')} {active.name} <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-8 text-center sticky top-20">
              <Globe size={36} className="text-orange mx-auto mb-3" />
              <h3 className="text-white font-bold mb-2">{t('intlSelect')}</h3>
              <p className="text-sm text-[#B9BBC8]">{t('intlSelectSub')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}