import { OpportunityLink } from '@/contexts/OpportunityTransitionContext';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, ArrowRight, Search, MousePointerClick, Locate, MapPin, Loader2, AlertCircle, X } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { geoCentroid, geoMercator } from 'd3-geo';
import { useLang } from '@/contexts/LangContext';
import { frenchCitiesGeo, type CityGeo } from '@/data/frenchCitiesGeo';
import { opportunitiesApi, type ApiOpportunity } from '@/lib/apiClient';
import { useOpportunityCounts } from '@/hooks/use-opportunity-counts';
import { DEFAULT_CITY_RADIUS_KM } from '@/lib/searchRadius';

export interface GeoFeatureProps { code: string; nom: string }
interface GeoFeature { rsmKey: string; properties: GeoFeatureProps }
interface GeoJsonData { type: string; features: unknown[] }

function touchAwareZoomFilter(event: { type: string; touches?: TouchList; ctrlKey?: boolean; button?: number }) {
  if (event.type === 'touchstart' || event.type === 'touchmove' || event.type === 'touchend') {
    return !!(event.touches && event.touches.length > 1);
  }
  return !event.ctrlKey && !event.button;
}

function normalizeFr(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-'’]/g, ' ').replace(/\s+/g, ' ').trim();
}


// 4 Oct client brief: page anchors. A click scrolls smoothly to the section
// further down the same page (targets carry scroll-mt-16 to clear the sticky
// header); the URL hash is updated without a jump so the back button still works.

// ---------------------------------------------------------------------------
// GEOGRAPHIC ("Des opportunités partout en France.")
// ---------------------------------------------------------------------------
interface GeographicSectionProps {
  tab: 'regions' | 'departments' | 'cities';
  setTab: (t: 'regions' | 'departments' | 'cities') => void;
  selectedRegions: GeoFeatureProps[];
  setSelectedRegions: React.Dispatch<React.SetStateAction<GeoFeatureProps[]>>;
  selectedDepts: GeoFeatureProps[];
  setSelectedDepts: React.Dispatch<React.SetStateAction<GeoFeatureProps[]>>;
}

// 26 Sep client audit, point 7: tab/selectedRegions/selectedDepts now come
// from HomePage (shared with SectorsSection - see HomePage's own comment)
// instead of being this component's own useState. Everything else below
// (map rendering, zoom, cities/city-radius search, counts) stays local -
// only the three pieces SectorsSection actually needs to agree with are
// lifted, to keep this change as small as the bug it fixes.
export default function GeographicSection({ tab, setTab, selectedRegions, setSelectedRegions, selectedDepts, setSelectedDepts }: GeographicSectionProps) {
  const { t } = useLang();
  const navigate = useNavigate();
  const { counts: siteWideCounts } = useOpportunityCounts();
  const [search, setSearch] = useState('');
  const [selectedCities, setSelectedCities] = useState<{name: string; coords: [number, number]}[]>([]);
  const [, setHovered] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResult, setCityResult] = useState<{ name: string; coords: [number, number] | null } | null>(null);
  const [cityOpportunities, setCityOpportunities] = useState<ApiOpportunity[]>([]);
  const [cityTotal, setCityTotal] = useState(0);
  // Perimeter the cityTotal above was actually computed with: DEFAULT_CITY_RADIUS_KM
  // when the city resolved to coordinates (real distance filter, same as
  // /recherche), null when it fell back to a plain city-name match.
  const [cityRadiusKm, setCityRadiusKm] = useState<number | null>(null);
  // Exact coordinates cityTotal above was computed with (25 Sep audit) -
  // handed off to /recherche via the URL so it reuses this point instead
  // of re-geocoding the city name a second time and risking a different
  // (or failed) result. Null whenever coords couldn't be resolved, same
  // as cityRadiusKm.
  const [cityApiCoords, setCityApiCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  // Counter shown on the "Voir les opportunités autour de …" button - always
  // computed for the whole selection with the same rule /recherche applies
  // (one city -> real radius; several cities -> plain name match), so the
  // announced perimeter and the number can never disagree.
  const [selectionCount, setSelectionCount] = useState<{ total: number; radiusKm: number | null; coords: { lat: number; lng: number } | null } | null>(null);
  const selectionRequestId = useRef(0);
  const [position, setPosition] = useState({ coordinates: [2.4, 46.6] as [number, number], zoom: 1 });
  const [citiesPosition, setCitiesPosition] = useState({ coordinates: [2.4, 46.6] as [number, number], zoom: 1 });
  // G09 (contre-audit 15 Sep): "10 noms à faible zoom, 57 à fort zoom... les
  // quatre villes signalées absentes des marqueurs" - Angoulême, Périgueux,
  // Bergerac et Marmande stayed missing "au niveau élevé testé" even though
  // the total count (57) was already correct.
  //
  // Root cause: citiesPosition.zoom was doing two unrelated jobs at once -
  // (1) how many city labels to reveal (the tier system below), which the
  // client's own wording treats as a country-wide density dial ("57" is a
  // constant regardless of where you're looking, per the audit's repeated
  // identical count), and (2) the ZoomableGroup's actual optical
  // magnification, which shrinks the visible geographic area around
  // whatever citiesPosition.coordinates happens to be. Clicking "+"
  // repeatedly (with coordinates still at the default center) increases
  // both at once - at zoom 8 the visible viewport is a small fraction of
  // France around that fixed point, so any tier-3 city far from it (all
  // four flagged cities sit ~200-280km southwest, near Bordeaux) is
  // logically "in" the 57-city count but physically clipped off-screen by
  // the SVG viewport - invisible no matter how far past its own tier
  // threshold you zoom, unless you'd also happened to drag/search/click
  // your way over there first.
  //
  // Client audit (19 Sep), point 3: "les boutons + / − ajoutent ou
  // retirent des noms de villes sans agrandir ou réduire réellement la
  // carte. Ces boutons doivent modifier le véritable zoom." The G09 fix
  // above (decoupling label density from citiesPosition.zoom) solved that
  // bug but created this one - the buttons stopped touching the map's
  // actual optical zoom at all, which reads as broken zoom controls (and
  // is: a "+" that doesn't visually enlarge anything is not a zoom
  // control). Re-merged, but the G09 root cause (a city geographically far
  // from citiesPosition.coordinates being "revealed" by tier yet clipped
  // off-screen by a narrow high-zoom viewport) is fixed properly this time
  // instead of by decoupling: visibleCities below now also checks whether
  // a city actually falls within the currently visible area (derived from
  // citiesPosition itself), so the reveal-by-tier and what's physically
  // on-screen can never disagree again - the buttons drive real zoom, and
  // "which cities show" adapts to both the zoom level AND the visible part
  // of the map, per the client's own wording for this point.
  const labelDensity = citiesPosition.zoom;

  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({});
  const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});
  // Nationwide rows with no resolved region/department at all (26 Sep fix -
  // see the fetch effect below for why these get a proportional per-region/
  // department display share instead of staying invisible or being folded
  // identically into every single one).
  const [unlocatedRegionCount, setUnlocatedRegionCount] = useState(0);
  const [unlocatedDeptCount, setUnlocatedDeptCount] = useState(0);
  const [regionsGeoJson, setRegionsGeoJson] = useState<GeoJsonData | null>(null);
  const [departementsGeoJson, setDepartementsGeoJson] = useState<GeoJsonData | null>(null);
  const [geoLoadError, setGeoLoadError] = useState(false);

  useEffect(() => {
    import('@/data/geo/regions.json')
      .then(m => setRegionsGeoJson(m.default as GeoJsonData))
      .catch(err => { console.error('Failed to load regions.json', err); setGeoLoadError(true); });
    import('@/data/geo/departements.json')
      .then(m => setDepartementsGeoJson(m.default as GeoJsonData))
      .catch(err => { console.error('Failed to load departements.json', err); setGeoLoadError(true); });
  }, []);

  useEffect(() => {
    // 26 Sep fix (client: "wo divide kr do khe konse region mein display
    // honge, phir original data ke baad display krwana") - unlocatedCount
    // still must never be folded INTO any single region/department's own
    // count (see getRegionCount/getDeptCount below - that's the exact
    // duplication bug this fixed a few hours ago). But leaving it
    // completely invisible per-region meant selecting just 2 of 13 regions
    // showed 253 while selecting all 13 jumped to 70 330 with nothing in
    // between explaining the gap. Each region/department badge now also
    // shows its own proportional share of that nationwide pool - "228
    // opportunités disponibles" (real, resolved) followed by "+ ~1 780
    // estimées (non localisées, réparties au prorata)" (a display-only
    // estimate, weighted by that region's share of all resolved rows) -
    // appended after, visually distinct, never merged into the first
    // number so it can't be mistaken for a verified count.
    opportunitiesApi.statsByRegion()
      .then(({ regions, unlocatedCount }) => {
        const map: Record<string, number> = {};
        // G13: was `map[key] = r.count`, which silently overwrote an
        // earlier variant's count instead of adding to it if two rows ever
        // normalized to the same key here (the real fix is upstream - see
        // /stats/regions - which now sums server-side and returns one row
        // per region; this is a defensive fallback so a future upstream
        // slip degrades to double-counting rather than losing counts again).
        regions.forEach(r => { const key = normalizeFr(r.region); map[key] = (map[key] || 0) + r.count; });
        setRegionCounts(map);
        setUnlocatedRegionCount(unlocatedCount || 0);
      })
      .catch(() => setRegionCounts({}));
    opportunitiesApi.statsByDepartment()
      .then(({ departments, unlocatedCount }) => {
        const map: Record<string, number> = {};
        departments.forEach(d => { map[d.department] = (map[d.department] || 0) + d.count; });
        setDeptCounts(map);
        setUnlocatedDeptCount(unlocatedCount || 0);
      })
      .catch(() => setDeptCounts({}));
  }, []);

  // A region/department filter now deliberately keeps opportunities whose
  // corresponding location field is NULL (see backend fix), so the map's
  // displayed count for any single region/department needs to include that
  // same unknown-location pool to match what clicking through to /recherche
  // will actually show.
  // 26 Sep fix ("ek element select karne pe 9200+, pura map select karne pe
  // sirf 11k+"): these used to add unlocatedRegionCount/unlocatedDeptCount
  // (the entire nationwide un-located pool) to EVERY single region/
  // department's badge, so one region could show more opportunities than
  // the whole, unfiltered country - mostly unrelated data with no real
  // connection to that region. The backend's region/department filter no
  // longer folds that pool into a single zone's results (see
  // routes/opportunities.ts), so this must match: a zone's badge is just
  // its own real, resolved matches.
  const getRegionCount = (name: string) => regionCounts[normalizeFr(name)] ?? 0;
  const getDeptCount = (code: string, name: string) => deptCounts[code] ?? deptCounts[normalizeFr(name)] ?? 0;
  // Proportional (display-only, never merged into getRegionCount/getDeptCount
  // above) share of the nationwide un-located pool: weighted by this one
  // region/department's share of every resolved row, so the 13 shares add
  // up to unlocatedRegionCount exactly once in total, not once per region.
  const resolvedRegionTotal = Object.values(regionCounts).reduce((sum, n) => sum + n, 0);
  const resolvedDeptTotal = Object.values(deptCounts).reduce((sum, n) => sum + n, 0);
  const getRegionUnlocatedShare = (name: string) => {
    if (unlocatedRegionCount <= 0 || resolvedRegionTotal <= 0) return 0;
    return Math.round(unlocatedRegionCount * (getRegionCount(name) / resolvedRegionTotal));
  };
  const getDeptUnlocatedShare = (code: string, name: string) => {
    if (unlocatedDeptCount <= 0 || resolvedDeptTotal <= 0) return 0;
    return Math.round(unlocatedDeptCount * (getDeptCount(code, name) / resolvedDeptTotal));
  };

  // Same rule as /recherche (RecherchePage): a single city is resolved to
  // coordinates through the backend geocoder and searched with a real
  // DEFAULT_CITY_RADIUS_KM distance filter; if it can't be resolved we fall
  // back to the plain city-name match and report radiusKm = null so the UI
  // doesn't announce a perimeter it didn't apply.
  const searchAroundCity = async (name: string, limit: number) => {
    const coords = await opportunitiesApi.geocodeCity(name);
    const data = coords
      ? await opportunitiesApi.search({ journey: undefined, lat: coords.lat, lng: coords.lng, radius_km: DEFAULT_CITY_RADIUS_KM, limit })
      : await opportunitiesApi.search({ journey: undefined, city: name, limit });
    // 25 Sep audit: the "Voir toutes les opportunités..." link below only
    // ever sent `city=<name>`, never the lat/lng this count was actually
    // computed with - so /recherche re-geocoded the same city name from
    // scratch. Usually landed on the same point, but not guaranteed to
    // (a second, independent call to the same external geocoder), and if
    // that second call ever failed, silently fell back to a plain
    // city-name text match with no radius applied at all - a card here
    // could say "123 dans un rayon de 50 km" while the link it sits next
    // to showed 90 (fewer, since the destination text-match won't return
    // registered communes near Bordeaux, only ones literally named
    // "Bordeaux"), including at a wider radius since a null cityCoords
    // downstream never sends radius_km at all no matter what's selected.
    // Returning the exact coordinates this total was computed with (see
    // callers below) lets the link hand them off directly instead.
    return { results: data.results, total: data.pagination.total, radiusKm: coords ? DEFAULT_CITY_RADIUS_KM : null, coords };
  };

  const handleCitySearch = async (override?: string) => {
    const raw = override ?? cityQuery;
    if (!raw.trim()) return;
    if (override) setCityQuery(override);
    setCityLoading(true);
    const query = raw.trim();
    try {
      const [around, geo] = await Promise.all([
        searchAroundCity(query, 5),
        fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=1`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
      ]);
      setCityOpportunities(around.results);
      setCityTotal(around.total);
      setCityRadiusKm(around.radiusKm);
      setCityApiCoords(around.coords);
      const feature = geo?.features?.[0];
      const coords: [number, number] | null = feature ? [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] : null;
      const resolvedName = feature?.properties?.city || query;
      setCityResult({ name: resolvedName, coords });
      // Client's audit (20 Sep, location point 5): typing a city into this
      // box updated cityOpportunities/cityTotal/cityResult but never
      // touched selectedCities - which is what the "Voir les opportunités
      // autour de ..." button's label AND its /recherche?city= link are
      // built from (see the tab==='cities' href below and the button
      // around line ~1015). So after picking Libourne on the map (setting
      // selectedCities) and then typing "Périgueux" here, the button kept
      // reading "autour de Libourne" with Périgueux's count grafted onto
      // it, and its link still pointed at Libourne (empty results). Only
      // do this for a text-box search (no override) - selectMapCity
      // passes an override and manages selectedCities itself for its own
      // multi-marker toggle behaviour, which this must not clobber.
      if (override === undefined) setSelectedCities(coords ? [{ name: resolvedName, coords }] : []);
      // Client's audit (15 Sep): "il faut... centrer la carte sur la ville
      // recherchée" - typing a city into the search box (as opposed to
      // clicking a marker, which already did this via selectMapCity) found
      // opportunities but never moved the map at all, so the map stayed
      // wherever it happened to be while the results below it were for a
      // totally different city.
      if (coords) setCitiesPosition(p => ({ coordinates: coords, zoom: Math.max(p.zoom, 4) }));
    } catch {
      setCityResult({ name: query, coords: null });
      setCityOpportunities([]);
      setCityTotal(0);
      setCityRadiusKm(null);
      setCityApiCoords(null);
      if (override === undefined) setSelectedCities([]);
    } finally {
      setCityLoading(false);
    }
  };

  // Count for the "Voir les opportunités autour de …" button: recomputed
  // whenever the selection changes so it always describes exactly what the
  // /recherche link will show (see buildSearchUrl / RecherchePage).
  useEffect(() => {
    const names = selectedCities.map(c => c.name);
    if (names.length === 0) { setSelectionCount(null); return; }
    const requestId = ++selectionRequestId.current;
    setSelectionCount(null);
    (async () => {
      try {
        if (names.length === 1) {
          const { total, radiusKm, coords } = await searchAroundCity(names[0], 1);
          if (selectionRequestId.current === requestId) setSelectionCount({ total, radiusKm, coords });
        } else {
          const data = await opportunitiesApi.search({ journey: undefined, city: names.join(','), limit: 1 });
          if (selectionRequestId.current === requestId) setSelectionCount({ total: data.pagination.total, radiusKm: null, coords: null });
        }
      } catch {
        if (selectionRequestId.current === requestId) setSelectionCount(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCities]);

  const selectMapCity = (city: { name: string; coords: [number, number] }) => {
    setCitiesPosition(p => ({ coordinates: city.coords, zoom: Math.max(p.zoom, 4) }));
    setSelectedCities(prev => {
      const exists = prev.some(c => c.name === city.name);
      return exists ? prev.filter(c => c.name !== city.name) : [...prev, city];
    });
    handleCitySearch(city.name);
  };

  // Rough (non-Mercator-accurate, but this codebase already treats
  // coordinates as plain lng/lat everywhere, not a real GIS projection) half
  // -span of what's visible around citiesPosition.coordinates at the
  // current zoom. BASE_HALF_* sized so zoom=1 comfortably covers mainland
  // France (~-5 to 9.5° lng, ~41 to 51° lat) end to end from the default
  // center - a city genuinely tier-revealed can only fail the bounds check
  // once you've actually zoomed/panned in far enough that it's realistically
  // off-screen, not before.
  const BASE_HALF_LNG = 8;
  const BASE_HALF_LAT = 6;
  const [centerLng, centerLat] = citiesPosition.coordinates;
  const halfLng = BASE_HALF_LNG / citiesPosition.zoom;
  const halfLat = BASE_HALF_LAT / citiesPosition.zoom;
  const visibleCities = frenchCitiesGeo.filter(c => {
    const tierRevealed = c.tier === 1 || (c.tier === 2 && labelDensity >= 2) || (c.tier === 3 && labelDensity >= 4);
    if (!tierRevealed) return false;
    const [lng, lat] = c.coords;
    return Math.abs(lng - centerLng) <= halfLng && Math.abs(lat - centerLat) <= halfLat;
  });
  // Client (19/20 Sep): "afficher trois ou quatre villes principales par
  // département... Bordeaux, Mérignac et Pessac se chevauchent." Tier
  // filtering above has no notion of department - once tier 3 opens up,
  // every close-together small town in the same département (Bordeaux +
  // Mérignac + Pessac sit within ~8km of each other) appears at once. Cap
  // each département to 4 markers: always keep its highest-tier city
  // (the anchor), then greedily add whichever remaining candidate is
  // farthest from what's already picked, so the picks spread across the
  // département (e.g. Bordeaux, Libourne, Langon, Arcachon) instead of
  // clustering around the first one found.
  const MAX_CITIES_PER_DEPARTMENT = 4;
  const visibleCitiesCapped = (() => {
    const byDept = new Map<string, CityGeo[]>();
    for (const c of visibleCities) {
      const list = byDept.get(c.department) || [];
      list.push(c);
      byDept.set(c.department, list);
    }
    const distSq = (a: [number, number], b: [number, number]) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    const result: CityGeo[] = [];
    for (const list of byDept.values()) {
      if (list.length <= MAX_CITIES_PER_DEPARTMENT) { result.push(...list); continue; }
      const sortedByTier = [...list].sort((a, b) => a.tier - b.tier);
      const chosen: CityGeo[] = [sortedByTier[0]];
      const remaining = sortedByTier.slice(1);
      while (chosen.length < MAX_CITIES_PER_DEPARTMENT && remaining.length > 0) {
        let bestIdx = 0, bestMinDist = -1;
        remaining.forEach((cand, i) => {
          const minDist = Math.min(...chosen.map(ch => distSq(ch.coords, cand.coords)));
          if (minDist > bestMinDist) { bestMinDist = minDist; bestIdx = i; }
        });
        chosen.push(remaining[bestIdx]);
        remaining.splice(bestIdx, 1);
      }
      result.push(...chosen);
    }
    return result;
  })();
  // 20 Sep audit (location point 1): "Bordeaux/Libourne et Langon/Marmande
  // se chevauchent au zoom." Two separate causes:
  //  1. Markers sat inside <ZoomableGroup>, which scales its children, so
  //     dots and labels grew with the zoom exactly as fast as the distances
  //     between cities did - zooming in could never pull neighbours apart.
  //     They are now counter-scaled (1 / zoom) so a marker keeps a constant
  //     on-screen size and zooming genuinely separates close cities.
  //  2. The per-département cap above knows nothing about cities of
  //     *different* départements sitting next to each other (Langon 33 /
  //     Marmande 47). Labels are now decluttered in screen space: cities
  //     are placed by priority (selected first, then tier) and any city
  //     whose label box would touch an already-placed one is hidden until
  //     the visitor zooms in far enough to have room for it.
  // Same projection ComposableMap is configured with below (react-simple-maps
  // translates to width/2, height/2 by default).
  const cityProjection = geoMercator().center([2.454, 46.6]).scale(2600).translate([390, 310]);
  const visibleCitiesDeclutter = (() => {
    const zoom = citiesPosition.zoom;
    const centerPx = cityProjection(citiesPosition.coordinates) || [390, 310];
    const toScreen = (coords: [number, number]): [number, number] | null => {
      const p = cityProjection(coords);
      return p ? [(p[0] - centerPx[0]) * zoom, (p[1] - centerPx[1]) * zoom] : null;
    };
    const LABEL_CHAR_W = 5.6; // ~9px semi-bold
    const PAD = 4;
    const boxFor = (c: CityGeo, [x, y]: [number, number]) => {
      const w = c.name.length * LABEL_CHAR_W + 8;
      return { l: x - w / 2 - PAD, r: x + w / 2 + PAD, t: y - 20 - PAD, b: y + 6 + PAD };
    };
    const isSel = (c: CityGeo) => selectedCities.some(sc => sc.name === c.name);
    const ordered = [...visibleCitiesCapped].sort((a, b) => Number(isSel(b)) - Number(isSel(a)) || a.tier - b.tier || a.name.localeCompare(b.name));
    const placed: { l: number; r: number; t: number; b: number }[] = [];
    const result: CityGeo[] = [];
    for (const c of ordered) {
      const px = toScreen(c.coords);
      if (!px) continue;
      const box = boxFor(c, px);
      const collides = placed.some(o => box.l < o.r && box.r > o.l && box.t < o.b && box.b > o.t);
      if (collides && !isSel(c)) continue;
      placed.push(box);
      result.push(c);
    }
    return result;
  })();
  const zoomLevelLabel = labelDensity >= 4 ? 'Élevé' : labelDensity >= 2 ? 'Moyen' : 'Faible';

  // BUG (found in user testing, 29 Sep): typing a name letter-by-letter can
  // pass through an intermediate string that uniquely (if briefly) matches a
  // *different* region/department than the one being typed - e.g. "Cotes d
  // Armor" passes through "cote", which uniquely substring-matches
  // "Provence-Alpes-Côte d'Azur". That got auto-added to selectedRegions and,
  // because this effect only ever added and never removed, it stayed
  // selected (and got searched on Enter) even once further typing made it no
  // longer match anything. These refs remember which region/department (if
  // any) THIS effect auto-added for the current tab, so a later run can undo
  // that specific auto-add when it's no longer the unique match - without
  // touching a region/department the user selected by clicking the map.
  const autoMatchedRegionCode = useRef<string | null>(null);
  const autoMatchedDeptCode = useRef<string | null>(null);
  useEffect(() => {
    if (!search.trim()) {
      if (autoMatchedRegionCode.current) {
        const staleCode = autoMatchedRegionCode.current;
        setSelectedRegions(prev => prev.filter(r => r.code !== staleCode));
        autoMatchedRegionCode.current = null;
      }
      if (autoMatchedDeptCode.current) {
        const staleCode = autoMatchedDeptCode.current;
        setSelectedDepts(prev => prev.filter(d => d.code !== staleCode));
        autoMatchedDeptCode.current = null;
      }
      return;
    }
    const query = normalizeFr(search);
    if (tab === 'regions' && regionsGeoJson) {
      const matches = (regionsGeoJson.features as { properties: GeoFeatureProps }[]).filter(f =>
        normalizeFr(f.properties.nom).includes(query)
      );
      // An exact name wins over a substring hit ("Rhône" also matches
      // "Bouches-du-Rhône"), otherwise typing the full name never selected.
      const exact = matches.filter(f => normalizeFr(f.properties.nom) === query);
      const picked = matches.length === 1 ? matches : exact.length === 1 ? exact : [];
      const newCode = picked.length === 1 ? picked[0].properties.code : null;
      if (autoMatchedRegionCode.current && autoMatchedRegionCode.current !== newCode) {
        const staleCode = autoMatchedRegionCode.current;
        setSelectedRegions(prev => prev.filter(r => r.code !== staleCode));
      }
      if (newCode && newCode !== autoMatchedRegionCode.current) {
        const match = picked[0].properties;
        setSelectedRegions(prev => (prev.some(r => r.code === match.code) ? prev : [...prev, match]));
      }
      autoMatchedRegionCode.current = newCode;
    } else if (tab === 'departments' && departementsGeoJson) {
      const matches = (departementsGeoJson.features as { properties: GeoFeatureProps }[]).filter(
        f => normalizeFr(f.properties.nom).includes(query) || f.properties.code?.includes(search.trim())
      );
      const exact = matches.filter(f => normalizeFr(f.properties.nom) === query || f.properties.code === search.trim());
      const picked = matches.length === 1 ? matches : exact.length === 1 ? exact : [];
      const newCode = picked.length === 1 ? picked[0].properties.code : null;
      if (autoMatchedDeptCode.current && autoMatchedDeptCode.current !== newCode) {
        const staleCode = autoMatchedDeptCode.current;
        setSelectedDepts(prev => prev.filter(d => d.code !== staleCode));
      }
      if (newCode && newCode !== autoMatchedDeptCode.current) {
        const match = picked[0].properties;
        setSelectedDepts(prev => (prev.some(d => d.code === match.code) ? prev : [...prev, match]));
      }
      autoMatchedDeptCode.current = newCode;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab, regionsGeoJson, departementsGeoJson]);

  const getSelectedItems = () => {
    if (tab === 'regions') return selectedRegions;
    if (tab === 'departments') return selectedDepts;
    return selectedCities;
  };
  const removeSelection = (item: any) => {
    if (tab === 'regions') setSelectedRegions(prev => prev.filter(r => r.code !== item.code));
    else if (tab === 'departments') setSelectedDepts(prev => prev.filter(d => d.code !== item.code));
    else setSelectedCities(prev => prev.filter(c => c.name !== item.name));
  };

  const selected = getSelectedItems();
  const selectedCount = selected.length;

  // Lifted out of buildSearchUrl (below) so combinedSelectedTotal can use
  // the exact same "is this literally everything" check the click-through
  // URL already uses - see that function's own comment for why "all
  // selected" must be treated as "no location filter at all".
  const regionFeaturesAll = (regionsGeoJson?.features as { properties?: { code?: string } }[] | undefined) ?? [];
  const departmentFeaturesAll = (departementsGeoJson?.features as { properties?: { code?: string } }[] | undefined) ?? [];
  const selectedRegionCodesAll = new Set(selectedRegions.map(r => r.code));
  const selectedDepartmentCodesAll = new Set(selectedDepts.map(d => d.code));
  const allRegionsSelected = regionFeaturesAll.length > 0 && selectedRegions.length > 0
    && regionFeaturesAll.every(feature => feature.properties?.code && selectedRegionCodesAll.has(feature.properties.code));
  const allDeptsSelected = departmentFeaturesAll.length > 0 && selectedDepts.length > 0
    && departmentFeaturesAll.every(feature => feature.properties?.code && selectedDepartmentCodesAll.has(feature.properties.code));

  // Client report (26 Sep, WhatsApp screenshots): "Marchés publics" tile
  // says 70 695 opportunités, but selecting the whole map (every region
  // circled) shows "Total combiné 2 319". Cause: /stats/regions (and
  // /stats/departments) only ever counts status='active' rows that DO have
  // a resolved location_region/department (see that route's own 25/26 Sep
  // comments) - summing every single region therefore always undercounts
  // by (a) every non-active-status row and (b) the entire un-geocoded
  // pool, neither of which any region/department count can ever include.
  // Selecting literally every region/department is semantically "no
  // location filter at all" - buildSearchUrl already treats it that way
  // and sends a bare, unfiltered /recherche?status=all - so the number
  // shown here must match that same unfiltered universe instead of a sum
  // of necessarily-partial per-region counts. siteWideCounts.total (from
  // /stats/counts, the same source the homepage tiles above already use)
  // is exactly that: every status, every location, every journey.
  const combinedSelectedTotal = selectedCount === 0 ? 0
    : (tab === 'regions' && allRegionsSelected) || (tab === 'departments' && allDeptsSelected)
      ? siteWideCounts.total
      : tab === 'regions'
        // 26 Sep fix: was a bare sum of regionCounts (resolved rows only),
        // which is exactly the "253 for 2 regions, 70 330 once all 13 are
        // selected, nothing in between" jump the client flagged - the
        // un-located pool's proportional share (see getRegionUnlocatedShare
        // above) is now folded in here too, so this line always matches
        // what the per-region badges above it add up to.
        ? selectedRegions.reduce((sum, r) => sum + (regionCounts[normalizeFr(r.nom)] ?? 0) + getRegionUnlocatedShare(r.nom), 0)
        : tab === 'departments'
          ? selectedDepts.reduce((sum, d) => sum + (deptCounts[d.code] ?? deptCounts[normalizeFr(d.nom)] ?? 0) + getDeptUnlocatedShare(d.code, d.nom), 0)
          : 0;

    const buildSearchUrl = () => {
    // BUG (client report, 25 Sep - "pura map select karo to total bohot kam
    // ata hai"): the backend's region/department filters are a strict
    // `location_region ILIKE ANY(...)` / `location_department = ANY(...)`
    // match (see opportunities.ts) with no "OR IS NULL" fallback the way the
    // nature filter has - a row whose location wasn't resolved during
    // ingestion (geocodingService.ts's coverage gap) is silently dropped by
    // *any* region/department filter, selected-all included. Selecting every
    // region individually therefore undercounted the true nationwide total
    // by however many rows have no location_region at all - the ~2 500 the
    // client saw instead of the real, much larger, count. Selecting literally
    // every region/department on the map is semantically "no location filter
    // at all" (the visitor isn't narrowing anything), so send no region/
    // department params in that case and let /recherche's default
    // (unfiltered) view carry every opportunity, no-location rows included.
    // A genuine partial selection (1..n-1 regions) is left exactly as before -
    // widening that case to include no-location rows would reintroduce the
    // G13 map-vs-list count mismatch this filter was already fixed for.
    // Compares feature codes rather than raw feature/selection counts: some
    // GeoJSON sources represent one region/department as more than one
    // feature (multi-part geometries), which a plain length check can get
    // wrong in either direction. Checking that every feature's code is in
    // the selected set is correct regardless of how many features share a
    // code.
    //
    // allRegionsSelected/allDeptsSelected are computed once, above (next to
    // combinedSelectedTotal), and reused here so the displayed total and
    // this link can never disagree about what "everything" means.

    // Edge case: if the region/department GeoJSON hasn't finished loading
    // yet, allRegionsSelected/allDeptsSelected stay false no matter how many
    // regions/departments are selected (there's nothing to compare the count
    // against), so a "select all" click made before the GeoJSON loads would
    // still send a strict region=/department= filter instead of the bare,
    // unfiltered /recherche it should. Treat "GeoJSON not loaded" the same
    // as "everything selected".
    if (tab === 'regions' && selectedRegions.length > 0)
      return (allRegionsSelected || !regionsGeoJson) ? '/recherche?status=all' : `/recherche?status=all&${selectedRegions.map(r => `region=${encodeURIComponent(r.nom)}`).join('&')}`;
    if (tab === 'departments' && selectedDepts.length > 0)
      return (allDeptsSelected || !departementsGeoJson) ? '/recherche?status=all' : `/recherche?status=all&${selectedDepts.map(d => `department=${encodeURIComponent(d.code)}`).join('&')}`;
    if (tab === 'cities' && selectedCities.length > 0) {
      const cityParams = selectedCities.map(c => `city=${encodeURIComponent(c.name)}`).join('&');
      // 25 Sep audit: hand off the exact coordinates + radius selectionCount
      // was just computed with (single-city case only - see searchAroundCity)
      // so /recherche shows the same total this button just promised instead
      // of silently re-geocoding and possibly landing on a plain city-name
      // text match with no radius applied.
      if (selectedCities.length === 1 && selectionCount?.coords) {
        return `/recherche?${cityParams}&lat=${selectionCount.coords.lat}&lng=${selectionCount.coords.lng}&radius_km=${selectionCount.radiusKm ?? DEFAULT_CITY_RADIUS_KM}`;
      }
      return `/recherche?${cityParams}`;
    }
    return '/recherche';
  };

  return (
    <section id="mdh-zones" className="scroll-mt-16 px-4 md:px-6 py-8 md:py-14 max-w-3xl mx-auto w-full">
      <span className="text-[11px] font-bold text-orange uppercase tracking-widest">{t('nearYou')}</span>
      <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-2">
        Des opportunités partout en France.
      </h2>
      <p className="text-[#B9BBC8] text-sm mb-5">
        Explorez les marchés par région, département ou ville, puis précisez votre métier.
      </p>

      <div className="border border-[#17334D] rounded-2xl bg-[#061D32] p-4 md:p-5">
        <div className="grid grid-cols-3 gap-1 border border-[#17334D] rounded-xl p-1 w-full mb-4">
          {(['regions', 'departments', 'cities'] as const).map(k => (
            <button
              key={k}
              onClick={() => { setTab(k); setSearch(''); }}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === k ? 'bg-orange/15 text-orange border border-orange' : 'text-[#B9BBC8] hover:text-white border border-transparent'
              }`}
            >
              {t(k)}
            </button>
          ))}
        </div>

        {tab !== 'cities' ? (
          <>
            <label className="block text-xs text-[#B9BBC8] mb-2">
              {tab === 'regions' ? 'Rechercher une région' : 'Rechercher un département'}
            </label>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  // 28 Sep user test: Enter did nothing in this field (and the
                  // arrow next to it was a no-op), so typing "Bretagne" only
                  // highlighted the map - the visitor had to scroll below it to
                  // find the real CTA. Same destination as that CTA.
                  onKeyDown={e => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    if ((tab === 'regions' ? selectedRegions : selectedDepts).length > 0) navigate(buildSearchUrl());
                  }}
                  placeholder={tab === 'regions' ? 'Grand Est' : 'Bas-Rhin'}
                  className="w-full bg-[#031B30] border border-[#17334D] rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
                />
              </div>
              <button
                onClick={() => {
                  if ((tab === 'regions' ? selectedRegions : selectedDepts).length > 0) navigate(buildSearchUrl());
                }}
                className="w-12 h-12 rounded-xl bg-orange text-white flex items-center justify-center hover:bg-orange/90 transition-colors"
                aria-label="Rechercher"
              >
                <ArrowRight size={18} />
              </button>
            </div>
            <p className="text-[11px] text-[#B9BBC8] flex items-center gap-1.5 mb-3">
              <MousePointerClick size={12} /> Sélectionnez une région sur la carte ou dans la recherche.
            </p>

            <div className="relative rounded-xl overflow-hidden border border-[#17334D] bg-[#031B30] h-[300px] md:h-[420px]" style={{ touchAction: 'pan-y' }}>
              {geoLoadError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
                  <AlertCircle size={20} className="text-red-400 mb-2" />
                  <p className="text-xs text-[#B9BBC8]">Impossible de charger la carte. Rechargez la page.</p>
                </div>
              ) : !regionsGeoJson || !departementsGeoJson ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-orange" />
                </div>
              ) : (
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ center: [2.454, 46.6], scale: 2600 }}
                  width={780}
                  height={720}
                  style={{ width: '100%', height: '100%' }}
                >
                  <ZoomableGroup center={position.coordinates} zoom={position.zoom} onMoveEnd={setPosition} minZoom={1} maxZoom={8} filterZoomEvent={touchAwareZoomFilter as unknown as (element: SVGElement) => boolean}>
                    <Geographies geography={tab === 'regions' ? regionsGeoJson : departementsGeoJson}>
                      {({ geographies }: { geographies: GeoFeature[] }) =>
                        geographies.map(geo => {
                          const isSelected = tab === 'regions'
                            ? selectedRegions.some(r => r.code === geo.properties.code)
                            : tab === 'departments'
                            ? selectedDepts.some(d => d.code === geo.properties.code)
                            : false;
                          const isSearchMatch =
                            search !== '' &&
                            (normalizeFr(geo.properties.nom).includes(normalizeFr(search)) ||
                              (geo.properties.code?.includes(search) ?? false));
                          const labelText = tab === 'regions' ? geo.properties.nom : geo.properties.code;
                          const centroid = geoCentroid(geo as unknown as Parameters<typeof geoCentroid>[0]);
                          return (
                            <g key={geo.rsmKey}>
                              <Geography
                                geography={geo}
                                onMouseEnter={() => setHovered(geo.properties.nom)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => {
                                  if (tab === 'regions') {
                                    setSelectedRegions(prev => {
                                      const exists = prev.some(r => r.code === geo.properties.code);
                                      return exists ? prev.filter(r => r.code !== geo.properties.code) : [...prev, geo.properties];
                                    });
                                  } else {
                                    setSelectedDepts(prev => {
                                      const exists = prev.some(d => d.code === geo.properties.code);
                                      return exists ? prev.filter(d => d.code !== geo.properties.code) : [...prev, geo.properties];
                                    });
                                  }
                                }}
                                style={{
                                  default: { fill: isSelected || isSearchMatch ? '#FF6500' : '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none', cursor: 'pointer' },
                                  hover: { fill: isSelected || isSearchMatch ? '#FF6500' : '#5A7893', stroke: '#031B30', strokeWidth: 0.75, outline: 'none', cursor: 'pointer' },
                                  pressed: { fill: '#FF6500', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                                }}
                              />
                              {labelText && centroid && !isNaN(centroid[0]) && !isNaN(centroid[1]) && (
                                <Marker coordinates={centroid} style={{ default: { pointerEvents: 'none' }, hover: { pointerEvents: 'none' }, pressed: { pointerEvents: 'none' } }}>
                                  <text
                                    textAnchor="middle"
                                    style={{
                                      fontSize: tab === 'regions' ? 7.5 : 8,
                                      fill: '#fff',
                                      fontWeight: isSelected || isSearchMatch ? 700 : 500,
                                      pointerEvents: 'none',
                                      paintOrder: 'stroke',
                                      stroke: '#031B30',
                                      strokeWidth: 2,
                                      strokeLinejoin: 'round',
                                    }}
                                  >
                                    {labelText}
                                  </text>
                                </Marker>
                              )}
                            </g>
                          );
                        })
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              )}

              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={() => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))} className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">+</button>
                <button onClick={() => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))} className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">−</button>
                <button onClick={() => setPosition({ coordinates: [2.4, 46.6], zoom: 1 })} className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors flex items-center justify-center"><Locate size={14} /></button>
              </div>

              {selectedCount > 0 && (
                <div className="absolute bottom-3 left-3 bg-[#061D32]/95 border border-[#17334D] rounded-lg px-3 py-2 max-h-32 overflow-y-auto min-w-[150px] max-w-[250px]">
                  {selected.map((item, index) => {
                    const isRegion = 'nom' in item && 'code' in item;
                    const name = isRegion ? item.nom : (item as any).name;
                    const code = isRegion ? item.code : undefined;
                    const count = isRegion
                      ? (tab === 'regions' ? getRegionCount(item.nom) : getDeptCount(item.code, item.nom))
                      : undefined;
                    const unlocatedShare = isRegion
                      ? (tab === 'regions' ? getRegionUnlocatedShare(item.nom) : getDeptUnlocatedShare(item.code, item.nom))
                      : 0;
                    return (
                      <div key={code || name || index} className="flex items-center justify-between gap-2 py-1 border-b border-[#17334D]/50 last:border-0">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{name}</p>
                          {count !== undefined && (
                            <p className="text-[10px] text-orange font-medium">
                              {count.toLocaleString('fr-FR')} {count > 1 ? 'opportunités disponibles' : 'opportunité disponible'}
                            </p>
                          )}
                          {/* 26 Sep fix: appended AFTER the real, resolved
                              count above, never merged into it - a
                              proportional, clearly-labelled estimate of
                              this region/département's share of the
                              nationwide un-located pool, not a verified
                              number. */}
                          {unlocatedShare > 0 && (
                            <p className="text-[9px] text-[#B9BBC8]">
                              + {unlocatedShare.toLocaleString('fr-FR')} estimées (non localisées)
                            </p>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeSelection(item); }} aria-label={`Retirer ${name}`} className="text-red-400 hover:text-red-300 shrink-0 ml-1">
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {selectedCount > 1 && (tab === 'regions' || tab === 'departments') && (
                    <div className="flex items-center justify-between gap-2 pt-1.5 mt-0.5 border-t border-[#17334D]">
                      <p className="text-[10px] font-bold text-white">Total combiné</p>
                      <p className="text-[10px] font-bold text-orange">
                        {combinedSelectedTotal.toLocaleString('fr-FR')} {combinedSelectedTotal > 1 ? 'opportunités' : 'opportunité'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[10px] text-[#B9BBC8] text-center mt-3">
              Contours régionaux : IGN / France GeoJSON
            </p>

            {selectedCount > 0 ? (
              <Link
                to={buildSearchUrl()}
                className="mt-3 w-full flex items-center justify-center gap-2 border border-orange text-orange font-semibold text-sm py-3 px-3 rounded-xl hover:bg-orange/10 transition-colors text-center"
              >
                <span className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 min-w-0">
                  <span>Voir les opportunités en </span>
                  {selected.slice(0, 2).map((item, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      {'nom' in item ? item.nom : (item as any).name}
                    </span>
                  ))}
                  {selected.length > 2 && <span>+{selected.length - 2} autres</span>}
                </span>
                <ArrowRight size={14} className="shrink-0" />
              </Link>
            ) : (
              <div className="mt-3 flex flex-col items-center text-center py-4">
                <Globe size={26} className="text-orange mb-2" />
                <p className="text-sm font-bold text-white">Sélectionnez une zone</p>
                <p className="text-xs text-[#B9BBC8] mt-1">Touchez une région ou un département sur la carte.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
                <input
                  value={cityQuery}
                  onChange={e => { setCityQuery(e.target.value); setCityResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
                  placeholder={t('mapSearchCity') || 'Rechercher une ville'}
                  className="w-full bg-[#031B30] border border-[#17334D] rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
                />
              </div>
              <button
                onClick={() => handleCitySearch()}
                disabled={cityLoading || !cityQuery.trim()}
                className="px-4 bg-orange text-white font-semibold text-sm rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {cityLoading && <Loader2 size={14} className="animate-spin" />} Rechercher
              </button>
            </div>
            <p className="text-[11px] text-[#B9BBC8] flex items-center gap-1.5 mb-3">
              <MousePointerClick size={12} /> Touchez une ville sur la carte, ou zoomez pour en voir davantage.
            </p>

            <div className="relative rounded-xl overflow-hidden border border-[#17334D] bg-[#031B30] h-[240px] md:h-[320px] mb-3" style={{ touchAction: 'pan-y' }}>
              {geoLoadError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
                  <AlertCircle size={20} className="text-red-400 mb-2" />
                  <p className="text-xs text-[#B9BBC8]">Impossible de charger la carte. Rechargez la page.</p>
                </div>
              ) : !regionsGeoJson ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-orange" />
                </div>
              ) : (
                <ComposableMap projection="geoMercator" projectionConfig={{ center: [2.454, 46.6], scale: 2600 }} width={780} height={620} style={{ width: '100%', height: '100%' }}>
                  <ZoomableGroup center={citiesPosition.coordinates} zoom={citiesPosition.zoom} onMoveEnd={setCitiesPosition} minZoom={1} maxZoom={8} filterZoomEvent={touchAwareZoomFilter as unknown as (element: SVGElement) => boolean}>
                    <Geographies geography={regionsGeoJson}>
                      {({ geographies }: { geographies: GeoFeature[] }) =>
                        geographies.map(geo => (
                          <Geography key={geo.rsmKey} geography={geo} style={{
                            default: { fill: '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                            hover: { fill: '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                            pressed: { fill: '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                          }} />
                        ))
                      }
                    </Geographies>
                    {visibleCitiesDeclutter.map(city => {
                      const isSelected = selectedCities.some(c => c.name === city.name);
                      return (
                        <Marker key={city.name} coordinates={city.coords} onClick={() => selectMapCity(city)} style={{ default: { cursor: 'pointer' } }}>
                          <g transform={`scale(${1 / citiesPosition.zoom})`}>
                          {/* Client (19/20 Sep): "cliquer sur le texte «Libourne»
                              ne sélectionnait pas la ville, alors que cliquer sur
                              son point fonctionnait" + "surface suffisante pour
                              une sélection au doigt." onClick already sits on
                              the whole <Marker> group, so in principle the text
                              should fire it too - but an invisible, generously
                              sized hit-target spanning both the dot and the
                              label removes any doubt (small text glyphs are an
                              unreliable tap target on their own, especially on
                              mobile) rather than relying on SVG event bubbling
                              through a 9-11px <text> element. */}
                          <rect x={-24} y={-22} width={48} height={30} fill="transparent" style={{ cursor: 'pointer' }} />
                          {isSelected && <circle r={11} fill="#FF6500" fillOpacity={0.25} />}
                          <circle r={isSelected ? 6 : 4} fill="#FF6500" stroke="#fff" strokeWidth={1.2} />
                          <text textAnchor="middle" y={-9} style={{ fontSize: isSelected ? 11 : 9, fill: '#fff', fontWeight: isSelected ? 700 : 600, cursor: 'pointer', pointerEvents: 'none' }}>
                            {city.name}
                          </text>
                          </g>
                        </Marker>
                      );
                    })}
                  </ZoomableGroup>
                </ComposableMap>
              )}

              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={() => setCitiesPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))} aria-label="Zoomer" className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">+</button>
                <button onClick={() => setCitiesPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))} aria-label="Dézoomer" className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">−</button>
                <button onClick={() => setCitiesPosition({ coordinates: [2.4, 46.6], zoom: 1 })} aria-label="Recentrer la carte" className="w-9 h-9 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors flex items-center justify-center"><Locate size={14} /></button>
              </div>

              <div className="absolute bottom-3 left-3 bg-[#061D32]/95 border border-[#17334D] rounded-lg px-2.5 py-1.5">
                <p className="text-[10px] font-semibold text-white">Niveau de zoom : {zoomLevelLabel}</p>
              </div>
            </div>
            <p className="text-[11px] text-[#B9BBC8] mb-3">Plus vous zoomez, plus les villes apparaissent.</p>

            {cityLoading ? (
              <div className="rounded-xl border border-[#17334D] bg-[#031B30] p-8 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-orange" />
              </div>
            ) : !cityResult ? (
              <div className="rounded-xl border border-[#17334D] bg-[#031B30] p-6 flex flex-col items-center text-center">
                <Globe size={24} className="text-orange mb-2" />
                <p className="text-sm font-bold text-white">Sélectionnez une ville</p>
                <p className="text-xs text-[#B9BBC8] mt-1">Touchez une ville sur la carte ou lancez une recherche.</p>
              </div>
            ) : cityOpportunities.length === 0 ? (
              <div className="rounded-xl border border-[#17334D] bg-[#031B30] p-6 text-center">
                <p className="text-sm font-semibold text-white">{cityResult.name}</p>
                <p className="text-xs text-[#B9BBC8] mt-1">
                  {cityRadiusKm ? `Aucune opportunité dans un rayon de ${cityRadiusKm} km.` : 'Aucune opportunité pour le moment.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Client's audit (15 Sep): "ajouter le nombre de résultats et
                    'Voir toutes les opportunités de cette ville'" - a text
                    search here only ever showed its capped 5-result preview
                    with no total and no way to reach the rest, and gave no
                    way to tell an open opportunity from an expired one. */}
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-[#B9BBC8]">
                    <span className="text-orange font-semibold">{cityTotal}</span> opportunité{cityTotal !== 1 ? 's' : ''}{' '}
                    {cityRadiusKm ? `dans un rayon de ${cityRadiusKm} km autour de ${cityResult.name}` : `à ${cityResult.name}`}
                  </p>
                  <Link
                    to={
                      cityApiCoords
                        ? `/recherche?city=${encodeURIComponent(cityResult.name)}&lat=${cityApiCoords.lat}&lng=${cityApiCoords.lng}&radius_km=${cityRadiusKm ?? DEFAULT_CITY_RADIUS_KM}`
                        : `/recherche?city=${encodeURIComponent(cityResult.name)}`
                    }
                    className="text-[11px] text-orange font-semibold hover:underline"
                  >
                    Voir toutes les opportunités {cityRadiusKm ? `dans ces ${cityRadiusKm} km` : 'de cette ville'}
                  </Link>
                </div>
                {cityOpportunities.map(opp => {
                  const isExpired = opp.status === 'expired' || opp.status === 'cancelled' || opp.status === 'awarded';
                  return (
                    <OpportunityLink key={opp.id} to={`/opportunites/${opp.id}`} className="block bg-[#031B30] border border-[#17334D] rounded-xl p-3 hover:border-orange/40 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-white leading-snug">{opp.title}</p>
                        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${isExpired ? 'bg-[#17334D] text-[#B9BBC8]' : 'bg-orange/15 text-orange'}`}>
                          {opp.status === 'expired' ? 'Expirée' : opp.status === 'cancelled' ? 'Annulée' : opp.status === 'awarded' ? 'Attribuée' : 'Ouverte'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[10px] text-[#B9BBC8]">
                        {opp.location_city && <span className="flex items-center gap-1"><MapPin size={10} /> {opp.location_city}</span>}
                        {opp.deadline && <span>{new Date(opp.deadline).toLocaleDateString('fr-FR')}</span>}
                      </div>
                    </OpportunityLink>
                  );
                })}
              </div>
            )}

            {selectedCities.length > 0 && (
              <Link to={buildSearchUrl()} className="mt-3 w-full flex items-center justify-center gap-2 border border-orange text-orange font-semibold text-sm py-3 rounded-xl hover:bg-orange/10 transition-colors">
                {selectedCities.length === 1 && selectionCount?.radiusKm ? 'Voir les opportunités autour de ' : 'Voir les opportunités à '}
                {selectedCities.map((c, i) => (<span key={i}>{i > 0 && ', '}{c.name}</span>))}
                {selectedCities.length === 1 && selectionCount?.radiusKm ? ` (${selectionCount.radiusKm} km)` : ''}
                {selectionCount ? ` — ${selectionCount.total}` : ''} <ArrowRight size={14} />
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// BLOG ("Répondre à un marché : les premiers repères.")
