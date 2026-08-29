import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Settings, UserCheck,
  Bell, Search, LogOut, Menu, X, CheckCircle2, XCircle
} from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

const ADMIN_LINKS = [
  { key: 'adminDashboard', href: '/admin', icon: LayoutDashboard },
  { key: 'adminTenders', href: '/admin/tenders', icon: FileText },
  { key: 'adminUsers', href: '/admin/users', icon: Users },
  { key: 'adminLeads', href: '/admin/leads', icon: UserCheck },
  { key: 'adminSettings', href: '/admin/settings', icon: Settings },
];

// Global event-based toast system (No Context needed!)
export function showToast(message: string, type: 'success' | 'error' = 'success') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'success' | 'error' }>>([]);

  // Listen for global toast events
  useEffect(() => {
    const handleToast = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 3000);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  const isActive = (href: string) =>
    href === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(href);

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-[#17334D]">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-white">Marchés</span>
          <span className="text-orange"> Direct</span>
        </span>
        <p className="text-xs text-[#B9BBC8] mt-1">Administration</p>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {ADMIN_LINKS.map(link => (
          <Link
            key={link.key}
            to={link.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive(link.href)
                ? 'text-orange bg-orange/10'
                : 'text-[#B9BBC8] hover:text-white hover:bg-white/5'
            }`}
          >
            <link.icon size={18} className={isActive(link.href) ? 'text-orange' : ''} />
            {t(link.key)}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-6 border-t border-[#17334D]">
        <div className="flex items-center gap-3 px-4 mb-4">
          <div className="w-9 h-9 rounded-full bg-orange/20 border border-orange/30 flex items-center justify-center text-xs font-bold text-orange">
            AD
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">Admin</p>
            <p className="text-xs text-[#B9BBC8] truncate">admin@marchesdirect.fr</p>
          </div>
        </div>
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#B9BBC8] hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} />
          {t('backToSite')}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#001326]">
      <aside className="hidden md:block w-64 shrink-0 bg-[#031B30] border-r border-[#17334D]">
        {SidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-[#031B30] border-r border-[#17334D]">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg text-[#B9BBC8] hover:text-white">
              <X size={20} />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-[#001326]/95 backdrop-blur-md border-b border-[#17334D]">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg text-[#B9BBC8] hover:text-white">
                <Menu size={20} />
              </button>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
                <input
                  type="text"
                  placeholder={t('adminSearchPlaceholder')}
                  className="bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange w-full md:w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => showToast('Notifications checked')} className="relative p-2 rounded-lg text-[#B9BBC8] hover:text-white hover:bg-white/5 transition-colors">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Global Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-4 z-[999] space-y-2">
          {toasts.map(toast => (
            <div key={toast.id} className="flex items-center gap-2 bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-3 shadow-2xl">
              {toast.type === 'success' ? (
                <CheckCircle2 size={18} className="text-green-400" />
              ) : (
                <XCircle size={18} className="text-red-400" />
              )}
              <span className="text-sm text-white">{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}