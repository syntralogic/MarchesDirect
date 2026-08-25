import { useState } from 'react';
import { Search, Plus, X, Pencil, Trash2, Eye, Ban, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { useLang } from '@/contexts/LangContext';

const USERS = [
  { id: 'U-001', name: 'Julien Martin', company: 'BâtiNova', email: 'julien@batinova.fr', plan: 'Pro', status: 'active' },
  { id: 'U-002', name: 'Sophie Martin', company: 'CleanPro', email: 'sophie@cleanpro.fr', plan: 'Découverte', status: 'active' },
  { id: 'U-003', name: 'Pierre Leroy', company: 'BTP Construction', email: 'pierre@btp.fr', plan: 'Entreprise', status: 'pending' },
  { id: 'U-004', name: 'Camille Robert', company: 'Nettoyage Pro', email: 'camille@nettoyage.fr', plan: 'Pro', status: 'suspended' },
];

export default function AdminUsers() {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState(USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '', company: '', email: '', plan: 'Pro' });

  const filtered = users.filter(user => {
    if (query && !user.name.toLowerCase().includes(query.toLowerCase()) && !user.company.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', company: '', email: '', plan: 'Pro' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({ name: user.name, company: user.company, email: user.email, plan: user.plan });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(item => item.id === editingUser.id ? { ...item, ...formData } : item));
      showToast('User updated successfully');
    } else {
      setUsers([{ id: `U-00${users.length + 1}`, ...formData, status: 'active' }, ...users]);
      showToast('User created successfully');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter(item => item.id !== id));
    showToast('User deleted');
  };

  const handleToggleStatus = (user: any) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    setUsers(users.map(item => item.id === user.id ? { ...item, status: newStatus } : item));
    showToast(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
  };

  const planColors: Record<string, string> = {
    'Pro': 'text-orange bg-orange/10',
    'Découverte': 'text-blue-400 bg-blue-400/10',
    'Entreprise': 'text-green-400 bg-green-400/10',
  };

  const statusColors: Record<string, string> = {
    active: 'text-green-400 bg-green-400/10',
    pending: 'text-orange bg-orange/10',
    suspended: 'text-red-400 bg-red-400/10',
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">{t('adminUsers')}</h1>
          <p className="text-sm text-[#B9BBC8]">{t('adminManageUsers')}</p>
        </div>
        <button onClick={openAddModal} className="bg-orange text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-orange/90 transition-colors flex items-center justify-center gap-2">
          <Plus size={16} /> {t('adminAddUser')}
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B9BBC8]" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('adminSearchUsers')} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange" />
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-[#061D32] border border-[#17334D] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#17334D]">
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">ID</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminName')}</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminCompany')}</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminEmail')}</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminPlan')}</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase">{t('adminStatus')}</th>
                <th className="px-4 py-3 text-xs font-bold text-[#B9BBC8] uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr 
                  key={user.id} 
                  className="border-b border-[#17334D] hover:bg-white/5 transition-colors relative cursor-pointer"
                  onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                >
                  <td className="px-4 py-3 text-xs text-[#B9BBC8]">{user.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange/20 border border-orange/30 flex items-center justify-center text-xs font-bold text-orange shrink-0">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-semibold text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#B9BBC8]">{user.company}</td>
                  <td className="px-4 py-3 text-sm text-[#B9BBC8]">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${planColors[user.plan] || 'text-[#B9BBC8] bg-[#031B30]'}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[user.status]}`}>
                      {t(`adminStatus_${user.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {expandedId === user.id ? <ChevronUp size={16} className="text-orange" /> : <ChevronDown size={16} className="text-[#B9BBC8]" />}
                  </td>
                </tr>
              ))}
              {filtered.map(user => (
                expandedId === user.id && (
                  <tr key={`${user.id}-details`} className="bg-[#031B30]">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <button onClick={() => { showToast(`Viewing: ${user.name}`); }} className="flex items-center gap-2 text-sm text-white bg-[#061D32] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors">
                          <Eye size={14} /> {t('adminView')}
                        </button>
                        <button onClick={() => openEditModal(user)} className="flex items-center gap-2 text-sm text-white bg-[#061D32] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors">
                          <Pencil size={14} /> {t('adminEdit')}
                        </button>
                        <button onClick={() => handleToggleStatus(user)} className="flex items-center gap-2 text-sm text-yellow-400 bg-[#061D32] border border-yellow-400/20 px-3 py-2 rounded-lg hover:border-yellow-400/50 transition-colors">
                          {user.status === 'active' ? <Ban size={14} /> : <CheckCircle2 size={14} />} 
                          {user.status === 'active' ? t('adminSuspend') : t('adminActivate')}
                        </button>
                        <button onClick={() => handleDelete(user.id)} className="flex items-center gap-2 text-sm text-red-400 bg-[#061D32] border border-red-400/20 px-3 py-2 rounded-lg hover:border-red-400/50 transition-colors">
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
      </div>

      {/* MOBILE CARD VIEW - Accordion Style */}
      <div className="md:hidden space-y-3">
        {filtered.map(user => (
          <div key={user.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
            <div 
              className="flex items-start justify-between gap-2 cursor-pointer"
              onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-orange/20 border border-orange/30 flex items-center justify-center text-xs font-bold text-orange shrink-0">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{user.name}</h3>
                  <p className="text-xs text-[#B9BBC8] truncate">{user.company}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${planColors[user.plan] || 'text-[#B9BBC8] bg-[#031B30]'}`}>
                      {user.plan}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[user.status]}`}>
                      {t(`adminStatus_${user.status}`)}
                    </span>
                  </div>
                </div>
              </div>
              {expandedId === user.id ? <ChevronUp size={16} className="text-orange shrink-0" /> : <ChevronDown size={16} className="text-[#B9BBC8] shrink-0" />}
            </div>

            {expandedId === user.id && (
              <div className="mt-4 pt-4 border-t border-[#17334D]">
                <div className="mb-3">
                  <p className="text-[10px] text-[#B9BBC8] mb-0.5">{t('adminEmail')}</p>
                  <p className="text-xs font-semibold text-white break-all">{user.email}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { showToast(`Viewing: ${user.name}`); }} className="flex items-center gap-1.5 text-xs text-white bg-[#031B30] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors">
                    <Eye size={14} /> {t('adminView')}
                  </button>
                  <button onClick={() => openEditModal(user)} className="flex items-center gap-1.5 text-xs text-white bg-[#031B30] border border-[#17334D] px-3 py-2 rounded-lg hover:border-orange/50 transition-colors">
                    <Pencil size={14} /> {t('adminEdit')}
                  </button>
                  <button onClick={() => handleToggleStatus(user)} className="flex items-center gap-1.5 text-xs text-yellow-400 bg-[#031B30] border border-yellow-400/20 px-3 py-2 rounded-lg hover:border-yellow-400/50 transition-colors">
                    {user.status === 'active' ? <Ban size={14} /> : <CheckCircle2 size={14} />} 
                    {user.status === 'active' ? t('adminSuspend') : t('adminActivate')}
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="flex items-center gap-1.5 text-xs text-red-400 bg-[#031B30] border border-red-400/20 px-3 py-2 rounded-lg hover:border-red-400/50 transition-colors">
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
              <h3 className="text-lg font-bold text-white">{editingUser ? t('adminEdit') : t('adminAddUser')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg text-[#B9BBC8] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminName')}</label>
                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminCompany')}</label>
                <input required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminEmail')}</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{t('adminPlan')}</label>
                <select value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange">
                  <option>Pro</option>
                  <option>Découverte</option>
                  <option>Entreprise</option>
                </select>
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