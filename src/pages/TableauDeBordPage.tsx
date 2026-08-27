import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Calendar, Euro, AlertCircle, Sparkles, ArrowRight,
} from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { apiClient, getApiErrorMessage, dashboardApi, type ApiDashboardMatch } from '@/lib/apiClient';

interface DashboardSummary {
  activeOpportunities: number;
  unreadAlerts: number;
  bidsByStatus: { status: string; count: string }[];
  validDocuments: number;
}

type StatCard = { labelKey: string; value: string; color: string };

export default function TableauDeBordPage() {
  const { t } = useLang();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [matches, setMatches] = useState<ApiDashboardMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const { data } = await apiClient.get<DashboardSummary>('/dashboard');
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) setStatsError(getApiErrorMessage(err, t('dashStatsLoadError')));
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    const loadMatches = async () => {
      setMatchesLoading(true);
      setMatchesError(null);
      try {
        const { matches: m } = await dashboardApi.matches();
        if (!cancelled) setMatches(m);
      } catch (err) {
        if (!cancelled) setMatchesError(getApiErrorMessage(err, 'Impossible de charger vos opportunités recommandées.'));
      } finally {
        if (!cancelled) setMatchesLoading(false);
      }
    };

    loadSummary();
    loadMatches();
    return () => { cancelled = true; };
  }, [t]);

  const dossiersInProgress = summary?.bidsByStatus
    .filter(b => b.status === 'draft' || b.status === 'in_progress')
    .reduce((sum, b) => sum + parseInt(b.count, 10), 0) ?? 0;

  const statCards: StatCard[] = summary ? [
    { labelKey: 'dashOpportunitiesRecommended', value: String(summary.activeOpportunities), color: 'text-orange' },
    { labelKey: 'dashDossiersInProgress', value: String(dossiersInProgress), color: 'text-blue-400' },
    { labelKey: 'dashValidDocuments', value: String(summary.validDocuments), color: 'text-green-400' },
    { labelKey: 'dashUnreadAlerts', value: String(summary.unreadAlerts), color: 'text-yellow-400' },
  ] : [];

  return (
    <div className="page-fade-in max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-12">

      {/* STATS OVERVIEW */}
      {statsError ? (
        <div className="mb-8 bg-[#061D32] border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0" />
          <p className="text-sm text-[#B9BBC8]">{statsError}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {(statsLoading ? Array.from({ length: 4 }) : statCards).map((stat, i) => (
            <div key={i} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4">
              {statsLoading ? (
                <>
                  <div className="h-3 w-20 bg-[#17334D] rounded animate-pulse mb-3" />
                  <div className="h-6 w-10 bg-[#17334D] rounded animate-pulse" />
                </>
              ) : (
                <>
                  <p className="text-[10px] font-medium text-[#B9BBC8] uppercase tracking-wide mb-1">
                    {t((stat as StatCard).labelKey)}
                  </p>
                  <p className={`text-xl font-extrabold ${(stat as StatCard).color}`}>
                    {(stat as StatCard).value}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* AI-MATCHED OPPORTUNITIES */}
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-orange" />
        <h2 className="text-base font-bold text-white">{t('dashRecommendedOpps')}</h2>
      </div>

      {matchesLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4">
              <div className="h-4 w-3/4 bg-[#17334D] rounded animate-pulse mb-2" />
              <div className="h-3 w-1/2 bg-[#17334D] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : matchesError ? (
        <div className="bg-[#061D32] border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0" />
          <p className="text-sm text-[#B9BBC8]">{matchesError}</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 text-center">
          <Sparkles size={24} className="text-orange mx-auto mb-2" />
          <p className="text-sm font-semibold text-white mb-1">Aucune opportunité correspondante pour le moment.</p>
          <p className="text-xs text-[#B9BBC8]">Complétez votre profil entreprise pour améliorer vos recommandations.</p>
          <Link to="/profil/dossier-entreprise" className="inline-block mt-3 text-xs font-semibold text-orange hover:underline">
            Compléter mon profil →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <Link
              key={m.id}
              to={`/opportunites/${m.id}`}
              className="block bg-[#061D32] border border-[#17334D] rounded-2xl p-4 hover:border-orange/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-bold text-white leading-snug">{m.title}</h3>
                <ArrowRight size={16} className="text-orange shrink-0 mt-0.5" />
              </div>
              {m.ai_summary && (
                <p className="text-xs text-[#B9BBC8] leading-relaxed mb-3 line-clamp-2">{m.ai_summary}</p>
              )}
              <div className="flex flex-wrap gap-3 text-[11px] text-[#B9BBC8]">
                {(m.location_city || m.location_region) && (
                  <span className="flex items-center gap-1"><MapPin size={11} /> {m.location_city || m.location_region}</span>
                )}
                {m.deadline && (
                  <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(m.deadline).toLocaleDateString('fr-FR')}</span>
                )}
                {m.estimated_value && (
                  <span className="flex items-center gap-1"><Euro size={11} /> {new Intl.NumberFormat('fr-FR').format(m.estimated_value)} €</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
