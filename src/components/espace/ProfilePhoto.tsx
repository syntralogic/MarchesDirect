import { useRef, useState, type ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadsApi } from '@/lib/apiClient';
import { prepareAvatar } from '@/lib/prepareAvatar';
import { saveLocalAvatar } from '@/lib/localAvatar';
import ProfileAvatar, { useProfilePhotoUrl } from '@/components/ProfileAvatar';

export default function ProfilePhoto() {
  const { isAuthenticated, loading, refreshProfile } = useAuth();
  const photo = useProfilePhotoUrl();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    setBusy(true); setError(null); setSaved(false);
    try {
      const prepared = await prepareAvatar(file);
      if (isAuthenticated) {
        await uploadsApi.uploadAvatar(prepared.file);
        await refreshProfile();
      } else {
        saveLocalAvatar(prepared.dataUrl);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error && !('isAxiosError' in err)
        ? err.message : 'La photo n’a pas pu être enregistrée. Réessayez dans un instant.');
    } finally { setBusy(false); }
  }

  function remove() {
    setError(null); setSaved(false);
    try { saveLocalAvatar(null); } catch (err) { setError((err as Error).message); }
  }

  return (
    <section aria-label="Ma photo de profil" className="rounded-[14px] border border-[#22385A] bg-[#0F1F35] p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1E3352] text-[#B4C1D3]">
          <ProfileAvatar size={56} />
        </div>
        <div className="min-w-0 flex-1">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={choose}
            aria-label="Choisir ma photo" className="sr-only" tabIndex={-1} disabled={busy || loading} />
          <button type="button" onClick={() => input.current?.click()} disabled={busy || loading}
            className="flex min-h-[44px] items-center gap-2 text-[14px] font-bold text-[#FB923C] disabled:opacity-60">
            <Camera size={18} aria-hidden="true" />{busy ? 'Enregistrement…' : photo ? 'Modifier ma photo' : 'Ajouter ma photo'}
          </button>
          <p className="text-[12px] leading-relaxed text-[#B4C1D3]">{isAuthenticated
            ? 'Photo ou logo de votre entreprise, enregistré sur votre compte.'
            : 'Photo ou logo, conservé uniquement sur cet appareil.'}</p>
        </div>
      </div>
      {!isAuthenticated && photo && <button type="button" onClick={remove} disabled={busy}
        className="mt-1 min-h-[44px] text-[12px] text-[#B4C1D3] underline">Retirer ma photo de cet appareil</button>}
      {error && <p role="alert" className="mt-2 text-[13px] text-[#FCA5A5]">{error}</p>}
      {saved && <p role="status" className="mt-2 text-[13px] text-[#6EE7B7]">{isAuthenticated ? 'Photo enregistrée sur votre compte.' : 'Photo enregistrée sur cet appareil.'}</p>}
    </section>
  );
}
