import { Link } from 'react-router-dom';
import { useFavorites } from '@/contexts/FavoritesContext';

// The home banner and Mon espace read the same selection, including local
// bookmarks awaiting account synchronisation. Never count a separate snapshot.
export default function SavedMarketsBanner() {
  const { savedIds } = useFavorites();
  const count = savedIds.size;
  if (count === 0) return null;
  return (
    <div className="rounded-xl bg-[#123B2A] px-3.5 py-3 text-[15px] text-[#6EE7B7]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">{count === 1 ? '1 marché enregistré' : `${count} marchés enregistrés`}</span>
        <Link to="/mon-espace?onglet=favoris" className="flex min-h-[48px] items-center font-bold underline">
          {count === 1 ? 'Le retrouver' : 'Les retrouver'}
        </Link>
      </div>
    </div>
  );
}
