import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'pieces-attributaire',
  category: 'Documents',
  title: 'Vous êtes retenu : les attestations à fournir avant de signer',
  metaTitle: 'Marché public : les attestations à fournir si retenu',
  description: 'Attestation fiscale, attestation de vigilance Urssaf, Kbis, salariés étrangers, DC4, assurance : les pièces à remettre puis à renouveler tous les 6 mois.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 8,
  summary: [
    'Les justificatifs officiels ne sont demandés qu’au **candidat que l’acheteur envisage de retenir**, dans un délai qu’il fixe.',
    'Les deux pièces clés : l’**attestation de régularité fiscale** (impots.gouv) et l’**attestation de vigilance** de l’Urssaf, datée de moins de six mois.',
    'Si vous ne fournissez pas les pièces à temps, **votre offre est rejetée** et l’acheteur se tourne vers le candidat classé juste après vous.',
    'Pendant l’exécution, pour un marché d’au moins 5 000 € HT, l’attestation de vigilance doit être **renouvelée tous les six mois** jusqu’à la fin du marché.',
  ],
  sections: [
    {
      id: 'quand',
      h2: 'Quand et comment l’acheteur vous les demande',
      blocks: [
        { p: 'À la candidature, vous avez seulement déclaré sur l’honneur que vous êtes à jour de vos obligations. Une fois les offres classées, l’acheteur demande les preuves **au seul candidat auquel il envisage d’attribuer le marché** (article R2144-4 du code de la commande publique).' },
        { p: 'La demande arrive en général par la plateforme ou par courrier électronique. Elle indique la liste des pièces et un **délai** pour les remettre. Ce délai est souvent court : quelques jours.' },
        { note: 'Si vous ne remettez pas les pièces dans le délai, votre candidature devient irrecevable et votre offre est rejetée. L’acheteur demande alors les pièces au candidat suivant. C’est une façon très bête de perdre un marché gagné : préparez vos attestations **dès le dépôt de l’offre**.' },
        { p: 'Bonne nouvelle : si vous avez candidaté avec le **service DUME de Chorus Pro**, vous n’avez pas à transmettre l’attestation de régularité fiscale ni l’attestation de vigilance. De même, vous n’avez pas à refournir un document que l’acheteur peut obtenir gratuitement en ligne ou que vous lui avez déjà remis et qui est toujours valable. Voir [DC1, DC2 et DUME](/guides/dc1-dc2-dume).' },
      ],
    },
    {
      id: 'fiscale',
      h2: 'L’attestation de régularité fiscale',
      blocks: [
        { p: 'Elle prouve que vous avez déclaré et payé vos impôts : impôt sur les sociétés ou impôt sur le revenu, et TVA. Elle reflète votre situation au dernier jour du mois précédant la demande.' },
        { ul: [
          '**Entreprise à l’impôt sur les sociétés** : téléchargez-la dans votre espace professionnel sur impots.gouv.fr, rubrique « Consulter mon compte fiscal », puis « Attestation fiscale ». Le document comporte un numéro qui permet à l’acheteur de vérifier son authenticité.',
          '**Entreprise individuelle à l’impôt sur le revenu** : utilisez le formulaire n° 3666-SD. Le feuillet 1 est envoyé au service des impôts des entreprises (SIE), le feuillet 2 au service des impôts des particuliers (SIP).',
          '**Entreprise nouvelle** : l’attestation en ligne n’est pas disponible ; passez aussi par le formulaire n° 3666-SD.',
          '**Filiale d’un groupe** : deux attestations peuvent être nécessaires, celle de la filiale et celle de la société mère.',
        ] },
        { p: 'Vous avez un plan de règlement accordé par l’administration et vous le respectez ? Une attestation peut quand même être délivrée.' },
      ],
    },
    {
      id: 'vigilance',
      h2: 'L’attestation de vigilance Urssaf',
      blocks: [
        { p: 'Délivrée par l’Urssaf, elle prouve que vous êtes à jour de vos déclarations et du paiement de vos cotisations sociales. Elle doit avoir **moins de six mois** et se télécharge depuis votre espace en ligne.' },
        { p: 'Vous êtes considéré comme à jour si vous avez payé vos cotisations à l’échéance, si vous respectez un plan d’apurement, ou si vous contestez les sommes devant le juge. Une entreprise en cours de création ne reçoit qu’une attestation provisoire.' },
        { p: 'L’acheteur doit vérifier l’**authenticité** de l’attestation auprès de l’Urssaf. Ne la modifiez jamais et transmettez le fichier d’origine.' },
      ],
    },
    {
      id: 'autres-pieces',
      h2: 'Kbis, salariés étrangers, sous-traitants, assurance',
      blocks: [
        { h3: 'Le justificatif d’immatriculation' },
        { p: 'Si vous êtes immatriculé au registre du commerce et des sociétés ou au Registre national des entreprises, l’acheteur doit obtenir un justificatif de votre immatriculation (article D8222-5 du code du travail). Ce peut être un **extrait Kbis**, un extrait d’immatriculation au registre des métiers, ou un document professionnel (devis, courrier) portant vos informations d’identification.' },
        { h3: 'La liste des salariés étrangers' },
        { p: 'Si vous employez des salariés étrangers soumis à autorisation de travail, vous remettez à la conclusion du contrat une **liste nominative** tirée du registre unique du personnel (article D8254-2 du code du travail). Elle indique pour chacun : la date d’embauche, la nationalité, le type et le numéro du titre valant autorisation de travail.' },
        { h3: 'Les sous-traitants' },
        { p: 'Si vous sous-traitez une partie du marché, chaque sous-traitant doit être déclaré, en général avec un **formulaire DC4** par sous-traitant, et accepté par l’acheteur. Dans ce formulaire, le sous-traitant déclare lui aussi ne pas être exclu des marchés publics. Voir [sous-traitance, DC4 et paiement direct](/guides/sous-traitance-dc4-paiement-direct).' },
        { h3: 'Les attestations d’assurance' },
        { p: 'Pour les travaux, l’acheteur demande en pratique l’attestation d’**assurance responsabilité décennale** en cours de validité, souvent avec celle de responsabilité civile professionnelle. Vérifiez que les activités assurées couvrent bien les travaux du marché.' },
        { p: 'Le RC ou la demande de l’acheteur peut enfin exiger d’autres pièces : certificats de qualification, pouvoir du signataire, acte d’engagement signé. Lisez la liste en entier.' },
      ],
    },
    {
      id: 'tous-les-six-mois',
      h2: 'Pendant le marché : tous les six mois',
      blocks: [
        { p: 'Les vérifications ne s’arrêtent pas à la signature. Pour un contrat d’au moins **5 000 € HT**, le donneur d’ordre, ici l’acheteur public, doit se faire remettre vos justificatifs **à la signature, puis tous les six mois jusqu’à la fin de l’exécution** (articles L8222-1 et D8222-5 du code du travail) :' },
        { ul: [
          'une **attestation de vigilance** de moins de six mois ;',
          'le **justificatif d’immatriculation** (Kbis ou équivalent) ;',
          'la **liste des salariés étrangers** soumis à autorisation de travail, le cas échéant (article D8254-4 du code du travail).',
        ] },
        { p: 'Répondez sans attendre aux demandes et relances de l’acheteur : il est tenu de faire ces vérifications pendant toute la durée du marché.' },
        { note: 'Notez dans votre agenda la date d’expiration de chaque attestation de vigilance et demandez la nouvelle **avant** l’expiration de la précédente.' },
      ],
    },
    {
      id: 'check-list',
      h2: 'La check-list à préparer dès le dépôt de l’offre',
      blocks: [
        { table: { head: ['Pièce', 'Où l’obtenir', 'À surveiller'], rows: [
          ['Attestation de régularité fiscale', 'Espace professionnel impots.gouv.fr ou formulaire n° 3666-SD', 'Situation à la fin du mois précédent'],
          ['Attestation de vigilance', 'Votre espace en ligne Urssaf', 'Moins de 6 mois, à renouveler'],
          ['Extrait Kbis ou équivalent', 'Greffe, registre des métiers ou guichet officiel', 'Document récent'],
          ['Liste des salariés étrangers', 'Votre registre unique du personnel', 'Si vous en employez'],
          ['DC4 par sous-traitant', 'Modèle du ministère de l’Économie', 'Signé et accepté par l’acheteur'],
          ['Attestations d’assurance', 'Votre assureur', 'Activités couvertes et dates de validité'],
        ] } },
        { p: 'Rangez ces documents dans un dossier unique et mettez-les à jour chaque mois. Vous pourrez répondre à n’importe quelle demande dans la journée.' },
      ],
    },
  ],
  faq: [
    { q: 'Combien de temps ai-je pour fournir les attestations ?', a: 'C’est l’acheteur qui fixe le délai dans sa demande. Il est souvent court. Si vous dépassez ce délai, votre offre est rejetée et le marché peut être attribué au candidat suivant.' },
    { q: 'Je ne suis pas à jour de mes cotisations : que faire ?', a: 'Contactez rapidement l’Urssaf. Si vous obtenez un plan d’apurement et que vous le respectez, vous êtes considéré comme à jour et vous pouvez obtenir l’attestation de vigilance.' },
    { q: 'Quelle différence entre attestation de vigilance et attestation de régularité fiscale ?', a: 'La première, délivrée par l’Urssaf, concerne vos cotisations sociales. La seconde, délivrée par l’administration fiscale, concerne vos impôts et la TVA. Les deux sont demandées au candidat retenu.' },
    { q: 'Dois-je fournir ces pièces si je les ai déjà données au même acheteur ?', a: 'Non, si elles sont toujours valables : c’est le principe « Dites-le nous une fois ». Indiquez précisément à quelle occasion vous les avez transmises. Attention, une attestation de vigilance de plus de six mois n’est plus valable.' },
    { q: 'Peut-on m’aider à rassembler les pièces ?', a: 'Oui. Sur Marchés Direct, Elena peut vous accompagner ; les attestations restent à demander par vous auprès des administrations.' },
  ],
  // Vérifié le 6 nov. 2026 : R2144-4 et R2144-7 CCP (F23384, vérifiée le 17 juill. 2026) ; L8222-1, D8222-5 (attestation à la
  // signature puis tous les 6 mois ; RCS ou Registre national des entreprises) ; D8254-2 et D8254-4 C. trav. ; seuil 5 000 € HT.
  sources: [
    { label: 'Entreprendre.Service-Public — Attestations de régularité fiscale et de vigilance pour un marché public', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F23384' },
    { label: 'Code du travail numérique — Article D8254-2 (liste des salariés étrangers)', url: 'https://code.travail.gouv.fr/code-du-travail/d8254-2' },
    { label: 'Entreprendre.Service-Public — Répondre au marché : préparer le dossier de candidature', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F32144' },
  ],
  related: ['dc1-dc2-dume', 'sous-traitance-dc4-paiement-direct', 'repondre-marche-public-artisan'],
};
export default guide;
