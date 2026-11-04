// Accueil v26 (maquette v26, écran 1). Ordre des blocs (fonctionnalités détaillées, 1.7) :
// moteur (2 onglets) → Elena → compteur → trois étapes → six critères → accompagnement → équipe → témoignages
// → questions → carte (chargée après le premier écran) → dernier appel. Le pied de page légal est celui du site.
// Retirés de l'accueil : « Marchés ouverts / Futurs chantiers », « Conseils et actualités ».
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { CallbackModal } from '@/components/CallbackModal';
import { CompanySearchForm, type CompanySearchHandle } from '@/components/home/CompanySearchForm';
import { DEPARTMENTS } from '@/data/departments';
import { ELENA, TEAM, VIDEO_TESTIMONIALS } from '@/data/homeContent';
import { opportunitiesApi } from '@/lib/apiClient';

const GeographicSection = lazy(() => import('@/components/home/GeographicSection'));
const SAVED_KEY = 'md_saved_markets';

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#FB923C]">{children}</div>
);
const Block = ({ children }: { children: React.ReactNode }) => <section className="flex flex-col gap-3">{children}</section>;

function ElenaAvatar({ size = 48 }: { size?: number }) {
  return ELENA.photo
    ? <img src={ELENA.photo} alt={ELENA.name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    : <div aria-hidden className="flex shrink-0 items-center justify-center rounded-full bg-[#1C2433] text-[15px] font-bold text-[#FB923C]" style={{ width: size, height: size }}>EP</div>;
}

// 1.5 : « [N] marchés ouverts aujourd'hui en France ». Valeur réelle (une requête par jour côté serveur), jamais de valeur fixe : en cas d'échec, toute la ligne disparaît.
function OpenCounter() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    opportunitiesApi.getOpenToday().then(r => { if (live && Number.isFinite(r.total) && r.total > 0) setN(r.total); }).catch(() => {});
    return () => { live = false; };
  }, []);
  if (n === null) return null;
  return (
    <p className="text-center text-[15px] text-[#D6E0EC]">
      <strong className="text-[18px] text-[#FB923C]">{new Intl.NumberFormat('fr-FR').format(n)}</strong> marchés ouverts aujourd’hui en France
      <span className="text-[#B4C1D3]"> · chiffre mis à jour chaque matin</span>
    </p>
  );
}

// 1.6 : lecture de localStorage uniquement, aucun appel réseau tant que le visiteur ne déplie pas la liste.
function SavedBanner() {
  const [ids, setIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') as { id?: string }[];
      setIds(list.map(s => s?.id).filter((x): x is string => typeof x === 'string'));
    } catch { setIds([]); }
  }, []);
  useEffect(() => {
    if (!open) return;
    ids.slice(0, 10).forEach(id => {
      opportunitiesApi.getById(id).then(o => setTitles(t => ({ ...t, [id]: o.title }))).catch(() => {});
    });
  }, [open, ids]);
  if (ids.length === 0) return null;
  return (
    <div className="rounded-xl bg-[#123B2A] px-3.5 py-3 text-[15px] text-[#6EE7B7]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">{ids.length === 1 ? '1 marché enregistré' : `${ids.length} marchés enregistrés`} sur ce téléphone</span>
        {ids.length === 1
          ? <Link to={`/opportunites/${ids[0]}`} className="flex min-h-[48px] items-center font-bold underline">Le retrouver</Link>
          : <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="flex min-h-[48px] items-center font-bold underline">{open ? 'Masquer' : 'Les retrouver'}</button>}
      </div>
      {open && (
        <ul className="mt-1 flex flex-col gap-1">
          {ids.slice(0, 10).map(id => (
            <li key={id}><Link to={`/opportunites/${id}`} className="flex min-h-[48px] items-center underline">{titles[id] || 'Marché enregistré'}</Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SimpleSearch() {
  const navigate = useNavigate();
  const [metier, setMetier] = useState('');
  const [dept, setDept] = useState('FR');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (metier.trim()) p.set('q', metier.trim());
    if (dept !== 'FR') p.append('department', dept);
    p.set('status', 'all');
    navigate(`/recherche?${p.toString()}`);
  };
  const field = 'h-[52px] w-full rounded-xl border border-[#2B4468] bg-[#0A1628] px-3.5 text-[16px] text-[#F2F5F9]';
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="md-metier" className="text-[14px] font-semibold">Votre métier</label>
      <input id="md-metier" value={metier} onChange={e => setMetier(e.target.value)} placeholder="Ex. : nettoyage, peinture, sécurité, architecte…" className={`${field} placeholder:text-[#7F93AE]`} />
      <label htmlFor="md-zone" className="text-[14px] font-semibold">Votre zone</label>
      <select id="md-zone" value={dept} onChange={e => setDept(e.target.value)} className={field}>
        <option value="FR">Toute la France</option>
        {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code} – {d.name}</option>)}
      </select>
      <button type="submit" className="min-h-[54px] w-full rounded-[14px] bg-[#C2410C] px-4 py-2 text-[17px] font-extrabold text-white">Rechercher des marchés</button>
      <p className="text-center text-[13px] text-[#FFE9DC]">Indiquez ensuite votre entreprise (nom ou SIRET) pour voir le pourcentage de chaque marché</p>
    </form>
  );
}

function Faq() {
  const items: [string, string][] = [
    ['Qu’est-ce qui est gratuit ?', 'La recherche, le pourcentage par marché, le premier échange de 30 minutes et votre dossier prérempli. L’accompagnement à la candidature (mémoire technique, formulaires, dépôt) est sur devis, présenté lors de cet échange. Vous décidez ensuite.'],
    ['Je ne connais pas les marchés publics. C’est pour moi ?', 'Oui. La plupart des entreprises que nous accompagnons répondent pour la première fois. Nous expliquons chaque étape et nous préparons les pièces avec vous.'],
    ['Que fait Marchés Direct à ma place ?', 'La recherche des marchés, le pourcentage de correspondance, le dossier prérempli et, si vous le souhaitez, les formulaires de candidature, le mémoire technique et le dépôt. Vous fournissez vos références et vos pièces, vous validez.'],
    ['Mes informations restent-elles confidentielles ?', 'Oui. Vos coordonnées servent à préparer votre dossier et à vous appeler au sujet de vos marchés. Vous pouvez demander à ne plus être appelé à tout moment.'],
  ];
  return (
    <Block>
      <h2 className="text-[19px] font-bold">Vos questions</h2>
      {items.map(([q, a]) => (
        <details key={q} className="group rounded-2xl border border-[#22385A] bg-[#12233A]">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[16px] font-bold [&::-webkit-details-marker]:hidden">
            {q}<span className="text-[22px] font-semibold text-[#FB923C] group-open:hidden">+</span><span className="hidden text-[22px] font-semibold text-[#FB923C] group-open:inline">–</span>
          </summary>
          <p className="px-4 pb-4 text-[15px] text-[#D6E0EC]">{a}</p>
        </details>
      ))}
    </Block>
  );
}

// 1.8 : la carte ne se charge (code et données) qu'à l'approche du bas de page, jamais avant le premier écran.
function DeferredMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [geoTab, setGeoTab] = useState<'regions' | 'departments' | 'cities'>('departments');
  const [regions, setRegions] = useState<{ code: string; nom: string }[]>([]);
  const [depts, setDepts] = useState<{ code: string; nom: string }[]>([]);
  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    if (!('IntersectionObserver' in window)) { setShow(true); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setShow(true); io.disconnect(); } }, { rootMargin: '300px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [show]);
  return (
    <div ref={ref} className="-mx-4 min-h-[180px]">
      {show && (
        <Suspense fallback={<p className="px-4 text-[15px] text-[#B4C1D3]">Chargement de la carte…</p>}>
          <GeographicSection tab={geoTab} setTab={setGeoTab} selectedRegions={regions} setSelectedRegions={setRegions} selectedDepts={depts} setSelectedDepts={setDepts} />
        </Suspense>
      )}
    </div>
  );
}

export default function HomePage() {
  const [mode, setMode] = useState<'company' | 'simple'>('company');
  const [callbackOpen, setCallbackOpen] = useState(false);
  const companyRef = useRef<CompanySearchHandle>(null);
  const hasTeam = !!ELENA.photo;

  const focusCompany = () => {
    setMode('company');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => companyRef.current?.focus(), 300);
  };
  const tabCls = (on: boolean) => `min-h-[44px] flex-1 whitespace-nowrap rounded-[9px] px-2 text-[14px] font-bold ${on ? 'bg-[#3A2312] text-[#FB923C]' : 'text-[#B4C1D3]'}`;

  return (
    <div className="page-fade-in">
      <PageMeta
        title="Marchés Direct — Les marchés faits pour votre entreprise"
        description="Indiquez le nom de votre entreprise ou son SIRET : nous trouvons les marchés publics et privés qui vous correspondent, et nous vous accompagnons jusqu’au dépôt."
      />
      <main className="mx-auto flex w-full max-w-[560px] flex-col gap-8 bg-[#0A1628] px-4 pb-16 pt-4 text-[#F2F5F9]" style={{ fontFamily: '"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif' }}>
        <Block>
          <Eyebrow>Artisans, TPE et PME · tous métiers</Eyebrow>
          <h1 className="text-[25px] font-extrabold leading-tight">Les marchés faits pour votre entreprise, et une équipe pour y répondre.</h1>
          <p className="text-[14px] text-[#B4C1D3]">Indiquez le nom de votre entreprise ou son SIRET : nous trouvons les marchés publics et privés qui vous correspondent, et nous vous accompagnons jusqu’au dépôt.</p>
          <div className="flex flex-wrap gap-2 text-[13px] font-bold text-[#6EE7B7]">
            <span className="rounded-full bg-[#123B2A] px-3 py-1.5">✓ Recherche et dossier prérempli gratuits</span>
            <span className="rounded-full bg-[#123B2A] px-3 py-1.5">✓ Sans inscription</span>
          </div>
          <p className="text-[13px] text-[#B4C1D3]">Accompagnement à la candidature sur devis.</p>
        </Block>

        <section className="flex flex-col gap-4 rounded-[18px] border border-[#22385A] bg-[#12233A] p-[18px]">
          <div role="tablist" aria-label="Mode de recherche" className="flex gap-1.5 rounded-xl border border-[#22385A] bg-[#0A1628] p-1">
            <button type="button" role="tab" aria-selected={mode === 'company'} onClick={() => setMode('company')} className={tabCls(mode === 'company')}>Par entreprise</button>
            <button type="button" role="tab" aria-selected={mode === 'simple'} onClick={() => setMode('simple')} className={tabCls(mode === 'simple')}>Recherche simple</button>
          </div>
          <div hidden={mode !== 'company'}><CompanySearchForm ref={companyRef} /></div>
          {mode === 'simple' && <SimpleSearch />}
          <SavedBanner />
          <div className="flex items-start gap-3">
            <ElenaAvatar />
            <div>
              <h3 className="text-[15px] font-bold">{ELENA.name} <span className="font-medium text-[#B4C1D3]">· {ELENA.role}</span></h3>
              <p className="text-[15px] text-[#B4C1D3]">« Une question avant de commencer ? Je vous rappelle, de 9 h à 18 h. »{' '}
                <Link to="/question" className="inline-flex min-h-[48px] items-center font-bold text-[#FB923C] underline">Poser ma question</Link>
              </p>
            </div>
          </div>
        </section>

        <OpenCounter />
        <p className="text-center text-[15px] text-[#B4C1D3]">Tous métiers : nettoyage, électricité, peinture, sécurité, architecture, énergie, maintenance, espaces verts, informatique… Marchés publics issus des publications officielles (BOAMP, JOUE) et marchés privés de nos partenaires, mis à jour chaque jour.</p>

        <Block>
          <Eyebrow>Comment ça marche</Eyebrow>
          <h2 className="text-[21px] font-bold">Trois étapes, en quelques minutes</h2>
          <ol className="flex flex-col gap-3 rounded-2xl border border-[#22385A] bg-[#0F1F35] p-4">
            {[
              ['Indiquez votre entreprise', 'Son nom ou son SIRET : nous l’identifions dans les registres officiels.'],
              ['Comparez vos marchés', 'Chaque marché affiche son pourcentage de correspondance avec votre entreprise, analysé sur six critères.'],
              ['Obtenez votre dossier prérempli', 'À votre nom, prêt tout de suite. Puis notre équipe vous rappelle pour préparer la suite avec vous.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <b className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#C2410C] text-[15px] font-extrabold text-white">{i + 1}</b>
                <div><h3 className="text-[16px] font-bold">{t}</h3><p className="text-[15px] text-[#B4C1D3]">{d}</p></div>
              </li>
            ))}
          </ol>
        </Block>

        <Block>
          <Eyebrow>Le moteur de correspondance</Eyebrow>
          <h2 className="text-[21px] font-bold">Six critères analysés sur chaque marché</h2>
          <p className="text-[15px] text-[#B4C1D3]">Ce que demande l’acheteur, face à ce que nous savons de votre entreprise.</p>
          <div className="grid grid-cols-2 gap-2">
            {[['Activité', 'Vos métiers face aux prestations demandées.'], ['Zone', 'Le lieu d’exécution face à votre secteur.'], ['Calendrier', 'Date limite, démarrage, durée.'], ['Moyens', 'Équipe et matériel nécessaires.'], ['Références', 'Chantiers similaires à présenter.'], ['Qualifications', 'Certifications, assurances, labels exigés.']].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-[#22385A] bg-[#12233A] p-3"><h3 className="text-[15px] font-bold">{t}</h3><p className="text-[14px] text-[#B4C1D3]">{d}</p></div>
            ))}
          </div>
        </Block>

        <Block>
          <Eyebrow>Ce que nous faisons avec vous</Eyebrow>
          <h2 className="text-[21px] font-bold">Vous n’êtes pas seul face au dossier</h2>
          <div className="flex flex-col gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-4 text-[14px] text-[#D6E0EC]">
            {[
              ['Gratuit :', ' la recherche, le pourcentage par marché et votre dossier prérempli à votre nom.'],
              ['Un premier échange offert de 30 minutes', ' pour faire le point sur le marché et sur votre entreprise.'],
              ['Si vous le souhaitez, nous préparons la candidature avec vous :', ' formulaires, mémoire technique, dépôt. Sur devis, après l’échange.'],
            ].map(([b, r]) => (
              <div key={b} className="flex gap-2"><span className="font-bold text-[#6EE7B7]" aria-hidden>✓</span><span><strong>{b}</strong>{r}</span></div>
            ))}
          </div>
        </Block>

        {hasTeam && (
          <Block>
            <Eyebrow>Notre équipe</Eyebrow>
            <h2 className="text-[21px] font-bold">De vraies personnes, du premier appel au dépôt</h2>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-3"><ElenaAvatar size={64} /><div><h3 className="text-[16px] font-bold">{ELENA.name}</h3><p className="text-[15px] text-[#B4C1D3]">{ELENA.role}, votre premier contact. Elle vous rappelle, répond à vos questions et vous oriente vers la bonne personne.</p></div></div>
              {TEAM.map(m => (
                <div key={m.name} className="flex gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-3"><img src={m.photo} alt={m.name} width={64} height={64} loading="lazy" className="h-16 w-16 shrink-0 rounded-full object-cover" /><div><h3 className="text-[16px] font-bold">{m.name}</h3><p className="text-[15px] text-[#B4C1D3]">{m.role}. {m.bio}</p></div></div>
              ))}
            </div>
          </Block>
        )}

        {VIDEO_TESTIMONIALS.length > 0 && (
          <Block>
            <Eyebrow>Leur expérience, avec leurs mots</Eyebrow>
            <h2 className="text-[21px] font-bold">Des entrepreneurs racontent leur candidature</h2>
            {VIDEO_TESTIMONIALS.map(v => (
              <figure key={v.src} className="flex flex-col gap-2">
                <video controls preload="none" playsInline poster={v.poster} src={v.src} className="w-full rounded-2xl bg-[#12233A]" />
                <figcaption className="text-[15px]"><span className="rounded-full bg-[#1E3352] px-2.5 py-1 text-[13px] font-semibold text-[#D6E0EC]">{v.trade}</span><strong className="mt-1 block text-[17px]">{v.result}</strong><span className="text-[#B4C1D3]">{v.who} · {v.duration}{v.subtitled ? ' · sous-titré' : ''}</span></figcaption>
              </figure>
            ))}
          </Block>
        )}

        <Faq />

        <Block>
          <Eyebrow>Vous préférez regarder par département ?</Eyebrow>
          <h2 className="text-[19px] font-bold">Explorer la carte des marchés</h2>
          <DeferredMap />
        </Block>

        <section className="flex flex-col items-center gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-5 text-center">
          <h2 className="text-[21px] font-bold">Voyez les marchés qui vous correspondent</h2>
          <button type="button" onClick={focusCompany} className="min-h-[54px] w-full rounded-[14px] bg-[#C2410C] px-4 py-2 text-[17px] font-extrabold text-white">Indiquer mon entreprise</button>
          <button type="button" onClick={() => setCallbackOpen(true)} className="min-h-[48px] text-[15px] font-bold text-[#FB923C] underline">Vous préférez qu’on vous appelle ?</button>
        </section>
      </main>
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}
