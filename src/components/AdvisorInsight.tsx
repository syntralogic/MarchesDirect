import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import elena from '@/assets/1.jpeg';

// "Le regard de votre chargé d'affaires" (client brief 17 Oct, follow-up and complement): the frame that accompanies
// the visitor through the journey, styled close to the support block of the dossier page (same background, discreet
// orange border, Elena's portrait and real role) - but smaller, with ONE direction to the next step, never competing
// buttons. Not a lone sentence, not an accordion.
//  - opportunity: general opinion on the MARKET only, direction = check whether it fits the visitor's company;
//  - compatibility: summary of the result for THIS company, direction = discover the pre-filled dossier.
// The big support block (30 free minutes, callback, appointment) stays on the dossier only: it is the outcome.
// The text is built automatically from real data, so the frame says so and never suggests Elena studied the file.

interface Props {
  id?: string;
  advice: ReactNode;
  ctaLabel: string;
  onNext: () => void;
  className?: string;
}

export function AdvisorInsight({ id, advice, ctaLabel, onNext, className = '' }: Props) {
  const titleId = `${id || 'advisor-insight'}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={`rounded-2xl p-4 md:p-5 ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(255,101,0,.13) 0%, rgba(255,101,0,.04) 100%), #0A2236',
        border: '1.5px solid rgba(255,101,0,.45)',
        boxShadow: '0 12px 30px -18px rgba(255,101,0,.4)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* fixed size + object-cover: the face is never squashed (guide v24, images) */}
        <img
          src={elena}
          alt="Elena Popescu"
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          className="w-12 h-12 shrink-0 grow-0 rounded-full object-cover border-2 border-orange"
        />
        <div className="min-w-0">
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#FDBA74]">Votre accompagnement</p>
          <p className="text-sm text-[#B9BBC8]">Elena Popescu · Votre premier contact</p>
        </div>
      </div>

      <h2 id={titleId} className="mt-3 text-lg md:text-xl font-extrabold text-white leading-tight">Le regard de votre chargé d’affaires</h2>
      <p className="mt-2 text-[15px] md:text-base leading-relaxed text-white">{advice}</p>
      <p className="mt-2 text-[11px] leading-snug text-[#8A9BB0]">Repères établis automatiquement à partir des informations disponibles ; ils ne remplacent pas l’échange avec votre chargé d’affaires.</p>

      <button
        type="button"
        onClick={onNext}
        className="mt-3 w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#c24e00] hover:bg-[#d65600] text-white text-[15px] font-bold px-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FDBA74]"
      >
        {ctaLabel} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
