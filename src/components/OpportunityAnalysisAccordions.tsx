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

export function OpportunityAnalysisAccordions({
  sections,
  sourceText,
  t,
}: {
  sections: { presentation: string; conditions: string; entreprises: string };
  // Full, un-summarized source text (raw `description` field) - kept one
  // click away so nothing from the source is ever lost, per the client's
  // "ne pas perdre d'information" clarification.
  sourceText?: string | null;
  t: (key: string) => string;
}) {
  const items = [
    { key: 'presentation', icon: FileText, title: t('detailAccordionPresentation') || 'Présentation du marché', text: sections.presentation },
    { key: 'conditions', icon: Search, title: t('detailAccordionConditions') || 'Conditions et points à vérifier', text: sections.conditions },
    { key: 'entreprises', icon: Users, title: t('detailAccordionEntreprises') || 'Entreprises concernées', text: sections.entreprises },
  ].filter(item => item.text && item.text.trim().length > 0);

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
      {sourceText && (
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
