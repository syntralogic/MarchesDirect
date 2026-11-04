// Accueil v26 (1.2): un seul champ « Nom de votre entreprise ou SIRET ».
// Dès 3 caractères, recherche dans la base entreprises déjà utilisée par la fiche (POST /siret/lookup), 3 propositions au plus.
// L'entreprise reconnue reste en session pour tout le parcours (siret_lookups côté serveur, clé = sessionId).
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { siretApi, type ApiSiretCandidate, type ApiSiretStatus } from '@/lib/apiClient';
import { getSessionId, trackVisitorEvent } from '@/lib/visitorTracking';

export interface CompanySearchHandle { focus: () => void; clear: () => void }

// Code postal -> département (Corse 2A/2B, outre-mer sur 3 chiffres).
export function deptFromPostal(postal?: string | null): string | null {
  const p = (postal || '').trim();
  if (!/^\d{5}$/.test(p)) return null;
  if (p.startsWith('97') || p.startsWith('98')) return p.slice(0, 3);
  if (p.startsWith('20')) return Number(p) < 20200 ? '2A' : '2B';
  return p.slice(0, 2);
}

const cleanQuery = (q: string) => {
  const t = q.trim();
  const digits = t.replace(/[\s.]/g, '');
  return /^\d{9,14}$/.test(digits) ? digits : t;
};
const line = (name?: string | null, activity?: string | null, city?: string | null, postal?: string | null) => {
  const d = deptFromPostal(postal);
  return [name, activity, city ? `${city}${d ? ` (${d})` : ''}` : null].filter(Boolean).join(' · ');
};

export const CompanySearchForm = forwardRef<CompanySearchHandle>(function CompanySearchForm(_p, ref) {
  const navigate = useNavigate();
  const sessionId = useMemo(() => getSessionId(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const [q, setQ] = useState('');
  const [candidates, setCandidates] = useState<ApiSiretCandidate[]>([]);
  const [known, setKnown] = useState<ApiSiretStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { setQ(''); setKnown(null); setCandidates([]); setErr(null); inputRef.current?.focus(); },
  }));

  // Suggestions dès 3 caractères (anti-rebond 400 ms, une réponse tardive ne remplace jamais une plus récente).
  useEffect(() => {
    const t = cleanQuery(q);
    if (known && known.company?.name && t === known.company.name) return;
    setKnown(null); setCandidates([]); setErr(null);
    if (t.length < 3) return;
    const mine = ++seq.current;
    const h = window.setTimeout(async () => {
      try {
        const s = await siretApi.lookup(t, sessionId);
        if (mine !== seq.current) return;
        if (s.companyKnown) setKnown(s);
        else setCandidates((s.candidates || []).slice(0, 3));
      } catch { /* la saisie continue : l'erreur n'apparaît qu'à la validation */ }
    }, 400);
    return () => window.clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sessionId]);

  const pick = async (c: ApiSiretCandidate) => {
    setBusy(true); setErr(null);
    try {
      const s = await siretApi.confirm(c.siret, sessionId);
      seq.current++;
      setCandidates([]); setKnown(s); setQ(s.company?.name || c.name || q);
    } catch { setErr('Cette entreprise n’a pas pu être confirmée. Réessayez.'); }
    finally { setBusy(false); }
  };

  const go = async (s: ApiSiretStatus) => {
    // company_selected part ici : il peut donc précéder tout offer_view.
    trackVisitorEvent('company_selected', 'Entreprise sélectionnée', undefined, { siret: s.siret, source: 'accueil' });
    // Métier déduit du code APE, zone déduite du siège : rien n'est redemandé.
    // La liste classée (écran 2) n'existe pas encore : en attendant, la recherche existante s'ouvre sur ce métier et cette zone.
    const p = new URLSearchParams();
    try {
      const prof = await siretApi.profile(sessionId);
      if (prof.trades[0]?.name) p.set('q', prof.trades[0].name);
    } catch { /* métier inconnu : recherche par zone seule */ }
    const dept = deptFromPostal(s.company?.postal);
    if (dept) p.append('department', dept);
    p.set('status', 'all');
    navigate(`/recherche?${p.toString()}`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (known) { setBusy(true); await go(known); setBusy(false); return; }
    const t = cleanQuery(q);
    if (t.length < 3) { setErr('Indiquez le nom de votre entreprise ou votre SIRET.'); return; }
    if (candidates.length) { setErr('Touchez votre entreprise dans la liste ci-dessus.'); return; }
    setBusy(true); setErr(null);
    try {
      const s = await siretApi.lookup(t, sessionId);
      if (s.companyKnown) { setKnown(s); await go(s); }
      else if (s.candidates?.length) setCandidates(s.candidates.slice(0, 3));
      else setErr('Nous ne trouvons pas cette entreprise. Vérifiez le nom ou saisissez les 14 chiffres du SIRET.');
    } catch { setErr('La recherche n’a pas abouti. Réessayez dans un instant.'); }
    finally { setBusy(false); }
  };

  const c = known?.company;
  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <label htmlFor="md-company" className="text-[17px] font-bold">Nom de votre entreprise ou SIRET</label>
      <input
        id="md-company" ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
        placeholder="Ex. : Net Services Lille ou 929 393 072 00012" autoComplete="organization" enterKeyHint="go"
        aria-describedby={err ? 'md-company-err' : undefined}
        className="h-[52px] w-full rounded-xl border border-[#2B4468] bg-[#0A1628] px-3.5 text-[16px] text-[#F2F5F9] placeholder:text-[#7F93AE]"
      />
      {candidates.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Entreprises trouvées">
          {candidates.map(k => (
            <li key={k.siret}>
              <button type="button" onClick={() => pick(k)} disabled={busy}
                className="flex min-h-[52px] w-full items-center gap-2 rounded-xl border border-[#2B4468] bg-[#0F1F35] px-3.5 py-2 text-left text-[15px] text-[#D6E0EC]">
                <span className="min-w-0 flex-1">{line(k.name, k.activity, k.city, k.postal)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {c && (
        <div className="flex items-start gap-2 rounded-xl bg-[#123B2A] px-3.5 py-3 text-[15px] font-semibold text-[#6EE7B7]" role="status">
          <Check size={20} strokeWidth={2.5} className="mt-0.5 shrink-0" aria-hidden />
          <span>{line(c.name, c.activity, c.city, c.postal)}</span>
        </div>
      )}
      {err && <p id="md-company-err" role="alert" className="text-[15px] text-[#FCA5A5]">{err}</p>}
      <button type="submit" disabled={busy}
        className="min-h-[52px] w-full rounded-xl bg-[#C2410C] px-4 text-[16px] font-bold text-white disabled:opacity-70">
        {busy ? 'Recherche…' : 'Voir les marchés qui me correspondent'}
      </button>
      <details className="rounded-xl border border-[#22385A] bg-[#0F1F35]">
        <summary className="flex min-h-[48px] cursor-pointer items-center px-3.5 text-[15px] font-semibold text-[#D6E0EC]">Pourquoi le nom ou le SIRET ?</summary>
        <p className="px-3.5 pb-3.5 text-[15px] text-[#B4C1D3]">Pour identifier votre entreprise dans les registres officiels. Nous y retrouvons votre activité, votre zone et votre taille pour vous montrer les marchés qui vous correspondent. Rien d’autre.</p>
      </details>
    </form>
  );
});
