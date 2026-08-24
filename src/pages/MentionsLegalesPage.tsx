import { useLang } from '@/contexts/LangContext';

export default function MentionsLegalesPage() {
  const { t, tList } = useLang();

  const sections = [
    { title: t('legalPublisher'), content: tList('legalPublisherContent') },
    { title: t('legalHost'), content: tList('legalHostContent') },
    { title: t('legalContactInfo'), content: tList('legalContactContent') },
    { title: t('legalIP'), content: tList('legalIPContent') },
    { title: t('legalResponsibility'), content: tList('legalResponsibilityContent') },
  ];

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-8">{t('legalTitle')}</h1>

      {sections.map(section => (
        <section key={section.title} className="mb-8">
          <h2 className="text-base font-bold text-orange mb-3 uppercase tracking-wide text-xs">{section.title}</h2>
          <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-5 space-y-2">
            {section.content.map((line, i) => (
              <p key={i} className="text-sm text-[#B9BBC8] leading-relaxed">{line}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}