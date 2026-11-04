import type { ReactNode } from 'react';
import { COPY, MOMENTS, type CoordChoice, type CoordErrors, type CoordValues, type Moment } from '@/lib/coordonnees';

// Screen 4 (COORDONNÉES): one form per choice. Errors sit under the field, the button says "Envoi…" while sending,
// and nothing here promises an e-mail.
type Props = {
  choice: CoordChoice;
  context: string;                       // « ENTREPRISE · titre court · réponse avant le … »
  values: CoordValues;
  errors: CoordErrors;
  submitting: boolean;
  submitError: string | null;
  onChange: (patch: Partial<CoordValues>) => void;
  onSubmit: () => void;
  onBack: () => void;
  elenaPhoto: ReactNode;
  backLabel?: string;                    // default: « Retour au marché »
  hideSteps?: boolean;                   // the general question is not a step of the market journey
};

const field = 'min-h-[52px] w-full rounded-xl border border-[#2B4468] bg-[#0F1F35] px-3.5 text-[16px] text-[#F2F5F9] placeholder:text-[#7C8CA3] focus:border-[#FB923C] focus:outline-none';
const errText = 'mt-1 text-[14px] text-[#FCA5A5]';

export default function CoordonneesScreen(p: Props) {
  const c = COPY[p.choice];
  const err = p.errors;
  return (
    <div className="flex flex-col gap-4 pb-10">
      <button type="button" onClick={p.onBack} className="min-h-[44px] self-start text-left text-[14px] font-semibold text-[#B4C1D3]">‹ {p.backLabel || 'Retour au marché'}</button>
      {!p.hideSteps && <ol className="flex gap-2 text-[13px] text-[#B4C1D3]" aria-label="Étapes"><li>1 · Vos marchés</li><li>2 · Mon analyse</li><li className="font-bold text-[#F2F5F9]">3 · Mon dossier</li></ol>}

      <div>
        <p className="text-[13px] font-bold uppercase tracking-wide text-[#FB923C]">{c.label}</p>
        <h1 className="mt-1 text-[26px] font-extrabold leading-tight">{c.title}</h1>
        <p className="mt-2 text-[15px] text-[#D6E0EC]">{c.sub}</p>
        <p className="mt-2 text-[13px] text-[#B4C1D3]">{p.context}</p>
      </div>

      <p className="rounded-xl bg-[#123B2A] px-3.5 py-2.5 text-[14px] text-[#6EE7B7]"><b>Vous obtenez :</b> {c.benefit}</p>

      <form onSubmit={(e) => { e.preventDefault(); p.onSubmit(); }} noValidate className="flex flex-col gap-4">
        {p.choice === 'info' && (
          <div>
            <label htmlFor="coord-question" className="mb-1.5 block text-[14px] font-semibold">Votre question</label>
            <textarea id="coord-question" rows={4} value={p.values.question} onChange={(e) => p.onChange({ question: e.target.value })} maxLength={1000}
              aria-invalid={!!err.question} aria-describedby={err.question ? 'coord-question-err' : undefined}
              className={`${field} py-3`} placeholder="Par exemple : puis-je répondre seul à ce marché ?" />
            {err.question && <p id="coord-question-err" className={errText}>{err.question}</p>}
          </div>
        )}

        {p.choice === 'rappel' && (
          <fieldset>
            <legend className="mb-1.5 text-[14px] font-semibold">Votre moment préféré</legend>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Votre moment préféré">
              {MOMENTS.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={p.values.moment === m.id} onClick={() => p.onChange({ moment: m.id as Moment })}
                  className={`min-h-[52px] rounded-xl border px-2 text-[14px] font-bold ${p.values.moment === m.id ? 'border-[#FB923C] bg-[#C2410C]/25 text-white' : 'border-[#2B4468] text-[#D6E0EC]'}`}>{m.label}</button>
              ))}
            </div>
            {err.moment && <p className={errText}>{err.moment}</p>}
          </fieldset>
        )}

        <div>
          <label htmlFor="coord-phone" className="mb-1.5 block text-[14px] font-semibold">Votre téléphone <span aria-hidden className="text-[#FB923C]">*</span></label>
          <input id="coord-phone" type="tel" inputMode="tel" autoComplete="tel" value={p.values.phone} onChange={(e) => p.onChange({ phone: e.target.value })}
            aria-invalid={!!err.phone} aria-describedby={err.phone ? 'coord-phone-err' : undefined} placeholder="06 12 34 56 78" className={field} />
          {err.phone && <p id="coord-phone-err" className={errText}>{err.phone}</p>}
        </div>

        {p.choice === 'dossier' && (
          <div>
            <label htmlFor="coord-email" className="mb-1.5 block text-[14px] font-semibold">Votre e-mail <span className="font-normal text-[#B4C1D3]">(facultatif)</span></label>
            <input id="coord-email" type="email" inputMode="email" autoComplete="email" value={p.values.email} onChange={(e) => p.onChange({ email: e.target.value })}
              aria-invalid={!!err.email} aria-describedby={err.email ? 'coord-email-err' : undefined} placeholder="vous@exemple.fr" className={field} />
            {err.email && <p id="coord-email-err" className={errText}>{err.email}</p>}
          </div>
        )}

        <p className="text-[13px] text-[#B4C1D3]">{c.before}</p>
        {p.submitError && <p className={errText} role="status">{p.submitError}</p>}
        <button type="submit" disabled={p.submitting} className="flex min-h-[56px] w-full items-center justify-center rounded-[14px] bg-[#C2410C] px-4 text-[17px] font-extrabold text-white disabled:opacity-60">
          {p.submitting ? 'Envoi…' : c.btn}
        </button>
        <p className="text-center text-[13px] text-[#B4C1D3]">Sans engagement · Données confidentielles</p>
      </form>

      <div className="flex items-center gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-3.5">
        {p.elenaPhoto}
        <p className="text-[14px] text-[#D6E0EC]"><b className="block text-[13px] text-[#B4C1D3]">Elena Popescu</b>{c.elena}</p>
      </div>
    </div>
  );
}
