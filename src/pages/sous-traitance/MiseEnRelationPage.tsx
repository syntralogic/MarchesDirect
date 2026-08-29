import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { mockSubcontractingOpportunities } from '@/data/mockData';
import { opportunitiesApi } from '@/lib/apiClient';
import { TopBar, StepIndicator, Eyebrow, PageTitle, PageSub, Badge, Button, RelationTimeline, type TimelineItem } from '@/components/sous-traitance/ui';

const STEPS = [{ label: 'Besoin' }, { label: 'Profils' }, { label: 'Sélection' }, { label: 'Mise en relation' }];

export default function MiseEnRelationPage() {
  const [searchParams] = useSearchParams();
  const oid = searchParams.get('oid');
  const orgParam = searchParams.get('org'); // legacy links from before `oid` existed

  const fallback = mockSubcontractingOpportunities[0];
  const [company, setCompany] = useState<{ organization: string; category?: string }>(() => {
    const mockMatch = orgParam ? mockSubcontractingOpportunities.find(o => o.organization === orgParam) : undefined;
    return mockMatch ?? fallback;
  });
  const [loading, setLoading] = useState(!!oid);

  useEffect(() => {
    if (!oid) return;
    let cancelled = false;
    opportunitiesApi.getById(oid)
      .then(o => {
        if (cancelled) return;
        // buyer_name isn't populated for every source (TED, some PLACE
        // records) - fall back to the mock demo company rather than showing
        // a blank organization name.
        setCompany({ organization: o.buyer_name || fallback.organization, category: o.trade_name || undefined });
      })
      .catch(() => { if (!cancelled) setCompany(fallback); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oid]);

  const submittedAt = new Date().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const timelineItems: TimelineItem[] = [
    { title: `Demande transmise à ${company.organization}`, sub: `Aujourd'hui à ${submittedAt}`, status: 'done' },
    { title: 'Étude de votre besoin', sub: 'En cours', status: 'active' },
    { title: "Confirmation de l'intérêt", status: 'wait' },
    { title: 'Premier échange organisé', status: 'wait' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin text-orange" /></div>;
  }

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
