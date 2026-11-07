import { lastListPath } from '@/lib/lastList';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, User } from 'lucide-react';

// 4 Nov (parcours v26/v27) : la barre basse suit le parcours réel du site —
// accueil, liste des marchés, question à Elena, espace personnel. Elle
// renvoyait auparavant vers l'ancienne page de filtres (/recherche).
const NAV_ITEMS = [
  { label: 'Accueil', href: '/', icon: Home },
  { label: 'Vos marchés', href: '/vos-marches', icon: Search },
  { label: 'Une question', href: '/question', icon: MessageCircle },
  { label: 'Mon espace', href: '/mon-espace', icon: User },
];

export function BottomNav() {
  const location = useLocation();

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href) || (href === '/mon-espace' && (location.pathname.startsWith('/connexion') || location.pathname.startsWith('/profil') || location.pathname.startsWith('/mon-dossier') || location.pathname.startsWith('/tableau-de-bord')));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A1628] border-t border-[#1E3352]">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} to={item.href === '/vos-marches' ? lastListPath() : item.href} className="flex-1 flex flex-col items-center justify-center gap-0.5 relative group">
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#F97316] rounded-full" />
              )}
              <item.icon size={22} strokeWidth={active ? 2.2 : 1.7} className={active ? 'text-[#FB923C]' : 'text-[#B4C1D3]'} />
              <span className={`text-[11px] font-bold ${active ? 'text-[#FB923C]' : 'text-[#B4C1D3]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-safe-area-bottom" />
    </nav>
  );
}
