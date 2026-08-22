import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';

const FOOTER_COLS = [
  {
    title: 'Marchés Direct',
    links: [
      { label: 'À propos', href: '/a-propos' },
      { label: 'Notre équipe', href: '/equipe' },
      { label: 'Comment ça marche', href: '/comment-ca-marche' },
      { label: 'Tarifs', href: '/tarifs' },
    ],
  },
  {
    title: 'Marchés',
    links: [
      { label: 'Marchés publics', href: '/marches-publics' },
      { label: "Appels d'offres", href: '/appels-doffres' },
      { label: 'Sous-traitance', href: '/sous-traitance' },
      { label: 'International', href: '/international' },
    ],
  },
  {
    title: 'Explorer',
    links: [
      { label: 'Zones géographiques', href: '/zones' },
      { label: "Secteurs d'activité", href: '/secteurs' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Actualités', href: '/actualites' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'Confidentialité', href: '/confidentialite' },
      { label: 'CGU', href: '/cgu' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="bg-[#031B30] border-t border-[#17334D] mt-auto">
      {/* Desktop: columns */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-12">
        <div className="hidden md:grid grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-xl font-bold">
                <span className="text-white">Marchés</span>
                <span className="text-orange"> Direct</span>
              </span>
            </Link>
            <p className="text-xs text-[#B9BBC8] leading-relaxed">
              La plateforme de mise en relation pour les marchés publics, appels d'offres privés et la sous-traitance.
            </p>
          </div>

          {/* Columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-xs text-[#B9BBC8] hover:text-orange transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile: compact */}
        <div className="md:hidden">
          <Link to="/" className="inline-block mb-4">
            <span className="text-xl font-bold">
              <span className="text-white">Marchés</span>
              <span className="text-orange"> Direct</span>
            </span>
          </Link>
          <div className="grid grid-cols-2 gap-6 mb-6">
            {FOOTER_COLS.map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link.href}>
                      <Link to={link.href} className="text-xs text-[#B9BBC8] hover:text-orange transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
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
