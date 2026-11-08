import HelpOptions from '@/components/fiche/HelpOptions';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { metaOf, setMeta } from '@/lib/favMeta';
import { suiviApi, opportunitiesApi, siretApi, espaceApi, type SuiviDossier, type ApiOpportunity, type EspaceFil } from '@/lib/apiClient';
import { getSessionId } from '@/lib/visitorTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { MiniProgress, stateLine } from '@/components/suivi/DossierTimeline';
import InstallOffer from '@/components/pwa/InstallOffer';
import MessagesTab from '@/components/espace/MessagesTab';
import { SinceLastVisit, MarketPulse, NotToMiss, ProfileProgress } from '@/components/espace/EspaceHighlights';
import { useProfilePhoto } from '@/components/ProfileAvatar';
import { pushState, refreshPushSubscription } from '@/lib/pwa';
import SecurityCard from '@/components/espace/SecurityCard';
import SavedSearchesTab from '@/components/espace/SavedSearchesTab';
import { ProfilePhotoCompact } from '@/components/espace/ProfilePhoto';

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
  const { isAuthenticated, company, user } = useAuth();
  const { savedIds, loading: favLoading } = useFavorites();
  const [params, setParams] = useSearchParams();
  // 8 nov. (Hedi) : « Documents » retiré (les pièces sont envoyées une fois à la souscription, pas stockées sur le
  // site) ; « Messages » ouvre l'espace : le fil de tout ce qui concerne l'artisan. Ancien lien ?onglet=documents → Messages.
  const o = params.get('onglet');
  const tab = o === 'favoris' ? 'favoris' : o === 'recherches' ? 'recherches' : o === 'dossiers' ? 'dossiers' : 'messages';
  const [dossiers, setDossiers] = useState<SuiviDossier[] | null>(null);
  const [favs, setFavs] = useState<ApiOpportunity[] | null>(null);
  const [favError, setFavError] = useState(false);
  const [favRetry, setFavRetry] = useState(0);
  const [name, setName] = useState<string | null>(null);
  const [director, setDirector] = useState<string | null>(null);
  const [fil, setFil] = useState<EspaceFil | null>(null);
  const [filError, setFilError] = useState(false);
  const [filRetry, setFilRetry] = useState(0);

  useEffect(() => { suiviApi.list(sessionId).then(setDossiers).catch(() => setDossiers([])); }, [sessionId]);
  useEffect(() => { siretApi.status(sessionId).then(s => { if (!isAuthenticated) setName(s?.company?.name || null); setDirector(s?.company?.director || null); }).catch(() => {}); }, [isAuthenticated, sessionId]);
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

  useEffect(() => {
    if (favLoading) return;
    let live = true; setFilError(false);
    espaceApi.fil(sessionId, [...savedIds]).then(r => { if (live) setFil(r); }).catch(() => { if (live) setFilError(true); });
    return () => { live = false; };
  }, [sessionId, savedIds, favLoading, filRetry, isAuthenticated]);
  const { url: photoUrl } = useProfilePhoto();
  const [pushOn, setPushOn] = useState(() => pushState() === 'granted');
  useEffect(() => { void refreshPushSubscription(sessionId); }, [sessionId]);
  const readAll = () => { espaceApi.lu(sessionId).then(() => setFilRetry(n => n + 1)).catch(() => {}); };

  const who = (isAuthenticated ? company?.name : name) || null;
  // 8 nov. (Hedi : « Bonsoir Eddy, Bonsoir Karim, Verifrance Habitat ») : salutation selon l'heure, prénom du compte, ou
  // à défaut celui du dirigeant connu par le SIRET (le mot qui n'est pas en capitales : « Hedi FATHALLAH » → Hedi).
  const hour = new Date().getHours();
  const hello = hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour';
  const fromDirector = (director || '').split(/\s+/).find(w => /[a-zà-ÿ]/.test(w) && w !== w.toUpperCase()) || null;
  const firstName = (user?.firstName || '').trim() || fromDirector;
  const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  const pretty = (n: string) => (n === n.toUpperCase() ? n.split(/\s+/).map(cap).join(' ') : n);
  const sum = fil?.summary;
  const unreadMsgs = fil ? fil.items.filter(i => i.unread && (i.kind === 'message' || i.kind === 'dossier')).length : 0;
  const tile = 'flex min-h-[84px] flex-col justify-between rounded-[14px] border border-[#22385A] bg-[#12233A] p-3 text-left';
  const actions = (dossiers || []).filter(d => d.steps.some(s => s.state === 'action')).length;
  const card = 'block rounded-[14px] border bg-[#12233A] p-3';

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 bg-[#0A1628] px-4 pb-28 pt-4 text-[#F2F5F9]" style={{ fontFamily: '"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif' }}>
      <div className="flex items-center gap-3">
        <ProfilePhotoCompact />
        <div className="min-w-0 flex-1">
        <span className="text-[12px] font-extrabold uppercase tracking-[.06em] text-[#FB923C]">Mon espace</span>
        <h1 className="mt-0.5 text-[22px] font-extrabold leading-tight">{firstName ? `${hello} ${cap(firstName)}` : `${hello} !`}</h1>
        {who && <p className="truncate text-[14px] font-bold text-[#D6E0EC]">{pretty(who)} <span className="text-[#6EE7B7]" title="Entreprise identifiée par son SIRET" aria-label="Entreprise identifiée par son SIRET">✓</span></p>}
        </div>
        {fil && <ProfileProgress sessionId={sessionId} onPush={() => setPushOn(pushState() === 'granted')} steps={[
        { key: 'siret', label: 'Entreprise identifiée', done: !!who, to: '/vos-marches' },
        { key: 'photo', label: 'Photo ou logo ajouté', done: !!photoUrl },
        { key: 'suivi', label: 'Un suivi créé', done: fil.searches > 0, to: '/mon-espace?onglet=recherches' },
        { key: 'push', label: 'Notifications activées', done: pushOn || pushState() === 'unsupported' },
        { key: 'compte', label: 'Compte connecté (téléphone et ordinateur)', done: isAuthenticated, to: '/connexion?next=/mon-espace' },
      ]} />}
      </div>
      <div>
        <p className="text-[14px] text-[#B4C1D3]">{dossiers == null ? '\u00a0' : actions ? `${actions} action${actions > 1 ? 's' : ''} vous attend${actions > 1 ? 'ent' : ''}` : 'Suivez vos dossiers sans avoir à appeler.'}</p>
      </div>

      {fil && <SinceLastVisit fil={fil} />}
      {fil && <MarketPulse fil={fil} />}

      {/* 8 nov. (Hedi) : tableau de bord. Quatre chiffres réels, chacun ouvre l'endroit où agir. */}
      <div className="grid grid-cols-2 gap-2" aria-label="Votre activité">
        <Link to="/mon-espace?onglet=recherches" className={tile}>
          <span className="text-[26px] font-extrabold leading-none text-[#FB923C]">{sum ? sum.nouveautes : '·'}</span>
          <span className="text-[12.5px] font-bold text-[#D6E0EC]">{sum && sum.nouveautes === 1 ? 'nouvelle annonce' : 'nouvelles annonces'} dans vos recherches</span>
        </Link>
        <Link to="/mon-espace?onglet=favoris" className={tile}>
          <span className={`text-[26px] font-extrabold leading-none ${sum && sum.echeances ? 'text-[#FCD34D]' : 'text-[#F2F5F9]'}`}>{sum ? sum.echeances : '·'}</span>
          <span className="text-[12.5px] font-bold text-[#D6E0EC]">échéance{sum && sum.echeances > 1 ? 's' : ''} dans les 7 jours</span>
        </Link>
        <Link to="/mon-espace" className={tile}>
          <span className={`text-[26px] font-extrabold leading-none ${unreadMsgs ? 'text-[#6EE7B7]' : 'text-[#F2F5F9]'}`}>{fil ? unreadMsgs : '·'}</span>
          <span className="text-[12.5px] font-bold text-[#D6E0EC]">message{unreadMsgs > 1 ? 's' : ''} non lu{unreadMsgs > 1 ? 's' : ''}</span>
        </Link>
        <Link to="/mon-espace?onglet=dossiers" className={tile}>
          <span className="text-[26px] font-extrabold leading-none text-[#F2F5F9]">{sum ? sum.dossiersEnCours : dossiers ? dossiers.length : '·'}</span>
          <span className="text-[12.5px] font-bold text-[#D6E0EC]">dossier{sum && sum.dossiersEnCours > 1 ? 's' : ''} en cours</span>
        </Link>
      </div>

      {fil && <NotToMiss fil={fil} />}


      <div className="flex gap-1.5" role="tablist">
        {([['messages', `Messages${unreadMsgs ? ' · ' + unreadMsgs : ''}`], ['dossiers', `Dossiers${dossiers ? ' · ' + dossiers.length : ''}`], ['favoris', `Enregistrés${!favLoading || savedIds.size ? ' · ' + savedIds.size : ''}`], ['recherches', 'Mes suivis']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setParams(k === 'messages' ? {} : { onglet: k })}
            className={`min-h-[44px] flex-1 rounded-[10px] border px-1 text-[12.5px] font-bold ${tab === k ? 'border-[#3B5A86] bg-[#1E3352] text-white' : 'border-[#2B4468] text-[#B4C1D3]'}`}>{l}</button>))}
      </div>

      {tab === 'messages' && <MessagesTab fil={fil} error={filError} onRetry={() => setFilRetry(n => n + 1)} onReadAll={readAll} />}

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

      <Link to="/vos-marches" className="flex min-h-[48px] items-center justify-center rounded-xl border-2 border-[#2B4468] text-[14.5px] font-bold">Voir les nouveaux marchés</Link>

      {isAuthenticated && <SecurityCard />}
      {!isAuthenticated && (
        <p className="rounded-[14px] border border-[#22385A] bg-[#0F1F35] p-3 text-[13px] text-[#B4C1D3]">
          Votre espace est gardé sur ce téléphone. Pour le retrouver sur un autre appareil, <Link to="/connexion?next=/mon-espace" className="font-bold text-[#FB923C] underline">connectez-vous avec votre e-mail</Link>.
        </p>)}
      <InstallOffer context="espace" always />
      {isAuthenticated && <Link to="/tableau-de-bord" className="text-center text-[13.5px] font-bold text-[#FB923C] underline">Mon compte</Link>}
    </main>
  );
}

