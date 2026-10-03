import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { mockArticles } from '@/data/mockData';
import { articleBodies } from '@/data/articleBodies';
import PageMeta from '@/components/common/PageMeta';
import { useLang } from '@/contexts/LangContext';

const CAT_COLORS: Record<string, string> = {
  'Réglementation': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'Tendances': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  'Opportunités': 'text-green-400 bg-green-400/10 border-green-400/20',
};

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLang();
  const article = mockArticles.find(a => a.id === id);
  const fr = lang === 'fr';

  if (!article) {
    return (
      <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-16 text-center">
        <PageMeta title={`${fr ? 'Article introuvable' : 'Article not found'} | Marchés Direct`} description="" />
        <h1 className="text-2xl font-extrabold text-white mb-3">{fr ? 'Article introuvable' : 'Article not found'}</h1>
        <Link to="/actualites" className="text-orange text-sm hover:underline">
          {fr ? "← Retour aux actualités" : '← Back to news'}
        </Link>
      </div>
    );
  }

  const paragraphs = articleBodies[article.id] ?? [article.description];

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <PageMeta title={`${article.title} | Marchés Direct`} description={article.description} />
      <Link to="/actualites" className="inline-flex items-center gap-2 text-sm text-[#B9BBC8] hover:text-white transition-colors mb-8">
        <ArrowLeft size={14} /> {fr ? 'Retour aux actualités' : 'Back to news'}
      </Link>
      <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border w-fit mb-4 ${CAT_COLORS[article.category] || 'text-orange bg-orange/10 border-orange/20'}`}>
        {article.category}
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight">{article.title}</h1>
      <div className="flex items-center gap-2 text-xs text-[#B9BBC8] mb-8 pb-6 border-b border-[#17334D]">
        <Calendar size={13} /> {article.date}
      </div>
      <p className="text-base text-white/90 font-medium leading-relaxed mb-6">{article.description}</p>
      <div className="space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm md:text-[15px] text-[#B9BBC8] leading-relaxed">{p}</p>
        ))}
      </div>
    </div>
  );
}
