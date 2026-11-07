import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'procedure-adaptee-mapa',
  category: 'Comprendre les règles',
  title: 'Le marché à procédure adaptée (MAPA) : la porte d’entrée des petites entreprises',
  metaTitle: 'MAPA : comprendre le marché à procédure adaptée',
  description: 'Le MAPA est la procédure la plus courante pour les artisans et TPE. Seuils, publicité, négociation, critères : ce qu’il faut savoir pour y répondre.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 7,
  summary: [
    'Le MAPA concerne les marchés situés **entre les seuils de dispense** (60 000 € HT en fournitures et services, 100 000 € HT en travaux) **et les seuils européens** (de 140 000 € à 5 404 000 € HT selon les cas).',
    'L’acheteur fixe **librement** les règles du jeu : délai, pièces demandées, négociation. Tout est écrit dans le **règlement de la consultation** (RC).',
    'La négociation est possible si les documents la prévoient. Mais l’acheteur peut attribuer sur les **offres initiales** s’il s’est réservé cette possibilité : votre première offre doit donc être la bonne.',
    'Si votre offre est rejetée, demandez par écrit les motifs : l’acheteur doit répondre sous **15 jours**.',
  ],
  sections: [
    {
      id: 'definition',
      h2: 'Qu’est-ce qu’un MAPA ?',
      blocks: [
        { p: 'Un marché à procédure adaptée est un marché public dont l’acheteur définit lui-même les modalités de passation, au lieu de suivre une procédure entièrement encadrée par le code de la commande publique. Il doit seulement respecter les grands principes : **égalité de traitement** des candidats, **liberté d’accès** à la commande publique et **transparence**.' },
        { p: 'Pour une petite entreprise, c’est souvent le premier vrai marché public : les dossiers sont plus légers qu’en appel d’offres, les montants correspondent à la taille d’un artisan ou d’une TPE, et les acheteurs sont souvent locaux (communes, intercommunalités, collèges, bailleurs sociaux).' },
        { h3: 'Quand l’acheteur peut-il passer un MAPA ?' },
        { p: 'L’article R2123-1 du code de la commande publique prévoit principalement trois cas :' },
        { ul: [
          '**Le montant** : la valeur estimée du besoin est inférieure aux seuils européens, soit 140 000 € HT (fournitures et services de l’État), 216 000 € HT (fournitures et services des collectivités et autres pouvoirs adjudicateurs), 432 000 € HT (entités adjudicatrices) et 5 404 000 € HT (travaux) pour 2026-2027.',
          '**Les petits lots d’un grand marché** : dans un marché alloti qui dépasse les seuils européens, un lot peut être passé en MAPA s’il vaut moins de **80 000 € HT** (fournitures ou services) ou **1 million d’euros HT** (travaux), et si le total de ces lots ne dépasse pas **20 %** de la valeur de tous les lots.',
          '**Certains services**, quel que soit leur montant : services sociaux et autres services spécifiques, certains services juridiques.',
        ] },
        { p: 'Sous les seuils de dispense, l’acheteur n’a même pas besoin de mettre en concurrence. Le détail de tous ces montants est dans notre guide sur les [seuils des marchés publics](/guides/seuils-marches-publics).' },
      ],
    },
    {
      id: 'liberte',
      h2: 'La liberté de l’acheteur… et ce qu’elle change pour vous',
      blocks: [
        { p: 'L’acheteur détermine les modalités de la procédure en fonction de la nature et des caractéristiques du besoin, du nombre ou de la localisation des entreprises susceptibles de répondre et des circonstances de l’achat (article R2123-4). En pratique, deux MAPA peuvent fonctionner très différemment :' },
        { ul: [
          'une commune peut consulter trois entreprises locales par courriel pour refaire une toiture ;',
          'un département peut publier un avis au BOAMP, demander un mémoire technique détaillé et organiser une négociation en deux tours.',
        ] },
        { p: 'C’est pourquoi la première chose à faire est de **lire le règlement de la consultation** en entier. Il dit : ce qu’il faut fournir, la date et l’heure limites, s’il y aura une négociation, les critères de choix et leur poids, si les variantes sont autorisées, et s’il faut visiter le site.' },
        { note: 'Une règle annoncée dans le règlement de la consultation s’impose à l’acheteur comme aux candidats. Si le RC exige une pièce, son absence peut rendre votre offre irrégulière, même en MAPA.' },
      ],
    },
    {
      id: 'trouver',
      h2: 'Où sont publiés les MAPA',
      blocks: [
        { p: 'La publicité dépend du montant. Pour l’État, les collectivités territoriales et leurs établissements publics (article R2131-12) :' },
        { ul: [
          '**moins de 90 000 € HT** : publicité libre ou adaptée. L’avis peut n’être publié que sur le profil acheteur, sur le site de la collectivité ou dans la presse locale ;',
          '**à partir de 90 000 € HT** : avis obligatoire au **BOAMP** ou dans un **journal d’annonces légales**.',
        ] },
        { p: 'Les petits MAPA sont donc les plus difficiles à repérer : ils n’apparaissent pas forcément au BOAMP. Une veille sur les profils acheteurs de votre secteur géographique est indispensable. Voir aussi [où trouver les appels d’offres](/guides/trouver-appels-offres) et les [marchés publics ouverts](/marches-publics) près de chez vous.' },
      ],
    },
    {
      id: 'repondre',
      h2: 'Répondre à un MAPA : le dossier type',
      blocks: [
        { p: 'Une réponse comprend toujours deux parties : la **candidature** (qui vous êtes, vos capacités) et l’**offre** (ce que vous proposez et à quel prix).' },
        { ol: [
          '**Candidature** : formulaires DC1 et DC2 ou DUME, selon ce que demande l’acheteur, plus les pièces listées dans le RC (références, attestation d’assurance, qualifications). Voir notre guide [DC1, DC2 et DUME](/guides/dc1-dc2-dume).',
          '**Offre technique** : le [mémoire technique](/guides/memoire-technique) ou le cadre de réponse fourni par l’acheteur.',
          '**Offre financière** : le bordereau des prix unitaires (BPU), la décomposition du prix global et forfaitaire (DPGF) ou le devis, selon le modèle fourni.',
          '**Acte d’engagement** si le RC le demande dès le dépôt.',
        ] },
        { p: '**Le délai de réponse** n’est pas fixé en jours par le code pour un MAPA : l’acheteur doit le fixer en tenant compte de la complexité du marché et du temps nécessaire pour préparer une offre (article R2151-1). Il peut donc être court. Notez la date limite dès la lecture de l’avis.' },
        { p: '**Le dépôt** : au-delà de 60 000 € HT, la réponse se fait obligatoirement en ligne, sur le profil acheteur. Une réponse papier est alors irrecevable, et une offre arrivée après l’heure limite n’est pas examinée.' },
        { p: '**Les variantes** (une autre solution technique que celle du cahier des charges) sont en principe autorisées en MAPA, sauf si les documents de la consultation les interdisent. Vérifiez le RC.' },
      ],
    },
    {
      id: 'negociation',
      h2: 'La négociation : une chance, pas une garantie',
      blocks: [
        { p: 'En MAPA, l’acheteur peut prévoir une phase de négociation avec les candidats. Elle peut notamment porter sur le prix ou sur le contenu de l’offre, en traitant tous les candidats de la même façon. Les documents de la consultation indiquent si une négociation est prévue et comment elle se déroule.' },
        { p: 'Attention : lorsque l’acheteur prévoit une négociation, il peut quand même **attribuer le marché sur la base des offres initiales**, sans négocier, s’il a indiqué dans les documents de la consultation qu’il se réservait cette possibilité (article R2123-5).' },
        { ul: [
          'Ne gonflez pas votre première offre en comptant « lâcher » ensuite : il n’y aura peut-être pas de second tour.',
          'Si vous êtes invité à négocier, préparez-vous : quels postes pouvez-vous ajuster, et jusqu’où, sans travailler à perte ?',
          'Toute amélioration doit être confirmée **par écrit**, dans la forme et le délai demandés.',
        ] },
      ],
    },
    {
      id: 'choix',
      h2: 'Comment l’offre est choisie, et que faire si vous perdez',
      blocks: [
        { p: 'Même en MAPA, l’acheteur choisit l’**offre économiquement la plus avantageuse** à partir de critères annoncés dans les documents de la consultation : en général le prix et la valeur technique. Pour les consultations lancées depuis le 21 août 2026, les MAPA doivent comporter **au moins un critère environnemental** et une clause environnementale. Le fonctionnement des critères est détaillé dans notre guide sur les [critères d’attribution](/guides/criteres-attribution).' },
        { p: 'Si votre offre est rejetée, vous pouvez demander par écrit les motifs du rejet : l’acheteur doit vous les communiquer dans un délai de **15 jours** à compter de la réception de votre demande (article R2181-2). Demandez aussi vos notes par critère et celles de l’offre retenue : c’est le meilleur moyen de progresser à la consultation suivante.' },
        { note: 'Si vous pensez que la procédure a été irrégulière, les délais pour agir devant le juge sont courts. Faites-vous conseiller rapidement.' },
      ],
    },
  ],
  faq: [
    { q: 'Quel est le montant d’un MAPA ?', a: 'Entre le seuil de dispense (60 000 € HT pour les fournitures et services, 100 000 € HT pour les travaux) et les seuils européens : 140 000 €, 216 000 € ou 432 000 € HT pour les fournitures et services selon l’acheteur, 5 404 000 € HT pour les travaux en 2026-2027.' },
    { q: 'Un MAPA est-il toujours publié au BOAMP ?', a: 'Non. Pour l’État et les collectivités, l’avis au BOAMP ou dans un journal d’annonces légales n’est obligatoire qu’à partir de 90 000 € HT. En dessous, l’acheteur choisit librement sa publicité, souvent son profil acheteur.' },
    { q: 'Quel est le délai minimum pour répondre à un MAPA ?', a: 'Le code ne fixe pas de nombre de jours. L’acheteur doit laisser un délai suffisant compte tenu de la complexité du marché. La date et l’heure limites figurent dans l’avis et dans le règlement de la consultation.' },
    { q: 'L’acheteur est-il obligé de négocier ?', a: 'Non. Il peut prévoir une négociation, et même dans ce cas attribuer sur les offres initiales s’il l’a annoncé. Lisez le règlement de la consultation.' },
    { q: 'Peut-on m’aider à répondre à un MAPA ?', a: 'Oui. Sur Marchés Direct, Elena peut vous accompagner sur votre dossier ; vous restez seul responsable des engagements pris dans votre offre.' },
  ],
  // Vérifié le 6 nov. 2026 : R2123-1, R2123-4, R2123-5 (MAPA), R2131-12 (publicité), R2151-1 (délais), R2181-2 (motifs du rejet), L2151-2 (variantes), L2152-7 (critère environnemental).
  sources: [
    { label: 'Entreprendre Service Public — Quelles sont les différentes procédures de marchés publics ?', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F32049' },
    { label: 'Entreprendre Service Public — Répondre au marché : préparer le dossier offre', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F32154' },
    { label: 'Entreprendre Service Public — Concourir aux marchés publics', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F36246' },
    { label: 'Légifrance — Code de la commande publique, article R2123-1', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043316424' },
  ],
  related: ['seuils-marches-publics', 'criteres-attribution', 'repondre-marche-public-artisan'],
};
export default guide;
