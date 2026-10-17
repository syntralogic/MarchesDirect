import type { ReactNode } from 'react';
import { MessageSquareText } from 'lucide-react';

// "Le regard de votre chargé d'affaires" (client brief 17 Oct, follow-up): the short advice frame shown on the
// opportunity page (advice about the MARKET only - the company is not known yet) and right after the compatibility
// result (advice crossing market, company and the visitor's answers). The big support block stays on the dossier only.
// The text is built automatically from real data, so the frame says so: it must never suggest that a person has
// already examined the file personally.

interface Props {
  id?: string;
  advice: ReactNode;
  className?: string;
}

export function AdvisorInsight({ id, advice, className = '' }: Props) {
  const titleId = `${id || 'advisor-insight'}-title`;
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={`rounded-2xl p-4 md:p-5 ${className}`}
      style={{
        background: 'linear-gradient(180deg, rgba(255,101,0,.10) 0%, rgba(255,101,0,.03) 100%), #0A2236',
        border: '1px solid rgba(255,101,0,.45)',
      }}
    >
      <div className="flex items-center gap-2">
        <MessageSquareText size={16} className="text-orange shrink-0" aria-hidden="true" />
        <h2 id={titleId} className="text-sm md:text-base font-extrabold text-white leading-tight">Le regard de votre chargé d’affaires</h2>
      </div>
      <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-white">{advice}</p>
      <p className="mt-2 text-[11px] leading-snug text-[#8A9BB0]">Repères établis automatiquement à partir des informations disponibles. Votre chargé d’affaires les confirme avec vous.</p>
    </section>
  );
}
