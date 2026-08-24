import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { apiClient, tokenStorage, getApiErrorMessage } from '@/lib/apiClient';
import type { AuthUser, Company, RegisterPayload } from '@/types/auth';
import { toast } from 'sonner';

interface AuthContextType {
  user: AuthUser | null;
  company: Company | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null; mfaRequired?: boolean; mfaToken?: string; userId?: string }>;
  register: (payload: RegisterPayload) => Promise<{ error: string | null }>;
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
    return () => window.removeEventListener('md:session-expired', onExpired);
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

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, company, loading, isAuthenticated: !!user, login, register, logout, refreshProfile }}
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
