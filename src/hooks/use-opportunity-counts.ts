import { useEffect, useState } from 'react';
import { opportunitiesApi } from '@/lib/apiClient';

export interface OpportunityCounts {
  total: number;
  public_procurement: number;
  tender: number;
  subcontracting: number;
}

const EMPTY: OpportunityCounts = { total: 0, public_procurement: 0, tender: 0, subcontracting: 0 };

// Client audit (25 Sep, point 11): "les compteurs commencent encore par
// des points de suspension avant leur arrivée. Prévoir un état de
// chargement explicite ou des compteurs préchargés."
//
// Two problems, both fixed here rather than in the component: (1)
// HomePage mounts two separate components (HeroCounters,
// OpportunityPaths) that each call this hook - previously that fired two
// independent GET /stats/counts on every single load, and both always
// started from "loading" even though they wanted the exact same data at
// the exact same moment. (2) leaving Home and coming back re-fetched and
// showed the loading state again, even though the numbers rarely change
// second to second. A module-level cache + in-flight dedupe fixes both:
// the first mount of the session pays for one real fetch, every mount
// after that (same component re-mounting, or the second component on
// first load) reads the cached value synchronously - no loading state to
// show at all. This is the "compteurs préchargés" half of the ask; the
// component-side skeleton (replacing the literal "…") is the "état de
// chargement explicite" half, done in HomePage.tsx.
// 26 Sep client audit (point 3 remainder): the OpportunityPaths tile needs
// the active-only cut of these same counts (its /parcours destination is
// active-only by design - see apiClient.getCounts's comment), which is a
// different number from HeroCounters/the map's all-statuses total. Keyed
// by the status string actually requested ('' = default/all-statuses) so
// each scope gets its own cache entry and in-flight dedupe instead of the
// two tiles fighting over one shared cache slot.
const cachedCountsByStatus: Record<string, OpportunityCounts> = {};
const inFlightByStatus: Record<string, Promise<OpportunityCounts>> = {};

function fetchCounts(status?: string): Promise<OpportunityCounts> {
  const key = status || '';
  if (cachedCountsByStatus[key]) return Promise.resolve(cachedCountsByStatus[key]);
  if (!inFlightByStatus[key]) {
    inFlightByStatus[key] = opportunitiesApi.getCounts(status)
      .then(data => { cachedCountsByStatus[key] = data; return data; })
      .catch(() => EMPTY)
      .finally(() => { delete inFlightByStatus[key]; });
  }
  return inFlightByStatus[key];
}

// Real, live counts per journey - replaces the hardcoded "3 421+" on the
// homepage and any other page that needs an honest, clickable-by-category
// count instead of a static placeholder. See routes/opportunities.ts's
// /stats/counts for why this can't disagree with what search shows.
// Pass `status` (e.g. 'active') to get that status-scoped cut instead of
// the default all-statuses total - only do this for a tile whose own
// destination is scoped the same way, or the badge/list mismatch this was
// built to prevent just reappears in the other direction.
export function useOpportunityCounts(status?: string) {
  const key = status || '';
  const [counts, setCounts] = useState<OpportunityCounts>(cachedCountsByStatus[key] ?? EMPTY);
  const [loading, setLoading] = useState(!cachedCountsByStatus[key]);

  useEffect(() => {
    if (cachedCountsByStatus[key]) return; // already have it - nothing to wait on
    let cancelled = false;
    setLoading(true);
    fetchCounts(status).then(data => {
      if (!cancelled) {
        setCounts(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { counts, loading };
}
