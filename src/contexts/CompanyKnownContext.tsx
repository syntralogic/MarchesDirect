import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { siretApi, getApiErrorMessage, type ApiSiretCompany } from '@/lib/apiClient';
import { getSessionId } from '@/lib/visitorTracking';

interface CompanyKnownContextType {
  companyKnown: boolean;
  company: ApiSiretCompany | null;
  siret: string | null;
  loading: boolean;
  lookup: (siret: string) => Promise<{ error: string | null }>;
}

const CompanyKnownContext = createContext<CompanyKnownContextType | undefined>(undefined);

export function CompanyKnownProvider({ children }: { children: ReactNode }) {
  const [companyKnown, setCompanyKnown] = useState(false);
  const [company, setCompany] = useState<ApiSiretCompany | null>(null);
  const [siret, setSiret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    siretApi.status(getSessionId())
      .then(status => {
        if (cancelled) return;
        setCompanyKnown(status.companyKnown);
        setCompany(status.company || null);
        setSiret(status.siret || null);
      })
      .catch(() => {
        // Non-fatal: just stays unidentified until the visitor tries the
        // SIRET form themselves - no toast, this fires on every page load.
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const lookup = useCallback(async (siretValue: string) => {
    try {
      const result = await siretApi.lookup(siretValue, getSessionId());
      setCompanyKnown(result.companyKnown);
      setCompany(result.company || null);
      setSiret(result.siret || null);
      return { error: null };
    } catch (err) {
      return { error: getApiErrorMessage(err, "La vérification du SIRET a échoué.") };
    }
  }, []);

  return (
    <CompanyKnownContext.Provider value={{ companyKnown, company, siret, loading, lookup }}>
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
