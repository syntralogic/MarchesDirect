import { Link } from 'react-router-dom';
import type { EspaceFil, EspaceItem } from '@/lib/apiClient';

// 8 nov. (Hedi) : à la place de « Documents », la messagerie. Un seul fil, du plus récent au plus ancien : nouveautés
// des recherches suivies, échéances des annonces enregistrées, réponses d'Elena, avancement des dossiers. Les
// notifications téléphone et e-mail renvoient ici. Rien n'est inventé : chaque ligne vient du serveur.
const ICON: Record<EspaceItem['kind'], string> = { nouveautes: '✦', echeance: '⏱', message: '✉', dossier: '◆' };
const TONE: Record<EspaceItem['kind'], string> = {
  nouveautes: 'bg-[#3A2312] text-[#FDBA74]', echeance: 'bg-[#3B2A10] text-[#FCD34D]', message: 'bg-[#123B2A] text-[#6EE7B7]', dossier: 'bg-[#1E3352] text-[#93C5FD]',
};
const when = (iso: string, kind: EspaceItem['kind']) => {
  if (kind === 'echeance') return 'cette semaine';
  const d = new Date(iso); const diff = (Date.now() - d.getTime()) / 86400000;
  if (diff < 1 && d.getDate() === new Date().getDate()) return `aujourd’hui ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  if (diff < 2) return 'hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function MessagesTab({ fil, error, onRetry, onReadAll }: { fil: EspaceFil | null; error: boolean; onRetry: () => void; onReadAll: () => void }) {
  const card = 'rounded-[14px] border border-[#22385A] bg-[#12233A] p-3';
  if (error) return (
    <div role="alert" className={`${card} border-[#B45309] text-[14px] text-[#D6E0EC]`}>
      Vos messages n’ont pas pu être chargés. <button type="button" onClick={onRetry} className="min-h-[44px] font-bold text-[#FB923C] underline">Réessayer</button>
    </div>);
  if (!fil) return <div className="flex flex-col gap-2" aria-hidden>{[0, 1, 2].map(i => <div key={i} className="h-[74px] animate-pulse rounded-[14px] border border-[#22385A] bg-[#12233A]" />)}</div>;
  const unread = fil.items.filter(i => i.unread && (i.kind === 'message' || i.kind === 'dossier')).length;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Link to="/question" className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#C2410C] px-3 text-[14.5px] font-extrabold text-white">✉ Écrire à Elena</Link>
        {unread > 0 && <button type="button" onClick={onReadAll} className="min-h-[46px] shrink-0 rounded-xl border border-[#2B4468] px-3 text-[13px] font-bold text-[#D6E0EC]">Tout marquer lu</button>}
      </div>
      {fil.items.length === 0 ? (
        <div className={`${card} text-[14px] text-[#D6E0EC]`}>
          Rien de nouveau pour l’instant. Ici arrivent les nouvelles annonces de vos recherches suivies, les échéances de vos annonces enregistrées et les réponses d’Elena.
          {fil.searches === 0 && <Link to="/mon-espace?onglet=recherches" className="mt-3 flex min-h-[46px] items-center justify-center rounded-xl border-2 border-[#2B4468] font-bold">Suivre une recherche</Link>}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {fil.items.map(it => (
            <li key={it.id}>
              <Link to={it.link} className={`flex gap-3 ${card} ${it.unread ? 'border-[#3B5A86]' : ''}`}>
                <span aria-hidden className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[16px] ${TONE[it.kind]}`}>{ICON[it.kind]}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <b className={`text-[14.5px] leading-tight ${it.unread ? 'text-white' : 'text-[#D6E0EC]'}`}>{it.title}</b>
                    <small className="shrink-0 whitespace-nowrap text-[11.5px] text-[#8FA3BF]">{when(it.at, it.kind)}</small>
                  </span>
                  {it.detail && <span className="mt-0.5 line-clamp-2 block text-[13px] text-[#B4C1D3]">{it.detail}</span>}
                </span>
                {it.unread && <span aria-label="Non lu" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#F97316]" />}
              </Link>
            </li>))}
        </ul>)}
    </div>
  );
}
