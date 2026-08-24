import { FileText, Users, TrendingUp, Euro, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';

const STATS = [
  { labelKey: 'adminStatsTenders', value: '1,248', icon: FileText, color: 'text-orange', href: '/admin/tenders' },
  { labelKey: 'adminStatsUsers', value: '832', icon: Users, color: 'text-blue-400', href: '/admin/users' },
  { labelKey: 'adminStatsMatches', value: '96%', icon: TrendingUp, color: 'text-green-400', href: '/admin/tenders' },
  { labelKey: 'adminStatsRevenue', value: '€48k', icon: Euro, color: 'text-yellow-400', href: '/admin/settings' },
];

const RECENT_ACTIVITY = [
  { user: 'Jean Dupont', action: 'A déposé un dossier', target: 'Réhabilitation voiries', time: 'Il y a 10 min' },
  { user: 'Sophie Martin', action: 'A recommandé une opportunité', target: 'Entretien espaces verts', time: 'Il y a 25 min' },
  { user: 'Pierre Leroy', action: 'A créé un compte', target: 'BTP Construction', time: 'Il y a 1h' },
  { user: 'Camille Robert', action: 'A mis à jour son profil', target: 'Nettoyage Pro', time: 'Il y a 2h' },
];

export default function AdminDashboard() {
  const { t } = useLang();
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">{t('adminDashboard')}</h1>
        <p className="text-sm text-[#B9BBC8]">{t('adminWelcomeBack')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(stat => (
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
        <div className="space-y-4">
          {RECENT_ACTIVITY.map((item, i) => (
            <div key={i} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#031B30] border border-[#17334D] flex items-center justify-center text-xs font-bold text-orange shrink-0">
                {item.user.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">
                  <span className="font-bold">{item.user}</span> {item.action.toLowerCase()}
                </p>
                <p className="text-xs text-[#B9BBC8] truncate">{item.target}</p>
              </div>
              <span className="text-xs text-[#B9BBC8] shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}