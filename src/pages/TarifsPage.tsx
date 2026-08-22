import { useState } from 'react';
import { Check } from 'lucide-react';
import { CallbackModal } from '@/components/CallbackModal';
import { AppointmentModal } from '@/components/AppointmentModal';

const PLANS = [
  {
    id: 'decouverte',
    name: 'DÉCOUVERTE',
    price: '0',
    period: '14 jours d\'essai',
    badge: null,
    features: [
      '1 métier suivi',
      'Alertes par email',
      'Recherche et filtres',
      'Support par email',
    ],
    cta: 'Essayer gratuitement',
    ctaType: 'appt' as const,
    highlight: false,
  },
  {
    id: 'pro',
    name: 'PRO',
    price: '89',
    period: '/ mois',
    badge: 'Le plus choisi',
    features: [
      'Métiers et journeys illimités',
      'Matching et résumé IA',
      'Chatbot IA',
      'Module réponse aux appels d\'offres',
      'Profil entreprise et coffre-fort documentaire',
    ],
    cta: 'Demander un rappel',
    ctaType: 'callback' as const,
    highlight: true,
  },
  {
    id: 'entreprise',
    name: 'ENTREPRISE',
    price: 'Sur devis',
    period: 'Plusieurs utilisateurs',
    badge: null,
    features: [
      'Comptes multi-utilisateurs',
      'Export CRM dédié',
      'Accompagnement dédié',
      'MFA et rôles avancés',
    ],
    cta: 'Être rappelé',
    ctaType: 'callback' as const,
    highlight: false,
  },
];

export default function TarifsPage() {
  const [apptOpen, setApptOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <div className="page-fade-in max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-16">
      {/* Header */}
      <div className="text-center mb-10 md:mb-14">
        <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-3">Un abonnement, toutes vos opportunités.</h1>
        <p className="text-[#B9BBC8] text-sm md:text-base max-w-xl mx-auto">
          Commencez gratuitement. Un conseiller vous rappelle pour configurer votre profil et choisir la formule adaptée.
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
                {plan.price === 'Sur devis' ? (
                  <span className="text-3xl font-extrabold text-white">Sur devis</span>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    {plan.price !== '0' && <span className="text-[#B9BBC8] text-sm mb-1">€</span>}
                    {plan.price === '0' && <span className="text-[#B9BBC8] text-sm mb-1">€</span>}
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
              onClick={() => plan.ctaType === 'appt' ? setApptOpen(true) : setCallbackOpen(true)}
              className={`w-full font-semibold py-3.5 rounded-xl transition-colors text-sm ${
                plan.highlight
                  ? 'bg-orange text-white hover:bg-orange/90'
                  : 'border border-orange text-orange hover:bg-orange/10'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Note */}
      <p className="text-center text-xs text-[#B9BBC8] mt-8">
        Tous les tarifs s'entendent HT. Sans engagement. Résiliation à tout moment depuis votre espace profil.
      </p>

      <AppointmentModal open={apptOpen} onClose={() => setApptOpen(false)} />
      <CallbackModal open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </div>
  );
}
