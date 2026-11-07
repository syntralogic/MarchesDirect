import { useEffect, useState } from 'react';
import { awardsApi, type AwardsInsightData } from '@/lib/apiClient';

// 7 nov. : ce que les marchés déjà attribués (données publiques DECP) disent de cette annonce. Ordres de grandeur entre
// marchés comparables, entreprises du même métier comptées (jamais nommées). N'affiche rien quand il n'y a pas assez de données.
export default function AwardsInsight({ opportunityId, sessionId }: { opportunityId: string; sessionId: string }) {
  const [d, setD] = useState<AwardsInsightData | null>(null);
  useEffect(() => { setD(null); awardsApi.opportunity(opportunityId, sessionId).then(setD).catch(() => setD(null)); }, [opportunityId, sessionId]);
  if (!d || !d.available) return null;
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-[#22385A] bg-[#12233A] p-4" aria-label="Ce que disent les marchés déjà attribués">
      <h3 className="text-[16px] font-extrabold">Ce que disent les marchés déjà attribués</h3>
      {d.price && <p className="text-[15px] font-bold text-[#F2F5F9]">{d.price.text}</p>}
      {d.peers && <p className="text-[15px] font-bold text-[#6EE7B7]">✓ {d.peers.text}</p>}
      <details className="text-[12.5px] text-[#93A4BC]"><summary className="min-h-[36px] cursor-pointer list-none underline [&::-webkit-details-marker]:hidden">D’où viennent ces chiffres</summary>
        <p className="mt-1">{[d.price?.detail, d.peers?.detail].filter(Boolean).join(' · ')}. {d.note}</p></details>
    </section>
  );
}
