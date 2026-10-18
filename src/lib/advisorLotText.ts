// Texts of "Le regard de votre chargé d'affaires" built around THE LOT of the artisan (client brief 18 Oct + cahier
// consolidé §6/§8). Deterministic templates - the text is generated automatically, so it says "nous", never "je"
// (a "je" would suggest a person has already studied the file). Six situations:
//   1. before identification (fiche)          4. no lot matches the company
//   2. the lot matches                        5. after a « Non » answer (one wording per point)
//   3. partial match (mixed lot)              6. private tender / subcontracting
// Only facts that exist are used: a missing lot, date or point is simply left out, never invented. A trade match is
// worded « votre activité correspond », never « ce lot est pour vous » (cahier A2: no promise of eligibility).

import { formatDeadlineExact } from '@/lib/deadlineFormat';
import type { AdviceAnswers } from '@/lib/advisorFallback';

export type LotRelation = 'match' | 'partial' | 'none' | 'unknown';
export type OfferKind = 'public' | 'private' | 'subcontracting';

export interface LotAdviceContext {
  stage: 'opportunity' | 'compatibility';
  kind: OfferKind;
  companyName?: string | null;
  /** The artisan's lot (first matched), as written in the notice. */
  lot?: string | null;
  lotsTotal: number;
  relation: LotRelation;
  deadline?: string | null;
  /** A technical visit is mentioned by the notice (never guessed). */
  visitMentioned?: boolean;
  answers?: AdviceAnswers;
  now?: Date;
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
const quote = (lot: string) => `« ${clean(lot)} »`;

/** "le 30 oct. 2026 à 13 h, dans 13 jours" - only what the deadline really says. */
export function deadlinePhrase(deadline: string | null | undefined, now: Date = new Date()): string {
  const exact = formatDeadlineExact(deadline, now);
  if (!exact || !deadline) return '';
  const d = new Date(deadline);
  const days = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (days < 0) return '';
  const rel = days === 0 ? '' : days === 1 ? ', demain' : `, dans ${days} jours`;
  if (/^(Aujourd|Demain)/.test(exact)) return `Les offres sont à remettre ${exact.charAt(0).toLowerCase()}${exact.slice(1)}.`;
  return `Les offres sont à remettre le ${exact}${rel}.`;
}

/** A lot such as "CVC - PLB" or "Peinture et sols" covers several trades. */
export function isMixedLot(lot: string | null | undefined): boolean {
  const parts = clean(lot || '').split(/\s[-–/&]\s|\s+et\s+|,|;/).map(p => p.trim()).filter(p => p.length >= 3);
  return parts.length >= 2;
}

const NO_TEXT: Record<keyof AdviceAnswers, string> = {
  calendar: 'Vous indiquez ne pas pouvoir respecter le calendrier. Faisons le point avant d’engager votre candidature : nous pouvons aussi vous orienter vers un marché ou un lot mieux adapté.',
  experience: 'Vous n’avez pas encore de réalisation comparable : ce n’est pas toujours éliminatoire. Vérifions ce que le marché exige réellement et comment présenter votre savoir-faire.',
  capacity: 'Vous indiquez ne pas pouvoir mobiliser tous les moyens demandés. Voyons ensemble ce que le lot exige vraiment, et si un partenaire peut compléter vos moyens.',
  location: 'Vous indiquez ne pas pouvoir intervenir dans cette zone. Mieux vaut le savoir maintenant : nous pouvons chercher des marchés plus proches de vous.',
};
const NO_ORDER: Array<keyof AdviceAnswers> = ['calendar', 'location', 'capacity', 'experience'];

export function lotAdvice(c: LotAdviceContext): string {
  const who = clean(c.companyName || '');
  const when = deadlinePhrase(c.deadline, c.now);
  const visit = c.visitMentioned ? 'Le point à préparer en priorité : la visite du site.' : '';
  const dossier = c.lot
    ? 'Recevez votre dossier prérempli pour ce lot : nous le complétons avec vous et vous validez.'
    : 'Recevez votre dossier prérempli : nous le complétons avec vous et vous validez.';

  // 6. private tender / subcontracting
  if (c.kind !== 'public') {
    const what = c.kind === 'subcontracting' ? 'Cette mission de sous-traitance' : 'Cette consultation privée';
    const scope = c.lot ? ` porte sur ${quote(c.lot)}` : ' confie une partie du travail à un prestataire';
    const check = c.kind === 'subcontracting'
      ? 'Vérifiez les tâches confiées, les fournitures et les documents réellement demandés avant de répondre.'
      : 'Vérifiez le périmètre, les conditions de consultation et la proposition attendue avant de répondre.';
    if (c.stage === 'opportunity') return `${what}${scope}. ${when} ${check} Nous vous aidons à préparer la suite.`.replace(/\s+/g, ' ').trim();
    return `${who ? `${who}, ` : ''}${what.charAt(0).toLowerCase()}${what.slice(1)}${scope}. ${when} ${check} ${dossier}`.replace(/\s+/g, ' ').trim();
  }

  // 1. before identification
  if (c.stage === 'opportunity') {
    if (c.lot && c.lotsTotal >= 2) {
      return `Ce marché est découpé en ${c.lotsTotal} lots, par corps de métier. Le lot ${quote(c.lot)} correspond à votre recherche : c’est lui que nous examinons pour votre entreprise. ${when} Vérifiez s’il vous correspond : nous vous aidons à préparer la suite.`.replace(/\s+/g, ' ').trim();
    }
    return '';
  }

  // 5. after a « Non »
  const answers = c.answers || {};
  const no = NO_ORDER.find(k => answers[k] === 'non');
  if (no) { const t = NO_TEXT[no]; return who ? `${who} : ${t.charAt(0).toLowerCase()}${t.slice(1)}` : t; }

  // 4. no lot matches
  if (c.relation === 'none') {
    return `${who ? `${who}, ` : ''}aucun lot de ce marché ne correspond clairement à votre activité. Mieux vaut le savoir avant de préparer une candidature : regardez d’autres marchés ouverts adaptés à votre métier, ou faisons le point avec un chargé d’affaires.`;
  }
  // 3. partial (mixed lot)
  if (c.relation === 'partial' && c.lot) {
    return `${who ? `${who}, v` : 'V'}otre activité correspond à une partie du lot ${quote(c.lot)}, qui couvre aussi d’autres prestations. Précisons ensemble comment répondre à l’ensemble du lot. ${when} ${visit} ${dossier}`.replace(/\s+/g, ' ').trim();
  }
  // 2. the lot matches
  if (c.relation === 'match' && c.lot) {
    return `${who ? `${who}, v` : 'V'}otre activité correspond à ce lot : ${quote(c.lot)}. ${when} ${visit} ${dossier}`.replace(/\s+/g, ' ').trim();
  }
  return '';
}
