import { useEffect, useState } from 'react';
import { opportunitiesApi, getApiErrorMessage, type OpportunitySearchParams } from '@/lib/apiClient';
import { apiOpportunityToDisplay } from '@/lib/opportunityAdapter';
import type { Opportunity } from '@/data/mockData';

export function useOpportunities(journey: OpportunitySearchParams['journey']) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    opportunitiesApi
      .search({ journey, limit: 50 })
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
  }, [journey]);

  return { opportunities, loading, error };
}
