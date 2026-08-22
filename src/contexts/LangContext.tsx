import React, { createContext, useContext, useState } from 'react';

type Lang = 'fr' | 'en';

type Translations = Record<string, string>;

const frTranslations: Translations = {
  // Nav
  home: 'Accueil',
  tenders: "Appels d'offres",
  public: 'Marchés publics',
  subcontracting: 'Sous-traitance',
  howItWorks: 'Comment ça marche',
  pricing: 'Tarifs',
  search: 'Recherche',
  dashboard: 'Tableau de bord',
  profile: 'Profil',
  contact: 'Contact',
  // Hero
  heroLine1: 'Votre prochaine opportunité',
  heroLine2: 'commence ici.',
  heroSub: "Choisissez votre parcours ou échangez avec un conseiller Marchés Direct.",
  bookAppointment: 'Prendre rendez-vous',
  callBack: 'Être rappelé',
  // Sections
  whoWeAre: 'Qui sommes-nous ?',
  whoWeAreSub: "Une équipe experte à vos côtés, jusqu'à la signature de vos premiers marchés.",
  discoverUs: 'Découvrir Marchés Direct →',
  nearYou: 'PRÈS DE CHEZ VOUS',
  opportunitiesFrance: 'Des opportunités partout en France.',
  exploreFrance: 'Explorez les marchés par région, département ou grande ville.',
  seeAllZones: 'Voir toutes les zones',
  regions: 'Régions',
  departments: 'Départements',
  cities: 'Villes',
  international: 'Opportunités à l\'international',
  internationalSub: 'Accédez également aux marchés disponibles hors de France.',
  sectors: 'Secteurs d\'activité',
  sectorsSub: 'Des opportunités pour tous les métiers.',
  sectorsSub2: 'Explorez les secteurs et accédez aux opportunités adaptées à votre activité.',
  seeAllSectors: 'Voir tous les secteurs',
  news: 'Actualités',
  newsSub: "L'actualité des marchés.",
  newsSub2: 'Réglementation, nouvelles opportunités et secteurs à suivre.',
  seeAllNews: 'Voir toutes les actualités',
  finalCtaHeading: 'Besoin d\'aide pour trouver la bonne opportunité ?',
  finalCtaSub: "Un conseiller Marchés Direct vous aide à identifier le parcours adapté à votre entreprise.",
  // Footer
  copyright: '© 2026 MarchesDirect',
  legalNotice: 'Mentions légales',
  privacy: 'Confidentialité',
  terms: 'CGU',
  // Modals
  appointmentTitle: 'Prendre rendez-vous',
  callbackTitle: 'Être rappelé',
  callbackName: 'Nom',
  callbackCompany: 'Entreprise',
  callbackPhone: 'Téléphone',
  callbackTime: 'Moment souhaité',
  callbackSubmit: 'Demander un rappel',
  callbackConfirm: 'Votre demande a bien été envoyée. Nous vous rappelons rapidement.',
  // Steps
  step1: 'On surveille',
  step2: 'On trie & qualifie',
  step3: 'On prépare votre dossier',
  step4: 'Vous validez',
  step5: 'On dépose',
  step6: 'Vous gagnez du temps',
  // Bottom nav labels
  navHome: 'Accueil',
  navSearch: 'Recherche',
  navDashboard: 'Tableau de bord',
  navProfile: 'Profil',
};

const enTranslations: Translations = {
  home: 'Home',
  tenders: 'Tenders',
  public: 'Public Markets',
  subcontracting: 'Subcontracting',
  howItWorks: 'How it works',
  pricing: 'Pricing',
  search: 'Search',
  dashboard: 'Dashboard',
  profile: 'Profile',
  contact: 'Contact',
  heroLine1: 'Your next opportunity',
  heroLine2: 'starts here.',
  heroSub: 'Choose your path or speak with a Marchés Direct advisor.',
  bookAppointment: 'Book an appointment',
  callBack: 'Request a callback',
  whoWeAre: 'Who are we?',
  whoWeAreSub: 'An expert team by your side, until you sign your first contracts.',
  discoverUs: 'Discover Marchés Direct →',
  nearYou: 'NEAR YOU',
  opportunitiesFrance: 'Opportunities across France.',
  exploreFrance: 'Explore markets by region, department or city.',
  seeAllZones: 'See all zones',
  regions: 'Regions',
  departments: 'Departments',
  cities: 'Cities',
  international: 'International opportunities',
  internationalSub: 'Access markets available outside France.',
  sectors: 'Activity sectors',
  sectorsSub: 'Opportunities for every trade.',
  sectorsSub2: 'Explore sectors and access opportunities suited to your activity.',
  seeAllSectors: 'See all sectors',
  news: 'News',
  newsSub: 'Market news.',
  newsSub2: 'Regulations, new opportunities and sectors to follow.',
  seeAllNews: 'See all news',
  finalCtaHeading: 'Need help finding the right opportunity?',
  finalCtaSub: 'A Marchés Direct advisor helps you identify the path suited to your company.',
  copyright: '© 2026 MarchesDirect',
  legalNotice: 'Legal Notice',
  privacy: 'Privacy',
  terms: 'Terms',
  appointmentTitle: 'Book a meeting',
  callbackTitle: 'Request a callback',
  callbackName: 'Name',
  callbackCompany: 'Company',
  callbackPhone: 'Phone',
  callbackTime: 'Preferred time',
  callbackSubmit: 'Request a callback',
  callbackConfirm: 'Your request has been sent. We will call you back shortly.',
  step1: 'We monitor',
  step2: 'We sort & qualify',
  step3: 'We prepare your file',
  step4: 'You validate',
  step5: 'We submit',
  step6: 'You save time',
  navHome: 'Home',
  navSearch: 'Search',
  navDashboard: 'Dashboard',
  navProfile: 'Profile',
};

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

// ✅ Changed default language from 'fr' to 'en'
const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  // ✅ Changed default language from 'fr' to 'en'
  const [lang, setLang] = useState<Lang>('en');

  const t = (key: string): string => {
    const dict = lang === 'fr' ? frTranslations : enTranslations;
    return dict[key] ?? key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);