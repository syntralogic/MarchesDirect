// Contenus de l'accueil v26 que le client fournit (message développeur, « Contenus que je fournis »).
// Tant qu'une valeur est vide, le bloc ou la ligne correspondante n'est PAS affichée : aucune photo, aucun
// témoignage, aucun numéro n'est inventé.
export const ELENA = {
  name: 'Elena Popescu',
  role: 'Chargée de relation',
  photo: '/team/elena.jpg' as string | null, // vraie photo (déjà sur le site : page « Qui sommes-nous »)
};

export interface TeamMember { name: string; role: string; photo: string; bio: string }
// Photos, prénoms et rôles de l'équipe, à fournir. Le bloc « Notre équipe » n'apparaît que si la photo d'Elena est fournie.
export const TEAM: TeamMember[] = [
  { name: 'Maria Ferreira', role: 'Chargée d’affaires', photo: '/team/maria.jpg', bio: 'Référente marchés privés : elle prépare la candidature avec vous jusqu’au dépôt' },
  { name: 'Bernard Delmas', role: 'Directeur général', photo: '/team/bernard.jpg', bio: 'Il valide chaque dossier avant son envoi' },
];

export interface VideoTestimonial { trade: string; result: string; who: string; duration: string; src: string; poster?: string }
// Témoignages vidéo réels uniquement (60–90 s, sous-titrés). Liste vide = le bloc n'apparaît pas.
export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [];

// Numéro de téléphone et SIRET de l'éditeur : à fournir (affichés seulement s'ils sont renseignés).
export const PHONE: string | null = null;
export const PUBLISHER_SIRET: string | null = null;
