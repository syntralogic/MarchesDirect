// 7 nov. (demande de Hedi) : le parcours après le clic dépend du type d'annonce. Un appel d'offres privé n'a ni DCE ni
// formulaires DC1/DC2 ni dépôt sur un profil d'acheteur ; une sous-traitance se traite avec l'entreprise principale
// (devis, pièces du sous-traitant, contrat, loi du 31 décembre 1975). Tous les textes qui changent selon le type sont ici.
export type JourneyCode = 'public_procurement' | 'tender' | 'subcontracting';

export interface JourneyCopy {
  noun: string;            // « ce marché », « cette consultation », « cette mission »
  nounBare: string;        // « marché », « consultation », « mission »
  feminine: boolean;
  giver: string;           // qui commande
  giverAddress: string;    // libellé de l'adresse du donneur d'ordre
  notice: string;          // le document de l'annonce
  noticeSub: string;
  officialLink: string;
  detailTitle: string;
  summaryTitle: string;
  docs: { title: string; sub: string }[];          // « Mes documents » (en plus du dossier prérempli et de l'annonce)
  who: [string, string][];                          // « qui fait quoi »
  withElena: string[];                              // ce qu'on voit pendant l'appel
  helpLine: string;                                 // ce que fait Marchés Direct (formules d'accompagnement), en une phrase
  daysAfter: string;                                // calendrier : les jours suivants
  validate: string;                                 // calendrier : 2 jours avant
  submit: string;                                   // calendrier : à la date limite
  rushIssue: (deadlineText: string) => string;      // conseil d'Elena quand le délai est court
}

const PUBLIC: JourneyCopy = {
  noun: 'ce marché', nounBare: 'marché', feminine: false, giver: 'Acheteur public', giverAddress: 'Adresse de l’acheteur',
  notice: 'Avis du marché', noticeSub: 'Document officiel publié par l’acheteur', officialLink: 'Voir l’annonce officielle',
  detailTitle: 'Le marché en détail', summaryTitle: 'Le marché en 30 secondes',
  docs: [{ title: 'Mémoire technique', sub: 'Rédigé avec notre équipe, après votre échange' }, { title: 'Formulaires de candidature', sub: 'DC1, DC2 ou DUME, préparés après votre échange' }],
  who: [['Références de chantiers similaires', 'Vous'], ['Moyens humains et matériels', 'Vous'], ['Attestations et pièces administratives', 'Vous'],
    ['Formulaires de candidature', 'Nous (avec la formule)'], ['Mémoire technique', 'Nous (avec la formule)'], ['Offre de prix', 'Ensemble'], ['Dépôt de la candidature', 'Nous (avec la formule)']],
  withElena: ['Vos atouts et vos points faibles sur ce marché', 'Ce qu’il faut fournir, écrire, et dans quel ordre', 'Qui fait quoi si vous décidez d’y aller : vous, nous, ensemble'],
  helpLine: 'Si vous nous confiez votre candidature (mémoire technique, formulaires, dépôt), c’est l’objet de nos formules d’accompagnement, présentées pendant l’échange.',
  daysAfter: 'Avec la formule : vous envoyez vos pièces, nous rédigeons le mémoire',
  validate: 'Vous validez la candidature', submit: 'Dépôt de la candidature (par nous si vous nous l’avez confiée, sinon par vous)',
  rushIssue: d => `le délai : on prépare le mémoire technique avec vous pour tenir le ${d}`,
};

const TENDER: JourneyCopy = {
  noun: 'cette consultation', nounBare: 'consultation', feminine: true, giver: 'Donneur d’ordre', giverAddress: 'Adresse du donneur d’ordre',
  notice: 'Annonce de la consultation', noticeSub: 'Le cahier des charges est transmis par le donneur d’ordre', officialLink: 'Voir l’annonce',
  detailTitle: 'La consultation en détail', summaryTitle: 'La consultation en 30 secondes',
  docs: [{ title: 'Votre proposition de prix', sub: 'Établie par vous, relue avec notre équipe' }, { title: 'Présentation de l’entreprise', sub: 'Références, assurances, Kbis : la base est préremplie' }],
  who: [['Présentation de votre entreprise au donneur d’ordre', 'Nous'], ['Appui de votre dossier auprès du donneur d’ordre', 'Nous'], ['Visite du site', 'Vous'],
    ['Votre proposition de prix', 'Vous'], ['Assurances (RC pro, décennale) et Kbis', 'Vous'], ['Négociation des conditions (prix, délais, paiement)', 'Ensemble'], ['Note méthodologique, si elle est demandée', 'Nous (avec la formule)']],
  withElena: ['Vos atouts et vos points faibles sur cette consultation', 'Comment nous présentons votre entreprise au donneur d’ordre', 'Ce qu’il faut joindre à votre proposition, et dans quel ordre'],
  helpLine: 'Marchés Direct présente votre entreprise au donneur d’ordre, appuie votre dossier et vous aide à négocier : c’est l’objet de nos formules d’accompagnement, présentées pendant l’échange.',
  daysAfter: 'Nous présentons votre entreprise au donneur d’ordre ; vous préparez votre proposition de prix',
  validate: 'Vous relisez votre proposition et la présentation', submit: 'Envoi de votre proposition au donneur d’ordre',
  rushIssue: d => `le délai : on présente votre entreprise et on prépare votre proposition avec vous pour tenir le ${d}`,
};

const SUBCONTRACTING: JourneyCopy = {
  noun: 'cette mission', nounBare: 'mission', feminine: true, giver: 'Entreprise principale', giverAddress: 'Adresse de l’entreprise principale',
  notice: 'Annonce de la mission', noticeSub: 'Le descriptif détaillé est transmis par l’entreprise principale', officialLink: 'Voir l’annonce',
  detailTitle: 'La mission en détail', summaryTitle: 'La mission en 30 secondes',
  docs: [{ title: 'Votre proposition de prix', sub: 'Établie par vous, à partir du descriptif de l’entreprise principale' }, { title: 'Pièces du sous-traitant', sub: 'Kbis, attestation de vigilance URSSAF, assurances' }],
  who: [['Mise en relation avec l’entreprise principale', 'Nous'], ['Présentation de votre entreprise et appui de votre dossier', 'Nous'], ['Votre proposition de prix', 'Vous'],
    ['Kbis, attestation de vigilance URSSAF, assurances', 'Vous'], ['Négociation des conditions et mise en place du contrat', 'Ensemble'], ['Acceptation par le maître d’ouvrage', 'Entreprise principale']],
  withElena: ['Vos atouts et vos points faibles sur cette mission', 'Comment nous vous présentons à l’entreprise principale', 'Vos garanties de paiement et ce que doit prévoir le contrat'],
  helpLine: 'Marchés Direct vous met en relation avec l’entreprise principale, présente votre entreprise, appuie votre dossier et négocie avec vous les conditions : c’est l’objet de nos formules d’accompagnement, présentées pendant l’échange.',
  daysAfter: 'Mise en relation avec l’entreprise principale ; vous préparez votre proposition de prix',
  validate: 'Vous relisez votre proposition et les conditions du contrat', submit: 'Envoi de votre proposition à l’entreprise principale',
  rushIssue: d => `le délai : on vous présente à l’entreprise principale et on prépare les pièces avec vous pour tenir le ${d}`,
};

export const journeyCopy = (j: string | null | undefined): JourneyCopy => j === 'tender' ? TENDER : j === 'subcontracting' ? SUBCONTRACTING : PUBLIC;
export const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
