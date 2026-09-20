// Single source of truth for the default "around a city" search perimeter.
// The homepage map counter, its "Voir les opportunités autour de …" link and
// the /recherche city filter must all use the same radius, otherwise the
// map announces one number and the search page shows another (20 Sep client
// audit: "autour de Libourne : 0" on the map vs 114 results within 50 km).
export const DEFAULT_CITY_RADIUS_KM = 50;
export const CITY_RADIUS_OPTIONS_KM = [50, 100, 200] as const;
