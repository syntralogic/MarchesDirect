import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'retenue-de-garantie',
  category: 'Argent et paiement',
  title: 'La retenue de garantie : 5 % maximum, et comment l’éviter',
  metaTitle: 'Retenue de garantie marché public : 5 %, 3 % PME, caution',
  description: 'Retenue de garantie : 5 % maximum, 3 % pour les PME chez l’État et les grandes collectivités. La remplacer par une caution et la récupérer à temps.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 7,
  summary: [
    'La retenue de garantie est une somme que l’acheteur garde sur vos paiements pour couvrir les **réserves** (défauts constatés à la réception ou pendant le délai de garantie).',
    'Elle ne peut pas dépasser **5 %** du montant initial du marché. Pour une **PME**, le plafond est de **3 %** quand l’acheteur est l’État, une grande collectivité ou un grand établissement public de l’État.',
    'Vous pouvez la **remplacer** à tout moment par une **garantie à première demande**, ou par une **caution personnelle et solidaire** si l’acheteur ne s’y oppose pas.',
    'Elle doit vous être **remboursée dans les 30 jours** après la fin du délai de garantie, ou après la levée des réserves.',
  ],
  sections: [
    {
      id: 'definition',
      h2: 'À quoi sert la retenue de garantie ?',
      blocks: [
        { p: 'Quand le marché le prévoit, l’acheteur conserve un petit pourcentage de chaque paiement. Cet argent lui sert de garantie : si des défauts sont relevés à la réception (les « réserves ») et que vous ne les corrigez pas, il peut l’utiliser pour faire réaliser les reprises.' },
        { p: 'Selon l’article R2191-32 du code de la commande publique, la retenue couvre :' },
        { ul: [
          'les **réserves faites à la réception** des travaux, fournitures ou services ;',
          'le cas échéant, les réserves formulées **pendant le délai de garantie**, pour des défauts qui n’étaient pas visibles à la réception ou dont les conséquences n’étaient pas identifiables à ce moment-là.',
        ] },
        { p: 'Elle n’est pas automatique : vérifiez dans le cahier des clauses administratives particulières (CCAP) si une retenue est prévue et à quel taux. Le délai de garantie est lui aussi fixé par le marché.' },
        { note: 'La retenue de garantie pèse sur votre trésorerie : sur un marché de 100 000 € TTC, 5 % représentent 5 000 € bloqués jusqu’à la fin du délai de garantie. Intégrez-la à votre plan de trésorerie dès la remise de l’offre.' },
      ],
    },
    {
      id: 'plafond',
      h2: 'Le plafond : 5 %, et 3 % pour les PME chez certains acheteurs',
      blocks: [
        { p: 'Le montant de la retenue de garantie **ne peut pas dépasser 5 %** du montant initial du marché, augmenté le cas échéant du montant des modifications (avenants) intervenues en cours d’exécution (article R2191-33).' },
        { p: 'Depuis le décret n° 2024-1251 du 30 décembre 2024, pour les consultations lancées à partir du 1er janvier 2025, ce plafond descend à **3 %** quand le titulaire est une **PME** et que l’acheteur est :' },
        { table: {
          head: ['Acheteur', 'Plafond si vous êtes une PME', 'Plafond sinon'],
          rows: [
            ['L’État', '**3 %**', '5 %'],
            ['Établissements publics administratifs de l’État (hors hôpitaux) dont les dépenses de fonctionnement dépassent **60 millions d’euros**', '**3 %**', '5 %'],
            ['Collectivités territoriales, leurs groupements et établissements publics dont les dépenses réelles de fonctionnement dépassent **60 millions d’euros**', '**3 %**', '5 %'],
            ['Autres acheteurs', '5 %', '5 %'],
          ],
        } },
        { p: 'Si le CCAP prévoit un taux supérieur au plafond qui vous concerne, signalez-le à l’acheteur : il ne peut pas appliquer plus que ce que permet le code.' },
        { h3: 'Comment elle est prélevée' },
        { p: 'La retenue est prélevée par fractions sur chacun de vos paiements : acomptes, paiements partiels définitifs et solde (article R2191-34). Si ces paiements ne suffisent pas à couvrir le montant total, vous devez compléter avec une garantie à première demande.' },
      ],
    },
    {
      id: 'eviter',
      h2: 'L’éviter : la garantie à première demande ou la caution',
      blocks: [
        { p: 'Vous pouvez **substituer** à la retenue de garantie, **pendant toute la durée du marché** (article R2191-36) :' },
        { ul: [
          'une **garantie à première demande** : votre banque ou un organisme de caution s’engage à payer l’acheteur dès qu’il le demande, sans pouvoir discuter ;',
          'ou, **si l’acheteur ne s’y oppose pas**, une **caution personnelle et solidaire** : le garant s’engage à payer si vous ne remplissez pas vos obligations.',
        ] },
        { p: 'Dans les deux cas, l’acheteur vous paie alors l’intégralité de vos factures, sans rien garder. La garantie porte sur le montant total du marché, avenants compris, mais **ne peut pas dépasser** le montant de la retenue qu’elle remplace.' },
        { h3: 'Le bon moment pour la fournir' },
        { p: 'Idéalement, **avant votre première demande d’acompte**. Si la garantie n’est pas constituée à cette date, l’acheteur prélève la retenue sur cet acompte. Si vous la fournissez plus tard, les sommes déjà retenues vous sont **reversées** (article R2191-40).' },
        { p: 'Le garant doit être un établissement agréé par l’Autorité de contrôle prudentiel et de résolution (ACPR) : banque, assureur ou société de caution mutuelle. L’acheteur peut récuser le garant proposé.' },
        { h3: 'Ce que ça coûte' },
        { p: 'Une garantie bancaire n’est pas gratuite : votre banque facture en général une commission. Comparez ce coût à celui de 3 % ou 5 % de votre chiffre d’affaires bloqués pendant des mois. Banques, assureurs et sociétés de caution mutuelle peuvent la délivrer : demandez plusieurs devis.' },
        { note: 'En groupement d’entreprises, chaque membre fournit une garantie pour sa part, sauf si le mandataire est solidaire de tous les membres. Voir notre guide sur le [groupement d’entreprises](/guides/groupement-entreprises).' },
      ],
    },
    {
      id: 'restitution',
      h2: 'Récupérer la retenue à la fin du marché',
      blocks: [
        { p: 'Selon l’article R2191-35, la retenue de garantie doit vous être **remboursée dans un délai de 30 jours** après la fin du délai de garantie.' },
        { p: 'Si des réserves ont été notifiées et ne sont pas levées à la fin du délai de garantie, le remboursement intervient dans les **30 jours après leur levée**. De même, une garantie à première demande ou une caution est libérée **au plus tard un mois** après la fin du délai de garantie, ou après la levée des réserves (article R2191-42).' },
        { p: 'Pour récupérer votre argent rapidement :' },
        { ol: [
          'Notez dans votre agenda la **date de fin du délai de garantie**, en vérifiant dans le CCAP sa durée et son point de départ.',
          'Levez les réserves au plus vite, et faites-le **constater par écrit** par l’acheteur ou le maître d’œuvre.',
          'Un mois avant l’échéance, écrivez à l’acheteur pour demander le remboursement de la retenue ou la mainlevée de la garantie.',
          'Sans réponse après 30 jours, relancez en rappelant l’article R2191-35 et votre droit aux [intérêts moratoires](/guides/delais-paiement-marches-publics) en cas de retard.',
        ] },
        { note: 'Ne confondez pas : la retenue de garantie ne remplace pas vos **assurances** (responsabilité civile, garantie décennale en travaux). Elle ne couvre que les réserves liées au marché, pendant le délai de garantie.' },
      ],
    },
  ],
  faq: [
    { q: 'La retenue de garantie est-elle obligatoire ?', a: 'Non. L’acheteur choisit de la prévoir ou non dans le marché. Lisez le CCAP : s’il ne prévoit pas de retenue, l’acheteur ne peut pas en appliquer une.' },
    { q: 'Quelle différence entre retenue de garantie et garantie à première demande ?', a: 'Avec la retenue, l’acheteur garde une partie de votre argent. Avec la garantie à première demande, il vous paie tout et c’est votre banque ou votre garant qui s’engage à payer en cas de problème. Le montant couvert ne peut pas dépasser celui de la retenue remplacée.' },
    { q: 'Puis-je remplacer la retenue en cours de chantier ?', a: 'Oui, à tout moment pendant la durée du marché. Les sommes déjà retenues vous sont alors reversées.' },
    { q: 'L’acheteur ne me rend pas ma retenue, que faire ?', a: 'Relancez-le par écrit en rappelant la date de fin du délai de garantie et le délai de 30 jours. Si vous avez besoin d’aide pour rédiger votre courrier, posez votre question sur [notre formulaire](/question) : Elena peut vous accompagner.' },
  ],
  // Vérifié le 6 nov. 2026 : R2191-32 à R2191-42 ; R2191-33 modifié par le décret n° 2024-1251 du 30 déc. 2024 (taux 3 % PME, consultations à partir du 1er janv. 2025).
  sources: [
    { label: 'Légifrance — Code de la commande publique, section « Garanties » (articles R2191-32 à R2191-44)', url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000037701019/LEGISCTA000037724885/2020-02-12' },
    { label: 'Direction des affaires juridiques (ministère de l’Économie) — Fiche technique « Les garanties financières »', url: 'https://www.economie.gouv.fr/files/files/directions_services/daj/marches_publics/conseil_acheteurs/fiches-techniques/preparation-procedure/garanties-financieres-2019.pdf' },
  ],
  related: ['avance-marche-public', 'delais-paiement-marches-publics', 'groupement-entreprises'],
};
export default guide;
