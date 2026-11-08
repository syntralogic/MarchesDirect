import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSaved, syncSaved, currentIds } from '@/lib/savedSearches';
import { getSessionId } from '@/lib/visitorTracking';

// 8 nov. (Hedi : « ça fait trop chargé, même pour quelqu'un qui vient ; je laisserai juste une ligne comme
// "1 marché enregistré" ») : l'accueil d'un visiteur qui revient tient en une ligne, au même format que les marchés
// enregistrés, et seulement s'il y a de vraies nouveautés dans ses suivis. Le détail est dans Mon espace.
export default function ReturnBlock() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!listSaved().length) return;
    const sid = getSessionId();
    syncSaved().then(r => Promise.all((r ? r.list : listSaved()).slice(0, 5).map(s => currentIds(s, sid).then(ids => ids.filter(i => !s.seen.includes(i)).length).catch(() => 0))))
      .then(c => setN(c.reduce((a, b) => a + b, 0))).catch(() => {});
  }, []);
  if (n <= 0) return null;
  return (
    <div className="rounded-xl bg-[#3A2312] px-3.5 py-3 text-[15px] text-[#FDBA74]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">{n === 1 ? '1 nouvelle annonce dans vos suivis' : `${n} nouvelles annonces dans vos suivis`}</span>
        <Link to="/mon-espace" className="flex min-h-[48px] items-center font-bold underline">Voir</Link>
      </div>
    </div>
  );
}
