import { useEffect, useState } from 'react';
import { opportunitiesApi } from '@/lib/apiClient';
import { SOCIAL_PROOF_MODE } from '@/lib/refonte/flags';

// Spec 2.5. PHASE 1 (preview): random 2-9 behind VITE_SOCIAL_PROOF_MODE=demo, to judge the rendering.
// PHASE 2 (production, default): the measured number of distinct companies that opened this market today;
// nothing is shown under 2, nothing is ever random, and a failed request shows nothing.
export default function SocialProofDot({ opportunityId }: { opportunityId: string }) {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (SOCIAL_PROOF_MODE === 'demo') {
      setN(2 + Math.floor(Math.random() * 8));
      return;
    }
    opportunitiesApi.activity(opportunityId)
      .then((r) => { if (!cancelled) setN(typeof r.companiesToday === 'number' ? r.companiesToday : null); })
      .catch(() => { if (!cancelled) setN(null); });
    return () => { cancelled = true; };
  }, [opportunityId]);

  if (n === null || n < 2) return null;
  return (
    <p className="flex items-center gap-2 text-sm text-[#D6E0EC]">
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 motion-safe:animate-ping" style={{ animationDuration: '2s' }} />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      {n} entreprises ont consulté ce marché aujourd'hui
    </p>
  );
}
