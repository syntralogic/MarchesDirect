import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';

const FOOTER_COLS = [
  {
    titleKey: 'footerBrand',
    links: [
      { labelKey: 'footerAbout', href: '/about' },
      { labelKey: 'footerTeam', href: '/team' },
      { labelKey: 'howItWorks', href: '/how-it-works' },
      { labelKey: 'pricing', href: '/tarifs' },
    ],
  },
  {
    titleKey: 'footerMarkets',
    links: [
      { labelKey: 'public', href: '/marches-publics' },
      { labelKey: 'tenders', href: '/appels-doffres' },
      { labelKey: 'subcontracting', href: '/sous-traitance' },
      { labelKey: 'international', href: '/international' },
    ],
  },
  {
    titleKey: 'footerExplore',
    links: [
      { labelKey: 'footerZones', href: '/zones' },
      { labelKey: 'footerSectors', href: '/secteurs' },
      { labelKey: 'footerFaq', href: '/faq' },
      { labelKey: 'news', href: '/actualites' },
    ],
  },
  {
    titleKey: 'footerLegal',
    links: [
      { labelKey: 'legalNotice', href: '/mentions-legales' },
      { labelKey: 'privacy', href: '/confidentialite' },
      { labelKey: 'terms', href: '/cgu' },
      { labelKey: 'contact', href: '/contact' },
    ],
  },
];

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="bg-[#031B30] border-t border-[#17334D] mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-12">
        <div className="hidden md:grid grid-cols-5 gap-8">
          <div className="col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-xl font-bold">
                <span className="text-white">Marchés</span>
                <span className="text-orange"> Direct</span>
              </span>
            </Link>
            <p className="text-xs text-[#B9BBC8] leading-relaxed">
              {t('footerTagline')}
            </p>
          </div>

          {FOOTER_COLS.map(col => (
            <div key={col.titleKey}>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">{t(col.titleKey)}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-xs text-[#B9BBC8] hover:text-orange transition-colors">
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="md:hidden">
          <Link to="/" className="inline-block mb-4">
            <span className="text-xl font-bold">
              <span className="text-white">Marchés</span>
              <span className="text-orange"> Direct</span>
            </span>
          </Link>
          <div className="grid grid-cols-2 gap-6 mb-6">
            {FOOTER_COLS.map(col => (
              <div key={col.titleKey}>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">{t(col.titleKey)}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link.href}>
                      <Link to={link.href} className="text-xs text-[#B9BBC8] hover:text-orange transition-colors">
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#17334D] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#B9BBC8]">{t('copyright')}</p>
          <div className="flex items-center gap-4">
            <Link to="/mentions-legales" className="text-xs text-[#B9BBC8] hover:text-orange transition-colors">
              {t('legalNotice')}
            </Link>
            <Link to="/confidentialite" className="text-xs text-[#B9BBC8] hover:text-orange transition-colors">
              {t('privacy')}
            </Link>
            <Link to="/cgu" className="text-xs text-[#B9BBC8] hover:text-orange transition-colors">
              {t('terms')}
            </Link>
            <Link to="/contact" className="text-xs text-[#B9BBC8] hover:text-orange transition-colors">
              {t('contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}