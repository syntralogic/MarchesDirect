import { useEffect, useMemo, useRef, useState } from 'react';
import { DEPARTMENTS } from '@/data/departments';
import { opportunitiesApi, type OpportunitySearchParams } from '@/lib/apiClient';

// Volet « Affiner » de la liste (validé le 5 nov. sur maquette) : même langage que le moteur de l'accueil
// (carte bleu nuit bordée d'orange). Replié par défaut : un bouton + les filtres actifs en puces, la liste
// reste visible. Déplié : cinq critères utiles seulement — type, où, budget, réponse attendue, tri.
// Les valeurs vivent dans l'adresse (URL) : un lien partagé ou un retour arrière retrouve les mêmes filtres.

export type Journey = 'all' | 'public_procurement' | 'tender' | 'subcontracting';
export type Refine = {
  journey: Journey;
  where: 'france' | 'department' | 'near';
  department: string;        // code, '' = aucun
  lat: number | null; lng: number | null; radius: 25 | 50 | 100;
  min: string; max: string;  // euros, '' = aucun
  deadline: 'all' | '7' | '30' | 'later';
  sort: 'match' | 'distance' | 'deadline' | 'amount' | 'recent';
};

export const TYPE_CHIPS: { key: Journey; label: string }[] = [
  { key: 'all', label: 'Tous' }, { key: 'public_procurement', label: 'Marchés publics' },
  { key: 'tender', label: 'Appels d’offres privés' }, { key: 'subcontracting', label: 'Sous-traitance' },
];
const DEADLINES: { key: Refine['deadline']; label: string }[] = [
  { key: 'all', label: 'Toutes dates' }, { key: '7', label: 'Sous 7 jours' }, { key: '30', label: 'Sous 30 jours' }, { key: 'later', label: 'Plus de 30 jours' },
];
const SORTS: { key: Refine['sort']; label: string; needsPosition?: boolean }[] = [
  { key: 'match', label: 'Pertinence' }, { key: 'distance', label: 'Le plus proche', needsPosition: true },
  { key: 'deadline', label: 'Date limite' }, { key: 'amount', label: 'Montant' }, { key: 'recent', label: 'Nouveautés' },
];

export const DEFAULT_REFINE: Refine = { journey: 'all', where: 'france', department: '', lat: null, lng: null, radius: 50, min: '', max: '', deadline: 'all', sort: 'match' };

const num = (v: string | null) => { const n = v ? Number(v) : NaN; return Number.isFinite(n) ? n : null; };

export function refineFromParams(p: URLSearchParams): Refine {
  const j = p.get('journey'); const lat = num(p.get('lat')); const lng = num(p.get('lng')); const dep = p.get('department') || '';
  const r = Number(p.get('radius_km')); const dl = p.get('deadline_within'); const sort = p.get('sort');
  return {
    journey: j === 'public_procurement' || j === 'tender' || j === 'subcontracting' ? j : 'all',
    where: lat != null && lng != null ? 'near' : dep ? 'department' : 'france',
    department: dep, lat, lng, radius: r === 25 || r === 100 ? r : 50,
    min: p.get('min_value') || '', max: p.get('max_value') || '',
    deadline: dl === '7' || dl === '30' || dl === 'later' ? dl : 'all',
    sort: sort === 'distance' || sort === 'deadline' || sort === 'amount' || sort === 'recent' ? sort : 'match',
  };
}

/** Écrit les filtres dans l'adresse sans toucher à q (le métier) ni à zone/trade_id. */
export function paramsWithRefine(base: URLSearchParams, r: Refine): URLSearchParams {
  const p = new URLSearchParams(base);
  const set = (k: string, v: string | null) => { if (v) p.set(k, v); else p.delete(k); };
  set('journey', r.journey === 'all' ? null : r.journey);
  set('department', r.where === 'department' && r.department ? r.department : null);
  set('lat', r.where === 'near' && r.lat != null ? String(r.lat) : null);
  set('lng', r.where === 'near' && r.lng != null ? String(r.lng) : null);
  set('radius_km', r.where === 'near' && r.lat != null ? String(r.radius) : null);
  set('min_value', r.min.trim() ? r.min.trim() : null);
  set('max_value', r.max.trim() ? r.max.trim() : null);
  set('deadline_within', r.deadline === 'all' ? null : r.deadline);
  set('sort', r.sort === 'match' ? null : r.sort === 'distance' && r.where !== 'near' ? null : r.sort);
  return p;
}

/** Paramètres d'appel au serveur pour une recherche simple (q + filtres). */
export function searchParamsFor(q: string | undefined, r: Refine, extra: Partial<OpportunitySearchParams> = {}): OpportunitySearchParams {
  return {
    ...(q ? { q } : {}),
    ...(r.journey !== 'all' ? { journey: r.journey } : {}),
    ...(r.where === 'department' && r.department ? { department: r.department } : {}),
    ...(r.where === 'near' && r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng, radius_km: r.radius } : {}),
    ...(r.min.trim() ? { min_value: Number(r.min), include_unknown_value: '1' as const } : {}),
    ...(r.max.trim() ? { max_value: Number(r.max), include_unknown_value: '1' as const } : {}),
    ...(r.deadline !== 'all' ? { deadline_within: r.deadline } : {}),
    ...(r.sort !== 'match' && !(r.sort === 'distance' && r.where !== 'near') ? { sort: r.sort } : {}),
    status: 'active',
    ...extra,
  };
}

const euro = (v: string) => `${Number(v).toLocaleString('fr-FR')} €`;
const deptName = (code: string) => { const d = DEPARTMENTS.find(x => x.code === code); return d ? `${d.name} (${d.code})` : code; };

/** Puces des filtres actifs (volet replié). */
export function activeChips(r: Refine): { key: string; label: string; clear: (r: Refine) => Refine }[] {
  const out: { key: string; label: string; clear: (r: Refine) => Refine }[] = [];
  if (r.journey !== 'all') out.push({ key: 'journey', label: TYPE_CHIPS.find(t => t.key === r.journey)!.label, clear: x => ({ ...x, journey: 'all' }) });
  if (r.where === 'department' && r.department) out.push({ key: 'dep', label: deptName(r.department), clear: x => ({ ...x, where: 'france', department: '' }) });
  if (r.where === 'near' && r.lat != null) out.push({ key: 'near', label: `Autour de moi · ${r.radius} km`, clear: x => ({ ...x, where: 'france', lat: null, lng: null, sort: x.sort === 'distance' ? 'match' : x.sort }) });
  if (r.min.trim() || r.max.trim()) out.push({ key: 'budget', label: r.min.trim() && r.max.trim() ? `${euro(r.min)} – ${euro(r.max)}` : r.min.trim() ? `> ${euro(r.min)}` : `< ${euro(r.max)}`, clear: x => ({ ...x, min: '', max: '' }) });
  if (r.deadline !== 'all') out.push({ key: 'deadline', label: DEADLINES.find(d => d.key === r.deadline)!.label, clear: x => ({ ...x, deadline: 'all' }) });
  if (r.sort !== 'match' && !(r.sort === 'distance' && r.where !== 'near')) out.push({ key: 'sort', label: `Tri : ${SORTS.find(s => s.key === r.sort)!.label.toLowerCase()}`, clear: x => ({ ...x, sort: 'match' }) });
  return out;
}

const chip = (on: boolean, dim = false) => `inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-[14px] font-bold ${on ? 'border-[#FB923C] bg-[#3A2312] text-[#FDBA74]' : dim ? 'border-[#1E3352] text-[#6B7A90]' : 'border-[#2B4468] text-[#D6E0EC]'}`;
const FIELD = 'h-[52px] w-full rounded-xl border-2 border-[#C9D6E8] bg-white px-3 text-[16px] text-[#0A1628] focus:border-[#F97316] focus:outline-none';
const LBL = 'mt-3 block text-[14px] font-extrabold';
const SEG = (on: boolean) => `min-h-[44px] flex-1 rounded-[10px] px-1 text-[14px] font-bold leading-tight ${on ? 'bg-[#C2410C] text-white' : 'text-[#D6E0EC]'}`;

type Props = {
  q?: string;
  value: Refine;                                   // filtres appliqués (dans l'adresse)
  typeCounts: Record<string, number> | null;       // totaux par type pour la recherche en cours
  onApply: (r: Refine) => void;
};

export default function RefinePanel({ q, value, typeCounts, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Refine>(value);
  const [preview, setPreview] = useState<number | null>(null);
  const [geoState, setGeoState] = useState<'idle' | 'asking' | 'denied'>('idle');
  const run = useRef(0);
  useEffect(() => { setDraft(value); }, [value]);

  // « Voir les N marchés » : le nombre se met à jour avant de valider (une requête légère, débouncée).
  useEffect(() => {
    if (!open) return;
    const mine = ++run.current;
    const t = window.setTimeout(() => {
      opportunitiesApi.search(searchParamsFor(q, draft, { limit: 1 }))
        .then(r => { if (run.current === mine) setPreview(r.pagination?.total ?? r.results.length); })
        .catch(() => { if (run.current === mine) setPreview(null); });
    }, 350);
    return () => window.clearTimeout(t);
  }, [open, draft, q]);

  const chips = useMemo(() => activeChips(value), [value]);
  const typeAll = typeCounts ? Object.values(typeCounts).reduce((a, b) => a + b, 0) : null;

  const locate = () => {
    if (!('geolocation' in navigator)) { setGeoState('denied'); return; }
    setGeoState('asking');
    navigator.geolocation.getCurrentPosition(
      pos => { setGeoState('idle'); setDraft(d => ({ ...d, where: 'near', lat: Math.round(pos.coords.latitude * 1e4) / 1e4, lng: Math.round(pos.coords.longitude * 1e4) / 1e4 })); },
      () => { setGeoState('denied'); setDraft(d => ({ ...d, where: 'france', lat: null, lng: null })); },
      { timeout: 8000, maximumAge: 600000 },
    );
  };

  const apply = () => { onApply(draft); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const reset = () => { setDraft(DEFAULT_REFINE); };

  return (
    <div className="flex flex-col gap-3">
      {/* Barre repliée : bouton Affiner + filtres actifs */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
          className="flex min-h-[46px] shrink-0 items-center gap-2 rounded-xl border-2 border-[#C2410C] bg-[#142B4A] px-3.5 text-[14px] font-extrabold text-white">
          {chips.length > 0 && <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#F97316] px-1 text-[12px]">{chips.length}</span>}
          Affiner
        </button>
        <div className="flex min-w-0 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map(c => (
            <button key={c.key} type="button" onClick={() => onApply(c.clear(value))} aria-label={`Retirer le filtre ${c.label}`} className={chip(true)}>
              {c.label} <span aria-hidden className="ml-1.5 text-[#FDBA74]">✕</span>
            </button>))}
        </div>
      </div>

      {open && (
        <section aria-label="Affiner la liste" className="rounded-[20px] border-2 border-[#C2410C] bg-[#142B4A] p-4 shadow-[0_12px_40px_rgba(0,0,0,.45)]">
          <div className="flex items-start justify-between gap-3">
            <div><b className="text-[17px]">Affiner</b><br /><span className="text-[13px] text-[#D6E0EC]">Seulement ce qui compte pour choisir un marché</span></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="min-h-[40px] min-w-[40px] rounded-lg text-[20px] text-[#D6E0EC]">✕</button>
          </div>

          <span className={LBL}>Type de marché</span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Type de marché">
            {TYPE_CHIPS.map(t => {
              const n = t.key === 'all' ? typeAll : typeCounts ? (typeCounts[t.key] ?? 0) : null;
              return <button key={t.key} type="button" aria-pressed={draft.journey === t.key} onClick={() => setDraft(d => ({ ...d, journey: t.key }))} className={chip(draft.journey === t.key, n === 0)}>{t.label}{n == null ? '' : ` (${n})`}</button>;
            })}
          </div>

          <span className={LBL}>Où ?</span>
          <div className="mt-2 flex gap-1.5 rounded-xl bg-[#0A1628] p-1" role="group" aria-label="Où">
            <button type="button" className={SEG(draft.where === 'france')} onClick={() => setDraft(d => ({ ...d, where: 'france' }))}>Toute la France</button>
            <button type="button" className={SEG(draft.where === 'department')} onClick={() => setDraft(d => ({ ...d, where: 'department' }))}>Un département</button>
            <button type="button" className={SEG(draft.where === 'near')} onClick={() => { if (draft.lat == null) locate(); else setDraft(d => ({ ...d, where: 'near' })); }}>Autour de moi</button>
          </div>
          {draft.where === 'department' && (
            <select aria-label="Département" value={draft.department} onChange={e => setDraft(d => ({ ...d, department: e.target.value }))} className={`${FIELD} mt-2`}>
              <option value="">Choisir un département</option>
              {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code} – {d.name}</option>)}
            </select>)}
          {draft.where === 'near' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="flex-1 text-[14px] text-[#D6E0EC]">{draft.lat != null ? 'Position trouvée' : geoState === 'asking' ? 'Recherche de votre position…' : 'Position non disponible'}</span>
              <select aria-label="Rayon" value={draft.radius} onChange={e => setDraft(d => ({ ...d, radius: Number(e.target.value) as 25 | 50 | 100 }))} className={`${FIELD} w-[130px]`}>
                <option value={25}>25 km</option><option value={50}>50 km</option><option value={100}>100 km</option>
              </select>
            </div>)}
          {geoState === 'denied' && <p className="mt-1 text-[13px] text-[#FCA5A5]">Nous n’avons pas pu obtenir votre position. Choisissez un département.</p>}
          <p className="mt-1 text-[13px] text-[#B4C1D3]">« Autour de moi » utilise la position de votre téléphone, uniquement pour trier par distance.</p>

          <span className={LBL}>Budget estimé</span>
          <div className="mt-2 flex gap-2">
            <label className="relative flex-1"><span className="absolute left-3 top-[15px] text-[14px] text-[#8A97A8]">Min.</span>
              <input inputMode="numeric" aria-label="Budget minimum en euros" value={draft.min} onChange={e => setDraft(d => ({ ...d, min: e.target.value.replace(/[^\d]/g, '') }))} className={`${FIELD} pl-12 text-right`} placeholder="€" /></label>
            <label className="relative flex-1"><span className="absolute left-3 top-[15px] text-[14px] text-[#8A97A8]">Max.</span>
              <input inputMode="numeric" aria-label="Budget maximum en euros" value={draft.max} onChange={e => setDraft(d => ({ ...d, max: e.target.value.replace(/[^\d]/g, '') }))} className={`${FIELD} pl-12 text-right`} placeholder="€" /></label>
          </div>
          <p className="mt-1 text-[13px] text-[#B4C1D3]">Les marchés sans montant annoncé restent affichés.</p>

          <span className={LBL}>Réponse attendue</span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Réponse attendue">
            {DEADLINES.map(d => <button key={d.key} type="button" aria-pressed={draft.deadline === d.key} onClick={() => setDraft(x => ({ ...x, deadline: d.key }))} className={chip(draft.deadline === d.key)}>{d.label}</button>)}
          </div>

          <span className={LBL}>Classer par</span>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Classer par">
            {SORTS.map(s => {
              const off = s.needsPosition && !(draft.where === 'near' && draft.lat != null);
              return <button key={s.key} type="button" disabled={off} title={off ? 'Choisissez « Autour de moi » pour trier par distance' : undefined} aria-pressed={draft.sort === s.key} onClick={() => setDraft(x => ({ ...x, sort: s.key }))} className={chip(draft.sort === s.key, off)}>{s.label}</button>;
            })}
          </div>

          <button type="button" onClick={apply} className="mt-4 flex min-h-[56px] w-full items-center justify-center rounded-[14px] bg-[#F97316] text-[17px] font-extrabold text-white shadow-[0_6px_18px_rgba(249,115,22,.35)]">
            {preview == null ? 'Voir les marchés' : preview === 0 ? 'Aucun marché avec ces critères' : `Voir ${preview === 1 ? 'le marché' : `les ${preview.toLocaleString('fr-FR')} marchés`}`}
          </button>
          <button type="button" onClick={reset} className="mt-2 min-h-[40px] w-full text-center text-[14px] font-bold text-[#FB923C] underline underline-offset-4">Tout réinitialiser</button>
        </section>
      )}
    </div>
  );
}
