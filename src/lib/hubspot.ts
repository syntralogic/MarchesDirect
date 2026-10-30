import { getAnalyticsConsent } from '@/lib/consent';

// HubSpot browser tracking (page views + campaign/UTM attribution + identifying a visitor once
// they have left their e-mail). Complements the server-side sync (backend services/hubspotService.ts)
// that pushes the SIRET / phone / searches / viewed announcements to the contact and its company.
//
// Rules:
//  * OFF unless VITE_HUBSPOT_PORTAL_ID is set (nothing is loaded, nothing changes).
//  * Nothing loads and no cookie is set until the visitor accepted analytics (DEV-14 consent).
//  * Only the e-mail is ever passed to identify(), and only after the visitor submitted it
//    themselves in a form.

declare global {
  interface Window { _hsq?: unknown[][] }
}

const PORTAL_ID = (import.meta.env['VITE_HUBSPOT_PORTAL_ID'] as string | undefined)?.trim();
const REGION = ((import.meta.env['VITE_HUBSPOT_REGION'] as string | undefined) || 'eu1').trim().toLowerCase();

let scriptRequested = false;

const enabled = (): boolean => !!PORTAL_ID && getAnalyticsConsent() === 'granted';

function scriptUrl(): string {
  // na1 uses the bare host; other regions are prefixed (js-eu1.hs-scripts.com).
  return REGION === 'na1' ? `https://js.hs-scripts.com/${PORTAL_ID}.js` : `https://js-${REGION}.hs-scripts.com/${PORTAL_ID}.js`;
}

/** Loads HubSpot's script once, after consent. Returns true when it was loaded by this call
 *  (the script reports the current page itself, so the caller must not report it twice). */
function ensureLoaded(): boolean {
  if (!enabled() || scriptRequested) return false;
  scriptRequested = true;
  window._hsq = window._hsq || [];
  const s = document.createElement('script');
  s.id = 'hs-script-loader';
  s.async = true;
  s.defer = true;
  s.src = scriptUrl();
  document.body.appendChild(s);
  return true;
}

/** Call on every route change (and when consent changes). */
export function trackHubspotPageView(path: string): void {
  try {
    if (!PORTAL_ID) return;
    if (getAnalyticsConsent() !== 'granted') {
      // Consent withdrawn after the script was loaded: tell it to stop.
      if (scriptRequested) { window._hsq = window._hsq || []; window._hsq.push(['doNotTrack']); }
      return;
    }
    if (ensureLoaded()) return; // first load: the script tracks this page by itself
    window._hsq = window._hsq || [];
    window._hsq.push(['setPath', path]);
    window._hsq.push(['trackPageView']);
  } catch {
    // tracking must never break the page
  }
}

/** Link this browser's HubSpot activity to the contact: call after the visitor submitted their e-mail. */
export function identifyHubspot(email?: string | null): void {
  try {
    if (!enabled() || !email) return;
    ensureLoaded();
    window._hsq = window._hsq || [];
    window._hsq.push(['identify', { email: String(email).trim().toLowerCase() }]);
    window._hsq.push(['trackPageView']); // identify is sent with the next page view
  } catch {
    // ignore
  }
}
