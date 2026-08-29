import { useEffect, useState } from 'react';
import { Loader2, Mail, Phone, Building2, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';
import { adminApi, getApiErrorMessage, type ApiAdminOpportunityLead } from '@/lib/apiClient';

const STATUS_OPTIONS = ['pending', 'converted', 'lost'] as const;

const journeyLabel: Record<string, string> = {
  public_procurement: 'Marché public',
  tender: "Appel d'offres",
  subcontracting: 'Sous-traitance',
};

export default function AdminLeads() {
  const { t } = useLang();
  const [status, setStatus] = useState('all');
  const [leads, setLeads] = useState<ApiAdminOpportunityLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantingId, setGrantingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.opportunityLeads({ status: status === 'all' ? undefined : status, limit: 100 })
      .then(data => setLeads(data.results))
      .catch(err => setError(getApiErrorMessage(err, 'Impossible de charger les demandes.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGrant = async (lead: ApiAdminOpportunityLead) => {
    setGrantingId(lead.id);
    try {
      await adminApi.grantOpportunityAccess(lead.id);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, access_level: 'level3', status: 'converted' } : l));
      showToast('Accès complet accordé');
    } catch (err) {
      showToast(getApiErrorMessage(err, "Échec de l'octroi d'accès."), 'error');
    } finally {
      setGrantingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'text-orange bg-orange/10',
    converted: 'text-green-400 bg-green-400/10',
    lost: 'text-[#B9BBC8] bg-[#031B30]',
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{t('adminLeads')}</h1>
          <p className="text-sm text-[#B9BBC8]">{t('adminManageLeads')}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setStatus('all')} className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${status === 'all' ? 'border-orange text-orange bg-orange/10' : 'border-[#17334D] text-[#B9BBC8]'}`}>Tous</button>
        {STATUS_OPTIONS.map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors capitalize ${status === s ? 'border-orange text-orange bg-orange/10' : 'border-[#17334D] text-[#B9BBC8]'}`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#B9BBC8]"><Loader2 size={20} className="animate-spin mr-2" /> Chargement...</div>
      ) : error ? (
        <div className="p-6 text-center text-sm text-red-400 bg-[#061D32] border border-[#17334D] rounded-xl">{error}</div>
      ) : leads.length === 0 ? (
        <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-10 text-center"><p className="text-sm text-[#B9BBC8]">{t('adminNoResults')}</p></div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => {
            const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || '—';
            const isLevel3 = lead.access_level === 'level3';
            return (
              <div key={lead.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[lead.status] || 'text-[#B9BBC8] bg-[#031B30]'}`}>{lead.status}</span>
                      {lead.journey && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#B9BBC8] bg-[#031B30]">{journeyLabel[lead.journey] || lead.journey}</span>}
                      {isLevel3 && <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-green-400 bg-green-400/10"><ShieldCheck size={10} /> Accès complet</span>}
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{name}</h3>
                    {lead.opportunity_title && (
                      <a href={`/opportunites/${lead.opportunity_id}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-orange hover:underline mb-2 w-fit">
                        {lead.opportunity_title} <ExternalLink size={11} />
                      </a>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#B9BBC8]">
                      <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>
                      {lead.phone && <span className="flex items-center gap-1"><Phone size={12} /> {lead.phone}</span>}
                      {lead.company_name && <span className="flex items-center gap-1"><Building2 size={12} /> {lead.company_name}</span>}
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(lead.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <button
                    disabled={isLevel3 || grantingId === lead.id}
                    onClick={() => handleGrant(lead)}
                    className="shrink-0 flex items-center justify-center gap-1.5 bg-orange text-white font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-orange/90 transition-colors disabled:opacity-40"
                  >
                    {grantingId === lead.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    {isLevel3 ? 'Accès déjà accordé' : "Accorder l'accès complet"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
