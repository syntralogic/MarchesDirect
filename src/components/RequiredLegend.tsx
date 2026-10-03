import { useLang } from '@/contexts/LangContext';

// DEV-08: tells the visitor which fields are mandatory (the * on each label).
export default function RequiredLegend({ className = '' }: { className?: string }) {
  const { t } = useLang();
  return <p className={`text-[11px] text-[#B9BBC8] ${className}`}>{t('requestRequiredLegend')}</p>;
}
