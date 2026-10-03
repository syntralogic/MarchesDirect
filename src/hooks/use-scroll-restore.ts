import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Client (19 Sep): "les retours en arrière doivent conserver l'entreprise,
 * les réponses et les critères de recherche." Filters/search criteria
 * already round-trip through the URL on every listing page, so browser
 * back already restores those correctly - the missing piece was scroll
 * position, which reset to the top on every remount. OpportunityListCard
 * saves `scrollPos:{path}{search}` to sessionStorage right before
 * navigating to a fiche (see saveScrollForReturn there); this restores it
 * once the page's own content is actually ready to be scrolled into,
 * not before (an empty/loading list can't scroll to a real card's position).
 *
 * `ready` should be true once the list has real content to scroll into -
 * typically `!loading` from useOpportunities. Waits one frame past that so
 * the newly-rendered cards have a layout to scroll against.
 */
export function useScrollRestore(ready: boolean) {
  const location = useLocation();
  const restoredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const key = `scrollPos:${location.pathname}${location.search}`;
    if (restoredRef.current === key) return; // already restored for this exact URL this mount
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(key);
    } catch {
      return;
    }
    if (saved == null) return;
    restoredRef.current = key;
    requestAnimationFrame(() => {
      // DEV-05: prefer the card that was opened (same card, same spot on screen);
      // fall back to the saved pixel position when it is not in the list.
      let top = Number(saved);
      try {
        const raw = sessionStorage.getItem(`scrollAnchor:${key.slice('scrollPos:'.length)}`);
        if (raw) {
          const a = JSON.parse(raw) as { id: string; top: number };
          const el = document.querySelector(`[data-opp-id="${CSS.escape(a.id)}"]`);
          if (el) top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - a.top);
          sessionStorage.removeItem(`scrollAnchor:${key.slice('scrollPos:'.length)}`);
        }
      } catch {
        // non-fatal: pixel position is used
      }
      window.scrollTo({ top, behavior: 'auto' });
      try {
        sessionStorage.removeItem(key); // one-time use, so a later fresh visit doesn't jump
      } catch {
        // non-fatal
      }
    });
  }, [ready, location.pathname, location.search]);
}
