import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import { CompanyAnalysisOverlay } from '@/components/CompanyAnalysisOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';

// 5 Oct client brief: when a visitor clicks an opportunity, the analysis
// animation plays for three seconds BEFORE the detail page opens.
//
// - With an identified company (SIRET lookup or account) the animation shows its
//   name; otherwise it shows the opportunity being opened, with wording that does
//   not pretend to analyse a company.
// - Ctrl/Cmd/Shift/middle clicks keep the browser's normal "open in a new tab"
//   behaviour (no animation, no delay).
// - Leaving the page by any other way (browser back, another link) cancels it.
// - "Passer" skips straight to the page.

interface Pending { destination: string; title?: string | null }
interface Ctx { openOpportunity: (destination: string, title?: string | null) => void }

const OpportunityTransitionContext = createContext<Ctx>({ openOpportunity: () => {} });

export function OpportunityTransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { company: anonCompany } = useCompanyKnown();
  const { isAuthenticated, company: accountCompany } = useAuth();
  const [pending, setPending] = useState<Pending | null>(null);
  const openedAt = useRef<string | null>(null);

  const openOpportunity = useCallback((destination: string, title?: string | null) => {
    setPending(cur => {
      if (cur) return cur; // a second click while it plays is ignored
      openedAt.current = window.location.pathname + window.location.search;
      return { destination, title };
    });
  }, []);

  // Browser back / any other navigation while the animation is on screen cancels it.
  useEffect(() => {
    if (!pending) return;
    const here = location.pathname + location.search;
    if (openedAt.current && here !== openedAt.current) setPending(null);
  }, [location.pathname, location.search, pending]);

  const finish = useCallback(() => {
    setPending(cur => {
      if (cur) navigate(cur.destination);
      return null;
    });
  }, [navigate]);

  const companyName = anonCompany?.name || (isAuthenticated ? accountCompany?.name : null) || null;

  return (
    <OpportunityTransitionContext.Provider value={{ openOpportunity }}>
      {children}
      {pending && (
        <CompanyAnalysisOverlay
          key={pending.destination}
          variant={companyName ? 'company' : 'opportunity'}
          companyName={companyName}
          subject={pending.title}
          onDone={finish}
        />
      )}
    </OpportunityTransitionContext.Provider>
  );
}

export const useOpenOpportunity = () => useContext(OpportunityTransitionContext).openOpportunity;

/** Drop-in <Link> for a link to an opportunity fiche: plain left-click plays the animation first. */
export function OpportunityLink({ to, title, onClick, ...rest }: LinkProps & { title?: string }) {
  const open = useOpenOpportunity();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab etc.
    e.preventDefault();
    open(typeof to === 'string' ? to : String(to));
  };
  return <Link to={to} onClick={handle} {...rest} />;
}
