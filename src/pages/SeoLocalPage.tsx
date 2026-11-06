import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronRight, MapPin, Search } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { seoV2Api } from '@/lib/apiClient';
import { localGuides } from '@/content/guides/catalog';
import { guidePath } from '@/content/guideModel';
import { trackVisitorEvent } from '@/lib/visitorTracking';
import { seoTitle, seoH1, seoDescription, seoIntro, seoFaq, seoBreadcrumb, seoSearchPath, seoSearchLabel, seoItemLine, seoItemTitle, seoSections, seoPagePath, seoDate, zonePath, SEO_LABEL, type SeoV2Page, type SeoItem } from '@/lib/seoLocalCopy';

// Pages locales SEO (5 nov., mandat référencement) : mêmes textes que le pré-rendu serveur (src/lib/seoLocalCopy.ts),
// alimentés par /api/seo/v2/page. Adresse canonique unique (minuscules, sans accents) : toute autre écriture est
// remplacée sans recharger. Une zone sans annonce ouverte reste consultable, avec des alternatives, en noindex.
const BASES: Record<string, string> = { public_procurement: 'marches-publics', tender: 'appels-doffres', subcontracting: 'sous-traitance' };

function Item({ i }: { i: SeoItem }) {
  return (
    <li className="rounded-[14px] border border-[#22385A] bg-[#12233A] p-3">
      <Link to={i.path} className="block text-[15px] font-bold leading-snug text-white hover:text-[#FDBA74]">{seoItemTitle(i)}</Link>
      <p className="mt-1 text-[12.5px] text-[#B4C1D3]">{seoItemLine(i)}</p>
    </li>
  );
}

export default function SeoLocalPage({ journey }: { journey: 'public_procurement' | 'tender' | 'subcontracting' }) {
  const { city, trade, department } = useParams<{ city?: string; trade?: string; department?: string }>();
  const navigate = useNavigate(); const location = useLocation(); const [sp] = useSearchParams();
  const pageParam = sp.get('page') || undefined;
  const [page, setPage] = useState<SeoV2Page | null | undefined>(undefined);
  const [choices, setChoices] = useState<{ name: string; choices: { department: string; departmentName: string; path: string }[] } | null>(null);
  const base = BASES[journey];

  useEffect(() => {
    let live = true; setPage(undefined); setChoices(null);
    seoV2Api.page({ base, city, trade, department, page: pageParam })
      .then(r => {
        if (!live) return;
        if ('redirect' in r) { navigate(r.redirect, { replace: true }); return; }
        if ('choices' in r) { setChoices(r); setPage(null); return; }
        if (r.canonicalPath !== location.pathname) { navigate(seoPagePath(r, r.page), { replace: true }); return; }
        setPage(r);
        trackVisitorEvent('view_seo_page', seoH1(r), undefined, { journey, city: r.zone.type === 'city' ? r.zone.name : undefined, department: r.zone.department || undefined, trade: r.trade?.name });
      })
      .catch(() => { if (live) setPage(null); });
    return () => { live = false; };
  }, [base, city, trade, department, pageParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const shell = 'mx-auto w-full max-w-[720px] px-4 pb-24 pt-4 text-[#F2F5F9]';
  if (page === undefined) return <main className={shell} aria-busy="true"><div className="h-8 w-2/3 animate-pulse rounded bg-[#12233A]" /><div className="mt-4 flex flex-col gap-2">{[0, 1, 2].map(k => <div key={k} className="h-20 animate-pulse rounded-[14px] bg-[#12233A]" />)}</div></main>;
  if (choices) return (
    <main className={shell}>
      <PageMeta title={`${SEO_LABEL[journey]} — ${choices.name} : plusieurs communes | Marchés Direct`} description={`Plusieurs communes s’appellent ${choices.name}.`} noindex />
      <h1 className="text-[22px] font-extrabold">{choices.name} : plusieurs communes portent ce nom</h1>
      <p className="mt-2 text-[14px] text-[#D6E0EC]">Choisissez le département :</p>
      <ul className="mt-3 flex flex-col gap-2">{choices.choices.map(c => <li key={c.path}><Link to={`${c.path}${trade ? `/${trade}` : ''}`} className="font-bold text-[#FB923C] underline">{choices.name} ({c.departmentName}, {c.department})</Link></li>)}</ul>
    </main>);
  if (page === null) return (
    <main className={shell}>
      <PageMeta title="Page introuvable | Marchés Direct" description="Cette page n’existe pas." noindex />
      <h1 className="text-[22px] font-extrabold">Page introuvable</h1>
      <Link to={`/${base}`} className="mt-3 inline-block font-bold text-[#FB923C] underline">Voir les {SEO_LABEL[journey].toLowerCase()}</Link>
    </main>);

  const p = page; const crumbs = seoBreadcrumb(p); const faq = seoFaq(p);
  const chip = 'rounded-full border border-[#2B4468] px-3 py-1.5 text-[13px] font-semibold text-[#D6E0EC] hover:border-[#FB923C]';
  return (
    <main className={shell}>
      <PageMeta title={seoTitle(p)} description={seoDescription(p)} noindex={!p.indexable} canonicalPath={seoPagePath(p, p.page)} />
      <nav aria-label="Fil d'Ariane" className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-[#B4C1D3]">
        {crumbs.map((c, k) => (<span key={c.path} className="inline-flex items-center gap-1">{k > 0 && <ChevronRight size={11} aria-hidden />}
          {k === crumbs.length - 1 ? <span className="text-white">{c.name}</span> : <Link to={c.path} className="hover:text-[#FB923C]">{c.name}</Link>}</span>))}
      </nav>
      <span className="inline-flex items-center gap-1 text-[12px] font-extrabold uppercase tracking-[.06em] text-[#FB923C]"><MapPin size={12} aria-hidden />{p.zone.type === 'city' ? p.zone.name : `${p.zone.name} (${p.zone.department})`}</span>
      <h1 className="mt-1 text-[24px] font-extrabold leading-tight md:text-[30px]">{seoH1(p)}</h1>
      <div className="mt-2 flex flex-col gap-1.5 text-[14.5px] leading-relaxed text-[#D6E0EC]">{seoIntro(p).map((t, k) => <p key={k}>{t}</p>)}</div>

      {seoSections(p).map(sec => (<section key={sec.key} className="mt-6"><h2 className="mb-1 text-[17px] font-extrabold">{sec.title}</h2>
        {sec.note && <p className="mb-2 text-[12.5px] text-[#B4C1D3]">{sec.note}</p>}
        <ul className="flex flex-col gap-2">{sec.items.map(i => <Item key={i.id} i={i} />)}</ul>
        {sec.key === 'main' && p.pages > 1 && (<nav aria-label="Pages" className="mt-3 flex flex-wrap gap-2 text-[13px]">
          {Array.from({ length: p.pages }, (_, k) => k + 1).map(n => n === p.page ? <span key={n} className="rounded-full bg-[#FB923C] px-3 py-1 font-bold text-[#0A1628]">{n}</span>
            : <Link key={n} to={seoPagePath(p, n)} className="rounded-full border border-[#2B4468] px-3 py-1 font-semibold">{n}</Link>)}
        </nav>)}
      </section>))}
      {!p.count && !p.buyerCount && (<div className="mt-5 rounded-[14px] border border-[#22385A] bg-[#12233A] p-3 text-[14px] text-[#D6E0EC]">
        Rien d’ouvert ici aujourd’hui. <Link to="/question" className="font-bold text-[#FB923C] underline">Être prévenu par Elena</Link> dès qu’une annonce paraît.
      </div>)}
      <Link to={seoSearchPath(p)} className="mt-4 inline-flex items-center gap-2 font-bold text-[#FB923C] underline"><Search size={15} aria-hidden />{seoSearchLabel(p)}</Link>
      {p.trades.filter(t => t.slug !== p.trade?.slug).length > 0 && (<section className="mt-6"><h2 className="mb-2 text-[17px] font-extrabold">Par métier</h2>
        <div className="flex flex-wrap gap-2">{p.trades.filter(t => t.slug !== p.trade?.slug).map(t => <Link key={t.slug} to={zonePath(p, t.slug)} className={chip}>{t.name} ({t.count})</Link>)}</div></section>)}
      {p.cities.length > 0 && (<section className="mt-6"><h2 className="mb-2 text-[17px] font-extrabold">Autres villes du département</h2>
        <div className="flex flex-wrap gap-2">{p.cities.map(c => <Link key={c.slug} to={`/${p.base}/${c.slug}${p.trade ? `/${p.trade.slug}` : ''}`} className={chip}>{c.name} ({c.count})</Link>)}</div></section>)}
      {p.otherTypes.some(o => o.count > 0) && (<section className="mt-6"><h2 className="mb-2 text-[17px] font-extrabold">Autres types d’opportunités</h2>
        <div className="flex flex-wrap gap-2">{p.otherTypes.filter(o => o.count > 0).map(o => <Link key={o.base} to={zonePath({ ...p, base: o.base }, p.trade?.slug)} className={chip}>{SEO_LABEL[o.journey]} ({o.count})</Link>)}</div></section>)}
      {p.buyers.some(b => b.path) && (<section className="mt-6"><h2 className="mb-2 text-[17px] font-extrabold">{p.journey === 'public_procurement' ? 'Acheteurs publics' : 'Donneurs d’ordre'} les plus actifs</h2>
        <div className="flex flex-wrap gap-2">{p.buyers.filter(b => b.path).map(b => <Link key={b.path!} to={b.path!} className={chip}>{b.name} ({b.count})</Link>)}</div></section>)}
      <section className="mt-6"><h2 className="mb-2 text-[17px] font-extrabold">Guides pour répondre</h2>
        <ul className="flex flex-col gap-1.5 text-[14px]">{localGuides(journey).map(g => <li key={g.slug}><Link to={guidePath(g.slug)} className="font-semibold text-[#FB923C] underline">{g.title}</Link></li>)}</ul></section>
      <section className="mt-6"><h2 className="mb-2 text-[17px] font-extrabold">Questions fréquentes</h2>
        <div className="flex flex-col gap-2">{faq.map(f => <details key={f.q} className="rounded-[14px] border border-[#22385A] bg-[#12233A] p-3"><summary className="cursor-pointer text-[14px] font-bold">{f.q}</summary><p className="mt-2 text-[13.5px] leading-relaxed text-[#D6E0EC]">{f.a}</p></details>)}</div></section>
      <p className="mt-6 text-[12px] text-[#B4C1D3]">Données issues des avis publiés par les acheteurs, mises à jour le {seoDate(p.generatedAt)}. Marchés Direct est une plateforme indépendante.</p>
    </main>
  );
}
