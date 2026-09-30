import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { adminApi, ApiAdminStats } from '@/lib/apiClient';

// Found in user testing (30 Sep): the bell in AdminLayout.tsx's header had a
// hardcoded unread dot and clicking it just fired a toast saying
// "Notifications checked" - no request, no data, nothing real behind it on
// any admin page. This is the real replacement: it shows the same feed
// already proven out for the dashboard's "Activité récente" card (new
// sign-ups, visitor requests/leads, connector runs, audit log) via the new
// GET /admin/notifications endpoint, exactly the way NotificationBell.tsx
// (the client-facing bell fixed earlier the same day) shows company_alerts.
//
// These are system-wide events, not rows owned by one admin, so there's no
// per-admin is_read column to read/write like the client bell's alerts
// have. "Unread" here is computed client-side against a "last seen"
// timestamp kept in localStorage - opening the dropdown marks everything
// currently loaded as seen.

type ActivityItem = ApiAdminStats['recentActivity'][number];

const POLL_MS = 60_000;
const LAST_SEEN_KEY = 'admin_notifications_last_seen';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

export function AdminNotificationBell() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(() => {
    const stored = localStorage.getItem(LAST_SEEN_KEY);
    return stored ? Number(stored) : 0;
  });
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const { notifications } = await adminApi.notifications(20);
      setItems(notifications);
      setLoadError(false);
    } catch {
      // Quiet by design: this polls in the background on every admin page,
      // so a transient failure shouldn't surface as a toast/banner. The
      // dropdown shows a retry message only if opened while broken.
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const unreadCount = items.filter(i => new Date(i.time).getTime() > lastSeen).length;

  const handleOpen = () => {
    const opening = !open;
    setOpen(opening);
    if (opening) {
      load();
      const now = Date.now();
      localStorage.setItem(LAST_SEEN_KEY, String(now));
      setLastSeen(now);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
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
        <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:left-auto sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto bg-[#031B30] border border-[#17334D] rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#17334D]">
            <span className="text-sm font-semibold text-white">Notifications</span>
          </div>

          {loadError && items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#B9BBC8] text-center">Impossible de charger les notifications.</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[#B9BBC8] text-center">Aucune notification.</p>
          ) : (
            <ul>
              {items.map((item, i) => (
                <li key={i}>
                  <div className="w-full text-left px-4 py-3 border-b border-[#17334D]/60 last:border-b-0 flex gap-2.5">
                    <span className="min-w-0">
                      <span className="block text-sm text-white">
                        <span className="font-medium">{item.user}</span> {item.action}
                        {item.target ? <span className="text-[#B9BBC8]"> · {item.target}</span> : null}
                      </span>
                      <span className="block text-[11px] text-[#6C7B8A] mt-1">{timeAgo(item.time)}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
