import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { GUIDES, GUIDE_CATEGORIES, GUIDES_INTRO } from '@/content/guides';
import { guidePath } from '@/content/guideModel';

// Sommaire des guides (6 nov.). Même contenu que le pré-rendu serveur (kind=guides).
export default function GuidesPage() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pb-24 pt-6 text-[#F2F5F9]">
      <PageMeta title={GUIDES_INTRO.metaTitle} description={GUIDES_INTRO.description} canonicalPath="/guides" />
      <h1 className="text-[26px] font-extrabold leading-tight md:text-[32px]">{GUIDES_INTRO.h1}</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-[#D6E0EC]">{GUIDES_INTRO.text}</p>
      {GUIDE_CATEGORIES.map(cat => {
        const list = GUIDES.filter(g => g.category === cat);
        if (!list.length) return null;
        return (<section key={cat} className="mt-7"><h2 className="mb-2 text-[18px] font-extrabold">{cat}</h2>
          <ul className="flex flex-col gap-2">{list.map(g => (
            <li key={g.slug}><Link to={guidePath(g.slug)} className="block rounded-[14px] border border-[#22385A] bg-[#12233A] p-3 hover:border-[#FB923C]">
              <span className="block text-[15px] font-bold leading-snug">{g.title}</span>
              <span className="mt-1 block text-[13px] text-[#B4C1D3]">{g.description}</span>
            </Link></li>))}</ul></section>);
      })}
    </main>
  );
}
