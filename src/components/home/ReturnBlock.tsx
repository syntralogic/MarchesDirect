import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { opportunitiesApi } from '@/lib/apiClient';
import { listSaved, syncSaved, currentIds, type SavedSearch } from '@/lib/savedSearches';
import { lastListPath, recentViewed } from '@/lib/lastList';
import { getSessionId } from '@/lib/visitorTracking';

// 7 nov. : l'accueil d'un visiteur qui revient. « Depuis votre dernière visite » = vraies nouveautés de ses recherches
// enregistrées (la même recherche relancée, comparée à ce qu'il a déjà vu) ; « Reprendre » = sa dernière recherche et ses
// dernières fiches. Rien n'est inventé : sans nouveauté, on le dit. Rien n'apparaît pour une première visite.
export default function ReturnBlock() {
  // 7 nov. : n = null quand la vérification a échoué (réseau), pour ne pas afficher à tort « rien de nouveau ».
  const [news, setNews] = useState<{ s: SavedSearch; n: number | null }[] | null>(null);
  const [recent, setRecent] = useState<{ id: string; title: string }[]>([]);
  const [saved, setSaved] = useState<SavedSearch[]>(() => listSaved().slice(0, 3));
  const last = lastListPath();
  useEffect(() => {
    const sid = getSessionId();
    // 7 nov. : la liste serveur fait foi (même liste sur téléphone et ordinateur) ; la copie locale s'affiche en attendant.
    syncSaved().then(r => { const l = (r ? r.list : listSaved()).slice(0, 3); setSaved(l);
      return Promise.all(l.map(s => currentIds(s, sid).then(ids => ({ s, n: ids.filter(i => !s.seen.includes(i)).length })).catch(() => ({ s, n: null })))); })
      .then(setNews).catch(() => setNews([]));
    const ids = recentViewed(3);
    Promise.all(ids.map(id => opportunitiesApi.getById(id).then(o => ({ id, title: o.title })).catch(() => null)))
      .then(r => setRecent(r.filter((x): x is { id: string; title: string } => !!x)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!saved.length && !recent.length && last === '/vos-marches') return null;
  const withNews = (news || []).filter((x): x is { s: SavedSearch; n: number } => (x.n ?? 0) > 0);
  const failed = (news || []).some(x => x.n === null);
  return (
    <section aria-label="Votre retour" className="flex flex-col gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-4 text-[#F2F5F9]">
      {saved.length > 0 && <div>
        <b className="text-[15px]">Depuis votre dernière visite</b>
        {news === null ? <p className="mt-1 h-5 w-2/3 animate-pulse rounded bg-[#1E3352]" aria-busy="true" />
          : withNews.length
            ? <ul className="mt-1 flex flex-col gap-1">{withNews.map(({ s, n }) => <li key={s.id}><Link to={`/vos-marches?${s.query}`} className="text-[14.5px] font-bold text-[#FB923C] underline">{s.label} : {n} nouvelle{n > 1 ? 's' : ''} annonce{n > 1 ? 's' : ''}</Link></li>)}</ul>
            : failed ? <p className="mt-1 text-[14px] text-[#D6E0EC]">Vos recherches enregistrées n'ont pas pu être vérifiées. <Link to="/vos-marches" className="font-bold text-[#FB923C] underline">Relancer</Link></p>
            : <p className="mt-1 text-[14px] text-[#D6E0EC]">Rien de nouveau dans vos recherches enregistrées depuis votre dernière visite.</p>}
      </div>}
      {(recent.length > 0 || last !== '/vos-marches') && <div>
        <b className="text-[15px]">Reprendre où vous en étiez</b>
        <ul className="mt-1 flex flex-col gap-1 text-[14px]">
          {last !== '/vos-marches' && <li><Link to={last} className="font-bold text-[#FB923C] underline">Votre dernière recherche</Link></li>}
          {recent.map(r => <li key={r.id}><Link to={`/opportunites/${r.id}`} className="line-clamp-1 text-[#D6E0EC] underline">{r.title}</Link></li>)}
        </ul>
      </div>}
    </section>
  );
}
