import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'delais-paiement-marches-publics',
  category: 'Argent et paiement',
  title: 'Délais de paiement d’un marché public : se faire payer à temps',
  metaTitle: 'Délais de paiement marché public : 30 jours et intérêts',
  description: '30 jours pour la plupart des acheteurs publics, intérêts moratoires à 10,40 % au 2e semestre 2026, 40 € par facture, Chorus Pro : vos droits.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 8,
  summary: [
    'L’acheteur public doit vous payer dans un délai maximal de **30 jours** (50 jours pour les hôpitaux publics, 60 jours pour les entreprises publiques). Le marché ne peut pas prévoir plus long.',
    'Le délai part de la **réception de votre facture**. Pour l’envoyer, **Chorus Pro** est obligatoire pour toutes les entreprises, même les micro-entreprises.',
    'En cas de retard, vous avez droit **automatiquement** à des intérêts moratoires (**10,40 %** par an pour les retards qui commencent au 2e semestre 2026) et à une **indemnité de 40 €** par facture.',
    'Vous ne pouvez pas renoncer à ces intérêts : une clause qui le prévoit est sans effet.',
  ],
  sections: [
    {
      id: 'delais-maximaux',
      h2: 'Les délais maximaux selon l’acheteur',
      blocks: [
        { p: 'Le code de la commande publique fixe un délai **maximal**. Le marché peut prévoir plus court, jamais plus long (articles L2192-10, R2192-10 et R2192-11).' },
        { table: {
          head: ['Acheteur', 'Délai maximal de paiement'],
          rows: [
            ['État, collectivités territoriales (communes, départements, régions, intercommunalités), et la plupart des établissements publics', '**30 jours**'],
            ['Établissements publics de santé (hôpitaux) et établissements du service de santé des armées', '**50 jours**'],
            ['Entreprises publiques (hors établissements publics locaux)', '**60 jours**'],
          ],
        } },
        { p: 'Le même délai s’applique à un **sous-traitant payé directement** par l’acheteur. Pour lui, il court à partir de l’accord du titulaire sur sa demande de paiement, ou de l’expiration du délai laissé au titulaire pour répondre.' },
        { note: 'Ce délai de 30 jours est un délai **global** : il comprend le temps de traitement par les services de l’acheteur et, le cas échéant, par le comptable public. Une collectivité ne peut pas vous opposer « le délai du Trésor » pour payer plus tard.' },
      ],
    },
    {
      id: 'point-de-depart',
      h2: 'À partir de quand le délai court-il ?',
      blocks: [
        { p: 'En règle générale, le délai démarre à la **réception de votre demande de paiement** (facture, situation de travaux) par l’acheteur, ou par le maître d’œuvre si le marché le prévoit. Quelques précisions utiles :' },
        { ul: [
          '**Facture sur Chorus Pro** : la date de réception est celle de la notification du dépôt sur le portail. Vous avez donc une date certaine, horodatée.',
          '**Facture envoyée avant la fin du travail** : le délai ne court qu’à partir de l’exécution des prestations.',
          '**Vérification de conformité** prévue au marché : le délai peut partir de la date où la conformité est constatée. Cette vérification ne peut pas dépasser **30 jours**, sauf durée plus longue prévue au marché et non abusive. Sans réponse, les prestations sont réputées conformes.',
          '**Solde d’un marché de travaux** : le délai part de la réception par le maître d’ouvrage du **décompte général et définitif**.',
          '**Maître d’œuvre** : son délai d’intervention est fixé au marché et ne peut pas dépasser **15 jours** quand il s’ajoute au délai de paiement. Son intervention ne rallonge pas le délai imposé à l’acheteur.',
        ] },
        { h3: 'L’acheteur peut-il « suspendre » le délai ?' },
        { p: 'Oui, mais **une seule fois**, et seulement si votre demande de paiement est incomplète, erronée ou incohérente (article R2192-27). Il doit vous le notifier par un moyen qui donne une date certaine, en indiquant les motifs et les pièces à fournir. Quand vous envoyez les pièces complètes, un **nouveau délai de 30 jours** s’ouvre (ou le reste du délai s’il est plus long).' },
        { note: 'Une facture bien remplie évite la plupart des suspensions : numéro d’engagement ou bon de commande, SIRET de l’acheteur, code service, références du marché, montant HT, TVA, TTC, et pièces justificatives (situation de travaux, attestation de service fait si demandée).' },
      ],
    },
    {
      id: 'chorus-pro',
      h2: 'Chorus Pro : la facture électronique obligatoire',
      blocks: [
        { p: 'Depuis le **1er janvier 2020**, toutes les entreprises qui travaillent pour l’État, une collectivité ou un établissement public doivent leur envoyer leurs factures sous forme électronique, **quelle que soit leur taille**. Le portail public gratuit pour cela s’appelle **Chorus Pro**.' },
        { p: 'Chorus Pro vous permet de :' },
        { ul: [
          'déposer un fichier ou saisir directement votre facture ;',
          'joindre les pièces complémentaires ;',
          'suivre le traitement de la facture, étape par étape ;',
          'savoir quand le paiement a été effectué.',
        ] },
        { p: 'Une facture papier ou un simple PDF envoyé par courriel ne respecte pas cette obligation : passez systématiquement par le portail. Créez votre compte Chorus Pro dès que vous remportez votre premier marché.' },
        { p: 'Le **suivi** sur Chorus Pro est votre meilleur outil : la date de dépôt sert de point de départ au délai et de preuve en cas de retard.' },
      ],
    },
    {
      id: 'interets-moratoires',
      h2: 'Les intérêts moratoires : votre droit en cas de retard',
      blocks: [
        { p: 'Si l’acheteur dépasse le délai, des **intérêts moratoires** courent **de plein droit**, sans mise en demeure ni formalité, à partir du lendemain de l’expiration du délai et jusqu’à la date de mise en paiement (articles L2192-13 et R2192-31 et suivants).' },
        { h3: 'Le taux' },
        { p: 'Le taux est égal au taux de la Banque centrale européenne (BCE) en vigueur au premier jour du semestre où le retard a commencé, **majoré de 8 points**.' },
        { table: {
          head: ['Le retard a commencé…', 'Taux BCE de référence', 'Taux des intérêts moratoires'],
          rows: [
            ['du 1er janvier au 30 juin 2026', '2,15 %', '**10,15 %**'],
            ['du 1er juillet au 31 décembre 2026', '2,40 %', '**10,40 %**'],
          ],
        } },
        { h3: 'Le calcul' },
        { p: '**Intérêts = montant payé en retard × taux × nombre de jours de retard ÷ 365.** Le montant de base est le montant TTC de la facture, diminué de la retenue de garantie éventuelle.' },
        { p: '**Exemple.** Une facture de 10 000 € TTC payée avec 20 jours de retard, retard commencé en septembre 2026 : 10 000 × 10,40 % × 20 ÷ 365 = **56,99 €** d’intérêts, plus l’indemnité forfaitaire de 40 €.' },
        { p: 'Le site officiel entreprendre.service-public.gouv.fr propose un [simulateur des intérêts moratoires](https://entreprendre.service-public.gouv.fr/simulateur/calcul/interets-moratoires) pour faire le calcul.' },
        { h3: 'L’indemnité forfaitaire de 40 €' },
        { p: 'S’ajoute aux intérêts une **indemnité forfaitaire de 40 €** pour frais de recouvrement (article D2192-35). Si vos frais réels sont plus élevés, vous pouvez demander une indemnisation complémentaire, sur justificatifs.' },
        { p: 'Les intérêts et l’indemnité doivent vous être payés dans les **45 jours** qui suivent la mise en paiement de la facture. **Toute renonciation** à ces intérêts est réputée non écrite (article L2192-14) : même si vous avez signé une clause disant le contraire, ils restent dus.' },
      ],
    },
    {
      id: 'que-faire',
      h2: 'Que faire si vous n’êtes pas payé ?',
      blocks: [
        { ol: [
          '**Vérifiez sur Chorus Pro** où en est la facture : rejetée, suspendue, en attente de validation, mise en paiement ?',
          '**Contactez le service** indiqué dans le marché (souvent le service qui a passé la commande) : un appel règle beaucoup de blocages, par exemple une attestation de service fait non signée.',
          '**Relancez par écrit** en rappelant la date de dépôt de la facture, le délai applicable et votre droit aux intérêts moratoires et à l’indemnité de 40 €.',
          '**Si les intérêts ne sont pas versés** avec le principal, réclamez-les par écrit en joignant votre calcul.',
          '**En dernier recours**, le juge administratif peut être saisi. Faites-vous conseiller avant d’engager une procédure.',
        ] },
        { note: 'Gardez une trace de tout : captures Chorus Pro, courriels, accusés de réception. En cas de désaccord sur le montant, l’acheteur doit payer la partie qu’il admet ; la différence produira des intérêts si elle vous est finalement due.' },
      ],
    },
  ],
  faq: [
    { q: 'Une mairie peut-elle me payer à 45 ou 60 jours ?', a: 'Non. Pour une commune, comme pour l’État et les autres collectivités, le délai maximal est de 30 jours. Une clause prévoyant un délai plus long ne peut pas s’appliquer : c’est le délai réglementaire qui compte.' },
    { q: 'Dois-je réclamer les intérêts moratoires pour les obtenir ?', a: 'En principe non : ils sont dus automatiquement dès que le délai est dépassé, sans mise en demeure. Dans la pratique, il est utile de vérifier qu’ils ont bien été versés et de les réclamer par écrit sinon.' },
    { q: 'Le délai de 30 jours s’applique-t-il aussi à l’avance ?', a: 'Oui. Pour l’avance, le délai court à partir de la notification du marché, ou de la réception de la garantie si l’acheteur en exige une. Voir notre guide sur [l’avance dans un marché public](/guides/avance-marche-public).' },
    { q: 'Je suis sous-traitant, qui doit me payer ?', a: 'Si vous êtes accepté avec paiement direct, c’est l’acheteur public qui vous paie, dans le même délai que le titulaire. Voir [sous-traitance et paiement direct](/guides/sous-traitance-dc4-paiement-direct). Pour une question précise sur votre dossier, Elena peut vous répondre via [notre formulaire](/question).' },
  ],
  // Vérifié le 6 nov. 2026 : L2192-10, L2192-13, L2192-14, R2192-10 à R2192-29, R2192-31 à R2192-36, D2192-35.
  // Taux BCE 2,40 % (opération du 30 juin 2026, publié au BOE espagnol du 1er juil. 2026) ; 2,15 % au 1er janv. 2026 (FNTP, 1er juil. 2026).
  sources: [
    { label: 'Ministère de l’Économie — Marchés publics : la facturation électronique, comment ça fonctionne ?', url: 'https://www.economie.gouv.fr/entreprises/gerer-sa-comptabilite-et-ses-demarches/marches-publics-la-facturation-electronique' },
    { label: 'Entreprendre.Service-Public.fr — Simulateur des intérêts moratoires d’un marché public', url: 'https://entreprendre.service-public.gouv.fr/simulateur/calcul/interets-moratoires' },
  ],
  related: ['avance-marche-public', 'retenue-de-garantie', 'revision-des-prix'],
};
export default guide;
