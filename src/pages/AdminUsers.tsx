import { Fragment, useEffect, useState } from 'react';
import { Search, Ban, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';
import { adminApi, getApiErrorMessage, type ApiAdminCompany } from '@/lib/apiClient';

// Same story as AdminTenders: there's no "create a company account" admin
// endpoint (accounts are created via /auth/register, not by an admin), so
// the old Add/Edit-user modal here only ever mutated local state and is
// gone. What's real: search, filter by status, and suspend/reactivate via
// PATCH /admin/companies/:id/status.
const STATUS_OPTIONS = ['active', 'suspended', 'pending'] as const;

export default function AdminUsers() {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [companies, setCompanies] = useState<ApiAdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.companies({ q: query || undefined, status: status === 'all' ? undefined : status, limit: 50 })
      .then(data => setCompanies(data.results))
      .catch(err => setError(getApiErrorMessage(err, 'Impossible de charger les comptes.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const handleToggleStatus = async (company: ApiAdminCompany) => {
    const newStatus = company.status === 'active' ? 'suspended' : 'active';
    setUpdatingId(company.id);
    try {
      await adminApi.updateCompanyStatus(company.id, newStatus);
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: newStatus } : c));
      showToast(newStatus === 'active' ? 'Compte réactivé' : 'Compte suspendu');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Échec de la mise à jour.'), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const planColors: Record<string, string> = {
    starter: 'text-blue-400 bg-blue-400/10',
    pro: 'text-orange bg-orange/10',
    enterprise: 'text-green-400 bg-green-400/10',
  };
  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    pending: 'text-orange bg-orange/10',
    suspended: 'text-red-400 bg-red-400/10',
  };

  const ownerName = (c: ApiAdminCompany) => `${c.first_name || ''} ${c.last_name || ''}`.trim() || '—';
  const initials = (c: ApiAdminCompany) => (ownerName(c) === '—' ? c.name[0] : ownerName(c).split(' ').map(n => n[0]).join('')).toUpperCase();

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{t('adminUsers')}</h1>
          <p className="text-sm text-[#B9BBC8]">{t('adminManageUsers')}</p>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('adminSearchUsers')} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange" />
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
        <div className="flex items-center justify-center py-16 text-[#B9BBC8]"><Loader2 size={20} className="animate-spin mr-2" /> Chargement...</div>
      ) : error ? (
        <div className="p-6 text-center text-sm text-red-400 bg-[#061D32] border border-[#17334D] rounded-xl">{error}</div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#17334D]">
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminName')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminCompany')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminEmail')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminPlan')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminStatus')}</th>
                    <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(c => (
                    <Fragment key={c.id}>
                      <tr className="border-b border-[#17334D] hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange/20 border border-orange/30 flex items-center justify-center text-xs font-bold text-orange shrink-0">{initials(c)}</div>
                            <span className="text-sm font-semibold text-white">{ownerName(c)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#B9BBC8]">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-[#B9BBC8]">{c.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${planColors[c.subscription_tier || ''] || 'text-[#B9BBC8] bg-[#031B30]'}`}>{c.subscription_tier || 'essai'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[c.status] || 'text-[#B9BBC8] bg-[#031B30]'}`}>{t(`adminStatus_${c.status}`) !== `adminStatus_${c.status}` ? t(`adminStatus_${c.status}`) : c.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {expandedId === c.id ? <ChevronUp size={16} className="text-orange" /> : <ChevronDown size={16} className="text-[#B9BBC8]" />}
                        </td>
                      </tr>
                      {expandedId === c.id && (
                        <tr className="bg-[#031B30]">
                          <td colSpan={6} className="px-4 py-4">
                            <button
                              disabled={updatingId === c.id}
                              onClick={() => handleToggleStatus(c)}
                              className="flex items-center gap-2 text-sm text-yellow-400 bg-[#061D32] border border-yellow-400/20 px-3 py-2 rounded-lg hover:border-yellow-400/50 transition-colors disabled:opacity-40"
                            >
                              {updatingId === c.id ? <Loader2 size={14} className="animate-spin" /> : c.status === 'active' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                              {c.status === 'active' ? t('adminSuspend') : t('adminActivate')}
                            </button>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {companies.length === 0 && <div className="p-10 text-center"><p className="text-sm text-[#B9BBC8]">{t('adminNoResults')}</p></div>}
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="md:hidden space-y-3">
            {companies.map(c => (
              <div key={c.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-orange/20 border border-orange/30 flex items-center justify-center text-xs font-bold text-orange shrink-0">{initials(c)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{ownerName(c)}</h3>
                      <p className="text-xs text-[#B9BBC8] truncate">{c.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${planColors[c.subscription_tier || ''] || 'text-[#B9BBC8] bg-[#031B30]'}`}>{c.subscription_tier || 'essai'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[c.status] || 'text-[#B9BBC8] bg-[#031B30]'}`}>{c.status}</span>
                      </div>
                    </div>
                  </div>
                  {expandedId === c.id ? <ChevronUp size={16} className="text-orange shrink-0" /> : <ChevronDown size={16} className="text-[#B9BBC8] shrink-0" />}
                </div>
                {expandedId === c.id && (
                  <div className="mt-4 pt-4 border-t border-[#17334D]">
                    <p className="text-[10px] text-[#B9BBC8] mb-0.5">{t('adminEmail')}</p>
                    <p className="text-xs font-semibold text-white break-all mb-3">{c.email}</p>
                    <button disabled={updatingId === c.id} onClick={() => handleToggleStatus(c)} className="flex items-center gap-1.5 text-xs text-yellow-400 bg-[#031B30] border border-yellow-400/20 px-3 py-2 rounded-lg disabled:opacity-40">
                      {updatingId === c.id ? <Loader2 size={14} className="animate-spin" /> : c.status === 'active' ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                      {c.status === 'active' ? t('adminSuspend') : t('adminActivate')}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {companies.length === 0 && <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-8 text-center"><p className="text-sm text-[#B9BBC8]">{t('adminNoResults')}</p></div>}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
