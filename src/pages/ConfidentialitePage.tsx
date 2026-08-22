export default function ConfidentialitePage() {
  const sections = [
    {
      title: 'Données collectées',
      text: 'Marchés Direct collecte les données nécessaires à la fourniture de ses services : nom, prénom, adresse email, numéro de téléphone, SIRET de l\'entreprise, adresse postale et préférences de recherche. Ces données sont collectées lors de l\'inscription et lors de l\'utilisation du service.',
    },
    {
      title: 'Finalités du traitement',
      text: 'Vos données sont utilisées pour : créer et gérer votre compte, vous envoyer des alertes d\'opportunités, générer vos dossiers de réponse, améliorer nos services grâce à des statistiques anonymisées, et vous contacter dans le cadre du support client.',
    },
    {
      title: 'Conservation des données',
      text: 'Vos données sont conservées pendant la durée de votre abonnement et jusqu\'à 3 ans après la résiliation de votre compte, sauf obligation légale de conservation plus longue. Les données de facturation sont conservées 10 ans conformément aux obligations comptables.',
    },
    {
      title: 'Vos droits (RGPD)',
      text: 'Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d\'un droit d\'accès, de rectification, d\'effacement, de limitation, de portabilité et d\'opposition. Pour exercer ces droits, contactez : privacy@marchesdirect.fr',
    },
    {
      title: 'Suppression du compte',
      text: 'Vous pouvez demander la suppression de votre compte et de vos données à tout moment depuis votre espace Profil > Application, ou en nous contactant directement. La suppression est effective sous 30 jours ouvrés.',
    },
    {
      title: 'Sécurité',
      text: 'Marchés Direct met en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données : chiffrement en transit (TLS), chiffrement au repos, authentification à deux facteurs disponible, audit de sécurité régulier et hébergement conforme ISO 27001.',
    },
    {
      title: 'Cookies',
      text: 'Nous utilisons des cookies strictement nécessaires au fonctionnement du service (session, préférences) et des cookies analytiques anonymisés pour améliorer l\'expérience. Aucun cookie publicitaire tiers n\'est utilisé.',
    },
  ];

  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Politique de confidentialité</h1>
        <p className="text-xs text-[#B9BBC8]">Dernière mise à jour : 1er août 2026</p>
      </div>

      <div className="space-y-5">
        {sections.map(s => (
          <div key={s.title} className="bg-[#061D32] border border-[#17334D] rounded-xl p-5">
            <h2 className="text-sm font-bold text-orange uppercase tracking-wide mb-3">{s.title}</h2>
            <p className="text-sm text-[#B9BBC8] leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-[#061D32] border border-orange/20 rounded-xl p-5">
        <p className="text-sm text-[#B9BBC8]">
          Pour toute question relative à vos données personnelles, contactez notre DPO : <span className="text-orange">privacy@marchesdirect.fr</span>
        </p>
      </div>
    </div>
  );
}
