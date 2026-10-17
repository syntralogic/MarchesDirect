import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS } from '@/data/departments';
import '@/styles/mdHero.css';

// Hero de l'accueil, aligné sur la maquette client (Marches-Direct-conversion-v24) :
// carte « Artisans · Indépendants · TPE », 2 onglets, champ métier, zone, bouton orange,
// filtres par type de marché et « Affiner ma recherche ». La recherche ouvre /recherche
// avec les mêmes paramètres que le reste du site (q, department, journey, nature).

type Mode = 'open' | 'proj';
type TypeTab = 'all' | 'pub' | 'priv' | 'st';
type Nature = 'travaux' | 'services' | 'fournitures';

const TYPE_TABS: { key: TypeTab; label: string; journey?: string }[] = [
  { key: 'all', label: 'Tous les marchés' },
  { key: 'pub', label: 'Marchés publics', journey: 'public_procurement' },
  { key: 'priv', label: 'Appels d’offres privés', journey: 'tender' },
  { key: 'st', label: 'Sous-traitance', journey: 'subcontracting' },
];
const NATURES: { key: Nature; label: string }[] = [
  { key: 'travaux', label: 'Travaux' },
  { key: 'services', label: 'Services' },
  { key: 'fournitures', label: 'Fournitures' },
];

export default function MdHero({ onAppt }: { onAppt: () => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('open');
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('FR');
  const [tab, setTab] = useState<TypeTab>('all');
  const [showRefine, setShowRefine] = useState(false);
  const [nature, setNature] = useState<Nature | null>(null);

  const doSearch = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (dept !== 'FR') p.append('department', dept);
    const journey = TYPE_TABS.find(t => t.key === tab)?.journey;
    if (journey) p.set('journey', journey);
    if (nature) p.set('nature', nature);
    p.set('status', 'all');
    navigate(`/recherche?${p.toString()}`);
  };

  const zoneSelect = (id: string) => (
    <select id={id} className="field" value={dept} onChange={e => setDept(e.target.value)}>
      <option value="FR">Toute la France</option>
      {DEPARTMENTS.map(d => (
        <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
      ))}
    </select>
  );

  return (
    <div className="mdhero origin-app">
      <section className="hx" style={{ padding: '40px 0 28px' }}>
        <div className="wrap">
          <div className="hx-grid">
            <div className="hx-main">
              <div className="origin-eyebrow">Artisans · Indépendants · TPE</div>
              <h1 className="hx-title">
                Trouvez votre prochain marché.<span>Nous vous aidons à y répondre.</span>
              </h1>
              <p className="hx-sub hx-promise">
                Marchés publics, appels d’offres privés et sous-traitance entre professionnels. Un chargé d’affaires vous aide à préparer votre candidature.
              </p>
              <div className="hx-search">
                <div role="tablist" aria-label="Type de recherche" className="hx-tabs">
                  <button role="tab" aria-selected={mode === 'open'} onClick={() => setMode('open')} className={mode === 'open' ? 'hx-tab hx-tab-on' : 'hx-tab'}>
                    <span className="hx-tab-l">Marchés ouverts</span><span className="hx-tab-d">Consultations en cours</span>
                  </button>
                  <button role="tab" aria-selected={mode === 'proj'} onClick={() => setMode('proj')} className={mode === 'proj' ? 'hx-tab hx-tab-on' : 'hx-tab'}>
                    <span className="hx-tab-l">Futurs chantiers</span><span className="hx-tab-d">Avant les appels d&apos;offres</span>
                  </button>
                </div>
                <div className="hx-body">
                  {mode === 'open' ? (
                    <>
                      <label htmlFor="mdhero-q" className="hx-qlab2">Quel est votre métier ?</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        <div className="qfield" style={{ flex: '1 1 260px', minWidth: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 12, padding: '0 14px', minHeight: 60 }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                          </svg>
                          <input
                            id="mdhero-q" value={q} autoComplete="off" placeholder="Ex. : électricien, nettoyage…"
                            onChange={e => setQ(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } }}
                            style={{ flex: 1, width: '100%', minWidth: 0, border: 0, outline: 'none', fontFamily: 'inherit', fontSize: 18, color: '#0F172A', background: 'transparent', minHeight: 56 }}
                          />
                        </div>
                        <div className="mf-zone origin-zone">
                          <label htmlFor="mdhero-zone" className="lbl">Dans quelle zone recherchez-vous ?</label>
                          {zoneSelect('mdhero-zone')}
                        </div>
                        <button className="btn btn-o" onClick={doSearch} style={{ flex: '1 0 200px', maxWidth: '100%', minHeight: 60, fontSize: 18, borderRadius: 12, whiteSpace: 'nowrap' }}>
                          Rechercher des marchés
                        </button>
                      </div>
                      <p className="hx-free">Consultation et analyse gratuites · sans inscription</p>
                      <p className="hx-small">Seul ou en équipe, trouvez des marchés à votre taille.</p>
                      <div role="radiogroup" aria-label="Type de marché" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
                        {TYPE_TABS.map(t => {
                          const on = tab === t.key;
                          return (
                            <button key={t.key} role="radio" aria-checked={on} onClick={() => setTab(t.key)}
                              style={{ minHeight: 40, padding: '0 13px', borderRadius: 999, border: `1px solid ${on ? '#F97316' : '#2A3B57'}`, background: on ? 'rgba(194,65,12,.16)' : 'rgba(11,26,49,.6)', color: on ? '#FDBA74' : '#E2E8F0', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                              {t.label}
                            </button>
                          );
                        })}
                        <span style={{ flex: '1 1 0' }} />
                        <button className="link origin-refine cdc04-refine" onClick={() => setShowRefine(v => !v)} aria-expanded={showRefine} style={{ fontSize: 14, minHeight: 40 }}>
                          {showRefine ? 'Masquer les filtres' : 'Affiner ma recherche'}
                        </button>
                      </div>
                      {showRefine && (
                        <div style={{ marginTop: 12, paddingTop: 14, borderTop: '1px solid rgba(147,197,253,.18)' }}>
                          <div className="lbl">Nature</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {NATURES.map(n => (
                              <button key={n.key} className={nature === n.key ? 'chip chip-on' : 'chip'} onClick={() => setNature(nature === n.key ? null : n.key)}>{n.label}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 22, lineHeight: 1.2, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                        Repérez les futurs chantiers avant la publication des appels d&apos;offres.
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 16, color: '#CBD5E1' }}>
                        Projets repérés à partir des autorisations d&apos;urbanisme publiées, avant l&apos;ouverture des consultations.
                      </p>
                      <p style={{ margin: '10px 0 0', fontSize: 14, color: '#94A3B8' }}>
                        Un projet détecté n&apos;est ni une consultation ouverte, ni une recherche de prestataires confirmée.
                      </p>
                      <button className="btn btn-o" onClick={onAppt} style={{ marginTop: 14, minHeight: 52, borderRadius: 12 }}>
                        Étudier un projet avec un chargé d&apos;affaires
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="hx-anim" id="how">
        <div className="hx-ai">
          <h2 className="hx-ai-t">Ce marché est-il fait pour votre entreprise ?</h2>
          <p>Choisissez un marché, renseignez votre nom ou SIRET. Découvrez ce qui correspond, ce qu’il faut vérifier et comment préparer votre réponse.</p>
          <ol className="hx-st3">
            <li><b>1</b><span>Un marché</span></li>
            <li><b>2</b><span>Votre entreprise</span></li>
            <li><b>3</b><span>Votre analyse gratuite</span></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
