import { Link } from 'react-router-dom';
import { Building2, Zap, Settings, Monitor, Truck, Briefcase, ArrowRight } from 'lucide-react';
import { sectors } from '@/data/mockData';
import { useLang } from '@/contexts/LangContext';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2, Zap, Settings, Monitor, Truck, Briefcase,
};

const SECTOR_DETAILS: Record<string, { description: string; examples: string[] }> = {
  'Travaux & construction': {
    description: 'Marchés de travaux publics, bâtiments, réhabilitation, génie civil et aménagement urbain.',
    examples: ['Réhabilitation de voirie', 'Construction d\'équipements sportifs', 'Travaux de peinture', 'Maçonnerie générale'],
  },
  'Énergie & environnement': {
    description: 'Projets liés aux énergies renouvelables, efficacité énergétique et gestion environnementale.',
    examples: ['Installation photovoltaïque', 'Audit énergétique', 'Traitement des eaux', 'Gestion des déchets'],
  },
  'Industrie & maintenance': {
    description: 'Prestations de maintenance industrielle, équipements techniques et fournitures spécialisées.',
    examples: ['Maintenance préventive', 'Fourniture de machines', 'Contrôle qualité', 'Instrumentation'],
  },
  'Informatique & télécoms': {
    description: 'Marchés de services IT, infrastructures réseau, logiciels et développement numérique.',
    examples: ['Infrastructure réseau', 'Développement logiciel', 'Cybersécurité', 'Cloud et hébergement'],
  },
  'Transport & logistique': {
    description: 'Services de transport, logistique urbaine, flotte et mobilité.',
    examples: ['Transport scolaire', 'Logistique urbaine', 'Location de véhicules', 'Livraison de proximité'],
  },
  'Services aux entreprises': {
    description: 'Nettoyage, gardiennage, services administratifs, formation et conseils professionnels.',
    examples: ['Nettoyage de locaux', 'Gardiennage', 'Formation professionnelle', 'Conseil RH'],
  },
};

export default function SecteursPage() {
  const { t } = useLang();

  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 md:mb-10">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('sectorsPageTag')}</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-2">{t('sectorsPageTitle')}</h1>
        <p className="text-[#B9BBC8] text-sm max-w-2xl">
          {t('sectorsPageSub')}
        </p>
      </div>

      {/* Sectors grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sectors.map(sector => {
          const Icon = ICON_MAP[sector.icon] || Building2;
          const details = SECTOR_DETAILS[sector.name];
          return (
            <Link
              key={sector.id}
              to="/recherche"
              className="group bg-[#061D32] border border-[#17334D] rounded-2xl p-5 hover:border-orange/40 transition-all flex flex-col"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center shrink-0">
                  <Icon size={22} className="text-orange" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white group-hover:text-orange transition-colors">{sector.name}</h3>
                  <span className="text-xs text-orange font-semibold">{sector.count.toLocaleString('fr-FR')} opportunités</span>
                </div>
              </div>
              {details && (
                <>
                  <p className="text-xs text-[#B9BBC8] leading-relaxed mb-4">{details.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {details.examples.map(ex => (
                      <span key={ex} className="text-xs text-[#B9BBC8] bg-[#031B30] border border-[#17334D] px-2 py-1 rounded-lg">
                        {ex}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <div className="flex items-center gap-1 text-xs text-orange font-semibold mt-auto">
                {t('sectorsSeeOpp')} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}