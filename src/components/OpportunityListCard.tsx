import { useNavigate } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { SaveButton } from '@/components/SaveButton';
import type { Opportunity } from '@/data/mockData';

interface OpportunityListCardProps {
  opportunity: Opportunity;
  /** Percentage match score once the company is identified. */
  matchScore?: number;
  /** Whether a numeric match score can be shown at all (company identified). */
  canScore?: boolean;
  /**
   * Sous-traitance journey doesn't compute a percentage - just a known/unknown
   * compatibility flag once the company profile exists. When set, this takes
   * over the status line instead of matchScore/canScore.
   */
  compatible?: boolean;
  /** Override the destination (sous-traitance splits chantier vs. partenaire routes). */
  to?: string;
  /** Override the CTA label (sous-traitance keeps its own "Voir la mission" wording). */
  ctaLabel?: string;
}

// Client reference (listing screen mockup): plain outline pill, same style
// for every journey - no color-coding here, that's reserved for the detail
// page's journey badge.
const TYPE_LABEL: Record<Opportunity['type'], string> = {
  public: 'Marché public',
  private: 'Appel d\u2019offres privé',
  subcontracting: 'Sous-traitance',
};

function getDeadlineText(deadline: string | undefined, t: (key: string) => string) {
  if (!deadline) return '-';
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (Number.isNaN(days)) return '-';
  if (days < 0) return t('listingClosedLabel');
  return `${days} ${days > 1 ? t('listingDaysPlural') : t('listingDaySingular')}`;
}

export function OpportunityListCard({ opportunity: o, matchScore, canScore, compatible, to, ctaLabel }: OpportunityListCardProps) {
  const { t } = useLang();
  const navigate = useNavigate();
  const destination = to ?? `/opportunites/${o.id}`;
  const deadlineText = getDeadlineText(o.deadline, t);

  let statusLine: { text: string; className: string };
  if (compatible !== undefined) {
    statusLine = compatible
      ? { text: t('searchCompatible'), className: 'text-[#3FA96E]' }
      : { text: t('searchIdentifyPrompt'), className: 'text-[#B9BBC8]' };
  } else if (canScore) {
    statusLine = matchScore !== undefined
      ? { text: `${matchScore}\u00A0% \u2014 ${t('searchCompatible')}`, className: 'text-[#3FA96E]' }
      : { text: '\u2026', className: 'text-[#B9BBC8]' };
  } else {
    statusLine = { text: t('searchIdentifyPrompt'), className: 'text-[#B9BBC8]' };
  }

  return (
    <div
      className="relative bg-[#061D32] border border-[#17334D] rounded-2xl p-4 hover:border-orange/40 transition-colors duration-200 cursor-pointer"
      onClick={() => navigate(destination)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="inline-block text-[11px] font-medium text-white border border-white/25 rounded-full px-3 py-1">
          {TYPE_LABEL[o.type] ?? TYPE_LABEL.public}
        </span>
        <div onClick={e => e.stopPropagation()} className="shrink-0">
          <SaveButton opportunityId={o.id} />
        </div>
      </div>

      <h3 className="text-base font-bold text-white leading-snug mb-1 line-clamp-2">{o.title}</h3>
      <p className="text-xs text-[#B9BBC8] mb-4">{o.location}</p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-lg font-bold text-orange leading-tight">{o.amount}</p>
          <p className="text-[11px] text-[#B9BBC8]">{t('detailBudget')}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white leading-tight">{deadlineText}</p>
          <p className="text-[11px] text-[#B9BBC8]">{t('listingClosesInLabel')}</p>
        </div>
      </div>

      <p className={`text-xs mb-4 ${statusLine.className}`}>{statusLine.text}</p>

      <button
        onClick={e => {
          e.stopPropagation();
          navigate(destination);
        }}
        className="w-full bg-orange text-white font-semibold text-sm py-3 rounded-xl hover:brightness-110 transition-all"
      >
        {ctaLabel ?? t('listingViewOpportunity')}
      </button>
    </div>
  );
}
