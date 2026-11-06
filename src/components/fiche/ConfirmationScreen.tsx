import InstallOffer from '@/components/pwa/InstallOffer';
import type { ReactNode } from 'react';
import { COPY, calendarRows, callWhen, dossierCallWhen, formatPhone, momentLabel, rappelDelai, type CoordChoice, type CoordValues } from '@/lib/coordonnees';
import type { ApiSiretCompany } from '@/lib/apiClient';

// Screen 5 (CONFIRMATION « Mon dossier »), first half: after DOSSIER, RAPPEL, QUESTION.
// The green banner answers three questions (saved? what now? what does the team do next?). The PDF button only exists
// when a real file was served: otherwise the row says it comes after Elena's call - never a dead button.
export type PdfState = 'loading' | 'ready' | 'unavailable';

type Props = {
  choice: CoordChoice;
  values: CoordValues;
  company: ApiSiretCompany | undefined;
  market: { shortTitle: string; reference: string | null; deadline: string | null; deadlineText: string; daysLeft: number | null; officialUrl: string | null };
  pdf: PdfState;
  onDownload: () => void;
  onAppointment: () => void;
  onBackToMarket: () => void;
  elenaPhoto: ReactNode;
  // Preuve sociale réelle (dossiers demandés sur 7 jours), masquée sous 2.
  dossiers?: number | null;
  // 5 nov. : favori, « Confier à Elena » et la frise de suivi commune.
  suivi?: ReactNode;
};

const card = 'rounded-2xl border border-[#22385A] bg-[#12233A] p-4';
const tag = (ok: boolean) => <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${ok ? 'bg-[#123B2A] text-[#6EE7B7]' : 'bg-[#3A2312] text-[#FDBA74]'}`}>{ok ? 'Disponible' : 'À préparer avec nous'}</span>;

function Dossier({ p, open }: { p: Props; open: boolean }) {
  const co = p.company;
  const prefilled: [string, string | null | undefined][] = [
    ['Entreprise', co?.name], ['SIRET', co?.siret], ['Adresse', [co?.postal, co?.city].filter(Boolean).join(' ') || null], ['Activité', co?.activity],
  ];
  const who: [string, string][] = [
    ['Références de chantiers similaires', 'Vous'], ['Moyens humains et matériels', 'Vous'], ['Attestations et pièces administratives', 'Vous'],
    ['Formulaires de candidature', 'Nous (sur devis)'], ['Mémoire technique', 'Nous (sur devis)'], ['Offre de prix', 'Ensemble'], ['Dépôt de la candidature', 'Nous (sur devis)'],
  ];
  return (
    <details open={open} className={`group ${card}`}>
      <summary className="flex min-h-[48px] cursor-pointer list-none flex-col justify-center">
        <b className="text-[18px]">{open ? 'Votre dossier' : 'Consulter mon dossier'}</b>
        <span className="text-[13px] text-[#B4C1D3]">Documents, informations préremplies, qui fait quoi, calendrier</span>
      </summary>
      <div className="mt-3 flex flex-col gap-5">
        <div className="text-[14px]"><b>{co?.name || 'Votre entreprise'}</b><br /><span className="text-[#B4C1D3]">{[formatPhone(p.values.phone), p.values.email.trim()].filter(Boolean).join(' · ')}</span></div>
        <div className="text-[14px]"><b className="block text-[15px]">Vos marchés enregistrés</b>{p.market.shortTitle}{p.market.daysLeft != null && p.market.daysLeft >= 0 ? ` · J-${p.market.daysLeft}` : ''}<br /><span className="text-[#B4C1D3]">{[p.market.reference && `Réf. ${p.market.reference}`, `Date limite : ${p.market.deadlineText}`].filter(Boolean).join(' · ')}</span></div>

        <section aria-label="Mes documents"><b className="mb-2 block text-[15px]">Mes documents</b>
          <ul className="flex flex-col gap-3 text-[14px]">
            <li className="flex items-start justify-between gap-3"><span><b>Votre dossier prérempli</b><br /><span className="text-[#B4C1D3]">{p.pdf === 'ready' ? 'Première base, à compléter avant le dépôt · PDF' : 'Disponible après l’appel d’Elena'}</span></span>{tag(p.pdf === 'ready')}</li>
            <li className="flex items-start justify-between gap-3"><span><b>Avis du marché</b><br /><span className="text-[#B4C1D3]">Document officiel publié par l’acheteur</span></span>{p.market.officialUrl ? <a href={p.market.officialUrl} target="_blank" rel="noopener noreferrer" className="min-h-[44px] font-bold text-[#FB923C] underline">Ouvrir ↗</a> : tag(false)}</li>
            <li className="flex items-start justify-between gap-3"><span><b>Mémoire technique</b><br /><span className="text-[#B4C1D3]">Rédigé avec notre équipe, après votre échange</span></span>{tag(false)}</li>
            <li className="flex items-start justify-between gap-3"><span><b>Formulaires de candidature</b><br /><span className="text-[#B4C1D3]">Préparés par nos soins, après votre échange</span></span>{tag(false)}</li>
          </ul>
        </section>

        <section aria-label="Déjà prérempli pour vous"><b className="mb-2 block text-[15px]">Déjà prérempli pour vous</b>
          <ul className="flex flex-col gap-1.5 text-[14px]">
            {prefilled.filter(([, v]) => v).map(([k, v]) => <li key={k}><span aria-hidden className="text-[#6EE7B7]">✓ </span>{k} · {v}</li>)}
            <li><span aria-hidden className="text-[#6EE7B7]">✓ </span>Téléphone{p.values.email.trim() ? ' et e-mail' : ''} · ceux que vous avez indiqués</li>
          </ul>
        </section>

        <section aria-label="Qui fait quoi"><b className="mb-2 block text-[15px]">Préparer mon dossier : qui fait quoi</b>
          <ul className="flex flex-col gap-1.5 text-[14px]">{who.map(([k, v]) => <li key={k} className="flex justify-between gap-3"><span>{k}</span><b className={v === 'Vous' ? 'text-[#D6E0EC]' : 'text-[#FDBA74]'}>{v}</b></li>)}</ul>
        </section>

        <section aria-label="Votre calendrier jusqu’au dépôt"><b className="mb-2 block text-[15px]">Votre calendrier jusqu’au dépôt</b>
          <ol className="flex flex-col gap-2 text-[14px]">{calendarRows({ deadline: p.market.deadline, choice: p.choice, moment: p.values.moment, slotLabel: p.values.slotLabel }).map((r) => <li key={r.when}><b>{r.when}</b> <span className="text-[#D6E0EC]">— {r.what}</span></li>)}</ol>
        </section>
      </div>
    </details>
  );
}

export default function ConfirmationScreen(p: Props) {
  const c = COPY[p.choice];
  const hasPdf = p.pdf === 'ready';
  const phone = formatPhone(p.values.phone);
  if (p.choice === 'alerte') return (
    <div className="flex flex-col gap-4 pb-10">
      <section role="status" className="rounded-2xl border border-[#1E6B4A] bg-[#123B2A] p-4">
        <h1 className="text-[22px] font-extrabold text-[#6EE7B7]">✓ {c.done.title}</h1>
        <p className="mt-1.5 text-[15px] text-[#E8FFF4]">{c.done.text}</p>
      </section>
      <section className={card}><b className="block text-[13px] uppercase tracking-wide text-[#B4C1D3]">Votre alerte</b>
        <p className="mt-1 text-[16px]"><b>{p.company?.name || 'Votre entreprise'}</b>{p.company?.activity ? ` · ${p.company.activity}` : ''}</p>
        <p className="mt-1 text-[15px]">Téléphone : {phone}</p>
        <p className="mt-2 text-[14px] text-[#D6E0EC]">Prochaine étape : Elena vous appelle lorsqu’un nouveau marché adapté est identifié. Arrêt possible à tout moment.</p></section>
      <div className="flex items-center gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-3.5">{p.elenaPhoto}<p className="text-[14px] text-[#D6E0EC]"><b className="block text-[13px] text-[#B4C1D3]">Elena Popescu</b>{c.done.elena}</p></div>
      <button type="button" onClick={p.onBackToMarket} className="min-h-[48px] self-start text-[14px] font-semibold text-[#FB923C] underline">‹ Revenir à ce marché</button>
    </div>
  );
  if (p.choice === 'dossier') {
    const when = dossierCallWhen(p.values);
    const cal = calendarRows({ deadline: p.market.deadline, choice: p.choice, moment: p.values.moment, slotLabel: p.values.slotLabel });
    return (
      <div className="flex flex-col gap-4 pb-10">
        <ol className="flex gap-2 text-[13px] text-[#B4C1D3]" aria-label="Étapes"><li>1 · Vos marchés</li><li>2 · Mon analyse</li><li className="font-bold text-[#F2F5F9]">3 · Mon dossier</li></ol>
        <section role="status" className="rounded-2xl border border-[#1E6B4A] bg-[#123B2A] p-4">
          <h1 className="text-[21px] font-extrabold leading-tight text-[#6EE7B7]">✓ {hasPdf ? 'Dossier prêt.' : 'Demande enregistrée.'} Elena vous appelle {when}.</h1>
          <p className="mt-2 text-[15px] text-[#E8FFF4]">Au {phone} · 30 minutes offertes · si l’horaire ne convient plus, dites-le lui, elle s’adapte.</p>
        </section>
        {hasPdf
          ? <button type="button" onClick={p.onDownload} className="flex min-h-[56px] w-full items-center justify-center rounded-[14px] bg-[#C2410C] px-4 text-[16px] font-extrabold text-white">⬇ Télécharger mon dossier prérempli (PDF)</button>
          : <p className={`${card} text-[15px]`}>{p.pdf === 'loading' ? 'Préparation de votre dossier…' : 'Votre dossier prérempli vous est remis lors de l’appel.'}</p>}
        <section className={card} aria-label="Ce que vous verrez avec Elena">
          <b className="mb-2 block text-[16px]">Ce que vous verrez avec Elena</b>
          <ul className="flex flex-col gap-2 text-[14px] text-[#D6E0EC]">
            <li><span aria-hidden className="font-extrabold text-[#6EE7B7]">✓ </span>Vos atouts et vos points faibles sur ce marché</li>
            <li><span aria-hidden className="font-extrabold text-[#6EE7B7]">✓ </span>Ce qu’il faut fournir, écrire, et dans quel ordre</li>
            <li><span aria-hidden className="font-extrabold text-[#6EE7B7]">✓ </span>Qui fait quoi si vous décidez d’y aller : vous, nous, ensemble</li>
          </ul>
          <ol className="mt-3 flex gap-2" aria-label="Votre calendrier">
            {cal.slice(0, 3).map((r) => <li key={r.when} className="flex-1 rounded-xl border border-[#22385A] p-2.5 text-[12px] text-[#B4C1D3]"><b className="mb-0.5 block text-[13px] text-[#F2F5F9]">{r.when}</b>{r.what}</li>)}
          </ol>
        </section>
        {p.suivi}
        <div className="flex items-center gap-3 rounded-2xl border border-[#22385A] bg-[#12233A] p-3.5">{p.elenaPhoto}<p className="text-[14px] text-[#D6E0EC]"><b className="block text-[13px] text-[#B4C1D3]">Elena Popescu</b>{c.done.elena}</p></div>
        {p.dossiers != null && p.dossiers >= 2 && <p className="flex items-center gap-2 text-[13px] text-[#D6E0EC]"><span aria-hidden className="h-2 w-2 rounded-full bg-[#EF4444]" />{p.dossiers} entreprises ont demandé leur dossier ces 7 derniers jours</p>}
        <Dossier p={p} open={false} />
        <InstallOffer context="dossier" />
        <button type="button" onClick={p.onBackToMarket} className="min-h-[48px] self-start text-[14px] font-semibold text-[#FB923C] underline">‹ Revenir à ce marché</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 pb-10">
      <ol className="flex gap-2 text-[13px] text-[#B4C1D3]" aria-label="Étapes"><li>1 · Vos marchés</li><li>2 · Mon analyse</li><li className="font-bold text-[#F2F5F9]">3 · Mon dossier</li></ol>

      <section role="status" className="rounded-2xl border border-[#1E6B4A] bg-[#123B2A] p-4">
        <h1 className="text-[22px] font-extrabold text-[#6EE7B7]">✓ {c.done.title}</h1>
        <p className="mt-1.5 text-[15px] text-[#E8FFF4]">{hasPdf ? c.done.text : c.done.textNoPdf}</p>
      </section>

      {p.choice === 'rappel' && (
        <section className={card}><b className="block text-[13px] uppercase tracking-wide text-[#B4C1D3]">Votre préférence</b>
          <p className="mt-1 text-[16px]"><b>{momentLabel(p.values.moment)}</b> · Elena vous rappelle au {phone} {callWhen(p.values.moment)}.</p></section>)}

      {p.choice === 'info' && (
        <section className={card}><b className="block text-[13px] uppercase tracking-wide text-[#B4C1D3]">Votre question</b>
          <blockquote className="mt-1 whitespace-pre-line text-[16px]">« {p.values.question.trim()} »</blockquote>
          <p className="mt-2 text-[15px]">Elena vous rappelle au {phone} {rappelDelai()} avec la réponse.</p></section>)}

      <section className={`${card} flex flex-col gap-3`} aria-label="30 minutes offertes">
        <div className="flex items-center gap-3">{p.elenaPhoto}<p className="text-[14px] text-[#D6E0EC]"><b className="block text-[13px] text-[#B4C1D3]">Elena Popescu</b>{c.done.elena}</p></div>
        <div><b className="text-[16px]">30 minutes offertes avec notre équipe</b>
          <p className="mt-1 text-[14px] text-[#D6E0EC]">Le point sur ce marché et sur votre situation, les prochaines étapes concrètement. Si vous souhaitez préparer votre candidature avec nous (mémoire technique, formulaires, dépôt) : accompagnement sur devis, présenté pendant l’échange.</p></div>
        <button type="button" onClick={p.onAppointment} className="flex min-h-[54px] w-full items-center justify-center rounded-[14px] bg-[#C2410C] px-4 text-[16px] font-extrabold text-white">Demander mes 30 minutes offertes</button>
        <p className="text-center text-[13px] text-[#B4C1D3]">Par téléphone · Sans engagement</p>
      </section>

      <Dossier p={p} open={false} />
      <button type="button" onClick={p.onBackToMarket} className="min-h-[48px] self-start text-[14px] font-semibold text-[#FB923C] underline">‹ Revenir à ce marché</button>
    </div>
  );
}
