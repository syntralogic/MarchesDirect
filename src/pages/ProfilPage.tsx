import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Building2, Settings, Bell, Shield, Smartphone, Save, LogOut, Loader2, Info, FolderOpen, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { companiesApi, subscriptionsApi, accountApi, uploadsApi, getApiErrorMessage, type ApiCompany } from '@/lib/apiClient';
import { toast } from 'sonner';

const SECTIONS = [
  { key: 'profil', icon: User, labelKey: 'profileMyProfile' },
  { key: 'entreprise', icon: Building2, labelKey: 'profileMyCompany' },
  { key: 'preferences', icon: Settings, labelKey: 'profilePreferences' },
  { key: 'notifications', icon: Bell, labelKey: 'profileNotifications' },
  { key: 'securite', icon: Shield, labelKey: 'profileSecurity' },
  { key: 'application', icon: Smartphone, labelKey: 'profileApplication' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{ width: '44px', height: '24px', flex: '0 0 44px' }}
      className={`relative rounded-full transition-colors ${checked ? 'bg-orange' : 'bg-[#17334D]'}`}
    >
      <span
        style={{ width: '16px', height: '16px', transform: checked ? 'translateX(24px)' : 'translateX(4px)' }}
        className="absolute top-1 left-0 bg-white rounded-full shadow transition-transform"
      />
    </button>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', disabled = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function NotWiredNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-orange/5 border border-orange/20 rounded-xl text-xs text-brand-muted">
      <Info size={14} className="text-orange shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export default function ProfilPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { user, company, loading: authLoading, logout, refreshProfile } = useAuth();
  const { lang, setLang } = useLang();
  const [activeSection, setActiveSection] = useState('profil');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [companyForm, setCompanyForm] = useState<Partial<ApiCompany>>({});
  useEffect(() => {
    if (company) setCompanyForm(company as ApiCompany);
  }, [company]);

  const [matchThreshold, setMatchThreshold] = useState('60');

  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(t('profileAvatarFormatError') || 'Formats acceptés : JPG, PNG, WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profileAvatarSizeError') || 'Image trop volumineuse (5 Mo maximum).');
      return;
    }

    setAvatarUploading(true);
    try {
      await uploadsApi.uploadAvatar(file);
      await refreshProfile();
      toast.success(t('profileAvatarUpdated') || 'Photo de profil mise à jour.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profileAvatarUploadFailed') || "Échec de l'envoi de la photo."));
    } finally {
      setAvatarUploading(false);
    }
  };

  const [notifPrefs, setNotifPrefs] = useState({
    emailAlerts: true, newOpps: true, deadlineAlerts: true, weeklyDigest: false, mobileNotifs: true,
  });
  useEffect(() => {
    if (user?.notificationPreferences) setNotifPrefs(user.notificationPreferences);
  }, [user]);

  const toggleNotifPref = async (key: keyof typeof notifPrefs) => {
    const previous = notifPrefs;
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    try {
      await accountApi.updateNotificationPreferences({ [key]: next[key] });
    } catch (err) {
      setNotifPrefs(previous);
      toast.error(getApiErrorMessage(err, t('profileNotifSaveError') || "Impossible d'enregistrer cette préférence."));
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<{ qrCode: string; manualEntryKey: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);

  const [subscription, setSubscription] = useState<any>(undefined);
  const [cancelling, setCancelling] = useState(false);
  useEffect(() => {
    if (activeSection !== 'application' || subscription !== undefined) return;
    subscriptionsApi.me()
      .then(data => setSubscription(data.subscription ?? { status: data.status }))
      .catch(() => setSubscription(null));
  }, [activeSection, subscription]);

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await companiesApi.updateMe({
        name: companyForm.name,
        siret: companyForm.siret,
        legal_form: companyForm.legal_form,
        website_url: companyForm.website_url,
        address_street: companyForm.address_street,
        address_city: companyForm.address_city,
        address_postal_code: companyForm.address_postal_code,
        industry_sector: companyForm.industry_sector,
        working_radius_km: companyForm.working_radius_km,
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profileSaveError') || "Échec de l'enregistrement."));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error(t('profilePasswordMismatch') || 'Les mots de passe ne correspondent pas.');
      return;
    }
    setChangingPassword(true);
    try {
      await accountApi.changePassword(newPassword);
      toast.success(t('profilePasswordChanged') || 'Mot de passe modifié. Reconnectez-vous.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      logout();
      navigate('/connexion');
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profilePasswordChangeFailed') || 'Échec du changement de mot de passe.'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleStartMfa = async () => {
    setMfaBusy(true);
    try {
      const result = await accountApi.mfaEnable();
      setMfaSetup(result);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profileMfaSetupFailed') || 'Échec de la configuration 2FA.'));
    } finally {
      setMfaBusy(false);
    }
  };

  const handleConfirmMfa = async () => {
    if (!mfaCode.trim()) return;
    setMfaBusy(true);
    try {
      await accountApi.mfaConfirm(mfaCode.trim());
      await refreshProfile();
      setMfaSetup(null);
      setMfaCode('');
      toast.success(t('profileMfaEnabled') || 'Authentification à deux facteurs activée.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profileMfaInvalidCode') || 'Code invalide.'));
    } finally {
      setMfaBusy(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm(t('profileCancelConfirm') || 'Résilier votre abonnement à la fin de la période en cours ?')) return;
    setCancelling(true);
    try {
      await subscriptionsApi.cancel();
      toast.success(t('profileCancelSuccess') || 'Résiliation programmée en fin de période.');
      setSubscription(undefined);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profileCancelFailed') || 'Échec de la résiliation.'));
    } finally {
      setCancelling(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/connexion');
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-orange" />
      </div>
    );
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  const initials = (user.firstName?.[0] || user.email[0]).toUpperCase() + (user.lastName?.[0] || '').toUpperCase();
  const planLabel = company?.subscription_tier
    ? String(company.subscription_tier).charAt(0).toUpperCase() + String(company.subscription_tier).slice(1)
    : t('profileTrial') || 'Essai';

  const renderContent = () => {
    switch (activeSection) {
      case 'profil':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-5">{t('profileMyProfile')}</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16 shrink-0">
                <div className="w-16 h-16 rounded-full bg-orange/20 border-2 border-orange flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-orange">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange flex items-center justify-center border-2 border-[#061426] disabled:opacity-60"
                  aria-label={t('profileChangeAvatar')}
                >
                  {avatarUploading ? <Loader2 size={12} className="animate-spin text-white" /> : <Camera size={12} className="text-white" />}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{fullName}</p>
                <p className="text-xs text-[#B9BBC8]">{t('profilePlan')} {planLabel}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label={t('profileFullName')} value={fullName} onChange={() => {}} disabled />
              <InputField label={t('profileEmail')} value={user.email} onChange={() => {}} type="email" disabled />
              <InputField label={t('profilePhone')} value={companyForm.phone as string || ''} onChange={v => setCompanyForm(f => ({ ...f, phone: v }))} type="tel" />
            </div>
            <NotWiredNote>{t('profileNotWired')}</NotWiredNote>
          </div>
        );
      case 'entreprise':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-5">{t('profileMyCompany')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label={t('profileCompanyName')} value={companyForm.name || ''} onChange={v => setCompanyForm(f => ({ ...f, name: v }))} />
              <InputField label={t('profileSiret')} value={companyForm.siret || ''} onChange={v => setCompanyForm(f => ({ ...f, siret: v }))} />
              <InputField label={t('profileAddress')} value={companyForm.address_street || ''} onChange={v => setCompanyForm(f => ({ ...f, address_street: v }))} />
              <InputField label={t('profileCity')} value={companyForm.address_city || ''} onChange={v => setCompanyForm(f => ({ ...f, address_city: v }))} />
              <InputField label={t('profilePostalCode')} value={companyForm.address_postal_code || ''} onChange={v => setCompanyForm(f => ({ ...f, address_postal_code: v }))} />
              <InputField label={t('profileWebsite')} value={companyForm.website_url || ''} onChange={v => setCompanyForm(f => ({ ...f, website_url: v }))} />
              <div>
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('profileIndustry')}</label>
                <select
                  value={companyForm.industry_sector || ''}
                  onChange={e => setCompanyForm(f => ({ ...f, industry_sector: e.target.value }))}
                  className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none"
                >
                  <option value="">—</option>
                  {['Travaux & construction', 'Énergie & environnement', 'Industrie & maintenance', 'Informatique & télécoms', 'Transport & logistique', 'Services aux entreprises'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <Link
              to="/profil/dossier-entreprise"
              className="flex items-center justify-between gap-3 bg-[#061D32] border border-[#17334D] rounded-xl p-4 hover:border-orange/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange/10 flex items-center justify-center shrink-0">
                  <FolderOpen size={16} className="text-orange" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t('profileCompanyFile')}</p>
                  <p className="text-xs text-[#B9BBC8]">{t('profileCompanyFileSub')}</p>
                </div>
              </div>
            </Link>
          </div>
        );
      case 'preferences':
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white mb-5">{t('profilePreferences')}</h2>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('profileLanguage')}</label>
              <select value={lang} onChange={e => setLang(e.target.value as 'fr' | 'en')} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('profileSearchRadius')}</label>
              <input type="number" value={companyForm.working_radius_km ?? ''} onChange={e => setCompanyForm(f => ({ ...f, working_radius_km: e.target.value ? Number(e.target.value) : null }))} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('profileMatchThreshold')}</label>
              <input type="number" min="0" max="100" disabled value={matchThreshold} onChange={e => setMatchThreshold(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange disabled:opacity-50" />
            </div>
            <NotWiredNote>{t('profileNotWiredMatch')}</NotWiredNote>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4 pb-20 md:pb-0">
            <h2 className="text-lg font-bold text-white mb-5">{t('profileNotificationsTitle')}</h2>
            <NotWiredNote>{t('profileNotWiredNotifications')}</NotWiredNote>
            {[
              { key: 'emailAlerts', labelKey: 'profileEmailAlerts', subKey: 'profileEmailAlertsSub' },
              { key: 'newOpps', labelKey: 'profileNewOpps', subKey: 'profileNewOppsSub' },
              { key: 'deadlineAlerts', labelKey: 'profileDeadlineAlerts', subKey: 'profileDeadlineAlertsSub' },
              { key: 'weeklyDigest', labelKey: 'profileWeeklyDigest', subKey: 'profileWeeklyDigestSub' },
              { key: 'mobileNotifs', labelKey: 'profileMobileNotifs', subKey: 'profileMobileNotifsSub' },
            ].map(item => (
              <div key={item.key} className="grid grid-cols-[1fr_auto] items-center gap-3 p-4 bg-[#061D32] border border-[#17334D] rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{t(item.labelKey)}</p>
                  <p className="text-xs text-[#B9BBC8] mt-0.5">{t(item.subKey)}</p>
                </div>
                <Toggle
                  checked={notifPrefs[item.key as keyof typeof notifPrefs]}
                  onChange={() => toggleNotifPref(item.key as keyof typeof notifPrefs)}
                />
              </div>
            ))}
          </div>
        );
      case 'securite':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-5">{t('profileSecurity')}</h2>
            <div className="grid grid-cols-1 gap-4">
              <InputField label={t('profileCurrentPassword')} value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="••••••••" />
              <InputField label={t('profileNewPassword')} value={newPassword} onChange={setNewPassword} type="password" placeholder="••••••••" />
              <InputField label={t('profileConfirmPassword')} value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="••••••••" />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword}
              className="text-xs text-orange border border-orange px-3 py-1.5 rounded-lg hover:bg-orange/10 transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              {changingPassword && <Loader2 size={12} className="animate-spin" />}
              {t('profileChangePassword')}
            </button>

            <div className="p-4 bg-[#061D32] border border-[#17334D] rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{t('profileTwoFactor')}</p>
                  <p className="text-xs text-[#B9BBC8] mt-0.5">
                    {user.mfaEnabled ? t('profileTwoFactorEnabled') : t('profileTwoFactorDisabled')}
                  </p>
                </div>
                {!user.mfaEnabled && !mfaSetup && (
                  <button onClick={handleStartMfa} disabled={mfaBusy} className="text-xs text-orange border border-orange px-3 py-1.5 rounded-lg hover:bg-orange/10 transition-colors disabled:opacity-40">
                    {mfaBusy ? <Loader2 size={12} className="animate-spin" /> : t('profileTwoFactorActivate')}
                  </button>
                )}
              </div>
              {mfaSetup && (
                <div className="mt-4 pt-4 border-t border-[#17334D] space-y-3">
                  <p className="text-xs text-[#B9BBC8]">{t('profileTwoFactorScan')}</p>
                  <img src={mfaSetup.qrCode} alt="QR code 2FA" className="w-40 h-40 rounded-lg bg-white p-2" />
                  <p className="text-xs text-[#B9BBC8]">{t('profileTwoFactorManual')} <span className="text-white font-mono">{mfaSetup.manualEntryKey}</span></p>
                  <div className="flex gap-2">
                    <input
                      value={mfaCode}
                      onChange={e => setMfaCode(e.target.value)}
                      placeholder={t('profileTwoFactorCode')}
                      className="flex-1 bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange"
                    />
                    <button onClick={handleConfirmMfa} disabled={mfaBusy || !mfaCode.trim()} className="bg-orange text-white text-xs font-semibold px-4 rounded-xl disabled:opacity-40">
                      {t('profileTwoFactorConfirm')}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <NotWiredNote>{t('profileNotWiredPassword')}</NotWiredNote>
          </div>
        );
      case 'application':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-5">{t('profileApplication')}</h2>
            <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
              {subscription === undefined ? (
                <div className="flex items-center gap-2 text-xs text-[#B9BBC8]"><Loader2 size={14} className="animate-spin" /> {t('profileLoading') || 'Chargement...'}</div>
              ) : subscription === null || !subscription.plan_name ? (
                <>
                  <p className="text-xs text-[#B9BBC8] mb-1">{t('profileCurrentPlan')}</p>
                  <p className="text-sm font-bold text-white">{t('profileNoSubscription')}</p>
                  <button onClick={() => navigate('/tarifs')} className="text-xs text-orange border border-orange px-3 py-1.5 rounded-lg hover:bg-orange/10 transition-colors mt-3">{t('profileViewPlans')}</button>
                </>
              ) : (
                <>
                  <p className="text-xs text-[#B9BBC8] mb-1">{t('profileCurrentPlan')}</p>
                  <p className="text-sm font-bold text-white">{subscription.plan_name} · {subscription.price} € / {subscription.billing_period === 'yearly' ? t('profileYearly') || 'an' : t('profileMonthly') || 'mois'}</p>
                  {subscription.current_period_end && (
                    <p className="text-xs text-[#B9BBC8] mt-0.5">{t('profileRenewal') || 'Renouvellement'} {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => navigate('/tarifs')} className="text-xs text-orange border border-orange px-3 py-1.5 rounded-lg hover:bg-orange/10 transition-colors">{t('profileChangePlan')}</button>
                    <button onClick={handleCancelSubscription} disabled={cancelling} className="text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-40">
                      {cancelling ? <Loader2 size={12} className="animate-spin inline" /> : t('profileCancel')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const showSaveBar = activeSection === 'profil' || activeSection === 'entreprise' || activeSection === 'preferences';

  return (
    <div className="page-fade-in">
      <div className="md:hidden px-4 pt-6 pb-2">
        <div className="grid grid-cols-3 gap-2">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)} className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium transition-colors ${activeSection === s.key ? 'bg-orange/10 text-orange border border-orange/30' : 'bg-[#061D32] border border-[#17334D] text-[#B9BBC8]'}`}>
              <s.icon size={12} className="shrink-0" /> <span className="truncate">{t(s.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex max-w-5xl mx-auto">
        <aside className="hidden md:flex flex-col w-56 shrink-0 py-8 px-3">
          <h1 className="text-xl font-bold text-white mb-6 px-3">{t('profileAccount')}</h1>
          <nav className="space-y-1">
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeSection === s.key ? 'text-orange bg-orange/10' : 'text-[#B9BBC8] hover:text-white hover:bg-white/5'}`}>
                <s.icon size={15} className={activeSection === s.key ? 'text-orange' : ''} />
                {t(s.labelKey)}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8">
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 mb-4">
            {renderContent()}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {showSaveBar && (
              <button
                onClick={handleSaveCompany}
                disabled={saving}
                className={`flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors text-sm disabled:opacity-60 ${saved ? 'bg-green-500 hover:bg-green-500' : ''}`}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saved ? t('profileSaved') : t('profileSaveChanges')}
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 border border-[#17334D] text-[#B9BBC8] font-medium px-6 py-3 rounded-xl hover:border-red-400/40 hover:text-red-400 transition-colors text-sm">
              <LogOut size={14} /> {t('profileLogout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}