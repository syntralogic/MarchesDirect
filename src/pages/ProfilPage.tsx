import { useState } from 'react';
import { User, Building2, Settings, Bell, Shield, Smartphone, Save, LogOut } from 'lucide-react';

const SECTIONS = [
  { key: 'profil', icon: User, label: 'Mon profil' },
  { key: 'entreprise', icon: Building2, label: 'Mon entreprise' },
  { key: 'preferences', icon: Settings, label: 'Préférences' },
  { key: 'notifications', icon: Bell, label: 'Notifications' },
  { key: 'securite', icon: Shield, label: 'Sécurité' },
  { key: 'application', icon: Smartphone, label: 'Application' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-orange' : 'bg-[#17334D]'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#B9BBC8] focus:outline-none focus:border-orange transition-colors"
      />
    </div>
  );
}

export default function ProfilPage() {
  const [activeSection, setActiveSection] = useState('profil');
  const [saved, setSaved] = useState(false);

  // Profile state
  const [nom, setNom] = useState('Jean Dupont');
  const [email, setEmail] = useState('jean.dupont@masociete.fr');
  const [phone, setPhone] = useState('06 12 34 56 78');
  const [company, setCompany] = useState('Ma Société SAS');
  const [siret, setSiret] = useState('12345678900012');
  const [address, setAddress] = useState('12 rue de la Paix, 75001 Paris');
  const [website, setWebsite] = useState('www.masociete.fr');
  const [sector, setSector] = useState('Travaux & construction');

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [newOpps, setNewOpps] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [mobileNotifs, setMobileNotifs] = useState(true);

  // Preferences
  const [defaultRadius, setDefaultRadius] = useState('50');
  const [language, setLanguage] = useState('fr');
  const [matchThreshold, setMatchThreshold] = useState('60');

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const renderContent = () => {
    switch (activeSection) {
      case 'profil':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-5">Mon profil</h2>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-orange/20 border-2 border-orange flex items-center justify-center">
                <span className="text-xl font-bold text-orange">JD</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Jean Dupont</p>
                <p className="text-xs text-[#B9BBC8]">Formule Pro · Membre depuis août 2025</p>
                <button className="text-xs text-orange mt-1 hover:underline">Modifier l'avatar</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Nom complet" value={nom} onChange={setNom} />
              <InputField label="Email" value={email} onChange={setEmail} type="email" />
              <InputField label="Téléphone" value={phone} onChange={setPhone} type="tel" />
            </div>
          </div>
        );
      case 'entreprise':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-5">Mon entreprise</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Raison sociale" value={company} onChange={setCompany} />
              <InputField label="SIRET" value={siret} onChange={setSiret} />
              <div className="md:col-span-2">
                <InputField label="Adresse" value={address} onChange={setAddress} />
              </div>
              <InputField label="Site web" value={website} onChange={setWebsite} />
              <div>
                <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Secteur principal</label>
                <select value={sector} onChange={e => setSector(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
                  {['Travaux & construction', 'Énergie & environnement', 'Industrie & maintenance', 'Informatique & télécoms', 'Transport & logistique', 'Services aux entreprises'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        );
      case 'preferences':
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white mb-5">Préférences</h2>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Langue</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange appearance-none">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Rayon de recherche par défaut (km)</label>
              <input type="number" value={defaultRadius} onChange={e => setDefaultRadius(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#B9BBC8] uppercase tracking-wide mb-1.5 block">Seuil de matching minimum (%)</label>
              <input type="number" min="0" max="100" value={matchThreshold} onChange={e => setMatchThreshold(e.target.value)} className="w-full bg-[#061D32] border border-[#17334D] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange" />
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-5">Notifications</h2>
            {[
              { label: 'Alertes par email', sub: 'Recevoir les nouvelles opportunités par email', val: emailAlerts, set: setEmailAlerts },
              { label: 'Nouvelles opportunités', sub: 'Notification immédiate pour chaque nouveau match', val: newOpps, set: setNewOpps },
              { label: 'Rappels d\'échéances', sub: 'Alerte 48h avant la date limite', val: deadlineAlerts, set: setDeadlineAlerts },
              { label: 'Digest hebdomadaire', sub: 'Résumé des opportunités chaque lundi matin', val: weeklyDigest, set: setWeeklyDigest },
              { label: 'Notifications mobiles', sub: 'Notifications push sur votre appareil', val: mobileNotifs, set: setMobileNotifs },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-[#061D32] border border-[#17334D] rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-[#B9BBC8] mt-0.5">{item.sub}</p>
                </div>
                <Toggle checked={item.val} onChange={() => item.set(v => !v)} />
              </div>
            ))}
          </div>
        );
      case 'securite':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-5">Sécurité</h2>
            <div className="grid grid-cols-1 gap-4">
              <InputField label="Mot de passe actuel" value="" onChange={() => {}} type="password" placeholder="••••••••" />
              <InputField label="Nouveau mot de passe" value="" onChange={() => {}} type="password" placeholder="••••••••" />
              <InputField label="Confirmer le nouveau mot de passe" value="" onChange={() => {}} type="password" placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between p-4 bg-[#061D32] border border-[#17334D] rounded-xl">
              <div>
                <p className="text-sm font-medium text-white">Authentification à deux facteurs</p>
                <p className="text-xs text-[#B9BBC8] mt-0.5">Renforcez la sécurité de votre compte</p>
              </div>
              <button className="text-xs text-orange border border-orange px-3 py-1.5 rounded-lg hover:bg-orange/10 transition-colors">Activer</button>
            </div>
          </div>
        );
      case 'application':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-5">Application</h2>
            <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
              <p className="text-xs text-[#B9BBC8] mb-1">Formule actuelle</p>
              <p className="text-sm font-bold text-white">Pro · 89 € / mois</p>
              <p className="text-xs text-[#B9BBC8] mt-0.5">Renouvellement le 22 septembre 2026</p>
              <div className="flex gap-2 mt-3">
                <button className="text-xs text-orange border border-orange px-3 py-1.5 rounded-lg hover:bg-orange/10 transition-colors">Changer de formule</button>
                <button className="text-xs text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors">Résilier</button>
              </div>
            </div>
            <div className="bg-[#061D32] border border-[#17334D] rounded-xl p-4">
              <p className="text-xs text-[#B9BBC8] mb-1">Version</p>
              <p className="text-sm font-bold text-white">Marchés Direct v2.4.1</p>
              <p className="text-xs text-[#B9BBC8] mt-0.5">Dernière mise à jour : 20 août 2026</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-fade-in">
      {/* Mobile section tabs */}
      <div className="md:hidden px-4 pt-6 pb-2 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${activeSection === s.key ? 'bg-orange/10 text-orange border border-orange/30' : 'bg-[#061D32] border border-[#17334D] text-[#B9BBC8]'}`}>
              <s.icon size={12} /> {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex max-w-5xl mx-auto">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 py-8 px-3">
          <h1 className="text-xl font-bold text-white mb-6 px-3">Mon compte</h1>
          <nav className="space-y-1">
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setActiveSection(s.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeSection === s.key ? 'text-orange bg-orange/10' : 'text-[#B9BBC8] hover:text-white hover:bg-white/5'}`}>
                <s.icon size={15} className={activeSection === s.key ? 'text-orange' : ''} />
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-8">
          <div className="bg-[#061D32] border border-[#17334D] rounded-2xl p-5 md:p-6 mb-4">
            {renderContent()}
          </div>

          {/* Save / logout */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleSave} className={`flex items-center justify-center gap-2 bg-orange text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange/90 transition-colors text-sm ${saved ? 'bg-green-500 hover:bg-green-500' : ''}`}>
              <Save size={14} />
              {saved ? 'Enregistré !' : 'Enregistrer les modifications'}
            </button>
            <button className="flex items-center justify-center gap-2 border border-[#17334D] text-[#B9BBC8] font-medium px-6 py-3 rounded-xl hover:border-red-400/40 hover:text-red-400 transition-colors text-sm">
              <LogOut size={14} /> Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
