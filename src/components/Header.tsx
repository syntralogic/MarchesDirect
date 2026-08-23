import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLang } from '@/contexts/LangContext';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';

const NAV_LINKS = [
  { key: 'tenders', href: '/appels-doffres' },
  { key: 'public', href: '/marches-publics' },
  { key: 'subcontracting', href: '/sous-traitance' },
  { key: 'howItWorks', href: '/how-it-works' },
  { key: 'pricing', href: '/tarifs' },
];

const MOBILE_NAV_LINKS = [
  { key: 'home', href: '/' },
  { key: 'tenders', href: '/appels-doffres' },
  { key: 'public', href: '/marches-publics' },
  { key: 'subcontracting', href: '/sous-traitance' },
  { key: 'howItWorks', href: '/how-it-works' },
  { key: 'pricing', href: '/tarifs' },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          scrolled
            ? 'bg-[#001326]/95 backdrop-blur-md border-b border-[#17334D]'
            : 'bg-[#001326] border-b border-[#17334D]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            <Link to="/" className="flex items-center shrink-0">
              <span className="text-lg md:text-xl font-bold tracking-tight">
                <span className="text-white">Marchés</span>
                <span className="text-orange"> Direct</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 mx-6">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.key}
                  to={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive(link.href)
                      ? 'text-orange bg-orange/10'
                      : 'text-[#B9BBC8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button
                onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#B9BBC8] hover:text-white hover:bg-white/5 transition-colors border border-[#17334D] hover:border-[#FF6500]/40"
              >
                {lang === 'fr' ? 'EN' : 'FR'}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[#B9BBC8] hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => setAppointmentOpen(true)}
                className="px-4 py-2 bg-orange text-white text-sm font-semibold rounded-lg hover:bg-orange/90 transition-colors"
              >
                {t('bookAppointment')}
              </button>
              <Link to="/profil" className="p-2 rounded-lg text-[#B9BBC8] hover:text-white hover:bg-white/5 transition-colors">
                <User size={18} />
              </Link>
            </div>

            <div className="flex md:hidden items-center gap-1">
              <button
                onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                className="px-2 py-1 rounded text-xs font-semibold text-[#B9BBC8] border border-[#17334D]"
              >
                {lang === 'fr' ? 'EN' : 'FR'}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-[#B9BBC8]"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="p-2 rounded-lg text-[#B9BBC8] hover:text-white"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#17334D] bg-[#031B30]">
            <nav className="px-4 py-4 space-y-1">
              {MOBILE_NAV_LINKS.map(link => (
                <Link
                  key={link.key}
                  to={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-orange bg-orange/10'
                      : 'text-[#B9BBC8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t(link.key)}
                </Link>
              ))}
              <div className="pt-3 border-t border-[#17334D] space-y-2">
                <button
                  onClick={() => { setMenuOpen(false); setAppointmentOpen(true); }}
                  className="w-full bg-orange text-white font-semibold py-3 rounded-xl text-sm hover:bg-orange/90 transition-colors"
                >
                  {t('bookAppointment')}
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setCallbackOpen(true); }}
                  className="w-full border border-orange text-orange font-semibold py-3 rounded-xl text-sm hover:bg-orange/10 transition-colors"
                >
                  {t('callBack')}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <AppointmentModal open={appointmentOpen} onClose={() => setAppointmentOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </>
  );
}