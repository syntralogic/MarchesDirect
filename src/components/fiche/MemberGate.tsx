import { useState } from 'react';
import { membersApi } from '@/lib/apiClient';
import { getSessionId } from '@/lib/visitorTracking';
import { setMember } from '@/lib/memberGate';

// 7 nov. (décision de Hedi) : après 10 fiches, on continue gratuitement en laissant portable + e-mail. Sans mot de passe.
// L'entreprise, déjà connue, est rappelée. Texte d'information exigé par la CNIL sous le formulaire.
const CONSENT = 'Vos coordonnées servent à retrouver votre espace Marchés Direct et à vous présenter nos offres d’accompagnement. Vous pouvez demander leur suppression à tout moment.';
const FIELD = 'h-[52px] w-full rounded-xl border-2 border-[#C9D6E8] bg-white px-3 text-[16px] text-[#0A1628] focus:border-[#F97316] focus:outline-none';

export default function MemberGate({ company, siret, seen, onDone }: { company?: string | null; siret?: string | null; seen: number; onDone: () => void }) {
  const [phone, setPhone] = useState(''); const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError(null);
    try {
      await membersApi.join({ phone, email, company: company || undefined, siret: siret || undefined, sessionId: getSessionId(), fichesSeen: seen, consentText: CONSENT });
      setMember(); onDone();
    } catch (ex: any) {
      const f = ex?.response?.data?.fields; if (f) setErrors(f); else setError('L’enregistrement n’a pas abouti. Réessayez dans un instant.');
    } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-[20px] border-2 border-[#C2410C] bg-[#142B4A] p-4">
      <h2 className="text-[19px] font-extrabold">Continuez gratuitement</h2>
      <p className="text-[14.5px] text-[#D6E0EC]">Vous avez consulté {seen} annonces. Indiquez votre portable et votre e-mail pour continuer : pas de mot de passe, vous retrouvez vos annonces et vos alertes sur tous vos appareils.</p>
      {company && <p className="rounded-xl bg-[#123B2A] px-3 py-2 text-[13.5px] text-[#6EE7B7]">✓ {company}</p>}
      <label className="text-[14px] font-extrabold" htmlFor="mg-tel">Portable</label>
      <input id="mg-tel" type="tel" inputMode="tel" autoComplete="tel" className={FIELD} value={phone} onChange={e => { setPhone(e.target.value); setErrors(x => ({ ...x, phone: '' })); }} placeholder="06 12 34 56 78" />
      {errors.phone && <p role="alert" className="text-[13px] text-[#FCA5A5]">{errors.phone}</p>}
      <label className="text-[14px] font-extrabold" htmlFor="mg-mail">E-mail</label>
      <input id="mg-mail" type="email" inputMode="email" autoComplete="email" className={FIELD} value={email} onChange={e => { setEmail(e.target.value); setErrors(x => ({ ...x, email: '' })); }} />
      {errors.email && <p role="alert" className="text-[13px] text-[#FCA5A5]">{errors.email}</p>}
      {error && <p role="alert" className="text-[13px] text-[#FCA5A5]">{error}</p>}
      <button type="submit" disabled={busy} className="flex min-h-[54px] items-center justify-center rounded-[14px] bg-[#C2410C] text-[17px] font-extrabold text-white disabled:opacity-60">{busy ? 'Enregistrement…' : 'Continuer gratuitement'}</button>
      <p className="text-[12px] leading-relaxed text-[#B4C1D3]">{CONSENT}</p>
    </form>
  );
}
