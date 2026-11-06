// Catalogue léger des guides (titres seulement) pour les liens depuis les pages locales, sans charger le texte
// complet dans le paquet principal. Un test vérifie qu'il reste identique aux guides (src/content/guides/index.ts).
export interface GuideRef { slug: string; title: string }

export const GUIDE_CATALOG: GuideRef[] = [
  { slug: 'repondre-marche-public-artisan', title: 'Répondre à un marché public quand on est artisan ou TPE : la méthode pas à pas' },
  { slug: 'trouver-appels-offres', title: 'Où trouver les appels d’offres publics et privés (et lesquels viser)' },
  { slug: 'lire-avis-dce', title: 'Lire un avis de marché et un dossier de consultation (DCE) sans rien rater' },
  { slug: 'dc1-dc2-dume', title: 'DC1, DC2 et DUME : les formulaires de candidature expliqués simplement' },
  { slug: 'memoire-technique', title: 'Rédiger un mémoire technique qui convainc l’acheteur' },
  { slug: 'pieces-attributaire', title: 'Vous êtes retenu : les attestations à fournir avant de signer' },
  { slug: 'seuils-marches-publics', title: 'Seuils des marchés publics : ce qui change selon le montant' },
  { slug: 'procedure-adaptee-mapa', title: 'Le marché à procédure adaptée (MAPA) : la porte d’entrée des petites entreprises' },
  { slug: 'criteres-attribution', title: 'Critères d’attribution : comment l’acheteur choisit l’offre gagnante' },
  { slug: 'avance-marche-public', title: 'L’avance dans un marché public : combien, quand et comment l’obtenir' },
  { slug: 'delais-paiement-marches-publics', title: 'Délais de paiement d’un marché public : se faire payer à temps' },
  { slug: 'retenue-de-garantie', title: 'La retenue de garantie : 5 % maximum, et comment l’éviter' },
  { slug: 'revision-des-prix', title: 'Révision des prix : se protéger contre la hausse des matériaux' },
  { slug: 'sous-traitance-dc4-paiement-direct', title: 'Sous-traiter dans un marché public : DC4, acceptation et paiement direct' },
  { slug: 'groupement-entreprises', title: 'Répondre à plusieurs : groupement conjoint ou solidaire ?' },
];

const LOCAL: Record<string, string[]> = {
  public_procurement: ['repondre-marche-public-artisan', 'dc1-dc2-dume', 'memoire-technique', 'procedure-adaptee-mapa'],
  tender: ['trouver-appels-offres', 'memoire-technique', 'lire-avis-dce', 'groupement-entreprises'],
  subcontracting: ['sous-traitance-dc4-paiement-direct', 'groupement-entreprises', 'delais-paiement-marches-publics', 'repondre-marche-public-artisan'],
};
export const localGuides = (journey: string): GuideRef[] =>
  (LOCAL[journey] || LOCAL.public_procurement).map(s => GUIDE_CATALOG.find(g => g.slug === s)).filter(Boolean) as GuideRef[];
