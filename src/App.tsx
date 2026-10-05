import NotFound from '@/pages/NotFound';
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LangProvider } from '@/contexts/LangContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { CompanyKnownProvider } from '@/contexts/CompanyKnownContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import ConsentBanner from '@/components/ConsentBanner';

import HomePage from '@/pages/HomePage';
import AppelsPage from '@/pages/AppelsPage';
import MarchesPublicsPage from '@/pages/MarchesPublicsPage';
import SousTraitancePage from '@/pages/SousTraitancePage';
import InfoPage from '@/pages/InfoPage';
import TeamProfilePage from '@/pages/TeamProfilePage'; // <-- Added import
import SeoLandingPage from '@/pages/SeoLandingPage';
import SeoLocalPage from '@/pages/SeoLocalPage';
import MissionDetailPage from '@/pages/sous-traitance/MissionDetailPage';
import MissionProfilPage from '@/pages/sous-traitance/MissionProfilPage';
import MissionRelationPage from '@/pages/sous-traitance/MissionRelationPage';
import MiseEnRelationPage from '@/pages/sous-traitance/MiseEnRelationPage';
import TarifsPage from '@/pages/TarifsPage';
import RecherchePage from '@/pages/RecherchePage';
import OpportunityJourneyPage from '@/pages/OpportunityJourneyPage';
import OpportunityDetailPage from '@/pages/OpportunityDetailPage';
import { OpportunityTransitionProvider } from '@/contexts/OpportunityTransitionContext';
import BidWorkspacePage from '@/pages/BidWorkspacePage';
import TableauDeBordPage from '@/pages/TableauDeBordPage';
import ProfilPage from '@/pages/ProfilPage';
import CompanyVaultPage from '@/pages/CompanyVaultPage';
import EquipePage from '@/pages/EquipePage';
import ActualitesPage from '@/pages/ActualitesPage';
import ArticleDetailPage from '@/pages/ArticleDetailPage';
import ZonesPage from '@/pages/ZonesPage';
import SecteursPage from '@/pages/SecteursPage';
import InternationalPage from '@/pages/InternationalPage';
import MentionsLegalesPage from '@/pages/MentionsLegalesPage';
import ConfidentialitePage from '@/pages/ConfidentialitePage';
import CguPage from '@/pages/CguPage';
import ContactPage from '@/pages/ContactPage';
import LoginPage from '@/pages/LoginPage';
import MagicLinkPage from '@/pages/MagicLinkPage';
import SignupPage from '@/pages/SignupPage';
import { RequireAuth } from '@/components/common/RequireAuth';

import AdminDashboard from '@/pages/AdminDashboard';
import AdminTenders from '@/pages/AdminTenders';
import AdminUsers from '@/pages/AdminUsers';
import AdminLeads from '@/pages/AdminLeads';
import AdminContacts from '@/pages/AdminContacts';
import AdminSubscriptions from '@/pages/AdminSubscriptions';
import AdminBrands from '@/pages/AdminBrands';
import AdminSettings from '@/pages/AdminSettings';
import { siteStatusApi } from '@/lib/apiClient';

// AdminSettings' Maintenance toggle has been saveable since 30 Sep, but
// nothing on the site ever actually enforced it (schema.sql said so
// plainly on the app_settings table itself) - flipping it in the admin
// panel visibly did nothing. This is the visitor-facing half of the fix
// (server.ts's maintenance gate is the other half, on the API side).
function MaintenancePage({ message }: { message: string }) {
  return (
    <div className="min-h-screen w-full bg-[#001326] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center border border-[#17334D] bg-[#061D32] rounded-2xl p-8">
        <span className="text-xl font-bold tracking-tight block mb-4">
          <span className="text-white">Marchés</span><span className="text-orange"> Direct</span>
        </span>
        <p className="text-sm text-[#B9BBC8] whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  // /connexion (login + magic link) and /admin stay reachable during
  // maintenance - otherwise an admin who turns this on has no way back in
  // to turn it back off.
  const isLogin = location.pathname.startsWith('/connexion');

  // Checked once per load, not per navigation - a value that only changes
  // when an admin explicitly saves it doesn't need refetching on every
  // route change, and the server-side gate (server.ts) is what actually
  // enforces this for every API call regardless of what this check shows.
  const [maintenance, setMaintenance] = useState<{ active: boolean; message: string } | null>(null);
  useEffect(() => {
    siteStatusApi.get()
      .then((s) => setMaintenance({ active: s.maintenanceMode, message: s.maintenanceMessage }))
      // Fails open on purpose (same reasoning as server.ts's own fallback):
      // a broken status check must never itself look like "site is down".
      .catch(() => {});
  }, []);

  // Footer/menu links like "Zones géographiques" (#mdh-zones on the
  // homepage) are plain anchor hashes, but react-router doesn't scroll to
  // them on navigation from a different page - the target page mounted
  // fine, just at the top, which looked like the link went nowhere. Wait a
  // tick for the target section to actually be in the DOM, then scroll.
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname, location.hash]);

  if (maintenance?.active && !isAdmin && !isLogin) {
    return <MaintenancePage message={maintenance.message} />;
  }

  if (isAdmin) {
    return <div className="min-h-screen w-full bg-[#001326]">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />
      {/* pb-24 clears the fixed mobile bottom nav. */}
      <main className="flex-1 pb-24 md:pb-0 min-w-0">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <ConsentBanner />
    </div>
  );
}

// 28 Sep user test: nothing reset the scroll position on navigation, so
// clicking "Voir les opportunités" from the bottom of the home page opened
// /recherche already scrolled ~3700px down - the visitor landed in the middle
// of the results list with the search form and filters out of sight.
// Only reacts to a real page change (pathname) on a forward navigation: a
// back/forward (POP) keeps the browser's own restoration, an #anchor keeps
// its own scroll target, and query-string edits on the same page (filters
// syncing to the URL) never yank the page back to the top.
const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType === 'POP' || hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash, navType]);
  return null;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <FavoritesProvider>
          <CompanyKnownProvider>
          <BrowserRouter>
            <OpportunityTransitionProvider>
            <ScrollToTop />
            <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/appels-doffres" element={<AppelsPage />} />
              <Route path="/marches-publics" element={<MarchesPublicsPage />} />
              <Route path="/sous-traitance" element={<SousTraitancePage />} />
              {/* Local SEO landing pages (client brief, gap #4) - clean nested
                  URLs matching real generated content: journey x city,
                  journey x city x trade, journey x department. */}
              <Route path="/marches-publics/departement/:department" element={<SeoLocalPage journey="public_procurement" />} />
              <Route path="/marches-publics/:city/:trade" element={<SeoLocalPage journey="public_procurement" />} />
              <Route path="/marches-publics/:city" element={<SeoLocalPage journey="public_procurement" />} />
              <Route path="/appels-doffres/departement/:department" element={<SeoLocalPage journey="tender" />} />
              <Route path="/appels-doffres/:city/:trade" element={<SeoLocalPage journey="tender" />} />
              <Route path="/appels-doffres/:city" element={<SeoLocalPage journey="tender" />} />
              <Route path="/sous-traitance/departement/:department" element={<SeoLocalPage journey="subcontracting" />} />
              <Route path="/sous-traitance/:city/:trade" element={<SeoLocalPage journey="subcontracting" />} />
              <Route path="/sous-traitance/:city" element={<SeoLocalPage journey="subcontracting" />} />
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
              <Route path="/actualites/:id" element={<ArticleDetailPage />} />
              <Route path="/zones" element={<ZonesPage />} />
              <Route path="/secteurs" element={<SecteursPage />} />
              <Route path="/international" element={<InternationalPage />} />
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="/confidentialite" element={<ConfidentialitePage />} />
              <Route path="/cgu" element={<CguPage />} />
              <Route path="/contact" element={<ContactPage />} />
              {/* No self-serve checkout route: per client's explicit
                  instruction (WhatsApp), the site is a lead-capture tool,
                  not a place to actually buy a subscription - real pricing
                  is negotiated and sold by phone. A live, reachable
                  /checkout/:planId page would let a visitor buy online
                  regardless of what the pricing page's buttons do, so the
                  route itself is gone, not just its buttons. */}

              <Route path="/connexion" element={<LoginPage />} />
              <Route path="/connexion/lien" element={<MagicLinkPage />} />
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
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AppLayout>
            </OpportunityTransitionProvider>
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