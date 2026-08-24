import { useState } from 'react';
import { Filter, Search, Plus, X, Pencil, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';

const TENDERS = [
  { id: 'T-001', title: 'Entretien des espaces verts départementaux', buyer: 'Conseil départemental du Gard', budget: '180 000 €', deadline: '24 août 2026', status: 'active' },
  { id: 'T-002', title: 'Réhabilitation voiries', buyer: 'Ville de Nîmes', budget: '250 000 €', deadline: '15 sept. 2026', status: 'pending' },
  { id: 'T-003', title: 'Fourniture de mobilier urbain', buyer: 'Marseille Provence', budget: '120 000 €', deadline: '22 sept. 2026', status: 'closed' },
  { id: 'T-004', title: 'Maintenance électrique', buyer: 'Université Le Havre', budget: '90 000 €', deadline: '10 sept. 2026', status: 'active' },
];

export default function AdminTenders() {
  const { t } = useLang();
  
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [tenders, setTenders] = useState(TENDERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ title: '', buyer: '', budget: '', deadline: '' });

  const filtered = tenders.filter(item => {
    if (query && !item.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (status !== 'all' && item.status !== status) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingTender(null);
    setFormData({ title: '', buyer: '', budget: '', deadline: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (tender: any) => {
    setEditingTender(tender);
    setFormData({ title: tender.title, buyer: tender.buyer, budget: tender.budget, deadline: tender.deadline });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTender) {
      setTenders(tenders.map(item => item.id === editingTender.id ? { ...item, ...formData } : item));
      showToast('Tender updated successfully');
    } else {
      setTenders([{ id: `T-00${tenders.length + 1}`, ...formData, status: 'pending' }, ...tenders]);
      showToast('Tender created successfully');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tender?')) {
      setTenders(tenders.filter(item => item.id !== id));
      showToast('Tender deleted');
    }
  };

  const handleView = (tender: any) => {
    showToast(`Viewing: ${tender.title}`);
  };

  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    pending: 'text-orange bg-orange/10',
    closed: 'text-[#B9BBC8] bg-[#031B30]',
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{t('adminTenders')}</h1>
          <p className="text-sm text-[#B9BBC8]">{t('adminManageTenders')}</p>
        </div>
        <button onClick={openAddModal} className="bg-orange text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-orange/90 transition-colors flex items-center justify-center gap-2">
          <Plus size={16} /> {t('adminAddTender')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('adminSearchTenders')} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange">
          <option value="all">{t('adminAllStatuses')}</option>
          <option value="active">{t('adminActive')}</option>
          <option value="pending">{t('adminPending')}</option>
          <option value="closed">{t('adminClosed')}</option>
        </select>
        <button onClick={() => showToast('Filters applied')} className="flex items-center justify-center gap-2 bg-[#061D32] border border-[#17334D] text-[#B9BBC8] px-4 py-2.5 rounded-xl hover:text-white transition-colors text-sm">
          <Filter size={16} /> {t('appelsFilters')}
        </button>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#17334D]">
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">ID</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminTitle')}</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminBuyer')}</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminBudget')}</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminDeadline')}</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminStatus')}</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr 
                  key={item.id} 
                  className="border-b border-[#17334D] hover:bg-white/5 transition-colors relative cursor-pointer"
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <td className="px-4 py-3 text-xs text-[#B9BBC8]">{item.id}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">{item.title}</td>
                  <td className="px-4 py-3 text-sm text-[#B9BBC8]">{item.buyer}</td>
                  <td className="px-4 py-3 text-sm text-white">{item.budget}</td>
                  <td className="px-4 py-3 text-sm text-[#B9BBC8]">{item.deadline}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[item.status]}`}>
                      {t(`adminStatus_${item.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {expandedId === item.id ? <ChevronUp size={16} className="text-orange" /> : <ChevronDown size={16} className="text-[#B9BBC8]" />}
                  </td>
                </tr>
              ))}
              {filtered.map(item => (
                expandedId === item.id && (
                  <tr key={`${item.id}-details`} className="bg-[#031B30]">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleView(item)} className="flex items-center gap-2 text-sm text-white bg-[#061D32] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors">
                          <Eye size={14} /> {t('adminView')}
                        </button>
                        <button onClick={() => openEditModal(item)} className="flex items-center gap-2 text-sm text-white bg-[#061D32] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors">
                          <Pencil size={14} /> {t('adminEdit')}
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="flex items-center gap-2 text-sm text-red-400 bg-[#061D32] border border-red-400/20 px-3 py-2 rounded-lg hover:border-red-400/50 transition-colors">
                          <Trash2 size={14} /> {t('adminDelete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm text-[#B9BBC8]">{t('adminNoResults')}</p>
          </div>
        )}
      </div>

      {/* MOBILE CARD VIEW - Accordion Style */}
      <div className="md:hidden space-y-3">
        {filtered.map(item => (
          <div key={item.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
            <div 
              className="flex items-start justify-between gap-2 cursor-pointer"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-[#B9BBC8] mb-1">{item.id}</div>
                <h3 className="text-sm font-bold text-white leading-snug">{item.title}</h3>
                <p className="text-xs text-[#B9BBC8] mt-0.5">{item.buyer}</p>
                <div className="mt-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[item.status]}`}>
                    {t(`adminStatus_${item.status}`)}
                  </span>
                </div>
              </div>
              {expandedId === item.id ? <ChevronUp size={16} className="text-orange shrink-0" /> : <ChevronDown size={16} className="text-[#B9BBC8] shrink-0" />}
            </div>

            {expandedId === item.id && (
              <div className="mt-4 pt-4 border-t border-[#17334D]">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-[10px] text-[#B9BBC8] mb-0.5">{t('adminBudget')}</p>
                    <p className="text-xs font-semibold text-white">{item.budget}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#B9BBC8] mb-0.5">{t('adminDeadline')}</p>
                    <p className="text-xs font-semibold text-white">{item.deadline}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleView(item)} className="flex items-center gap-1.5 text-xs text-white bg-[#031B30] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors">
                    <Eye size={14} /> {t('adminView')}
                  </button>
                  <button onClick={() => openEditModal(item)} className="flex items-center gap-1.5 text-xs text-white bg-[#031B30] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors">
                    <Pencil size={14} /> {t('adminEdit')}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="flex items-center gap-1.5 text-xs text-red-400 bg-[#031B30] border border-red-400/20 px-3 py-2 rounded-lg hover:border-red-400/50 transition-colors">
                    <Trash2 size={14} /> {t('adminDelete')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-8 text-center">
            <p className="text-sm text-[#B9BBC8]">{t('adminNoResults')}</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#031B30] border border-[#17334D] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{editingTender ? t('adminEdit') : t('adminAddTender')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-[#B9BBC8] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminTitle')}</label>
                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminBuyer')}</label>
                <input required value={formData.buyer} onChange={e => setFormData({ ...formData, buyer: e.target.value })} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminBudget')}</label>
                  <input required value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminDeadline')}</label>
                  <input required type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
                </div>
              </div>
              <button type="submit" className="w-full bg-orange text-white font-bold py-3 rounded-xl hover:bg-orange/90 transition-colors text-sm">
                {t('adminSaveChanges')}
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}