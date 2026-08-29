import { useParams } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useMission } from '@/hooks/use-mission';
import { TopBar, StepIndicator, Eyebrow, PageTitle, PageSub, Badge, Button, RelationTimeline, type TimelineItem } from '@/components/sous-traitance/ui';

const STEPS = [{ label: 'Missions' }, { label: 'Détail' }, { label: 'Mon profil' }, { label: 'Mise en relation' }];

export default function MissionRelationPage() {
  const { id } = useParams<{ id: string }>();
  const { mission, loading } = useMission(id);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin text-orange" /></div>;
  }

  if (!mission) {
    return (
      <div className="page-fade-in max-w-2xl mx-auto pb-24">
        <TopBar backHref="/sous-traitance" />
        <div className="px-4 py-10">
          <PageTitle>Mission non trouvée</PageTitle>
        </div>
      </div>
    );
  }

  const submittedAt = new Date().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const timelineItems: TimelineItem[] = [
    { title: `Candidature transmise à ${mission.organization}`, sub: `Aujourd'hui à ${submittedAt}`, status: 'done' },
    { title: 'Étude de votre profil', sub: 'En cours', status: 'active' },
    { title: "Confirmation de l'intérêt", status: 'wait' },
    { title: 'Visite ou échange organisé', status: 'wait' },
  ];

  return (
    <div className="page-fade-in max-w-2xl mx-auto pb-24">
      <TopBar backHref={`/sous-traitance/mission/${mission.id}`} />
      <StepIndicator steps={STEPS} current={4} />
      <div className="px-4">
        <Eyebrow>MISE EN RELATION</Eyebrow>
        <PageTitle>Votre candidature a été transmise.</PageTitle>
        <PageSub>{mission.organization} étudie votre profil pour cette mission.</PageSub>

        <div className="mb-4 rounded-2xl border border-[#17334D] bg-[#061D32] p-4">
          <Badge tone="green">CANDIDATURE TRANSMISE</Badge>
          <div className="mt-3 space-y-1">
            <p className="text-[15px] font-bold text-white">{mission.title}</p>
            <p className="text-[13px] text-[#B9BBC8]">{mission.organization}</p>
            <p className="mt-2 text-[12px] text-[#B9BBC8]">Envoi : Aujourd'hui à {submittedAt}</p>
            <p className="text-[12px] text-[#B9BBC8]">Réponse attendue : Sous 48 heures</p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-[#17334D] bg-[#031B30] p-3">
          <RelationTimeline items={timelineItems} />
        </div>

        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#17334D] bg-[#031B30] p-3 text-xs text-[#B9BBC8]">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#3FA96E]" />
          Marchés Direct vous accompagne. Nous organisons le premier échange et restons disponibles jusqu'à la conclusion du projet.
        </div>

        <Button href="/sous-traitance">Voir mes autres candidatures</Button>
        <Button href="/sous-traitance" variant="outline">
          Chercher d'autres missions
        </Button>
      </div>
    </div>
  );
}
