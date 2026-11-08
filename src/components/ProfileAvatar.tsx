import { useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalAvatar } from '@/lib/localAvatar';

export function useProfilePhotoUrl() {
  const { user, isAuthenticated, loading } = useAuth();
  const local = useLocalAvatar();
  // Never show a phone-only visitor photo as another account's photo.
  return loading ? null : isAuthenticated ? user?.avatarUrl || null : local;
}

export default function ProfileAvatar({ size = 28 }: { size?: number }) {
  const src = useProfilePhotoUrl();
  const [failed, setFailed] = useState<string | null>(null);
  return src && failed !== src ? (
    <img src={src} alt="Photo de profil" width={size} height={size}
      onError={() => setFailed(src)} className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }} />
  ) : <User size={size} aria-hidden="true" className="shrink-0" />;
}
