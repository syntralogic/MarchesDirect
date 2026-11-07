import { Navigate, useLocation } from 'react-router-dom';

// 7 nov. (Hedi) : la carte de l'accueil, les pages Zones/Secteurs et d'anciens liens menaient encore à l'ancienne page
// « Recherche d'opportunités » (/recherche), avec les anciens visuels. Tout passe par la liste actuelle (/vos-marches) :
// mêmes critères, traduits (plusieurs départements → liste ; région → ses départements ; ville avec coordonnées → autour).
const REGION_DEPTS: Record<string, string[]> = {
  'auvergne-rhone-alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  'bourgogne-franche-comte': ['21', '25', '39', '58', '70', '71', '89', '90'],
  'bretagne': ['22', '29', '35', '56'],
  'centre-val de loire': ['18', '28', '36', '37', '41', '45'],
  'corse': ['2A', '2B'],
  'grand est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  'hauts-de-france': ['02', '59', '60', '62', '80'],
  'ile-de-france': ['75', '77', '78', '91', '92', '93', '94', '95'],
  'normandie': ['14', '27', '50', '61', '76'],
  'nouvelle-aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  'occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  'pays de la loire': ['44', '49', '53', '72', '85'],
  "provence-alpes-cote d'azur": ['04', '05', '06', '13', '83', '84'],
  'guadeloupe': ['971'], 'martinique': ['972'], 'guyane': ['973'], 'la reunion': ['974'], 'mayotte': ['976'],
};
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

export function legacySearchToListe(search: string): string {
  const p = new URLSearchParams(search); const out = new URLSearchParams();
  const q = p.get('q') || p.get('search') || p.get('keyword') || '';
  if (q.trim()) out.set('q', q.trim());
  const tradeId = p.get('trade_id'); if (tradeId) out.set('trade_id', tradeId);
  const depts = new Set<string>();
  for (const d of p.getAll('department')) d.split(',').map(x => x.trim().toUpperCase()).filter(Boolean).forEach(x => depts.add(x));
  for (const r of p.getAll('region')) for (const d of REGION_DEPTS[fold(r)] || []) depts.add(d);
  if (depts.size) out.set('department', [...depts].join(','));
  const lat = p.get('lat'), lng = p.get('lng');
  if (lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) { out.set('lat', lat); out.set('lng', lng); out.set('radius_km', p.get('radius_km') || '50'); out.delete('department'); }
  const j = p.get('journey'); if (j) out.set('journey', j);
  const sort = p.get('sort'); if (sort) out.set('sort', sort);
  return `/vos-marches${out.toString() ? `?${out}` : ''}`;
}

export default function RechercheRedirect() {
  const { search } = useLocation();
  return <Navigate to={legacySearchToListe(search)} replace />;
}
