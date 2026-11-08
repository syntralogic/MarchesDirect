// 7 nov. : autocomplétion de la recherche par métier. Tout est local (aucune requête pendant la frappe) :
// une famille = un métier réellement présent dans le catalogue (table trades ou mot-clé reconnu par le moteur),
// ses façons courantes de l'écrire (alias, préfixes), et ses prestations associées. Choisir une prestation envoie
// q=<famille>&focus=<prestation> : le serveur cherche toute la famille et fait remonter la prestation, il ne
// restreint jamais plus que le mot seul (voir Marche-direct-back, « recherche par famille de métier »).

export interface TradeFamily {
  q: string;           // mot envoyé au serveur (famille)
  label: string;       // libellé affiché
  aliases: string[];   // autres façons de le taper (sans accents, minuscules)
  prestations: { label: string; focus: string }[];
}

export const TRADE_FAMILIES: TradeFamily[] = [
  { q: 'nettoyage', label: 'Nettoyage', aliases: ['proprete', 'menage', 'entretien des locaux'], prestations: [
    { label: 'Nettoyage de locaux', focus: 'locaux bureaux' }, { label: 'Nettoyage de vitres', focus: 'vitres vitrerie' },
    { label: 'Nettoyage de toiture', focus: 'toiture' }, { label: 'Nettoyage de façades', focus: 'facade' },
    { label: 'Nettoyage de fin de chantier', focus: 'chantier' }, { label: 'Nettoyage de parties communes', focus: 'parties communes' }] },
  { q: 'chauffage', label: 'Chauffage', aliases: ['chauffagiste', 'chaudiere', 'chaufferie', 'pompe a chaleur', 'pac'], prestations: [
    { label: 'Installation de chauffage', focus: 'installation' }, { label: 'Maintenance de chauffage', focus: 'maintenance entretien' },
    { label: 'Dépannage de chauffage', focus: 'depannage' }, { label: 'Remplacement de chaudière', focus: 'chaudiere remplacement' },
    { label: 'Pompes à chaleur', focus: 'pompe chaleur' }, { label: 'Chaufferie', focus: 'chaufferie' }] },
  { q: 'climatisation', label: 'Climatisation', aliases: ['clim', 'climaticien', 'froid', 'cvc', 'ventilation', 'vmc'], prestations: [
    { label: 'Installation de climatisation', focus: 'installation' }, { label: 'Maintenance de climatisation', focus: 'maintenance entretien' },
    { label: 'Dépannage de climatisation', focus: 'depannage' }, { label: 'Ventilation, VMC', focus: 'ventilation vmc' }, { label: 'Équipements CVC', focus: 'cvc' }] },
  { q: 'plomberie', label: 'Plomberie', aliases: ['plombier', 'sanitaire', 'sanitaires', 'canalisation'], prestations: [
    { label: 'Plomberie sanitaire', focus: 'sanitaire' }, { label: 'Installation de plomberie', focus: 'installation' },
    { label: 'Dépannage de plomberie', focus: 'depannage' }, { label: 'Chauffe-eau', focus: 'chauffe-eau' }] },
  { q: 'electricite', label: 'Électricité', aliases: ['elec', 'electricien', 'electrique', 'courants faibles'], prestations: [
    { label: 'Installation électrique', focus: 'installation' }, { label: 'Mise aux normes électriques', focus: 'mise normes conformite' },
    { label: 'Maintenance électrique', focus: 'maintenance' }, { label: 'Courants faibles', focus: 'courants faibles' },
    { label: 'Éclairage public', focus: 'eclairage public' }, { label: 'Bornes de recharge', focus: 'bornes recharge' }] },
  { q: 'peinture', label: 'Peinture', aliases: ['peintre', 'revetement mural', 'ravalement'], prestations: [
    { label: 'Peinture intérieure', focus: 'interieure' }, { label: 'Peinture extérieure', focus: 'exterieure' },
    { label: 'Ravalement de façade', focus: 'ravalement facade' }, { label: 'Revêtements muraux', focus: 'revetement mural' }] },
  { q: 'menuiserie', label: 'Menuiserie', aliases: ['menuisier', 'fenetre', 'fenetres', 'porte', 'portes', 'bois', 'alu', 'pvc'], prestations: [
    { label: 'Menuiserie extérieure', focus: 'exterieure fenetres' }, { label: 'Menuiserie intérieure', focus: 'interieure' },
    { label: 'Remplacement de fenêtres', focus: 'fenetres remplacement' }, { label: 'Menuiserie aluminium', focus: 'aluminium' }, { label: 'Menuiserie bois', focus: 'bois' }] },
  { q: 'maconnerie', label: 'Maçonnerie', aliases: ['macon', 'beton', 'gros oeuvre'], prestations: [
    { label: 'Maçonnerie générale', focus: 'generale' }, { label: 'Gros œuvre', focus: 'gros oeuvre' }, { label: 'Réparation de maçonnerie', focus: 'reparation' }] },
  { q: 'gros oeuvre', label: 'Gros œuvre', aliases: ['gros-oeuvre', 'fondations', 'structure'], prestations: [
    { label: 'Fondations', focus: 'fondations' }, { label: 'Structure béton', focus: 'beton structure' }] },
  { q: 'couverture', label: 'Couverture, toiture', aliases: ['couvreur', 'toiture', 'toit', 'zinguerie', 'tuiles', 'ardoise'], prestations: [
    { label: 'Réfection de toiture', focus: 'refection toiture' }, { label: 'Zinguerie', focus: 'zinguerie' }, { label: 'Couverture tuiles', focus: 'tuiles' }, { label: 'Couverture ardoise', focus: 'ardoise' }] },
  { q: 'etancheite', label: 'Étanchéité', aliases: ['etancheur', 'etanch', 'terrasse', 'toiture terrasse'], prestations: [
    { label: 'Étanchéité de toiture-terrasse', focus: 'terrasse' }, { label: 'Étanchéité de parking', focus: 'parking' }, { label: 'Réfection d’étanchéité', focus: 'refection' }] },
  { q: 'isolation', label: 'Isolation', aliases: ['isolant', 'ite', 'iti', 'thermique', 'renovation energetique'], prestations: [
    { label: 'Isolation thermique par l’extérieur', focus: 'exterieur ite' }, { label: 'Isolation intérieure', focus: 'interieur' },
    { label: 'Isolation de combles', focus: 'combles' }, { label: 'Rénovation énergétique', focus: 'renovation energetique' }] },
  { q: 'platrerie', label: 'Plâtrerie', aliases: ['platrier', 'plaquiste', 'placo', 'cloisons', 'faux plafonds'], prestations: [
    { label: 'Cloisons et doublages', focus: 'cloisons doublages' }, { label: 'Faux plafonds', focus: 'faux plafonds' }, { label: 'Plâtrerie sèche', focus: 'seche' }] },
  { q: 'carrelage', label: 'Carrelage', aliases: ['carreleur', 'faience', 'revetement de sol', 'sols'], prestations: [
    { label: 'Carrelage et faïence', focus: 'faience' }, { label: 'Revêtements de sols', focus: 'revetement sols' }, { label: 'Sols souples', focus: 'sols souples' }] },
  { q: 'charpente', label: 'Charpente', aliases: ['charpentier', 'ossature bois', 'bardage'], prestations: [
    { label: 'Charpente bois', focus: 'bois' }, { label: 'Charpente métallique', focus: 'metallique' }, { label: 'Ossature bois', focus: 'ossature' }] },
  { q: 'vitrerie', label: 'Vitrerie', aliases: ['vitrier', 'vitrage', 'miroiterie'], prestations: [
    { label: 'Remplacement de vitrages', focus: 'remplacement vitrage' }, { label: 'Miroiterie', focus: 'miroiterie' }] },
  { q: 'serrurerie', label: 'Serrurerie, métallerie', aliases: ['serrurier', 'metallerie', 'ferronnerie', 'garde-corps', 'portail'], prestations: [
    { label: 'Métallerie', focus: 'metallerie' }, { label: 'Garde-corps', focus: 'garde-corps' }, { label: 'Portails et clôtures', focus: 'portail cloture' }] },
  { q: 'vrd', label: 'Voirie et réseaux (VRD)', aliases: ['voirie', 'reseaux', 'assainissement', 'enrobes', 'terrassement'], prestations: [
    { label: 'Voirie', focus: 'voirie' }, { label: 'Assainissement', focus: 'assainissement' }, { label: 'Enrobés', focus: 'enrobes' }, { label: 'Réseaux humides', focus: 'reseaux humides' }] },
  { q: 'terrassement', label: 'Terrassement', aliases: ['terrassier', 'deblais', 'remblais'], prestations: [
    { label: 'Terrassement généraux', focus: 'generaux' }, { label: 'Déblais, remblais', focus: 'deblais remblais' }] },
  { q: 'demolition', label: 'Démolition', aliases: ['deconstruction', 'curage', 'desamiantage'], prestations: [
    { label: 'Déconstruction', focus: 'deconstruction' }, { label: 'Curage', focus: 'curage' }, { label: 'Désamiantage', focus: 'desamiantage' }] },
  { q: 'desamiantage', label: 'Désamiantage', aliases: ['amiante', 'deplombage'], prestations: [
    { label: 'Retrait d’amiante', focus: 'retrait amiante' }, { label: 'Déplombage', focus: 'deplombage' }] },
  { q: 'espaces verts', label: 'Espaces verts', aliases: ['jardinier', 'paysagiste', 'paysagisme', 'elagage', 'tonte', 'jardin'], prestations: [
    { label: 'Entretien des espaces verts', focus: 'entretien' }, { label: 'Élagage', focus: 'elagage' }, { label: 'Aménagement paysager', focus: 'amenagement paysager' }, { label: 'Tonte et débroussaillage', focus: 'tonte debroussaillage' }] },
  { q: 'maintenance', label: 'Maintenance', aliases: ['entretien', 'multitechnique', 'multiservice'], prestations: [
    { label: 'Maintenance multitechnique', focus: 'multitechnique' }, { label: 'Maintenance de bâtiments', focus: 'batiments' }, { label: 'Maintenance d’équipements', focus: 'equipements' }] },
  { q: 'securite', label: 'Sécurité, gardiennage', aliases: ['gardiennage', 'surveillance', 'agent de securite', 'vigile', 'securite incendie', 'ssiap'], prestations: [
    { label: 'Gardiennage', focus: 'gardiennage' }, { label: 'Surveillance de sites', focus: 'surveillance' }, { label: 'Sécurité incendie (SSIAP)', focus: 'incendie ssiap' }, { label: 'Télésurveillance', focus: 'telesurveillance' }] },
  { q: 'ascenseur', label: 'Ascenseurs', aliases: ['ascensoriste', 'ascenseurs', 'elevateur', 'monte-charge'], prestations: [
    { label: 'Maintenance d’ascenseurs', focus: 'maintenance' }, { label: 'Remplacement d’ascenseurs', focus: 'remplacement' }, { label: 'Mise en conformité', focus: 'conformite' }] },
  { q: 'photovoltaique', label: 'Photovoltaïque', aliases: ['solaire', 'panneaux', 'panneaux solaires'], prestations: [
    { label: 'Installation photovoltaïque', focus: 'installation' }, { label: 'Ombrières', focus: 'ombrieres' }] },
  { q: 'eclairage', label: 'Éclairage', aliases: ['luminaires', 'eclairage public', 'led'], prestations: [
    { label: 'Éclairage public', focus: 'public' }, { label: 'Passage en LED', focus: 'led' }] },
  { q: 'ravalement', label: 'Ravalement de façade', aliases: ['facade', 'facades', 'facadier'], prestations: [
    { label: 'Ravalement', focus: 'ravalement' }, { label: 'Réfection de façades', focus: 'refection' }] },
  { q: 'batiment', label: 'Tous corps d’état', aliases: ['tce', 'entreprise generale', 'batiment-general', 'renovation', 'rehabilitation', 'construction'], prestations: [
    { label: 'Rénovation tous corps d’état', focus: 'renovation' }, { label: 'Réhabilitation', focus: 'rehabilitation' }, { label: 'Construction neuve', focus: 'construction' }] },
];

/** Libellé d'une famille à partir du mot envoyé au serveur (« platrerie » → « Plâtrerie »). */
export const familyLabel = (q: string): string => TRADE_FAMILIES.find(f => f.q === q.trim().toLowerCase())?.label || (q.charAt(0).toUpperCase() + q.slice(1));

export const foldFr = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, ' ').replace(/\s+/g, ' ').trim();

export interface MetierSuggestion { label: string; q: string; focus?: string; family: string }

const familyMatches = (f: TradeFamily, frag: string) => {
  const cands = [foldFr(f.label), foldFr(f.q), ...f.aliases.map(foldFr)];
  return cands.some(c => c.startsWith(frag) || c.split(' ').some(w => w.startsWith(frag)));
};

// Suggestions pour ce qui est tapé : dès la première lettre. « nettoyage chau » complète le dernier mot et garde
// les précédents (« nettoyage chauffage » → les deux familles). Max 6, familles d'abord puis prestations.
export function suggestMetiers(input: string, limit = 6): MetierSuggestion[] {
  const text = foldFr(input);
  if (!text) return [];
  const words = text.split(' ');
  const frag = words[words.length - 1];
  const prefix = words.slice(0, -1);
  if (!frag) return [];
  const fams = TRADE_FAMILIES.filter(f => familyMatches(f, frag));
  const exactFirst = fams.sort((a, b) => Number(foldFr(b.q).startsWith(frag) || foldFr(b.label).startsWith(frag)) - Number(foldFr(a.q).startsWith(frag) || foldFr(a.label).startsWith(frag)));
  const out: MetierSuggestion[] = [];
  const seen = new Set<string>();
  const push = (s: MetierSuggestion) => { const k = `${s.q}|${s.focus || ''}`; if (!seen.has(k) && out.length < limit) { seen.add(k); out.push(s); } };
  const prefixQ = prefix.length ? `${prefix.join(' ')} ` : '';
  const prefixLabel = prefix.length ? `${input.trim().split(/\s+/).slice(0, -1).join(' ')} + ` : '';
  for (const f of exactFirst) push({ label: prefixLabel + f.label, q: prefixQ + f.q, family: f.q });
  // Prestations : d'abord celles dont le libellé contient aussi le fragment tapé, puis les autres de la 1re famille.
  for (const f of TRADE_FAMILIES) for (const p of f.prestations) if (foldFr(p.label).split(' ').some(w => w.length > 2 && w.startsWith(frag))) push({ label: prefixLabel + p.label, q: prefixQ + f.q, focus: p.focus, family: f.q });
  for (const f of exactFirst.slice(0, 2)) for (const p of f.prestations) push({ label: prefixLabel + p.label, q: prefixQ + f.q, focus: p.focus, family: f.q });
  return out;
}
