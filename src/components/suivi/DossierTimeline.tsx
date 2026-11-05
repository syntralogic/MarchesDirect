import type { ReactNode } from 'react';
import type { SuiviStep } from '@/lib/apiClient';

// 5 nov. (demande client) : UNE seule frise, identique sur la fiche marché, dans l'espace client et sur la page
// d'un dossier. Fait = vert, en cours = orange, action attendue du client = jaune, à venir = grisé.
const shortDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return null;
  const today = new Date(); const same = d.toDateString() === today.toDateString();
  return same ? 'Aujourd’hui' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });
};

export default function DossierTimeline({ steps, renderAction }: { steps: SuiviStep[]; renderAction?: (s: SuiviStep) => ReactNode }) {
  return (
    <ol className="relative m-0 list-none p-0" aria-label="Avancement">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const dot = s.state === 'done' ? 'border-[#34D399] bg-[#34D399] text-[#0A1628]'
          : s.state === 'action' ? 'border-[#FBBF24] bg-[#F59E0B] text-[#0A1628]'
          : s.state === 'current' ? 'border-[#FB923C] bg-[#C2410C] text-white shadow-[0_0_0_5px_rgba(249,115,22,.18)]'
          : 'border-[#2B4468] bg-[#0A1628] text-[#B4C1D3]';
        const when = shortDate(s.at);
        const action = renderAction?.(s);
        return (
          <li key={s.key} className="relative min-h-[44px] pb-4 pl-10" aria-current={s.state === 'current' || s.state === 'action' ? 'step' : undefined}>
            {!last && <span aria-hidden className={`absolute left-[13px] top-[28px] bottom-0 w-[2px] ${s.state === 'done' ? 'bg-[#34D399]' : 'bg-[#2B4468]'}`} />}
            <span aria-hidden className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[13px] font-extrabold ${dot}`}>
              {s.state === 'done' ? '✓' : s.state === 'action' ? '!' : i + 1}
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <b className={`text-[15px] leading-tight ${s.state === 'todo' ? 'text-[#B4C1D3]' : s.state === 'done' ? 'text-[#D6E0EC]' : 'text-[#F2F5F9]'}`}>{s.label}</b>
              {when && s.state !== 'todo' && <span className="shrink-0 text-[11.5px] font-semibold text-[#B4C1D3]">{when}</span>}
            </div>
            <span className="mt-0.5 block text-[12.5px] leading-snug text-[#B4C1D3]">{s.detail}</span>
            {action && <div className="mt-2">{action}</div>}
          </li>);
      })}
    </ol>
  );
}

/** Barre d'avancement compacte pour les listes (espace client). */
export function MiniProgress({ steps }: { steps: SuiviStep[] }) {
  return (
    <div className="mt-2.5 flex gap-1" aria-hidden>
      {steps.map(s => <i key={s.key} className={`h-1.5 flex-1 rounded-full ${s.state === 'done' ? 'bg-[#34D399]' : s.state === 'action' ? 'bg-[#F59E0B]' : s.state === 'current' ? 'bg-[#F97316]' : 'bg-[#22385A]'}`} />)}
    </div>
  );
}

/** Phrase d'état d'un dossier, pour les listes. */
export function stateLine(steps: SuiviStep[]): { text: string; tone: 'action' | 'progress' | 'done' } {
  const a = steps.find(s => s.state === 'action'); if (a) return { text: `${a.label}`, tone: 'action' };
  const c = steps.find(s => s.state === 'current'); if (c) return { text: c.key === 'result' ? 'Déposé · en attente de réponse' : c.label === 'Dossier confié à Elena' ? 'Elena prépare votre dossier' : c.label, tone: 'progress' };
  const last = steps[steps.length - 1]; return { text: last.label, tone: 'done' };
}
