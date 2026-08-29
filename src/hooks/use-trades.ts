import { useEffect, useState } from 'react';
import { tradesApi } from '@/lib/apiClient';

// Feeds the "Métier" filter selects on the search pages (Appels d'offres,
// Marchés publics, Sous-traitance). These used to be hardcoded label lists
// (e.g. "Travaux & construction", "Second œuvre") that never matched the
// real `trade_name` values opportunities are tagged with in the database
// (e.g. "Maconnerie", "Electricite", "Peinture" - see schema.sql trades
// seed), so picking anything but the default always produced an empty
// result set. Fetching the real trade names from GET /api/trades - which
// existed for this purpose already but wasn't used anywhere - keeps the
// dropdown in sync with whatever opportunities are actually tagged with.
export function useTrades() {
  const [trades, setTrades] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    tradesApi.list()
      .then((data: { name: string }[]) => {
        if (cancelled) return;
        setTrades(Array.isArray(data) ? data.map(t => t.name).filter(Boolean) : []);
      })
      .catch(() => {
        if (!cancelled) setTrades([]);
      });
    return () => { cancelled = true; };
  }, []);

  return trades;
}
