import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { mockSubcontractingOpportunities } from '@/data/mockData';
import { useLang } from '@/contexts/LangContext';
import { TopBar, StepIndicator, Eyebrow, PageTitle, PageSub, Badge, Button, InfoBox } from '@/components/sous-traitance/ui';

const STEPS = [{ label: 'Missions' }, { label: 'Détail' }, { label: 'Mon profil' }, { label: 'Mise en relation' }];

export default function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLang();
  const mission = mockSubcontractingOpportunities.find(o => o.id === id);
  const [message, setMessage] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/sous-traitance/mission/${mission.id}/profil`, { state: { message } });
  };

  return (
    <div className="page-fade-in max-w-2xl mx-auto pb-24">
      <TopBar backHref="/sous-traitance" />
      <StepIndicator steps={STEPS} current={2} />
      <div className="px-4">
        <Eyebrow>DÉTAIL DE LA MISSION</Eyebrow>
        <PageTitle>{mission.title}</PageTitle>
        <PageSub>{mission.organization}</PageSub>

        {mission.category && <Badge tone="orange">{mission.category.toUpperCase()}</Badge>}
        {mission.match >= 75 && <Badge tone="green" className="ml-2">✓ Compatible ({mission.match}%)</Badge>}

        <div className="my-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[#17334D] bg-[#061D32] p-3 text-center">
            <div className="text-[10px] text-[#B9BBC8]">Localisation</div>
            <div className="mt-1 text-[13px] font-bold text-white">{mission.location}</div>
          </div>
          <div className="rounded-xl border border-[#17334D] bg-[#061D32] p-3 text-center">
            <div className="text-[10px] text-[#B9BBC8]">Budget</div>
            <div className="mt-1 text-[13px] font-bold text-orange">{mission.amount}</div>
          </div>
          <div className="rounded-xl border border-[#17334D] bg-[#061D32] p-3 text-center">
            <div className="text-[10px] text-[#B9BBC8]">Échéance</div>
            <div className="mt-1 text-[13px] font-bold text-white">{new Date(mission.deadline).toLocaleDateString('fr-FR')}</div>
          </div>
          <div className="rounded-xl border border-[#17334D] bg-[#061D32] p-3 text-center">
            <div className="text-[10px] text-[#B9BBC8]">Secteur</div>
            <div className="mt-1 text-[13px] font-bold text-white">{mission.sector}</div>
          </div>
        </div>

        {mission.description && (
          <div className="mb-4 rounded-2xl border border-[#17334D] bg-[#061D32] p-4">
            <div className="mb-2 text-[15px] font-extrabold text-white">La mission</div>
            <p className="text-[13px] leading-relaxed text-[#B9BBC8]">{mission.description}</p>
          </div>
        )}

        {mission.profileRequired && mission.profileRequired.length > 0 && (
          <div className="mb-4 rounded-2xl border border-[#17334D] bg-[#061D32] p-4">
            <div className="mb-2 text-[15px] font-extrabold text-white">Profil recherché</div>
            <ul className="space-y-1.5 text-[13px] text-[#B9BBC8]">
              {mission.profileRequired.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 text-orange">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-white">Votre message</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Présentez votre entreprise et votre expérience pour cette mission..."
              rows={4}
              className="w-full rounded-lg border border-[#17334D] bg-[#031B30] p-3 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-orange"
            />
          </div>

          <InfoBox>
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#3FA96E]" />
            Votre candidature sera transmise directement à {mission.organization}. Restez disponible pour un premier échange.
          </InfoBox>

          <Button type="submit">Soumettre votre candidature</Button>
        </form>
      </div>
    </div>
  );
}
