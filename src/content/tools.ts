// Outils gratuits (6 nov.) : calculateur de seuils et simulateur d'avance. Fonctions pures, sans dépendance, testées
// (src/content/__tests__/tools.test.ts). Chaque valeur renvoie à son article et à la date de vérification : à revoir
// à chaque changement de seuils (les seuils européens changent tous les deux ans, au 1er janvier des années paires).

export const RULES_CHECKED = '2026-11-06';

export type Nature = 'travaux' | 'fournitures-services';
export type Buyer = 'etat' | 'collectivite' | 'entite-adjudicatrice';

export const T = {
  // Dispense de publicité et de mise en concurrence (R2122-8), en € HT.
  dispense: { travaux: 100_000, 'fournitures-services': 60_000 } as Record<Nature, number>,
  // Publicité obligatoire au BOAMP ou dans un journal d'annonces légales au-delà de ce montant (R2131-12).
  publiciteJal: 90_000,
  // Seuils européens 2026-2027 (procédure formalisée), en € HT.
  formalise: {
    travaux: 5_404_000,
    'fournitures-services': { etat: 140_000, collectivite: 216_000, 'entite-adjudicatrice': 432_000 } as Record<Buyer, number>,
  },
};

export interface SeuilResult { procedure: string; publicite: string; details: string[] }

export function seuils(montantHT: number, nature: Nature, buyer: Buyer): SeuilResult {
  const formal = nature === 'travaux' ? T.formalise.travaux : T.formalise['fournitures-services'][buyer];
  const disp = T.dispense[nature];
  const details: string[] = [
    'Le montant à prendre en compte est la valeur totale estimée du besoin, hors taxes, tous lots confondus et sur toute la durée du marché (reconductions comprises).',
  ];
  if (montantHT < disp) {
    return { procedure: 'Marché possible sans publicité ni mise en concurrence', publicite: 'Aucune publicité obligatoire',
      details: [...details, `En dessous de ${fmt(disp)} € HT, l’acheteur peut attribuer directement, en choisissant une offre pertinente, en faisant une bonne utilisation des deniers publics et en ne contractant pas systématiquement avec le même fournisseur lorsqu’il existe plusieurs offres possibles. Il peut aussi choisir de consulter : faites-vous connaître des acheteurs de votre zone.`] };
  }
  if (montantHT < formal) {
    const pub = montantHT < T.publiciteJal
      ? 'Publicité libre, adaptée au montant et à l’objet (site de l’acheteur, plateforme, presse spécialisée…)'
      : 'Avis au BOAMP ou dans un journal d’annonces légales, et sur le profil d’acheteur ; l’acheteur peut ajouter une presse spécialisée';
    return { procedure: 'Procédure adaptée (MAPA)', publicite: pub,
      details: [...details, 'L’acheteur fixe lui-même les règles dans le règlement de la consultation : délai, pièces demandées, négociation éventuelle. Lisez-le en entier.'] };
  }
  return { procedure: 'Procédure formalisée (appel d’offres, procédure avec négociation…)', publicite: 'Avis au BOAMP et au Journal officiel de l’Union européenne (JOUE), et sur le profil d’acheteur',
    details: [...details, 'Délais minimaux de réponse fixés par le code (par exemple 35 jours en appel d’offres ouvert, réductions possibles), candidature avec DC1/DC2 ou DUME.'] };
}

export interface AvanceResult { obligatoire: boolean; taux: number | null; montant: number | null; details: string[] }

// Taux minimal d'avance (R2191-7) : 5 % en règle générale ; taux majorés pour les PME selon l'acheteur.
export const AVANCE = {
  seuilMontant: 50_000,     // € HT
  seuilDureeMois: 2,
  tauxGeneral: 0.05,
  tauxPme: { etat: 0.30, collectivite: 0.10, 'entite-adjudicatrice': 0.05 } // collectivité : 10 % seulement au-delà de 60 M€ de dépenses (R2191-7, vérifié le 7 nov. 2026) as Record<Buyer, number>,
};

export function avance(montantHT: number, dureeMois: number, buyer: Buyer, pme: boolean): AvanceResult {
  const obligatoire = montantHT > AVANCE.seuilMontant && dureeMois > AVANCE.seuilDureeMois;
  if (!obligatoire) return { obligatoire, taux: null, montant: null, details: [
    `L’avance n’est obligatoire que si le montant initial dépasse ${fmt(AVANCE.seuilMontant)} € HT et la durée d’exécution ${AVANCE.seuilDureeMois} mois. L’acheteur peut toutefois en prévoir une : regardez le CCAP.`] };
  const taux = pme ? AVANCE.tauxPme[buyer] : AVANCE.tauxGeneral;
  // Marché de plus de 12 mois : le taux s'applique à 12 fois le montant divisé par la durée en mois.
  const base = dureeMois > 12 ? (12 * montantHT) / dureeMois : montantHT;
  return { obligatoire, taux, montant: Math.round(base * taux), details: [
    dureeMois > 12 ? `Durée supérieure à 12 mois : le taux s’applique à 12 fois le montant divisé par la durée en mois (${fmt(Math.round(base))} € HT).` : 'Durée de 12 mois ou moins : le taux s’applique au montant initial TTC ou HT selon les règles de l’acheteur ; ce calcul utilise le HT.',
    'C’est un minimum : l’acheteur peut prévoir plus. Vous pouvez aussi refuser l’avance.',
    'L’avance est remboursée en étant déduite de vos factures, en général à partir de 65 % d’exécution et au plus tard à 80 %.',
  ] };
}

const fmt = (x: number) => new Intl.NumberFormat('fr-FR').format(x);
