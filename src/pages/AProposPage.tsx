import { Link } from 'react-router-dom';
import { teamMembers } from '@/data/mockData';
import { ArrowRight, Users, Target, Award, Lightbulb, CheckCircle } from 'lucide-react';

const SECTIONS = [
  {
    icon: Target,
    title: 'Notre mission',
    text: 'Rendre l\'accès aux marchés publics, aux appels d\'offres privés et à la sous-traitance aussi simple et efficace que possible pour toutes les entreprises françaises, quelle que soit leur taille.',
  },
  {
    icon: Lightbulb,
    title: 'Notre vision',
    text: 'Un écosystème où chaque entreprise peut trouver, préparer et remporter des marchés grâce à l\'intelligence artificielle et à l\'expertise humaine, sans expertise administrative préalable.',
  },
  {
    icon: Award,
    title: 'Notre approche',
    text: 'Nous combinons surveillance automatique des sources (BOAMP, PLACE, JOUE, sources privées), qualification par IA et accompagnement humain pour offrir une solution complète de A à Z.',
  },
];

const REASONS = [
  'Couverture complète : marchés publics, privés et sous-traitance',
  'IA entraînée sur des milliers de marchés français',
  'Génération automatique des pièces administratives',
  'Équipe de conseillers spécialisés en commande publique',
  'Tarifs adaptés aux PME et TPE',
  'Résultats mesurables : + 40 % de dossiers déposés en moyenne',
];

export default function AProposPage() {
  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16">
      {/* Hero */}
      <div className="text-center mb-12 md:mb-16">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">À propos</span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-2 mb-4">
          Marchés Direct
        </h1>
        <p className="text-[#B9BBC8] text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          La plateforme de référence pour les entreprises françaises qui souhaitent développer leur activité grâce aux marchés publics, aux appels d'offres privés et à la sous-traitance.
        </p>
      </div>

      {/* Mission / Vision / Approche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12 md:mb-16">
        {SECTIONS.map(s => (
          <div key={s.title} className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center mb-4">
              <s.icon size={20} className="text-orange" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
            <p className="text-sm text-[#B9BBC8] leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      {/* Team preview */}
      <div className="mb-12 md:mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">Notre équipe</h2>
          <Link to="/equipe" className="text-sm text-orange font-semibold hover:underline flex items-center gap-1">
            Voir tous <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {teamMembers.slice(0, 3).map(member => (
            <div key={member.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: `${member.color}20`, color: member.color, border: `1px solid ${member.color}40` }}>
                {member.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                <p className="text-xs text-[#B9BBC8] truncate">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why Marchés Direct */}
      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6 md:p-8 orange-glow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Pourquoi Marchés Direct ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REASONS.map(r => (
            <div key={r} className="flex items-start gap-3">
              <CheckCircle size={16} className="text-orange shrink-0 mt-0.5" />
              <span className="text-sm text-[#B9BBC8]">{r}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-[#17334D] flex flex-col sm:flex-row gap-3">
          <Link to="/comment-ca-marche" className="inline-flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors text-sm">
            Comment ça marche <ArrowRight size={14} />
          </Link>
          <Link to="/equipe" className="inline-flex items-center justify-center gap-2 border border-orange text-orange font-semibold px-6 py-3 rounded-xl hover:bg-orange/10 transition-colors text-sm">
            Notre équipe <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
