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
let cachedCounts: OpportunityCounts | null = null;
let inFlight: Promise<OpportunityCounts> | null = null;

function fetchCounts(): Promise<OpportunityCounts> {
  if (cachedCounts) return Promise.resolve(cachedCounts);
  if (!inFlight) {
    inFlight = opportunitiesApi.getCounts()
      .then(data => { cachedCounts = data; return data; })
      .catch(() => EMPTY)
      .finally(() => { inFlight = null; });
  }
  return inFlight;
}

// Real, live counts per journey - replaces the hardcoded "3 421+" on the
// homepage and any other page that needs an honest, clickable-by-category
// count instead of a static placeholder. See routes/opportunities.ts's
// /stats/counts for why this can't disagree with what search shows.
export function useOpportunityCounts() {
  const [counts, setCounts] = useState<OpportunityCounts>(cachedCounts ?? EMPTY);
  const [loading, setLoading] = useState(!cachedCounts);

  useEffect(() => {
    if (cachedCounts) return; // already have it - nothing to wait on
    let cancelled = false;
    fetchCounts().then(data => {
      if (!cancelled) {
        setCounts(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return { counts, loading };
}
