import { useEffect, useState, useCallback, useRef } from 'react';
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

  const { journey, region, city, department, trade_id, q } = searchParams;
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const requestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const thisRequest = ++requestId.current;

    setLoading(true);
    setError(null);
    setPage(1);

    opportunitiesApi
      .search({ journey, region, city, department, trade_id, q, page: 1, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled || thisRequest !== requestId.current) return;
        setOpportunities(data.results.map(apiOpportunityToDisplay));
        setTotal(data.pagination?.total ?? data.results.length);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .catch((err) => {
        if (cancelled) return;
        // Keeps the page rendering (empty list) rather than crashing - the
        // most common cause during setup is simply VITE_API_URL not pointing
        // at a running marchesdirect-backend instance yet.
        setError(getApiErrorMessage(err, 'Impossible de charger les opportunités.'));
        setOpportunities([]);
        setTotal(0);
        setTotalPages(1);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [journey, region, city, department, trade_id, q]);

  const loadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    const thisRequest = requestId.current;
    setLoadingMore(true);

    opportunitiesApi
      .search({ journey, region, city, department, trade_id, q, page: nextPage, limit: PAGE_SIZE })
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
  }, [journey, region, city, department, trade_id, q, page, totalPages, loadingMore]);

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
