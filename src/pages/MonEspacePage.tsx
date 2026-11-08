import HelpOptions from '@/components/fiche/HelpOptions';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { metaOf, setMeta } from '@/lib/favMeta';
import { suiviApi, opportunitiesApi, siretApi, type SuiviDossier, type ApiOpportunity } from '@/lib/apiClient';
import { getSessionId } from '@/lib/visitorTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { MiniProgress, stateLine } from '@/components/suivi/DossierTimeline';
import InstallOffer from '@/components/pwa/InstallOffer';
import DocumentsTab from '@/components/espace/DocumentsTab';
import SecurityCard from '@/components/espace/SecurityCard';
import SavedSearchesTab from '@/components/espace/SavedSearchesTab';
import ProfilePhoto from '@/components/espace/ProfilePhoto';

// « Mon espace » (5 nov.) : mes dossiers suivis, mes favoris, et l'accès aux nouveaux marchés.
// Fonctionne sans compte (ce navigateur) ; une fois connecté par lien e-mail, on retrouve aussi les dossiers liés à
// son adresse vérifiée, depuis n'importe quel appareil.
const daysLeft = (d: string | null) => { if (!d) return null; const n = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); return Number.isFinite(n) ? n : null; };
const JOURNEY: Record<string, string> = { public_procurement: 'Marché public', tender: 'Appel d’offres privé', subcontracting: 'Sous-traitance' };

// Cartes grises pendant le chargement (comme une appli bancaire), plutôt qu'un texte « Chargement… ».
function Skeleton() {
  return <div className="flex flex-col gap-2" aria-hidden>{[0, 1].map(i => <div key={i} className="h-[92px] animate-pulse rounded-[14px] border border-[#22385A] bg-[#12233A]" />)}</div>;
}

export default function MonEspacePage() {
  const sessionId = useMemo(() => getSessionId(), []);
  const { isAuthenticated, company } = useAuth();
  const { savedIds, loading: favLoading } = useFavorites();
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') === 'favoris' ? 'favoris' : params.get('onglet') === 'documents' ? 'documents' : params.get('onglet') === 'recherches' ? 'recherches' : 'dossiers';
  const [dossiers, setDossiers] = useState<SuiviDossier[] | null>(null);
  const [favs, setFavs] = useState<ApiOpportunity[] | null>(null);
  const [favError, setFavError] = useState(false);
  const [favRetry, setFavRetry] = useState(0);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => { suiviApi.list(sessionId).then(setDossiers).catch(() => setDossiers([])); }, [sessionId]);
  useEffect(() => { if (!isAuthenticated) siretApi.status(sessionId).then(s => setName(s?.company?.name || null)).catch(() => {}); }, [isAuthenticated, sessionId]);
  useEffect(() => {
    let live = true;
    // 7 nov. : tant que les favoris se chargent, on n'affiche pas « aucun favori » (il apparaissait une seconde).
    setFavError(false);
    setFavs(null);
    if (favLoading) return () => { live = false; };
    // Include local saves that could not yet be attached to the account.
    // A network/server error must never turn a saved selection into "zero".
    opportunitiesApi.getMany([...savedIds])
      .then(r => { if (live) setFavs(r); })
      .catch(() => { if (live) setFavError(true); });
    return () => { live = false; };
  }, [savedIds, favLoading, favRetry]);

  const who = (isAuthenticated ? company?.name : name) || null;
  const actions = (dossiers || []).filter(d => d.steps.some(s => s.state === 'action')).length;
  const card = 'block rounded-[14px] border bg-[#12233A] p-3';

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 bg-[#0A1628] px-4 pb-28 pt-4 text-[#F2F5F9]" style={{ fontFamily: '"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif' }}>
      <div>
        <span className="text-[12px] font-extrabold uppercase tracking-[.06em] text-[#FB923C]">Mon espace</span>
        <h1 className="mt-0.5 text-[22px] font-extrabold leading-tight">{who ? `Bonjour, ${who}` : 'Votre espace'}</h1>
        {who && <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#123B2A] px-2.5 py-1 text-[12px] font-bold text-[#6EE7B7]">✓ Entreprise identifiée par son SIRET</span>}
        <p className="mt-1 text-[14px] text-[#B4C1D3]">{dossiers == null ? '\u00a0' : actions ? `${actions} action${actions > 1 ? 's' : ''} vous attend${actions > 1 ? 'ent' : ''}` : 'Suivez vos dossiers sans avoir à appeler.'}</p>
      </div>

      <ProfilePhoto />

      <div className="flex gap-1.5" role="tablist">
        {([['dossiers', `Dossiers${dossiers ? ' · ' + dossiers.length : ''}`], ['favoris', `Enregistrés${!favLoading || savedIds.size ? ' · ' + savedIds.size : ''}`], ['recherches', 'Mes suivis'], ['documents', 'Documents']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setParams(k === 'dossiers' ? {} : { onglet: k })}
            className={`min-h-[44px] flex-1 rounded-[10px] border px-1 text-[12.5px] font-bold ${tab === k ? 'border-[#3B5A86] bg-[#1E3352] text-white' : 'border-[#2B4468] text-[#B4C1D3]'}`}>{l}</button>))}
      </div>

      {tab === 'dossiers' && (dossiers == null ? <Skeleton /> : dossiers.length === 0 ? (
        <div className={`${card} border-[#22385A] text-[14px] text-[#D6E0EC]`}>
          Aucun dossier suivi pour l’instant. Sur la fiche d’un marché, recevez votre dossier puis touchez <b>« Confier à Elena »</b> : son avancement s’affichera ici.
          <Link to="/vos-marches" className="mt-3 flex min-h-[46px] items-center justify-center rounded-xl bg-[#F97316] font-extrabold text-white">Voir mes marchés</Link>
        </div>
      ) : dossiers.map(d => {
        const st = stateLine(d.steps); const n = daysLeft(d.deadline);
        return (
          <Link key={d.id} to={`/mon-dossier/${d.opportunityId}`} className={`${card} ${st.tone === 'action' ? 'border-[#B45309]' : 'border-[#22385A]'}`}>
            <div className="flex justify-between gap-2"><b className="text-[14.5px] leading-tight">{d.title}</b>{n != null && <small className="shrink-0 whitespace-nowrap text-[12px] text-[#B4C1D3]">{n >= 0 ? `J-${n}` : 'Clôturé'}</small>}</div>
            <small className="text-[12px] text-[#B4C1D3]">{[JOURNEY[d.journey || ''] , d.buyer, d.city].filter(Boolean).join(' · ')}</small>
            <MiniProgress steps={d.steps} />
            <div className={`mt-1.5 text-[12.5px] font-extrabold ${st.tone === 'action' ? 'text-[#FCD34D]' : st.tone === 'done' ? 'text-[#6EE7B7]' : 'text-[#FDBA74]'}`}>● {st.text}</div>
          </Link>);
      }))}

      {tab === 'favoris' && (favError ? (
        <div role="alert" className={`${card} border-[#B45309] text-[14px] text-[#D6E0EC]`}>
          Vos annonces enregistrées n’ont pas pu être chargées. Réessayez dans un instant.
          <button type="button" onClick={() => setFavRetry(n => n + 1)} className="mt-2 flex min-h-[44px] items-center font-bold text-[#FB923C] underline">Réessayer</button>
        </div>
      ) : favs == null ? <Skeleton /> : savedIds.size === 0 ? (
        <div className={`${card} border-[#22385A] text-[14px] text-[#D6E0EC]`}>Aucun favori. Touchez l’étoile ☆ sur une annonce pour la retrouver ici.</div>
      ) : <>
        {favs.length < savedIds.size && <p role="status" className="text-[14px] text-[#B4C1D3]">
          {savedIds.size - favs.length} annonce{savedIds.size - favs.length > 1 ? 's enregistrées ne sont plus accessibles' : ' enregistrée n’est plus accessible'}. Vos autres favoris restent disponibles ci-dessous.
        </p>}
        {/* 7 nov. (Hedi) : simple : la liste des annonces enregistrées, une note facultative. Rien d'autre. */}
        {favs.map(o => { const m = metaOf(o.id); return (
        <div key={o.id} className={`${card} border-[#22385A]`}>
          <Link to={`/opportunites/${o.id}`} className="block"><b className="text-[14.5px] leading-tight">{o.title}</b>
            <small className="block text-[12px] text-[#B4C1D3]">{[o.buyer_name, o.location_city, o.deadline ? `remise le ${new Date(o.deadline as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : null].filter(Boolean).join(' · ')}</small></Link>
          <input defaultValue={m.note} onBlur={e => setMeta(o.id, { note: e.target.value })} maxLength={200} placeholder="Ajouter une note (facultatif)" aria-label="Note personnelle"
            className="mt-2 h-[40px] w-full rounded-lg border border-[#2B4468] bg-[#0A1628] px-2 text-[13.5px] text-[#F2F5F9] placeholder:text-[#6B7A90]" />
          <HelpOptions compact reference={o.source_reference || o.id.slice(0, 8)} title={o.title} />
        </div>); })}
      </>)}

      {tab === 'recherches' && <SavedSearchesTab sessionId={sessionId} />}

      {tab === 'documents' && (isAuthenticated ? <DocumentsTab /> : (
        <div className={`${card} border-[#22385A] text-[14px] text-[#D6E0EC]`}>
          Kbis, attestation URSSAF, assurances : déposez-les une fois, Elena les reprend dans vos dossiers et vous voyez ici quand les renouveler. Il faut pour cela <Link to="/connexion?next=/mon-espace?onglet=documents" className="font-bold text-[#FB923C] underline">vous connecter avec votre e-mail</Link>, pour que vos documents restent privés.
        </div>))}

      <Link to="/vos-marches" className="flex min-h-[48px] items-center justify-center rounded-xl border-2 border-[#2B4468] text-[14.5px] font-bold">Voir les nouveaux marchés</Link>

      {isAuthenticated && <SecurityCard />}
      {!isAuthenticated && (
        <p className="rounded-[14px] border border-[#22385A] bg-[#0F1F35] p-3 text-[13px] text-[#B4C1D3]">
          Votre espace est gardé sur ce téléphone. Pour le retrouver sur un autre appareil, <Link to="/connexion?next=/mon-espace" className="font-bold text-[#FB923C] underline">connectez-vous avec votre e-mail</Link>.
        </p>)}
      <InstallOffer context="espace" always />
      {isAuthenticated && <Link to="/tableau-de-bord" className="text-center text-[13.5px] font-bold text-[#FB923C] underline">Mon compte et mes documents</Link>}
    </main>
  );
}

