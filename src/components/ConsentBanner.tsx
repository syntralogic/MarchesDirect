import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { getAnalyticsConsent, onConsentChange, setAnalyticsConsent } from '@/lib/consent';

// DEV-14: asks once whether anonymous-looking visit statistics may be recorded.
// Both answers have the same weight; the site works identically either way.
export default function ConsentBanner() {
  const { t } = useLang();
  const [choice, setChoice] = useState(getAnalyticsConsent());

  useEffect(() => onConsentChange(() => setChoice(getAnalyticsConsent())), []);

  if (choice !== null) return null;

  return (
    <div
      role="dialog"
      aria-label={t('consentTitle')}
      className="fixed bottom-0 left-0 right-0 z-[70] bg-[#031B30] border-t border-[#17334D] shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed flex-1">
          <span className="font-semibold text-white">{t('consentTitle')}</span>{' '}
          {t('consentText')}{' '}
          <Link to="/confidentialite" className="text-orange underline">{t('consentLearnMore')}</Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAnalyticsConsent('denied')}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-[#17334D] text-white text-sm font-semibold hover:border-orange/40 transition-colors"
          >
            {t('consentRefuse')}
          </button>
          <button
            type="button"
            onClick={() => setAnalyticsConsent('granted')}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-[#17334D] text-white text-sm font-semibold hover:border-orange/40 transition-colors"
          >
            {t('consentAccept')}
          </button>
        </div>
      </div>
    </div>
  );
}
