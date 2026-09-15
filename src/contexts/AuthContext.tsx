import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { apiClient, tokenStorage, getApiErrorMessage, ACCESS_TOKEN_KEY } from '@/lib/apiClient';
import type { AuthUser, Company, RegisterPayload } from '@/types/auth';
import { toast } from 'sonner';

interface AuthContextType {
  user: AuthUser | null;
  company: Company | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null; mfaRequired?: boolean; mfaToken?: string; userId?: string }>;
  register: (payload: RegisterPayload) => Promise<{ error: string | null }>;
  completeSignup: (sessionId: string, password: string) => Promise<{ error: string | null }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setUser(null);
      setCompany(null);
      return;
    }
    try {
      const { data } = await apiClient.get('/auth/me');
      setUser(data.user);
      setCompany(data.company ?? null);
    } catch {
      // Token invalid/expired and refresh already failed upstream - clear local state.
      tokenStorage.clear();
      setUser(null);
      setCompany(null);
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));

    // Fired by apiClient when a refresh attempt fails - keeps this context in sync.
    const onExpired = () => {
      setUser(null);
      setCompany(null);
      toast.error('Votre session a expire. Merci de vous reconnecter.');
    };
    window.addEventListener('md:session-expired', onExpired);

    // Contre-audit 15 Sep 2026, D02/D04: "No token provided" surfaced even
    // though the visitor-facing UI was showing the logged-in state
    // (Consulter/Télécharger, not the locked "Créer mon accès gratuit"
    // CTA) - the request interceptor reads the access token straight from
    // localStorage on every call, but nothing previously kept `user` (React
    // state, per-tab) in sync with localStorage (shared across tabs) when
    // it changed from *outside* this tab - e.g. logging out, or a session
    // expiring, in another tab open to the same site. That left this tab's
    // isAuthenticated stuck true with no access token behind it: exactly a
    // "No token provided" 401 on the very next click, followed by the
    // session-expired toast only once that click's request came back.
    // The `storage` event fires in every OTHER tab (not the one that made
    // the change) whenever localStorage changes, which is exactly the gap.
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN_KEY && !e.newValue) {
        setUser(null);
        setCompany(null);
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('md:session-expired', onExpired);
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });

      if (data.mfaRequired) {
        return { error: null, mfaRequired: true, mfaToken: data.mfaToken, userId: data.userId };
      }

      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      await refreshProfile();
      return { error: null };
    } catch (err) {
      return { error: getApiErrorMessage(err, 'Email ou mot de passe incorrect.') };
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const { data } = await apiClient.post('/auth/register', payload);
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      await refreshProfile();
      return { error: null };
    } catch (err) {
      return { error: getApiErrorMessage(err, "L'inscription a echoue.") };
    }
  };

  // Client priority #10 "Créer mon accès" - the opportunity funnel's
  // end-of-journey password step. Only sessionId + password are sent; the
  // backend pulls company name/SIRET/address/revenue and email/phone from
  // that same session's already-completed SIRET lookup + lead capture
  // (see completeSignupFromSession) instead of re-asking for any of it.
  const completeSignup = async (sessionId: string, password: string) => {
    try {
      const { data } = await apiClient.post('/auth/complete-signup', { sessionId, password });
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      await refreshProfile();
      return { error: null };
    } catch (err) {
      return { error: getApiErrorMessage(err, "La création de votre accès a échoué.") };
    }
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, company, loading, isAuthenticated: !!user, login, register, completeSignup, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
