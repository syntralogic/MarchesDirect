import { useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalAvatar } from '@/lib/localAvatar';
import { useCompanyLogo } from '@/lib/companyLogo';

export function useProfilePhoto() {
  const { user, isAuthenticated, loading } = useAuth();
  const local = useLocalAvatar();
  const manual = isAuthenticated ? user?.avatarUrl || null : local;
  const logo = useCompanyLogo(!manual);
  // Never show a phone-only visitor photo as another account's photo.
  return { url: loading ? null : manual || logo?.dataUrl || null, automatic: !manual && !!logo, source: logo?.source || null, local };
}

export default function ProfileAvatar({ size = 28 }: { size?: number }) {
  const { url: src, automatic } = useProfilePhoto();
  const [failed, setFailed] = useState<string | null>(null);
  return src && failed !== src ? (
    <img src={src} alt={automatic ? 'Logo de l’entreprise' : 'Photo de profil'} width={size} height={size}
      onError={() => setFailed(src)} className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }} />
  ) : <User size={size} aria-hidden="true" className="shrink-0" />;
}
