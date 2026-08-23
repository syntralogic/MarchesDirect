import { useLang } from '@/contexts/LangContext';

export default function ConfidentialitePage() {
  const { t } = useLang();

  const sections = [
    { title: t('privacyData'), text: t('privacyDataText') },
    { title: t('privacyPurpose'), text: t('privacyPurposeText') },
    { title: t('privacyRetention'), text: t('privacyRetentionText') },
    { title: t('privacyRights'), text: t('privacyRightsText') },
    { title: t('privacyDelete'), text: t('privacyDeleteText') },
    { title: t('privacySecurity'), text: t('privacySecurityText') },
    { title: t('privacyCookies'), text: t('privacyCookiesText') },
  ];

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">{t('privacyTitle')}</h1>
        <p className="text-xs text-[#B9BBC8]">{t('privacyUpdated')}</p>
      </div>

      <div className="space-y-5">
        {sections.map(s => (
          <div key={s.title} className="bg-[#061D32] border border-[#17334D] rounded-xl p-5">
            <h2 className="text-sm font-bold text-orange uppercase tracking-wide mb-3">{s.title}</h2>
            <p className="text-sm text-[#B9BBC8] leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-[#061D32] border border-orange/20 rounded-xl p-5">
        <p className="text-sm text-[#B9BBC8]">
          {t('privacyDpo')} <span className="text-orange">privacy@marchesdirect.fr</span>
        </p>
      </div>
    </div>
  );
}