import { useLang } from '@/contexts/LangContext';

export default function CguPage() {
  const { t } = useLang();

  const sections = [
    { title: t('cguService'), text: t('cguServiceText') },
    { title: t('cguAccount'), text: t('cguAccountText') },
    { title: t('cguSubscriptions'), text: t('cguSubscriptionsText') },
    { title: t('cguCancellation'), text: t('cguCancellationText') },
    { title: t('cguModule'), text: t('cguModuleText') },
    { title: t('cguLiability'), text: t('cguLiabilityText') },
    { title: t('cguLaw'), text: t('cguLawText') },
  ];

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">{t('cguTitle')}</h1>
        <p className="text-xs text-[#B9BBC8]">{t('cguUpdated')}</p>
      </div>

      <div className="space-y-5">
        {sections.map((s, i) => (
          <div key={s.title} className="bg-[#061D32] border border-[#17334D] rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xs font-bold text-orange/60 shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="text-sm font-bold text-orange uppercase tracking-wide">{s.title}</h2>
            </div>
            <p className="text-sm text-[#B9BBC8] leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}