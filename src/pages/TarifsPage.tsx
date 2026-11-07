import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';

// 7 nov. (Hedi : « il ne faut pas qu'il y ait d'incohérence ») : l'ancienne page affichait un abonnement « à partir de
// 29 €/mois » et une commission « 0,5 % à 5 % », contraires au modèle en place sur tout le site : consultation gratuite,
// formules d'accompagnement présentées lors de l'échange. Même vocabulaire et mêmes promesses que l'accueil, sans montant.
const FREE = ['La recherche des marchés publics, appels d’offres privés, sous-traitance et chantiers à venir', 'Le pourcentage de correspondance de chaque marché avec votre entreprise',
  'Les annonces enregistrées, les recherches suivies et les nouveautés depuis votre dernière visite', 'Votre dossier prérempli et le premier échange de 30 minutes avec Elena'];
const FORMULE = ['Présentation de votre entreprise au donneur d’ordre ou à l’entreprise principale', 'Formulaires de candidature, mémoire technique et dépôt du dossier (marchés publics)',
  'Mise en relation et appui de votre dossier (appels d’offres privés, sous-traitance, chantiers)', 'Négociation des conditions : prix, délais, paiement'];

export default function TarifsPage() {
  const card = 'rounded-[14px] border border-[#22385A] bg-[#12233A] p-4';
  return (
    <main className="mx-auto w-full max-w-[760px] px-4 pb-24 pt-5 text-[#F2F5F9]">
      <PageMeta title="Formules d’accompagnement | Marchés Direct" description="La consultation est gratuite. L’accompagnement (candidature, mise en relation, négociation) fait l’objet de formules présentées lors d’un premier échange." />
      <p className="text-[12px] font-extrabold uppercase tracking-[.08em] text-[#FB923C]">Formules</p>
      <h1 className="mt-1 text-[24px] font-extrabold leading-tight md:text-[28px]">Consulter est gratuit. Être accompagné, c’est une formule.</h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-[#D6E0EC]">Vous cherchez, comparez et enregistrez vos marchés librement, sans compte ni carte bancaire. Quand un marché vous intéresse vraiment, vous décidez de le confier à l’équipe : la formule est présentée pendant le premier échange, avant tout engagement.</p>

      <section className={`${card} mt-5`}>
        <p className="text-[12px] font-extrabold uppercase tracking-[.06em] text-[#6EE7B7]">Gratuit, sans limite de durée</p>
        <ul className="mt-2 space-y-1.5 text-[14px] text-[#D6E0EC]">{FREE.map(x => <li key={x} className="flex gap-2"><span className="text-[#6EE7B7]">✓</span><span>{x}</span></li>)}</ul>
      </section>
      <section className={`${card} mt-3 border-[#FB923C]/50 bg-[#1A2B44]`}>
        <p className="text-[12px] font-extrabold uppercase tracking-[.06em] text-[#FDBA74]">La formule d’accompagnement</p>
        <p className="mt-1 text-[14px] text-[#D6E0EC]">Votre dossier porté avec vous, de la candidature à la négociation :</p>
        <ul className="mt-2 space-y-1.5 text-[14px] text-[#D6E0EC]">{FORMULE.map(x => <li key={x} className="flex gap-2"><span className="text-[#FDBA74]">●</span><span>{x}</span></li>)}</ul>
        <p className="mt-3 text-[13px] text-[#B4C1D3]">Le contenu et le tarif de la formule dépendent du marché et de votre entreprise ; ils vous sont présentés pendant l’échange, par écrit. Vous décidez ensuite. Aucun frais n’est demandé pour consulter le site.</p>
      </section>

      <section className="mt-5">
        <h2 className="text-[19px] font-extrabold">Comment ça se passe</h2>
        <ol className="mt-2 space-y-2 text-[14px] text-[#D6E0EC]">
          {['Vous repérez un marché et vous touchez « Confier à Elena » sur sa fiche.', 'Elena vous rappelle : 30 minutes pour comprendre votre entreprise et le marché, gratuitement.', 'Si vous souhaitez être accompagné, la formule vous est présentée par écrit ; vous validez, puis le chargé d’affaires prépare le dossier avec vous.']
            .map((x, i) => <li key={x} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1E3352] text-[13px] font-extrabold">{i + 1}</span><span className="pt-1">{x}</span></li>)}
        </ol>
      </section>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link to="/vos-marches" className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-[#C2410C] px-4 text-center text-[15px] font-extrabold text-white">Voir mes marchés</Link>
        <Link to="/question" className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[#FB923C] px-4 text-center text-[15px] font-bold text-[#FB923C]">Poser une question à Elena</Link>
      </div>
    </main>
  );
}
