import { useState } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { FranceMap } from '@/components/FranceMap';
import { frenchRegions, frenchDepartments, frenchCities } from '@/data/mockData';

type Tab = 'regions' | 'departments' | 'cities';

export default function ZonesPage() {
  const [tab, setTab] = useState<Tab>('regions');

  const data = {
    regions: frenchRegions,
    departments: frenchDepartments,
    cities: frenchCities,
  };

  const labels: Record<Tab, string> = {
    regions: 'Régions',
    departments: 'Départements',
    cities: 'Villes',
  };

  return (
    <div className="page-fade-in max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Zones géographiques</span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-2">Des opportunités partout en France</h1>
        <p className="text-[#B9BBC8] text-sm max-w-2xl">Explorez les marchés disponibles par région, département ou ville.</p>
      </div>

      <div className="flex flex-col md:flex-row md:gap-8 md:items-start">
        {/* Map */}
        <div className="mb-6 md:mb-0 md:w-5/12 shrink-0">
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-4 md:p-6 sticky top-20">
            <FranceMap className="w-full max-w-sm mx-auto" />
            <p className="text-xs text-[#B9BBC8] text-center mt-3">Cliquez sur une zone pour explorer</p>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-[#061D32] border border-[#17334D] rounded-xl p-1 w-fit">
            {(Object.keys(labels) as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-orange/10 text-orange border border-orange/30'
                    : 'text-[#B9BBC8] hover:text-white'
                }`}
              >
                {labels[t]}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#B9BBC8] mb-3">
            <span className="text-white font-semibold">{data[tab].length}</span> {labels[tab].toLowerCase()} disponibles
          </div>

          <div className="space-y-2">
            {data[tab].map((item, i) => (
              <button
                key={i}
                className="w-full flex items-center justify-between p-3.5 bg-[#061D32] border border-[#17334D] rounded-xl hover:border-orange/40 group transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MapPin size={13} className="text-orange shrink-0" />
                  <span className="text-sm text-white font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[#B9BBC8]">{item.count.toLocaleString('fr-FR')} opp.</span>
                  <ChevronRight size={13} className="text-orange group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
