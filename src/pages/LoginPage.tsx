import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient, tokenStorage } from '@/lib/apiClient';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mfa, setMfa] = useState<{ token: string; userId: string } | null>(null);

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

  return (
    <div className="page-fade-in max-w-sm mx-auto px-4 py-10 md:py-16 min-h-screen">
      <div className="mb-6">
        <span className="text-[10px] font-bold text-orange uppercase tracking-widest mb-1 block">Connexion</span>
        <h1 className="text-xl md:text-2xl font-extrabold text-white mb-2">Accedez a votre espace.</h1>
        <p className="text-[#B9BBC8] text-xs leading-snug">Retrouvez vos opportunites et le suivi de vos dossiers.</p>
      </div>

      {mfa ? (
        <MfaStep mfaToken={mfa.token} userId={mfa.userId} onDone={() => navigate('/tableau-de-bord', { replace: true })} />
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 space-y-4">
          {error && (
            <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
          )}
          <div>
            <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Email</label>
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
            <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Mot de passe</label>
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
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-orange text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
          >
            <LogIn size={14} /> {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      )}

      <p className="text-[11px] text-[#B9BBC8] text-center mt-5">
        Pas encore de compte ? <Link to="/inscription" className="text-orange font-semibold hover:underline">Creer un compte</Link>
      </p>
    </div>
  );
}

function MfaStep({ mfaToken, userId, onDone }: { mfaToken: string; userId: string; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await apiClient.post('/auth/mfa/verify-login', { userId, mfaToken: code });
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      onDone();
    } catch {
      setError('Code invalide.');
    } finally {
      setSubmitting(false);
    }
  };

  // mfaToken is only used to identify the pending session server-side via userId; kept for clarity.
  void mfaToken;

  return (
    <form onSubmit={handleVerify} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 space-y-4">
      <p className="text-xs text-[#B9BBC8]">Entrez le code de verification a deux facteurs.</p>
      {error && <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}
      <input
        type="text"
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white text-center tracking-[0.3em] focus:outline-none focus:border-orange"
        placeholder="000000"
        maxLength={6}
      />
      <button type="submit" disabled={submitting} className="w-full bg-orange text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50">
        {submitting ? 'Verification...' : 'Verifier'}
      </button>
    </form>
  );
}
