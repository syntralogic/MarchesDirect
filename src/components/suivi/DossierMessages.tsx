import { useEffect, useRef, useState } from 'react';
import { messagesApi, getApiErrorMessage, type SuiviMessage } from '@/lib/apiClient';
import { ELENA } from '@/data/homeContent';

// « Écrire à Elena » dans le dossier (5 nov.), comme « Écrire à mon conseiller » d'une banque en ligne.
// Le message arrive dans HubSpot sur la transaction du dossier ; la réponse d'Elena revient ici.
const fmt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });

export default function DossierMessages({ opportunityId, sessionId }: { opportunityId: string; sessionId: string }) {
  const [list, setList] = useState<SuiviMessage[] | null>(null);
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    const load = () => messagesApi.list(opportunityId, sessionId).then(m => { if (live) setList(m); }).catch(() => { if (live) setList(l => l ?? []); });
    load(); const t = window.setInterval(load, 60000);
    return () => { live = false; window.clearInterval(t); };
  }, [opportunityId, sessionId]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [list?.length]);
  const send = async () => {
    const b = text.trim(); if (b.length < 2) return;
    setBusy(true); setErr(null);
    try { setList(await messagesApi.send(opportunityId, sessionId, b)); setText(''); }
    catch (e) { setErr(getApiErrorMessage(e, 'Le message n’est pas parti. Réessayez.')); }
    finally { setBusy(false); }
  };
  return (
    <section className="flex flex-col gap-2 rounded-[18px] border border-[#22385A] bg-[#12233A] p-3.5" aria-label="Messages avec Elena">
      <b className="text-[15.5px]">Écrire à {ELENA.name.split(' ')[0]}</b>
      <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto">
        {list == null ? <div className="h-12 animate-pulse rounded-xl bg-[#1C2B44]" aria-hidden />
          : list.length === 0 ? <p className="text-[13px] text-[#B4C1D3]">Une question sur votre dossier, une pièce à signaler ? Écrivez ici : {ELENA.name.split(' ')[0]} vous répond dans ce fil, en général dans la journée (9 h – 18 h).</p>
          : list.map(m => (
            <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-[14px] leading-snug ${m.author === 'client' ? 'self-end rounded-br-md bg-[#C2410C] text-white' : 'self-start rounded-bl-md bg-[#1E3352] text-[#F2F5F9]'}`}>
              <p className="whitespace-pre-line">{m.body}</p>
              <span className={`mt-0.5 block text-[11px] ${m.author === 'client' ? 'text-[#FFE9DC]' : 'text-[#B4C1D3]'}`}>{m.author === 'elena' ? `${ELENA.name.split(' ')[0]} · ` : ''}{fmt(m.at)}</span>
            </div>))}
        <div ref={end} />
      </div>
      <label htmlFor="msg-elena" className="sr-only">Votre message</label>
      <textarea id="msg-elena" value={text} onChange={e => setText(e.target.value)} maxLength={2000} rows={3} placeholder="Votre message à Elena…"
        className="w-full rounded-xl border-2 border-[#C9D6E8] bg-white px-3 py-2 text-[16px] text-[#0A1628] placeholder:text-[#8A97A8] focus:border-[#F97316] focus:outline-none" />
      {err && <p role="alert" className="text-[13px] text-[#FCA5A5]">{err}</p>}
      <button type="button" onClick={send} disabled={busy || text.trim().length < 2} className="flex min-h-[48px] items-center justify-center rounded-xl bg-[#F97316] text-[15px] font-extrabold text-white disabled:opacity-50">{busy ? 'Envoi…' : 'Envoyer'}</button>
    </section>
  );
}
