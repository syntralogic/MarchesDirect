import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { alertsApi, ApiAlert } from '@/lib/apiClient';

// 29 Sep: the backend has working alert creation (new-match / deadline-reminder
// jobs writing to company_alerts) and a working GET/PUT /alerts API, and the
// frontend even had the type field and API client methods for it - but no
// component anywhere ever called them, so a logged-in visitor had no way to
// see a notification had ever been created for them. This is that missing
// piece: a bell in the header, shown only once authenticated.

const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const rows = await alertsApi.list();
      setAlerts(rows);
      setLoadError(false);
    } catch {
      // Quiet by design: this polls in the background on every authenticated
      // page, so a transient failure shouldn't surface as a toast/banner.
      // The dropdown shows a retry message only if opened while broken.
      setLoadError(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) { setAlerts([]); return; }
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, load]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!isAuthenticated) return null;

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) load();
  };

  const handleAlertClick = async (alert: ApiAlert) => {
    if (!alert.is_read) {
      setAlerts(prev => prev.map(a => (a.id === alert.id ? { ...a, is_read: true } : a)));
      alertsApi.markRead(alert.id).catch(() => load());
    }
    setOpen(false);
    if (alert.opportunity_id) navigate(`/opportunites/${alert.opportunity_id}`);
  };

  const handleMarkAllRead = async () => {
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    try {
      await alertsApi.markAllRead();
    } catch {
      load();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={handleOpen}
        aria-label={t('notifBellLabel')}
        className="relative p-2 rounded-lg text-[#B9BBC8] hover:text-white hover:bg-white/5 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-orange text-white text-[10px] font-bold leading-4 text-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:left-auto sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto bg-[#031B30] border border-[#17334D] rounded-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#17334D]">
            <span className="text-sm font-semibold text-white">{t('notifBellLabel')}</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-medium text-orange hover:text-orange/80 transition-colors">
                {t('notifMarkAllRead')}
              </button>
            )}
          </div>

          {loadError && alerts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#B9BBC8] text-center">{t('notifLoadError')}</p>
          ) : alerts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#B9BBC8] text-center">{t('notifEmpty')}</p>
          ) : (
            <ul>
              {alerts.map(alert => (
                <li key={alert.id}>
                  <button
                    onClick={() => handleAlertClick(alert)}
                    className={`w-full text-left px-4 py-3 border-b border-[#17334D]/60 last:border-b-0 hover:bg-white/5 transition-colors flex gap-2.5 ${
                      alert.is_read ? 'opacity-60' : ''
                    }`}
                  >
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${alert.is_read ? 'bg-transparent' : 'bg-orange'}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-white truncate">{alert.title}</span>
                      {alert.message && <span className="block text-xs text-[#B9BBC8] mt-0.5 line-clamp-2">{alert.message}</span>}
                      <span className="block text-[11px] text-[#6C7B8A] mt-1">{timeAgo(alert.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
