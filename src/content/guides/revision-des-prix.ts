import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'revision-des-prix',
  category: 'Argent et paiement',
  title: 'Révision des prix : se protéger contre la hausse des matériaux',
  metaTitle: 'Révision des prix en marché public : index BT, TP, formule',
  description: 'Prix ferme, actualisable ou révisable : ce que prévoit le code, quand la révision est obligatoire, comment lire la formule et les index BT et TP de l’INSEE.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 8,
  summary: [
    'Un prix de marché public est **ferme** (il ne bouge pas) ou **révisable** (il suit l’évolution des coûts selon une formule). C’est le CCAP qui le dit.',
    'Un prix ferme doit être **actualisé** quand plus de **trois mois** séparent la date de votre offre et le début des prestations : c’est une règle du code pour les travaux.',
    'La clause de révision est **obligatoire** dans certains marchés de plus de trois mois très exposés aux cours mondiaux des matières premières.',
    'La révision s’appuie le plus souvent sur les **index BT (bâtiment) et TP (travaux publics)** publiés chaque mois par l’INSEE.',
    'Lisez la formule **avant** de chiffrer : la date de départ, la part fixe et l’index choisi changent beaucoup ce que vous récupérerez.',
  ],
  sections: [
    {
      id: 'trois-formes',
      h2: 'Prix ferme, actualisable ou révisable : de quoi parle-t-on',
      blocks: [
        { p: 'Le code de la commande publique distingue deux grandes formes de prix définitif : le prix **ferme** et le prix **révisable** (articles R2112-8 à R2112-14). Un prix ferme peut en plus être **actualisé** une fois, avant le démarrage.' },
        { table: { head: ['Forme de prix', 'Ce qui se passe', 'Pour vous'], rows: [
          ['Ferme', 'Le prix reste le même pendant toute la durée du marché.', 'Vous portez seul le risque de hausse des matériaux et des salaires.'],
          ['Ferme actualisable', 'Le prix est mis à jour **une seule fois**, si le démarrage arrive plus de trois mois après votre offre.', 'Vous êtes protégé contre l’attente, pas contre les hausses pendant le chantier.'],
          ['Révisable', 'Le prix évolue pendant l’exécution, selon une formule fixée dans le marché.', 'La hausse (ou la baisse) des coûts est répercutée, selon la formule.'],
        ] } },
        { p: 'La forme du prix est écrite dans le **cahier des clauses administratives particulières** (CCAP), souvent dans un article « Prix » ou « Variation dans les prix ». Elle ne se négocie pas après coup : vous la découvrez en lisant le dossier de consultation, et vous chiffrez en conséquence.' },
      ],
    },
    {
      id: 'actualisation',
      h2: 'Le prix ferme et l’actualisation après trois mois',
      blocks: [
        { p: 'Pour les **travaux** et pour les fournitures ou services qui ne sont pas « courants », un marché à prix ferme doit prévoir comment le prix sera actualisé (article R2112-10).' },
        { p: 'La règle est fixée par l’article R2112-11 : le prix est actualisé si **plus de trois mois** s’écoulent entre la date à laquelle vous avez fixé votre prix dans l’offre et la date de début d’exécution. L’actualisation se fait aux conditions économiques d’une date **antérieure de trois mois** au début des prestations.' },
        { p: 'Quand il y a eu une négociation, le Conseil d’État a jugé en octobre 2024 que la date à retenir est celle de votre **offre finale** remise après la négociation, et non celle de votre première offre.' },
        { note: 'Conservez la date exacte de remise de votre offre (accusé de dépôt sur la plateforme) et l’ordre de service de démarrage. Ce sont ces deux dates qui décident si vous avez droit à l’actualisation.' },
      ],
    },
    {
      id: 'revision-obligatoire',
      h2: 'Quand la clause de révision est obligatoire',
      blocks: [
        { p: 'Le code prévoit deux cas où l’acheteur doit choisir un prix révisable :' },
        { ul: [
          '**Aléas majeurs** (article R2112-13) : le marché est conclu à prix révisable quand les parties sont exposées à des aléas majeurs liés à des évolutions économiques raisonnablement prévisibles pendant l’exécution. Le texte cite notamment l’achat de matières premières agricoles et alimentaires.',
          '**Matières premières aux cours mondiaux** (article R2112-14) : un marché de **plus de trois mois** qui nécessite une **part importante de fournitures**, notamment de matières premières dont le prix dépend directement des cours mondiaux, doit contenir une clause de révision. Cette clause doit faire référence à au moins un **indice officiel** de ces cours.',
        ] },
        { p: 'Les marchés de fourniture de gaz ou d’électricité font exception : ils peuvent rester à prix ferme selon les usages de la profession.' },
        { p: 'En dehors de ces cas, l’acheteur choisit. Pour un chantier long dans un métier où les matériaux pèsent lourd (métal, cuivre, bitume, bois), un prix ferme sans révision vous fait porter tout le risque. Si le dossier vous semble mal adapté, posez la question à l’acheteur **pendant la consultation**, par la messagerie de la plateforme : c’est le seul moment où il peut corriger son dossier pour tous les candidats.' },
      ],
    },
    {
      id: 'index-bt-tp',
      h2: 'Les index BT et TP de l’INSEE',
      blocks: [
        { p: 'Depuis 2014, c’est l’**INSEE** qui produit les index nationaux du bâtiment (BT), des travaux publics (TP) et divers de la construction. Selon l’INSEE, ils servent aux actualisations et révisions des prix des marchés de construction. La base actuelle est la **base 2010** (moyenne 2010 = 100).' },
        { ul: [
          '**BT01** : index du bâtiment tous corps d’état ;',
          '**TP01** : index général tous travaux publics ;',
          'des index par métier (gros œuvre, plomberie, électricité, peinture, menuiserie, etc.), plus proches de votre activité réelle.',
        ] },
        { p: 'Les index sont **mensuels** et publiés avec un décalage : par exemple, les index de novembre 2025 sont parus le 15 janvier 2026. L’acheteur choisit l’index le plus proche de l’objet du marché ; une formule peut combiner plusieurs index (main-d’œuvre, matériaux, énergie).' },
        { p: 'Vous trouvez toutes les séries gratuitement sur le site de l’INSEE, en tapant le code de l’index (par exemple « BT01 ») dans la recherche.' },
      ],
    },
    {
      id: 'formule',
      h2: 'Lire la formule de révision, pas à pas',
      blocks: [
        { p: 'L’article R2112-13 impose que le marché fixe la **date d’établissement du prix initial** (souvent appelée « mois zéro »), la **méthode de calcul** et la **fréquence** de la révision. La formule ne peut retenir que des éléments du coût de la prestation, et elle peut comporter une **partie fixe**.' },
        { p: 'La forme la plus courante est :' },
        { p: '**P = P0 × (a + b × I / I0)**' },
        { ul: [
          '**P0** : le prix de votre offre, aux conditions du mois zéro ;',
          '**I0** : la valeur de l’index au mois zéro ;',
          '**I** : la valeur de l’index au mois retenu pour le paiement (mois d’exécution, ou mois précédent, selon le CCAP) ;',
          '**a** : la partie fixe, qui ne bouge jamais ;',
          '**b** : la partie révisable, avec a + b = 1.',
        ] },
        { h3: 'Un exemple chiffré (valeurs fictives)' },
        { p: 'Situation de travaux de 10 000 € HT. Partie fixe a = 0,15, partie révisable b = 0,85. Index au mois zéro : 130,0. Index du mois des travaux : 136,5. Le rapport I / I0 vaut 1,05. Le coefficient est 0,15 + 0,85 × 1,05 = 1,0425. Vous facturez donc **10 425 € HT** au lieu de 10 000 €.' },
        { p: 'Avec une partie fixe de 0,30 au lieu de 0,15, le même calcul donne 10 350 € : plus la partie fixe est grande, moins la hausse vous est remboursée.' },
        { note: 'Vérifiez trois points dans le CCAP avant de chiffrer : le **mois zéro** (date de l’offre ou date limite de remise des offres), l’**index choisi** (est-il proche de vos vrais coûts ?) et la **part fixe**. Si la formule vous couvre peu, intégrez une marge de prudence dans votre prix.' },
      ],
    },
    {
      id: 'bons-reflexes',
      h2: 'Les bons réflexes, avant et pendant le marché',
      blocks: [
        { ol: [
          '**Avant de chiffrer** : repérez la forme du prix et la formule dans le CCAP. Un prix ferme sur un chantier long se chiffre avec une provision pour hausse.',
          '**Pendant la consultation** : si la formule est floue ou l’index inadapté, posez une question écrite à l’acheteur.',
          '**Au démarrage** : notez la date de l’ordre de service ; comparez-la à la date de votre offre pour l’actualisation.',
          '**À chaque facture** : calculez vous-même la révision avec les index de l’INSEE et comparez avec le décompte de l’acheteur. Regardez ce que prévoit le CCAP quand l’index du mois n’est pas encore publié.',
          '**En cas de choc imprévisible** : quand un événement extérieur et imprévisible bouleverse temporairement l’équilibre du contrat, le code prévoit un droit à **indemnité d’imprévision** pour l’entreprise qui continue d’exécuter (article L6). C’est une procédure exceptionnelle : constituez des preuves (factures fournisseurs, index) et rapprochez-vous de l’acheteur.',
        ] },
        { p: 'Une révision mal appliquée peut aussi retarder vos paiements. Pour les délais à respecter par l’acheteur, voyez notre guide sur les [délais de paiement](/guides/delais-paiement-marches-publics).' },
      ],
    },
  ],
  faq: [
    { q: 'Puis-je demander une révision si mon marché est à prix ferme ?', a: 'Non, en principe : le prix ferme ne bouge pas pendant l’exécution, sauf l’actualisation prévue si le démarrage arrive plus de trois mois après votre offre. Seul un événement imprévisible et extérieur qui bouleverse l’équilibre du contrat peut ouvrir droit à une indemnité d’imprévision.' },
    { q: 'Quel index BT choisir pour mon métier ?', a: 'Ce n’est pas vous qui choisissez : l’index est fixé dans le CCAP. Si celui retenu vous semble éloigné de vos coûts réels (par exemple un index tous corps d’état pour un lot plomberie), signalez-le à l’acheteur par une question écrite pendant la consultation.' },
    { q: 'La révision peut-elle faire baisser mon prix ?', a: 'Oui. Si l’index baisse entre le mois zéro et le mois des travaux, le coefficient devient inférieur à 1 et votre facture diminue. La formule joue dans les deux sens.' },
    { q: 'Où trouver les valeurs des index BT et TP ?', a: 'Sur le site de l’INSEE, gratuitement, série par série. Chaque index est publié chaque mois, avec un décalage d’environ six semaines.' },
    { q: 'Peut-on m’aider à vérifier une formule de révision ?', a: 'Oui. Sur Marchés Direct, Elena peut relire avec vous les clauses de prix d’un dossier avant votre réponse. Vous pouvez aussi nous écrire depuis la page [poser une question](/question).' },
  ],
  // Vérifié le 6 nov. 2026 : R2112-8 à R2112-14 (texte en vigueur ; R2112-7 modifié par le décret 2024-1251, sans effet sur ces règles) ;
  // CE 31 oct. 2024 n° 491280 (date de l’offre finale après négociation) ; L6 3° (imprévision) ; INSEE, index BT/TP base 2010.
  sources: [
    { label: 'Légifrance — Code de la commande publique, prix définitifs (articles R2112-7 à R2112-14)', url: 'https://www.legifrance.gouv.fr/codes/id/LEGIARTI000037730973/2019-04-01/' },
    { label: 'Direction des affaires juridiques — Guide du prix dans les marchés publics, chapitre 3 : prix ferme ou prix révisable', url: 'https://www.economie.gouv.fr/files/files/directions_services/daj/marches_publics/oecp/guide_prix/Guideprix2023_20230929_VF_chap3.pdf' },
    { label: 'INSEE — Description des index bâtiment (base 2010)', url: 'https://www.insee.fr/fr/metadonnees/source/indicateur/p1623/description' },
    { label: 'INSEE — Index du bâtiment BT01, tous corps d’état', url: 'https://www.insee.fr/fr/statistiques/serie/001710986' },
  ],
  related: ['delais-paiement-marches-publics', 'avance-marche-public', 'lire-avis-dce'],
};
export default guide;
