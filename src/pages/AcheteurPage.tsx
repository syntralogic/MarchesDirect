import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { seoV2Api, awardsApi, type BuyerAwardsData } from '@/lib/apiClient';
import { buyerDescription, buyerIntro, buyerPath, buyerTitle, frDay, n, type BuyerCard, type BuyerData } from '@/lib/acheteur';

// Page acheteur (7 nov.) : mêmes textes que le pré-rendu serveur (api/prerender.ts, kind=acheteur).
const JOURNEY: Record<string, string> = { public_procurement: 'Marché public', tender: 'Appel d’offres privé', subcontracting: 'Sous-traitance' };

function Card({ c }: { c: BuyerCard }) {
  return (
    <li className="rounded-[14px] border border-[#22385A] bg-[#12233A] p-3">
      <Link to={c.path} className="font-bold text-[#F2F5F9] hover:text-[#FB923C]">{c.title}</Link>
      <p className="mt-1 text-[12.5px] text-[#B4C1D3]">
        {JOURNEY[c.journey] || 'Consultation'}
        {c.place ? ` · ${c.place}` : ''}
        {c.state === 'open' && c.deadline ? ` · date limite le ${frDay(c.deadline)}` : ''}
        {c.state === 'closed' ? ` · clôturée${c.deadline ? ` le ${frDay(c.deadline)}` : ''}` : ''}
        {c.state === 'verify' ? ' · date limite à vérifier dans l’avis' : ''}
        {c.trades.length ? ` · ${c.trades.map(t => t.name).join(', ')}` : ''}
      </p>
    </li>
  );
}

// 7 nov. : habitudes de l'acheteur d'après ses marchés attribués (DECP) : mois, familles, part de PME, offres reçues.
function BuyerHabits({ name, h2 }: { name: string; h2: string }) {
  const [d, setD] = useState<BuyerAwardsData | null>(null);
  useEffect(() => { setD(null); awardsApi.buyer(name).then(setD).catch(() => setD(null)); }, [name]);
  if (!d || !d.available) return null;
  const M = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']; const max = Math.max(1, ...(d.byMonth || []));
  return (<>
    <h2 className={h2}>Ses habitudes d’attribution</h2>
    <p className="text-[14.5px] text-[#F2F5F9]">{d.seasonText}</p>
    <div className="mt-2 flex items-end gap-1" aria-label="Marchés attribués par mois">
      {(d.byMonth || []).map((v, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><div className={`w-full rounded-t ${d.peakMonths?.includes(i + 1) ? 'bg-[#FB923C]' : 'bg-[#2B4468]'}`} style={{ height: `${Math.max(3, Math.round(v / max * 48))}px` }} title={`${v}`} /><span className="text-[10px] text-[#93A4BC]">{M[i]}</span></div>)}
    </div>
    <p className="mt-2 text-[13.5px] text-[#D6E0EC]">{[d.topTypes?.length ? `Surtout : ${d.topTypes.map(t => t.label).join(', ')}.` : null, d.pmeText, d.offersText, d.medianAmount ? `Montant médian ${Math.round(d.medianAmount).toLocaleString('fr-FR')} € HT.` : null].filter(Boolean).join(' ')}</p>
    <p className="text-[12px] text-[#93A4BC]">Source : contrats attribués publiés par les acheteurs publics (DECP, Licence Ouverte).</p>
  </>);
}

export default function AcheteurPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [b, setB] = useState<BuyerData | null | undefined>(undefined);
  useEffect(() => { setB(undefined); seoV2Api.acheteur(slug).then(setB).catch(() => setB(null)); }, [slug]);
  const shell = 'mx-auto w-full max-w-[760px] px-4 pb-24 pt-5 text-[#F2F5F9]';
  if (b === undefined) return <main className={shell} aria-busy="true"><div className="h-8 w-2/3 animate-pulse rounded bg-[#12233A]" /><div className="mt-4 h-40 animate-pulse rounded-[14px] bg-[#12233A]" /></main>;
  if (b === null) return <main className={shell}><PageMeta title="Acheteur introuvable | Marchés Direct" description="Cet acheteur n’a pas de consultation récente." noindex /><h1 className="text-[22px] font-extrabold">Acheteur introuvable</h1><p className="mt-2 text-[#D6E0EC]">Cet acheteur n’a pas publié de consultation ces six derniers mois.</p><Link to="/marches-publics" className="mt-3 inline-block font-bold text-[#FB923C] underline">Voir tous les marchés publics</Link></main>;
  const h2 = 'mb-2 mt-7 text-[19px] font-extrabold';
  return (
    <main className={shell}>
      <PageMeta title={buyerTitle(b)} description={buyerDescription(b)} canonicalPath={buyerPath(b.slug)} noindex={!b.indexable} />
      <nav aria-label="Fil d’Ariane" className="text-[12.5px] text-[#B4C1D3]"><Link to="/" className="underline">Accueil</Link> › <Link to="/marches-publics" className="underline">Marchés publics</Link>{b.dept && <> › <Link to={`/marches-publics/departement/${b.dept.toLowerCase()}`} className="underline">{b.deptName} ({b.dept})</Link></>} › {b.name}</nav>
      <h1 className="mt-2 text-[25px] font-extrabold leading-tight md:text-[30px]">{b.name} : marchés publics et appels d’offres</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-[#D6E0EC]">{buyerIntro(b)}</p>
      <section className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-[14px] border border-[#22385A] bg-[#12233A] p-3"><p className="text-[22px] font-extrabold">{n(b.counts.open)}</p><p className="text-[12.5px] text-[#B4C1D3]">ouvertes</p></div>
        <div className="rounded-[14px] border border-[#22385A] bg-[#12233A] p-3"><p className="text-[22px] font-extrabold">{n(b.counts.total)}</p><p className="text-[12.5px] text-[#B4C1D3]">en 6 mois</p></div>
        <div className="rounded-[14px] border border-[#22385A] bg-[#12233A] p-3"><p className="text-[22px] font-extrabold">{n(b.topTrades.length)}</p><p className="text-[12.5px] text-[#B4C1D3]">métiers concernés</p></div>
      </section>
      <div className="mt-5 rounded-[14px] border border-[#FB923C]/40 bg-[#1A2B44] p-4">
        <p className="text-[15px] font-bold">Répondre aux marchés de {b.name} ?</p>
        <p className="mt-1 text-[13.5px] text-[#D6E0EC]">Indiquez votre SIRET : nous trouvons les consultations qui correspondent à votre activité et nous vous accompagnons jusqu’au dépôt.</p>
        <Link to="/" className="mt-3 inline-block rounded-full bg-[#FB923C] px-4 py-2 text-[14px] font-bold text-[#0A1628]">Trouver mes marchés</Link>
      </div>
      <h2 className={h2}>Consultations ouvertes ({n(b.counts.open)})</h2>
      {b.open.length ? <ul className="flex flex-col gap-2">{b.open.map(c => <Card key={c.id} c={c} />)}</ul> : <p className="text-[14px] text-[#D6E0EC]">Aucune consultation ouverte aujourd’hui. Les consultations récentes ci-dessous montrent ce que cet acheteur commande habituellement.</p>}
      {b.verify.length > 0 && <><h2 className={h2}>Date limite à vérifier ({n(b.counts.verify)})</h2><ul className="flex flex-col gap-2">{b.verify.map(c => <Card key={c.id} c={c} />)}</ul></>}
      <BuyerHabits name={b.name} h2={h2} />
      {b.topTrades.length > 0 && <><h2 className={h2}>Métiers recherchés par cet acheteur</h2><p className="text-[14px] text-[#D6E0EC]">{b.topTrades.map(t => `${t.name} (${n(t.count)})`).join(' · ')}</p></>}
      {b.closed.length > 0 && <><h2 className={h2}>Consultations des six derniers mois ({n(b.counts.closed)} clôturées)</h2><ul className="flex flex-col gap-2">{b.closed.map(c => <Card key={c.id} c={c} />)}</ul></>}
      {b.otherBuyers.length > 0 && <><h2 className={h2}>Autres acheteurs publics {b.deptName ? `en ${b.deptName}` : ''}</h2>
        <ul className="flex flex-wrap gap-2">{b.otherBuyers.map(o => <li key={o.slug}><Link to={buyerPath(o.slug)} className="inline-block rounded-full border border-[#22385A] px-3 py-1 text-[13px] text-[#D6E0EC] hover:border-[#FB923C]">{o.name}{o.open ? ` (${n(o.open)})` : ''}</Link></li>)}</ul></>}
      <p className="mt-6 text-[12.5px] text-[#B4C1D3]">Mis à jour le {frDay(b.generatedAt)}. Source : avis publiés au BOAMP et au Journal officiel de l’Union européenne. <Link to="/guides" className="underline">Guides pour répondre</Link> · <Link to="/barometre-marches-publics" className="underline">Baromètre des marchés publics</Link></p>
    </main>
  );
}
