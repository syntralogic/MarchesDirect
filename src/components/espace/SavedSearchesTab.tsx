import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSaved, removeSearch, currentIds, type SavedSearch } from '@/lib/savedSearches';

// Mes recherches sauvegardées, avec le nombre réel de nouveaux marchés depuis la dernière consultation.
export default function SavedSearchesTab({ sessionId }: { sessionId: string }) {
  const [list, setList] = useState<SavedSearch[]>(() => listSaved());
  const [fresh, setFresh] = useState<Record<string, number | null>>({});
  useEffect(() => {
    let live = true;
    list.forEach(s => {
      currentIds(s, sessionId).then(ids => { if (live) setFresh(f => ({ ...f, [s.id]: ids.filter(i => !s.seen.includes(i)).length })); })
        .catch(() => { if (live) setFresh(f => ({ ...f, [s.id]: null })); });
    });
    return () => { live = false; };
  }, [list, sessionId]);
  if (!list.length) return (
    <div className="rounded-[14px] border border-[#22385A] bg-[#12233A] p-3 text-[14px] text-[#D6E0EC]">
      Aucune recherche sauvegardée. Sur la liste de vos marchés, touchez <b>« Sauvegarder cette recherche »</b> : vous verrez ici les nouveaux marchés dès qu’ils paraissent.
    </div>);
  return (
    <div className="flex flex-col gap-2">
      {list.map(s => {
        const n = fresh[s.id];
        return (
          <div key={s.id} className="flex items-center gap-2 rounded-[14px] border border-[#22385A] bg-[#12233A] p-3">
            <Link to={`/vos-marches${s.query ? `?${s.query}` : ''}`} className="min-w-0 flex-1">
              <b className="block text-[14.5px] leading-tight">{s.label}</b>
              <span className="text-[12px] text-[#B4C1D3]">Vue le {new Date(s.viewedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </Link>
            {n != null && n > 0 && <span className="shrink-0 rounded-full bg-[#F97316] px-2.5 py-1 text-[12px] font-extrabold text-white">{n} nouveau{n > 1 ? 'x' : ''}</span>}
            <button type="button" aria-label="Supprimer cette recherche" onClick={() => { removeSearch(s.id); setList(listSaved()); }} className="min-h-[44px] min-w-[44px] shrink-0 text-[18px] text-[#B4C1D3]">×</button>
          </div>);
      })}
    </div>
  );
}
