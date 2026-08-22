export default function CguPage() {
  const sections = [
    {
      title: 'Utilisation du service',
      text: 'Marchés Direct est une plateforme de veille, de qualification et d\'assistance à la réponse aux appels d\'offres. L\'accès au service est réservé aux professionnels (entreprises, auto-entrepreneurs, associations). L\'utilisation à des fins personnelles ou non commerciales n\'est pas autorisée.',
    },
    {
      title: 'Création de compte',
      text: 'L\'inscription requiert la fourniture d\'informations exactes et à jour. Vous êtes seul responsable de la confidentialité de vos identifiants. Tout accès non autorisé à votre compte doit être signalé immédiatement à Marchés Direct.',
    },
    {
      title: 'Abonnements',
      text: 'Les abonnements sont payants (sauf Découverte). Le paiement s\'effectue mensuellement par prélèvement automatique. Les tarifs sont affichés HT. Marchés Direct se réserve le droit de modifier ses tarifs avec un préavis de 30 jours.',
    },
    {
      title: 'Résiliation',
      text: 'Vous pouvez résilier votre abonnement à tout moment depuis votre espace Profil. La résiliation prend effet à la fin de la période en cours. Aucun remboursement prorata temporis n\'est effectué sauf cas prévu par la loi.',
    },
    {
      title: 'Module réponse aux appels d\'offres',
      text: 'La génération de dossiers par IA est fournie à titre d\'assistance uniquement. Marchés Direct ne garantit pas l\'attribution des marchés. Les dossiers générés doivent être vérifiés et validés par l\'utilisateur avant soumission. La responsabilité du contenu déposé incombe à l\'utilisateur.',
    },
    {
      title: 'Responsabilités',
      text: 'Marchés Direct s\'engage à assurer la disponibilité du service (SLA 99,5 % hors maintenance planifiée) et à sécuriser les données. En cas d\'indisponibilité prolongée, une proratisation de l\'abonnement peut être accordée sur demande. Marchés Direct n\'est pas responsable des décisions des acheteurs publics ou privés.',
    },
    {
      title: 'Loi applicable',
      text: 'Les présentes CGU sont soumises au droit français. Tout litige sera de la compétence exclusive des tribunaux de Paris, sauf disposition légale contraire.',
    },
  ];

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-xs text-[#B9BBC8]">Version en vigueur depuis le 1er janvier 2026</p>
      </div>

      <div className="space-y-5">
        {sections.map((s, i) => (
          <div key={s.title} className="bg-[#061D32] border border-[#17334D] rounded-xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xs font-bold text-orange/60 shrink-0 mt-0.5">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="text-sm font-bold text-orange uppercase tracking-wide">{s.title}</h2>
            </div>
            <p className="text-sm text-[#B9BBC8] leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
