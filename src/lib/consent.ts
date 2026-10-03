// DEV-14: visitor analytics (funnel events tied to a persistent browser id)
// run ONLY after the visitor said yes. Choice is stored in this browser.
// 'granted' | 'denied' | null (= not chosen yet: the banner is shown and
// nothing is recorded). Refusing is as easy as accepting.
export type AnalyticsConsent = 'granted' | 'denied' | null;

const KEY = 'md_analytics_consent';
const SESSION_KEY = 'md_visitor_session_id';
const EVENT = 'md-consent-change';

export function getAnalyticsConsent(): AnalyticsConsent {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null; // storage blocked: behave as "not chosen" -> nothing recorded
  }
}

export function setAnalyticsConsent(value: 'granted' | 'denied') {
  try {
    localStorage.setItem(KEY, value);
    // Refusing removes the persistent id so nothing keeps linking this browser.
    if (value === 'denied') localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT));
}

// Lets the visitor change their mind later (privacy page): shows the banner again.
export function resetAnalyticsConsent() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(EVENT));
}

export function onConsentChange(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
