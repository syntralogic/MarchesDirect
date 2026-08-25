import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Only /tableau-de-bord and /profil actually need a logged-in company - the
// rest of the site (listings, journeys, marketing pages) is public by design
// (see Technical Requirements section 1: Google -> landing -> search ->
// opportunities -> lead form, all before any account exists).
//
// adminOnly additionally requires user.role to be 'admin' or 'super_admin' -
// the backend already enforces this server-side on every /api/admin/* call
// (requireRole middleware, see marchesdirect-backend/src/routes/admin.ts),
// so this is defense-in-depth on the frontend rather than the only thing
// standing between a logged-in non-admin and the admin panel's data - but a
// logged-in non-admin should still never see the admin UI shell at all,
// which is what this catches.
export function RequireAuth({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && user?.role !== 'admin' && user?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
