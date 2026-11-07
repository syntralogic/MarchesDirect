import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'trouver-appels-offres',
  category: 'Répondre',
  title: 'Où trouver les appels d’offres publics et privés (et lesquels viser)',
  metaTitle: 'Où trouver les appels d’offres : BOAMP, TED, plateformes',
  description: 'BOAMP, TED, profils d’acheteurs, journaux d’annonces légales, données ouvertes : où chercher les appels d’offres et comment choisir ceux à viser.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 8,
  summary: [
    'Où l’acheteur publie dépend surtout du **montant** du marché : petits achats sans publicité, avis au BOAMP ou dans un journal d’annonces légales à partir de 90 000 € HT, avis européen au-dessus des seuils européens.',
    'Les documents de la consultation se téléchargent sur le **profil d’acheteur** (la plateforme en ligne de l’acheteur), dont l’adresse figure dans l’avis.',
    'Les petits marchés (moins de 100 000 € HT en travaux, moins de 60 000 € HT en fournitures et services) peuvent être passés **sans publicité** : il faut alors se faire connaître des acheteurs.',
    'Les appels d’offres privés ne sont soumis à aucune règle de publicité : ils passent par les réseaux, les maîtres d’œuvre et les entreprises générales.',
    'Mieux vaut répondre à peu de consultations bien choisies qu’à beaucoup au hasard : zone, métier, montant, délai, exigences.',
  ],
  sections: [
    {
      id: 'publicite-selon-montant',
      h2: 'Où l’acheteur publie : tout dépend du montant',
      blocks: [
        { p: 'Un acheteur public ne publie pas toutes ses consultations au même endroit. Le code de la commande publique fixe le support selon la valeur estimée du marché. Savoir cela vous évite de chercher au mauvais endroit.' },
        { table: { head: ['Valeur estimée du marché (HT)', 'Publicité prévue par le code'], rows: [
          ['Moins de 100 000 € en travaux, moins de 60 000 € en fournitures ou services', 'L’acheteur peut acheter **sans publicité ni mise en concurrence**. Il doit seulement choisir une offre pertinente et ne pas toujours retenir la même entreprise.'],
          ['De 60 000 € à 90 000 € en fournitures ou services', 'Publicité **libre** : site de l’acheteur, profil d’acheteur, presse locale, demande de devis…'],
          ['De 90 000 € jusqu’aux seuils européens', 'Avis publié au **BOAMP** ou dans un **journal d’annonces légales** (pour l’État, les collectivités et leurs établissements).'],
          ['Au-dessus des seuils européens', 'Avis publié au **Journal officiel de l’Union européenne** (consultable sur TED) et, pour l’État et les collectivités, au **BOAMP**.'],
        ] } },
        { p: 'Les seuils européens 2026-2027 sont de **5 404 000 € HT** pour les travaux et, pour les fournitures et services, de **140 000 € HT** (État) ou **216 000 € HT** (collectivités et la plupart des autres acheteurs). Détails dans notre guide sur les [seuils des marchés publics](/guides/seuils-marches-publics).' },
        { note: 'Un acheteur peut toujours faire plus de publicité que le minimum, par exemple publier au BOAMP un marché de 50 000 €. Ne vous limitez donc pas à une seule source.' },
      ],
    },
    {
      id: 'sources-officielles',
      h2: 'Les sources officielles à consulter',
      blocks: [
        { h3: 'Le BOAMP' },
        { p: 'Le [BOAMP](https://www.boamp.fr/) (Bulletin officiel des annonces des marchés publics) est le journal officiel des appels d’offres en France. On y trouve les avis de marché, mais aussi les avis d’attribution, utiles pour savoir qui a gagné. Vous pouvez y créer un compte pour recevoir des alertes selon vos critères.' },
        { h3: 'TED, la version en ligne du Journal officiel de l’Union européenne' },
        { p: '[TED](https://ted.europa.eu/fr/) publie les marchés au-dessus des seuils européens, dans toute l’Europe. L’accès est gratuit. Un compte gratuit permet d’enregistrer des recherches et de recevoir des alertes par e-mail. Pour un artisan, TED sert surtout à repérer les gros marchés de travaux découpés en lots, dont certains lots sont à sa portée.' },
        { h3: 'Les journaux d’annonces légales' },
        { p: 'Entre 90 000 € HT et les seuils européens, l’acheteur peut publier dans un journal habilité à recevoir des annonces légales au lieu du BOAMP. C’est souvent la presse régionale ou départementale, version papier ou site internet. Regardez la rubrique « marchés publics » ou « avis administratifs » des titres de votre département.' },
      ],
    },
    {
      id: 'profils-acheteurs',
      h2: 'Les profils d’acheteurs : là où se trouvent les dossiers',
      blocks: [
        { p: 'Le **profil d’acheteur** est la plateforme en ligne sur laquelle l’acheteur met ses documents de consultation à disposition, reçoit les candidatures et les offres, et échange avec les entreprises. Pour les marchés de 60 000 € HT ou plus qui font l’objet d’un avis, les documents doivent y être accessibles **gratuitement**, et l’avis doit indiquer l’adresse du profil.' },
        { p: 'Chaque acheteur choisit son outil : l’État, plusieurs plateformes régionales ou départementales, des éditeurs privés. En pratique, vous serez inscrit sur plusieurs plateformes. Quelques repères :' },
        { ul: [
          '**PLACE** ([marches-publics.gouv.fr](https://www.marches-publics.gouv.fr/)) : la plateforme des achats de l’État (ministères, services déconcentrés, établissements publics de l’État, organismes de sécurité sociale…). Recherche par lieu, catégorie et mots-clés, alertes quotidiennes ou hebdomadaires, consultations de test pour s’entraîner au dépôt.',
          '**Les plateformes de votre région ou de votre département** : beaucoup de collectivités se regroupent sur une plateforme commune. Le plus simple est de noter celles qui apparaissent dans les avis de votre secteur.',
          '**Le site de l’acheteur** lui-même (mairie, intercommunalité, hôpital, bailleur social) : rubrique « marchés publics » ou « appels d’offres », surtout pour les petits marchés à publicité libre.',
        ] },
        { note: 'Créez un compte entreprise sur chaque plateforme que vous utilisez et paramétrez les alertes avec vos mots-clés métier et votre zone. Téléchargez les dossiers **en étant identifié** : vous serez prévenu si l’acheteur modifie le dossier ou publie des réponses aux questions.' },
      ],
    },
    {
      id: 'donnees-ouvertes',
      h2: 'Les données ouvertes : savoir qui achète quoi',
      blocks: [
        { p: 'Les acheteurs publient les **données essentielles** de leurs marchés conclus (les « DECP ») : qui a acheté, quoi, à qui, pour quel montant. Le ministère de l’Économie les rassemble dans un fichier consolidé sur [data.gouv.fr](https://www.data.gouv.fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides).' },
        { p: 'Ces données ne servent pas à répondre à une consultation ouverte, mais à **préparer les prochaines** :' },
        { ul: [
          'repérer les acheteurs de votre zone qui achètent régulièrement votre type de prestation ;',
          'savoir quand un marché arrive à échéance, et donc quand il sera remis en concurrence ;',
          'connaître les entreprises qui gagnent et l’ordre de grandeur des montants.',
        ] },
        { p: 'Les avis d’attribution publiés au BOAMP donnent le même type d’information, consultation par consultation.' },
      ],
    },
    {
      id: 'marches-prives',
      h2: 'Petits marchés publics et appels d’offres privés',
      blocks: [
        { p: 'Sous les seuils de dispense, l’acheteur public peut demander des devis à quelques entreprises qu’il connaît. Pour être sollicité, il faut **se faire connaître** : présentez-vous aux services techniques des communes et intercommunalités de votre secteur, avec vos qualifications, assurances et références.' },
        { p: 'Attention : certains organismes de droit privé sont des acheteurs publics au sens du code. C’est le cas des structures créées pour un besoin d’intérêt général non industriel ou commercial et financées, contrôlées ou dirigées majoritairement par un acheteur public. Leurs consultations suivent alors les mêmes règles.' },
        { p: 'Les vrais marchés privés (entreprises, promoteurs, syndics de copropriété, particuliers) ne sont soumis à aucune obligation de publicité. Ils se trouvent surtout :' },
        { ul: [
          'auprès des **architectes et maîtres d’œuvre**, qui consultent des entreprises pour leurs clients ;',
          'auprès des **entreprises générales**, qui cherchent des sous-traitants par corps d’état ;',
          'par les fichiers fournisseurs des grandes entreprises, auxquels on s’inscrit sur leur site ;',
          'par le réseau : fédération professionnelle, chambre de métiers, clients satisfaits.',
        ] },
      ],
    },
    {
      id: 'choisir',
      h2: 'Comment choisir les consultations à viser',
      blocks: [
        { p: 'Une bonne réponse prend du temps. Avant de télécharger un dossier, passez chaque avis au crible de ces questions :' },
        { ol: [
          '**Métier** : la prestation correspond-elle à ce que vous faites vraiment, ou à un lot précis que vous savez faire ?',
          '**Zone** : le lieu d’exécution est-il compatible avec vos déplacements et vos prix ?',
          '**Taille** : le montant du marché ou du lot est-il cohérent avec votre chiffre d’affaires et votre équipe ? Un marché trop gros pour vous peut se viser en [groupement](/guides/groupement-entreprises).',
          '**Délai de réponse** : avez-vous le temps de préparer un dossier complet avant la date limite, visite comprise ?',
          '**Exigences** : qualifications, références, assurances, niveaux de capacité demandés : pouvez-vous les fournir ?',
          '**Période d’exécution** : aurez-vous les équipes disponibles au moment des travaux ?',
          '**Critères** : le prix pèse-t-il beaucoup, ou la valeur technique ? Voir notre guide sur les [critères d’attribution](/guides/criteres-attribution).',
        ] },
        { p: 'Commencez par les marchés à procédure adaptée de votre secteur, souvent plus simples et plus proches de vos chantiers habituels : voir notre guide sur le [MAPA](/guides/procedure-adaptee-mapa). Quand un dossier passe le crible, lisez-le en entier : notre guide [lire un avis et un DCE](/guides/lire-avis-dce) vous dit où regarder.' },
      ],
    },
  ],
  faq: [
    { q: 'Faut-il payer pour télécharger un dossier de consultation ?', a: 'Non dans la plupart des cas. Les avis se recherchent sur boamp.fr, où un compte permet aussi de recevoir des alertes. Les documents de la consultation, eux, se téléchargent sur le profil d’acheteur indiqué dans l’avis, gratuitement pour les marchés de 60 000 € HT ou plus qui font l’objet d’un avis.' },
    { q: 'Pourquoi je ne trouve pas les petits marchés de ma commune ?', a: 'Parce que beaucoup ne sont pas publiés : en dessous de 100 000 € HT pour les travaux et de 60 000 € HT pour les fournitures et services, la commune peut demander directement des devis. Pour les fournitures et services entre 60 000 € et 90 000 € HT, la publicité est libre : regardez son site et son profil d’acheteur, et présentez-vous à ses services.' },
    { q: 'Faut-il payer un service de veille ?', a: 'Ce n’est pas obligatoire : le BOAMP, TED et les plateformes comme PLACE proposent des alertes. Un service de veille fait gagner du temps en regroupant les sources ; vérifiez qu’il couvre bien les plateformes de votre secteur.' },
    { q: 'Marchés Direct peut-il m’aider à trouver des consultations ?', a: 'Oui : la page [marchés publics](/marches-publics) de Marchés Direct présente des consultations ouvertes par secteur et par zone ; le dossier se télécharge toujours sur la plateforme de l’acheteur.' },
  ],
  // Vérifié le 6 nov. 2026 : R2122-8 (dispense < 100 000 € travaux, < 60 000 € fournitures et services, depuis le 1er avril 2026),
  // R2131-12 (avis BOAMP ou JAL à partir de 90 000 €), R2131-16 (BOAMP + JOUE en procédure formalisée), R2132-2 (DCE gratuit sur
  // profil d’acheteur à partir de 60 000 €), L1211-1 (pouvoirs adjudicateurs de droit privé), seuils européens 2026-2027 (TED).
  sources: [
    { label: 'Légifrance — Article R2131-12 du code de la commande publique (publicité des procédures adaptées)', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037955801' },
    { label: 'Légifrance — Article R2122-8 du code de la commande publique (marchés sans publicité ni mise en concurrence)', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053221596' },
    { label: 'TED — Marchés publics européens et seuils 2026-2027', url: 'https://ted.europa.eu/fr/simap/european-public-procurement' },
    { label: 'data.gouv.fr — Données essentielles de la commande publique, fichiers consolidés', url: 'https://www.data.gouv.fr/datasets/donnees-essentielles-de-la-commande-publique-fichiers-consolides' },
  ],
  related: ['lire-avis-dce', 'seuils-marches-publics', 'procedure-adaptee-mapa'],
};
export default guide;
