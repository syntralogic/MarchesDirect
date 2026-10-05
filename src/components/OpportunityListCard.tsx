import { useOpenOpportunity } from '@/contexts/OpportunityTransitionContext';
import { useLang } from '@/contexts/LangContext';
import { SaveButton } from '@/components/SaveButton';
import type { Opportunity } from '@/data/mockData';
import { formatDeadlineExact } from '@/lib/deadlineFormat';

interface OpportunityListCardProps {
  opportunity: Opportunity;
  /** Percentage match score once the company is identified. */
  // undefined = still loading, null = not enough information to compare yet.
  matchScore?: number | null;
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
  /**
   * How many opportunities are currently loaded in the parent list (client
   * audit, point 7 - 26 Sep: "J'ai affiché 200 annonces, ouvert une annonce
   * située après les 100 premières, puis fait retour... la liste revient à
   * 100 annonces"). Saved alongside the scroll position on click so the
   * listing page can reload however many pages were actually on screen
   * before navigating away, instead of always restarting at PAGE_SIZE. See
   * useOpportunities' savedCount restore logic.
   */
  loadedCount?: number;
}

// Client reference (listing screen mockup): plain outline pill, same style
// for every journey - no color-coding here, that's reserved for the detail
// page's journey badge.
const TYPE_LABEL: Record<Opportunity['type'], string> = {
  public: 'Marché public',
  private: 'Appel d\u2019offres privé',
  subcontracting: 'Sous-traitance',
};

// Client's ask: real statuses instead of everything looking like a fresh
// new opportunity. 'active' isn't shown here - that's the normal/expected
// case for a listing and doesn't need a callout badge.
const LIFECYCLE_BADGE: Record<Exclude<NonNullable<Opportunity['lifecycleStatus']>, 'active'>, { text: string; className: string }> = {
  expired: { text: 'Clôturé', className: 'text-[#B9BBC8] border-white/15' },
  awarded: { text: 'Attribué', className: 'text-orange border-orange/40' },
  cancelled: { text: 'Annulé', className: 'text-red-400 border-red-400/40' },
};

// Awarded / cancelled / expired listings have no meaningful "days left":
// the consultation is over (and awarded notices usually carry no deadline at
// all), so the second column shows the outcome under a "Statut" label
// instead of a bare "-" under "Avant clôture". Active listings without a
// published deadline say so explicitly rather than showing a dash.
function getDeadlineInfo(
  deadline: string | undefined,
  lifecycle: Opportunity['lifecycleStatus'],
  t: (key: string) => string,
): { value: string; label: string } {
  if (lifecycle && lifecycle !== 'active') {
    return { value: LIFECYCLE_BADGE[lifecycle].text, label: t('listingStatusLabel') };
  }
  const days = deadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000) : NaN;
  if (Number.isNaN(days)) return { value: t('listingNoDeadline'), label: t('listingDeadlineLabel') };
  // Past the exact hour counts as closed (a deadline earlier today is not "0 jour").
  if (new Date(deadline as string).getTime() < Date.now()) return { value: t('listingClosedLabel'), label: t('listingStatusLabel') };
  // DEV-02: a precise date (and hour when the source has one) instead of
  // "1 jour"; same-day deadlines read "Aujourd'hui à 19 h".
  return {
    value: formatDeadlineExact(deadline) || `${days} ${days > 1 ? t('listingDaysPlural') : t('listingDaySingular')}`,
    label: t('listingClosesInLabel'),
  };
}

export function OpportunityListCard({ opportunity: o, matchScore, canScore, compatible, to, ctaLabel, loadedCount }: OpportunityListCardProps) {
  const { t } = useLang();
  const openOpportunity = useOpenOpportunity();
  const destination = to ?? `/opportunites/${o.id}`;
  const deadlineInfo = getDeadlineInfo(o.deadline, o.lifecycleStatus, t);

  let statusLine: { text: string; className: string };
  if (compatible !== undefined) {
    statusLine = compatible
      // 30 Sep audit, point 7: "Profil recherché compatible" was shown on every
      // result as soon as a company was identified, for very different métiers,
      // before any real comparison. Without a computed concordance the card only
      // invites the visitor to check it; the positive wording stays reserved for
      // a real score (branch below).
      ? { text: t('searchCheckMatch') || 'Ouvrez la fiche pour vérifier la concordance', className: 'text-[#B9BBC8]' }
      : { text: t('searchIdentifyPrompt'), className: 'text-[#B9BBC8]' };
  } else if (canScore) {
    if (matchScore === undefined) statusLine = { text: '\u2026', className: 'text-[#B9BBC8]' };
    else if (matchScore === null) statusLine = { text: t('searchMatchToConfirm') || 'Concordance à confirmer', className: 'text-[#B9BBC8]' };
    else if (matchScore >= 60) statusLine = { text: `${matchScore}\u00A0% \u2014 ${t('searchCompatible')}`, className: 'text-[#3FA96E]' };
    else if (matchScore >= 40) statusLine = { text: `${matchScore}\u00A0% \u2014 ${t('searchMatchPartial') || 'À examiner'}`, className: 'text-orange' };
    else statusLine = { text: `${matchScore}\u00A0% \u2014 ${t('searchMatchLow') || 'Peu compatible'}`, className: 'text-[#B9BBC8]' };
  } else {
    statusLine = { text: t('searchIdentifyPrompt'), className: 'text-[#B9BBC8]' };
  }

  const saveScrollForReturn = () => {
    // Client (19 Sep): "les retours en arrière doivent conserver
    // l'entreprise, les réponses et les critères de recherche" - the
    // filters/search criteria already round-trip through the URL on every
    // listing page, so browser back already restores those; what's
    // missing is scroll position, which resets to the top on remount.
    // Keyed to the exact URL (path+query) being left, one-time use (read
    // once then cleared - see the listing pages' restore effect) so a
    // fresh, unrelated visit to the same URL later doesn't jump.
    try {
      const key = `${window.location.pathname}${window.location.search}`;
      sessionStorage.setItem(`scrollPos:${key}`, String(window.scrollY));
      // DEV-05: also remember WHICH card was opened and where it sat in the
      // viewport, so going back lands on the same card even if card heights
      // changed meanwhile (fonts/images/badges) - the raw pixel offset alone drifts.
      const el = document.querySelector(`[data-opp-id="${CSS.escape(String(o.id))}"]`);
      if (el) {
        sessionStorage.setItem(`scrollAnchor:${key}`, JSON.stringify({ id: String(o.id), top: Math.round(el.getBoundingClientRect().top) }));
      }
      // See loadedCount prop doc above - without this, useOpportunities'
      // fresh mount on back-navigation always starts from page 1/PAGE_SIZE
      // again, so a scroll position saved against a 200-row-tall page gets
      // restored onto a 100-row-tall one (either clamped to the bottom or
      // simply short of where the visitor actually was).
      if (loadedCount) {
        sessionStorage.setItem(`loadedCount:${key}`, String(loadedCount));
      }
    } catch {
      // sessionStorage can throw in locked-down/private-browsing contexts -
      // losing the scroll-restore convenience isn't worth failing the
      // click over.
    }
  };

  return (
    <div
      data-opp-id={String(o.id)}
      className="relative bg-[#061D32] border border-[#17334D] rounded-2xl p-4 hover:border-orange/40 transition-colors duration-200 cursor-pointer"
      onClick={() => { saveScrollForReturn(); openOpportunity(destination, o.title); }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-block text-[11px] font-medium text-white border border-white/25 rounded-full px-3 py-1">
            {TYPE_LABEL[o.type] ?? TYPE_LABEL.public}
          </span>
          {o.lifecycleStatus && o.lifecycleStatus !== 'active' && (
            <span className={`inline-block text-[11px] font-semibold border rounded-full px-3 py-1 ${LIFECYCLE_BADGE[o.lifecycleStatus].className}`}>
              {LIFECYCLE_BADGE[o.lifecycleStatus].text}
            </span>
          )}
          {/* Client audit (25 Sep, point 2): demo/seed listing, clearly
              marked so it's never mistaken for a real opportunity. */}
          {o.isDemo && (
            <span className="inline-block text-[11px] font-semibold border rounded-full px-3 py-1 text-purple-300 border-purple-400/40 bg-purple-400/10">
              {t('listingDemoBadge') || 'Exemple de démonstration'}
            </span>
          )}
        </div>
        <div onClick={e => e.stopPropagation()} className="shrink-0">
          <SaveButton opportunityId={o.id} />
        </div>
      </div>

      <h3 title={o.title} className="text-base font-bold text-white leading-snug mb-1 line-clamp-2">{o.title}</h3>
      <p className="text-xs text-[#B9BBC8] mb-4 line-clamp-2">{o.location}</p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          {/* DEV-05: no big repeated "Montant non communiqué" block - an unknown
              amount is a small discreet line, never an invented estimate. */}
          {o.amount !== 'Montant non communiqué' ? (
            <>
              <p className="text-lg font-bold text-orange leading-tight">{o.amount}</p>
              <p className="text-[11px] text-[#B9BBC8]">{t('detailBudget')}</p>
            </>
          ) : (
            <p className="text-[11px] text-[#B9BBC8] leading-tight">{t('detailBudget')} : non communiqué</p>
          )}
        </div>
        <div>
          <p className="text-lg font-bold text-white leading-tight">{deadlineInfo.value}</p>
          <p className="text-[11px] text-[#B9BBC8]">{deadlineInfo.label}</p>
        </div>
      </div>

      <p className={`text-xs mb-4 ${statusLine.className}`}>{statusLine.text}</p>

      <button
        onClick={e => {
          e.stopPropagation();
          saveScrollForReturn();
          openOpportunity(destination, o.title);
        }}
        className="w-full bg-orange text-white font-semibold text-sm py-3 rounded-xl hover:brightness-110 transition-all"
      >
        {ctaLabel ?? t('listingViewOpportunity')}
      </button>
    </div>
  );
}
