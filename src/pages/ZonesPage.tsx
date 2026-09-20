import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MapPin, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { frenchRegions } from '@/data/mockData';
import { opportunitiesApi } from '@/lib/apiClient';

// Same accent/case fold HomePage.tsx's map uses for matching /stats/regions'
// raw (not-always-consistently-accented) region strings against the real
// 13-region list, so this page's counts agree with the map's and the
// search results' instead of drifting again the way the old hardcoded
// numbers did.
function normalizeFr(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Client's contre-audit (15 Sep 2026), ticket N03: this route is meant to
// be a geographic entry point ("/zones affichait une page de secteur ...
// Elle affiche encore Travaux & construction au lieu d'un choix
// géographique") - it was rendering a sector-confirmation card instead of
// letting the visitor pick a region or département. Rebuilt as an actual
// geo picker: the 12 mainland regions already used on the homepage map
// (mockData.frenchRegions), each linking straight into /recherche?region=,
// plus a département name/code search reusing the same
// data/geo/departements.json + /recherche?department= pattern the
// homepage's location step and G01-G04 fixes already established.
export default function ZonesPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [deptQuery, setDeptQuery] = useState('');
  const [departements, setDepartements] = useState<{ code: string; nom: string }[] | null>(null);
  // Client's 20 Sep audit: this page showed hardcoded counts baked into
  // mockData.frenchRegions (Nouvelle-Aquitaine: 1432, Grand Est: 987 - the
  // exact stale numbers the audit quoted) while the homepage map and the
  // actual search results, both reading live /stats/regions data, showed
  // the real current totals (3 938 / 3 807). Fetches the same endpoint
  // HomePage's map uses, so this page can't drift from what clicking
  // through to /recherche actually returns again.
  const [regionCounts, setRegionCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    opportunitiesApi.statsByRegion()
      .then(({ regions }) => {
        const map: Record<string, number> = {};
        regions.forEach((r) => { const key = normalizeFr(r.region); map[key] = (map[key] || 0) + r.count; });
        setRegionCounts(map);
      })
      .catch(() => setRegionCounts({}));
  }, []);

  useEffect(() => {
    import('@/data/geo/departements.json').then((m) => {
      const features = ((m.default as { features: { properties: { code: string; nom: string } }[] }).features) || [];
      setDepartements(features.map((f) => f.properties));
    }).catch(() => setDepartements([]));
  }, []);

  const departmentMatches = useMemo(() => {
    const trimmed = deptQuery.trim();
    if (!trimmed || !departements) return [];
    const q = trimmed.toLowerCase();
    return departements
      .filter((d) => d.nom.toLowerCase().includes(q) || d.code === trimmed || d.code.replace(/^0/, '') === trimmed)
      .slice(0, 8);
  }, [deptQuery, departements]);

  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 min-h-screen flex flex-col">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs md:text-sm text-[#B9BBC8] mb-4">
          <Link
            to="/"
            className="text-orange hover:text-orange/80 transition-colors"
            aria-label="Go back to home"
          >
            <ChevronRight size={16} className="rotate-180" />
          </Link>
          <span>{t('zoneBreadcrumbHome') || 'Accueil'}</span>
          <span className="text-[#4A5568]">•</span>
          <span className="text-white font-medium">{t('zoneBreadcrumbZones') || 'Zones géographiques'}</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          {t('zoneGeoTitle') || 'Choisissez votre zone'}
        </h1>
        <p className="text-[#B9BBC8] text-base md:text-lg max-w-2xl">
          {t('zoneGeoSub') || 'Une région ou un département pour retrouver directement les opportunités de votre secteur géographique.'}
        </p>
      </div>

      {/* Département search */}
      <div className="mb-8">
        <label className="block text-xs md:text-sm font-semibold text-[#B9BBC8] mb-2" htmlFor="zone-dept-search">
          {t('zoneDeptSearchLabel') || 'Rechercher un département'}
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6B80]" />
          <input
            id="zone-dept-search"
            type="text"
            value={deptQuery}
            onChange={(e) => setDeptQuery(e.target.value)}
            placeholder={t('zoneDeptSearchPlaceholder') || 'Nom ou numéro (ex. Gironde, 33)'}
            className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-[#5B6B80] focus:outline-none focus:border-orange/50"
          />
        </div>
        {departmentMatches.length > 0 && (
          <div className="mt-2 bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
            {departmentMatches.map((d) => (
              <button
                key={d.code}
                type="button"
                onClick={() => navigate(`/recherche?department=${d.code}`)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-orange/10 transition-colors text-left border-b border-[#17334D] last:border-b-0"
              >
                <MapPin size={14} className="text-orange shrink-0" />
                {d.nom} — {d.code}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Regions */}
      <div className="mb-2">
        <h2 className="text-sm md:text-base font-bold text-white mb-3">{t('zoneRegionsTitle') || 'Ou choisissez une région'}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
        {frenchRegions.map((region) => (
          <Link
            key={region.name}
            to={`/recherche?region=${encodeURIComponent(region.name)}`}
            className="w-full flex flex-row items-center gap-4 p-4 rounded-xl border bg-[#061D32] border-[#17334D] hover:border-orange/40 text-left transition-all duration-200 group"
          >
            <div className="shrink-0 w-10 h-10 flex items-center justify-center text-orange border border-orange/30 group-hover:bg-orange/10 transition-colors rounded-lg">
              <MapPin size={18} strokeWidth={1.5} className="text-orange" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white">{region.name}</h3>
              <p className="text-xs text-[#B9BBC8]">
                {regionCounts === null
                  ? '…'
                  : `${regionCounts[normalizeFr(region.name)] ?? 0} ${t('zoneOpportunitiesCount') || 'opportunités'}`}
              </p>
            </div>
            <ChevronRight size={18} className="text-orange shrink-0 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}
