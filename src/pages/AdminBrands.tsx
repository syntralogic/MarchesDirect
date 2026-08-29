import { useEffect, useState } from 'react';
import { Loader2, Plus, Globe, X } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import { adminApi, getApiErrorMessage, type ApiAdminBrand } from '@/lib/apiClient';

const emptyForm = { code: '', name: '', domain: '', language: 'fr', regionFocus: '', colorPrimary: '', colorSecondary: '' };

export default function AdminBrands() {
  const [brands, setBrands] = useState<ApiAdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi.brands()
      .then(setBrands)
      .catch(err => setError(getApiErrorMessage(err, 'Impossible de charger les marques.')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await adminApi.createBrand({
        code: form.code.trim(),
        name: form.name.trim(),
        domain: form.domain.trim(),
        language: form.language,
        regionFocus: form.regionFocus || undefined,
        colorPrimary: form.colorPrimary || undefined,
        colorSecondary: form.colorSecondary || undefined,
      });
      setBrands(prev => [...prev, created]);
      showToast('Marque créée');
      setModalOpen(false);
      setForm(emptyForm);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Échec de la création.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Gestion des marques</h1>
          <p className="text-sm text-[#B9BBC8]">Une nouvelle marque partage le même code, seuls le domaine, la charte et la portée régionale changent</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center justify-center gap-2 bg-orange text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-orange/90 transition-colors shrink-0">
          <Plus size={16} /> Nouvelle marque
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#B9BBC8]"><Loader2 size={20} className="animate-spin mr-2" /> Chargement...</div>
      ) : error ? (
        <div className="p-6 text-center text-sm text-red-400 bg-[#061D32] border border-[#17334D] rounded-xl">{error}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {brands.map(brand => (
            <div key={brand.id} className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">{brand.name}</h3>
                  <p className="text-xs text-[#B9BBC8]">{brand.code}</p>
                </div>
                {brand.color_primary && <div className="w-6 h-6 rounded-full border border-[#17334D] shrink-0" style={{ backgroundColor: brand.color_primary }} />}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#B9BBC8] mb-1">
                <Globe size={12} /> {brand.domain}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#B9BBC8] bg-[#031B30] uppercase">{brand.language}</span>
                {brand.region_focus && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[#B9BBC8] bg-[#031B30]">{brand.region_focus}</span>}
              </div>
            </div>
          ))}
          {brands.length === 0 && <div className="sm:col-span-2 bg-[#061D32] border border-[#17334D] rounded-xl p-10 text-center"><p className="text-sm text-[#B9BBC8]">Aucune marque pour le moment.</p></div>}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModalOpen(false)} />
          <form onSubmit={handleCreate} className="relative w-full max-w-md bg-[#061D32] border border-[#17334D] rounded-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Nouvelle marque</h2>
              <button type="button" onClick={() => setModalOpen(false)}><X size={18} className="text-[#B9BBC8]" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#B9BBC8] mb-1 block">Code (unique)</label>
                <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="brand_3" className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange" />
              </div>
              <div>
                <label className="text-xs text-[#B9BBC8] mb-1 block">Nom</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Marchés Sud" className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange" />
              </div>
              <div>
                <label className="text-xs text-[#B9BBC8] mb-1 block">Domaine</label>
                <input required value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="marches-sud.fr" className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange" />
              </div>
              <div>
                <label className="text-xs text-[#B9BBC8] mb-1 block">Portée régionale (optionnel)</label>
                <input value={form.regionFocus} onChange={e => setForm(f => ({ ...f, regionFocus: e.target.value }))} placeholder="Occitanie" className="w-full bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#B9BBC8] mb-1 block">Couleur primaire</label>
                  <input type="color" value={form.colorPrimary || '#FF6500'} onChange={e => setForm(f => ({ ...f, colorPrimary: e.target.value }))} className="w-full h-9 bg-[#031B30] border border-[#17334D] rounded-lg" />
                </div>
                <div>
                  <label className="text-xs text-[#B9BBC8] mb-1 block">Couleur secondaire</label>
                  <input type="color" value={form.colorSecondary || '#061D32'} onChange={e => setForm(f => ({ ...f, colorSecondary: e.target.value }))} className="w-full h-9 bg-[#031B30] border border-[#17334D] rounded-lg" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={saving} className="w-full mt-5 bg-orange text-white font-bold py-2.5 rounded-xl hover:bg-orange/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Créer la marque
            </button>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
