import { useEffect, useState } from 'react';
import { opportunitiesApi } from '@/lib/apiClient';
import { getSessionId } from '@/lib/visitorTracking';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { useAuth } from '@/contexts/AuthContext';

// Powers the compatibility badge on listing cards. Per the spec, a card
// never mentions compatibility at all until the visitor's company is
// identified (SIRET or logged in) - not a placeholder, not a greyed-out
// badge, nothing. Once identified, every card gets its real score.
export function useMatchScores(ids: string[]) {
  const { companyKnown } = useCompanyKnown();
  const { isAuthenticated } = useAuth();
  const [scores, setScores] = useState<Record<string, { score: number; scoreTitle: string }>>({});

  const canScore = companyKnown || isAuthenticated;
  // Stable key so the effect only re-fires when the actual id set changes,
  // not on every re-render from an unrelated state update in the page.
  const idsKey = ids.slice(0, 30).join(',');

  useEffect(() => {
    if (!canScore || !idsKey) {
      setScores({});
      return;
    }
    let cancelled = false;
    opportunitiesApi.matchScores(idsKey.split(','), getSessionId())
      .then(result => { if (!cancelled) setScores(result); })
      .catch(() => { if (!cancelled) setScores({}); });
    return () => { cancelled = true; };
  }, [canScore, idsKey]);

  return { scores, canScore };
}
