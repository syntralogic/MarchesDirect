import { useState } from 'react';
import { listingReportsApi } from '@/lib/apiClient';

// 7 nov. : signaler une annonce inexacte en un geste. Pas de formulaire de contact, pas de numéro : un motif, un mot
// facultatif, envoyé. L'équipe relit et corrige.
const KINDS: [string, string][] = [['closed', 'Déjà attribuée ou clôturée'], ['deadline', 'Date limite fausse'], ['place', 'Lieu faux'],
  ['trade', 'Mauvais métier'], ['duplicate', 'Doublon'], ['other', 'Autre']];

export default function ReportListing({ opportunityId, sessionId }: { opportunityId: string; sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  if (state === 'sent') return <p role="status" className="text-[13px] text-[#6EE7B7]">Merci, c’est noté : l’équipe vérifie cette annonce.</p>;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="min-h-[40px] self-start text-[13px] text-[#B4C1D3] underline">Une information vous semble inexacte ? Signalez-la</button>;
  const send = async () => {
    if (!kind) return;
    setState('sending');
    try { await listingReportsApi.send(opportunityId, kind, sessionId, comment.trim() || undefined); setState('sent'); } catch { setState('error'); }
  };
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#22385A] bg-[#0F1F35] p-3">
      <b className="text-[14px]">Qu’est-ce qui ne va pas ?</b>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Motif du signalement">
        {KINDS.map(([k, l]) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}
          className={`min-h-[40px] rounded-full border px-3 text-[13px] font-bold ${kind === k ? 'border-[#FB923C] bg-[#3A2312] text-[#FDBA74]' : 'border-[#2B4468] text-[#D6E0EC]'}`}>{l}</button>)}
      </div>
      {kind && <input value={comment} onChange={e => setComment(e.target.value)} maxLength={500} placeholder="Précision (facultatif)" aria-label="Précision facultative"
        className="h-[44px] rounded-xl border border-[#2B4468] bg-[#0A1628] px-3 text-[15px] text-[#F2F5F9]" />}
      <div className="flex items-center gap-3">
        <button type="button" disabled={!kind || state === 'sending'} onClick={send} className="min-h-[44px] rounded-xl bg-[#C2410C] px-4 text-[14px] font-extrabold text-white disabled:opacity-50">{state === 'sending' ? 'Envoi…' : 'Envoyer'}</button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] text-[13px] text-[#B4C1D3] underline">Annuler</button>
      </div>
      {state === 'error' && <p role="alert" className="text-[13px] text-[#FCA5A5]">L’envoi n’a pas abouti. Réessayez dans un instant.</p>}
    </div>
  );
}
