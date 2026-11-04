import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, Mail } from 'lucide-react';
import { apiClient, tokenStorage, getApiErrorMessage } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { BTN, LinkOutcome, NEXT_KEY, requestLink, useResendTimer, type LinkState } from '@/components/auth/MagicLinkShared';

// Page d'atterrissage du lien envoyé par POST /api/auth/magic-link
// (`${APP_URL}/connexion/lien?token=...&email=...`). Le jeton est échangé
// contre une session ; un compte est créé côté serveur si l'adresse était
// inconnue. Lien expiré ou déjà utilisé : message précis et nouveau lien
// en un geste, sans ressaisir l'adresse. Après connexion, retour à la page
// demandée avant la connexion (même appareil), sinon le tableau de bord.

type Code = 'invalid' | 'expired' | 'used' | 'unavailable' | undefined;

const TITLE: Record<Exclude<Code, undefined>, string> = {
  invalid: 'Ce lien de connexion est invalide',
  expired: 'Ce lien a expiré',
  used: 'Ce lien a déjà été utilisé',
  unavailable: 'Connexion impossible pour le moment',
};
const HINT: Record<Exclude<Code, undefined>, string> = {
  invalid: 'Il est peut-être incomplet (copié à la main) ou ne correspond plus à cette adresse.',
  expired: 'Un lien est valable 1 heure. Demandez-en un nouveau : il arrive en quelques secondes.',
  used: 'Un lien ne sert qu’une fois. Si vous l’avez ouvert sur un autre appareil, vous y êtes déjà connecté. Sinon, demandez-en un nouveau.',
  unavailable: 'Le service redémarre ou ne répond pas. Votre lien reste valable : réessayez dans quelques secondes.',
};

export default function MagicLinkPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
  const [code, setCode] = useState<Code>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<LinkState>({ kind: 'idle' });
  const resendLeft = useResendTimer(link.kind === 'sent');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-invoke would burn the one-time token
    ran.current = true;

    const token = params.get('token');
    if (!token || !email) {
      setStatus('error');
      setCode('invalid');
      setError('Ce lien de connexion est incomplet.');
      return;
    }

    (async () => {
      try {
        const { data } = await apiClient.post('/auth/magic-link/verify', { token, email });
        if (data.mfaRequired) {
          // Le lien prouve l'adresse, pas le second facteur : retour à la
          // connexion où le code est demandé.
          navigate('/connexion', { replace: true, state: { mfa: { token: data.mfaToken, userId: data.userId } } });
          return;
        }
        tokenStorage.setTokens(data.accessToken, data.refreshToken);
        // AuthContext only loads the profile on mount: without this the
        // protected route we navigate to would bounce straight back to /connexion.
        await refreshProfile();
        let next = '';
        try { next = sessionStorage.getItem(NEXT_KEY) || ''; sessionStorage.removeItem(NEXT_KEY); } catch { /* stockage indisponible */ }
        navigate(next && next.startsWith('/') ? next : '/tableau-de-bord', { replace: true });
      } catch (err) {
        const resp = (err as { response?: { status?: number; data?: { code?: Code } } })?.response;
        const c = resp?.data?.code;
        setStatus('error');
        // 503 (service en redémarrage) ou pas de réponse : le lien n'a pas
        // été consommé, on propose de réessayer plutôt que de le déclarer invalide.
        setCode(!resp || (resp.status && resp.status >= 500) ? 'unavailable' : c && c in TITLE ? c : 'invalid');
        setError(getApiErrorMessage(err, 'Ce lien de connexion est invalide ou a expiré.'));
      }
    })();
  }, [params, email, navigate, refreshProfile]);

  const resend = async () => {
    if (!email) return;
    setLink({ kind: 'sending' });
    setLink(await requestLink(email));
  };

  if (status === 'verifying') {
    return (
      <div className="page-fade-in mx-auto flex min-h-screen w-full max-w-[440px] flex-col items-center px-4 py-16 text-center text-white">
        <Loader2 size={32} className="mb-4 animate-spin text-[#FB923C]" />
        <p className="text-[17px] font-bold">Connexion en cours…</p>
        <p className="mt-1 text-[14px] text-[#B4C1D3]">Un instant, nous ouvrons votre espace.</p>
      </div>
    );
  }

  const c = code || 'invalid';
  return (
    <div className="page-fade-in mx-auto min-h-screen w-full max-w-[440px] px-4 py-8 text-white md:py-14">
      <div className="mb-5">
        <span className="mb-1 block text-[12px] font-bold uppercase tracking-widest text-[#FB923C]">Mon espace</span>
        <h1 className="flex items-start gap-2 text-[24px] font-extrabold leading-tight md:text-[30px]"><AlertCircle size={26} className="mt-1 shrink-0 text-[#FB923C]" />{TITLE[c]}</h1>
        <p className="mt-2 text-[15px] leading-snug text-[#D6E0EC]">{HINT[c]}</p>
        {error && c === 'invalid' && !/invalide/i.test(error) && <p className="mt-1 text-[13px] text-[#8A97A8]">{error}</p>}
      </div>

      <div className="rounded-[20px] border-2 border-[#C2410C] bg-[#142B4A] p-4 shadow-[0_18px_40px_rgba(0,0,0,.35)] md:p-5">
        {c === 'unavailable' ? (
          <button type="button" onClick={() => window.location.reload()} className={BTN}>Réessayer maintenant</button>
        ) : link.kind === 'sent' || link.kind === 'paused' || link.kind === 'failed' ? (
          <LinkOutcome state={link} resendLeft={resendLeft} onRetry={() => void resend()} onContinue={() => navigate('/')} />
        ) : email ? (
          <div className="space-y-3">
            <p className="text-[15px] text-[#D6E0EC]">Nouveau lien pour <span className="font-bold text-white">{email}</span></p>
            <button type="button" onClick={() => void resend()} disabled={link.kind === 'sending'} className={BTN}>
              <Mail size={18} /> {link.kind === 'sending' ? 'Envoi en cours…' : 'Recevoir un nouveau lien'}
            </button>
            <Link to="/connexion" className="block w-full py-1 text-center text-[14px] font-bold text-[#FB923C] underline underline-offset-4">Utiliser une autre adresse</Link>
          </div>
        ) : (
          <Link to="/connexion" className={BTN}>Demander un lien de connexion</Link>
        )}
      </div>

      <p className="mt-5 text-center text-[14px] leading-snug text-[#B4C1D3]">
        Aucun compte n'est nécessaire pour chercher vos marchés. <Link to="/" className="font-bold text-[#FB923C] underline underline-offset-4">Retour à l'accueil</Link>
      </p>
    </div>
  );
}
