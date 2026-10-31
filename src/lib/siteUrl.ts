// Public origin used for canonical URLs. The app is also reachable on the Vercel domain
// (marchesdirect.vercel.app) and must never advertise it to search engines (SEO audit 23 Oct, point 1).
export const PUBLIC_SITE_URL = ((import.meta.env['VITE_SITE_URL'] as string | undefined) || 'https://www.marchesdirect.fr').replace(/\/$/, '');

export const canonicalBase = (): string => {
  if (typeof window === 'undefined') return PUBLIC_SITE_URL;
  // Local development keeps pointing at itself so canonicals stay checkable on localhost.
  return /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? window.location.origin : PUBLIC_SITE_URL;
};
