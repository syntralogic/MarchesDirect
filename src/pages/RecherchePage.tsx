import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, ChevronDown, Loader2, X } from 'lucide-react';
import { useOpportunities } from '@/hooks/use-opportunities';
import { opportunitiesApi, tradesApi } from '@/lib/apiClient';
import { useScrollRestore } from '@/hooks/use-scroll-restore';
import { useDebounce } from '@/hooks/use-debounce';
import { useLang } from '@/contexts/LangContext';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { trackVisitorEvent } from '@/lib/visitorTracking';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { OpportunityListCard } from '@/components/OpportunityListCard';
import { frenchRegions } from '@/data/mockData';
import { DEFAULT_CITY_RADIUS_KM, CITY_RADIUS_OPTIONS_KM } from '@/lib/searchRadius';
import { matchTradeSuggestions, searchTermForSuggestion, tradeDisplayName, normalizeFr as normalizeTradeText } from '@/data/tradeSuggestions';
import { useTrades } from '@/hooks/use-trades';

// Same accent/case fold HomePage.tsx uses for its (working) department
// autocomplete - not exported from there, small enough to duplicate here
// rather than widen that file's surface for one shared helper.
function normalizeFr(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-'’]/g, ' ').replace(/\s+/g, ' ').trim();
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
  const [location, setLocation] = useState([initialRegion, initialDepartment].filter(Boolean).join(', ') || initialCity);
  // 25 Sep audit (Bordeaux 123 vs 90 mismatch): HomePage's map counter now
  // hands off the exact lat/lng/radius_km it computed its total with (see
  // HomePage's searchAroundCity/buildSearchUrl) instead of leaving this
  // page to re-geocode the same city name a second time - a second,
  // independent call to the external geocoder that wasn't guaranteed to
  // land on the same point, and silently fell back to a plain city-name
  // text match (fewer/different results, and the radius selector below
  // having zero effect no matter what's picked) whenever it failed.
  const initialLat = searchParams.get('lat');
  const initialLng = searchParams.get('lng');
  const urlSeededCoords = initialLat && initialLng && !isNaN(Number(initialLat)) && !isNaN(Number(initialLng))
    ? { lat: Number(initialLat), lng: Number(initialLng) }
    : null;
  // The city these coordinates belong to - only reused for a re-geocode-free
  // seed while `location` still refers to this exact same city; typing a
  // different city afterward must geocode fresh, not keep reusing this point.
  const urlSeededCoordsCity = useRef(urlSeededCoords ? initialCity.trim() : null);
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
  // Client audit (25 Sep, recap point 2): "Proposer France entière lorsqu'on
  // commence à saisir Fran" + "permettre d'ajouter plusieurs départements,
  // chacun visible et supprimable séparément" - the location field below
  // was a single free-text input with no suggestion dropdown at all (only
  // the parcours guidé had one, for métiers, not for location) and no
  // chip UI, just raw "Gironde, Dordogne" comma-typing. resolveLocationField/
  // resolveLocationValue below already accept and correctly resolve
  // comma-separated department names into codes - that part of the fix
  // already shipped (25 Sep). This adds the missing UI on top of that
  // same data model: once the field resolves to 'department', already-
  // picked departments render as removable chips and a separate draft
  // string collects the next one being typed; suggestions (France entière
  // + matching départements) appear in a dropdown, same pattern as the
  // keyword field's querySuggestOpen/filteredQuerySuggestions above.
  const [locationDraft, setLocationDraft] = useState('');
  const [locationSuggestOpen, setLocationSuggestOpen] = useState(false);
  const locationFieldWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!locationSuggestOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (locationFieldWrapRef.current && !locationFieldWrapRef.current.contains(e.target as Node)) {
        setLocationSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [locationSuggestOpen]);
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
  // A city handed over by the URL (home map / city search: ?city=Paris&lat=..&lng=..)
  // stays a city even when its name is also a department name ("Paris" = dept 75).
  // Without this the text-only resolver below flipped it to 'department', so the
  // chosen radius (e.g. 50 km) was ignored and only dept 75 came back (28 Sep test).
  const urlCityLockRef = useRef<string | null>(
    initialCity && !initialRegion && !initialDepartment ? normalizeFr(initialCity.trim()) : null
  );
  // 30 Sep audit (point 3): a department and a region picked together
  // (Gironde, Dordogne, then Bretagne) used to fall through to 'city', so the
  // URL got city=Dordogne&city=Bretagne. 'zones' keeps the TYPE of every part:
  // regions stay regions, departments stay departments.
  const resolveLocationField = (text: string): 'region' | 'department' | 'zones' | 'city' => {
    const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0 || isWholeFranceText(text)) return 'city';
    if (urlCityLockRef.current && parts.length === 1 && normalizeFr(parts[0]) === urlCityLockRef.current) return 'city';
    if (parts.every((p) => regionNamesFolded.has(normalizeFr(p)))) return 'region';
    if (departements && parts.every((p) => departements.some((d) => d.code === p || normalizeFr(d.nom) === normalizeFr(p)))) {
      return 'department';
    }
    if (departements && parts.every((p) => regionNamesFolded.has(normalizeFr(p)) || departements.some((d) => d.code === p || normalizeFr(d.nom) === normalizeFr(p)))) {
      return 'zones';
    }
    return 'city';
  };
  // Splits a resolved 'zones' value into its region names and department codes.
  const splitZones = (value: string): { regions: string[]; departments: string[] } => {
    const regions: string[] = [];
    const departments: string[] = [];
    for (const part of value.split(',').map((x) => x.trim()).filter(Boolean)) {
      if (regionNamesFolded.has(normalizeFr(part))) regions.push(part);
      else departments.push(part);
    }
    return { regions, departments };
  };
  const resolveLocationValue = (text: string, field: 'region' | 'department' | 'zones' | 'city'): string => {
    if (isWholeFranceText(text)) return '';
    if (field === 'region') {
      // Typed without accents/hyphens ("Ile de France") still has to reach
      // the backend under the canonical region name.
      return text
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => frenchRegions.find((r) => normalizeFr(r.name) === normalizeFr(p))?.name || p)
        .join(',');
    }
    if (field === 'zones' && departements) {
      return text
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => frenchRegions.find((r) => normalizeFr(r.name) === normalizeFr(p))?.name
          || departements.find((d) => normalizeFr(d.nom) === normalizeFr(p))?.code || p)
        .join(',');
    }
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
  const [locationField, setLocationField] = useState<'region' | 'department' | 'zones' | 'city'>(
    initialDepartment && initialRegion ? 'zones' : initialDepartment && !initialRegion ? 'department' : (initialCity && !initialRegion ? 'city' : (initialRegion ? 'region' : resolveLocationField(location)))
  );
  // Computed synchronously off the live `location` string (not the
  // debounced `locationField` state above) so chips appear the instant a
  // department/region is picked, rather than lagging behind the 400ms
  // debounce.
  //
  // New client audit, point 6: "dans la recherche libre, écrire les deux
  // régions avec une virgule est accepté, mais il n'y a pas de pastilles
  // pour les gérer" - only 'department' got the chip UI below; a comma-
  // joined region list (already correctly resolved/sent by
  // resolveLocationField/backend, same as departments) had no visual
  // chips at all, just raw text. chipMode/locationChips now cover both,
  // generalizing what was department-only logic - resolveLocationField's
  // own parts.every() check already requires a location to be entirely
  // one kind or the other, so a mode is unambiguous once any chip exists.
  const chipMode: 'department' | 'region' | 'zones' | null =
    resolveLocationField(location) === 'department' ? 'department' :
    resolveLocationField(location) === 'region' ? 'region' :
    resolveLocationField(location) === 'zones' ? 'zones' : null;
  const locationChips = chipMode ? location.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const locationInputValue = locationChips.length > 0 ? locationDraft : location;
  const locationSuggestions = useMemo(() => {
    const raw = (locationChips.length > 0 ? locationDraft : location).trim();
    const q = normalizeFr(raw);
    const items: { type: 'france' | 'department' | 'region'; code?: string; nom: string }[] = [];
    // Client's exact repro: typing "Fran" should surface "France entière"
    // as a pickable suggestion instead of it only working as a magic
    // string nobody would guess to type in full.
    if (!q || 'france'.startsWith(q) || normalizeFr('France entière').includes(q)) {
      items.push({ type: 'france', nom: 'France entière' });
    }
    const alreadyPicked = new Set(locationChips.map((c) => normalizeFr(c)));
    // Regions and departments can now be mixed freely (see 'zones' above).
    {
      frenchRegions
        .filter((r) => !alreadyPicked.has(normalizeFr(r.name)))
        .filter((r) => !q || normalizeFr(r.name).includes(q))
        .slice(0, 7)
        .forEach((r) => items.push({ type: 'region', nom: r.name }));
    }
    if (departements) {
      departements
        .filter((d) => !alreadyPicked.has(normalizeFr(d.nom)) && !alreadyPicked.has(d.code))
        .filter((d) => !q || normalizeFr(d.nom).includes(q) || d.code === raw || d.code.startsWith(q))
        .slice(0, 7)
        .forEach((d) => items.push({ type: 'department', code: d.code, nom: d.nom }));
    }
    return items.slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, locationDraft, departements, locationChips.join('|'), chipMode]);
  const selectLocationSuggestion = (item: { type: 'france' | 'department' | 'region'; code?: string; nom: string }) => {
    if (item.type === 'france') {
      setLocation('France entière');
      setLocationDraft('');
      setLocationSuggestOpen(false);
      // A prior city search can leave cityCoords (and the radius that goes
      // with it) set - resolveLocationField treats 'France entière' as
      // the 'city' field too (see below), so without this a stale
      // lat/lng/radius_km from that earlier city would silently keep
      // being sent, restricting "France entière" to a radius around
      // whatever city was last picked instead of truly nationwide.
      setCityCoords(null);
      urlSeededCoordsCity.current = null;
      return;
    }
    setLocation(locationChips.length > 0 ? [...locationChips, item.nom].join(', ') : item.nom);
    setLocationDraft('');
    setLocationSuggestOpen(false);
  };
  const removeLocationChip = (nomToRemove: string) => {
    const next = locationChips.filter((c) => normalizeFr(c) !== normalizeFr(nomToRemove));
    setLocation(next.join(', '));
  };
  // Committing a manually-typed (not clicked-from-suggestion) fragment
  // once a first chip already exists - without this, typing a second
  // département/région's full name and pressing "Rechercher" without ever
  // clicking its suggestion would silently drop it, since the input's
  // value in chip mode is locationDraft, not location.
  const commitLocationDraft = () => {
    if (locationChips.length > 0 && locationDraft.trim()) {
      setLocation([...locationChips, locationDraft.trim()].join(', '));
      setLocationDraft('');
    }
  };
  const tradeId = searchParams.get('trade_id') || undefined;
  // Client audit (26 Sep, point 5): entering via a métier category (e.g.
  // Carrelage) then typing an unrelated keyword ("nettoyage") silently
  // returned zero results - trade_id stayed applied in the background with
  // no visible indication anywhere on the page, so the zero was
  // unexplainable. This resolves the id(s) to real names so they can be
  // shown as removable chips next to the keyword field (see the input row
  // below).
  //
  // Client spec (26 Sep, homepage métier multi-select): trade_id can now
  // carry a comma-separated list (the OR filter opportunities.ts already
  // accepts) from the new homepage search - "les métiers sélectionnés
  // doivent déjà être renseignés, visibles et modifiables" once here, so
  // each one needs its own chip, not just the first.
  const trades = useTrades();
  const selectedTrades = tradeId
    ? tradeId.split(',').map(id => id.trim()).filter(Boolean)
      .map(id => trades.find(t => t.id === id))
      .filter((t): t is NonNullable<typeof t> => !!t)
    : [];
  const removeTradeFilter = (idToRemove?: string) => {
    const next = new URLSearchParams(searchParams);
    if (!idToRemove) {
      next.delete('trade_id');
    } else {
      const remaining = selectedTrades.map(t => t.id).filter(id => id !== idToRemove);
      if (remaining.length > 0) next.set('trade_id', remaining.join(','));
      else next.delete('trade_id');
    }
    setSearchParams(next, { replace: true });
  };
  // 30 Sep audit, point 4: on this page a suggested métier (Menuiserie) was
  // turned into a keyword (q=Menuiserie) next to the existing métier chips, so
  // Électricité + Couverture + Menuiserie never became three métiers. A
  // suggestion that resolves to a real métier is now added as one more chip
  // (same trade_id list as the home page); anything else stays a keyword.
  const addTradeFilter = (newId: string) => {
    const ids = selectedTrades.map(t => t.id);
    if (ids.includes(newId)) return;
    const next = new URLSearchParams(searchParams);
    next.set('trade_id', [...ids, newId].join(','));
    next.delete('q');
    setSearchParams(next, { replace: true });
  };
  const resolveSuggestionToTrade = async (label: string): Promise<string | null> => {
    try {
      const res = await tradesApi.suggestions(label);
      const wanted = normalizeTradeText(label);
      const hit = res.find(r => normalizeTradeText(r.label) === wanted) || (res.length === 1 ? res[0] : null);
      return hit ? String(hit.tradeId) : null;
    } catch {
      return null;
    }
  };
  // 26 Sep client audit (point 2): "la recherche générale ne propose pas
  // le même choix visible entre public, privé et sous-traitance." This was
  // read-only from the URL - whichever `journey` a visitor arrived with
  // (or none) was silently fixed for the whole visit, with no control
  // anywhere on this page to see or change it. Now a real, visible filter
  // (state initialized from the URL, same pattern as statutFilter just
  // below): a visitor arrives with their entry point's choice already
  // shown and selected, and can change it without leaving the page -
  // "les choix du visiteur déjà renseignés, quelle que soit son entrée."
  //
  // 27 Sep audit, point 4: "le parcours guidé autorise plusieurs
  // catégories simultanément, mais la recherche semble fonctionner en
  // sélection unique : cliquer sur Public remplace Privé... deux
  // catégories sélectionnées dans le parcours guidé ne sont pas affichées
  // comme actives dans les résultats." Cause: this was a single string,
  // so a guided-journey handoff with journey=public_procurement,tender
  // (the guided journey's `types` was already a real multi-select, joined
  // with a comma - the backend's own filter at journey.split(',') already
  // expected exactly that) got read here as one literal, unmatched string
  // - neither button ever showed active, and picking one silently
  // discarded the other. Now an array, matching the same
  // add/remove-individually pattern used for départements and métiers.
  const [journeyFilters, setJourneyFilters] = useState<string[]>(() => {
    const raw = searchParams.get('journey');
    return raw ? raw.split(',').map(j => j.trim()).filter(Boolean) : [];
  });
  const journeyParam = journeyFilters.length > 0 ? journeyFilters.join(',') : undefined;
  const toggleJourneyFilter = (value: string) => {
    if (!value) { setJourneyFilters([]); return; }
    setJourneyFilters(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };
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
  const [statutFilter, setStatutFilter] = useState(searchParams.get('status') === 'all' ? '' : (searchParams.get('status') || ''));
  // R04's deeper fix already classifies opportunities server-side; this is
  // just the control that was missing to actually filter by it.
  const [natureFilter, setNatureFilter] = useState<string[]>(
    searchParams.get('nature')?.split(',').filter(Boolean) || []
  );
  const [montantMin, setMontantMin] = useState(searchParams.get('min_value') || '');
  const [montantMax, setMontantMax] = useState(searchParams.get('max_value') || '');
  const budgetRangeInvalid = montantMin !== '' && montantMax !== '' && Number(montantMin) > Number(montantMax);
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
  const [applied, setApplied] = useState({ query: initialQuery, location: [initialRegion, initialDepartment].filter(Boolean).join(', ') || initialCity, montantMin: searchParams.get('min_value') || '', montantMax: searchParams.get('max_value') || '' });

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
  const [cityCoords, setCityCoords] = useState<{ lat: number; lng: number } | null>(urlSeededCoords);
  const cityGeocodeRequestId = useRef(0);
  // 20 Sep audit: the km selector must only exist where a radius means
  // something - around exactly one named city. Empty / "France" (whole
  // country), regions, departments and multi-city selections never show it.
  const typedCities = location.split(',').map(c => c.trim()).filter(Boolean);
  const showRadius = resolveLocationField(location) === 'city' && typedCities.length === 1 && !isWholeFranceText(location);
  useEffect(() => {
    if (locationField !== 'city' || !applied.location || isWholeFranceText(applied.location)) {
      // isWholeFranceText added here too (not just selectLocationSuggestion's
      // click handler above): typing "France entière" directly and having
      // `applied` pick it up via the debounce path never went through that
      // handler, so cityCoords could otherwise survive unchanged, or this
      // effect could try geocoding the literal text "France entière" as if
      // it were a city name - either way risking a radius search around a
      // stale or bogus point for what should be a nationwide search.
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
    // Still the exact city the URL handed us coordinates for - trust them
    // rather than firing a second, independent geocode call that could
    // land on a different point (or fail) and disagree with the total the
    // link we arrived from just promised.
    if (urlSeededCoords && urlSeededCoordsCity.current === firstCity) {
      setCityCoords(urlSeededCoords);
      return;
    }
    opportunitiesApi.geocodeCity(firstCity).then((result) => {
      if (cityGeocodeRequestId.current !== thisRequest) return; // stale
      setCityCoords(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (locationField === 'zones') {
        const z = splitZones(applied.location);
        z.regions.forEach((v) => next.append('region', v));
        z.departments.forEach((v) => next.append('department', v));
      } else {
        values.forEach((v) => next.append(locationField, v));
      }
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
  }, [applied, locationField, tradeId, journeyFilters, statutFilter, natureFilter, sort, radius, showRadius]);

  const { opportunities: filtered, loading, error, total, hasMore, loadingMore, loadMore } = useOpportunities({
    q: applied.query || undefined,
    region: locationField === 'region' ? (applied.location || undefined)
      : locationField === 'zones' ? (splitZones(applied.location).regions.join(',') || undefined) : undefined,
    department: locationField === 'department' ? (applied.location || undefined)
      : locationField === 'zones' ? (splitZones(applied.location).departments.join(',') || undefined) : undefined,
    // Real distance filter when we have coordinates + a chosen radius;
    // otherwise the plain city text-match (unchanged fallback).
    city: locationField === 'city' && !cityCoords ? (applied.location || undefined) : undefined,
    lat: locationField === 'city' && cityCoords ? cityCoords.lat : undefined,
    lng: locationField === 'city' && cityCoords ? cityCoords.lng : undefined,
    radius_km: locationField === 'city' && cityCoords ? Number(radius) : undefined,
    trade_id: tradeId,
    journey: journeyParam,
    // 'all' is the frontend-only sentinel for the "Tous les statuts (y
    // compris clôturés)" option above - the backend only understands real
    // status values, so expand it to the literal list here.
    status: statutFilter === 'all' ? 'active,expired,awarded,cancelled' : (statutFilter || undefined),
    nature: natureFilter.length > 0 ? natureFilter.join(',') : undefined,
    // Client (26 Sep audit, point 10): an inverted min>max range showed a
    // silent zero-result list before (now the backend rejects it outright -
    // see opportunities.ts) - simplest is to just not send a range that's
    // already known to be invalid; budgetRangeInvalid's own inline message
    // explains why nothing changed, rather than trading a silent empty
    // list for a silent unfiltered one.
    min_value: (!budgetRangeInvalid && applied.montantMin) ? Number(applied.montantMin) : undefined,
    max_value: (!budgetRangeInvalid && applied.montantMax) ? Number(applied.montantMax) : undefined,
    sort,
  });

  useScrollRestore(!loading);

  useEffect(() => {
    if (!debouncedQuery && !debouncedLocation) return;
    const parts = [debouncedQuery, debouncedLocation].filter(Boolean);
    trackVisitorEvent('search', `Recherche : ${parts.join(' · ')}`, undefined, { q: debouncedQuery, location: debouncedLocation, journey: journeyParam });
  }, [debouncedQuery, debouncedLocation, journeyFilters]);

  // Applies the current (un-debounced) field values immediately - used by
  // both the "Rechercher" button and submitting the form (Enter key).
  const handleSearch = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    // If a département/région chip is already picked and the visitor typed
    // a second one without clicking its suggestion first, fold it in before
    // resolving/applying - otherwise it's silently dropped (see comment
    // on commitLocationDraft above).
    const effectiveLocation = locationChips.length > 0 && locationDraft.trim()
      ? [...locationChips, locationDraft.trim()].join(', ')
      : location;
    if (effectiveLocation !== location) {
      setLocation(effectiveLocation);
      setLocationDraft('');
    }
    const field = resolveLocationField(effectiveLocation);
    setLocationField(field);
    setApplied({ query, location: resolveLocationValue(effectiveLocation, field), montantMin, montantMax });
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
        {/* Client audit (26 Sep, point 5) + spec (homepage métier
            multi-select): the selected métier(s) used to have no visible
            presence anywhere on this page - typing an unrelated keyword
            while one stayed applied in the background produced an
            unexplainable zero-result search. Now shown as removable chips
            (one per métier) right above the keyword field they constrain,
            each removable independently - "cliquer sur la croix retire
            uniquement le métier concerné". */}
        {selectedTrades.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-medium text-[#B9BBC8]">{t('searchTradeFilterLabel') || 'Métier'}</span>
            {selectedTrades.map((trade) => (
              <span key={trade.id} className="inline-flex items-center gap-1 bg-orange/15 border border-orange/40 text-orange text-[10px] font-medium rounded-full pl-2.5 pr-1.5 py-1">
                {tradeDisplayName(trade.name)}
                <button
                  type="button"
                  onClick={() => removeTradeFilter(trade.id)}
                  aria-label={`${t('searchLocationRemove') || 'Retirer'} ${trade.name}`}
                  className="hover:bg-orange/25 rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
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
                    onClick={async () => {
                      // 30 Sep audit, point 4: a suggestion naming a real métier
                      // becomes a métier chip, not a keyword.
                      if (selectedTrades.length > 0) {
                        const tid = await resolveSuggestionToTrade(s);
                        if (tid) {
                          addTradeFilter(tid);
                          setQuery('');
                          setQuerySuggestOpen(false);
                          return;
                        }
                      }
                      // Client audit (26 Sep, point 9): search on the
                      // actual query the suggestion resolves to, not
                      // necessarily its full displayed text - see
                      // searchTermForSuggestion's own comment.
                      const searchTerm = searchTermForSuggestion(s);
                      setQuery(searchTerm);
                      setQuerySuggestOpen(false);
                      // 29 Sep fix: same draft-loss bug the chip-remove
                      // button and "Rechercher"/Enter already handle (see
                      // handleSearch's effectiveLocation) - a second
                      // département/région typed but not yet clicked from
                      // its own suggestion dropdown was silently dropped
                      // here, because this handler applied `location`
                      // directly instead of folding locationDraft in first.
                      const effectiveLocation = locationChips.length > 0 && locationDraft.trim()
                        ? [...locationChips, locationDraft.trim()].join(', ')
                        : location;
                      if (effectiveLocation !== location) {
                        setLocation(effectiveLocation);
                        setLocationDraft('');
                      }
                      const field = resolveLocationField(effectiveLocation);
                      setLocationField(field);
                      setApplied({ query: searchTerm, location: resolveLocationValue(effectiveLocation, field), montantMin, montantMax });
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
            <div className="relative" ref={locationFieldWrapRef}>
              {/* Client audit (25 Sep, recap point 2) + new audit point 6:
                  already-picked départements/régions shown as removable
                  chips ("Gironde · 33" for a département, plain name for a
                  région) instead of raw comma-separated text with no way
                  to manage individual entries. Chips only appear once the
                  field has actually resolved to 'department' or 'region'
                  mode - ville/France entière stay a plain single-value
                  input, unchanged. */}
              {locationChips.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {locationChips.map((chip) => {
                    const match = chipMode === 'department' || chipMode === 'zones' ? departements?.find((d) => normalizeFr(d.nom) === normalizeFr(chip) || d.code === chip) : undefined;
                    return (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-1 bg-orange/15 border border-orange/40 text-orange text-[10px] font-medium rounded-full pl-2.5 pr-1.5 py-1"
                      >
                        {match ? `${match.nom} · ${match.code}` : chip}
                        <button
                          type="button"
                          // 26 Sep client audit, point 3: clicking this button
                          // blurs the text input first (its onBlur is
                          // commitLocationDraft, folding in whatever's still
                          // typed in the "add another" field) *before* this
                          // onClick runs - so removing Gironde while
                          // "Bretagne" was mid-typed committed the stale,
                          // pre-removal chip list plus that draft text first,
                          // then the removal itself raced against it,
                          // corrupting `location` into one mixed string that
                          // downstream code then treated as a city name
                          // rather than a department list. Same
                          // onMouseDown+preventDefault fix already used for
                          // the suggestion-dropdown buttons above (see their
                          // comment) - it keeps the input focused, so the
                          // blur (and the stale commit it would trigger)
                          // never fires at all.
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => removeLocationChip(chip)}
                          aria-label={`${t('searchLocationRemove') || 'Retirer'} ${match?.nom || chip}`}
                          className="hover:bg-orange/25 rounded-full p-0.5"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="relative">
                <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
                <input
                  type="text"
                  placeholder={locationChips.length > 0 ? (chipMode === 'region' ? (t('searchLocationAddAnotherRegion') || 'Ajouter une région…') : chipMode === 'zones' ? 'Ajouter une région ou un département…' : (t('searchLocationAddAnother') || 'Ajouter un département…')) : t('searchLocationPlaceholder')}
                  value={locationInputValue}
                  onChange={e => {
                    const v = e.target.value;
                    if (locationChips.length > 0) setLocationDraft(v);
                    else setLocation(v);
                    setLocationSuggestOpen(true);
                  }}
                  onFocus={() => setLocationSuggestOpen(true)}
                  onBlur={commitLocationDraft}
                  className="w-full bg-[#031B30] border border-[#17334D] rounded-md pl-7 pr-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange transition-colors"
                />
              </div>
              {locationSuggestOpen && locationSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-[#031B30] border border-[#17334D] rounded-md overflow-hidden shadow-xl">
                  {locationSuggestions.map((s) => (
                    <button
                      key={s.type === 'france' ? 'france' : (s.code || s.nom)}
                      type="button"
                      // onMouseDown (not onClick) fires before the input's
                      // onBlur, so a click here lands before commitLocationDraft
                      // would otherwise fold the still-typed fragment in as
                      // a free-text chip ahead of the picked one.
                      onMouseDown={e => { e.preventDefault(); selectLocationSuggestion(s); }}
                      className="w-full text-left px-2.5 py-2 text-[11px] text-white hover:bg-orange/10 border-b border-[#17334D] last:border-b-0"
                    >
                      {s.type === 'france' ? (t('searchLocationWholeFrance') || 'France entière') : s.type === 'region' ? s.nom : `${s.nom} · ${s.code}`}
                    </button>
                  ))}
                </div>
              )}
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
              {/* 25 Sep audit: when the geocoder can't resolve this city, the
                  filter silently falls back to a plain city-name text match
                  and radius_km is never actually sent - so changing the
                  select above kept doing nothing with no explanation. Now
                  says so, rather than leaving a seemingly-live control that
                  quietly ignores every change. */}
              {!loading && !cityCoords && (
                <p className="text-[9px] text-[#B9BBC8] mt-1">
                  {t('searchRadiusUnavailable') || 'Localisation précise indisponible : résultats limités au nom de la ville, le rayon ne s\'applique pas.'}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mb-2.5">
          <label className="text-[9px] font-medium text-[#B9BBC8] mb-1 block">{t('searchType') || "Type d'opportunité"}</label>
          <div className="flex flex-wrap gap-1.5">
            {([
              ['', t('searchTypeAll') || 'Tous'],
              ['public_procurement', t('searchTypePublic') || 'Marchés publics'],
              ['tender', t('searchTypeTender') || "Appels d'offres privés"],
              ['subcontracting', t('searchTypeSubcontracting') || 'Sous-traitance'],
            ] as const).map(([value, label]) => {
              // "Tous" reads as active whenever nothing specific is picked
              // (an empty selection already means "no journey filter" to
              // the backend - see journeyParam above); each real type
              // toggles independently, so Public + Privé can both be
              // active at once, same as the guided journey.
              const isActive = value === '' ? journeyFilters.length === 0 : journeyFilters.includes(value);
              return (
                <button
                  key={value || 'all'}
                  type="button"
                  onClick={() => toggleJourneyFilter(value)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors ${
                    isActive
                      ? 'bg-orange/15 border-orange text-orange'
                      : 'bg-[#031B30] border-[#17334D] text-[#B9BBC8] hover:border-[#2A4A6B]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
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
            {/* 25 Sep client audit, point 7: "Ajouter Services aux natures de
                prestations : nettoyage et maintenance ne se résument pas aux
                travaux ou fournitures." - see backend/utils/naturePrestation.ts. */}
            {(['travaux', 'fournitures', 'etudes', 'services', 'mixte'] as const).map(n => (
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
                  : n === 'services' ? t('natureServices') || 'Services'
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
              className={`w-full bg-[#031B30] border rounded-md px-2.5 py-2 text-[11px] text-white placeholder:text-[#6B7280] focus:outline-none transition-colors ${
                budgetRangeInvalid ? 'border-red-500/60 focus:border-red-500' : 'border-[#17334D] focus:border-orange'
              }`}
            />
          </div>
        </div>
        {/* Client (26 Sep audit, point 10): "le site accepte 100 000 €
            minimum et 10 000 € maximum, puis affiche zéro résultat sans
            expliquer l'erreur." Caught before the request even goes out -
            the backend also rejects this range with a clear message
            (opportunities.ts), this is just the same check surfaced the
            moment it's true rather than after a round trip. */}
        {budgetRangeInvalid && (
          <p className="text-[10px] text-red-400 -mt-2">
            Le montant minimum doit être inférieur ou égal au montant maximum.
          </p>
        )}

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
          <OpportunityListCard key={o.id} opportunity={o} compatible={companyKnown} loadedCount={filtered.length} />
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