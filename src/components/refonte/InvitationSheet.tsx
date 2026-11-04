import { X } from 'lucide-react';

// Spec 3.12 wording. A bottom sheet (no dimmed overlay), close cross, no countdown, no false urgency.
export default function InvitationSheet({ onAccept, onClose }: { onAccept: () => void; onClose: () => void }) {
  return (
    <aside role="complementary" aria-label="30 minutes offertes" className="fixed bottom-0 inset-x-0 z-40 px-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      <div className="max-w-[460px] mx-auto rounded-2xl bg-[#12233A] border border-[#2B4468] shadow-2xl p-5 flex flex-col gap-3 motion-safe:animate-in motion-safe:slide-in-from-bottom">
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute top-2 right-5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#B4C1D3]"><X size={20} /></button>
        <p className="text-[15px] leading-relaxed text-[#F2F5F9] pr-8">
          Ce marché vous intéresse, mais vous ne savez pas par où commencer ? Profitez de 30 minutes offertes avec notre équipe pour faire le point sur votre entreprise, ce marché et les prochaines étapes.
        </p>
        <button type="button" onClick={onAccept} className="min-h-[52px] rounded-xl bg-[#C2410C] text-white font-extrabold">Demander mes 30 minutes offertes</button>
        <p className="text-xs text-center text-[#B4C1D3]">Par téléphone · Sans engagement</p>
      </div>
    </aside>
  );
}
