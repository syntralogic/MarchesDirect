import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LangProvider } from '@/contexts/LangContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';

import HomePage from '@/pages/HomePage';
import AppelsPage from '@/pages/AppelsPage';
import MarchesPublicsPage from '@/pages/MarchesPublicsPage';
import SousTraitancePage from '@/pages/SousTraitancePage';
import CommentCaMarchePage from '@/pages/CommentCaMarchePage';
import TarifsPage from '@/pages/TarifsPage';
import RecherchePage from '@/pages/RecherchePage';
import TableauDeBordPage from '@/pages/TableauDeBordPage';
import ProfilPage from '@/pages/ProfilPage';
import AProposPage from '@/pages/AProposPage';
import EquipePage from '@/pages/EquipePage';
import FaqPage from '@/pages/FaqPage';
import ActualitesPage from '@/pages/ActualitesPage';
import ZonesPage from '@/pages/ZonesPage';
import SecteursPage from '@/pages/SecteursPage';
import InternationalPage from '@/pages/InternationalPage';
import MentionsLegalesPage from '@/pages/MentionsLegalesPage';
import ConfidentialitePage from '@/pages/ConfidentialitePage';
import CguPage from '@/pages/CguPage';
import ContactPage from '@/pages/ContactPage';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      <main className="flex-1 pb-16 md:pb-0 min-w-0">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LangProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/appels-doffres" element={<AppelsPage />} />
              <Route path="/marches-publics" element={<MarchesPublicsPage />} />
              <Route path="/sous-traitance" element={<SousTraitancePage />} />
              <Route path="/comment-ca-marche" element={<CommentCaMarchePage />} />
              <Route path="/tarifs" element={<TarifsPage />} />
              <Route path="/recherche" element={<RecherchePage />} />
              <Route path="/tableau-de-bord" element={<TableauDeBordPage />} />
              <Route path="/profil" element={<ProfilPage />} />
              <Route path="/a-propos" element={<AProposPage />} />
              <Route path="/equipe" element={<EquipePage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/actualites" element={<ActualitesPage />} />
              <Route path="/zones" element={<ZonesPage />} />
              <Route path="/secteurs" element={<SecteursPage />} />
              <Route path="/international" element={<InternationalPage />} />
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="/confidentialite" element={<ConfidentialitePage />} />
              <Route path="/cgu" element={<CguPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
          <Toaster />
        </BrowserRouter>
      </LangProvider>
    </ThemeProvider>
  );
};

export default App;
