import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Lock, LogIn, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, tokenStorage } from '@/lib/apiClient';
import { useLang } from '@/contexts/LangContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { BTN, FIELD, LinkOutcome, NEXT_KEY, requestLink, useMagicLinkAvailable, useResendTimer, type LinkState } from '@/components/auth/MagicLinkShared';

// 4 Nov (mandat lien magique) : la connexion se fait par e-mail seul.
// Le visiteur saisit son adresse, reçoit un lien sécurisé (1 h, usage
// unique) et son compte est créé à l'ouverture du lien s'il n'en a pas.
// Règle absolue : on n'affiche « Lien envoyé » que si le serveur confirme
// un envoi réel (`sent: true`). Envoi en pause → message honnête, et le
// visiteur peut continuer sans compte (la recherche et le dossier n'en
// exigent aucun). Le mot de passe reste disponible, replié, pour les
// comptes qui en ont un (administration).

export default function LoginPage() {
  const { t } = useLang();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string; mfa?: { token: string; userId: string } } };
  const [params] = useSearchParams();
  const next = location.state?.from || params.get('next') || '';

  const [email, setEmail] = useState('');
  const [link, setLink] = useState<LinkState>({ kind: 'idle' });
  const resendLeft = useResendTimer(link.kind === 'sent');
  const linkAvailable = useMagicLinkAvailable();
  const shown: LinkState = link.kind === 'idle' && linkAvailable === false ? { kind: 'closed' } : link;

  const [withPassword, setWithPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mfa, setMfa] = useState<{ token: string; userId: string } | null>(location.state?.mfa ?? null);

  // Où revenir après le lien (même appareil) : la page protégée demandée,
  // ou la page d'où le visiteur vient.
  useEffect(() => {
    try { if (next) sessionStorage.setItem(NEXT_KEY, next); } catch { /* stockage indisponible */ }
  }, [next]);

  const done = () => navigate(next || '/tableau-de-bord', { replace: true });
  const continueWithout = () => navigate(next && !next.startsWith('/tableau-de-bord') && !next.startsWith('/profil') ? next : '/');

  const sendLink = async (e?: FormEvent) => {
    e?.preventDefault();
    const value = email.trim();
    if (!value) return;
    setLink({ kind: 'sending' });
    setLink(await requestLink(value));
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    if (result.mfaRequired && result.mfaToken && result.userId) { setMfa({ token: result.mfaToken, userId: result.userId }); return; }
    done();
  };

  return (
    <div className="page-fade-in mx-auto min-h-screen w-full max-w-[440px] px-4 py-8 md:py-14 text-white">
      <div className="mb-5">
        <span className="mb-1 block text-[12px] font-bold uppercase tracking-widest text-[#FB923C]">Mon espace</span>
        <h1 className="text-[24px] font-extrabold leading-tight md:text-[30px]">{linkAvailable === false ? 'Votre espace' : 'Recevez votre lien de connexion'}</h1>
        {linkAvailable !== false && <p className="mt-2 text-[15px] leading-snug text-[#D6E0EC]">Pas de mot de passe : indiquez votre e-mail, vous recevez un lien sécurisé valable 1 heure. Pas encore de compte ? Il est créé à l'ouverture du lien.</p>}
      </div>

      {mfa ? (
        <MfaStep mfaToken={mfa.token} onDone={done} />
      ) : (
        <div className="rounded-[20px] border-2 border-[#C2410C] bg-[#142B4A] p-4 shadow-[0_18px_40px_rgba(0,0,0,.35)] md:p-5">
          {!withPassword && (shown.kind === 'sent' || shown.kind === 'paused' || shown.kind === 'closed' || shown.kind === 'failed') ? (
            <>
            <LinkOutcome
              state={shown}
              resendLeft={resendLeft}
              onRetry={() => void sendLink()}
              onFix={() => setLink({ kind: 'idle' })}
              onContinue={continueWithout}
            />
            {shown.kind === 'closed' && (
              <button type="button" onClick={() => setWithPassword(true)} className="mt-3 w-full py-1 text-center text-[13px] font-semibold text-[#B4C1D3] underline underline-offset-4">
                J'ai un mot de passe
              </button>
            )}
            </>
          ) : !withPassword ? (
            <form onSubmit={sendLink} className="space-y-3">
              <label htmlFor="login-email" className="block text-[17px] font-extrabold">Votre e-mail</label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={FIELD}
                placeholder="vous@entreprise.fr"
              />
              <button type="submit" disabled={link.kind === 'sending'} className={BTN}>
                <Mail size={18} /> {link.kind === 'sending' ? 'Envoi en cours…' : 'Recevoir mon lien de connexion'}
              </button>
              <GoogleSignInButton onSuccess={done} onMfa={setMfa} onError={setError} />
              {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">{error}</div>}
              <button type="button" onClick={() => setWithPassword(true)} className="w-full py-1 text-center text-[13px] font-semibold text-[#B4C1D3] underline underline-offset-4">
                J'ai un mot de passe
              </button>
            </form>
          ) : (
            <form onSubmit={handlePassword} className="space-y-3">
              {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">{error}</div>}
              <label htmlFor="pw-email" className="block text-[17px] font-extrabold">Votre e-mail</label>
              <input id="pw-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={FIELD} placeholder="vous@entreprise.fr" />
              <label htmlFor="pw-pass" className="block text-[17px] font-extrabold">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A97A8]" />
                <input id="pw-pass" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className={FIELD + ' pl-9'} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={submitting} className={BTN}>
                <LogIn size={18} /> {submitting ? (t('loginConnecting') || 'Connexion…') : 'Me connecter'}
              </button>
              {linkAvailable !== false && (
              <button type="button" onClick={() => setWithPassword(false)} className="w-full py-1 text-center text-[13px] font-semibold text-[#B4C1D3] underline underline-offset-4">
                Recevoir plutôt un lien par e-mail
              </button>
              )}
            </form>
          )}
        </div>
      )}

      <p className="mt-5 text-center text-[14px] leading-snug text-[#B4C1D3]">
        Aucun compte n'est nécessaire pour chercher vos marchés. <Link to="/" className="font-bold text-[#FB923C] underline underline-offset-4">Retour à l'accueil</Link>
      </p>
    </div>
  );
}

function MfaStep({ mfaToken, onDone }: { mfaToken: string; onDone: () => void }) {
  const { t } = useLang();
  const { refreshProfile } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // mfaToken is the signed challenge from the first step; the server
      // derives the user from it, so userId isn't sent.
      const { data } = await apiClient.post('/auth/mfa/verify-login', { mfaToken, code: code.trim() });
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      // AuthContext only loads the profile on mount: without this the
      // protected route we navigate to would bounce straight back here.
      await refreshProfile();
      onDone();
    } catch {
      setError(t('loginMfaInvalid') || 'Code invalide.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-3 rounded-[20px] border-2 border-[#C2410C] bg-[#142B4A] p-4 md:p-5">
      <p className="text-[15px] text-[#D6E0EC]">{t('loginMfaTitle') || 'Saisissez le code de votre application d’authentification.'}</p>
      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">{error}</div>}
      <input
        type="text"
        required
        value={code}
        onChange={e => setCode(e.target.value)}
        className={FIELD + ' text-center tracking-[0.3em]'}
        placeholder="000000"
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
      />
      <button type="submit" disabled={submitting} className={BTN}>
        {submitting ? (t('loginVerifying') || 'Vérification…') : (t('loginMfaVerify') || 'Valider')}
      </button>
    </form>
  );
}
