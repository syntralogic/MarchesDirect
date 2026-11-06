import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { seoV2Api } from '@/lib/apiClient';
import { BARO_METHOD, BARO_PATH, baroDate, baroDescription, baroTime, baroTitle, euros, n, pct, type Barometre } from '@/lib/barometre';

// Baromètre des marchés publics (6 nov.) : mêmes textes que le pré-rendu serveur (api/prerender.ts, kind=barometre).
const slugDept = (code: string) => `/marches-publics/departement/${code.toLowerCase()}`;

export default function BarometrePage() {
  const [b, setB] = useState<Barometre | null | undefined>(undefined);
  const [allDepts, setAllDepts] = useState(false);
  useEffect(() => { seoV2Api.barometre().then(setB).catch(() => setB(null)); }, []);
  const shell = 'mx-auto w-full max-w-[760px] px-4 pb-24 pt-5 text-[#F2F5F9]';
  if (b === undefined) return <main className={shell} aria-busy="true"><div className="h-8 w-2/3 animate-pulse rounded bg-[#12233A]" /><div className="mt-4 h-40 animate-pulse rounded-[14px] bg-[#12233A]" /></main>;
  if (b === null) return <main className={shell}><PageMeta title="Baromètre des marchés publics | Marchés Direct" description="Baromètre temporairement indisponible." noindex /><h1 className="text-[22px] font-extrabold">Baromètre temporairement indisponible</h1><p className="mt-2 text-[#D6E0EC]">Réessayez dans quelques minutes.</p></main>;
  const N = b.national; const depts = allDepts ? b.departments : b.departments.slice(0, 20);
  const card = 'rounded-[14px] border border-[#22385A] bg-[#12233A] p-3';
  const th = 'border-b border-[#22385A] px-2 py-1.5 text-left text-[12px] font-bold text-[#B4C1D3]';
  const td = 'border-b border-[#22385A] px-2 py-1.5 align-top';
  return (
    <main className={shell}>
      <PageMeta title={baroTitle(b)} description={baroDescription(b)} canonicalPath={BARO_PATH} />
      <p className="text-[12px] font-extrabold uppercase tracking-[.06em] text-[#FB923C]">Baromètre · {baroDate(b.generatedAt)} à {baroTime(b.generatedAt)}</p>
      <h1 className="mt-1 text-[25px] font-extrabold leading-tight md:text-[32px]">Baromètre des marchés publics en France</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-[#D6E0EC]">Combien de consultations publiques sont ouvertes aujourd’hui, où, et dans quels métiers : un état du jour calculé sur les avis publiés, avec sa méthode.</p>

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className={card}><p className="text-[24px] font-extrabold">{n(N.open)}</p><p className="text-[12.5px] text-[#B4C1D3]">consultations ouvertes</p></div>
        <div className={card}><p className="text-[24px] font-extrabold">{n(N.published30)}</p><p className="text-[12.5px] text-[#B4C1D3]">publiées sur 30 jours</p></div>
        <div className={card}><p className="text-[24px] font-extrabold">{n(N.horizon.under7)}</p><p className="text-[12.5px] text-[#B4C1D3]">se terminent dans moins de 7 jours</p></div>
        <div className={card}><p className="text-[24px] font-extrabold">{N.medianEstimatedValue != null ? euros(N.medianEstimatedValue) : '—'}</p><p className="text-[12.5px] text-[#B4C1D3]">montant médian estimé ({n(N.withEstimatedValue)} avis chiffrés)</p></div>
      </section>

      <section className="mt-7"><h2 className="mb-2 text-[19px] font-extrabold">Temps restant pour répondre</h2>
        <table className="w-full border-collapse text-[14px]"><tbody>
          {[['Moins de 7 jours', N.horizon.under7], ['7 à 14 jours', N.horizon.d7to14], ['15 à 30 jours', N.horizon.d15to30], ['Plus de 30 jours', N.horizon.over30]].map(([l, v]) => (
            <tr key={String(l)}><td className={td}>{l}</td><td className={`${td} text-right font-bold`}>{n(Number(v))}</td><td className={`${td} text-right text-[#B4C1D3]`}>{pct(Number(v), N.open)}</td></tr>))}
        </tbody></table>
      </section>

      <section className="mt-7"><h2 className="mb-1 text-[19px] font-extrabold">Départements avec le plus de consultations ouvertes</h2>
        <p className="mb-2 text-[12.5px] text-[#B4C1D3]">{n(N.openWithoutPlace)} consultations ouvertes n’indiquent ni lieu d’exécution ni département d’acheteur exploitable : elles ne figurent pas dans ce classement.</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[520px] border-collapse text-[13.5px]">
          <thead><tr><th className={th}>Département</th><th className={`${th} text-right`}>Ouvertes</th><th className={`${th} text-right`}>Publiées 30 j</th><th className={th}>Acheteurs les plus actifs</th></tr></thead>
          <tbody>{depts.map(d => (<tr key={d.code}>
            <td className={td}><Link to={slugDept(d.code)} className="font-semibold text-[#FB923C] underline">{d.name} ({d.code})</Link></td>
            <td className={`${td} text-right font-bold`}>{n(d.open)}</td><td className={`${td} text-right`}>{n(d.published30)}</td>
            <td className={`${td} text-[12.5px] text-[#D6E0EC]`}>{d.topBuyers.map(x => `${x.name} (${x.count})`).join(' · ') || '—'}</td></tr>))}</tbody>
        </table></div>
        {b.departments.length > 20 && <button type="button" onClick={() => setAllDepts(v => !v)} className="mt-2 text-[13.5px] font-bold text-[#FB923C] underline">{allDepts ? 'Afficher les 20 premiers' : `Afficher les ${b.departments.length} départements`}</button>}
      </section>

      <section className="mt-7"><h2 className="mb-1 text-[19px] font-extrabold">Métiers les plus demandés</h2>
        <p className="mb-2 text-[12.5px] text-[#B4C1D3]">Métier reconnu dans l’intitulé de l’avis. {n(N.openWithoutTrade)} consultations ouvertes ({pct(N.openWithoutTrade, N.open)}) n’ont pas de métier reconnu : ce classement est une indication.</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[480px] border-collapse text-[13.5px]">
          <thead><tr><th className={th}>Métier</th><th className={`${th} text-right`}>Ouvertes</th><th className={`${th} text-right`}>Publiées 30 j</th><th className={th}>Départements en tête</th></tr></thead>
          <tbody>{b.trades.slice(0, 25).map(t => (<tr key={t.slug}>
            <td className={`${td} font-semibold`}>{t.name}</td><td className={`${td} text-right font-bold`}>{n(t.open)}</td><td className={`${td} text-right`}>{n(t.published30)}</td>
            <td className={`${td} text-[12.5px] text-[#D6E0EC]`}>{t.topDepartments.map(x => `${x.name} (${x.count})`).join(' · ') || '—'}</td></tr>))}</tbody>
        </table></div>
      </section>

      <section className="mt-7"><h2 className="mb-2 text-[19px] font-extrabold">Méthode</h2>
        <ul className="list-disc pl-5 text-[13.5px] leading-relaxed text-[#D6E0EC]">{BARO_METHOD.map((m, k) => <li key={k} className="mb-1">{m}</li>)}</ul>
        <p className="mt-2 text-[13px] text-[#B4C1D3]">Vous pouvez reprendre ces chiffres en citant « Baromètre Marchés Direct » avec la date et un lien vers cette page.</p>
      </section>

      <div className="mt-7 rounded-[14px] border border-[#FB923C]/40 bg-[#1A2B44] p-4">
        <p className="text-[15px] font-bold">Lesquelles sont pour votre entreprise ?</p>
        <p className="mt-1 text-[13.5px] text-[#D6E0EC]">Indiquez votre SIRET : nous trouvons les consultations ouvertes qui correspondent à votre activité et à votre zone.</p>
        <Link to="/" className="mt-3 inline-block rounded-full bg-[#FB923C] px-4 py-2 text-[14px] font-bold text-[#0A1628]">Trouver mes marchés</Link>
      </div>
      <p className="mt-6 text-[13px]"><Link to="/guides" className="font-semibold text-[#FB923C] underline">Guides pour répondre aux marchés publics</Link></p>
    </main>
  );
}
