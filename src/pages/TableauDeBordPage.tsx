import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Bell, BookmarkCheck, FileText, Calendar,
  TrendingUp, ChevronRight, Clock, Target, Building2, MapPin
} from 'lucide-react';
import { mockPublicOpportunities, mockPrivateOpportunities } from '@/data/mockData';
import { OpportunityCardSimple } from '@/components/OpportunityCard';

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Vue d\'ensemble', key: 'overview' },
  { icon: TrendingUp, label: 'Recommandées', key: 'recommended' },
  { icon: BookmarkCheck, label: 'Sauvegardées', key: 'saved' },
  { icon: FileText, label: 'Mes dossiers', key: 'dossiers' },
  { icon: Calendar, label: 'Échéances', key: 'deadlines' },
  { icon: Bell, label: 'Notifications', key: 'notifications' },
];

const STATS = [
  { label: 'Opportunités recommandées', value: '42', delta: '+8 cette semaine', color: 'text-orange' },
  { label: 'Dossiers en cours', value: '3', delta: '2 à valider', color: 'text-blue-400' },
  { label: 'Taux de matching moyen', value: '78%', delta: '+5% vs mois dernier', color: 'text-green-400' },
  { label: 'Alertes non lues', value: '12', delta: 'Nouvelles aujourd\'hui', color: 'text-yellow-400' },
];

const RECENT = [
  { action: 'Nouvelle opportunité recommandée', detail: 'Réhabilitation voiries — Conseil Dép. du Gard', time: 'Il y a 2h' },
  { action: 'Dossier généré', detail: 'Déploiement infrastructure réseau — Île-de-France Mobilités', time: 'Il y a 5h' },
  { action: 'Alerte échéance', detail: 'Services de nettoyage — France Travail', time: 'Demain' },
  { action: 'Opportunité sauvegardée', detail: 'Construction bâtiment administratif — Toulouse Métropole', time: 'Hier' },
];

const DEADLINES = [
  { title: 'Services nettoyage — France Travail', date: '5 sept. 2026', urgent: true },
  { title: 'Réhabilitation voiries — Conseil du Gard', date: '15 sept. 2026', urgent: false },
  { title: 'Mobilier urbain — Ville de Marseille', date: '22 sept. 2026', urgent: false },
  { title: 'Maintenance électrique — Université Le Havre', date: '10 sept. 2026', urgent: true },
];

export default function TableauDeBordPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const saved = [...mockPublicOpportunities, ...mockPrivateOpportunities].filter(o => o.saved);
  const recommended = mockPublicOpportunities.slice(0, 4);

  return (
    <div className="page-fade-in">
      {/* Mobile welcome */}
      <div className="md:hidden px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-white">Bonjour 👋</h1>
        <p className="text-sm text-[#B9BBC8] mt-0.5">Voici votre tableau de bord</p>
      </div>

      <div className="flex min-h-[calc(100vh-8rem)] md:min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[#031B30] border-r border-[#17334D] py-6 px-3">
          <div className="mb-6 px-3">
            <p className="text-xs text-[#B9BBC8]">Bonjour</p>
            <p className="text-sm font-bold text-white">Jean Dupont</p>
          </div>
          <nav className="space-y-1 flex-1">
            {SIDEBAR_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === item.key
                    ? 'text-orange bg-orange/10'
                    : 'text-[#B9BBC8] hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={16} className={activeSection === item.key ? 'text-orange' : ''} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="px-3 pt-4 border-t border-[#17334D]">
            <Link to="/profil" className="flex items-center gap-2 text-xs text-[#B9BBC8] hover:text-orange transition-colors">
              <div className="w-7 h-7 rounded-full bg-orange/20 border border-orange/30 flex items-center justify-center text-xs font-bold text-orange">JD</div>
              Mon profil
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 px-4 md:px-6 py-4 md:py-8 overflow-x-hidden">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 md:mb-8">
            {STATS.map(stat => (
              <div key={stat.label} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
                <div className={`text-2xl md:text-3xl font-extrabold mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-white font-medium leading-snug mb-1">{stat.label}</div>
                <div className="text-xs text-[#B9BBC8]">{stat.delta}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommended */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp size={14} className="text-orange" /> Opportunités recommandées
                </h2>
                <Link to="/recherche" className="text-xs text-orange hover:underline">Voir tout</Link>
              </div>
              <div className="space-y-2">
                {recommended.map(o => <OpportunityCardSimple key={o.id} opportunity={o} />)}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Saved */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookmarkCheck size={14} className="text-orange" /> Sauvegardées
                  </h2>
                  <span className="text-xs text-[#B9BBC8]">{saved.length}</span>
                </div>
                <div className="space-y-2">
                  {saved.slice(0, 3).map(o => <OpportunityCardSimple key={o.id} opportunity={o} />)}
                </div>
              </div>

              {/* Deadlines */}
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-orange" /> Échéances proches
                </h2>
                <div className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
                  {DEADLINES.map((d, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < DEADLINES.length - 1 ? 'border-b border-[#17334D]' : ''}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${d.urgent ? 'bg-red-400' : 'bg-green-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{d.title}</p>
                        <p className="text-xs text-[#B9BBC8]">{d.date}</p>
                      </div>
                      {d.urgent && <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full shrink-0">Urgent</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-orange" /> Activité récente
                </h2>
                <div className="space-y-2">
                  {RECENT.map((r, i) => (
                    <div key={i} className="bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-orange">{r.action}</p>
                          <p className="text-xs text-[#B9BBC8] mt-0.5 truncate">{r.detail}</p>
                        </div>
                        <span className="text-xs text-[#B9BBC8] shrink-0">{r.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
