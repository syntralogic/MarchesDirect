import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { siretApi, getApiErrorMessage, type ApiSiretCompany, type ApiSiretCandidate } from '@/lib/apiClient';
import { getSessionId } from '@/lib/visitorTracking';

interface CompanyKnownContextType {
  companyKnown: boolean;
  company: ApiSiretCompany | null;
  siret: string | null;
  candidates: ApiSiretCandidate[];
  loading: boolean;
  leadCaptured: boolean;
  leadPhone: string | null;
  leadEmail: string | null;
  // C08: whether leadPhone has passed the SMS OTP check, not just format
  // validation. Set locally by confirmPhoneVerified() once the OTP step
  // succeeds - the backend has no reason to re-report it on every status
  // poll since it never goes back to false within a session.
  phoneVerified: boolean;
  lookup: (query: string) => Promise<{ error: string | null; companyKnown?: boolean; siret?: string | null }>;
  confirm: (siret: string) => Promise<{ error: string | null; companyKnown?: boolean; siret?: string | null }>;
  captureLead: (phone: string, email: string, opportunityId?: string) => Promise<{ error: string | null }>;
  confirmPhoneVerified: () => void;
}

const CompanyKnownContext = createContext<CompanyKnownContextType | undefined>(undefined);

export function CompanyKnownProvider({ children }: { children: ReactNode }) {
  const [companyKnown, setCompanyKnown] = useState(false);
  const [company, setCompany] = useState<ApiSiretCompany | null>(null);
  const [siret, setSiret] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ApiSiretCandidate[]>([]);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadPhone, setLeadPhone] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    siretApi.status(getSessionId())
      .then(status => {
        if (cancelled) return;
        setCompanyKnown(status.companyKnown);
        setCompany(status.company || null);
        setSiret(status.siret || null);
        setLeadCaptured(!!status.leadCaptured);
        setLeadPhone(status.phone || null);
        setLeadEmail(status.email || null);
        setPhoneVerified(!!status.phoneVerified);
      })
      .catch(() => {
        // Non-fatal: just stays unidentified until the visitor tries the
        // SIRET form themselves - no toast, this fires on every page load.
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Accepts either a 14-digit SIRET or a free-text company name (client's
  // ask: "SIRET ou entreprise" - either should work). A SIRET resolves
  // straight to a company; a name now returns a `candidates` list (client's
  // 5 Sep brief) that the caller must render and let the visitor pick from,
  // then call confirm() with the chosen SIRET - no longer auto-resolved to
  // Pappers' best guess.
  const lookup = useCallback(async (query: string) => {
    try {
      const result = await siretApi.lookup(query, getSessionId());
      setCompanyKnown(result.companyKnown);
      setCompany(result.company || null);
      setSiret(result.siret || null);
      setCandidates(result.candidates || []);
      setLeadCaptured(!!result.leadCaptured);
      setLeadPhone(result.phone || null);
      setLeadEmail(result.email || null);
      // Returned alongside the (stale-until-next-render) context state so a
      // caller like OpportunityDetailPage can react to *this specific*
      // lookup immediately - needed to scope "company recognized" to the
      // opportunity the visitor is actually on, rather than relying on the
      // (session-wide, possibly already-true-from-an-earlier-opportunity)
      // `companyKnown` context value.
      return { error: null, companyKnown: result.companyKnown, siret: result.siret || null };
    } catch (err) {
      return { error: getApiErrorMessage(err, "La vérification du SIRET a échoué.") };
    }
  }, []);

  // Visitor picked one candidate off the list lookup() returned.
  const confirm = useCallback(async (candidateSiret: string) => {
    try {
      const result = await siretApi.confirm(candidateSiret, getSessionId());
      setCompanyKnown(result.companyKnown);
      setCompany(result.company || null);
      setSiret(result.siret || null);
      setCandidates([]);
      setLeadCaptured(!!result.leadCaptured);
      setLeadPhone(result.phone || null);
      setLeadEmail(result.email || null);
      return { error: null, companyKnown: result.companyKnown, siret: result.siret || null };
    } catch (err) {
      return { error: getApiErrorMessage(err, "La confirmation de l'entreprise a échoué.") };
    }
  }, []);

  // "lead" gate (client's newest brief): global per session once given,
  // never re-asked on another opportunity.
  const captureLead = useCallback(async (phone: string, email: string, opportunityId?: string) => {
    try {
      await siretApi.captureLead(phone, email, getSessionId(), opportunityId);
      setLeadCaptured(true);
      // A freshly submitted/edited phone hasn't been OTP-confirmed yet, even
      // if an earlier phone this session was. confirmPhoneVerified() below
      // is the only thing allowed to set this back to true.
      if (phone !== leadPhone) setPhoneVerified(false);
      setLeadPhone(phone);
      setLeadEmail(email);
      return { error: null };
    } catch (err) {
      return { error: getApiErrorMessage(err, "L'enregistrement de vos coordonnées a échoué.") };
    }
  }, [leadPhone]);

  // C08: called by the OTP confirmation UI once POST /siret/phone/verification/confirm
  // succeeds. Local-only flip (the backend has already persisted it) so the
  // Dossier-access gate re-renders immediately without another round trip.
  const confirmPhoneVerified = useCallback(() => {
    setPhoneVerified(true);
  }, []);

  return (
    <CompanyKnownContext.Provider value={{ companyKnown, company, siret, candidates, loading, leadCaptured, leadPhone, leadEmail, phoneVerified, lookup, confirm, captureLead, confirmPhoneVerified }}>
      {children}
    </CompanyKnownContext.Provider>
  );
}

export function useCompanyKnown() {
  const context = useContext(CompanyKnownContext);
  if (context === undefined) {
    throw new Error('useCompanyKnown must be used within a CompanyKnownProvider');
  }
  return context;
}
