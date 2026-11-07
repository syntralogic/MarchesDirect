import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { suggestMetiers, type MetierSuggestion } from '@/data/tradeFamilies';

// 7 nov. : autocomplétion du métier (téléphone et ordinateur). Les suggestions sont calculées localement à chaque
// lettre, sans requête. La liste est dans le flux (pas en surimpression) : avec le clavier ouvert sur téléphone,
// elle reste visible sous le champ. Flèches / Entrée / Échap au clavier ; la saisie libre reste toujours possible
// (Entrée sans suggestion choisie = recherche du texte tapé).
interface Props {
  value: string;
  onChange: (v: string) => void;
  onPick: (s: MetierSuggestion) => void;   // appui sur une suggestion : lance la recherche
  onSubmitFree?: () => void;               // Entrée sans suggestion active
  id?: string;
  placeholder?: string;
  className: string;                       // classes du champ
  autoFocus?: boolean;
  compact?: boolean;
}

export default function MetierAutocomplete({ value, onChange, onPick, onSubmitFree, id, placeholder, className, autoFocus, compact }: Props) {
  const uid = useId();
  const inputId = id || `metier-${uid}`;
  const listId = `${inputId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrap = useRef<HTMLDivElement>(null);
  const items = useMemo(() => suggestMetiers(value, 6), [value]);
  const show = open && items.length > 0;

  useEffect(() => { setActive(-1); }, [value]);
  useEffect(() => {
    const onDoc = (e: MouseEvent | TouchEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc); document.addEventListener('touchstart', onDoc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('touchstart', onDoc); };
  }, []);

  const pick = (s: MetierSuggestion) => { setOpen(false); onChange(s.label.replace(/^.*\+ /, '')); onPick(s); };

  return (
    <div ref={wrap} className="flex flex-col gap-1">
      <input
        id={inputId} value={value} onChange={e => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        placeholder={placeholder} className={className} autoFocus={autoFocus}
        autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="search"
        role="combobox" aria-expanded={show} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); setOpen(true); setActive(a => (a + 1) % items.length); }
          else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); setActive(a => (a <= 0 ? items.length - 1 : a - 1)); }
          else if (e.key === 'Escape') { setOpen(false); setActive(-1); }
          else if (e.key === 'Enter') { if (show && active >= 0) { e.preventDefault(); pick(items[active]); } else { setOpen(false); onSubmitFree?.(); } }
        }}
      />
      {show && (
        <ul id={listId} role="listbox" aria-label="Métiers suggérés" className="overflow-hidden rounded-xl border border-[#2B4468] bg-[#12233A]">
          {items.map((s, i) => (
            <li key={`${s.q}|${s.focus || ''}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => pick(s)} onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between gap-2 px-3 text-left text-[15px] ${compact ? 'min-h-[44px]' : 'min-h-[48px]'} ${i === active ? 'bg-[#1E3352]' : ''} ${i > 0 ? 'border-t border-[#1E3352]' : ''}`}>
                <span className={`min-w-0 truncate ${s.focus ? 'text-[#D6E0EC]' : 'font-bold text-[#F2F5F9]'}`}>{s.label}</span>
                <span className="shrink-0 text-[12px] text-[#8FA3BF]">{s.focus ? 'prestation' : 'métier'}</span>
              </button>
            </li>))}
        </ul>)}
    </div>
  );
}
