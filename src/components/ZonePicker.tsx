import { DEPARTMENTS } from '@/data/departments';
import { REGIONS } from '@/data/zones';

// 8 nov. (Hedi : « qu'on puisse prendre plusieurs départements, partout : accueil, recherche, suivis ») : un seul
// sélecteur de zones. Chaque département ou région choisi devient une pastille ; « Ajouter » en ajoute d'autres.
// La valeur échangée est la liste des codes départements (« 75,91,93,59 »), comprise telle quelle par le moteur.
// Une région entière choisie s'affiche par son nom.
export function codesFromParam(v: string | null | undefined): string[] {
  return [...new Set(String(v || '').split(',').map(x => x.trim().toUpperCase()).filter(Boolean))];
}
/** Pastilles : les régions complètes regroupées sous leur nom, le reste par département. */
export function zoneTokens(codes: string[]): { key: string; label: string; codes: string[] }[] {
  const left = new Set(codes); const out: { key: string; label: string; codes: string[] }[] = [];
  for (const [k, name, ds] of REGIONS) if (ds.every(d => left.has(d))) { out.push({ key: `r:${k}`, label: name, codes: ds }); ds.forEach(d => left.delete(d)); }
  for (const c of codes) if (left.has(c)) { const d = DEPARTMENTS.find(x => x.code === c); out.push({ key: c, label: d ? `${d.name} (${c})` : c, codes: [c] }); }
  return out;
}

export default function ZonePicker({ value, onChange, id, selectClassName, chipClassName, light }: {
  value: string[]; onChange: (codes: string[]) => void; id?: string; selectClassName: string; chipClassName?: string; light?: boolean;
}) {
  const tokens = zoneTokens(value);
  const add = (v: string) => {
    if (!v) return;
    if (v === 'france') { onChange([]); return; }
    const more = v.startsWith('r:') ? (REGIONS.find(r => r[0] === v.slice(2))?.[2] || []) : [v];
    onChange([...new Set([...value, ...more])].slice(0, 40));
  };
  const chip = chipClassName || `min-h-[40px] rounded-full border px-3 text-[14px] font-bold ${light ? 'border-[#F97316] bg-[#FFF1E6] text-[#9A3412]' : 'border-[#FB923C] bg-[#3A2312] text-[#FDBA74]'}`;
  return (
    <div className="flex flex-col gap-2">
      {tokens.length > 0 && <div className="flex flex-wrap gap-2">
        {tokens.map(t => <button key={t.key} type="button" className={chip} aria-label={`Retirer ${t.label}`} onClick={() => onChange(value.filter(c => !t.codes.includes(c)))}>{t.label} ×</button>)}
      </div>}
      <select id={id} value="" onChange={e => add(e.target.value)} className={selectClassName} aria-label={tokens.length ? 'Ajouter une zone' : 'Zone'}>
        <option value="">{tokens.length ? '+ Ajouter un département ou une région' : 'Toute la France (ou choisissez)'}</option>
        {tokens.length > 0 && <option value="france">Toute la France</option>}
        <optgroup label="Régions">{REGIONS.map(r => <option key={r[0]} value={`r:${r[0]}`} disabled={r[2].every(d => value.includes(d))}>{r[1]}</option>)}</optgroup>
        <optgroup label="Départements">{DEPARTMENTS.map(d => <option key={d.code} value={d.code} disabled={value.includes(d.code)}>{d.code} – {d.name}</option>)}</optgroup>
      </select>
    </div>
  );
}
