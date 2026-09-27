import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTrades } from '@/hooks/use-trades';

// Client audit (msg 1, point 2 / msg 5, point 1): "les liens du bas de
// l'accueil ouvrent encore d'autres pages, avec des filtres sur le côté...
// À corriger : une même page de résultats, avec les choix du visiteur déjà
// renseignés, quelle que soit son entrée." This page used to render its own
// separate listing (own city/sector/status filters, no région/département
// multi-select, no nature/montant/sort controls) - a third presentation
// alongside /parcours and /recherche, exactly what the client flagged.
// /recherche's filters are a strict superset of what this page offered, so
// this now just hands off to it with the same choices already applied
// (journey=public_procurement + whatever city/sector/status were in the
// URL), instead of maintaining a second, thinner copy of the same page.
const STATUS_TO_API: Record<string, string> = {
  'En cours': 'active',
  'Clôturé': 'expired',
  'Attribué': 'awarded',
  'Annulé': 'cancelled',
  'TousStatuts': 'active,expired,awarded,cancelled',
};

export default function MarchesPublicsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trades = useTrades();
  const city = searchParams.get('city') || '';
  const sector = searchParams.get('sector') || 'Tous';
  const status = searchParams.get('status') || 'Tous';

  useEffect(() => {
    // Sector needs a resolved trade_id (see use-trades.ts) - wait for the
    // list to load rather than redirecting without it and dropping the
    // filter. No sector filter means nothing to wait for.
    if (sector !== 'Tous' && trades.length === 0) return;
    const params = new URLSearchParams();
    params.set('journey', 'public_procurement');
    if (city) params.set('city', city);
    if (status !== 'Tous') params.set('status', STATUS_TO_API[status] || status);
    if (sector !== 'Tous') {
      const tradeId = trades.find(tr => tr.name === sector)?.id;
      if (tradeId) params.set('trade_id', tradeId);
    }
    navigate(`/recherche?${params.toString()}`, { replace: true });
  }, [navigate, trades, city, sector, status]);

  return null;
}
