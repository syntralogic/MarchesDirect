import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { favoritesApi } from '@/lib/apiClient';
import { useAuth } from './AuthContext';
import { getSessionId } from '@/lib/visitorTracking';
import { toast } from 'sonner';

interface FavoritesContextType {
  savedIds: Set<string>;
  isSaved: (opportunityId: string) => boolean;
  toggle: (opportunityId: string) => Promise<void>;
  loading: boolean;
}

// 7 nov. (revue externe) : sans consentement de mesure d'audience, l'identifiant de session ne vit que le temps de la
// page : un favori enregistré disparaissait au rechargement alors que l'accueil l'affichait (liste du téléphone).
// Un favori est une fonction demandée par le visiteur : il est donc gardé sur le téléphone et fusionné avec le serveur.
const LOCAL_KEY = 'md_saved_markets';
function localIds(): string[] {
  try { return (JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as { id?: string }[]).map(x => x?.id).filter((x): x is string => typeof x === 'string'); } catch { return []; }
}
function setLocal(id: string, on: boolean) {
  try {
    const list = (JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') as { id: string }[]).filter(x => x && x.id !== id);
    if (on) list.push({ id });
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch { /* stockage indisponible */ }
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  // Client's brief (6 Sep): "une fois identifié, le développeur doit les
  // rattacher définitivement à son profil" - fires once per sign-in
  // transition, not on every render/mount.
  const attachedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    if (isAuthenticated) {
      setLoading(true);
      // Favoris gardés sur le téléphone avant la connexion : rattachés au compte.
      const afterAuth = () => Promise.all(localIds().map(id => favoritesApi.save(id).catch(() => {})))
        .then(() => { try { localStorage.removeItem(LOCAL_KEY); } catch { /* idem */ } }).then(() =>
        favoritesApi.ids())
          .then((ids) => { if (!cancelled) setSavedIds(new Set(ids)); })
          .catch(() => {
            // Non-fatal: the bookmark toggle just won't show as pre-saved until
            // the next successful load. No toast here - fires on every page
            // load for a logged-in user and shouldn't be noisy.
          })
          .finally(() => { if (!cancelled) setLoading(false); });

      if (!attachedRef.current) {
        attachedRef.current = true;
        favoritesApi.attachSession(getSessionId())
          .catch(() => {
            // Non-fatal - anything saved anonymously just stays in the
            // session table and can be retried; never blocks the account.
          })
          .finally(afterAuth);
      } else {
        afterAuth();
      }
      return () => { cancelled = true; };
    }

    // Anonymous visitor: load this browser session's own saves.
    attachedRef.current = false;
    setLoading(true);
    setSavedIds(new Set(localIds()));
    favoritesApi.sessionIds(getSessionId())
      .then((ids) => { if (!cancelled) setSavedIds(new Set([...localIds(), ...ids])); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const isSaved = useCallback((opportunityId: string) => savedIds.has(opportunityId), [savedIds]);

  const toggle = useCallback(
    async (opportunityId: string) => {
      const wasSaved = savedIds.has(opportunityId);
      // Premier enregistrement d'un visiteur anonyme : portable + e-mail d'abord, puis l'enregistrement se fait.

      // Optimistic update, rolled back on failure.
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(opportunityId);
        else next.add(opportunityId);
        return next;
      });

      try {
        if (isAuthenticated) {
          if (wasSaved) await favoritesApi.remove(opportunityId);
          else await favoritesApi.save(opportunityId);
        } else {
          setLocal(opportunityId, !wasSaved);
          const sessionId = getSessionId();
          // Le téléphone garde le favori : un échec côté serveur ne l'annule pas.
          if (wasSaved) await favoritesApi.sessionRemove(opportunityId, sessionId).catch(() => {});
          else await favoritesApi.sessionSave(opportunityId, sessionId).catch(() => {});
        }
        // Client's brief: the Save icon stays a Save icon - a plain
        // confirmation, never a form or a login prompt.
        if (!wasSaved) toast.success('Opportunité enregistrée');
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
