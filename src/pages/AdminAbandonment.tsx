import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminLayout } from '@/pages/AdminLayout';
import { adminApi, getApiErrorMessage, type ApiAbandonmentReport } from '@/lib/apiClient';

const STEP_LABEL: Record<string, string> = {
  search: 'Recherche',
  offer_view: 'Annonce consultée',
  view_opportunity: 'Annonce consultée',
  company_selected: 'Entreprise sélectionnée',
  analysis_started: 'Analyse démarrée',
  analysis_completed: 'Analyse terminée',
  dossier_preview: 'Aperçu du dossier',
  request: 'Demande (dossier, rappel ou rendez-vous)',
  dossier_requested: 'Dossier demandé',
  callback_requested: 'Rappel demandé',
  appointment_booked: 'Rendez-vous réservé',
};

// Where visitors stop, computed from the Supabase event journal (one visitor = one session).
export default function AdminAbandonment() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ApiAbandonmentReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null); setError(null);
    adminApi.abandonmentReport(days)
      .then(d => { if (alive) setData(d); })
      .catch(err => { if (alive) setError(getApiErrorMessage(err, 'Impossible de charger le rapport.')); });
    return () => { alive = false; };
  }, [days]);

  const max = Math.max(1, ...(data?.funnel.map(f => f.sessions) || [1]));

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white">Abandons du parcours</h1>
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="bg-[#031B30] border border-[#17334D] text-white text-xs rounded-lg px-2 py-1.5">
            {[7, 30, 90, 365].map(d => <option key={d} value={d}>{d} derniers jours</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!data && !error && <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><Loader2 size={14} className="animate-spin" /> Chargement…</div>}
        {data && (
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-white mb-2">Visiteurs (sessions) par étape</h2>
              <div className="space-y-1.5">
                {data.funnel.map(f => (
                  <div key={f.step} className="text-xs">
                    <div className="flex justify-between text-[#B9BBC8] mb-0.5">
                      <span className="text-white">{STEP_LABEL[f.step] || f.step}</span>
                      <span>{f.sessions}{f.pctOfPrevious !== null && ` · ${f.pctOfPrevious} % de l'étape précédente`}</span>
                    </div>
                    <div className="h-2 bg-[#031B30] rounded"><div className="h-2 bg-orange rounded" style={{ width: `${(f.sessions / max) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#5B6B80] mt-2">Une étape compte les visiteurs qui l'ont atteinte, sans exiger les précédentes (un lien direct vers une annonce saute la recherche).</p>
            </section>

            <section className="text-xs text-[#B9BBC8] space-y-1">
              <h2 className="text-sm font-semibold text-white mb-1">Points d'abandon</h2>
              <div>Analyses démarrées : <b className="text-white">{data.analyses.started}</b> · terminées : <b className="text-white">{data.analyses.completed}</b> · abandonnées : <b className="text-white">{data.analyses.abandoned}</b></div>
              <div>Aperçu du dossier sans demande ensuite : <b className="text-white">{data.dossierPreviewWithoutRequest}</b></div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-white mb-2">Dernière étape des visiteurs sans demande</h2>
              {data.lastStepOfSessionsWithoutRequest.length === 0 ? (
                <p className="text-xs text-[#B9BBC8]">Aucune donnée sur la période.</p>
              ) : (
                <table className="text-xs w-full">
                  <tbody>
                    {data.lastStepOfSessionsWithoutRequest.map(r => (
                      <tr key={r.step} className="border-b border-[#17334D]"><td className="py-1.5 text-white">{STEP_LABEL[r.step] || r.step}</td><td className="py-1.5 text-right text-[#B9BBC8]">{r.n}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
