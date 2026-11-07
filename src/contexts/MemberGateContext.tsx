import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import MemberGate from '@/components/fiche/MemberGate';
import { useAuth } from './AuthContext';
import { isMember } from '@/lib/memberGate';
import { siretApi } from '@/lib/apiClient';
import { getSessionId } from '@/lib/visitorTracking';

// 7 nov. (décision de Hedi) : la lecture reste libre et illimitée. Le portable + l'e-mail (sans mot de passe) sont demandés
// au PREMIER geste personnel : enregistrer une annonce ou une recherche. Une fois donnés, plus jamais redemandés.
type Ctx = { requireMember: (action: () => void) => void };
const C = createContext<Ctx>({ requireMember: a => a() });

export function MemberGateProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState<{ name?: string | null; siret?: string | null }>({});
  const pending = useRef<(() => void) | null>(null);
  const requireMember = useCallback((action: () => void) => {
    if (isAuthenticated || isMember()) { action(); return; }
    pending.current = action; setOpen(true);
    siretApi.status(getSessionId()).then(s => setCompany({ name: s?.company?.name, siret: s?.siret })).catch(() => {});
  }, [isAuthenticated]);
  const done = () => { setOpen(false); const a = pending.current; pending.current = null; a?.(); };
  return (
    <C.Provider value={{ requireMember }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center" role="dialog" aria-modal="true" aria-label="Continuer gratuitement">
          <div className="relative max-h-[92vh] w-full max-w-[520px] overflow-y-auto p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button type="button" onClick={() => { setOpen(false); pending.current = null; }} aria-label="Fermer" className="absolute right-5 top-5 z-10 min-h-[44px] min-w-[44px] text-[20px] text-[#D6E0EC]">✕</button>
            <MemberGate company={company.name} siret={company.siret} onDone={done}
              intro="Pour retrouver vos annonces et vos recherches sur tous vos appareils, indiquez votre portable et votre e-mail. Pas de mot de passe, et la consultation reste libre." />
          </div>
        </div>)}
    </C.Provider>
  );
}
export const useMemberGate = () => useContext(C);
