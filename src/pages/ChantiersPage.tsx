import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { chantiersApi } from '@/lib/apiClient';
import { DEPARTMENTS } from '@/data/departments';
import {
  CHANTIERS_BASE, CHANTIER_CATEGORIES, SOURCE_NOTE, cDay, chantierLine, chantiersDeptPath, chantiersDescription, chantiersH1, chantiersIntro, chantiersTitle, cn,
  type Chantier, type ChantiersList, type ChantiersStats,
} from '@/lib/chantiers';

// Chantiers à venir (7 nov.) : page sobre, une liste et trois filtres. Mêmes textes que le pré-rendu (kind=chantiers).
function Row({ c }: { c: Chantier }) {
  return (
    <li className="border-b border-[#22385A] py-3">
      <Link to={c.path} className="font-bold text-[#F2F5F9] hover:text-[#FB923C]">{c.title}</Link>
      <p className="mt-0.5 text-[12.5px] text-[#B4C1D3]">
        <span className="font-semibold text-[#FDBA74]">{c.categoryLabel}</span> · {chantierLine(c)}
      </p>
    </li>
  );
}

export default function ChantiersPage() {
  const { dept: deptParam = '' } = useParams<{ dept: string }>();
  const dept = deptParam.toUpperCase();
  const deptName = DEPARTMENTS.find(d => d.code === dept)?.name || null;
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const category = sp.get('categorie') || '';
  const nature = sp.get('nature') || '';
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Chantier[]>([]);
  const [data, setData] = useState<ChantiersList | null | undefined>(undefined);
  const [stats, setStats] = useState<ChantiersStats | null>(null);

  useEffect(() => { chantiersApi.stats().then(setStats).catch(() => {}); }, []);
  useEffect(() => { setPage(1); setItems([]); setData(undefined); }, [dept, category, nature]);
  useEffect(() => {
    chantiersApi.list({ department: dept || undefined, category: category || undefined, nature: nature || undefined, page })
      .then(r => { setData(r); setItems(prev => page === 1 ? r.results : [...prev, ...r.results]); })
      .catch(() => setData(null));
  }, [dept, category, nature, page]);

  if (deptParam && !deptName) {
    return <main className="mx-auto max-w-[760px] px-4 pb-24 pt-5 text-[#F2F5F9]"><PageMeta title="Département introuvable | Marchés Direct" description="Ce département n’existe pas." noindex />
      <h1 className="text-[22px] font-extrabold">Département introuvable</h1><Link to={CHANTIERS_BASE} className="mt-3 inline-block font-bold text-[#FB923C] underline">Tous les chantiers à venir</Link></main>;
  }
  const setFilter = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const filtered = !!(category || nature);
  // 7 nov. (revue externe) : un département à zéro pendant l'import n'est pas un département sans permis.
  const importing = !!(stats?.importProgress && stats.importProgress.partsDone < stats.importProgress.partsTotal && (!dept || !stats.departments.some(d => d.code === dept)));
  const deptCount = stats?.departments.find(d => d.code === dept)?.count;
  const total = dept ? (deptCount ?? data?.total ?? 0) : (stats?.total ?? data?.total ?? 0);
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-[13px] ${on ? 'border-[#FB923C] bg-[#FB923C] font-bold text-[#0A1628]' : 'border-[#22385A] text-[#D6E0EC] hover:border-[#FB923C]'}`;

  return (
    <main className="mx-auto w-full max-w-[860px] px-4 pb-24 pt-5 text-[#F2F5F9]">
      <PageMeta title={chantiersTitle(deptName, dept)} description={chantiersDescription(total, deptName)}
        canonicalPath={dept ? chantiersDeptPath(dept) : CHANTIERS_BASE} noindex={filtered || (!!dept && deptCount === 0)} />
      <nav aria-label="Fil d’Ariane" className="text-[12.5px] text-[#B4C1D3]"><Link to="/" className="underline">Accueil</Link> › {dept ? <><Link to={CHANTIERS_BASE} className="underline">Chantiers à venir</Link> › {deptName}</> : 'Chantiers à venir'}</nav>
      <h1 className="mt-2 text-[25px] font-extrabold leading-tight md:text-[30px]">{chantiersH1(deptName, dept)}</h1>
      <p className="mt-2 max-w-[720px] text-[14.5px] leading-relaxed text-[#D6E0EC]">{chantiersIntro(deptName)}</p>
      {stats && stats.total > 0 && (
        <p className="mt-3 text-[13.5px] text-[#B4C1D3]"><b className="text-white">{cn(total)}</b> projets autorisés en 12 mois{!dept && stats.last30 > 0 ? ` · ${cn(stats.last30)} sur les 30 derniers jours publiés` : ''}{stats.latestAuthorization ? ` · dernière autorisation publiée le ${cDay(stats.latestAuthorization)}` : ''}</p>
      )}

      <div className="mt-4 flex flex-col gap-3 rounded-[14px] border border-[#22385A] bg-[#12233A] p-3">
        <label className="flex flex-wrap items-center gap-2 text-[13px] text-[#B4C1D3]">Département
          <select value={dept} onChange={e => navigate(`${e.target.value ? chantiersDeptPath(e.target.value) : CHANTIERS_BASE}${sp.toString() ? `?${sp}` : ''}`)}
            className="min-h-[36px] rounded-lg border border-[#22385A] bg-[#0A1628] px-2 text-[14px] text-[#F2F5F9]">
            <option value="">Toute la France</option>
            {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.code} · {d.name}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Type de projet">
          <button type="button" className={chip(!category)} onClick={() => setFilter('categorie', '')}>Tous les projets</button>
          {CHANTIER_CATEGORIES.map(c => <button key={c.slug} type="button" className={chip(category === c.slug)} onClick={() => setFilter('categorie', c.slug)}>{c.label}</button>)}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Nature des travaux">
          {[['', 'Neuf et existant'], ['neuf', 'Construction neuve'], ['existant', 'Travaux sur existant']].map(([v, l]) =>
            <button key={v} type="button" className={chip(nature === v)} onClick={() => setFilter('nature', v)}>{l}</button>)}
        </div>
      </div>

      {data === undefined && !items.length && <div className="mt-4 h-40 animate-pulse rounded-[14px] bg-[#12233A]" aria-busy="true" />}
      {data === null && <p className="mt-4 text-[14px] text-[#D6E0EC]">La liste n’a pas pu être chargée. Réessayez dans un instant.</p>}
      {data && !items.length && <p className="mt-4 text-[14px] text-[#D6E0EC]">{importing && !filtered ? `Les permis${deptName ? ` de ${deptName}` : ''} sont en cours d’import depuis la base officielle (${cn(stats!.importProgress!.partsDone)} sur ${cn(stats!.importProgress!.partsTotal)} lots déjà chargés) : la liste se remplit dans les prochaines heures.` : stats && stats.total === 0 ? 'Les chantiers sont en cours d’import depuis la base officielle : la liste sera disponible dans quelques heures.' : 'Aucun projet ne correspond à ces filtres.'}</p>}
      {items.length > 0 && <>
        <p className="mt-4 text-[13px] text-[#B4C1D3]">{cn(data?.total ?? items.length)} projet{(data?.total ?? 0) > 1 ? 's' : ''}{filtered ? ' avec ces filtres' : ''}, du plus récent au plus ancien</p>
        <ul className="mt-1">{items.map(c => <Row key={c.id} c={c} />)}</ul>
      </>}
      {data && data.page < data.pages && <button type="button" onClick={() => setPage(p => p + 1)} className="mt-4 rounded-full border border-[#FB923C] px-5 py-2 text-[14px] font-bold text-[#FB923C]">Voir plus de chantiers</button>}

      <div className="mt-8 rounded-[14px] border border-[#FB923C]/40 bg-[#1A2B44] p-4">
        <p className="text-[15px] font-bold">Vous préférez répondre à des consultations ?</p>
        <p className="mt-1 text-[13.5px] text-[#D6E0EC]">Marchés publics, appels d’offres privés et sous-traitance ouverts pour votre métier et votre zone.</p>
        <Link to="/" className="mt-3 inline-block rounded-full bg-[#FB923C] px-4 py-2 text-[14px] font-bold text-[#0A1628]">Trouver mes marchés</Link>
      </div>

      {!dept && stats && stats.departments.length > 0 && <>
        <h2 className="mb-2 mt-8 text-[19px] font-extrabold">Chantiers à venir par département</h2>
        <ul className="flex flex-wrap gap-2">{stats.departments.slice().sort((a, b) => a.code.localeCompare(b.code)).map(d =>
          <li key={d.code}><Link to={chantiersDeptPath(d.code)} className="inline-block rounded-full border border-[#22385A] px-3 py-1 text-[13px] text-[#D6E0EC] hover:border-[#FB923C]">{d.name} ({cn(d.count)})</Link></li>)}</ul>
      </>}
      {dept && <p className="mt-6 text-[13.5px]"><Link to={`/marches-publics/departement/${dept.toLowerCase()}`} className="font-bold text-[#FB923C] underline">Marchés publics ouverts en {deptName}</Link></p>}
      <p className="mt-6 text-[12px] leading-relaxed text-[#93A4BC]">{SOURCE_NOTE} {stats?.source && <a href={stats.source.url} target="_blank" rel="noopener noreferrer" className="underline">Source</a>}</p>
    </main>
  );
}
