import { createPortal } from 'react-dom';
import { X, PlayCircle, Clock } from 'lucide-react';

// Client brief (10-image spec): a visible "Voir la démo — 40 sec" button on
// the first mobile screen, next to "Guide d'utilisation". No actual video
// exists yet to embed - rather than fabricate a placeholder video or link
// to a fake asset, this reads a real URL from VITE_DEMO_VIDEO_URL and shows
// an honest "coming soon" state when it isn't set, so nothing here ever
// claims to show content that doesn't exist. Once the client provides the
// real video (link or file), setting that one env var on Vercel is the only
// change needed - no code change, no redeploy of this component.
const DEMO_VIDEO_URL = import.meta.env.VITE_DEMO_VIDEO_URL as string | undefined;

const toEmbedUrl = (url: string): string => {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url; // direct .mp4 or already-an-embed URL
};

export default function DemoVideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#061D32] border border-[#17334D] rounded-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
          <X size={16} />
        </button>

        {DEMO_VIDEO_URL ? (
          <div className="aspect-video bg-black">
            {DEMO_VIDEO_URL.endsWith('.mp4') ? (
              <video src={DEMO_VIDEO_URL} controls autoPlay className="w-full h-full" />
            ) : (
              <iframe
                src={toEmbedUrl(DEMO_VIDEO_URL)}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Démo Marchés Direct"
              />
            )}
          </div>
        ) : (
          <div className="aspect-video flex flex-col items-center justify-center gap-3 p-6 text-center">
            <PlayCircle size={40} className="text-orange/60" />
            <p className="text-sm font-semibold text-white">Vidéo de démonstration bientôt disponible</p>
            <p className="text-xs text-[#B9BBC8] flex items-center gap-1.5">
              <Clock size={12} /> En attendant, découvrez le fonctionnement dans le guide d'utilisation.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
