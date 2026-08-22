export default function MentionsLegalesPage() {
  return (
    <div className="page-fade-in max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-16">
      <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-8">Mentions légales</h1>

      {[
        {
          title: 'Éditeur',
          content: [
            'Marchés Direct SAS',
            'Capital social : 50 000 €',
            'RCS Paris B 987 654 321',
            'Siège social : 15 rue de la Paix, 75001 Paris, France',
            'Directeur de la publication : Jean Dupont',
          ],
        },
        {
          title: 'Hébergeur',
          content: [
            'Supabase Inc.',
            '970 Toa Payoh North, Singapore 318992',
            'https://supabase.com',
          ],
        },
        {
          title: 'Coordonnées',
          content: [
            'Email : contact@marchesdirect.fr',
            'Téléphone : +33 1 23 45 67 89',
            'Horaires : Lundi – Vendredi, 9h – 18h',
          ],
        },
        {
          title: 'Propriété intellectuelle',
          content: [
            'L\'ensemble du contenu de ce site (textes, images, logos, structure) est protégé par le droit d\'auteur et appartient à Marchés Direct SAS ou à ses partenaires.',
            'Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.',
          ],
        },
        {
          title: 'Responsabilité',
          content: [
            'Marchés Direct s\'efforce de maintenir les informations disponibles à jour et exactes. Toutefois, la société ne saurait être tenue responsable des erreurs ou omissions dans les contenus publiés.',
            'L\'utilisation des informations disponibles sur ce site se fait sous la responsabilité exclusive de l\'utilisateur.',
          ],
        },
      ].map(section => (
        <section key={section.title} className="mb-8">
          <h2 className="text-base font-bold text-orange mb-3 uppercase tracking-wide text-xs">{section.title}</h2>
          <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-5 space-y-2">
            {section.content.map((line, i) => (
              <p key={i} className="text-sm text-[#B9BBC8] leading-relaxed">{line}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
