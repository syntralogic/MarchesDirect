import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'seuils-marches-publics',
  category: 'Comprendre les règles',
  title: 'Seuils des marchés publics : ce qui change selon le montant',
  metaTitle: 'Seuils des marchés publics 2026 : le tableau simple',
  description: 'Devis simple, MAPA, BOAMP, seuils européens 2026-2027 : ce que change le montant d’un marché public, et comment l’acheteur calcule sa valeur estimée.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 7,
  summary: [
    'Sous **60 000 € HT** (fournitures et services) et **100 000 € HT** (travaux), l’acheteur peut commander sans publicité ni mise en concurrence : souvent sur simple devis.',
    'Au-dessus, et jusqu’aux seuils européens, c’est en général un **marché à procédure adaptée** (MAPA). À partir de **90 000 € HT**, l’avis doit paraître au BOAMP ou dans un journal d’annonces légales.',
    'Seuils européens 2026-2027 : **140 000 €**, **216 000 €** ou **432 000 € HT** pour les fournitures et services selon l’acheteur, **5 404 000 € HT** pour les travaux.',
    'Tous les montants sont **hors taxes** et portent sur la **valeur estimée totale** du besoin (options, reconductions et lots compris), pas sur votre devis.',
  ],
  sections: [
    {
      id: 'pourquoi',
      h2: 'Pourquoi le montant change tout',
      blocks: [
        { p: 'Un acheteur public (mairie, département, hôpital, office HLM, État…) ne passe pas tous ses achats de la même façon. Plus le montant est élevé, plus les règles de publicité et de mise en concurrence sont lourdes. Il existe trois grands niveaux :' },
        { ol: [
          '**Sans publicité ni mise en concurrence** : pour les petits montants. L’acheteur peut vous appeler directement ou vous demander un devis.',
          '**Procédure adaptée (MAPA)** : l’acheteur fixe lui-même les règles de la consultation, dans le respect des grands principes (égalité de traitement, transparence).',
          '**Procédure formalisée** (appel d’offres, procédure avec négociation, dialogue compétitif) : au-dessus des seuils européens, avec des délais et des formalités fixés par le code.',
        ] },
        { p: 'Pour vous, savoir où se situe un marché permet de comprendre où il sera publié, combien de temps vous aurez pour répondre et quel dossier préparer.' },
      ],
    },
    {
      id: 'tableau',
      h2: 'Le tableau des seuils en vigueur',
      blocks: [
        { p: 'Montants hors taxes, valables pour les consultations lancées à la date de vérification de ce guide. Les seuils de procédure formalisée s’appliquent du 1er janvier 2026 au 31 décembre 2027.' },
        { table: {
          head: ['Valeur estimée du marché (HT)', 'Règle applicable', 'Où le trouver'],
          rows: [
            ['Fournitures ou services : moins de 60 000 €', 'Sans publicité ni mise en concurrence (dispense)', 'Contact direct, demande de devis'],
            ['Travaux : moins de 100 000 €', 'Sans publicité ni mise en concurrence (dispense)', 'Contact direct, demande de devis'],
            ['Fournitures ou services : de 60 000 € à 89 999 €', 'MAPA, publicité libre ou adaptée', 'Profil acheteur, presse, site de l’acheteur'],
            ['Fournitures ou services : de 90 000 € au seuil européen', 'MAPA, avis obligatoire', 'BOAMP ou journal d’annonces légales'],
            ['Travaux : de 100 000 € à 5 403 999 €', 'MAPA, avis obligatoire', 'BOAMP ou journal d’annonces légales'],
            ['Fournitures ou services de l’État (autorités centrales) : 140 000 € et plus', 'Procédure formalisée', 'BOAMP et Journal officiel de l’Union européenne (JOUE)'],
            ['Fournitures ou services des collectivités et autres acheteurs : 216 000 € et plus', 'Procédure formalisée', 'BOAMP et JOUE'],
            ['Fournitures ou services des entités adjudicatrices (eau, énergie, transports, postes) : 432 000 € et plus', 'Procédure formalisée', 'BOAMP et JOUE'],
            ['Travaux : 5 404 000 € et plus', 'Procédure formalisée', 'BOAMP et JOUE'],
          ],
        } },
        { note: 'Le journal d’annonces légales est désormais appelé « support habilité à recevoir des annonces légales » (Shal). Dans tous les cas, l’acheteur publie aussi ses consultations sur son **profil acheteur**, la plateforme en ligne où vous téléchargez les documents et déposez votre réponse.' },
      ],
    },
    {
      id: 'dispense',
      h2: 'Sous les seuils de dispense : le marché sur devis',
      blocks: [
        { p: 'Le seuil de dispense des **fournitures et services** est passé de 40 000 € à **60 000 € HT** le 1er avril 2026. Celui des **travaux** est fixé à **100 000 € HT** de façon durable depuis le 1er janvier 2026 (décret n° 2025-1386 du 29 décembre 2025, article R2122-8 du code de la commande publique).' },
        { p: 'Dans un marché alloti, un lot peut aussi être passé sans mise en concurrence s’il est sous ces montants, à condition que le total de ces « petits lots » ne dépasse pas **20 %** de la valeur de tous les lots.' },
        { p: 'Être sous le seuil ne veut pas dire « au hasard ». L’acheteur doit choisir une offre pertinente, bien utiliser l’argent public et **ne pas faire appel systématiquement au même prestataire** quand plusieurs entreprises peuvent répondre. Il peut aussi négocier, en traitant tout le monde de la même façon.' },
        { h3: 'Deux changements à connaître' },
        { ul: [
          '**Pompes à chaleur et réseaux de chaleur** : jusqu’au 31 décembre 2026 inclus, les travaux d’installation de pompes à chaleur dans les bâtiments ou de raccordement à un réseau de chaleur urbain peuvent être passés sans mise en concurrence jusqu’à **140 000 € HT** (décret n° 2026-792 du 15 août 2026).',
          '**Au 1er janvier 2027** : la loi de simplification de la vie économique porte à **140 000 € HT** le seuil de dispense pour l’ensemble des marchés de travaux (avec la même règle des 20 % pour les lots). Ce relèvement vise les travaux, pas les fournitures et services.',
        ] },
        { p: 'Conséquence pratique : une bonne partie des petits chantiers ne fait l’objet d’aucune annonce. Pour en décrocher, il faut être **connu des acheteurs de votre secteur** : se présenter aux services techniques, être référencé, répondre vite et proprement aux demandes de devis.' },
      ],
    },
    {
      id: 'mapa-publicite',
      h2: 'Entre la dispense et les seuils européens : le MAPA',
      blocks: [
        { p: 'Au-dessus des seuils de dispense et sous les seuils européens, l’acheteur passe en principe un [marché à procédure adaptée](/guides/procedure-adaptee-mapa). Il choisit librement les modalités : délai de réponse, négociation ou non, pièces demandées.' },
        { p: 'Pour l’État, les collectivités territoriales et leurs établissements publics, la publicité suit deux paliers (article R2131-12) :' },
        { ul: [
          '**Moins de 90 000 € HT** : publicité libre, adaptée au marché (profil acheteur, presse locale, site internet…).',
          '**À partir de 90 000 € HT** : avis obligatoire au **BOAMP** ou dans un **journal d’annonces légales**. L’acheteur peut en plus publier dans la presse spécialisée ou au JOUE.',
        ] },
        { p: 'Pour les travaux, comme le seuil de dispense est à 100 000 €, tout marché de travaux mis en concurrence par ces acheteurs fait l’objet d’un avis au BOAMP ou dans un journal d’annonces légales.' },
        { note: 'Au-delà de 60 000 € HT, votre réponse doit être déposée **par voie électronique** sur le profil acheteur : une offre envoyée sur papier est irrecevable. Ne découvrez pas la plateforme la veille de la date limite.' },
      ],
    },
    {
      id: 'europeens',
      h2: 'Les seuils européens 2026-2027',
      blocks: [
        { p: 'Les seuils de procédure formalisée sont fixés par la Commission européenne et révisés **tous les deux ans**. Pour 2026-2027, ils ont légèrement baissé (de 2 à 2,5 %) par rapport à 2024-2025 :' },
        { ul: [
          'fournitures et services des autorités publiques centrales (État) : **140 000 € HT** (contre 143 000 €) ;',
          'fournitures et services des autres pouvoirs adjudicateurs, dont les collectivités : **216 000 € HT** (contre 221 000 €) ;',
          'fournitures et services des entités adjudicatrices : **432 000 € HT** (contre 443 000 €) ;',
          'travaux et contrats de concession : **5 404 000 € HT** (contre 5 538 000 €).',
        ] },
        { p: 'Au-dessus, l’avis paraît au BOAMP et au JOUE, et les délais minimaux de réponse sont fixés par le code. Certains marchés (services sociaux et autres services spécifiques, certains services juridiques) peuvent rester en procédure adaptée quel que soit leur montant.' },
      ],
    },
    {
      id: 'valeur-estimee',
      h2: 'Comment l’acheteur calcule la valeur estimée',
      blocks: [
        { p: 'Le seuil ne se compare pas au prix de votre devis, mais à la **valeur estimée du besoin** calculée par l’acheteur avant de lancer la consultation (articles R2121-1 à R2121-9). Les règles principales :' },
        { ul: [
          '**Montant total hors taxes** du ou des marchés envisagés, en comptant les **options**, les **reconductions** et **tous les lots**.',
          '**Travaux** : on additionne tous les travaux d’une même **opération**, c’est-à-dire un ensemble décidé pour une période et un périmètre limités, avec une unité fonctionnelle, technique ou économique. Peu importe le nombre d’entreprises ou de marchés.',
          '**Fournitures et services** : on additionne ce qui est **homogène** (par nature ou parce que cela forme une unité fonctionnelle).',
          '**Besoins réguliers** (entretien, nettoyage…) : on se base sur ce qui a été dépensé sur les douze mois précédents, ou sur ce qui est prévu pour les douze mois qui suivent.',
          'La valeur retenue est celle estimée au **lancement** de la consultation.',
        ] },
        { p: 'Exemple : une commune rénove une école en trois lots (menuiseries, peinture, électricité). Le seuil s’apprécie sur le total des trois lots, même si chaque lot pris seul paraît petit.' },
        { p: 'L’acheteur n’a pas le droit de **découper artificiellement** ses achats pour rester sous un seuil (article R2121-4). Ce « saucissonnage » est illégal.' },
      ],
    },
  ],
  faq: [
    { q: 'Quel est le seuil des marchés publics sans mise en concurrence en 2026 ?', a: '60 000 € HT pour les fournitures et services (depuis le 1er avril 2026) et 100 000 € HT pour les travaux. Pour les travaux, il passe à 140 000 € HT au 1er janvier 2027 ; c’est déjà le cas jusqu’au 31 décembre 2026 pour l’installation de pompes à chaleur et le raccordement aux réseaux de chaleur.' },
    { q: 'À partir de quel montant un marché est-il publié au BOAMP ?', a: 'Pour l’État et les collectivités, un avis au BOAMP ou dans un journal d’annonces légales est obligatoire à partir de 90 000 € HT. Au-dessus des seuils européens, l’avis paraît au BOAMP et au Journal officiel de l’Union européenne.' },
    { q: 'Les seuils sont-ils en HT ou en TTC ?', a: 'Toujours hors taxes. Ils portent sur la valeur totale estimée du besoin par l’acheteur, options, reconductions et lots compris.' },
    { q: 'Un marché sous le seuil de dispense m’oblige-t-il à fournir un dossier complet ?', a: 'Non, l’acheteur décide de ce qu’il demande : souvent un simple devis. Mais si vous êtes retenu, il peut vous demander les attestations obligatoires (URSSAF, impôts…). Pour toute question sur votre cas, vous pouvez [poser votre question](/question) à l’équipe Marchés Direct.' },
  ],
  // Vérifié le 6 nov. 2026 : R2122-8 (dispense), R2131-12 (publicité MAPA), R2121-1 à R2121-9 (valeur estimée), décrets n° 2025-1386 et n° 2026-792, loi de simplification de la vie économique (relèvement travaux au 1er janvier 2027).
  sources: [
    { label: 'Entreprendre Service Public — Quelles sont les différentes procédures de marchés publics ?', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F32049' },
    { label: 'Entreprendre Service Public — Quels sont les seuils de publicité des marchés publics ?', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F23371' },
    { label: 'Direction des affaires juridiques (ministère de l’Économie) — Nouveaux seuils européens applicables au 1er janvier 2026', url: 'https://www.economie.gouv.fr/daj/commande-publique-nouveaux-seuils-europeens-applicables-au-1er-janvier-2026' },
    { label: 'Légifrance — Code de la commande publique, calcul de la valeur estimée du besoin (R2121-1 à R2121-9)', url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000037701019/LEGISCTA000037723788/' },
  ],
  related: ['procedure-adaptee-mapa', 'trouver-appels-offres', 'lire-avis-dce'],
};
export default guide;
