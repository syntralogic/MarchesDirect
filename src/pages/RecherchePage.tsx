import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { useOpportunities } from '@/hooks/use-opportunities';
import { opportunitiesApi } from '@/lib/apiClient';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { useDebounce } from '@/hooks/use-debounce';
import { useLang } from '@/contexts/LangContext';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { trackVisitorEvent } from '@/lib/visitorTracking';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { OpportunityListCard } from '@/components/OpportunityListCard';
import { frenchRegions } from '@/data/mockData';
import { DEFAULT_CITY_RADIUS_KM, CITY_RADIUS_OPTIONS_KM } from '@/lib/searchRadius';
import { matchTradeSuggestions } from '@/data/tradeSuggestions';

// Same accent/case fold HomePage.tsx uses for its (working) department
// autocomplete - not exported from there, small enough to duplicate here
// rather than widen that file's surface for one shared helper.
function normalizeFr(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export default function RecherchePage() {
  const { t } = useLang();
  const { companyKnown } = useCompanyKnown();
  const [searchParams, setSearchParams] = useSearchParams();

  // N02 (contre-audit 15 Sep): a `q=` param arriving in the URL (from
  // /secteurs cards, or anyone sharing a search link) was silently
  // dropped - query/applied.query both always started empty, same class
  // of bug as the department/region params above.
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  // Client audit (25 Sep): the direct search page had no suggestion/
  // autocomplete on the keyword field at all - the guided journey
  // (/parcours) already had one (see tradeSuggestions.ts, now shared by
  // both pages). Same open-until-picked pattern that page uses, plus a
  // click-outside close since this page's form has more fields below the
  // input for a stray click to land on.
  const [querySuggestOpen, setQuerySuggestOpen] = useState(false);
  const queryFieldRef = useRef<HTMLDivElement>(null);
  const filteredQuerySuggestions = useMemo(() => {
    if (!query.trim()) return [];
    return matchTradeSuggestions(query, 6);
  }, [query]);
  useEffect(() => {
    if (!querySuggestOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (queryFieldRef.current && !queryFieldRef.current.contains(e.target as Node)) {
        setQuerySuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [querySuggestOpen]);
  // Client's map lets 2+ regions/departments/cities be selected at once
  // ("Nouvelle-Aquitaine, Bretagne") - HomePage's buildSearchUrl() already
  // sent every selection as its own repeated `region=` param, but this only
  // ever read `.get('region')`, which returns just the FIRST match and
  // silently drops the rest. `.getAll()` + comma-join matches the backend's
  // new comma-separated multi-value parsing (opportunities.ts).
  const initialRegions = searchParams.getAll('region');
  const initialCities = searchParams.getAll('city');
  // Client's priority bug: the map's "departments" tab already sent every
  // selected department as its own repeated `department=` param (see
  // HomePage's buildSearchUrl), but this page never read `department` at
  // all - so a Gironde + Dordogne map selection landed here with no
  // location filter applied whatsoever and silently fell back to a
  // national result list. Backend already accepts comma-separated
  // department codes (routes/opportunities.ts); this was purely a missing
  // read on the frontend.
  const initialDepartments = searchParams.getAll('department');
  const initialCity = initialCities.join(', ');
  const initialRegion = initialRegions.join(', ');
  const initialDepartment = initialDepartments.join(',');
  const [location, setLocation] = useState(initialRegion || initialDepartment || initialCity);
  // G05 (contre-audit 15 Sep): "Ville ou département" typed as free text
  // (e.g. "Gironde", no map/URL involved) returned zero results. Root
  // cause: locationField used to be a single value FROZEN at mount from
  // whichever URL param happened to be present, defaulting to 'region'
  // whenever none were - so free typing with no prior URL context always
  // got sent as region=<text>, silently wrong for a département or city
  // name (and 'region' isn't even an option this field's own label
  // offers - it promises "Ville ou département" only). Re-resolved on
  // every search submission instead, against the same department dataset
  // (data/geo/departements.json) the working new-formulaire autocomplete
  // already uses, so typing "Gironde" here now resolves the same way it
  // does there.
  const [departements, setDepartements] = useState<{ code: string; nom: string }[] | null>(null);
  useEffect(() => {
    import('@/data/geo/departements.json').then((m) => {
      const features = ((m.default as { features: { properties: { code: string; nom: string } }[] }).features) || [];
      setDepartements(features.map((f) => f.properties));
    }).catch(() => setDepartements([]));
  }, []);
  const regionNamesFolded = useMemo(() => new Set(frenchRegions.map((r) => normalizeFr(r.name))), []);
  // Point 2 (20 Sep client audit): typing "France" in the general search's
  // location field was still classified as a city (it matches none of the
  // region/department checks below), so it got geocoded and searched with
  // a decorative km radius around whatever point that resolved to -
  // instead of meaning "no location filter, the whole country" the way
  // OpportunityJourneyPage's dedicated "France entière" option already
  // does. Treat it as an empty location instead of a city name.
  const isWholeFranceText = (text: string): boolean => {
    const n = normalizeFr(text.trim());
    return n === 'france' || n === 'france entiere' || n === 'toute la france';
  };
  const resolveLocationField = (text: string): 'region' | 'department' | 'city' => {
    const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0 || isWholeFranceText(text)) return 'city';
    if (parts.every((p) => regionNamesFolded.has(normalizeFr(p)))) return 'region';
    if (departements && parts.every((p) => departements.some((d) => d.code === p || normalizeFr(d.nom) === normalizeFr(p)))) {
      return 'department';
    }
    return 'city';
  };
  const resolveLocationValue = (text: string, field: 'region' | 'department' | 'city'): string => {
    if (isWholeFranceText(text)) return '';
    if (field !== 'department' || !departements) return text;
    // Backend expects département codes, not names - map any typed names
    // ("Gironde") to their code ("33") the same way the map/autocomplete
    // flows already do.
    return text
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => departements.find((d) => normalizeFr(d.nom) === normalizeFr(p))?.code || p)
      .join(',');
  };
  const [locationField, setLocationField] = useState<'region' | 'department' | 'city'>(
    initialDepartment && !initialRegion ? 'department' : (initialCity && !initialRegion ? 'city' : (initialRegion ? 'region' : resolveLocationField(location)))
  );
  const tradeId = searchParams.get('trade_id') || undefined;
  const journeyParam = (searchParams.get('journey') as 'tender' | 'public_procurement' | 'subcontracting' | null) || undefined;
  // G14 (contre-audit 15 Sep): header tag/title/sub and the results-count
  // label were hardcoded to the "sous-traitant" wording no matter which
  // journey brought the visitor here - a marchés-publics search still
  // said "Je suis sous-traitant" / "missions compatibles". Fixed for the
  // header's own type-menu links (which do send journey=...), but the
  // map on HomePage (buildSearchUrl) links to /recherche with region/
  // department/city/trade_id params and NEVER a journey - those searches
  // mix every opportunity type by geography or sector, yet still fell
  // into this same '' branch and inherited the subcontractor-specific
  // wording by default. Genuine subcontracting (explicit journeyParam)
  // keeps the original unsuffixed keys; no journey at all now gets its
  // own neutral wording instead of silently reusing subcontracting's.
  const headerKeySuffix = journeyParam === 'public_procurement' ? 'Public' : journeyParam === 'tender' ? 'Tender' : journeyParam === 'subcontracting' ? '' : 'Neutral';

  // Client's audit: filters need a real status set (nouveau/en cours/
  // clôturé/attribué/annulé) and a montant range - neither existed here.
  // 'nouveau' isn't its own backend status (it's a temporary badge on
  // recently-published rows per opportunityStatusJob's comments), so it
  // maps to the default "no status filter" browse view rather than a
  // literal status value.
  // Client (19/20 Sep): "les retours en arrière doivent conserver ...
  // les critères de recherche." searchParams was read-only here - nothing
  // typed into search/location/filters/sort ever got written back to the
  // URL, so browser back re-mounted this page against whatever URL it
  // happened to arrive on (often empty), silently discarding everything
  // the visitor had actually searched for. Every filter now round-trips
  // both ways: read here on mount, and written back below whenever it
  // changes (see the setSearchParams effect near `applied`).
  const [statutFilter, setStatutFilter] = useState(searchParams.get('status') || '');
  // R04's deeper fix already classifies opportunities server-side; this is
  // just the control that was missing to actually filter by it.
  const [natureFilter, setNatureFilter] = useState<string[]>(
    searchParams.get('nature')?.split(',').filter(Boolean) || []
  );
  const [montantMin, setMontantMin] = useState(searchParams.get('min_value') || '');
  const [montantMax, setMontantMax] = useState(searchParams.get('max_value') || '');
  // R08 (client audit): "filtering isn't sorting" - filters existed but no
  // explicit sort control did. Defaults to the same active-first/soonest-
  // deadline order the results used before this control existed, so
  // nothing changes until the visitor picks something else.
  const [sort, setSort] = useState<'deadline' | 'recent' | 'match'>(
    (searchParams.get('sort') as 'deadline' | 'recent' | 'match' | null) || 'deadline'
  );

  const debouncedQuery = useDebounce(query, 400);
  const debouncedLocation = useDebounce(location, 400);
  const debouncedMontantMin = useDebounce(montantMin, 400);
  const debouncedMontantMax = useDebounce(montantMax, 400);

  // The debounced state below already fires a search live as the user
  // types, but the "Rechercher" button itself did nothing but blur the
  // active input - clicking it produced no visible effect and, worse, any
  // not-yet-debounced keystroke (typed in the last 400ms) was silently
  // dropped instead of being searched immediately. `applied` holds the
  // values actually sent to useOpportunities: kept in sync with the
  // debounced ones as the user types, but the button (and Enter, via the
  // form's onSubmit) now bypasses the debounce and applies the raw
  // current field values right away.
  // Was hardcoded location: '' here even when a URL param (region/
  // department/city) had already seeded the `location` field above - so
  // the very first search fired (before the debounce effect below ever
  // runs) went out with no location filter at all, briefly showing
  // unfiltered/national results before narrowing a moment later. Seeds
  // from the same value `location` itself was just initialized from.
  const [applied, setApplied] = useState({ query: initialQuery, location: initialRegion || initialDepartment || initialCity, montantMin: searchParams.get('min_value') || '', montantMax: searchParams.get('max_value') || '' });

  // MOVED here (was above, right after headerKeySuffix): this block reads
  // `applied.location` in a useEffect dependency array, which is evaluated
  // synchronously during render - `applied` didn't exist yet at that point
  // in the file (declared several dozen lines further down, just above),
  // so this was a genuine "Cannot access 'applied' before initialization"
  // TDZ crash on every single render of this page, not just a tsc lint
  // complaint (tsc did flag it: TS2448/TS2454). This is very likely the
  // actual cause behind "search shows nothing" reports for /recherche -
  // the page would throw before ever reaching a fetch call.
  const [radius, setRadius] = useState(searchParams.get('radius_km') || String(DEFAULT_CITY_RADIUS_KM));
  // Client audit (19 Sep): this radius was decorative - the main list
  // endpoint had no geo-radius filter at all (only /stats/near did), so
  // "Angoulême à 25 km" and "Angoulême à 200 km" returned identical
  // results. Now that GET /opportunities accepts real lat/lng/radius_km
  // (see backend's geocodingService.ts), a city search resolves to
  // coordinates here and sends those instead of a plain city-name match.
  // null = not resolved (yet, or couldn't be) - falls back to the
  // existing city text-match, same as before this fix, rather than
  // blocking the search on geocoding succeeding.
  const [cityCoords, setCityCoords] = useState<{ lat: number; lng: number } | null>(null);
  const cityGeocodeRequestId = useRef(0);
  // 20 Sep audit: the km selector must only exist where a radius means
  // something - around exactly one named city. Empty / "France" (whole
  // country), regions, departments and multi-city selections never show it.
  const typedCities = location.split(',').map(c => c.trim()).filter(Boolean);
  const showRadius = resolveLocationField(location) === 'city' && typedCities.length === 1 && !isWholeFranceText(location);
  useEffect(() => {
    if (locationField !== 'city' || !applied.location) {
      setCityCoords(null);
      return;
    }
    const thisRequest = ++cityGeocodeRequestId.current;
    // Only the first comma-separated city is geocoded for radius purposes -
    // "around several cities at once" isn't a single point/radius the
    // Haversine filter can express; multi-city stays on the existing
    // text-match path (cityCoords null keeps it there, see useOpportunities
    // call below).
    // 20 Sep audit: the comment above promised multi-city stays on the
    // text-match path, but the first city was geocoded regardless, so
    // "Libourne, Langon" silently became a radius search around Libourne
    // only. Now genuinely single-city-only.
    const cities = applied.location.split(',').map(c => c.trim()).filter(Boolean);
    const firstCity = cities.length === 1 ? cities[0] : '';
    if (!firstCity) {
      setCityCoords(null);
      return;
    }
    opportunitiesApi.geocodeCity(firstCity).then((result) => {
      if (cityGeocodeRequestId.current !== thisRequest) return; // stale
      setCityCoords(result);
    });
  }, [locationField, applied.location]);

  useEffect(() => {
    const field = resolveLocationField(debouncedLocation);
    setLocationField(field);
    setApplied({ query: debouncedQuery, location: resolveLocationValue(debouncedLocation, field), montantMin: debouncedMontantMin, montantMax: debouncedMontantMax });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, debouncedLocation, debouncedMontantMin, debouncedMontantMax, departements]);

  // Writes the actually-applied search state back into the URL (replace,
  // not push, so this doesn't spam browser history on every keystroke/
  // filter change) - the other half of the fix above. Without this,
  // reaching this page any way other than a literal reload always started
  // from an empty/stale URL, and `applied`/statutFilter/natureFilter/sort
  // typed or picked afterward were never reflected there - so a later
  // back-navigation (or reload, or copying the link) always lost them.
  useEffect(() => {
    const next = new URLSearchParams();
    if (applied.query) next.set('q', applied.query);
    if (applied.location) {
      const values = applied.location.split(',').map((s) => s.trim()).filter(Boolean);
      values.forEach((v) => next.append(locationField, v));
    }
    if (tradeId) next.set('trade_id', tradeId);
    if (journeyParam) next.set('journey', journeyParam);
    if (statutFilter) next.set('status', statutFilter);
    if (natureFilter.length > 0) next.set('nature', natureFilter.join(','));
    if (applied.montantMin) next.set('min_value', applied.montantMin);
    if (applied.montantMax) next.set('max_value', applied.montantMax);
    if (sort !== 'deadline') next.set('sort', sort);
    // Client audit (25 Sep): the radius selector was decorative for the URL -
    // changing it never round-tripped through searchParams, so a reload or
    // a shared link always fell back to DEFAULT_CITY_RADIUS_KM (50 km) no
    // matter what was actually selected. Only meaningful (and only shown)
    // for a single resolved city - see showRadius above.
    if (showRadius && radius !== String(DEFAULT_CITY_RADIUS_KM)) next.set('radius_km', radius);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, locationField, tradeId, journeyParam, statutFilter, natureFilter, sort, radius, showRadius]);

  const { opportunities: filtered, loading, error, total, hasMore, loadingMore, loadMore } = useOpportunities({
    q: applied.query || undefined,
    region: locationField === 'region' ? (applied.location || undefined) : undefined,
    department: locationField === 'department' ? (applied.location || undefined) : undefined,
    // Real distance filter when we have coordinates + a chosen radius;
    // otherwise the plain city text-match (unchanged fallback).
    city: locationField === 'city' && !cityCoords ? (applied.location || undefined) : undefined,
    lat: locationField === 'city' && cityCoords ? cityCoords.lat : undefined,
    lng: locationField === 'city' && cityCoords ? cityCoords.lng : undefined,
    radius_km: locationField === 'city' && cityCoords ? Number(radius) : undefined,
    trade_id: tradeId,
    journey: journeyParam,
    status: statutFilter || undefined,
    nature: natureFilter.length > 0 ? natureFilter.join(',') : undefined,
    min_value: applied.montantMin ? Number(applied.montantMin) : undefined,
    max_value: applied.montantMax ? Number(applied.montantMax) : undefined,
    sort,
  });

  useScrollRestore(!loading);

  useEffect(() => {
    if (!debouncedQuery && !debouncedLocation) return;
    const parts = [debouncedQuery, debouncedLocation].filter(Boolean);
    trackVisitorEvent('search', `Recherche : ${parts.join(' · ')}`, undefined, { q: debouncedQuery, location: debouncedLocation, journey: journeyParam });
  }, [debouncedQuery, debouncedLocation, journeyParam]);

  // Applies the current (un-debounced) field values immediately - used by
  // both the "Rechercher" button and submitting the form (Enter key).
  const handleSearch = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    const field = resolveLocationField(location);
    setLocationField(field);
    setApplied({ query, location: resolveLocationValue(location, field), montantMin, montantMax });
  };

  return (
    <div className="page-fade-in max-w-md mx-auto px-4 py-3 min-h-screen pb-24">
      
      {/* Header */}
      <div className="mb-3">
        <span className="text-[9px] font-bold text-orange uppercase tracking-widest mb-1 block">{t(`searchHeaderTag${headerKeySuffix}`)}</span>
        <h1 className="text-[20px] leading-tight font-extrabold text-white mb-1">
          {t(`searchHeaderTitle${headerKeySuffix}`)}
        </h1>
        <p className="text-[#B9BBC8] text-[11px] leading-snug">
          {t(`searchHeaderSub${headerKeySuffix}`)}
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="bg-[#061D32] border border-[#17334D] rounded-xl p-2.5 mb-3">
        <div className="mb-2">
          <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchKeywords')}</label>
          <div className="relative" ref={queryFieldRef}>
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <input
              type="text"
              placeholder={t('searchKeywordsPlaceholder')}
              value={query}
              onChange={e => { setQuery(e.target.value); setQuerySuggestOpen(true); }}
              onFocus={() => setQuerySuggestOpen(true)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
            />
            {querySuggestOpen && filteredQuerySuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-[#031B30] border border-[#17334D] rounded-md overflow-hidden shadow-xl">
                {filteredQuerySuggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setQuery(s);
                      setQuerySuggestOpen(false);
                      setLocationField(resolveLocationField(location));
                      setApplied({ query: s, location: resolveLocationValue(location, resolveLocationField(location)), montantMin, montantMax });
                    }}
                    className="w-full text-left px-2.5 py-2 text-[11px] text-white hover:bg-orange/10 border-b border-[#17334D] last:border-b-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <div className={showRadius ? 'flex-1' : 'flex-[2]'}>
            <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchLocation')}</label>
            <div className="relative">
              <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
              <input
                type="text"
                placeholder={t('searchLocationPlaceholder')}
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
              />
            </div>
          </div>
          {/* Client (19 Sep): "une région sélectionnée doit couvrir toute
              cette région, sans +50 km. Même principe pour les
              départements. Le rayon kilométrique concerne uniquement une
              recherche autour d'une ville." Region/department searches
              cover the whole zone with no radius by design (city-only, per
              the client's own rule above) - hidden outside city mode so it
              never again sits there looking like it's narrowing an
              already-precise region/department when it isn't applicable.
              Now genuinely filters by distance in city mode (see
              cityCoords above) instead of the click-through-only version
              this comment used to describe. */}
          {showRadius && (
            <div className="flex-1">
              <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchRadius')}</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8] font-semibold text-[10px]">⌖</span>
                <select 
                  value={radius}
                  onChange={e => setRadius(e.target.value)}
                  className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-6 py-2 text-[11px] text-white focus:outline-none appearance-none cursor-pointer"
                >
                  {CITY_RADIUS_OPTIONS_KM.map(km => (
                    <option key={km} value={String(km)}>{km} km</option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B9BBC8] pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <div className="mb-2.5">
          <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchStatut')}</label>
          <div className="relative">
            <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <select
              value={statutFilter}
              onChange={e => setStatutFilter(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-6 py-2 text-[11px] text-white focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">{t('searchStatutAll')}</option>
              <option value="active">{t('searchStatutActive')}</option>
              <option value="expired">{t('searchStatutExpired')}</option>
              <option value="awarded">{t('searchStatutAwarded')}</option>
              <option value="cancelled">{t('searchStatutCancelled')}</option>
            </select>
            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#B9BBC8] pointer-events-none" />
          </div>
        </div>

        <div className="mb-2.5">
          <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchNature')}</label>
          <div className="flex flex-wrap gap-1.5">
            {(['travaux', 'fournitures', 'etudes', 'mixte'] as const).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setNatureFilter(cur => cur.includes(n) ? cur.filter(x => x !== n) : [...cur, n])}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                  natureFilter.includes(n)
                    ? 'bg-orange/15 border-orange text-orange'
                    : 'bg-[#031B30] border-[#17334D] text-[#B9BBC8] hover:border-[#2A4A6B]'
                }`}
              >
                {n === 'travaux' ? t('natureTravaux') || 'Travaux'
                  : n === 'fournitures' ? t('natureFournitures') || 'Fournitures'
                  : n === 'etudes' ? t('natureEtudes') || 'Études'
                  : t('natureMixte') || 'Mixte'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-2.5">
          <div className="flex-1">
            <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchMontantMin')}</label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="0"
              value={montantMin}
              onChange={e => setMontantMin(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-md px-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchMontantMax')}</label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder={t('searchMontantMaxPlaceholder')}
              value={montantMax}
              onChange={e => setMontantMax(e.target.value)}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-md px-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange text-white font-bold py-2 rounded-md text-xs hover:bg-orange/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
          {t('searchButton')}
        </button>
      </form>

      {/* Results Header */}
      {/* Was filtered.length - only the currently loaded batch (max
          PAGE_SIZE), not the real match count. With a narrow filter that
          matches e.g. 340 opportunities, this showed "20 résultats" (one
          page) instead of 340, since LoadMoreButton already correctly
          uses `total` for the same data lower on this page. */}
      <div className="mb-2 flex items-center justify-between gap-2">
        {loading ? (
          <div className="h-3.5 w-28 rounded bg-white/5 animate-pulse" />
        ) : (
          <h2 className="text-[11px] font-bold text-white">
            <span className="text-orange">{total}</span> {t(headerKeySuffix ? `searchResults${headerKeySuffix}` : 'searchResults')}
          </h2>
        )}
        <div className="relative shrink-0">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as 'deadline' | 'recent' | 'match')}
            aria-label={t('sortLabel')}
            className="bg-[#031B30] border border-[#17334D] rounded-md pl-2 pr-6 py-1.5 text-[10px] text-white focus:outline-none appearance-none cursor-pointer"
          >
            <option value="deadline">{t('sortDeadline')}</option>
            <option value="recent">{t('sortRecent')}</option>
            <option value="match">{t('sortMatch')}</option>
          </select>
          <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#B9BBC8] pointer-events-none" />
        </div>
      </div>

      {loading && <div className="text-center text-[11px] text-[#B9BBC8] py-8">{t('searchLoading')}</div>}
      {!loading && error && <div className="text-center text-[11px] text-orange py-8">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center text-[11px] text-[#B9BBC8] py-8">{t('searchNoResults')}</div>
      )}

      {/* Cards */}
      {/* Was a hand-rolled card here with a badge hardcoded to "Nouveau" on
          every single result and no real lifecycle status shown at all -
          client's exact complaint ("Nouveau" badge replacing the actual
          Clôturé/Attribué/Annulé status). OpportunityListCard already has
          the correct real-status badge logic (used elsewhere); this page
          just wasn't using it. */}
      <div className="space-y-2">
        {filtered.map((o) => (
          <OpportunityListCard key={o.id} opportunity={o} compatible={companyKnown} />
        ))}
      </div>

      <LoadMoreButton
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
        total={total}
        shown={filtered.length}
      />
    </div>
  );
}