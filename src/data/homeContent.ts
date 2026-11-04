// Contenus de l'accueil v26 que le client fournit (message développeur, « Contenus que je fournis »).
// Tant qu'une valeur est vide, le bloc ou la ligne correspondante n'est PAS affichée : aucune photo, aucun
// témoignage, aucun numéro n'est inventé.
export const ELENA = {
  name: 'Elena Popescu',
  role: 'Chargée de relation',
  photo: null as string | null, // URL de la photo d'Elena, à fournir
};

export interface TeamMember { name: string; role: string; photo: string; bio: string }
// Photos, prénoms et rôles de l'équipe, à fournir. Le bloc « Notre équipe » n'apparaît que si la photo d'Elena est fournie.
export const TEAM: TeamMember[] = [];

export interface VideoTestimonial { trade: string; result: string; who: string; duration: string; src: string; poster?: string; subtitled?: boolean }
// Témoignages vidéo réels uniquement (ceux déjà publiés sur le site). Liste vide = le bloc n’apparaît pas.
export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  { trade: 'Électricité', result: '10 mois de planning rempli', who: 'Didier Bourdon, Bordeaux Élec', duration: '1 min 27', src: '/testimonials/temoignage-didier-bourdon.mp4', poster: '/testimonials/temoignage-didier-bourdon.jpeg' },
  { trade: 'Chauffage et climatisation', result: 'Nico, gérant, raconte sa candidature', who: 'Nico, gérant', duration: '1 min 01', src: '/testimonials/temoignage-nico.mp4', poster: '/testimonials/temoignage-nico.jpeg' },
];

// Numéro de téléphone et SIRET de l'éditeur : à fournir (affichés seulement s'ils sont renseignés).
export const PHONE: string | null = null;
export const PUBLISHER_SIRET: string | null = null;
