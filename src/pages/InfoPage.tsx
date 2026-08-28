import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppointmentModal } from '@/components/AppointmentModal';
import { CallbackModal } from '@/components/CallbackModal';
import {
  Target, ArrowRight, CheckCircle, FileText, Handshake,
  Phone, Calendar, Plus, ChevronUp, Euro, Clock, Shield, Search, Building2,
  Briefcase, FolderSearch, Trophy, Lock, ChevronRight
} from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

import aboutImage from "@/assets/aboutImage.png";
import mem1 from "@/assets/1.jpeg";
import mem2 from "@/assets/2.jpeg";
import mem3 from "@/assets/3.jpeg";
import mem4 from "@/assets/4.jpeg";
import mem5 from "@/assets/5.jpeg";
import mem6 from "@/assets/6.jpeg";

const TEAM = [
  { name: 'Bernard Delmas', role: 'Directeur général', image: mem3 },
  { name: 'Elena Popescu', role: 'Assistante de direction', image: mem1 },
  { name: 'Maria Ferreira', role: 'Chargée d\'affaires', image: mem2 },
  { name: 'Nicole Pisseron', role: 'Chargée d\'affaires', image: mem4 },
  { name: 'Emre Kaya', role: 'Chargé d\'affaires', image: mem5 },
  { name: 'Charlotte Le Guen', role: 'Experte marchés publics', image: mem6 },
];

// EXACT FAQ DATA & STYLE FROM IMAGE
const FAQ_SECTIONS = [
  {
    title: 'LE SERVICE',
    items: [
      {
        icon: Euro,
        q: 'Combien ça va me coûter ?',
        a: "L'essentiel de notre rémunération vient de vos succès : un pourcentage compris entre 0,5 % et 5 % du marché selon sa taille, et uniquement si vous le signez.\n\nÀ côté, un abonnement à partir de 29 €/mois vous donne accès à la plateforme, à la veille sur vos secteurs, à votre chargé d'affaires dédié et à une équipe complète qui prend tout en charge, du repérage jusqu'à la signature du marché.\n\nPas de frais de dossier. Les conditions exactes sont fixées avec vous dès le premier échange.",
      },
      {
        icon: FileText,
        q: 'Que prend concrètement en charge Marchés Direct ?',
        a: "Tout, sauf la décision finale. Veille, qualification, préparation du dossier, dépôt, suivi jusqu'à la signature — c'est nous. Répondre ou non, c'est vous.",
      },
      {
        icon: Clock,
        q: 'Combien de temps devrai-je y consacrer ?',
        a: "Presque rien. Vous nous transmettez les infos, vous validez le dossier avant dépôt — le reste (recherche, démarches, suivi) est pris en charge.",
      },
      {
        icon: Lock,
        q: 'Mes informations restent-elles confidentielles ?',
        a: "Oui. Vos documents servent uniquement à préparer vos candidatures, jamais transmis à un tiers sans votre accord — sauf ce qui est nécessaire à un dépôt que vous avez validé.",
      },
    ],
  },
  {
    title: 'LES OPPORTUNITÉS',
    items: [
      {
        icon: Search,
        q: 'Marchés Direct peut-il trouver des opportunités adaptées à mon entreprise ?',
        a: "C'est tout l'enjeu. On sélectionne selon votre activité, votre zone, vos références et votre capacité réelle à réaliser le marché — pas une liste noyée d'annonces, seulement ce qui vous correspond.",
      },
      {
        icon: Handshake,
        q: 'Pourquoi Marchés Direct plutôt que chercher seul ou une autre plateforme ?',
        a: "Une plateforme vous donne une liste. Nous, un résultat. On qualifie, on vous dit si ça vaut le coup, on prépare et on dépose avec vous jusqu'à la signature. Un outil et une équipe — pas l'un ou l'autre.",
      },
      {
        icon: Building2,
        q: 'Comment savoir si Marchés Direct correspond à mon entreprise ?',
        a: "Un échange suffit. On regarde votre activité, votre zone, vos capacités — et on vous dit franchement si c'est pertinent pour vous, ou pas.",
      },
    ],
  },
  {
    title: 'LES RÉSULTATS',
    items: [
      {
        icon: Trophy,
        q: 'Quelles sont mes chances de remporter un marché ?',
        a: "Personne ne peut garantir un résultat — ça dépend du prix, de la concurrence, de vos références. Ce que nos trois chargés d'affaires et notre expérience du secteur public changent concrètement : un dossier sans vice de forme, argumenté au bon endroit, déposé dans les règles. C'est souvent là que se joue la différence entre un dossier écarté et un dossier retenu.",
      },
      {
        icon: Shield,
        q: 'Que se passe-t-il si je ne remporte aucun marché ?',
        a: "Aucun marché signé, aucune commission. Seul l'abonnement reste dû, et vos dossiers préparés restent à vous, réutilisables.",
      },
      {
        icon: Calendar,
        q: 'Sous quel délai puis-je obtenir mes premiers résultats ?',
        a: "La veille démarre dès votre profil complet. Comptez 1 à 2 mois sur un marché courant, 3 à 5 mois sur les plus gros appels d'offres. Vous êtes informé à chaque étape.",
      },
    ],
  },
];

export default function InfoPage() {
  const { t } = useLang();
  const location = useLocation();
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const path = location.pathname;

  // ------- CONTACT PAGE -------
  if (path === '/contact') {
    return (
      <div className="page-fade-in max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-3">
            Nous sommes là pour vous aider à remporter des appels d'offres privés et des marchés publics, <span className="text-orange">tout en développant votre chiffre d'affaires et vos marges.</span>
          </h1>
          <p className="text-xl font-bold text-white mt-4">Marchés Direct est <span className="text-orange">votre partenaire.</span></p>
        </div>

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
              <Target size={28} className="text-orange" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Notre mission</h2>
              <p className="text-sm text-[#B9BBC8] leading-relaxed">Vous faire gagner du temps et augmenter vos chances de réussite.</p>
            </div>
          </div>
          <div className="space-y-2">
            {['Gagnez du temps', 'Augmentez votre chiffre d\'affaires et surtout vos marges', 'Soyez accompagné de A à Z', 'Améliorez votre taux de signature'].map(reason => (
              <div key={reason} className="flex items-center gap-2">
                <CheckCircle size={16} className="text-orange shrink-0" />
                <span className="text-sm text-white">{reason}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setApptOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors flex-1"><Calendar size={16} /> {t('bookAppointment')}</button>
          <button onClick={() => setCallbackOpen(true)} className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-6 py-3 rounded-xl hover:bg-orange/10 transition-colors flex-1"><Phone size={16} /> {t('callBack')}</button>
        </div>

        <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
        <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
      </div>
    );
  }

  // ------- FAQ PAGE -------
  if (path === '/faq') {
    return (
      <div className="page-fade-in max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">FAQ</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">
            Tout savoir avant <br className="hidden md:block" /> <span className="text-orange">de démarrer.</span>
          </h1>
          <p className="text-[#B9BBC8] text-sm md:text-base">Les réponses aux principales questions avant de nous confier votre prochain marché.</p>
        </div>

        {FAQ_SECTIONS.map((section) => (
          <div key={section.title} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-orange uppercase tracking-widest">{section.title}</h2>
              <div className="flex-1 h-px bg-orange/30 ml-4" />
            </div>

            <div className="space-y-3">
              {section.items.map((item, itemIndex) => {
                const isOpen = openFaq === itemIndex && openSection === section.title;
                
                return (
                  <div key={item.q} className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
                    <button
                      onClick={() => {
                        setOpenSection(section.title);
                        setOpenFaq(isOpen ? null : itemIndex);
                      }}
                      className="w-full flex items-center justify-between p-4 text-left gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className="text-orange shrink-0" />
                        <span className="text-sm font-semibold text-white leading-snug">{item.q}</span>
                      </div>
                      {isOpen ? <ChevronUp size={18} className="text-orange shrink-0" /> : <Plus size={18} className="text-orange shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pl-12 border-t border-[#17334D]">
                        <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4 whitespace-pre-line">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 text-center">
          <h2 className="text-lg font-bold text-white mb-1">Une question avant de vous lancer ?</h2>
          <p className="text-sm text-orange font-medium mb-4">Elena vous répond directement.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setApptOpen(true)} className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors text-sm"><Calendar size={16} /> Prendre rendez‑vous</button>
            <button onClick={() => setCallbackOpen(true)} className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-6 py-3 rounded-xl hover:bg-orange/10 transition-colors text-sm"><Phone size={16} /> Être rappelé</button>
          </div>
        </div>

        <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
        <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
      </div>
    );
  }

  // ------- MAIN PAGE -------

  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">

      {/* SECTION 1: Des marchés à portée de main */}
      <div className="mb-10">
        <div className="mb-4 md:mb-6 text-justify">
          <h2 className="text-xl md:text-5xl font-extrabold text-white leading-tight mb-1 md:mb-2">
            Des marchés à portée de main.
          </h2>
          <p className="text-orange font-semibold text-sm md:text-base mb-2 md:mb-4">Quand vous gagnez, nous gagnons.</p>
          <p className="text-[#B9BBC8] text-[11px] md:text-base leading-relaxed">
            Marchés Direct vous aide à remporter des <span className="text-orange font-semibold">appels d'offres privés</span>, des <span className="text-orange font-semibold">marchés publics</span> et à signer des <span className="text-orange font-semibold">contrats de sous-traitance</span> pour augmenter votre <span className="text-orange font-semibold">chiffre d'affaires</span> et vos <span className="text-orange font-semibold">marges</span>.
          </p>
        </div>

        <img src={aboutImage} className="w-80 rounded-xl mb-8" />

        <div className="text-center mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Les marchés publics en chiffres</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 flex flex-col items-center text-center">
              <Briefcase size={20} className="text-orange mb-2" />
              <span className="text-sm font-extrabold text-orange mb-1">114 000 €</span>
              <p className="text-[8px] text-[#B9BBC8]">Un marché public sur deux dépasse ce montant</p>
            </div>
            <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 flex flex-col items-center text-center">
              <FileText size={20} className="text-orange mb-2" />
              <span className="text-sm font-extrabold text-orange mb-1">3 offres</span>
              <p className="text-[8px] text-[#B9BBC8]">C'est le nombre médian de candidats par marché</p>
            </div>
            <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 flex flex-col items-center text-center">
              <FileText size={20} className="text-orange mb-2" />
              <span className="text-sm font-extrabold text-orange mb-1">17 %</span>
              <p className="text-[8px] text-[#B9BBC8]">des marchés ne reçoivent qu'une seule candidature.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6">
          <h3 className="text-lg font-bold text-white mb-2">On vous apporte les opportunités sur un plateau.</h3>
          <p className="text-sm text-[#B9BBC8] mb-4">Vous restez concentré sur votre métier. Nous prenons en charge :</p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Search size={22} className="text-orange shrink-0" />
              <span className="text-sm text-white">Recherche des <span className="text-orange font-semibold">appels d'offres</span>, marchés <span className="text-orange font-semibold">publics</span> et contrats de <span className="text-orange font-semibold">sous-traitance</span></span>
            </div>
            <div className="flex items-center gap-3">
              <FolderSearch size={22} className="text-orange shrink-0" />
              <span className="text-sm text-white">Analyse et sélection des opportunités adaptées à votre entreprise</span>
            </div>
            <div className="flex items-center gap-3">
              <FileText size={22} className="text-orange shrink-0" />
              <span className="text-sm text-white">Documents administratifs et préparation complète du dossier</span>
            </div>
            <div className="flex items-center gap-3">
              <Handshake size={22} className="text-orange shrink-0" />
              <span className="text-sm text-white">Conseil, négociation, dépôt et suivi <span className="text-orange font-semibold">jusqu'à la signature</span></span>
            </div>
            <div className="flex items-center gap-3">
              <Trophy size={22} className="text-orange shrink-0" />
              <span className="text-sm text-white">Notre objectif : vous aider à décrocher <span className="text-orange font-semibold">le bon marché et le bon contrat.</span></span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-[#B9BBC8] mt-4">Vous faites votre travail. Nous faisons avancer votre prochain contrat.</p>
      </div>

      {/* SECTION 2: TEAM GRID */}
      <div className="mb-10">
        <div className="mb-6">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('teamTag')}</span>
          <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">{t('teamTitle')}</h1>
          <p className="text-xs md:text-sm text-[#B9BBC8] max-w-2xl">{t('teamSub')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {TEAM.map((member) => (
            <Link
              to={`/team-profile?member=${encodeURIComponent(member.name)}`}
              className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 md:p-6 flex flex-col items-center text-center hover:border-orange/50 transition-all cursor-pointer group"
              key={member.name}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#031B30] border-2 border-[#17334D] group-hover:border-orange/50 mb-3 md:mb-4 overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] md:text-sm font-semibold text-orange mb-0.5 md:mb-1">{member.role}</p>
              <h3 className="text-xs md:text-lg font-bold text-white mb-1 md:mb-2">{member.name}</h3>
              <span className="text-[9px] md:text-xs text-orange font-medium flex items-center gap-0.5 md:gap-1 group-hover:underline">
                Découvrir sa fonction <ArrowRight size={8} className="md:hidden" /><ArrowRight size={12} className="hidden md:block" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* SECTION 3: HOW IT WORKS - EXACT MOBILE STYLING FROM IMAGE */}
      <div className="mb-10">
        <div className="mb-6">
          <h2 className="text-xl md:text-3xl font-extrabold text-white leading-tight mb-2">
            Un premier contact, puis <br className="block md:hidden" /><span className="text-orange">un interlocuteur unique.</span>
          </h2>
          <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed">
            Elena qualifie votre demande. Ensuite, un chargé d'affaires dédié vous accompagne de la recherche jusqu'au dépôt et au suivi.
          </p>
        </div>

        {/* Elena - First Contact with Buttons */}
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 md:p-5 mb-3">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#031B30] border-2 border-orange overflow-hidden shrink-0">
              <img src={mem1} alt="Elena Popescu" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-1">
                <span className="text-xs font-bold text-orange">1.</span>
                <span className="text-xs font-semibold text-white">Premier contact</span>
              </div>
              <h3 className="text-base md:text-xl font-bold text-white">Elena Popescu</h3>
              <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed mt-0.5 md:mt-1">
                Elle vérifie votre besoin, votre activité et votre projet.
              </p>
              <div className="flex items-start gap-2 mt-2 md:mt-3 justify-center md:justify-start">
                <CheckCircle size={16} className="text-orange shrink-0 mt-0.5" />
                <div className="text-left">
                  <span className="text-xs md:text-sm font-semibold text-white">Votre demande qualifiée</span>
                  <p className="text-[10px] md:text-xs text-[#B9BBC8]">Premier retour sous 48 h ouvrées</p>
                </div>
              </div>
              
              {/* Action Buttons - Horizontal on all screen sizes */}
              <div className="flex flex-row gap-2 mt-4 w-full">
                <button
                  onClick={() => setApptOpen(true)}
                  className="flex-1 bg-orange hover:bg-orange/95 active:bg-orange/85 text-white font-bold py-2.5 md:py-3 rounded-xl transition-all text-[11px] md:text-sm shadow-lg hover:shadow-orange/30 hover:shadow-xl whitespace-nowrap"
                >
                  Prendre rendez-vous
                </button>
                <button
                  onClick={() => setCallbackOpen(true)}
                  className="flex-1 border-2 border-orange text-orange hover:bg-orange/5 active:bg-orange/10 font-bold py-2.5 md:py-3 rounded-xl transition-all text-[11px] md:text-sm hover:border-orange/80 whitespace-nowrap"
                >
                  Être rappelé
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical line separator with arrow pointing down - SMALLER */}
        <div className="flex flex-col items-center py-0.5">
          <div className="w-px h-4 bg-orange/30"></div>
          <ChevronRight size={12} className="text-orange rotate-90 -mt-0.5" />
          <div className="w-px h-4 bg-orange/30 -mt-0.5"></div>
        </div>

        {/* Assignment */}
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 md:p-5 mb-3">
          <div className="flex items-start gap-2 md:gap-3">
            <CheckCircle size={16} className="text-orange shrink-0 mt-0.5" />
            <div>
              <span className="text-xs md:text-sm font-semibold text-white">Votre demande qualifiée est confiée à votre chargé d'affaires dédié.</span>
              <p className="text-[10px] md:text-xs text-[#B9BBC8] mt-0.5 md:mt-1">
                Selon votre secteur, l'un de nos chargés d'affaires vous accompagne.
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4 md:gap-6 mt-3 md:mt-4">
            {[TEAM[2], TEAM[3], TEAM[4]].map((member) => (
              <Link
                key={member.name}
                to={`/team-profile?member=${encodeURIComponent(member.name)}`}
                className="flex flex-col items-center group"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[#031B30] border-2 border-[#17334D] group-hover:border-orange/50 overflow-hidden">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[8px] md:text-[10px] font-medium text-white text-center mt-1 md:mt-1.5">{member.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Vertical line separator with arrow pointing down - SMALLER */}
        <div className="flex flex-col items-center py-0.5">
          <div className="w-px h-4 bg-orange/30"></div>
          <ChevronRight size={12} className="text-orange rotate-90 -mt-0.5" />
          <div className="w-px h-4 bg-orange/30 -mt-0.5"></div>
        </div>

        {/* Steps 2-5 */}
        <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 md:p-5 mb-3">
          <h3 className="text-sm md:text-base font-bold text-white mb-3 md:mb-4 text-center md:text-left">
            Un seul interlocuteur dédié de l'étape 2 à l'étape 5
          </h3>

          <div className="space-y-3 md:space-y-4">
            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-xs md:text-sm font-bold text-orange shrink-0 w-6 md:w-7">02</span>
              <div>
                <span className="text-xs md:text-sm font-semibold text-white">Repérage des opportunités adaptées</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle size={12} className="text-orange" />
                  <span className="text-[10px] md:text-xs text-[#B9BBC8]">Une sélection utile</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-xs md:text-sm font-bold text-orange shrink-0 w-6 md:w-7">03</span>
              <div>
                <span className="text-xs md:text-sm font-semibold text-white">Préparation du dossier avec vous</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle size={12} className="text-orange" />
                  <span className="text-[10px] md:text-xs text-[#B9BBC8]">Un dossier prêt à valider</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-xs md:text-sm font-bold text-orange shrink-0 w-6 md:w-7">04</span>
              <div>
                <span className="text-xs md:text-sm font-semibold text-white">Vous validez, le dossier est déposé et suivi</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle size={12} className="text-orange" />
                  <span className="text-[10px] md:text-xs text-[#B9BBC8]">Un dépôt confirmé</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 md:gap-3">
              <span className="text-xs md:text-sm font-bold text-orange shrink-0 w-6 md:w-7">05</span>
              <div>
                <span className="text-xs md:text-sm font-semibold text-white">Une question sur le parcours ?</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle size={12} className="text-orange" />
                  <span className="text-[10px] md:text-xs text-[#B9BBC8]">Votre chargé d'affaires reste disponible</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: OBJECTIVE CTA */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-8 text-center mb-10">
        <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">
          Notre objectif : vous faire <span className="text-orange">remporter le marché.</span>
        </h2>
        <p className="text-xs md:text-sm text-[#B9BBC8] leading-relaxed mb-4">
          Nous ne sommes pas là uniquement pour déposer des dossiers. De la sélection de l'opportunité jusqu'à la signature, toute l'équipe se mobilise pour maximiser vos chances de succès.
        </p>
        <div className="bg-[#031B30] border border-[#17334D] rounded-xl p-3">
          <p className="text-[11px] md:text-sm text-[#B9BBC8]">
            Appel d'offres privé, marché public ou contrat de sous-traitance :<br />
            <span className="text-orange font-semibold">quand vous gagnez, nous gagnons.</span>
          </p>
        </div>
      </div>

      {/* SECTION 5: FAQ */}
      <div className="mb-10">
        <div className="mb-6">
          <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('faqTag')}</span>
          <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight mt-2 mb-3">{t('faqTitle')}</h1>
          <p className="text-xs md:text-sm text-[#B9BBC8]">{t('faqSub')}</p>
        </div>

        {FAQ_SECTIONS.map((section) => (
          <div key={section.title} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-orange uppercase tracking-widest">{section.title}</h2>
              <div className="flex-1 h-px bg-orange/30 ml-4" />
            </div>

            <div className="space-y-3">
              {section.items.map((item, itemIndex) => {
                const isOpen = openFaq === itemIndex && openSection === section.title;

                return (
                  <div key={item.q} className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
                    <button
                      onClick={() => {
                        setOpenSection(section.title);
                        setOpenFaq(isOpen ? null : itemIndex);
                      }}
                      className="w-full flex items-center justify-between p-4 text-left gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className="text-orange shrink-0" />
                        <span className="text-sm font-semibold text-white leading-snug">{item.q}</span>
                      </div>
                      {isOpen ? <ChevronUp size={18} className="text-orange shrink-0" /> : <Plus size={18} className="text-orange shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pl-12 border-t border-[#17334D]">
                        <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4 whitespace-pre-line">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}