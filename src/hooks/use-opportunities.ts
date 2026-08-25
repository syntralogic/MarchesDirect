import { useEffect, useState } from 'react';
import { opportunitiesApi, getApiErrorMessage, type OpportunitySearchParams } from '@/lib/apiClient';
import { apiOpportunityToDisplay } from '@/lib/opportunityAdapter';
import type { Opportunity } from '@/data/mockData';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    opportunitiesApi
      .search({ journey, region, city, department, trade_id, q, limit: 50 })
      .then((data) => {
        if (cancelled) return;
        setOpportunities(data.results.map(apiOpportunityToDisplay));
      })
      .catch((err) => {
        if (cancelled) return;
        // Keeps the page rendering (empty list) rather than crashing - the
        // most common cause during setup is simply VITE_API_URL not pointing
        // at a running marchesdirect-backend instance yet.
        setError(getApiErrorMessage(err, 'Impossible de charger les opportunités.'));
        setOpportunities([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [journey, region, city, department, trade_id, q]);

  return { opportunities, loading, error };
}
