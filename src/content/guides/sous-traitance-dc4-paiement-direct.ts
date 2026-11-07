import type { Guide } from '../guideModel.js';

const guide: Guide = {
  slug: 'sous-traitance-dc4-paiement-direct',
  category: 'Travailler à plusieurs',
  title: 'Sous-traiter dans un marché public : DC4, acceptation et paiement direct',
  metaTitle: 'Sous-traitance marché public : DC4 et paiement direct',
  description: 'Déclarer un sous-traitant avec le DC4, le faire accepter, obtenir le paiement direct dès 600 € TTC : la marche à suivre pour le titulaire et le sous-traitant.',
  published: '2026-11-06',
  updated: '2026-11-06',
  checked: '2026-11-06',
  minutes: 8,
  summary: [
    'Le titulaire doit faire **accepter chaque sous-traitant** et faire **agréer ses conditions de paiement** par l’acheteur. Le formulaire habituel pour le faire est le **DC4**.',
    'La déclaration peut se faire dès l’offre, ou plus tard en cours de marché par un **acte spécial**. Sans réponse de l’acheteur pendant **21 jours**, le sous-traitant est accepté.',
    'Un sous-traitant direct accepté est **payé directement par l’acheteur** dès que son contrat atteint **600 € TTC**. Il ne peut pas y renoncer.',
    'Le titulaire a **15 jours** pour accepter ou refuser la demande de paiement du sous-traitant ; s’il ne dit rien, elle est réputée acceptée.',
    'Un sous-traitant de **second rang** n’a pas droit au paiement direct : il doit recevoir une **caution** ou une **délégation de paiement**.',
  ],
  sections: [
    {
      id: 'sous-traitant-ou-cotraitant',
      h2: 'Sous-traitant ou cotraitant : bien faire la différence',
      blocks: [
        { p: 'Le **sous-traitant** signe un contrat avec le titulaire du marché, pas avec l’acheteur. Le titulaire lui confie une partie du travail et reste **seul responsable** de toute l’exécution vis-à-vis de l’acheteur.' },
        { p: 'Le **cotraitant**, lui, est membre d’un groupement : il signe le marché avec l’acheteur, aux côtés des autres membres. Si vous hésitez entre les deux formules, lisez notre guide sur le [groupement d’entreprises](/guides/groupement-entreprises).' },
        { p: 'La sous-traitance est encadrée par le code de la commande publique (articles L2193-1 et suivants, R2193-1 et suivants) et par la loi n° 75-1334 du 31 décembre 1975 relative à la sous-traitance.' },
      ],
    },
    {
      id: 'declarer-dc4',
      h2: 'Déclarer le sous-traitant : le DC4',
      blocks: [
        { p: 'Le titulaire doit obtenir l’**acceptation** de chaque sous-traitant et l’**agrément de ses conditions de paiement** (article L2193-4). Les deux vont ensemble. La déclaration doit indiquer (article R2193-1) :' },
        { ul: [
          'la nature des prestations sous-traitées ;',
          'le nom, la raison sociale et l’adresse du sous-traitant ;',
          'le **montant maximum** des sommes à lui verser ;',
          'les conditions de paiement prévues au contrat de sous-traitance et, le cas échéant, les modalités de variation des prix ;',
          'le cas échéant, les capacités du sous-traitant sur lesquelles le candidat s’appuie.',
        ] },
        { p: 'Le sous-traitant fournit aussi une déclaration indiquant qu’il n’est dans aucun cas d’exclusion des marchés publics.' },
        { p: 'Le formulaire **DC4** de la Direction des affaires juridiques (ministère de l’Économie) réunit toutes ces informations. Sa version actuelle, à utiliser depuis le 1er janvier 2024, comporte une rubrique sur la **durée de la sous-traitance en mois**. Téléchargez toujours la dernière version sur le site de la DAJ.' },
        { note: 'Le montant inscrit dans le DC4 est un **plafond**. Si le sous-traitant doit finalement faire plus de travaux, faites accepter un **acte spécial modificatif** avant qu’il les exécute.' },
      ],
    },
    {
      id: 'acceptation',
      h2: 'L’acceptation : à l’offre ou en cours de marché',
      blocks: [
        { h3: 'Dès la remise de l’offre' },
        { p: 'Vous joignez le DC4 à votre offre. Si vous êtes retenu, la **notification du marché** vaut acceptation du sous-traitant et agrément de ses conditions de paiement (article R2193-2).' },
        { h3: 'Après la signature du marché' },
        { p: 'Vous remettez à l’acheteur un **acte spécial** (en pratique, un DC4), contre récépissé ou par lettre recommandée avec accusé de réception. Vous devez aussi prouver qu’aucune cession ou aucun nantissement de créance ne bloque le paiement direct (articles R2193-3 et R2193-4).' },
        { p: 'Si l’acheteur ne répond pas dans les **21 jours** suivant la réception du dossier complet, son silence vaut acceptation du sous-traitant et agrément de ses conditions de paiement.' },
        { note: 'Ne faites jamais démarrer un sous-traitant avant son acceptation. Un sous-traitant non accepté n’a pas droit au paiement direct, et le titulaire s’expose aux mesures prévues par le CCAP en cas de sous-traitance non déclarée.' },
      ],
    },
    {
      id: 'paiement-direct',
      h2: 'Le paiement direct par l’acheteur',
      blocks: [
        { p: 'Le sous-traitant **direct** du titulaire, accepté et dont les conditions de paiement sont agréées, est **payé directement par l’acheteur** pour la part du marché dont il assure l’exécution (articles L2193-10 et L2193-11).' },
        { ul: [
          '**Seuil** : le paiement direct s’applique quand le montant du contrat de sous-traitance est égal ou supérieur à **600 € TTC** (article R2193-10). Pour certains marchés de défense, le seuil est de 10 % du montant total du marché.',
          '**Pas de renonciation possible** : toute clause par laquelle le sous-traitant renonce au paiement direct est réputée non écrite (article L2193-11).',
          '**Même en cas de difficulté du titulaire** : le paiement direct reste dû si le titulaire est en sauvegarde, en redressement ou en liquidation judiciaire (article L2193-12).',
        ] },
        { p: 'En dessous du seuil, ce sont les règles du titre III de la loi de 1975 qui s’appliquent (action directe contre l’acheteur si le titulaire ne paie pas).' },
        { h3: 'La demande de paiement, étape par étape' },
        { ol: [
          'Le sous-traitant envoie sa demande de paiement au **titulaire**, par un moyen qui prouve la date de réception (ou en la déposant contre récépissé) (article R2193-11).',
          'Le titulaire a **15 jours** pour donner son accord ou notifier un refus, au sous-traitant et à l’acheteur (article R2193-12). Passé ce délai, il est réputé avoir accepté (article R2193-13).',
          'Le sous-traitant envoie aussi sa demande à l’**acheteur**, avec la preuve que le titulaire l’a reçue (article R2193-14).',
          'Quand la facture passe par le **portail public de facturation** (Chorus Pro), le sous-traitant y dépose sa demande ; le délai de 15 jours du titulaire court à partir du dépôt (article R2193-16).',
        ] },
        { p: 'L’acheteur paie ensuite dans les délais de paiement habituels : voyez notre guide sur les [délais de paiement](/guides/delais-paiement-marches-publics).' },
      ],
    },
    {
      id: 'second-rang',
      h2: 'La sous-traitance de second rang',
      blocks: [
        { p: 'Si votre sous-traitant confie lui-même une partie du travail à une autre entreprise, celle-ci est un sous-traitant de **second rang**. Votre sous-traitant devient alors l’« entrepreneur principal » de ce second rang.' },
        { ul: [
          'Le second rang doit lui aussi être **déclaré et accepté** par l’acheteur, avec ses conditions de paiement, au moyen d’un DC4 distinct.',
          'Il n’a **pas droit au paiement direct**, réservé au sous-traitant direct du titulaire.',
          'Pour le protéger, le sous-traitant de premier rang doit lui fournir une **caution personnelle et solidaire** ou une **délégation de paiement** (article L2193-14, qui renvoie à l’article 14 de la loi de 1975).',
        ] },
        { p: 'Avec une délégation de paiement, l’acheteur paie directement le second rang, sur instruction du premier rang, en déduisant ces sommes de ce qu’il doit au premier rang. Le CCAG Travaux prévoit que le second rang ne commence pas ses travaux avant que la caution ait été reçue par le maître d’ouvrage ou que la délégation soit signée : vérifiez la clause applicable dans votre CCAP.' },
      ],
    },
    {
      id: 'bons-reflexes',
      h2: 'Les bons réflexes',
      blocks: [
        { ul: [
          '**Titulaire** : déclarez vos sous-traitants dès l’offre quand vous les connaissez. Vous pouvez faire valoir leurs capacités dans votre candidature, et l’acceptation est acquise dès la notification.',
          '**Titulaire** : prévoyez dans le DC4 un montant maximum réaliste, pour éviter les actes spéciaux modificatifs.',
          '**Sous-traitant** : demandez une copie du DC4 signé ou de l’acte spécial avant de commencer. Sans acceptation, pas de paiement direct.',
          '**Sous-traitant** : gardez la preuve de réception de chaque demande de paiement envoyée au titulaire, et envoyez toujours la copie à l’acheteur.',
          '**Tous** : vérifiez qu’aucune cession de créance du titulaire (affacturage, nantissement) ne couvre la part sous-traitée.',
        ] },
      ],
    },
  ],
  faq: [
    { q: 'Le paiement direct est-il automatique ?', a: 'Il est de droit, mais à trois conditions : être sous-traitant direct du titulaire, avoir été accepté avec des conditions de paiement agréées, et avoir un contrat de sous-traitance d’au moins 600 € TTC. Il faut ensuite suivre la procédure de demande de paiement.' },
    { q: 'Le titulaire peut-il bloquer ma demande de paiement ?', a: 'Il a 15 jours pour l’accepter ou la refuser, en notifiant sa décision à vous et à l’acheteur. S’il ne répond pas dans ce délai, il est réputé avoir accepté les pièces de votre demande.' },
    { q: 'Peut-on déclarer un sous-traitant après la signature du marché ?', a: 'Oui, à tout moment de l’exécution, par un acte spécial. L’acheteur a 21 jours pour répondre ; son silence vaut acceptation. Le sous-traitant ne doit pas commencer avant.' },
    { q: 'Le DC4 est-il obligatoire ?', a: 'Les informations de la déclaration de sous-traitance sont obligatoires ; le formulaire DC4 de la DAJ est le modèle le plus utilisé pour les donner. Utilisez le modèle demandé par le règlement de la consultation s’il en impose un.' },
    { q: 'Peut-on m’aider à remplir un DC4 ?', a: 'Oui. Sur Marchés Direct, Elena peut vous accompagner pour préparer votre déclaration de sous-traitance. Vous pouvez aussi [poser une question](/question).' },
  ],
  // Vérifié le 6 nov. 2026 : L2193-4, L2193-10 à L2193-12, L2193-14, R2193-1 à R2193-4, R2193-10 à R2193-16 ; DC4 (version à utiliser depuis le 1er janv. 2024).
  // La loi n° 2026-403 du 26 mai 2026 (art. 19) précise le champ de la sous-traitance en travaux (acheteur maître d’ouvrage) : sans effet sur les règles ci-dessus.
  sources: [
    { label: 'Légifrance — Acceptation du sous-traitant et agrément des conditions de paiement (articles R2193-1 à R2193-9)', url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000037701019/LEGISCTA000037725067/' },
    { label: 'Légifrance — Paiement du sous-traitant (articles L2193-10 à L2193-13)', url: 'https://www.legifrance.gouv.fr/codes/id/LEGISCTA000037703821' },
    { label: 'Direction des affaires juridiques — Notice explicative du formulaire DC4', url: 'https://www.economie.gouv.fr/files/files/directions_services/daj/marches_publics/formulaires/DC/imprimes_dc/20190313-Notice-DC4-maj20231122.pdf' },
    { label: 'Légifrance — Loi n° 75-1334 du 31 décembre 1975 relative à la sous-traitance', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000889241/' },
  ],
  related: ['groupement-entreprises', 'delais-paiement-marches-publics', 'dc1-dc2-dume'],
};
export default guide;
