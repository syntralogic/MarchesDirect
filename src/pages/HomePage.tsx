import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Handshake, ChevronRight, Globe,
  Building, ArrowRight, Zap, Settings, Monitor, Truck, Briefcase, Headset,
  Search, MousePointerClick, Locate, MapPin, Loader2, AlertCircle, X,
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import { useLang } from '@/contexts/LangContext';
import PageMeta from '@/components/common/PageMeta';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';
import { sectors, allSectors } from '@/data/mockData';
import { frenchCitiesGeo } from '@/data/frenchCitiesGeo';
import { opportunitiesApi, type ApiOpportunity } from '@/lib/apiClient';

import team from "@/assets/team.jpg";

interface GeoFeatureProps { code: string; nom: string }
interface GeoFeature { rsmKey: string; properties: GeoFeatureProps }
interface GeoJsonData { type: string; features: unknown[] }

// d3-zoom's gesture filter: on touch devices we only want the map to
// pan/zoom when the user uses two fingers (pinch), so a normal one-finger
// swipe keeps scrolling the page instead of dragging the map around and
// disappearing off-screen. Mouse/wheel interaction on desktop is untouched.
function touchAwareZoomFilter(event: { type: string; touches?: TouchList; ctrlKey?: boolean; button?: number }) {
  if (event.type === 'touchstart' || event.type === 'touchmove' || event.type === 'touchend') {
    return !!(event.touches && event.touches.length > 1);
  }
  return !event.ctrlKey && !event.button;
}

// Strips accents and lowercases so backend region-name strings (which may
// come from BOAMP's raw text field with different accenting) still match
// the GeoJSON's official INSEE names.
function normalizeFr(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function GeographicSection() {
  const { t } = useLang();
  const [tab, setTab] = useState<'regions' | 'departments' | 'cities'>('regions');
  const [search, setSearch] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<GeoFeatureProps[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<GeoFeatureProps[]>([]);
  const [selectedCities, setSelectedCities] = useState<{name: string; coords: [number, number]}[]>([]);
  const [, setHovered] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [cityResult, setCityResult] = useState<{ name: string; coords: [number, number] | null } | null>(null);
  const [cityOpportunities, setCityOpportunities] = useState<ApiOpportunity[]>([]);
  const [cityTotal, setCityTotal] = useState(0);
  const [cityLoading, setCityLoading] = useState(false);
  const [position, setPosition] = useState({ coordinates: [2.4, 46.6] as [number, number], zoom: 1 });
  const [citiesPosition, setCitiesPosition] = useState({ coordinates: [2.4, 46.6] as [number, number], zoom: 1 });

  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({});
  const [deptCounts, setDeptCounts] = useState<Record<string, number>>({});
  // ~800KB combined - loaded on demand when this section mounts, not bundled
  // into the main JS chunk that every page pays for.
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
    opportunitiesApi.statsByRegion()
      .then(({ regions }) => {
        const map: Record<string, number> = {};
        regions.forEach(r => { map[normalizeFr(r.region)] = r.count; });
        setRegionCounts(map);
      })
      .catch(() => setRegionCounts({}));
    opportunitiesApi.statsByDepartment()
      .then(({ departments }) => {
        const map: Record<string, number> = {};
        departments.forEach(d => { map[d.department] = d.count; });
        setDeptCounts(map);
      })
      .catch(() => setDeptCounts({}));
  }, []);

  const getRegionCount = (name: string) => regionCounts[normalizeFr(name)] ?? 0;
  const getDeptCount = (code: string, name: string) => deptCounts[code] ?? deptCounts[normalizeFr(name)] ?? 0;

  const handleCitySearch = async (override?: string) => {
    const raw = override ?? cityQuery;
    if (!raw.trim()) return;
    if (override) setCityQuery(override);
    setCityLoading(true);
    const query = raw.trim();
    try {
      const [searchData, geo] = await Promise.all([
        opportunitiesApi.search({ journey: undefined, city: query, limit: 5 }),
        fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=1`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
      ]);
      setCityOpportunities(searchData.results);
      setCityTotal(searchData.pagination.total);
      const feature = geo?.features?.[0];
      const coords: [number, number] | null = feature ? [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] : null;
      setCityResult({ name: feature?.properties?.city || query, coords });
    } catch {
      setCityResult({ name: query, coords: null });
      setCityOpportunities([]);
      setCityTotal(0);
    } finally {
      setCityLoading(false);
    }
  };

  const selectMapCity = (city: { name: string; coords: [number, number] }) => {
    setCitiesPosition(p => ({ coordinates: city.coords, zoom: Math.max(p.zoom, 4) }));
    setSelectedCities(prev => {
      const exists = prev.some(c => c.name === city.name);
      return exists
        ? prev.filter(c => c.name !== city.name)
        : [...prev, city];
    });
    handleCitySearch(city.name);
  };

  const visibleCities = frenchCitiesGeo.filter(c => {
    if (c.tier === 1) return true;
    if (c.tier === 2) return citiesPosition.zoom >= 2;
    return citiesPosition.zoom >= 4;
  });
  const zoomLevelLabel = citiesPosition.zoom >= 4 ? 'Élevé' : citiesPosition.zoom >= 2 ? 'Moyen' : 'Faible';

  useEffect(() => {
    if (!search.trim()) return;
    const query = search.trim().toLowerCase();
    if (tab === 'regions' && regionsGeoJson) {
      const matches = (regionsGeoJson.features as { properties: GeoFeatureProps }[]).filter(f =>
        f.properties.nom.toLowerCase().includes(query)
      );
      if (matches.length === 1) {
        const match = matches[0].properties;
        setSelectedRegions(prev => {
          const exists = prev.some(r => r.code === match.code);
          return exists ? prev : [...prev, match];
        });
      }
    } else if (tab === 'departments' && departementsGeoJson) {
      const matches = (departementsGeoJson.features as { properties: GeoFeatureProps }[]).filter(
        f => f.properties.nom.toLowerCase().includes(query) || f.properties.code?.includes(search.trim())
      );
      if (matches.length === 1) {
        const match = matches[0].properties;
        setSelectedDepts(prev => {
          const exists = prev.some(d => d.code === match.code);
          return exists ? prev : [...prev, match];
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab, regionsGeoJson, departementsGeoJson]);

  const getSelectedItems = () => {
    if (tab === 'regions') return selectedRegions;
    if (tab === 'departments') return selectedDepts;
    return selectedCities;
  };

  const clearAllSelections = () => {
    if (tab === 'regions') setSelectedRegions([]);
    else if (tab === 'departments') setSelectedDepts([]);
    else setSelectedCities([]);
  };

  const removeSelection = (item: any) => {
    if (tab === 'regions') {
      setSelectedRegions(prev => prev.filter(r => r.code !== item.code));
    } else if (tab === 'departments') {
      setSelectedDepts(prev => prev.filter(d => d.code !== item.code));
    } else {
      setSelectedCities(prev => prev.filter(c => c.name !== item.name));
    }
  };

  const selected = getSelectedItems();
  const selectedCount = selected.length;

  // Build the search URL based on selected items
  const buildSearchUrl = () => {
    if (tab === 'regions' && selectedRegions.length > 0) {
      const params = selectedRegions.map(r => `region=${encodeURIComponent(r.nom)}`).join('&');
      return `/recherche?${params}`;
    } else if (tab === 'departments' && selectedDepts.length > 0) {
      const params = selectedDepts.map(d => `department=${encodeURIComponent(d.code)}`).join('&');
      return `/recherche?${params}`;
    } else if (tab === 'cities' && selectedCities.length > 0) {
      const params = selectedCities.map(c => `city=${encodeURIComponent(c.name)}`).join('&');
      return `/recherche?${params}`;
    }
    return '/recherche';
  };

  return (
    <section className="px-4 md:px-6 py-6 md:py-10 max-w-7xl mx-auto w-full">
      <div className="mb-4 md:mb-6">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('nearYou')}</span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-2">{t('opportunitiesFrance')}</h2>
        <p className="text-[#B9BBC8] text-sm">{t('exploreFrance')}</p>
      </div>

      <div className="border border-[#17334D] rounded-2xl bg-[#061D32] p-4 md:p-6">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex gap-1 border border-[#17334D] rounded-xl p-1 w-fit">
            {(['regions', 'departments', 'cities'] as const).map(k => (
              <button
                key={k}
                onClick={() => { setTab(k); setSearch(''); }}
                className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
                  tab === k ? 'bg-orange/15 text-orange border border-orange' : 'text-[#B9BBC8] hover:text-white'
                }`}
              >
                {t(k)}
              </button>
            ))}
          </div>
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="bg-orange/10 text-orange px-2 py-0.5 rounded-full text-xs">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
              <button
                onClick={clearAllSelections}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Effacer tout
              </button>
            </div>
          )}
        </div>

        {tab !== 'cities' ? (
          <>
            {/* Search */}
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tab === 'regions' ? t('mapSearchRegion') : t('mapSearchDepartment')}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
              />
            </div>
            <p className="text-[11px] text-[#B9BBC8] flex items-center gap-1.5 mb-3">
              <MousePointerClick size={12} /> {tab === 'regions' ? t('mapTouchRegion') : t('mapTouchDepartment')}
            </p>

            {/* Choropleth map */}
            <div className="relative rounded-xl overflow-hidden border border-[#17334D] bg-[#031B30] h-[280px] md:h-[380px]" style={{ touchAction: 'pan-y' }}>
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
                      geographies
                        .map(geo => {
                          const isSelected = tab === 'regions' 
                            ? selectedRegions.some(r => r.code === geo.properties.code)
                            : tab === 'departments'
                            ? selectedDepts.some(d => d.code === geo.properties.code)
                            : false;
                          const isSearchMatch =
                            search !== '' &&
                            (geo.properties.nom.toLowerCase().includes(search.toLowerCase()) ||
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
                                      return exists
                                        ? prev.filter(r => r.code !== geo.properties.code)
                                        : [...prev, geo.properties];
                                    });
                                  } else {
                                    setSelectedDepts(prev => {
                                      const exists = prev.some(d => d.code === geo.properties.code);
                                      return exists
                                        ? prev.filter(d => d.code !== geo.properties.code)
                                        : [...prev, geo.properties];
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
                                      fontSize: tab === 'regions' ? 6.5 : 8,
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

              {/* Zoom controls */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={() => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))} className="w-8 h-8 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">+</button>
                <button onClick={() => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))} className="w-8 h-8 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">−</button>
                <button onClick={() => setPosition({ coordinates: [2.4, 46.6], zoom: 1 })} className="w-8 h-8 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors flex items-center justify-center"><Locate size={14} /></button>
              </div>

              {/* Selection tooltip */}
              {selectedCount > 0 && (
                <div className="absolute bottom-3 left-3 bg-[#061D32]/95 border border-[#17334D] rounded-lg px-3 py-2 max-h-32 overflow-y-auto min-w-[150px] max-w-[250px]">
                  {selected.map((item, index) => {
                    const isRegion = 'nom' in item && 'code' in item;
                    const name = isRegion ? item.nom : item.name;
                    const code = isRegion ? item.code : undefined;
                    const count = isRegion 
                      ? (tab === 'regions' ? getRegionCount(item.nom) : getDeptCount(item.code, item.nom))
                      : undefined;
                    return (
                      <div key={code || name || index} className="flex items-center justify-between gap-2 py-0.5 border-b border-[#17334D]/50 last:border-0">
                        <p className="text-xs font-semibold text-white truncate">{name}</p>
                        {count !== undefined && <p className="text-[10px] text-[#B9BBC8] shrink-0">{count}</p>}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelection(item);
                          }}
                          className="text-red-400 hover:text-red-300 shrink-0 ml-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedCount > 0 ? (
              <Link
                to={buildSearchUrl()}
                className="mt-3 w-full flex items-center justify-center gap-2 border border-orange text-orange font-semibold text-sm py-3 rounded-xl hover:bg-orange/10 transition-colors"
              >
                {t('mapViewOpportunitiesIn')} 
                {selected.map((item, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    {'nom' in item ? item.nom : item.name}
                  </span>
                ))}
                <ArrowRight size={14} />
              </Link>
            ) : (
              <div className="mt-3 flex flex-col items-center text-center py-4">
                <Globe size={28} className="text-orange mb-2" />
                <p className="text-sm font-bold text-white">{t('mapSelectPrompt')}</p>
                <p className="text-xs text-[#B9BBC8] mt-1">{t('mapSelectPromptSub')}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Villes tab */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
                <input
                  value={cityQuery}
                  onChange={e => { setCityQuery(e.target.value); setCityResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleCitySearch()}
                  placeholder={t('mapSearchCity')}
                  className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
                />
              </div>
              <button
                onClick={() => handleCitySearch()}
                disabled={cityLoading || !cityQuery.trim()}
                className="px-4 bg-orange text-white font-semibold text-sm rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {cityLoading && <Loader2 size={14} className="animate-spin" />} {t('mapCitySearchButton')}
              </button>
            </div>
            <p className="text-[11px] text-[#B9BBC8] flex items-center gap-1.5 mb-3">
              <MousePointerClick size={12} /> Touchez une ville sur la carte, ou zoomez pour en voir davantage.
            </p>

            {/* Zoomable map with city pins */}
            <div className="relative rounded-xl overflow-hidden border border-[#17334D] bg-[#031B30] h-[220px] md:h-[300px] mb-3" style={{ touchAction: 'pan-y' }}>
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
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{ center: [2.454, 46.6], scale: 2600 }}
                  width={780}
                  height={620}
                  style={{ width: '100%', height: '100%' }}
                >
                  <ZoomableGroup
                    center={citiesPosition.coordinates}
                    zoom={citiesPosition.zoom}
                    onMoveEnd={setCitiesPosition}
                    minZoom={1}
                    maxZoom={8}
                    filterZoomEvent={touchAwareZoomFilter as unknown as (element: SVGElement) => boolean}
                  >
                    <Geographies geography={regionsGeoJson}>
                      {({ geographies }: { geographies: GeoFeature[] }) =>
                        geographies.map(geo => (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            style={{
                              default: { fill: '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                              hover: { fill: '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                              pressed: { fill: '#3E5872', stroke: '#031B30', strokeWidth: 0.75, outline: 'none' },
                            }}
                          />
                        ))
                      }
                    </Geographies>
                    {visibleCities.map(city => {
                      const isSelected = selectedCities.some(c => c.name === city.name);
                      return (
                        <Marker key={city.name} coordinates={city.coords} onClick={() => selectMapCity(city)} style={{ default: { cursor: 'pointer' } }}>
                          {isSelected && <circle r={11} fill="#FF6500" fillOpacity={0.25} />}
                          <circle r={isSelected ? 6 : 4} fill="#FF6500" stroke="#fff" strokeWidth={1.2} />
                          <text textAnchor="middle" y={-9} style={{ fontSize: isSelected ? 11 : 9, fill: '#fff', fontWeight: isSelected ? 700 : 600, pointerEvents: 'none' }}>
                            {city.name}
                          </text>
                        </Marker>
                      );
                    })}
                  </ZoomableGroup>
                </ComposableMap>
              )}

              {/* Zoom controls */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button onClick={() => setCitiesPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))} className="w-8 h-8 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">+</button>
                <button onClick={() => setCitiesPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))} className="w-8 h-8 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors text-lg font-bold">−</button>
                <button onClick={() => setCitiesPosition({ coordinates: [2.4, 46.6], zoom: 1 })} className="w-8 h-8 bg-[#061D32] border border-[#17334D] rounded-lg text-white hover:bg-orange/20 transition-colors flex items-center justify-center"><Locate size={14} /></button>
              </div>

              {/* Zoom level badge */}
              <div className="absolute bottom-3 left-3 bg-[#061D32]/95 border border-[#17334D] rounded-lg px-2.5 py-1.5">
                <p className="text-[10px] font-semibold text-white">Niveau de zoom : {zoomLevelLabel}</p>
              </div>
            </div>
            <p className="text-[11px] text-[#B9BBC8] mb-3">
              Plus vous zoomez, plus les villes apparaissent.
            </p>

            {/* Results */}
            {cityLoading ? (
              <div className="rounded-xl border border-[#17334D] bg-[#031B30] p-8 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-orange" />
              </div>
            ) : !cityResult ? (
              <div className="rounded-xl border border-[#17334D] bg-[#031B30] p-6 flex flex-col items-center text-center">
                <Globe size={24} className="text-orange mb-2" />
                <p className="text-sm font-bold text-white">{t('mapSelectPrompt')}</p>
                <p className="text-xs text-[#B9BBC8] mt-1">{t('mapTouchCity')}</p>
              </div>
            ) : cityOpportunities.length === 0 ? (
              <div className="rounded-xl border border-[#17334D] bg-[#031B30] p-6 text-center">
                <p className="text-sm font-semibold text-white">{cityResult.name}</p>
                <p className="text-xs text-[#B9BBC8] mt-1">{t('mapNoData')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cityOpportunities.map(opp => (
                  <Link
                    key={opp.id}
                    to={`/opportunites/${opp.id}`}
                    className="block bg-[#031B30] border border-[#17334D] rounded-xl p-3 hover:border-orange/40 transition-colors"
                  >
                    <p className="text-sm font-semibold text-white leading-snug mb-1">{opp.title}</p>
                    <div className="flex flex-wrap gap-3 text-[10px] text-[#B9BBC8]">
                      {opp.location_city && <span className="flex items-center gap-1"><MapPin size={10} /> {opp.location_city}</span>}
                      {opp.deadline && <span>{new Date(opp.deadline).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {selectedCities.length > 0 && (
              <Link
                to={buildSearchUrl()}
                className="mt-3 w-full flex items-center justify-center gap-2 border border-orange text-orange font-semibold text-sm py-3 rounded-xl hover:bg-orange/10 transition-colors"
              >
                {t('mapViewOpportunitiesAround')} 
                {selectedCities.map((c, i) => (
                  <span key={i}>{i > 0 && ', '}{c.name}</span>
                ))}
                ({cityTotal}) <ArrowRight size={14} />
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function HeroSection({ onAppt, onCallback }: { onAppt: () => void; onCallback: () => void }) {
  const { t } = useLang();
  return (
    <section className="px-4 md:px-6 pt-4 md:pt-16 pb-6 md:pb-16 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center md:gap-16">
        <div className="flex-1 min-w-0">
          {/* Mobile hero card */}
          <div className="md:hidden border border-orange/40 rounded-xl bg-[#061D32] p-4 orange-glow mb-4 relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-2xl font-extrabold leading-tight mb-2">
                <span className="text-white">{t('heroLine1')}</span>
                <br />
                <span className="text-orange">{t('heroLine2')}</span>
              </h1>
              <p className="text-[#B9BBC8] text-xs leading-relaxed mb-4">{t('heroSub')}</p>
              <div className="mb-3"><OpportunityPaths /></div>
              <div className="flex gap-2">
                <button onClick={onAppt} className="flex-1 bg-orange text-white font-semibold py-2.5 rounded-lg text-xs hover:bg-orange/90 transition-colors">{t('bookAppointment')}</button>
                <button onClick={onCallback} className="flex-1 border border-orange text-orange font-semibold py-2.5 rounded-lg text-xs hover:bg-orange/10 transition-colors">{t('callBack')}</button>
              </div>
            </div>
          </div>

          {/* Desktop hero text */}
          <div className="hidden md:block">
            <h1 className="text-5xl xl:text-6xl font-extrabold leading-tight mb-4 tracking-tight">
              <span className="text-white">{t('heroLine1')}</span>
              <br />
              <span className="text-orange">{t('heroLine2')}</span>
            </h1>
            <p className="text-[#B9BBC8] text-lg leading-relaxed mb-8 max-w-xl">{t('heroSub')}</p>
            <div className="flex gap-4">
              <button onClick={onAppt} className="bg-orange text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-orange/90 transition-colors">{t('bookAppointment')}</button>
              <button onClick={onCallback} className="border border-orange text-orange font-semibold px-6 py-3.5 rounded-xl hover:bg-orange/10 transition-colors">{t('callBack')}</button>
            </div>
          </div>
        </div>
        
        {/* Right: desktop visual */}
        <div className="hidden md:flex flex-shrink-0 w-80 xl:w-96 flex-col gap-3 relative">
          <div className="border border-[#17334D] rounded-2xl bg-[#061D32] p-5 orange-glow-sm">
            <div className="text-xs text-orange font-semibold uppercase tracking-wide mb-2">BOAMP · PLACE · JOUE</div>
            <div className="text-2xl font-bold text-white mb-1">3 421+</div>
            <div className="text-sm text-[#B9BBC8]">opportunités disponibles</div>
            <div className="mt-3 flex gap-2">
              <span className="text-xs bg-orange/10 text-orange px-2 py-1 rounded-full">Marchés publics</span>
              <span className="text-xs bg-[#17334D] text-[#B9BBC8] px-2 py-1 rounded-full">Appels d'offres</span>
            </div>
          </div>
          <div className="border border-[#17334D] rounded-xl bg-[#061D32] p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div>
              <div className="text-xs text-white font-semibold">Nouvelles opportunités</div>
              <div className="text-xs text-[#B9BBC8]">127 publiées aujourd'hui</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OpportunityPaths() {
  const paths = [
    { icon: Building, title: 'Marchés publics', sub: 'Mairies, État, collectivités', href: '/parcours?type=marches-publics' },
    { icon: Building2, title: "Appels d'offres", sub: 'Promoteurs, bailleurs, grandes entreprises', href: '/parcours?type=appels-doffres' },
    { icon: Handshake, title: 'Sous-traitance', sub: 'Lots entre entreprises du bâtiment', href: '/parcours?type=sous-traitance' },
  ];
  return (
    <div className="grid grid-cols-1 gap-2">
      {paths.map(p => (
        <Link key={p.href} to={p.href} className="flex items-center gap-3 bg-[#061D32]/80 border border-[#17334D] rounded-lg p-3 hover:border-orange/50 group transition-all">
          <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center shrink-0"><p.icon size={20} className="text-orange" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white group-hover:text-orange transition-colors">{p.title}</div>
            <div className="text-[10px] text-[#B9BBC8] mt-0.5">{p.sub}</div>
          </div>
          <ChevronRight size={14} className="text-orange shrink-0" />
        </Link>
      ))}
    </div>
  );
}

function WhoWeAre() {
  const { t } = useLang();
  return (
    <section className="px-4 md:px-6 py-1 md:py-2 max-w-7xl mx-auto w-full">
      <div className="border border-[#17334D] rounded-xl bg-[#061D32] p-2 md:p-4 hover:border-orange/30 transition-all">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex-shrink-0">
            <div className="relative w-10 h-10 md:w-14 md:h-14">
              <div className="w-full h-full rounded-full border border-orange bg-[#061D32] flex items-center justify-center orange-glow-sm overflow-hidden"><img src={team} alt="Marchés Direct" className="w-full h-full object-cover" /></div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs md:text-base font-bold text-white mb-0">{t('whoWeAre')}</h2>
            <p className="text-[#B9BBC8] leading-relaxed text-[10px] md:text-sm mb-1">{t('whoWeAreSub')}</p>
            <Link to="/a-propos" className="inline-flex items-center gap-1 text-orange font-semibold text-[10px] md:text-xs hover:gap-2 transition-all">{t('discoverUs')}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectorsSection() {
  const { t } = useLang();
  const iconMap: Record<string, React.ElementType> = { Building2, Zap, Settings, Monitor, Truck, Briefcase };
  return (
    <section className="px-4 md:px-6 py-10 md:py-16 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('sectors')}</span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-2">{t('sectorsSub')}</h2>
        <p className="text-[#B9BBC8] text-sm">{t('sectorsSub2')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sectors.map(sector => {
          const Icon = iconMap[sector.icon] || Building2;
          return (
            <Link key={sector.id} to="/secteurs" className="flex flex-col items-center gap-2 bg-[#061D32] border border-[#17334D] rounded-xl p-4 hover:border-orange/50 group transition-all text-center">
              <div className="w-14 h-14 rounded-full bg-orange/10 flex items-center justify-center shrink-0 group-hover:bg-orange/20 transition-colors"><Icon size={28} className="text-orange" /></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-white group-hover:text-orange transition-colors leading-snug">{sector.name}</div><div className="text-xs text-[#B9BBC8] mt-0.5">{sector.count.toLocaleString('fr-FR')}</div></div>
            </Link>
          );
        })}
      </div>
      <div className="mt-5">
        <Link to="/secteurs" className="w-full md:w-auto md:inline-flex flex items-center justify-center gap-2 border border-orange text-orange font-semibold text-sm rounded-xl py-3 px-5 hover:bg-orange/10 transition-colors">
          {t('seeAllSectors')} <ArrowRight size={14} />
        </Link>
        <p className="text-xs text-[#B9BBC8] text-center md:text-left mt-2">{allSectors.length} secteurs disponibles</p>
      </div>
    </section>
  );
}

function NewsSection() {
  const { t } = useLang();
  const newsItems = [
    { id: '1', category: 'Réglementation', title: 'Marchés publics : les changements à connaître en 2026', description: 'Les nouvelles règles issues de la réforme de la commande publique entrent en vigueur. Tour d\'horizon des impacts pour les entreprises.', date: '15 août 2026', icon: (<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v14a2 2 0 0 0 2 2h8" /><path d="M6 3h8l3 3v11" /><path d="M9 8h5M9 11h5" /><path d="M4 17l2-4 2 4M2 17h4" /></svg>) },
    { id: '2', category: 'Tendances', title: 'Les secteurs qui recherchent de nouveaux partenaires', description: 'Construction, énergie et numérique : trois secteurs en forte croissance qui recrutent massivement via les marchés publics et privés.', date: '10 août 2026', icon: (<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V6M16 20v-8" /><path d="M4 12l6-5 6 4 6-8" /><path d="M18 5h4v4" /></svg>) },
    { id: '3', category: 'Opportunités', title: 'Les nouvelles consultations près de chez vous', description: 'Plus de 1 200 nouvelles consultations publiées cette semaine. Découvrez les opportunités dans votre région.', date: '5 août 2026', icon: (<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.4" /></svg>) },
  ];
  const categoryColors: Record<string, string> = { Réglementation: 'text-orange', Tendances: 'text-orange', Opportunités: 'text-orange' };
  return (
    <section className="px-4 md:px-6 py-10 md:py-16 max-w-7xl mx-auto w-full">
      <div className="mb-6"><span className="text-xs font-bold text-orange uppercase tracking-widest">{t('news')}</span><h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-2">{t('newsSub')}</h2><p className="text-[#B9BBC8] text-sm">{t('newsSub2')}</p></div>
      <div className="flex flex-col gap-4 mt-6">
        {newsItems.map((item) => (
          <Link key={item.id} to="/actualites" className="border border-[#17334D] rounded-xl bg-[#061D32] p-4 md:p-5 flex items-center gap-4 md:gap-5 hover:border-orange/50 transition-colors group">
            <span className={`shrink-0 w-14 h-14 md:w-[70px] md:h-[70px] rounded-full border-2 border-orange text-orange flex items-center justify-center group-hover:bg-orange/10 transition-colors`}>{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${categoryColors[item.category] || 'text-orange'}`}>{item.category}</div>
              <h3 className="text-sm md:text-[17px] font-bold text-white group-hover:text-orange transition-colors leading-snug">{item.title}</h3>
              <span className="inline-flex items-center gap-1.5 text-[#B9BBC8] text-xs md:text-[13px] font-semibold mt-2 group-hover:text-orange transition-colors">Lire l'article <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-5 text-center md:text-left"><Link to="/actualites" className="inline-flex items-center gap-2 text-orange font-semibold text-sm hover:gap-3 transition-all">{t('seeAllNews')} <ArrowRight size={14} /></Link></div>
    </section>
  );
}

function FinalCTA({ onAppt, onCallback }: { onAppt: () => void; onCallback: () => void }) {
  const { t } = useLang();
  return (
    <section className="px-4 md:px-6 py-10 md:py-16 max-w-7xl mx-auto w-full">
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 md:p-10 text-center orange-glow-sm">
        <div className="flex justify-center mb-6"><Headset className="w-16 h-16 text-orange" strokeWidth={1.5} /></div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{t('finalCtaHeading')}</h2>
        <p className="text-[#B9BBC8] text-sm md:text-base mb-8 max-w-xl mx-auto">{t('finalCtaSub')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onAppt} className="bg-orange text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-orange/90 transition-colors">{t('bookAppointment')}</button>
          <button onClick={onCallback} className="border border-orange text-orange font-semibold px-6 py-3.5 rounded-xl hover:bg-orange/10 transition-colors">{t('callBack')}</button>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <div className="page-fade-in">
      <PageMeta
        title="Marchés Direct — Marchés publics, appels d'offres privés et sous-traitance"
        description="Trouvez et candidatez aux marchés publics, appels d'offres privés et missions de sous-traitance partout en France. Analyse IA du DCE, scoring de compatibilité et génération de dossier."
      />
      <HeroSection onAppt={() => setAppointmentOpen(true)} onCallback={() => setCallbackOpen(true)} />
      <WhoWeAre />
      <GeographicSection />
      <SectorsSection />
      <NewsSection />
      <FinalCTA onAppt={() => setAppointmentOpen(true)} onCallback={() => setCallbackOpen(true)} />
      <AppointmentModal open={appointmentOpen} onClose={() => setAppointmentOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}