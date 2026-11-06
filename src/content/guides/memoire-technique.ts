import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'memoire-technique',
  category: 'Répondre',
  title: 'Rédiger un mémoire technique qui convainc l’acheteur',
  metaTitle: 'Mémoire technique marché public : méthode et plan type',
  description: 'Le mémoire technique pèse souvent autant que le prix. Méthode, plan type, erreurs à éviter : comment le rédiger quand on est artisan ou PME.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 9,
  summary: [
    'Le mémoire technique est la partie de votre offre qui explique **comment** vous allez réaliser le marché. Il sert à noter le critère « valeur technique ».',
    'Aucun modèle officiel n’est imposé : c’est le **règlement de la consultation** (RC) qui dit ce que l’acheteur veut lire, et parfois dans quel ordre.',
    'Un bon mémoire répond point par point aux sous-critères annoncés, avec des éléments **propres à ce chantier** : pas un catalogue générique.',
    'Une ou deux pages précises par sous-critère valent mieux que trente pages de copier-coller.',
  ],
  sections: [
    {
      id: 'a-quoi-sert',
      h2: 'À quoi sert le mémoire technique',
      blocks: [
        { p: 'Dans la plupart des consultations, l’acheteur ne choisit pas seulement sur le prix. Il annonce plusieurs **critères d’attribution**, avec un poids pour chacun : par exemple « prix 40 %, valeur technique 60 % ». Le mémoire technique est le document qui permet de noter la valeur technique.' },
        { p: 'Concrètement, c’est votre réponse écrite à la question : « Comment allez-vous faire ce travail, avec qui, avec quoi, dans quels délais, et comment garantissez-vous la qualité et la sécurité ? »' },
        { note: 'Lisez toujours les critères et leur pondération dans le règlement de la consultation **avant** d’écrire une ligne. Si la valeur technique compte pour 60 %, un mémoire bâclé peut vous faire perdre face à un concurrent plus cher.' },
        { p: 'Pour comprendre comment l’acheteur compare les offres, voir notre guide [Critères d’attribution](/guides/criteres-attribution).' },
      ],
    },
    {
      id: 'lire-le-rc',
      h2: 'Commencer par le règlement de la consultation',
      blocks: [
        { p: 'Le règlement de la consultation (RC) indique presque toujours ce que doit contenir le mémoire. Cherchez les passages « contenu de l’offre », « critères de jugement des offres » et « sous-critères ». Vous y trouverez souvent une liste du type :' },
        { ul: ['moyens humains affectés au chantier (qui, quelles qualifications) ;', 'moyens matériels ;', 'méthodologie et phasage des travaux ;', 'planning ou délai d’exécution ;', 'mesures de sécurité et d’hygiène ;', 'gestion des déchets et performance environnementale ;', 'contrôle qualité, gestion des réserves, service après travaux.'] },
        { p: 'Reprenez **exactement** ces intitulés comme titres de votre mémoire, dans le même ordre. Le correcteur a une grille de notation : s’il trouve chaque réponse à l’endroit attendu, il vous note plus facilement.' },
        { p: 'Si l’acheteur fournit un **cadre de mémoire technique** ou un questionnaire à remplir, utilisez-le tel quel : ne le remplacez pas par votre propre document.' },
      ],
    },
    {
      id: 'plan-type',
      h2: 'Un plan type pour les travaux',
      blocks: [
        { p: 'Quand le RC ne fixe pas de plan, celui-ci fonctionne pour la plupart des marchés de travaux d’artisan :' },
        { ol: [
          '**Présentation de l’entreprise** (une demi-page) : activité, effectif, qualifications ou labels réellement détenus, assurance décennale, deux ou trois références comparables.',
          '**Compréhension du besoin** : reformulez en quelques lignes ce que l’acheteur attend, les contraintes du site (bâtiment occupé, accès, horaires, public présent).',
          '**Moyens humains** : nom ou fonction du responsable de chantier, composition de l’équipe, qualifications et habilitations utiles (par exemple habilitation électrique, travail en hauteur).',
          '**Moyens matériels** : le matériel que vous mobiliserez sur ce chantier, pas la liste de tout votre parc.',
          '**Méthodologie et phasage** : les étapes dans l’ordre, ce que vous faites pour limiter la gêne, la coordination avec les autres corps d’état.',
          '**Planning** : un planning simple par semaine, cohérent avec le délai demandé.',
          '**Sécurité et environnement** : protections collectives, balisage, tri et évacuation des déchets, produits utilisés.',
          '**Qualité et suivi** : autocontrôles, réception, levée des réserves, interlocuteur unique, délai d’intervention après réception.',
        ] },
        { p: 'Pour un marché de services (nettoyage, entretien, maintenance), remplacez le phasage par l’organisation des prestations : fréquences, remplacements en cas d’absence, contrôle de la qualité, outils de suivi.' },
      ],
    },
    {
      id: 'ce-qui-fait-gagner',
      h2: 'Ce qui fait gagner des points',
      blocks: [
        { ul: [
          '**Du concret propre à ce chantier** : « intervention dans l’école pendant les vacances de février, accès par la cour arrière, zone de stockage balisée près du portail » vaut plus que « nous respectons les contraintes du site ».',
          '**Des engagements mesurables** : délai d’intervention, nombre de personnes, durée de chaque phase.',
          '**Des preuves** : attestations de qualification, fiches techniques des produits, photos de chantiers comparables, lettres de recommandation si vous en avez.',
          '**La cohérence avec le prix** : si votre mémoire annonce trois compagnons pendant six semaines, votre décomposition de prix doit le refléter.',
          '**La lisibilité** : titres clairs, phrases courtes, un tableau ou un planning plutôt que de longs paragraphes.',
        ] },
        { note: 'Ne promettez rien que vous ne tiendrez pas : le mémoire technique est souvent rendu **contractuel** (il devient une pièce du marché). Un engagement écrit non tenu peut entraîner des pénalités.' },
      ],
    },
    {
      id: 'erreurs',
      h2: 'Les erreurs les plus fréquentes',
      blocks: [
        { ul: [
          'Envoyer le même mémoire générique à toutes les consultations, parfois avec le nom d’un autre acheteur oublié dedans.',
          'Ne pas répondre à un sous-critère annoncé : la note de ce sous-critère sera faible, voire nulle.',
          'Noyer l’information utile dans des pages de présentation commerciale.',
          'Annoncer un planning incompatible avec le délai fixé dans le cahier des charges.',
          'Oublier les pièces demandées en annexe (fiches techniques, CV, attestations).',
          'Dépasser le nombre de pages imposé par le RC quand il y en a un.',
        ] },
      ],
    },
    {
      id: 'outils',
      h2: 'Gagner du temps sans perdre en qualité',
      blocks: [
        { p: 'Constituez une **bibliothèque** de blocs réutilisables : présentation de l’entreprise, fiches des membres de l’équipe, liste du matériel, procédures sécurité et déchets, références avec photos. Pour chaque consultation, vous n’écrivez plus que les parties propres au chantier : compréhension du besoin, phasage, planning.' },
        { p: 'Les outils d’aide à la rédaction, y compris l’intelligence artificielle, peuvent aider à structurer ou relire. Mais un correcteur repère vite un texte générique : relisez tout, vérifiez chaque engagement et adaptez au chantier.' },
        { p: 'Après chaque consultation perdue, demandez le **rapport d’analyse des offres** ou au minimum vos notes et les motifs du rejet : l’acheteur doit vous communiquer les motifs du rejet de votre offre si vous le demandez. C’est la meilleure façon de progresser.' },
      ],
    },
  ],
  faq: [
    { q: 'Le mémoire technique est-il obligatoire ?', a: 'Il n’existe pas d’obligation générale : c’est le règlement de la consultation qui dit s’il faut en fournir un. Dès que la valeur technique est un critère de choix, il est en pratique indispensable pour être bien noté.' },
    { q: 'Combien de pages faut-il écrire ?', a: 'Aucune longueur n’est imposée par la loi. Respectez la limite du RC s’il en fixe une. Sinon, visez la précision : quelques pages bien ciblées par sous-critère suffisent pour la plupart des marchés d’artisan.' },
    { q: 'Le mémoire technique m’engage-t-il ?', a: 'Souvent oui : beaucoup d’acheteurs le rendent contractuel en l’annexant à l’acte d’engagement. Vérifiez la liste des pièces contractuelles dans le cahier des clauses administratives particulières (CCAP).' },
    { q: 'Peut-on m’aider à le rédiger ?', a: 'Oui. Sur Marchés Direct, Elena peut vous accompagner sur votre dossier ; vous restez seul responsable des engagements pris dans votre offre.' },
  ],
  sources: [
    { label: 'Code de la commande publique, articles R2152-6 et R2152-7 (critères d’attribution) — Légifrance', url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000037701019/LEGISCTA000037730603/' },
    { label: 'Code de la commande publique, article R2181-1 (information des candidats évincés) — Légifrance', url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037730255' },
    { label: 'Direction des affaires juridiques (DAJ) — Conseils aux acheteurs et aux entreprises', url: 'https://www.economie.gouv.fr/daj/commande-publique' },
  ],
  related: ['criteres-attribution', 'lire-avis-dce', 'repondre-marche-public-artisan'],
};
export default guide;
