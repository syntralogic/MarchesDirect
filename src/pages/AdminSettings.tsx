import { useEffect, useRef, useState } from 'react';
import { Save, Globe, Shield, Bell, Check, Database, RefreshCw, Loader2 } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';
import { adminApi, getApiErrorMessage, type ApiDataSource, type ApiSourceStat, type ApiConnectorRun, type ApiAdminSettings } from '@/lib/apiClient';

export default function AdminSettings() {
  const { t, lang } = useLang();
  const [saved, setSaved] = useState(false);

  const [sources, setSources] = useState<ApiDataSource[] | null>(null);
  const [sourceStats, setSourceStats] = useState<ApiSourceStat[] | null>(null);
  const [sourcesError, setSourcesError] = useState(false);
  const [runningCode, setRunningCode] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ code: string; state: 'ok' | 'failed' | 'background' | 'already' } | null>(null);
  const [recentRuns, setRecentRuns] = useState<ApiConnectorRun[]>([]);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSources = () =>
    adminApi
      .dataSources()
      .then((res) => {
        setSources(res.sources);
        setSourceStats(res.sourceStats || []);
        setRecentRuns(res.recentRuns || []);
        // A later successful load must clear an earlier failure - before,
        // the red "Impossible de charger" stayed on screen next to data
        // that had in fact loaded fine.
        setSourcesError(false);
      })
      .catch(() => setSourcesError(true));

  useEffect(() => {
    loadSources();
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
  }, []);

  // Long connectors (BOAMP/DECP) run server-side after the 202: poll until
  // the source has a fresh finished log, so the panel updates by itself.
  const pollUntilDone = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    const startedPolling = Date.now();
    pollTimer.current = setInterval(async () => {
      await loadSources();
      if (Date.now() - startedPolling > 15 * 60 * 1000) {
        if (pollTimer.current) clearInterval(pollTimer.current);
      }
    }, 8000);
  };

  const latestRunFor = (sourceId: number | undefined) =>
    sourceId === undefined ? undefined : recentRuns.find((r) => r.source_id === sourceId);

  const runSource = async (code: string) => {
    setRunningCode(code);
    setRunResult(null);
    try {
      const { background } = await adminApi.runDataSource(code);
      setRunResult({ code, state: background ? 'background' : 'ok' });
      if (background) pollUntilDone();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setRunResult({ code, state: status === 409 ? 'already' : 'failed' });
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

  // General section only, for now - Security (2FA) and Notifications
  // (email alerts) toggles above stay local-only until a follow-up wires
  // them to something real; see admin.ts's SETTINGS_KEYS comment.
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.settings()
      .then((s: ApiAdminSettings) => {
        setSiteName(s.siteName);
        setSupportEmail(s.supportEmail);
        setMaintenance(s.maintenanceMode);
        setMaintenanceMessage(s.maintenanceMessage);
      })
      .catch(err => setSettingsError(getApiErrorMessage(err, t('adminSettingsLoadError') || 'Impossible de charger les paramètres.')))
      .finally(() => setSettingsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [savingSettings, setSavingSettings] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSave = async () => {
    setSaveError(null);
    if (!siteName.trim()) {
      setSaveError(t('adminSiteNameRequired') || 'Le nom du site est requis.');
      return;
    }
    if (!EMAIL_RE.test(supportEmail.trim())) {
      setSaveError(t('adminSupportEmailInvalid') || "L'email de support n'est pas valide.");
      return;
    }
    if (maintenance && !maintenanceMessage.trim()) {
      setSaveError(t('adminMaintenanceMessageRequired') || 'Un message de maintenance est requis quand le mode maintenance est actif.');
      return;
    }
    setSavingSettings(true);
    try {
      const result = await adminApi.updateSettings({
        siteName,
        supportEmail,
        maintenanceMode: maintenance,
        maintenanceMessage,
      });
      // Reflect back whatever the server actually stored (trimmed values).
      setSiteName(result.siteName);
      setSupportEmail(result.supportEmail);
      setMaintenanceMessage(result.maintenanceMessage);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      showToast(t('adminSettingsSaved') || 'Settings saved successfully');
    } catch (err) {
      setSaveError(getApiErrorMessage(err, t('adminSettingsSaveFailed') || "Échec de l'enregistrement."));
    } finally {
      setSavingSettings(false);
    }
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

          {sourcesError && (
            <p className="text-xs text-red-400 flex items-center gap-2 flex-wrap">
              {t('adminLoadError') || 'Erreur de chargement.'}
              <button onClick={() => loadSources()} className="underline hover:text-red-300">{t('adminRetry')}</button>
            </p>
          )}
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
                      {runningCode === s.code ? t('adminRunning') : latestRunFor(s.id)?.status === 'failed' ? t('adminResume') : t('adminRunNow')}
                    </button>
                  </div>
                  {runResult && runResult.code === s.code ? (
                    <span className={`text-[11px] w-full ${runResult.state === 'failed' ? 'text-red-400' : runResult.state === 'ok' ? 'text-green-400' : 'text-[#B9BBC8]'}`}>
                      {runResult.state === 'ok' && t('adminRunSuccess')}
                      {runResult.state === 'failed' && t('adminRunFailed')}
                      {runResult.state === 'background' && t('adminRunBackground')}
                      {runResult.state === 'already' && t('adminRunAlready')}
                    </span>
                  ) : latestRunFor(s.id)?.status === 'failed' ? (
                    <span className="text-[11px] w-full text-red-400">{t('adminLastRunFailed')}</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {sourceStats && sourceStats.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#17334D]">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wide mb-1">
                {t('adminSourceStatsTitle')}
              </h3>
              <p className="text-[11px] text-[#B9BBC8] mb-3">{t('adminSourceStatsDesc')}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="text-[#B9BBC8] uppercase tracking-wide">
                      <th className="pb-2 pr-3 font-semibold">{t('adminSourceStatsSource')}</th>
                      <th className="pb-2 pr-3 font-semibold text-right">{t('adminSourceStatsCount')}</th>
                      <th className="pb-2 pr-3 font-semibold text-right">{t('adminSourceStatsOfficialUrl')}</th>
                      <th className="pb-2 pr-3 font-semibold text-right">{t('adminSourceStatsBuyer')}</th>
                      <th className="pb-2 pr-3 font-semibold text-right">{t('adminSourceStatsDeadline')}</th>
                      <th className="pb-2 pr-3 font-semibold text-right">{t('adminSourceStatsDescription')}</th>
                      <th className="pb-2 font-semibold text-right">{t('adminSourceStatsAmount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceStats.map((s) => (
                      <tr key={s.source_id} className="border-t border-[#17334D]/60">
                        <td className="py-2 pr-3 text-white font-semibold uppercase">{s.code}</td>
                        <td className="py-2 pr-3 text-right text-white font-mono">{s.opportunity_count.toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR')}</td>
                        <td className="py-2 pr-3 text-right text-[#B9BBC8] font-mono">{s.with_official_url_pct}%</td>
                        <td className="py-2 pr-3 text-right text-[#B9BBC8] font-mono">{s.with_buyer_name_pct}%</td>
                        <td className="py-2 pr-3 text-right text-[#B9BBC8] font-mono">{s.with_deadline_pct}%</td>
                        <td className="py-2 pr-3 text-right text-[#B9BBC8] font-mono">{s.with_substantial_description_pct}%</td>
                        <td className="py-2 text-right text-[#B9BBC8] font-mono">{s.with_estimated_value_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Globe size={18} className="text-orange" /> {t('adminGeneral')}
          </h2>
          {settingsError && (
            <p className="text-xs text-red-400 mb-3 flex items-center gap-2 flex-wrap">
              {settingsError}
              <button onClick={() => { setSettingsLoading(true); setSettingsError(null); adminApi.settings().then(s => { setSiteName(s.siteName); setSupportEmail(s.supportEmail); setMaintenance(s.maintenanceMode); setMaintenanceMessage(s.maintenanceMessage); }).catch(err => setSettingsError(getApiErrorMessage(err, t('adminSettingsLoadError') || 'Impossible de charger les paramètres.'))).finally(() => setSettingsLoading(false)); }} className="underline hover:text-red-300">{t('adminRetry')}</button>
            </p>
          )}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminSiteName')}</label>
              <input disabled={settingsLoading} value={siteName} onChange={e => setSiteName(e.target.value)} maxLength={200} className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange disabled:opacity-50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminSupportEmail')}</label>
              <input type="email" disabled={settingsLoading} value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange disabled:opacity-50" />
            </div>
            {maintenance && (
              <div>
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminMaintenanceMessage') || 'Message'}</label>
                <input disabled={settingsLoading} value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)} maxLength={1000} className="w-full bg-[#031B30] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange disabled:opacity-50" />
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

        {saveError && <p className="text-xs text-red-400">{saveError}</p>}
        <button onClick={handleSave} disabled={savingSettings || settingsLoading} className={`inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-colors text-sm disabled:opacity-50 ${saved ? 'bg-green-500 text-white' : 'bg-orange text-white hover:bg-orange/90'}`}>
          {savingSettings ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />} {saved ? t('adminSaved') : t('adminSaveChanges')}
        </button>
      </div>
    </AdminLayout>
  );
}