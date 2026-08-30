import { Bookmark } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLang } from '@/contexts/LangContext';

/**
 * Bookmark toggle used on listing cards and the annonce detail page. Wired to
 * FavoritesContext (real PUT/DELETE /api/favorites/:id) - not local-only
 * useState like the previous placeholder.
 */
export function SaveButton({
  opportunityId,
  size = 'sm',
  showLabel = false,
}: {
  opportunityId: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}) {
  const { isSaved, toggle } = useFavorites();
  const { t } = useLang();
  const saved = isSaved(opportunityId);
  const dim = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(opportunityId);
      }}
      aria-pressed={saved}
      aria-label={saved ? String(t('detailSaved')) : String(t('detailSave'))}
      title={saved ? String(t('detailSaved')) : String(t('detailSave'))}
      className={`${dim} shrink-0 rounded-lg border flex items-center justify-center transition-colors ${
        saved
          ? 'bg-orange/15 border-orange text-orange'
          : 'bg-[#061D32] border-[#17334D] text-[#B9BBC8] hover:border-orange/40 hover:text-white'
      } ${showLabel ? 'w-auto px-2.5 gap-1.5' : ''}`}
    >
      <Bookmark size={iconSize} fill={saved ? 'currentColor' : 'none'} />
      {showLabel && <span className="text-[11px] font-semibold">{saved ? t('detailSaved') : t('detailSave')}</span>}
    </button>
  );
}