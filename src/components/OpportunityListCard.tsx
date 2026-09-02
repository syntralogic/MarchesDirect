import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Zap, Paintbrush, Building, Wrench, CheckCircle2, HelpCircle, Clock3 } from 'lucide-react';
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
   * over the score slot instead of matchScore/canScore.
   */
  compatible?: boolean;
  /** Override the destination (sous-traitance splits chantier vs. partenaire routes). */
  to?: string;
}

// Each journey gets its own accent so a glance at the left edge tells you
// what kind of opportunity this is, even before reading the title -
// matters most on the dashboard/saved views where all three types mix.
const TYPE_STYLES: Record<Opportunity['type'], { label: string; accent: string; chip: string; icon: JSX.Element }> = {
  public: {
    label: 'Marché public',
    accent: '#5EA6FF',
    chip: 'text-[#5EA6FF] bg-[#5EA6FF]/10 border-[#5EA6FF]/25',
    icon: <Building size={16} />,
  },
  private: {
    label: 'Appel d\u2019offres',
    accent: '#B98CFF',
    chip: 'text-[#B98CFF] bg-[#B98CFF]/10 border-[#B98CFF]/25',
    icon: <Wrench size={16} />,
  },
  subcontracting: {
    label: 'Sous-traitance',
    accent: '#4FD1C5',
    chip: 'text-[#4FD1C5] bg-[#4FD1C5]/10 border-[#4FD1C5]/25',
    icon: <Zap size={16} />,
  },
};

function getTradeIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('peinture')) return <Paintbrush size={16} />;
  if (t.includes('électricité')) return <Zap size={16} />;
  return null;
}

// Days-to-deadline drives the color: nothing needs explaining once red means
// "act now" and grey means "plenty of time" - matches how the mobile hero
// already treats delays elsewhere in the app.
function getDeadlineUrgency(deadline?: string) {
  if (!deadline) return { label: '-', className: 'text-[#B9BBC8]', urgent: false };
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  const formatted = new Date(deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  if (days < 0) return { label: formatted, className: 'text-[#5B6B80]', urgent: false };
  if (days <= 7) return { label: formatted, className: 'text-[#FF5C5C]', urgent: true };
  if (days <= 30) return { label: formatted, className: 'text-orange', urgent: false };
  return { label: formatted, className: 'text-white', urgent: false };
}

export function OpportunityListCard({ opportunity: o, matchScore, canScore, compatible, to }: OpportunityListCardProps) {
  const { t } = useLang();
  const navigate = useNavigate();
  const type = TYPE_STYLES[o.type] ?? TYPE_STYLES.public;
  const tradeIcon = getTradeIcon(o.title);
  const deadline = getDeadlineUrgency(o.deadline);
  const destination = to ?? `/opportunites/${o.id}`;

  return (
    <div
      className="group relative bg-[#061D32] border border-[#17334D] rounded-2xl p-3.5 pl-4 hover:border-orange/40 hover:-translate-y-0.5 hover:orange-glow-sm transition-all duration-200 cursor-pointer"
      onClick={() => navigate(destination)}
    >
      {/* Type accent rail */}
      <span
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: type.accent }}
      />

      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border ${type.chip}`}
        >
          {type.label}
        </span>
        <div onClick={e => e.stopPropagation()}>
          <SaveButton opportunityId={o.id} />
        </div>
      </div>

      <div className="flex items-start gap-2.5 mb-2">
        <div
          className="shrink-0 w-9 h-9 rounded-lg bg-[#031B30] border border-[#17334D] flex items-center justify-center"
          style={{ color: type.accent }}
        >
          {tradeIcon ?? type.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs md:text-sm font-bold text-white leading-tight mb-1 line-clamp-2">{o.title}</h3>
          <div className="flex items-center gap-1 text-[10px] text-[#B9BBC8] truncate">
            <span className="truncate">{o.organization}</span>
            <span className="shrink-0">·</span>
            <MapPin size={9} className="shrink-0" />
            <span className="truncate">{o.location}</span>
          </div>
        </div>
      </div>

      {o.description && (
        <p className="text-[10px] text-[#B9BBC8] leading-snug line-clamp-2 mb-3">{o.description}</p>
      )}

      <div className="pt-2.5 border-t border-[#17334D] flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[8px] text-[#5B6B80] mb-0.5">{t('searchBudget')}</p>
            <p className="text-[11px] font-semibold text-white">{o.amount}</p>
          </div>
          <div>
            <p className="text-[8px] text-[#5B6B80] mb-0.5">{t('dashDeadlineLabel')}</p>
            <p className={`text-[11px] font-semibold flex items-center gap-1 ${deadline.className}`}>
              {deadline.urgent && <Clock3 size={10} />}
              {deadline.label}
            </p>
          </div>
        </div>

        {compatible !== undefined ? (
          compatible ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border text-[#3FA96E] bg-[#3FA96E]/10 border-[#3FA96E]/25">
              <CheckCircle2 size={11} /> {t('searchCompatible')}
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-medium text-[#B9BBC8] border border-[#17334D] rounded-full px-2 py-1">
              <HelpCircle size={10} /> {t('searchIdentifyPrompt')}
            </span>
          )
        ) : canScore ? (
          matchScore !== undefined ? (
            <span
              className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${
                matchScore >= 80
                  ? 'text-[#3FA96E] bg-[#3FA96E]/10 border-[#3FA96E]/25'
                  : matchScore >= 60
                    ? 'text-orange bg-orange/10 border-orange/25'
                    : 'text-[#B9BBC8] bg-white/5 border-[#17334D]'
              }`}
            >
              <CheckCircle2 size={11} /> {matchScore}%
            </span>
          ) : (
            <span className="shrink-0 text-[9px] text-[#5B6B80]">…</span>
          )
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-medium text-[#B9BBC8] border border-[#17334D] rounded-full px-2 py-1">
            <HelpCircle size={10} /> {t('searchIdentifyPrompt')}
          </span>
        )}
      </div>

      <button
        onClick={e => {
          e.stopPropagation();
          navigate(destination);
        }}
        className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-bold text-orange border border-orange/30 rounded-lg py-1.5 hover:bg-orange/10 transition-colors"
      >
        {t('searchView')} <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
