import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Phone, Building2 } from 'lucide-react';
import { AdminLayout } from '@/pages/AdminLayout';
import { adminApi, getApiErrorMessage, type ApiLeadJourneyFull } from '@/lib/apiClient';

// Target of the md_journey_url link stored on HubSpot contacts and deals. Reached behind RequireAuth adminOnly,
// so an unauthenticated visitor is sent to /connexion and brought back here after login.
const EVENT_LABEL: Record<string, string> = {
  search: 'Recherche',
  offer_view: 'Annonce consultée',
  view_opportunity: 'Annonce consultée',
  company_selected: 'Entreprise sélectionnée',
  analysis_started: 'Analyse démarrée',
  analysis_completed: 'Analyse terminée',
  dossier_preview: 'Aperçu du dossier',
  dossier_requested: 'Dossier demandé',
  callback_requested: 'Rappel demandé',
  appointment_booked: 'Rendez-vous réservé',
};

const REQUEST_LABEL: Record<string, string> = {
  appointment_modal: 'Rendez-vous',
  callback: 'Rappel',
  dossier: 'Dossier',
};

const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminLeadJourney() {
  const { leadId = '' } = useParams();
  const [data, setData] = useState<ApiLeadJourneyFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('all');
  const [session, setSession] = useState('all');

  useEffect(() => {
    let alive = true;
    setData(null); setError(null);
    adminApi.leadJourneyFull(leadId)
      .then(d => { if (alive) setData(d); })
      .catch(err => { if (alive) setError(getApiErrorMessage(err, 'Impossible de charger le parcours.')); });
    return () => { alive = false; };
  }, [leadId]);

  const sessionIds = useMemo(() => Array.from(new Set((data?.history || []).map(e => e.session_id))), [data]);
  const types = useMemo(() => Array.from(new Set((data?.history || []).map(e => e.event_type))), [data]);
  // newest first for reading; the API already returns the complete history (never only the last search)
  const events = useMemo(
    () => (data?.history || []).filter(e => (type === 'all' || e.event_type === type) && (session === 'all' || e.session_id === session)).slice().reverse(),
    [data, type, session]
  );

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <Link to="/admin/leads" className="inline-flex items-center gap-1.5 text-xs text-[#B9BBC8] hover:text-white mb-4"><ArrowLeft size={13} /> Demandes</Link>
        <h1 className="text-xl font-bold text-white mb-4">Parcours détaillé du visiteur</h1>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {!data && !error && <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><Loader2 size={14} className="animate-spin" /> Chargement…</div>}

        {data && (
          <>
            <div className="bg-[#0A2540] border border-[#17334D] rounded-xl p-4 mb-4 text-sm text-white space-y-1.5">
              <div className="font-semibold">{[data.contact.firstName, data.contact.lastName].filter(Boolean).join(' ') || 'Contact sans nom'}</div>
              {data.contact.email && <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><Mail size={13} /> {data.contact.email}</div>}
              {data.contact.phone && <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><Phone size={13} /> {data.contact.phone}</div>}
              {data.contact.companyName && <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><Building2 size={13} /> {data.contact.companyName}</div>}
              <div className="text-xs text-[#5B6B80] pt-1">
                {data.sessions} visite{data.sessions > 1 ? 's' : ''} · {data.history.length} événement{data.history.length > 1 ? 's' : ''} · {data.requests.length} demande{data.requests.length > 1 ? 's' : ''}
                {data.requests.length > 0 && ` (${data.requests.map(r => `${REQUEST_LABEL[r.lead_source || ''] || r.lead_source || 'Demande'} ${fmt(r.created_at)}`).join(', ')})`}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <select value={type} onChange={e => setType(e.target.value)} className="bg-[#031B30] border border-[#17334D] text-white text-xs rounded-lg px-2 py-1.5">
                <option value="all">Tous les événements</option>
                {types.map(t => <option key={t} value={t}>{EVENT_LABEL[t] || t}</option>)}
              </select>
              {sessionIds.length > 1 && (
                <select value={session} onChange={e => setSession(e.target.value)} className="bg-[#031B30] border border-[#17334D] text-white text-xs rounded-lg px-2 py-1.5">
                  <option value="all">Toutes les visites</option>
                  {sessionIds.map((s, i) => <option key={s} value={s}>Visite {i + 1}</option>)}
                </select>
              )}
            </div>

            {events.length === 0 ? (
              <p className="text-xs text-[#B9BBC8]">Aucun événement enregistré.</p>
            ) : (
              <div className="space-y-2">
                {events.map((ev, i) => (
                  <div key={ev.event_id || i} className="bg-[#0A2540] border border-[#17334D] rounded-lg px-3 py-2 text-xs">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <span className="text-white font-medium">{EVENT_LABEL[ev.event_type] || ev.event_type}</span>
                      <span className="text-[#5B6B80]">{fmt(ev.created_at)}</span>
                      {sessionIds.length > 1 && <span className="text-[#5B6B80]">Visite {sessionIds.indexOf(ev.session_id) + 1}</span>}
                    </div>
                    {ev.event_label && <div className="text-[#B9BBC8] mt-0.5">{ev.event_label}</div>}
                    <div className="text-[#5B6B80] mt-0.5 flex flex-wrap gap-x-3">
                      {ev.siret && <span>SIRET {ev.siret}</span>}
                      {ev.opportunity_id && <span>Marché {ev.opportunity_id}</span>}
                      {ev.lot_ref && <span>Lot {ev.lot_ref}</span>}
                      {ev.analysis_id && <span>Analyse {ev.analysis_id}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
