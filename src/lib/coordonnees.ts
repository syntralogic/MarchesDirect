// Screens 4 (COORDONNÉES) and 5 (CONFIRMATION) of the v26 refonte, first half: DOSSIER, RAPPEL, QUESTION.
// Copy comes from the client's mockup v26 (it wins over every other document). No promise of an e-mail anywhere.
import { isValidEmail, isValidFrPhone, normalizeFrPhoneDigits } from './utils';

export type CoordChoice = 'dossier' | 'rappel' | 'info' | 'alerte';
export type Moment = 'now' | 'afternoon' | 'tomorrow';
export const MOMENTS: { id: Moment; label: string }[] = [
  { id: 'now', label: 'Maintenant' }, { id: 'afternoon', label: 'Cet après-midi' }, { id: 'tomorrow', label: 'Demain matin' },
];
// 5 Nov (décision client : « un clic = dossier + créneau d'appel ») : pour le dossier, le visiteur choisit
// « dès que possible » (moment = 'now') ou un créneau proposé par le serveur (slotAt, ISO) ; slotLabel = son libellé.
// What the server stores / shows Elena for the callback moment (backend CALLBACK_MOMENTS).
export const MOMENT_API: Record<Moment, 'maintenant' | 'apres_midi' | 'demain_matin'> = { now: 'maintenant', afternoon: 'apres_midi', tomorrow: 'demain_matin' };
export type CoordValues = { phone: string; email: string; question: string; moment: Moment | null; slotAt: string | null; slotLabel: string | null };
export const EMPTY_COORDS: CoordValues = { phone: '', email: '', question: '', moment: null, slotAt: null, slotLabel: null };

export const COPY: Record<CoordChoice, {
  label: string; title: string; sub: string; benefit: string; before: string; btn: string; elena: string;
  done: { title: string; text: string; textNoPdf: string; elena: string };
}> = {
  dossier: {
    label: 'Votre dossier', title: 'Votre dossier, et votre créneau avec Elena',
    sub: 'Prérempli au nom de votre entreprise avec ses informations officielles, prêt tout de suite.',
    benefit: 'le dossier prérempli tout de suite + 30 minutes offertes par téléphone pour mesurer vos chances sur ce marché.',
    before: 'Après validation : votre dossier s’affiche et se télécharge. Elena vous appelle au moment choisi, avec le dossier et le marché sous les yeux. Vous décidez librement de la suite.',
    btn: 'Recevoir mon dossier',
    elena: 'Je vous appelle avec votre dossier sous les yeux : on regarde ensemble si ce marché vaut le coup pour vous, et avec quoi y aller.',
    done: {
      title: 'Dossier prêt.', text: 'Téléchargez-le ci-dessous.',
      textNoPdf: 'Votre demande est enregistrée. Le dossier prérempli vous est remis lors de l’appel.',
      elena: 'Rien à préparer pour l’appel : j’aurai votre dossier et le marché sous les yeux.',
    },
  },
  rappel: {
    label: 'Être rappelé', title: 'Quand pouvons-nous vous rappeler ?',
    sub: 'Un appel court avec Elena pour faire le point sur ce marché et sur votre entreprise. Sans engagement.',
    benefit: 'un appel d’Elena au moment choisi, et votre dossier prérempli en attendant.',
    before: 'Après validation : Elena vous rappelle au moment choisi (dans l’heure si « Maintenant », de 9 h à 18 h). Votre dossier prérempli est disponible tout de suite.',
    btn: 'Être rappelé',
    elena: 'C’est moi qui vous rappelle, au moment choisi. Un appel court, pour comprendre votre besoin et vous orienter.',
    done: {
      title: 'Votre demande de rappel est enregistrée', text: 'Maintenant : votre dossier prérempli est disponible ci-dessous. Ensuite : Elena vous rappelle au moment choisi. Rien d’autre à faire.',
      textNoPdf: 'Rien d’autre à faire : Elena vous rappelle au moment choisi. Le dossier prérempli vous est remis lors de cet appel.',
      elena: 'Je regarde votre entreprise et ce marché avant de vous rappeler, pour aller droit à l’essentiel.',
    },
  },
  info: {
    label: 'Une question', title: 'Quelle est votre question ?', sub: 'Elena vous répond par téléphone. Sans engagement.',
    benefit: 'une réponse d’Elena dans l’heure (9 h–18 h).',
    before: 'Après validation : Elena vous rappelle dans l’heure, de 9 h à 18 h, pour répondre à votre question.',
    btn: 'Envoyer ma question',
    elena: 'Je lis votre question et je vous rappelle dans l’heure, de 9 h à 18 h, avec la réponse.',
    done: {
      title: 'Votre question est enregistrée', text: 'Maintenant : votre dossier prérempli est disponible ci-dessous si vous le souhaitez. Ensuite : Elena vous rappelle dans l’heure, de 9 h à 18 h.',
      textNoPdf: 'Rien d’autre à faire : Elena vous rappelle dans l’heure, de 9 h à 18 h, avec la réponse. Le dossier prérempli vous est remis lors de cet appel.',
      elena: 'Je réponds à votre question et, si vous le souhaitez, on regarde ensemble la suite.',
    },
  },
  alerte: {
    label: 'Alerte nouveaux marchés', title: 'Être prévenu des prochains marchés',
    sub: 'Dès qu’un marché correspond à votre entreprise, Elena vous appelle pour vous le présenter. Vous décidez ensuite.',
    benefit: 'un appel d’Elena à chaque nouveau marché adapté à votre entreprise. Rien d’autre à faire.',
    before: 'Après validation : votre entreprise est inscrite à l’alerte. Elena vous appelle uniquement quand un marché correspond, de 9 h à 18 h. Vous pouvez arrêter à tout moment.',
    btn: 'Être prévenu',
    elena: 'C’est moi qui vous appelle quand un marché correspond à votre entreprise. Pas d’e-mail ni de SMS : un appel, seulement quand c’est utile.',
    done: {
      title: 'Votre alerte est enregistrée', text: 'Rien d’autre à faire. Elena vous appelle lorsqu’un nouveau marché adapté est identifié, de 9 h à 18 h.',
      textNoPdf: 'Rien d’autre à faire. Elena vous appelle lorsqu’un nouveau marché adapté est identifié, de 9 h à 18 h.',
      elena: 'Je surveille les nouveaux marchés de votre métier et de votre zone, et je vous appelle seulement quand l’un d’eux vous correspond.',
    },
  },
};

// ------------------------------------------------------------------ validation (errors go under the field, never in an alert)
export type CoordErrors = Partial<Record<'phone' | 'email' | 'question' | 'moment', string>>;
export function validateCoords(choice: CoordChoice, v: CoordValues): CoordErrors {
  const e: CoordErrors = {};
  if (choice === 'info' && v.question.trim().length < 3) e.question = 'Écrivez votre question en une ou deux phrases.';
  if (choice === 'rappel' && !v.moment) e.moment = 'Choisissez le moment qui vous convient.';
  if (choice === 'dossier' && v.moment !== 'now' && !v.slotAt) e.moment = 'Choisissez quand Elena vous appelle.';
  if (!v.phone.trim()) e.phone = 'Indiquez votre numéro de téléphone.';
  else if (!isValidFrPhone(v.phone)) e.phone = 'Ce numéro n’est pas valide : 10 chiffres, par exemple 06 12 34 56 78.';
  if (choice === 'dossier' && v.email.trim() && !isValidEmail(v.email)) e.email = 'Cette adresse e-mail n’est pas valide.';
  return e;
}

export const formatPhone = (raw: string) => normalizeFrPhoneDigits(raw).replace(/(\d{2})(?=\d)/g, '$1 ').trim();
export const momentLabel = (m: Moment | null) => MOMENTS.find((x) => x.id === m)?.label || '';

// "Dans l'heure" is only ever said for "Maintenant" - never with another moment.
/** Texte du moment d'appel pour le dossier : créneau choisi ou « dès que possible ». */
export const dossierCallWhen = (v: Pick<CoordValues, 'moment' | 'slotAt' | 'slotLabel'>) =>
  v.slotAt && v.slotLabel ? v.slotLabel : 'dès que possible, dans l’heure (9 h–18 h)';

export function callWhen(m: Moment | null): string {
  if (m === 'afternoon') return 'cet après-midi';
  if (m === 'tomorrow') return 'demain matin';
  return 'dans l’heure (9 h–18 h)';
}

// Text saved with the request: it is what Elena reads in the notification and in the CRM note.
export const leadMessage = (choice: CoordChoice, v: CoordValues, scope?: string) =>
  choice === 'alerte' ? `Alerte nouveaux marchés : appeler dès qu’un marché correspond${scope ? ` (${scope})` : ''}. Arrêt possible à tout moment.` : choice === 'rappel' ? `Moment de rappel souhaité : ${momentLabel(v.moment)}` : choice === 'info' ? v.question.trim().slice(0, 1000) : undefined;

// ------------------------------------------------------------------ calendar "jusqu'au dépôt" (from the real deadline)
export type CalendarRow = { when: string; what: string };
export function calendarRows(a: { deadline: string | Date | null | undefined; choice: CoordChoice; moment: Moment | null; slotLabel?: string | null; now?: Date }): CalendarRow[] {
  const now = a.now || new Date();
  const rows: CalendarRow[] = [
    { when: 'Aujourd’hui', what: 'Pourcentage calculé, dossier prérempli' },
    { when: a.slotLabel ? a.slotLabel : a.choice === 'rappel' && a.moment !== 'now' ? (a.moment === 'afternoon' ? 'Cet après-midi' : 'Demain matin') : 'Dans l’heure (9 h–18 h)', what: 'Elena vous appelle' },
    { when: 'Les jours suivants', what: 'Vous envoyez vos pièces, nous rédigeons le mémoire' },
  ];
  const d = a.deadline ? new Date(a.deadline) : null;
  if (d && !isNaN(d.getTime()) && d.getTime() > now.getTime()) {
    const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const left = Math.round((day(d) - day(now)) / 86_400_000);
    if (left >= 3) rows.push({ when: '2 jours avant la date limite', what: 'Vous validez la candidature' });
    const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    rows.push({ when: date, what: 'Nous déposons votre candidature' });
  }
  return rows;
}

// ASCII file name "au nom de l'entreprise": Dossier-VERIFRANCE-HABITAT-26-98064.pdf
export function pdfFileName(company: string | null | undefined, reference: string | null | undefined): string {
  const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return ['Dossier', company && slug(company), reference && slug(reference)].filter(Boolean).join('-').slice(0, 90) + '.pdf';
}

// Phone / e-mail / question / moment survive a back-navigation and a reload of this tab (session only).
const KEY = 'md_coords_v1';
export function loadCoords(): CoordValues {
  try { return { ...EMPTY_COORDS, ...JSON.parse(sessionStorage.getItem(KEY) || '{}') }; } catch { return { ...EMPTY_COORDS }; }
}
export function saveCoords(v: CoordValues): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage blocked: kept in memory only */ }
}
