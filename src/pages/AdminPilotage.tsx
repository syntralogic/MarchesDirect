import { useEffect, useState } from 'react';
import PageMeta from '@/components/common/PageMeta';
import { pilotageApi, type Funnel } from '@/lib/apiClient';

// Pilotage (7 nov.) : la progression des visiteurs vers l'accompagnement, semaine par semaine, et les besoins mal servis.
const COLS: [keyof Funnel['weeks'][number], string][] = [['visitors', 'Visiteurs'], ['searched', 'Ont cherché'], ['viewed', 'Ont ouvert une fiche'], ['returning', 'Revenus (2 jours+)'],
  ['companyIdentified', 'Entreprise indiquée'], ['members', 'Inscrits (portable)'], ['favorites', 'Ont enregistré'], ['alerts', 'Alertes'], ['needsPublished', 'Besoins publiés'],
  ['requests', 'Demandes'], ['voluntaryRequests', 'dont volontaires'], ['packsSold', 'Packs vendus']];
export default function AdminPilotage() {
  const [d, setD] = useState<Funnel | null>(null); const [err, setErr] = useState(false);
  const [sale, setSale] = useState({ soldOn: new Date().toISOString().slice(0, 10), amount: '', label: '' }); const [msg, setMsg] = useState<string | null>(null);
  const load = () => { setErr(false); pilotageApi.funnel(12).then(setD).catch(() => setErr(true)); };
  useEffect(load, []);
  const fmtW = (w: string) => new Date(w).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-24 pt-5 text-[#F2F5F9]">
      <PageMeta title="Pilotage | Administration" description="Suivi interne." noindex />
      <h1 className="text-[24px] font-extrabold">Pilotage</h1>
      <p className="mt-1 text-[14px] text-[#D6E0EC]">Semaine par semaine, du visiteur au pack vendu. Un favori n’est jamais une demande. Les visiteurs ayant refusé la mesure ne sont pas comptés.</p>
      {err && <p className="mt-4 text-[#FCA5A5]">Chargement impossible. <button onClick={load} className="underline">Réessayer</button></p>}
      {d && <div className="mt-4 overflow-x-auto"><table className="min-w-[900px] text-[13px]">
        <thead><tr className="text-left text-[#B4C1D3]"><th className="pb-2 pr-3">Semaine du</th>{COLS.map(([k, l]) => <th key={k} className="pb-2 pr-3" title={(d.definitions as Record<string, string>)[k] || ''}>{l}</th>)}</tr></thead>
        <tbody>{d.weeks.slice().reverse().map(w => <tr key={w.week} className="border-t border-[#22385A]"><td className="py-2 pr-3 font-bold">{fmtW(w.week)}</td>{COLS.map(([k]) => <td key={k} className="py-2 pr-3 tabular-nums">{String(w[k] ?? 0)}{k === 'packsSold' && w.packsAmount ? <span className="text-[#B4C1D3]"> · {Math.round(w.packsAmount).toLocaleString('fr-FR')} €</span> : null}</td>)}</tr>)}</tbody>
      </table></div>}
      {d && <>
        <h2 className="mt-8 text-[19px] font-extrabold">Besoins mal servis (28 jours)</h2>
        <p className="text-[13.5px] text-[#D6E0EC]">Recherches faites au moins 3 fois qui trouvent moins de 3 annonces : c’est là qu’il faut enrichir l’offre (fournisseur, donneurs d’ordre, partenariats).</p>
        {d.underserved.length === 0 ? <p className="mt-2 text-[14px] text-[#B4C1D3]">Aucune recherche fréquente sans résultat sur la période.</p>
          : <ul className="mt-2 flex flex-col gap-1 text-[14px]">{d.underserved.map((u, i) => <li key={i}><b>{u.query}</b>{u.department ? ` · ${u.department}` : ''} : {u.searches} recherches, {u.avgResults ?? 0} annonce{(u.avgResults ?? 0) > 1 ? 's' : ''} en moyenne</li>)}</ul>}
      </>}
      <h2 className="mt-8 text-[19px] font-extrabold">Déclarer un pack vendu</h2>
      <form onSubmit={async e => { e.preventDefault(); setMsg(null); try { await pilotageApi.packSale({ soldOn: sale.soldOn, amount: Number(sale.amount) || undefined, label: sale.label || undefined }); setMsg('Enregistré.'); setSale(s => ({ ...s, amount: '', label: '' })); load(); } catch { setMsg('Échec, réessayez.'); } }}
        className="mt-2 flex flex-wrap items-end gap-2">
        <label className="text-[13px] text-[#B4C1D3]">Date<br /><input type="date" value={sale.soldOn} onChange={e => setSale(s => ({ ...s, soldOn: e.target.value }))} className="h-[44px] rounded-lg border border-[#2B4468] bg-[#0A1628] px-2 text-[#F2F5F9]" /></label>
        <label className="text-[13px] text-[#B4C1D3]">Montant HT<br /><input inputMode="numeric" value={sale.amount} onChange={e => setSale(s => ({ ...s, amount: e.target.value }))} placeholder="1500" className="h-[44px] w-[120px] rounded-lg border border-[#2B4468] bg-[#0A1628] px-2 text-[#F2F5F9]" /></label>
        <label className="text-[13px] text-[#B4C1D3]">Libellé<br /><input value={sale.label} onChange={e => setSale(s => ({ ...s, label: e.target.value }))} placeholder="Pack dossier, entreprise X" className="h-[44px] w-[260px] rounded-lg border border-[#2B4468] bg-[#0A1628] px-2 text-[#F2F5F9]" /></label>
        <button type="submit" className="min-h-[44px] rounded-xl bg-[#C2410C] px-4 font-extrabold text-white">Enregistrer</button>
        {msg && <span role="status" className="text-[13px] text-[#6EE7B7]">{msg}</span>}
      </form>
    </main>
  );
}
