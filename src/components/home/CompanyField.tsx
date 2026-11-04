import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useCompanyKnown } from '@/contexts/CompanyKnownContext';
import { homeApi, type ApiCompanySearchParams } from '@/lib/apiClient';
import { getSessionId, trackVisitorEvent } from '@/lib/visitorTracking';

// Home, tab « Par entreprise » (client brief v26, 1.2): ONE field, a name or a SIRET (14 digits, spaces tolerated).
// From 3 characters the company database already used on the fiche is queried (POST /siret/lookup); at most 3 matches
// are offered. Once recognised the company stays in the session (CompanyKnownContext, server-side siret_lookups), so the
// list, the fiche and the forms never ask for it again. The métier and the zone are deduced (APE + head office), not asked.
//
// Interim: « Voir les marchés qui me correspondent » opens the existing search with that métier and zone, until the
// ranked list screen (« Vos marchés ») is built.

const WHY = 'Pour identifier votre entreprise dans les registres officiels. Nous y retrouvons votre activité, votre zone et votre taille pour vous montrer les marchés qui vous correspondent. Rien d’autre.';

export default function CompanyField() {
  const navigate = useNavigate();
  const { companyKnown, company, siret, candidates, lookup, confirm } = useCompanyKnown();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [params, setParams] = useState<ApiCompanySearchParams | null>(null);
  const [showList, setShowList] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const seq = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const recognised = companyKnown && !!company && !changing;

  // Métier and zone of the recognised company (also on a later visit: the session remembers the company).
  useEffect(() => {
    if (!recognised) { setParams(null); return; }
    let alive = true;
    homeApi.companySearchParams(getSessionId()).then(p => { if (alive) setParams(p); }).catch(() => { if (alive) setParams(null); });
    return () => { alive = false; };
  }, [recognised, siret]);

  const announce = (s: string | null) => {
    trackVisitorEvent('company_selected', 'Entreprise sélectionnée', undefined, { siret: s });
  };

  const run = async (raw: string) => {
    const digits = raw.replace(/\s/g, '');
    const q = /^\d{14}$/.test(digits) ? digits : raw.trim();
    const my = ++seq.current;
    setBusy(true); setError(null);
    const r = await lookup(q);
    if (my !== seq.current) return;
    setBusy(false);
    if (r.error) { setError(r.error); setShowList(false); return; }
    if (r.companyKnown) { setChanging(false); setShowList(false); announce(r.siret || null); } else setShowList(true);
  };

  const onChange = (v: string) => {
    setValue(v); setError(null);
    window.clearTimeout(timer.current);
    seq.current++;
    const digits = v.replace(/\s/g, '');
    if (/^\d+$/.test(digits)) { if (digits.length === 14) timer.current = window.setTimeout(() => run(v), 250); else setShowList(false); return; }
    if (v.trim().length >= 3) timer.current = window.setTimeout(() => run(v), 450); else setShowList(false);
  };

  const pick = async (s: string) => {
    setBusy(true); setError(null);
    const r = await confirm(s);
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    if (r.companyKnown) { setChanging(false); setShowList(false); announce(r.siret || s); }
  };

  const go = () => {
    if (!recognised) { inputRef.current?.focus(); setError('Indiquez le nom de votre entreprise ou son SIRET.'); return; }
    const p = new URLSearchParams();
    if (params?.query) p.set('q', params.query);
    if (params?.department) p.append('department', params.department);
    p.set('status', 'all');
    navigate(`/recherche?${p.toString()}`);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    const f = () => { setChanging(true); setValue(''); setTimeout(() => inputRef.current?.focus(), 0); };
    window.addEventListener('md:focus-company', f);
    return () => window.removeEventListener('md:focus-company', f);
  }, []);

  const place = [company?.city, params?.department ? `(${params.department})` : ''].filter(Boolean).join(' ');
  const line = [company?.name, params?.professionLabel || company?.activity, place].filter(Boolean).join(' · ');

  return (
    <div>
      <label htmlFor="mdhero-company" className="hx-qlab2 hx-qlab-main">Nom de votre entreprise ou SIRET</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <div className="qfield" style={{ flex: '1 1 260px', minWidth: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 12, padding: '0 14px', minHeight: 60 }}>
          <input
            id="mdhero-company" ref={inputRef} value={recognised ? (company?.name || '') : value} readOnly={recognised}
            autoComplete="off" inputMode="search" placeholder="Ex. : Net Services Lille, ou 123 456 789 00012"
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); recognised ? go() : run(value); } }}
            aria-describedby="mdhero-company-msg"
            style={{ flex: 1, width: '100%', minWidth: 0, border: 0, outline: 'none', fontFamily: 'inherit', fontSize: 18, color: '#0F172A', background: 'transparent' }}
          />
        </div>
        <button className="btn btn-o" onClick={go} style={{ flex: '1 0 200px', maxWidth: '100%', minHeight: 60, fontSize: 18, borderRadius: 12 }}>
          Voir les marchés qui me correspondent
        </button>
      </div>

      <div id="mdhero-company-msg" aria-live="polite">
        {busy && <p style={{ margin: '10px 0 0', fontSize: 15, color: '#CBD5E1' }}>Recherche en cours…</p>}
        {error && <p role="alert" style={{ margin: '10px 0 0', fontSize: 15, color: '#FCA5A5' }}>{error}</p>}
        {recognised && (
          <p style={{ margin: '10px 0 0', fontSize: 15, color: '#86EFAC', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Check size={18} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{line} · <button type="button" className="link" onClick={() => { setChanging(true); setValue(''); setTimeout(() => inputRef.current?.focus(), 0); }} style={{ minHeight: 44, padding: '0 4px' }}>Modifier</button></span>
          </p>
        )}
      </div>

      {!recognised && showList && candidates.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'grid', gap: 8 }}>
          {candidates.slice(0, 3).map(c => (
            <li key={c.siret}>
              <button type="button" onClick={() => pick(c.siret)} disabled={busy}
                style={{ width: '100%', minHeight: 56, textAlign: 'left', padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(147,197,253,.32)', background: 'rgba(255,255,255,.06)', color: '#fff', fontSize: 15, lineHeight: 1.35 }}>
                <b>{c.name || c.siret}</b>
                <span style={{ color: '#CBD5E1' }}> · {[c.activity, c.city].filter(Boolean).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', fontSize: 15, color: '#93C5FD' }}>Pourquoi le nom ou le SIRET ?</summary>
        <p style={{ margin: '4px 0 0', fontSize: 15, color: '#CBD5E1' }}>{WHY}</p>
      </details>
    </div>
  );
}
