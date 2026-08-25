import { Clock3 } from 'lucide-react';

/**
 * Shown instead of the raw fetch-error text when the opportunities API call
 * fails - almost always because no backend is deployed yet / VITE_API_URL
 * isn't pointing at a live marchesdirect-backend instance (see
 * .env.example / DEPLOY.md), not because anything on this page is broken.
 * Once a real backend + BOAMP connector are live, `error` from
 * useOpportunities stops firing and this never renders.
 */
export function OpportunitiesPendingState() {
  return (
    <div className="flex flex-col items-center gap-2 text-center py-10 px-4">
      <div className="w-10 h-10 rounded-full bg-[#061D32] border border-[#17334D] flex items-center justify-center text-orange">
        <Clock3 size={17} />
      </div>
      <p className="text-xs font-semibold text-white">Nouvelles annonces bientôt en ligne</p>
      <p className="text-[11px] text-[#B9BBC8] max-w-[38ch]">
        La connexion aux sources officielles est en cours de mise en place. Revenez très bientôt pour voir les
        premières opportunités.
      </p>
    </div>
  );
}
