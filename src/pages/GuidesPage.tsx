import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { GUIDES, GUIDE_CATEGORIES, GUIDES_INTRO } from '@/content/guides';
import { frDate, guidePath, type Guide } from '@/content/guideModel';

// Le journal des marchés (7 nov.) : la page des guides présentée comme la une d'un journal (à la une, rubriques,
// articles datés), dans les couleurs du site. Même contenu que le pré-rendu serveur (kind=guides).
const FEATURED = 'repondre-marche-public-artisan';

function Meta({ g }: { g: Guide }) {
  return (
    <span className="mt-2 flex flex-wrap items-center gap-x-2 text-[12px] text-[#93A4BC]">
      <span>{frDate(g.updated)}</span><span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1"><Clock size={11} aria-hidden />{g.minutes} min</span>
    </span>
  );
}

function Card({ g }: { g: Guide }) {
  return (
    <Link to={guidePath(g.slug)} className="group flex h-full flex-col border-t-2 border-[#22385A] pt-3 transition-colors hover:border-[#FB923C]">
      <span className="text-[11px] font-extrabold uppercase tracking-[.08em] text-[#FB923C]">{g.category}</span>
      <span className="mt-1 text-[17px] font-extrabold leading-snug text-[#F2F5F9] group-hover:text-[#FDBA74]">{g.title}</span>
      <span className="mt-1.5 text-[13.5px] leading-relaxed text-[#B4C1D3]">{g.description}</span>
      <Meta g={g} />
    </Link>
  );
}

export default function GuidesPage() {
  const featured = GUIDES.find(g => g.slug === FEATURED) || GUIDES[0];
  const latest = GUIDES.filter(g => g.slug !== featured.slug).slice(0, 3);
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-24 pt-6 text-[#F2F5F9] md:px-6">
      <PageMeta title={GUIDES_INTRO.metaTitle} description={GUIDES_INTRO.description} canonicalPath="/guides" />

      <header className="border-b-2 border-[#F2F5F9]/80 pb-4">
        <p className="text-[12px] font-extrabold uppercase tracking-[.14em] text-[#FB923C]">Marchés Direct</p>
        <h1 className="mt-1 text-[30px] font-black leading-[1.05] tracking-tight md:text-[46px]">{GUIDES_INTRO.h1}</h1>
        <p className="mt-2 max-w-[760px] text-[15px] leading-relaxed text-[#D6E0EC]">{GUIDES_INTRO.text}</p>
        <nav aria-label="Rubriques" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-bold text-[#D6E0EC]">
          {GUIDE_CATEGORIES.filter(c => GUIDES.some(g => g.category === c)).map(c => <a key={c} href={`#${c.toLowerCase().replace(/[^a-z]+/g, '-')}`} className="hover:text-[#FB923C]">{c}</a>)}
          <Link to="/barometre-marches-publics" className="text-[#FB923C] hover:underline">Baromètre du jour</Link>
        </nav>
      </header>

      <section aria-label="À la une" className="mt-6 grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <Link to={guidePath(featured.slug)} className="group block rounded-[18px] border border-[#2B4468] bg-gradient-to-br from-[#16304F] to-[#0F2138] p-5 hover:border-[#FB923C] md:p-7">
          <span className="text-[11.5px] font-extrabold uppercase tracking-[.1em] text-[#FB923C]">À la une · {featured.category}</span>
          <span className="mt-2 block text-[24px] font-black leading-tight group-hover:text-[#FDBA74] md:text-[32px]">{featured.title}</span>
          <span className="mt-3 block text-[15px] leading-relaxed text-[#D6E0EC]">{featured.description}</span>
          <Meta g={featured} />
          <span className="mt-4 inline-block rounded-full bg-[#FB923C] px-4 py-2 text-[14px] font-bold text-[#0A1628]">Lire l’article</span>
        </Link>
        <div className="flex flex-col gap-5">
          <p className="text-[12px] font-extrabold uppercase tracking-[.1em] text-[#B4C1D3]">À lire aussi</p>
          {latest.map(g => <Card key={g.slug} g={g} />)}
        </div>
      </section>

      {GUIDE_CATEGORIES.map(cat => {
        const list = GUIDES.filter(g => g.category === cat);
        if (!list.length) return null;
        return (
          <section key={cat} id={cat.toLowerCase().replace(/[^a-z]+/g, '-')} className="mt-10 scroll-mt-20">
            <h2 className="border-b border-[#22385A] pb-2 text-[20px] font-black md:text-[24px]">{cat}</h2>
            <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{list.map(g => <li key={g.slug}><Card g={g} /></li>)}</ul>
          </section>
        );
      })}

      <aside className="mt-12 rounded-[18px] border border-[#FB923C]/40 bg-[#1A2B44] p-5 md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="text-[17px] font-extrabold">Les marchés ouverts pour votre entreprise</p>
          <p className="mt-1 text-[14px] text-[#D6E0EC]">Indiquez votre SIRET : nous trouvons les consultations qui correspondent à votre métier et à votre zone.</p>
        </div>
        <Link to="/" className="mt-3 inline-block shrink-0 rounded-full bg-[#FB923C] px-5 py-2.5 text-[14.5px] font-bold text-[#0A1628] md:mt-0">Trouver mes marchés</Link>
      </aside>
    </main>
  );
}
