import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { needsApi, type ClientNeed } from '@/lib/apiClient';

// Équipe (7 nov.) : relire les besoins déposés par les donneurs d'ordre, corriger si besoin, publier, refuser ou clôturer.
const STATUS: Record<string, string> = { pending: 'À relire', published: 'Publiés', rejected: 'Refusés', closed: 'Clôturés' };
const euro = (v: unknown) => v == null ? null : `${Number(v).toLocaleString('fr-FR')} €`;
const d = (v: string | null) => v ? new Date(v).toLocaleDateString('fr-FR') : null;

function Need({ n, onDone }: { n: ClientNeed; onDone: () => void }) {
  const [title, setTitle] = useState(n.title);
  const [desc, setDesc] = useState(n.description);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const act = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); setMsg(null); try { await fn(); setMsg(ok); onDone(); } catch { setMsg('Échec, réessayez.'); } finally { setBusy(false); } };
  const facts = [n.journey === 'subcontracting' ? 'Sous-traitance' : 'Travaux (appel d’offres privé)', n.client_kind, `${n.city ? `${n.city} ` : ''}(${n.department})`,
    n.budget_min || n.budget_max ? `Budget ${[euro(n.budget_min), euro(n.budget_max)].filter(Boolean).join(' à ')}` : null,
    n.deadline ? `Réponses avant le ${d(n.deadline)}` : null, n.start_date ? `Démarrage ${d(n.start_date)}` : null, n.recurring ? 'Récurrent' : null].filter(Boolean);
  return (
    <li className="rounded-2xl border border-[#22385A] bg-[#12233A] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-[#B4C1D3]">
        <span><b className="text-[#FB923C]">{n.reference}</b> · déposé le {d(n.created_at)}</span><span>{STATUS[n.status]}</span>
      </div>
      {n.status === 'pending'
        ? <><input value={title} onChange={e => setTitle(e.target.value)} className="mt-2 h-[44px] w-full rounded-lg border border-[#2B4468] bg-[#0A1628] px-3 font-bold" aria-label="Titre" />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="mt-2 min-h-[110px] w-full rounded-lg border border-[#2B4468] bg-[#0A1628] p-3 text-[14px]" aria-label="Description" /></>
        : <><p className="mt-2 font-bold">{n.title}</p><p className="mt-1 whitespace-pre-line text-[14px] text-[#D6E0EC]">{n.description}</p></>}
      <p className="mt-2 text-[13.5px] text-[#D6E0EC]">{facts.join(' · ')}</p>
      {n.trades?.length > 0 && <p className="text-[13px] text-[#B4C1D3]">Métiers : {n.trades.join(', ')}{n.lots?.length ? ` · Lots : ${n.lots.join(' ; ')}` : ''}</p>}
      {n.criteria && <p className="mt-1 whitespace-pre-line text-[13px] text-[#FDBA74]">Critères : {n.criteria}</p>}
      <p className="mt-2 rounded-lg bg-[#0F1F35] p-2 text-[13px]"><b>{n.company_name}</b>{n.siret ? ` · SIRET ${n.siret}` : ''} · {n.contact_name} · <a className="underline" href={`tel:${n.phone}`}>{n.phone}</a> · <a className="underline" href={`mailto:${n.email}`}>{n.email}</a></p>
      <div className="mt-3 flex flex-wrap gap-2">
        {n.status === 'pending' && <>
          <button disabled={busy} onClick={() => act(() => needsApi.publish(n.id, { title, description: desc }), 'Publié.')} className="min-h-[44px] rounded-xl bg-[#C2410C] px-4 font-extrabold text-white">Publier</button>
          <button disabled={busy} onClick={() => { const r = window.prompt('Motif du refus (pour l’équipe)') ?? null; if (r !== null) void act(() => needsApi.reject(n.id, r), 'Refusé.'); }} className="min-h-[44px] rounded-xl border border-[#2B4468] px-4 font-bold">Refuser</button>
        </>}
        {n.status === 'published' && <>
          {n.opportunity_id && <Link to={`/opportunites/${n.opportunity_id}`} className="flex min-h-[44px] items-center rounded-xl border border-[#2B4468] px-4 font-bold">Voir l’annonce</Link>}
          <button disabled={busy} onClick={() => act(() => needsApi.close(n.id), 'Clôturé.')} className="min-h-[44px] rounded-xl border border-[#2B4468] px-4 font-bold">Clôturer (entreprise trouvée)</button>
        </>}
        {n.reject_reason && <span className="text-[13px] text-[#B4C1D3]">Motif : {n.reject_reason}</span>}
        {msg && <span role="status" className="self-center text-[13px] text-[#6EE7B7]">{msg}</span>}
      </div>
    </li>
  );
}

export default function AdminBesoins() {
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState<{ items: ClientNeed[]; counts: Record<string, number> } | null>(null);
  const [error, setError] = useState(false);
  const load = () => { setError(false); needsApi.list(status).then(setData).catch(() => setError(true)); };
  useEffect(load, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <main className="mx-auto w-full max-w-[860px] px-4 pb-24 pt-5 text-[#F2F5F9]">
      <PageMeta title="Besoins des donneurs d’ordre | Administration" description="Relecture des besoins déposés." noindex />
      <h1 className="text-[24px] font-extrabold">Besoins des donneurs d’ordre</h1>
      <p className="mt-1 text-[14px] text-[#D6E0EC]">Relisez, corrigez si besoin, puis publiez. Les candidatures des artisans arrivent chez Elena comme pour toute annonce.</p>
      <div className="mt-4 flex flex-wrap gap-2">{Object.entries(STATUS).map(([k, l]) =>
        <button key={k} onClick={() => setStatus(k)} className={`min-h-[40px] rounded-full border px-3 text-[14px] font-bold ${status === k ? 'border-[#FB923C] bg-[#3A2312] text-[#FDBA74]' : 'border-[#2B4468]'}`}>{l}{data?.counts?.[k] ? ` (${data.counts[k]})` : ''}</button>)}</div>
      {error && <p className="mt-4 text-[#FCA5A5]">Chargement impossible. <button onClick={load} className="underline">Réessayer</button></p>}
      {data && !data.items.length && <p className="mt-4 text-[#D6E0EC]">Aucun besoin dans cette catégorie.</p>}
      {data && <ul className="mt-4 flex flex-col gap-3">{data.items.map(n => <Need key={n.id} n={n} onDone={load} />)}</ul>}
    </main>
  );
}
