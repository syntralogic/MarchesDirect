// Refonte v26 - rules for the single-screen "fiche marché + analyse" (spec sections 3.1 - 3.5).
// Pure functions only (no React, no network) so the wording rules can be tested exactly.
// Everything here is RULE based: opening a fiche never calls an AI (spec 3.3).
import type { ApiMatchCriterion } from '@/lib/apiClient';

// ---------------------------------------------------------------- 3.1 header
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Short, faithful title. Backend short title if any, else "nature — ville", else the first 60 chars of the official title. */
export function buildShortTitle(p: { short?: string | null; officialTitle: string; nature?: string | null; city?: string | null }): string {
  if (p.short && p.short.trim()) return p.short.trim();
  if (p.nature && p.nature.trim() && p.city && p.city.trim()) return `${cap(p.nature.trim())} — ${p.city.trim()}`;
  const t = (p.officialTitle || '').trim();
  return t.length <= 60 ? t : `${t.slice(0, 60).trimEnd()}…`;
}

export interface DeadlineInfo { text: string; daysLeft: number | null; amber: boolean; soon: boolean; closed: boolean }

/** "Réponse avant le 18 nov. 2026, 12 h · J-16" - amber when J <= 7. Impossible years are treated as unknown. */
export function deadlineInfo(deadline: string | Date | null | undefined, now: Date = new Date()): DeadlineInfo {
  const none: DeadlineInfo = { text: 'Date limite non précisée', daysLeft: null, amber: false, soon: false, closed: false };
  if (!deadline) return none;
  const d = new Date(deadline);
  const y = d.getFullYear();
  if (Number.isNaN(d.getTime()) || y < 2000 || y > 2100) return none;
  const tz = 'Europe/Paris';
  const parts = (x: Date) => {
    const o: Record<string, number> = {};
    for (const p of new Intl.DateTimeFormat('fr-FR', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(x)) {
      if (p.type !== 'literal') o[p.type] = Number(p.value);
    }
    return o;
  };
  const dp = parts(d);
  const day = d.toLocaleDateString('fr-FR', { timeZone: tz, day: 'numeric', month: 'short', year: 'numeric' });
  const hh = dp.hour, mm = dp.minute;
  const hasTime = hh !== 0 || mm !== 0;
  const time = hasTime ? `, ${hh} h${mm ? ` ${String(mm).padStart(2, '0')}` : ''}` : '';
  // J-N counts calendar days in Paris time (18 nov seen on 2 nov = J-16), not 24h blocks.
  const np = parts(now);
  const daysLeft = Math.round((Date.UTC(dp.year, dp.month - 1, dp.day) - Date.UTC(np.year, np.month - 1, np.day)) / 86_400_000);
  if (daysLeft < 0) return { text: `Réponse close depuis le ${day}`, daysLeft, amber: false, soon: false, closed: true };
  const soon = daysLeft <= 7;
  return { text: `Réponse avant le ${day}${time} · J-${daysLeft}`, daysLeft, amber: soon, soon, closed: false };
}

// ---------------------------------------------------------------- 3.3 percentage
export type Band = { key: 'high' | 'mid' | 'low'; label: 'Très adapté' | 'À étudier' | 'Peu adapté'; color: string };
export function scoreBand(pct: number): Band {
  if (pct >= 70) return { key: 'high', label: 'Très adapté', color: '#2EBB77' };
  if (pct >= 40) return { key: 'mid', label: 'À étudier', color: '#F5A524' };
  return { key: 'low', label: 'Peu adapté', color: '#8A94A6' };
}

// ---------------------------------------------------------------- 3.5 six criteria
export type RowTone = 'green' | 'amber' | 'red';
export interface CriterionRow { key: string; label: string; status: 'Correspond' | 'À confirmer' | 'Ne correspond pas' | 'Non précisé'; tone: RowTone; detail: string }

const SIX: { key: ApiMatchCriterion['key']; label: string }[] = [
  { key: 'metier', label: 'Activité' },
  { key: 'zone', label: "Zone d'intervention" },
  { key: 'disponibilite', label: 'Calendrier' },
  { key: 'moyens', label: 'Moyens' },
  { key: 'experience', label: 'Références' },
  { key: 'qualifications', label: 'Qualifications' },
];

/** Six fixed lines. Unknown data is NEVER shown as "Correspond" (spec 3.5). */
export function criteriaRows(list: ApiMatchCriterion[] | null | undefined): CriterionRow[] {
  return SIX.map(({ key, label }) => {
    const c = (list || []).find((x) => x.key === key);
    if (!c || c.evidence === 'unknown' || c.evidence === 'not_applicable') {
      return { key, label, status: 'Non précisé', tone: 'amber', detail: c?.detail || "L'avis ne le précise pas." };
    }
    if (c.status === 'mismatch') return { key, label, status: 'Ne correspond pas', tone: 'red', detail: c.detail };
    if (c.status === 'match') return { key, label, status: 'Correspond', tone: 'green', detail: c.detail };
    return { key, label, status: 'À confirmer', tone: 'amber', detail: c.detail };
  });
}

// ---------------------------------------------------------------- 3.5 "Affiner" questions
export type Answer = 'oui' | 'non';
// Keys are the ones the real scoring engine already understands (GET /opportunities/:id/match-score?answers=k:v,...).
export const REFINE_QUESTIONS = [
  { key: 'location', criterion: 'zone', text: "Pouvez-vous intervenir sur le lieu d'exécution ?" },
  { key: 'calendar', criterion: 'disponibilite', text: 'Les délais du marché vous conviennent-ils ?' },
  { key: 'capacity', criterion: 'moyens', text: 'Avez-vous les moyens (équipes, matériel) pour ce marché ?' },
  { key: 'experience', criterion: 'experience', text: 'Avez-vous déjà réalisé des prestations similaires ?' },
] as const;
export type RefineKey = (typeof REFINE_QUESTIONS)[number]['key'];
export type Answers = Partial<Record<RefineKey, Answer>>;

export const answersToParam = (a: Answers): string =>
  REFINE_QUESTIONS.filter((q) => a[q.key]).map((q) => `${q.key}:${a[q.key]}`).join(',');

// ---------------------------------------------------------------- 3.4 Elena's advice (3 sentences, by rules)
const NON_TEXT: Record<RefineKey, string> = {
  location: "Le lieu d'exécution est en dehors de votre zone d'intervention.",
  experience: "Vous n'avez pas encore de référence similaire à présenter.",
  calendar: 'Les délais ne vous conviennent pas.',
  capacity: 'Vos moyens ne couvrent pas plusieurs sites.',
};
const TODO_TEXT: Record<RefineKey, string> = {
  location: "votre zone d'intervention",
  experience: 'vos références sur des prestations similaires',
  calendar: 'vos délais',
  capacity: 'vos moyens',
};
const NON_ORDER: RefineKey[] = ['location', 'experience', 'calendar', 'capacity'];

const joinFr = (parts: string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}`);

export interface Advice { sentences: [string, string, string]; showBetterLink: boolean }

export function buildAdvice(p: {
  activity: 'match' | 'confirm' | 'mismatch'; // status of the Activité criterion ONLY (a "Non" on zone never changes sentence 1)
  nature?: string | null;                      // e.g. "de maintenance"
  city?: string | null;
  company: string;
  answers: Answers;
  pct: number;
}): Advice {
  const where = [p.nature ? p.nature.trim() : '', p.city ? `à ${p.city.trim()}` : ''].filter(Boolean).join(' ');
  const subject = `Ce marché${where ? ' ' + where : ''}`;
  const s1 =
    p.activity === 'match' ? `${subject} est en lien direct avec l'activité de ${p.company}.`
    : p.activity === 'mismatch' ? `${subject} s'éloigne de l'activité de ${p.company}.`
    : `${subject} est proche de l'activité de ${p.company}, sans y correspondre entièrement.`;

  const nons = NON_ORDER.filter((k) => p.answers[k] === 'non');
  const unanswered = NON_ORDER.filter((k) => !p.answers[k]);
  let s2: string;
  if (nons.length > 0) {
    s2 = nons.map((k) => NON_TEXT[k]).join(' ') + (p.pct >= 40 ? " C'est le principal point à voir ensemble." : '');
  } else if (unanswered.length > 0) {
    const txt = joinFr(unanswered.map((k) => TODO_TEXT[k]));
    // "votre zone" is singular; "vos références / délais / moyens" are plural.
    const plural = unanswered.length > 1 || unanswered[0] !== 'location';
    s2 = `${cap(txt)} ${plural ? 'restent' : 'reste'} à préciser.`;
  } else {
    s2 = 'Vos réponses confirment les points clés : zone, délais, moyens et références.';
  }

  const allAnswered = unanswered.length === 0;
  const s3 =
    p.pct >= 70 ? 'Votre dossier prérempli vous donne une première base pour avancer avec notre équipe.'
    : p.pct >= 40 ? (allAnswered
        ? 'Un échange avec notre équipe vous dira rapidement si ce marché vaut le coup d\'être préparé.'
        : "Vos réponses nous aideront à préciser si ce marché convient à votre entreprise.")
    : "D'autres marchés de votre liste vous correspondent mieux : nous vous conseillons de commencer par eux.";

  return { sentences: [s1, s2, s3], showBetterLink: p.pct < 40 };
}

// ---------------------------------------------------------------- 3.2 / 1.2 company line
export function companyLine(c: { name?: string | null; activity?: string | null; city?: string | null; postal?: string | null }): string {
  const dept = c.postal ? ` (${c.postal.slice(0, c.postal.startsWith('97') ? 3 : 2)})` : '';
  return [c.name, c.activity, c.city ? `${c.city}${dept}` : ''].filter(Boolean).join(' · ');
}
