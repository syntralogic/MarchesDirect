import { useEffect, useState } from 'react';
import { mockSubcontractingOpportunities, type Opportunity } from '@/data/mockData';
import { opportunitiesApi } from '@/lib/apiClient';
import { apiOpportunityToDisplay } from '@/lib/opportunityAdapter';

// The 3-step "chantier" candidature flow (MissionDetailPage -> MissionProfilPage
// -> MissionRelationPage) used to look the mission up with
// `mockSubcontractingOpportunities.find(o => o.id === id)` on every one of its
// 3 pages. That only ever worked for the handful of hardcoded demo ids -
// SousTraitancePage links to it with real opportunity UUIDs (once wired to the
// live API), which never match a mock id, so every real listing hit "Mission
// non trouvée" at step 1. This fetches the real opportunity by id, and still
// falls back to the mock lookup so the old demo ids keep working too.
export function useMission(id: string | undefined) {
  const [mission, setMission] = useState<Opportunity | undefined>(
    () => mockSubcontractingOpportunities.find(o => o.id === id)
  );
  const [loading, setLoading] = useState(!!id && !mission);

  useEffect(() => {
    const mockMatch = mockSubcontractingOpportunities.find(o => o.id === id);
    if (mockMatch) {
      setMission(mockMatch);
      setLoading(false);
      return;
    }
    if (!id) {
      setMission(undefined);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    opportunitiesApi.getById(id)
      .then(api => { if (!cancelled) setMission(apiOpportunityToDisplay(api)); })
      .catch(() => { if (!cancelled) setMission(undefined); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  return { mission, loading };
}
