import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { ELENA } from '@/data/homeContent';

// Éléments partagés par la page de connexion et la page d'atterrissage du
// lien magique. Règle : « Lien envoyé » uniquement si le serveur confirme
// un envoi réel (`sent: true`).

export const NEXT_KEY = 'md_login_next';
const RESEND_DELAY_S = 60;

export type LinkState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; email: string }
  | { kind: 'paused' }
  | { kind: 'closed' }
  | { kind: 'failed'; message: string };

export const FIELD = 'h-[54px] w-full rounded-xl border-2 border-[#C9D6E8] bg-white px-3.5 text-[16px] text-[#0A1628] placeholder:text-[#8A97A8] focus:border-[#F97316] focus:outline-none';
export const BTN = 'flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-4 text-[17px] font-extrabold text-white shadow-[0_6px_18px_rgba(249,115,22,.35)] active:translate-y-px disabled:opacity-60';
const GHOST = 'flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-[#2A4A74] px-4 text-[15px] font-bold text-white';

/** Demande d'un lien au serveur. Ne dit « envoyé » que si c'est vrai. */
export async function requestLink(email: string): Promise<LinkState> {
  try {
    const { data } = await apiClient.post<{ success: boolean; sent?: boolean; reason?: string }>('/auth/magic-link', { email });
    if (data?.sent === true) return { kind: 'sent', email };
    if (data?.reason === 'delivery_failed') return { kind: 'failed', message: "L'envoi a échoué chez notre fournisseur d'e-mails. Réessayez dans quelques minutes." };
    return { kind: 'paused' };
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 429) return { kind: 'failed', message: 'Trop de demandes pour cette adresse. Réessayez dans 15 minutes.' };
    if (status === 400) return { kind: 'failed', message: 'Cette adresse e-mail ne semble pas valide. Vérifiez-la.' };
    return { kind: 'failed', message: "L'envoi a échoué. Vérifiez votre connexion et réessayez." };
  }
}

// 5 nov. (contrôle client) : on vérifie AVANT d'afficher le formulaire que
// l'envoi d'e-mails est réellement configuré, pour ne jamais proposer un
// formulaire qui n'aboutit pas. En cas d'erreur réseau on laisse le
// formulaire : la réponse de POST /auth/magic-link reste la seule vérité.
let availabilityCache: Promise<boolean> | null = null;
export function useMagicLinkAvailable(): boolean | null {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    const pending: Promise<boolean> = availabilityCache ?? apiClient.get<{ available?: boolean }>('/auth/magic-link/status')
      .then(r => r.data?.available !== false)
      .catch(() => { availabilityCache = null; return true; });
    availabilityCache = pending;
    let alive = true;
    pending.then(x => { if (alive) setV(x); });
    return () => { alive = false; };
  }, []);
  return v;
}

export function useResendTimer(active: boolean) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!active) { setLeft(0); return; }
    setLeft(RESEND_DELAY_S);
    const id = window.setInterval(() => setLeft(v => (v <= 1 ? 0 : v - 1)), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return left;
}

/** Bloc partagé avec la page d'atterrissage du lien : résultat d'une demande. */
export function LinkOutcome({ state, onRetry, onFix, onContinue, resendLeft }: {
  state: LinkState; onRetry: () => void; onFix?: () => void; onContinue: () => void; resendLeft: number;
}) {
  if (state.kind === 'sent') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border-2 border-[#16A34A] bg-[#0F2A1C] px-4 py-3">
          <p className="text-[17px] font-extrabold text-white">Lien envoyé à {state.email}</p>
          <p className="mt-1 text-[14px] leading-snug text-[#D6E0EC]">Ouvrez l'e-mail sur cet appareil et touchez le lien : vous arrivez directement dans votre espace. Il est valable 1 heure. Pensez aux courriers indésirables.</p>
        </div>
        <button type="button" onClick={onRetry} disabled={resendLeft > 0} className={GHOST + ' disabled:opacity-50'}>
          {resendLeft > 0 ? `Renvoyer le lien (${resendLeft} s)` : 'Renvoyer le lien'}
        </button>
        {onFix && <button type="button" onClick={onFix} className="w-full py-1 text-center text-[14px] font-bold text-[#FB923C] underline underline-offset-4">Corriger l'adresse</button>}
      </div>
    );
  }
  if (state.kind === 'paused') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border-2 border-[#F59E0B] bg-[#2A2012] px-4 py-3">
          <p className="text-[17px] font-extrabold text-white">Nous n'avons pas pu envoyer le lien</p>
          <p className="mt-1 text-[14px] leading-snug text-[#D6E0EC]">L'envoi d'e-mails est en pause pour le moment : aucun message n'est parti. Vous pouvez continuer sans compte, la recherche et votre dossier restent accessibles.</p>
        </div>
        <button type="button" onClick={onContinue} className={BTN}>Continuer sans compte</button>
        <Link to="/question" className={GHOST}>Poser ma question à {ELENA.name.split(' ')[0]}</Link>
      </div>
    );
  }
  if (state.kind === 'closed') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border-2 border-[#F59E0B] bg-[#2A2012] px-4 py-3">
          <p className="text-[17px] font-extrabold text-white">La connexion par e-mail ouvre très bientôt</p>
          <p className="mt-1 text-[14px] leading-snug text-[#D6E0EC]">Vous n'en avez pas besoin pour avancer : la recherche de marchés, l'analyse et votre dossier prérempli sont accessibles sans compte.</p>
        </div>
        <button type="button" onClick={onContinue} className={BTN}>Continuer sans compte</button>
        <Link to="/question" className={GHOST}>Poser ma question à {ELENA.name.split(' ')[0]}</Link>
      </div>
    );
  }
  if (state.kind === 'failed') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border-2 border-[#DC2626] bg-[#2A1212] px-4 py-3 text-[15px] font-bold text-white">{state.message}</div>
        <button type="button" onClick={onRetry} className={GHOST}>Réessayer</button>
        {onFix && <button type="button" onClick={onFix} className="w-full py-1 text-center text-[14px] font-bold text-[#FB923C] underline underline-offset-4">Corriger l'adresse</button>}
      </div>
    );
  }
  return null;
}

