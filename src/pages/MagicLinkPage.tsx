import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiClient, tokenStorage, getApiErrorMessage } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';

// Landing page for the link sent by POST /api/auth/magic-link (see
// requestMagicLink in authService.ts, which points here:
// `${APP_URL}/connexion/lien?token=...&email=...`). Until this page existed,
// every magic-link / "recovery" email sent a real user to a 404 - this is
// the other half of DEV-07 (no account-recovery path actually worked).
export default function MagicLinkPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-invoke would burn the one-time token
    ran.current = true;

    const token = params.get('token');
    const email = params.get('email');
    if (!token || !email) {
      setStatus('error');
      setError(t('magicLinkMissing') || "Ce lien de connexion est incomplet.");
      return;
    }

    (async () => {
      try {
        const { data } = await apiClient.post('/auth/magic-link/verify', { token, email });
        tokenStorage.setTokens(data.accessToken, data.refreshToken);
        // Same reason LoginPage's MfaStep does this: AuthContext only loads
        // the profile on mount, so without it the next protected route would
        // bounce straight back to /connexion despite the tokens being valid.
        await refreshProfile();
        navigate('/tableau-de-bord', { replace: true });
      } catch (err) {
        setStatus('error');
        setError(getApiErrorMessage(err, t('magicLinkInvalid') || 'Ce lien de connexion est invalide ou a expiré.'));
      }
    })();
  }, [params, navigate, refreshProfile, t]);

  return (
    <div className="page-fade-in max-w-sm mx-auto px-4 py-16 min-h-screen flex flex-col items-center text-center">
      {status === 'verifying' ? (
        <>
          <Loader2 size={28} className="animate-spin text-orange mb-4" />
          <p className="text-sm text-[#B9BBC8]">{t('magicLinkVerifying') || 'Connexion en cours...'}</p>
        </>
      ) : (
        <>
          <AlertCircle size={28} className="text-red-400 mb-4" />
          <p className="text-sm text-white font-semibold mb-1">{error}</p>
          <p className="text-xs text-[#B9BBC8] mb-6">
            {t('magicLinkRetryHint') || 'Demandez un nouveau lien depuis la page de connexion.'}
          </p>
          <Link to="/connexion" className="text-orange font-semibold text-xs hover:underline">
            {t('magicLinkBackToLogin') || 'Retour à la connexion'}
          </Link>
        </>
      )}
    </div>
  );
}
