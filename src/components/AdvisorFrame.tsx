import type { ReactNode } from 'react';
import { CalendarCheck, Phone } from 'lucide-react';
import elena from '@/assets/1.jpeg';

// Chargé d'affaires block (client brief 17 Oct, point 1). Our offer rests on the human support, so this is the one
// block that must stand out from the neighbouring grey-blue cards: its own background, a controlled orange border, a
// clearly visible title, the validated portrait + first name, the advice at reading size, and BOTH actions inside the
// frame (never an accordion, never a bare link). Same colours / Inter typography as the rest of the site.
// The advice text is a prop: its generation rules (what encourages, which data is used, variants) are defined in a
// later step; until then callers pass nothing and the reference sentence below is shown.

export const ADVISOR_REFERENCE_ADVICE =
  'Faites le point avec un chargé d’affaires sur les exigences, les pièces à préparer et vos prochaines étapes.';

interface Props {
  onAppointment: () => void;
  onCallback: () => void;
  advice?: ReactNode;
  id?: string;
  className?: string;
}

export function AdvisorFrame({ onAppointment, onCallback, advice, id, className = '' }: Props) {
  const titleId = `${id || 'advisor'}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={`rounded-2xl p-4 md:p-5 ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(255,101,0,.13) 0%, rgba(255,101,0,.04) 100%), #0A2236',
        border: '1.5px solid rgba(255,101,0,.62)',
        boxShadow: '0 12px 30px -16px rgba(255,101,0,.45)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* fixed size + object-cover: the face is never squashed (guide v24, images) */}
        <img
          src={elena}
          alt="Elena"
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className="w-12 h-12 shrink-0 grow-0 rounded-full object-cover border-2 border-orange"
        />
        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#FDBA74]">Votre accompagnement</p>
          <p className="text-sm text-[#B9BBC8]">Elena · Votre premier contact</p>
        </div>
      </div>

      <h2 id={titleId} className="mt-3 text-xl md:text-2xl font-extrabold text-white leading-tight">
        Votre premier échange avec un chargé d’affaires
      </h2>
      <p className="mt-2 text-base md:text-[17px] leading-relaxed text-white">{advice ?? ADVISOR_REFERENCE_ADVICE}</p>

      <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={onAppointment}
          className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#c24e00] hover:bg-[#d65600] text-white text-[15px] font-bold px-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FDBA74]"
        >
          <CalendarCheck size={16} aria-hidden="true" /> Réserver mes 30 minutes offertes
        </button>
        <button
          type="button"
          onClick={onCallback}
          className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-orange text-[#FDBA74] hover:bg-orange/10 text-[15px] font-semibold px-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FDBA74]"
        >
          <Phone size={16} aria-hidden="true" /> Être rappelé
        </button>
      </div>
      <p className="mt-2.5 text-center text-xs text-[#B9BBC8]">Par téléphone · Gratuit · Sans engagement</p>
    </section>
  );
}
