import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'groupement-entreprises',
  category: 'Travailler à plusieurs',
  title: 'Répondre à plusieurs : groupement conjoint ou solidaire ?',
  metaTitle: 'Groupement conjoint ou solidaire : répondre à plusieurs',
  description: 'Groupement conjoint ou solidaire, rôle du mandataire, convention de groupement : comment répondre à un marché public avec d’autres artisans ou PME.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 8,
  summary: [
    'Plusieurs entreprises peuvent répondre ensemble à un marché public en formant un **groupement**. Leurs capacités sont appréciées **globalement** : chacune n’a pas besoin de tout savoir faire.',
    'En groupement **conjoint**, chaque membre s’engage pour sa part. En groupement **solidaire**, chaque membre s’engage pour la **totalité** du marché.',
    'Un **mandataire** représente le groupement devant l’acheteur et coordonne les membres. Il peut devoir être **solidaire** des autres si le marché le prévoit.',
    'Pas besoin de créer une société pour répondre. L’acheteur peut seulement imposer une forme précise **après l’attribution**, et doit le justifier.',
    'Une **convention de groupement** écrite entre les membres évite la plupart des conflits : qui fait quoi, qui paie quoi, qui décide.',
  ],
  sections: [
    {
      id: 'pourquoi',
      h2: 'Pourquoi répondre en groupement',
      blocks: [
        { p: 'Les groupements d’opérateurs économiques peuvent participer à toutes les procédures de passation (article R2142-19 du code de la commande publique). Le groupement permet de répondre à un marché trop gros ou trop varié pour une seule petite entreprise : un plombier avec un électricien et un plaquiste pour une rénovation, ou trois entreprises de nettoyage pour couvrir plusieurs sites.' },
        { p: 'Point clé : les capacités d’un groupement sont appréciées **globalement**. Il n’est pas exigé que chaque membre ait toutes les capacités demandées pour exécuter le marché (article R2142-25). Vos références et votre chiffre d’affaires s’additionnent à ceux de vos partenaires.' },
        { p: 'À ne pas confondre avec la **sous-traitance** : le sous-traitant travaille pour le titulaire, sans contrat avec l’acheteur. Le membre d’un groupement, lui, signe le marché. Voir notre guide sur la [sous-traitance et le DC4](/guides/sous-traitance-dc4-paiement-direct).' },
      ],
    },
    {
      id: 'conjoint-ou-solidaire',
      h2: 'Conjoint ou solidaire : la vraie différence',
      blocks: [
        { p: 'L’article R2142-20 définit deux formes :' },
        { ul: [
          '**Groupement conjoint** : chaque membre s’engage à exécuter la ou les prestations qui lui sont attribuées dans le marché. Il répond de sa part, pas de celle des autres.',
          '**Groupement solidaire** : chaque membre est engagé financièrement pour la **totalité** du marché. Si un partenaire défaille, l’acheteur peut se retourner contre n’importe quel autre membre pour l’ensemble du marché.',
        ] },
        { table: { head: ['', 'Conjoint', 'Solidaire'], rows: [
          ['Engagement de chaque membre', 'Sa part des prestations', 'Tout le marché'],
          ['Si un membre fait défaut', 'Les autres ne répondent pas de sa part (sauf mandataire solidaire)', 'Chaque membre peut être appelé pour le tout'],
          ['Répartition des tâches', 'Indiquée prestation par prestation dans l’offre', 'Libre entre les membres, à prévoir dans la convention'],
          ['Usage courant', 'Lots ou métiers bien séparés', 'Prestation difficile à découper, ou forme exigée par l’acheteur'],
        ] } },
        { p: 'Le groupement conjoint protège davantage chaque membre. Le groupement solidaire rassure l’acheteur, mais il vous engage sur le travail de vos partenaires : ne vous y engagez qu’avec des entreprises que vous connaissez bien et dont vous avez vérifié la santé financière et les assurances.' },
      ],
    },
    {
      id: 'mandataire',
      h2: 'Le mandataire : rôle et responsabilité',
      blocks: [
        { p: 'Le groupement désigne l’un de ses membres comme **mandataire**. Il représente l’ensemble des membres auprès de l’acheteur et coordonne les prestations de chacun (article R2142-24).' },
        { ul: [
          '**Dépôt** : la candidature et l’offre sont présentées soit par tous les membres, soit par le mandataire s’il justifie des habilitations nécessaires pour représenter les autres (article R2142-23). Prévoyez donc une habilitation signée par chaque membre.',
          '**Un seul groupement par mandataire** : une même entreprise ne peut pas être mandataire de plus d’un groupement pour un même marché (article R2142-23).',
          '**Solidarité du mandataire** : dans un groupement conjoint, si le marché le prévoit, le mandataire est **solidaire** de chacun des membres pour leurs obligations contractuelles envers l’acheteur, pendant l’exécution (article R2142-24).',
        ] },
        { note: 'Être mandataire solidaire d’un groupement conjoint, c’est garantir le travail de tous vos partenaires. Lisez bien le CCAP et le règlement de la consultation : si cette solidarité est exigée, intégrez-la dans votre choix de partenaires et dans la convention de groupement.' },
      ],
    },
    {
      id: 'regles-acheteur',
      h2: 'Ce que l’acheteur peut imposer ou interdire',
      blocks: [
        { ul: [
          '**Forme du groupement** : l’acheteur ne peut pas exiger une forme juridique précise pour présenter une candidature ou une offre. Il peut en revanche l’exiger **après l’attribution**, si c’est nécessaire à la bonne exécution du marché, à condition de le justifier dans les documents de la consultation (article R2142-22). C’est ainsi qu’un acheteur peut demander que le groupement attributaire devienne solidaire.',
          '**Candidatures multiples** : le règlement de la consultation peut interdire de candidater à la fois seul et en groupement, ou dans plusieurs groupements, pour le même marché ou le même lot (article R2142-21).',
          '**Tâches essentielles** : l’acheteur peut exiger que certaines tâches essentielles soient faites par un membre du groupement, s’il l’a écrit dans les documents de la consultation (article R2142-27).',
          '**Composition figée** : la composition du groupement ne peut pas changer entre la remise des candidatures et la signature du marché (article R2142-26). Des exceptions existent : restructuration d’un membre (rachat, fusion, acquisition), ou membre empêché pour des raisons indépendantes de sa volonté. Le groupement doit alors demander l’autorisation de l’acheteur, qui vérifie les capacités du groupement modifié. Dans les procédures avec négociation ou dialogue, l’acheteur peut aussi autoriser un changement de composition si le groupement garde les capacités exigées et que l’égalité entre candidats est respectée.',
        ] },
        { p: 'Tout cela figure dans le règlement de la consultation, souvent dans une rubrique « Groupements ». Lisez-la avant de choisir vos partenaires : voir notre guide pour [lire un avis et un DCE](/guides/lire-avis-dce).' },
      ],
    },
    {
      id: 'dossier',
      h2: 'Monter le dossier de candidature du groupement',
      blocks: [
        { ol: [
          '**Lettre de candidature (DC1)** : la notice de la DAJ recommande un seul DC1 pour tout le groupement. Il indique si le groupement est conjoint ou solidaire, si le mandataire est solidaire, l’identité de chaque membre et le mandataire. En groupement conjoint, il précise les prestations de chaque membre.',
          '**Capacités de chaque membre** : chaque membre fournit ses propres renseignements (DC2 ou documents demandés par l’acheteur), ou son DUME. Voir notre guide [DC1, DC2 et DUME](/guides/dc1-dc2-dume).',
          '**Habilitation du mandataire** : un document signé par chaque membre qui autorise le mandataire à les représenter. Si le groupement est retenu, ce document est demandé.',
          '**Offre** : un mémoire technique commun qui présente l’organisation du groupement (qui fait quoi, qui coordonne, comment les équipes se passent le relais) et la répartition des prix entre membres quand l’acte d’engagement la demande.',
        ] },
        { p: 'Donnez-vous du temps : un dossier à plusieurs demande de réunir les pièces de chaque entreprise. Fixez une date limite interne quelques jours avant la date de remise des offres.' },
      ],
    },
    {
      id: 'convention',
      h2: 'La convention de groupement : à écrire avant de répondre',
      blocks: [
        { p: 'Le code ne règle pas les relations entre les membres : c’est à vous de les écrire dans une **convention de groupement** (aussi appelée accord de cotraitance). Elle n’est pas transmise systématiquement à l’acheteur, mais elle vous protège entre partenaires. Elle doit au moins prévoir :' },
        { ul: [
          'l’objet : le marché visé et la durée de la convention (jusqu’à la fin des garanties, pas seulement la fin du chantier) ;',
          'la répartition précise des prestations et des prix entre les membres ;',
          'le rôle du mandataire, sa rémunération éventuelle pour la coordination, et ce qu’il peut décider seul ;',
          'la circulation des paiements : qui facture quoi, sur quel compte, et dans quel délai le mandataire reverse les sommes s’il les reçoit ;',
          'la répartition des pénalités et des responsabilités entre membres, surtout en groupement solidaire ou avec un mandataire solidaire ;',
          'les assurances exigées de chaque membre ;',
          'ce qui se passe si un membre se retire, fait défaut ou est en difficulté ;',
          'la façon de régler un désaccord entre membres.',
        ] },
        { note: 'Signez la convention **avant** de déposer l’offre. Une fois le marché signé, vous êtes engagés envers l’acheteur : il sera trop tard pour négocier entre vous la répartition des pénalités.' },
      ],
    },
  ],
  faq: [
    { q: 'Faut-il créer une société pour répondre en groupement ?', a: 'Non. L’acheteur ne peut pas exiger une forme juridique précise pour la candidature ou l’offre. Il peut seulement demander une forme déterminée au groupement attributaire, si c’est nécessaire à la bonne exécution et justifié dans les documents de la consultation.' },
    { q: 'Puis-je répondre seul et aussi en groupement au même marché ?', a: 'C’est possible sauf si le règlement de la consultation l’interdit, ce qu’il peut faire pour le marché ou pour certains lots. En revanche, une même entreprise ne peut jamais être mandataire de deux groupements pour le même marché.' },
    { q: 'Un membre peut-il quitter le groupement après la remise des offres ?', a: 'Entre la remise des candidatures et la signature du marché, la composition est en principe figée. Elle ne peut changer que dans les cas prévus par le code (rachat, fusion ou acquisition, membre empêché pour une cause indépendante de sa volonté, ou, dans une procédure avec négociation, sous conditions), avec l’autorisation de l’acheteur.' },
    { q: 'Comment trouver des partenaires pour répondre à plusieurs ?', a: 'Commencez par les entreprises avec qui vous travaillez déjà sur des chantiers privés, puis votre réseau professionnel local. Sur Marchés Direct, Elena peut vous accompagner pour organiser une réponse à plusieurs ; vous pouvez aussi [poser une question](/question).' },
  ],
  // Vérifié le 7 nov. 2026 : R2142-19 à R2142-27 du code de la commande publique (R2142-26 dans sa rédaction issue du décret n° 2024-1251) ; notice DC1 de la DAJ.
  // La convention de groupement n’est pas réglementée par le code : contenu donné à titre de bonne pratique.
  sources: [
    { label: 'Légifrance — Code de la commande publique, phase de candidature (articles R2142-1 à R2144-9)', url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000037701019/LEGISCTA000037723994/' },
    { label: 'Direction des affaires juridiques — Formulaires de déclaration du candidat (DC1, DC2)', url: 'https://www.economie.gouv.fr/daj/formulaires-declaration-du-candidat' },
    { label: 'Direction des affaires juridiques — Notice explicative du formulaire DC1', url: 'https://www.economie.gouv.fr/files/directions_services/daj/marches_publics/formulaires/DC/notices_dc/notice_dc1.pdf?v=1570092307' },
  ],
  related: ['sous-traitance-dc4-paiement-direct', 'dc1-dc2-dume', 'repondre-marche-public-artisan'],
};
export default guide;
