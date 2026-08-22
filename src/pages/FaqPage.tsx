import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { faqItems } from '@/data/mockData';

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <div className="text-center mb-10 md:mb-14">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Questions fréquentes</span>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white mt-2 mb-3">FAQ</h1>
        <p className="text-[#B9BBC8] text-sm md:text-base max-w-xl mx-auto">
          Retrouvez les réponses aux questions les plus fréquentes sur Marchés Direct.
        </p>
      </div>

      <div className="space-y-3">
        {faqItems.map((item, i) => (
          <div
            key={i}
            className={`bg-[#061D32] border rounded-xl overflow-hidden transition-colors ${open === i ? 'border-orange/40' : 'border-[#17334D] hover:border-orange/20'}`}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left gap-4"
            >
              <span className={`text-sm font-semibold ${open === i ? 'text-orange' : 'text-white'}`}>{item.q}</span>
              {open === i
                ? <ChevronUp size={16} className="text-orange shrink-0" />
                : <ChevronDown size={16} className="text-[#B9BBC8] shrink-0" />
              }
            </button>
            {open === i && (
              <div className="px-5 pb-5 border-t border-[#17334D]">
                <p className="text-sm text-[#B9BBC8] leading-relaxed pt-4">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
