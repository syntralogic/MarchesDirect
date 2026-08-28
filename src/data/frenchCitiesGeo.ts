// Curated set of French cities/towns with approximate coordinates, used to
// progressively reveal markers on the "Villes" map as the user zooms in.
// tier 1: always visible (major cities) · tier 2: visible from medium zoom
// tier 3: visible only when zoomed in close (smaller towns)
export interface CityGeo {
  name: string;
  coords: [number, number]; // [lng, lat]
  tier: 1 | 2 | 3;
}

export const frenchCitiesGeo: CityGeo[] = [
  // Tier 1 — major cities, always visible
  { name: 'Paris', coords: [2.3522, 48.8566], tier: 1 },
  { name: 'Marseille', coords: [5.3698, 43.2965], tier: 1 },
  { name: 'Lyon', coords: [4.8357, 45.7640], tier: 1 },
  { name: 'Toulouse', coords: [1.4442, 43.6047], tier: 1 },
  { name: 'Nice', coords: [7.2620, 43.7102], tier: 1 },
  { name: 'Nantes', coords: [-1.5536, 47.2184], tier: 1 },
  { name: 'Strasbourg', coords: [7.7521, 48.5734], tier: 1 },
  { name: 'Bordeaux', coords: [-0.5792, 44.8378], tier: 1 },
  { name: 'Lille', coords: [3.0573, 50.6292], tier: 1 },
  { name: 'Montpellier', coords: [3.8767, 43.6108], tier: 1 },

  // Tier 2 — visible from medium zoom
  { name: 'Rennes', coords: [-1.6778, 48.1173], tier: 2 },
  { name: 'Reims', coords: [4.0317, 49.2583], tier: 2 },
  { name: 'Le Havre', coords: [0.1079, 49.4944], tier: 2 },
  { name: 'Saint-Étienne', coords: [4.3872, 45.4397], tier: 2 },
  { name: 'Toulon', coords: [5.9280, 43.1242], tier: 2 },
  { name: 'Grenoble', coords: [5.7245, 45.1885], tier: 2 },
  { name: 'Dijon', coords: [5.0415, 47.3220], tier: 2 },
  { name: 'Angers', coords: [-0.5632, 47.4784], tier: 2 },
  { name: 'Nîmes', coords: [4.3601, 43.8367], tier: 2 },
  { name: 'Clermont-Ferrand', coords: [3.0870, 45.7772], tier: 2 },
  { name: 'Le Mans', coords: [0.1996, 48.0061], tier: 2 },
  { name: 'Aix-en-Provence', coords: [5.4474, 43.5297], tier: 2 },
  { name: 'Brest', coords: [-4.4860, 48.3904], tier: 2 },
  { name: 'Tours', coords: [0.6848, 47.3941], tier: 2 },
  { name: 'Limoges', coords: [1.2610, 45.8336], tier: 2 },
  { name: 'Amiens', coords: [2.2957, 49.8941], tier: 2 },
  { name: 'Annecy', coords: [6.1294, 45.8992], tier: 2 },
  { name: 'Perpignan', coords: [2.8954, 42.6887], tier: 2 },
  { name: 'Metz', coords: [6.1758, 49.1193], tier: 2 },
  { name: 'Besançon', coords: [6.0240, 47.2378], tier: 2 },
  { name: 'Orléans', coords: [1.9093, 47.9029], tier: 2 },
  { name: 'Rouen', coords: [1.0993, 49.4431], tier: 2 },
  { name: 'Caen', coords: [-0.3707, 49.1829], tier: 2 },
  { name: 'Nancy', coords: [6.1844, 48.6921], tier: 2 },
  { name: 'Avignon', coords: [4.8055, 43.9493], tier: 2 },
  { name: 'Pau', coords: [-0.3707, 43.2951], tier: 2 },
  { name: 'La Rochelle', coords: [-1.1520, 46.1603], tier: 2 },

  // Tier 3 — smaller towns, visible only when zoomed in close
  { name: 'Libourne', coords: [-0.2427, 44.9147], tier: 3 },
  { name: 'Arcachon', coords: [-1.1686, 44.6586], tier: 3 },
  { name: 'Langon', coords: [-0.2464, 44.5525], tier: 3 },
  { name: 'Saint-André-de-Cubzac', coords: [-0.4364, 44.9900], tier: 3 },
  { name: 'Mérignac', coords: [-0.6478, 44.8414], tier: 3 },
  { name: 'Pessac', coords: [-0.6316, 44.8058], tier: 3 },
  { name: 'Blaye', coords: [-0.6631, 45.1272], tier: 3 },
  { name: 'Versailles', coords: [2.1301, 48.8014], tier: 3 },
  { name: 'Saint-Denis', coords: [2.3547, 48.9362], tier: 3 },
  { name: 'Antibes', coords: [7.1258, 43.5808], tier: 3 },
  { name: 'Cannes', coords: [7.0174, 43.5528], tier: 3 },
  { name: 'Chambéry', coords: [5.9178, 45.5646], tier: 3 },
  { name: 'Béziers', coords: [3.2149, 43.3442], tier: 3 },
  { name: 'Vannes', coords: [-2.7600, 47.6582], tier: 3 },
  { name: 'Quimper', coords: [-4.0975, 47.9960], tier: 3 },
  { name: 'Bayonne', coords: [-1.4749, 43.4933], tier: 3 },
  { name: 'Colmar', coords: [7.3585, 48.0794], tier: 3 },
  { name: 'Chartres', coords: [1.4899, 48.4470], tier: 3 },
  { name: 'Vichy', coords: [3.4265, 46.1275], tier: 3 },
  { name: 'Narbonne', coords: [3.0038, 43.1839], tier: 3 },
];
