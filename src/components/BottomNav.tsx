import { Link, useLocation } from 'react-router-dom';
import { Home, Search, LayoutDashboard, User } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

const NAV_ITEMS = [
  { key: 'navHome', href: '/', icon: Home },
  { key: 'navSearch', href: '/recherche', icon: Search },
  { key: 'navDashboard', href: '/tableau-de-bord', icon: LayoutDashboard },
  { key: 'navProfile', href: '/profil', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = useLang();

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#031B30] border-t border-[#17334D]">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              to={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative group"
            >
              {/* Active indicator line */}
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange rounded-full" />
              )}
              <item.icon
                size={20}
                strokeWidth={active ? 2 : 1.5}
                className={active ? 'text-orange' : 'text-[#B9BBC8] group-hover:text-white transition-colors'}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-orange' : 'text-[#B9BBC8] group-hover:text-white transition-colors'}`}>
                {t(item.key)}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-bottom" />
    </nav>
  );
}
