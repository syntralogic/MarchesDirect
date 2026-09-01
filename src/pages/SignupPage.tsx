import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';

export default function SignupPage() {
  const { t } = useLang();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: '', firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError(t('signupError') || 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setSubmitting(true);
    const result = await register(form);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    navigate('/tableau-de-bord', { replace: true });
  };

  return (
    <div className="page-fade-in max-w-sm mx-auto px-4 py-10 md:py-16 min-h-screen">
      <div className="mb-6">
        <span className="text-[10px] font-bold text-orange uppercase tracking-widest mb-1 block">{t('signupEyebrow') || 'Inscription'}</span>
        <h1 className="text-xl md:text-2xl font-extrabold text-white mb-2">{t('signupTitle')}</h1>
        <p className="text-[#B9BBC8] text-xs leading-snug">{t('signupSub')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 space-y-4">
        {error && (
          <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        <div>
          <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('signupCompanyName')}</label>
          <div className="relative">
            <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <input
              required
              value={form.companyName}
              onChange={update('companyName')}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
              placeholder="BatiRhone SAS"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('signupFirstName')}</label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
              <input
                required
                value={form.firstName}
                onChange={update('firstName')}
                className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
                placeholder="Julien"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('signupLastName')}</label>
            <input
              required
              value={form.lastName}
              onChange={update('lastName')}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
              placeholder="Martin"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('signupEmail')}</label>
          <div className="relative">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
              placeholder="vous@entreprise.fr"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('signupPassword')}</label>
          <div className="relative">
            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
              className="w-full bg-[#031B30] border border-[#17334D] rounded-lg pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
              placeholder={t('signupPasswordMin')}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-orange text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50"
        >
          <UserPlus size={14} /> {submitting ? t('signupCreating') : t('signupButton')}
        </button>
      </form>

      <p className="text-[11px] text-[#B9BBC8] text-center mt-5">
        {t('signupHaveAccount')} <Link to="/connexion" className="text-orange font-semibold hover:underline">{t('signupLogin')}</Link>
      </p>
    </div>
  );
}