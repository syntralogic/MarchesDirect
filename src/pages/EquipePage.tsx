// Page « Notre équipe » : les vraies personnes (mêmes photos et rôles que « Qui sommes-nous »).
// Aucun membre inventé : la liste est celle de la page Qui sommes-nous, chaque fiche renvoie vers son rôle détaillé.
import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import mem1 from '@/assets/1.jpeg';
import mem2 from '@/assets/2.jpeg';
import mem3 from '@/assets/3.jpeg';
import mem4 from '@/assets/4.jpeg';
import mem5 from '@/assets/5.jpeg';
import mem6 from '@/assets/6.jpeg';

const TEAM = [
  { name: 'Elena Popescu', role: 'Chargée de relation', tagline: 'Votre premier contact', help: 'Elle vous rappelle, répond à vos questions et vous oriente vers la bonne personne.', image: mem1 },
  { name: 'Maria Ferreira', role: 'Chargée d’affaires', tagline: 'Référente marchés privés', help: 'Elle prépare la candidature avec vous, de la première pièce jusqu’au dépôt.', image: mem2 },
  { name: 'Nicole Pisseron', role: 'Chargée d’affaires', tagline: 'Référente préparation des offres', help: 'Elle structure le mémoire technique et vérifie chaque pièce avant l’envoi.', image: mem4 },
  { name: 'Emre Kaya', role: 'Chargé d’affaires', tagline: 'Référent sous-traitance', help: 'Il met en relation avec les entreprises générales et suit les missions.', image: mem5 },
  { name: 'Charlotte Le Guen', role: 'Experte marchés publics', tagline: 'Conformité et sécurisation', help: 'Elle relit les exigences du règlement et sécurise votre réponse.', image: mem6 },
  { name: 'Bernard Delmas', role: 'Directeur général', tagline: 'Pilotage', help: 'Il valide chaque dossier avant son envoi.', image: mem3 },
];

export default function EquipePage() {
  return (
    <div className="page-fade-in mx-auto w-full max-w-[1100px] px-4 py-8 text-[#F2F5F9] md:px-6 md:py-14" style={{ fontFamily: '"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif' }}>
      <PageMeta title="Notre équipe — Marchés Direct" description="De vraies personnes, du premier appel au dépôt de votre candidature." />
      <div className="mb-8 max-w-[720px] md:mb-12">
        <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#FB923C]">Notre équipe</div>
        <h1 className="mt-1 text-[26px] font-extrabold leading-tight md:text-[38px]">De vraies personnes, du premier appel au dépôt.</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#B4C1D3]">Vous n’êtes jamais face à un logiciel. Elena prend votre appel, un chargé d’affaires prépare votre candidature avec vous, et vous validez avant le dépôt.</p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM.map(m => (
          <li key={m.name}>
            <Link to={`/team-profile?member=${encodeURIComponent(m.name)}`} className="flex h-full gap-4 rounded-[20px] border border-[#22385A] bg-[#12233A] p-4 transition-colors hover:border-[#FB923C]/60">
              <img src={m.image} alt={m.name} width={72} height={72} loading="lazy" className="h-[72px] w-[72px] shrink-0 rounded-full object-cover" />
              <div className="min-w-0">
                <h2 className="text-[17px] font-bold leading-tight">{m.name}</h2>
                <p className="text-[14px] font-semibold text-[#FB923C]">{m.role} · {m.tagline}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#B4C1D3]">{m.help}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-[#FB923C]">Découvrir son rôle <ArrowRight size={14} /></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 flex flex-col items-center gap-3 rounded-[20px] border-2 border-[#C2410C] bg-[#142B4A] p-5 text-center md:mt-14">
        <Phone size={26} className="text-[#FB923C]" aria-hidden />
        <h2 className="text-[22px] font-extrabold leading-tight">Une question ? Elena vous rappelle.</h2>
        <p className="text-[15px] text-[#B4C1D3]">De 9 h à 18 h, en semaine. Sans engagement.</p>
        <Link to="/question" className="min-h-[56px] w-full max-w-[420px] rounded-[14px] bg-[#C2410C] px-4 py-4 text-center text-[17px] font-extrabold text-white shadow-[0_6px_20px_rgba(194,65,12,.35)]">Poser ma question</Link>
      </section>
    </div>
  );
}
