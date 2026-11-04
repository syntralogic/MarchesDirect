// Écran 2 de la refonte (maquette v26): « Vos marchés », la liste classée. Pourcentages par les règles du moteur existant
// (match-score), jamais par l'IA ; les cartes apparaissent tout de suite, les pourcentages se remplissent ensuite.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { opportunitiesApi, siretApi, type ApiSiretStatus } from '@/lib/apiClient';
import { getSessionId, trackVisitorEvent } from '@/lib/visitorTracking';
import { formatDeadlineExact } from '@/lib/deadlineFormat';
import {
  TYPE_LABEL, applyFilter, counts, daysLeft, isClosingSoon, labelOf, mapLimit, rank, titleFor, toneOf, topScores,
  type Filter, type RankedCard, type ScoreMap,
} from '@/lib/rankedList';

const RING = { hi: '#34D399', mid: '#FDBA74', lo: '#6B7A90' } as const;
const CHIPS: { key: Filter; label: string }[] = [{ key: 'all', label: 'Tous' }, { key: 'hi', label: 'Très adaptés' }, { key: 'mid', label: 'À étudier' }, { key: 'lo', label: 'Peu adaptés' }];
// 5 Nov (retour client) : le visiteur doit voir qu'il n'y a pas que du marché public.
// Filtre par type, visible dès la recherche simple comme sur la liste par entreprise.
type Journey = 'all' | 'public_procurement' | 'tender' | 'subcontracting';
const TYPE_CHIPS: { key: Journey; label: string }[] = [
  { key: 'all', label: 'Tous les types' }, { key: 'public_procurement', label: 'Marchés publics' },
  { key: 'tender', label: 'Appels d’offres privés' }, { key: 'subcontracting', label: 'Sous-traitance' },
];
const btn = 'flex min-h-[54px] w-full items-center justify-center rounded-[14px] bg-[#C2410C] px-4 py-2 text-center text-[17px] font-extrabold text-white';

function Ring({ score }: { score: number | null | undefined }) {
  const tone = typeof score === 'number' ? toneOf(score) : null;
  return (
    <div className="flex w-[76px] shrink-0 flex-col items-center gap-1.5">
      {score === undefined
        ? <div className="h-[64px] w-[64px] animate-pulse rounded-full bg-[#1E3352]" aria-label="Calcul en cours" />
        : <svg viewBox="0 0 64 64" className="h-[64px] w-[64px]" role="img" aria-label={typeof score === 'number' ? `Correspondance ${score} %` : 'Correspondance à confirmer'}>
            <circle cx="32" cy="32" r="27" fill="none" stroke="#1E3352" strokeWidth="6" />
            {typeof score === 'number' && <circle cx="32" cy="32" r="27" fill="none" stroke={RING[toneOf(score)]} strokeWidth="6" strokeLinecap="round" strokeDasharray="169.6" strokeDashoffset={169.6 * (1 - score / 100)} transform="rotate(-90 32 32)" />}
            <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="800" fill="#F2F5F9">{typeof score === 'number' ? `${score} %` : '— %'}</text>
          </svg>}
      <span className="text-center text-[12px] font-bold leading-tight" style={{ color: tone ? RING[tone] : '#B4C1D3' }}>
        {typeof score === 'number' ? labelOf(score) : score === null ? 'À confirmer' : ''}
      </span>
    </div>
  );
}

function Card({ c, score, withScore }: { c: RankedCard; score: number | null | undefined; withScore: boolean }) {
  const n = daysLeft(c.deadline);
  const dept = c.location_department ? ` (${c.location_department})` : '';
  // Un acheteur réduit à son SIREN (« 110068012 ») n'aide pas le visiteur ;
  // et quand l'acheteur et la ville sont le même libellé (« Mairie d'Izon ·
  // Mairie d'Izon (33) »), on ne l'écrit qu'une fois.
  const buyer = c.buyer_name && !/^\d{9,14}$/.test(c.buyer_name.trim()) ? c.buyer_name.trim() : null;
  const place = c.location_city && c.location_city.trim() !== buyer ? `${c.location_city.trim()}${dept}` : dept.trim();
  return (
    <Link to={`/opportunites/${c.id}`} className="flex gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-3.5 text-[#F2F5F9]">
      {withScore ? <Ring score={score} /> : <div className="flex w-[76px] shrink-0 flex-col items-center gap-1.5"><div className="flex h-[64px] w-[64px] items-center justify-center rounded-full border-4 border-[#1E3352] text-[15px] font-extrabold">— %</div><span className="text-center text-[12px] font-bold text-[#FB923C]">Voir mon %</span></div>}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span className="text-[#FDBA74]">{TYPE_LABEL[c.journey || ''] || 'MARCHÉ'}</span>
          {isClosingSoon(c.deadline) && <span className="rounded-full bg-[#3A2312] px-2 py-0.5 text-[#FDBA74]">Bientôt clos</span>}
        </div>
        <h3 className="line-clamp-3 text-[16px] font-extrabold leading-snug">{c.title}</h3>
        <p className="text-[13px] text-[#B4C1D3]">{[buyer, place].filter(Boolean).join(' · ')}</p>
        <p className="text-[13px] text-[#D6E0EC]">{formatDeadlineExact(c.deadline) ? `Réponse avant le ${formatDeadlineExact(c.deadline)}${n != null && n >= 0 ? ` · J-${n}` : ''}` : 'Date limite non précisée'}</p>
        <span className="text-[14px] font-bold text-[#FB923C]">Voir le marché ›</span>
      </div>
    </Link>
  );
}

export default function ListeMarchesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const sessionId = useMemo(() => getSessionId(), []);
  const zoneParam = params.get('zone') || undefined;
  const tradeId = params.get('trade_id') || undefined;
  const q = params.get('q') || undefined; // recherche simple par métier (mots-clés)
  const dept = params.get('department') || undefined;

  const [status, setStatus] = useState<ApiSiretStatus | null | undefined>(undefined);
  const [cards, setCards] = useState<RankedCard[] | null>(null);
  const [scores, setScores] = useState<ScoreMap>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [type, setType] = useState<Journey>('all');
  const [tradeUnknown, setTradeUnknown] = useState(false);
  const [zoneLabel, setZoneLabel] = useState('Toute la France');
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const shown = useRef('');
  const run = useRef(0); // a newer load (zone widened, company changed) makes the older one stop writing
  const known = !!status?.companyKnown;

  useEffect(() => { siretApi.status(sessionId).then(setStatus).catch(() => setStatus(null)); }, [sessionId]);

  // Cards first (SQL only), then one percentage at a time from the rules engine, 4 in flight.
  const load = useCallback(async () => {
    setCards(null); setScores({}); setDone(false); setError(false); setTradeUnknown(false); shown.current = '';
    const mine = ++run.current;
    const stop = () => run.current !== mine;
    try {
      if (known) {
        const r = await opportunitiesApi.rankedCandidates(sessionId, zoneParam);
        if (stop()) return;
        setZoneLabel(r.zone === 'france' ? 'Toute la France' : `Département ${r.zone}`);
        setTradeUnknown(r.reason === 'trade_unknown');
        setCards(r.items);
        await mapLimit(r.items, 4, async c => {
          try { const s = await opportunitiesApi.getMatchScore(c.id, sessionId); setScores(p => ({ ...p, [c.id]: s.score })); }
          catch { setScores(p => ({ ...p, [c.id]: null })); }
        }, stop);
        if (!stop()) setDone(true);
      } else if (tradeId || q || dept) {
        const r = await opportunitiesApi.search({ ...(tradeId ? { trade_id: tradeId } : {}), ...(q ? { q } : {}), ...(dept ? { department: dept } : {}), status: 'active', limit: 40 });
        if (stop()) return;
        setZoneLabel(dept ? `Département ${dept}` : 'Toute la France');
        setCards(r.results.map(o => ({ id: o.id, title: o.title, journey: o.journey, buyer_name: o.buyer_name ?? null, location_city: o.location_city ?? null, location_department: o.location_department ?? null, deadline: o.deadline })));
      } else setCards([]);
    } catch { if (!stop()) setError(true); }
  }, [known, sessionId, zoneParam, tradeId, q, dept]);
  useEffect(() => { if (status !== undefined) void load(); }, [status, zoneParam, tradeId, q, dept]); // eslint-disable-line react-hooks/exhaustive-deps

  const ranked = useMemo(() => (cards ? (done ? rank(cards, scores) : cards) : []), [cards, scores, done]);
  const n = useMemo(() => counts(ranked, scores), [ranked, scores]);
  const byType = useMemo(() => type === 'all' ? ranked : ranked.filter(c => c.journey === type), [ranked, type]);
  const typeCounts = useMemo(() => ranked.reduce<Record<string, number>>((acc, c) => { acc[c.journey || ''] = (acc[c.journey || ''] || 0) + 1; return acc; }, {}), [ranked]);
  const visible = applyFilter(byType, scores, filter);

  // ranked_list_shown: once, when every percentage is in (SIRET, number of markets, three best percentages).
  useEffect(() => {
    if (!known || !done || !cards || shown.current === status?.siret) return;
    shown.current = status?.siret || 'x';
    trackVisitorEvent('ranked_list_shown', 'Liste classée affichée', undefined, { siret: status?.siret, count: cards.length, top3: topScores(scores) });
  }, [done, known, cards, scores, status?.siret]);

  const identify = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) { setFormError('Indiquez le nom de votre entreprise ou votre SIRET.'); return; }
    setBusy(true); setFormError(null);
    try {
      const s = await siretApi.lookup(q, sessionId);
      if (s.companyKnown) { setStatus(s); trackVisitorEvent('company_selected', 'Entreprise sélectionnée', undefined, { siret: s.siret }); }
      else setFormError(s.candidates?.length ? 'Plusieurs entreprises correspondent : précisez avec le SIRET (14 chiffres).' : 'Nous ne trouvons pas cette entreprise. Vérifiez le nom ou saisissez le SIRET.');
    } catch { setFormError('La recherche n’a pas abouti. Réessayez dans un instant.'); }
    finally { setBusy(false); }
  };

  const total = cards?.length ?? 0;
  // No company and no trade chosen: nothing to count yet, so no "0 marché".
  const { title, sub } = known || total > 0 ? titleFor(total, known, q, zoneLabel) : { title: 'Vos marchés', sub: 'Indiquez votre entreprise (nom ou SIRET) pour voir le pourcentage de chaque marché' };
  const c = status?.company;
  const pending = cards ? cards.filter(x => scores[x.id] === undefined).length : 0;

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-5 bg-[#0A1628] px-4 pb-44 pt-3 text-[#F2F5F9]" style={{ fontFamily: '"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif' }}>
      <ol className="flex text-center text-[13px]" aria-label="Étapes">
        {['Vos marchés', 'Mon analyse', 'Mon dossier'].map((s, i) => (
          <li key={s} className={`flex flex-1 flex-col items-center gap-1.5 ${i === 0 ? 'font-bold text-[#FB923C]' : 'text-[#B4C1D3]'}`} aria-current={i === 0 ? 'step' : undefined}>
            <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 text-[14px] font-extrabold ${i === 0 ? 'border-[#C2410C] bg-[#C2410C] text-white' : 'border-[#2B4468]'}`}>{i + 1}</span>{s}
          </li>))}
      </ol>

      {known && c && (
        <div className="flex items-center gap-2 rounded-xl bg-[#123B2A] px-3 py-2 text-[13px] text-[#6EE7B7]">
          <span aria-hidden>✓</span>
          <span className="min-w-0 flex-1">{[c.name, c.activity && c.activity.length <= 40 ? c.activity : null, c.city ? `${c.city}${c.postal ? ` (${c.postal.slice(0, 2)})` : ''}` : null].filter(Boolean).join(' · ')}</span>
          <button type="button" onClick={() => navigate('/', { state: { focusCompany: true } })} className="min-h-[44px] min-w-[44px] font-bold underline">Modifier</button>
        </div>)}

      <header className="flex flex-col gap-1">
        <h1 className="text-[22px] font-extrabold leading-tight">{cards ? title : 'Vos marchés'}</h1>
        {cards && <p className="text-[14px] text-[#B4C1D3]">{sub}</p>}
        {known && cards && !done && pending > 0 && <p className="text-[13px] text-[#FDBA74]" role="status">Calcul des pourcentages… {total - pending} / {total}</p>}
      </header>

      {cards && cards.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filtrer par type de marché">
          {TYPE_CHIPS.map(ch => {
            const count = ch.key === 'all' ? ranked.length : (typeCounts[ch.key] || 0);
            return (
              <button key={ch.key} type="button" aria-pressed={type === ch.key} onClick={() => setType(ch.key)}
                className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[14px] font-bold ${type === ch.key ? 'border-[#FB923C] bg-[#3A2312] text-[#FDBA74]' : count === 0 ? 'border-[#1E3352] text-[#6B7A90]' : 'border-[#2B4468] text-[#D6E0EC]'}`}>
                {ch.label} ({count})
              </button>);
          })}
        </div>)}

      {known && cards && cards.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par correspondance">
          {CHIPS.map(ch => (
            <button key={ch.key} type="button" aria-pressed={filter === ch.key} onClick={() => setFilter(ch.key)}
              className={`min-h-[44px] rounded-full border px-3.5 text-[14px] font-bold ${filter === ch.key ? 'border-[#FB923C] bg-[#3A2312] text-[#FDBA74]' : 'border-[#2B4468] text-[#D6E0EC]'}`}>
              {ch.label} ({n[ch.key]})
            </button>))}
        </div>)}

      {error && <p role="alert" className="text-[14px] text-[#FCA5A5]">La liste n’a pas pu être chargée. <button type="button" onClick={() => void load()} className="min-h-[44px] font-bold underline">Réessayer</button></p>}
      {cards === null && !error && <div className="flex flex-col gap-2.5" aria-busy="true">{[0, 1, 2].map(i => <div key={i} className="h-[150px] animate-pulse rounded-2xl bg-[#12233A]" />)}</div>}

      {cards && cards.length > 0 && <div className="flex flex-col gap-2.5">{visible.map(card => <Card key={card.id} c={card} score={scores[card.id]} withScore={known} />)}</div>}
      {cards && cards.length > 0 && visible.length === 0 && (
        <p className="text-[14px] text-[#B4C1D3]">
          {type !== 'all' && byType.length === 0 ? `Aucun ${TYPE_CHIPS.find(t => t.key === type)?.label.toLowerCase()} pour cette recherche aujourd’hui. ` : 'Aucun marché dans cette catégorie pour le moment. '}
          <button type="button" onClick={() => { setType('all'); setFilter('all'); }} className="min-h-[44px] font-bold text-[#FB923C] underline">Voir tous les types</button>
        </p>)}

      {cards && cards.length === 0 && !error && (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-5 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth="1.5" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <h2 className="text-[18px] font-extrabold">{known || q || dept ? 'Aucun marché ouvert aujourd’hui pour cette recherche' : 'Indiquez votre entreprise pour voir vos marchés'}</h2>
          <p className="text-[14px] text-[#D6E0EC]">{tradeUnknown ? 'Nous n’avons pas pu déduire votre métier à partir de votre entreprise.' : known || q || dept ? 'Les marchés changent chaque jour. Vous pouvez élargir la zone ou changer de mot-clé.' : 'Nom ou SIRET : le résultat s’affiche ici, classé par pourcentage.'}</p>
          {((known && zoneParam !== 'france') || dept) && !tradeUnknown && <button type="button" onClick={() => { const p = new URLSearchParams(params); p.set('zone', 'france'); p.delete('department'); setParams(p); }} className={btn}>Élargir à toute la France</button>}
          {known && <p className="text-[13px] text-[#B4C1D3]">Votre activité n’apparaît pas ? <Link to="/contact" className="font-bold text-[#FB923C] underline">Dites-le nous</Link>, nous vous répondons.</p>}
          {known || q || dept
            ? <Link to="/?mode=metier" className="min-h-[44px] py-3 text-[14px] font-semibold text-[#FB923C] underline">Changer de métier ou de zone</Link>
            : <Link to="/?mode=metier" className={btn}>Chercher par métier et par zone</Link>}
          {!(known || q || dept) && <p className="text-[13px] text-[#B4C1D3]">Marchés publics, appels d’offres privés et sous-traitance : sans entreprise, vous voyez les marchés sans leur pourcentage.</p>}
        </section>)}

      {!known && status !== undefined && (
        <div className="fixed inset-x-0 bottom-[65px] z-30 border-t md:bottom-0 border-[#22385A] bg-[#0A1628]/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <form onSubmit={identify} className="mx-auto flex max-w-[560px] flex-col gap-2">
            <div className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)} aria-label="Nom de votre entreprise ou SIRET" placeholder="Entreprise ou SIRET" autoComplete="organization" enterKeyHint="go"
                className="h-[52px] min-w-0 flex-1 rounded-xl border border-[#2B4468] bg-[#0A1628] px-3.5 text-[16px] text-[#F2F5F9]" />
              <button type="submit" disabled={busy} className="min-h-[52px] shrink-0 rounded-[14px] bg-[#C2410C] px-4 font-extrabold text-white">{busy ? '…' : 'Voir mon %'}</button>
            </div>
            {formError && <p role="alert" className="text-[13px] text-[#FCA5A5]">{formError}</p>}
          </form>
        </div>)}
    </main>
  );
}
