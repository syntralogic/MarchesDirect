import { Loader2 } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

interface LoadMoreButtonProps {
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  /** Total matching the current filters, as reported by the backend. */
  total: number;
  /** How many are currently rendered on screen. */
  shown: number;
}

/**
 * The opportunities API paginates (100 per page, backend-capped - see
 * routes/opportunities.ts) but list pages previously only ever fetched page 1
 * via useOpportunities and never called loadMore, so browse pages silently
 * stopped at the first 100 opportunities no matter how many matched in the
 * DB. This renders the "load more" control so pages can page through
 * everything the backend has.
 */
export function LoadMoreButton({ hasMore, loadingMore, onLoadMore, total, shown }: LoadMoreButtonProps) {
  const { t } = useLang();
  if (!hasMore) return null;

  return (
    <div className="flex flex-col items-center gap-2 mt-5">
      <button
        onClick={onLoadMore}
        disabled={loadingMore}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#17334D] text-xs font-semibold text-white hover:border-orange/40 hover:text-orange transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loadingMore ? (
          <>
            <Loader2 size={13} className="animate-spin" /> {t('loadingMore')}
          </>
        ) : (
          t('loadMore')
        )}
      </button>
      <span className="text-[10px] text-[#B9BBC8]">{shown} / {total}</span>
    </div>
  );
}
