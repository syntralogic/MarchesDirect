import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'dc1-dc2-dume',
  category: 'Documents',
  title: 'DC1, DC2 et DUME : les formulaires de candidature expliqués simplement',
  metaTitle: 'DC1, DC2 et DUME : remplir sa candidature à un marché',
  description: 'DC1, DC2 ou DUME : à quoi sert chaque formulaire, lequel choisir, comment le remplir et quelles pièces vous n’avez pas à refournir.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 8,
  summary: [
    'Pour présenter votre candidature, vous utilisez **soit le DUME, soit les formulaires DC1 et DC2**. Les deux servent à la même chose.',
    'Les DC1 et DC2 sont des modèles proposés par le ministère de l’Économie : ils sont **facultatifs**. Le DUME n’est jamais obligatoire pour le candidat, mais l’acheteur ne peut pas le refuser.',
    'Grâce au principe **« Dites-le nous une fois »**, vous n’avez pas à refournir des documents que l’acheteur peut obtenir gratuitement en ligne ou qu’il a déjà reçus.',
    'Ces formulaires concernent la **candidature** : ils ne remplacent ni l’offre, ni les attestations demandées au candidat retenu.',
  ],
  sections: [
    {
      id: 'a-quoi-servent',
      h2: 'À quoi servent ces formulaires',
      blocks: [
        { p: 'Un dossier de réponse à un marché public a deux parties : la **candidature** et l’**offre**. Les formulaires DC1, DC2 et DUME concernent uniquement la candidature. Ils permettent à l’acheteur de vérifier deux choses :' },
        { ul: [
          'que vous avez **le droit** de répondre : vous n’êtes dans aucun cas d’interdiction de soumissionner (condamnations pour certaines infractions, défaut de paiement des impôts et cotisations, etc.) ;',
          'que vous êtes **capable** de faire le travail : aptitude à exercer l’activité, capacités économiques et financières, capacités techniques et professionnelles.',
        ] },
        { p: 'À ce stade, vous faites surtout une **déclaration sur l’honneur**. Les justificatifs officiels (attestations fiscales et sociales) ne sont demandés qu’au candidat que l’acheteur envisage de retenir. Voir [les attestations à fournir avant de signer](/guides/pieces-attributaire).' },
        { note: 'Lisez toujours le règlement de la consultation (RC) : il précise les pièces de candidature demandées et, parfois, un niveau minimal de capacité (chiffre d’affaires, références, qualifications).' },
      ],
    },
    {
      id: 'dc1',
      h2: 'Le DC1 : la lettre de candidature',
      blocks: [
        { p: 'Le DC1 est la lettre par laquelle vous vous portez candidat. Il sert aussi de déclaration sur l’honneur : vous attestez ne pas être dans un cas d’exclusion. Il comprend :' },
        { ul: [
          'l’identification de l’acheteur et l’objet de la consultation ;',
          'ce à quoi vous répondez : le marché entier, tous les lots ou certains lots seulement ;',
          'votre présentation : candidat seul ou en groupement (conjoint ou solidaire) ;',
          'en cas de groupement, les membres, la répartition des prestations et la désignation du **mandataire** ;',
          'l’engagement de chaque membre à ne pas être dans un cas d’exclusion.',
        ] },
        { p: 'Un seul DC1 suffit pour un groupement : il est rempli par le mandataire. En cas de lots, il peut être commun à plusieurs lots.' },
      ],
    },
    {
      id: 'dc2',
      h2: 'Le DC2 : la déclaration du candidat',
      blocks: [
        { p: 'Le DC2 complète le DC1. Il présente votre entreprise en détail. En groupement, **chaque membre** remplit le sien. Il contient :' },
        { ul: [
          '**votre identification** : dénomination, adresse, coordonnées, numéro SIRET, forme juridique ;',
          '**votre aptitude à exercer l’activité** : par exemple l’inscription à un registre professionnel pour une profession réglementée ;',
          '**votre capacité économique et financière** : chiffre d’affaires hors taxes des trois derniers exercices disponibles et, pour les travaux, votre **assurance responsabilité décennale** ;',
          '**votre capacité technique et professionnelle** : moyens humains et matériels, références ;',
          'le cas échéant, les capacités des entreprises sur lesquelles vous vous appuyez (sous-traitants, par exemple).',
        ] },
        { p: 'Vous pouvez joindre les justificatifs ou indiquer une adresse internet où l’acheteur peut les consulter gratuitement.' },
        { p: 'Les modèles DC1 et DC2, avec leur notice, se téléchargent sur le site de la Direction des affaires juridiques (DAJ) du ministère de l’Économie. Ils portent la mention « formulaire non obligatoire ». Si l’acheteur joint son propre modèle au DCE, utilisez de préférence celui-ci. Sinon, prenez toujours la version jointe au DCE ou la plus récente sur le site de la DAJ.' },
      ],
    },
    {
      id: 'dume',
      h2: 'Le DUME : la version électronique et européenne',
      blocks: [
        { p: 'Le **document unique de marché européen** (DUME) est un formulaire électronique standard, utilisé dans toute l’Union européenne. Il reprend la déclaration sur l’honneur et les informations sur vos capacités. Il remplace à lui seul le DC1 et le DC2.' },
        { ul: [
          '**Pour vous, il est facultatif** : vous pouvez toujours candidater avec les DC1 et DC2.',
          '**Pour l’acheteur, il est obligatoire de l’accepter** : il ne peut pas refuser une candidature présentée sous forme de DUME, quel que soit le montant du marché.',
          '**Il se remplit en ligne** : sur la plateforme de l’acheteur quand elle l’a intégré, ou avec le service DUME de l’État, proposé par Chorus Pro.',
          '**Il est réutilisable** : vous l’enregistrez et vous le reprenez pour vos candidatures suivantes, en mettant à jour ce qui a changé.',
        ] },
        { p: 'Remplissez-le avec le même soin que les DC1 et DC2 : identité de l’entreprise, lots visés, chiffre d’affaires, moyens, références. Un DUME incomplet reste une candidature incomplète.' },
        { note: 'Le format qui fait foi est le fichier électronique (XML) du DUME. Si vous déposez une version PDF, vérifiez dans le RC que l’acheteur l’accepte.' },
      ],
    },
    {
      id: 'dites-le-nous-une-fois',
      h2: '« Dites-le nous une fois » : les pièces à ne pas refournir',
      blocks: [
        { p: 'Le code de la commande publique vous dispense de fournir certains documents (articles R2143-13 et R2143-14) :' },
        { ul: [
          'ceux que l’acheteur peut obtenir **gratuitement** dans une base de données officielle, à condition que votre dossier lui donne les informations pour les consulter ;',
          'ceux que vous avez placés dans un **espace de stockage numérique** en accès gratuit, si vous indiquez comment y accéder ;',
          'ceux que vous avez **déjà transmis au même acheteur** lors d’une consultation précédente, s’ils sont toujours valables. Cette dispense s’applique même si le RC ne la prévoit pas.',
        ] },
        { p: 'Si vous candidatez avec le service DUME de Chorus Pro, vous n’avez pas à transmettre l’attestation de régularité fiscale ni l’attestation de vigilance : ces informations sont déjà détenues par les administrations.' },
        { p: 'Dans le doute, citez précisément le document déjà transmis (consultation, date) ou l’adresse où il se trouve. Un acheteur ne devine pas : sans ces informations, il peut vous demander la pièce.' },
      ],
    },
    {
      id: 'choisir',
      h2: 'Lequel choisir, et les erreurs à éviter',
      blocks: [
        { table: { head: ['', 'DC1 + DC2', 'DUME'], rows: [
          ['Obligatoire pour le candidat ?', 'Non (modèles facultatifs)', 'Non'],
          ['L’acheteur peut-il le refuser ?', 'Il peut joindre son propre modèle au DCE', 'Non'],
          ['Format', 'Fichier à remplir (traitement de texte ou PDF)', 'Formulaire en ligne, fichier XML'],
          ['Réutilisable', 'À recopier à chaque fois', 'Oui, enregistré et mis à jour'],
          ['Marchés hors de France', 'Non', 'Oui, dans toute l’UE'],
        ] } },
        { p: 'Pour une première réponse, les DC1 et DC2 sont souvent plus simples à prendre en main. Si vous répondez régulièrement, le DUME fait gagner du temps.' },
        { ul: [
          'Oublier de cocher le ou les lots auxquels vous répondez.',
          'Laisser vide la partie sur les capacités, alors que le RC fixe un niveau minimal.',
          'En groupement, oublier le DC2 d’un des membres.',
          'Recopier un ancien formulaire avec le nom d’un autre acheteur.',
          'Croire que le DC2 remplace le mémoire technique : il présente l’entreprise, pas votre façon de réaliser ce marché.',
        ] },
      ],
    },
  ],
  faq: [
    { q: 'Les formulaires DC1 et DC2 sont-ils obligatoires ?', a: 'Non. Ce sont des modèles proposés par le ministère de l’Économie. Vous pouvez candidater avec un DUME à la place, ou avec le modèle de l’acheteur s’il en fournit un dans le DCE.' },
    { q: 'Faut-il signer le DC1, le DC2 ou le DUME ?', a: 'La réglementation ne l’impose pas. L’acheteur peut toutefois exiger une signature dans les documents de la consultation : vérifiez le RC.' },
    { q: 'Où trouver le DUME ?', a: 'Sur la plateforme de l’acheteur si elle le propose, ou sur le service DUME de l’État, accessible depuis Chorus Pro. Vous gardez votre DUME pour le réutiliser.' },
    { q: 'Et le DC4, c’est quoi ?', a: 'C’est le modèle de déclaration de sous-traitance, à remplir pour chaque sous-traitant. Voir notre guide [sous-traitance, DC4 et paiement direct](/guides/sous-traitance-dc4-paiement-direct).' },
    { q: 'Peut-on m’aider à remplir ma candidature ?', a: 'Oui. Sur Marchés Direct, Elena peut vous accompagner ; vous restez responsable des déclarations faites sur l’honneur.' },
  ],
  // Vérifié le 6 nov. 2026 : mention « formulaire non obligatoire » sur les modèles DAJ (DC2 mis à jour le 21/11/2023) ;
  // DUME facultatif pour le candidat, non refusable par l’acheteur (F32144, vérifiée le 1er avril 2026) ; R2143-13 et R2143-14.
  sources: [
    { label: 'Direction des affaires juridiques (ministère de l’Économie) — Formulaires de déclaration du candidat', url: 'https://www.economie.gouv.fr/daj/formulaires-declaration-du-candidat' },
    { label: 'Direction des affaires juridiques (ministère de l’Économie) — Document unique de marché européen (DUME)', url: 'https://www.economie.gouv.fr/daj/document-unique-de-marche-europeen-dume' },
    { label: 'Entreprendre.Service-Public — Répondre au marché : préparer le dossier de candidature', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F32144' },
    { label: 'Entreprendre.Service-Public — Utiliser le service DUME proposé par Chorus Pro', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/R44043' },
  ],
  related: ['repondre-marche-public-artisan', 'pieces-attributaire', 'groupement-entreprises'],
};
export default guide;
