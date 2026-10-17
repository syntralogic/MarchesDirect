import { useLayoutEffect, useRef, useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS } from '@/data/departments';
import '@/styles/mdHero.css';

// Hero de l'accueil, aligné sur la maquette client (Marches-Direct-conversion-v24) :
// carte, 2 onglets, champ métier, zone, bouton orange,
// filtres par type de marché et « Affiner ma recherche ». La recherche ouvre /recherche
// avec les mêmes paramètres que le reste du site (q, department, journey, nature).

type Mode = 'open' | 'proj';
type TypeTab = 'all' | 'pub' | 'priv' | 'st';
type Nature = 'travaux' | 'services' | 'fournitures';

const TYPE_TABS: { key: TypeTab; journey?: string }[] = [
  { key: 'all' },
  { key: 'pub', journey: 'public_procurement' },
  { key: 'priv', journey: 'tender' },
  { key: 'st', journey: 'subcontracting' },
];
const NATURE_KEYS: Nature[] = ['travaux', 'services', 'fournitures'];

const TXT = {
  fr: {
    title1: 'Trouvez votre prochain marché.', title2: 'Nous vous aidons à y répondre.',
    sub: 'Marchés publics, appels d’offres privés et sous-traitance entre professionnels.',
    more: 'Un chargé d’affaires vous aide à préparer votre candidature.',
    tablist: 'Type de recherche', tabOpen: 'Marchés ouverts', tabOpenD: 'Consultations en cours', tabProj: 'Futurs chantiers', tabProjD: 'Avant les appels d’offres',
    job: 'Quel est votre métier ?', placeholder: 'Ex. : électricien, nettoyage…', zone: 'Dans quelle zone recherchez-vous ?', france: 'Toute la France',
    search: 'Rechercher des marchés', free: 'Consultation et analyse gratuites · sans inscription', small: 'Seul ou en équipe, trouvez des marchés à votre taille.',
    kind: 'Type de marché', all: 'Tous les marchés', pub: 'Marchés publics', priv: 'Appels d’offres privés', st: 'Sous-traitance',
    refine: 'Affiner ma recherche', hide: 'Masquer les filtres', nature: 'Nature', travaux: 'Travaux', services: 'Services', fournitures: 'Fournitures',
    projT: 'Repérez les futurs chantiers avant la publication des appels d’offres.', projP: 'Projets repérés à partir des autorisations d’urbanisme publiées, avant l’ouverture des consultations.',
    projN: 'Un projet détecté n’est ni une consultation ouverte, ni une recherche de prestataires confirmée.', projCta: 'Étudier un projet avec un chargé d’affaires',
    aiT: 'Ce marché est-il fait pour votre entreprise ?', aiP: 'Choisissez un marché, renseignez votre nom ou SIRET. Découvrez ce qui correspond, ce qu’il faut vérifier et comment préparer votre réponse.',
    s1: 'Un marché', s2: 'Votre entreprise', s3: 'Votre analyse gratuite',
  },
  en: {
    title1: 'Find your next contract.', title2: 'We help you win it.',
    sub: 'Public contracts, private tenders and subcontracting between professionals.',
    more: 'A business advisor helps you prepare your bid.',
    tablist: 'Search type', tabOpen: 'Open contracts', tabOpenD: 'Bids currently open', tabProj: 'Upcoming projects', tabProjD: 'Before tenders are published',
    job: 'What is your trade?', placeholder: 'E.g. electrician, cleaning…', zone: 'Which area are you searching in?', france: 'All of France',
    search: 'Search contracts', free: 'Free review and analysis · no sign-up', small: 'Alone or in a team, find contracts that fit your size.',
    kind: 'Contract type', all: 'All contracts', pub: 'Public contracts', priv: 'Private tenders', st: 'Subcontracting',
    refine: 'Refine my search', hide: 'Hide filters', nature: 'Type of work', travaux: 'Works', services: 'Services', fournitures: 'Supplies',
    projT: 'Spot upcoming projects before the tenders are published.', projP: 'Projects identified from published planning permits, before consultations open.',
    projN: 'A detected project is neither an open consultation nor a confirmed search for contractors.', projCta: 'Review a project with a business advisor',
    aiT: 'Is this contract right for your business?', aiP: 'Choose a contract, enter your company name or SIRET number. See what matches, what to check and how to prepare your bid.',
    s1: 'A contract', s2: 'Your company', s3: 'Your free analysis',
  },
} as const;

export default function MdHero({ onAppt }: { onAppt: () => void }) {
  const navigate = useNavigate();
  const { lang } = useLang();
  const T = TXT[lang === 'en' ? 'en' : 'fr'];
  const [mode, setMode] = useState<Mode>('open');
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('FR');
  const [tab, setTab] = useState<TypeTab>('all');
  const [showRefine, setShowRefine] = useState(false);
  const [nature, setNature] = useState<Nature | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Téléphone : le bouton orange « Rechercher » se place juste au-dessus de la barre de navigation fixe, quelle que soit
  // la hauteur de l'écran, et le texte qui le suit passe sous la première vue (retour client 17 oct.). La place disponible
  // n'est plus laissée vide entre l'introduction et le moteur : elle est répartie dans la taille des onglets, des
  // libellés, des champs et du bouton (--hx-u, voir mdHero.css). Au-delà de 1,4 unité, le reste devient un espace (--hx-gap).
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || mode !== 'open') return;
    let lastW = -1;
    const MAX_U = 1.4;
    const fit = () => {
      root.style.setProperty('--hx-u', '0');
      root.style.setProperty('--hx-gap', '0px');
      root.style.setProperty('--hx-free-gap', '12px');
      root.classList.remove('hx-tight');
      if (window.innerWidth > 640) return;
      const btn = btnRef.current;
      if (!btn) return;
      const nav = document.querySelector<HTMLElement>('.fixed.bottom-0.md\\:hidden');
      const navTop = nav ? nav.getBoundingClientRect().top : window.innerHeight - 65;
      const target = navTop - 20;
      const bottomNow = () => btn.getBoundingClientRect().bottom + window.scrollY;
      let room = Math.round(target - bottomNow());
      // Écran trop court : on masque les sous-titres des onglets pour que le bouton reste visible.
      if (room < 0) {
        root.classList.add('hx-tight');
        room = Math.round(target - bottomNow());
        if (room <= 0) return;
      }
      // Répartition : 1 unité = 100 px répartis dans les éléments du moteur. Deux passes de correction (les polices
      // agrandies modifient un peu la hauteur réelle).
      let u = Math.min(MAX_U, room / 100);
      for (let i = 0; i < 3; i++) {
        root.style.setProperty('--hx-u', u.toFixed(3));
        const diff = target - bottomNow();
        if (Math.abs(diff) < 1.5) break;
        u = Math.max(0, Math.min(MAX_U, u + diff / 100));
      }
      const left = Math.round(target - bottomNow());
      if (left > 1) root.style.setProperty('--hx-gap', `${Math.min(320, left)}px`);
      root.style.setProperty('--hx-free-gap', '32px');
    };
    const onResize = () => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; fit(); } };
    lastW = window.innerWidth;
    fit();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', fit);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('orientationchange', fit); };
  }, [mode, lang]);

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
      <option value="FR">{T.france}</option>
      {DEPARTMENTS.map(d => (
        <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
      ))}
    </select>
  );

  return (
    <div className="mdhero origin-app" ref={rootRef}>
      <section className="hx hx-top">
        <div className="wrap">
          <div className="hx-grid">
            <div className="hx-main">
              <h1 className="hx-title">
                {T.title1}<span>{T.title2}</span>
              </h1>
              <p className="hx-sub hx-promise">
                {T.sub} {T.more}
              </p>
              <div className="hx-search">
                <div role="tablist" aria-label={T.tablist} className="hx-tabs">
                  <button role="tab" aria-selected={mode === 'open'} onClick={() => setMode('open')} className={mode === 'open' ? 'hx-tab hx-tab-on' : 'hx-tab'}>
                    <span className="hx-tab-l">{T.tabOpen}</span><span className="hx-tab-d">{T.tabOpenD}</span>
                  </button>
                  <button role="tab" aria-selected={mode === 'proj'} onClick={() => setMode('proj')} className={mode === 'proj' ? 'hx-tab hx-tab-on' : 'hx-tab'}>
                    <span className="hx-tab-l">{T.tabProj}</span><span className="hx-tab-d">{T.tabProjD}</span>
                  </button>
                </div>
                <div className="hx-body">
                  {mode === 'open' ? (
                    <>
                      <label htmlFor="mdhero-q" className="hx-qlab2">{T.job}</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        <div className="qfield" style={{ flex: '1 1 260px', minWidth: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 12, padding: '0 14px', minHeight: 60 }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                          </svg>
                          <input
                            id="mdhero-q" value={q} autoComplete="off" placeholder={T.placeholder}
                            onChange={e => setQ(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(); } }}
                            style={{ flex: 1, width: '100%', minWidth: 0, border: 0, outline: 'none', fontFamily: 'inherit', fontSize: 18, color: '#0F172A', background: 'transparent', minHeight: 56 }}
                          />
                        </div>
                        <div className="mf-zone origin-zone">
                          <label htmlFor="mdhero-zone" className="lbl">{T.zone}</label>
                          {zoneSelect('mdhero-zone')}
                        </div>
                        <button ref={btnRef} className="btn btn-o" onClick={doSearch} style={{ flex: '1 0 200px', maxWidth: '100%', minHeight: 60, fontSize: 18, borderRadius: 12, whiteSpace: 'nowrap' }}>
                          {T.search}
                        </button>
                      </div>
                      <p className="hx-free">{T.free}</p>
                      <p className="hx-small">{T.small}</p>
                      <div role="radiogroup" aria-label={T.kind} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
                        {TYPE_TABS.map(t => {
                          const on = tab === t.key;
                          return (
                            <button key={t.key} role="radio" aria-checked={on} onClick={() => setTab(t.key)}
                              style={{ minHeight: 40, padding: '0 13px', borderRadius: 999, border: `1px solid ${on ? '#F97316' : '#2A3B57'}`, background: on ? 'rgba(194,65,12,.16)' : 'rgba(11,26,49,.6)', color: on ? '#FDBA74' : '#E2E8F0', fontFamily: 'inherit', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                              {T[t.key]}
                            </button>
                          );
                        })}
                        <span style={{ flex: '1 1 0' }} />
                        <button className="link origin-refine cdc04-refine" onClick={() => setShowRefine(v => !v)} aria-expanded={showRefine} style={{ fontSize: 14, minHeight: 40 }}>
                          {showRefine ? T.hide : T.refine}
                        </button>
                      </div>
                      {showRefine && (
                        <div style={{ marginTop: 12, paddingTop: 14, borderTop: '1px solid rgba(147,197,253,.18)' }}>
                          <div className="lbl">{T.nature}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {NATURE_KEYS.map(n => (
                              <button key={n} className={nature === n ? 'chip chip-on' : 'chip'} onClick={() => setNature(nature === n ? null : n)}>{T[n]}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 22, lineHeight: 1.2, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                        {T.projT}
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: 16, color: '#CBD5E1' }}>
                        {T.projP}
                      </p>
                      <p style={{ margin: '10px 0 0', fontSize: 14, color: '#94A3B8' }}>
                        {T.projN}
                      </p>
                      <button className="btn btn-o" onClick={onAppt} style={{ marginTop: 14, minHeight: 52, borderRadius: 12 }}>
                        {T.projCta}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
              <div className="hx-anim" id="how">
                <div className="hx-ai">
                  <h2 className="hx-ai-t">{T.aiT}</h2>
                  <p>{T.aiP}</p>
                  <ol className="hx-st3">
                    <li><b>1</b><span>{T.s1}</span></li>
                    <li><b>2</b><span>{T.s2}</span></li>
                    <li><b>3</b><span>{T.s3}</span></li>
                  </ol>
                </div>
              </div>
          </div>
        </div>
      </section>
    </div>
  );
}
