import { API_URL } from '@/lib/apiClient';

const SESSION_KEY = 'md_visitor_session_id';

// Persisted across visits in this browser until the visitor clears storage -
// this is what links an anonymous browsing session to whichever CRM lead
// they eventually leave contact details on (see requestAccess/submitLead
// payloads, which send this same id as `sessionId`).
export function getSessionId(): string {
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

type VisitorEventType = 'search' | 'view_opportunity' | 'view_seo_page';

// Fire-and-forget by design: a failed analytics beacon must never surface
// an error to the visitor or block navigation. Swallows all errors.
export function trackVisitorEvent(eventType: VisitorEventType, eventLabel?: string, brandId?: string, eventData?: Record<string, unknown>) {
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
