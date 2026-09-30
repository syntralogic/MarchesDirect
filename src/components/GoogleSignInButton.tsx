import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

type GoogleId = {
  initialize: (cfg: { client_id: string; callback: (r: { credential?: string }) => void }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
};
const getGoogleId = (): GoogleId | undefined =>
  (window as unknown as { google?: { accounts?: { id?: GoogleId } } }).google?.accounts?.id;

function loadGsi(): Promise<void> {
  if (getGoogleId()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    const script = existing || document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('gsi')));
    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

interface Props {
  onSuccess: () => void;
  onMfa: (mfa: { token: string; userId: string }) => void;
  onError: (message: string) => void;
}

// "Continue with Google" - renders Google's official button; hidden entirely
// if VITE_GOOGLE_CLIENT_ID isn't configured so the forms keep working as-is.
export default function GoogleSignInButton({ onSuccess, onMfa, onError }: Props) {
  const { loginWithGoogle } = useAuth();
  const { lang } = useLang();
  const holder = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const cb = useRef({ onSuccess, onMfa, onError, loginWithGoogle });
  cb.current = { onSuccess, onMfa, onError, loginWithGoogle };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        const gid = getGoogleId();
        if (cancelled || !gid || !holder.current) return;
        gid.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (resp) => {
            if (!resp.credential) return cb.current.onError('Connexion Google annulée.');
            const result = await cb.current.loginWithGoogle(resp.credential);
            if (result.error) return cb.current.onError(result.error);
            if (result.mfaRequired && result.mfaToken && result.userId) {
              return cb.current.onMfa({ token: result.mfaToken, userId: result.userId });
            }
            cb.current.onSuccess();
          },
        });
        gid.renderButton(holder.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: holder.current.offsetWidth || 320,
          locale: lang === 'en' ? 'en' : 'fr',
        });
        setReady(true);
      })
      .catch(() => {
        // Script blocked (adblock/offline): leave the email form as the only option.
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="space-y-3">
      <div ref={holder} className="w-full flex justify-center min-h-[40px]" />
      {ready && (
        <div className="flex items-center gap-3 text-[10px] text-[#B9BBC8] uppercase tracking-wide">
          <span className="flex-1 h-px bg-[#17334D]" />
          {lang === 'en' ? 'or' : 'ou'}
          <span className="flex-1 h-px bg-[#17334D]" />
        </div>
      )}
    </div>
  );
}
