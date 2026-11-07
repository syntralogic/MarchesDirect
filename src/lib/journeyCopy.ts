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
  helpLine: string;                                 // l'accompagnement sur devis, en une phrase
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
    ['Formulaires de candidature', 'Nous (sur devis)'], ['Mémoire technique', 'Nous (sur devis)'], ['Offre de prix', 'Ensemble'], ['Dépôt de la candidature', 'Nous (sur devis)']],
  withElena: ['Vos atouts et vos points faibles sur ce marché', 'Ce qu’il faut fournir, écrire, et dans quel ordre', 'Qui fait quoi si vous décidez d’y aller : vous, nous, ensemble'],
  helpLine: 'Si vous souhaitez préparer votre candidature avec nous (mémoire technique, formulaires, dépôt) : accompagnement sur devis, présenté pendant l’échange.',
  daysAfter: 'Si vous nous confiez la candidature (sur devis) : vous envoyez vos pièces, nous rédigeons le mémoire',
  validate: 'Vous validez la candidature', submit: 'Dépôt de la candidature (par nous si vous nous l’avez confiée, sinon par vous)',
  rushIssue: d => `le délai : on prépare le mémoire technique avec vous pour tenir le ${d}`,
};

const TENDER: JourneyCopy = {
  noun: 'cette consultation', nounBare: 'consultation', feminine: true, giver: 'Donneur d’ordre', giverAddress: 'Adresse du donneur d’ordre',
  notice: 'Annonce de la consultation', noticeSub: 'Le cahier des charges est transmis par le donneur d’ordre', officialLink: 'Voir l’annonce',
  detailTitle: 'La consultation en détail', summaryTitle: 'La consultation en 30 secondes',
  docs: [{ title: 'Devis détaillé', sub: 'Établi par vous, relu avec notre équipe si vous le souhaitez' }, { title: 'Présentation de l’entreprise', sub: 'Références, assurances, Kbis : la base est préremplie' }],
  who: [['Visite du site et questions au donneur d’ordre', 'Vous'], ['Devis détaillé', 'Vous'], ['Assurances (RC pro, décennale) et Kbis', 'Vous'],
    ['Présentation de l’entreprise', 'Ensemble'], ['Note méthodologique, si elle est demandée', 'Nous (sur devis)'], ['Envoi de la proposition', 'Vous']],
  withElena: ['Vos atouts et vos points faibles sur cette consultation', 'Les questions à poser au donneur d’ordre avant de chiffrer', 'Ce qu’il faut joindre au devis, et dans quel ordre'],
  helpLine: 'Si vous souhaitez préparer votre réponse avec nous (présentation, note méthodologique, relecture du devis) : accompagnement sur devis, présenté pendant l’échange.',
  daysAfter: 'Visite du site et questions au donneur d’ordre, puis chiffrage du devis',
  validate: 'Vous relisez le devis et la présentation', submit: 'Envoi de votre proposition au donneur d’ordre',
  rushIssue: d => `le délai : on prépare avec vous la présentation et le devis pour tenir le ${d}`,
};

const SUBCONTRACTING: JourneyCopy = {
  noun: 'cette mission', nounBare: 'mission', feminine: true, giver: 'Entreprise principale', giverAddress: 'Adresse de l’entreprise principale',
  notice: 'Annonce de la mission', noticeSub: 'Le descriptif détaillé est transmis par l’entreprise principale', officialLink: 'Voir l’annonce',
  detailTitle: 'La mission en détail', summaryTitle: 'La mission en 30 secondes',
  docs: [{ title: 'Devis de la prestation', sub: 'Établi par vous, à partir du descriptif de l’entreprise principale' }, { title: 'Pièces du sous-traitant', sub: 'Kbis, attestation de vigilance URSSAF, assurances' }],
  who: [['Questions à l’entreprise principale (dates, interfaces, fournitures)', 'Vous'], ['Devis de la prestation', 'Vous'],
    ['Kbis, attestation de vigilance URSSAF, assurances', 'Vous'], ['Relecture du contrat de sous-traitance', 'Nous (sur devis)'], ['Acceptation par le maître d’ouvrage', 'Entreprise principale']],
  withElena: ['Vos atouts et vos points faibles sur cette mission', 'Les questions à poser à l’entreprise principale avant de chiffrer', 'Vos garanties de paiement et ce que doit prévoir le contrat'],
  helpLine: 'Si vous souhaitez être accompagné (relecture du devis et du contrat de sous-traitance) : accompagnement sur devis, présenté pendant l’échange.',
  daysAfter: 'Questions à l’entreprise principale, puis chiffrage du devis',
  validate: 'Vous relisez le devis et le projet de contrat', submit: 'Envoi de votre devis à l’entreprise principale',
  rushIssue: d => `le délai : on prépare avec vous le devis et les pièces pour tenir le ${d}`,
};

export const journeyCopy = (j: string | null | undefined): JourneyCopy => j === 'tender' ? TENDER : j === 'subcontracting' ? SUBCONTRACTING : PUBLIC;
export const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
