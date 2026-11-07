import { Navigate, useLocation } from 'react-router-dom';
import { legacySearchToListe } from '@/pages/RechercheRedirect';

// 7 nov. : l'ancien assistant pas-à-pas (/parcours) menait à l'ancienne recherche. Recherche de partenaire → « Publier un
// besoin » ; tout le reste → la liste actuelle avec les mêmes critères.
export default function ParcoursRedirect() {
  const { search } = useLocation();
  const p = new URLSearchParams(search);
  if (p.get('type') === 'sous-traitance' || p.get('mode') === 'partenaire') return <Navigate to="/publier-un-besoin" replace />;
  return <Navigate to={legacySearchToListe(search)} replace />;
}
