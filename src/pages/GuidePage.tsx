import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Clock, ShieldCheck, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import PageMeta from '@/components/common/PageMeta';
import { GUIDES, guideBySlug } from '@/content/guides';
import { blockHtml, inline, frDate, guideJsonLd, guideMetaTitle, guidePath, GUIDES_BASE } from '@/content/guideModel';
import { trackVisitorEvent } from '@/lib/visitorTracking';

// Guide pratique (6 nov.) : même contenu que le pré-rendu serveur (src/content/guideModel.ts → guideBodyHtml).
const SITE = 'https://www.marchesdirect.fr';
const html = (s: string) => ({ __html: s });

export default function GuidePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const g = guideBySlug(slug);
  useEffect(() => { if (g) trackVisitorEvent('view_guide', g.title); }, [g]);

  if (!g) return (
    <main className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-6 text-[#F2F5F9]">
      <PageMeta title="Guide introuvable | Marchés Direct" description="Ce guide n’existe pas." noindex />
      <h1 className="text-[22px] font-extrabold">Guide introuvable</h1>
      <Link to={GUIDES_BASE} className="mt-3 inline-block font-bold text-[#FB923C] underline">Voir tous les guides</Link>
    </main>
  );
  const related = g.related.map(guideBySlug).filter(Boolean) as typeof GUIDES;

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-4 text-[#F2F5F9]">
      {/* 7 nov. : mise en page « article de journal » (rubrique, titre, chapeau, signature), dans les couleurs du site. */}
      <PageMeta title={guideMetaTitle(g)} description={g.description} canonicalPath={guidePath(g.slug)} />
      <Helmet>{guideJsonLd(g, SITE).map((j, k) => <script key={k} type="application/ld+json">{JSON.stringify(j)}</script>)}</Helmet>
      <nav aria-label="Fil d'Ariane" className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-[#B4C1D3]">
        <Link to="/" className="hover:text-[#FB923C]">Accueil</Link><ChevronRight size={11} aria-hidden />
        <Link to={GUIDES_BASE} className="hover:text-[#FB923C]">Le journal</Link><ChevronRight size={11} aria-hidden />
        <span className="text-white">{g.category}</span>
      </nav>
      <p className="text-[12px] font-extrabold uppercase tracking-[.12em] text-[#FB923C]">{g.category}</p>
      <h1 className="mt-1 text-[28px] font-black leading-[1.1] tracking-tight md:text-[40px]">{g.title}</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-[#E4EAF2] md:text-[18.5px]">{g.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-[#22385A] py-2.5 text-[12.5px] text-[#B4C1D3]">
        <span className="font-bold text-[#F2F5F9]">Par la rédaction de Marchés Direct</span>
        <span aria-hidden>·</span><span>{frDate(g.updated)}</span>
        <span aria-hidden>·</span><span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{g.minutes} min de lecture</span>
        <span className="inline-flex items-center gap-1"><ShieldCheck size={12} aria-hidden />Règles vérifiées le {frDate(g.checked)}</span>
      </div>

      <section className="mt-5 rounded-[14px] border border-[#2B4468] bg-[#12233A] p-4">
        <h2 className="text-[12px] font-extrabold uppercase tracking-[.1em] text-[#FDBA74]">L’essentiel</h2>
        <ul className="guide-prose mt-2">{g.summary.map((s, k) => <li key={k} dangerouslySetInnerHTML={html(inline(s))} />)}</ul>
      </section>

      <nav aria-label="Sommaire" className="mt-5">
        <h2 className="text-[15px] font-extrabold">Sommaire</h2>
        <ol className="mt-1 list-decimal pl-5 text-[14px] text-[#D6E0EC]">{g.sections.map(s => <li key={s.id}><a href={`#${s.id}`} className="hover:text-[#FB923C]">{s.h2}</a></li>)}</ol>
      </nav>

      {g.sections.map(s => (
        <section key={s.id} id={s.id} className="mt-7 scroll-mt-20">
          <h2 className="mb-2 text-[22px] font-black leading-snug">{s.h2}</h2>
          <div className="guide-prose" dangerouslySetInnerHTML={html(s.blocks.map(blockHtml).join(''))} />
        </section>
      ))}

      <div className="mt-8 rounded-[14px] border border-[#FB923C]/40 bg-[#1A2B44] p-4">
        <p className="text-[15px] font-bold">Prêt à passer à la pratique ?</p>
        <p className="mt-1 text-[13.5px] text-[#D6E0EC]">Indiquez votre SIRET : nous trouvons les consultations ouvertes qui correspondent à votre activité, et Elena peut vous accompagner jusqu’au dépôt.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link to="/" className="rounded-full bg-[#FB923C] px-4 py-2 text-[14px] font-bold text-[#0A1628]">Trouver mes marchés</Link>
          <Link to="/marches-publics" className="inline-flex items-center gap-1 rounded-full border border-[#2B4468] px-4 py-2 text-[14px] font-semibold"><Search size={14} aria-hidden />Marchés publics ouverts</Link>
        </div>
      </div>

      {g.faq.length > 0 && (<section className="mt-8"><h2 className="mb-2 text-[20px] font-extrabold">Questions fréquentes</h2>
        <div className="flex flex-col gap-2">{g.faq.map(f => <details key={f.q} className="rounded-[14px] border border-[#22385A] bg-[#12233A] p-3"><summary className="cursor-pointer text-[14px] font-bold">{f.q}</summary><div className="guide-prose mt-2" dangerouslySetInnerHTML={html(`<p>${inline(f.a)}</p>`)} /></details>)}</div></section>)}

      <section className="mt-8 border-t border-[#22385A] pt-3"><h2 className="mb-1 text-[12px] font-extrabold uppercase tracking-[.1em] text-[#93A4BC]">Sources</h2>
        <ul className="list-disc pl-5 text-[12.5px] text-[#93A4BC]">{g.sources.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noopener" className="underline hover:text-[#FB923C]">{s.label}</a></li>)}</ul></section>

      {related.length > 0 && (<section className="mt-8"><h2 className="mb-3 text-[12px] font-extrabold uppercase tracking-[.1em] text-[#B4C1D3]">À lire aussi dans le journal</h2>
        <ul className="grid gap-5 sm:grid-cols-2">{related.map(r => <li key={r.slug}><Link to={guidePath(r.slug)} className="group block border-t-2 border-[#22385A] pt-2 hover:border-[#FB923C]"><span className="text-[11px] font-extrabold uppercase tracking-[.08em] text-[#FB923C]">{r.category}</span><span className="mt-1 block text-[16px] font-extrabold leading-snug group-hover:text-[#FDBA74]">{r.title}</span><span className="mt-1 block text-[12px] text-[#93A4BC]">{r.minutes} min de lecture</span></Link></li>)}</ul></section>)}

      <p className="mt-8 text-[12px] text-[#B4C1D3]">Ce guide est une information générale, pas un conseil juridique : en cas de doute, le règlement de la consultation fait foi. Marchés Direct est une plateforme indépendante.</p>
    </main>
  );
}
