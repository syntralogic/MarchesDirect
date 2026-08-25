import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { favoritesApi } from '@/lib/apiClient';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface FavoritesContextType {
  savedIds: Set<string>;
  isSaved: (opportunityId: string) => boolean;
  toggle: (opportunityId: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setSavedIds(new Set());
      return;
    }
    let cancelled = false;
    setLoading(true);
    favoritesApi
      .ids()
      .then((ids) => {
        if (!cancelled) setSavedIds(new Set(ids));
      })
      .catch(() => {
        // Non-fatal: the bookmark toggle just won't show as pre-saved until
        // the next successful load. No toast here - this fires on every
        // page load for a logged-in user and shouldn't be noisy.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const isSaved = useCallback((opportunityId: string) => savedIds.has(opportunityId), [savedIds]);

  const toggle = useCallback(
    async (opportunityId: string) => {
      if (!isAuthenticated) {
        toast.error('Connectez-vous pour sauvegarder cette annonce.');
        return;
      }

      const wasSaved = savedIds.has(opportunityId);

      // Optimistic update, rolled back on failure.
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(opportunityId);
        else next.add(opportunityId);
        return next;
      });

      try {
        if (wasSaved) await favoritesApi.remove(opportunityId);
        else await favoritesApi.save(opportunityId);
      } catch {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(opportunityId);
          else next.delete(opportunityId);
          return next;
        });
        toast.error("Échec de l'enregistrement. Réessayez.");
      }
    },
    [isAuthenticated, savedIds]
  );

  return (
    <FavoritesContext.Provider value={{ savedIds, isSaved, toggle, loading }}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
