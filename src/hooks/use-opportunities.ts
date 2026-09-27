import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { opportunitiesApi, getApiErrorMessage, type OpportunitySearchParams } from '@/lib/apiClient';
import { apiOpportunityToDisplay } from '@/lib/opportunityAdapter';
import type { Opportunity } from '@/data/mockData';

// Backend caps limit at 100 per page (see routes/opportunities.ts:
// Math.min(Math.max(parseInt(limit) || 20, 1), 100)) - this was previously
// hardcoded to a single limit: 50 fetch with no page state, so browse pages
// only ever showed the first 50 opportunities no matter how many were in the
// DB, and totalPages/total from the backend's pagination response were
// silently discarded. Now fetches a full page of 100 and exposes total/
// hasMore/loadMore so pages can page through everything.
const PAGE_SIZE = 100;

export function useOpportunities(params: OpportunitySearchParams['journey'] | OpportunitySearchParams) {
  // Accepts either a bare journey (existing call sites: useOpportunities('tender'))
  // or a full filter object (region/trade_id/city/department/q) for pages that
  // need real server-side filtering, e.g. RecherchePage reading URL params
  // from an SEO landing page link.
  const searchParams: OpportunitySearchParams = typeof params === 'object' && params !== null
    ? params
    : { journey: params };

  const { journey, region, city, lat, lng, radius_km, department, trade_id, q, status, min_value, max_value, recent_days, sort, nature } = searchParams;
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const requestId = useRef(0);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const thisRequest = ++requestId.current;

    setLoading(true);
    setError(null);
    setPage(1);
    // R05 (contre-audit 15 Sep): opportunities/total from the *previous*
    // query stayed on screen under "Chargement des opportunités..." until
    // the new response landed - switching from plomberie to climatisation
    // showed the old count and old cards for a moment under the new
    // keyword. Clear them the instant a new search starts instead of
    // waiting for the fetch to resolve.
    setOpportunities([]);
    setTotal(0);

    const baseParams = { journey, region, city, lat, lng, radius_km, department, trade_id, q, status, min_value, max_value, recent_days, sort, nature };

    // Client audit (26 Sep, point 7): "J'ai affiché 200 annonces, ouvert une
    // annonce située après les 100 premières, puis fait retour... la liste
    // revient à 100 annonces. Il faut recliquer sur 'Voir plus'." Every
    // extra page loadMore() fetches lives only in this hook's local state
    // (opportunities/page below), which is reset by the `setPage(1)` /
    // `setOpportunities([])` above on every fresh mount - so a normal
    // browser back-navigation (a new mount, not the same component instance
    // loadMore was called on) always restarted at page 1 regardless of how
    // far the visitor had actually scrolled. OpportunityListCard now saves
    // how many rows were loaded (see its loadedCount prop) under the same
    // URL-keyed sessionStorage convention useScrollRestore already uses for
    // the pixel position, so this can silently re-fetch exactly that many
    // pages before handing control back to it - otherwise scroll-restore
    // fires against a list shorter than where it's trying to scroll to.
    let savedCount = 0;
    try {
      const raw = sessionStorage.getItem(`loadedCount:${location.pathname}${location.search}`);
      savedCount = raw ? parseInt(raw, 10) || 0 : 0;
    } catch {
      savedCount = 0;
    }

    (async () => {
      try {
        const first = await opportunitiesApi.search({ ...baseParams, page: 1, limit: PAGE_SIZE });
        if (cancelled || thisRequest !== requestId.current) return;
        let allResults = first.results;
        let currentPage = 1;
        let totalPagesResolved = first.pagination?.totalPages ?? 1;
        const targetPages = Math.min(Math.ceil(savedCount / PAGE_SIZE), totalPagesResolved);

        while (currentPage < targetPages) {
          currentPage += 1;
          const more = await opportunitiesApi.search({ ...baseParams, page: currentPage, limit: PAGE_SIZE });
          if (cancelled || thisRequest !== requestId.current) return;
          allResults = [...allResults, ...more.results];
          totalPagesResolved = more.pagination?.totalPages ?? totalPagesResolved;
        }

        // One-time use, same rule as the scroll position itself - a later
        // fresh visit to this exact URL shouldn't keep re-fetching extra
        // pages nobody asked for this time.
        if (savedCount > 0) {
          try { sessionStorage.removeItem(`loadedCount:${location.pathname}${location.search}`); } catch { /* non-fatal */ }
        }

        setOpportunities(allResults.map(apiOpportunityToDisplay));
        setPage(currentPage);
        setTotal(first.pagination?.total ?? allResults.length);
        setTotalPages(totalPagesResolved);
      } catch (err) {
        if (cancelled) return;
        // Keeps the page rendering (empty list) rather than crashing - the
        // most common cause during setup is simply VITE_API_URL not pointing
        // at a running marchesdirect-backend instance yet.
        setError(getApiErrorMessage(err, 'Impossible de charger les opportunités.'));
        setOpportunities([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey, region, city, lat, lng, radius_km, department, trade_id, q, status, min_value, max_value, recent_days, sort, nature]);

  const loadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    const thisRequest = requestId.current;
    setLoadingMore(true);

    opportunitiesApi
      .search({ journey, region, city, lat, lng, radius_km, department, trade_id, q, status, min_value, max_value, recent_days, sort, nature, page: nextPage, limit: PAGE_SIZE })
      .then((data) => {
        if (thisRequest !== requestId.current) return; // filters changed underneath us
        setOpportunities((prev) => [...prev, ...data.results.map(apiOpportunityToDisplay)]);
        setPage(nextPage);
        setTotalPages(data.pagination?.totalPages ?? totalPages);
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, 'Impossible de charger plus d\'opportunités.'));
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [journey, region, city, lat, lng, radius_km, department, trade_id, q, status, min_value, max_value, recent_days, sort, nature, page, totalPages, loadingMore]);

  return {
    opportunities,
    loading,
    error,
    total,
    hasMore: page < totalPages,
    loadingMore,
    loadMore,
  };
}
