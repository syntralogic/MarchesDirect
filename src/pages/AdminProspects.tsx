import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Download, Search, ChevronDown, ChevronRight, Star, ExternalLink, Play, RefreshCw } from 'lucide-react';
import { AdminLayout, showToast } from '@/pages/AdminLayout';
import {
  adminApi, getApiErrorMessage, type ApiProspect, type ApiProspectFilters, type ApiProspectMeta, type ApiJobState,
} from '@/lib/apiClient';

// Part 6 - French company / artisan prospecting database. Every requested field is reachable here
// (table + detail panel) and in the CSV / Excel exports; the detail panel shows, for each
// field, where it came from or why it is empty (confirmed missing / not checked / unavailable).

const SOURCE: Record<string, string> = { sirene: 'SIRENE (INSEE)', google_places: 'Google Places', company_website: 'Site de l\u2019entreprise' };
const eur = (v: unknown) => (v === null || v === undefined || v === '' ? null : `${Number(v).toLocaleString('fr-FR')} €`);
const metaText = (m?: { status: string; source?: string; note?: string }) => {
  if (!m) return 'non vérifié';
  const src = m.source ? SOURCE[m.source] || m.source : '';
  if (m.status === 'confirmed') return `confirmé${src ? ` · ${src}` : ''}`;
  if (m.status === 'confirmed_missing') return `absent, confirmé${src ? ` · ${src}` : ''}${m.note ? ` – ${m.note}` : ''}`;
  if (m.status === 'unavailable') return `indisponible${m.note ? ` – ${m.note}` : ''}`;
  if (m.status === 'error') return 'erreur de collecte (à relancer)';
  return 'non vérifié';
};

function Link({ href }: { href: string | null }) {
  if (!href) return <span className="text-[#6C7A8C]">—</span>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline inline-flex items-center gap-1 break-all">{href.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}<ExternalLink size={11} className="shrink-0" /></a>;
}

function Row({ label, value, meta }: { label: string; value: React.ReactNode; meta?: { status: string; source?: string; note?: string } | 'skip' }) {
  const empty = value === null || value === undefined || value === '' || value === '—';
  return (
    <div className="py-1.5 border-b border-[#17334D]/60 text-xs">
      <div className="text-[#B9BBC8]">{label}</div>
      <div className="text-white break-words">{empty ? <span className="text-[#6C7A8C]">—</span> : value}</div>
      {empty && meta !== 'skip' && <div className="text-[10px] text-[#8996A8] mt-0.5">{metaText(meta)}</div>}
    </div>
  );
}

function Detail({ c }: { c: ApiProspect }) {
  const fm = c.field_meta || {};
  const naf = c.naf_code ? `${c.naf_code}${c.activity_label ? ` — ${c.activity_label}` : ''}` : null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-1 p-4 bg-[#031B30]">
      <div>
        <h4 className="text-[11px] font-bold text-orange uppercase mb-1">Identité</h4>
        <Row label="SIRET / SIREN" value={`${c.siret} / ${c.siren}`} meta="skip" />
        <Row label="Forme juridique" value={c.legal_form_label} meta={fm.legal_form} />
        <Row label="Date de création" value={c.creation_date ? new Date(c.creation_date).toLocaleDateString('fr-FR') : null} meta={fm.creation_date} />
        <Row label="Activité (NAF)" value={naf} meta={fm.naf_code} />
        <Row label="Effectif" value={c.employee_range} meta={fm.employee_range} />
        <Row label="Chiffre d’affaires" value={eur(c.revenue_eur) && `${eur(c.revenue_eur)}${c.revenue_year ? ` (${c.revenue_year})` : ''}`} meta={fm.revenue} />
        <Row label="Résultat net" value={eur(c.net_result_eur)} meta={fm.revenue} />
        <Row label="Dirigeants / représentants" value={c.directors?.length ? c.directors.map(d => d.role ? `${d.name} (${d.role})` : d.name).join(' ; ') : null} meta={fm.directors} />
        <Row label="Certifications" value={c.certifications?.length ? c.certifications.join(' ; ') : null} meta={fm.certifications} />
        <Row label="Historique" value={c.history?.length ? c.history.map(h => `${h.date ? new Date(h.date).toLocaleDateString('fr-FR') + ' : ' : ''}${h.event}`).join(' ; ') : null} meta={fm.history} />
      </div>
      <div>
        <h4 className="text-[11px] font-bold text-orange uppercase mb-1">Contact & réseaux</h4>
        <Row label="Adresse" value={[c.address_line].filter(Boolean).join('')} meta={fm.address} />
        <Row label="Téléphone" value={c.phone} meta={fm.phone} />
        <Row label="E-mail professionnel" value={c.email} meta={fm.email} />
        <Row label="Site web" value={c.website ? <Link href={c.website} /> : null} meta={fm.website} />
        <Row label="Page Facebook" value={c.facebook_url ? <Link href={c.facebook_url} /> : null} meta={fm.facebook_url} />
        <Row label="Instagram" value={c.instagram_url ? <Link href={c.instagram_url} /> : null} meta={fm.instagram_url} />
        <Row label="LinkedIn" value={c.linkedin_url ? <Link href={c.linkedin_url} /> : null} meta={fm.linkedin_url} />
      </div>
      <div>
        <h4 className="text-[11px] font-bold text-orange uppercase mb-1">Google Business Profile</h4>
        <Row label="Fiche Google / Maps" value={c.google_maps_url ? <Link href={c.google_maps_url} /> : null} meta={fm.google_profile} />
        <Row label="Note Google" value={c.google_rating !== null ? `${Number(c.google_rating).toLocaleString('fr-FR')} / 5` : null} meta={fm.google_rating} />
        <Row label="Nombre total d’avis" value={c.google_review_count} meta={fm.google_review_count} />
        <Row label="Avis positifs (nombre / %)" value={c.google_positive_review_count !== null || c.google_positive_review_pct !== null ? `${c.google_positive_review_count ?? '—'} / ${c.google_positive_review_pct ?? '—'} %` : null}
          meta={fm.google_positive_reviews || { status: 'unavailable', note: 'l’API Google ne fournit pas ce détail (fournisseur d’avis sous licence requis)' }} />
        <Row label="Confiance du rapprochement" value={c.google_match_confidence !== null ? String(c.google_match_confidence) : null} meta="skip" />
        <Row label="Relevé Google du" value={c.google_fetched_at ? new Date(c.google_fetched_at).toLocaleDateString('fr-FR') : null} meta="skip" />
      </div>
    </div>
  );
}

const inputCls = 'bg-[#031B30] border border-[#17334D] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#6C7A8C] focus:border-orange outline-none min-w-0';

export default function AdminProspects() {
  const [meta, setMeta] = useState<ApiProspectMeta | null>(null);
  const [f, setF] = useState<ApiProspectFilters>({ status: 'active', sort: 'name' });
  const [applied, setApplied] = useState<ApiProspectFilters>(f);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ApiProspect[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [detail, setDetail] = useState<Record<number, ApiProspect>>({});
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [job, setJob] = useState<ApiJobState | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const reqId = useRef(0);

  useEffect(() => { adminApi.prospectsMeta().then(setMeta).catch(e => setError(getApiErrorMessage(e))); adminApi.prospectsStats().then(setStats).catch(() => {}); }, []);

  const load = useCallback(() => {
    const id = ++reqId.current;
    setLoading(true); setError(null);
    adminApi.prospects(applied, page, 50)
      .then(d => { if (id !== reqId.current) return; setRows(d.results); setTotal(d.pagination.total); setTotalPages(d.pagination.totalPages); })
      .catch(e => { if (id === reqId.current) setError(getApiErrorMessage(e, 'Impossible de charger les entreprises.')); })
      .finally(() => { if (id === reqId.current) setLoading(false); });
  }, [applied, page]);
  useEffect(load, [load]);

  const depts = useMemo(() => (meta?.departments || []).filter(d => !f.region || d.region === f.region), [meta, f.region]);
  const apply = () => { setPage(1); setApplied({ ...f }); };

  const toggle = async (c: ApiProspect) => {
    if (open === c.id) { setOpen(null); return; }
    setOpen(c.id);
    if (!detail[c.id]) {
      try { const d = await adminApi.prospectDetail(c.id); setDetail(p => ({ ...p, [c.id]: d })); }
      catch (e) { showToast(getApiErrorMessage(e, 'Détail indisponible.'), 'error'); }
    }
  };

  const doExport = async (fmt: 'csv' | 'xlsx') => {
    setExporting(fmt);
    try { await adminApi.downloadProspects(fmt, applied); }
    catch (e: any) {
      let msg = getApiErrorMessage(e, 'Export impossible.');
      try { const t = await (e?.response?.data as Blob | undefined)?.text(); if (t) msg = JSON.parse(t).error || msg; } catch { /* keep msg */ }
      showToast(msg, 'error');
    } finally { setExporting(null); }
  };

  const poll = (fetcher: () => Promise<ApiJobState>) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      try {
        const s = await fetcher(); setJob(s);
        if (!s.running) { window.clearInterval(pollRef.current!); pollRef.current = null; load(); adminApi.prospectsStats().then(setStats).catch(() => {}); }
      } catch { /* keep polling */ }
    }, 3000);
  };
  useEffect(() => () => { if (pollRef.current) window.clearInterval(pollRef.current); }, []);

  const startImport = async () => {
    try {
      const r = await adminApi.startProspectImport({ profession: f.profession, region: f.region, department: f.department });
      setJob(r.state); showToast('Import SIRENE lancé'); poll(adminApi.prospectImportStatus);
    } catch (e) { showToast(getApiErrorMessage(e, 'Import impossible.'), 'error'); }
  };
  const startEnrich = async (kind: 'google' | 'website') => {
    try {
      const r = await adminApi.startProspectEnrich(kind, { ...applied, limit: 100 });
      setJob(r.state); showToast(kind === 'google' ? 'Enrichissement Google lancé (100 max)' : 'Enrichissement via sites web lancé'); poll(adminApi.prospectEnrichStatus);
    } catch (e) { showToast(getApiErrorMessage(e, 'Enrichissement impossible.'), 'error'); }
  };

  const g = meta?.google;
  const cov = (k: string) => (stats && stats.total ? `${stats[k]} / ${stats.total}` : '—');

  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Base entreprises & artisans</h1>
          <p className="text-sm text-[#B9BBC8]">Registre SIRENE, coordonnées, réseaux, fiche Google. {stats ? `${stats.total.toLocaleString('fr-FR')} établissements en base.` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => doExport('csv')} disabled={!!exporting || total === 0} className="flex items-center gap-1.5 border border-orange text-orange font-bold text-xs px-4 py-2.5 rounded-lg disabled:opacity-50">
            {exporting === 'csv' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} CSV ({total.toLocaleString('fr-FR')})
          </button>
          <button onClick={() => doExport('xlsx')} disabled={!!exporting || total === 0} className="flex items-center gap-1.5 bg-orange text-white font-bold text-xs px-4 py-2.5 rounded-lg disabled:opacity-50">
            {exporting === 'xlsx' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Excel (.xlsx)
          </button>
        </div>
      </div>

      <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          <input className={inputCls} placeholder="Nom, SIRET ou SIREN" value={f.q || ''} onChange={e => setF({ ...f, q: e.target.value })} onKeyDown={e => e.key === 'Enter' && apply()} />
          <select className={inputCls} value={f.profession || ''} onChange={e => setF({ ...f, profession: e.target.value || undefined })}>
            <option value="">Tous les métiers</option>{meta?.professions.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select className={inputCls} value={f.region || ''} onChange={e => setF({ ...f, region: e.target.value || undefined, department: undefined })}>
            <option value="">Toutes les régions</option>{meta?.regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className={inputCls} value={f.department || ''} onChange={e => setF({ ...f, department: e.target.value || undefined })}>
            <option value="">Tous les départements</option>{depts.map(d => <option key={d.code} value={d.code}>{d.code}</option>)}
          </select>
          <input className={inputCls} placeholder="Ville" value={f.city || ''} onChange={e => setF({ ...f, city: e.target.value })} onKeyDown={e => e.key === 'Enter' && apply()} />
          <input className={inputCls} placeholder="Code postal" inputMode="numeric" value={f.postalCode || ''} onChange={e => setF({ ...f, postalCode: e.target.value })} onKeyDown={e => e.key === 'Enter' && apply()} />
          <select className={inputCls} value={f.status || 'active'} onChange={e => setF({ ...f, status: e.target.value as any })}>
            <option value="active">Actives</option><option value="closed">Cessées</option><option value="all">Toutes</option>
          </select>
          <select className={inputCls} value={f.sort || 'name'} onChange={e => setF({ ...f, sort: e.target.value })}>
            <option value="name">Tri : nom</option><option value="rating">Tri : note Google</option><option value="reviews">Tri : nombre d’avis</option><option value="recent">Tri : création récente</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#B9BBC8]">
          {([['hasGoogle', 'Fiche Google'], ['hasFacebook', 'Facebook'], ['hasPhone', 'Téléphone'], ['hasEmail', 'E-mail'], ['hasWebsite', 'Site web']] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={!!f[k]} onChange={e => setF({ ...f, [k]: e.target.checked })} /> {l}</label>
          ))}
          <label className="flex items-center gap-1.5">Note ≥ <input className={`${inputCls} w-16`} type="number" min={0} max={5} step={0.1} value={f.minRating ?? ''} onChange={e => setF({ ...f, minRating: e.target.value === '' ? undefined : Number(e.target.value) })} /></label>
          <button onClick={apply} className="ml-auto flex items-center gap-1.5 bg-orange text-white font-bold text-xs px-4 py-2 rounded-lg"><Search size={13} /> Rechercher</button>
        </div>
      </div>

      <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4 mb-4 text-xs text-[#B9BBC8]">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button onClick={startImport} disabled={!!job?.running || (!f.profession && !f.region && !f.department)} className="flex items-center gap-1.5 border border-[#17334D] text-white font-bold px-3 py-2 rounded-lg disabled:opacity-40 hover:border-orange/60" title="Importe depuis le registre SIRENE selon métier / région / département choisis ci-dessus">
            <Play size={13} /> Importer depuis SIRENE
          </button>
          <button onClick={() => startEnrich('website')} disabled={!!job?.running} className="flex items-center gap-1.5 border border-[#17334D] text-white font-bold px-3 py-2 rounded-lg disabled:opacity-40 hover:border-orange/60" title="Lit la page d’accueil des sites déjà connus pour y relever Facebook, Instagram, LinkedIn, téléphone, e-mail">
            <RefreshCw size={13} /> Réseaux via sites web
          </button>
          <button onClick={() => startEnrich('google')} disabled={!!job?.running || g?.state !== 'ready'} className="flex items-center gap-1.5 border border-[#17334D] text-white font-bold px-3 py-2 rounded-lg disabled:opacity-40 hover:border-orange/60">
            <Star size={13} /> Enrichir Google (100 max)
          </button>
          {job && <span>{job.running ? <Loader2 size={12} className="inline animate-spin mr-1" /> : null}{job.message} · lues {job.rowsRead} · ajoutées {job.added} · mises à jour {job.updated}</span>}
        </div>
        <div className={g?.state === 'ready' ? 'text-green-400' : 'text-orange'}>Google : {g?.message || '…'}</div>
        {stats && <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-4 gap-y-1">
          {([['phone', 'Téléphone'], ['email', 'E-mail'], ['website', 'Site web'], ['facebook', 'Facebook'], ['google_maps', 'Fiche Google'], ['google_rating', 'Note'], ['google_review_count', 'Nb avis'], ['revenue', 'CA']] as const).map(([k, l]) => <div key={k}>{l} : <span className="text-white">{cov(k)}</span></div>)}
        </div>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#B9BBC8]"><Loader2 size={20} className="animate-spin mr-2" /> Chargement…</div>
      ) : error ? (
        <div className="p-6 text-center text-sm text-red-400 bg-[#061D32] border border-[#17334D] rounded-xl">{error}</div>
      ) : rows.length === 0 ? (
        <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-10 text-center text-sm text-[#B9BBC8]">Aucune entreprise ne correspond. Utilisez « Importer depuis SIRENE » pour alimenter la base.</div>
      ) : (
        <div className="bg-[#061D32] border border-[#17334D] rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[860px]">
            <thead className="text-[#B9BBC8] border-b border-[#17334D]">
              <tr><th className="p-3 w-8" /><th className="p-3">Entreprise</th><th className="p-3">Métier</th><th className="p-3">Ville</th><th className="p-3">Contact</th><th className="p-3">Facebook</th><th className="p-3">Google</th></tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <Fragment key={c.id}>
                  <tr className="border-b border-[#17334D]/60 hover:bg-[#031B30] cursor-pointer align-top" onClick={() => toggle(c)}>
                    <td className="p-3 text-[#B9BBC8]">{open === c.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                    <td className="p-3"><div className="font-bold text-white">{c.company_name}</div><div className="text-[#8996A8]">SIRET {c.siret}{c.status === 'closed' ? ' · cessée' : ''}</div></td>
                    <td className="p-3 text-[#B9BBC8]">{c.activity_label || c.naf_code || '—'}</td>
                    <td className="p-3 text-[#B9BBC8]">{c.city || '—'}<div className="text-[#8996A8]">{c.postal_code} {c.department ? `· ${c.department}` : ''}</div></td>
                    <td className="p-3 text-[#B9BBC8]">{c.phone || '—'}<div className="text-[#8996A8] break-all">{c.email || ''}</div></td>
                    <td className="p-3" onClick={e => e.stopPropagation()}><Link href={c.facebook_url} /></td>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      {c.google_maps_url ? <a href={c.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-orange hover:underline inline-flex items-center gap-1"><Star size={11} />{c.google_rating !== null ? Number(c.google_rating).toLocaleString('fr-FR') : '—'} <span className="text-[#8996A8]">({c.google_review_count ?? '—'})</span></a> : <span className="text-[#6C7A8C]">—</span>}
                    </td>
                  </tr>
                  {open === c.id && <tr><td colSpan={7} className="p-0">{detail[c.id] ? <Detail c={detail[c.id]} /> : <div className="p-4 text-[#B9BBC8]"><Loader2 size={14} className="animate-spin inline mr-2" />Chargement…</div>}</td></tr>}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 text-xs text-[#B9BBC8]">
        <span>{total.toLocaleString('fr-FR')} résultat{total > 1 ? 's' : ''} · page {page} / {totalPages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border border-[#17334D] px-3 py-2 rounded-lg disabled:opacity-40">Précédent</button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border border-[#17334D] px-3 py-2 rounded-lg disabled:opacity-40">Suivant</button>
        </div>
      </div>
    </AdminLayout>
  );
}
