import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';

// Repères de sécurité (5 nov.), comme sur l'espace d'une banque : dernière connexion, appareils connectés,
// « me déconnecter partout », et l'accès à ses données. Confirmation dans la page, jamais de fenêtre système.
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }) : 'non disponible');

export default function SecurityCard() {
  const { logout } = useAuth(); const navigate = useNavigate();
  const [info, setInfo] = useState<{ lastLogin: string | null; sessions: { createdAt: string }[] } | null>(null);
  const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState(false);
  useEffect(() => { apiClient.get('/auth/security').then(r => setInfo(r.data)).catch(() => setInfo(null)); }, []);
  const everywhere = async () => {
    setBusy(true); setErr(false);
    try { await apiClient.post('/auth/logout-everywhere'); logout(); navigate('/connexion', { replace: true }); }
    catch { setErr(true); setBusy(false); }
  };
  const n = info?.sessions.length ?? null;
  return (
    <section className="flex flex-col gap-2 rounded-[14px] border border-[#22385A] bg-[#0F1F35] p-3" aria-label="Sécurité du compte">
      <b className="flex items-center gap-2 text-[14.5px]"><ShieldCheck size={17} className="text-[#6EE7B7]" aria-hidden /> Sécurité de votre compte</b>
      <p className="text-[13px] text-[#D6E0EC]">Dernière connexion : <b>{when(info?.lastLogin || null)}</b>{n != null && <> · {n} appareil{n > 1 ? 's' : ''} connecté{n > 1 ? 's' : ''}</>}</p>
      <p className="text-[12.5px] text-[#B4C1D3]">Connexion par lien e-mail, sans mot de passe à retenir. Si vous ne reconnaissez pas une connexion, déconnectez tous vos appareils.</p>
      {!confirm
        ? <button type="button" onClick={() => setConfirm(true)} className="min-h-[44px] self-start text-[13.5px] font-bold text-[#FB923C] underline">Me déconnecter de tous mes appareils</button>
        : <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-[#D6E0EC]">Vous devrez redemander un lien sur chaque appareil.</span>
            <button type="button" disabled={busy} onClick={everywhere} className="min-h-[44px] rounded-xl bg-[#C2410C] px-3 text-[13.5px] font-extrabold text-white disabled:opacity-60">{busy ? 'Déconnexion…' : 'Confirmer'}</button>
            <button type="button" onClick={() => setConfirm(false)} className="min-h-[44px] px-2 text-[13.5px] text-[#B4C1D3] underline">Annuler</button>
          </div>}
      {err && <p className="text-[13px] text-[#FCA5A5]">La déconnexion a échoué. Réessayez.</p>}
      <Link to="/profil" className="text-[13px] font-semibold text-[#B4C1D3] underline">Mes informations, mes données et la suppression du compte</Link>
    </section>
  );
}
