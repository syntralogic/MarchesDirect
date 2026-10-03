import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, tokenStorage } from '@/lib/apiClient';
import { useLang } from '@/contexts/LangContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function LoginPage() {
  const { t } = useLang();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mfa, setMfa] = useState<{ token: string; userId: string } | null>(null);
  // PAR-03 / DEV-07: no recovery entry existed on this page at all. The
  // actual auth system now supports passwordless accounts (6 Sep brief -
  // password_hash can be NULL), so "forgot password" is a magic-link email
  // rather than a reset form - the one recovery path that works for every
  // account regardless of whether it has a password set.
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.mfaRequired && result.mfaToken && result.userId) {
      setMfa({ token: result.mfaToken, userId: result.userId });
      return;
    }
    navigate(location.state?.from || '/tableau-de-bord', { replace: true });
  };

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotSubmitting(true);
    try {
      await apiClient.post('/auth/magic-link', { email: forgotEmail, purpose: 'login' });
    } catch {
      // Backend never reveals whether the email exists (see requestMagicLink's
      // comment); show the same confirmation either way so the UI doesn't leak it.
    } finally {
      setForgotSubmitting(false);
      setForgotSent(true);
    }
  };

  if (forgotMode) {
    return (
      <div className="page-fade-in max-w-sm mx-auto px-4 py-10 md:py-16 min-h-screen">
        <div className="mb-6">
          <span className="text-[10px] font-bold text-orange uppercase tracking-widest mb-1 block">{t('loginEyebrow') || 'Connexion'}</span>
          <h1 className="text-xl md:text-2xl font-extrabold text-white mb-2">{t('loginForgotTitle') || 'Mot de passe oublié'}</h1>
          <p className="text-[#B9BBC8] text-xs leading-snug">
            {t('loginForgotSub') || 'Recevez un lien de connexion par e-mail, valable 1 heure.'}
          </p>
        </div>
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 space-y-4">
          {forgotSent ? (
            <>
              <div className="text-[11px] text-[#B9BBC8] bg-white/5 border border-[#17334D] rounded-lg px-3 py-2">
                {t('loginForgotSent') || "Si un compte existe pour cette adresse, un lien de connexion vient d'être envoyé."}
              </div>
              <button
                type="button"
                onClick={() => { setForgotMode(false); setForgotSent(false); }}
                className="w-full text-center text-orange font-semibold text-xs hover:underline py-1"
              >
                {t('loginForgotBack') || 'Retour à la connexion'}
              </button>
            </>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('loginEmail')}</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
                    placeholder="vous@entreprise.fr"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={forgotSubmitting}
                className="w-full bg-orange text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
              >
                {forgotSubmitting ? t('loginConnecting') : (t('loginForgotSend') || 'Recevoir un lien de connexion')}
              </button>
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-center text-[#B9BBC8] text-xs hover:underline py-1"
              >
                {t('loginForgotBack') || 'Retour à la connexion'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade-in max-w-sm mx-auto px-4 py-10 md:py-16 min-h-screen">
      <div className="mb-6">
        <span className="text-[10px] font-bold text-orange uppercase tracking-widest mb-1 block">{t('loginEyebrow') || 'Connexion'}</span>
        <h1 className="text-xl md:text-2xl font-extrabold text-white mb-2">{t('loginTitle')}</h1>
        <p className="text-[#B9BBC8] text-xs leading-snug">{t('loginSub')}</p>
      </div>

      {mfa ? (
        <MfaStep mfaToken={mfa.token} onDone={() => navigate(location.state?.from || '/tableau-de-bord', { replace: true })} />
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 space-y-4">
          {error && (
            <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
          )}
          <GoogleSignInButton
            onSuccess={() => navigate(location.state?.from || '/tableau-de-bord', { replace: true })}
            onMfa={setMfa}
            onError={setError}
          />
          <div>
            <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('loginEmail')}</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
                placeholder="vous@entreprise.fr"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('loginPassword')}</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
                placeholder="********"
              />
            </div>
            <button
              type="button"
              onClick={() => setForgotMode(true)}
              className="text-orange text-[11px] font-semibold hover:underline mt-1.5"
            >
              {t('loginForgot') || 'Mot de passe oublié ?'}
            </button>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-orange text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
          >
            <LogIn size={14} /> {submitting ? t('loginConnecting') : t('loginButton')}
          </button>
        </form>
      )}

      <p className="text-[11px] text-[#B9BBC8] text-center mt-5">
        {t('loginNoAccount')} <Link to="/inscription" state={location.state} className="text-orange font-semibold hover:underline">{t('loginCreateAccount')}</Link>
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
      // mfaToken is the signed challenge from /auth/login (proves the password
      // step); the server derives the user from it, so userId isn't sent.
      const { data } = await apiClient.post('/auth/mfa/verify-login', { mfaToken, code: code.trim() });
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      // Without this the AuthContext still has no user (it only loads the
      // profile on mount), so the protected route we navigate to would bounce
      // straight back to /connexion.
      await refreshProfile();
      onDone();
    } catch {
      setError(t('loginMfaInvalid') || 'Code invalide.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 space-y-4">
      <p className="text-xs text-[#B9BBC8]">{t('loginMfaTitle')}</p>
      {error && <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}
      <input
        type="text"
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white text-center tracking-[0.3em] focus:outline-none focus:border-orange"
        placeholder="000000"
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
      />
      <button type="submit" disabled={submitting} className="w-full bg-orange text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50">
        {submitting ? t('loginVerifying') : t('loginMfaVerify')}
      </button>
    </form>
  );
}