import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CreditCard, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionsApi, getApiErrorMessage, type ApiSubscriptionPlan } from '@/lib/apiClient';

export default function StripeCheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const [plan, setPlan] = useState<ApiSubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch plan details
  useEffect(() => {
    if (!planId) return;
    
    subscriptionsApi.plans()
      .then(plans => {
        const foundPlan = plans.find(p => String(p.id) === planId);
        if (!foundPlan) {
          toast.error('Plan not found');
          navigate('/tarifs');
          return;
        }
        setPlan(foundPlan);
      })
      .catch(() => {
        toast.error('Could not load plan details');
      })
      .finally(() => setLoading(false));
  }, [planId, navigate]);

  // If user arrives from Stripe after payment
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      toast.success('Payment successful! Welcome aboard!');
      // Redirect to dashboard after a moment
      setTimeout(() => navigate('/tableau-de-bord'), 3000);
    } else if (status === 'cancel') {
      toast.info('Payment cancelled. You can try again.');
    }
  }, [searchParams, navigate]);

  // Start Stripe Checkout
  const handleStartCheckout = async () => {
    if (!isAuthenticated) {
      toast.info('Please log in to subscribe.');
      navigate('/connexion', { state: { from: `/checkout/${planId}` } });
      return;
    }

    if (!plan) return;

    setCheckoutLoading(true);
    try {
      const { checkoutUrl } = await subscriptionsApi.checkout(String(plan.id));
      // Redirect to Stripe's hosted checkout page
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not start payment.'));
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
      {/* Back Button */}
      <button 
        onClick={() => navigate('/tarifs')}
        className="flex items-center gap-2 text-[#B9BBC8] hover:text-white transition-colors mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Retour aux tarifs
      </button>

      <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-6">
        <h1 className="text-2xl font-extrabold text-white mb-2">Finaliser votre abonnement</h1>
        <p className="text-sm text-[#B9BBC8] mb-6">
          Vous allez être redirigé vers Stripe pour un paiement sécurisé.
        </p>

        {/* Plan Details */}
        <div className="bg-[#031B30] border border-[#17334D] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange uppercase tracking-wider">{plan?.name}</span>
            <span className="text-sm font-bold text-white">
              {plan?.price ? `${plan.price} € / mois` : 'Sur devis'}
            </span>
          </div>
          <p className="text-xs text-[#B9BBC8]">Abonnement mensuel, résiliable à tout moment.</p>
        </div>

        {/* Security Badges */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-[#B9BBC8]">
            <ShieldCheck size={16} className="text-green-400" />
            Paiement 100% sécurisé
          </div>
          <div className="flex items-center gap-2 text-xs text-[#B9BBC8]">
            <Lock size={16} className="text-orange" />
            Données chiffrées
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleStartCheckout}
          disabled={checkoutLoading}
          className="w-full bg-orange text-white font-bold py-4 rounded-xl hover:bg-orange/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {checkoutLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Redirection vers Stripe...
            </>
          ) : (
            <>
              <CreditCard size={18} />
              Payer avec Stripe
            </>
          )}
        </button>

        <p className="text-center text-xs text-[#B9BBC8] mt-4">
          En cliquant, vous acceptez nos conditions générales d'utilisation.
        </p>
      </div>
    </div>
  );
}