import { useState } from 'react';
import { X, ShieldCheck, GraduationCap, Briefcase, Search, Calendar, Phone, Users } from 'lucide-react';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';

// Team Member Type
interface TeamMember {
  name: string;
  role: string;
  badge: string;
  description: string;
  strengthTitle: string;
  strength: string;
  formationTitle: string;
  formation: string;
  experienceTitle: string;
  experience: string;
  expertiseTitle: string;
  expertise: string[];
}

// Full Team Data
const TEAM: TeamMember[] = [
  {
    name: 'Charlotte Le Guen',
    role: 'Experte marchés publics',
    badge: 'Conformité et sécurisation',
    description: 'Charlotte analyse les dossiers de consultation et sécurise la conformité des réponses aux marchés publics.',
    strengthTitle: 'Son point fort',
    strength: 'Elle repère les exigences et les pièces qui peuvent faire perdre un marché avant même le dépôt.',
    formationTitle: 'Formation',
    formation: 'Droit public et commande publique',
    experienceTitle: 'Expérience',
    experience: '22 ans en marchés publics et conformité des dossiers',
    expertiseTitle: 'Comment peut-elle vous aider ?',
    expertise: ['Vous dire si le dossier est conforme', 'Repérer les exigences qui peuvent vous éliminer', 'Sécuriser votre dépôt avant l’échéance'],
  },
  {
    name: 'Emre Kaya',
    role: 'Chargé d’affaires',
    badge: 'Référent sous-traitance',
    description: 'Emre identifie les opportunités de sous-traitance et accompagne les échanges avec les entreprises générales.',
    strengthTitle: 'Son point fort',
    strength: 'Il rapproche votre savoir-faire des bons partenaires et sécurise les conditions de collaboration.',
    formationTitle: 'Formation',
    formation: 'Développement commercial et gestion de projet',
    experienceTitle: 'Expérience',
    experience: '14 ans en affaires B2B et partenariats',
    expertiseTitle: 'Comment peut-il vous aider ?',
    expertise: ['Trouver les partenaires adaptés à votre activité', 'Présenter clairement votre savoir-faire', 'Vous accompagner dans la négociation'],
  },
  {
    name: 'Nicole Pisseron',
    role: 'Chargée d’affaires',
    badge: 'Référente préparation des offres',
    description: 'Nicole transforme les éléments transmis par l’entreprise en dossier structuré, lisible et prêt à valider.',
    strengthTitle: 'Son point fort',
    strength: 'Elle repère rapidement les pièces manquantes et organise le dossier pour éviter les oublis.',
    formationTitle: 'Formation',
    formation: 'Gestion commerciale et relation client',
    experienceTitle: 'Expérience',
    experience: '4 ans en préparation d’offres et suivi de dossiers',
    expertiseTitle: 'Comment peut-elle vous aider ?',
    expertise: ['Rassembler les informations utiles', 'Structurer votre proposition', 'Préparer le dossier pour validation'],
  },
  {
    name: 'Bernard Delmas',
    role: 'Directeur général',
    badge: 'Pilotage stratégique',
    description: 'Bernard définit la stratégie, valide les engagements clés et intervient sur les dossiers à fort enjeu.',
    strengthTitle: 'Son point fort',
    strength: 'Une vision globale pour sécuriser les décisions et arbitrer les dossiers complexes.',
    formationTitle: 'Formation',
    formation: 'Management et stratégie d’entreprise',
    experienceTitle: 'Expérience',
    experience: '25 ans en direction et développement commercial',
    expertiseTitle: 'Comment peut-il vous aider ?',
    expertise: ['Trancher si un marché vaut le coup pour vous', 'Vous dire quand ne pas candidater', 'Intervenir sur vos dossiers les plus importants'],
  },
  {
    name: 'Maria Ferreira',
    role: 'Chargée d’affaires',
    badge: 'Référente marchés privés',
    description: 'Maria accompagne les entreprises sur les appels d’offres privés et les échanges avec les donneurs d’ordre.',
    strengthTitle: 'Son point fort',
    strength: 'Elle structure une réponse claire et défend la valeur de votre offre lors des échanges commerciaux.',
    formationTitle: 'Formation',
    formation: 'Commerce B2B et négociation',
    experienceTitle: 'Expérience',
    experience: '15 ans en développement commercial et suivi client',
    expertiseTitle: 'Comment peut-elle vous aider ?',
    expertise: ['Analyser le besoin du donneur d’ordre', 'Construire l’offre commerciale', 'Préparer les échanges et la négociation'],
  },
  {
    name: 'Elena Popescu',
    role: 'Assistante de direction',
    badge: 'Votre premier contact',
    description: 'Elena accueille votre demande, identifie votre besoin et organise votre premier échange avec l’équipe.',
    strengthTitle: 'Son point fort',
    strength: 'Elle clarifie les démarches sans jargon et vérifie que chaque information utile est transmise au bon expert.',
    formationTitle: 'Formation',
    formation: 'BTS Gestion de la PME',
    experienceTitle: 'Expérience',
    experience: '3 ans en coordination administrative et relation client',
    expertiseTitle: 'Comment peut-elle vous aider ?',
    expertise: ['Comprendre votre besoin', 'Planifier votre premier échange', 'Orienter votre dossier vers le bon expert'],
  },
];

export default function TeamProfilePage() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <>
      {/* Team Grid */}
      <div className="page-fade-in max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold text-white mb-6">Rencontrez nos experts</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {TEAM.map((member) => (
            <button
              key={member.name}
              onClick={() => setSelectedMember(member)}
              className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 text-center hover:border-orange/50 transition-all cursor-pointer"
            >
              <div className="w-20 h-20 rounded-full bg-[#031B30] border border-[#17334D] mx-auto mb-3" />
              <p className="text-sm font-semibold text-orange mb-1">{member.role}</p>
              <h3 className="text-lg font-bold text-white mb-2">{member.name}</h3>
              <span className="text-xs text-orange font-medium">Voir son profil</span>
            </button>
          ))}
        </div>
      </div>

      {/* Team Member Modal - Fixed Overlay */}
      {selectedMember && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-end md:items-center md:justify-center">
          
          {/* Modal Card */}
          <div className="relative w-full md:max-w-lg bg-[#061D32] border-t md:border border-[#17334D] rounded-t-[2rem] md:rounded-3xl h-[92vh] md:h-auto md:max-h-[90vh] overflow-y-auto md:shadow-2xl p-5 md:p-7 pb-8">
            
            {/* Mobile Drag Handle */}
            <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#17334D] rounded-full mb-4" />

            {/* Close Button */}
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#061D32]/80 border border-[#17334D] text-white hover:text-orange transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mt-6 md:mt-0 mb-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#031B30] border-2 border-orange flex items-center justify-center shrink-0">
                <Users size={48} className="text-orange" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-1">{selectedMember.name}</h2>
                <p className="text-lg font-semibold text-orange mb-2">{selectedMember.role}</p>
                <span className="inline-flex items-center gap-2 bg-orange/10 border border-orange/30 text-orange text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
                  <Users size={14} /> {selectedMember.badge}
                </span>
                <p className="text-sm text-[#B9BBC8] leading-relaxed mt-2">{selectedMember.description}</p>
              </div>
            </div>

            {/* Strength */}
            <div className="bg-[#031B30] border border-[#17334D] rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <ShieldCheck size={22} className="text-orange shrink-0 mt-1" />
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{selectedMember.strengthTitle}</h3>
                  <p className="text-sm text-[#B9BBC8] leading-relaxed">{selectedMember.strength}</p>
                </div>
              </div>
            </div>

            {/* Formation & Experience */}
            <div className="mb-6">
              <h3 className="text-base font-bold text-white mb-3">{selectedMember.formationTitle}</h3>
              <div className="flex items-center gap-3 bg-[#031B30] border border-[#17334D] rounded-xl p-3.5 mb-2">
                <GraduationCap size={20} className="text-orange shrink-0" />
                <span className="text-sm text-white">{selectedMember.formation}</span>
              </div>

              <h3 className="text-base font-bold text-white mb-3 mt-4">{selectedMember.experienceTitle}</h3>
              <div className="flex items-center gap-3 bg-[#031B30] border border-[#17334D] rounded-xl p-3.5">
                <Briefcase size={20} className="text-orange shrink-0" />
                <span className="text-sm text-white">{selectedMember.experience}</span>
              </div>
            </div>

            {/* How can they help */}
            <div className="mb-8">
              <h3 className="text-base font-bold text-white mb-3">{selectedMember.expertiseTitle}</h3>
              <div className="space-y-2.5">
                {selectedMember.expertise.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 bg-[#031B30] border border-[#17334D] rounded-xl p-3.5">
                    <Search size={18} className="text-orange shrink-0" />
                    <span className="text-sm text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => { setSelectedMember(null); setApptOpen(true); }}
                className="flex-1 bg-orange text-white font-bold py-3.5 rounded-xl hover:bg-orange/90 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Calendar size={16} /> Prendre rendez-vous
              </button>
              <button 
                onClick={() => { setSelectedMember(null); setCallbackOpen(true); }}
                className="flex-1 border border-orange text-orange font-bold py-3.5 rounded-xl hover:bg-orange/10 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Phone size={16} /> Être rappelé
              </button>
            </div>
          </div>
        </div>
      )}

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </>
  );
}