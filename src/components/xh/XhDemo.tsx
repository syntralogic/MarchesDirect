import { useEffect, useRef } from 'react';
import './xh.css';
import { xhEngine, xhWatch } from './xhEngine';
import { XH_MARKUP } from './xhMarkup';

// Animated « Analyse croisée » demonstration (fictional data), shown under the hero.
// The animation plays when the block is on screen; users can pause it or replay it.
export default function XhDemo({ onReserve }: { onReserve: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = hostRef.current?.querySelector('.xh');
    if (!root) return;
    const api = xhEngine(root, {});
    const io = xhWatch(root, api);
    return () => {
      io?.disconnect();
      api.destroy();
    };
  }, []);

  return (
    <section className="px-3 md:px-6 pb-8 max-w-3xl md:max-w-5xl mx-auto w-full">
      <div className="hx-anim" id="analyse-croisee">
        <div ref={hostRef} dangerouslySetInnerHTML={{ __html: XH_MARKUP }} />
        <div className="hx-rdv">
          <p>30 minutes offertes avec un chargé d'affaires, sur le marché de votre choix.</p>
          <button
            type="button"
            onClick={onReserve}
            className="border border-orange text-orange font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-orange/10 transition-colors"
          >
            Réserver mes 30 minutes
          </button>
        </div>
      </div>
    </section>
  );
}
