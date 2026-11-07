import { useEffect, useState } from 'react';
import { awardsApi, type AwardsInsightData } from '@/lib/apiClient';

// 7 nov. : ce que les marchés déjà attribués (données publiques DECP) disent de cette annonce. Ordres de grandeur entre
// marchés comparables, entreprises du même métier comptées (jamais nommées). N'affiche rien quand il n'y a pas assez de données.
export default function AwardsInsight({ opportunityId, sessionId }: { opportunityId: string; sessionId: string }) {
  const [d, setD] = useState<AwardsInsightData | null>(null);
  useEffect(() => { setD(null); awardsApi.opportunity(opportunityId, sessionId).then(setD).catch(() => setD(null)); }, [opportunityId, sessionId]);
  if (!d || !d.available) return null;
  const eur = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`;
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-[#22385A] bg-[#12233A] p-4" aria-label="Ce que disent les marchés déjà attribués">
      <h3 className="text-[16px] font-extrabold">Ce que disent les marchés déjà attribués</h3>
      {d.price && <div>
        <p className="text-[14.5px] text-[#F2F5F9]"><b>Entre {eur(d.price.low)} et {eur(d.price.high)}</b> pour la plupart des marchés comparables{d.familyLabel ? ` (${d.familyLabel})` : ''}, médiane {eur(d.price.median)}.</p>
        <p className="text-[12.5px] text-[#B4C1D3]">{d.price.count} marchés attribués {d.price.scope === 'departement' ? 'dans ce département' : 'en France'} ces {d.price.years} ans{d.cpvFrom === 'metier' ? ' · famille déduite de votre métier' : ''}.</p>
      </div>}
      {d.peers && <p className="text-[14.5px] text-[#6EE7B7]">✓ {d.peers.text}{d.peers.recentExample ? <span className="block text-[12.5px] text-[#B4C1D3]">Par exemple, en {d.peers.recentExample.year} : « {d.peers.recentExample.objet} »</span> : null}</p>}
      <p className="text-[12px] text-[#93A4BC]">{d.note}</p>
    </section>
  );
}
