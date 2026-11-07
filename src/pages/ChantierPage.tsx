import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { chantiersApi } from '@/lib/apiClient';
import { CHANTIERS_BASE, SOURCE_NOTE, cDay, chantierLine, chantiersDeptPath, cn, type ChantierFiche } from '@/lib/chantiers';

// Fiche d'un chantier à venir (7 nov.). Non indexée (des centaines de milliers de fiches très proches) : ce sont les
// pages par département qui portent le référencement. Aucune adresse, aucun nom de particulier.
export default function ChantierPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [c, setC] = useState<ChantierFiche | null | undefined>(undefined);
  useEffect(() => { setC(undefined); chantiersApi.fiche(id).then(setC).catch(() => setC(null)); }, [id]);
  const shell = 'mx-auto w-full max-w-[760px] px-4 pb-24 pt-5 text-[#F2F5F9]';
  if (c === undefined) return <main className={shell} aria-busy="true"><div className="h-8 w-2/3 animate-pulse rounded bg-[#12233A]" /><div className="mt-4 h-40 animate-pulse rounded-[14px] bg-[#12233A]" /></main>;
  if (c === null) return <main className={shell}><PageMeta title="Chantier introuvable | Marchés Direct" description="Ce chantier n’est plus dans la liste." noindex />
    <h1 className="text-[22px] font-extrabold">Chantier introuvable</h1><p className="mt-2 text-[#D6E0EC]">Ce projet n’est plus dans la liste des 12 derniers mois.</p>
    <Link to={CHANTIERS_BASE} className="mt-3 inline-block font-bold text-[#FB923C] underline">Tous les chantiers à venir</Link></main>;

  const rows: [string, string | null][] = [
    ['Projet', c.what], ['Nature', c.nature], ['Autorisation', c.permit],
    ['Commune', c.commune ? `${c.commune}${c.postalCode ? ` (${c.postalCode})` : ''}` : null],
    ['Département', c.departmentName ? `${c.departmentName} (${c.department})` : c.department],
    ['Autorisé le', c.authorizedAt ? cDay(c.authorizedAt) : null],
    ['État', c.state === 'started' ? `Chantier ouvert le ${cDay(c.startedAt)}` : 'Autorisé, ouverture du chantier non encore déclarée'],
    ['Surface créée', c.floorArea ? `${cn(c.floorArea)} m²` : null], ['Logements créés', c.dwellings && c.dwellings > 1 ? cn(c.dwellings) : null],
    ['Terrain', c.landArea ? `${cn(c.landArea)} m²` : null], ['Piscine', c.pool ? 'Oui' : null], ['Demandeur', c.applicant],
  ];
  return (
    <main className={shell}>
      <PageMeta title={`${c.title} | Chantiers à venir | Marchés Direct`} description={`${c.title} : ${chantierLine(c)}. Permis publié par le SDES.`} noindex />
      <nav aria-label="Fil d’Ariane" className="text-[12.5px] text-[#B4C1D3]"><Link to="/" className="underline">Accueil</Link> › <Link to={CHANTIERS_BASE} className="underline">Chantiers à venir</Link> › <Link to={chantiersDeptPath(c.department)} className="underline">{c.departmentName || c.department}</Link></nav>
      <p className="mt-3 text-[12px] font-extrabold uppercase tracking-[.08em] text-[#FB923C]">{c.categoryLabel}</p>
      <h1 className="mt-1 text-[24px] font-extrabold leading-tight md:text-[28px]">{c.title}</h1>
      {/* 7 nov. (Hedi) : la fiche doit permettre d'agir tout de suite. Les deux boutons ouvrent la page « Une question »
          avec la demande préremplie : Elena reçoit le chantier, sa référence, et rappelle. */}
      <div className="mt-4 rounded-[14px] border border-[#FB923C]/50 bg-[#1A2B44] p-4">
        <p className="text-[15.5px] font-bold">Ce chantier vous intéresse ?</p>
        <p className="mt-1 text-[13.5px] text-[#D6E0EC]">Elena suit ce projet pour vous et vous rappelle pour voir comment vous positionner{c.applicant === 'Société' ? ' auprès de la société qui construit' : ''}.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Link to={`/question?q=${encodeURIComponent(`Chantier à venir : ${c.title} (${c.commune || ''}${c.postalCode ? ` ${c.postalCode}` : ''}, permis ${c.id.slice(1)}). Je souhaite être mis en relation pour ce chantier.`)}`}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#C2410C] px-4 text-center text-[15px] font-extrabold text-white">Être mis en relation</Link>
          <Link to={`/question?q=${encodeURIComponent(`Chantiers à venir : je souhaite être prévenu des projets comme « ${c.title} » en ${c.departmentName || c.department}.`)}`}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[#FB923C] px-4 text-center text-[15px] font-bold text-[#FB923C]">Être prévenu des chantiers similaires</Link>
        </div>
      </div>
      <dl className="mt-4 divide-y divide-[#22385A] rounded-[14px] border border-[#22385A] bg-[#12233A]">
        {rows.filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex gap-3 px-3 py-2 text-[14px]"><dt className="w-[140px] shrink-0 text-[#B4C1D3]">{k}</dt><dd className="text-[#F2F5F9]">{v}</dd></div>)}
      </dl>
      {c.phases && <div className="mt-3 rounded-[14px] border border-[#2B4468] bg-[#0F1F35] p-3">
        <p className="text-[12px] font-extrabold uppercase tracking-[.06em] text-[#FDBA74]">Repère indicatif, pas un calendrier</p>
        <p className="mt-1 text-[14px] text-[#D6E0EC]">{c.phases.text}</p>
        <p className="mt-1 text-[12px] text-[#93A4BC]">Estimation à partir de la date d’{c.phases.from === 'autorisation' ? 'autorisation' : 'ouverture du chantier'} déclarée ; le calendrier réel dépend du maître d’ouvrage.</p>
      </div>}
      <p className="mt-3 text-[13px] text-[#B4C1D3]">L’adresse exacte du terrain et l’identité des particuliers ne sont pas publiées. Référence du permis : {c.id.slice(1)}.</p>
      <div className="mt-5 rounded-[14px] border border-[#FB923C]/40 bg-[#1A2B44] p-4">
        <p className="text-[15px] font-bold">Ce type de chantier correspond à votre métier ?</p>
        <p className="mt-1 text-[13.5px] text-[#D6E0EC]">Retrouvez aussi les consultations ouvertes (marchés publics, appels d’offres privés, sous-traitance) pour votre activité et votre zone.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/" className="inline-block rounded-full bg-[#FB923C] px-4 py-2 text-[14px] font-bold text-[#0A1628]">Trouver mes marchés</Link>
          <Link to={`/question?q=${encodeURIComponent(`Question sur le chantier à venir ${c.id.slice(1)} (${c.title}) : `)}`} className="inline-block rounded-full border border-[#FB923C] px-4 py-2 text-[14px] font-bold text-[#FB923C]">Poser une question à Elena</Link>
        </div>
      </div>
      {c.nearby.length > 0 && <>
        <h2 className="mb-1 mt-7 text-[19px] font-extrabold">Autres chantiers à venir en {c.departmentName || c.department}</h2>
        <ul>{c.nearby.map(n => <li key={n.id} className="border-b border-[#22385A] py-2.5"><Link to={n.path} className="font-bold hover:text-[#FB923C]">{n.title}</Link><p className="text-[12.5px] text-[#B4C1D3]">{chantierLine(n)}</p></li>)}</ul>
        <Link to={chantiersDeptPath(c.department)} className="mt-3 inline-block text-[14px] font-bold text-[#FB923C] underline">Tous les chantiers du département</Link>
      </>}
      <p className="mt-6 text-[12px] leading-relaxed text-[#93A4BC]">{SOURCE_NOTE} <a href={c.source.url} target="_blank" rel="noopener noreferrer" className="underline">Source</a></p>
    </main>
  );
}
