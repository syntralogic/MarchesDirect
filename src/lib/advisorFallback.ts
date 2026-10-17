// Deterministic texts for "Le regard de votre chargé d'affaires", shown at once and kept whenever the AI text is
// not available. Client audit (18 Oct): the advice must INTERPRET, not recite (amount, date, score are already on
// screen), must follow the visitor's answers, and must never keep claiming something after a « non ».

type Answer = 'oui' | 'non' | 'a_confirmer' | undefined;
export interface AdviceAnswers { experience?: Answer; capacity?: Answer; location?: Answer; calendar?: Answer }

const KEYS = ['experience', 'capacity', 'location', 'calendar'] as const;

const YES: Record<(typeof KEYS)[number], string> = {
  experience: 'avoir déjà réalisé une prestation similaire',
  capacity: 'pouvoir mobiliser les moyens nécessaires',
  location: 'pouvoir intervenir dans cette zone',
  calendar: 'pouvoir respecter le calendrier',
};
const NO: Record<(typeof KEYS)[number], string> = {
  experience: 'ne pas avoir d’expérience comparable',
  capacity: 'ne pas pouvoir mobiliser les moyens nécessaires',
  location: 'ne pas pouvoir intervenir dans cette zone',
  calendar: 'ne pas pouvoir respecter le calendrier',
};

const joinFr = (a: string[]) => (a.length <= 1 ? (a[0] || '') : `${a.slice(0, -1).join(', ')} et ${a[a.length - 1]}`);

export function opportunityAdviceFallback(tradeLabel?: string | null): string {
  const trade = (tradeLabel || '').trim().toLowerCase();
  const intro = trade
    ? `Un chantier à regarder si vous intervenez en ${trade}.`
    : 'Un marché à regarder de près si son activité est proche de la vôtre.';
  return `${intro} Pour préparer votre réponse, mettez en avant vos réalisations comparables et votre organisation sur chantier. Vérifiez maintenant les points qui correspondent à votre entreprise : nous vous aidons à préparer la suite.`;
}

export function compatibilityAdviceFallback(opts: { companyName?: string | null; activityMatches: boolean; answers: AdviceAnswers }): string {
  const who = (opts.companyName || '').trim();
  const lead = who ? `${who} : ` : '';
  const noKeys = KEYS.filter(k => opts.answers[k] === 'non');
  const yesKeys = KEYS.filter(k => opts.answers[k] === 'oui');
  const activity = opts.activityMatches ? 'votre activité correspond au lot recherché.' : 'regardons comment vous positionner sur ce marché.';

  if (noKeys.length) {
    return `${lead}${activity} Vous indiquez ${NO[noKeys[0]]} : ce point mérite un échange avant de préparer une candidature. Faisons le point avec un chargé d’affaires sur cette offre ou sur un projet mieux adapté.`;
  }
  if (yesKeys.length) {
    const said = joinFr(yesKeys.slice(0, 2).map(k => YES[k]));
    return `${lead}${activity} Vous indiquez ${said} : ce sont des éléments à valoriser dans votre candidature. Découvrez votre dossier prérempli : nous préparons ensemble comment les présenter.`;
  }
  return `${lead}${activity} Précisez votre expérience et votre organisation avec les quatre questions, c’est facultatif. Découvrez ensuite votre dossier prérempli avec un chargé d’affaires.`;
}
