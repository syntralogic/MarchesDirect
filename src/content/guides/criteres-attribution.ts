import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'criteres-attribution',
  category: 'Répondre',
  title: 'Critères d’attribution : comment l’acheteur choisit l’offre gagnante',
  metaTitle: 'Critères d’attribution d’un marché public expliqués',
  description: 'Prix, valeur technique, critère environnemental, pondération, sous-critères, offre anormalement basse : comment l’acheteur classe les offres.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 7,
  summary: [
    'L’acheteur ne retient pas « le moins cher » : il choisit l’**offre économiquement la plus avantageuse**, selon des critères annoncés à l’avance.',
    'Depuis août 2026, au moins un critère doit porter sur les **caractéristiques environnementales** de l’offre. Le prix seul ne peut plus être l’unique critère.',
    'Critères, **pondération** et **sous-critères** pondérés figurent dans le règlement de la consultation. C’est votre grille de lecture pour construire l’offre.',
    'Un prix trop bas peut être jugé **anormalement bas** : l’acheteur doit alors vous demander de le justifier, et rejeter l’offre si vos explications ne suffisent pas.',
  ],
  sections: [
    {
      id: 'offre-avantageuse',
      h2: 'L’offre économiquement la plus avantageuse',
      blocks: [
        { p: 'Le marché est attribué à l’entreprise qui a présenté l’**offre économiquement la plus avantageuse**, sur la base d’un ou plusieurs critères **objectifs, précis et liés à l’objet du marché** ou à ses conditions d’exécution (article L2152-7 du code de la commande publique). Les offres sont jugées lot par lot.' },
        { p: 'Concrètement, l’acheteur commence par écarter les offres irrégulières (pièce manquante, non-respect du cahier des charges), inacceptables ou inappropriées. Il classe ensuite les offres restantes en appliquant les critères annoncés (article R2152-6). La première du classement l’emporte.' },
        { note: 'Depuis le 21 août 2026 (loi Climat et résilience, pour les consultations lancées à partir de cette date), **au moins un critère** doit prendre en compte les caractéristiques environnementales de l’offre, y compris en MAPA. Cela met fin au critère unique du prix.' },
      ],
    },
    {
      id: 'quels-criteres',
      h2: 'Les critères que l’acheteur peut utiliser',
      blocks: [
        { p: 'L’article R2152-7 laisse deux possibilités à l’acheteur :' },
        { ol: [
          '**Un critère unique : le coût**, calculé selon une approche globale (par exemple le coût du cycle de vie : achat, consommation d’énergie, entretien, fin de vie) et qui intègre les caractéristiques environnementales de l’offre.',
          '**Plusieurs critères**, dont obligatoirement **le prix ou le coût**, et au moins un critère environnemental. Des critères qualitatifs ou sociaux peuvent s’y ajouter.',
        ] },
        { p: 'Le code donne des exemples de critères :' },
        { ul: [
          '**la qualité** : valeur technique, caractéristiques esthétiques ou fonctionnelles, accessibilité, performances environnementales, insertion professionnelle des publics en difficulté, caractère innovant… ;',
          '**les délais d’exécution**, les conditions de livraison, le service après-vente et l’assistance technique ;',
          '**l’organisation, les qualifications et l’expérience du personnel** affecté au marché, quand la qualité de ce personnel peut avoir une influence significative sur l’exécution.',
        ] },
        { p: 'D’autres critères sont possibles s’ils sont justifiés par l’objet du marché. Un critère sans lien avec le marché (par exemple le chiffre d’affaires global de l’entreprise) ne peut pas servir à noter les offres : ces éléments relèvent de l’examen de la candidature.' },
      ],
    },
    {
      id: 'ponderation',
      h2: 'Pondération et sous-critères : lire la grille',
      blocks: [
        { p: 'Les critères et leurs modalités de mise en œuvre sont indiqués dans les **documents de la consultation**, le plus souvent dans le règlement de la consultation (article R2152-11). Dans les procédures formalisées, les critères sont **pondérés** (par exemple « prix 40 %, valeur technique 50 %, environnement 10 % ») ou, si ce n’est objectivement pas possible, classés par ordre décroissant d’importance (article R2152-12).' },
        { p: 'L’acheteur fixe librement la pondération, tant qu’elle permet de retenir l’offre la plus avantageuse. Le Conseil d’État a ainsi admis une pondération de 90 % pour la valeur technique et 10 % pour le prix (CE, 10 juin 2020, n° 431194).' },
        { h3: 'Les sous-critères' },
        { p: 'La valeur technique est souvent découpée en **sous-critères** : moyens humains, méthodologie, planning, gestion des déchets… Lorsque ces sous-critères sont pondérés ou hiérarchisés et que leur poids peut influencer la préparation des offres, l’acheteur doit les faire connaître aux candidats dès le lancement. En revanche, il n’est pas tenu de communiquer sa **méthode de notation** détaillée (le barème interne de l’analyste).' },
        { h3: 'Un exemple de calcul (fictif)' },
        { p: 'Le RC annonce : prix 40 %, valeur technique 50 % (moyens humains 20 %, méthodologie 20 %, planning 10 %), performance environnementale 10 %. Chaque critère est noté sur 10, puis multiplié par son poids.' },
        { table: {
          head: ['Critère (poids)', 'Entreprise A', 'Entreprise B'],
          rows: [
            ['Prix (40 %)', '10/10 → 4,0', '8/10 → 3,2'],
            ['Valeur technique (50 %)', '5/10 → 2,5', '8/10 → 4,0'],
            ['Environnement (10 %)', '4/10 → 0,4', '7/10 → 0,7'],
            ['**Note finale**', '**6,9**', '**7,9**'],
          ],
        } },
        { p: 'L’entreprise B gagne alors qu’elle est plus chère : son mémoire technique et ses engagements environnementaux ont fait la différence. La formule exacte de notation du prix, quand elle est donnée, se trouve dans le RC.' },
      ],
    },
    {
      id: 'construire',
      h2: 'Construire votre offre à partir des critères',
      blocks: [
        { ul: [
          '**Repérez le poids du prix.** S’il pèse 30 ou 40 %, un prix légèrement plus élevé peut être compensé par une meilleure valeur technique. S’il pèse 70 %, chaque euro compte.',
          '**Répondez à chaque sous-critère, dans l’ordre du RC.** Un sous-critère sans réponse est mal noté, quel que soit votre savoir-faire. Voir notre guide sur le [mémoire technique](/guides/memoire-technique).',
          '**Traitez sérieusement le critère environnemental.** Gestion des déchets, matériaux, trajets, produits utilisés : apportez des éléments vérifiables (fiches techniques, labels réellement détenus), pas des formules générales.',
          '**Restez cohérent.** Les moyens annoncés dans le mémoire doivent se retrouver dans votre prix. Un écart attire l’attention de l’analyste.',
          '**Posez vos questions avant la date limite** si un critère est flou : l’acheteur répond en général à tous les candidats en même temps.',
        ] },
      ],
    },
    {
      id: 'offre-anormalement-basse',
      h2: 'L’offre anormalement basse',
      blocks: [
        { p: 'Une offre anormalement basse est une offre dont le prix est **manifestement sous-évalué** et de nature à compromettre la bonne exécution du marché (article L2152-5). Le code ne fixe **aucun pourcentage automatique** : l’acheteur apprécie au cas par cas, au regard du cahier des charges et des autres offres.' },
        { p: 'Lorsqu’une offre semble anormalement basse, l’acheteur **doit** demander à l’entreprise de justifier son prix, y compris pour la part sous-traitée (articles L2152-6 et R2152-3). Il ne peut pas l’écarter sans lui avoir posé la question. Les justifications peuvent porter notamment sur :' },
        { ul: [
          'le procédé de construction, le mode de fabrication ou l’organisation de la prestation ;',
          'les solutions techniques retenues ou des conditions exceptionnellement favorables dont vous disposez (matériel déjà amorti, stock, chantier voisin) ;',
          'l’originalité de l’offre ;',
          'le respect des règles environnementales, sociales et du droit du travail sur le lieu d’exécution ;',
          'l’obtention éventuelle d’une aide d’État.',
        ] },
        { p: 'L’acheteur **rejette** l’offre si les explications ne justifient pas de façon satisfaisante le bas niveau du prix, ou s’il établit que ce prix vient du non-respect du droit de l’environnement, du droit social ou du droit du travail, conventions collectives comprises (article R2152-4).' },
        { note: 'Si vous recevez une demande de justification, répondez **dans le délai fixé**, avec des éléments chiffrés : décomposition du temps passé, coût horaire, prix d’achat des fournitures, devis de vos fournisseurs. Une réponse vague suffit à faire rejeter l’offre.' },
      ],
    },
    {
      id: 'apres',
      h2: 'Après le classement : connaître ses notes',
      blocks: [
        { p: 'Les candidats non retenus sont informés du rejet de leur offre. En MAPA, vous pouvez demander par écrit les motifs du rejet ; l’acheteur doit vous répondre dans les **15 jours** suivant la réception de votre demande (article R2181-2). En procédure formalisée, la lettre de rejet indique les motifs et, sur demande, les caractéristiques et avantages de l’offre retenue.' },
        { p: 'Demandez systématiquement vos notes critère par critère. Elles montrent où vous avez perdu des points : prix, mémoire, environnement. C’est l’information la plus utile pour gagner la consultation suivante.' },
      ],
    },
  ],
  faq: [
    { q: 'Un marché public peut-il encore être attribué au moins-disant ?', a: 'Plus sur le seul critère du prix pour les consultations lancées depuis le 21 août 2026 : au moins un critère doit porter sur les caractéristiques environnementales de l’offre. Le critère unique reste possible s’il s’agit du coût global intégrant ces caractéristiques.' },
    { q: 'L’acheteur doit-il publier la pondération des critères ?', a: 'Oui, les critères et leurs modalités de mise en œuvre figurent dans les documents de la consultation. En procédure formalisée, ils sont pondérés ou, à défaut, hiérarchisés. Les sous-critères pondérés qui peuvent influencer la préparation des offres doivent aussi être annoncés.' },
    { q: 'À partir de quel écart une offre est-elle anormalement basse ?', a: 'Aucun seuil chiffré n’est fixé par le code. L’acheteur apprécie au cas par cas et doit d’abord demander des justifications à l’entreprise avant de pouvoir rejeter son offre.' },
    { q: 'Comment savoir pourquoi mon offre a perdu ?', a: 'Demandez par écrit les motifs du rejet et vos notes par critère. En MAPA, l’acheteur a 15 jours à compter de votre demande pour répondre. Pour une question sur votre situation, vous pouvez [poser votre question](/question).' },
  ],
  // Vérifié le 6 nov. 2026 : L2152-5, L2152-6, L2152-7 (version en vigueur depuis août 2026), R2152-3, R2152-4, R2152-6, R2152-7 (rédaction issue du décret n° 2022-767), R2152-11, R2152-12, R2181-2 ; CE, 10 juin 2020, n° 431194.
  sources: [
    { label: 'Légifrance — Code de la commande publique, article R2152-7 (critères d’attribution)', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037730485' },
    { label: 'Légifrance — Code de la commande publique, article L2152-5 (offre anormalement basse)', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037703657' },
    { label: 'Direction des affaires juridiques (ministère de l’Économie) — Fiche technique « L’offre anormalement basse »', url: 'https://www.economie.gouv.fr/files/files/directions_services/daj/media-document/FT48_L_offre_anormalement_basse.pdf?v=1786003209' },
    { label: 'Entreprendre Service Public — Concourir aux marchés publics', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F36246' },
  ],
  related: ['memoire-technique', 'procedure-adaptee-mapa', 'lire-avis-dce'],
};
export default guide;
