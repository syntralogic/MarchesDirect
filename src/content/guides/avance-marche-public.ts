import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'avance-marche-public',
  category: 'Argent et paiement',
  title: 'L’avance dans un marché public : combien, quand et comment l’obtenir',
  metaTitle: 'Avance marché public : taux, conditions et remboursement',
  description: 'Avance obligatoire au-delà de 50 000 € HT et 2 mois, taux de 5 % à 30 % pour les PME, garantie, remboursement : ce que l’artisan doit savoir.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 8,
  summary: [
    'L’avance est une somme versée **avant** que vous ayez commencé le travail. Elle est **obligatoire** quand le marché dépasse **50 000 € HT** et dure **plus de deux mois**.',
    'Le taux minimal est de **5 %** du montant TTC. Si vous êtes une **PME**, il monte à **30 %** pour les marchés de l’État et à **10 %** pour les grandes collectivités et grands établissements publics de l’État.',
    'Vous n’avez pas de démarche compliquée à faire : l’avance est prévue au marché. Vous pouvez en revanche y **renoncer**, par exemple sur le formulaire ATTRI1.',
    'L’avance se **rembourse** petit à petit, par retenue sur vos factures suivantes, selon les règles fixées dans le marché.',
  ],
  sections: [
    {
      id: 'definition',
      h2: 'L’avance, c’est quoi exactement ?',
      blocks: [
        { p: 'Dans un marché public, l’acheteur paie en principe **après** l’exécution du travail : c’est le principe du « service fait ». L’avance est l’exception. C’est un versement fait au début du marché, avant toute prestation, pour vous aider à financer le démarrage : achat de matériaux, location de matériel, premiers salaires.' },
        { p: 'Il ne faut pas la confondre avec l’**acompte**. L’acompte paie une partie du travail déjà réalisé (par exemple chaque mois, selon l’avancement du chantier). L’avance, elle, est versée sans contrepartie immédiate, puis elle est remboursée au fil des paiements.' },
        { note: 'L’avance n’est pas une aide ni un cadeau : c’est une **trésorerie anticipée**. Vous la rendez progressivement, par déduction sur vos factures. Mais elle ne coûte rien : ce n’est pas un prêt avec intérêts.' },
      ],
    },
    {
      id: 'quand-obligatoire',
      h2: 'Quand l’avance est-elle obligatoire ?',
      blocks: [
        { p: 'Le code de la commande publique (article R2191-3) oblige l’acheteur à prévoir une avance quand **deux conditions** sont réunies en même temps :' },
        { ul: [
          'le montant initial du marché est **supérieur à 50 000 € HT** ;',
          'le délai d’exécution est **supérieur à deux mois**.',
        ] },
        { p: 'Ces seuils sont stricts : un marché de 50 000 € HT tout pile, ou d’une durée de deux mois exactement, n’ouvre pas droit à l’avance obligatoire. En dessous, l’acheteur **peut** quand même prévoir une avance s’il le souhaite : lisez le cahier des clauses administratives particulières (CCAP).' },
        { p: 'Quelques cas particuliers :' },
        { ul: [
          '**Marché à tranches** : une avance est due pour chaque tranche affermie qui remplit les conditions.',
          '**Marché reconductible** : une avance est due pour chaque période de reconduction qui remplit les conditions.',
          '**Accord-cadre à bons de commande sans minimum** : l’avance est calculée bon de commande par bon de commande, pour ceux qui dépassent les seuils.',
          '**Sous-traitant payé directement** par l’acheteur : il peut demander lui aussi une avance sur la part qu’il réalise, si le titulaire y a droit.',
        ] },
      ],
    },
    {
      id: 'combien',
      h2: 'Combien allez-vous toucher ?',
      blocks: [
        { p: 'Pour un marché d’**un an ou moins**, l’avance est comprise entre **5 % et 30 %** du montant initial **TTC** du marché. Le minimum de 5 % est relevé pour les PME selon l’acheteur (article R2191-7) :' },
        { table: {
          head: ['Qui est l’acheteur ?', 'Taux minimal si vous êtes une PME', 'Taux minimal sinon'],
          rows: [
            ['L’État (ministères, préfectures, services déconcentrés)', '**30 %**', '5 %'],
            ['Collectivités territoriales, leurs groupements et établissements publics dont les dépenses réelles de fonctionnement dépassent **60 millions d’euros**', '**10 %**', '5 %'],
            ['Établissements publics administratifs de l’État (hors hôpitaux) dont les dépenses de fonctionnement dépassent **60 millions d’euros**', '**10 %**', '5 %'],
            ['Autres acheteurs (petites et moyennes communes, hôpitaux, etc.)', '5 %', '5 %'],
          ],
        } },
        { p: 'Ce sont des **minimums** : l’acheteur peut prévoir plus, et même dépasser 30 %. Le taux exact figure dans le CCAP ou l’acte d’engagement. Attention : une fois le marché signé, ce taux ne peut plus être modifié.' },
        { h3: 'Si le marché dure plus d’un an' },
        { p: 'Le calcul se fait sur une base ramenée à douze mois : **12 × montant TTC ÷ durée en mois**. On applique ensuite le taux à ce résultat.' },
        { p: '**Exemple.** Un marché de travaux de 240 000 € HT, soit 288 000 € TTC avec une TVA à 20 %, sur 24 mois, passé par une petite commune. Base : 12 × 288 000 ÷ 24 = 144 000 €. Avance minimale à 5 % : **7 200 €**. Le même marché passé par l’État avec une PME, au taux minimal de 30 % : 43 200 €.' },
        { note: 'Si vous sous-traitez une partie du marché à un sous-traitant payé directement, le montant pris en compte pour votre avance est diminué de la part sous-traitée.' },
      ],
    },
    {
      id: 'comment-obtenir',
      h2: 'Comment obtenir l’avance, et quand est-elle payée ?',
      blocks: [
        { p: 'Bonne nouvelle : quand l’avance est obligatoire, **vous n’avez pas à la réclamer**. Elle est prévue par le marché et elle vous est due dès sa notification. En pratique :' },
        { ol: [
          'Vérifiez dans le CCAP le taux et les conditions de versement (garantie éventuelle, point de départ).',
          'Au moment de l’attribution, ne cochez pas la case de renonciation sur le formulaire ATTRI1 (acte d’engagement), sauf si vous ne voulez vraiment pas d’avance.',
          'Si une garantie est exigée, faites-la établir rapidement par votre banque et transmettez-la à l’acheteur.',
          'Déposez la demande de paiement de l’avance sur [Chorus Pro](/guides/delais-paiement-marches-publics) si l’acheteur le demande, comme pour une facture.',
        ] },
        { p: 'Le délai de paiement de l’avance court à partir de la **notification du marché** (ou de l’acte qui autorise le démarrage des prestations, si le marché le prévoit). Si une garantie est exigée, il ne commence qu’à la **réception de cette garantie**. Le délai est ensuite le même que pour une facture : 30 jours pour la plupart des acheteurs publics.' },
        { p: 'Vous pouvez **refuser** l’avance, même quand elle est obligatoire. Selon la direction des affaires juridiques du ministère de l’Économie, une entreprise qui a renoncé peut ensuite revenir sur sa décision, aux conditions prévues au marché.' },
      ],
    },
    {
      id: 'garantie',
      h2: 'L’acheteur peut-il exiger une garantie ?',
      blocks: [
        { p: 'Cela dépend du montant de l’avance et de l’acheteur :' },
        { ul: [
          '**Avance de plus de 30 %** : l’acheteur peut demander une **garantie à première demande** (un engagement de votre banque de rembourser l’avance si vous ne le faites pas).',
          '**Collectivités territoriales et leurs établissements** : elles peuvent exiger cette garantie **quel que soit le montant** de l’avance, pour tout ou partie de celle-ci.',
          '**Caution personnelle et solidaire** : si l’acheteur est d’accord, elle peut remplacer la garantie à première demande.',
        ] },
        { p: 'Une garantie bancaire a un coût (frais de dossier, commission). Demandez un devis à votre banque **avant** de remettre votre offre, pour l’intégrer à votre calcul de prix.' },
        { note: 'Une proposition de loi « visant à simplifier la gestion de la commande publique », adoptée par l’Assemblée nationale en avril 2026, prévoit notamment de relever le taux minimal d’avance des PME et de limiter la garantie aux avances qui dépassent ce taux. Tant qu’elle n’est pas publiée au Journal officiel, ce sont les règles ci-dessus qui s’appliquent.' },
      ],
    },
    {
      id: 'remboursement',
      h2: 'Comment l’avance est-elle remboursée ?',
      blocks: [
        { p: 'Vous ne faites aucun virement. Le remboursement se fait par **précompte** : l’acheteur retient une partie de l’avance sur chacun de vos paiements suivants (acomptes, solde).' },
        { p: 'Le rythme est fixé par le marché. Quand le marché ne dit rien, le code prévoit, pour les consultations lancées depuis le 1er janvier 2026 :' },
        { ul: [
          'avance **jusqu’à 30 %** du montant TTC : le remboursement commence quand les prestations réalisées atteignent **65 %** du montant TTC de votre part du marché ;',
          'avance **de plus de 30 %** : le remboursement commence dès votre **première demande de paiement**.',
        ] },
        { p: 'La limite de fin de remboursement est fixée dans les pièces du marché. Anticipez ce moment dans votre trésorerie : vos derniers acomptes seront plus faibles, puisqu’une partie servira à rembourser l’avance.' },
      ],
    },
  ],
  faq: [
    { q: 'Je suis auto-entrepreneur, ai-je droit à l’avance ?', a: 'Oui, si le marché dépasse 50 000 € HT et dure plus de deux mois. Une micro-entreprise est une PME au sens du code : vous bénéficiez donc aussi des taux minimaux majorés quand l’acheteur est l’État ou une grande collectivité.' },
    { q: 'L’avance est-elle calculée sur le montant HT ou TTC ?', a: 'Sur le montant initial **TTC** du marché, ramené à douze mois si le marché dure plus d’un an. Les seuils qui rendent l’avance obligatoire (50 000 €), eux, s’apprécient en HT.' },
    { q: 'Comment savoir si une collectivité dépasse 60 millions d’euros de dépenses ?', a: 'Le seuil porte sur les dépenses réelles de fonctionnement du budget principal de l’avant-dernier exercice. Il concerne surtout les grandes villes, départements, régions et grandes intercommunalités. En cas de doute, posez la question à l’acheteur pendant la consultation ou lisez le CCAP, qui indique le taux appliqué.' },
    { q: 'L’acheteur ne verse pas l’avance, que faire ?', a: 'Le retard de paiement de l’avance fait courir des intérêts moratoires, comme pour une facture. Relancez l’acheteur par écrit en rappelant la date de notification du marché. Vous pouvez aussi nous poser votre question sur [la page dédiée](/question) : Elena peut vous aider à préparer votre relance.' },
  ],
  // Vérifié le 6 nov. 2026 : R2191-3, R2191-5, R2191-7 (décret n° 2024-1251), R2191-8, R2191-11 (décret n° 2025-1383, consultations à partir du 1er janv. 2026), R2192-24 et R2192-25.
  // Droit en vigueur confirmé par le rapport AN n° 2605 du 30 mars 2026 (30 % État, 10 % au-delà de 60 M€) ; PPL n° 2491 non définitive à notre connaissance.
  sources: [
    { label: 'Direction des affaires juridiques (ministère de l’Économie) — Fiche technique « Les avances »', url: 'https://www.economie.gouv.fr/files/files/directions_services/daj/media-document/FT54_Les_avances.pdf' },
    { label: 'Assemblée nationale — Rapport n° 2605 sur la proposition de loi visant à simplifier la gestion de la commande publique (mars 2026)', url: 'https://www.assemblee-nationale.fr/dyn/17/rapports/cion_lois/l17b2605_rapport-fond.pdf' },
  ],
  related: ['delais-paiement-marches-publics', 'retenue-de-garantie', 'sous-traitance-dc4-paiement-direct'],
};
export default guide;
