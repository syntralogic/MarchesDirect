import { useEffect, useState } from 'react';
import { Loader2, Mail, Phone, Building2, Clock, History, Search, FileSearch, Globe, MessageSquare } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';
import { adminApi, getApiErrorMessage, type ApiCrmLead, type ApiVisitorEvent } from '@/lib/apiClient';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const;

const SOURCE_LABEL: Record<string, string> = {
  contact_form: 'Formulaire de contact',
  appointment_modal: 'Prise de rendez-vous',
  callback_modal: 'Demande de rappel',
  website_form: 'Site web',
};

const EVENT_ICON: Record<string, typeof Search> = {
  search: Search,
  view_opportunity: FileSearch,
  view_seo_page: Globe,
};

const STATUS_COLORS: Record<string, string> = {
  new: 'text-orange bg-orange/10',
  contacted: 'text-blue-400 bg-blue-400/10',
  qualified: 'text-blue-400 bg-blue-400/10',
  converted: 'text-green-400 bg-green-400/10',
  lost: 'text-[#B9BBC8] bg-[#031B30]',
};

export default function AdminContacts() {
  const { t } = useLang();
  const [status, setStatus] = useState('all');
  const [leads, setLeads] = useState<ApiCrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [openJourneyId, setOpenJourneyId] = useState<string | null>(null);
  const [journeys, setJourneys] = useState<Record<string, ApiVisitorEvent[]>>({});
  const [journeyLoading, setJourneyLoading] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.contactLeads({ status: status === 'all' ? undefined : status, limit: 100 })
      .then(data => setLeads(data.results))
      .catch(err => setError(getApiErrorMessage(err, 'Impossible de charger les contacts.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (lead: ApiCrmLead, newStatus: string) => {
    setUpdatingId(lead.id);
    try {
      await adminApi.updateContactLeadStatus(lead.id, newStatus);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
    } catch (err) {
      showToast(getApiErrorMessage(err, "Échec de la mise à jour."), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleJourney = async (leadId: string) => {
    if (openJourneyId === leadId) {
      setOpenJourneyId(null);
      return;
    }
    setOpenJourneyId(leadId);
    if (journeys[leadId]) return;
    setJourneyLoading(leadId);
    try {
      const { events } = await adminApi.leadJourney(leadId);
      setJourneys(prev => ({ ...prev, [leadId]: events }));
    } catch (err) {
      showToast(getApiErrorMessage(err, "Impossible de charger le parcours."), 'error');
      setOpenJourneyId(null);
    } finally {
      setJourneyLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{t('adminContacts')}</h1>
          <p className="text-sm text-[#B9BBC8]">{t('adminManageContacts')}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
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
            return (
              <div key={lead.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[lead.status] || 'text-[#B9BBC8] bg-[#031B30]'}`}>{lead.status}</span>
                      {lead.lead_source && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#B9BBC8] bg-[#031B30]">{SOURCE_LABEL[lead.lead_source] || lead.lead_source}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{name}</h3>
                    {lead.message && (
                      <p className="flex items-start gap-1.5 text-xs text-[#B9BBC8] mb-2 whitespace-pre-line">
                        <MessageSquare size={12} className="shrink-0 mt-0.5" /> {lead.message}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#B9BBC8]">
                      {lead.email && <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>}
                      {lead.phone && <span className="flex items-center gap-1"><Phone size={12} /> {lead.phone}</span>}
                      {lead.company_name && <span className="flex items-center gap-1"><Building2 size={12} /> {lead.company_name}</span>}
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(lead.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 min-w-[180px]">
                    <button
                      onClick={() => toggleJourney(lead.id)}
                      className="flex items-center justify-center gap-1.5 border border-[#17334D] text-[#B9BBC8] font-bold text-xs px-4 py-2.5 rounded-lg hover:border-orange/50 hover:text-white transition-colors"
                    >
                      {journeyLoading === lead.id ? <Loader2 size={14} className="animate-spin" /> : <History size={14} />}
                      {openJourneyId === lead.id ? 'Masquer le parcours' : 'Voir le parcours'}
                    </button>
                    <select
                      value={lead.status}
                      disabled={updatingId === lead.id}
                      onChange={e => handleStatusChange(lead, e.target.value)}
                      className="bg-[#031B30] border border-[#17334D] text-white text-xs font-semibold px-3 py-2.5 rounded-lg focus:outline-none focus:border-orange/50 disabled:opacity-40"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {openJourneyId === lead.id && (
                  <div className="mt-4 pt-4 border-t border-[#17334D]">
                    {journeyLoading === lead.id ? (
                      <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><Loader2 size={13} className="animate-spin" /> Chargement du parcours...</div>
                    ) : !journeys[lead.id] || journeys[lead.id].length === 0 ? (
                      <p className="text-xs text-[#B9BBC8]">Aucun parcours enregistré pour ce contact (session non identifiée ou aucune activité suivie avant la demande).</p>
                    ) : (
                      <div className="space-y-2">
                        {journeys[lead.id].map((ev, i) => {
                          const Icon = EVENT_ICON[ev.event_type] || Search;
                          return (
                            <div key={i} className="flex items-start gap-2.5 text-xs">
                              <Icon size={13} className="text-orange shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <span className="text-white">{ev.event_label || ev.event_type}</span>
                                <span className="text-[#5B6B80] ml-2">{new Date(ev.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
