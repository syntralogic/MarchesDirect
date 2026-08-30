import { Fragment, useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronUp, Loader2, EyeOff, Eye as EyeIcon } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';
import { adminApi, getApiErrorMessage, type ApiAdminOpportunity } from '@/lib/apiClient';

const STATUS_OPTIONS = ['active', 'inactive', 'expired', 'cancelled'] as const;

export default function AdminTenders() {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [opportunities, setOpportunities] = useState<ApiAdminOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.opportunities({ q: query || undefined, status: status === 'all' ? undefined : status, limit: 50 })
      .then(data => setOpportunities(data.results))
      .catch(err => setError(getApiErrorMessage(err, t('adminLoadError') || 'Impossible de charger les opportunités.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const handleStatusChange = async (opp: ApiAdminOpportunity, newStatus: string) => {
    setUpdatingId(opp.id);
    try {
      await adminApi.updateOpportunityStatus(opp.id, newStatus);
      setOpportunities(prev => prev.map(o => o.id === opp.id ? { ...o, status: newStatus } : o));
      showToast(t('adminTendersStatusUpdate', { status: newStatus }) || `Statut mis à jour : ${newStatus}`);
    } catch (err) {
      showToast(getApiErrorMessage(err, t('adminTendersStatusUpdateFailed')), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    inactive: 'text-[#B9BBC8] bg-[#031B30]',
    expired: 'text-orange bg-orange/10',
    cancelled: 'text-red-400 bg-red-400/10',
  };

  const formatBudget = (opp: ApiAdminOpportunity) =>
    opp.estimated_value != null ? `${Number(opp.estimated_value).toLocaleString('fr-FR')} ${opp.currency || '€'}` : '—';
  const formatDeadline = (opp: ApiAdminOpportunity) =>
    opp.deadline ? new Date(opp.deadline).toLocaleDateString('fr-FR') : '—';

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{t('adminTenders')}</h1>
          <p className="text-sm text-[#B9BBC8]">{t('adminManageTenders')}</p>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('adminSearchTenders')} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange">
          <option value="all">{t('adminAllStatuses')}</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="submit" className="flex items-center justify-center gap-2 bg-[#061D32] border border-[#17334D] text-[#B9BBC8] px-4 py-2.5 rounded-xl hover:text-white transition-colors text-sm">
          <Search size={16} /> {t('search')}
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#B9BBC8]"><Loader2 size={20} className="animate-spin mr-2" /> {t('adminLoading') || 'Chargement...'}</div>
      ) : error ? (
        <div className="p-6 text-center text-sm text-red-400 bg-[#061D32] border border-[#17334D] rounded-xl">{error}</div>
      ) : (
        <>
          <div className="hidden md:block bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#17334D]">
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminTitle')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminTendersCity')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminBudget')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminDeadline')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminStatus')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map(item => (
                    <Fragment key={item.id}>
                      <tr
                        className="border-b border-[#17334D] hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-white max-w-xs truncate">{item.title}</td>
                        <td className="px-4 py-3 text-sm text-[#B9BBC8]">{item.location_city || '—'}</td>
                        <td className="px-4 py-3 text-sm text-white">{formatBudget(item)}</td>
                        <td className="px-4 py-3 text-sm text-[#B9BBC8]">{formatDeadline(item)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[item.status] || 'text-[#B9BBC8] bg-[#031B30]'}`}>{item.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {expandedId === item.id ? <ChevronUp size={16} className="text-orange" /> : <ChevronDown size={16} className="text-[#B9BBC8]" />}
                        </td>
                      </tr>
                      {expandedId === item.id && (
                        <tr className="bg-[#031B30]">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-[#B9BBC8] mr-1">{t('adminTendersChangeStatus')}</span>
                              {STATUS_OPTIONS.map(s => (
                                <button
                                  key={s}
                                  disabled={updatingId === item.id || s === item.status}
                                  onClick={() => handleStatusChange(item, s)}
                                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors disabled:opacity-40 ${s === item.status ? 'border-orange text-orange' : 'border-[#17334D] text-white hover:border-orange/50'}`}
                                >
                                  {s === 'active' ? <EyeIcon size={12} /> : <EyeOff size={12} />} {s}
                                </button>
                              ))}
                              {updatingId === item.id && <Loader2 size={14} className="animate-spin text-orange" />}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {opportunities.length === 0 && (
              <div className="p-10 text-center"><p className="text-sm text-[#B9BBC8]">{t('adminNoResults')}</p></div>
            )}
          </div>

          <div className="md:hidden space-y-3">
            {opportunities.map(item => (
              <div key={item.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>
                    <p className="text-xs text-[#B9BBC8] mt-0.5">{item.location_city || '—'}</p>
                    <div className="mt-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[item.status] || 'text-[#B9BBC8] bg-[#031B30]'}`}>{item.status}</span>
                    </div>
                  </div>
                  {expandedId === item.id ? <ChevronUp size={16} className="text-orange shrink-0" /> : <ChevronDown size={16} className="text-[#B9BBC8] shrink-0" />}
                </div>
                {expandedId === item.id && (
                  <div className="mt-4 pt-4 border-t border-[#17334D]">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div><p className="text-[10px] text-[#B9BBC8] mb-0.5">{t('adminTendersMobileBudget')}</p><p className="text-xs font-semibold text-white">{formatBudget(item)}</p></div>
                      <div><p className="text-[10px] text-[#B9BBC8] mb-0.5">{t('adminTendersMobileDeadline')}</p><p className="text-xs font-semibold text-white">{formatDeadline(item)}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map(s => (
                        <button key={s} disabled={updatingId === item.id || s === item.status} onClick={() => handleStatusChange(item, s)} className={`text-xs px-3 py-2 rounded-lg border transition-colors disabled:opacity-40 ${s === item.status ? 'border-orange text-orange' : 'border-[#17334D] text-white'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {opportunities.length === 0 && (
              <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-8 text-center"><p className="text-sm text-[#B9BBC8]">{t('adminNoResults')}</p></div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}