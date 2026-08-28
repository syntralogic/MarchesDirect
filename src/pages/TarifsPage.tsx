import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, Monitor, FileText, Trophy, 
  Ban, CalendarDays, Target, Search, ClipboardCheck, Phone, User 
} from 'lucide-react';
import { toast } from 'sonner';
import { CallbackModal } from '@/components/CallbackModal';
import { AppointmentModal } from '@/components/AppointmentModal';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionsApi, type ApiSubscriptionPlan } from '@/lib/apiClient';

export default function TarifsPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [backendPlans, setBackendPlans] = useState<ApiSubscriptionPlan[]>([]);

  useEffect(() => {
    subscriptionsApi.plans().then(setBackendPlans).catch(() => setBackendPlans([]));
  }, []);

  const PLANS = [
    {
      id: 'decouverte',
      name: t('planDiscoveryName'),
      price: '0',
      period: t('planDiscoveryPeriod'),
      badge: null,
      features: [t('planDiscoveryFeat1'), t('planDiscoveryFeat2'), t('planDiscoveryFeat3'), t('planDiscoveryFeat4')],
      cta: t('planDiscoveryCta'),
      ctaType: 'appt' as const,
    },
    {
      id: 'pro',
      name: t('planProName'),
      price: '89',
      period: t('planProPeriod'),
      badge: t('planProBadge'),
      features: [t('planProFeat1'), t('planProFeat2'), t('planProFeat3'), t('planProFeat4'), t('planProFeat5')],
      cta: t('planProCta'),
      ctaType: 'checkout' as const,
    },
    {
      id: 'entreprise',
      name: t('planEntName'),
      price: t('planEntPrice'),
      period: t('planEntPeriod'),
      badge: null,
      features: [t('planEntFeat1'), t('planEntFeat2'), t('planEntFeat3'), t('planEntFeat4')],
      cta: t('planEntCta'),
      ctaType: 'callback' as const,
    },
  ];

  const handleSubscribe = async (plan: (typeof PLANS)[number]) => {
    if (!isAuthenticated) {
      toast.info('Connectez-vous pour souscrire.');
      navigate('/connexion', { state: { from: '/tarifs' } });
      return;
    }

    const match = backendPlans.find((p) => p.plan_code === plan.id);
    if (!match) {
      toast.error("Ce forfait n'est pas encore disponible à la souscription en ligne.");
      return;
    }

    // REDIRECT TO STRIPE CHECKOUT PAGE
    navigate(`/checkout/${match.id}`);
  };

  return (
    // Responsive: Perfect mobile (max-w-md) & Premium web (max-w-5xl)
    <div className="page-fade-in w-full max-w-md md:max-w-5xl mx-auto px-4 py-6 overflow-x-hidden">
      
      {/* ========== 1. HEADER ========== */}
      <div className="mb-6 md:mb-12">
        <span className="text-xs font-bold text-orange uppercase tracking-widest">Tarifs</span>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mt-1 mb-2">
          Des tarifs simples.<br />
          <span className="text-orange">Des intérêts alignés.</span>
        </h1>
        <p className="text-[#B9BBC8] text-sm md:text-base leading-relaxed md:max-w-2xl">
          Un abonnement pour accéder à la plateforme et à notre accompagnement. Une commission uniquement lorsque vous signez un marché.
        </p>
      </div>

      {/* ========== 2. COMMISSION CARD (Button Added!) ========== */}
      <div className="border border-orange rounded-xl md:rounded-2xl bg-[#061D32] p-4 md:p-8 mb-6 md:mb-8 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange/20 rounded-bl-[100%] blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2 md:mb-4">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange md:w-12 md:h-12">
              <path d="m11 17 2 2a1 1 0 1 0 3-3" />
              <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
              <path d="m21 3 1 11h-2" />
              <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
              <path d="M3 4h8" />
            </svg>
            <h2 className="text-[10px] md:text-sm font-bold text-orange uppercase tracking-wider">Vous signez, nous sommes rémunérés.</h2>
          </div>

          <div className="mb-3 md:mb-6">
            <div className="flex items-end gap-2 mb-1 md:mb-2">
              <span className="text-4xl md:text-6xl font-extrabold text-orange leading-none">0,5%</span>
              <span className="text-xl md:text-3xl font-bold text-white leading-none mb-1">à 5%</span>
            </div>
            <p className="text-xs md:text-base font-semibold text-white mb-1 md:mb-2">du montant du marché signé</p>
            <p className="text-[11px] md:text-sm text-[#B9BBC8] leading-snug md:leading-relaxed md:max-w-2xl">
              Le pourcentage dépend notamment du montant, du type de marché et de sa complexité. Il est défini avec vous dès le départ.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 md:grid-cols-3 md:gap-6 border-t border-[#17334D] pt-3 md:pt-6">
            <div>
              <Ban size={14} className="text-orange mb-1 md:w-6 md:h-6 md:mb-2" />
              <p className="text-[10px] md:text-sm font-semibold text-white leading-tight">Aucun marché signé</p>
              <p className="text-[9px] md:text-xs text-[#B9BBC8]">= aucune commission</p>
            </div>
            <div className="border-l border-[#17334D] pl-2 md:pl-0 md:border-l-0">
              <FileText size={14} className="text-orange mb-1 md:w-6 md:h-6 md:mb-2" />
              <p className="text-[10px] md:text-sm font-semibold text-white leading-tight">Pas de frais</p>
              <p className="text-[9px] md:text-xs text-[#B9BBC8]">de dossier</p>
            </div>
            <div className="border-l border-[#17334D] pl-2 md:pl-0 md:border-l-0">
              <Target size={14} className="text-orange mb-1 md:w-6 md:h-6 md:mb-2" />
              <p className="text-[10px] md:text-sm font-semibold text-white leading-tight">Pourcentage fixé</p>
              <p className="text-[9px] md:text-xs text-[#B9BBC8]">avant de commencer</p>
            </div>
          </div>

          <button 
            onClick={() => handleSubscribe(PLANS[1])}
            className="w-full bg-orange text-white font-bold py-2.5 md:py-4 rounded-lg md:rounded-xl mt-3 md:mt-8 hover:bg-orange/90 transition-colors flex items-center justify-center gap-1.5 text-xs md:text-base"
          >
            <Trophy size={14} className="md:w-5 md:h-5" /> Démarrer avec nous
          </button>
        </div>
      </div>

      {/* ========== 3. MAIN CARD (S'abonner Button Linked!) ========== */}
      <div className="border border-orange rounded-xl md:rounded-2xl bg-[#061D32] p-4 md:p-8 mb-5 md:mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:gap-12">
          <div className="md:w-1/2">
            <div className="flex items-start gap-3 md:block">
              <div className="w-10 h-10 md:w-16 md:h-16 shrink-0 rounded-lg md:rounded-xl border border-orange flex items-center justify-center">
                <Monitor size={20} className="text-orange md:hidden" />
                <Monitor size={30} className="text-orange hidden md:block" />
              </div>
              
              <div className="flex-1 md:mt-4">
                <h2 className="text-[10px] md:text-xs font-bold text-orange uppercase tracking-wider mb-1">Accès et accompagnement</h2>
                <p className="text-[10px] md:text-xs text-[#B9BBC8] mb-1">À partir de</p>
                <div className="flex items-end gap-1 mb-2 md:mb-3">
                  <span className="text-4xl md:text-6xl font-extrabold text-orange leading-none">29</span>
                  <span className="text-lg md:text-2xl font-bold text-orange leading-none mb-1">€/mois</span>
                </div>
                <p className="text-[11px] md:text-sm text-[#B9BBC8] leading-snug md:leading-relaxed">
                  Le tarif exact dépend du profil de votre entreprise, des marchés recherchés et du niveau d'accompagnement nécessaire. Il est confirmé avec vous avant tout engagement.
                </p>
              </div>
            </div>
          </div>

          <div className="md:w-1/2 mt-4 md:mt-0">
            <div className="border-t md:border-t-0 border-[#17334D] pt-4 md:pt-0">
              <ul className="space-y-2.5 md:space-y-4">
                {PLANS[1].features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 md:gap-3">
                    <Check size={13} className="text-orange shrink-0 md:hidden" />
                    <Check size={16} className="text-orange shrink-0 hidden md:block" />
                    <span className="text-xs md:text-base text-white">{f}</span>
                  </li>
                ))}
              </ul>
              
              {/* Subscribe Button */}
              <button 
                onClick={() => handleSubscribe(PLANS[1])}
                className="w-full bg-orange text-white font-bold py-3 mt-4 rounded-lg hover:bg-orange/90 transition-colors text-sm"
              >
                {PLANS[1].cta}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 4. 3-STEP PROCESS ========== */}
      <div className="border border-[#17334D] rounded-xl md:rounded-2xl bg-[#061D32] p-6 md:p-8 mb-4 md:mb-6">
        <h2 className="text-[10px] md:text-sm font-bold text-orange uppercase tracking-wider mb-6 md:mb-8">Un modèle clair en 3 étapes</h2>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between md:gap-8 relative">
          <div className="absolute top-2.5 left-7 right-7 border-t border-dashed border-[#17334D] z-0 hidden md:block" />
          
          <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center relative z-10 md:w-1/3">
            <div className="w-5 h-5 md:w-8 md:h-8 rounded-full border border-orange bg-[#061D32] text-orange flex items-center justify-center text-[9px] md:text-sm font-bold shrink-0">1</div>
            <div className="md:mt-3">
              <Search size={18} className="text-orange mb-1 md:hidden" />
              <Search size={24} className="text-orange mb-2 hidden md:block" />
              <p className="text-[9px] md:text-sm font-semibold text-white leading-snug md:mt-2">Nous étudions votre entreprise et vos objectifs</p>
            </div>
          </div>

          <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center relative z-10 md:w-1/3">
            <div className="w-5 h-5 md:w-8 md:h-8 rounded-full border border-orange bg-[#061D32] text-orange flex items-center justify-center text-[9px] md:text-sm font-bold shrink-0">2</div>
            <div className="md:mt-3">
              <CalendarDays size={18} className="text-orange mb-1 md:hidden" />
              <CalendarDays size={24} className="text-orange mb-2 hidden md:block" />
              <p className="text-[9px] md:text-sm font-semibold text-white leading-snug md:mt-2">Votre abonnement et votre pourcentage sont fixés à l'avance</p>
            </div>
          </div>

          <div className="flex items-start gap-4 md:flex-col md:items-center md:text-center relative z-10 md:w-1/3">
            <div className="w-5 h-5 md:w-8 md:h-8 rounded-full border border-orange bg-[#061D32] text-orange flex items-center justify-center text-[9px] md:text-sm font-bold shrink-0">3</div>
            <div className="md:mt-3">
              <ClipboardCheck size={18} className="text-orange mb-1 md:hidden" />
              <ClipboardCheck size={24} className="text-orange mb-2 hidden md:block" />
              <p className="text-[9px] md:text-sm font-semibold text-white leading-snug md:mt-2">Vous signez le marché : notre commission devient due</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 5. CUSTOM PRICE CTA ========== */}
      <div className="border border-[#17334D] rounded-xl md:rounded-2xl bg-[#061D32] p-4 md:p-8 mb-3 md:mb-0 text-left">
        <div className="flex flex-col md:flex-row md:items-center md:gap-8">
          <div className="flex items-start gap-3 md:block">
            <div className="w-9 h-9 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-orange/10 border border-orange/30 flex items-center justify-center shrink-0">
              <User size={18} className="text-orange md:hidden" />
              <User size={28} className="text-orange hidden md:block" />
            </div>
            
            <div className="flex-1 md:mt-4">
              <h2 className="text-sm md:text-2xl font-bold text-white mb-1 md:mb-2">Obtenez votre tarif personnalisé</h2>
              <p className="text-[11px] md:text-sm text-[#B9BBC8] leading-snug md:leading-relaxed mb-3 md:mb-5">
                Quelques minutes suffisent pour comprendre votre besoin et vous annoncer des conditions claires.
              </p>
              
              <div className="flex gap-2 md:gap-3 md:max-w-lg">
                <button 
                  onClick={() => setApptOpen(true)} 
                  className="flex-1 md:flex-none bg-orange text-white font-bold py-2.5 md:py-3 px-3 md:px-6 rounded-lg md:rounded-xl hover:bg-orange/90 transition-colors flex items-center justify-center gap-1.5 text-[11px] md:text-sm"
                >
                  <CalendarDays size={25} className="md:w-4 md:h-4" /> Prendre rendez‑vous
                </button>
                <button 
                  onClick={() => setCallbackOpen(true)} 
                  className="flex-1 md:flex-none border border-orange text-orange font-bold py-2.5 md:py-3 px-3 md:px-6 rounded-lg md:rounded-xl hover:bg-orange/10 transition-colors flex items-center justify-center gap-1.5 text-[11px] md:text-sm"
                >
                  <Phone size={13} className="md:w-4 md:h-4" /> Être rappelé
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== 6. FOOTER LINK ========== */}
      <div className="text-center pb-4 mt-4 md:mt-8">
        <p className="text-[11px] md:text-sm text-[#B9BBC8]">
          Vous préférez commercer seul ?{' '}
          <button onClick={() => navigate('/recherche')} className="text-orange font-semibold hover:underline">
            Découvrez Marchés Direct App →
          </button>
        </p>
      </div>

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}