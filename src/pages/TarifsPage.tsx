import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CallbackModal } from '@/components/CallbackModal';
import { AppointmentModal } from '@/components/AppointmentModal';
import { useLang } from '@/contexts/LangContext';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionsApi, getApiErrorMessage, type ApiSubscriptionPlan } from '@/lib/apiClient';

export default function TarifsPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [backendPlans, setBackendPlans] = useState<ApiSubscriptionPlan[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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
      features: [
        t('planDiscoveryFeat1'),
        t('planDiscoveryFeat2'),
        t('planDiscoveryFeat3'),
        t('planDiscoveryFeat4'),
      ],
      cta: t('planDiscoveryCta'),
      ctaType: 'appt' as const,
      highlight: false,
    },
    {
      id: 'pro',
      name: t('planProName'),
      price: '89',
      period: t('planProPeriod'),
      badge: t('planProBadge'),
      features: [
        t('planProFeat1'),
        t('planProFeat2'),
        t('planProFeat3'),
        t('planProFeat4'),
        t('planProFeat5'),
      ],
      cta: t('planProCta'),
      ctaType: 'checkout' as const,
      highlight: true,
    },
    {
      id: 'entreprise',
      name: t('planEntName'),
      price: t('planEntPrice'),
      period: t('planEntPeriod'),
      badge: null,
      features: [
        t('planEntFeat1'),
        t('planEntFeat2'),
        t('planEntFeat3'),
        t('planEntFeat4'),
      ],
      cta: t('planEntCta'),
      ctaType: 'callback' as const,
      highlight: false,
    },
  ];

  const handleSubscribe = async (plan: (typeof PLANS)[number]) => {
    if (!isAuthenticated) {
      toast.info('Connectez-vous pour souscrire.');
      navigate('/connexion', { state: { from: '/tarifs' } });
      return;
    }

    // plan.id here ('decouverte'/'pro'/'entreprise') is the same stable
    // code stored in subscription_plans.plan_code on the backend.
    const match = backendPlans.find((p) => p.plan_code === plan.id);
    if (!match) {
      toast.error("Ce forfait n'est pas encore disponible à la souscription en ligne.");
      return;
    }

    setCheckoutLoading(plan.id);
    try {
      const { checkoutUrl } = await subscriptionsApi.checkout(String(match.id));
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible de démarrer le paiement.'));
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16">
      {/* Header */}
      <div className="text-center mb-10 md:mb-14">
        <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-3">{t('pricingTitle')}</h1>
        <p className="text-[#B9BBC8] text-sm md:text-base max-w-xl mx-auto">
          {t('pricingSub')}
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
              plan.highlight
                ? 'border-orange bg-[#061D32] orange-glow-sm'
                : 'border-[#17334D] bg-[#061D32]'
            }`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-orange text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </span>
              </div>
            )}

            {/* Plan name */}
            <div className="mb-5">
              <h2 className="text-xs font-bold text-orange uppercase tracking-widest mb-3">{plan.name}</h2>
              <div className="flex items-end gap-1">
                {plan.price === t('planEntPrice') ? (
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-[#B9BBC8] text-sm mb-1">€</span>
                  </>
                )}
              </div>
              <p className="text-xs text-[#B9BBC8] mt-1">{plan.period}</p>
            </div>

            {/* Features */}
            <ul className="space-y-3 flex-1 mb-7">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check size={14} className="text-orange shrink-0 mt-0.5" />
                  <span className="text-sm text-[#B9BBC8]">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => {
                if (plan.ctaType === 'appt') setApptOpen(true);
                else if (plan.ctaType === 'checkout') handleSubscribe(plan);
                else setCallbackOpen(true);
              }}
              disabled={checkoutLoading === plan.id}
              className={`w-full font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60 ${
                plan.highlight
                  ? 'bg-orange text-white hover:bg-orange/90'
                  : 'border border-orange text-orange hover:bg-orange/10'
              }`}
            >
              {checkoutLoading === plan.id && <Loader2 size={14} className="animate-spin" />}
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="text-center text-xs text-[#B9BBC8] mt-8">
        {t('pricingNote')}
      </p>

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}