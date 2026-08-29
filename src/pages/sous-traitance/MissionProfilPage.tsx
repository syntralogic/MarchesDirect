import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useMission } from '@/hooks/use-mission';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar, StepIndicator, Eyebrow, PageTitle, PageSub, Button, KeyValueRow } from '@/components/sous-traitance/ui';

const STEPS = [{ label: 'Missions' }, { label: 'Détail' }, { label: 'Mon profil' }, { label: 'Mise en relation' }];

export default function MissionProfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { company } = useAuth();
  const { mission, loading } = useMission(id);
  const [message, setMessage] = useState(
    (location.state as { message?: string } | null)?.message ||
    'Bonjour, notre équipe est disponible pour cette mission. Nous avons une expérience solide en travaux similaires.'
  );

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

  const handleSubmit = () => {
    navigate(`/sous-traitance/mission/${mission.id}/relation`);
  };

  const companyName = company?.name || 'Votre entreprise';

  return (
    <div className="page-fade-in max-w-2xl mx-auto pb-24">
      <TopBar backHref={`/sous-traitance/mission/${mission.id}`} />
      <StepIndicator steps={STEPS} current={3} />
      <div className="px-4">
        <Eyebrow>VOTRE PROFIL</Eyebrow>
        <PageTitle>Voici les informations transmises à {mission.organization}.</PageTitle>
        <PageSub>Vérifiez les éléments essentiels avant l'envoi.</PageSub>

        <div className="mb-4 rounded-2xl border border-[#17334D] bg-[#061D32] p-4">
          <div className="mb-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-center text-[10px] font-extrabold text-[#111]">
              {companyName.slice(0, 2).toUpperCase()}
            </div>
          </div>
          <div className="text-center text-[15px] font-extrabold text-white">{companyName}</div>
          {!company && (
            <p className="text-center text-[11px] text-[#B9BBC8] mt-1">
              Complétez votre profil entreprise pour l'afficher ici.
            </p>
          )}
        </div>

        {company && (
          <div className="mb-4 rounded-2xl border border-[#17334D] bg-[#061D32] p-4">
            {company.legal_form && <KeyValueRow label="Forme juridique" value={company.legal_form} />}
            {company.siret && <KeyValueRow label="SIRET" value={company.siret} />}
            {typeof company.headcount === 'number' && <KeyValueRow label="Effectif" value={`${company.headcount} salariés`} />}
            {company.email && <KeyValueRow label="Contact" value={company.email} />}
          </div>
        )}

        <div>
          <label className="mb-2 block text-[13px] font-semibold text-white">Votre message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-[#17334D] bg-[#031B30] p-3 text-sm text-white focus:outline-none focus:border-orange"
          />
        </div>

        <div className="my-4 flex items-start gap-2.5 rounded-xl border border-[#17334D] bg-[#031B30] p-3 text-xs text-[#B9BBC8]">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#3FA96E]" />
          Vos données restent confidentielles. Seules les informations pertinentes seront partagées avec {mission.organization}.
        </div>

        <Button onClick={handleSubmit}>Transmettre ma candidature</Button>
        <Button href={`/sous-traitance/mission/${mission.id}`} variant="outline">
          Modifier mes informations
        </Button>
      </div>
    </div>
  );
}
