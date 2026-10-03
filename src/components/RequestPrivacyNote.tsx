import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';

// DEV-08: shown right next to every request button (rappel, rendez-vous,
// contact) so the visitor knows what the contact details are used for and can
// open the full notice. Wording to be validated by the person in charge of the
// data-protection notice before it is treated as final.
export default function RequestPrivacyNote({ className = '' }: { className?: string }) {
  const { t } = useLang();
  return (
    <p className={`text-[11px] leading-snug text-[#B9BBC8] ${className}`}>
      {t('requestPrivacyNote')}{' '}
      <Link to="/confidentialite" target="_blank" rel="noopener" className="text-orange underline hover:no-underline">
        {t('requestPrivacyLink')}
      </Link>
    </p>
  );
}
