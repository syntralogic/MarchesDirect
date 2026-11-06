import type { Guide } from '../guideModel.js';
import memoireTechnique from './memoire-technique.js';

// Liste des guides publiés. Ajouter un guide : créer son fichier, l'importer ici, l'ajouter au catalogue (catalog.ts).
export const GUIDES: Guide[] = [
  memoireTechnique,
];

export const GUIDE_CATEGORIES: Guide['category'][] = ['Répondre', 'Documents', 'Comprendre les règles', 'Argent et paiement', 'Travailler à plusieurs'];

export const GUIDES_INTRO = {
  h1: 'Guides pratiques : répondre aux marchés publics et appels d’offres',
  metaTitle: 'Guides marchés publics pour artisans et PME | Marchés Direct',
  description: 'Guides gratuits et vérifiés pour artisans et PME : candidature, DC1, DC2, DUME, mémoire technique, seuils, avance, paiement, sous-traitance.',
  text: 'Des guides écrits pour les artisans et les petites entreprises : comment trouver une consultation, préparer sa candidature, rédiger son offre et se faire payer. Chaque règle citée est vérifiée sur les textes officiels, avec la date de vérification.',
};

export const guideBySlug = (slug: string): Guide | undefined => GUIDES.find(g => g.slug === slug);
