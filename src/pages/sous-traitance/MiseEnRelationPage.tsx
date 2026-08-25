import { useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { mockSubcontractingOpportunities } from '@/data/mockData';
import { TopBar, StepIndicator, Eyebrow, PageTitle, PageSub, Badge, Button, RelationTimeline, type TimelineItem } from '@/components/sous-traitance/ui';

const STEPS = [{ label: 'Besoin' }, { label: 'Profils' }, { label: 'Sélection' }, { label: 'Mise en relation' }];

export default function MiseEnRelationPage() {
  const [searchParams] = useSearchParams();
  const orgParam = searchParams.get('org');
  const fallback = mockSubcontractingOpportunities[0];
  const match = orgParam
    ? mockSubcontractingOpportunities.find(o => o.organization === orgParam)
    : fallback;
  const company = match ?? fallback;

  const submittedAt = new Date().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const timelineItems: TimelineItem[] = [
    { title: `Demande transmise à ${company.organization}`, sub: `Aujourd'hui à ${submittedAt}`, status: 'done' },
    { title: 'Étude de votre besoin', sub: 'En cours', status: 'active' },
    { title: "Confirmation de l'intérêt", status: 'wait' },
    { title: 'Premier échange organisé', status: 'wait' },
  ];

  return (
    <div className="page-fade-in max-w-2xl mx-auto pb-24">
      <TopBar backHref="/sous-traitance" />
      <StepIndicator steps={STEPS} current={4} />
      <div className="px-4">
        <Eyebrow>MISE EN RELATION</Eyebrow>
        <PageTitle>Votre demande a été transmise.</PageTitle>
        <PageSub>{company.organization} étudie votre besoin en sous-traitance.</PageSub>

        <div className="mb-4 rounded-2xl border border-[#17334D] bg-[#061D32] p-4">
          <Badge tone="green">DEMANDE TRANSMISE</Badge>
          <div className="mt-2 text-sm text-[#B9BBC8]">
            <p className="font-bold text-white">{company.organization}</p>
            {company.category && <p className="text-[13px]">{company.category}</p>}
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-[#17334D] bg-[#031B30] p-3">
          <RelationTimeline items={timelineItems} />
        </div>

        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#17334D] bg-[#031B30] p-3 text-xs text-[#B9BBC8]">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#3FA96E]" />
          Marchés Direct vous accompagne. Nous organisons le premier échange et restons disponibles jusqu'à l'accord entre les deux entreprises.
        </div>

        <Button href="/sous-traitance">Accueil</Button>
        <Button href="/sous-traitance" variant="outline">
          Nouvelle recherche
        </Button>
      </div>
    </div>
  );
}
