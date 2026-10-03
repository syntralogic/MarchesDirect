import { API_URL } from '@/lib/apiClient';
import { getAnalyticsConsent } from '@/lib/consent';

const SESSION_KEY = 'md_visitor_session_id';

// Persisted across visits in this browser until the visitor clears storage -
// this is what links an anonymous browsing session to whichever CRM lead
// they eventually leave contact details on (see requestAccess/submitLead
// payloads, which send this same id as `sessionId`).
// DEV-14: without the visitor's consent the id is NOT stored (it lives only
// in memory for this page load, enough for a form to carry its own request id).
let memoryId: string | null = null;
export function getSessionId(): string {
  if (getAnalyticsConsent() !== 'granted') {
    if (!memoryId) memoryId = `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return memoryId;
  }
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (private browsing, etc.) - fall back to a
    // per-page-load id rather than crashing the tracking call.
    return `nostorage-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// DEV-14: funnel events. `request_submitted` is the ONLY conversion event and
// is fired strictly after the server confirmed the request was saved - never
// on the button click. No e-mail, phone, password or document is ever put in
// eventData (only ids, the journey family and the form kind).
export type VisitorEventType =
  | 'search'
  | 'view_opportunity'
  | 'view_seo_page'
  | 'company_identified'
  | 'concordance_shown'
  | 'form_started'
  | 'request_submitted';

export type RequestKind = 'callback' | 'appointment' | 'contact' | 'dossier_request';

// Returns a handler to attach to a <form onFocusCapture>: fires `form_started`
// once per form instance, when the visitor first touches a field.
export function createFormStartTracker(kind: RequestKind, extra?: () => Record<string, unknown>) {
  let fired = false;
  return () => {
    if (fired) return;
    fired = true;
    trackVisitorEvent('form_started', `Formulaire commencé : ${kind}`, undefined, { kind, ...(extra ? extra() : {}) });
  };
}

export function trackRequestSubmitted(kind: RequestKind, extra?: Record<string, unknown>) {
  trackVisitorEvent('request_submitted', `Demande enregistrée : ${kind}`, undefined, { kind, ...(extra || {}) });
}

// Fire-and-forget by design: a failed analytics beacon must never surface
// an error to the visitor or block navigation. Swallows all errors.
export function trackVisitorEvent(eventType: VisitorEventType, eventLabel?: string, brandId?: string, eventData?: Record<string, unknown>) {
  // No consent (not asked yet, or refused) = nothing is recorded.
  if (getAnalyticsConsent() !== 'granted') return;
  try {
    fetch(`${API_URL}/api/visitor-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: getSessionId(), eventType, eventLabel, brandId, eventData }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

// C06 (contre-audit 15 Sep): replaces the old seeded-random "X entreprises
// ont consulté cette annonce aujourd'hui" with a real count of distinct
// visitor sessions that actually fired a view_opportunity event for this
// id (see routes/visitorEvents.ts). Returns null on any failure so the
// caller can hide the block entirely rather than show a stale/fake number.
export async function getConsultationsToday(opportunityId: string): Promise<number | null> {
  try {
    const res = await fetch(`${API_URL}/api/visitor-events/consultations/${opportunityId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.count === 'number' ? data.count : null;
  } catch {
    return null;
  }
}
