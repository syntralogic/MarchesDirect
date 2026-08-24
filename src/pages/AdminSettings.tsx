import { useState } from 'react';
import { Save, Globe, Shield, Bell, Check } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';

export default function AdminSettings() {
  const { t } = useLang();
  const [saved, setSaved] = useState(false);

  const [twoFactor, setTwoFactor] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [siteName, setSiteName] = useState('Marchés Direct');
  const [supportEmail, setSupportEmail] = useState('support@marchesdirect.fr');
  const [maintenanceMessage, setMaintenanceMessage] = useState('Site under maintenance. Please check back soon.');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    showToast('Settings saved successfully');
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">{t('adminSettings')}</h1>
        <p className="text-sm text-[#B9BBC8]">{t('adminSettingsDesc')}</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Globe size={18} className="text-orange" /> {t('adminGeneral')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminSiteName')}</label>
              <input value={siteName} onChange={e => setSiteName(e.target.value)} className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminSupportEmail')}</label>
              <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
            </div>
            {maintenance && (
              <div>
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Message</label>
                <input value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)} className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Shield size={18} className="text-orange" /> {t('adminSecurity')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">{t('adminTwoFactor')}</span>
              <button onClick={() => setTwoFactor(!twoFactor)} className={`relative w-12 h-6 rounded-full transition-colors ${twoFactor ? 'bg-green-500' : 'bg-[#17334D]'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${twoFactor ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">{t('adminMaintenance')}</span>
              <button onClick={() => setMaintenance(!maintenance)} className={`relative w-12 h-6 rounded-full transition-colors ${maintenance ? 'bg-orange' : 'bg-[#17334D]'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${maintenance ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Bell size={18} className="text-orange" /> {t('adminNotifications')}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">{t('adminEmailAlerts')}</span>
              <button onClick={() => setEmailAlerts(!emailAlerts)} className={`relative w-12 h-6 rounded-full transition-colors ${emailAlerts ? 'bg-green-500' : 'bg-[#17334D]'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${emailAlerts ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleSave} className={`inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-colors text-sm ${saved ? 'bg-green-500 text-white' : 'bg-orange text-white hover:bg-orange/90'}`}>
          {saved ? <Check size={16} /> : <Save size={16} />} {saved ? t('adminSaved') : t('adminSaveChanges')}
        </button>
      </div>
    </AdminLayout>
  );
}