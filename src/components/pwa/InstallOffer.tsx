import { useEffect, useState } from 'react';
import { installMode, onInstallChange, promptInstall, dismissInstall } from '@/lib/pwa';

// Proposition d'ajouter Marchés Direct à l'écran d'accueil : une seule fois, discrète, après un résultat utile.
export default function InstallOffer({ context = 'dossier' }: { context?: 'dossier' | 'espace' }) {
  const [mode, setMode] = useState(installMode());
  const [iosHelp, setIosHelp] = useState(false);
  useEffect(() => onInstallChange(() => setMode(installMode())), []);
  if (!mode) return null;
  const lead = context === 'dossier' ? 'Retrouvez votre dossier en un geste' : 'Marchés Direct sur votre écran d’accueil';
  return (
    <section className="flex flex-col gap-2 rounded-[14px] border border-[#22385A] bg-[#0F1F35] p-3" aria-label="Ajouter à l’écran d’accueil">
      <div className="flex items-center gap-3">
        <img src="/icons/icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-[10px]" />
        <p className="min-w-0 flex-1 text-[13.5px] leading-snug text-[#D6E0EC]"><b className="block text-[14px] text-white">{lead}</b>Ajoutez l’appli à votre écran d’accueil, comme celle de votre banque. Gratuit, rien à télécharger.</p>
      </div>
      {iosHelp && (
        <ol className="flex flex-col gap-1.5 rounded-xl bg-[#12233A] p-2.5 text-[13.5px] text-[#D6E0EC]">
          <li>1. Touchez <b className="text-white">Partager</b> <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#B4C1D3] align-middle text-[12px]">↑</span> en bas de l’écran</li>
          <li>2. Choisissez <b className="text-white">« Sur l’écran d’accueil »</b>, puis <b className="text-white">Ajouter</b></li>
        </ol>)}
      <div className="flex gap-2">
        {mode === 'android'
          ? <button type="button" onClick={() => void promptInstall()} className="min-h-[44px] flex-1 rounded-xl bg-[#F97316] px-3 text-[14px] font-extrabold text-white">Installer l’appli</button>
          : !iosHelp && <button type="button" onClick={() => setIosHelp(true)} className="min-h-[44px] flex-1 rounded-xl bg-[#F97316] px-3 text-[14px] font-extrabold text-white">Me montrer comment</button>}
        <button type="button" onClick={() => { dismissInstall(); setMode(null); }} className="min-h-[44px] rounded-xl px-3 text-[13.5px] font-semibold text-[#B4C1D3] underline">{iosHelp ? 'C’est fait' : 'Plus tard'}</button>
      </div>
    </section>
  );
}
