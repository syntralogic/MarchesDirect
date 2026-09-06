import { useEffect, useState } from 'react';
import { opportunitiesApi } from '@/lib/apiClient';

export interface OpportunityCounts {
  total: number;
  public_procurement: number;
  tender: number;
  subcontracting: number;
}

const EMPTY: OpportunityCounts = { total: 0, public_procurement: 0, tender: 0, subcontracting: 0 };

// Real, live counts per journey - replaces the hardcoded "3 421+" on the
// homepage and any other page that needs an honest, clickable-by-category
// count instead of a static placeholder. See routes/opportunities.ts's
// /stats/counts for why this can't disagree with what search shows.
export function useOpportunityCounts() {
  const [counts, setCounts] = useState<OpportunityCounts>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    opportunitiesApi.getCounts()
      .then(data => { if (!cancelled) setCounts(data); })
      .catch(() => { if (!cancelled) setCounts(EMPTY); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { counts, loading };
}
