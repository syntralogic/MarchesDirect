import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LangProvider } from '@/contexts/LangContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { CompanyKnownProvider } from '@/contexts/CompanyKnownContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { ChatbotWidget } from '@/components/ChatbotWidget';

import HomePage from '@/pages/HomePage';
import AppelsPage from '@/pages/AppelsPage';
import MarchesPublicsPage from '@/pages/MarchesPublicsPage';
import SousTraitancePage from '@/pages/SousTraitancePage';
import InfoPage from '@/pages/InfoPage';
import TeamProfilePage from '@/pages/TeamProfilePage'; // <-- Added import
import SeoLandingPage from '@/pages/SeoLandingPage';
import MissionDetailPage from '@/pages/sous-traitance/MissionDetailPage';
import MissionProfilPage from '@/pages/sous-traitance/MissionProfilPage';
import MissionRelationPage from '@/pages/sous-traitance/MissionRelationPage';
import MiseEnRelationPage from '@/pages/sous-traitance/MiseEnRelationPage';
import TarifsPage from '@/pages/TarifsPage';
import RecherchePage from '@/pages/RecherchePage';
import OpportunityJourneyPage from '@/pages/OpportunityJourneyPage';
import OpportunityDetailPage from '@/pages/OpportunityDetailPage';
import BidWorkspacePage from '@/pages/BidWorkspacePage';
import TableauDeBordPage from '@/pages/TableauDeBordPage';
import ProfilPage from '@/pages/ProfilPage';
import CompanyVaultPage from '@/pages/CompanyVaultPage';
import EquipePage from '@/pages/EquipePage';
import ActualitesPage from '@/pages/ActualitesPage';
import ZonesPage from '@/pages/ZonesPage';
import SecteursPage from '@/pages/SecteursPage';
import InternationalPage from '@/pages/InternationalPage';
import MentionsLegalesPage from '@/pages/MentionsLegalesPage';
import ConfidentialitePage from '@/pages/ConfidentialitePage';
import CguPage from '@/pages/CguPage';
import ContactPage from '@/pages/ContactPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import { RequireAuth } from '@/components/common/RequireAuth';
import StripeCheckoutPage from '@/pages/StripeCheckoutPage';

import AdminDashboard from '@/pages/AdminDashboard';
import AdminTenders from '@/pages/AdminTenders';
import AdminUsers from '@/pages/AdminUsers';
import AdminLeads from '@/pages/AdminLeads';
import AdminContacts from '@/pages/AdminContacts';
import AdminSubscriptions from '@/pages/AdminSubscriptions';
import AdminBrands from '@/pages/AdminBrands';
import AdminSettings from '@/pages/AdminSettings';

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return <div className="min-h-screen w-full bg-[#001326]">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      {/* pb-40 (not just pb-16 for the bottom nav) also clears the fixed
          chatbot launcher button (bottom-20 + h-14 ≈ 136px from the bottom
          on mobile), which was overlapping the last card on pages like the
          opportunity detail "Analyse stratégique" tab. */}
      <main className="flex-1 pb-40 md:pb-0 min-w-0">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <ChatbotWidget />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <FavoritesProvider>
          <CompanyKnownProvider>
          <BrowserRouter>
            <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/appels-doffres" element={<AppelsPage />} />
              <Route path="/marches-publics" element={<MarchesPublicsPage />} />
              <Route path="/sous-traitance" element={<SousTraitancePage />} />
              <Route path="/info" element={<InfoPage />} />
              <Route path="/team-profile" element={<TeamProfilePage />} /> {/* <-- Added Route */}
              <Route path="/pages/:slug" element={<SeoLandingPage />} />
              <Route path="/a-propos" element={<InfoPage />} />
              <Route path="/about" element={<InfoPage />} />
              <Route path="/team" element={<InfoPage />} />
              <Route path="/how-it-works" element={<InfoPage />} />
              <Route path="/faq" element={<InfoPage />} />
              <Route path="/sous-traitance/mission/:id" element={<RequireAuth><MissionDetailPage /></RequireAuth>} />
              <Route path="/sous-traitance/mission/:id/profil" element={<RequireAuth><MissionProfilPage /></RequireAuth>} />
              <Route path="/sous-traitance/mission/:id/relation" element={<RequireAuth><MissionRelationPage /></RequireAuth>} />
              <Route path="/sous-traitance/mise-en-relation" element={<RequireAuth><MiseEnRelationPage /></RequireAuth>} />
              <Route path="/tarifs" element={<TarifsPage />} />
              <Route path="/recherche" element={<RecherchePage />} />
              <Route path="/parcours" element={<OpportunityJourneyPage />} />
              <Route path="/opportunites/:id" element={<OpportunityDetailPage />} />
              <Route path="/opportunites/:id/candidature" element={<RequireAuth><BidWorkspacePage /></RequireAuth>} />
              <Route path="/tableau-de-bord" element={<RequireAuth><TableauDeBordPage /></RequireAuth>} />
              <Route path="/profil" element={<RequireAuth><ProfilPage /></RequireAuth>} />
              <Route path="/profil/dossier-entreprise" element={<RequireAuth><CompanyVaultPage /></RequireAuth>} />
              <Route path="/equipe" element={<EquipePage />} />
              <Route path="/actualites" element={<ActualitesPage />} />
              <Route path="/zones" element={<ZonesPage />} />
              <Route path="/secteurs" element={<SecteursPage />} />
              <Route path="/international" element={<InternationalPage />} />
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="/confidentialite" element={<ConfidentialitePage />} />
              <Route path="/cgu" element={<CguPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/checkout/:planId" element={<StripeCheckoutPage />} />

              <Route path="/connexion" element={<LoginPage />} />
              <Route path="/inscription" element={<SignupPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<RequireAuth adminOnly><AdminDashboard /></RequireAuth>} />
              <Route path="/admin/tenders" element={<RequireAuth adminOnly><AdminTenders /></RequireAuth>} />
              <Route path="/admin/users" element={<RequireAuth adminOnly><AdminUsers /></RequireAuth>} />
              <Route path="/admin/leads" element={<RequireAuth adminOnly><AdminLeads /></RequireAuth>} />
              <Route path="/admin/contacts" element={<RequireAuth adminOnly><AdminContacts /></RequireAuth>} />
              <Route path="/admin/subscriptions" element={<RequireAuth adminOnly><AdminSubscriptions /></RequireAuth>} />
              <Route path="/admin/brands" element={<RequireAuth adminOnly><AdminBrands /></RequireAuth>} />
              <Route path="/admin/settings" element={<RequireAuth adminOnly><AdminSettings /></RequireAuth>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </AppLayout>
            <Toaster />
          </BrowserRouter>
          </CompanyKnownProvider>
          </FavoritesProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  );
};

export default App;