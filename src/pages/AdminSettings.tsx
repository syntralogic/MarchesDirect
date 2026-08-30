import { useEffect, useState } from 'react';
import { Save, Globe, Shield, Bell, Check, Database, RefreshCw } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';
import { adminApi, type ApiDataSource } from '@/lib/apiClient';

export default function AdminSettings() {
  const { t, lang } = useLang();
  const [saved, setSaved] = useState(false);

  const [sources, setSources] = useState<ApiDataSource[] | null>(null);
  const [sourcesError, setSourcesError] = useState(false);
  const [runningCode, setRunningCode] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ code: string; ok: boolean } | null>(null);

  const loadSources = () => {
    adminApi
      .dataSources()
      .then((res) => setSources(res.sources))
      .catch(() => setSourcesError(true));
  };

  useEffect(loadSources, []);

  const runSource = async (code: string) => {
    setRunningCode(code);
    setRunResult(null);
    try {
      await adminApi.runDataSource(code);
      setRunResult({ code, ok: true });
    } catch {
      setRunResult({ code, ok: false });
    } finally {
      setRunningCode(null);
      loadSources();
    }
  };

  const fmtDate = (iso: string | null) => {
    if (!iso) return lang === 'en' ? 'never run' : 'jamais lancé';
    return new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const [twoFactor, setTwoFactor] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [siteName, setSiteName] = useState('Marchés Direct');
  const [supportEmail, setSupportEmail] = useState('support@marchesdirect.fr');
  const [maintenanceMessage, setMaintenanceMessage] = useState('Site under maintenance. Please check back soon.');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    showToast(t('adminSettingsSaved') || 'Settings saved successfully');
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">{t('adminSettings')}</h1>
        <p className="text-sm text-[#B9BBC8]">{t('adminSettingsDesc')}</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
            <Database size={18} className="text-orange" /> {t('adminDataSources')}
          </h2>
          <p className="text-xs text-[#B9BBC8] mb-4">{t('adminDataSourcesDesc')}</p>

          {sourcesError && <p className="text-xs text-red-400">{t('adminLoadError') || 'Erreur de chargement.'}</p>}
          {!sourcesError && !sources && <p className="text-xs text-[#B9BBC8]">{t('adminLoading') || 'Chargement...'}</p>}

          {sources && (
            <div className="flex flex-col gap-3">
              {sources.map((s) => (
                <div key={s.code} className="flex items-center justify-between flex-wrap gap-2 border-b border-[#17334D] pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <span className="text-sm font-semibold text-white">{s.name}</span>
                    <div className="text-[11px] text-[#B9BBC8] font-mono mt-0.5">
                      {t('adminLastRun')}: {fmtDate(s.last_run)} · {t('adminNextRun')}: {fmtDate(s.next_run)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        s.active ? 'bg-orange/15 text-orange' : 'bg-red-500/15 text-red-400'
                      }`}
                    >
                      {s.active ? 'OK' : t('adminSourceInactive')}
                    </span>
                    <button
                      onClick={() => runSource(s.code)}
                      disabled={runningCode === s.code}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold border border-[#17334D] text-[#B9BBC8] hover:text-white hover:border-orange/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={runningCode === s.code ? 'animate-spin' : ''} />
                      {runningCode === s.code ? t('adminRunning') : t('adminRunNow')}
                    </button>
                  </div>
                  {runResult && runResult.code === s.code && (
                    <span className={`text-[11px] w-full ${runResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                      {runResult.ok ? t('adminRunSuccess') : t('adminRunFailed')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminMaintenanceMessage') || 'Message'}</label>
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