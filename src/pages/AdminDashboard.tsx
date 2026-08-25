import { useState, useEffect } from 'react';
import { FileText, Users, TrendingUp, Euro, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';
import { adminApi, getApiErrorMessage, type ApiAdminStats } from '@/lib/apiClient';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

export default function AdminDashboard() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ApiAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.stats()
      .then(setStats)
      .catch((err) => setError(getApiErrorMessage(err, 'Impossible de charger les statistiques.')))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { labelKey: 'adminStatsTenders', value: stats.activeOpportunities.toLocaleString('fr-FR'), icon: FileText, color: 'text-orange', href: '/admin/tenders' },
    { labelKey: 'adminStatsUsers', value: stats.totalCompanies.toLocaleString('fr-FR'), icon: Users, color: 'text-blue-400', href: '/admin/users' },
    { labelKey: 'adminStatsMatches', value: stats.matchRate !== null ? `${stats.matchRate}%` : '—', icon: TrendingUp, color: 'text-green-400', href: '/admin/tenders' },
    { labelKey: 'adminStatsRevenue', value: `€${Math.round(stats.monthlyRecurringRevenue).toLocaleString('fr-FR')}`, icon: Euro, color: 'text-yellow-400', href: '/admin/settings' },
  ] : [];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">{t('adminDashboard')}</h1>
        <p className="text-sm text-[#B9BBC8]">{t('adminWelcomeBack')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin text-orange" /></div>
      ) : error ? (
        <div className="bg-[#061D32] border border-red-500/30 rounded-xl p-4 mb-6 text-sm text-red-400">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map(stat => (
              <button
                key={stat.labelKey}
                onClick={() => navigate(stat.href)}
                className="bg-[#061D32] border border-[#17334D] rounded-xl p-5 hover:border-orange/40 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</span>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <p className="text-xs text-[#B9BBC8]">{t(stat.labelKey)}</p>
              </button>
            ))}
          </div>

          <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">{t('adminRecentActivity')}</h2>
              <Link to="/admin/users" className="text-xs text-orange font-semibold hover:underline flex items-center gap-1">
                {t('adminViewAll')} <ChevronRight size={14} />
              </Link>
            </div>
            {stats && stats.recentActivity.length === 0 ? (
              <p className="text-xs text-[#B9BBC8] py-4 text-center">Aucune activité récente.</p>
            ) : (
              <div className="space-y-4">
                {stats?.recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#031B30] border border-[#17334D] flex items-center justify-center text-xs font-bold text-orange shrink-0">
                      {item.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-bold">{item.user}</span> {item.action.toLowerCase()}
                      </p>
                      <p className="text-xs text-[#B9BBC8] truncate">{item.target}</p>
                    </div>
                    <span className="text-xs text-[#B9BBC8] shrink-0">{timeAgo(item.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}