import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'lire-avis-dce',
  category: 'Répondre',
  title: 'Lire un avis de marché et un dossier de consultation (DCE) sans rien rater',
  metaTitle: 'Lire un avis de marché et un DCE : RC, CCAP, CCTP, BPU',
  description: 'Avis de marché, RC, CCAP, CCTP, acte d’engagement, BPU, DQE, DPGF : ce qu’il faut lire, dans quel ordre, et les pièges du dépôt en ligne.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 9,
  summary: [
    'L’**avis de marché** sert à décider si la consultation vous intéresse ; le **dossier de consultation (DCE)** sert à construire votre réponse.',
    'Lisez d’abord le **règlement de la consultation** (RC) : il dit quoi fournir, comment l’offre sera notée et comment déposer.',
    'Les questions se posent **par écrit, sur la plateforme de l’acheteur**, avant la date limite fixée par le RC : la réponse est envoyée à tous les candidats.',
    'Une offre reçue après la date et l’heure limites est **éliminée**. Déposez en avance.',
    'La signature n’est en général pas exigée au dépôt, sauf si le DCE le demande ; l’entreprise retenue signe son offre avant la notification.',
  ],
  sections: [
    {
      id: 'avis',
      h2: 'L’avis de marché : décider en cinq minutes',
      blocks: [
        { p: 'L’avis de marché est l’annonce publiée au BOAMP, dans un journal d’annonces légales, au Journal officiel de l’Union européenne ou sur le site de l’acheteur. Au-delà de 90 000 € HT, il suit un modèle national, avec des rubriques toujours au même endroit. Repérez :' },
        { ul: [
          '**L’acheteur** : qui achète, et ses coordonnées.',
          '**L’objet et le type de marché** : travaux, fournitures ou services, avec une description courte et souvent un code CPV (la nomenclature européenne des achats).',
          '**Le lieu d’exécution** et la **durée** ou le délai d’exécution.',
          '**Les lots** : le marché est-il découpé, et pouvez-vous répondre à un seul lot ?',
          '**La procédure** : procédure adaptée, appel d’offres, procédure avec négociation…',
          '**Les conditions de participation** : capacités, qualifications ou références demandées.',
          '**Les critères d’attribution**, parfois renvoyés au règlement de la consultation.',
          '**La date et l’heure limites** de réception des offres.',
          '**L’adresse du profil d’acheteur**, où l’on télécharge le dossier et où l’on dépose la réponse.',
        ] },
        { p: 'Si l’objet, la zone, la taille et le délai vous conviennent, téléchargez le dossier complet. Pour faire ce tri, voir notre guide [où trouver les appels d’offres et lesquels viser](/guides/trouver-appels-offres).' },
      ],
    },
    {
      id: 'pieces-dce',
      h2: 'Les pièces du DCE et ce qu’elles contiennent',
      blocks: [
        { p: 'Le dossier de consultation des entreprises (DCE) regroupe tous les documents de la consultation. Sa composition varie, mais on retrouve presque toujours les pièces suivantes.' },
        { table: { head: ['Pièce', 'À quoi elle sert', 'Ce que vous en faites'], rows: [
          ['**RC** — règlement de la consultation', 'Règles du jeu : contenu de la candidature et de l’offre, critères et pondération, date limite, visite, variantes, mode de dépôt.', 'À lire en premier, en entier.'],
          ['**AE** — acte d’engagement (souvent le formulaire ATTRI1, ex-DC3)', 'Document par lequel vous vous engagez sur votre offre et votre prix.', 'À remplir ; il sera signé par l’entreprise retenue.'],
          ['**CCAP** — cahier des clauses administratives particulières', 'Règles du contrat : prix, délais, pénalités, avance, retenue de garantie, révision des prix, paiement, pièces contractuelles et leur ordre de priorité. Il renvoie souvent à un CCAG (cahier des clauses administratives générales).', 'À lire avant de chiffrer : pénalités et délais pèsent sur votre prix.'],
          ['**CCTP** — cahier des clauses techniques particulières', 'Description technique de ce qu’il faut réaliser : matériaux, normes, performances, limites de prestation.', 'Base de votre chiffrage et de votre mémoire technique.'],
          ['**BPU** — bordereau des prix unitaires', 'Liste des prestations avec un prix unitaire à indiquer.', 'Prix par unité (m², heure, pièce) qui servira à payer les quantités réellement exécutées.'],
          ['**DQE** — détail quantitatif estimatif', 'Quantités estimées pour chaque prix du BPU.', 'Sert à comparer les offres ; reportez exactement vos prix du BPU.'],
          ['**DPGF** — décomposition du prix global et forfaitaire', 'Détail d’un prix forfaitaire, poste par poste.', 'Vérifiez les quantités : c’est sur cette base que vous vous engagez sur un prix global.'],
        ] } },
        { p: 'S’y ajoutent souvent : plans, diagnostics (amiante, plomb), études, planning prévisionnel, cadre de mémoire technique à compléter, formulaires de candidature. Pour le mémoire, voir notre guide sur le [mémoire technique](/guides/memoire-technique) ; pour la candidature, celui sur les formulaires [DC1, DC2 et DUME](/guides/dc1-dc2-dume).' },
        { note: 'Vérifiez dès le téléchargement que **toutes les pièces listées** dans le RC sont bien dans le dossier, et qu’elles s’ouvrent. S’il en manque une, demandez-la tout de suite par la plateforme.' },
      ],
    },
    {
      id: 'ordre-lecture',
      h2: 'Dans quel ordre lire, et quoi noter',
      blocks: [
        { ol: [
          '**Le RC** : notez la date limite, la liste des pièces à fournir, les critères et sous-critères, la visite, l’autorisation ou non des variantes, la durée de validité des offres.',
          '**Le CCAP** : notez les délais d’exécution, les pénalités, la forme du prix (forfait ou prix unitaires, ferme ou révisable), l’avance, la retenue de garantie, les assurances exigées.',
          '**Le CCTP et les plans** : repérez les exigences inhabituelles, les marques imposées « ou équivalent », les prestations à votre charge en limite de lot.',
          '**Les cadres de prix** (BPU, DQE, DPGF) : vérifiez que chaque ligne correspond à quelque chose dans le CCTP.',
        ] },
        { p: 'Faites une liste de contrôle d’une page avec les pièces à rendre et les dates clés. C’est elle qui vous évitera d’oublier une pièce le jour du dépôt.' },
        { p: 'Points qui méritent une attention particulière : un délai d’exécution très court, des pénalités élevées, un prix ferme sur une longue durée (voir [révision des prix](/guides/revision-des-prix)), une [retenue de garantie](/guides/retenue-de-garantie), ou une contradiction entre deux pièces.' },
      ],
    },
    {
      id: 'questions-visite',
      h2: 'Poser ses questions et faire la visite',
      blocks: [
        { h3: 'Les questions à l’acheteur' },
        { p: 'Si une pièce est floue, incomplète ou contradictoire, posez la question **par écrit, sur le profil d’acheteur**, dans la rubrique prévue (« questions », « échanges »). Ne téléphonez pas pour obtenir une information que les autres n’auraient pas : la réponse doit être la même pour tous, et l’acheteur la transmet à l’ensemble des candidats.' },
        { ul: [
          'Respectez la **date limite des questions** indiquée dans le RC, souvent plusieurs jours avant la date de remise des offres.',
          'Une question précise appelle une réponse utile : citez la pièce, l’article ou la ligne concernée.',
          'Si l’acheteur ne répond pas à temps à une question posée en temps utile, ou s’il modifie le dossier de façon importante, il doit **reporter la date limite**.',
          'Lisez toutes les réponses publiées, y compris celles aux questions des autres : elles complètent le dossier.',
        ] },
        { h3: 'La visite obligatoire' },
        { p: 'Certains RC imposent une **visite des lieux** avant de remettre une offre. L’acheteur doit alors fixer un délai de réponse suffisant pour que toutes les entreprises puissent la faire. Le RC précise les dates ou la façon de prendre rendez-vous, et souvent qu’une **attestation de visite** doit être jointe à l’offre.' },
        { note: 'Quand la visite est obligatoire, ne pas la faire peut conduire à écarter votre offre : vérifiez dans le RC ce qu’il prévoit. Prenez rendez-vous dès le téléchargement du dossier, et profitez de la visite pour noter les accès, le stockage et les contraintes du site.' },
      ],
    },
    {
      id: 'depot-signature',
      h2: 'Le dépôt en ligne et la signature',
      blocks: [
        { p: 'La réponse se dépose en général **en ligne**, sur le profil d’acheteur, dans la consultation concernée. Quelques règles de prudence :' },
        { ul: [
          '**Déposez à l’avance** : l’envoi de fichiers lourds peut prendre du temps. Une offre reçue après la date et l’heure limites est éliminée, même pour quelques minutes.',
          '**Testez votre poste** : la plupart des plateformes proposent un test de configuration ; PLACE, la plateforme de l’État, propose aussi des consultations de test pour s’entraîner.',
          '**Respectez les formats** demandés par le RC (PDF, tableur pour les cadres de prix) et nommez clairement vos fichiers.',
          '**Gardez l’accusé de réception** que la plateforme délivre après le dépôt.',
          'Si le RC le prévoit, vous pouvez envoyer en parallèle une **copie de sauvegarde**, dans le délai et selon les modalités qu’il fixe.',
        ] },
        { p: 'La **signature** n’est en général pas exigée au moment du dépôt de la candidature et de l’offre, sauf si les documents de la consultation la demandent. En revanche, l’entreprise retenue est invitée à signer son offre avant la notification du marché. Si le DCE impose une signature électronique, il faut un certificat de signature : son obtention demande du temps, anticipez-la.' },
        { p: 'Une fois retenu, d’autres pièces vous seront demandées : voir notre guide sur les [attestations à fournir](/guides/pieces-attributaire).' },
      ],
    },
  ],
  faq: [
    { q: 'Quelle différence entre le CCAP et le CCTP ?', a: 'Le CCAP fixe les règles administratives et financières du contrat (prix, délais, pénalités, paiement). Le CCTP décrit la partie technique : ce qu’il faut réaliser et avec quel niveau de qualité.' },
    { q: 'Que faire si le BPU et le CCTP se contredisent ?', a: 'Posez la question par écrit sur la plateforme avant la date limite des questions. Le CCAP indique en général l’ordre de priorité des pièces contractuelles, qui s’applique en cas de contradiction.' },
    { q: 'Dois-je signer mon offre électroniquement pour la déposer ?', a: 'En général non, sauf si le règlement de la consultation l’exige. L’entreprise retenue signe son offre avant la notification ; le DCE peut imposer une signature électronique.' },
    { q: 'Je n’ai pas pu faire la visite obligatoire : puis-je quand même répondre ?', a: 'Lisez le règlement de la consultation : il dit si la visite conditionne la recevabilité de l’offre. En cas de doute, posez la question à l’acheteur par la plateforme. Sur Marchés Direct, vous pouvez aussi [poser votre question](/question) à Elena.' },
  ],
  // Vérifié le 6 nov. 2026 : R2131-12 (avis selon un modèle national à partir de 90 000 €), R2132-2 (adresse du profil d’acheteur dans
  // l’avis), R2151-3 (délai suffisant en cas de visite), R2151-4 (report de la date limite), R2151-5 (offres hors délai éliminées),
  // fiche DAJ dématérialisation (signature non exigée au dépôt sauf si le DCE la prévoit ; signature de l’attributaire avant notification),
  // arrêté du 22 mars 2019 (copie de sauvegarde).
  sources: [
    { label: 'Direction des affaires juridiques (ministère de l’Économie) — Dématérialisation de la commande publique', url: 'https://www.economie.gouv.fr/daj/commande-publique/dematerialisation-de-la-commande-publique' },
    { label: 'Légifrance — Articles R2151-1 à R2151-5 du code de la commande publique (délais de réception des offres)', url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000037730547/' },
    { label: 'Légifrance — Arrêté du 22 mars 2019 fixant les modalités de mise à disposition des documents de la consultation et de la copie de sauvegarde', url: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000038318503' },
    { label: 'PLACE — Plate-forme des achats de l’État', url: 'https://www.marches-publics.gouv.fr/' },
  ],
  related: ['trouver-appels-offres', 'memoire-technique', 'dc1-dc2-dume'],
};
export default guide;
