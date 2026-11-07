import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listSaved, removeSearch, currentIds, saveSearch, type SavedSearch } from '@/lib/savedSearches';
import { DEPARTMENTS } from '@/data/departments';

// 7 nov. (Hedi) : simple. L'artisan choisit un métier et une zone, c'est sa recherche suivie : à chaque retour, un clic,
// et il voit le listing avec les nouveautés. Les recherches suivies apparaissent dessous avec le nombre de nouveautés réelles.
const TRADES: [string, string][] = [['climatisation', 'Clim, chauffage'], ['plomberie', 'Plomberie'], ['electricite', 'Électricité'], ['couverture', 'Couverture'],
  ['menuiserie', 'Menuiserie'], ['peinture', 'Peinture'], ['maconnerie', 'Maçonnerie'], ['carrelage', 'Carrelage'], ['isolation', 'Isolation'], ['platrerie', 'Plâtrerie'],
  ['nettoyage', 'Nettoyage'], ['espaces verts', 'Espaces verts'], ['vrd', 'Voirie, réseaux'], ['demolition', 'Démolition'], ['charpente', 'Charpente']];
const chip = (on: boolean) => `min-h-[44px] rounded-full border px-3.5 text-[14px] font-bold ${on ? 'border-[#FB923C] bg-[#3A2312] text-[#FDBA74]' : 'border-[#2B4468] text-[#D6E0EC]'}`;

export default function SavedSearchesTab({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const [list, setList] = useState<SavedSearch[]>(() => listSaved());
  const [fresh, setFresh] = useState<Record<string, number | null>>({});
  const [trade, setTrade] = useState(''); const [other, setOther] = useState(''); const [dept, setDept] = useState('');
  useEffect(() => {
    let live = true;
    list.forEach(s => {
      currentIds(s, sessionId).then(ids => { if (live) setFresh(f => ({ ...f, [s.id]: ids.filter(i => !s.seen.includes(i)).length })); })
        .catch(() => { if (live) setFresh(f => ({ ...f, [s.id]: null })); });
    });
    return () => { live = false; };
  }, [list, sessionId]);
  const q = (other.trim() || trade).trim();
  const go = () => {
    if (!q) return;
    const p = new URLSearchParams({ q }); if (dept) p.set('department', dept);
    const label = `${TRADES.find(t => t[0] === q)?.[1] || q}${dept ? ` · ${DEPARTMENTS.find(d => d.code === dept)?.name || dept}` : ' · Toute la France'}`;
    saveSearch(label, p.toString(), false, []);
    navigate(`/vos-marches?${p}`);
  };
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[14px] border border-[#22385A] bg-[#12233A] p-3">
        <b className="text-[15px]">Suivre un métier dans ma zone</b>
        <p className="mt-0.5 text-[13px] text-[#B4C1D3]">Choisissez, puis à chaque retour un seul clic vous montre le listing et les nouveautés.</p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Métier">
          {TRADES.map(([k, l]) => <button key={k} type="button" aria-pressed={trade === k} className={chip(trade === k)} onClick={() => { setTrade(k); setOther(''); }}>{l}</button>)}
        </div>
        <input value={other} onChange={e => { setOther(e.target.value); setTrade(''); }} placeholder="Autre métier ou mot-clé" aria-label="Autre métier"
          className="mt-2 h-[44px] w-full rounded-lg border border-[#2B4468] bg-[#0A1628] px-3 text-[15px] text-[#F2F5F9] placeholder:text-[#6B7A90]" />
        <select value={dept} onChange={e => setDept(e.target.value)} aria-label="Zone" className="mt-2 h-[44px] w-full rounded-lg border border-[#2B4468] bg-[#0A1628] px-2 text-[15px] text-[#F2F5F9]">
          <option value="">Toute la France</option>{DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code} · {d.name}</option>)}
        </select>
        <button type="button" onClick={go} disabled={!q} className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#C2410C] text-[15px] font-extrabold text-white disabled:opacity-50">Voir le listing et le suivre</button>
      </section>
      {list.length > 0 && <div className="flex flex-col gap-2">
        <b className="text-[14px] text-[#B4C1D3]">Mes recherches suivies</b>
        {list.map(s => { const n = fresh[s.id]; return (
          <div key={s.id} className="flex items-center gap-2 rounded-[14px] border border-[#22385A] bg-[#12233A] p-3">
            <Link to={`/vos-marches${s.query ? `?${s.query}` : ''}`} className="min-w-0 flex-1">
              <b className="block text-[14.5px] leading-tight">{s.label}</b>
              <span className="text-[12px] text-[#B4C1D3]">{n == null ? 'Actualisation…' : n > 0 ? '' : 'Rien de nouveau depuis votre dernière visite'}</span>
            </Link>
            {n != null && n > 0 && <span className="shrink-0 rounded-full bg-[#F97316] px-2.5 py-1 text-[12px] font-extrabold text-white">{n} nouveau{n > 1 ? 'x' : ''}</span>}
            <button type="button" aria-label="Ne plus suivre" onClick={() => { removeSearch(s.id); setList(listSaved()); }} className="min-h-[44px] min-w-[44px] shrink-0 text-[18px] text-[#B4C1D3]">×</button>
          </div>); })}
      </div>}
    </div>
  );
}
