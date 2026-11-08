import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { EspaceFil } from '@/lib/apiClient';
import { pushState, subscribePush } from '@/lib/pwa';

// 8 nov. (Hedi : « il faut que ce soit comme un jeu, qu'il ait envie de checker tous les midis », en restant
// professionnel). Les codes des applications qu'on ouvre par réflexe, appliqués à des données réelles :
//  - un bandeau « depuis votre dernière visite » (ce qui a changé, tout de suite) ;
//  - un cadre « en direct » avec voyant rouge, sur les marchés réellement attribués à des entreprises de la même
//    activité (une moyenne est dite « en moyenne », jamais présentée comme un fait d'hier) ;
//  - un carrousel « à ne pas manquer » à faire glisser, échéance la plus proche d'abord ;
//  - une jauge de profil (photo, suivi, notifications, compte) qui donne la prochaine étape.
const JOURNEY: Record<string, string> = { public_procurement: 'Marché public', tender: 'Privé', subcontracting: 'Sous-traitance' };
const dayName = (iso: string) => {
  const d = new Date(iso); const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff < 1) return 'tout à l’heure'; if (diff < 2) return 'hier';
  if (diff < 7) return d.toLocaleDateString('fr-FR', { weekday: 'long' });
  return `le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
};
const daysLeft = (d: string | null) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

export function SinceLastVisit({ fil }: { fil: EspaceFil }) {
  const prev = fil.visit?.prevSeenAt; if (!prev) return null;
  const msgs = fil.items.filter(i => i.unread && (i.kind === 'message' || i.kind === 'dossier')).length;
  const parts = [
    fil.summary.nouveautes ? { n: fil.summary.nouveautes, l: `nouvelle${fil.summary.nouveautes > 1 ? 's' : ''} annonce${fil.summary.nouveautes > 1 ? 's' : ''}`, to: '/mon-espace?onglet=recherches' } : null,
    fil.summary.echeances ? { n: fil.summary.echeances, l: `échéance${fil.summary.echeances > 1 ? 's' : ''} proche${fil.summary.echeances > 1 ? 's' : ''}`, to: '/mon-espace?onglet=favoris' } : null,
    msgs ? { n: msgs, l: `message${msgs > 1 ? 's' : ''}`, to: '/mon-espace' } : null,
  ].filter(Boolean) as { n: number; l: string; to: string }[];
  return (
    <section aria-label="Depuis votre dernière visite" className="rounded-[16px] border border-[#3B5A86] bg-gradient-to-br from-[#1B3354] to-[#12233A] p-3.5">
      <p className="text-[12px] font-extrabold uppercase tracking-[.06em] text-[#93C5FD]">Depuis votre dernière visite, {dayName(prev)}</p>
      {parts.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {parts.map(p => <Link key={p.l} to={p.to} className="flex min-h-[44px] items-baseline gap-1.5 rounded-xl bg-[#0A1628]/60 px-3 py-2">
            <b className="text-[22px] font-extrabold leading-none text-white">+{p.n >= 50 * Math.max(1, fil.searches) ? `${p.n}+` : p.n}</b><span className="text-[13px] font-bold text-[#D6E0EC]">{p.l}</span></Link>)}
        </div>
      ) : <p className="mt-1 text-[14px] text-[#D6E0EC]">Rien de nouveau dans vos suivis pour l’instant. {fil.searches ? 'On vous prévient dès qu’une annonce arrive.' : <Link to="/mon-espace?onglet=recherches" className="font-bold text-[#FB923C] underline">Créer un suivi</Link>}</p>}
    </section>
  );
}

export function MarketPulse({ fil }: { fil: EspaceFil }) {
  const p = fil.pouls; if (!p) return null;
  const perTxt = p.per === 'jour ouvré' ? 'chaque jour ouvré' : p.per === 'semaine' ? 'chaque semaine' : 'chaque mois';
  return (
    <section aria-label="Le marché en direct" className="relative overflow-hidden rounded-[16px] border border-[#7F1D1D] bg-[#1A1220] p-3.5">
      <p className="flex items-center gap-2 text-[11.5px] font-extrabold uppercase tracking-[.08em] text-[#FCA5A5]">
        <span className="md-live-dot h-2.5 w-2.5 rounded-full bg-[#EF4444]" aria-hidden /> Le marché en direct
      </p>
      <p className="mt-1.5 text-[17px] font-extrabold leading-snug text-white">
        En moyenne, <span className="text-[#FB923C]">{p.rate} entreprise{p.rate > 1 ? 's' : ''} {p.scope === 'trade' ? 'de votre métier' : 'comme la vôtre'}</span> décroche{p.rate > 1 ? 'nt' : ''} un marché public {perTxt}.
      </p>
      <p className="mt-1 text-[12.5px] text-[#C9B8C4]">{p.activity} · {p.zoneLabel} : {p.yearCount.toLocaleString('fr-FR')} marchés attribués sur les 12 derniers mois (données publiques des marchés notifiés).</p>
      {p.recent && <p className="mt-2 rounded-xl bg-[#0A1628]/60 p-2.5 text-[13px] text-[#E5D9E2]"><b className="capitalize">{p.recent.day}</b> : {p.recent.buyer || 'un acheteur public'} a attribué « {p.recent.objet} » à {p.recent.pme ? 'une PME' : 'une entreprise'}{p.recent.dept ? ` (${p.recent.dept})` : ''}.</p>}
      <Link to="/vos-marches" className="mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#DC2626] text-[15px] font-extrabold text-white">Et vous ? Voir mes marchés ouverts →</Link>
    </section>
  );
}

export function NotToMiss({ fil }: { fil: EspaceFil }) {
  const list = fil.aNePasManquer || []; if (!list.length) return null;
  return (
    <section aria-label="À ne pas manquer" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between"><b className="text-[16px]">À ne pas manquer</b><small className="text-[12px] text-[#8FA3BF]">faites glisser →</small></div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {list.map(x => { const d = daysLeft(x.deadline); return (
          <li key={x.id} className="w-[78%] max-w-[300px] shrink-0 snap-start">
            <Link to={`/opportunites/${x.id}`} className="flex h-full min-h-[150px] flex-col justify-between rounded-[16px] border border-[#22385A] bg-[#12233A] p-3">
              <div>
                <div className="mb-1.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                  {x.journey && <span className="rounded-full bg-[#3A2312] px-2 py-0.5 text-[#FDBA74]">{JOURNEY[x.journey] || 'Annonce'}</span>}
                  {d != null && d >= 0 && <span className={`rounded-full px-2 py-0.5 ${d <= 7 ? 'bg-[#3B1D1D] text-[#FCA5A5]' : 'bg-[#1E3352] text-[#D6E0EC]'}`}>{d === 0 ? 'Dernier jour' : `J-${d}`}</span>}
                </div>
                <b className="line-clamp-3 text-[14.5px] leading-snug">{x.title}</b>
                {x.lot && <p className="mt-1 line-clamp-1 text-[12.5px] font-bold text-[#FDBA74]">{x.lot}</p>}
              </div>
              <p className="mt-2 line-clamp-1 text-[12px] text-[#8FA3BF]">{[x.city, x.follow].filter(Boolean).join(' · ')}</p>
            </Link>
          </li>); })}
      </ul>
    </section>
  );
}

/** 8 nov. (Hedi : « ça prend trop de place, plutôt un petit truc en haut à droite, très discret ») : un anneau
 *  « Profil 20 % » ; un appui ouvre la liste des étapes, un second la referme. Disparaît à 100 %. */
export function ProfileProgress({ steps, sessionId, onPush }: { steps: { key: string; label: string; done: boolean; to?: string }[]; sessionId: string; onPush: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const done = steps.filter(s => s.done).length; const pct = Math.round((done / steps.length) * 100);
  if (pct === 100) return null;
  const R = 15, C = 2 * Math.PI * R;
  return (
    <div className="relative shrink-0">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={`Profil complété à ${pct} %`}
        className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#22385A] bg-[#0F1F35] py-1 pl-1 pr-2.5">
        <svg width="34" height="34" viewBox="0 0 36 36" aria-hidden>
          <circle cx="18" cy="18" r={R} fill="none" stroke="#1E3352" strokeWidth="4" />
          <circle cx="18" cy="18" r={R} fill="none" stroke="#FB923C" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(pct / 100) * C} ${C}`} transform="rotate(-90 18 18)" />
          <text x="18" y="22" textAnchor="middle" fontSize="10" fontWeight="800" fill="#F2F5F9">{pct}</text>
        </svg>
        <span className="text-[12px] font-bold text-[#B4C1D3]">Profil</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[50px] z-20 w-[270px] rounded-[14px] border border-[#2B4468] bg-[#0F1F35] p-3 shadow-xl">
          <b className="text-[13.5px]">Profil complété à {pct} %</b>
          <ul className="mt-2 flex flex-col gap-0.5 text-[13px]">
            {steps.map(s => (
              <li key={s.key}>
                {s.done ? <span className="flex min-h-[36px] items-center text-[#6EE7B7]">✓ {s.label}</span>
                  : s.key === 'push'
                    ? <button type="button" disabled={busy || pushState() === 'denied' || pushState() === 'unsupported'}
                        onClick={async () => { setBusy(true); await subscribePush(sessionId); setBusy(false); onPush(); }}
                        className="flex min-h-[36px] w-full items-center text-left font-bold text-[#FDBA74] disabled:font-normal disabled:text-[#8FA3BF]">
                        ○ {pushState() === 'unsupported' ? 'Notifications : ajoutez d’abord le site à l’écran d’accueil' : pushState() === 'denied' ? 'Notifications refusées dans les réglages' : busy ? '…' : `${s.label} (2 fois par semaine au plus) →`}
                      </button>
                    : s.to ? <Link to={s.to} onClick={() => setOpen(false)} className="flex min-h-[36px] items-center font-bold text-[#FDBA74]">○ {s.label} →</Link>
                    : <span className="flex min-h-[36px] items-center text-[#B4C1D3]">○ {s.label}</span>}
              </li>))}
          </ul>
        </div>)}
    </div>
  );
}
