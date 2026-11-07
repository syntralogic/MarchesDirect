import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'repondre-marche-public-artisan',
  category: 'Répondre',
  title: 'Répondre à un marché public quand on est artisan ou TPE : la méthode pas à pas',
  metaTitle: 'Répondre à un marché public : méthode pour artisan et TPE',
  description: 'Choisir le bon marché, lire le DCE, préparer candidature et offre, déposer à temps : la méthode pas à pas pour un artisan ou une TPE.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 9,
  summary: [
    'Toute entreprise peut répondre à un marché public, **y compris une micro-entreprise**. Pas besoin d’agrément particulier pour commencer.',
    'Un dossier de réponse a deux parties : la **candidature** (qui vous êtes, ce que vous savez faire) et l’**offre** (ce que vous proposez, à quel prix).',
    'Tout part du **règlement de la consultation** (RC) : il fixe les pièces à fournir, les critères de choix et la date limite.',
    'Déposez sur la plateforme de l’acheteur **bien avant l’heure limite** : une offre arrivée en retard est en principe écartée.',
  ],
  sections: [
    {
      id: 'choisir',
      h2: 'Étape 1 : choisir les marchés à viser',
      blocks: [
        { p: 'Répondre prend du temps. Mieux vaut trois réponses soignées que dix dossiers bâclés. Avant de télécharger quoi que ce soit, posez-vous quatre questions simples :' },
        { ul: [
          '**Est-ce mon métier ?** Le marché, ou au moins un lot, correspond-il exactement à ce que je fais tous les jours ?',
          '**Est-ce à ma taille ?** Puis-je réaliser ce volume de travail dans le délai demandé, avec mon équipe actuelle ?',
          '**Est-ce près de chez moi ?** Les déplacements pèsent sur le prix et sur la réactivité.',
          '**Ai-je le temps de répondre ?** Comptez plusieurs jours de travail pour un premier dossier.',
        ] },
        { p: 'Les petits marchés sont la meilleure porte d’entrée. En dessous de **100 000 € HT pour les travaux** et de **60 000 € HT pour les fournitures et services**, l’acheteur peut passer le marché sans publicité ni mise en concurrence : il consulte souvent directement des entreprises qu’il connaît. Se faire connaître des mairies et des services techniques autour de chez vous est donc utile.' },
        { p: 'Au-dessus de ces montants, les marchés sont publiés. Pour les repérer, consultez les avis sur le BOAMP, les plateformes des acheteurs, ou la page [marchés publics ouverts](/marches-publics). Les lots séparés (peinture, plomberie, électricité…) sont souvent plus accessibles qu’un marché global.' },
      ],
    },
    {
      id: 'dce',
      h2: 'Étape 2 : télécharger et lire le dossier de consultation',
      blocks: [
        { p: 'Le dossier de consultation des entreprises (DCE) se télécharge en général gratuitement sur la plateforme de l’acheteur, appelée **profil d’acheteur**. Créez un compte et identifiez-vous avant de télécharger : vous serez ainsi prévenu si l’acheteur modifie le dossier ou publie des réponses aux questions.' },
        { p: 'Le DCE contient le plus souvent :' },
        { ul: [
          '**le règlement de la consultation (RC)** : les pièces à fournir, les critères de choix et leur poids, la date et l’heure limites ;',
          '**le CCAP** (clauses administratives) : délais, pénalités, modalités de paiement, avance, retenue de garantie ;',
          '**le CCTP** (clauses techniques) : ce qu’il faut faire exactement, avec quels matériaux et quelles normes ;',
          '**le cadre de prix** : bordereau des prix unitaires (BPU), décomposition du prix global (DPGF) ou détail estimatif ;',
          '**l’acte d’engagement**, que vous signerez si vous êtes retenu.',
        ] },
        { p: 'Lisez d’abord le RC, en entier, et notez la date limite dans votre agenda. Si un point n’est pas clair, posez votre question **par écrit, sur la plateforme**, dans le délai prévu par le RC. La réponse est envoyée à toutes les entreprises.' },
        { note: 'Prévoyez une visite du site si elle est proposée, surtout pour des travaux dans un bâtiment existant. Certains RC la rendent obligatoire.' },
      ],
    },
    {
      id: 'candidature',
      h2: 'Étape 3 : préparer la candidature',
      blocks: [
        { p: 'La candidature permet à l’acheteur de vérifier que vous avez le droit de répondre et que vous êtes capable de faire le travail. Elle se présente soit avec le **DUME** (document unique de marché européen), soit avec les formulaires **DC1** (lettre de candidature) et **DC2** (déclaration du candidat). Voir notre guide [DC1, DC2 et DUME](/guides/dc1-dc2-dume).' },
        { p: 'Elle contient en pratique :' },
        { ul: [
          'une **déclaration sur l’honneur** : vous n’êtes dans aucun cas d’interdiction de soumissionner et vous êtes à jour de vos obligations fiscales et sociales ;',
          'vos **capacités économiques** : chiffre d’affaires des trois derniers exercices disponibles ;',
          'vos **capacités techniques** : effectif, matériel, qualifications, **références** de chantiers ou prestations comparables ;',
          'pour les travaux, votre **assurance responsabilité décennale**.',
        ] },
        { p: 'Vous n’avez pas encore de référence publique ? Citez vos chantiers privés comparables, avec photos et attestations de clients. Une entreprise récente peut aussi présenter l’expérience de ses dirigeants.' },
        { p: 'À ce stade, les attestations fiscales et sociales ne sont pas encore demandées : elles le seront seulement si vous êtes retenu. Voir [les attestations à fournir avant de signer](/guides/pieces-attributaire).' },
      ],
    },
    {
      id: 'offre',
      h2: 'Étape 4 : construire l’offre',
      blocks: [
        { p: 'L’offre comprend en général le **cadre de prix complété** et un **mémoire technique**. C’est elle qui est notée selon les critères annoncés dans le RC, par exemple « prix 40 %, valeur technique 60 % ».' },
        { ol: [
          '**Chiffrez à partir du cadre fourni**, ligne par ligne, sans modifier les quantités ni les intitulés. Une ligne oubliée ou modifiée peut rendre l’offre irrégulière.',
          '**Rédigez le mémoire technique** en reprenant les sous-critères du RC dans l’ordre. Voir notre guide [mémoire technique](/guides/memoire-technique).',
          '**Vérifiez la cohérence** entre le prix, le planning et les moyens annoncés.',
          '**Lisez le CCAP** avant de fixer votre prix : pénalités de retard, délais de paiement, révision des prix ou non.',
          '**Respectez la forme demandée** : formats de fichiers, nombre de pages, nom des documents.',
        ] },
        { p: 'Un prix anormalement bas peut être rejeté : l’acheteur vous demande alors de le justifier. Ne cassez pas les prix pour gagner un premier marché : vous risquez de travailler à perte pendant toute sa durée.' },
      ],
    },
    {
      id: 'deposer',
      h2: 'Étape 5 : déposer le dossier à temps',
      blocks: [
        { p: 'Pour les marchés à partir de **60 000 € HT**, la candidature et l’offre passent par la plateforme de l’acheteur. En dessous, la voie électronique n’est pas obligatoire : le RC indique comment remettre le dossier (plateforme, adresse électronique dédiée, papier).' },
        { ul: [
          '**Déposez au moins la veille.** Un fichier lourd, une connexion lente ou un certificat à installer peuvent vous faire perdre une heure.',
          '**Vérifiez votre poste** avant le jour J : navigateur, outil de dépôt, éventuelle signature électronique si le RC l’exige.',
          '**Gardez l’accusé de réception** de la plateforme : il prouve la date et l’heure du dépôt.',
          '**Envoyez une copie de sauvegarde** si le RC le permet et que vous craignez un problème technique.',
        ] },
        { p: 'La réglementation n’impose pas de signer le DUME ni les formulaires DC1 et DC2, mais l’acheteur peut l’exiger : relisez le RC sur ce point.' },
        { note: 'Une offre reçue après la date et l’heure limites est en principe éliminée, même avec une minute de retard. Seule une panne de la plateforme elle-même, que vous devrez prouver, peut changer les choses.' },
      ],
    },
    {
      id: 'apres',
      h2: 'Étape 6 : après le dépôt',
      blocks: [
        { p: 'Pendant l’analyse, l’acheteur peut vous demander de **compléter votre candidature** si une pièce manque, ou de préciser votre offre. Répondez vite et dans le délai indiqué. Dans une procédure adaptée, il peut aussi **négocier** si le RC le prévoit : préparez vos marges de manœuvre.' },
        { p: '**Si vous êtes retenu**, l’acheteur vous demande vos attestations fiscales et sociales dans un délai qu’il fixe. Si vous ne les fournissez pas à temps, votre offre est rejetée et le marché passe au candidat suivant. Préparez-les donc dès le dépôt de l’offre.' },
        { p: '**Si vous êtes écarté**, demandez par écrit les motifs du rejet et, si possible, vos notes par critère. C’est la meilleure façon de progresser pour la prochaine consultation.' },
      ],
    },
  ],
  faq: [
    { q: 'Une micro-entreprise peut-elle répondre à un marché public ?', a: 'Oui. Toute entreprise peut candidater, quel que soit son statut. L’acheteur peut toutefois fixer des niveaux minimaux de capacité (chiffre d’affaires, références) : vérifiez-les dans le RC avant de vous lancer.' },
    { q: 'Puis-je répondre à un seul lot ?', a: 'Oui, sauf si le RC l’interdit. Vous indiquez dans votre candidature le ou les lots visés. Répondre à un lot proche de votre métier est souvent plus réaliste que viser tout le marché.' },
    { q: 'Je n’ai pas les capacités pour tout le marché : que faire ?', a: 'Vous pouvez répondre en groupement avec d’autres entreprises ou sous-traiter une partie des prestations. Voir nos guides [groupement](/guides/groupement-entreprises) et [sous-traitance](/guides/sous-traitance-dc4-paiement-direct).' },
    { q: 'Combien de temps faut-il pour répondre ?', a: 'Le délai de réponse est fixé par l’acheteur dans l’avis et le RC. Pour une procédure adaptée, il dépend de la complexité du marché. Commencez dès la parution : le temps passe vite entre la lecture du DCE, les questions et le chiffrage.' },
    { q: 'Peut-on m’aider à monter le dossier ?', a: 'Oui. Sur Marchés Direct, Elena peut vous accompagner sur votre dossier ; vous restez seul responsable de votre candidature et de votre offre. Vous pouvez aussi [poser une question](/question).' },
  ],
  // Vérifié le 6 nov. 2026 : seuils de dispense 100 000 € HT travaux (depuis le 1er janv. 2026) et 60 000 € HT fournitures
  // et services (depuis le 1er avril 2026), décret n° 2025-1386 du 29 déc. 2025 ; dématérialisation à partir de 60 000 € HT.
  sources: [
    { label: 'Entreprendre.Service-Public — Répondre au marché : préparer le dossier de candidature', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F32144' },
    { label: 'Entreprendre.Service-Public — Seuils de publicité des marchés publics', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F23371' },
    { label: 'Entreprendre.Service-Public — Actualité sur les nouveaux seuils des marchés publics (2026)', url: 'https://entreprendre.service-public.gouv.fr/actualites/A18673' },
  ],
  related: ['lire-avis-dce', 'dc1-dc2-dume', 'memoire-technique', 'pieces-attributaire'],
};
export default guide;
