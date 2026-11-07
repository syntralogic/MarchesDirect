import { lastListPath } from '@/lib/lastList';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';
import { ELENA } from '@/data/homeContent';

// 4 Nov (parcours v26/v27) : en-tête recentré sur le parcours réel.
// Téléphone : logo, « Une question ? » (Elena), espace personnel, menu.
// Ordinateur : navigation courte + bouton « Poser ma question ».
// Les anciens liens par type de marché, la prise de rendez-vous en modale
// et le sélecteur EN/FR (site français) ont été retirés de l'en-tête.
const NAV_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Vos marchés', href: '/vos-marches' },
  { label: 'Chantiers', href: '/chantiers-a-venir' },
  { label: 'Comment ça marche', href: '/#mdh-etapes' },
  { label: 'Conseils', href: '/guides' },
  { label: 'Qui sommes-nous ?', href: '/a-propos' },
  { label: 'Notre équipe', href: '/equipe' },
];

export function Header() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const space = '/mon-espace';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-[#1E3352] transition-all duration-200 ${
        scrolled ? 'bg-[#0A1628]/95 backdrop-blur-md' : 'bg-[#0A1628]'
      }`}
    >
      <div className="mx-auto max-w-[1100px] px-4 md:px-6">
        <div className="flex h-14 items-center justify-between md:h-16">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Marchés Direct, accueil">
            <span className="text-[19px] font-extrabold tracking-tight md:text-xl">
              <span className="text-white">Marchés</span>
              <span className="text-[#FB923C]"> Direct</span>
            </span>
          </Link>

          <nav className="mx-6 hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href === '/vos-marches' ? lastListPath() : link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors ${
                  isActive(link.href) ? 'bg-[#F97316]/10 text-[#FB923C]' : 'text-[#D6E0EC] hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Link to="/question" className="rounded-lg bg-[#F97316] px-4 py-2 text-[14px] font-bold text-white hover:bg-[#EA6A0E]">
              Poser ma question
            </Link>
            {isAuthenticated && <NotificationBell />}
            <Link to={space} aria-label="Mon espace" className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[14px] font-semibold text-[#D6E0EC] hover:bg-white/5 hover:text-white">
              <User size={18} /> Mon espace
            </Link>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <Link to="/question" className="mr-1 whitespace-nowrap text-[13px] font-bold text-white underline decoration-[#F97316] underline-offset-4">
              Une question ?
            </Link>
            {isAuthenticated && <NotificationBell />}
            <Link to={space} aria-label="Mon espace" className="rounded-lg p-2 text-[#D6E0EC]">
              <User size={21} />
            </Link>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="rounded-lg p-2 text-[#D6E0EC]"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-[#1E3352] bg-[#0A1628] md:hidden">
          <nav className="space-y-1 px-4 py-4">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href === '/vos-marches' ? lastListPath() : link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center rounded-xl px-4 py-3 text-[16px] font-semibold ${
                  isActive(link.href) ? 'bg-[#F97316]/10 text-[#FB923C]' : 'text-[#D6E0EC]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/publier-un-besoin" onClick={() => setMenuOpen(false)} className="flex items-center rounded-xl px-4 py-3 text-[16px] font-semibold text-[#FDBA74]">Donneur d’ordre ? Publier un besoin</Link>
            <div className="space-y-2 border-t border-[#1E3352] pt-3">
              <Link to="/question" onClick={() => setMenuOpen(false)} className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#F97316] text-[16px] font-extrabold text-white">
                Poser ma question à {ELENA.name.split(' ')[0]}
              </Link>
              <Link to={space} onClick={() => setMenuOpen(false)} className="flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-[#2A4A74] text-[15px] font-bold text-white">
                Mon espace
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
