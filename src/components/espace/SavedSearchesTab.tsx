import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSaved, removeSearch, currentIds, saveSearch, syncSaved, renameSearch, setSearchAlert, SAVED_LIMIT, type SavedSearch } from '@/lib/savedSearches';
import { getApiErrorMessage } from '@/lib/apiClient';
import { DEPARTMENTS } from '@/data/departments';
import MetierAutocomplete from '@/components/MetierAutocomplete';

// 8 nov. (Hedi : « il doit juste taper son métier, choisir la zone, le montant, marchés publics / privés ou tout,
// mettre un titre — Placo Paris, Placo dans le Nord — et les annonces arrivent »). Un suivi = cinq choix simples,
// enregistré tel quel ; la liste dessous montre chaque suivi avec ses nouveautés réelles. Un appui ouvre les annonces.
const REGIONS: [string, string, string[]][] = [
  ['ara', 'Auvergne-Rhône-Alpes', ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74']],
  ['bfc', 'Bourgogne-Franche-Comté', ['21', '25', '39', '58', '70', '71', '89', '90']],
  ['bre', 'Bretagne', ['22', '29', '35', '56']], ['cvl', 'Centre-Val de Loire', ['18', '28', '36', '37', '41', '45']],
  ['cor', 'Corse', ['2A', '2B']], ['ges', 'Grand Est', ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88']],
  ['hdf', 'Hauts-de-France', ['02', '59', '60', '62', '80']], ['idf', 'Île-de-France', ['75', '77', '78', '91', '92', '93', '94', '95']],
  ['nor', 'Normandie', ['14', '27', '50', '61', '76']], ['naq', 'Nouvelle-Aquitaine', ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87']],
  ['occ', 'Occitanie', ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82']],
  ['pdl', 'Pays de la Loire', ['44', '49', '53', '72', '85']], ['pac', 'Provence-Alpes-Côte d’Azur', ['04', '05', '06', '13', '83', '84']],
];
const AMOUNTS: [string, string][] = [['', 'Peu importe'], ['10000', '10 000 € et plus'], ['50000', '50 000 € et plus'], ['100000', '100 000 € et plus'], ['500000', '500 000 € et plus']];
const TYPES: [string, string][] = [['public_procurement', 'Marchés publics'], ['tender', 'Appels d’offres privés'], ['subcontracting', 'Sous-traitance']];
const chip = (on: boolean) => `min-h-[44px] rounded-full border px-3.5 text-[14px] font-bold ${on ? 'border-[#FB923C] bg-[#3A2312] text-[#FDBA74]' : 'border-[#2B4468] text-[#D6E0EC]'}`;
const field = 'h-[48px] w-full rounded-xl border border-[#2B4468] bg-[#0A1628] px-3 text-[16px] text-[#F2F5F9] placeholder:text-[#6B7A90]';
const label = 'mb-1 block text-[13px] font-bold text-[#B4C1D3]';
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function zoneLabel(zone: string) {
  if (!zone) return 'Toute la France';
  if (zone.startsWith('r:')) return REGIONS.find(r => r[0] === zone.slice(2))?.[1] || 'Région';
  const d = DEPARTMENTS.find(x => x.code === zone); return d ? d.name : zone;
}
function zoneDepts(zone: string) {
  if (!zone) return '';
  if (zone.startsWith('r:')) return (REGIONS.find(r => r[0] === zone.slice(2))?.[2] || []).join(',');
  return zone;
}
/** Résumé lisible d'un suivi enregistré, relu depuis sa recherche. */
function summary(query: string) {
  const p = new URLSearchParams(query);
  const dep = p.get('department') || '';
  const reg = REGIONS.find(r => r[2].join(',') === dep);
  const zone = !dep ? 'Toute la France' : reg ? reg[1] : dep.split(',').length > 1 ? `${dep.split(',').length} départements` : zoneLabel(dep);
  const min = p.get('min_value'); const j = (p.get('journey') || '').split(',').filter(Boolean);
  return [cap(p.get('q') || 'Tous métiers'), zone, min ? `${Number(min).toLocaleString('fr-FR')} € et plus` : null,
    j.length && j.length < 3 ? j.map(x => TYPES.find(t => t[0] === x)?.[1]).filter(Boolean).join(', ') : null].filter(Boolean).join(' · ');
}

export default function SavedSearchesTab({ sessionId }: { sessionId: string }) {
  const [list, setList] = useState<SavedSearch[]>(() => listSaved());
  const [fresh, setFresh] = useState<Record<string, number | null>>({});
  const [canAlert, setCanAlert] = useState(false);
  const [limit, setLimit] = useState(SAVED_LIMIT);
  const [msg, setMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null); const [draft, setDraft] = useState('');
  // Formulaire : métiers (plusieurs possibles), zone, montant, types, titre.
  const [open, setOpen] = useState(false);
  const [metiers, setMetiers] = useState<string[]>([]); const [typing, setTyping] = useState('');
  const [zone, setZone] = useState(''); const [min, setMin] = useState(''); const [types, setTypes] = useState<string[]>([]);
  const [title, setTitle] = useState(''); const [titleTouched, setTitleTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { syncSaved().then(r => { if (r) { setList(r.list); setCanAlert(r.canAlert); setLimit(r.limit); if (!r.list.length) setOpen(true); } else if (!listSaved().length) setOpen(true); }); }, []);
  const refresh = async () => { const r = await syncSaved(); setList(r ? r.list : listSaved()); };
  useEffect(() => {
    let live = true;
    list.forEach(s => {
      currentIds(s, sessionId).then(ids => { if (live) setFresh(f => ({ ...f, [s.id]: ids.filter(i => !s.seen.includes(i)).length })); })
        .catch(() => { if (live) setFresh(f => ({ ...f, [s.id]: null })); });
    });
    return () => { live = false; };
  }, [list, sessionId]);

  const allMetiers = useMemo(() => [...metiers, ...(typing.trim() && !metiers.includes(typing.trim().toLowerCase()) ? [typing.trim().toLowerCase()] : [])], [metiers, typing]);
  const autoTitle = `${allMetiers.length ? allMetiers.map(cap).join(', ') : 'Tous métiers'} · ${zoneLabel(zone)}`;
  const shownTitle = titleTouched ? title : autoTitle;
  const addMetier = (m: string) => { const v = m.trim().toLowerCase(); if (v && !metiers.includes(v) && metiers.length < 4) setMetiers([...metiers, v]); setTyping(''); };

  const save = async () => {
    if (!allMetiers.length && !zone) { setMsg('Choisissez au moins un métier ou une zone.'); return; }
    setSaving(true); setMsg(null); setOkMsg(null);
    const p = new URLSearchParams();
    if (allMetiers.length) p.set('q', allMetiers.join(' '));
    if (zoneDepts(zone)) p.set('department', zoneDepts(zone));
    if (min) { p.set('min_value', min); p.set('include_unknown_value', '1'); }
    if (types.length && types.length < 3) p.set('journey', types.join(','));
    const err = await saveSearch((shownTitle || autoTitle).trim().slice(0, 160), p.toString(), false, []);
    setSaving(false);
    if (err) { setMsg(err); return; }
    setOkMsg(`« ${(shownTitle || autoTitle).trim()} » est suivi. Les nouvelles annonces apparaîtront ici et dans vos messages.`);
    setMetiers([]); setTyping(''); setZone(''); setMin(''); setTypes([]); setTitle(''); setTitleTouched(false); setOpen(false);
    await refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {okMsg && <p role="status" className="rounded-[14px] border border-[#1F5F45] bg-[#123B2A] p-3 text-[14px] text-[#BBF7D0]">{okMsg}</p>}

      {!open ? (
        <button type="button" onClick={() => { setOpen(true); setOkMsg(null); }} disabled={list.length >= limit}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#C2410C] text-[15.5px] font-extrabold text-white disabled:opacity-50">
          <span aria-hidden className="text-[20px] leading-none">+</span> Nouveau suivi
        </button>
      ) : (
        <form onSubmit={e => { e.preventDefault(); void save(); }} className="flex flex-col gap-3 rounded-[14px] border border-[#22385A] bg-[#12233A] p-3">
          <div className="flex items-center justify-between">
            <b className="text-[16px]">Nouveau suivi</b>
            {list.length > 0 && <button type="button" onClick={() => setOpen(false)} className="min-h-[40px] px-2 text-[13px] text-[#B4C1D3] underline">Annuler</button>}
          </div>

          <div>
            <span className={label}>1. Votre métier</span>
            {metiers.length > 0 && <div className="mb-2 flex flex-wrap gap-2">{metiers.map(m => (
              <button key={m} type="button" onClick={() => setMetiers(metiers.filter(x => x !== m))} className={chip(true)} aria-label={`Retirer ${m}`}>{cap(m)} ×</button>))}</div>}
            <MetierAutocomplete id="suivi-metier" value={typing} onChange={setTyping} onPick={s => addMetier(s.q)} onSubmitFree={() => addMetier(typing)}
              placeholder={metiers.length ? 'Ajouter un autre métier (facultatif)' : 'Ex. : placo, plomberie, nettoyage…'} className={field} />
          </div>

          <div>
            <label htmlFor="suivi-zone" className={label}>2. Zone</label>
            <select id="suivi-zone" value={zone} onChange={e => setZone(e.target.value)} className={field}>
              <option value="">Toute la France</option>
              <optgroup label="Régions">{REGIONS.map(r => <option key={r[0]} value={`r:${r[0]}`}>{r[1]}</option>)}</optgroup>
              <optgroup label="Départements">{DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code} · {d.name}</option>)}</optgroup>
            </select>
          </div>

          <div>
            <label htmlFor="suivi-montant" className={label}>3. Montant du marché</label>
            <select id="suivi-montant" value={min} onChange={e => setMin(e.target.value)} className={field}>
              {AMOUNTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {min && <small className="mt-1 block text-[12px] text-[#8FA3BF]">Les annonces sans montant affiché restent incluses.</small>}
          </div>

          <div>
            <span className={label}>4. Type d’annonces</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Type d’annonces">
              <button type="button" aria-pressed={types.length === 0} className={chip(types.length === 0)} onClick={() => setTypes([])}>Tout</button>
              {TYPES.map(([k, l]) => { const on = types.includes(k); return (
                <button key={k} type="button" aria-pressed={on} className={chip(on)} onClick={() => setTypes(on ? types.filter(x => x !== k) : [...types, k])}>{l}</button>); })}
            </div>
          </div>

          <div>
            <label htmlFor="suivi-titre" className={label}>5. Nom du suivi</label>
            <input id="suivi-titre" value={shownTitle} onChange={e => { setTitle(e.target.value); setTitleTouched(true); }} maxLength={160} placeholder="Ex. : Placo Paris" className={field} />
          </div>

          <button type="submit" disabled={saving || (!allMetiers.length && !zone)} className="flex min-h-[52px] items-center justify-center rounded-xl bg-[#C2410C] text-[15.5px] font-extrabold text-white disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Suivre ces annonces'}
          </button>
        </form>
      )}

      {msg && <p role="alert" className="text-[13px] text-[#FCA5A5]">{msg}</p>}

      {list.length > 0 && <div className="flex flex-col gap-2">
        <b className="text-[14px] text-[#B4C1D3]">Mes suivis · {list.length} / {limit}{list.length >= limit ? ' — limite atteinte, supprimez-en un pour en ajouter' : ''}</b>
        {!canAlert && <p className="text-[12.5px] text-[#B4C1D3]">Gardés sur ce téléphone. <Link to="/connexion?next=/mon-espace?onglet=recherches" className="font-bold text-[#FB923C] underline">Connectez-vous</Link> pour les retrouver sur ordinateur et recevoir les nouveautés par e-mail.</p>}
        {list.map(s => { const n = fresh[s.id]; return (
          <div key={s.id} className="flex flex-col gap-2 rounded-[14px] border border-[#22385A] bg-[#12233A] p-3">
            <div className="flex items-center gap-2">
              {editing === s.id
                ? <form className="flex min-w-0 flex-1 gap-2" onSubmit={e => { e.preventDefault(); const l = draft.trim(); if (l) { void renameSearch(s.id, l).then(refresh).catch(e2 => setMsg(getApiErrorMessage(e2))); } setEditing(null); }}>
                    <input value={draft} onChange={e => setDraft(e.target.value)} aria-label="Nom du suivi" autoFocus maxLength={160} className="h-[44px] min-w-0 flex-1 rounded-lg border border-[#2B4468] bg-[#0A1628] px-3 text-[16px] text-[#F2F5F9]" />
                    <button type="submit" className="min-h-[44px] rounded-lg bg-[#C2410C] px-3 text-[14px] font-bold text-white">OK</button>
                  </form>
                : <Link to={`/vos-marches${s.query ? `?${s.query}` : ''}`} className="min-w-0 flex-1">
                    <b className="block text-[15px] leading-tight">{s.label}</b>
                    <span className="mt-0.5 block truncate text-[12.5px] text-[#B4C1D3]">{summary(s.query)}</span>
                  </Link>}
              {editing !== s.id && (n == null
                ? <span className="h-6 w-10 shrink-0 animate-pulse rounded-full bg-[#1E3352]" aria-hidden />
                : n > 0 ? <span className="shrink-0 rounded-full bg-[#F97316] px-2.5 py-1 text-[12px] font-extrabold text-white">{n} nouveau{n > 1 ? 'x' : ''}</span>
                : <span className="shrink-0 text-[12px] text-[#8FA3BF]">à jour</span>)}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[#1E3352] pt-1.5">
              {!s.id.startsWith('local-')
                ? <label className="flex min-h-[40px] items-center gap-2 text-[13px] text-[#D6E0EC]">
                    <input type="checkbox" checked={!!s.alert} disabled={!canAlert} onChange={e => { const on = e.target.checked; setList(l => l.map(x => x.id === s.id ? { ...x, alert: on } : x)); setSearchAlert(s.id, on).catch(e2 => { setMsg(getApiErrorMessage(e2)); setList(l => l.map(x => x.id === s.id ? { ...x, alert: !on } : x)); }); }} className="h-5 w-5 accent-[#F97316]" />
                    <span>{canAlert ? 'M’avertir par e-mail' : 'Alerte e-mail (connexion)'}</span>
                  </label>
                : <span />}
              <span className="flex shrink-0">
                <button type="button" aria-label="Renommer" onClick={() => { setEditing(s.id); setDraft(s.label); }} className="min-h-[44px] min-w-[44px] text-[15px] text-[#B4C1D3]">✎</button>
                <button type="button" aria-label="Supprimer ce suivi" onClick={() => { void removeSearch(s.id).then(refresh); setList(l => l.filter(x => x.id !== s.id)); }} className="min-h-[44px] min-w-[44px] text-[18px] text-[#B4C1D3]">×</button>
              </span>
            </div>
          </div>); })}
      </div>}
    </div>
  );
}
