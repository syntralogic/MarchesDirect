import { Link } from 'react-router-dom';

// 7 nov. : l'aide demandée sur un problème précis (entrée directe vers l'accompagnement). Chaque bouton ouvre « Une question »
// préremplie avec l'annonce et la demande : Elena sait tout de suite de quoi il s'agit, l'artisan n'a rien à réexpliquer.
const HELP: [string, string, string][] = [
  ['check', 'Vérifier mon dossier', 'Je voudrais que l’équipe vérifie mon dossier avant de répondre'],
  ['price', 'M’aider à chiffrer', 'Je voudrais de l’aide pour chiffrer mon offre'],
  ['full', 'Prendre en charge la réponse', 'Je voudrais confier la préparation et le dépôt de la réponse à Marchés Direct'],
];
export const helpLink = (ask: string, ref: string, title: string) => `/question?q=${encodeURIComponent(`${ask}, pour l’annonce ${ref} (${title}).`)}`;

export default function HelpOptions({ reference, title, compact = false }: { reference: string; title: string; compact?: boolean }) {
  return (
    <section aria-label="Être aidé sur cette annonce" className={compact ? 'mt-2' : 'flex flex-col gap-2 rounded-2xl border border-[#22385A] bg-[#12233A] p-4'}>
      {!compact && <><h3 className="text-[16px] font-extrabold">Besoin d’aide sur cette annonce ?</h3>
        <p className="text-[13.5px] text-[#D6E0EC]">Choisissez ce dont vous avez besoin : l’équipe reçoit l’annonce et votre demande, et vous rappelle.</p></>}
      <div className="flex flex-wrap gap-2">
        {HELP.map(([k, label, ask]) => <Link key={k} to={helpLink(ask, reference, title)}
          className={`inline-flex min-h-[44px] items-center rounded-full border px-3.5 text-[13.5px] font-bold ${k === 'full' ? 'border-[#F97316] bg-[#C2410C] text-white' : 'border-[#2B4468] text-[#D6E0EC]'}`}>{label}</Link>)}
      </div>
    </section>
  );
}
