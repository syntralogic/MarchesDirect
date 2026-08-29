import { useEffect, useState } from 'react';
import { Loader2, Search, Ban, Building2 } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { adminApi, getApiErrorMessage, type ApiAdminSubscription } from '@/lib/apiClient';

const STATUS_TABS = ['all', 'active', 'trialing', 'past_due', 'canceled'] as const;

const statusColors: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10',
  trialing: 'text-blue-400 bg-blue-400/10',
  past_due: 'text-orange bg-orange/10',
  canceled: 'text-red-400 bg-red-400/10',
};

function formatMoney(price: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(price);
}

export default function AdminSubscriptions() {
  const [status, setStatus] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [subs, setSubs] = useState<ApiAdminSubscription[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.subscriptions({ status: status === 'all' ? undefined : status, q: query || undefined, limit: 50 })
      .then(data => { setSubs(data.results); setStatusCounts(data.statusCounts); })
      .catch(err => setError(getApiErrorMessage(err, 'Impossible de charger les abonnements.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async (sub: ApiAdminSubscription) => {
    if (!window.confirm(`Annuler l'abonnement de ${sub.company_name} à la fin de la période en cours ?`)) return;
    setCancelingId(sub.id);
    try {
      await adminApi.cancelSubscription(sub.id, false);
      setSubs(prev => prev.map(s => s.id === sub.id ? { ...s, cancel_at_period_end: true } : s));
      showToast('Annulation programmée en fin de période');
    } catch (err) {
      showToast(getApiErrorMessage(err, "Échec de l'annulation."), 'error');
    } finally {
      setCancelingId(null);
    }
  };

  const totalCount = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Gestion des abonnements</h1>
        <p className="text-sm text-[#B9BBC8]">Suivez et gérez les abonnements de toutes les entreprises</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors capitalize ${status === s ? 'border-orange text-orange bg-orange/10' : 'border-[#17334D] text-[#B9BBC8]'}`}
          >
            {s === 'all' ? 'Tous' : s} {s === 'all' ? `(${totalCount})` : statusCounts[s] ? `(${statusCounts[s]})` : ''}
          </button>
        ))}
      </div>

      <form onSubmit={e => { e.preventDefault(); load(); }} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher une entreprise..." className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange" />
        </div>
        <button type="submit" className="flex items-center gap-2 bg-[#061D32] border border-[#17334D] text-[#B9BBC8] px-4 py-2.5 rounded-xl hover:text-white transition-colors text-sm">
          <Search size={16} /> Rechercher
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#B9BBC8]"><Loader2 size={20} className="animate-spin mr-2" /> Chargement...</div>
      ) : error ? (
        <div className="p-6 text-center text-sm text-red-400 bg-[#061D32] border border-[#17334D] rounded-xl">{error}</div>
      ) : subs.length === 0 ? (
        <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-10 text-center"><p className="text-sm text-[#B9BBC8]">Aucun abonnement trouvé.</p></div>
      ) : (
        <div className="space-y-3">
          {subs.map(sub => (
            <div key={sub.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[sub.status] || 'text-[#B9BBC8] bg-[#031B30]'}`}>{sub.status}</span>
                    {sub.cancel_at_period_end && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-orange bg-orange/10">Annulation programmée</span>}
                  </div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-0.5"><Building2 size={13} className="text-[#B9BBC8]" /> {sub.company_name}</h3>
                  <p className="text-xs text-[#B9BBC8] mb-1">{sub.company_email}</p>
                  <p className="text-xs text-[#B9BBC8]">
                    {sub.plan_name} — {formatMoney(sub.price, sub.currency)}/{sub.billing_period === 'yearly' ? 'an' : 'mois'}
                    {sub.current_period_end && ` · Renouvellement le ${new Date(sub.current_period_end).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                {sub.status === 'active' && !sub.cancel_at_period_end && (
                  <button
                    disabled={cancelingId === sub.id}
                    onClick={() => handleCancel(sub)}
                    className="shrink-0 flex items-center justify-center gap-1.5 border border-red-400/40 text-red-400 font-semibold text-xs px-4 py-2.5 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-40"
                  >
                    {cancelingId === sub.id ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
