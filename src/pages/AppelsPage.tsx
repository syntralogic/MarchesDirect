import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTrades } from '@/hooks/use-trades';

// Same unification as MarchesPublicsPage - see its comment for the client
// quote/reasoning. This page's own filters (city, sector) are a subset of
// /recherche's, so it hands off there with journey=tender preset instead
// of maintaining its own separate results list.
export default function AppelsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trades = useTrades();
  const city = searchParams.get('city') || '';
  const sector = searchParams.get('sector') || 'Tous';

  useEffect(() => {
    if (sector !== 'Tous' && trades.length === 0) return;
    const params = new URLSearchParams();
    params.set('journey', 'tender');
    if (city) params.set('city', city);
    if (sector !== 'Tous') {
      const tradeId = trades.find(tr => tr.name === sector)?.id;
      if (tradeId) params.set('trade_id', tradeId);
    }
    navigate(`/recherche?${params.toString()}`, { replace: true });
  }, [navigate, trades, city, sector]);

  return null;
}
