import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

// Lucide has no TikTok glyph - a small inline mark matching the stroke
// weight/style of the lucide icons used alongside it.
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

// Client's ask (WhatsApp brief, 4 Sep): a small, extensible social block in
// the footer near the coordinates/useful links, one icon per configured
// network, opening in a new tab. Facebook's URL was given immediately;
// Instagram/TikTok/LinkedIn are still pending from the client - per their
// own instruction ("les icônes non configurées ne devront pas être
// affichées"), an entry with no url simply doesn't render, so this list is
// the only thing to touch once the remaining links arrive.
const SOCIAL_LINKS: { key: string; label: string; url: string | null; Icon: typeof Facebook }[] = [
  { key: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/share/192HjKpqQ4/', Icon: Facebook },
  { key: 'instagram', label: 'Instagram', url: null, Icon: Instagram },
  { key: 'tiktok', label: 'TikTok', url: null, Icon: TikTokIcon as unknown as typeof Facebook },
  { key: 'linkedin', label: 'LinkedIn', url: null, Icon: Linkedin },
];

function SocialLinks() {
  const configured = SOCIAL_LINKS.filter(s => s.url);
  if (configured.length === 0) return null;
  return (
    <div className="flex items-center gap-3">
      {configured.map(({ key, label, url, Icon }) => (
        <a
          key={key}
          href={url!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-[#17334D] text-[#B9BBC8] hover:text-orange hover:border-orange/50 transition-colors"
        >
          <Icon size={15} />
        </a>
      ))}
    </div>
  );
}

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
            <p className="text-xs text-[#B9BBC8] leading-relaxed mb-4">
              {t('footerTagline')}
            </p>
            <SocialLinks />
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
          <div className="mb-6">
            <SocialLinks />
          </div>
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

        <div className="border-t border-[#17334D] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
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
          {/* Mobile: brand column's SocialLinks is above the fold already on
              small screens (inside the md:hidden block), so this bottom bar
              only needs to repeat it on desktop where the brand column and
              this bar are visually far apart. */}
          <div className="hidden md:block">
            <SocialLinks />
          </div>
        </div>
      </div>
    </footer>
  );
}