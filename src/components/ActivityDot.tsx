// 2.5 : point rouge qui pulse + « N entreprises ont consulté ce marché aujourd'hui » (carte ET fiche).
// Le chiffre vient du serveur (réel, masqué si < 2 ; aléatoire seulement si SOCIAL_PROOF_MODE=demo côté serveur).
// Sur la liste, la requête ne part que lorsque la carte arrive à l'écran.
import { useEffect, useRef, useState } from 'react';
import { getConsultationIndicator } from '@/lib/visitorTracking';

export default function ActivityDot({ opportunityId, className = '' }: { opportunityId: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current; if (!el || !opportunityId) return;
    let live = true;
    const go = () => { getConsultationIndicator(opportunityId).then(v => { if (live) setLabel(v && (v.value ?? 2) >= 2 ? v.label : null); }); };
    if (typeof IntersectionObserver === 'undefined') { go(); return () => { live = false; }; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '200px' });
    io.observe(el);
    return () => { live = false; io.disconnect(); };
  }, [opportunityId]);
  return (
    <p ref={ref} className={label ? `flex items-center gap-2 text-[13px] text-[#D6E0EC] ${className}` : 'hidden'}>
      {label && (<><span className="md-live-dot h-2.5 w-2.5 shrink-0 rounded-full bg-[#EF4444]" aria-hidden />{label}</>)}
    </p>
  );
}
