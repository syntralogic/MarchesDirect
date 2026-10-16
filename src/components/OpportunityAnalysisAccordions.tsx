import { useState } from 'react';
import { ChevronDown, ExternalLink, FileText, Loader2, Search, Users } from 'lucide-react';
import { stripMarkdownArtifacts } from '@/lib/utils';

// 2nd 27 Sep client audit, point 2: "l'organisation commune à conserver" -
// one single layout reused identically across public marchés, appels
// d'offres privés and missions de sous-traitance: header info, then always
// these same 3 fixed accordions in this order (Présentation du marché /
// Conditions et points à vérifier / Entreprises concernées). Previously this
// lived only inside OpportunityDetailPage.tsx (public/private fiches),
// which is exactly why MissionDetailPage.tsx (sous-traitance) never showed
// the accordions at all - it never imported this component. Moved out to
// its own file so both pages render the same markup, same styling, same
// open/closed defaults and same "analyse en cours/échouée/absente" wording
// rather than two components slowly drifting apart.
export function hasAnalysisContent(
  sections: { presentation: string; conditions: string; entreprises: string } | null | undefined
): boolean {
  if (!sections) return false;
  return Boolean(sections.presentation?.trim() || sections.conditions?.trim() || sections.entreprises?.trim());
}

export function isRedundantWithTitle(text: string | null | undefined, title: string | null | undefined): boolean {
  if (!text || !title) return false;
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalize(text) === normalize(title);
}

// 16 Oct client brief (part 1, "contenu dupliqué"): the same sentence kept
// showing up in several blocks of a fiche (summary, "Travaux à réaliser",
// "Détails du dossier", accordions, extrait de l'avis). An exact-string
// comparison against the title was not enough: the extracted facts are
// reworded copies of each other, so overlap is measured on normalised words.
const normalizeForCompare = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const significantWords = (s: string) =>
  normalizeForCompare(s).split(' ').filter(w => w.length > 2);

/**
 * True when `text` brings nothing that `container` does not already say:
 * either it is contained verbatim (once normalised) or, for texts of at
 * least 6 significant words, 90 % of its words are already in `container`.
 * Short values (amounts, dates, short labels) are never reported as covered,
 * so structured data is not dropped by accident.
 */
export function isCoveredBy(text: string | null | undefined, container: string | null | undefined): boolean {
  if (!text || !container) return false;
  const nt = normalizeForCompare(text);
  const nc = normalizeForCompare(container);
  if (!nt || !nc) return false;
  if (nt === nc) return true;
  if (nt.length >= 25 && nc.includes(nt)) return true;
  const words = significantWords(text);
  if (words.length < 6) return false;
  const pool = new Set(significantWords(container));
  const hit = words.filter(w => pool.has(w)).length;
  return hit / words.length >= 0.9;
}

/** Same as isCoveredBy, against any of several containers. */
export function isCoveredByAny(text: string | null | undefined, containers: Array<string | null | undefined>): boolean {
  return containers.some(c => isCoveredBy(text, c));
}

export function OpportunityAnalysisAccordions({
  sections,
  sourceText,
  title,
  t,
}: {
  sections: { presentation: string; conditions: string; entreprises: string };
  // Opportunity title, already displayed in the page header: a section that
  // only repeats it is left out.
  title?: string | null;
  // Full, un-summarized source text (raw `description` field) - kept one
  // click away so nothing from the source is ever lost, per the client's
  // "ne pas perdre d'information" clarification.
  sourceText?: string | null;
  t: (key: string) => string;
}) {
  const rawItems = [
    { key: 'presentation', icon: FileText, title: t('detailAccordionPresentation') || 'Présentation du marché', text: sections.presentation },
    { key: 'conditions', icon: Search, title: t('detailAccordionConditions') || 'Conditions et points à vérifier', text: sections.conditions },
    { key: 'entreprises', icon: Users, title: t('detailAccordionEntreprises') || 'Entreprises concernées', text: sections.entreprises },
  ].filter(item => item.text && item.text.trim().length > 0);
  // A section that only restates the title or an earlier section is dropped
  // (the earlier one keeps the information), so each accordion carries its own.
  const dedupedItems = rawItems.filter((item, i) => {
    if (isRedundantWithTitle(item.text, title)) return false;
    return !rawItems.slice(0, i).some(prev => isCoveredBy(item.text, prev.text));
  });
  // Never end up with an empty list when the analysis does exist (that would
  // read as "analyse en cours"): keep the first section in that case.
  const items = dedupedItems.length > 0 ? dedupedItems : rawItems.slice(0, 1);
  // The raw extract stays available one click away, unless the analysis
  // above already reproduces it as is.
  const showSource = Boolean(sourceText) && !items.some(it => isCoveredBy(sourceText, it.text));

  const [openKey, setOpenKey] = useState<string | null>(items[0]?.key ?? null);
  const [sourceOpen, setSourceOpen] = useState(false);

  if (items.length === 0) {
    return (
      <div className="border border-[#17334D] rounded-xl bg-[#031B30] px-4 py-4 flex items-center gap-2.5">
        <Loader2 size={15} className="text-orange shrink-0" />
        <p className="text-xs text-[#B9BBC8]">{t('detailAnalysisIncomplete') || "Analyse détaillée en cours de génération pour cette opportunité."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold text-white mb-3">
        {t('detailAnalysisGroupTitle') || "Analyse de l'opportunité"}
      </h2>
      {items.map(item => {
        const isOpen = openKey === item.key;
        const Icon = item.icon;
        return (
          <div key={item.key} className="border border-[#17334D] rounded-xl bg-[#031B30] overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenKey(cur => (cur === item.key ? null : item.key))}
              className="w-full flex items-center gap-2.5 px-3.5 py-[18px] text-left"
              aria-expanded={isOpen}
            >
              <Icon size={16} className="text-orange shrink-0" />
              <span className="flex-1 text-sm font-semibold text-white">{item.title}</span>
              <ChevronDown size={14} className={`text-[#B9BBC8] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-3.5 pb-4 text-sm text-[#EAF0F6] leading-relaxed whitespace-pre-line">
                {stripMarkdownArtifacts(item.text)}
              </div>
            )}
          </div>
        );
      })}
      {showSource && sourceText && (
        <div className="border border-[#17334D] rounded-xl bg-[#031B30] overflow-hidden">
          <button
            type="button"
            onClick={() => setSourceOpen(o => !o)}
            className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left"
            aria-expanded={sourceOpen}
          >
            <FileText size={14} className="text-[#5B6B80] shrink-0" />
            <span className="flex-1 text-xs font-semibold text-[#B9BBC8]">
              {t('detailSourceTextToggle') || "Voir l'extrait de l'avis"}
            </span>
            <ChevronDown size={13} className={`text-[#5B6B80] shrink-0 transition-transform ${sourceOpen ? 'rotate-180' : ''}`} />
          </button>
          {sourceOpen && (
            <div className="px-3.5 pb-4 text-xs text-[#B9BBC8] leading-relaxed whitespace-pre-line">
              {stripMarkdownArtifacts(sourceText)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Same fallback text block OpportunityDetailPage used inline (distinguishes
// "pas encore analysé" / "échec" / "rien à dire" instead of one flat
// message for all three) - now shared so a sous-traitance mission with no
// ai_analysis_sections yet reads exactly like a public/private fiche in the
// same state, not a generic "no description" line.
export function OpportunityAnalysisFallback({
  aiSummary,
  description,
  title,
  classificationStatus,
  officialUrl,
  t,
}: {
  aiSummary?: string | null;
  description?: string | null;
  title?: string | null;
  classificationStatus?: string | null;
  officialUrl?: string | null;
  t: (key: string) => string;
}) {
  const summaryUsable = aiSummary && !isRedundantWithTitle(aiSummary, title);
  const descriptionUsable = description && !isRedundantWithTitle(description, title);
  return (
    <div>
      {summaryUsable && (
        <p className="text-sm text-white leading-relaxed whitespace-pre-line">{stripMarkdownArtifacts(aiSummary!)}</p>
      )}
      {descriptionUsable && !summaryUsable && (
        <p className="text-sm text-[#B9BBC8] leading-relaxed">{description}</p>
      )}
      {!summaryUsable && !descriptionUsable && (
        <p className="text-sm text-[#B9BBC8]">
          {classificationStatus === 'failed'
            ? (t('detailAnalysisFailed') || "L'analyse automatique a échoué pour ce marché. Consultez l'annonce officielle ci-dessous.")
            : classificationStatus === 'processing'
              ? (t('detailAnalysisPending') || 'Analyse en cours de génération pour cette opportunité.')
              : (t('detailNoDescription') || "Aucune description détaillée n'est disponible pour cette annonce. Consultez l'annonce officielle ci-dessous.")}
        </p>
      )}
      {officialUrl && (
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#4EA1FF] hover:underline"
        >
          <ExternalLink size={13} />
          {t('detailOfficialNoticeLink') || "Voir l'annonce officielle"}
        </a>
      )}
    </div>
  );
}
