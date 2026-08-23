import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { mockArticles } from '@/data/mockData';
import { useLang } from '@/contexts/LangContext';

export default function ActualitesPage() {
  const { t } = useLang();
  const [activeCat, setActiveCat] = useState('Tous');

  const CATS = [t('newsCat1'), t('newsCat2'), t('newsCat3'), t('newsCat4')];

  const filtered = activeCat === 'Tous' ? mockArticles : mockArticles.filter(a => a.category === activeCat);

  const CAT_COLORS: Record<string, string> = {
    [t('newsCat2')]: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    [t('newsCat3')]: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    [t('newsCat4')]: 'text-green-400 bg-green-400/10 border-green-400/20',
  };

  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <div className="mb-8 md:mb-10">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">{t('newsPageTag')}</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-2">{t('newsPageTitle')}</h1>
        <p className="text-[#B9BBC8] text-sm">{t('newsPageSub')}</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-7">
        {CATS.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeCat === cat
                ? 'bg-orange text-white'
                : 'bg-[#061D32] border border-[#17334D] text-[#B9BBC8] hover:text-white hover:border-orange/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(article => (
          <div
            key={article.id}
            className="flex flex-col bg-[#061D32] border border-[#17334D] rounded-2xl p-5 hover:border-orange/40 group transition-all cursor-pointer"
          >
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border w-fit mb-3 ${CAT_COLORS[article.category] || 'text-orange bg-orange/10 border-orange/20'}`}>
              {article.category}
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-orange transition-colors mb-2 flex-1 leading-snug">
              {article.title}
            </h3>
            <p className="text-xs text-[#B9BBC8] leading-relaxed mb-5 line-clamp-3">{article.description}</p>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#17334D]">
              <span className="text-xs text-[#B9BBC8]">{article.date}</span>
              <ArrowRight size={14} className="text-orange group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}