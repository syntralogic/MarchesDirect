import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { suiviApi, opportunitiesApi, type SuiviDossier, type SuiviStep, type ApiOpportunity } from '@/lib/apiClient';
import { getSessionId } from '@/lib/visitorTracking';
import DossierTimeline from '@/components/suivi/DossierTimeline';
import { ELENA } from '@/data/homeContent';
import DossierMessages from '@/components/suivi/DossierMessages';

// « Mon dossier » (5 nov.) : la frise d'un dossier suivi, avec ses dates réelles. C'est aussi la cible du QR code du
// dossier PDF. Accès : ce navigateur, ou le compte connecté par e-mail. Sinon : lien vers la fiche du marché.
export default function MonDossierPage() {
  const { id = '' } = useParams<{ id: string }>();
  const sessionId = useMemo(() => getSessionId(), []);
  const [d, setD] = useState<SuiviDossier | null | undefined>(undefined);
  const [steps, setSteps] = useState<SuiviStep[] | null>(null);
  const [opp, setOpp] = useState<ApiOpportunity | null>(null);

  useEffect(() => {
    suiviApi.forMarket(id, sessionId).then(r => { setD(r.dossier); setSteps(r.dossier ? r.dossier.steps : r.steps || null); }).catch(() => setD(null));
    opportunitiesApi.getById(id).then(setOpp).catch(() => {});
  }, [id, sessionId]);

  const title = d?.title || opp?.title || 'Votre dossier';
  const deadline = d?.deadline || (opp?.deadline as string | null) || null;
  const action = steps?.find(s => s.state === 'action');
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 bg-[#0A1628] px-4 pb-28 pt-4 text-[#F2F5F9]" style={{ fontFamily: '"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif' }}>
      <Link to="/mon-espace" className="text-[13.5px] font-semibold text-[#FB923C]">‹ Mon espace</Link>
      <div>
        <span className="text-[12px] font-extrabold uppercase tracking-[.06em] text-[#FB923C]">Mon dossier</span>
        <h1 className="mt-0.5 text-[21px] font-extrabold leading-tight">{title}</h1>
        <p className="mt-1 text-[13.5px] text-[#B4C1D3]">{[d?.buyer || opp?.buyer_name, deadline ? `remise le ${new Date(deadline).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}` : null].filter(Boolean).join(' · ')}</p>
      </div>
      {d === undefined ? <p className="text-[14px] text-[#B4C1D3]">Chargement…</p> : steps ? (
        <>
          {action && <div role="status" className="rounded-[14px] border border-[#B45309] bg-[#2A2012] p-3 text-[14px]"><b className="text-[#FCD34D]">À faire : {action.label}</b><br /><span className="text-[#D6E0EC]">{action.detail}</span></div>}
          <div className="rounded-[18px] border border-[#22385A] bg-[#12233A] p-3.5"><DossierTimeline steps={steps} /></div>
          {d && <DossierMessages opportunityId={id} sessionId={sessionId} />}
          {d && <p className="text-[12px] text-[#B4C1D3]">Dernière mise à jour le {new Date(d.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}.</p>}
          <div className="flex items-center gap-3 rounded-[14px] border border-[#22385A] bg-[#12233A] p-3">
            {ELENA.photo && <img src={ELENA.photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
            <p className="text-[13px] text-[#D6E0EC]"><b>{ELENA.name}</b> · {d ? '« Je vous tiens au courant ici à chaque étape. »' : '« Confiez-moi votre dossier depuis la fiche du marché : je vous accompagne jusqu’au dépôt. »'}</p>
          </div>
        </>
      ) : (
        <div className="rounded-[14px] border border-[#22385A] bg-[#12233A] p-3 text-[14px] text-[#D6E0EC]">
          Ce dossier n’est pas encore suivi sur cet appareil. Ouvrez la fiche du marché pour recevoir votre dossier, ou connectez-vous avec l’e-mail utilisé lors de votre demande.
        </div>)}
      <Link to={`/opportunites/${id}`} className="flex min-h-[48px] items-center justify-center rounded-xl border-2 border-[#2B4468] text-[14.5px] font-bold">Voir la fiche du marché</Link>
    </main>
  );
}
