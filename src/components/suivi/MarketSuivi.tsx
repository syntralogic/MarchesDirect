import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Download, Send } from 'lucide-react';
import { suiviApi, siretApi, getApiErrorMessage, type SuiviStep } from '@/lib/apiClient';
import { useFavorites } from '@/contexts/FavoritesContext';
import DossierTimeline from './DossierTimeline';
import { pushState, subscribePush } from '@/lib/pwa';

// « Votre parcours sur ce marché » : favori, dossier, confier à Elena, puis la frise commune (5 nov.).
// Rien n'est inventé : la frise vient du serveur (demande réelle, suivi HubSpot) ; tant qu'elle charge, on affiche
// seulement ce que la page sait déjà (entreprise reconnue, marché analysé).
type Props = { opportunityId: string; sessionId: string; analysed: boolean; onDossier: () => void; fileName: string; refreshKey?: unknown; compact?: boolean; light?: boolean };

export default function MarketSuivi({ opportunityId, sessionId, analysed, onDossier, fileName, refreshKey, compact, light }: Props) {
  const { isSaved, toggle } = useFavorites();
  const [steps, setSteps] = useState<SuiviStep[] | null>(null);
  const [entrusted, setEntrusted] = useState(false);
  const [busy, setBusy] = useState<null | 'pdf' | 'confier'>(null);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [push, setPush] = useState<'offer' | 'busy' | 'ok' | 'denied' | null>(null);

  const load = useCallback(() => {
    suiviApi.forMarket(opportunityId, sessionId)
      .then(r => { setSteps(r.dossier ? r.dossier.steps : r.steps || null); setEntrusted(!!r.dossier); })
      .catch(() => setSteps(null));
  }, [opportunityId, sessionId]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const fallback: SuiviStep[] = [
    { key: 'company', label: 'Entreprise reconnue', detail: 'Votre entreprise est identifiée', state: 'done', at: null },
    { key: 'analysis', label: 'Marché analysé', detail: 'Correspondance calculée pour votre entreprise', state: analysed ? 'done' : 'current', at: null },
    { key: 'dossier', label: 'Votre dossier prérempli', detail: 'À votre nom, prêt en un clic, avec un appel d’Elena', state: analysed ? 'current' : 'todo', at: null },
    { key: 'entrusted', label: 'Dossier confié à Elena', detail: 'Elle prépare les pièces et le mémoire technique avec vous', state: 'todo', at: null },
    { key: 'signature', label: 'Signature et dépôt', detail: 'Dépôt avant la date limite (par nous si vous nous confiez la candidature, sur devis)', state: 'todo', at: null },
    { key: 'result', label: 'Résultat', detail: 'Vous êtes prévenu dès la réponse de l’acheteur', state: 'todo', at: null },
  ];
  const shown = steps || fallback;
  const hasDossier = shown.find(s => s.key === 'dossier')?.state === 'done';
  const saved = isSaved(opportunityId);

  const getPdf = async () => {
    if (!hasDossier) { onDossier(); return; }
    setBusy('pdf'); setMsg(null);
    try {
      const b = await siretApi.downloadPrefilledDossier(sessionId, opportunityId);
      if (!b || !b.size) throw new Error('vide');
      const url = URL.createObjectURL(b); const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch { setMsg({ tone: 'err', text: 'Le dossier n’a pas pu être téléchargé. Réessayez dans un instant.' }); }
    finally { setBusy(null); }
  };
  const confier = async () => {
    if (!hasDossier) { setMsg({ tone: 'ok', text: 'Recevez d’abord votre dossier : Elena a besoin de votre numéro pour vous appeler.' }); onDossier(); return; }
    setBusy('confier'); setMsg(null);
    try {
      const d = await suiviApi.confier(opportunityId, sessionId);
      if (d) { setSteps(d.steps); setEntrusted(true); }
      if (pushState() === 'default') setPush('offer');
      setMsg({ tone: 'ok', text: 'C’est noté : Elena reprend votre dossier et vous contacte. Suivez son avancement ici et dans votre espace.' });
    } catch (e) { setMsg({ tone: 'err', text: getApiErrorMessage(e, 'L’envoi à Elena a échoué. Réessayez.') }); }
    finally { setBusy(null); }
  };

  const act = 'flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[14px] border px-1.5 py-1.5 text-center text-[12.5px] font-bold disabled:opacity-60';
  return (
    <section className="flex flex-col gap-3" aria-label="Votre parcours sur ce marché">
      {!compact && <div><span className="text-[12px] font-extrabold uppercase tracking-[.06em] text-[#FB923C]">Ce marché et vous</span>
        <h2 className="mt-0.5 text-[19px] font-extrabold leading-tight">Votre parcours sur ce marché</h2></div>}
      {/* Fiche, avant le dossier : le bouton principal est juste au-dessus, on n'en remet pas (pas de surcharge). */}
      {!(light && !hasDossier) && <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => toggle(opportunityId)} aria-pressed={saved}
          className={`${act} ${saved ? 'border-[#FB923C] bg-[rgba(194,65,12,.22)] text-white' : 'border-[#2B4468] text-[#D6E0EC]'}`}>
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} aria-hidden />{saved ? 'Dans mes favoris' : 'Mettre en favori'}
        </button>
        <button type="button" onClick={getPdf} disabled={busy === 'pdf'} className={`${act} border-[#F97316] bg-[#F97316] text-white`}>
          <Download size={18} aria-hidden />{busy === 'pdf' ? 'Préparation…' : hasDossier ? 'Mon dossier' : 'Recevoir mon dossier'}
        </button>
        <button type="button" onClick={confier} disabled={busy === 'confier' || entrusted}
          className={`${act} ${entrusted ? 'border-[#1E6B4A] bg-[#123B2A] text-[#6EE7B7]' : 'border-[#2B4468] text-[#D6E0EC]'}`}>
          <Send size={18} aria-hidden />{entrusted ? 'Confié à Elena ✓' : busy === 'confier' ? 'Envoi…' : 'Confier à Elena'}
        </button>
      </div>}
      {msg && <p role="status" className={`rounded-xl px-3 py-2 text-[13.5px] ${msg.tone === 'ok' ? 'bg-[#123B2A] text-[#6EE7B7]' : 'bg-[#2A1212] text-[#FCA5A5]'}`}>{msg.text}</p>}
      {(push === 'offer' || push === 'busy') && (
        <button type="button" disabled={push === 'busy'} onClick={async () => { setPush('busy'); const r = await subscribePush(sessionId); setPush(r === 'ok' ? 'ok' : r === 'denied' ? 'denied' : null); }}
          className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border-2 border-[#FB923C] px-3 text-[14px] font-extrabold text-white disabled:opacity-60">
          🔔 Être prévenu sur ce téléphone quand mon dossier avance</button>)}
      {push === 'ok' && <p role="status" className="rounded-xl bg-[#123B2A] px-3 py-2 text-[13.5px] text-[#6EE7B7]">C’est activé : vous recevrez une notification à chaque étape.</p>}
      {push === 'denied' && <p className="text-[12.5px] text-[#B4C1D3]">Notifications refusées : vous pourrez les activer plus tard dans les réglages du téléphone.</p>}
      <div className="rounded-[18px] border border-[#22385A] bg-[#12233A] p-3.5">
        <DossierTimeline steps={shown} renderAction={s => s.key === 'dossier' && s.state === 'current' && !light
          ? <button type="button" onClick={onDossier} className="flex min-h-[46px] w-full items-center justify-center rounded-xl bg-[#F97316] px-3 text-[14.5px] font-extrabold text-white">Recevoir mon dossier et faire le point</button>
          : s.key === 'entrusted' && s.state === 'current' && !entrusted && hasDossier
            ? <button type="button" onClick={confier} className="flex min-h-[44px] w-full items-center justify-center rounded-xl border-2 border-[#FB923C] px-3 text-[14px] font-extrabold text-white">Confier mon dossier à Elena</button>
            : null} />
      </div>
      {entrusted && <Link to={`/mon-dossier/${opportunityId}`} className="flex min-h-[46px] items-center justify-center rounded-xl border-2 border-[#2B4468] text-[14px] font-bold">Suivre mon dossier et écrire à Elena</Link>}
      <p className="text-[12px] leading-snug text-[#B4C1D3]">Le même suivi continue dans <Link to="/mon-espace" className="font-bold text-[#FB923C] underline">votre espace</Link> : pas besoin d’appeler pour savoir où en est votre dossier.</p>
    </section>
  );
}
