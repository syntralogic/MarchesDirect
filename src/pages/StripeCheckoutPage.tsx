import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CreditCard, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionsApi, getApiErrorMessage, type ApiSubscriptionPlan } from '@/lib/apiClient';
import { useLang } from '@/contexts/LangContext';

export default function StripeCheckoutPage() {
  const { t } = useLang();
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const [plan, setPlan] = useState<ApiSubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (!planId) return;
    
    subscriptionsApi.plans()
      .then(plans => {
        const foundPlan = plans.find(p => String(p.id) === planId);
        if (!foundPlan) {
          toast.error(t('checkoutPlanNotFound') || 'Plan not found');
          navigate('/tarifs');
          return;
        }
        setPlan(foundPlan);
      })
      .catch(() => {
        toast.error(t('checkoutLoadError') || 'Could not load plan details');
      })
      .finally(() => setLoading(false));
  }, [planId, navigate, t]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast.success(t('checkoutPaymentSuccess') || 'Payment successful! Welcome aboard!');
      setTimeout(() => navigate('/tableau-de-bord'), 3000);
    } else if (status === 'cancel') {
      toast.info(t('checkoutPaymentCancel') || 'Payment cancelled. You can try again.');
    }
  }, [searchParams, navigate, t]);

  const handleStartCheckout = async () => {
    if (!isAuthenticated) {
      toast.info(t('checkoutLoginRequired') || 'Please log in to subscribe.');
      navigate('/connexion', { state: { from: `/checkout/${planId}` } });
      return;
    }

    if (!plan) return;

    setCheckoutLoading(true);
    try {
      const { checkoutUrl } = await subscriptionsApi.checkout(String(plan.id));
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('checkoutError') || 'Could not start payment.'));
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-fade-in max-w-lg mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/tarifs')}
        className="flex items-center gap-2 text-[#B9BBC8] hover:text-white transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={16} /> {t('checkoutBack')}
      </button>

      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold text-white mb-2">{t('checkoutTitle')}</h1>
        <p className="text-sm text-[#B9BBC8] mb-6">{t('checkoutSub')}</p>

        <div className="bg-[#031B30] border border-[#17334D] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange uppercase tracking-wider">{t('checkoutPlan')}</span>
            <span className="text-sm font-bold text-white">
              {plan?.name} {plan?.price ? `- ${plan.price} € / ${t('checkoutMonthly') || 'month'}` : ''}
            </span>
          </div>
          <p className="text-xs text-[#B9BBC8]">{t('checkoutMonthly')}</p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-[#B9BBC8]">
            <ShieldCheck size={16} className="text-green-400" />
            {t('checkoutSecure')}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#B9BBC8]">
            <Lock size={16} className="text-orange" />
            {t('checkoutEncrypted')}
          </div>
        </div>

        <button
          onClick={handleStartCheckout}
          disabled={checkoutLoading}
          className="w-full bg-orange text-white font-bold py-4 rounded-xl hover:bg-orange/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {checkoutLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t('checkoutRedirecting')}
            </>
          ) : (
            <>
              <CreditCard size={18} />
              {t('checkoutPay')}
            </>
          )}
        </button>

        <p className="text-center text-xs text-[#B9BBC8] mt-4">
          {t('checkoutAcceptTerms')}
        </p>
      </div>
    </div>
  );
}