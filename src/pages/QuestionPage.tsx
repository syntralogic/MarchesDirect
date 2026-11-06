import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import CoordonneesScreen from '@/components/fiche/CoordonneesScreen';
import { COPY, EMPTY_COORDS, formatPhone, leadMessage, loadCoords, saveCoords, validateCoords, rappelDelai, type CoordErrors, type CoordValues } from '@/lib/coordonnees';
import { crmApi, getApiErrorMessage } from '@/lib/apiClient';
import { useBrand } from '@/hooks/use-brand';
import { useIdempotency } from '@/lib/useIdempotency';
import { getSessionId, trackRequestSubmitted } from '@/lib/visitorTracking';
import { normalizeFrPhoneDigits } from '@/lib/utils';

// « Poser ma question » from the home page: the v26 QUESTION form (screen 4) without a market.
// Phone required, question required, no e-mail promise. Replaces the old callback pop-up for this link.
function ElenaPhoto() {
  const [ok, setOk] = useState(true);
  return ok
    ? <img src="/team/elena.jpg" alt="Elena Popescu" width={48} height={48} onError={() => setOk(false)} className="h-12 w-12 shrink-0 rounded-full object-cover" />
    : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#22385A] text-[13px] font-bold text-[#D6E0EC]" aria-hidden>EP</div>;
}

export default function QuestionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { brandId } = useBrand();
  const idem = useIdempotency();
  // ?q= : question préremplie (ex. « Être prévenu » depuis la liste quand un type de marché est vide).
  const [coords, setCoords] = useState<CoordValues>(() => ({ ...EMPTY_COORDS, ...loadCoords(), question: (params.get('q') || '').slice(0, 1000) }));
  const [errors, setErrors] = useState<CoordErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const errs = validateCoords('info', coords);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!idem.begin()) return;
    setSubmitting(true); setSubmitError(null);
    try {
      if (!brandId) throw new Error('Impossible de contacter le serveur, réessayez.');
      const requestId = idem.key();
      await crmApi.submitLead({
        brandId, phone: normalizeFrPhoneDigits(coords.phone), sessionId: getSessionId(), idempotencyKey: requestId,
        leadSource: 'contact_form', message: leadMessage('info', coords),
      });
      trackRequestSubmitted('contact', { requestId });
      idem.reset(); saveCoords({ ...coords, question: '' });
      setDone(true); window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(`${getApiErrorMessage(err, 'Échec de l’envoi.')} Vous pouvez réessayer.`);
    } finally { idem.end(); setSubmitting(false); }
  };

  const shell = 'mx-auto flex w-full max-w-[560px] flex-col gap-6 bg-[#0A1628] px-4 pb-10 pt-3 text-[#F2F5F9]';
  const font = { fontFamily: '"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif' };
  if (done) return (
    <main className={shell} style={font}>
      <section role="status" className="rounded-2xl border border-[#1E6B4A] bg-[#123B2A] p-4">
        <h1 className="text-[22px] font-extrabold text-[#6EE7B7]">✓ {COPY.info.done.title}</h1>
        <p className="mt-1.5 text-[15px] text-[#E8FFF4]">Rien d’autre à faire : Elena vous rappelle au {formatPhone(coords.phone)} {rappelDelai()} avec la réponse.</p>
      </section>
      <div className="flex items-center gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-3.5"><ElenaPhoto /><p className="text-[14px] text-[#D6E0EC]"><b className="block text-[13px] text-[#B4C1D3]">Elena Popescu</b>{COPY.info.done.elena}</p></div>
      <Link to="/" className="min-h-[48px] self-start text-[14px] font-semibold text-[#FB923C] underline">‹ Revenir à l’accueil</Link>
    </main>
  );
  return (
    <main className={shell} style={font}>
      <CoordonneesScreen choice="info" context="Question générale · sans marché précis" values={coords} errors={errors} submitting={submitting} submitError={submitError}
        onChange={(patch) => { setCoords((c) => ({ ...c, ...patch })); setErrors({}); }} onSubmit={submit} onBack={() => navigate(-1)} elenaPhoto={<ElenaPhoto />}
        backLabel="Retour" hideSteps />
    </main>
  );
}
